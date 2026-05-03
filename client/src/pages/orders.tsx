import { useQuery } from "@tanstack/react-query";
import { formatCFA } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import EmptyState from "@/components/empty-state";
import autelImg from "@assets/Autel-MaxiCharger-DC-Fast-60-240KW-EV-Charger-All-Security-Equ_1774131863511.jpg";

export default function OrdersPage() {
  const [, navigate] = useLocation();
  const { data: investments = [], isLoading } = useQuery({ queryKey: ["/api/user/investments"] });

  const list = investments as any[];
  const active = list.filter(inv => inv.status !== "completed" && new Date(inv.endDate) > new Date());
  const totalDaily = active.reduce((sum: number, inv: any) => sum + inv.dailyGain, 0);

  return (
    <div className="min-h-screen bg-gray-100 pb-10">

      {/* ── Header vert ─────────────────────────── */}
      <div className="bg-[#22c55e] px-4 pt-8 pb-6">

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/account")}
            data-testid="button-back-orders"
            className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white font-bold text-xl">Mes Produits</h1>
        </div>

        {/* Stats */}
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-white/70 text-xs mb-0.5">Sortie quotidienne</p>
            <p className="text-white font-extrabold text-2xl">{formatCFA(totalDaily)}</p>
          </div>
          <div className="w-px bg-white/30 h-10 mx-4" />
          <div className="flex-1">
            <p className="text-white/70 text-xs mb-0.5">Produits actifs</p>
            <p className="text-white font-extrabold text-2xl">{active.length}</p>
          </div>
        </div>
      </div>

      {/* ── Cartes produits ─────────────────────── */}
      <div className="px-4 mt-4 space-y-3">
        {isLoading ? (
          <>
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl h-44 animate-pulse shadow-sm" />
            ))}
          </>
        ) : list.length === 0 ? (
          <EmptyState text="Aucun produit" subtext="Vous n'avez pas encore souscrit à un produit." />
        ) : (
          list.map((inv: any) => {
            const isActive = inv.status !== "completed" && new Date(inv.endDate) > new Date();
            const planName = inv.planType === "activity"
              ? (inv.productName || `Activité`)
              : `SINOPEC S${inv.vipLevel}`;

            return (
              <div key={inv.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="flex gap-3 p-3">
                  {/* Image */}
                  <img
                    src={autelImg}
                    alt={planName}
                    className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                  />

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-bold text-gray-900 text-sm">{planName}</p>
                      <span className={`text-xs font-bold ${isActive ? "text-[#22c55e]" : "text-gray-400"}`}>
                        {isActive ? "Actif" : "Terminé"}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mb-3">Prix: {formatCFA(inv.amount)}</p>

                    {/* 3 stats */}
                    <div className="flex text-center">
                      <div className="flex-1">
                        <p className="text-gray-400 text-[10px]">Cycle</p>
                        <p className="text-gray-900 font-bold text-sm">{inv.duration}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-400 text-[10px]">Gain/jour</p>
                        <p className="text-gray-900 font-bold text-sm">{inv.dailyGain}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-400 text-[10px]">Revenu total</p>
                        <p className="text-gray-900 font-bold text-sm">{inv.totalGain}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bouton */}
                <button
                  onClick={() => navigate("/invest")}
                  data-testid={`button-investir-plus-${inv.id}`}
                  className="w-full bg-[#22c55e] text-white font-bold text-sm py-3 text-center"
                >
                  Investir plus
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
