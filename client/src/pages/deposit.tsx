import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { BKAPAY_KEY, COUNTRIES, formatCFA } from "@/lib/constants";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ChevronRight, X, Zap, Link2 } from "lucide-react";
import { useLocation } from "wouter";

export default function DepositPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [amount, setAmount] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [showMethodSheet, setShowMethodSheet] = useState(false);
  const [tempChannelId, setTempChannelId] = useState<string>("");
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkFormData, setLinkFormData] = useState({
    accountName: "",
    phoneNumber: user?.phone || "",
    paymentMethod: "",
    country: user?.country || "",
  });

  const { data: channels = [] } = useQuery<any[]>({ queryKey: ["/api/channels"] });
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });

  const depositMinAmount = settings?.depositMinAmount || 1000;

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

  const handleRecharge = () => {
    const amt = parseInt(amount);
    if (!amt || amt < depositMinAmount) {
      toast({ title: "Erreur", description: `Montant minimum: ${formatCFA(depositMinAmount)}`, variant: "destructive" });
      return;
    }
    if (!selectedChannelId && (channels as any[]).length > 0) {
      toast({ title: "Erreur", description: "Veuillez choisir une méthode de recharge", variant: "destructive" });
      return;
    }

    if (!selectedChannel || selectedChannel.type === "leekpay") {
      if (user?.country === "cameroun") {
        const callbackUrl = encodeURIComponent(`${window.location.origin}/api/payment/callback`);
        const desc = encodeURIComponent(`Dépôt - ${user?.phone}`);
        window.location.href = `https://bkapay.com/api-pay/${BKAPAY_KEY}?amount=${amt}&description=${desc}&callback=${callbackUrl}`;
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

    setShowLinkForm(true);
  };

  const handleLinkDeposit = () => {
    const amt = parseInt(amount);
    if (!linkFormData.accountName || !linkFormData.phoneNumber || !linkFormData.paymentMethod || !linkFormData.country) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }
    depositMutation.mutate({
      amount: amt,
      country: linkFormData.country,
      paymentMethod: linkFormData.paymentMethod,
      phoneNumber: linkFormData.phoneNumber,
      accountName: linkFormData.accountName,
      channelId: selectedChannel?.id,
      channelName: selectedChannel?.name,
    });
    if (selectedChannel?.redirectUrl) {
      setTimeout(() => window.open(selectedChannel.redirectUrl, "_blank"), 500);
    }
  };

  const handleConfirmMethod = () => {
    setSelectedChannelId(tempChannelId);
    setShowMethodSheet(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#22c55e] px-4 pt-5 pb-10 relative">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate("/")} data-testid="button-back-deposit" className="p-1">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white font-bold text-lg">Recharger</h1>
          <button
            onClick={() => navigate("/deposit-history")}
            className="text-white text-sm"
            data-testid="button-deposit-history"
          >
            Historique &gt;
          </button>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-3 pb-10">
        {/* Amount card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="font-bold text-gray-900 text-base mb-4">Montant de la recharge</p>
          <input
            data-testid="input-deposit-amount"
            type="number"
            placeholder="Entrez le montant"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full text-gray-400 text-lg outline-none border-b border-gray-200 pb-2 mb-3 bg-transparent"
          />
          <p className="text-gray-500 text-sm">Montant minimum de recharge: <span className="font-medium">{depositMinAmount.toFixed(2)}</span></p>
        </div>

        {/* Method selection row */}
        <div
          className="bg-white rounded-2xl shadow-sm cursor-pointer"
          onClick={() => { setTempChannelId(selectedChannelId); setShowMethodSheet(true); }}
          data-testid="button-choose-method"
        >
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-gray-700 font-medium text-sm">Méthode de recharge</p>
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              {selectedChannel ? (
                <span className="text-gray-800 font-medium">{selectedChannel.name}</span>
              ) : (
                <span>Veuillez choisir une méthode de recharge</span>
              )}
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Recharger button */}
        <button
          data-testid="button-deposit-now"
          onClick={handleRecharge}
          disabled={depositMutation.isPending}
          className="w-full py-4 bg-[#22c55e] text-white font-bold rounded-2xl text-base shadow-md disabled:opacity-60"
        >
          {depositMutation.isPending ? "En cours..." : "Recharger"}
        </button>

        {/* Instructions */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="font-bold text-gray-900 text-base mb-3">Instructions de recharge</p>
          <div className="space-y-2 text-gray-500 text-sm leading-relaxed">
            <p>1. Entrez le montant et choisissez votre méthode de recharge</p>
            <p>2. Remplissez vos informations de paiement si demandé</p>
            <p>3. Dépôt traité sous 5 minutes, contactez le service client si nécessaire</p>
            <p>4. Ne modifiez pas le montant une fois le paiement initié</p>
          </div>
        </div>
      </div>

      {/* Method selection bottom sheet */}
      {showMethodSheet && (
        <div className="fixed inset-0 z-50" onClick={() => setShowMethodSheet(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div className="px-5 pt-4 pb-2 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <p className="font-bold text-gray-900 text-base">Méthode de recharge</p>
            </div>

            {/* Channel list */}
            <div className="divide-y divide-gray-100 px-2">
              {(channels as any[]).length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">Aucune méthode disponible</p>
              ) : (
                (channels as any[]).map((ch: any) => (
                  <label
                    key={ch.id}
                    className="flex items-center justify-between py-4 px-3 cursor-pointer"
                    data-testid={`sheet-channel-${ch.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-50 rounded-full flex items-center justify-center">
                        {ch.type === "leekpay" ? (
                          <Zap className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <Link2 className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-gray-800 font-medium text-sm">{ch.name}</p>
                        <p className="text-xs text-gray-400">{ch.type === "leekpay" ? "Paiement automatique" : "Paiement par lien"}</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      tempChannelId === ch.id ? "border-[#22c55e]" : "border-gray-300"
                    }`}>
                      {tempChannelId === ch.id && <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />}
                    </div>
                    <input
                      type="radio"
                      name="temp-channel"
                      value={ch.id}
                      checked={tempChannelId === ch.id}
                      onChange={() => setTempChannelId(ch.id)}
                      className="hidden"
                    />
                  </label>
                ))
              )}
            </div>

            {/* Annuler / Confirmer */}
            <div className="flex items-center justify-between px-6 py-5 border-t border-gray-100">
              <button
                onClick={() => setShowMethodSheet(false)}
                className="text-gray-600 font-medium text-base"
                data-testid="button-cancel-method"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmMethod}
                disabled={!tempChannelId}
                className="text-[#22c55e] font-bold text-base disabled:text-gray-300"
                data-testid="button-confirm-method"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Payment Form bottom sheet */}
      {showLinkForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">Informations de paiement</h3>
              <button onClick={() => setShowLinkForm(false)} data-testid="btn-close-link-form">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Canal: <strong>{selectedChannel?.name}</strong> | Montant: <strong>{parseInt(amount).toLocaleString()} FCFA</strong>
            </p>
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
