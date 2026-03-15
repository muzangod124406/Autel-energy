import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Eye, EyeOff, CreditCard } from "lucide-react";
import { useLocation } from "wouter";

export default function WithdrawPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: bankCard } = useQuery({ queryKey: ["/api/user/bank-card"] });
  const card = bankCard as any;

  const [amount, setAmount] = useState("");
  const [txPassword, setTxPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [payType, setPayType] = useState<"fcfa" | "usdt">("fcfa");
  const [showNoCardDialog, setShowNoCardDialog] = useState(false);

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
    if (!card) {
      setShowNoCardDialog(true);
      return;
    }
    const amt = parseInt(amount);
    if (!amt || amt < 2000) {
      toast({ title: "Erreur", description: "Montant minimum : 2 000 FCFA", variant: "destructive" });
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
      amount: amt,
      country: user?.country,
      paymentMethod: card.paymentMethod,
      phoneNumber: card.phoneNumber,
      accountName: card.accountName,
      transactionPassword: txPassword,
    });
  };

  return (
    <div className="min-h-screen bg-[#f0f0e4] pb-24">
      {showNoCardDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-gray-500 text-base font-semibold mb-3">Notification système</h3>
            <p className="text-gray-700 text-sm mb-6">
              Vous n'avez pas encore lié votre carte bancaire. Veuillez d'abord lier votre carte bancaire
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNoCardDialog(false)}
                className="flex-1 h-11 rounded-full bg-gray-200 text-gray-700 font-semibold text-sm"
                data-testid="button-cancel-dialog"
              >
                Annuler
              </button>
              <button
                onClick={() => { setShowNoCardDialog(false); navigate("/bank-card"); }}
                className="flex-1 h-11 rounded-full bg-[#22c55e] text-white font-bold text-sm"
                data-testid="button-link-card"
              >
                Lier une carte
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#22c55e] px-4 pt-6 pb-10 relative">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-white" data-testid="button-back-withdraw">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white text-xl font-bold">retrait</h1>
          <button
            onClick={() => navigate("/transactions")}
            className="bg-white/10 border border-white/30 text-white text-xs px-3 py-1 rounded-lg"
            data-testid="button-history"
          >
            Historique &gt;
          </button>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-4">
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", minHeight: 130 }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 -ml-12 -mb-12" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="grid grid-cols-2 gap-1 w-10 h-8">
                {[0,1,2,3].map(i => (
                  <div key={i} className="bg-white/60 rounded-sm" />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-5 rounded-full bg-green-300/40 relative">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-green-200" />
                </div>
              </div>
            </div>
            {card ? (
              <>
                <p className="text-white font-bold text-lg mt-3">{card.phoneNumber}</p>
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <p className="text-white/70 text-xs">Nom du titulaire</p>
                    <p className="text-white font-semibold text-sm">{card.accountName || card.paymentMethod}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-4">
                <p className="text-white/70 text-xs">Nom du titulaire</p>
                <p className="text-white/60 text-sm mt-1">Aucune carte liée</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-800">Montant</label>
              <span className="text-xs text-gray-500">
                Solde du compte :{" "}
                <span className="font-bold text-gray-800">
                  FCFA{(user?.withdrawBalance || 0).toFixed(2)}
                </span>
              </span>
            </div>
            <Input
              data-testid="input-withdraw-amount"
              type="number"
              placeholder="Montant du retrait  2000-4500000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="bg-[#f5f5f5] border-none rounded-xl h-12 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-800 block mb-2">
              Mot de passe de transaction
            </label>
            <div className="relative">
              <Input
                data-testid="input-tx-password"
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe de transaction"
                value={txPassword}
                onChange={e => setTxPassword(e.target.value)}
                className="bg-[#f5f5f5] border-none rounded-xl h-12 text-sm pr-10"
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

          <div>
            <label className="text-sm font-semibold text-gray-800 block mb-3">Pay Type</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer" data-testid="radio-fcfa">
                <div
                  onClick={() => setPayType("fcfa")}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payType === "fcfa" ? "border-[#22c55e]" : "border-gray-300"}`}
                >
                  {payType === "fcfa" && <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />}
                </div>
                <span className="text-sm font-medium">FCFA</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer" data-testid="radio-usdt">
                <div
                  onClick={() => setPayType("usdt")}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payType === "usdt" ? "border-[#22c55e]" : "border-gray-300"}`}
                >
                  {payType === "usdt" && <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />}
                </div>
                <span className="text-sm font-medium">USDT</span>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-[#22c55e] font-bold text-base">Explication</h3>
          <div className="text-sm text-gray-700 space-y-1.5">
            <p>1. Horaires de retrait quotidiens de 09:00:00 à 17:00:00</p>
            <p>2. Montant de retrait unique entre 2000 et 4500000</p>
            <p>3. Pour faciliter le règlement financier, vous ne pouvez demander un retrait que 1 fois par jour</p>
            <p>4. En cas de problème avec votre retrait, veuillez contacter le service client</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 bg-[#f0f0e4] pt-2">
        <button
          data-testid="button-submit-withdraw"
          onClick={handleWithdraw}
          disabled={withdrawMutation.isPending}
          className="w-full h-13 py-3.5 rounded-full bg-[#22c55e] text-white font-bold text-base disabled:opacity-60 shadow-lg"
        >
          {withdrawMutation.isPending ? "En cours..." : "Demander un retrait"}
        </button>
      </div>
    </div>
  );
}
