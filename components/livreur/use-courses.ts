"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Course } from "@/lib/livreur-mock";
import { isSupabaseConfigured } from "@/lib/supabase";

type ApiCourse = {
  id: string;
  orderId: string;
  status: string;
  isMine: boolean;
  shopName: string;
  shopColor: string;
  buyerAddress: string;
  distanceKm: number;
  cartSize: string;
  itemsSummary: string;
  driverEarnings: number;
};

type CoursesState = {
  courses: Course[];
  demo: boolean;
  loading: boolean;
  error: string | null;
};

/**
 * Courses du livreur connecté.
 * Branché : GET /api/deliveries (RLS + gains calculés serveur).
 * Démo : PENDING_COURSES du mock, comportement inchangé.
 */
export function useCourses(): CoursesState & {
  accept: (courseId: string) => Promise<string | null>;
  markPickedUp: (courseId: string) => Promise<boolean>;
  markDelivered: (courseId: string) => Promise<boolean>;
  sendHeartbeat: (courseId: string, lat: number, lng: number) => Promise<void>;
} {
  const [state, setState] = useState<CoursesState>({
    courses: [],
    demo: false,
    loading: true,
    error: null,
  });

  const configured = isSupabaseConfigured();

  const refresh = useCallback(async () => {
    if (!configured) {
      const { PENDING_COURSES } = await import("@/lib/livreur-mock");
      setState({ courses: PENDING_COURSES, demo: true, loading: false, error: null });
      return;
    }
    try {
      const res = await fetch("/api/deliveries");
      if (res.status === 503) {
        const { PENDING_COURSES } = await import("@/lib/livreur-mock");
        setState({ courses: PENDING_COURSES, demo: true, loading: false, error: null });
        return;
      }
      if (!res.ok) throw new Error("Impossible de charger les courses.");
      const data = (await res.json()) as { courses: ApiCourse[] };
      setState({
        courses: data.courses.map((c) => ({
          id: c.id,
          shopId: c.orderId, // utile comme clé de routage secondaire
          shopName: c.shopName,
          shopColor: c.shopColor,
          buyerAddress: c.buyerAddress,
          distanceKm: c.distanceKm,
          cartSize: (c.cartSize as Course["cartSize"]) ?? "SMALL",
          itemsSummary: c.itemsSummary,
          driverEarnings: c.driverEarnings,
          deliveryStatus: c.status as Course["deliveryStatus"],
        })),
        demo: false,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Erreur inconnue.",
      }));
    }
  }, [configured]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function postAction(courseId: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/deliveries/${courseId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Action impossible.");
  }

  const accept = useCallback(
    async (courseId: string) => {
      // Démo : l'id (course_1…) existe dans le mock, la page détail sait le
      // résoudre — on redirige directement, sans appel API.
      if (state.demo) return `/courses/${courseId}`;
      try {
        await postAction(courseId, { action: "accept" });
        await refresh();
        return `/courses/${courseId}`;
      } catch (err) {
        setState((s) => ({
          ...s,
          error: err instanceof Error ? err.message : "Action impossible.",
        }));
        return null;
      }
    },
    [state.demo, refresh]
  );

  const markPickedUp = useCallback(
    async (courseId: string) => {
      if (state.demo) return true;
      try {
        await postAction(courseId, { action: "pickup" });
        await refresh();
        return true;
      } catch (err) {
        setState((s) => ({
          ...s,
          error: err instanceof Error ? err.message : "Action impossible.",
        }));
        return false;
      }
    },
    [state.demo, refresh]
  );

  const markDelivered = useCallback(
    async (courseId: string) => {
      if (state.demo) return true;
      try {
        await postAction(courseId, { action: "delivered" });
        await refresh();
        return true;
      } catch (err) {
        setState((s) => ({
          ...s,
          error: err instanceof Error ? err.message : "Action impossible.",
        }));
        return false;
      }
    },
    [state.demo, refresh]
  );

  // GPS : throttle 4s — assez fluide pour l'acheteur, assez léger pour la base.
  const lastBeatRef = useRef(0);
  const sendHeartbeat = useCallback(async (courseId: string, lat: number, lng: number) => {
    if (state.demo) return;
    const now = Date.now();
    if (now - lastBeatRef.current < 4000) return;
    lastBeatRef.current = now;
    try {
      await postAction(courseId, { action: "heartbeat", lat, lng });
    } catch {
      // un heartbeat perdu n'est pas bloquant
    }
  }, [state.demo]);

  return { ...state, accept, markPickedUp, markDelivered, sendHeartbeat };
}
