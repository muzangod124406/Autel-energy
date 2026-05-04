import { useLocation } from "wouter";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-red-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page introuvable</h1>
      <p className="text-gray-500 text-sm mb-8">La page que vous recherchez n'existe pas ou a été déplacée.</p>
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 px-6 py-3 text-black font-bold rounded-2xl shadow-md"
        style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
      >
        <Home className="w-4 h-4" />
        Retour à l'accueil
      </button>
    </div>
  );
}
