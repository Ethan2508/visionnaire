import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Visionnaire Opticiens — Lunettes de vue, soleil & sport",
    template: "%s | Visionnaire Opticiens",
  },
  description:
    "Votre opticien de confiance. Decouvrez notre collection de lunettes de vue, soleil, ski et sport des plus grandes marques. Paiement en plusieurs fois avec Alma.",
  keywords: [
    "opticien",
    "lunettes de vue",
    "lunettes de soleil",
    "masques de ski",
    "optique",
    "verres correcteurs",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body className={`${geistSans.variable} antialiased`}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
