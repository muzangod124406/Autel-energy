import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Share2, Copy, Users, ChevronRight, Crown, Star, Zap, TrendingUp, Gift, ArrowLeft } from "lucide-react";

const LEVEL_CONFIG = [
  { label: "Niveau 1", key: "level1", icon: Crown,  accent: "#F59E0B", bg: "bg-amber-50",   border: "border-amber-100",  text: "text-amber-600",  glow: "rgba(245,158,11,0.15)"  },
  { label: "Niveau 2", key: "level2", icon: Star,   accent: "#6366F1", bg: "bg-indigo-50",  border: "border-indigo-100", text: "text-indigo-600", glow: "rgba(99,102,241,0.15)"  },
  { label: "Niveau 3", key: "level3", icon: Zap,    accent: "#10B981", bg: "bg-emerald-50", border: "border-emerald-100",text: "text-emerald-600",glow: "rgba(16,185,129,0.15)"  },
];

export default function InvitePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeLevel, setActiveLevel] = useState(0);

  const { data: referralData } = useQuery<any>({ queryKey: ["/api/user/referrals"] });
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });

  if (!user) return null;

  const referralLink = `${window.location.origin}/?ref=${user.referralCode}`;
  const commissions = [
    settings?.referralCommission1 ?? 20,
    settings?.referralCommission2 ?? 3,
    settings?.referralCommission3 ?? 2,
  ];

  const members = [
    referralData?.level1 ?? [],
    referralData?.level2 ?? [],
    referralData?.level3 ?? [],
  ];

  const commissionTotal = referralData?.commissionTotal ?? 0;
  const totalMembers = members[0].length + members[1].length + members[2].length;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).then(() => toast({ title: "Lien copié !" }));
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: "SINOPEC", text: "Rejoignez SINOPEC et gagnez des revenus passifs !", url: referralLink });
    } else {
      handleCopy();
    }
  };

  const formatPhone = (phone: string) => {
    if (!phone) return "—";
    const d = phone.replace(/\D/g, "");
    return d.slice(0, 3) + "***" + d.slice(-2);
  };

  const currentMembers: any[] = members[activeLevel] || [];
  const cfg = LEVEL_CONFIG[activeLevel];

  return (
    <div className="min-h-screen pb-28 bg-gray-50">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden px-5 pt-10 pb-7"
        style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute top-8 right-20 w-16 h-16 rounded-full bg-white/10" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-white/80" />
            <p className="text-white/80 text-xs font-semibold uppercase tracking-widest">Parrainage</p>
          </div>
          <h1 className="text-white font-black text-3xl leading-none">Mon équipe</h1>
          <p className="text-white/70 text-sm mt-1">Gagnez des commissions sur 3 niveaux</p>

          {/* 3 stats */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            {[
              { value: totalMembers, label: "Filleuls" },
              { value: `${commissionTotal.toLocaleString("fr-FR")} F`, label: "Gains" },
              { value: `${commissions[0]}%`, label: "Commission N1" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl px-3 py-3 text-center border border-white/20"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                <p className="text-white font-extrabold text-lg leading-tight">{s.value}</p>
                <p className="text-white/70 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 space-y-3 -mt-2">

        {/* ── CODE DE PARRAINAGE ── */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
              <Gift className="w-4 h-4 text-white" />
            </div>
            <p className="text-gray-800 font-bold text-sm">Mon code de parrainage</p>
          </div>

          {/* Code block */}
          <div className="flex items-center justify-between rounded-2xl px-5 py-4 mb-3 border border-amber-100"
            style={{ background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)" }}>
            <span className="font-black text-amber-700 text-3xl tracking-[0.3em]">{user.referralCode}</span>
            <button onClick={handleCopy} data-testid="button-copy-code"
              className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center active:bg-amber-200">
              <Copy className="w-4 h-4 text-amber-600" />
            </button>
          </div>

          <p className="text-gray-400 text-[11px] mb-4 truncate px-1">{referralLink}</p>

          <button data-testid="button-share" onClick={handleShare}
            className="w-full py-3.5 rounded-2xl font-bold text-black text-sm flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
            <Share2 className="w-4 h-4" />
            Partager mon lien
          </button>
        </div>

        {/* ── TAUX DE COMMISSION ── */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-800 font-bold text-sm mb-3">Taux de commission</p>
          <div className="grid grid-cols-3 gap-2">
            {LEVEL_CONFIG.map((lv, i) => {
              const Icon = lv.icon;
              return (
                <div key={i} className={`rounded-2xl px-3 py-3 text-center ${lv.bg} border ${lv.border}`}>
                  <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: lv.accent }} />
                  <p className={`font-extrabold text-2xl ${lv.text}`}>{commissions[i]}%</p>
                  <p className="text-gray-400 text-[10px] mt-0.5">{lv.label}</p>
                  <p className={`text-[10px] font-bold ${lv.text} mt-0.5`}>{members[i].length} membre{members[i].length !== 1 ? "s" : ""}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── REVENUS ÉQUIPE ── */}
        <button onClick={() => navigate("/team-revenue")} data-testid="button-team-revenue"
          className="w-full bg-white rounded-3xl px-5 py-4 flex items-center justify-between shadow-sm border border-gray-100">
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

        {/* ── LISTE MEMBRES ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Level tabs */}
          <div className="flex border-b border-gray-100">
            {LEVEL_CONFIG.map((lv, i) => (
              <button key={i} data-testid={`tab-team-level-${i + 1}`}
                onClick={() => setActiveLevel(i)}
                className={`flex-1 py-3 text-xs font-bold transition-colors ${
                  activeLevel === i
                    ? "border-b-2 border-amber-400"
                    : "text-gray-400"
                }`}
                style={activeLevel === i ? { color: lv.accent } : {}}>
                N{i + 1} · {members[i].length}
              </button>
            ))}
          </div>

          {/* Members */}
          {currentMembers.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <Users className="w-7 h-7 text-gray-200" />
              </div>
              <p className="text-gray-400 text-sm font-medium">Aucun membre à ce niveau</p>
              <p className="text-gray-300 text-xs mt-1">Partagez votre lien pour inviter</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {currentMembers.map((m: any, i: number) => (
                <div key={i} className="flex items-center px-5 py-3.5 gap-3"
                  data-testid={`member-row-${i}`}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-gray-100"
                    style={{ background: cfg.glow }}>
                    <span className="font-extrabold text-sm" style={{ color: cfg.accent }}>
                      {(m.nickname || m.phone || "U")[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 font-semibold text-sm truncate">
                      {m.nickname || formatPhone(m.phone || "")}
                    </p>
                    <p className="text-gray-400 text-xs">{m.country || "—"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-gray-700 font-bold text-sm">
                      {(m.totalInvested || 0).toLocaleString("fr-FR")} F
                    </p>
                    <p className="text-gray-300 text-[10px]">investi</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
