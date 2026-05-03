import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Share2, Star, Users } from "lucide-react";

export default function InvitePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: referrals } = useQuery<any>({ queryKey: ["/api/user/referrals"] });
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });

  const inviteLink = `${window.location.origin}/inscription?code=${user?.referralCode}`;

  const copyLink = () => { navigator.clipboard.writeText(inviteLink); toast({ title: "Lien copié !" }); };
  const shareInvite = () => {
    if (navigator.share) {
      navigator.share({ title: "SINOPEC", text: "Rejoignez SINOPEC !", url: inviteLink });
    } else { copyLink(); }
  };

  const c1 = settings?.referralCommission1 ?? 20;
  const c2 = settings?.referralCommission2 ?? 3;
  const c3 = settings?.referralCommission3 ?? 2;

  const l1: any[] = referrals?.level1 || [];
  const l2: any[] = referrals?.level2 || [];
  const l3: any[] = referrals?.level3 || [];

  const totalFriends = l1.length + l2.length + l3.length;
  const totalRevenue = referrals?.commissionTotal || 0;

  const hasRecharged = (m: any) =>
    (m.totalInvested || 0) > 0 || (m.referred?.depositBalance || 0) > 0 || (m.referred?.withdrawBalance || 0) > 0;

  const l1Recharged = l1.filter(hasRecharged).length;
  const l2Recharged = l2.filter(hasRecharged).length;
  const l3Recharged = l3.filter(hasRecharged).length;

  const levels = [
    {
      num: 1, members: l1, recharged: l1Recharged, percent: c1,
      bg: "linear-gradient(135deg, #1a0f00 0%, #2a1800 50%, #1f1200 100%)",
      border: "rgba(245,158,11,0.3)", badge: "bg-amber-500 text-black",
    },
    {
      num: 2, members: l2, recharged: l2Recharged, percent: c2,
      bg: "linear-gradient(135deg, #0d1117 0%, #111827 50%, #0f1520 100%)",
      border: "rgba(99,102,241,0.3)", badge: "bg-indigo-500 text-white",
    },
    {
      num: 3, members: l3, recharged: l3Recharged, percent: c3,
      bg: "linear-gradient(135deg, #0d1117 0%, #0a1929 50%, #0c1f2e 100%)",
      border: "rgba(6,182,212,0.3)", badge: "bg-cyan-500 text-white",
    },
  ];

  return (
    <div className="min-h-screen pb-28" style={{ background: "linear-gradient(160deg, #0B0B14 0%, #0D0D1A 100%)" }}>

      {/* ── En-tête ──────────────────────────────── */}
      <div className="relative overflow-hidden px-5 pt-8 pb-6 border-b border-[#252538]"
        style={{ background: "linear-gradient(135deg, #12121E 0%, #16162A 100%)" }}>
        <div className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-5">
          <Users className="w-40 h-40 text-amber-500" />
        </div>
        <div className="relative">
          <h1 className="text-white font-bold text-xl mb-5">Mon équipe</h1>
          <div className="flex gap-8">
            <div>
              <p className="text-amber-500/60 text-xs mb-1">Revenu accumulé</p>
              <p className="text-amber-400 font-bold text-3xl">{totalRevenue.toFixed(2)}</p>
              <p className="text-amber-500/40 text-[10px]">FCFA</p>
            </div>
            <div className="w-px bg-amber-500/15" />
            <div>
              <p className="text-amber-500/60 text-xs mb-1">Nombre d'amis</p>
              <p className="text-white font-bold text-3xl">{totalFriends}</p>
              <p className="text-[#888899] text-[10px]">membres</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* ── Lien d'invitation ────────────────────── */}
        <div className="rounded-2xl px-4 py-4 border border-[#252538]" style={{ background: "#12121E" }}>
          <p className="text-[#888899] text-xs mb-2 uppercase tracking-wider">Lien d'invitation</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#0B0B14] border border-[#252538] rounded-xl px-3 py-2.5 min-w-0">
              <p className="text-[#888899] text-xs truncate">{inviteLink}</p>
            </div>
            <button data-testid="button-copy-link" onClick={copyLink}
              className="text-black text-sm font-bold px-4 py-2.5 rounded-xl shrink-0"
              style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
              Copier
            </button>
          </div>
        </div>

        {/* ── Boutons d'action ─────────────────────── */}
        <div className="flex gap-3">
          <button data-testid="button-liste-revenus" onClick={() => navigate("/team-details")}
            className="flex-1 py-3 rounded-2xl font-semibold text-sm border border-[#252538] text-white"
            style={{ background: "#12121E" }}>
            Détail de l'équipe
          </button>
          <button data-testid="button-inviter" onClick={shareInvite}
            className="flex-1 py-3 rounded-2xl font-bold text-sm text-black flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
            <Share2 className="w-4 h-4" />
            Inviter
          </button>
        </div>

        {/* ── Cartes niveau ────────────────────────── */}
        {levels.map((level, i) => (
          <div key={i} className="rounded-2xl overflow-hidden border animate-card-in relative"
            style={{ background: level.bg, borderColor: level.border, minHeight: 120, animationDelay: `${i * 0.1}s` }}>
            {/* Badge NIVEAU */}
            <div className="absolute top-0 left-0 w-24 h-24 overflow-hidden">
              <div className={`absolute px-1 py-1 text-[9px] font-extrabold tracking-widest ${level.badge}`}
                style={{ top: 18, left: -22, width: 88, textAlign: "center", transform: "rotate(-45deg)", boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }}>
                NIVEAU {level.num}
              </div>
            </div>

            {/* Étoile déco */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-8">
              <Star className="w-20 h-20 text-white fill-white opacity-10" />
            </div>

            <div className="relative z-10 flex items-stretch px-4 py-5 pl-10">
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-white/50 text-xs">Inscrits</p>
                  <p className="text-white font-extrabold text-2xl">{level.members.length}</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs">Revenu total</p>
                  <p className="text-white font-extrabold text-2xl">
                    {i === 0 ? totalRevenue.toLocaleString("fr-FR") : 0}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center gap-3 pl-4">
                <div className="text-center">
                  <p className="text-white/50 text-xs">Commission</p>
                  <p className="text-amber-400 font-extrabold text-3xl">{level.percent}%</p>
                </div>
                <button data-testid={`button-details-level-${level.num}`}
                  onClick={() => navigate(`/team-details?level=${level.num}`)}
                  className="bg-[#0B0B14]/80 text-white text-sm font-bold px-5 py-2 rounded-xl border border-white/10">
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
