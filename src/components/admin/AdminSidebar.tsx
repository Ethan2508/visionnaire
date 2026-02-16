"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Glasses,
  Tags,
  Disc3,
  ShoppingCart,
  CalendarDays,
  FileText,
  Settings,
  ArrowLeft,
  Upload,
  Ticket,
  Users,
  Package,
} from "lucide-react";

const navItems = [
  { label: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { label: "Commandes", href: "/admin/commandes", icon: ShoppingCart },
  { label: "Produits", href: "/admin/produits", icon: Glasses },
  { label: "Stock", href: "/admin/stock", icon: Package },
  { label: "Marques", href: "/admin/marques", icon: Tags },
  { label: "Options verres", href: "/admin/verres", icon: Disc3 },
  { label: "Codes promo", href: "/admin/promotions", icon: Ticket },
  { label: "Clients", href: "/admin/clients", icon: Users },
  { label: "Rendez-vous", href: "/admin/rendez-vous", icon: CalendarDays },
  { label: "Blog", href: "/admin/blog", icon: FileText },
  { label: "Contenu du site", href: "/admin/contenu", icon: Settings },
  { label: "Import CSV", href: "/admin/import", icon: Upload },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-stone-900 text-white pt-16">
        <div className="px-4 py-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-stone-400 hover:text-white text-sm transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Retour au site
          </Link>
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4">
            Administration
          </h2>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-stone-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-white border-b border-stone-200 overflow-x-auto">
        <div className="flex px-4 py-2 gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-stone-900 text-white"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                <item.icon size={14} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
