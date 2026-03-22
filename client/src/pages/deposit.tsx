import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { BKAPAY_KEY, formatCFA } from "@/lib/constants";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ChevronRight, X, Zap, Link2, CreditCard } from "lucide-react";
import { useLocation } from "wouter";
import robotpayIcon from "@assets/icon_2_1774133145999.png";

export default function DepositPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [amount, setAmount] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [showMethodSheet, setShowMethodSheet] = useState(false);
  const [tempChannelId, setTempChannelId] = useState<string>("");
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [linkFormData, setLinkFormData] = useState({
    accountName: "",
    phoneNumber: user?.phone || "",
    paymentMethod: "",
    country: user?.country || "",
  });

  const { data: channels = [] } = useQuery<any[]>({ queryKey: ["/api/channels"] });
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });
  const { data: countriesRaw = [] } = useQuery({ queryKey: ["/api/countries"] });
  const countriesList = countriesRaw as any[];

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
      toast({ title: e.message || "Erreur", variant: "destructive" });
    }
  });

  const westpayMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/user/deposit/westpay/init", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.payUrl) {
        setIsRedirecting(true);
        window.location.href = data.payUrl;
      }
    },
    onError: (e: any) => {
      toast({ title: e.message || "Erreur WestPay", variant: "destructive" });
    }
  });

  const selectedChannel = (channels as any[]).find((c: any) => c.id === selectedChannelId);

  const channelIcon = (type: string) => {
    if (type === "leekpay") return <Zap className="w-4 h-4 text-yellow-500" />;
    if (type === "westpay") return <img src={robotpayIcon} alt="RobotPay" className="w-6 h-6 object-contain" />;
    return <Link2 className="w-4 h-4 text-green-600" />;
  };

  const channelLabel = (type: string) => {
    if (type === "leekpay") return "Paiement automatique";
    if (type === "westpay") return "Paiement Mobile Money sécurisé";
    return "Paiement par lien";
  };

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

    // WestPay channel: redirect to hosted payment page
    if (selectedChannel?.type === "westpay") {
      westpayMutation.mutate({
        amount: amt,
        channelId: selectedChannel.id,
        channelName: selectedChannel.name,
      });
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
        amount: amt, country: user?.country || "", paymentMethod: "LeekPay",
        phoneNumber: user?.phone, channelId: selectedChannelId || null, channelName: selectedChannel?.name || "LeekPay",
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
      amount: amt, country: linkFormData.country, paymentMethod: linkFormData.paymentMethod,
      phoneNumber: linkFormData.phoneNumber, accountName: linkFormData.accountName,
      channelId: selectedChannel?.id, channelName: selectedChannel?.name,
    });
    if (selectedChannel?.redirectUrl) {
      setTimeout(() => window.open(selectedChannel.redirectUrl, "_blank"), 500);
    }
  };

  const isPending = depositMutation.isPending || westpayMutation.isPending || isRedirecting;

  return (
    <div className="bg-white">
      {/* Green header */}
      <div className="bg-[#22c55e] px-4 pt-6 pb-6">
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => navigate("/")} data-testid="button-back-deposit" className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-bold text-lg">Recharger</h1>
          <button onClick={() => navigate("/transactions")} className="text-white text-sm" data-testid="button-deposit-history">
            Historique &gt;
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-5 space-y-0">

        {/* Amount section */}
        <div className="border-b border-gray-100 pb-5 mb-5">
          <p className="font-bold text-gray-900 text-base mb-4">Montant de la recharge</p>
          <input
            data-testid="input-deposit-amount"
            type="number"
            placeholder="Entrez le montant"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full text-gray-500 text-base outline-none pb-2 border-b border-gray-200 bg-transparent placeholder-gray-300"
          />
          <p className="text-gray-500 text-sm mt-3">
            Montant minimum de recharge : <span className="font-semibold">{depositMinAmount.toFixed(2)}</span>
          </p>
        </div>

        {/* Method selection row */}
        <div
          className="flex items-center justify-between py-4 border-b border-gray-100 cursor-pointer"
          onClick={() => { setTempChannelId(selectedChannelId); setShowMethodSheet(true); }}
          data-testid="button-choose-method"
        >
          <p className="text-gray-700 font-medium text-sm">Méthode de recharge</p>
          <div className="flex items-center gap-1">
            <span className="text-gray-400 text-sm">
              {selectedChannel ? selectedChannel.name : "Veuillez choisir une méthode de recharge"}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Recharger button */}
        <div className="pt-6">
          <button
            data-testid="button-deposit-now"
            onClick={handleRecharge}
            disabled={isPending}
            className="w-full py-4 bg-[#22c55e] text-white font-bold rounded-xl text-base disabled:opacity-60"
          >
            {isRedirecting ? "Redirection vers WestPay..." : isPending ? "En cours..." : "Recharger"}
          </button>
        </div>

        {/* Instructions */}
        <div className="pt-6">
          <p className="font-bold text-gray-900 text-base mb-3">Instructions de recharge</p>
          <div className="space-y-2 text-gray-500 text-sm leading-relaxed">
            <p>1. Entrez le montant et choisissez votre méthode de recharge</p>
            <p>2. Remplissez vos informations de paiement si demandé</p>
            <p>3. Dépôt traité sous 5 minutes, contactez le service client si nécessaire</p>
            <p>4. Ne modifiez pas le montant une fois le paiement initié</p>
          </div>
        </div>
      </div>

      {/* Method bottom sheet */}
      {showMethodSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end overlay-fade-in"
          onClick={() => setShowMethodSheet(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-full bg-white rounded-t-3xl flex flex-col modal-zoom-in"
            style={{ minHeight: "52vh", maxHeight: "75vh" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Title + Confirmer */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 pt-3 pb-4 border-b border-gray-100">
              <p className="font-bold text-gray-900 text-base">Méthode de recharge</p>
              <button
                onClick={() => { setSelectedChannelId(tempChannelId); setShowMethodSheet(false); }}
                disabled={!tempChannelId}
                className="text-[#22c55e] font-bold text-base disabled:text-gray-300"
                data-testid="button-confirm-method"
              >
                Confirmer
              </button>
            </div>

            {/* Scrollable channel list */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {(channels as any[]).length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">Aucune méthode disponible</p>
              ) : (
                (channels as any[]).map((ch: any) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between py-4 px-5 cursor-pointer active:bg-gray-50"
                    onClick={() => setTempChannelId(ch.id)}
                    data-testid={`sheet-channel-${ch.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white border border-gray-100 rounded-full flex items-center justify-center">
                        {channelIcon(ch.type)}
                      </div>
                      <div>
                        <p className="text-gray-900 font-bold text-sm">{ch.name}</p>
                        <p className="text-xs text-gray-400">{channelLabel(ch.type)}</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${tempChannelId === ch.id ? "border-[#22c55e]" : "border-gray-300"}`}>
                      {tempChannelId === ch.id && <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Link Payment Form bottom sheet */}
      {showLinkForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-5" style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">Informations de paiement</h3>
              <button onClick={() => setShowLinkForm(false)} data-testid="btn-close-link-form"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Canal: <strong>{selectedChannel?.name}</strong> | Montant: <strong>{parseInt(amount).toLocaleString()} FCFA</strong>
            </p>
            <div className="space-y-4">
              {[
                { key: "accountName", label: "Nom du compte de paiement", placeholder: "Votre nom", type: "text", testId: "input-link-account-name" },
                { key: "phoneNumber", label: "Numéro de téléphone de paiement", placeholder: "Ex: 0701234567", type: "tel", testId: "input-link-phone" },
                { key: "paymentMethod", label: "Moyen de paiement", placeholder: "Ex: Wave, Orange Money, MTN...", type: "text", testId: "input-link-payment-method" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-600">{f.label}</label>
                  <input
                    data-testid={f.testId}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(linkFormData as any)[f.key]}
                    onChange={e => setLinkFormData({ ...linkFormData, [f.key]: e.target.value })}
                    className="w-full mt-1 border-b border-gray-200 py-2 text-sm outline-none bg-transparent"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-600">Pays</label>
                <select
                  data-testid="select-link-country"
                  value={linkFormData.country}
                  onChange={e => setLinkFormData({ ...linkFormData, country: e.target.value })}
                  className="w-full mt-1 border-b border-gray-200 py-2 text-sm outline-none bg-white"
                >
                  <option value="">Sélectionner un pays</option>
                  {countriesList.map((c: any) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <button
                data-testid="button-link-proceed"
                onClick={handleLinkDeposit}
                disabled={depositMutation.isPending}
                className="w-full py-4 bg-[#22c55e] text-white font-bold rounded-xl text-base mt-2 disabled:opacity-60"
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
