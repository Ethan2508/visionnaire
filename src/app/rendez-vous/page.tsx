"use client";

import { CalendarDays, Phone, Clock, MapPin, Send } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function RendezVousPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/rendez-vous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          reason: formData.get("reason"),
          preferredDate: formData.get("preferredDate") || null,
          message: formData.get("message") || null,
        }),
      });

      if (!res.ok) throw new Error("Erreur");
      setSubmitted(true);
    } catch {
      alert("Une erreur est survenue. Veuillez réessayer ou nous appeler directement.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-24 lg:py-32">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-100 rounded-full mb-8">
          <CalendarDays size={28} className="text-stone-600" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-400 block">
          Rendez-vous
        </span>
        <h1 className="text-4xl md:text-5xl font-extralight text-stone-900 mt-3">
          Prenez <span className="font-semibold">rendez-vous</span>
        </h1>
        <p className="text-stone-500 mt-6 leading-relaxed font-light max-w-lg mx-auto">
          Remplissez le formulaire ci-dessous et notre équipe vous recontactera
          rapidement pour confirmer votre créneau.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 max-w-5xl mx-auto">
        {/* Form */}
        <div className="lg:col-span-3">
          {submitted ? (
            <div className="text-center py-16 bg-stone-50">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-50 rounded-full mb-6">
                <Send size={22} className="text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-stone-900">
                Demande envoyée
              </h2>
              <p className="text-stone-500 mt-3 font-light max-w-sm mx-auto">
                Nous avons bien reçu votre demande de rendez-vous. Notre équipe
                vous contactera sous 24h pour confirmer le créneau.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 text-sm font-medium text-stone-900 underline underline-offset-4 hover:text-stone-600 transition-colors"
              >
                Envoyer une autre demande
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition-colors"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition-colors"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition-colors"
                    placeholder="jean@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition-colors"
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Motif du rendez-vous *
                </label>
                <select
                  name="reason"
                  required
                  defaultValue=""
                  className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition-colors bg-white"
                >
                  <option value="" disabled>
                    Sélectionnez un motif
                  </option>
                  <option value="examen">Examen de vue</option>
                  <option value="essayage">Essayage de montures</option>
                  <option value="adaptation">Adaptation lentilles</option>
                  <option value="ajustement">Ajustement / Réparation</option>
                  <option value="conseil">Conseil personnalisé</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Date souhaitée
                </label>
                <input
                  type="date"
                  name="preferredDate"
                  className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Message (optionnel)
                </label>
                <textarea
                  name="message"
                  rows={4}
                  className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition-colors resize-none"
                  placeholder="Précisez ici toute information utile..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3.5 text-sm font-medium uppercase tracking-[0.1em] hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Envoi en cours..." : "Envoyer ma demande"}
              </button>

              <p className="text-[11px] text-stone-400 text-center">
                En soumettant ce formulaire, vous acceptez notre{" "}
                <Link
                  href="/confidentialite"
                  className="underline hover:text-stone-600"
                >
                  politique de confidentialité
                </Link>
                .
              </p>
            </form>
          )}
        </div>

        {/* Contact info sidebar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-stone-50 p-6">
            <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-[0.1em] mb-5">
              Informations pratiques
            </h2>
            <div className="space-y-5 text-sm">
              <div className="flex items-start gap-3">
                <Phone size={16} className="text-stone-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-stone-900 block">Téléphone</span>
                  <a
                    href="tel:+33478526222"
                    className="text-stone-500 hover:text-black transition-colors"
                  >
                    04 78 52 62 22
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-stone-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-stone-900 block">Adresse</span>
                  <span className="text-stone-500">
                    44 Cr Franklin Roosevelt<br />69006 Lyon
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={16} className="text-stone-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-stone-900 block">Horaires</span>
                  <span className="text-stone-500">
                    Lun : 14h – 19h<br />Mar – Sam : 10h – 19h<br />Dim : fermé
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-stone-900 text-white p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] mb-3">
              Besoin d&apos;aide ?
            </h3>
            <p className="text-sm text-stone-300 font-light leading-relaxed">
              Vous pouvez aussi nous appeler directement pour prendre
              rendez-vous ou poser vos questions.
            </p>
            <a
              href="tel:+33478526222"
              className="inline-flex items-center gap-2 mt-4 text-sm font-medium hover:text-stone-300 transition-colors"
            >
              <Phone size={14} />
              Appeler maintenant
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/"
          className="text-sm font-medium text-stone-500 hover:text-black transition-colors"
        >
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
