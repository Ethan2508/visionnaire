import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResend, EMAIL_FROM } from "@/lib/resend";

// GET: Récupérer une demande de retour spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que c'est un admin
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const profile = profileData as { role: string } | null;
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { data: returnRequest, error } = await supabase
      .from("return_requests")
      .select(`
        *,
        orders(id, order_number, total, order_items(*)),
        profiles(first_name, last_name, email, phone)
      `)
      .eq("id", id)
      .single();

    if (error || !returnRequest) {
      return NextResponse.json({ error: "Demande de retour introuvable" }, { status: 404 });
    }

    return NextResponse.json({ returnRequest });
  } catch (error) {
    console.error("[ADMIN RETURN] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH: Mettre à jour le statut d'une demande de retour
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que c'est un admin
    const { data: profileData2 } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const profile2 = profileData2 as { role: string } | null;
    if (!profile2 || profile2.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { status, adminComment, refundAmount } = body;

    // Valider le statut
    const validStatuses = ["accepte", "refuse", "recu", "rembourse"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    // Récupérer la demande actuelle avec les infos du client
    const { data: currentReturn, error: fetchError } = await supabase
      .from("return_requests")
      .select(`
        *,
        orders(order_number),
        profiles(email, first_name)
      `)
      .eq("id", id)
      .single();

    if (fetchError || !currentReturn) {
      return NextResponse.json({ error: "Demande de retour introuvable" }, { status: 404 });
    }

    // Mettre à jour la demande
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (adminComment !== undefined) {
      updateData.admin_comment = adminComment;
    }

    if (refundAmount !== undefined && status === "rembourse") {
      updateData.refund_amount = refundAmount;
    }

    const { error: updateError } = await supabase
      .from("return_requests")
      .update(updateData as never)
      .eq("id", id);

    if (updateError) {
      console.error("[ADMIN RETURN] Error updating return:", updateError);
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
    }

    // Envoyer un email au client
    const returnData = currentReturn as { 
      orders: { order_number: string }; 
      profiles: { email: string; first_name: string | null };
    };
    
    const emailSubject = getEmailSubject(status, returnData.orders.order_number);
    const emailContent = getEmailContent(status, returnData.profiles.first_name, returnData.orders.order_number, adminComment, refundAmount);

    try {
      await getResend().emails.send({
        from: EMAIL_FROM,
        to: returnData.profiles.email,
        subject: emailSubject,
        html: emailContent,
      });
    } catch (emailError) {
      console.error("[ADMIN RETURN] Error sending email:", emailError);
      // On ne bloque pas si l'email échoue
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN RETURN] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

function getEmailSubject(status: string, orderNumber: string): string {
  switch (status) {
    case "accepte":
      return `Votre demande de retour a été acceptée - ${orderNumber}`;
    case "refuse":
      return `Votre demande de retour a été refusée - ${orderNumber}`;
    case "recu":
      return `Nous avons reçu votre retour - ${orderNumber}`;
    case "rembourse":
      return `Votre remboursement a été effectué - ${orderNumber}`;
    default:
      return `Mise à jour de votre demande de retour - ${orderNumber}`;
  }
}

function getEmailContent(
  status: string,
  firstName: string | null,
  orderNumber: string,
  adminComment?: string,
  refundAmount?: number
): string {
  const name = firstName || "Client";
  
  let message = "";
  switch (status) {
    case "accepte":
      message = `
        <p>Votre demande de retour pour la commande <strong>${orderNumber}</strong> a été acceptée.</p>
        <p>Veuillez nous retourner les articles à l'adresse suivante :</p>
        <p style="background:#f5f5f4;padding:16px;border-radius:8px;">
          Visionnaire Opticiens<br/>
          44 Cours Franklin Roosevelt<br/>
          69006 Lyon
        </p>
        <p>Merci d'inclure une copie de votre facture dans le colis.</p>
      `;
      break;
    case "refuse":
      message = `
        <p>Nous sommes désolés, mais votre demande de retour pour la commande <strong>${orderNumber}</strong> a été refusée.</p>
        ${adminComment ? `<p><strong>Motif :</strong> ${adminComment}</p>` : ""}
        <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
      `;
      break;
    case "recu":
      message = `
        <p>Nous avons bien reçu votre retour pour la commande <strong>${orderNumber}</strong>.</p>
        <p>Nous allons procéder à l'examen des articles et vous tiendrons informé(e) du remboursement sous 48h.</p>
      `;
      break;
    case "rembourse":
      message = `
        <p>Le remboursement pour votre commande <strong>${orderNumber}</strong> a été effectué.</p>
        ${refundAmount ? `<p><strong>Montant remboursé :</strong> ${refundAmount.toFixed(2)} €</p>` : ""}
        <p>Le montant sera crédité sur votre compte sous 5-10 jours ouvrés selon votre banque.</p>
      `;
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="font-family:system-ui,sans-serif;color:#1c1917;max-width:600px;margin:0 auto;padding:20px;">
      <div style="text-align:center;margin-bottom:24px;">
        <img src="https://www.visionnairesopticiens.fr/logos/logo-black.png" alt="Visionnaire Opticiens" style="height:40px;">
      </div>
      <h2 style="color:#1c1917;margin-bottom:16px;">Bonjour ${name},</h2>
      ${message}
      <p style="margin-top:24px;color:#78716c;font-size:14px;">
        Cordialement,<br/>
        L'équipe Visionnaire Opticiens
      </p>
      <hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0;">
      <p style="font-size:12px;color:#a8a29e;text-align:center;">
        Visionnaire Opticiens — 44 Cours Franklin Roosevelt, 69006 Lyon<br/>
        <a href="tel:+33478526222" style="color:#a8a29e;">04 78 52 62 22</a>
      </p>
    </body>
    </html>
  `;
}
