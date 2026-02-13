import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">
        Ajouter un produit
      </h1>
      <ProductForm />
    </div>
  );
}
