import { Wrench } from "lucide-react";

export const metadata = {
  title: "Maintenance en cours – Visionnaires Opticiens",
  description: "Notre site est temporairement en maintenance. Nous revenons très vite !",
};

export default function MaintenancePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <Wrench size={40} className="text-stone-600" />
        </div>
        
        <h1 className="text-3xl font-semibold text-stone-900 mb-4">
          Site en maintenance
        </h1>
        
        <p className="text-stone-600 mb-8 leading-relaxed">
          Nous mettons à jour notre catalogue et nos photos pour vous offrir 
          une meilleure expérience. Nous serons de retour très rapidement !
        </p>
        
        <div className="bg-white rounded-xl border border-stone-200 p-6 text-left">
          <p className="text-sm font-medium text-stone-900 mb-2">
            Besoin de nous contacter ?
          </p>
          <p className="text-sm text-stone-600">
            📞 <a href="tel:+33123456789" className="hover:underline">01 23 45 67 89</a>
          </p>
          <p className="text-sm text-stone-600 mt-1">
            ✉️ <a href="mailto:contact@visionnairesopticiens.fr" className="hover:underline">contact@visionnairesopticiens.fr</a>
          </p>
        </div>
        
        <p className="text-xs text-stone-400 mt-8">
          © {new Date().getFullYear()} Visionnaires Opticiens
        </p>
      </div>
    </main>
  );
}
