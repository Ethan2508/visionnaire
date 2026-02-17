import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResend, EMAIL_FROM } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Vérifier que l'utilisateur est admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single() as { data: { role: string } | null };
    
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // Générer un lien de réinitialisation via Supabase
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.visionnairesopticiens.fr"}/auth/reset-password`,
      },
    });

    if (error) {
      console.error("[PASSWORD RESET] Supabase error:", error);
      // Fallback: use resetPasswordForEmail which sends directly
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.visionnairesopticiens.fr"}/auth/reset-password`,
      });
      
      if (resetError) {
        console.error("[PASSWORD RESET] Reset error:", resetError);
        return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, method: "supabase" });
    }

    // Envoyer l'email personnalisé via Resend si on a le lien
    if (data?.properties?.action_link) {
      const resetLink = data.properties.action_link;
      
      await getResend().emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: "Réinitialisation de votre mot de passe – Visionnaires Opticiens",
        html: passwordResetEmailTemplate(resetLink),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PASSWORD RESET] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

function passwordResetEmailTemplate(resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de mot de passe</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #1c1917; margin: 0; letter-spacing: -0.5px;">
            Visionnaires Opticiens
          </h1>
        </div>

        <!-- Card -->
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="font-size: 20px; font-weight: 600; color: #1c1917; margin: 0 0 16px 0;">
            Réinitialisation de votre mot de passe
          </h2>
          
          <p style="font-size: 15px; color: #57534e; line-height: 1.6; margin: 0 0 24px 0;">
            Vous avez demandé (ou un administrateur a initié pour vous) la réinitialisation de votre mot de passe. 
            Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}" style="display: inline-block; background-color: #1c1917; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
              Réinitialiser mon mot de passe
            </a>
          </div>

          <p style="font-size: 13px; color: #a8a29e; line-height: 1.6; margin: 24px 0 0 0;">
            Ce lien expire dans 24 heures. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;">
          
          <p style="font-size: 12px; color: #a8a29e; margin: 0;">
            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
            <a href="${resetLink}" style="color: #78716c; word-break: break-all;">${resetLink}</a>
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="font-size: 12px; color: #a8a29e; margin: 0;">
            Visionnaires Opticiens<br>
            44 Cours Franklin Roosevelt, 69006 Lyon
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
