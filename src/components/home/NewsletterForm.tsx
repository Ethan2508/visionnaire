"use client";

import { useState, FormEvent } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="mt-8 text-sm text-green-400 font-medium">
        Merci ! Vous êtes inscrit à notre newsletter.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Votre adresse e-mail"
        aria-label="Adresse e-mail pour la newsletter"
        className="flex-1 bg-white/10 border border-white/10 px-5 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors input-glow"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-white text-black px-7 py-3.5 text-sm font-medium uppercase tracking-[0.1em] hover:bg-white/90 transition-colors shrink-0 disabled:opacity-50"
      >
        {status === "loading" ? "..." : "S'inscrire"}
      </button>
      {status === "error" && (
        <p className="text-red-400 text-xs mt-1 sm:mt-0 sm:absolute">
          Une erreur est survenue. Réessayez.
        </p>
      )}
    </form>
  );
}
