import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { INVESTMENT_PLANS, formatCFA } from "@/lib/constants";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Lock, Calendar, ChevronRight, X, PackageX, TrendingUp } from "lucide-react";
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

  const availableProducts = (adminProducts as any[]).filter((p: any) => {
    if (!p.isActive) return false;
    if (p.purchaseLimit > 0 && p.purchaseCount >= p.purchaseLimit) return false;
    return true;
  });

  const cardBase = "rounded-2xl overflow-hidden border border-[#252538] bg-[#12121E]";
  const rowLabel = "text-[#888899] text-xs";
  const rowValue = "text-white font-semibold text-xs";

  return (
    <div className="min-h-screen pb-28" style={{ background: "linear-gradient(160deg, #0B0B14 0%, #0D0D1A 100%)" }}>

      {/* ── Bannière titre ─────────────────────────── */}
      <div className="mx-4 mt-4 mb-1 rounded-2xl overflow-hidden relative border border-amber-500/20"
        style={{ background: "linear-gradient(135deg, #1a1000 0%, #2a1800 50%, #201200 100%)", minHeight: 86 }}>
        <div className="absolute inset-0 opacity-8"
          style={{ backgroundImage: "repeating-linear-gradient(45deg,#F59E0B 0,#F59E0B 1px,transparent 0,transparent 8px)", backgroundSize: "12px 12px" }} />
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-10">
          <TrendingUp className="w-24 h-24 text-amber-500" />
        </div>
        <div className="relative px-5 py-4">
          <p className="text-amber-500/60 font-semibold text-xs uppercase tracking-widest">SINOPEC</p>
          <p className="text-white font-extrabold text-2xl leading-tight">Liste des produits</p>
          <p className="text-amber-400/80 font-bold text-lg leading-tight">d'investissement</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex px-4 gap-3 pt-5 mb-4">
        <button data-testid="tab-fix" onClick={() => setActiveTab("fix")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "fix" ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" : "bg-[#1a1a28] text-[#888899] border border-[#252538]"
          }`}>
          Fixe
        </button>
        <button data-testid="tab-activities" onClick={() => setActiveTab("activities")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "activities" ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" : "bg-[#1a1a28] text-[#888899] border border-[#252538]"
          }`}>
          Activités
        </button>
      </div>

      {/* ── FIXED PLANS ─────────────────────────────── */}
      {activeTab === "fix" && (
        <div className="px-3 space-y-3">
          {fixedPlan.plans.map((plan) => (
            <div key={plan.vip} data-testid={`plan-card-${plan.vip}`} className={cardBase}>
              <div className="flex gap-3 p-3 pb-2">
                <div className="relative flex-shrink-0">
                  <img src="/sinopec-logo.jpeg" alt={plan.name} className="w-24 h-24 rounded-xl object-cover" />
                  <span className="absolute top-1.5 left-1.5 bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    120jours
                  </span>
                </div>
                <div className="flex-1 pt-0.5 space-y-1.5">
                  <p className="font-bold text-white text-sm">{plan.name}</p>
                  <div className="flex justify-between">
                    <span className={rowLabel}>Prix:</span>
                    <span className={rowValue}>{plan.amount.toLocaleString("fr-FR")}.00 XAF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={rowLabel}>Revenu/jour:</span>
                    <span className={rowValue}>{plan.dailyGain.toLocaleString("fr-FR")}.00 XAF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={rowLabel}>Revenu total:</span>
                    <span className="text-amber-400 font-bold text-xs">{plan.totalGain.toLocaleString("fr-FR")}.00 XAF</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-[#252538] mx-3" />
              <p className="text-[#888899] text-[11px] italic px-3 py-1.5">
                Gains bloqués 120 jours. À la fin :{" "}
                <span className="font-semibold text-amber-400 not-italic">{plan.totalGain.toLocaleString("fr-FR")} FCFA</span> sur solde retirable.
              </p>
              <div className="px-3 pb-3">
                <button data-testid={`invest-vip-${plan.vip}`} onClick={() => openConfirmFixed(plan)} disabled={investMutation.isPending}
                  className="w-full py-3 font-bold rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-1 text-black"
                  style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
                  ACHETER <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ACTIVITIES ───────────────────────────────── */}
      {activeTab === "activities" && (
        <div className="px-3 space-y-3">
          {loadingProducts && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className={`${cardBase} p-3 animate-pulse`}>
                  <div className="flex gap-3">
                    <div className="w-24 h-24 bg-[#1a1a28] rounded-xl" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-[#1a1a28] rounded w-3/4" />
                      <div className="h-2.5 bg-[#252538] rounded w-1/2" />
                      <div className="h-2.5 bg-[#252538] rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingProducts && availableProducts.length === 0 && (
            <div className="px-4">
              <EmptyState text="Aucun produit disponible"
                subtext="Les produits d'activité ne sont pas disponibles aujourd'hui, revenez plus tard." />
            </div>
          )}

          {!loadingProducts && availableProducts.map((product: any) => {
            const isLaunched = !product.launchDate || new Date(product.launchDate) <= new Date();
            const isBuying = investMutation.isPending && buyingProductId === product.id;
            const sessionStart = product.launchDate ? new Date(product.launchDate) : new Date(product.createdAt);
            const alreadyOwned = (userInvestments as any[]).some(
              (i: any) => i.productId === product.id && i.planType === "activity" && new Date(i.startDate) >= sessionStart
            );
            return (
              <div key={product.id} data-testid={`product-card-${product.id}`} className={cardBase}>
                <div className="flex gap-3 p-3 pb-2">
                  <div className="relative flex-shrink-0">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-24 h-24 rounded-xl object-cover" />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-[#1a1a28] flex items-center justify-center">
                        <PackageX className="w-8 h-8 text-[#555570]" />
                      </div>
                    )}
                    <span className="absolute top-1.5 left-1.5 bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      {product.cycleDays}jours
                    </span>
                    {alreadyOwned && (
                      <span className="absolute top-1.5 right-1.5 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        ✓ Acheté
                      </span>
                    )}
                  </div>
                  <div className="flex-1 pt-0.5 space-y-1.5">
                    <p className="font-bold text-white text-sm">{product.name}</p>
                    <div className="flex justify-between">
                      <span className={rowLabel}>Prix:</span>
                      <span className={rowValue}>{product.price.toLocaleString("fr-FR")}.00 XAF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={rowLabel}>Revenu/jour:</span>
                      <span className={rowValue}>{product.dailyGain.toLocaleString("fr-FR")}.00 XAF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={rowLabel}>Revenu total:</span>
                      <span className="text-amber-400 font-bold text-xs">{product.totalGain.toLocaleString("fr-FR")}.00 XAF</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-[#252538] mx-3" />
                <p className="text-[#888899] text-[11px] italic px-3 py-1.5">
                  {product.description
                    ? product.description
                    : <>Gains crédités fin de cycle {product.cycleDays}j. Total : <span className="font-semibold text-amber-400 not-italic">{product.totalGain.toLocaleString("fr-FR")} FCFA</span>.</>}
                </p>
                <div className="px-3 pb-3">
                  {!isLaunched ? (
                    <div className="w-full py-3 bg-[#1a1a28] rounded-xl text-center text-xs text-[#888899] font-medium border border-[#252538]">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Disponible le {new Date(product.launchDate).toLocaleDateString("fr-FR")}
                    </div>
                  ) : !hasActiveFixed ? (
                    <div className="w-full py-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-center text-xs text-amber-400 font-medium flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3" /> Plan Fixe 120J requis
                    </div>
                  ) : (
                    <button data-testid={`buy-product-${product.id}`} onClick={() => openConfirmProduct(product)}
                      disabled={isBuying || investMutation.isPending}
                      className="w-full py-3 font-bold rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-1 text-black"
                      style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
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
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/75 px-4 pb-44 overlay-fade-in">
          <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-amber-500/20 max-h-[80vh] overflow-y-auto modal-zoom-in"
            style={{ background: "linear-gradient(160deg, #12121E 0%, #1a1a2a 100%)" }}>
            <div className="relative w-full h-44">
              {confirmItem.imageUrl ? (
                <img src={confirmItem.imageUrl} alt={confirmItem.name} className="w-full h-full object-cover" />
              ) : (
                <img src="/sinopec-logo.jpeg" alt={confirmItem.name} className="w-full h-full object-cover" />
              )}
              <button data-testid="modal-close"
                onClick={() => { setConfirmItem(null); setBuyingProductId(null); }}
                className="absolute top-3 right-3 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center border border-white/20">
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-16" />
            </div>

            <div className="pt-4 pb-2 text-center">
              <p className="text-amber-400 font-black text-3xl tracking-tight">
                FCFA {confirmItem.price.toLocaleString("fr-FR")}
              </p>
            </div>

            <div className="mx-4 mb-4 rounded-2xl overflow-hidden border border-amber-500/20"
              style={{ background: "linear-gradient(135deg, #1a1000 0%, #2a1800 100%)" }}>
              <div className="px-5 pt-4 pb-3 space-y-3">
                <div className="flex justify-between">
                  <span className="text-amber-400/70 text-sm">Durée du cycle :</span>
                  <span className="text-white font-bold text-sm">{confirmItem.duration} jours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-400/70 text-sm">Gain/jour :</span>
                  <span className="text-white font-bold text-sm">FCFA {confirmItem.dailyGain.toLocaleString("fr-FR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-400/70 text-sm">Gain total :</span>
                  <span className="text-amber-400 font-bold text-sm">FCFA {confirmItem.totalGain.toLocaleString("fr-FR")}</span>
                </div>
                <div className="border-t border-amber-500/20 pt-2">
                  <p className="text-amber-400/50 text-xs text-center">⏳ Gains crédités à la fin du cycle sur solde retirable</p>
                </div>
              </div>
              <div className="flex gap-3 px-5 pb-5 pt-2">
                <button data-testid="modal-cancel"
                  onClick={() => { setConfirmItem(null); setBuyingProductId(null); }}
                  className="flex-1 py-3 bg-[#1a1a28] border border-[#252538] text-[#888899] font-bold rounded-2xl text-sm">
                  Annuler
                </button>
                <button data-testid="modal-confirm" onClick={handleConfirm} disabled={investMutation.isPending}
                  className="flex-1 py-3 font-bold rounded-2xl text-sm text-black disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
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
