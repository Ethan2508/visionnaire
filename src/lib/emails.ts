/**
 * Email templates HTML — Visionnaire Opticiens
 * Design minimaliste, luxe, cohérent avec la charte graphique (noir, pierre, blanc)
 */

const LOGO_URL = "https://visionnaireopticiens.vercel.app/logos/logo-black.png";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://visionnaireopticiens.vercel.app";

/* ─── Base layout ─── */
function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Visionnaire Opticiens</title>
</head>
<body style="margin:0;padding:0;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fafaf9;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <a href="${SITE_URL}" style="text-decoration:none;">
                <img src="${LOGO_URL}" alt="Visionnaire Opticiens" width="180" style="display:block;height:auto;" />
              </a>
            </td>
          </tr>
          <!-- Content card -->
          <tr>
            <td style="background-color:#ffffff;border:1px solid #e7e5e4;padding:40px 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#a8a29e;line-height:1.6;">
                Visionnaire Opticiens — 44 Cours Franklin Roosevelt, 69006 Lyon<br/>
                <a href="tel:+33478526222" style="color:#a8a29e;text-decoration:none;">04 78 52 62 22</a> ·
                <a href="${SITE_URL}" style="color:#a8a29e;text-decoration:none;">visionnairesopticiens.fr</a>
              </p>
              <p style="margin:12px 0 0;font-size:10px;color:#d6d3d1;">
                © ${new Date().getFullYear()} Visionnaire Opticiens. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ─── Helpers ─── */
function heading(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:24px;font-weight:300;color:#1c1917;letter-spacing:-0.5px;">${text}</h1>`;
}

function subheading(text: string): string {
  return `<p style="margin:0 0 24px;font-size:14px;color:#78716c;font-weight:300;">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0;" />`;
}

function button(text: string, href: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
    <tr>
      <td style="background-color:#1c1917;padding:14px 32px;">
        <a href="${href}" style="color:#ffffff;text-decoration:none;font-size:13px;font-weight:500;letter-spacing:0.5px;text-transform:uppercase;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price);
}

/* ═══════════════════════════════════════════
   1. CONFIRMATION DE COMMANDE
═══════════════════════════════════════════ */

interface OrderItem {
  product_name: string;
  variant_info?: string | null;
  quantity: number;
  unit_price: number;
}

interface OrderConfirmationData {
  orderNumber: string;
  firstName: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  deliveryMethod: string;
  shippingAddress?: {
    street: string;
    city: string;
    postalCode: string;
  };
}

