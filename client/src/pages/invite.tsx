import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Share2 } from "lucide-react";

export default function InvitePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: referrals } = useQuery<any>({ queryKey: ["/api/user/referrals"] });

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

  const totalFriends = (referrals?.level1?.length || 0) + (referrals?.level2?.length || 0) + (referrals?.level3?.length || 0);
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
            onClick={() => navigate("/team-revenue")}
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


      </div>
    </div>
  );
}
