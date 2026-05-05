import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatCFA } from "@/lib/constants";
import { ArrowLeft, Clock, TrendingUp, CheckCircle2, Loader2, Gift } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EmptyState from "@/components/empty-state";

function useNow(interval = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "0min";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d}j ${h}h`;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

function InvestmentCard({ inv, productMap, now }: { inv: any; productMap: Record<string, any>; now: number }) {
  const { toast } = useToast();

  const endMs = new Date(inv.endDate).getTime();
  const startMs = new Date(inv.startDate).getTime();
  const totalMs = endMs - startMs;
  const elapsedMs = now - startMs;
  const remainingMs = endMs - now;
  const isExpired = remainingMs <= 0;
  const isActive = inv.status !== "completed" && !isExpired;

  const progressPct = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
  const elapsedDays = Math.floor(elapsedMs / 86400000);
  const totalDays = inv.duration;

  // Gain availability
  const GAIN_INTERVAL = 24 * 60 * 60 * 1000;
  const lastGainMs = inv.lastGainDate ? new Date(inv.lastGainDate).getTime() : null;
  const nextGainMs = lastGainMs ? lastGainMs + GAIN_INTERVAL : startMs + GAIN_INTERVAL;
  const gainAvailable = isActive && now >= nextGainMs;
  const msUntilGain = nextGainMs - now;

  const planName = inv.planType === "activity"
    ? (inv.productName || "Activité")
    : `SINOPEC S${inv.vipLevel}`;
  const productImg = inv.productId && productMap[inv.productId]?.imageUrl;
  const imgSrc = productImg || "/sinopec-logo.jpeg";

  const collectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/user/investments/${inv.id}/collect`, {});
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: `+${formatCFA(data.dailyGain)} crédité !`, description: `Jour ${data.collectedDays}/${inv.duration} collecté sur votre solde retirable.` });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      {/* Image + nom */}
      <div className="relative h-28 overflow-hidden">
        <img src={imgSrc} alt={planName} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
          <div>
            <p className="text-white font-extrabold text-base leading-none">{planName}</p>
            <p className="text-white/70 text-xs mt-0.5">
              {inv.planType === "fix" ? "Plan Fixe 90 jours" : "Produit Activité"}
            </p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            isActive ? "bg-emerald-500 text-white" : "bg-gray-400 text-white"
          }`}>
            {isActive ? "Actif" : "Terminé"}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats grille */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 rounded-xl py-2">
            <p className="text-gray-400 text-[10px] mb-0.5">Prix</p>
            <p className="text-gray-800 font-bold text-xs">{(inv.amount).toLocaleString("fr-FR")}</p>
            <p className="text-gray-400 text-[9px]">FCFA</p>
          </div>
          <div className="bg-gray-50 rounded-xl py-2">
            <p className="text-gray-400 text-[10px] mb-0.5">Gain/jour</p>
            <p className="text-amber-600 font-bold text-xs">{(inv.dailyGain).toLocaleString("fr-FR")}</p>
            <p className="text-gray-400 text-[9px]">FCFA</p>
          </div>
          <div className="bg-gray-50 rounded-xl py-2">
            <p className="text-gray-400 text-[10px] mb-0.5">Total</p>
            <p className="text-emerald-600 font-bold text-xs">{(inv.totalGain).toLocaleString("fr-FR")}</p>
            <p className="text-gray-400 text-[9px]">FCFA</p>
          </div>
        </div>

        {/* Barre de progression */}
        {isActive && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Progression</span>
              <span className="text-gray-600 font-semibold">
                Jour {Math.min(elapsedDays, totalDays)} / {totalDays}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, #F59E0B, #D97706)",
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>{progressPct.toFixed(0)}% écoulé</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(remainingMs)} restants
              </span>
            </div>
          </div>
        )}

        {/* Jours collectés */}
        {isActive && (
          <div className="flex items-center justify-between bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-amber-700 font-semibold text-xs">
                  {inv.collectedDays || 0} jour{(inv.collectedDays || 0) > 1 ? "s" : ""} collecté{(inv.collectedDays || 0) > 1 ? "s" : ""}
                </p>
                <p className="text-amber-500 text-[10px]">
                  = {formatCFA((inv.collectedDays || 0) * inv.dailyGain)} perçus
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-amber-700 font-semibold text-xs">
                {totalDays - (inv.collectedDays || 0)} restants
              </p>
              <p className="text-amber-500 text-[10px]">
                = {formatCFA((totalDays - (inv.collectedDays || 0)) * inv.dailyGain)} à venir
              </p>
            </div>
          </div>
        )}

        {/* Bouton Collecter ou countdown */}
        {isActive && (
          gainAvailable ? (
            <button
              data-testid={`btn-collect-${inv.id}`}
              onClick={() => collectMutation.mutate()}
              disabled={collectMutation.isPending}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-black flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
            >
              {collectMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Collecte en cours...</>
              ) : (
                <><TrendingUp className="w-4 h-4" /> Collecter {formatCFA(inv.dailyGain)}</>
              )}
            </button>
          ) : (
            <div className="w-full py-3 rounded-2xl border border-gray-100 bg-gray-50 text-center">
              <p className="text-gray-400 text-xs flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Prochain gain dans{" "}
                <span className="font-bold text-gray-600">{formatDuration(msUntilGain)}</span>
              </p>
            </div>
          )
        )}

        {/* Terminé */}
        {!isActive && (
          <div className="w-full py-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center gap-2 text-gray-400 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Cycle terminé — {formatCFA(inv.totalGain)} versés
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [, navigate] = useLocation();
  const now = useNow(30000);

  const { data: investments = [], isLoading } = useQuery({
    queryKey: ["/api/user/investments"],
    refetchInterval: 30000,
  });
  const { data: products = [] } = useQuery<any[]>({ queryKey: ["/api/products"] });

  const productMap = (products as any[]).reduce((acc: any, p: any) => { acc[p.id] = p; return acc; }, {});
  const list = investments as any[];
  const active = list.filter(inv => inv.status !== "completed" && new Date(inv.endDate) > new Date());
  const totalDaily = active.reduce((sum: number, inv: any) => sum + inv.dailyGain, 0);
  const gainAvailableCount = active.filter(inv => {
    const GAIN_INTERVAL = 24 * 60 * 60 * 1000;
    const lastGainMs = inv.lastGainDate ? new Date(inv.lastGainDate).getTime() : null;
    const startMs = new Date(inv.startDate).getTime();
    const nextGainMs = lastGainMs ? lastGainMs + GAIN_INTERVAL : startMs + GAIN_INTERVAL;
    return Date.now() >= nextGainMs;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate("/account")} data-testid="button-back-orders"
            className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white font-bold text-xl">Mes Produits</h1>
          {gainAvailableCount > 0 && (
            <span className="ml-auto bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {gainAvailableCount} gain{gainAvailableCount > 1 ? "s" : ""} disponible{gainAvailableCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/15 rounded-2xl px-3 py-2.5 border border-white/20">
            <p className="text-white/70 text-[10px] mb-0.5">Gain/jour</p>
            <p className="text-white font-extrabold text-base leading-none">{formatCFA(totalDaily)}</p>
          </div>
          <div className="bg-white/15 rounded-2xl px-3 py-2.5 border border-white/20">
            <p className="text-white/70 text-[10px] mb-0.5">Actifs</p>
            <p className="text-white font-extrabold text-base leading-none">{active.length}</p>
          </div>
          <div className="bg-white/15 rounded-2xl px-3 py-2.5 border border-white/20">
            <p className="text-white/70 text-[10px] mb-0.5">Total</p>
            <p className="text-white font-extrabold text-base leading-none">{list.length}</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {isLoading ? (
          [1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl h-64 animate-pulse shadow-sm border border-gray-100" />
          ))
        ) : list.length === 0 ? (
          <EmptyState text="Aucun produit" subtext="Vous n'avez pas encore souscrit à un produit." />
        ) : (
          list.map((inv: any) => (
            <InvestmentCard key={inv.id} inv={inv} productMap={productMap} now={now} />
          ))
        )}
      </div>
    </div>
  );
}
