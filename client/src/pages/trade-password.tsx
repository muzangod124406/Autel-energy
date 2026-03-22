import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Lock, ArrowLeft } from "lucide-react";
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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (hasPassword && !currentPassword) {
      toast({ title: "Veuillez saisir votre mot de passe actuel", variant: "destructive" });
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
        phone: user?.phone,
        otp: "bypass",
        transactionPassword: newPassword,
        currentTransactionPassword: hasPassword ? currentPassword : undefined,
      });
      await refreshUser();
      toast({ title: "Mot de passe de retrait modifié avec succès" });
      navigate("/");
    } catch (e: any) {
      toast({ title: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => window.history.back()} data-testid="button-back-trade-password">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex items-center gap-2">
          <img src={autelLogo} alt="Autel" className="w-7 h-7 rounded-full object-cover" />
          <span className="text-[#22c55e] font-bold text-base">Modifier le mot de passe</span>
        </div>
        <div className="w-6" />
      </div>

      <div className="px-4 pt-6 space-y-5">
        {/* Fields card */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {hasPassword && (
            <div className="flex items-center px-4 py-4 border-b border-gray-100">
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

          <div className={`flex items-center px-4 py-4 ${hasPassword ? "border-b border-gray-100" : "border-b border-gray-100"}`}>
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

          <div className="flex items-center px-4 py-4">
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

        {/* Confirm button */}
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
