import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { BKAPAY_KEY, COUNTRIES } from "@/lib/constants";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, X, Link2, Zap } from "lucide-react";
import { useLocation } from "wouter";

const QUICK_AMOUNTS = [2000, 3000, 5000, 8000, 10000, 20000, 30000, 50000];

export default function DepositPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [amount, setAmount] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkFormData, setLinkFormData] = useState({
    accountName: "",
    phoneNumber: user?.phone || "",
    paymentMethod: "",
    country: user?.country || "",
  });

  const { data: channels = [] } = useQuery<any[]>({
    queryKey: ["/api/channels"],
  });

  const depositMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/user/deposit", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Dépôt enregistré", description: "Votre dépôt est en attente de validation" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      refreshUser();
      setShowLinkForm(false);
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
  });

  const selectedChannel = (channels as any[]).find((c: any) => c.id === selectedChannelId);

  const handleProceed = () => {
    const amt = parseInt(amount);
    if (!amt || amt < 100) {
      toast({ title: "Erreur", description: "Montant minimum: 100 FCFA", variant: "destructive" });
      return;
    }

    if (!selectedChannelId && (channels as any[]).length > 0) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un canal de recharge", variant: "destructive" });
      return;
    }

    if (!selectedChannel || selectedChannel.type === "leekpay") {
      // LeekPay automatic or fallback
      if (user?.country === "cameroun") {
        const callbackUrl = encodeURIComponent(`${window.location.origin}/api/payment/callback`);
        const desc = encodeURIComponent(`Dépôt - ${user?.phone}`);
        const url = `https://bkapay.com/api-pay/${BKAPAY_KEY}?amount=${amt}&description=${desc}&callback=${callbackUrl}`;
        window.location.href = url;
        return;
      }
      depositMutation.mutate({
        amount: amt,
        country: user?.country || "",
        paymentMethod: "LeekPay",
        phoneNumber: user?.phone,
        channelId: selectedChannelId || null,
        channelName: selectedChannel?.name || "LeekPay",
      });
      return;
    }

    // Link channel — show the form
    setShowLinkForm(true);
  };

  const handleLinkDeposit = () => {
    const amt = parseInt(amount);
    if (!linkFormData.accountName || !linkFormData.phoneNumber || !linkFormData.paymentMethod || !linkFormData.country) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }

    // Record the transaction first
    depositMutation.mutate({
      amount: amt,
      country: linkFormData.country,
      paymentMethod: linkFormData.paymentMethod,
      phoneNumber: linkFormData.phoneNumber,
      accountName: linkFormData.accountName,
      channelId: selectedChannel?.id,
      channelName: selectedChannel?.name,
    });

    // Then redirect to the payment link
    if (selectedChannel?.redirectUrl) {
      setTimeout(() => {
        window.open(selectedChannel.redirectUrl, "_blank");
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f0e4]">
      <div className="bg-[#22c55e] px-4 pt-5 pb-8 relative">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/")} data-testid="button-back-deposit">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white font-bold text-lg">Recharge</h1>
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
              {amt.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Channel selection */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-gray-900 font-bold text-base">Canal de recharge</h2>
            <div className="w-10 h-1 bg-[#22c55e] rounded-full mt-1" />
          </div>

          {(channels as any[]).length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-2">Aucun canal disponible pour le moment</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {(channels as any[]).map((ch: any) => (
                <label
                  key={ch.id}
                  className="flex items-center justify-between py-4 cursor-pointer"
                  data-testid={`channel-${ch.id}`}
                >
                  <div className="flex items-center gap-2">
                    {ch.type === "leekpay" ? (
                      <Zap className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <Link2 className="w-4 h-4 text-blue-500" />
                    )}
                    <div>
                      <span className="text-gray-700 text-sm font-medium">{ch.name}</span>
                      <p className="text-[10px] text-gray-400">{ch.type === "leekpay" ? "Paiement automatique" : "Paiement par lien"}</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedChannelId === ch.id ? "border-blue-500" : "border-gray-300"
                  }`}>
                    {selectedChannelId === ch.id && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <input
                    type="radio"
                    name="channel"
                    value={ch.id}
                    checked={selectedChannelId === ch.id}
                    onChange={() => setSelectedChannelId(ch.id)}
                    className="hidden"
                  />
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-[#22c55e] font-bold text-base mb-3">Instructions</h3>
          <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
            <p>1. Entrez le montant et sélectionnez votre canal de recharge</p>
            <p>2. Pour les canaux par lien, remplissez vos informations de paiement puis procédez au paiement</p>
            <p>3. Dépôt traité sous 5 minutes, contactez le service client si nécessaire</p>
            <p>4. Ne modifiez pas le montant une fois le paiement initié</p>
          </div>
        </div>

        <div className="pb-6">
          <button
            data-testid="button-deposit-now"
            onClick={handleProceed}
            disabled={depositMutation.isPending}
            className="w-full py-4 bg-[#22c55e] text-white font-bold rounded-full text-base shadow-md disabled:opacity-60"
          >
            {depositMutation.isPending ? "En cours..." : "Procéder au paiement"}
          </button>
        </div>
      </div>

      {/* Link Payment Form Modal */}
      {showLinkForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">Informations de paiement</h3>
              <button onClick={() => setShowLinkForm(false)} data-testid="btn-close-link-form">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Canal: <strong>{selectedChannel?.name}</strong> | Montant: <strong>{parseInt(amount).toLocaleString()} FCFA</strong></p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Nom du compte de paiement</label>
                <input
                  data-testid="input-link-account-name"
                  type="text"
                  placeholder="Votre nom"
                  value={linkFormData.accountName}
                  onChange={e => setLinkFormData({ ...linkFormData, accountName: e.target.value })}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#22c55e]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Numéro de téléphone de paiement</label>
                <input
                  data-testid="input-link-phone"
                  type="tel"
                  placeholder="Ex: 0701234567"
                  value={linkFormData.phoneNumber}
                  onChange={e => setLinkFormData({ ...linkFormData, phoneNumber: e.target.value })}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#22c55e]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Pays</label>
                <select
                  data-testid="select-link-country"
                  value={linkFormData.country}
                  onChange={e => setLinkFormData({ ...linkFormData, country: e.target.value })}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#22c55e] bg-white"
                >
                  <option value="">Sélectionner un pays</option>
                  {(COUNTRIES as any[]).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Moyen de paiement</label>
                <input
                  data-testid="input-link-payment-method"
                  type="text"
                  placeholder="Ex: Wave, Orange Money, MTN..."
                  value={linkFormData.paymentMethod}
                  onChange={e => setLinkFormData({ ...linkFormData, paymentMethod: e.target.value })}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#22c55e]"
                />
              </div>
              <button
                data-testid="button-link-proceed"
                onClick={handleLinkDeposit}
                disabled={depositMutation.isPending}
                className="w-full py-4 bg-[#22c55e] text-white font-bold rounded-full text-base shadow-md mt-2 disabled:opacity-60"
              >
                {depositMutation.isPending ? "En cours..." : "Procéder au paiement →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
