import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff, CreditCard } from "lucide-react";
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

  const withdrawMinAmount = settings?.withdrawMinAmount ?? 1000;
  const withdrawFeePercent = settings?.withdrawFeePercent ?? 15;
  const startH = settings?.withdrawStartHour || 10;
  const endH = settings?.withdrawEndHour || 15;

  const withdrawMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/user/withdraw", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Retrait soumis avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      refreshUser();
      setAmount("");
      setTxPassword("");
    },
    onError: (e: any) => {
      toast({ title: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
  });

  const handleWithdraw = () => {
    if (!card) { setShowNoCardDialog(true); return; }
    const amt = parseInt(amount);
    if (!amt || amt < withdrawMinAmount) {
      toast({ title: `Montant minimum : ${formatCFA(withdrawMinAmount)}`, variant: "destructive" });
      return;
    }
    if (amt > 4500000) {
      toast({ title: "Montant maximum : 4 500 000 FCFA", variant: "destructive" });
      return;
    }
    if (!txPassword.trim()) {
      toast({ title: "Veuillez entrer le mot de passe de transaction", variant: "destructive" });
      return;
    }
    withdrawMutation.mutate({
      amount: amt, country: user?.country, paymentMethod: card.paymentMethod,
      phoneNumber: card.phoneNumber, accountName: card.accountName, transactionPassword: txPassword,
    });
  };

  const netAmount = amount && parseInt(amount) > 0
    ? Math.round(parseInt(amount) * (1 - withdrawFeePercent / 100))
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* Modal pas de carte */}
      {showNoCardDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-gray-900 text-base font-semibold mb-3">Notification système</h3>
            <p className="text-gray-500 text-sm mb-6">Vous n'avez pas encore lié votre compte de retrait. Veuillez d'abord l'enregistrer.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowNoCardDialog(false)}
                className="flex-1 h-11 rounded-full bg-gray-100 text-gray-500 font-semibold text-sm"
                data-testid="button-cancel-dialog">
                Annuler
              </button>
              <button onClick={() => { setShowNoCardDialog(false); navigate("/bank-card"); }}
                className="flex-1 h-11 rounded-full font-bold text-sm text-black"
                style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
                data-testid="button-link-card">
                Lier un compte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header gold */}
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-white" data-testid="button-back-withdraw">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-bold text-lg">Retrait</h1>
          <button onClick={() => navigate("/transactions")} className="text-white/80 text-sm font-medium" data-testid="link-withdraw-history">
            Historique
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Balance card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          {card ? (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Compte lié</p>
                <p className="text-gray-900 font-bold text-sm">{card.paymentMethod} · {card.phoneNumber}</p>
              </div>
            </div>
          ) : (
            <button
              data-testid="button-add-bank-card"
              onClick={() => navigate("/bank-card")}
              className="w-full mb-4 flex items-center justify-center gap-2 border-2 border-dashed border-amber-200 rounded-xl py-3 text-amber-500 font-semibold text-sm"
            >
              <span className="text-lg font-bold">+</span>
              Ajouter un compte de retrait
            </button>
          )}
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-1">Solde disponible (retrait)</p>
            <p className="text-gray-900 font-black text-4xl">{(user?.withdrawBalance || 0).toFixed(2)}</p>
            <p className="text-gray-400 text-xs mt-1">FCFA</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-gray-500 text-xs mb-1">
              Montant minimum : <span className="text-amber-500 font-bold">{withdrawMinAmount.toLocaleString("fr-FR")} FCFA</span>
            </p>
            <input
              data-testid="input-withdraw-amount"
              type="number"
              placeholder="Entrez le montant de retrait"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-base outline-none focus:border-amber-400 placeholder-gray-400"
            />
            {netAmount !== null && (
              <p className="text-gray-400 text-xs mt-1.5 ml-1">
                Frais {withdrawFeePercent}% → Net reçu : <span className="font-semibold text-amber-500">{formatCFA(netAmount)}</span>
              </p>
            )}
          </div>

          <div className="px-4 py-3">
            <div className="relative">
              <input
                data-testid="input-tx-password"
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe de transaction"
                value={txPassword}
                onChange={e => setTxPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-base outline-none focus:border-amber-400 placeholder-gray-400 pr-12"
              />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                data-testid="button-toggle-password">
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          data-testid="button-submit-withdraw"
          onClick={handleWithdraw}
          disabled={withdrawMutation.isPending}
          className="w-full py-4 rounded-2xl font-bold text-black text-base disabled:opacity-60 shadow-md"
          style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
        >
          {withdrawMutation.isPending ? "En cours..." : "Retrait"}
        </button>

        {/* Info card */}
        <div className="bg-white rounded-2xl px-5 py-4 space-y-4 text-sm leading-relaxed border border-gray-100 shadow-sm">
          <div>
            <p className="font-bold text-gray-800 mb-1">Délais de retrait :</p>
            <p className="text-gray-500">
              Les retraits sont possibles de {startH}h00 à {endH}h00.
              Les fonds seront disponibles sous 10 à 30 minutes.
              Veuillez lier vos informations bancaires avant d'effectuer un retrait.
            </p>
          </div>
          <div className="h-px bg-gray-100" />
          <div>
            <p className="font-bold text-gray-800 mb-1">Montant du retrait :</p>
            <p className="text-gray-500">
              Montant minimum :{" "}
              <span className="text-amber-500 font-bold">{withdrawMinAmount.toLocaleString("fr-FR")} CFA</span>.
              Frais de {withdrawFeePercent}% déduits. Maximum : 4 500 000 FCFA. 1 retrait/jour.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
