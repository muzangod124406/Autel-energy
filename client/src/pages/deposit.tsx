import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { BKAPAY_KEY, formatCFA } from "@/lib/constants";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ChevronRight, X, Zap, Link2, Smartphone } from "lucide-react";
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

  // SoleasPay state
  const [showSoleasForm, setShowSoleasForm] = useState(false);
  const [soleasOperator, setSoleasOperator] = useState("");
  const [soleasPhone, setSoleasPhone] = useState("");
  const [soleasCountry, setSoleasCountry] = useState(user?.country || "");
  const [soleasSuccess, setSoleasSuccess] = useState(false);

  const { data: channels = [] } = useQuery<any[]>({ queryKey: ["/api/channels"] });
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });
  const { data: countriesRaw = [] } = useQuery({ queryKey: ["/api/countries"] });
  const countriesList = countriesRaw as any[];

  const depositMinAmount = settings?.depositMinAmount || 1000;

  // Find user's country info to get payment provider
  const userCountryInfo = countriesList.find((c: any) => c.slug === user?.country);
  const paymentProvider: string = userCountryInfo?.paymentProvider || "westpay";
  const showSoleasPay = paymentProvider === "soleaspay" || paymentProvider === "both";
  const showWestPay = paymentProvider === "westpay" || paymentProvider === "both";

  // Find the SoleasPay channel defined by admin (type="soleaspay") to get its custom name
  const soleasChannel = (channels as any[]).find((c: any) => c.type === "soleaspay" && c.isActive);
  const soleasChannelName = soleasChannel?.name || "SoleasPay";

  // SoleasPay operators — loaded dynamically based on selected country in the form
  const { data: soleasOperators = [] } = useQuery<string[]>({
    queryKey: ["/api/soleaspay/operators", soleasCountry],
    queryFn: async () => {
      if (!soleasCountry) return [];
      const res = await fetch(`/api/soleaspay/operators/${soleasCountry}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!soleasCountry && showSoleasPay,
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

  const soleasPayMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/user/deposit/soleaspay/init", data);
      return res.json();
    },
    onSuccess: () => {
      setSoleasSuccess(true);
      setShowSoleasForm(false);
      toast({ title: "Demande envoyée !", description: "Confirmez le paiement sur votre téléphone." });
    },
    onError: (e: any) => {
      toast({ title: e.message || "Erreur SoleasPay", variant: "destructive" });
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

  const handleSoleasDeposit = () => {
    const amt = parseInt(amount);
    if (!amt || amt < depositMinAmount) {
      toast({ title: "Erreur", description: `Montant minimum: ${formatCFA(depositMinAmount)}`, variant: "destructive" });
      return;
    }
    if (!soleasCountry) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un pays", variant: "destructive" });
      return;
    }
    if (!soleasOperator) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un opérateur", variant: "destructive" });
      return;
    }
    if (!soleasPhone) {
      toast({ title: "Erreur", description: "Numéro de téléphone requis", variant: "destructive" });
      return;
    }
    soleasPayMutation.mutate({ amount: amt, operator: soleasOperator, phoneNumber: soleasPhone, country: soleasCountry });
  };

  const handleRecharge = () => {
    const amt = parseInt(amount);
    if (!amt || amt < depositMinAmount) {
      toast({ title: "Erreur", description: `Montant minimum: ${formatCFA(depositMinAmount)}`, variant: "destructive" });
      return;
    }
    if (!selectedChannelId && ((channels as any[]).length > 0 || showSoleasPay)) {
      toast({ title: "Erreur", description: "Veuillez choisir une méthode de recharge", variant: "destructive" });
      return;
    }

    // SoleasPay virtual channel
    if (selectedChannelId === "__soleaspay__") {
      setShowSoleasForm(true);
      setSoleasSuccess(false);
      return;
    }

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

  const isPending = depositMutation.isPending || westpayMutation.isPending || soleasPayMutation.isPending || isRedirecting;

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

        {/* Méthode de recharge — toujours visible */}
        <div
          className="flex items-center justify-between py-4 border-b border-gray-100 cursor-pointer"
          onClick={() => { setTempChannelId(selectedChannelId); setShowMethodSheet(true); }}
          data-testid="button-choose-method"
        >
          <p className="text-gray-700 font-medium text-sm">Méthode de recharge</p>
          <div className="flex items-center gap-1">
            <span className="text-gray-400 text-sm">
              {selectedChannelId === "__soleaspay__"
                ? soleasChannelName
                : selectedChannel
                ? selectedChannel.name
                : "Veuillez choisir une méthode de recharge"}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {soleasSuccess && selectedChannelId === "__soleaspay__" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mt-3">
            <p className="text-green-700 font-bold text-sm">✓ Demande envoyée !</p>
            <p className="text-green-600 text-xs mt-1">Confirmez le paiement sur votre téléphone. Le crédit sera ajouté automatiquement.</p>
          </div>
        )}

        <div className="pt-6">
          <button
            data-testid="button-deposit-now"
            onClick={handleRecharge}
            disabled={isPending}
            className="w-full py-4 bg-[#22c55e] text-white font-bold rounded-xl text-base disabled:opacity-60"
          >
            {isRedirecting ? "Redirection..." : isPending ? "En cours..." : "Recharger"}
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

      {/* SoleasPay form bottom sheet */}
      {showSoleasForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl flex flex-col" style={{ maxHeight: "92vh" }}>
            {/* Header fixe */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" /> {soleasChannelName}
              </h3>
              <button onClick={() => setShowSoleasForm(false)} data-testid="btn-close-soleas-form"><X className="w-5 h-5" /></button>
            </div>

            {/* Corps scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5" style={{ paddingBottom: "6rem" }}>
              <p className="text-sm text-gray-500">
                Montant : <strong>{parseInt(amount || "0").toLocaleString()} FCFA</strong>
              </p>

              {/* Country selector */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Pays de paiement</p>
                <div className="grid grid-cols-2 gap-2">
                  {countriesList
                    .filter((c: any) => c.isActive)
                    .map((c: any) => (
                      <button
                        key={c.slug}
                        data-testid={`btn-soleas-country-${c.slug}`}
                        onClick={() => { setSoleasCountry(c.slug); setSoleasOperator(""); }}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-medium text-left transition-all ${
                          soleasCountry === c.slug
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 text-gray-700"
                        }`}
                      >
                        {c.flag && <span className="mr-1">{c.flag}</span>}{c.name}
                      </button>
                    ))}
                </div>
              </div>

              {/* Operator selection */}
              {soleasCountry && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Opérateur Mobile Money</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(soleasOperators as string[]).length > 0 ? (
                      (soleasOperators as string[]).map((op: string) => (
                        <button
                          key={op}
                          data-testid={`btn-operator-${op}`}
                          onClick={() => setSoleasOperator(op)}
                          className={`py-3 px-3 rounded-xl border text-sm font-medium transition-all ${
                            soleasOperator === op
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 text-gray-700"
                          }`}
                        >
                          {op}
                        </button>
                      ))
                    ) : (
                      <p className="col-span-2 text-center text-sm text-gray-400 py-3">
                        Aucun opérateur disponible pour ce pays
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Phone number */}
              <div>
                <label className="text-xs font-semibold text-gray-700">Numéro Mobile Money</label>
                <input
                  data-testid="input-soleas-phone"
                  type="tel"
                  placeholder="Ex: 0701234567"
                  value={soleasPhone}
                  onChange={e => setSoleasPhone(e.target.value)}
                  className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-blue-400 bg-transparent"
                />
              </div>

              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-700">
                  Après confirmation, vous recevrez une notification sur votre téléphone pour valider le paiement.
                </p>
              </div>
            </div>

            {/* Bouton fixe en bas — toujours visible */}
            <div className="flex-shrink-0 px-5 py-4 bg-white border-t border-gray-100">
              <button
                data-testid="button-soleas-pay"
                onClick={handleSoleasDeposit}
                disabled={soleasPayMutation.isPending || !soleasOperator || !soleasPhone || !soleasCountry}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl text-base disabled:opacity-50"
              >
                {soleasPayMutation.isPending ? "Envoi en cours..." : "Payer maintenant"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Method bottom sheet — channels list */}
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
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
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
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {(channels as any[]).filter((c: any) => c.type !== "soleaspay").length === 0 && !showSoleasPay ? (
                <p className="text-center text-gray-400 text-sm py-8">Aucune méthode disponible</p>
              ) : (
                <>
                  {/* SoleasPay virtual channel */}
                  {showSoleasPay && (
                    <div
                      className="flex items-center justify-between py-4 px-5 cursor-pointer active:bg-gray-50"
                      onClick={() => setTempChannelId("__soleaspay__")}
                      data-testid="sheet-channel-soleaspay"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-bold text-sm">{soleasChannelName}</p>
                          <p className="text-xs text-gray-400">Push Mobile Money</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${tempChannelId === "__soleaspay__" ? "border-[#22c55e]" : "border-gray-300"}`}>
                        {tempChannelId === "__soleaspay__" && <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />}
                      </div>
                    </div>
                  )}

                  {/* Regular channels — exclude soleaspay type (handled by virtual item above) */}
                  {(channels as any[]).filter((ch: any) => ch.type !== "soleaspay").map((ch: any) => (
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
                  ))}
                </>
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
