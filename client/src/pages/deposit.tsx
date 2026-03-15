import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { BKAPAY_KEY } from "@/lib/constants";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

const QUICK_AMOUNTS = [2000, 3000, 5000, 8000, 10000, 20000, 30000, 50000];

const CHANNELS = [
  { id: "cote_divoire", label: "Recharge en Côte d'Ivoire" },
  { id: "togo", label: "Recharge au Togo" },
  { id: "benin", label: "Recharge au Bénin" },
  { id: "senegal", label: "Recharge au Sénégal" },
  { id: "cameroun", label: "Recharge au Cameroun" },
  { id: "burkina_faso", label: "Recharge au Burkina Faso" },
  { id: "usdt", label: "UsdtPay Channel 2" },
];

export default function DepositPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [amount, setAmount] = useState("");
  const [selectedChannel, setSelectedChannel] = useState(user?.country || CHANNELS[0].id);

  const depositMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/user/deposit", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Dépôt enregistré", description: "Votre dépôt est en attente de validation" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      refreshUser();
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
  });

  const handleDeposit = () => {
    const amt = parseInt(amount);
    if (!amt || amt < 100) {
      toast({ title: "Erreur", description: "Montant minimum: 100 FCFA", variant: "destructive" });
      return;
    }
    if (selectedChannel === "usdt") {
      depositMutation.mutate({ amount: amt, country: selectedChannel, paymentMethod: "USDT", phoneNumber: user?.phone });
      return;
    }
    if (user?.country === "cameroun" || selectedChannel === "cameroun") {
      const callbackUrl = encodeURIComponent(`${window.location.origin}/api/payment/callback`);
      const desc = encodeURIComponent(`Dépôt - ${user?.phone}`);
      const url = `https://bkapay.com/api-pay/${BKAPAY_KEY}?amount=${amt}&description=${desc}&callback=${callbackUrl}`;
      window.location.href = url;
      return;
    }
    depositMutation.mutate({
      amount: amt,
      country: selectedChannel,
      paymentMethod: "Mobile Money",
      phoneNumber: user?.phone,
    });
  };

  return (
    <div className="min-h-screen bg-[#f0f0e4]">
      <div className="bg-[#22c55e] px-4 pt-5 pb-8 relative">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/")} data-testid="button-back-deposit">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white font-bold text-lg">recharge</h1>
          <button
            onClick={() => navigate("/deposit-history")}
            className="bg-white/20 text-white text-sm px-3 py-1 rounded-full"
            data-testid="button-deposit-history"
          >
            Historique &gt;
          </button>
        </div>

        <div className="bg-white rounded-xl px-4 py-3 mb-4">
          <div className="flex items-center gap-1">
            <span className="text-gray-500 text-sm font-medium">FCFA</span>
            <input
              data-testid="input-deposit-amount"
              type="number"
              placeholder="0000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="flex-1 outline-none text-gray-800 text-base bg-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map(amt => (
            <button
              key={amt}
              data-testid={`button-amount-${amt}`}
              onClick={() => setAmount(String(amt))}
              className={`py-2 rounded-full text-sm font-medium transition-colors ${
                amount === String(amt)
                  ? "bg-white text-[#22c55e]"
                  : "bg-[#22c55e]/40 text-white border border-white/40"
              }`}
            >
              {amt >= 1000 ? `${amt / 1000 >= 1 ? amt.toLocaleString() : amt}` : amt}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-gray-900 font-bold text-base">Canal de recharge</h2>
            <div className="w-10 h-1 bg-[#22c55e] rounded-full mt-1" />
          </div>

          <div className="divide-y divide-gray-100">
            {CHANNELS.map(ch => (
              <label
                key={ch.id}
                className="flex items-center justify-between py-4 cursor-pointer"
                data-testid={`channel-${ch.id}`}
              >
                <span className="text-gray-700 text-sm">{ch.label}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedChannel === ch.id ? "border-blue-500" : "border-gray-300"
                }`}>
                  {selectedChannel === ch.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  )}
                </div>
                <input
                  type="radio"
                  name="channel"
                  value={ch.id}
                  checked={selectedChannel === ch.id}
                  onChange={() => setSelectedChannel(ch.id)}
                  className="hidden"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-[#22c55e] font-bold text-base mb-3">Explication</h3>
          <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
            <p>1. Veuillez ne pas modifier le montant du dépôt. La modification non autorisée du montant du dépôt entraînera le non-crédit du dépôt</p>
            <p>2. Chaque dépôt nécessite que le paiement soit initié via cette page, veuillez ne pas enregistrer le paiement</p>
            <p>3. Dépôt reçu dans les 5 minutes, s'il n'est pas reçu dans les 5 minutes, veuillez contacter le service client en ligne pour traitement</p>
            <p>4. En raison du nombre élevé d'utilisateurs de dépôt, veuillez essayer plusieurs fois pour obtenir le lien de dépôt ou réessayer après un certain temps</p>
          </div>
        </div>

        <div className="pb-6">
          <button
            data-testid="button-deposit-now"
            onClick={handleDeposit}
            disabled={depositMutation.isPending}
            className="w-full py-4 bg-[#22c55e] text-white font-bold rounded-full text-base shadow-md"
          >
            {depositMutation.isPending ? "En cours..." : "Recharger maintenant"}
          </button>
        </div>
      </div>
    </div>
  );
}
