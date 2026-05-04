import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Star, Users, TrendingUp } from "lucide-react";

export default function TeamRevenuePage() {
  const [, navigate] = useLocation();

  const { data: referrals } = useQuery<any>({ queryKey: ["/api/user/referrals"] });
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });

  const c1 = settings?.referralCommission1 ?? 20;
  const c2 = settings?.referralCommission2 ?? 3;
  const c3 = settings?.referralCommission3 ?? 2;

  const l1: any[] = referrals?.level1 || [];
  const l2: any[] = referrals?.level2 || [];
  const l3: any[] = referrals?.level3 || [];
  const totalMembers = l1.length + l2.length + l3.length;
  const totalRevenue = referrals?.commissionTotal || 0;

  const levels = [
    { num: 1, members: l1, percent: c1, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", accent: "#F59E0B" },
    { num: 2, members: l2, percent: c2, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", accent: "#3B82F6" },
    { num: 3, members: l3, percent: c3, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", accent: "#8B5CF6" },
  ];

  const statsTop = [
    { label: "Taille équipe", value: totalMembers },
    { label: "Recharge équipe", value: "0 CFA" },
    { label: "Retrait équipe", value: "0 CFA" },
  ];

  const statsBottom = [
    { label: "Nouvelles recrues", value: totalMembers },
    { label: "1ère recharge", value: l1.length },
    { label: "1er retrait", value: 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* Header gold */}
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 pt-10 pb-5">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate("/invite")} data-testid="button-back-team-revenue"
            className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white font-bold text-xl">Mon équipe</h1>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 bg-white/15 rounded-2xl px-4 py-3 border border-white/25 text-center">
            <p className="text-white font-extrabold text-2xl">{totalMembers}</p>
            <p className="text-white/70 text-xs mt-0.5">Membres totaux</p>
          </div>
          <div className="flex-1 bg-white/15 rounded-2xl px-4 py-3 border border-white/25 text-center">
            <p className="text-white font-extrabold text-2xl">{totalRevenue.toFixed(0)}</p>
            <p className="text-white/70 text-xs mt-0.5">FCFA gagnés</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-3">

        {/* Stats grid */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div className="grid grid-cols-3 divide-x divide-gray-50 border-b border-gray-50">
            {statsTop.map((s, i) => (
              <div key={i} className="flex flex-col items-center py-3 px-2">
                <p className="text-gray-400 text-[10px] text-center leading-tight mb-1">{s.label}</p>
                <p className="text-gray-900 font-extrabold text-xl">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 divide-x divide-gray-50">
            {statsBottom.map((s, i) => (
              <div key={i} className="flex flex-col items-center py-3 px-2">
                <p className="text-gray-400 text-[10px] text-center leading-tight mb-1">{s.label}</p>
                <p className="text-gray-900 font-extrabold text-xl">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Level cards */}
        {levels.map((level, i) => (
          <div key={i} className={`bg-white rounded-2xl overflow-hidden shadow-sm border ${level.border} animate-card-in`}
            style={{ animationDelay: `${i * 0.1}s` }}>

            {/* Colored header strip */}
            <div className="px-5 py-3 flex items-center justify-between"
              style={{ background: `linear-gradient(135deg, ${level.accent}15, ${level.accent}08)` }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: level.accent }}>
                  {level.num}
                </div>
                <span className={`font-bold text-sm ${level.color}`}>Niveau {level.num}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className={`w-3.5 h-3.5 ${level.color}`} />
                <span className={`text-xs font-bold ${level.color}`}>{level.members.length} membres</span>
              </div>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
              <div className="space-y-2">
                <div>
                  <p className="text-gray-400 text-[11px]">Registre / Valide</p>
                  <p className="text-gray-900 font-extrabold text-xl">{level.members.length}/{level.members.length}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[11px]">Revenu total</p>
                  <p className={`font-extrabold text-xl ${level.color}`}>
                    {totalRevenue > 0 && i === 0 ? totalRevenue.toLocaleString("fr-FR") : 0}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="text-center">
                  <p className="text-gray-400 text-[10px]">Commission</p>
                  <p className={`font-extrabold text-3xl ${level.color}`}>{level.percent}%</p>
                </div>
                <button
                  data-testid={`button-details-level-${level.num}`}
                  onClick={() => navigate("/invite")}
                  className="text-black text-sm font-bold px-5 py-2 rounded-xl"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
                >
                  Détails
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
