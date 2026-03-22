import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronDown } from "lucide-react";

const FALLBACK_METHODS = ["Orange Money", "MTN Mobile Money", "Moov Money", "Wave", "Celtis"];

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
      // Start 60s countdown
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCountdown(60);
      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
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
    onError: (e: any) => {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
  });

  const handleConfirm = () => {
    if (!accountName.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer votre nom", variant: "destructive" });
      return;
    }
    if (!paymentMethod) {
      toast({ title: "Erreur", description: "Veuillez choisir une banque", variant: "destructive" });
      return;
    }
    if (!phoneNumber.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer le numéro de compte", variant: "destructive" });
      return;
    }
    if (!otpCode.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer le code OTP", variant: "destructive" });
      return;
    }
    saveMutation.mutate({
      country: user?.country || "",
      paymentMethod,
      phoneNumber,
      accountName,
    });
  };

  const userPhone = user?.phone ? `+${userCountry?.dialCode || ""}${user.phone}` : "";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header vert */}
      <div className="bg-[#22c55e] px-4 pt-10 pb-4 flex items-center relative">
        <button
          data-testid="button-back-card"
          onClick={() => navigate("/withdraw")}
          className="flex items-center gap-1 text-white"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Retour</span>
        </button>
        <h1 className="absolute left-0 right-0 text-center text-white font-bold text-base pointer-events-none">
          Compte de retrait
        </h1>
      </div>

      {/* Formulaire */}
      <div className="flex-1 px-5 pt-8 pb-10 relative">

        {/* Votre nom */}
        <div className="mb-5">
          <label className="block text-gray-700 text-sm mb-1">Votre nom</label>
          <input
            data-testid="input-card-name"
            type="text"
            value={accountName}
            onChange={e => setAccountName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-3 text-sm text-gray-800 outline-none focus:border-[#22c55e]"
            placeholder=""
          />
        </div>

        {/* Nom banque */}
        <div className="mb-5">
          <label className="block text-gray-700 text-sm mb-1">Nom banque</label>
          <div className="relative">
            <button
              data-testid="select-card-method"
              type="button"
              onClick={() => setShowMethodMenu(v => !v)}
              className="w-full border border-gray-300 rounded px-3 py-3 text-sm text-gray-800 flex items-center justify-between bg-gray-100 outline-none"
            >
              <span>{paymentMethod || "Choisir..."}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            {showMethodMenu && (
              <div className="absolute z-30 left-0 right-0 bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-48 overflow-y-auto">
                {allMethods.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setPaymentMethod(m); setShowMethodMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${paymentMethod === m ? "text-[#22c55e] font-semibold" : "text-gray-700"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Numéro de compte */}
        <div className="mb-5">
          <label className="block text-gray-700 text-sm mb-1">Numéro de compte</label>
          <input
            data-testid="input-card-phone"
            type="text"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-3 text-sm text-gray-800 outline-none focus:border-[#22c55e]"
            placeholder=""
          />
        </div>

        {/* Numéro de téléphone (pré-rempli) */}
        <div className="mb-5">
          <label className="block text-gray-700 text-sm mb-1">Numéro de téléphone</label>
          <input
            data-testid="input-card-userphone"
            type="text"
            value={userPhone}
            readOnly
            className="w-full border border-gray-300 rounded px-3 py-3 text-sm text-gray-400 bg-gray-50 outline-none"
          />
        </div>

        {/* Code OTP */}
        <div className="mb-8">
          <label className="block text-gray-700 text-sm mb-1">Code OTP</label>
          <div className="flex gap-2">
            <input
              data-testid="input-card-otp"
              type="text"
              value={otpCode}
              onChange={e => setOtpCode(e.target.value)}
              maxLength={6}
              className="flex-1 border border-gray-300 rounded px-3 py-3 text-sm text-gray-800 outline-none focus:border-[#22c55e]"
              placeholder=""
            />
            <button
              data-testid="button-send-otp"
              type="button"
              onClick={() => sendOtpMutation.mutate()}
              disabled={sendOtpMutation.isPending || countdown > 0}
              className="px-5 py-3 bg-[#f87171] text-white font-semibold text-sm rounded disabled:opacity-60 whitespace-nowrap min-w-[80px]"
            >
              {sendOtpMutation.isPending ? "..." : countdown > 0 ? `${countdown}s` : "Obtenir"}
            </button>
          </div>
        </div>

        {/* Bouton Confirmer */}
        <button
          data-testid="button-save-card"
          onClick={handleConfirm}
          disabled={saveMutation.isPending}
          className="w-full py-4 bg-[#f87171] text-white font-bold text-base rounded disabled:opacity-60"
        >
          {saveMutation.isPending ? "En cours..." : "Confirmer"}
        </button>
      </div>
    </div>
  );
}
