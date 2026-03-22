import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Share2, Star } from "lucide-react";

const LEVEL_GRADIENTS = [
  "linear-gradient(135deg, #14532d 0%, #166534 40%, #22c55e 100%)",
  "linear-gradient(135deg, #052e16 0%, #14532d 40%, #166534 100%)",
  "linear-gradient(135deg, #0f2d1d 0%, #064e3b 40%, #065f46 100%)",
];

export default function InvitePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: referrals } = useQuery<any>({ queryKey: ["/api/user/referrals"] });
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });

  const inviteLink = `${window.location.origin}/auth?reg=${user?.referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({ title: "Lien copié" });
  };

  const shareInvite = () => {
    if (navigator.share) {
      navigator.share({ title: "Autel Energy", text: "Rejoignez Autel Energy!", url: inviteLink });
    } else {
      copyLink();
    }
  };

  const c1 = settings?.referralCommission1 ?? 30;
  const c2 = settings?.referralCommission2 ?? 3;
  const c3 = settings?.referralCommission3 ?? 2;

  const l1: any[] = referrals?.level1 || [];
  const l2: any[] = referrals?.level2 || [];
  const l3: any[] = referrals?.level3 || [];

  const totalFriends = l1.length + l2.length + l3.length;
  const totalRevenue = referrals?.commissionTotal || 0;

  const levels = [
    { num: 1, members: l1, percent: c1, gradient: LEVEL_GRADIENTS[0] },
    { num: 2, members: l2, percent: c2, gradient: LEVEL_GRADIENTS[1] },
    { num: 3, members: l3, percent: c3, gradient: LEVEL_GRADIENTS[2] },
  ];

  const statsTop = [
    { label: "Taille de l'équipe", value: totalFriends },
    { label: "Recharge d'équipe", value: "0 CFA" },
    { label: "Retrait de l'équipe", value: "0 CFA" },
  ];

  const statsBottom = [
    { label: "Nouvelle équipe", value: totalFriends },
    { label: "Première recharge", value: l1.length },
    { label: "Premier retrait", value: 0 },
  ];

  return (
    <div className="min-h-screen pb-28" style={{ background: "#f0fdf4" }}>

      {/* ── En-tête vert ────────────────────────── */}
      <div className="bg-[#22c55e] px-4 pt-8 pb-6">
        <h1 className="text-white font-bold text-lg text-center mb-5">Mon équipe</h1>
        <div className="flex divide-x divide-white/30">
          <div className="flex-1 text-center">
            <p className="text-white/70 text-xs mb-1">Revenu accumulé</p>
            <p className="text-white font-bold text-2xl">{totalRevenue.toFixed(2)}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-white/70 text-xs mb-1">Nombre d'amis</p>
            <p className="text-white font-bold text-2xl">{totalFriends}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* ── Lien d'invitation ─────────────────── */}
        <div className="bg-white rounded-2xl px-4 py-4 shadow-sm">
          <p className="text-gray-500 text-xs mb-2">Lien d'invitation :</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 min-w-0">
              <p className="text-gray-600 text-xs truncate">{inviteLink}</p>
            </div>
            <button
              data-testid="button-copy-link"
              onClick={copyLink}
              className="bg-[#22c55e] text-white text-sm font-semibold px-4 py-2 rounded-xl shrink-0"
            >
              Copier
            </button>
          </div>
        </div>

        {/* ── Boutons d'action ──────────────────── */}
        <div className="flex gap-3">
          <button
            data-testid="button-liste-revenus"
            onClick={() => navigate("/team-details")}
            className="flex-1 bg-[#22c55e] text-white font-semibold text-sm py-3 rounded-2xl shadow-sm"
          >
            Détail de l'équipe
          </button>
          <button
            data-testid="button-inviter"
            onClick={shareInvite}
            className="flex-1 bg-[#22c55e] text-white font-semibold text-sm py-3 rounded-2xl shadow-sm flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Inviter maintenant
          </button>
        </div>

        {/* ── Carte statistiques équipe ──────────── */}
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: "linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)" }}>
          <div className="grid grid-cols-3 divide-x divide-yellow-200 border-b border-yellow-200">
            {statsTop.map((s, i) => (
              <div key={i} className="flex flex-col items-center py-4 px-2">
                <p className="text-gray-500 text-[10px] text-center leading-tight mb-1">{s.label}</p>
                <p className="text-gray-900 font-extrabold text-xl">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 divide-x divide-yellow-200">
            {statsBottom.map((s, i) => (
              <div key={i} className="flex flex-col items-center py-4 px-2">
                <p className="text-gray-500 text-[10px] text-center leading-tight mb-1">{s.label}</p>
                <p className="text-gray-900 font-extrabold text-xl">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Cartes niveau ─────────────────────── */}
        {levels.map((level, i) => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden shadow-md relative animate-card-in"
            style={{ background: level.gradient, minHeight: 120, animationDelay: `${i * 0.1}s` }}
          >
            {/* Ruban diagonal NIVEAU X */}
            <div className="absolute top-0 left-0 w-24 h-24 overflow-hidden">
              <div
                className="absolute"
                style={{
                  top: 18, left: -22, width: 88,
                  background: "linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)",
                  textAlign: "center",
                  transform: "rotate(-45deg)",
                  padding: "3px 0",
                  fontSize: 9, fontWeight: 800, color: "white",
                  letterSpacing: "0.05em",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              >
                NIVEAU {level.num}
              </div>
            </div>

            {/* Étoile décorative */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
              <Star className="w-20 h-20 text-white fill-white" />
            </div>

            {/* Contenu */}
            <div className="relative z-10 flex items-stretch px-4 py-5 pl-10">
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-white/70 text-xs">Registre/Valide</p>
                  <p className="text-white font-extrabold text-xl">{level.members.length}/{level.members.length}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs">Revenu total</p>
                  <p className="text-white font-extrabold text-xl">{totalRevenue > 0 && i === 0 ? totalRevenue.toLocaleString("fr-FR") : 0}</p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center gap-3 pl-4">
                <div className="text-center">
                  <p className="text-white/70 text-xs">Pourcentage de</p>
                  <p className="text-white/70 text-xs">commission</p>
                  <p className="text-white font-extrabold text-2xl">{level.percent}%</p>
                </div>
                <button
                  data-testid={`button-details-level-${level.num}`}
                  onClick={() => navigate(`/team-details?level=${level.num}`)}
                  className="bg-gray-900 text-white text-sm font-bold px-5 py-2 rounded-xl shadow"
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
