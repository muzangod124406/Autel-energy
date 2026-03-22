import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { INVESTMENT_PLANS, formatCFA } from "@/lib/constants";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Lock, Calendar, ChevronRight, X, PackageX } from "lucide-react";
import EmptyState from "@/components/empty-state";
import autelImg from "@assets/Autel-MaxiCharger-DC-Fast-60-240KW-EV-Charger-All-Security-Equ_1774131863511.jpg";

const fixedPlan = INVESTMENT_PLANS.fix;

type ConfirmItem = {
  type: "fix" | "activity";
  name: string;
  imageUrl?: string;
  price: number;
  dailyGain: number;
  duration: number;
  totalGain: number;
  payload: any;
};

export default function InvestPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"fix" | "activities">("fix");
  const [buyingProductId, setBuyingProductId] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<ConfirmItem | null>(null);

  const { data: adminProducts = [], isLoading: loadingProducts } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: userInvestments = [] } = useQuery<any[]>({
    queryKey: ["/api/user/investments"],
  });

  const hasActiveFixed = (userInvestments as any[]).some(
    (i: any) => i.status === "active" && i.planType === "fix"
  );

  const investMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/user/invest", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Investissement réussi", description: "Votre investissement a été enregistré" });
      queryClient.invalidateQueries({ queryKey: ["/api/user/investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      refreshUser();
      setBuyingProductId(null);
      setConfirmItem(null);
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
      setBuyingProductId(null);
      setConfirmItem(null);
    }
  });

  const openConfirmFixed = (plan: any) => {
    if (!user) return;
    setConfirmItem({
      type: "fix",
      name: plan.name,
      imageUrl: undefined,
      price: plan.amount,
      dailyGain: plan.dailyGain,
      duration: fixedPlan.duration,
      totalGain: plan.totalGain,
      payload: {
        planType: "fix",
        vipLevel: plan.vip,
        amount: plan.amount,
        dailyGain: plan.dailyGain,
        duration: fixedPlan.duration,
        totalGain: plan.totalGain,
      },
    });
  };

  const openConfirmProduct = (product: any) => {
    if (!user) return;
    setConfirmItem({
      type: "activity",
      name: product.name,
      imageUrl: product.imageUrl,
      price: product.price,
      dailyGain: product.dailyGain,
      duration: product.cycleDays,
      totalGain: product.totalGain,
      payload: {
        planType: "activity",
        vipLevel: 1,
        amount: product.price,
        dailyGain: product.dailyGain,
        duration: product.cycleDays,
        totalGain: product.totalGain,
        productId: product.id,
      },
    });
    setBuyingProductId(product.id);
  };

  const handleConfirm = () => {
    if (!confirmItem || !user) return;
    if (user.depositBalance < confirmItem.price) {
      toast({ title: "Solde insuffisant", description: "Rechargez votre compte pour acheter ce produit", variant: "destructive" });
      return;
    }
    investMutation.mutate(confirmItem.payload);
  };

  const availableProducts = (adminProducts as any[]).filter((p: any) => {
    if (!p.isActive) return false;
    if (p.purchaseLimit > 0 && p.purchaseCount >= p.purchaseLimit) return false;
    return true;
  });

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Tab switcher */}
      <div className="flex px-4 gap-3 pt-5 mb-4">
        <button
          data-testid="tab-fix"
          onClick={() => setActiveTab("fix")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "fix"
              ? "bg-[#22c55e] text-white shadow-sm"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          Fixe
        </button>
        <button
          data-testid="tab-activities"
          onClick={() => setActiveTab("activities")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "activities"
              ? "bg-[#22c55e] text-white shadow-sm"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          Activités
        </button>
      </div>

      {/* ── FIXED PLANS ─────────────────────────────── */}
      {activeTab === "fix" && (
        <div className="px-3 space-y-3">
          {fixedPlan.plans.map((plan) => (
            <div
              key={plan.vip}
              data-testid={`plan-card-${plan.vip}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="flex gap-3 p-3 pb-2">
                <div className="relative flex-shrink-0">
                  <img
                    src={autelImg}
                    alt={plan.name}
                    className="w-24 h-24 rounded-xl object-cover"
                  />
                  <span className="absolute top-1.5 left-1.5 bg-[#f97316] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    120jours
                  </span>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="font-bold text-gray-900 text-sm mb-1">{plan.name}</p>
                  <p className="text-gray-700 text-xs">
                    Prix:<span className="font-semibold"> {plan.amount.toLocaleString("fr-FR")}.00XAF</span>
                  </p>
                  <p className="text-gray-700 text-xs">
                    Revenu journalier:<span className="font-semibold"> {plan.dailyGain.toLocaleString("fr-FR")}.00XAF</span>
                  </p>
                  <p className="text-gray-700 text-xs">
                    Revenu total:<span className="font-semibold"> {plan.totalGain.toLocaleString("fr-FR")}.00XAF</span>
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-100 mx-3" />
              <p className="text-gray-400 text-[11px] italic px-3 py-1.5">
                Gains bloqués pendant 120 jours. À la fin du cycle, <span className="font-semibold text-[#22c55e] not-italic">{plan.totalGain.toLocaleString("fr-FR")} FCFA</span> sont crédités sur votre solde retirable.
              </p>
              <div className="px-3 pb-3">
                <button
                  data-testid={`invest-vip-${plan.vip}`}
                  onClick={() => openConfirmFixed(plan)}
                  disabled={investMutation.isPending}
                  className="w-full py-3 bg-[#22c55e] text-white font-bold rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-1"
                >
                  ACHETER <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ACTIVITIES ──────────────────────────────── */}
      {activeTab === "activities" && (
        <div className="px-3 space-y-3">

          {loadingProducts && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-3 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-24 h-24 bg-gray-200 rounded-xl" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                      <div className="h-2.5 bg-gray-100 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingProducts && availableProducts.length === 0 && (
            <div className="px-4">
              <EmptyState
                text="Aucun produit disponible"
                subtext="Les produits d'activité ne sont pas disponibles aujourd'hui, revenez plus tard."
              />
            </div>
          )}

          {!loadingProducts && availableProducts.map((product: any) => {
            const remaining = product.purchaseLimit > 0
              ? product.purchaseLimit - product.purchaseCount
              : null;
            const isLaunched = !product.launchDate || new Date(product.launchDate) <= new Date();
            const isBuying = investMutation.isPending && buyingProductId === product.id;

            return (
              <div
                key={product.id}
                data-testid={`product-card-${product.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="flex gap-3 p-3 pb-2">
                  <div className="relative flex-shrink-0">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-24 h-24 rounded-xl object-cover" />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center">
                        <PackageX className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    <span className="absolute top-1.5 left-1.5 bg-[#f97316] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      {product.cycleDays}jours
                    </span>
                    {remaining !== null && remaining <= 5 && (
                      <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        {remaining} restant{remaining > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="font-bold text-gray-900 text-sm mb-1">{product.name}</p>
                    <p className="text-gray-700 text-xs">
                      Prix:<span className="font-semibold"> {product.price.toLocaleString("fr-FR")}.00XAF</span>
                    </p>
                    <p className="text-gray-700 text-xs">
                      Revenu journalier:<span className="font-semibold"> {product.dailyGain.toLocaleString("fr-FR")}.00XAF</span>
                    </p>
                    <p className="text-gray-700 text-xs">
                      Revenu total:<span className="font-semibold"> {product.totalGain.toLocaleString("fr-FR")}.00XAF</span>
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-100 mx-3" />
                <p className="text-gray-400 text-[11px] italic px-3 py-1.5">
                  {product.description
                    ? product.description
                    : <>Gains crédités à la fin du cycle de {product.cycleDays} jours. Gain total : <span className="font-semibold text-[#22c55e] not-italic">{product.totalGain.toLocaleString("fr-FR")} FCFA</span> sur votre solde retirable.</>}
                </p>
                <div className="px-3 pb-3">
                  {!isLaunched ? (
                    <div className="w-full py-3 bg-gray-100 rounded-xl text-center text-xs text-gray-500 font-medium">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Disponible le {new Date(product.launchDate).toLocaleDateString("fr-FR")}
                    </div>
                  ) : !hasActiveFixed ? (
                    <div className="w-full py-3 bg-orange-50 border border-orange-200 rounded-xl text-center text-xs text-orange-600 font-medium flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3" /> Plan Fixe 120J requis
                    </div>
                  ) : (
                    <button
                      data-testid={`buy-product-${product.id}`}
                      onClick={() => openConfirmProduct(product)}
                      disabled={isBuying || investMutation.isPending}
                      className="w-full py-3 bg-[#22c55e] text-white font-bold rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-1"
                    >
                      {isBuying ? "Achat en cours..." : (<>ACHETER <ChevronRight className="w-4 h-4" /></>)}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL DE CONFIRMATION ────────────────────── */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-20">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[80vh] overflow-y-auto">
            {/* Image produit */}
            <div className="relative w-full h-44">
              {confirmItem.imageUrl ? (
                <img src={confirmItem.imageUrl} alt={confirmItem.name} className="w-full h-full object-cover" />
              ) : (
                <img src={autelImg} alt={confirmItem.name} className="w-full h-full object-cover" />
              )}
              <button
                data-testid="modal-close"
                onClick={() => { setConfirmItem(null); setBuyingProductId(null); }}
                className="absolute top-3 right-3 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent h-16" />
            </div>

            {/* Prix */}
            <div className="bg-white pt-3 pb-1 text-center">
              <p className="text-[#22c55e] font-black text-3xl tracking-tight">
                FCFA {confirmItem.price.toLocaleString("fr-FR")}
              </p>
            </div>

            {/* Bloc vert */}
            <div className="bg-[#22c55e] mx-0 px-5 pt-3 pb-5">
              <div className="space-y-2 mb-5">
                <div className="flex justify-between">
                  <span className="text-white/90 text-sm">Durée du cycle :</span>
                  <span className="text-white font-bold text-sm">{confirmItem.duration} jours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/90 text-sm">Gain/jour (indicatif) :</span>
                  <span className="text-white font-bold text-sm">FCFA {confirmItem.dailyGain.toLocaleString("fr-FR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/90 text-sm">Gain total à recevoir :</span>
                  <span className="text-white font-bold text-sm">FCFA {confirmItem.totalGain.toLocaleString("fr-FR")}</span>
                </div>
                <div className="border-t border-white/30 pt-2">
                  <p className="text-white/80 text-xs text-center">
                    ⏳ Gains crédités à la fin du cycle sur votre solde retirable
                  </p>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  data-testid="modal-cancel"
                  onClick={() => { setConfirmItem(null); setBuyingProductId(null); }}
                  className="flex-1 py-3 bg-gray-400 text-white font-bold rounded-2xl text-sm"
                >
                  Annuler
                </button>
                <button
                  data-testid="modal-confirm"
                  onClick={handleConfirm}
                  disabled={investMutation.isPending}
                  className="flex-1 py-3 bg-white text-[#22c55e] font-bold rounded-2xl text-sm disabled:opacity-60"
                >
                  {investMutation.isPending ? "..." : "Confirmer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
