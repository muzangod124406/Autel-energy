import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft, ChevronDown } from "lucide-react";

const FALLBACK_METHODS = ["Orange Money", "MTN Mobile Money", "Moov Money", "Wave", "Celtis", "Tmoney"];

export default function BankCardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: existingCard } = useQuery({ queryKey: ["/api/user/bank-card"] });
  const { data: countriesRaw = [] } = useQuery({ queryKey: ["/api/countries"] });

  const userCountry = (countriesRaw as any[]).find((c: any) => c.slug === (user?.country || ""));
  const allMethods: string[] = userCountry?.operators?.length > 0 ? userCountry.operators : FALLBACK_METHODS;

  const [accountName, setAccountName] = useState((existingCard as any)?.accountName || "");
  const [paymentMethod, setPaymentMethod] = useState((existingCard as any)?.paymentMethod || allMethods[0] || "Wave");
  const [phoneNumber, setPhoneNumber] = useState((existingCard as any)?.phoneNumber || "");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showMethodMenu, setShowMethodMenu] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/send-otp", { phone: user?.phone });
      return res.json();
    },
    onSuccess: (data) => {
      setOtpSent(true);
      toast({ title: "Code envoyé !" });
      if (data?.code) {
        if (otpTimerRef.current) clearTimeout(otpTimerRef.current);
        otpTimerRef.current = setTimeout(() => setOtpCode(data.code), 6000);
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCountdown(60);
      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(intervalRef.current!); intervalRef.current = null; return 0; }
          return prev - 1;
        });
      }, 1000);
    },
    onError: (e: any) => toast({ title: e.message || "Erreur", variant: "destructive" })
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/user/bank-card", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Enregistré", description: "Compte de retrait enregistré avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bank-card"] });
      navigate("/withdraw");
    },
    onError: (e: any) => toast({ title: e.message || "Erreur", variant: "destructive" })
  });

  const handleConfirm = () => {
    if (!accountName.trim()) { toast({ title: "Erreur", description: "Veuillez entrer votre nom", variant: "destructive" }); return; }
    if (!paymentMethod) { toast({ title: "Erreur", description: "Veuillez choisir une banque", variant: "destructive" }); return; }
    if (!phoneNumber.trim()) { toast({ title: "Erreur", description: "Veuillez entrer le numéro de compte", variant: "destructive" }); return; }
    if (!otpCode.trim()) { toast({ title: "Erreur", description: "Veuillez entrer le code OTP", variant: "destructive" }); return; }
    saveMutation.mutate({ country: user?.country || "", paymentMethod, phoneNumber, accountName });
  };

  const userPhone = user?.phone ? `+${userCountry?.dialCode || ""}${user.phone}` : "";
  const labelCls = "block text-gray-600 text-xs font-semibold mb-1.5";
  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 outline-none focus:border-amber-400 bg-white transition-colors";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header gold */}
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 pt-10 pb-4 flex items-center relative">
        <button data-testid="button-back-card" onClick={() => navigate("/withdraw")} className="flex items-center gap-1 text-white">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Retour</span>
        </button>
        <h1 className="absolute left-0 right-0 text-center text-white font-bold text-base pointer-events-none">
          Compte de retrait
        </h1>
      </div>

      <div className="flex-1 px-5 pt-6 pb-10 space-y-4">

        <div>
          <label className={labelCls}>Votre nom</label>
          <input data-testid="input-card-name" type="text" value={accountName} onChange={e => setAccountName(e.target.value)} className={inputCls} placeholder="Votre nom complet" />
        </div>

        <div>
          <label className={labelCls}>Nom banque / opérateur</label>
          <div className="relative">
            <button
              data-testid="select-card-method"
              type="button"
              onClick={() => setShowMethodMenu(v => !v)}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 flex items-center justify-between bg-white outline-none focus:border-amber-400"
            >
              <span>{paymentMethod || "Choisir..."}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {showMethodMenu && (
              <div className="absolute z-30 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                {allMethods.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setPaymentMethod(m); setShowMethodMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm ${paymentMethod === m ? "text-amber-500 font-semibold bg-amber-50" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className={labelCls}>Numéro de compte</label>
          <input data-testid="input-card-phone" type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className={inputCls} placeholder="Numéro associé au compte" />
        </div>

        <div>
          <label className={labelCls}>Code OTP</label>
          <div className="flex gap-2">
            <input
              data-testid="input-card-otp"
              type="text"
              value={otpCode}
              onChange={e => setOtpCode(e.target.value)}
              maxLength={6}
              className={inputCls}
              placeholder="Code reçu par SMS"
            />
            <button
              data-testid="button-send-otp"
              type="button"
              onClick={() => sendOtpMutation.mutate()}
              disabled={sendOtpMutation.isPending || countdown > 0}
              className="px-4 py-3 text-white font-semibold text-sm rounded-xl disabled:opacity-60 whitespace-nowrap min-w-[80px] bg-red-400"
            >
              {sendOtpMutation.isPending ? "..." : countdown > 0 ? `${countdown}s` : "Obtenir"}
            </button>
          </div>
        </div>

        <button
          data-testid="button-save-card"
          onClick={handleConfirm}
          disabled={saveMutation.isPending}
          className="w-full py-4 text-black font-bold text-base rounded-2xl disabled:opacity-60 shadow-md"
          style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
        >
          {saveMutation.isPending ? "En cours..." : "Confirmer"}
        </button>
      </div>
    </div>
  );
}
