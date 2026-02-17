import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyTurnstile } from "@/lib/turnstile";

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { email, turnstileToken } = body;

  // Vérifier Turnstile
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
  const isHuman = await verifyTurnstile(turnstileToken, ip);
  if (!isHuman) {
    return NextResponse.json({ error: "Vérification de sécurité échouée" }, { status: 403 });
  }

  // Validation email
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Générer le lien de reset
  const { error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.visionnairesopticiens.fr"}/auth/reset-password`,
    },
  });

  // Ne pas révéler si l'email existe ou non (sécurité)
  if (error) {
    console.error("[FORGOT-PASSWORD] Error:", error);
  }

  // Toujours retourner success pour éviter l'énumération d'emails
  return NextResponse.json({ success: true });
}
