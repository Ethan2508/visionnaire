"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ShoppingBag,
  User,
  Search,
  ChevronDown,
  Phone,
} from "lucide-react";
import type { UserRole } from "@/types/database";
import { useCartStore } from "@/lib/store/cart";

const megaMenuData: Record<
  string,
  {
    label: string;
    sections: { title: string; links: { label: string; href: string }[] }[];
    featured: { image: string; title: string; href: string };
  }
> = {
  soleil: {
    label: "Lunettes de soleil",
    sections: [
      {
        title: "Par genre",
        links: [
          { label: "Femme", href: "/catalogue?categorie=soleil&genre=femme" },
          { label: "Homme", href: "/catalogue?categorie=soleil&genre=homme" },
          { label: "Enfant", href: "/catalogue?categorie=soleil&genre=enfant" },
          { label: "Mixte", href: "/catalogue?categorie=soleil&genre=mixte" },
        ],
      },
      {
        title: "Par forme",
        links: [
          { label: "Rondes", href: "/catalogue?categorie=soleil&forme=rond" },
          { label: "Carrées", href: "/catalogue?categorie=soleil&forme=carre" },
          { label: "Aviateur", href: "/catalogue?categorie=soleil&forme=aviateur" },
          { label: "Papillon", href: "/catalogue?categorie=soleil&forme=papillon" },
          { label: "Masque", href: "/catalogue?categorie=soleil&forme=masque" },
        ],
      },
    ],
    featured: {
      image: "/images/hero/collection-femme.webp",
      title: "Collection Solaire",
      href: "/catalogue?categorie=soleil",
    },
  },
  vue: {
    label: "Lunettes de vue",
    sections: [
      {
        title: "Par genre",
        links: [
          { label: "Femme", href: "/catalogue?categorie=vue&genre=femme" },
          { label: "Homme", href: "/catalogue?categorie=vue&genre=homme" },
          { label: "Enfant", href: "/catalogue?categorie=vue&genre=enfant" },
          { label: "Mixte", href: "/catalogue?categorie=vue&genre=mixte" },
        ],
      },
      {
        title: "Par forme",
        links: [
          { label: "Rondes", href: "/catalogue?categorie=vue&forme=rond" },
          { label: "Carrées", href: "/catalogue?categorie=vue&forme=carre" },
          { label: "Rectangulaires", href: "/catalogue?categorie=vue&forme=rectangle" },
          { label: "Papillon", href: "/catalogue?categorie=vue&forme=papillon" },
        ],
      },
    ],
    featured: {
      image: "/images/hero/lunettes-vue-femme.avif",
      title: "Collection Optique",
      href: "/catalogue?categorie=vue",
    },
  },
};

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; role: UserRole } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [activeMega, setActiveMega] = useState<string | null>(null);
  const megaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";

  // Colors depending on page & scroll
  const headerBg = isHome
    ? scrolled
      ? "bg-black/60 backdrop-blur-md"
      : "bg-transparent"
    : scrolled
    ? "bg-white/95 backdrop-blur-md shadow-sm"
    : "bg-white";

  const textColor = isHome ? "text-white" : "text-stone-900";
  const iconColor = isHome
    ? "text-white hover:text-white/70"
    : "text-stone-900 hover:text-stone-600";

  useEffect(() => {
    async function getUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user) {
          setUser({ id: data.user.id, role: data.user.role || "client" });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }
    getUser();
  }, [pathname]);

  // Sync cart count
  useEffect(() => {
    setCartCount(useCartStore.getState().getItemCount());
    const unsub = useCartStore.subscribe((state) =>
      setCartCount(state.items.reduce((sum, i) => sum + i.quantity, 0))
    );
    return unsub;
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSubmenu(null);
    setSearchOpen(false);
    setActiveMega(null);
  }, [pathname]);

  // Scroll listener
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/catalogue?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
      setSearchQuery("");
    }
  }

  function handleMegaEnter(key: string) {
    if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
    setActiveMega(key);
  }

  function handleMegaLeave() {
    megaTimeoutRef.current = setTimeout(() => setActiveMega(null), 200);
  }

  return (
    <>
      {/* Wrapper */}
      <div className={isHome ? "fixed top-0 left-0 right-0 z-50" : ""}>
        {/* Top bar */}
        <div
          className={`${
            isHome
              ? scrolled
                ? "bg-black/40 backdrop-blur-md"
                : "bg-transparent"
              : "bg-stone-900"
          } text-white text-[11px] py-2 hidden md:block transition-all duration-300`}
        >
          <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Phone size={11} />
                +33 4 78 52 62 22
              </span>
              <span className="text-white/30">|</span>
              <span>Livraison offerte dès 150€</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/rendez-vous"
                className="hover:text-white/80 transition-colors"
              >
                Prendre rendez-vous
              </Link>
              <span className="text-white/30">|</span>
              <span>Paiement en 2x 3x 4x avec Alma</span>
            </div>
          </div>
        </div>

        {/* Main header */}
        <header
          className={`z-50 transition-all duration-300 ${
            isHome ? "" : "sticky top-0"
          } ${headerBg}`}
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16 lg:h-20">
              {/* Left: Logo */}
              <Link href="/" className="shrink-0">
                <Image
                  src={isHome ? "/logos/logo-white.png" : "/logos/logo-dark.png"}
                  alt="Visionnaires Opticiens"
                  width={336}
                  height={77}
                  className="h-[35px] sm:h-[42px] lg:h-[50px] w-auto"
                  priority
                />
              </Link>

              {/* Center: Desktop nav */}
              <nav className="hidden lg:flex items-center gap-1">
                {Object.entries(megaMenuData).map(([key, data]) => (
                  <div
                    key={key}
                    className="relative"
                    onMouseEnter={() => handleMegaEnter(key)}
                    onMouseLeave={handleMegaLeave}
                  >
                    <Link
                      href={`/catalogue?categorie=${key}`}
                      className={`flex items-center gap-1 px-4 py-2 text-[13px] font-medium uppercase tracking-wide transition-colors ${textColor} hover:opacity-70`}
                    >
                      {data.label}
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${
                          activeMega === key ? "rotate-180" : ""
                        }`}
                      />
                    </Link>
                  </div>
                ))}

                <Link
                  href="/catalogue?categorie=ski"
                  className={`px-4 py-2 text-[13px] font-medium uppercase tracking-wide transition-colors ${textColor} hover:opacity-70`}
                >
                  Ski
                </Link>
                <Link
                  href="/marques"
                  className={`px-4 py-2 text-[13px] font-medium uppercase tracking-wide transition-colors ${textColor} hover:opacity-70`}
                >
                  Marques
                </Link>
                <Link
                  href="/blog"
                  className={`px-4 py-2 text-[13px] font-medium uppercase tracking-wide transition-colors ${textColor} hover:opacity-70`}
                >
                  Blog
                </Link>
              </nav>

              {/* Right: Actions */}
              <div className="flex items-center gap-0">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className={`p-2 lg:p-2.5 ${iconColor} transition-colors`}
                  aria-label="Rechercher"
                >
                  <Search size={20} className="lg:w-[22px] lg:h-[22px]" />
                </button>

                <Link
                  href={user ? "/compte" : "/auth/login"}
                  className={`p-2 lg:p-2.5 ${iconColor} transition-colors`}
                  aria-label="Mon compte"
                >
                  <User size={20} className="lg:w-[22px] lg:h-[22px]" />
                </Link>

                <Link
                  href="/panier"
                  className={`p-2 lg:p-2.5 ${iconColor} transition-colors relative`}
                  aria-label="Panier"
                >
                  <ShoppingBag size={20} className="lg:w-[22px] lg:h-[22px]" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-stone-900 text-white text-[10px] font-bold w-[18px] h-[18px] flex items-center justify-center rounded-full leading-none">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </Link>

                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className={`hidden lg:inline-flex ml-2 text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 transition-colors ${
                      isHome
                        ? "bg-white text-stone-900 hover:bg-white/90"
                        : "bg-stone-900 text-white hover:bg-stone-800"
                    }`}
                  >
                    Admin
                  </Link>
                )}

                {/* Hamburger — mobile only */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`lg:hidden p-2 ml-0.5 ${iconColor} transition-colors`}
                  aria-label="Menu"
                >
                  <Menu size={22} />
                </button>
              </div>
            </div>
          </div>

          {/* Mega menu dropdown — desktop */}
          {activeMega && megaMenuData[activeMega] && (
            <div
              className="absolute left-0 right-0 bg-white shadow-xl border-t border-stone-100 z-50 hidden lg:block"
              onMouseEnter={() => handleMegaEnter(activeMega)}
              onMouseLeave={handleMegaLeave}
            >
              <div className="max-w-[1400px] mx-auto px-6 py-8">
                <div className="grid grid-cols-4 gap-8">
                  {/* Sections */}
                  {megaMenuData[activeMega].sections.map((section) => (
                    <div key={section.title}>
                      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-3">
                        {section.title}
                      </h3>
                      <div className="space-y-2">
                        {section.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="block text-sm text-stone-700 hover:text-stone-900 hover:pl-1 transition-all"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* "Voir tout" */}
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-3">
                      Explorer
                    </h3>
                    <Link
                      href={megaMenuData[activeMega].featured.href}
                      className="block text-sm font-medium text-stone-900 hover:underline"
                    >
                      Voir toute la collection →
                    </Link>
                  </div>

                  {/* Featured image */}
                  <div className="relative rounded-lg overflow-hidden h-48">
                    <Image
                      src={megaMenuData[activeMega].featured.image}
                      alt={megaMenuData[activeMega].featured.title}
                      fill
                      className="object-cover"
                      sizes="300px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <p className="text-white text-sm font-semibold">
                        {megaMenuData[activeMega].featured.title}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search overlay */}
          {searchOpen && (
            <div className="absolute left-0 right-0 bg-white border-t border-stone-100 shadow-lg z-50">
              <div className="max-w-[1400px] mx-auto px-6 py-8">
                <form
                  onSubmit={handleSearch}
                  className="relative max-w-2xl mx-auto"
                >
                  <Search
                    className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un produit, une marque..."
                    className="w-full px-8 py-3 border-b-2 border-black text-lg focus:outline-none placeholder:text-stone-400 bg-transparent text-stone-900"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400 hover:text-black"
                  >
                    <X size={20} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </header>
      </div>

      {/* Mobile menu — full screen overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Panel */}
          <div className="absolute inset-y-0 left-0 w-full max-w-sm bg-white overflow-y-auto shadow-2xl">
            {/* Mobile header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <Image
                src="/logos/logo-dark.png"
                alt="Visionnaires Opticiens"
                width={150}
                height={34}
                className="h-7 w-auto"
              />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-900"
              >
                <X size={22} />
              </button>
            </div>

            {/* Mobile nav */}
            <nav className="px-6 py-4">
              {Object.entries(megaMenuData).map(([key, data]) => (
                <div key={key} className="border-b border-stone-100">
                  <button
                    onClick={() =>
                      setMobileSubmenu(mobileSubmenu === key ? null : key)
                    }
                    className="flex items-center justify-between w-full py-4 text-sm font-medium uppercase tracking-wider text-stone-800"
                  >
                    {data.label}
                    <ChevronDown
                      size={16}
                      className={`text-stone-400 transition-transform ${
                        mobileSubmenu === key ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {mobileSubmenu === key && (
                    <div className="pb-4 space-y-4">
                      <Link
                        href={`/catalogue?categorie=${key}`}
                        className="block text-sm font-medium text-stone-900"
                      >
                        Voir tout →
                      </Link>
                      {data.sections.map((section) => (
                        <div key={section.title}>
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                            {section.title}
                          </span>
                          <div className="mt-1.5 space-y-1.5">
                            {section.links.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className="block text-sm text-stone-600 hover:text-stone-900 pl-2"
                              >
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <Link
                href="/catalogue?categorie=ski"
                className="block py-4 text-sm font-medium uppercase tracking-wider text-stone-800 border-b border-stone-100"
              >
                Masques de ski
              </Link>
              <Link
                href="/marques"
                className="block py-4 text-sm font-medium uppercase tracking-wider text-stone-800 border-b border-stone-100"
              >
                Nos marques
              </Link>
              <Link
                href="/blog"
                className="block py-4 text-sm font-medium uppercase tracking-wider text-stone-800 border-b border-stone-100"
              >
                Blog
              </Link>
              <Link
                href="/rendez-vous"
                className="block py-4 text-sm font-medium uppercase tracking-wider text-stone-800 border-b border-stone-100"
              >
                Prendre rendez-vous
              </Link>

              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="block py-4 text-sm font-medium uppercase tracking-wider text-stone-800"
                >
                  Administration
                </Link>
              )}
            </nav>

            {/* Mobile footer */}
            <div className="px-6 py-4 border-t border-stone-100 mt-4">
              <a
                href="tel:+33478526222"
                className="flex items-center gap-2 text-sm text-stone-600"
              >
                <Phone size={14} />
                +33 4 78 52 62 22
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
