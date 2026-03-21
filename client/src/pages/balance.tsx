import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { formatCFA } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Wallet, TrendingUp, DollarSign, ShoppingBag, Gift } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function BalancePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [giftCode, setGiftCode] = useState("");

  if (!user) return null;

  const totalBalance = user.depositBalance + user.withdrawBalance;

  const items = [
    { label: "Solde Total", value: totalBalance, icon: Wallet, color: "text-blue-600", note: "" },
    { label: "Solde de Recharge", value: user.depositBalance, icon: TrendingUp, color: "text-green-600", note: "Pour acheter des produits" },
    { label: "Solde de Retrait", value: user.withdrawBalance, icon: DollarSign, color: "text-orange-600", note: "Gains, commissions, spin" },
    { label: "Revenu Produit", value: user.productRevenue, icon: ShoppingBag, color: "text-purple-600", note: "" },
    { label: "Commission Parrainage", value: user.commissionBalance, icon: TrendingUp, color: "text-cyan-600", note: "" },
  ];

  const redeemMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/redeem-gift-code", { code: giftCode.trim().toUpperCase() });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: `Code activé ! +${formatCFA(data.amount)} ajouté à votre solde de retrait.` });
      setGiftCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, ""), variant: "destructive" })
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 pt-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate("/account")} className="flex items-center gap-2 text-white mb-2" data-testid="button-back-balance">
            <ArrowLeft className="w-5 h-5" /> Retour
          </button>
          <h1 className="text-white text-xl font-bold">Mon Solde</h1>
          <p className="text-white text-3xl font-bold mt-2">{formatCFA(totalBalance)}</p>

          <div className="flex gap-3 mt-4">
            <div className="flex-1 bg-white/20 rounded-xl p-3">
              <p className="text-white/80 text-xs mb-0.5">Recharge</p>
              <p className="text-white font-bold text-base">{formatCFA(user.depositBalance)}</p>
            </div>
            <div className="flex-1 bg-white/20 rounded-xl p-3">
              <p className="text-white/80 text-xs mb-0.5">Retrait</p>
              <p className="text-white font-bold text-base">{formatCFA(user.withdrawBalance)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">
        {items.map(item => (
          <Card key={item.label} className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <span className="text-sm font-medium block">{item.label}</span>
                {item.note && <span className="text-xs text-muted-foreground">{item.note}</span>}
              </div>
            </div>
            <span className={`font-bold ${item.color}`}>{formatCFA(item.value)}</span>
          </Card>
        ))}

        {/* Gift code redemption */}
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-purple-700">
            <Gift className="w-4 h-4" /> Code Cadeau
          </h3>
          <p className="text-xs text-gray-500">Entrez un code cadeau pour créditer votre solde de retrait</p>
          <div className="flex gap-2">
            <Input
              className="uppercase font-mono"
              placeholder="ex: PROMO2025"
              value={giftCode}
              onChange={e => setGiftCode(e.target.value.toUpperCase())}
              data-testid="input-redeem-gift-code"
            />
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
              disabled={!giftCode.trim() || redeemMutation.isPending}
              onClick={() => redeemMutation.mutate()}
              data-testid="button-redeem-gift-code"
            >
              Activer
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
