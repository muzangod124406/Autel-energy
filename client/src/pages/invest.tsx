import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { INVESTMENT_PLANS, formatCFA } from "@/lib/constants";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Lock, PackageX, Calendar, ShieldAlert, ChevronRight } from "lucide-react";
import autelImg from "@assets/Autel-MaxiCharger-DC-Fast-60-240KW-EV-Charger-All-Security-Equ_1774131863511.jpg";

const fixedPlan = INVESTMENT_PLANS.fix;

export default function InvestPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"fix" | "activities">("fix");
  const [buyingProductId, setBuyingProductId] = useState<string | null>(null);

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
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
      setBuyingProductId(null);
    }
  });

  const handleInvestFixed = (plan: any) => {
    if (!user) return;
    if (user.depositBalance < plan.amount) {
      toast({ title: "Solde insuffisant", description: "Rechargez votre compte", variant: "destructive" });
      return;
    }
    investMutation.mutate({
      planType: "fix",
      vipLevel: plan.vip,
      amount: plan.amount,
      dailyGain: plan.dailyGain,
      duration: fixedPlan.duration,
      totalGain: plan.totalGain,
    });
  };

  const handleBuyProduct = (product: any) => {
    if (!user) return;
    if (user.depositBalance < product.price) {
      toast({ title: "Solde insuffisant", description: "Rechargez votre compte", variant: "destructive" });
      return;
    }
    setBuyingProductId(product.id);
    investMutation.mutate({
      planType: "activity",
      vipLevel: 1,
      amount: product.price,
      dailyGain: product.dailyGain,
      duration: product.cycleDays,
      totalGain: product.totalGain,
      productId: product.id,
    });
  };

  const availableProducts = (adminProducts as any[]).filter((p: any) => {
    if (!p.isActive) return false;
    if (p.purchaseLimit > 0 && p.purchaseCount >= p.purchaseLimit) return false;
    return true;
  });

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Green header */}
      <div className="bg-[#22c55e] px-4 pt-6 pb-5">
        <h1 className="text-white font-bold text-xl text-center">Liste des projets</h1>
        <p className="text-white/80 text-xs text-center mt-0.5">
          Solde : {formatCFA(user?.depositBalance || 0)}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex px-4 gap-3 mt-4 mb-4">
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
              {/* Image + info row */}
              <div className="flex gap-3 p-3 pb-2">
                {/* Image with badge */}
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

                {/* Info */}
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

              {/* Divider + note */}
              <div className="border-t border-gray-100 mx-3" />
              <p className="text-gray-400 text-[11px] italic px-3 py-1.5">
                les revenus seront réglés toutes les 24 heures.
              </p>

              {/* Buy button */}
              <div className="px-3 pb-3">
                <button
                  data-testid={`invest-vip-${plan.vip}`}
                  onClick={() => handleInvestFixed(plan)}
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
          {/* Must have fixed plan */}
          {!hasActiveFixed && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5">
              <ShieldAlert className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <p className="text-orange-700 text-xs">
                Achetez le <strong>plan Fixe 120J</strong> pour accéder aux activités.{" "}
                <button onClick={() => setActiveTab("fix")} className="underline font-bold" data-testid="btn-go-to-fixed">
                  Voir →
                </button>
              </p>
            </div>
          )}

          {/* Loading skeleton */}
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

          {/* Empty state */}
          {!loadingProducts && availableProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <PackageX className="w-14 h-14 text-gray-200 mb-3" />
              <p className="text-gray-600 font-semibold text-base mb-1">
                Aucun produit disponible
              </p>
              <p className="text-gray-400 text-sm">
                Les produits d'activité ne sont pas disponibles aujourd'hui, revenez plus tard.
              </p>
            </div>
          )}

          {/* Product cards */}
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
                {/* Image + info row */}
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

                  {/* Info */}
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

                {/* Divider + note */}
                <div className="border-t border-gray-100 mx-3" />
                <p className="text-gray-400 text-[11px] italic px-3 py-1.5">
                  les revenus seront réglés toutes les 24 heures.
                </p>

                {/* Action button */}
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
                      onClick={() => handleBuyProduct(product)}
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
    </div>
  );
}
