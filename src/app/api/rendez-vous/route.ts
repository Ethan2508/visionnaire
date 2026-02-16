import { NextResponse } from "next/server";
import { getResend, EMAIL_FROM } from "@/lib/resend";
import { rdvConfirmationEmail, rdvNotificationEmail } from "@/lib/emails";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, reason, preferredDate, message } = body;

    // Validation basique
    if (!firstName || !lastName || !email || !phone || !reason) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
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
        to: "contact@visionnairesopticiens.fr",
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
