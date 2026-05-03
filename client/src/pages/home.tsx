import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownToLine, ArrowUpFromLine, FileText, Headset, Wallet, Gift, TrendingUp, Zap } from "lucide-react";
import rewardIcon from "@assets/reward_icon_1773608863536.png";

export default function HomePage() {
  const { user, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });
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

  const handleTelegramGroup = () => {
    const url = settings?.telegramGroup;
    if (url) window.open(url, "_blank");
  };

  const ACTION_BUTTONS = [
    { label: "Recharger", icon: <ArrowDownToLine className="w-6 h-6" />, onClick: () => navigate("/deposit"), testId: "button-recharge", color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400" },
    { label: "Retrait", icon: <ArrowUpFromLine className="w-6 h-6" />, onClick: () => navigate("/withdraw"), testId: "button-withdraw", color: "from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400" },
    { label: "Billet", icon: <FileText className="w-6 h-6" />, onClick: () => navigate("/billet"), testId: "button-billet", color: "from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400" },
    { label: "Support", icon: <Headset className="w-6 h-6" />, onClick: () => navigate("/service-client"), testId: "button-service-client", color: "from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400" },
  ];

  return (
    <div className="min-h-screen pb-28" style={{ background: "linear-gradient(160deg, #0B0B14 0%, #0D0D1A 60%, #0F0F1E 100%)" }}>

      {/* ── Header ──────────────────────────────────── */}
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-500/30 shadow-md shadow-amber-500/10">
              <img src="/sinopec-logo.jpeg" alt="logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[#888899] text-xs">Bienvenue,</p>
              <p className="text-white font-bold text-base">{user.nickname || user.phone}</p>
            </div>
          </div>
          <button data-testid="button-wallet" onClick={handleTelegramGroup}
            className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-amber-500" />
          </button>
        </div>

        {/* ── Balance card ─────────────────────────── */}
        <div className="rounded-3xl p-5 mb-5 relative overflow-hidden border border-amber-500/20"
          style={{ background: "linear-gradient(135deg, #1a1200 0%, #201800 50%, #1a1400 100%)" }}>
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: "repeating-linear-gradient(45deg,#F59E0B 0,#F59E0B 1px,transparent 0,transparent 10px)", backgroundSize: "16px 16px" }} />
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #F59E0B 0%, transparent 70%)" }} />
          <div className="relative">
            <p className="text-amber-500/60 text-xs uppercase tracking-widest mb-3">Mes Soldes</p>
            <div className="flex gap-8">
              <div>
                <p className="text-amber-500/70 text-xs mb-0.5">Solde de recharge</p>
                <p className="text-white font-bold text-xl" data-testid="text-deposit-balance">
                  {user.depositBalance.toFixed(2)} <span className="text-amber-500 text-sm">XAF</span>
                </p>
              </div>
              <div className="w-px bg-amber-500/20" />
              <div>
                <p className="text-amber-500/70 text-xs mb-0.5">Solde de retrait</p>
                <p className="text-white font-bold text-xl" data-testid="text-withdraw-balance">
                  {user.withdrawBalance.toFixed(2)} <span className="text-amber-500 text-sm">XAF</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Action buttons ───────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          {ACTION_BUTTONS.map(btn => (
            <button key={btn.label} data-testid={btn.testId} onClick={btn.onClick}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-br border ${btn.color} transition-all active:scale-95`}>
              {btn.icon}
              <span className="text-[10px] font-semibold text-white/80">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-3">

        {/* ── Bonus connexion ──────────────────────── */}
        <button
          data-testid="button-daily-bonus"
          onClick={() => !dailyBonusMutation.isPending && dailyBonusMutation.mutate()}
          disabled={dailyBonusMutation.isPending || todayClaimed}
          className="w-full flex items-center justify-between rounded-2xl px-5 py-4 border transition-all disabled:opacity-60"
          style={{
            background: todayClaimed
              ? "linear-gradient(135deg, #1a1a28 0%, #1e1e30 100%)"
              : "linear-gradient(135deg, #1a0a00 0%, #2a1200 50%, #1f0e00 100%)",
            borderColor: todayClaimed ? "#252538" : "rgba(245,158,11,0.25)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${todayClaimed ? "bg-[#252538]" : "bg-amber-500/20 border border-amber-500/30"}`}>
              <Gift className={`w-5 h-5 ${todayClaimed ? "text-[#888899]" : "text-amber-500"}`} />
            </div>
            <div className="text-left">
              <p className={`font-bold text-sm ${todayClaimed ? "text-[#888899]" : "text-amber-400"}`}>
                {todayClaimed ? "Bonus réclamé ✓" : "Bonus de connexion"}
              </p>
              <p className="text-[#888899] text-xs">{todayClaimed ? "Revenez demain" : "+50 FCFA sur votre solde"}</p>
            </div>
          </div>
          {!todayClaimed && (
            <div className="flex items-center gap-1 bg-amber-500 text-black text-xs font-bold px-3 py-1.5 rounded-full">
              <Zap className="w-3 h-3" />
              Réclamer
            </div>
          )}
        </button>

        {/* ── Investissement promo ─────────────────── */}
        <div className="rounded-2xl overflow-hidden border border-amber-500/15"
          style={{ background: "linear-gradient(135deg, #0d1117 0%, #0f1520 50%, #0d1117 100%)" }}>
          <div className="absolute inset-0 opacity-5"
            style={{ background: "radial-gradient(circle at 80% 50%, #F59E0B 0%, transparent 60%)" }} />
          <div className="flex items-center p-5 gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <p className="text-amber-500 text-xs font-semibold uppercase tracking-wider">Jeu de récompenses</p>
              </div>
              <h3 className="text-white text-lg font-bold leading-tight">Roue de la Fortune</h3>
              <p className="text-[#888899] text-xs leading-relaxed">
                Invitez des amis et gagnez des tours gratuits !
              </p>
              <button
                onClick={() => navigate("/game")}
                data-testid="button-play-game"
                className="mt-1 inline-flex items-center gap-1 text-black text-xs font-bold px-4 py-2 rounded-full"
                style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
              >
                Jouer maintenant →
              </button>
            </div>
            <div className="shrink-0">
              <img src={rewardIcon} alt="cadeau" className="w-24 h-24 object-contain drop-shadow-lg" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
