"use client";

import { useParams } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;

  return (
    <div>
      <Link
        href="/admin/produits"
        className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Retour aux produits
      </Link>

      <h1 className="text-2xl font-bold text-stone-900 mb-6">Modifier le produit</h1>
      
      <ProductForm productId={productId} />
    </div>
  );
}
