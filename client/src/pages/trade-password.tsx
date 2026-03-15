import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function TradePasswordPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [otp, setOtp] = useState("");
  const [transactionPassword, setTransactionPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
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
      setTimeout(() => {
        setOtp(data.code);
      }, 10000);
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
      toast({ title: "Succès", description: "Mot de passe de transaction défini avec succès" });
      navigate("/");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f0f0e4]">
      <div className="bg-[#22c55e] px-4 py-4">
        <h1 className="text-white font-bold text-lg text-center">Définir le mot de passe de transaction</h1>
      </div>

      <div className="px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl p-5 space-y-5 shadow-sm">
          <div>
            <p className="text-gray-700 font-medium mb-2">Code de vérification (OTP)</p>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 gap-3 bg-white">
              <Shield className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                data-testid="input-otp-trade"
                type="text"
                placeholder="Code de vérification (OTP)"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
              />
              <button
                type="button"
                disabled={otpLoading || otpCountdown > 0}
                onClick={handleSendOtp}
                className="text-blue-500 font-semibold text-sm whitespace-nowrap disabled:text-gray-400"
              >
                {otpCountdown > 0 ? `${otpCountdown}s` : otpLoading ? "..." : "Envoyer"}
              </button>
            </div>
          </div>

          <div>
            <p className="text-gray-700 font-medium mb-2">Mot de passe de transaction</p>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 gap-3 bg-white">
              <input
                data-testid="input-transaction-password"
                type={showPass ? "text" : "password"}
                placeholder="mot de passe de transaction"
                value={transactionPassword}
                onChange={e => setTransactionPassword(e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}>
                {showPass ? <Eye className="w-5 h-5 text-gray-400" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
          </div>

          <button
            data-testid="button-set-trade-password"
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-[#22c55e] text-white font-bold rounded-full text-base shadow-md"
          >
            {loading ? "Enregistrement..." : "Update Trade Password"}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-[#22c55e] font-bold text-base mb-3">Explication</h3>
          <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
            <p>
              1. Le mot de passe de transaction est un identifiant important pour retirer des fonds, ajouter des comptes bancaires et supprimer des comptes bancaires. Veuillez assurer un stockage approprié.
            </p>
            <p>
              2. Ne définissez pas le mot de passe de transaction identique au mot de passe de connexion.
            </p>
            <p>
              3. Si vous oubliez votre mot de passe de transaction, veuillez le réinitialiser via votre code de vérification OTP mobile.
            </p>
          </div>
        </div>

        <div className="bg-[#fef3c7] border border-[#f59e0b] rounded-xl p-4">
          <p className="text-[#92400e] text-sm font-medium text-center leading-relaxed">
            VOUS DEVEZ VOUS ASSURER QUE VOTRE NUMÉRO DE TÉLÉPHONE EST CORRECT, ET POUR RETIRER DES FONDS, VOUS DEVEZ RECEVOIR UN CODE DE VÉRIFICATION OTP SUR VOTRE TÉLÉPHONE
          </p>
        </div>
      </div>
    </div>
  );
}
