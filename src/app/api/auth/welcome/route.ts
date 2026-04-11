import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResend, EMAIL_FROM } from "@/lib/resend";
import { welcomeEmail } from "@/lib/emails";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { email, firstName } = body;

    if (!email || !firstName) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // Vérifier que l'email appartient bien à l'utilisateur authentifié
    if (email !== user.email) {
      return NextResponse.json({ error: "Email non autorisé" }, { status: 403 });
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
