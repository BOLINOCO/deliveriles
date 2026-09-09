import type { Metadata, Viewport } from "next";
import { Baloo_2, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-context";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

// Typo "Titre" de l'identité : très grasse et arrondie (chubby/rounded style)
const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Deliver'îles — Vous voulez le commander ? Chez nous vous pouvez.",
    template: "%s · Deliver'îles",
  },
  description:
    "Deliver'îles, la marketplace locale nouvelle génération. Commandez chez vos commerçants de quartier, préparé par une IA, livré en temps réel.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Deliver'îles",
  },
};

export const viewport: Viewport = {
  themeColor: "#0EA5E9",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${poppins.variable} ${baloo.variable}`}>
      <body className="bg-white font-sans text-brand-navy antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
