import type { Metadata } from "next";
import LandingPage from "@/components/marketing/landing-page";

export const metadata: Metadata = {
  title: "Deliver'îles — Vous voulez le commander ? Chez nous vous pouvez.",
  description:
    "Deliver'îles, la marketplace locale nouvelle génération. Commandez chez vos commerçants de quartier, préparé par une IA, livré en temps réel.",
};

export default function Page() {
  return <LandingPage />;
}
