import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { getResend, EMAIL_FROM } from "@/lib/resend";
import { orderShippedEmail, orderReadyEmail } from "@/lib/emails";

export async function POST(request: Request) {
  try {
    // Vérifier que l'utilisateur est admin
    const supabaseAuth = createServerClient(
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
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier le rôle admin via service role
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, status, trackingNumber } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // Seuls ces statuts déclenchent un email
    if (!["expediee", "prete_en_boutique"].includes(status)) {
      return NextResponse.json({ success: true, emailSent: false });
    }

    // Utiliser service role pour accéder aux données de la commande
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: order, error } = await supabase
      .from("orders")
      .select("order_number, profiles(first_name, email)")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      console.error("[NOTIFY] Order not found:", error);
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = order as any;
    const customerEmail = o.profiles?.email;
    const firstName = o.profiles?.first_name || "Client";
    const orderNumber = o.order_number;

    if (!customerEmail) {
      return NextResponse.json({ success: true, emailSent: false });
    }

    let emailData;

    if (status === "expediee") {
      emailData = orderShippedEmail({ orderNumber, firstName, trackingNumber });
    } else {
      emailData = orderReadyEmail({ orderNumber, firstName });
    }

    await getResend().emails.send({
      from: EMAIL_FROM,
      to: customerEmail,
      subject: emailData.subject,
      html: emailData.html,
    });

    return NextResponse.json({ success: true, emailSent: true });
  } catch (error) {
    console.error("[NOTIFY] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
