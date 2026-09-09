import CartSummary from "@/components/acheteur/cart-summary";

export default function PanierPage() {
  return (
    <div className="px-4 pb-6">
      <h1 className="mb-4 mt-2 text-xl font-extrabold text-black">Votre panier</h1>
      <CartSummary />
    </div>
  );
}
