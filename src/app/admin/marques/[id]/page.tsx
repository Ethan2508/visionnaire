"use client";

import { useParams } from "next/navigation";
import BrandForm from "@/components/admin/BrandForm";

export default function EditBrandPage() {
  const params = useParams();
  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Modifier la marque</h1>
      <BrandForm brandId={params.id as string} />
    </div>
  );
}
