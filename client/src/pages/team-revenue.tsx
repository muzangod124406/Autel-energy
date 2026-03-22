import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Users } from "lucide-react";

const LEVELS = [
  { label: "Niveau 1", color: "#22c55e",   medal: "🥇" },
  { label: "Niveau 2", color: "#9333ea",   medal: "🥈" },
  { label: "Niveau 3", color: "#0ea5e9",   medal: "🥉" },
];

export default function TeamRevenuePage() {
  const [, navigate] = useLocation();

  const { data: referrals } = useQuery<any>({ queryKey: ["/api/user/referrals"] });
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });

  const commissions = [
    settings?.referralCommission1 ?? 30,
    settings?.referralCommission2 ?? 3,
    settings?.referralCommission3 ?? 2,
  ];

  const l1 = referrals?.level1 || [];
  const l2 = referrals?.level2 || [];
  const l3 = referrals?.level3 || [];
  const totalMembers = l1.length + l2.length + l3.length;
  const totalRevenue = referrals?.commissionTotal || 0;

  const levels = [
    { ...LEVELS[0], percent: commissions[0], members: l1 },
    { ...LEVELS[1], percent: commissions[1], members: l2 },
    { ...LEVELS[2], percent: commissions[2], members: l3 },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-28">

      {/* ── Header vert ─────────────────────────── */}
      <div className="bg-[#22c55e] px-4 pt-8 pb-16 relative overflow-hidden">
        <div className="absolute -bottom-8 left-0 right-0 h-16 bg-[#f5f5f5] rounded-t-[2rem]" />
        <div className="absolute top-4 right-4 opacity-20">
          <Users className="w-24 h-24 text-white" />
        </div>

        {/* Retour */}
        <button
          onClick={() => navigate("/invite")}
          data-testid="button-back-team-revenue"
          className="flex items-center gap-2 text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold text-base">Mon équipe</span>
        </button>

        <p className="text-white/80 text-sm">Revenu Total</p>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-white font-black text-4xl">{totalRevenue.toLocaleString("fr-FR")}</p>
          <p className="text-white/80 font-semibold text-lg">CFA</p>
        </div>
        <p className="text-white/80 text-sm mt-3">
          Taille l'équipe <span className="text-white font-bold">{totalMembers}</span>
        </p>
      </div>

      {/* ── Cartes par niveau ───────────────────── */}
      <div className="px-4 -mt-4 space-y-4 relative z-10">
        {levels.map((level, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-card-in" style={{ animationDelay: `${i * 0.08}s` }}>
            {/* En-tête coloré */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ backgroundColor: level.color }}
            >
              <p className="text-white font-bold text-base">{level.label}</p>
              <div className="flex items-center gap-2">
                <span className="text-white/80 text-xs">Commission {level.percent}%</span>
                <span className="text-xl">{level.medal}</span>
              </div>
            </div>

            {/* Données */}
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-sm">Revenu</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-gray-900 font-bold text-xl">0</p>
                  <p className="text-gray-400 text-xs font-semibold">CFA</p>
                </div>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-sm">Taille</p>
                <p className="text-gray-900 font-bold text-xl">{level.members.length}</p>
              </div>

              {/* Liste des membres si non vide */}
              {level.members.length > 0 && (
                <div className="pt-1 space-y-2">
                  <div className="h-px bg-gray-100" />
                  {level.members.slice(0, 5).map((m: any, j: number) => (
                    <div key={j} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px]" style={{ backgroundColor: level.color }}>
                          {(m.referred?.phone || "?").slice(-2)}
                        </div>
                        <span className="text-gray-600">{m.referred?.phone ? `****${m.referred.phone.slice(-4)}` : "—"}</span>
                      </div>
                      <span className="text-gray-400">{m.referred?.nickname || ""}</span>
                    </div>
                  ))}
                  {level.members.length > 5 && (
                    <p className="text-xs text-gray-400 text-center">+{level.members.length - 5} autres membres</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
