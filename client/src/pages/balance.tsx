import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { formatCFA } from "@/lib/constants";
import { ArrowLeft, TrendingUp, DollarSign, ShoppingBag, Gift, Wallet } from "lucide-react";
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
    { label: "Solde Total", value: totalBalance, icon: Wallet, color: "text-blue-600", bg: "bg-blue-50", note: "" },
    { label: "Solde de Recharge", value: user.depositBalance, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", note: "Pour acheter des produits" },
    { label: "Solde de Retrait", value: user.withdrawBalance, icon: DollarSign, color: "text-orange-500", bg: "bg-orange-50", note: "Gains, commissions, spin" },
    { label: "Revenu Produit", value: user.productRevenue, icon: ShoppingBag, color: "text-purple-600", bg: "bg-purple-50", note: "" },
    { label: "Commission Parrainage", value: user.commissionBalance, icon: TrendingUp, color: "text-cyan-600", bg: "bg-cyan-50", note: "" },
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
    onError: (e: any) => toast({ title: e.message || "Erreur", variant: "destructive" })
  });

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-[#22c55e] px-4 pt-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/account")} className="text-white" data-testid="button-back-balance">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-bold text-lg">Mon Solde</h1>
          <div className="w-6" />
        </div>
        <p className="text-white/80 text-sm">Solde total</p>
        <p className="text-white font-bold text-3xl mt-1">{formatCFA(totalBalance)}</p>
        <div className="flex gap-4 mt-4">
          <div>
            <p className="text-white/70 text-xs">Recharge</p>
            <p className="text-white font-bold text-base">{formatCFA(user.depositBalance)}</p>
          </div>
          <div className="w-px bg-white/30" />
          <div>
            <p className="text-white/70 text-xs">Retrait</p>
            <p className="text-white font-bold text-base">{formatCFA(user.withdrawBalance)}</p>
          </div>
        </div>
      </div>

      {/* Balance list */}
      <div className="px-4 py-2">
        {items.map((item, i) => (
          <div key={item.label} className={`flex items-center justify-between py-4 ${i < items.length - 1 ? "border-b border-gray-100" : ""}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${item.bg} rounded-full flex items-center justify-center`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-gray-800 font-medium text-sm">{item.label}</p>
                {item.note && <p className="text-gray-400 text-xs">{item.note}</p>}
              </div>
            </div>
            <span className={`font-bold text-sm ${item.color}`}>{formatCFA(item.value)}</span>
          </div>
        ))}
      </div>

      {/* Gift code */}
      <div className="px-4 pt-2 pb-6 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-4 h-4 text-purple-600" />
          <p className="font-semibold text-sm text-gray-900">Code Cadeau</p>
        </div>
        <p className="text-xs text-gray-400 mb-3">Entrez un code cadeau pour créditer votre solde de retrait</p>
        <div className="flex gap-2">
          <input
            className="flex-1 border-b border-gray-200 py-2 text-sm outline-none bg-transparent uppercase font-mono placeholder-gray-300"
            placeholder="ex: PROMO2025"
            value={giftCode}
            onChange={e => setGiftCode(e.target.value.toUpperCase())}
            data-testid="input-redeem-gift-code"
          />
          <button
            className="bg-purple-600 text-white text-sm font-bold px-4 py-2 rounded-lg disabled:opacity-60"
            disabled={!giftCode.trim() || redeemMutation.isPending}
            onClick={() => redeemMutation.mutate()}
            data-testid="button-redeem-gift-code"
          >
            Activer
          </button>
        </div>
      </div>
    </div>
  );
}
