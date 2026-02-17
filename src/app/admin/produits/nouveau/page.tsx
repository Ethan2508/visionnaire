"use client";

import ProductForm from "@/components/admin/ProductForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewProductPage() {
  return (
    <div>
      <Link
        href="/admin/produits"
        className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Retour aux produits
      </Link>

      <h1 className="text-2xl font-bold text-stone-900 mb-6">Nouveau produit</h1>
      
      <ProductForm />
    </div>
  );
}
