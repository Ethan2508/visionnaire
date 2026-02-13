"use client";

import { useParams } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">
        Modifier le produit
      </h1>
      <ProductForm productId={productId} />
    </div>
  );
}
