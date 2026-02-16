import { useAuth } from "@/lib/auth";
import { formatCFA } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Share2, Users, Crown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/bottom-nav";

export default function InvitePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: referrals } = useQuery({ queryKey: ["/api/user/referrals"] });

  const inviteLink = `${window.location.origin}/auth?reg=${user?.referralCode}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copié", description: "Lien copié dans le presse-papier" });
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({ title: "Red Bull Invest", text: "Rejoignez Red Bull Invest!", url: inviteLink });
    } else {
      copyToClipboard(inviteLink);
    }
  };

  const levels = [
    { level: 1, percent: "30%", data: referrals?.level1 || [] },
    { level: 2, percent: "3%", data: referrals?.level2 || [] },
    { level: 3, percent: "2%", data: referrals?.level3 || [] },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-4 pt-6 pb-8">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white/70 text-sm">Commission totale</p>
            <p className="text-white text-2xl font-bold">{formatCFA(referrals?.commissionTotal || 0)}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4">
        <Card className="p-4 mb-4">
          <p className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            Lien d'invitation
          </p>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 mb-3">
            <p className="text-xs text-muted-foreground flex-1 truncate">{inviteLink}</p>
            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(inviteLink)} data-testid="button-copy-link">
              <Copy className="w-4 h-4 mr-1" /> Copier
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 flex-1">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-mono">Code: {user?.referralCode}</span>
            </div>
            <Button onClick={shareLink} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white" data-testid="button-share">
              <Share2 className="w-4 h-4 mr-1" /> Partager
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="font-bold">Niveau de l'équipe</h2>
            <button className="flex items-center gap-1 text-sm text-muted-foreground" data-testid="button-team-details">
              Détails de l'équipe <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {levels.map(l => {
              const activeCount = l.data.filter((r: any) => {
                const ref = r.referred;
                return ref && ref.depositBalance > 0;
              }).length;
              return (
                <div key={l.level} className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${l.level === 1 ? 'bg-amber-400' : l.level === 2 ? 'bg-gray-300' : 'bg-amber-700'}`}>
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-bold">Niveau {l.level}</span>
                    </div>
                    <Badge variant="secondary">{l.percent}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold">{l.percent}</p>
                      <p className="text-[10px] text-muted-foreground">Remise</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{l.data.length}</p>
                      <p className="text-[10px] text-muted-foreground">Total invités</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">{activeCount}</p>
                      <p className="text-[10px] text-muted-foreground">Actifs</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}
