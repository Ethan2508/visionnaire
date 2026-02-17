"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Supabase will have set the session after redirect
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setReady(true);
      } else {
        // Try to exchange code if present in hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          setReady(true);
        } else {
          setError("Lien invalide ou expiré. Veuillez demander un nouveau lien.");
        }
      }
    };
    
    checkSession();
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError("Erreur lors de la mise à jour du mot de passe. " + updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
    setLoading(false);
  }

  if (!ready && !error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 text-center">
        <Loader2 size={32} className="animate-spin text-stone-400 mx-auto mb-4" />
        <p className="text-sm text-stone-500">Vérification du lien...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-stone-900 mb-2">Mot de passe mis à jour !</h2>
        <p className="text-sm text-stone-500 mb-4">
          Vous allez être redirigé vers la page de connexion...
        </p>
        <Link
          href="/auth/login"
          className="text-stone-900 font-medium hover:underline"
        >
          Se connecter maintenant
        </Link>
      </div>
    );
  }

  if (error && !ready) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock size={32} className="text-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-stone-900 mb-2">Lien invalide</h2>
        <p className="text-sm text-stone-500 mb-6">{error}</p>
        <Link
          href="/auth/mot-de-passe-oublie"
          className="inline-block bg-stone-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-stone-800 transition-colors"
        >
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  return (
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
          htmlFor="password"
          className="block text-sm font-medium text-stone-700 mb-1"
        >
          Nouveau mot de passe
        </label>
        <div className="relative">
          <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full pl-10 pr-10 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900 placeholder:text-stone-400"
            placeholder="Minimum 8 caractères"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-stone-700 mb-1"
        >
          Confirmer le mot de passe
        </label>
        <div className="relative">
          <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900 placeholder:text-stone-400"
            placeholder="Confirmez votre mot de passe"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-stone-900 text-white py-2.5 rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          "Mettre à jour le mot de passe"
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-stone-900">Nouveau mot de passe</h1>
          <p className="text-stone-500 mt-2">
            Choisissez un nouveau mot de passe sécurisé
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 animate-pulse h-60" />
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
