import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === "true";
const MAINTENANCE_BYPASS_SECRET = process.env.MAINTENANCE_BYPASS_SECRET;
const PRODUCTION_DOMAIN = "www.visionnairesopticiens.fr";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // Rediriger vercel.app vers le domaine principal
  if (host.includes("vercel.app") || host === "visionnairesopticiens.fr") {
    const url = new URL(pathname, `https://${PRODUCTION_DOMAIN}`);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url, 301);
  }

  // Mode maintenance : rediriger tout le monde sauf les pages autorisées
  if (MAINTENANCE_MODE) {
    // Pages autorisées pendant la maintenance
    const allowedPaths = ["/maintenance", "/admin", "/auth", "/api"];
    const isAllowed = allowedPaths.some((p) => pathname.startsWith(p));

    // Vérifier si l'utilisateur a le cookie de bypass
    const bypassCookie = request.cookies.get("maintenance_bypass")?.value;
    const hasBypass = bypassCookie === MAINTENANCE_BYPASS_SECRET;

    if (!isAllowed && !hasBypass) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
  }

  // Ne pas appliquer updateSession sur /maintenance
  if (pathname === "/maintenance") {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
