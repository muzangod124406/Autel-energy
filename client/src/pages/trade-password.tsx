import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Lock, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

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
        transactionPassword: newPassword,
        currentTransactionPassword: hasPassword ? currentPassword : undefined,
      });
      await refreshUser();
      toast({ title: "Mot de passe de retrait enregistré !" });
      navigate("/");
    } catch (e: any) {
      toast({ title: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
    setLoading(false);
  };

  const inputCls = "flex items-center px-4 py-4 border-b border-gray-50 last:border-0";

  return (
    <div className="min-h-screen bg-gray-50">
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 py-4 flex items-center gap-3">
        <button onClick={() => window.history.back()} data-testid="button-back-trade-password" className="text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white font-bold text-base">Mot de passe de retrait</h1>
      </div>

      <div className="px-4 pt-5 space-y-4">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
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
          className="w-full text-black font-bold text-base py-4 rounded-full shadow-md active:opacity-80 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
        >
          {loading ? "En cours..." : "Confirmer"}
        </button>
      </div>
    </div>
  );
}
