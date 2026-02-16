import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const SHOP_INFO = {
  name: "Visionnaires Opticiens",
  address: "44 Cours Franklin Roosevelt",
  city: "69006 Lyon",
  country: "France",
  phone: "+33 4 78 52 62 22",
  email: "contact@visionnaires.fr",
  siret: "", // À compléter avec le vrai SIRET
  tvaIntra: "", // À compléter avec le vrai numéro TVA
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer la commande avec les items et le profil
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        profiles(first_name, last_name, email, phone),
        order_items(id, product_name, variant_info, quantity, unit_price)
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // Vérifier que l'utilisateur peut voir cette facture (propriétaire ou admin)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = order as any;
    const isAdmin = user.email === "contact@visionnairesopticiens.fr" || user.email === "visionnaires@orange.fr";
    if (o.profile_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Générer le PDF
    const pdfBytes = await generateInvoicePDF(o);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="facture-${o.order_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[INVOICE] Error generating invoice:", error);
    return NextResponse.json({ error: "Erreur lors de la génération de la facture" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateInvoicePDF(order: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const darkColor = rgb(0.1, 0.1, 0.1);
  const grayColor = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.95, 0.95, 0.95);

  let y = height - 50;
  const marginLeft = 50;
  const marginRight = width - 50;

  // === EN-TÊTE ===
  // Logo / Nom de la boutique
  page.drawText(SHOP_INFO.name.toUpperCase(), {
    x: marginLeft,
    y,
    size: 18,
    font: fontBold,
    color: darkColor,
  });

  // Numéro de facture à droite
  page.drawText(`FACTURE`, {
    x: marginRight - 100,
    y,
    size: 14,
    font: fontBold,
    color: darkColor,
  });

  y -= 20;
  page.drawText(order.order_number, {
    x: marginRight - 100,
    y,
    size: 10,
    font: fontRegular,
    color: grayColor,
  });

  y -= 40;

  // === INFORMATIONS BOUTIQUE ===
  page.drawText("De :", { x: marginLeft, y, size: 10, font: fontBold, color: darkColor });
  y -= 15;
  page.drawText(SHOP_INFO.name, { x: marginLeft, y, size: 10, font: fontRegular, color: darkColor });
  y -= 12;
  page.drawText(SHOP_INFO.address, { x: marginLeft, y, size: 10, font: fontRegular, color: grayColor });
  y -= 12;
  page.drawText(SHOP_INFO.city, { x: marginLeft, y, size: 10, font: fontRegular, color: grayColor });
  y -= 12;
  page.drawText(`Tél: ${SHOP_INFO.phone}`, { x: marginLeft, y, size: 10, font: fontRegular, color: grayColor });
  y -= 12;
  page.drawText(`Email: ${SHOP_INFO.email}`, { x: marginLeft, y, size: 10, font: fontRegular, color: grayColor });

  // === INFORMATIONS CLIENT ===
  let yClient = height - 130;
  const clientX = 320;

  page.drawText("Facturé à :", { x: clientX, y: yClient, size: 10, font: fontBold, color: darkColor });
  yClient -= 15;

  // Nom entreprise si présent
  if (order.company_name) {
    page.drawText(order.company_name, { x: clientX, y: yClient, size: 10, font: fontBold, color: darkColor });
    yClient -= 12;
    if (order.company_siret) {
      page.drawText(`SIRET: ${order.company_siret}`, { x: clientX, y: yClient, size: 9, font: fontRegular, color: grayColor });
      yClient -= 12;
    }
  }

  // Nom du client
  const clientName = `${order.profiles?.first_name || ""} ${order.profiles?.last_name || ""}`.trim() || "Client";
  page.drawText(clientName, { x: clientX, y: yClient, size: 10, font: fontRegular, color: darkColor });
  yClient -= 12;

  // Adresse de facturation (ou livraison si pas de facturation)
  const billingStreet = order.billing_street || order.shipping_street;
  const billingCity = order.billing_city || order.shipping_city;
  const billingPostalCode = order.billing_postal_code || order.shipping_postal_code;

  if (billingStreet) {
    page.drawText(billingStreet, { x: clientX, y: yClient, size: 10, font: fontRegular, color: grayColor });
    yClient -= 12;
  }
  if (billingPostalCode && billingCity) {
    page.drawText(`${billingPostalCode} ${billingCity}`, { x: clientX, y: yClient, size: 10, font: fontRegular, color: grayColor });
    yClient -= 12;
  }
  if (order.profiles?.email) {
    page.drawText(order.profiles.email, { x: clientX, y: yClient, size: 10, font: fontRegular, color: grayColor });
  }

  // === DATE ===
  y -= 40;
  const orderDate = new Date(order.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  page.drawText(`Date de facture : ${orderDate}`, { x: marginLeft, y, size: 10, font: fontRegular, color: grayColor });

  // === TABLEAU DES ARTICLES ===
  y -= 40;

  // En-tête du tableau
  page.drawRectangle({
    x: marginLeft,
    y: y - 5,
    width: marginRight - marginLeft,
    height: 25,
    color: lightGray,
  });

  page.drawText("Description", { x: marginLeft + 10, y: y + 5, size: 10, font: fontBold, color: darkColor });
  page.drawText("Qté", { x: 380, y: y + 5, size: 10, font: fontBold, color: darkColor });
  page.drawText("Prix unit.", { x: 420, y: y + 5, size: 10, font: fontBold, color: darkColor });
  page.drawText("Total", { x: 490, y: y + 5, size: 10, font: fontBold, color: darkColor });

  y -= 30;

  // Articles
  const items = order.order_items || [];
  for (const item of items) {
    const itemTotal = item.quantity * item.unit_price;
    const description = item.variant_info ? `${item.product_name} — ${item.variant_info}` : item.product_name;

    page.drawText(description.substring(0, 45), { x: marginLeft + 10, y, size: 9, font: fontRegular, color: darkColor });
    page.drawText(String(item.quantity), { x: 380, y, size: 9, font: fontRegular, color: darkColor });
    page.drawText(formatPrice(item.unit_price), { x: 420, y, size: 9, font: fontRegular, color: darkColor });
    page.drawText(formatPrice(itemTotal), { x: 490, y, size: 9, font: fontRegular, color: darkColor });

    y -= 20;
  }

  // Ligne de séparation
  y -= 10;
  page.drawLine({
    start: { x: marginLeft, y },
    end: { x: marginRight, y },
    thickness: 0.5,
    color: grayColor,
  });

  // === TOTAUX ===
  y -= 25;
  const labelX = 380;
  const valueX = 490;

  page.drawText("Sous-total HT :", { x: labelX, y, size: 10, font: fontRegular, color: grayColor });
  // TVA 20% → HT = TTC / 1.2
  const subtotalHT = order.subtotal / 1.2;
  page.drawText(formatPrice(subtotalHT), { x: valueX, y, size: 10, font: fontRegular, color: darkColor });

  y -= 18;
  page.drawText("TVA (20%) :", { x: labelX, y, size: 10, font: fontRegular, color: grayColor });
  const tva = order.subtotal - subtotalHT;
  page.drawText(formatPrice(tva), { x: valueX, y, size: 10, font: fontRegular, color: darkColor });

  if (order.discount_amount && order.discount_amount > 0) {
    y -= 18;
    page.drawText("Remise :", { x: labelX, y, size: 10, font: fontRegular, color: grayColor });
    page.drawText(`-${formatPrice(order.discount_amount)}`, { x: valueX, y, size: 10, font: fontRegular, color: darkColor });
  }

  if (order.shipping_cost > 0) {
    y -= 18;
    page.drawText("Frais de port :", { x: labelX, y, size: 10, font: fontRegular, color: grayColor });
    page.drawText(formatPrice(order.shipping_cost), { x: valueX, y, size: 10, font: fontRegular, color: darkColor });
  }

  y -= 25;
  page.drawRectangle({
    x: labelX - 10,
    y: y - 5,
    width: marginRight - labelX + 10,
    height: 25,
    color: lightGray,
  });
  page.drawText("TOTAL TTC :", { x: labelX, y: y + 5, size: 11, font: fontBold, color: darkColor });
  page.drawText(formatPrice(order.total), { x: valueX, y: y + 5, size: 11, font: fontBold, color: darkColor });

  // === PIED DE PAGE ===
  const footerY = 50;
  page.drawText("Merci pour votre confiance.", { x: marginLeft, y: footerY + 20, size: 10, font: fontRegular, color: grayColor });
  page.drawText(
    "Paiement effectué par carte bancaire via Alma.",
    { x: marginLeft, y: footerY + 5, size: 9, font: fontRegular, color: grayColor }
  );

  return pdfDoc.save();
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}
