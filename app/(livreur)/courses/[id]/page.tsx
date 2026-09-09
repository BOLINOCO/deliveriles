import { notFound } from "next/navigation";

import { getCourseById, getCourseShop, getCourseEarnings, type Course } from "@/lib/livreur-mock";
import { getSupabaseServerClient } from "@/lib/supabase";
import LiveMap from "@/components/acheteur/live-map";
import MarkAsDeliveredButton from "@/components/livreur/mark-delivered-button";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CourseDetail = {
  course: Course;
  shopName: string | undefined;
  shopColor: string | undefined;
  driverEarnings: number;
  platformCommission: number;
};

async function fetchRealCourse(id: string): Promise<CourseDetail | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // `shops` se joint via orders (FK orders.shop_id → shops), pas depuis deliveries.
  const { data: delivery } = await supabase
    .from("deliveries")
    .select(
      "status, courier_id, driver_earnings, platform_commission, orders ( delivery_address, distance_km, cart_size, order_items ( product_name, quantity ), shops ( name, color ) )"
    )
    .eq("id", id)
    .maybeSingle();

  if (!delivery) return null;

  const order = delivery.orders as {
    delivery_address: string;
    distance_km: number;
    cart_size: string;
    order_items: { product_name: string; quantity: number }[] | null;
    shops: { name: string; color: string } | null;
  } | null;
  const shop = order?.shops ?? null;

  return {
    course: {
      id,
      shopId: shop?.name ?? "shop",
      buyerAddress: order?.delivery_address ?? "",
      distanceKm: Number(order?.distance_km ?? 0),
      cartSize: (order?.cart_size as Course["cartSize"]) ?? "SMALL",
      itemsSummary:
        order?.order_items?.map((i) => `${i.quantity} ${i.product_name}`).join(", ") ?? "",
      deliveryStatus: delivery.status,
    },
    shopName: shop?.name,
    shopColor: shop?.color,
    driverEarnings: Number(delivery.driver_earnings ?? 0),
    platformCommission: Number(delivery.platform_commission ?? 0),
  };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let detail: CourseDetail | null = null;

  if (UUID_RE.test(id)) {
    detail = await fetchRealCourse(id);
  } else if (id.startsWith("course_") || id.startsWith("demo_")) {
    const course = getCourseById(id);
    if (course) {
      const shop = getCourseShop(course);
      const earnings = getCourseEarnings(course);
      detail = {
        course,
        shopName: shop?.name,
        shopColor: shop?.color,
        driverEarnings: earnings.driverEarnings,
        platformCommission: earnings.platformCommission,
      };
    }
  }

  if (!detail) notFound();

  const { course, shopName, shopColor, driverEarnings, platformCommission } = detail;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-extrabold text-black">Course en cours</h1>
        <p className="mt-1 text-sm text-neutral-400">
          {shopName ?? "Boutique"} → {course.buyerAddress}
        </p>
      </div>

      <LiveMap />

      <div className="rounded-2xl border border-neutral-200 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">Vos gains pour cette course</span>
          <span className="text-lg font-extrabold text-brand-orange">
            {driverEarnings.toFixed(2)} €
          </span>
        </div>
        <p className="mt-1 text-xs text-neutral-400">
          Commission plateforme : {platformCommission.toFixed(2)} € (20% des frais de livraison)
        </p>
      </div>

      <MarkAsDeliveredButton courseId={course.id} />
    </div>
  );
}
