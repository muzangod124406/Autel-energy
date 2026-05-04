import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Share2, Copy, Users, TrendingUp, ChevronRight, Crown, Star, Zap } from "lucide-react";

const LEVEL_CONFIG = [
  { label: "Niveau 1", icon: Crown, color: "#F59E0B", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600", glow: "rgba(245,158,11,0.2)" },
  { label: "Niveau 2", icon: Star,  color: "#6366F1", bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-600", glow: "rgba(99,102,241,0.2)" },
  { label: "Niveau 3", icon: Zap,   color: "#10B981", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600", glow: "rgba(16,185,129,0.2)" },
];

export default function InvitePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: referralData } = useQuery<any>({ queryKey: ["/api/user/referrals"] });
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });

  if (!user) return null;

  const referralLink = `${window.location.origin}/?ref=${user.referralCode}`;
  const commission1 = settings?.referralCommission1 ?? 20;
  const commission2 = settings?.referralCommission2 ?? 3;
  const commission3 = settings?.referralCommission3 ?? 2;

  const level1 = referralData?.level1 ?? [];
  const level2 = referralData?.level2 ?? [];
  const level3 = referralData?.level3 ?? [];
  const commissionTotal = referralData?.commissionTotal ?? 0;
  const totalMembers = level1.length + level2.length + level3.length;

  const levels = [
    { ...LEVEL_CONFIG[0], count: level1.length, commission: commission1, members: level1 },
    { ...LEVEL_CONFIG[1], count: level2.length, commission: commission2, members: level2 },
    { ...LEVEL_CONFIG[2], count: level3.length, commission: commission3, members: level3 },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      toast({ title: "Lien copié !" });
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: "SINOPEC", text: "Rejoignez SINOPEC et gagnez des revenus passifs !", url: referralLink });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen pb-28 bg-gray-50">

      {/* Hero header */}
      <div className="relative px-5 pt-10 pb-8 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10"
          style={{ background: "white" }} />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full opacity-10"
          style={{ background: "white" }} />

        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-white/80" />
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">Équipe & Parrainage</p>
          </div>
          <h1 className="text-white font-extrabold text-2xl mb-1">Mon équipe</h1>
          <p className="text-white/70 text-sm">Commissions sur 3 niveaux de filleuls</p>

          {/* Stats */}
          <div className="flex gap-3 mt-5">
            <div className="flex-1 rounded-2xl px-4 py-3 text-center border border-white/20"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              <p className="text-white font-extrabold text-2xl">{totalMembers}</p>
              <p className="text-white/70 text-xs mt-0.5">Filleuls</p>
            </div>
            <div className="flex-1 rounded-2xl px-4 py-3 text-center border border-white/20"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              <p className="text-white font-extrabold text-xl">{commissionTotal.toFixed(0)}</p>
              <p className="text-white/70 text-xs mt-0.5">FCFA gagnés</p>
            </div>
            <div className="flex-1 rounded-2xl px-4 py-3 text-center border border-white/20"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              <p className="text-white font-extrabold text-xl">{commission1}%</p>
              <p className="text-white/70 text-xs mt-0.5">Commission N1</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-3">

        {/* Referral code card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">Mon code de parrainage</p>

          <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl px-4 py-3.5 mb-3 border border-amber-100">
            <span className="font-black text-amber-700 text-2xl tracking-[0.25em]">{user.referralCode}</span>
            <button onClick={handleCopy} data-testid="button-copy-code"
              className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center active:bg-amber-200">
              <Copy className="w-4 h-4 text-amber-600" />
            </button>
          </div>

          <p className="text-gray-400 text-[11px] mb-3 truncate">{referralLink}</p>

          <button data-testid="button-share" onClick={handleShare}
            className="w-full py-3.5 rounded-2xl font-bold text-black text-sm flex items-center justify-center gap-2 shadow-sm"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
            <Share2 className="w-4 h-4" />
            Partager mon lien
          </button>
        </div>

        {/* Commission levels */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-800 font-bold text-sm mb-3">Taux de commission</p>
          <div className="space-y-2.5">
            {levels.map((lv) => {
              const Icon = lv.icon;
              return (
                <div key={lv.label}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl ${lv.bg} border ${lv.border}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: lv.glow }}>
                      <Icon className="w-4 h-4" style={{ color: lv.color }} />
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${lv.text}`}>{lv.label}</p>
                      <p className="text-gray-400 text-xs">{lv.count} membre{lv.count !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-extrabold text-lg ${lv.text}`}>{lv.commission}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue link */}
        <button onClick={() => navigate("/team-revenue")} data-testid="button-team-revenue"
          className="w-full bg-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-gray-800 font-bold text-sm">Revenus de l'équipe</p>
              <p className="text-gray-400 text-xs">Voir le détail des commissions</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </button>

        {/* Members per level */}
        {levels.map((lv) => lv.members.length > 0 && (
          <div key={lv.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`px-5 py-3 ${lv.bg} border-b ${lv.border} flex items-center gap-2`}>
              <lv.icon className="w-4 h-4" style={{ color: lv.color }} />
              <p className={`font-bold text-sm ${lv.text}`}>{lv.label} · {lv.members.length} membre{lv.members.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {lv.members.slice(0, 5).map((m: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-100"
                      style={{ background: lv.glow }}>
                      <span className="font-extrabold text-xs" style={{ color: lv.color }}>
                        {(m.nickname || m.phone || "U")[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-800 font-semibold text-sm">
                        {m.nickname || (m.phone ? m.phone.slice(0, 3) + "***" + m.phone.slice(-2) : "—")}
                      </p>
                      <p className="text-gray-400 text-xs">{m.country}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${lv.bg} ${lv.text} border ${lv.border}`}>
                    N{levels.indexOf(lv) + 1}
                  </span>
                </div>
              ))}
              {lv.members.length > 5 && (
                <div className="px-5 py-3 text-center">
                  <p className="text-gray-400 text-xs font-medium">+{lv.members.length - 5} autres membres</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
