import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { BKAPAY_KEY, formatCFA } from "@/lib/constants";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, X, AlertCircle, Loader2, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import robotpayIcon from "@assets/icon_2_1774133145999.png";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

export default function DepositPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [linkFormData, setLinkFormData] = useState({ accountName: "", phoneNumber: "", paymentMethod: "", country: user?.country || "" });

  const [soleasOperator, setSoleasOperator] = useState("");
  const [soleasPhone, setSoleasPhone] = useState("");
  const [soleasCountry, setSoleasCountry] = useState(user?.country || "");
  const [showSoleasPending, setShowSoleasPending] = useState(false);
  const [soleasPendingStatus, setSoleasPendingStatus] = useState<"pending" | "success" | "error">("pending");
  const [soleasTxId, setSoleasTxId] = useState<string | null>(null);
  const [soleasErrorMsg, setSoleasErrorMsg] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [svpOperator, setSvpOperator] = useState("");
  const [svpPhone, setSvpPhone] = useState(user?.phone || "");
  const [showSvpPending, setShowSvpPending] = useState(false);
  const [svpPendingStatus, setSvpPendingStatus] = useState<"pending" | "success" | "error">("pending");
  const [svpTxId, setSvpTxId] = useState<string | null>(null);
  const [svpErrorMsg, setSvpErrorMsg] = useState("");
  const svpPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: channels = [] } = useQuery<any[]>({ queryKey: ["/api/channels"] });
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });
  const { data: countriesRaw = [] } = useQuery({ queryKey: ["/api/countries"] });
  const countriesList = countriesRaw as any[];

  const depositMinAmount = settings?.depositMinAmount || 1000;

  const userCountryInfo = countriesList.find((c: any) => c.slug === user?.country);
  const paymentProvider: string = userCountryInfo?.paymentProvider || "link";
  const showSendavapay = paymentProvider === "sendavapay";
  const showSoleasPay = paymentProvider === "soleaspay" || paymentProvider === "both";
  const showWestPay   = paymentProvider === "westpay"   || paymentProvider === "both";

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

  const { data: svpOperators = [] } = useQuery<string[]>({
    queryKey: ["/api/sendavapay/operators", user?.country],
    queryFn: async () => {
      if (!user?.country) return [];
      const res = await fetch(`/api/sendavapay/operators/${user.country}`, { credentials: "include" });
      return res.json();
    },
    enabled: showSendavapay,
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
      navigate("/transactions");
    },
    onError: (e: any) => toast({ title: e.message || "Erreur", variant: "destructive" }),
  });

  const soleasMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/user/deposit/soleaspay/init", data);
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Erreur de paiement"); }
      return res.json();
    },
    onSuccess: (data: any) => setSoleasTxId(data.txId),
    onError: (e: any) => { setSoleasErrorMsg(e.message || "Erreur lors du lancement du paiement"); setSoleasPendingStatus("error"); },
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
        setSoleasErrorMsg("Délai dépassé. Contactez le support si nécessaire.");
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
          setSoleasPhone(""); setSoleasOperator("");
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
    onSuccess: (data: any) => { if (data.payUrl) { setIsRedirecting(true); window.location.href = data.payUrl; } },
    onError: (e: any) => toast({ title: e.message || "Erreur WestPay", variant: "destructive" }),
  });

  const svpMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/user/deposit/sendavapay/init", data);
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Erreur de paiement"); }
      return res.json();
    },
    onSuccess: (data: any) => setSvpTxId(data.txId),
    onError: (e: any) => { setSvpErrorMsg(e.message || "Erreur lors du lancement du paiement"); setSvpPendingStatus("error"); },
  });

  useEffect(() => {
    if (!svpTxId) return;
    if (svpPollingRef.current) clearInterval(svpPollingRef.current);
    const startedAt = Date.now();
    const TIMEOUT_MS = 5 * 60 * 1000;
    const poll = async () => {
      if (Date.now() - startedAt > TIMEOUT_MS) {
        if (svpPollingRef.current) clearInterval(svpPollingRef.current);
        svpPollingRef.current = null;
        setSvpTxId(null);
        setSvpErrorMsg("Délai dépassé. Contactez le support si nécessaire.");
        setSvpPendingStatus("error");
        return;
      }
      try {
        const res = await fetch(`/api/user/transaction/${svpTxId}`, { credentials: "include" });
        if (!res.ok) return;
        const tx = await res.json();
        if (tx.status === "approved") {
          if (svpPollingRef.current) clearInterval(svpPollingRef.current);
          svpPollingRef.current = null;
          setSvpTxId(null);
          queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
          refreshUser();
          setSvpPhone(""); setSvpOperator("");
          setSvpPendingStatus("success");
        } else if (tx.status === "rejected" || tx.status === "failed") {
          if (svpPollingRef.current) clearInterval(svpPollingRef.current);
          svpPollingRef.current = null;
          setSvpTxId(null);
          setSvpErrorMsg("Paiement refusé ou échoué. Vérifiez votre solde Mobile Money.");
          setSvpPendingStatus("error");
        }
      } catch { }
    };
    svpPollingRef.current = setInterval(poll, 3000);
    return () => { if (svpPollingRef.current) clearInterval(svpPollingRef.current); };
  }, [svpTxId]);

  const selectedChannel = (channels as any[]).find((c: any) => c.id === selectedChannelId);

  // All available methods for step 2
  const availableMethods: { id: string; name: string; sub: string; icon: any }[] = [];
  if (showSendavapay) {
    availableMethods.push({ id: "__sendavapay__", name: "Mobile Money", sub: "Paiement automatique instantané", icon: "mobilemoney" });
  }
  if (showSoleasPay) {
    availableMethods.push({ id: "__soleaspay__", name: soleasChannelName, sub: "Mobile Money automatique", icon: "mobilemoney" });
  }
  (channels as any[]).filter((c: any) => c.isActive && c.type !== "soleaspay").forEach((ch: any) => {
    availableMethods.push({
      id: ch.id,
      name: ch.name,
      sub: ch.type === "westpay" ? "Paiement sécurisé" : ch.type === "leekpay" ? "Paiement automatique" : "Paiement par lien",
      icon: ch.type,
    });
  });

  const handleStep1Next = () => {
    const amt = parseInt(amount);
    if (!amt || amt < depositMinAmount) {
      toast({ title: "Montant invalide", description: `Minimum : ${depositMinAmount.toLocaleString()} FCFA`, variant: "destructive" });
      return;
    }
    if (availableMethods.length === 0) {
      // No methods — go direct
      handleDirectDeposit();
      return;
    }
    setStep(2);
  };

  const handleDirectDeposit = () => {
    const amt = parseInt(amount);
    if (user?.country === "cameroun") {
      const callbackUrl = encodeURIComponent(`${window.location.origin}/api/payment/callback`);
      const desc = encodeURIComponent(`Dépôt - ${user?.phone}`);
      window.location.href = `https://bkapay.com/api-pay/${BKAPAY_KEY}?amount=${amt}&description=${desc}&callback=${callbackUrl}`;
      return;
    }
    depositMutation.mutate({ amount: amt, country: user?.country || "", paymentMethod: "LeekPay", phoneNumber: user?.phone, channelId: null, channelName: "Direct" });
  };

  const handleStep2Submit = () => {
    if (!selectedChannelId) {
      toast({ title: "Choisissez une méthode", variant: "destructive" });
      return;
    }
    const amt = parseInt(amount);
    if (selectedChannelId === "__sendavapay__") {
      if (!svpOperator || !svpPhone) {
        toast({ title: "Informations incomplètes", description: "Opérateur et numéro requis", variant: "destructive" });
        return;
      }
      setSvpErrorMsg(""); setSvpPendingStatus("pending"); setShowSvpPending(true);
      svpMutation.mutate({ amount: amt, country: user?.country, operator: svpOperator, phoneNumber: svpPhone });
      return;
    }
    if (selectedChannelId === "__soleaspay__") {
      if (!soleasCountry || !soleasOperator || !soleasPhone) {
        toast({ title: "Informations incomplètes", description: "Pays, opérateur et numéro requis", variant: "destructive" });
        return;
      }
      setSoleasErrorMsg(""); setSoleasPendingStatus("pending"); setShowSoleasPending(true);
      soleasMutation.mutate({ amount: amt, country: soleasCountry, operator: soleasOperator, phoneNumber: soleasPhone, channelName: soleasChannelName });
      return;
    }
    if (selectedChannel?.type === "westpay") {
      westpayMutation.mutate({ amount: amt, channelId: selectedChannel.id, channelName: selectedChannel.name });
      return;
    }
    if (selectedChannel?.type === "leekpay") {
      handleDirectDeposit();
      return;
    }
    // link channel
    setShowLinkForm(true);
  };

  const handleLinkDeposit = () => {
    const amt = parseInt(amount);
    if (!linkFormData.accountName || !linkFormData.phoneNumber || !linkFormData.paymentMethod || !linkFormData.country) {
      toast({ title: "Remplissez tous les champs", variant: "destructive" });
      return;
    }
    depositMutation.mutate({
      amount: amt, country: linkFormData.country, paymentMethod: linkFormData.paymentMethod,
      phoneNumber: linkFormData.phoneNumber, accountName: linkFormData.accountName,
      channelId: selectedChannel?.id, channelName: selectedChannel?.name,
    });
    if (selectedChannel?.redirectUrl) setTimeout(() => window.open(selectedChannel.redirectUrl, "_blank"), 500);
  };

  const isPending = depositMutation.isPending || westpayMutation.isPending || soleasMutation.isPending || svpMutation.isPending || isRedirecting;
  const amt = parseInt(amount) || 0;

  // ── Sendavapay pending overlay ────────────────────────────────
  if (showSvpPending) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center px-8 text-center z-50">
        {svpPendingStatus === "pending" && (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-200 flex items-center justify-center mb-6">
              <Loader2 className="w-9 h-9 text-amber-500 animate-spin" />
            </div>
            <p className="text-gray-800 font-bold text-xl mb-2">Paiement en cours…</p>
            <p className="text-gray-500 text-sm leading-relaxed mb-3">
              Vérifiez votre téléphone et confirmez la demande de paiement de <strong>{amt.toLocaleString()} FCFA</strong> sur <strong>{svpOperator}</strong>.
            </p>
            <p className="text-gray-400 text-xs">Ne fermez pas cette page</p>
          </>
        )}
        {svpPendingStatus === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            </div>
            <p className="text-gray-800 font-bold text-xl mb-2">Paiement réussi !</p>
            <p className="text-gray-500 text-sm mb-6">Votre solde a été crédité de <strong>{amt.toLocaleString()} FCFA</strong>.</p>
            <button onClick={() => { setShowSvpPending(false); setStep(1); setAmount(""); setSelectedChannelId(""); navigate("/"); }}
              className="px-8 py-3.5 rounded-2xl font-bold text-black text-sm" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
              Retour à l'accueil
            </button>
          </>
        )}
        {svpPendingStatus === "error" && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-50 border-4 border-red-200 flex items-center justify-center mb-6">
              <AlertCircle className="w-9 h-9 text-red-500" />
            </div>
            <p className="text-gray-800 font-bold text-xl mb-2">Paiement échoué</p>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">{svpErrorMsg}</p>
            <button onClick={() => { setShowSvpPending(false); setSvpPendingStatus("pending"); }}
              className="px-8 py-3.5 rounded-2xl font-bold text-black text-sm" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
              Réessayer
            </button>
          </>
        )}
      </div>
    );
  }

  // ── SoleasPay pending overlay ─────────────────────────────────
  if (showSoleasPending) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center px-8 text-center z-50">
        {soleasPendingStatus === "pending" && (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-200 flex items-center justify-center mb-6">
              <Loader2 className="w-9 h-9 text-amber-500 animate-spin" />
            </div>
            <p className="text-gray-800 font-bold text-xl mb-2">Paiement en cours…</p>
            <p className="text-gray-500 text-sm leading-relaxed mb-3">
              Vérifiez votre téléphone et confirmez la demande de paiement de <strong>{amt.toLocaleString()} FCFA</strong> sur <strong>{soleasOperator}</strong>.
            </p>
            <p className="text-gray-400 text-xs">Ne fermez pas cette page</p>
          </>
        )}
        {soleasPendingStatus === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            </div>
            <p className="text-gray-800 font-bold text-xl mb-2">Paiement réussi !</p>
            <p className="text-gray-500 text-sm mb-6">Votre solde a été crédité de <strong>{amt.toLocaleString()} FCFA</strong>.</p>
            <button onClick={() => { setShowSoleasPending(false); setStep(1); setAmount(""); setSelectedChannelId(""); navigate("/"); }}
              className="px-8 py-3.5 rounded-2xl font-bold text-black text-sm" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
              Retour à l'accueil
            </button>
          </>
        )}
        {soleasPendingStatus === "error" && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-50 border-4 border-red-200 flex items-center justify-center mb-6">
              <AlertCircle className="w-9 h-9 text-red-500" />
            </div>
            <p className="text-gray-800 font-bold text-xl mb-2">Paiement échoué</p>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">{soleasErrorMsg}</p>
            <button onClick={() => { setShowSoleasPending(false); setSoleasPendingStatus("pending"); }}
              className="px-8 py-3.5 rounded-2xl font-bold text-black text-sm" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
              Réessayer
            </button>
          </>
        )}
      </div>
    );
  }

  // ── Link form sheet ───────────────────────────────────────────
  if (showLinkForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 pt-10 pb-4 flex items-center gap-3">
          <button onClick={() => setShowLinkForm(false)} className="text-white"><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-white font-bold text-lg">Informations de paiement</h1>
        </div>
        <div className="flex-1 px-5 py-5 space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
            <p className="text-amber-700 text-sm font-semibold">Canal : {selectedChannel?.name}</p>
            <p className="text-amber-600 text-lg font-bold mt-0.5">{amt.toLocaleString()} FCFA</p>
          </div>
          {[
            { label: "Votre nom complet", key: "accountName", placeholder: "Ex : Amadou Diallo" },
            { label: "Numéro Mobile Money", key: "phoneNumber", placeholder: "Ex : 0701234567" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{f.label}</label>
              <input type="text" placeholder={f.placeholder} value={(linkFormData as any)[f.key]}
                onChange={e => setLinkFormData({ ...linkFormData, [f.key]: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 bg-white" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Opérateur</label>
            <select value={linkFormData.paymentMethod}
              onChange={e => setLinkFormData({ ...linkFormData, paymentMethod: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 bg-white text-gray-700">
              <option value="">Choisir un opérateur</option>
              {["Orange Money", "MTN Mobile Money", "Moov Money", "Wave", "Tmoney"].map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Pays</label>
            <select value={linkFormData.country}
              onChange={e => setLinkFormData({ ...linkFormData, country: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 bg-white text-gray-700">
              <option value="">Choisir un pays</option>
              {countriesList.filter((c: any) => c.isActive).map((c: any) => (
                <option key={c.slug} value={c.slug}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>
          <button onClick={handleLinkDeposit} disabled={depositMutation.isPending}
            className="w-full py-4 font-bold rounded-2xl text-black text-base disabled:opacity-60 shadow-md"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
            {depositMutation.isPending ? "Envoi en cours…" : "Confirmer le dépôt"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => step === 2 ? setStep(1) : navigate("/")} data-testid="button-back-deposit" className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg">Recharger</h1>
            <p className="text-white/60 text-xs">Étape {step} sur {availableMethods.length > 0 ? 2 : 1}</p>
          </div>
          <button onClick={() => navigate("/transactions")} className="text-white/80 text-xs font-medium" data-testid="button-deposit-history">
            Historique
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2">
          {[1, 2].map(s => (
            <div key={s} className={`h-1 rounded-full flex-1 transition-all ${s <= step ? "bg-white" : "bg-white/30"}`} />
          ))}
        </div>
      </div>

      {/* ── STEP 1 : Amount ── */}
      {step === 1 && (
        <div className="px-4 py-5 space-y-4">

          {/* Amount input */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-3">Montant à recharger</p>
            <div className="flex items-center gap-2 mb-1">
              <input
                data-testid="input-deposit-amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="flex-1 text-4xl font-extrabold text-gray-900 outline-none bg-transparent placeholder-gray-200"
              />
              <span className="text-gray-400 font-semibold text-lg">FCFA</span>
            </div>
            <div className="h-px bg-gray-100 mb-3" />
            <p className="text-gray-400 text-xs">
              Minimum : <span className="text-amber-500 font-bold">{depositMinAmount.toLocaleString()} FCFA</span>
            </p>
          </div>

          {/* Quick amounts */}
          <div>
            <p className="text-gray-400 text-xs font-semibold mb-2 px-1">Montants rapides</p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map(q => (
                <button
                  key={q}
                  data-testid={`quick-amount-${q}`}
                  onClick={() => setAmount(String(q))}
                  className={`py-3 rounded-2xl text-sm font-bold border transition-all active:scale-95 ${
                    amount === String(q)
                      ? "border-amber-500 bg-amber-50 text-amber-600"
                      : "border-gray-100 bg-white text-gray-700"
                  }`}
                >
                  {q >= 1000 ? `${q / 1000}k` : q}
                </button>
              ))}
            </div>
          </div>

          {/* Next button */}
          <button
            data-testid="button-deposit-next"
            onClick={handleStep1Next}
            className="w-full py-4 font-bold rounded-2xl text-black text-base shadow-md flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
          >
            {availableMethods.length > 0 ? (
              <>Suivant <ChevronRight className="w-5 h-5" /></>
            ) : "Recharger"}
          </button>

          {/* Info */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2">
            <p className="font-bold text-gray-700 text-sm">Comment ça marche ?</p>
            {[
              "Entrez votre montant ou choisissez un montant rapide",
              "Sélectionnez votre méthode de paiement",
              "Confirmez et votre solde est crédité sous 5 min",
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-amber-600 text-[10px] font-bold">{i + 1}</span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">{t}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 2 : Method ── */}
      {step === 2 && (
        <div className="px-4 py-5 space-y-4">

          {/* Amount recap */}
          <div className="bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Montant sélectionné</p>
              <p className="text-gray-900 font-extrabold text-2xl">{amt.toLocaleString()} <span className="text-gray-400 text-base font-semibold">FCFA</span></p>
            </div>
            <button onClick={() => setStep(1)} className="text-amber-500 text-xs font-semibold border border-amber-200 bg-amber-50 px-3 py-1.5 rounded-xl">
              Modifier
            </button>
          </div>

          {/* Methods list */}
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2 px-1">Méthode de paiement</p>
            <div className="space-y-2">
              {availableMethods.map(m => (
                <button
                  key={m.id}
                  data-testid={`method-${m.id}`}
                  onClick={() => setSelectedChannelId(m.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                    selectedChannelId === m.id
                      ? "border-amber-400 bg-amber-50"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedChannelId === m.id ? "bg-amber-100" : "bg-gray-50"
                  }`}>
                    {m.icon === "mobilemoney" || m.icon === "westpay" || m.icon === "soleaspay"
                      ? <img src={robotpayIcon} alt={m.name} className="w-7 h-7 object-contain" />
                      : <span className="text-amber-500 font-extrabold text-lg">$</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${selectedChannelId === m.id ? "text-amber-600" : "text-gray-800"}`}>{m.name}</p>
                    <p className="text-gray-400 text-xs">{m.sub}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    selectedChannelId === m.id ? "border-amber-500 bg-amber-500" : "border-gray-300"
                  }`}>
                    {selectedChannelId === m.id && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sendavapay inline fields */}
          {selectedChannelId === "__sendavapay__" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <p className="text-gray-700 font-bold text-sm">Informations Mobile Money</p>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Opérateur</label>
                {(svpOperators as string[]).length === 0
                  ? <p className="text-xs text-gray-400">Chargement des opérateurs…</p>
                  : (
                    <div className="grid grid-cols-2 gap-2">
                      {(svpOperators as string[]).map(op => (
                        <button key={op} type="button" onClick={() => setSvpOperator(op)}
                          className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                            svpOperator === op ? "border-amber-500 bg-amber-50 text-amber-600" : "border-gray-200 text-gray-700 bg-white"
                          }`}>
                          {op}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
              {svpOperator && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Numéro Mobile Money</label>
                  <input type="tel" placeholder="Ex: 0701234567" value={svpPhone}
                    onChange={e => setSvpPhone(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm outline-none bg-white focus:border-amber-400" />
                </div>
              )}
            </div>
          )}

          {/* SoleasPay inline fields */}
          {selectedChannelId === "__soleaspay__" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <p className="text-gray-700 font-bold text-sm">Informations Mobile Money</p>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Pays</label>
                <select value={soleasCountry} onChange={e => { setSoleasCountry(e.target.value); setSoleasOperator(""); }}
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm outline-none bg-white text-gray-700">
                  <option value="">Sélectionner un pays</option>
                  {countriesList.filter((c: any) => c.isActive).map((c: any) => (
                    <option key={c.slug} value={c.slug}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
              {soleasCountry && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Opérateur</label>
                  {(soleasOperators as string[]).length === 0
                    ? <p className="text-xs text-gray-400">Chargement…</p>
                    : (
                      <div className="grid grid-cols-2 gap-2">
                        {(soleasOperators as string[]).map(op => (
                          <button key={op} type="button" onClick={() => setSoleasOperator(op)}
                            className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                              soleasOperator === op ? "border-amber-500 bg-amber-50 text-amber-600" : "border-gray-200 text-gray-700 bg-white"
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
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Numéro Mobile Money</label>
                  <input type="tel" placeholder="Ex: 0701234567" value={soleasPhone}
                    onChange={e => setSoleasPhone(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm outline-none bg-white focus:border-amber-400" />
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            data-testid="button-deposit-now"
            onClick={handleStep2Submit}
            disabled={!selectedChannelId || isPending}
            className="w-full py-4 font-bold rounded-2xl text-black text-base disabled:opacity-50 shadow-md"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
          >
            {isRedirecting ? "Redirection…" : isPending ? "En cours…" : `Payer ${amt.toLocaleString()} FCFA`}
          </button>
        </div>
      )}
    </div>
  );
}
