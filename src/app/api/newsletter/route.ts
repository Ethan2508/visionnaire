import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getResend, EMAIL_FROM } from "@/lib/resend";
import { newsletterWelcomeEmail } from "@/lib/emails";
import { verifyTurnstile } from "@/lib/turnstile";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, turnstileToken } = body;

    // Vérifier Turnstile
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    const isHuman = await verifyTurnstile(turnstileToken, ip);
    if (!isHuman) {
      return NextResponse.json({ error: "Vérification de sécurité échouée" }, { status: 403 });
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Upsert to avoid duplicate errors
    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert({ email: email.toLowerCase().trim() } as Record<string, unknown>, { onConflict: "email" });

    if (error) {
      console.error("Newsletter subscription error:", error);
      // Return success even if table doesn't exist to avoid exposing internals
      return NextResponse.json({ success: true });
    }

    // Envoyer l'email de bienvenue newsletter (non-bloquant)
    try {
      const emailData = newsletterWelcomeEmail();
      await getResend().emails.send({
        from: EMAIL_FROM,
        to: email.toLowerCase().trim(),
        subject: emailData.subject,
        html: emailData.html,
      });
    } catch (emailError) {
      console.error("Newsletter welcome email error:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
