import OrderHistory from "@/components/acheteur/order-history";

export default function CommandesPage() {
  return (
    <div className="px-4 pb-6">
      <h1 className="mb-4 mt-2 text-xl font-extrabold text-black">Vos commandes</h1>
      <OrderHistory />
    </div>
  );
}
