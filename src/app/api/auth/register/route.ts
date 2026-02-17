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

  const { email, password, firstName, lastName, turnstileToken } = body;

  // Vérifier Turnstile
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
  const isHuman = await verifyTurnstile(turnstileToken, ip);
  if (!isHuman) {
    return NextResponse.json({ error: "Vérification de sécurité échouée" }, { status: 403 });
  }

  // Validation des inputs
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "Mot de passe requis (6 caractères minimum)" }, { status: 400 });
  }
  if (!firstName || typeof firstName !== "string" || firstName.length > 100) {
    return NextResponse.json({ error: "Prénom invalide" }, { status: 400 });
  }
  if (!lastName || typeof lastName !== "string" || lastName.length > 100) {
    return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
  }

  // Utiliser service role pour créer l'utilisateur (contourne les restrictions Supabase)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false, // Envoyer email de confirmation
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
    },
  });

  if (error) {
    console.error("[REGISTER] Error:", error);
    if (error.message.includes("already")) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet email" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur lors de la création du compte" }, { status: 500 });
  }

  // Envoyer email de confirmation via Supabase
  if (data.user) {
    await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.visionnairesopticiens.fr"}/auth/login`,
      },
    });
  }

  return NextResponse.json({ success: true });
}
