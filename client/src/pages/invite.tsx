import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Share2, Copy, Users, TrendingUp, ChevronRight } from "lucide-react";

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

  const levels = [
    { label: "Niveau 1", count: level1.length, commission: commission1, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100", members: level1 },
    { label: "Niveau 2", count: level2.length, commission: commission2, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100", members: level2 },
    { label: "Niveau 3", count: level3.length, commission: commission3, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100", members: level3 },
  ];

  return (
    <div className="min-h-screen pb-28 bg-gray-50">

      {/* Header gold */}
      <div className="px-5 pt-10 pb-8" style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-white" />
          <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">Parrainage</p>
        </div>
        <h1 className="text-white font-extrabold text-2xl">Inviter des amis</h1>
        <p className="text-white/70 text-sm mt-1">Gagnez des commissions sur 3 niveaux</p>

        {/* Stats row */}
        <div className="flex gap-3 mt-5">
          <div className="flex-1 bg-white/15 rounded-2xl px-3 py-3 border border-white/25 text-center">
            <p className="text-white font-extrabold text-xl">{level1.length + level2.length + level3.length}</p>
            <p className="text-white/70 text-xs">Filleuls totaux</p>
          </div>
          <div className="flex-1 bg-white/15 rounded-2xl px-3 py-3 border border-white/25 text-center">
            <p className="text-white font-extrabold text-xl">{commissionTotal.toFixed(0)}</p>
            <p className="text-white/70 text-xs">FCFA gagnés</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-3">

        {/* Code & lien */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-medium mb-3">Mon code de parrainage</p>
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-3 border border-gray-100">
            <span className="font-black text-gray-900 text-lg tracking-widest">{user.referralCode}</span>
            <button onClick={handleCopy} data-testid="button-copy-code"
              className="text-amber-500 p-1">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-400 text-xs mb-2 truncate">{referralLink}</p>
          <button
            data-testid="button-share"
            onClick={handleShare}
            className="w-full py-3 rounded-2xl font-bold text-black text-sm flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
          >
            <Share2 className="w-4 h-4" />
            Partager mon lien
          </button>
        </div>

        {/* Commissions */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-gray-800 font-bold text-sm mb-3">Commissions par niveau</p>
          <div className="space-y-2">
            {levels.map((lv) => (
              <div key={lv.label} className={`flex items-center justify-between px-4 py-3 rounded-xl ${lv.bg} border ${lv.border}`}>
                <div className="flex items-center gap-3">
                  <Users className={`w-4 h-4 ${lv.color}`} />
                  <div>
                    <p className={`font-bold text-sm ${lv.color}`}>{lv.label}</p>
                    <p className="text-gray-400 text-xs">{lv.count} membre{lv.count !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${lv.color}`}>{lv.commission}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team details link */}
        <button onClick={() => navigate("/team-revenue")} data-testid="button-team-revenue"
          className="w-full bg-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-left">
              <p className="text-gray-800 font-bold text-sm">Revenus de l'équipe</p>
              <p className="text-gray-400 text-xs">Voir le détail des commissions</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </button>

        {/* Members list */}
        {levels.map((lv) => lv.members.length > 0 && (
          <div key={lv.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`px-5 py-3 ${lv.bg} border-b ${lv.border}`}>
              <p className={`font-bold text-sm ${lv.color}`}>{lv.label} · {lv.members.length} membre{lv.members.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {lv.members.slice(0, 5).map((m: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-500 font-bold text-xs">{(m.nickname || m.phone || "U")[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium text-sm">{m.nickname || (m.phone ? m.phone.slice(0,3) + "***" + m.phone.slice(-2) : "—")}</p>
                      <p className="text-gray-400 text-xs">{m.country}</p>
                    </div>
                  </div>
                </div>
              ))}
              {lv.members.length > 5 && (
                <div className="px-5 py-2.5 text-center">
                  <p className="text-gray-400 text-xs">+{lv.members.length - 5} autres membres</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
