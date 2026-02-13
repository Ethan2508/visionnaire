import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      {/* Main footer */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Logo + description */}
          <div className="lg:col-span-2">
            <Image
              src="/logos/logo-white.png"
              alt="Visionnaires Opticiens"
              width={200}
              height={45}
              className="h-9 w-auto mb-5"
            />
            <p className="text-sm text-white/50 leading-relaxed max-w-sm">
              Votre opticien de confiance. Decouvrez notre selection de lunettes de vue,
              soleil et sport des plus grandes marques. Expertise et conseils personnalises.
            </p>
          </div>

          {/* Catalogue */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-5">
              Catalogue
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/catalogue?categorie=vue" className="text-sm text-white/60 hover:text-white transition-colors">
                  Lunettes de vue
                </Link>
              </li>
              <li>
                <Link href="/catalogue?categorie=soleil" className="text-sm text-white/60 hover:text-white transition-colors">
                  Lunettes de soleil
                </Link>
              </li>
              <li>
                <Link href="/catalogue?categorie=ski" className="text-sm text-white/60 hover:text-white transition-colors">
                  Masques de ski
                </Link>
              </li>
              <li>
                <Link href="/catalogue?categorie=sport" className="text-sm text-white/60 hover:text-white transition-colors">
                  Sport
                </Link>
              </li>
              <li>
                <Link href="/marques" className="text-sm text-white/60 hover:text-white transition-colors">
                  Nos marques
                </Link>
              </li>
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-5">
              Informations
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/rendez-vous" className="text-sm text-white/60 hover:text-white transition-colors">
                  Prendre rendez-vous
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-white/60 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/cgv" className="text-sm text-white/60 hover:text-white transition-colors">
                  CGV
                </Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="text-sm text-white/60 hover:text-white transition-colors">
                  Mentions legales
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="text-sm text-white/60 hover:text-white transition-colors">
                  Confidentialite
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-5">
              Boutique
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={15} className="mt-0.5 shrink-0 text-white/40" />
                <span className="text-sm text-white/60">44 Cr Franklin Roosevelt, 69006 Lyon</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={15} className="shrink-0 text-white/40" />
                <span className="text-sm text-white/60">+33 4 78 52 62 22</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={15} className="shrink-0 text-white/40" />
                <span className="text-sm text-white/60">contact@visionnaires.fr</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={15} className="mt-0.5 shrink-0 text-white/40" />
                <div className="text-sm text-white/60">
                  <p>Lun : 14h00 - 19h00</p>
                  <p>Mar - Sam : 10h00 - 19h00</p>
                  <p>Dimanche : Fermé</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-white/30">
            &copy; {new Date().getFullYear()} Visionnaires Opticiens. Tous droits reserves.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[11px] text-white/30">Paiement securise</span>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium text-white/50 border border-white/20 px-2.5 py-1 rounded">
                Visa
              </span>
              <span className="text-[11px] font-medium text-white/50 border border-white/20 px-2.5 py-1 rounded">
                Mastercard
              </span>
              <span className="text-[11px] font-medium text-white/50 border border-white/20 px-2.5 py-1 rounded">
                Alma
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