export function orderConfirmationEmail(data: OrderConfirmationData) {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f5f5f4;font-size:13px;color:#44403c;">
          <strong>${item.product_name}</strong>
          ${item.variant_info ? `<br/><span style="color:#a8a29e;font-size:12px;">${item.variant_info}</span>` : ""}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #f5f5f4;font-size:13px;color:#78716c;text-align:center;">×${item.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid #f5f5f4;font-size:13px;color:#1c1917;text-align:right;font-weight:500;">${formatPrice(item.unit_price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  const deliveryLabel = data.deliveryMethod === "boutique" ? "Retrait en boutique" : "Livraison à domicile";

  const addressHtml =
    data.deliveryMethod === "domicile" && data.shippingAddress
      ? `<p style="margin:8px 0 0;font-size:13px;color:#78716c;">${data.shippingAddress.street}<br/>${data.shippingAddress.postalCode} ${data.shippingAddress.city}</p>`
      : data.deliveryMethod === "boutique"
        ? `<p style="margin:8px 0 0;font-size:13px;color:#78716c;">44 Cours Franklin Roosevelt, 69006 Lyon</p>`
        : "";

  const content = `
    ${heading("Merci pour votre commande !")}
    ${subheading(`Bonjour ${data.firstName}, votre commande ${data.orderNumber} a bien été enregistrée.`)}
    ${divider()}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <thead>
        <tr>
          <th style="text-align:left;font-size:10px;color:#a8a29e;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;">Article</th>
          <th style="text-align:center;font-size:10px;color:#a8a29e;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;">Qté</th>
          <th style="text-align:right;font-size:10px;color:#a8a29e;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;">Prix</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;">
      <tr>
        <td style="font-size:13px;color:#78716c;padding:4px 0;">Sous-total</td>
        <td style="font-size:13px;color:#1c1917;text-align:right;padding:4px 0;">${formatPrice(data.subtotal)}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#78716c;padding:4px 0;">Livraison</td>
        <td style="font-size:13px;color:#1c1917;text-align:right;padding:4px 0;">${data.shippingCost > 0 ? formatPrice(data.shippingCost) : "Offerte"}</td>
      </tr>
      <tr>
        <td style="font-size:15px;font-weight:600;color:#1c1917;padding:12px 0 0;border-top:1px solid #e7e5e4;">Total</td>
        <td style="font-size:15px;font-weight:600;color:#1c1917;text-align:right;padding:12px 0 0;border-top:1px solid #e7e5e4;">${formatPrice(data.total)}</td>
      </tr>
    </table>
    ${divider()}
    <p style="margin:0;font-size:12px;color:#a8a29e;text-transform:uppercase;letter-spacing:1px;">Mode de livraison</p>
    <p style="margin:4px 0 0;font-size:14px;color:#1c1917;font-weight:500;">${deliveryLabel}</p>
    ${addressHtml}
    ${button("Suivre ma commande", `${SITE_URL}/compte`)}
    <p style="margin:0;font-size:12px;color:#a8a29e;">
      Si vous avez des questions, n'hésitez pas à nous contacter au
      <a href="tel:+33478526222" style="color:#78716c;">04 78 52 62 22</a>.
    </p>
  `;

  return {
    subject: `Commande ${data.orderNumber} confirmée — Visionnaire Opticiens`,
    html: layout(content),
  };
}

/* ═══════════════════════════════════════════
   2. BIENVENUE NEWSLETTER
═══════════════════════════════════════════ */

export function newsletterWelcomeEmail() {
  const content = `
    ${heading("Bienvenue dans l'univers Visionnaire")}
    ${subheading("Merci de vous être inscrit à notre newsletter.")}
    <p style="margin:0 0 16px;font-size:14px;color:#44403c;line-height:1.7;font-weight:300;">
      Vous recevrez en avant-première nos nouvelles collections, offres exclusives
      et conseils d'experts pour prendre soin de votre vision.
    </p>
    ${button("Découvrir le catalogue", `${SITE_URL}/catalogue`)}
    ${divider()}
    <p style="margin:0;font-size:11px;color:#a8a29e;">
      Vous pouvez vous désabonner à tout moment en répondant à cet email.
    </p>
  `;

  return {
    subject: "Bienvenue chez Visionnaire Opticiens ✨",
    html: layout(content),
  };
}

/* ═══════════════════════════════════════════
   3. CONFIRMATION RENDEZ-VOUS
═══════════════════════════════════════════ */

interface RdvConfirmationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  reason: string;
  preferredDate?: string;
  message?: string;
}

const reasonLabels: Record<string, string> = {
  examen: "Examen de vue",
  essayage: "Essayage de montures",
  adaptation: "Adaptation lentilles",
  ajustement: "Ajustement / Réparation",
  conseil: "Conseil personnalisé",
  autre: "Autre",
};

