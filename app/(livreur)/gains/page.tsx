import KpiCard from "@/components/vendeur/kpi-card";
import StatsBars from "@/components/vendeur/stats-bars";
import PremiumBanner from "@/components/livreur/premium-banner";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// Démo : gains simulés quand Supabase n'est pas configuré ou non connecté.
const EARNINGS_BY_DAY = [
  { label: "Lun", value: 34 },
  { label: "Mar", value: 41 },
  { label: "Mer", value: 28 },
  { label: "Jeu", value: 52 },
  { label: "Ven", value: 61 },
  { label: "Sam", value: 74 },
  { label: "Dim", value: 22 },
];

export default async function GainsPage() {
  let weekEarnings: number | null = null;
  let weekCourses = 0;
  let dailyData = EARNINGS_BY_DAY;

  // Gains réels : livraisons effectuées par le livreur connecté sur 7 jours
  // (RLS : il ne voit que ses propres courses).
  if (isSupabaseConfigured()) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
        const { data: rows } = await supabase
          .from("deliveries")
          .select("driver_earnings, delivered_at")
          .eq("courier_id", user.id)
          .eq("status", "delivered")
          .gte("delivered_at", since);

        if (rows) {
          weekEarnings = rows.reduce((sum, r) => sum + Number(r.driver_earnings ?? 0), 0);
          weekCourses = rows.length;

          const perDay = new Map<string, number>();
          for (const r of rows) {
            const d = new Date(r.delivered_at ?? "");
            if (Number.isNaN(d.getTime())) continue;
            const label = DAY_LABELS[d.getDay()];
            perDay.set(label, (perDay.get(label) ?? 0) + Number(r.driver_earnings ?? 0));
          }
          // Ordre chronologique fin → début de semaine glissante.
          const today = new Date().getDay();
          const order = Array.from({ length: 7 }, (_, i) => DAY_LABELS[(today + 1 + i) % 7]);
          dailyData = order.map((label) => ({
            label,
            value: Math.round((perDay.get(label) ?? 0) * 100) / 100,
          }));
        }
      }
    }
  }

  const isDemo = weekEarnings === null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-extrabold text-black">Vos gains</h1>
        <p className="mt-1 text-sm text-neutral-400">
          {isDemo ? "Mode démo — données simulées. 7 derniers jours." : "7 derniers jours."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard
          label="Gains cette semaine"
          value={
            isDemo
              ? "312,00 €"
              : `${weekEarnings!.toFixed(2).replace(".", ",")} €`
          }
          hint={isDemo ? "46 courses" : `${weekCourses} course${weekCourses > 1 ? "s" : ""}`}
        />
        <KpiCard label="Note moyenne" value="4.9 / 5" />
        <KpiCard label="Taux d'acceptation" value="92%" />
      </div>

      <div className="rounded-2xl border border-neutral-200 p-5">
        <p className="text-sm font-extrabold text-black">Gains par jour</p>
        <StatsBars data={dailyData} />
      </div>

      <PremiumBanner />
    </div>
  );
}
