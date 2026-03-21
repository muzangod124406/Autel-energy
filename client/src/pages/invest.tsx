import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { INVESTMENT_PLANS, formatCFA } from "@/lib/constants";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, TrendingUp, Zap, Calendar, PackageX, Clock, ShoppingBag, ShieldAlert } from "lucide-react";

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
      toast({ title: "Solde de recharge insuffisant", description: "Rechargez votre compte", variant: "destructive" });
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
      toast({ title: "Solde de recharge insuffisant", description: "Rechargez votre compte", variant: "destructive" });
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

  // Filter admin products: only active and with remaining stock
  const availableProducts = (adminProducts as any[]).filter((p: any) => {
    if (!p.isActive) return false;
    if (p.purchaseLimit > 0 && p.purchaseCount >= p.purchaseLimit) return false;
    return true;
  });

  const tabs = [
    { key: "fix" as const, label: "Fixé 120J" },
    { key: "activities" as const, label: "Activités" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-4 pt-6">
        <h1 className="text-white text-xl font-bold text-center">Investir</h1>
        <p className="text-white/70 text-sm text-center mt-1">Solde recharge: {formatCFA(user?.depositBalance || 0)}</p>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-3">
        <div className="flex gap-1 bg-white dark:bg-gray-900 rounded-xl p-1 shadow-sm mb-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              data-testid={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* FIXED 120-DAY PLANS */}
        {activeTab === "fix" && (
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-3 flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Les gains sont crédités à la fin du cycle de <strong>120 jours</strong>
              </p>
            </div>
            {fixedPlan.plans.map((plan) => (
              <Card key={plan.vip} className="p-4 bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">VIP {plan.vip}</h3>
                      <p className="text-xs text-muted-foreground">Fixé 120 jours</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">120j</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Investissement</p>
                    <p className="text-sm font-bold text-blue-600">{formatCFA(plan.amount)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Gain/jour</p>
                    <p className="text-sm font-bold text-green-600">{formatCFA(plan.dailyGain)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Gain total</p>
                    <p className="text-sm font-bold text-purple-600">{formatCFA(plan.totalGain)}</p>
                  </div>
                </div>

                <Button
                  data-testid={`invest-vip-${plan.vip}`}
                  size="sm"
                  onClick={() => handleInvestFixed(plan)}
                  disabled={investMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                >
                  <Lock className="w-3 h-3 mr-1" /> Investir {formatCFA(plan.amount)}
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* ACTIVITIES — admin-created products */}
        {activeTab === "activities" && (
          <div className="space-y-3">
            {/* Lock gate: must have active fixed plan */}
            {!hasActiveFixed && (
              <Card className="p-8 text-center border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
                <ShieldAlert className="w-12 h-12 mx-auto text-orange-400 mb-3" />
                <p className="text-orange-700 dark:text-orange-300 font-bold text-base mb-1">
                  Accès verrouillé
                </p>
                <p className="text-orange-600 dark:text-orange-400 text-sm mb-4">
                  Vous devez d'abord acheter le plan <strong>Fixé 120J</strong> pour débloquer l'accès aux produits d'activité.
                </p>
                <button
                  onClick={() => setActiveTab("fix")}
                  className="bg-orange-500 text-white font-bold px-5 py-2.5 rounded-full text-sm"
                  data-testid="btn-go-to-fixed"
                >
                  Voir le plan Fixé 120J →
                </button>
              </Card>
            )}

            {hasActiveFixed && loadingProducts && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </Card>
                ))}
              </div>
            )}

            {hasActiveFixed && !loadingProducts && availableProducts.length === 0 && (
              <Card className="p-8 text-center">
                <PackageX className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 dark:text-gray-400 font-semibold text-base mb-1">
                  Produits d'activité non disponibles
                </p>
                <p className="text-gray-400 text-sm">
                  Les produits d'activité ne sont pas disponibles aujourd'hui, veuillez revenir plus tard
                </p>
              </Card>
            )}

            {hasActiveFixed && !loadingProducts && availableProducts.length > 0 && availableProducts.map((product: any) => {
                const remaining = product.purchaseLimit > 0
                  ? product.purchaseLimit - product.purchaseCount
                  : null;
                const isLaunched = !product.launchDate || new Date(product.launchDate) <= new Date();

                return (
                  <Card key={product.id} className="overflow-hidden bg-white dark:bg-gray-900" data-testid={`product-card-${product.id}`}>
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-36 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="font-bold text-base">{product.name}</h3>
                          {product.launchDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Calendar className="w-3 h-3" />
                              <span>Lancement: {new Date(product.launchDate).toLocaleString("fr-FR")}</span>
                            </div>
                          )}
                        </div>
                        {remaining !== null && (
                          <Badge variant={remaining <= 5 ? "destructive" : "secondary"} className="text-[10px] flex-shrink-0">
                            {remaining} restant{remaining > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                          <p className="text-[10px] text-muted-foreground">Prix</p>
                          <p className="text-sm font-bold text-blue-600">{formatCFA(product.price)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                          <p className="text-[10px] text-muted-foreground">Gain/jour</p>
                          <p className="text-sm font-bold text-green-600">{formatCFA(product.dailyGain)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                          <p className="text-[10px] text-muted-foreground">Gain total</p>
                          <p className="text-sm font-bold text-purple-600">{formatCFA(product.totalGain)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>Cycle: {product.cycleDays} jours</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ShoppingBag className="w-3 h-3" />
                          <span>{product.purchaseCount} acheté{product.purchaseCount > 1 ? "s" : ""}</span>
                        </div>
                      </div>

                      {!isLaunched ? (
                        <div className="w-full py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-center text-xs text-gray-500 font-medium">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Disponible le {new Date(product.launchDate).toLocaleString("fr-FR")}
                        </div>
                      ) : (
                        <Button
                          data-testid={`buy-product-${product.id}`}
                          size="sm"
                          onClick={() => handleBuyProduct(product)}
                          disabled={investMutation.isPending && buyingProductId === product.id}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                        >
                          <ShoppingBag className="w-3 h-3 mr-1" />
                          {investMutation.isPending && buyingProductId === product.id
                            ? "Achat en cours..."
                            : `Acheter — ${formatCFA(product.price)}`}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
