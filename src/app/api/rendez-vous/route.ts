import { NextResponse } from "next/server";
import { getResend, EMAIL_FROM } from "@/lib/resend";
import { rdvConfirmationEmail, rdvNotificationEmail } from "@/lib/emails";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/turnstile";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, reason, preferredDate, message, turnstileToken } = body;

    // Vérifier Turnstile
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    const isHuman = await verifyTurnstile(turnstileToken, ip);
    if (!isHuman) {
      return NextResponse.json({ error: "Vérification de sécurité échouée" }, { status: 403 });
    }

    // Validation basique
    if (!firstName || !lastName || !email || !phone || !reason) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    // Sauvegarder en base de données
    const supabase = await createClient();
    const { error: dbError } = await supabase.from("appointment_requests").insert({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      reason,
      preferred_date: preferredDate || null,
      message: message || null,
      status: "pending",
    } as never);

    if (dbError) {
      console.error("[RDV] Database error:", dbError);
      // Continue anyway to send emails
    }

    const rdvData = { firstName, lastName, email, phone, reason, preferredDate, message };

    // Envoyer la confirmation au client
    const clientEmail = rdvConfirmationEmail(rdvData);
    const shopEmail = rdvNotificationEmail(rdvData);

    await Promise.allSettled([
      getResend().emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: clientEmail.subject,
        html: clientEmail.html,
      }),
      getResend().emails.send({
        from: EMAIL_FROM,
        to: ["contact@visionnairesopticiens.fr", "visionnaires@orange.fr"],
        subject: shopEmail.subject,
        html: shopEmail.html,
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RDV] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
