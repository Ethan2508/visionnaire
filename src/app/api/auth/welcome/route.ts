import { NextResponse } from "next/server";
import { getResend, EMAIL_FROM } from "@/lib/resend";
import { welcomeEmail } from "@/lib/emails";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName } = body;

    if (!email || !firstName) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const emailData = welcomeEmail(firstName);

    await getResend().emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: emailData.subject,
      html: emailData.html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WELCOME] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
