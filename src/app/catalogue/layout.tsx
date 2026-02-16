import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catalogue",
  description:
    "Parcourez notre catalogue de lunettes de vue, soleil, masques de ski et sport. Filtrez par marque, catégorie et genre. Livraison offerte dès 150€.",
  openGraph: {
    title: "Catalogue | Visionnaire Opticiens",
    description:
      "Parcourez notre catalogue de lunettes de vue, soleil, masques de ski et sport des plus grandes marques de luxe.",
    type: "website",
  },
};

export default function CatalogueLayout({ children }: { children: React.ReactNode }) {
  return children;
}
