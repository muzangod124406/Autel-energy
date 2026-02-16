import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { INVESTMENT_PLANS, formatCFA } from "@/lib/constants";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, TrendingUp, Clock, Zap, Calendar } from "lucide-react";
import BottomNav from "@/components/bottom-nav";

type PlanKey = keyof typeof INVESTMENT_PLANS;

const fixTabs = [
  { key: "fix1" as PlanKey, label: "Fixé 1" },
  { key: "fix2" as PlanKey, label: "Fixé 2" },
  { key: "fix3" as PlanKey, label: "Fixé 3" },
  { key: "activities" as const, label: "Activités" },
];

const activityTabs = [
  { key: "activity_3" as PlanKey, label: "3J" },
  { key: "activity_5" as PlanKey, label: "5J" },
  { key: "activity_15" as PlanKey, label: "15J" },
  { key: "activity_30" as PlanKey, label: "30J" },
];

export default function InvestPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<PlanKey | "activities">("fix1");
  const [activityTab, setActivityTab] = useState<PlanKey>("activity_3");

  const { data: settingsData } = useQuery({ queryKey: ["/api/settings"] });
  const activitiesEnabled = settingsData?.activitiesEnabled !== false;

  const investMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/user/invest", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Investissement réussi", description: "Votre investissement a été enregistré" });
      queryClient.invalidateQueries({ queryKey: ["/api/user/investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      refreshUser();
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
  });

  const currentPlanKey = activeTab === "activities" ? activityTab : activeTab;
  const currentPlan = INVESTMENT_PLANS[currentPlanKey];

  const handleInvest = (plan: any) => {
    if (!user) return;
    if (user.balance < plan.amount) {
      toast({ title: "Solde insuffisant", description: "Rechargez votre compte", variant: "destructive" });
      return;
    }
    investMutation.mutate({
      planType: currentPlanKey,
      vipLevel: plan.vip,
      amount: plan.amount,
      dailyGain: plan.dailyGain,
      duration: currentPlan.duration,
      totalGain: plan.totalGain,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-4 pt-6">
        <h1 className="text-white text-xl font-bold text-center">Investir</h1>
        <p className="text-white/70 text-sm text-center mt-1">Solde: {formatCFA(user?.balance || 0)}</p>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-2">
        <div className="flex gap-1 bg-white dark:bg-gray-900 rounded-xl p-1 shadow-sm">
          {fixTabs.map(tab => (
            <button
              key={tab.key}
              data-testid={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "activities" && (
          <>
            {!activitiesEnabled ? (
              <Card className="mt-4 p-6 text-center">
                <Lock className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 font-medium">Les activités sont temporairement désactivées</p>
              </Card>
            ) : (
              <div className="flex gap-1 mt-3 bg-white dark:bg-gray-900 rounded-lg p-1">
                {activityTabs.map(tab => (
                  <button
                    key={tab.key}
                    data-testid={`tab-${tab.key}`}
                    onClick={() => setActivityTab(tab.key)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                      activityTab === tab.key
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {(activeTab !== "activities" || activitiesEnabled) && (
          <div className="mt-4 space-y-3">
            {currentPlan?.plans.map((plan) => (
              <Card key={plan.vip} className="p-4 bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">VIP {plan.vip}</h3>
                      <p className="text-xs text-muted-foreground">{currentPlan.name} - {currentPlan.duration}j</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {currentPlan.duration}j
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Montant</p>
                    <p className="text-sm font-bold text-blue-600">{formatCFA(plan.amount)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Gain total</p>
                    <p className="text-sm font-bold text-green-600">{formatCFA(plan.totalGain)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3" />
                    <span>{formatCFA(plan.dailyGain)}/jour</span>
                  </div>
                  <Button
                    data-testid={`invest-vip-${plan.vip}`}
                    size="sm"
                    onClick={() => handleInvest(plan)}
                    disabled={investMutation.isPending}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs"
                  >
                    <Lock className="w-3 h-3 mr-1" /> Investir
                  </Button>
                </div>

                <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-600">
                  <Lock className="w-3 h-3" />
                  <span>Gains bloqués et crédités à la fin du cycle</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