export function rdvConfirmationEmail(data: RdvConfirmationData) {
  const reasonLabel = reasonLabels[data.reason] || data.reason;

  const content = `
    ${heading("Demande de rendez-vous reçue")}
    ${subheading(`Bonjour ${data.firstName}, nous avons bien reçu votre demande.`)}
    <p style="margin:0 0 20px;font-size:14px;color:#44403c;line-height:1.7;font-weight:300;">
      Notre équipe vous contactera sous <strong>24 heures</strong> pour confirmer
      votre créneau.
    </p>
    ${divider()}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#a8a29e;text-transform:uppercase;letter-spacing:1px;width:120px;">Motif</td>
        <td style="padding:6px 0;font-size:14px;color:#1c1917;">${reasonLabel}</td>
      </tr>
      ${data.preferredDate ? `
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#a8a29e;text-transform:uppercase;letter-spacing:1px;">Date souhaitée</td>
        <td style="padding:6px 0;font-size:14px;color:#1c1917;">${new Date(data.preferredDate).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</td>
      </tr>` : ""}
      ${data.message ? `
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#a8a29e;text-transform:uppercase;letter-spacing:1px;vertical-align:top;">Message</td>
        <td style="padding:6px 0;font-size:14px;color:#44403c;">${data.message}</td>
      </tr>` : ""}
    </table>
    ${divider()}
    <p style="margin:0;font-size:13px;color:#78716c;">
      📍 44 Cours Franklin Roosevelt, 69006 Lyon<br/>
      📞 <a href="tel:+33478526222" style="color:#78716c;">04 78 52 62 22</a>
    </p>
  `;

  return {
    subject: "Votre demande de rendez-vous — Visionnaire Opticiens",
    html: layout(content),
  };
}

/** Email envoyé au magasin pour les RDV */
export function rdvNotificationEmail(data: RdvConfirmationData) {
  const reasonLabel = reasonLabels[data.reason] || data.reason;

  const content = `
    ${heading("Nouveau rendez-vous")}
    ${subheading(`${data.firstName} ${data.lastName} demande un rendez-vous.`)}
    ${divider()}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr><td style="padding:4px 0;font-size:13px;color:#a8a29e;">Client</td><td style="padding:4px 0;font-size:14px;color:#1c1917;">${data.firstName} ${data.lastName}</td></tr>
      <tr><td style="padding:4px 0;font-size:13px;color:#a8a29e;">Email</td><td style="padding:4px 0;font-size:14px;color:#1c1917;"><a href="mailto:${data.email}" style="color:#1c1917;">${data.email}</a></td></tr>
      <tr><td style="padding:4px 0;font-size:13px;color:#a8a29e;">Téléphone</td><td style="padding:4px 0;font-size:14px;color:#1c1917;"><a href="tel:${data.phone}" style="color:#1c1917;">${data.phone}</a></td></tr>
      <tr><td style="padding:4px 0;font-size:13px;color:#a8a29e;">Motif</td><td style="padding:4px 0;font-size:14px;color:#1c1917;">${reasonLabel}</td></tr>
      ${data.preferredDate ? `<tr><td style="padding:4px 0;font-size:13px;color:#a8a29e;">Date souhaitée</td><td style="padding:4px 0;font-size:14px;color:#1c1917;">${new Date(data.preferredDate).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</td></tr>` : ""}
      ${data.message ? `<tr><td style="padding:4px 0;font-size:13px;color:#a8a29e;vertical-align:top;">Message</td><td style="padding:4px 0;font-size:14px;color:#44403c;">${data.message}</td></tr>` : ""}
    </table>
  `;

  return {
    subject: `Nouveau RDV — ${data.firstName} ${data.lastName} (${reasonLabel})`,
    html: layout(content),
  };
}

/* ═══════════════════════════════════════════
   4. BIENVENUE NOUVEAU COMPTE
═══════════════════════════════════════════ */

export function welcomeEmail(firstName: string) {
  const content = `
    ${heading(`Bienvenue, ${firstName} !`)}
    ${subheading("Votre compte Visionnaire Opticiens a été créé avec succès.")}
    <p style="margin:0 0 16px;font-size:14px;color:#44403c;line-height:1.7;font-weight:300;">
      Vous pouvez désormais passer commande, suivre vos achats et gérer vos
      informations personnelles depuis votre espace client.
    </p>
    ${button("Accéder à mon compte", `${SITE_URL}/compte`)}
    ${divider()}
    <p style="margin:0 0 8px;font-size:14px;color:#1c1917;font-weight:500;">Nos avantages</p>
    <ul style="margin:0;padding:0 0 0 20px;font-size:13px;color:#78716c;line-height:2;">
      <li>Livraison offerte dès 150€</li>
      <li>Paiement en 2x, 3x ou 4x sans frais</li>
      <li>Garantie 2 ans sur toutes les montures</li>
      <li>Service d'ajustement gratuit en boutique</li>
    </ul>
  `;

  return {
    subject: "Bienvenue chez Visionnaire Opticiens !",
    html: layout(content),
  };
}

/* ═══════════════════════════════════════════
   5. COMMANDE EXPÉDIÉE
═══════════════════════════════════════════ */

interface ShippingNotificationData {
  orderNumber: string;
  firstName: string;
  trackingNumber?: string;
}

export function orderShippedEmail(data: ShippingNotificationData) {
  const content = `
    ${heading("Votre commande est en route ! 📦")}
    ${subheading(`Bonjour ${data.firstName}, votre commande ${data.orderNumber} a été expédiée.`)}
    <p style="margin:0 0 16px;font-size:14px;color:#44403c;line-height:1.7;font-weight:300;">
      Vous la recevrez sous 2 à 4 jours ouvrés à l'adresse indiquée lors de votre commande.
    </p>
    ${data.trackingNumber ? `
    ${divider()}
    <p style="margin:0;font-size:12px;color:#a8a29e;text-transform:uppercase;letter-spacing:1px;">Numéro de suivi</p>
    <p style="margin:4px 0 0;font-size:16px;color:#1c1917;font-weight:500;font-family:monospace;">${data.trackingNumber}</p>
    ` : ""}
    ${button("Suivre ma commande", `${SITE_URL}/compte`)}
    <p style="margin:0;font-size:12px;color:#a8a29e;">
      En cas de question, contactez-nous au
      <a href="tel:+33478526222" style="color:#78716c;">04 78 52 62 22</a>.
    </p>
  `;

  return {
    subject: `Commande ${data.orderNumber} expédiée — Visionnaire Opticiens`,
    html: layout(content),
  };
}

/* ═══════════════════════════════════════════
   6. COMMANDE PRÊTE EN BOUTIQUE
═══════════════════════════════════════════ */

export function orderReadyEmail(data: { orderNumber: string; firstName: string }) {
  const content = `
    ${heading("Votre commande est prête ! 🎉")}
    ${subheading(`Bonjour ${data.firstName}, votre commande ${data.orderNumber} vous attend en boutique.`)}
    <p style="margin:0 0 16px;font-size:14px;color:#44403c;line-height:1.7;font-weight:300;">
      Rendez-vous dans notre boutique avec une pièce d'identité pour récupérer
      votre commande. Nos opticiens se feront un plaisir de vous accueillir.
    </p>
    ${divider()}
    <p style="margin:0;font-size:12px;color:#a8a29e;text-transform:uppercase;letter-spacing:1px;">Adresse de la boutique</p>
    <p style="margin:4px 0 0;font-size:14px;color:#1c1917;font-weight:500;">44 Cours Franklin Roosevelt, 69006 Lyon</p>
    <p style="margin:4px 0 0;font-size:13px;color:#78716c;">
      Lun : 14h–19h · Mar–Sam : 10h–19h
    </p>
    ${button("Mon compte", `${SITE_URL}/compte`)}
    <p style="margin:0;font-size:12px;color:#a8a29e;">
      Besoin de décaler le retrait ? Appelez-nous au
      <a href="tel:+33478526222" style="color:#78716c;">04 78 52 62 22</a>.
    </p>
  `;

  return {
    subject: `Commande ${data.orderNumber} prête en boutique — Visionnaire Opticiens`,
    html: layout(content),
  };
}
