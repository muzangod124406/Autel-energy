import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { INVESTMENT_PLANS, formatCFA } from "@/lib/constants";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Lock, Calendar, ChevronRight, X, PackageX, TrendingUp, ShieldCheck } from "lucide-react";
import EmptyState from "@/components/empty-state";

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

  const { data: adminProducts = [], isLoading: loadingProducts } = useQuery<any[]>({ queryKey: ["/api/products"] });
  const { data: userInvestments = [] } = useQuery<any[]>({ queryKey: ["/api/user/investments"] });

  const activeFixedPlans = (userInvestments as any[]).filter(
    (i: any) => i.status === "active" && i.planType === "fix"
  );
  const hasActiveFixed = activeFixedPlans.length > 0;
  const maxVip = activeFixedPlans.reduce((m: number, i: any) => Math.max(m, i.vipLevel || 1), 0);
  // VIP 1 → 2 first activities, VIP 2 → 4 first activities, VIP 3+ → all
  const allowedActivityCount = maxVip === 0 ? 0 : maxVip === 1 ? 2 : maxVip === 2 ? 4 : Infinity;

  const investMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/user/invest", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Investissement réussi !", description: "Votre investissement a été enregistré." });
      queryClient.invalidateQueries({ queryKey: ["/api/user/investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      refreshUser();
      setBuyingProductId(null);
      setConfirmItem(null);
    },
    onError: (e: any) => {
      toast({ title: e.message || "Erreur", variant: "destructive" });
      setBuyingProductId(null);
      setConfirmItem(null);
    }
  });

  const openConfirmFixed = (plan: any) => {
    if (!user) return;
    setConfirmItem({
      type: "fix", name: plan.name, imageUrl: undefined,
      price: plan.amount, dailyGain: plan.dailyGain, duration: fixedPlan.duration, totalGain: plan.totalGain,
      payload: { planType: "fix", vipLevel: plan.vip, amount: plan.amount, dailyGain: plan.dailyGain, duration: fixedPlan.duration, totalGain: plan.totalGain },
    });
  };

  const openConfirmProduct = (product: any) => {
    if (!user) return;
    setConfirmItem({
      type: "activity", name: product.name, imageUrl: product.imageUrl,
      price: product.price, dailyGain: product.dailyGain, duration: product.cycleDays, totalGain: product.totalGain,
      payload: { planType: "activity", vipLevel: 1, amount: product.price, dailyGain: product.dailyGain, duration: product.cycleDays, totalGain: product.totalGain, productId: product.id },
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

  const availableProducts = (adminProducts as any[])
    .filter((p: any) => p.isActive)
    .sort((a: any, b: any) => a.price - b.price)
    .map((p: any, idx: number) => ({
      ...p,
      isLimitReached: p.purchaseLimit > 0 && p.purchaseCount >= p.purchaseLimit,
      isVipLocked: !hasActiveFixed || idx >= allowedActivityCount,
    }));

  return (
    <div className="min-h-screen pb-28 bg-gray-50">

      {/* Header gold */}
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-5 pt-8 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-white/80" />
          <p className="text-white/80 font-semibold text-xs uppercase tracking-widest">SINOPEC</p>
        </div>
        <h1 className="text-white font-extrabold text-2xl leading-none">Produits</h1>
        <p className="text-white/80 text-base font-semibold mt-0.5">d'investissement</p>

        {/* Quick stat */}
        <div className="flex gap-3 mt-4">
          <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5 text-white/80" />
            <span className="text-white/80 text-xs font-medium">Revenus garantis</span>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="px-4 pt-4 mb-4">
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
          {([
            { key: "fix" as const, label: "Plan Fixe 90J", sub: "Revenus stables" },
            { key: "activities" as const, label: "Activités", sub: "Produits spéciaux" },
          ]).map(t => (
            <button key={t.key} data-testid={`tab-${t.key}`}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-2.5 rounded-xl text-sm transition-all ${
                activeTab === t.key ? "text-black shadow" : "text-gray-400"
              }`}
              style={activeTab === t.key ? { background: "linear-gradient(135deg, #F59E0B, #D97706)" } : {}}>
              <p className={`font-bold text-sm ${activeTab === t.key ? "text-black" : "text-gray-500"}`}>{t.label}</p>
              <p className={`text-[10px] ${activeTab === t.key ? "text-black/60" : "text-gray-400"}`}>{t.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* FIXED PLANS */}
      {activeTab === "fix" && (
        <div className="px-4 space-y-3">
          {fixedPlan.plans.map((plan) => (
            <div key={plan.vip} data-testid={`plan-card-${plan.vip}`}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">

              {/* Top image band */}
              <div className="relative h-36 overflow-hidden">
                <img src="/sinopec-logo.jpeg" alt={plan.name}
                  className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-2 left-2 text-white text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                  90 jours
                </div>
                <div className="absolute bottom-2 left-3">
                  <p className="text-white font-extrabold text-lg leading-none">{plan.name}</p>
                  <p className="text-white/70 text-xs">Plan d'investissement fixe</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                {[
                  { label: "Prix", value: plan.amount.toLocaleString("fr-FR"), unit: "FCFA" },
                  { label: "Gain/jour", value: plan.dailyGain.toLocaleString("fr-FR"), unit: "FCFA" },
                  { label: "Total", value: plan.totalGain.toLocaleString("fr-FR"), unit: "FCFA", gold: true },
                ].map((s, i) => (
                  <div key={i} className="py-3 text-center">
                    <p className="text-gray-400 text-[10px] mb-0.5">{s.label}</p>
                    <p className={`font-extrabold text-sm ${s.gold ? "text-amber-500" : "text-gray-800"}`}>{s.value}</p>
                    <p className="text-gray-400 text-[9px]">{s.unit}</p>
                  </div>
                ))}
              </div>

              <div className="px-4 py-3">
                <p className="text-gray-400 text-xs italic mb-3">
                  Gains crédités à la fin des 90j sur solde retirable :{" "}
                  <span className="text-amber-500 font-semibold not-italic">{plan.totalGain.toLocaleString("fr-FR")} FCFA</span>
                </p>
                <button data-testid={`invest-vip-${plan.vip}`}
                  onClick={() => openConfirmFixed(plan)} disabled={investMutation.isPending}
                  className="w-full py-3.5 font-bold rounded-2xl text-sm disabled:opacity-60 flex items-center justify-center gap-2 text-black"
                  style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
                  Acheter ce plan <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ACTIVITIES */}
      {activeTab === "activities" && (
        <div className="px-4 space-y-3">

          {!hasActiveFixed && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-amber-700 font-bold text-sm">Plan Fixe requis</p>
                <p className="text-amber-600 text-xs mt-0.5">Achetez d'abord le plan fixe 90J pour débloquer les activités.</p>
              </div>
            </div>
          )}

          {loadingProducts && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                  <div className="h-36 bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-50 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingProducts && availableProducts.length === 0 && (
            <EmptyState text="Aucun produit disponible"
              subtext="Les produits d'activité seront disponibles prochainement." />
          )}

          {!loadingProducts && availableProducts.map((product: any) => {
            const isLaunched = !product.launchDate || new Date(product.launchDate) <= new Date();
            const isBuying = investMutation.isPending && buyingProductId === product.id;
            const sessionStart = product.launchDate ? new Date(product.launchDate) : new Date(product.createdAt);
            const alreadyOwned = (userInvestments as any[]).some(
              (i: any) => i.productId === product.id && i.planType === "activity" && new Date(i.startDate) >= sessionStart
            );

            return (
              <div key={product.id} data-testid={`product-card-${product.id}`}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">

                {/* Product image */}
                <div className="relative h-40 overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <PackageX className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  {/* Duration badge */}
                  <div className="absolute top-2 left-2 text-white text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                    {product.cycleDays}j
                  </div>

                  {alreadyOwned && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      ✓ Acheté
                    </div>
                  )}

                  <div className="absolute bottom-2 left-3">
                    <p className="text-white font-extrabold text-base leading-none">{product.name}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                  {[
                    { label: "Prix",      value: product.price.toLocaleString("fr-FR"),      unit: "FCFA" },
                    { label: "Gain/jour", value: product.dailyGain.toLocaleString("fr-FR"),  unit: "FCFA" },
                    { label: "Total",     value: product.totalGain.toLocaleString("fr-FR"),  unit: "FCFA", gold: true },
                  ].map((s, i) => (
                    <div key={i} className="py-3 text-center">
                      <p className="text-gray-400 text-[10px] mb-0.5">{s.label}</p>
                      <p className={`font-extrabold text-sm ${s.gold ? "text-amber-500" : "text-gray-800"}`}>{s.value}</p>
                      <p className="text-gray-400 text-[9px]">{s.unit}</p>
                    </div>
                  ))}
                </div>

                {product.description && (
                  <p className="text-gray-400 text-xs italic px-4 pt-3">{product.description}</p>
                )}

                <div className="px-4 py-3">
                  {!isLaunched ? (
                    <div className="w-full py-3 bg-gray-50 rounded-2xl text-center text-xs text-gray-400 font-medium border border-gray-100 flex items-center justify-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Disponible le {new Date(product.launchDate).toLocaleDateString("fr-FR")}
                    </div>
                  ) : !hasActiveFixed ? (
                    <div className="w-full py-3 bg-amber-50 border border-amber-100 rounded-2xl text-center text-xs text-amber-600 font-medium flex items-center justify-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Plan Fixe 90J requis
                    </div>
                  ) : product.isVipLocked ? (
                    <div className="w-full py-3 bg-gray-50 border border-gray-200 rounded-2xl text-center text-xs text-gray-500 font-medium flex items-center justify-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      {maxVip === 1 ? "Plan Fixe S2 requis" : "Plan Fixe S3 requis"}
                    </div>
                  ) : product.isLimitReached ? (
                    <div className="w-full py-3 bg-gray-50 rounded-2xl text-center text-xs text-gray-400 font-medium border border-gray-100">
                      Limite atteinte
                    </div>
                  ) : (
                    <button data-testid={`buy-product-${product.id}`}
                      onClick={() => openConfirmProduct(product)}
                      disabled={isBuying || investMutation.isPending}
                      className="w-full py-3.5 font-bold rounded-2xl text-sm disabled:opacity-60 flex items-center justify-center gap-2 text-black"
                      style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
                      {isBuying ? "Achat en cours..." : (<>Acheter ce produit <ChevronRight className="w-4 h-4" /></>)}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation modal */}
      {confirmItem && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-t-3xl overflow-hidden shadow-2xl bg-white max-h-[85vh] overflow-y-auto">

            {/* Product image */}
            <div className="relative w-full h-48">
              <img
                src={confirmItem.imageUrl || "/sinopec-logo.jpeg"}
                alt={confirmItem.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <button data-testid="modal-close"
                onClick={() => { setConfirmItem(null); setBuyingProductId(null); }}
                className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="absolute bottom-3 left-4">
                <p className="text-white font-extrabold text-xl">{confirmItem.name}</p>
                <p className="text-white/70 text-xs">{confirmItem.duration} jours</p>
              </div>
            </div>

            <div className="px-5 pt-4 pb-2 text-center">
              <p className="text-gray-400 text-xs">Montant à investir</p>
              <p className="text-amber-500 font-black text-4xl tracking-tight">
                {confirmItem.price.toLocaleString("fr-FR")}
                <span className="text-xl ml-1 font-bold">FCFA</span>
              </p>
            </div>

            <div className="mx-5 mb-2 rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden">
              <div className="px-5 pt-4 pb-3 space-y-3">
                {[
                  { label: "Durée du cycle", value: `${confirmItem.duration} jours` },
                  { label: "Gain par jour",  value: `FCFA ${confirmItem.dailyGain.toLocaleString("fr-FR")}` },
                  { label: "Gain total",     value: `FCFA ${confirmItem.totalGain.toLocaleString("fr-FR")}`, gold: true },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">{r.label}</span>
                    <span className={`font-bold text-sm ${r.gold ? "text-amber-500" : "text-gray-800"}`}>{r.value}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2">
                  <p className="text-gray-400 text-xs text-center">Gains crédités à la fin du cycle sur solde retirable</p>
                </div>
              </div>
              <div className="flex gap-3 px-5 pb-5 pt-2">
                <button data-testid="modal-cancel"
                  onClick={() => { setConfirmItem(null); setBuyingProductId(null); }}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-500 font-bold rounded-2xl text-sm">
                  Annuler
                </button>
                <button data-testid="modal-confirm" onClick={handleConfirm} disabled={investMutation.isPending}
                  className="flex-1 py-3.5 font-bold rounded-2xl text-sm text-black disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
                  {investMutation.isPending ? "Traitement..." : "Confirmer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
