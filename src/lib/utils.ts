export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    vue: "Lunettes de vue",
    soleil: "Lunettes de soleil",
    ski: "Masques de ski",
    sport: "Sport",
    enfant: "Enfant",
  };
  return labels[category] || category;
}

export function genderLabel(gender: string): string {
  const labels: Record<string, string> = {
    homme: "Homme",
    femme: "Femme",
    mixte: "Mixte",
    enfant: "Enfant",
  };
  return labels[gender] || gender;
}

export function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    en_attente_paiement: "En attente de paiement",
    payee: "Payée",
    en_preparation: "En préparation",
    expediee: "Expédiée",
    prete_en_boutique: "Prête en boutique",
    livree: "Livrée",
    annulee: "Annulée",
  };
  return labels[status] || status;
}
