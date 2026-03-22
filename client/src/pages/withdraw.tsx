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
    <div className="min-h-screen bg-white">

      {/* ── Modal pas de carte ─────────────────────── */}
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

      {/* ── Header simple ──────────────────────────── */}
      <div className="flex items-center px-4 pt-8 pb-4 bg-white">
        <button onClick={() => navigate("/")} className="text-gray-700 mr-4" data-testid="button-back-withdraw">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center text-gray-900 font-bold text-lg pr-9">Retrait</h1>
      </div>

      <div className="px-4 space-y-5">

        {/* ── Carte solde ────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%)", minHeight: 140 }}
        >
          {/* Vague déco */}
          <div className="absolute inset-0 opacity-20"
            style={{ background: "radial-gradient(ellipse at 80% 20%, #86efac 0%, transparent 60%)" }} />
          <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full bg-white/10" />

          <div className="relative z-10 flex flex-col items-center justify-center py-8 px-5 text-center">
            <p className="text-white font-bold text-xl mb-1">
              {card ? `${card.paymentMethod} +` : "Carte bancaire +"}
            </p>
            <p className="text-white font-black text-5xl mb-1 tracking-tight">
              {(user?.withdrawBalance || 0).toFixed(2)}
            </p>
            <p className="text-white/80 text-sm font-medium">Solde disponible</p>
          </div>
        </div>

        {/* ── Montant & mot de passe ─────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Min amount label */}
          <div className="px-5 pt-4 pb-2">
            <p className="text-gray-700 text-sm">
              Montant minimum de retrait :{" "}
              <span className="text-[#22c55e] font-bold">{withdrawMinAmount.toLocaleString("fr-FR")}</span>
            </p>
          </div>

          {/* Input montant */}
          <div className="px-5 pb-3">
            <input
              data-testid="input-withdraw-amount"
              type="number"
              placeholder="Entrez le montant de retrait"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-base outline-none focus:border-[#22c55e] placeholder-gray-300 bg-gray-50"
            />
            {netAmount !== null && (
              <p className="text-gray-400 text-xs mt-1.5 ml-1">
                Frais {withdrawFeePercent}% → Net reçu : <span className="font-semibold text-gray-600">{formatCFA(netAmount)}</span>
              </p>
            )}
          </div>

          <div className="h-px bg-gray-100 mx-5" />

          {/* Mot de passe transaction */}
          <div className="px-5 py-3">
            <div className="relative">
              <input
                data-testid="input-tx-password"
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe de transaction"
                value={txPassword}
                onChange={e => setTxPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-base outline-none focus:border-[#22c55e] placeholder-gray-300 bg-gray-50 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                data-testid="button-toggle-password"
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Bouton retrait ─────────────────────────── */}
        <button
          data-testid="button-submit-withdraw"
          onClick={handleWithdraw}
          disabled={withdrawMutation.isPending}
          className="w-full py-4 rounded-full font-bold text-white text-base disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)" }}
        >
          {withdrawMutation.isPending ? "En cours..." : "Retrait"}
        </button>

        {/* Lien enregistrement */}
        <div className="text-center -mt-2">
          <button
            onClick={() => navigate("/transactions")}
            data-testid="link-withdraw-history"
            className="text-[#22c55e] text-sm font-medium"
          >
            Enregistrement de retrait
          </button>
        </div>

        {/* ── Informations ───────────────────────────── */}
        <div className="bg-gray-50 rounded-2xl px-5 py-4 space-y-4 text-sm text-gray-600 leading-relaxed">
          <div>
            <p className="font-bold text-gray-800 mb-1">Délais de retrait :</p>
            <p>
              Les retraits sont possibles de {startH}h00 à {endH}h00.
              Les fonds seront disponibles sous 10 à 30 minutes après le retrait.
              Veuillez lier vos informations bancaires avant d'effectuer un retrait.
            </p>
          </div>

          <div className="h-px bg-gray-200" />

          <div>
            <p className="font-bold text-gray-800 mb-1">Montant du retrait :</p>
            <p>
              Le montant minimum de retrait est de{" "}
              <span className="text-[#22c55e] font-bold">{withdrawMinAmount.toLocaleString("fr-FR")} CFA</span>.
              Des frais de {withdrawFeePercent}% sont déduits du montant retiré.
              Maximum autorisé : 4 500 000 FCFA. 2 retraits par jour maximum.
            </p>
          </div>
        </div>

        <div className="pb-6" />
      </div>
    </div>
  );
}
