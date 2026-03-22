import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Copy, Share2 } from "lucide-react";

const LEVEL_LABELS = ["Premier", "Deuxième", "Troisième"];

export default function InvitePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: referrals } = useQuery<any>({ queryKey: ["/api/user/referrals"] });
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });

  const inviteLink = `${window.location.origin}/auth?reg=${user?.referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({ title: "Copié", description: "Lien copié dans le presse-papier" });
  };

  const shareInvite = () => {
    if (navigator.share) {
      navigator.share({ title: "Autel Invest", text: "Rejoignez Autel Invest!", url: inviteLink });
    } else {
      copyLink();
    }
  };

  const commissions = [
    settings?.referralCommission1 ?? 30,
    settings?.referralCommission2 ?? 3,
    settings?.referralCommission3 ?? 2,
  ];

  const levels = [
    { label: LEVEL_LABELS[0], percent: commissions[0], data: referrals?.level1 || [] },
    { label: LEVEL_LABELS[1], percent: commissions[1], data: referrals?.level2 || [] },
    { label: LEVEL_LABELS[2], percent: commissions[2], data: referrals?.level3 || [] },
  ];

  const totalFriends = levels.reduce((acc, l) => acc + l.data.length, 0);
  const totalRevenue = referrals?.commissionTotal || 0;

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-24">

      {/* ── En-tête vert ────────────────────────── */}
      <div className="bg-[#22c55e] px-4 pt-8 pb-6">
        <h1 className="text-white font-bold text-lg text-center mb-5">Mon équipe</h1>

        {/* Stats */}
        <div className="flex divide-x divide-white/30">
          <div className="flex-1 text-center">
            <p className="text-white/70 text-xs mb-1">Revenu accumulé()</p>
            <p className="text-white font-bold text-2xl">{totalRevenue.toFixed(2)}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-white/70 text-xs mb-1">Nombre d'amis</p>
            <p className="text-white font-bold text-2xl">{totalFriends}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">

        {/* ── Lien d'invitation ───────────────────── */}
        <div className="bg-white rounded-2xl px-4 py-4 shadow-sm">
          <p className="text-gray-500 text-xs mb-2">Lien d'invitation:</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 min-w-0">
              <p className="text-gray-600 text-xs truncate">{inviteLink}</p>
            </div>
            <button
              data-testid="button-copy-link"
              onClick={copyLink}
              className="bg-[#22c55e] text-white text-sm font-semibold px-4 py-2 rounded-xl shrink-0"
            >
              Copiez le lien
            </button>
          </div>
        </div>

        {/* ── Boutons d'action ────────────────────── */}
        <div className="flex gap-3">
          <button
            data-testid="button-liste-revenus"
            onClick={() => navigate("/transactions")}
            className="flex-1 bg-[#22c55e] text-white font-semibold text-sm py-3 rounded-2xl shadow-sm"
          >
            Liste des revenus
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

        {/* ── Mon équipe ──────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Titre section */}
          <div className="flex items-center justify-center gap-2 py-3 border-b border-gray-100">
            <div className="flex gap-0.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`w-1 rounded-full bg-[#22c55e] ${i === 0 || i === 3 ? "h-3" : i === 1 || i === 2 ? "h-4" : "h-3"}`} />
              ))}
            </div>
            <p className="text-gray-800 font-bold text-sm">Mon équipe</p>
            <div className="flex gap-0.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`w-1 rounded-full bg-[#22c55e] ${i === 0 || i === 3 ? "h-3" : i === 1 || i === 2 ? "h-4" : "h-3"}`} />
              ))}
            </div>
          </div>

          {/* Header colonnes */}
          <div className="grid grid-cols-3 px-4 py-2 text-xs text-gray-400">
            <div></div>
            <div className="text-center">Revenu total()</div>
            <div className="text-right">Amis</div>
          </div>

          {/* Lignes par niveau */}
          {levels.map((l, i) => (
            <div key={i} className="border-t border-gray-100 px-4 py-4">
              {/* En-tête ligne */}
              <div className="grid grid-cols-3 items-center text-xs text-gray-400 mb-2">
                <div></div>
                <div className="text-center">Revenu total()</div>
                <div className="text-right">Amis</div>
              </div>
              <div className="grid grid-cols-3 items-center">
                {/* Badge niveau */}
                <div className="flex items-center">
                  <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl px-2 py-2 text-center min-w-[56px]">
                    <p className="text-[#22c55e] font-extrabold text-sm">{l.percent}%</p>
                    <p className="text-[#22c55e] text-[10px] font-medium">{l.label}</p>
                  </div>
                </div>
                {/* Revenu */}
                <div className="text-center">
                  <p className="text-gray-800 font-bold text-xl">0</p>
                </div>
                {/* Amis */}
                <div className="text-right">
                  <p className="text-gray-800 font-bold text-xl">{l.data.length}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Code parrain ────────────────────────── */}
        <div className="bg-white rounded-2xl px-4 py-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs">Code de parrainage</p>
            <p className="text-gray-900 font-bold text-lg mt-0.5">{user?.referralCode}</p>
          </div>
          <button
            data-testid="button-copy-code"
            onClick={() => {
              navigator.clipboard.writeText(user?.referralCode || "");
              toast({ title: "Copié", description: "Code copié" });
            }}
            className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center"
          >
            <Copy className="w-5 h-5 text-[#22c55e]" />
          </button>
        </div>

      </div>
    </div>
  );
}
