import type { NextConfig } from "next";

// Content-Security-Policy — strict but compatible with Next.js, GA, Supabase, Alma, Vercel
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com https://vercel.live;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://odirisqsqpdvitisvdzn.supabase.co https://www.google-analytics.com https://www.googletagmanager.com;
  font-src 'self' data:;
  connect-src 'self' https://odirisqsqpdvitisvdzn.supabase.co wss://odirisqsqpdvitisvdzn.supabase.co https://www.google-analytics.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://api.sandbox.almapay.com https://api.almapay.com https://api-adresse.data.gouv.fr https://vercel.live;
  frame-src 'self' https://checkout.almapay.com https://vercel.live;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'self';
  upgrade-insecure-requests;
`.replace(/\n/g, " ").trim();

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    // Override le CORS wildcard par défaut de Vercel
    key: "Access-Control-Allow-Origin",
    value: "https://www.visionnairesopticiens.fr",
  },
];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "odirisqsqpdvitisvdzn.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Appliquer les headers de sécurité à toutes les routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
