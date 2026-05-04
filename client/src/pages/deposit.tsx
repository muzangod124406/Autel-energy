import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { BKAPAY_KEY, formatCFA } from "@/lib/constants";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ChevronRight, X, Zap, Link2 } from "lucide-react";
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
    phoneNumber: "",
    paymentMethod: "",
    country: user?.country || "",
  });

  const [soleasOperator, setSoleasOperator] = useState("");
  const [soleasPhone, setSoleasPhone] = useState("");
  const [soleasCountry, setSoleasCountry] = useState(user?.country || "");
  const [showSoleasPending, setShowSoleasPending] = useState(false);
  const [soleasPendingStatus, setSoleasPendingStatus] = useState<"pending" | "success" | "error">("pending");
  const [soleasTxId, setSoleasTxId] = useState<string | null>(null);
  const [soleasErrorMsg, setSoleasErrorMsg] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: channels = [] } = useQuery<any[]>({ queryKey: ["/api/channels"] });
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });
  const { data: countriesRaw = [] } = useQuery({ queryKey: ["/api/countries"] });
  const countriesList = countriesRaw as any[];

  const depositMinAmount = settings?.depositMinAmount || 1000;

  const userCountryInfo = countriesList.find((c: any) => c.slug === user?.country);
  const paymentProvider: string = userCountryInfo?.paymentProvider || "westpay";
  const showSoleasPay = paymentProvider === "soleaspay" || paymentProvider === "both";
  const showWestPay = paymentProvider === "westpay" || paymentProvider === "both";

  const soleasChannel = (channels as any[]).find((c: any) => c.type === "soleaspay" && c.isActive);
  const soleasChannelName = soleasChannel?.name || "SoleasPay";

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
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      refreshUser();
      setShowLinkForm(false);
      toast({ title: "Dépôt enregistré", description: "Votre dépôt est en attente de validation" });
    },
    onError: (e: any) => {
      toast({ title: e.message || "Erreur", variant: "destructive" });
    }
  });

  const soleasMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/user/deposit/soleaspay/init", data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur de paiement Mobile Money");
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      setSoleasTxId(data.txId);
    },
    onError: (e: any) => {
      setSoleasErrorMsg(e.message || "Erreur lors du lancement du paiement");
      setSoleasPendingStatus("error");
    }
  });

  useEffect(() => {
    if (!soleasTxId) return;
    if (pollingRef.current) clearInterval(pollingRef.current);
    const startedAt = Date.now();
    const TIMEOUT_MS = 5 * 60 * 1000;
    const poll = async () => {
      if (Date.now() - startedAt > TIMEOUT_MS) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = null;
        setSoleasTxId(null);
        setSoleasErrorMsg("Délai dépassé. Votre paiement est en cours de vérification, contactez le support si nécessaire.");
        setSoleasPendingStatus("error");
        return;
      }
      try {
        const res = await fetch(`/api/user/transaction/${soleasTxId}`, { credentials: "include" });
        if (!res.ok) return;
        const tx = await res.json();
        if (tx.status === "approved") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setSoleasTxId(null);
          queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
          refreshUser();
          setSoleasPhone("");
          setSoleasOperator("");
          setSoleasPendingStatus("success");
        } else if (tx.status === "rejected" || tx.status === "failed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setSoleasTxId(null);
          setSoleasErrorMsg("Paiement refusé ou échoué. Vérifiez votre solde Mobile Money.");
          setSoleasPendingStatus("error");
        }
      } catch { }
    };
    pollingRef.current = setInterval(poll, 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [soleasTxId]);

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
    if (type === "leekpay") return <Zap className="w-4 h-4 text-amber-500" />;
    if (type === "westpay") return <img src={robotpayIcon} alt="RobotPay" className="w-6 h-6 object-contain" />;
    return <Link2 className="w-4 h-4 text-amber-500" />;
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
    if (!selectedChannelId && ((channels as any[]).length > 0 || showSoleasPay)) {
      toast({ title: "Erreur", description: "Veuillez choisir une méthode de recharge", variant: "destructive" });
      return;
    }

    if (selectedChannelId === "__soleaspay__") {
      if (!soleasCountry || !soleasOperator || !soleasPhone) {
        toast({ title: "Erreur", description: "Veuillez choisir le pays, l'opérateur et entrer votre numéro", variant: "destructive" });
        return;
      }
      setSoleasErrorMsg("");
      setSoleasPendingStatus("pending");
      setShowSoleasPending(true);
      soleasMutation.mutate({
        amount: amt,
        country: soleasCountry,
        operator: soleasOperator,
        phoneNumber: soleasPhone,
        channelName: soleasChannelName,
      });
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
    const isSoleas = selectedChannelId === "__soleaspay__";
    const missingFields = isSoleas
      ? !linkFormData.phoneNumber || !linkFormData.paymentMethod || !linkFormData.country
      : !linkFormData.accountName || !linkFormData.phoneNumber || !linkFormData.paymentMethod || !linkFormData.country;
    if (missingFields) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }
    depositMutation.mutate({
      amount: amt, country: linkFormData.country, paymentMethod: linkFormData.paymentMethod,
      phoneNumber: linkFormData.phoneNumber, accountName: linkFormData.accountName,
      channelId: isSoleas ? null : selectedChannel?.id,
      channelName: isSoleas ? soleasChannelName : selectedChannel?.name,
    });
    if (!isSoleas && selectedChannel?.redirectUrl) {
      setTimeout(() => window.open(selectedChannel.redirectUrl, "_blank"), 500);
    }
  };

  const isPending = depositMutation.isPending || westpayMutation.isPending || soleasMutation.isPending || isRedirecting;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* Header gold */}
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/")} data-testid="button-back-deposit" className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-bold text-lg">Recharger</h1>
          <button onClick={() => navigate("/transactions")} className="text-white/80 text-sm font-medium" data-testid="button-deposit-history">
            Historique
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-4">

        {/* Amount */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="font-bold text-gray-800 text-sm mb-3">Montant de la recharge</p>
          <input
            data-testid="input-deposit-amount"
            type="number"
            placeholder="Entrez le montant"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-base outline-none focus:border-amber-400 placeholder-gray-400"
          />
          <p className="text-gray-400 text-xs mt-2">
            Montant minimum : <span className="font-semibold text-amber-500">{depositMinAmount.toFixed(2)} FCFA</span>
          </p>
        </div>

        {/* Method selector */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div
            className="flex items-center justify-between px-4 py-4 cursor-pointer"
            onClick={() => { setTempChannelId(selectedChannelId); setShowMethodSheet(true); }}
            data-testid="button-choose-method"
          >
            <p className="text-gray-700 font-medium text-sm">Méthode de recharge</p>
            <div className="flex items-center gap-1">
              <span className={`text-sm font-medium ${selectedChannelId ? "text-amber-500" : "text-gray-400"}`}>
                {selectedChannelId === "__soleaspay__"
                  ? soleasChannelName
                  : selectedChannel
                  ? selectedChannel.name
                  : "Veuillez choisir"}
              </span>
              <ChevronRight className={`w-4 h-4 ${selectedChannelId ? "text-amber-500" : "text-gray-400"}`} />
            </div>
          </div>

          {/* Inline SoleasPay fields */}
          {selectedChannelId === "__soleaspay__" && (
            <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Pays de paiement</p>
                <select
                  data-testid="select-soleas-country-inline"
                  value={soleasCountry}
                  onChange={e => { setSoleasCountry(e.target.value); setSoleasOperator(""); }}
                  className={`w-full border rounded-xl py-3 px-4 text-sm outline-none bg-white transition-colors ${soleasCountry ? "border-amber-400 text-gray-900" : "border-gray-200 text-gray-400"}`}
                >
                  <option value="">Sélectionner un pays</option>
                  {countriesList.filter((c: any) => c.isActive).map((c: any) => (
                    <option key={c.slug} value={c.slug}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>

              {soleasCountry && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Opérateur Mobile Money</p>
                  {(soleasOperators as string[]).length === 0 ? (
                    <p className="text-xs text-gray-400">Chargement des opérateurs...</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {(soleasOperators as string[]).map(op => (
                        <button key={op} type="button" data-testid={`btn-op-${op}`}
                          onClick={() => setSoleasOperator(op)}
                          className={`py-3 px-3 rounded-xl border text-sm font-medium transition-all ${
                            soleasOperator === op
                              ? "border-amber-500 bg-amber-50 text-amber-600"
                              : "border-gray-200 text-gray-700 bg-white"
                          }`}>
                          {op}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {soleasOperator && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Numéro Mobile Money</p>
                  <input
                    data-testid="input-soleas-phone-inline"
                    type="tel"
                    placeholder="Ex: 0701234567"
                    value={soleasPhone}
                    onChange={e => setSoleasPhone(e.target.value)}
                    className={`w-full border rounded-xl py-3 px-4 text-sm outline-none bg-white transition-colors ${soleasPhone ? "border-amber-400" : "border-gray-200"}`}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          data-testid="button-deposit-now"
          onClick={handleRecharge}
          disabled={isPending}
          className="w-full py-4 font-bold rounded-2xl text-black text-base disabled:opacity-60 shadow-md"
          style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
        >
          {isRedirecting ? "Redirection..." : isPending ? "En cours..." : "Recharger"}
        </button>

        {/* Instructions */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="font-bold text-gray-800 text-sm mb-3">Instructions de recharge</p>
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
        <div className="fixed inset-0 z-[200] flex items-end overlay-fade-in" onClick={() => setShowMethodSheet(false)}>
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
                className="text-amber-500 font-bold text-base disabled:text-gray-300"
                data-testid="button-confirm-method"
              >
                Confirmer
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {(channels as any[]).filter((c: any) => c.type !== "soleaspay").length === 0 && !showSoleasPay ? (
                <p className="text-center text-gray-400 text-sm py-8">Aucune méthode disponible</p>
              ) : (
                <>
                  {showSoleasPay && (
                    <div
                      className={`flex items-center justify-between py-4 px-5 cursor-pointer transition-colors ${tempChannelId === "__soleaspay__" ? "bg-amber-50" : "active:bg-gray-50"}`}
                      onClick={() => setTempChannelId("__soleaspay__")}
                      data-testid="sheet-channel-soleaspay"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center overflow-hidden">
                          <img src={robotpayIcon} alt={soleasChannelName} className="w-6 h-6 object-contain" />
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${tempChannelId === "__soleaspay__" ? "text-amber-500" : "text-gray-900"}`}>{soleasChannelName}</p>
                          <p className="text-xs text-gray-400">Mobile Money sécurisé</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${tempChannelId === "__soleaspay__" ? "border-amber-500" : "border-gray-300"}`}>
                        {tempChannelId === "__soleaspay__" && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                      </div>
                    </div>
                  )}

                  {(channels as any[]).filter((ch: any) => ch.type !== "soleaspay").map((ch: any) => (
                    <div
                      key={ch.id}
                      className={`flex items-center justify-between py-4 px-5 cursor-pointer transition-colors ${tempChannelId === ch.id ? "bg-amber-50" : "active:bg-gray-50"}`}
                      onClick={() => setTempChannelId(ch.id)}
                      data-testid={`sheet-channel-${ch.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center">
                          {channelIcon(ch.type)}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${tempChannelId === ch.id ? "text-amber-500" : "text-gray-900"}`}>{ch.name}</p>
                          <p className="text-xs text-gray-400">{channelLabel(ch.type)}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${tempChannelId === ch.id ? "border-amber-500" : "border-gray-300"}`}>
                        {tempChannelId === ch.id && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Link form sheet */}
      {showLinkForm && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-end">
          <div className="w-full bg-white rounded-t-3xl flex flex-col" style={{ maxHeight: "92vh" }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-bold text-gray-900 text-base">Informations de paiement</h3>
              <button onClick={() => setShowLinkForm(false)} data-testid="btn-close-link-form" className="text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5" style={{ paddingBottom: "1rem" }}>
              <p className="text-sm text-gray-500">
                Canal: <strong>{selectedChannelId === "__soleaspay__" ? soleasChannelName : selectedChannel?.name}</strong> | Montant: <strong>{parseInt(amount || "0").toLocaleString()} FCFA</strong>
              </p>

              {selectedChannelId === "__soleaspay__" ? (
                <>
                  <div>
                    <label className="text-xs font-semibold text-amber-500">Pays de paiement</label>
                    <select data-testid="select-soleas-country" value={linkFormData.country}
                      onChange={e => { const slug = e.target.value; setLinkFormData({ ...linkFormData, country: slug, paymentMethod: "" }); setSoleasCountry(slug); }}
                      className="w-full mt-1 border-b border-gray-200 py-2 text-sm outline-none bg-white text-gray-700">
                      <option value="">Sélectionner un pays</option>
                      {countriesList.filter((c: any) => c.isActive).map((c: any) => (
                        <option key={c.slug} value={c.slug}>{c.flag} {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-amber-500">Opérateur Mobile Money</label>
                    {!linkFormData.country ? (
                      <p className="text-xs text-gray-400 mt-2">Sélectionnez d'abord un pays</p>
                    ) : (soleasOperators as string[]).length === 0 ? (
                      <p className="text-xs text-gray-400 mt-2">Chargement des opérateurs...</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {(soleasOperators as string[]).map(op => (
                          <button key={op} type="button" data-testid={`btn-op-${op}`}
                            onClick={() => setLinkFormData({ ...linkFormData, paymentMethod: op })}
                            className={`w-full py-3 px-4 rounded-xl border text-sm font-medium text-left transition-all ${
                              linkFormData.paymentMethod === op ? "border-amber-500 bg-amber-50 text-amber-600" : "border-gray-200 text-gray-700"
                            }`}>
                            {op}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-amber-500">Numéro Mobile Money</label>
                    <input data-testid="input-soleas-phone" type="tel" placeholder="Ex: 0701234567"
                      value={linkFormData.phoneNumber}
                      onChange={e => setLinkFormData({ ...linkFormData, phoneNumber: e.target.value })}
                      className="w-full mt-1 border-b border-gray-200 py-2 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400" />
                  </div>
                </>
              ) : (
                <>
                  {[
                    { key: "accountName", label: "Nom du compte de paiement", placeholder: "Votre nom", type: "text", testId: "input-link-account-name" },
                    { key: "phoneNumber", label: "Numéro de téléphone de paiement", placeholder: "Ex: 0701234567", type: "tel", testId: "input-link-phone" },
                    { key: "paymentMethod", label: "Moyen de paiement", placeholder: "Ex: Wave, Orange Money, MTN...", type: "text", testId: "input-link-payment-method" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs font-medium text-amber-500">{f.label}</label>
                      <input data-testid={f.testId} type={f.type} placeholder={f.placeholder}
                        value={(linkFormData as any)[f.key]}
                        onChange={e => setLinkFormData({ ...linkFormData, [f.key]: e.target.value })}
                        className="w-full mt-1 border-b border-gray-200 py-2 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400" />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-medium text-amber-500">Pays</label>
                    <select data-testid="select-link-country" value={linkFormData.country}
                      onChange={e => setLinkFormData({ ...linkFormData, country: e.target.value })}
                      className="w-full mt-1 border-b border-gray-200 py-2 text-sm outline-none bg-white text-gray-700">
                      <option value="">Sélectionner un pays</option>
                      {countriesList.map((c: any) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100">
              <button
                data-testid="button-link-proceed"
                onClick={handleLinkDeposit}
                disabled={depositMutation.isPending || (selectedChannelId === "__soleaspay__" && (!linkFormData.country || !linkFormData.paymentMethod || !linkFormData.phoneNumber))}
                className="w-full py-4 font-bold rounded-2xl text-base text-black disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
              >
                {depositMutation.isPending ? "En cours..." : "Procéder au paiement →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SoleasPay pending popup */}
      {showSoleasPending && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center px-5">
          <div className="bg-white w-full max-w-sm rounded-3xl px-6 pt-8 pb-8 modal-pop-in shadow-2xl">
            {soleasPendingStatus === "pending" && (
              <div className="flex flex-col items-center text-center py-4">
                <div className="relative w-20 h-20 mb-5">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img src={robotpayIcon} alt="pay" className="w-9 h-9 object-contain" />
                  </div>
                </div>
                <p className="font-bold text-gray-900 text-lg mb-2">
                  {soleasMutation.isPending ? "Envoi de la demande..." : "En attente de confirmation"}
                </p>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {soleasMutation.isPending
                    ? "Envoi de la demande en cours..."
                    : "Veuillez confirmer le paiement sur votre téléphone."}
                </p>
                <p className="text-gray-400 text-xs mt-2">{soleasOperator} · {soleasPhone}</p>
                {!soleasMutation.isPending && (
                  <p className="text-gray-300 text-xs mt-1">Vérification toutes les 3 secondes...</p>
                )}
              </div>
            )}

            {soleasPendingStatus === "success" && (
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5">
                  <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-bold text-gray-900 text-lg mb-2">Demande enregistrée !</p>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Votre dépôt est en attente de validation. Le crédit sera ajouté automatiquement.
                </p>
                <button
                  onClick={() => { setShowSoleasPending(false); setSoleasPendingStatus("pending"); }}
                  className="mt-6 w-full py-4 font-bold rounded-2xl text-black text-base"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
                  data-testid="btn-soleas-close-success"
                >
                  OK
                </button>
              </div>
            )}

            {soleasPendingStatus === "error" && (
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
                  <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="font-bold text-gray-900 text-lg mb-2">Paiement échoué</p>
                <p className="text-gray-500 text-sm leading-relaxed">{soleasErrorMsg}</p>
                <button
                  onClick={() => { setShowSoleasPending(false); setSoleasPendingStatus("pending"); }}
                  className="mt-6 w-full py-4 font-bold rounded-2xl text-black text-base"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
                  data-testid="btn-soleas-close-error"
                >
                  Réessayer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
