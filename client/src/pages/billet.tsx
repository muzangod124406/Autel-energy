import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import rechargeCircleImg from "@assets/recharge_1773608793085.png";
import EmptyState from "@/components/empty-state";
import lv0Img from "@assets/lv0_1773608793133.png";
import rewardIcon from "@assets/reward_icon_1773608863536.png";
import submitIcon from "@assets/4245705_1774171951518.png";
import rulesIcon from "@assets/loi_1774171951475.png";

function maskPhone(phone: string) {
  if (!phone) return "****";
  if (phone.length <= 4) return phone;
  const start = phone.slice(0, 3);
  const end = phone.slice(-3);
  return `${start}****${end}`;
}

export default function BilletPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showRules, setShowRules] = useState(false);

  const { data: tickets = [] } = useQuery({ queryKey: ["/api/tickets"] });
  const posts = tickets as any[];

  return (
    <div className="min-h-screen bg-[#f0f0e4] pb-24 relative">
      <div className="bg-[#22c55e] px-4 pt-6 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-white bg-white flex items-center justify-center overflow-hidden shrink-0">
              <span className="text-xl">🦁</span>
            </div>
            <div>
              <p className="text-white font-bold text-base">{user?.nickname || "Utilisateur"}</p>
              <p className="text-white/80 text-sm font-semibold">{maskPhone(user?.phone || "")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <img src={rechargeCircleImg} alt="recharge" className="w-9 h-9 object-contain" />
            <img src={lv0Img} alt="vip" className="w-9 h-9 object-contain" />
          </div>
        </div>
      </div>

      <div className="px-4 mt-3 space-y-3">
        {posts.length === 0 ? (
          <EmptyState text="Aucune publication" subtext="Il n'y a pas encore de publication disponible." />
        ) : (
          posts.map((post: any) => (
            <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center">
                    <span className="text-lg">🦁</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {post.user?.nickname || "Utilisateur"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {post.user?.phone ? maskPhone(post.user.phone) : "****"}
                    </p>
                  </div>
                </div>
                {post.bonus > 0 && (
                  <div className="flex items-center gap-1 bg-yellow-400 rounded-full px-3 py-1">
                    <span className="text-white font-bold text-sm">{post.bonus}.00</span>
                    <span className="text-white text-xs">🪙</span>
                  </div>
                )}
              </div>

              {post.description && (
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{post.description}</p>
              )}

              {post.imageUrl && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <img
                    src={post.imageUrl}
                    alt="post"
                    className="w-full h-32 object-cover rounded-xl"
                  />
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                {post.bonus > 0 ? (
                  <span className="text-orange-500 font-bold text-sm">
                    FCFA {post.bonus}.00
                  </span>
                ) : (
                  <span />
                )}
                <span className="text-gray-400 text-xs">
                  {new Date(post.createdAt).toLocaleString("fr-FR", {
                    year: "numeric", month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fixed right-0 top-1/2 -translate-y-1/2 flex flex-col gap-0 z-40">
        <button
          data-testid="button-soumettre"
          onClick={() => navigate("/post-blog")}
          className="flex flex-col items-center gap-1 bg-[#22c55e] text-white text-xs font-bold px-2 py-2 rounded-l-xl shadow-lg mb-1 w-14"
        >
          <img src={submitIcon} alt="Soumettre" className="w-6 h-6 object-contain brightness-0 invert" />
          <span>Soumettre</span>
        </button>
        <button
          data-testid="button-regles"
          onClick={() => setShowRules(true)}
          className="flex flex-col items-center gap-1 bg-[#22c55e] text-white text-xs font-bold px-2 py-2 rounded-l-xl shadow-lg w-14"
        >
          <img src={rulesIcon} alt="Règles" className="w-6 h-6 object-contain brightness-0 invert" />
          <span>Règles</span>
        </button>
      </div>

      {showRules && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setShowRules(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full bg-white rounded-t-3xl px-6 pt-6 pb-24 shadow-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}
            style={{ animation: "slideUp 0.3s ease-out" }}
          >
            <div className="flex justify-center mb-4">
              <img src={rewardIcon} alt="récompense" className="w-24 h-24 object-contain" />
            </div>
            <h2 className="text-gray-900 font-bold text-lg text-center leading-snug mb-3">
              Partagez des captures d'écran de retrait pour recevoir des récompenses en espèces
            </h2>
            <p className="text-gray-600 text-sm text-center leading-relaxed mb-6">
              Envoyez une capture d'écran du dernier retrait réussi dans la section des commentaires,
              et une fois approuvé, vous recevrez immédiatement une récompense de 10-400
            </p>
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
