import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database";
import { verifyTurnstile } from "@/lib/turnstile";

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }
  const { email, password, redirect, turnstileToken } = body;

  // Vérifier Turnstile
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
  const isHuman = await verifyTurnstile(turnstileToken, ip);
  if (!isHuman) {
    return NextResponse.json({ error: "Vérification de sécurité échouée" }, { status: 403 });
  }

  // S11: Input validation
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "Mot de passe requis (6 caractères minimum)" }, { status: 400 });
  }

  // Collecter les cookies à définir
  const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = [];

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get("cookie") || "";
          return cookieHeader.split(";").map((c) => {
            const [name, ...rest] = c.trim().split("=");
            return { name, value: rest.join("=") };
          }).filter(c => c.name);
        },
        setAll(cookies) {
          cookiesToSet.push(...cookies);
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
  }

  // Créer la réponse et ajouter les cookies
  const response = NextResponse.json({ success: true, redirect: redirect || "/" });
  
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options);
  }

  return response;
}
