import type { Metadata } from "next";
import Script from "next/script";
import { Geist } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
    "Votre opticien de confiance à Lyon. Découvrez notre collection de lunettes de vue, soleil, ski et sport des plus grandes marques. Paiement en plusieurs fois avec Alma.",
  keywords: [
    "opticien",
    "lunettes de vue",
    "lunettes de soleil",
    "masques de ski",
    "optique",
    "Lyon",
    "opticien Lyon",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://visionnaireopticiens.vercel.app"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Visionnaire Opticiens",
    title: "Visionnaire Opticiens — Lunettes de vue, soleil & sport",
    description:
      "Votre opticien de confiance à Lyon. Découvrez notre collection de lunettes de vue, soleil, ski et sport des plus grandes marques.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Visionnaire Opticiens",
    description:
      "Découvrez notre collection de lunettes de vue, soleil, ski et sport des plus grandes marques de luxe.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9BYLJM1F4R"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9BYLJM1F4R');
          `}
        </Script>
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <SpeedInsights />
      </body>
    </html>
  );
}
