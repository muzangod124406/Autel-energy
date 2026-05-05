import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatCFA } from "@/lib/constants";
import { ArrowLeft, CheckCircle2, Loader2, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EmptyState from "@/components/empty-state";

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-gray-900 rounded-xl w-14 h-14 flex items-center justify-center shadow-inner">
        <span className="text-white font-extrabold text-2xl tabular-nums leading-none">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-gray-400 text-[10px] mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function InvestmentCard({ inv, productMap, now }: { inv: any; productMap: Record<string, any>; now: number }) {
  const { toast } = useToast();

  const endMs = new Date(inv.endDate).getTime();
  const startMs = new Date(inv.startDate).getTime();
  const totalMs = endMs - startMs;
  const remainingMs = Math.max(0, endMs - now);
  const cycleFinished = remainingMs === 0;
  const isCompleted = inv.status === "completed";
  const canCollect = cycleFinished && !isCompleted;

  const progressPct = Math.min(100, Math.max(0, ((now - startMs) / totalMs) * 100));

  const days = Math.floor(remainingMs / 86400000);
  const hours = Math.floor((remainingMs % 86400000) / 3600000);
  const minutes = Math.floor((remainingMs % 3600000) / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);

  const planName = inv.planType === "activity"
    ? (inv.productName || productMap[inv.productId]?.name || "Activité")
    : `SINOPEC S${inv.vipLevel}`;
  const imgSrc = inv.productImage || (inv.productId && productMap[inv.productId]?.imageUrl) || "/sinopec-logo.jpeg";

  const collectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/user/investments/${inv.id}/collect`, {});
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: `+${formatCFA(data.totalGain)} crédité !`,
        description: "Les gains ont été versés sur votre solde retirable.",
      });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      {/* Image */}
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
            isCompleted
              ? "bg-gray-400 text-white"
              : canCollect
              ? "bg-emerald-500 text-white"
              : "bg-amber-500 text-white"
          }`}>
            {isCompleted ? "Terminé" : canCollect ? "À collecter !" : "En cours"}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 rounded-xl py-2.5">
            <p className="text-gray-400 text-[10px] mb-0.5">Mise</p>
            <p className="text-gray-800 font-bold text-sm">{inv.amount.toLocaleString("fr-FR")}</p>
            <p className="text-gray-400 text-[9px]">FCFA</p>
          </div>
          <div className="bg-gray-50 rounded-xl py-2.5">
            <p className="text-gray-400 text-[10px] mb-0.5">Durée</p>
            <p className="text-amber-600 font-bold text-sm">{inv.duration}</p>
            <p className="text-gray-400 text-[9px]">jours</p>
          </div>
          <div className="bg-emerald-50 rounded-xl py-2.5">
            <p className="text-emerald-500 text-[10px] mb-0.5 font-medium">Gain total</p>
            <p className="text-emerald-600 font-extrabold text-sm">{inv.totalGain.toLocaleString("fr-FR")}</p>
            <p className="text-emerald-400 text-[9px]">FCFA</p>
          </div>
        </div>

        {/* Barre de progression */}
        {!isCompleted && (
          <div className="space-y-1">
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${progressPct}%`,
                  background: canCollect
                    ? "linear-gradient(90deg, #10B981, #059669)"
                    : "linear-gradient(90deg, #F59E0B, #D97706)",
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>{progressPct.toFixed(1)}%</span>
              <span>{canCollect ? "Cycle terminé ✓" : `${inv.duration} jours`}</span>
            </div>
          </div>
        )}

        {/* Compte à rebours */}
        {!isCompleted && !canCollect && (
          <div className="bg-gray-950 rounded-2xl px-4 py-4">
            <p className="text-gray-400 text-[10px] text-center uppercase tracking-widest mb-3">
              Disponible dans
            </p>
            <div className="flex items-center justify-center gap-2">
              <CountdownBlock value={days} label="Jours" />
              <span className="text-white font-extrabold text-2xl mb-4">:</span>
              <CountdownBlock value={hours} label="Heures" />
              <span className="text-white font-extrabold text-2xl mb-4">:</span>
              <CountdownBlock value={minutes} label="Min" />
              <span className="text-white font-extrabold text-2xl mb-4">:</span>
              <CountdownBlock value={seconds} label="Sec" />
            </div>
          </div>
        )}

        {/* Bouton Collecter */}
        {canCollect && (
          <button
            data-testid={`btn-collect-${inv.id}`}
            onClick={() => collectMutation.mutate()}
            disabled={collectMutation.isPending}
            className="w-full py-4 rounded-2xl font-extrabold text-white text-base flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
          >
            {collectMutation.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Collecte en cours...</>
            ) : (
              <><TrendingUp className="w-5 h-5" /> Collecter {formatCFA(inv.totalGain)}</>
            )}
          </button>
        )}

        {/* Terminé */}
        {isCompleted && (
          <div className="w-full py-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center gap-2 text-gray-400 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {formatCFA(inv.totalGain)} collectés avec succès
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [, navigate] = useLocation();
  const now = useNow();

  const { data: investments = [], isLoading } = useQuery({
    queryKey: ["/api/user/investments"],
    refetchInterval: 60000,
  });
  const { data: products = [] } = useQuery<any[]>({ queryKey: ["/api/products"] });

  const productMap = (products as any[]).reduce((acc: any, p: any) => { acc[p.id] = p; return acc; }, {});
  const list = investments as any[];
  const active = list.filter(inv => inv.status !== "completed");
  const readyToCollect = active.filter(inv => new Date(inv.endDate).getTime() <= now);
  const totalExpected = active.reduce((sum: number, inv: any) => sum + inv.totalGain, 0);

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
          {readyToCollect.length > 0 && (
            <span className="ml-auto bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
              {readyToCollect.length} à collecter
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/15 rounded-2xl px-3 py-2.5 border border-white/20">
            <p className="text-white/70 text-[10px] mb-0.5">Gains en attente</p>
            <p className="text-white font-extrabold text-sm leading-none">{formatCFA(totalExpected)}</p>
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
            <div key={i} className="bg-white rounded-2xl h-80 animate-pulse shadow-sm border border-gray-100" />
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
