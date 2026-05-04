import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet, Banknote, Gift, BarChart3, Zap,
  ChevronRight, ClipboardList, ShoppingBag,
} from "lucide-react";

export default function HomePage() {
  const { user, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const dailyBonusMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/user/daily-bonus"),
    onSuccess: async () => {
      await refreshUser();
      qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Bonus de connexion : 50 FCFA crédité !" });
    },
    onError: (err: any) => {
      try {
        const raw = err?.message || "";
        const jsonStr = raw.substring(raw.indexOf("{"));
        const data = JSON.parse(jsonStr);
        toast({ title: data?.message || "Bonus déjà réclamé aujourd'hui" });
      } catch { toast({ title: "Bonus déjà réclamé aujourd'hui" }); }
    },
  });

  const todayClaimed = (() => {
    if (!user?.lastDailyBonus) return false;
    return Date.now() - new Date(user.lastDailyBonus).getTime() < 24 * 60 * 60 * 1000;
  })();

  if (!user) return null;

  return (
    <div className="min-h-screen pb-28 bg-gray-50">

      {/* ── Header gold ── */}
      <div className="px-5 pt-7 pb-6" style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-white/40 shadow">
              <img src="/sinopec-logo.jpeg" alt="logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-white/70 text-xs">Bienvenue,</p>
              <p className="text-white font-bold text-base">{user.nickname || user.phone}</p>
            </div>
          </div>
          <button data-testid="button-balance" onClick={() => navigate("/balance")}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
            <BarChart3 className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Balance card */}
        <div className="bg-white/15 rounded-2xl px-5 py-4 border border-white/25">
          <p className="text-white/70 text-xs uppercase tracking-widest mb-3">Mes Soldes</p>
          <div className="flex gap-8">
            <div>
              <p className="text-white/70 text-xs mb-0.5">Solde de recharge</p>
              <p className="text-white font-bold text-xl" data-testid="text-deposit-balance">
                {user.depositBalance.toFixed(2)} <span className="text-white/70 text-sm">FCFA</span>
              </p>
            </div>
            <div className="w-px bg-white/30" />
            <div>
              <p className="text-white/70 text-xs mb-0.5">Solde de retrait</p>
              <p className="text-white font-bold text-xl" data-testid="text-withdraw-balance">
                {user.withdrawBalance.toFixed(2)} <span className="text-white/70 text-sm">FCFA</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="px-5 -mt-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Recharger",
                icon: <Wallet className="w-7 h-7" />,
                onClick: () => navigate("/deposit"),
                testId: "button-recharge",
                color: "bg-emerald-50 text-emerald-600 border border-emerald-100",
              },
              {
                label: "Retrait",
                icon: <Banknote className="w-7 h-7" />,
                onClick: () => navigate("/withdraw"),
                testId: "button-withdraw",
                color: "bg-amber-50 text-amber-600 border border-amber-100",
              },
            ].map(btn => (
              <button
                key={btn.label}
                data-testid={btn.testId}
                onClick={btn.onClick}
                className={`flex flex-col items-center gap-2.5 py-5 rounded-2xl transition-all active:scale-95 ${btn.color}`}
              >
                {btn.icon}
                <span className="text-sm font-bold">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 space-y-3">

        {/* ── Bonus connexion ── */}
        <button
          data-testid="button-daily-bonus"
          onClick={() => !dailyBonusMutation.isPending && dailyBonusMutation.mutate()}
          disabled={dailyBonusMutation.isPending || todayClaimed}
          className="w-full flex items-center justify-between bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm transition-all disabled:opacity-70"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${todayClaimed ? "bg-gray-100" : "bg-amber-50 border border-amber-200"}`}>
              <Gift className={`w-5 h-5 ${todayClaimed ? "text-gray-400" : "text-amber-500"}`} />
            </div>
            <div className="text-left">
              <p className={`font-bold text-sm ${todayClaimed ? "text-gray-400" : "text-gray-900"}`}>
                {todayClaimed ? "Bonus réclamé ✓" : "Bonus de connexion"}
              </p>
              <p className="text-gray-400 text-xs">{todayClaimed ? "Revenez demain" : "+50 FCFA sur votre solde"}</p>
            </div>
          </div>
          {!todayClaimed && (
            <div className="flex items-center gap-1 text-black text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
              <Zap className="w-3 h-3" />
              Réclamer
            </div>
          )}
        </button>

        {/* ── Quick links ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {[
            { label: "Mes transactions", sub: "Historique complet", route: "/transactions", color: "text-purple-500", bg: "bg-purple-50", Icon: ClipboardList },
            { label: "Mes commandes",    sub: "Produits investis",  route: "/orders",       color: "text-blue-500",   bg: "bg-blue-50",   Icon: ShoppingBag },
          ].map(item => (
            <button key={item.route} onClick={() => navigate(item.route)}
              className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <item.Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="text-left">
                  <p className="text-gray-800 font-semibold text-sm">{item.label}</p>
                  <p className="text-gray-400 text-xs">{item.sub}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
