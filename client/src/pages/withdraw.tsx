import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";
import { formatCFA } from "@/lib/constants";

export default function WithdrawPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: bankCard } = useQuery({ queryKey: ["/api/user/bank-card"] });
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });
  const card = bankCard as any;

  const [amount, setAmount] = useState("");
  const [txPassword, setTxPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNoCardDialog, setShowNoCardDialog] = useState(false);

  const withdrawMinAmount = settings?.withdrawMinAmount || 3500;
  const withdrawFeePercent = settings?.withdrawFeePercent || 10;

  const withdrawMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/user/withdraw", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Retrait soumis", description: "Votre retrait est en attente de validation" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      refreshUser();
      setAmount("");
      setTxPassword("");
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
  });

  const handleWithdraw = () => {
    if (!card) { setShowNoCardDialog(true); return; }
    const amt = parseInt(amount);
    if (!amt || amt < withdrawMinAmount) {
      toast({ title: "Erreur", description: `Montant minimum : ${formatCFA(withdrawMinAmount)}`, variant: "destructive" });
      return;
    }
    if (amt > 4500000) {
      toast({ title: "Erreur", description: "Montant maximum : 4 500 000 FCFA", variant: "destructive" });
      return;
    }
    if (!txPassword.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer le mot de passe de transaction", variant: "destructive" });
      return;
    }
    withdrawMutation.mutate({
      amount: amt, country: user?.country, paymentMethod: card.paymentMethod,
      phoneNumber: card.phoneNumber, accountName: card.accountName, transactionPassword: txPassword,
    });
  };

  return (
    <div className="bg-white">
      {/* No card dialog */}
      {showNoCardDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-gray-700 text-base font-semibold mb-3">Notification système</h3>
            <p className="text-gray-600 text-sm mb-6">Vous n'avez pas encore lié votre carte bancaire. Veuillez d'abord lier votre carte.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowNoCardDialog(false)} className="flex-1 h-11 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm" data-testid="button-cancel-dialog">Annuler</button>
              <button onClick={() => { setShowNoCardDialog(false); navigate("/bank-card"); }} className="flex-1 h-11 rounded-full bg-[#22c55e] text-white font-bold text-sm" data-testid="button-link-card">Lier une carte</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#22c55e] px-4 pt-6 pb-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-white" data-testid="button-back-withdraw">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-bold text-lg">Retrait</h1>
          <button onClick={() => navigate("/transactions")} className="text-white text-sm" data-testid="button-history">
            Historique &gt;
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-5">

        {/* Balance row */}
        <div className="flex items-center justify-between py-4 border-b border-gray-100">
          <div>
            <p className="text-gray-500 text-xs">Solde du compte</p>
            <p className="font-bold text-gray-900 text-xl mt-0.5">{(user?.withdrawBalance || 0).toFixed(2)}</p>
            <p className="text-gray-400 text-xs mt-0.5">Solde retirable : {(user?.withdrawBalance || 0).toFixed(2)}</p>
          </div>
        </div>

        {/* Linked card info */}
        <div className="py-4 border-b border-gray-100">
          <p className="text-gray-700 font-medium text-sm mb-2">Carte liée</p>
          {card ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-50 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-xs">💳</span>
              </div>
              <div>
                <p className="text-gray-800 font-medium text-sm">{card.phoneNumber}</p>
                <p className="text-gray-400 text-xs">{card.accountName} · {card.paymentMethod}</p>
              </div>
            </div>
          ) : (
            <button onClick={() => navigate("/bank-card")} className="text-[#22c55e] text-sm font-medium" data-testid="link-add-card">
              + Lier une carte bancaire
            </button>
          )}
        </div>

        {/* Amount */}
        <div className="py-4 border-b border-gray-100">
          <p className="font-bold text-gray-900 text-base mb-4">Montant de retrait</p>
          <input
            data-testid="input-withdraw-amount"
            type="number"
            placeholder="Entrez le montant"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full text-gray-500 text-base outline-none pb-2 border-b border-gray-200 bg-transparent placeholder-gray-300"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-gray-500 text-sm">Montant minimum : <span className="font-semibold">{withdrawMinAmount.toFixed(2)}</span></p>
            {amount && parseInt(amount) > 0 && (
              <p className="text-gray-400 text-xs">Frais {withdrawFeePercent}% : -{formatCFA(Math.round(parseInt(amount) * withdrawFeePercent / 100))}</p>
            )}
          </div>
        </div>

        {/* Transaction password */}
        <div className="py-4 border-b border-gray-100">
          <p className="font-bold text-gray-900 text-base mb-4">Mot de passe de transaction</p>
          <div className="relative">
            <input
              data-testid="input-tx-password"
              type={showPassword ? "text" : "password"}
              placeholder="Entrez votre mot de passe"
              value={txPassword}
              onChange={e => setTxPassword(e.target.value)}
              className="w-full text-gray-500 text-base outline-none pb-2 border-b border-gray-200 bg-transparent placeholder-gray-300 pr-8"
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-0 bottom-2 text-gray-400"
              data-testid="button-toggle-password"
            >
              {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-6">
          <button
            data-testid="button-submit-withdraw"
            onClick={handleWithdraw}
            disabled={withdrawMutation.isPending}
            className="w-full py-4 bg-[#22c55e] text-white font-bold rounded-xl text-base disabled:opacity-60"
          >
            {withdrawMutation.isPending ? "En cours..." : "Demander un retrait"}
          </button>
        </div>

        {/* Instructions */}
        <div className="pt-6 pb-4">
          <p className="font-bold text-gray-900 text-base mb-3">Instructions</p>
          <div className="space-y-2 text-gray-500 text-sm leading-relaxed">
            <p>1. Horaires de retrait : {settings?.withdrawStartHour || 10}h00 – {settings?.withdrawEndHour || 15}h00</p>
            <p>2. Montant minimum : {formatCFA(withdrawMinAmount)}, maximum : 4 500 000 FCFA</p>
            <p>3. Un seul retrait autorisé par jour</p>
            <p>4. En cas de problème, contactez le service client</p>
          </div>
        </div>
      </div>
    </div>
  );
}
