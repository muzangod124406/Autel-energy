import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Shield, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function TradePasswordPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [otp, setOtp] = useState("");
  const [transactionPassword, setTransactionPassword] = useState("");
  const [confirmTxPass, setConfirmTxPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  useEffect(() => {
    if (otpCountdown > 0) {
      const t = setTimeout(() => setOtpCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpCountdown]);

  const handleSendOtp = async () => {
    if (!user?.phone) return;
    setOtpLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/send-otp", { phone: user.phone });
      const data = await res.json();
      setOtpCountdown(70);
      setTimeout(() => setOtp(data.code), 10000);
    } catch {
      toast({ title: "Erreur", description: "Impossible d'envoyer le code OTP", variant: "destructive" });
    }
    setOtpLoading(false);
  };

  const handleSubmit = async () => {
    if (!otp || !transactionPassword) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }
    if (transactionPassword !== confirmTxPass) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    if (transactionPassword.length < 6) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 6 caractères", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/set-transaction-password", {
        phone: user?.phone,
        otp,
        transactionPassword,
      });
      await refreshUser();
      toast({ title: "Succès !", description: "Mot de passe de retrait défini avec succès" });
      navigate("/");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: "linear-gradient(180deg, #d1fae5 0%, #f0fdf4 60%, #f9fafb 100%)" }}>

      {/* ── Header ─────────────────────────── */}
      <div className="relative bg-[#22c55e] px-4 pt-8 pb-12 overflow-hidden">
        <div className="absolute -top-6 right-0 w-36 h-36 rounded-full bg-green-400/30 pointer-events-none" />
        <div className="absolute top-4 -left-6 w-24 h-24 rounded-full bg-green-300/20 pointer-events-none" />
        <div className="relative flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/40">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-white font-extrabold text-xl">Mot de passe de retrait</h1>
            <p className="text-white/80 text-sm mt-1">Sécurisez votre compte en définissant votre code secret</p>
          </div>
        </div>
      </div>

      {/* ── Étapes ─────────────────────────── */}
      <div className="mx-4 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-lg px-5 py-6 space-y-5">

          {/* Étape 1 — OTP */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <p className="text-gray-700 font-semibold text-sm">Code de vérification SMS</p>
            </div>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 gap-3">
              <Shield className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                data-testid="input-otp-trade"
                type="text"
                placeholder="Entrez le code OTP reçu par SMS"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
              />
              <button
                type="button"
                disabled={otpLoading || otpCountdown > 0}
                onClick={handleSendOtp}
                className={`text-sm font-bold whitespace-nowrap px-3 py-1.5 rounded-full transition-all ${otpCountdown > 0 || otpLoading ? "text-gray-400 bg-gray-100" : "text-white bg-[#22c55e]"}`}
              >
                {otpCountdown > 0 ? `${otpCountdown}s` : otpLoading ? "..." : "Envoyer"}
              </button>
            </div>
          </div>

          {/* Séparateur */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-gray-300 text-xs">↓</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Étape 2 — Nouveau mot de passe */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <p className="text-gray-700 font-semibold text-sm">Nouveau mot de passe de retrait</p>
            </div>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 gap-3">
              <Lock className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                data-testid="input-transaction-password"
                type={showPass ? "text" : "password"}
                placeholder="Minimum 6 caractères"
                value={transactionPassword}
                onChange={e => setTransactionPassword(e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}>
                {showPass ? <Eye className="w-5 h-5 text-gray-400" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
          </div>

          {/* Étape 3 — Confirmer */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">3</span>
              </div>
              <p className="text-gray-700 font-semibold text-sm">Confirmer le mot de passe</p>
            </div>
            <div className={`flex items-center bg-gray-50 border rounded-2xl px-4 py-3.5 gap-3 transition-colors ${confirmTxPass && confirmTxPass !== transactionPassword ? "border-red-300" : confirmTxPass && confirmTxPass === transactionPassword ? "border-green-400" : "border-gray-200"}`}>
              <Lock className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                data-testid="input-confirm-trade-password"
                type={showConfirm ? "text" : "password"}
                placeholder="Ressaisissez le mot de passe"
                value={confirmTxPass}
                onChange={e => setConfirmTxPass(e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
              />
              {confirmTxPass && confirmTxPass === transactionPassword
                ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                : <button type="button" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <Eye className="w-5 h-5 text-gray-400" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
                  </button>
              }
            </div>
            {confirmTxPass && confirmTxPass !== transactionPassword && (
              <p className="text-red-500 text-xs mt-1 ml-1">Les mots de passe ne correspondent pas</p>
            )}
          </div>

          {/* Bouton soumettre */}
          <button
            data-testid="button-set-trade-password"
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-[#22c55e] text-white font-extrabold rounded-full text-base shadow-md mt-2 disabled:opacity-60 tracking-wide"
          >
            {loading ? "Enregistrement..." : "CONFIRMER"}
          </button>
        </div>

        {/* ── Avertissements ─────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm px-5 py-5 mt-4 space-y-3">
          <h3 className="text-[#22c55e] font-bold text-sm flex items-center gap-2">
            <Shield className="w-4 h-4" /> Informations importantes
          </h3>
          <ul className="space-y-2.5 text-gray-600 text-sm leading-relaxed">
            <li className="flex gap-2">
              <span className="text-[#22c55e] font-bold shrink-0">1.</span>
              Ce mot de passe sert à sécuriser vos retraits et la gestion de vos comptes bancaires. Conservez-le précieusement.
            </li>
            <li className="flex gap-2">
              <span className="text-[#22c55e] font-bold shrink-0">2.</span>
              Ne définissez pas un mot de passe identique à votre mot de passe de connexion.
            </li>
            <li className="flex gap-2">
              <span className="text-[#22c55e] font-bold shrink-0">3.</span>
              En cas d'oubli, utilisez votre code OTP pour réinitialiser ce mot de passe.
            </li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mt-4">
          <p className="text-amber-800 text-xs font-medium text-center leading-relaxed">
            ⚠️ Assurez-vous que votre numéro de téléphone est correct. Le code OTP sera envoyé sur ce numéro pour valider chaque retrait.
          </p>
        </div>
      </div>
    </div>
  );
}
