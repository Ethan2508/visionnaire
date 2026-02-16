import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prendre rendez-vous",
  description:
    "Prenez rendez-vous avec nos opticiens diplômés à Lyon. Examen de vue, essayage personnalisé, adaptation de lentilles et conseils experts.",
  openGraph: {
    title: "Prendre rendez-vous | Visionnaire Opticiens",
    description:
      "Prenez rendez-vous avec nos opticiens diplômés à Lyon pour un examen de vue, essayage ou conseil personnalisé.",
    type: "website",
  },
};

export default function RendezVousLayout({ children }: { children: React.ReactNode }) {
  return children;
}
