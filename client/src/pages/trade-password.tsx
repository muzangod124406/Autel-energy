import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Lock, Shield, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import autelLogo from "@assets/images_(11)_1774131992392.png";

export default function TradePasswordPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const hasPassword = !!user?.transactionPassword;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSendOtp = async () => {
    if (!user?.phone) return;
    setOtpLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/send-otp", { phone: user.phone });
      const data = await res.json();
      toast({ title: "Code OTP envoyé !" });
      if (data?.code) {
        if (otpTimerRef.current) clearTimeout(otpTimerRef.current);
        otpTimerRef.current = setTimeout(() => setOtp(data.code), 6000);
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCountdown(60);
      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(intervalRef.current!); intervalRef.current = null; return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      toast({ title: e.message?.replace(/^\d+:\s*/, "") || "Impossible d'envoyer le code OTP", variant: "destructive" });
    }
    setOtpLoading(false);
  };

  const handleSubmit = async () => {
    if (hasPassword && !currentPassword) {
      toast({ title: "Veuillez saisir votre mot de passe actuel", variant: "destructive" });
      return;
    }
    if (!hasPassword && !otp) {
      toast({ title: "Veuillez saisir le code OTP", variant: "destructive" });
      return;
    }
    if (!newPassword || !confirmNew) {
      toast({ title: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmNew) {
      toast({ title: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Minimum 6 caractères requis", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/set-transaction-password", {
        transactionPassword: newPassword,
        currentTransactionPassword: hasPassword ? currentPassword : undefined,
        otp: !hasPassword ? otp : undefined,
      });
      await refreshUser();
      toast({ title: "Mot de passe de retrait enregistré !" });
      navigate("/");
    } catch (e: any) {
      toast({ title: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
    setLoading(false);
  };

  const inputCls = "flex items-center px-4 py-4 border-b border-gray-100 last:border-0";

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => window.history.back()} data-testid="button-back-trade-password">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex items-center gap-2">
          <img src={autelLogo} alt="Autel" className="w-7 h-7 rounded-full object-cover" />
          <span className="text-[#22c55e] font-bold text-base">Mot de passe de retrait</span>
        </div>
        <div className="w-6" />
      </div>

      <div className="px-4 pt-6 space-y-5">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {hasPassword && (
            <div className={inputCls}>
              <Lock className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
              <input
                data-testid="input-current-trade-password"
                type="password"
                placeholder="Mot de passe actuel"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
            </div>
          )}

          {!hasPassword && (
            <div className={inputCls}>
              <Shield className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
              <input
                data-testid="input-otp-trade-password"
                type="text"
                placeholder="Code de vérification OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
              <button
                type="button"
                disabled={otpLoading || countdown > 0}
                onClick={handleSendOtp}
                data-testid="button-send-otp-trade-password"
                className={`text-sm font-bold whitespace-nowrap px-3 py-1.5 rounded-full ${countdown > 0 || otpLoading ? "text-gray-400 bg-gray-100" : "text-white bg-[#22c55e]"}`}>
                {countdown > 0 ? `${countdown}s` : otpLoading ? "..." : "Envoyer"}
              </button>
            </div>
          )}

          <div className={inputCls}>
            <Lock className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
            <input
              data-testid="input-new-trade-password"
              type="password"
              placeholder="Nouveau mot de passe"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>

          <div className={inputCls}>
            <Lock className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
            <input
              data-testid="input-confirm-trade-password"
              type="password"
              placeholder="Confirmer le nouveau mot de passe"
              value={confirmNew}
              onChange={e => setConfirmNew(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>
        </div>

        <button
          data-testid="button-set-trade-password"
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#22c55e] text-white font-bold text-base py-4 rounded-full shadow-md active:opacity-80 disabled:opacity-60"
        >
          {loading ? "En cours..." : "Confirmer"}
        </button>
      </div>
    </div>
  );
}
