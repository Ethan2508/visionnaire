import Link from "next/link";
import { Glasses, Tags, ShoppingCart, CalendarDays } from "lucide-react";

const quickLinks = [
  {
    label: "Ajouter un produit",
    href: "/admin/produits/nouveau",
    icon: Glasses,
    color: "bg-blue-50 text-blue-700",
  },
  {
    label: "Ajouter une marque",
    href: "/admin/marques/nouveau",
    icon: Tags,
    color: "bg-purple-50 text-purple-700",
  },
  {
    label: "Voir les commandes",
    href: "/admin/commandes",
    icon: ShoppingCart,
    color: "bg-green-50 text-green-700",
  },
  {
    label: "Rendez-vous",
    href: "/admin/rendez-vous",
    icon: CalendarDays,
    color: "bg-amber-50 text-amber-700",
  },
];

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">
        Tableau de bord
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-md hover:border-stone-300 transition-all group"
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${link.color} mb-3`}
            >
              <link.icon size={20} />
            </div>
            <span className="text-sm font-semibold text-stone-900 group-hover:text-stone-700">
              {link.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
