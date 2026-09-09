"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { UserAccount, UserRoles } from "@/lib/types";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Deux modes :
 *  - Supabase configuré → vraie auth (cookies @supabase/ssr + table profiles).
 *    Les rôles is_seller / is_courier vivent dans `profiles`, la boutique du
 *    vendeur est créée dans `shops` à l'inscription.
 *  - Sinon → démo localStorage (comportement d'origine, inchangé).
 */

const CURRENT_KEY = "deliveriles_account";
const ALL_ACCOUNTS_KEY = "deliveriles_accounts";

type SignUpInput = {
  name: string;
  email: string;
  password: string;
  roles: UserRoles;
  shopName?: string;
  shopCategory?: string;
};

type SignInInput = { email: string; password: string };

type AuthContextValue = {
  account: UserAccount | null;
  isLoaded: boolean;
  signUp: (input: SignUpInput) => Promise<UserAccount | null>;
  signIn: (input: SignInInput) => Promise<UserAccount | null>;
  signOut: () => Promise<void>;
  activateRole: (
    role: "isSeller" | "isCourier",
    extra?: { shopName?: string; shopCategory?: string }
  ) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base.length > 0 ? base : "boutique";
}

function friendlyAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "Email ou mot de passe incorrect.";
  }
  if (message.includes("User already registered")) {
    return "Un compte existe déjà avec cet email.";
  }
  if (message.includes("Email not confirmed")) {
    return "Confirmez votre email avant de vous connecter.";
  }
  if (message.toLowerCase().includes("password")) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }
  return message;
}

// ---------------- Démo (localStorage) ----------------

function readAllAccounts(): UserAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ALL_ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as UserAccount[]) : [];
  } catch {
    return [];
  }
}

function writeAllAccounts(accounts: UserAccount[]) {
  window.localStorage.setItem(ALL_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const configured = isSupabaseConfigured();

  // Restauration de session au montage.
  useEffect(() => {
    if (!configured) {
      try {
        const raw = window.localStorage.getItem(CURRENT_KEY);
        if (raw) setAccount(JSON.parse(raw) as UserAccount);
      } catch {
        // localStorage indisponible (navigation privée, etc.)
      } finally {
        setIsLoaded(true);
      }
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoaded(true);
      return;
    }

    let cancelled = false;

    async function hydrateFromUser(userId: string, email: string | undefined) {
      const { data: profile } = await supabase!
        .from("profiles")
        .select("full_name, is_seller, is_courier")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) return;
      setAccount({
        id: userId,
        name: profile?.full_name ?? email ?? "Utilisateur",
        email: email ?? "",
        roles: {
          isSeller: profile?.is_seller ?? false,
          isCourier: profile?.is_courier ?? false,
        },
      });
    }

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (user) await hydrateFromUser(user.id, user.email);
      setIsLoaded(true);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setAccount(null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

  function persistDemo(next: UserAccount | null) {
    setAccount(next);
    try {
      if (next) window.localStorage.setItem(CURRENT_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(CURRENT_KEY);
    } catch {
      // ignore
    }
  }

  function upsertAccount(updated: UserAccount) {
    const accounts = readAllAccounts().filter((a) => a.email !== updated.email);
    writeAllAccounts([...accounts, updated]);
  }

  async function signUp(input: SignUpInput): Promise<UserAccount | null> {
    if (!configured) {
      const newAccount: UserAccount = {
        id: `user_${Date.now()}`,
        name: input.name,
        email: input.email,
        roles: input.roles,
        shopName: input.shopName,
        shopCategory: input.shopCategory,
      };
      upsertAccount(newAccount);
      persistDemo(newAccount);
      return newAccount;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return null;

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: input.name } },
    });
    if (error) throw new Error(friendlyAuthError(error.message));

    // Supabase peut exiger la confirmation de l'email : pas de session tant
    // que l'utilisateur n'a pas cliqué sur le lien.
    if (!data.session || !data.user) {
      return null;
    }

    const user = data.user;

    // Profil + boutique : upserts idempotents (le trigger 0001 peut déjà
    // avoir créé le profil).
    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: input.name,
      is_seller: input.roles.isSeller,
      is_courier: input.roles.isCourier,
    });

    if (input.roles.isSeller && input.shopName) {
      await supabase.from("shops").insert({
        owner_id: user.id,
        slug: `${slugify(input.shopName)}-${user.id.slice(0, 4)}`,
        name: input.shopName,
        category: input.shopCategory?.trim() || "Autre",
      });
    }

    const account: UserAccount = {
      id: user.id,
      name: input.name,
      email: input.email,
      roles: input.roles,
      shopName: input.shopName,
      shopCategory: input.shopCategory,
    };
    setAccount(account);
    return account;
  }

  async function signIn({ email, password }: SignInInput): Promise<UserAccount | null> {
    if (!configured) {
      const found =
        readAllAccounts().find(
          (a) => a.email.toLowerCase() === email.toLowerCase()
        ) ?? null;
      if (found) persistDemo(found);
      return found;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return null;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(friendlyAuthError(error.message));

    const user = data.user;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, is_seller, is_courier")
      .eq("id", user.id)
      .maybeSingle();

    const account: UserAccount = {
      id: user.id,
      name: profile?.full_name ?? user.email ?? email,
      email: user.email ?? email,
      roles: {
        isSeller: profile?.is_seller ?? false,
        isCourier: profile?.is_courier ?? false,
      },
    };
    setAccount(account);
    return account;
  }

  async function signOut() {
    if (configured) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) await supabase.auth.signOut();
      setAccount(null);
      return;
    }
    persistDemo(null);
  }

  function activateRole(
    role: "isSeller" | "isCourier",
    extra?: { shopName?: string; shopCategory?: string }
  ) {
    if (!account) return;
    const updated: UserAccount = {
      ...account,
      roles: { ...account.roles, [role]: true },
      shopName: extra?.shopName ?? account.shopName,
      shopCategory: extra?.shopCategory ?? account.shopCategory,
    };

    if (!configured) {
      upsertAccount(updated);
      persistDemo(updated);
      return;
    }

    // Optimiste : l'état local bascule tout de suite, la base suit.
    setAccount(updated);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    void supabase
      .from("profiles")
      .update(role === "isSeller" ? { is_seller: true } : { is_courier: true })
      .eq("id", account.id);

    if (role === "isSeller" && extra?.shopName) {
      void supabase.from("shops").insert({
        owner_id: account.id,
        slug: `${slugify(extra.shopName)}-${account.id.slice(0, 4)}`,
        name: extra.shopName,
        category: extra.shopCategory?.trim() || "Autre",
      });
    }
  }

  return (
    <AuthContext.Provider
      value={{ account, isLoaded, signUp, signIn, signOut, activateRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur d'un <AuthProvider>.");
  return ctx;
}
