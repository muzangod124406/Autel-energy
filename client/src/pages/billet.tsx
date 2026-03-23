import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import EmptyState from "@/components/empty-state";
import rewardIcon from "@assets/reward_icon_1773608863536.png";
import autelLogo from "@assets/images_(11)_1774131992392.png";
import submitIcon from "@assets/4245705_1774171951518.png";
import rulesIcon from "@assets/loi_1774171951475.png";

function maskPhone(phone: string) {
  if (!phone) return "****";
  if (phone.length <= 4) return phone;
  const start = phone.slice(0, 2);
  const end = phone.slice(-2);
  return `${start}****${end}`;
}

export default function BilletPage() {
  const [, navigate] = useLocation();
  const [showRules, setShowRules] = useState(false);

  const { data: tickets = [] } = useQuery({ queryKey: ["/api/tickets"] });
  const posts = tickets as any[];

  return (
    <div className="min-h-screen pb-24" style={{ background: "#f5f5f0" }}>

      {/* ── Header vert ─────────────────────── */}
      <div className="bg-[#22c55e] px-4 pt-6 pb-5">
        <h1 className="text-white font-bold text-xl text-center mb-5">Blog</h1>

        {/* Deux boutons d'action */}
        <div className="grid grid-cols-2 gap-3">
          <button
            data-testid="button-soumettre"
            onClick={() => navigate("/post-blog")}
            className="flex items-center gap-3 bg-white/20 rounded-2xl px-3 py-3 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-400 flex items-center justify-center shrink-0">
              <img src={submitIcon} alt="Publier" className="w-6 h-6 object-contain brightness-0 invert" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">Publier</p>
              <p className="text-white/80 text-xs leading-tight mt-0.5">Aller publier</p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/70 shrink-0" />
          </button>

          <button
            data-testid="button-regles"
            onClick={() => setShowRules(true)}
            className="flex items-center gap-3 bg-white/20 rounded-2xl px-3 py-3 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-400 flex items-center justify-center shrink-0">
              <img src={rulesIcon} alt="Règles" className="w-6 h-6 object-contain brightness-0 invert" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">Règles</p>
              <p className="text-white/80 text-xs leading-tight mt-0.5">Explication des règles</p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/70 shrink-0" />
          </button>
        </div>
      </div>

      {/* ── Indicateur de scroll ── */}
      <div className="flex justify-center py-2 bg-white">
        <div className="w-10 h-1 rounded-full bg-[#22c55e]" />
      </div>

      {/* ── Liste des posts ───────────────────── */}
      <div className="px-3 pt-2 space-y-3">
        {posts.length === 0 ? (
          <EmptyState text="Aucune publication" subtext="Il n'y a pas encore de publication disponible." />
        ) : (
          posts.map((post: any) => (
            <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm">

              {/* En-tête post */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl border-2 border-[#22c55e] bg-white flex items-center justify-center shrink-0 overflow-hidden">
                  <img src={autelLogo} alt="logo" className="w-full h-full object-cover" />
                </div>
                <p className="text-gray-800 font-semibold text-sm">
                  {post.user?.phone ? maskPhone(post.user.phone) : "****"}
                </p>
              </div>

              {/* Description */}
              {post.description && (
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{post.description}</p>
              )}

              {/* Image(s) */}
              {(post.imageUrl || post.imageUrl2) && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt="capture 1" className="w-full h-32 object-cover rounded-xl" />
                  )}
                  {post.imageUrl2 && (
                    <img src={post.imageUrl2} alt="capture 2" className="w-full h-32 object-cover rounded-xl" />
                  )}
                </div>
              )}

              {/* Pied de post */}
              <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-50">
                <span className={`font-bold text-sm ${post.bonus > 0 ? "text-orange-500" : "text-transparent"}`}>
                  FCFA {post.bonus > 0 ? post.bonus.toLocaleString("fr-FR") + ".00" : "0"}
                </span>
                <span className="text-gray-400 text-xs">
                  {new Date(post.createdAt).toLocaleString("fr-FR", {
                    year: "numeric", month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit", second: "2-digit"
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Modal règles ─────────────────────── */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowRules(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full bg-white rounded-t-3xl px-6 pt-6 pb-24 shadow-2xl"
            onClick={e => e.stopPropagation()}
            style={{ animation: "slideUp 0.3s ease-out" }}
          >
            <div className="flex justify-center mb-4">
              <img src={rewardIcon} alt="récompense" className="w-24 h-24 object-contain" />
            </div>
            <h2 className="text-gray-900 font-bold text-lg text-center leading-snug mb-3">
              Partagez vos captures de retrait et recevez une récompense en espèces
            </h2>
            <div className="text-gray-600 text-sm leading-relaxed mb-6 space-y-2">
              <p className="font-semibold text-gray-800">Conditions pour publier :</p>
              <p>✅ Avoir au moins <strong>un retrait approuvé</strong> sur votre compte.</p>
              <p>✅ <strong>Une seule publication par jour</strong> est autorisée.</p>
              <p>✅ Importer <strong>2 captures d'écran</strong> de votre retrait réussi.</p>
              <p className="mt-3 text-gray-500">Une fois votre publication approuvée par un administrateur, vous recevrez immédiatement une récompense de <strong>10–400 FCFA</strong>.</p>
            </div>
            <button
              data-testid="button-compris"
              onClick={() => setShowRules(false)}
              className="w-full h-12 rounded-full bg-[#22c55e] text-white font-bold text-base"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
