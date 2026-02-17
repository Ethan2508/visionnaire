"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Check, Loader2 } from "lucide-react";
import Turnstile from "@/components/ui/Turnstile";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!turnstileToken) {
      setError("Veuillez compléter la vérification de sécurité.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      });

      if (!response.ok) {
        setError("Une erreur est survenue. Veuillez réessayer.");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 mb-6"
        >
          <ArrowLeft size={16} />
          Retour à la connexion
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-stone-900">Mot de passe oublié</h1>
          <p className="text-stone-500 mt-2">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {sent ? (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">Email envoyé !</h2>
            <p className="text-sm text-stone-500 mb-6">
              Si un compte existe avec l&apos;adresse <strong>{email}</strong>, vous recevrez un lien de réinitialisation dans quelques minutes.
            </p>
            <p className="text-xs text-stone-400">
              Pensez à vérifier vos spams si vous ne voyez pas l&apos;email.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4"
          >
            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900 placeholder:text-stone-400"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <Turnstile onVerify={handleTurnstileVerify} />

            <button
              type="submit"
              disabled={loading || !turnstileToken}
              className="w-full bg-stone-900 text-white py-2.5 rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Envoyer le lien de réinitialisation"
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
