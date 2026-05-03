import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/user/profile", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Mot de passe modifié avec succès" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNew("");
    },
    onError: (e: any) => {
      toast({ title: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
  });

  const handleSave = () => {
    if (!currentPassword || !newPassword || !confirmNew) {
      toast({ title: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmNew) {
      toast({ title: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ password: currentPassword, newPassword });
  };

  const inputCls = "flex items-center px-4 py-4 border-b border-gray-50 last:border-0";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header gold */}
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 py-4 flex items-center gap-3">
        <button onClick={() => window.history.back()} data-testid="button-back-settings" className="text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white font-bold text-base">Modifier le mot de passe</h1>
      </div>

      <div className="px-4 pt-5 space-y-4">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div className={inputCls}>
            <Lock className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
            <input
              data-testid="input-current-password"
              type="password"
              placeholder="Mot de passe actuel"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>
          <div className={inputCls}>
            <Lock className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
            <input
              data-testid="input-new-password"
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
              data-testid="input-confirm-new-password"
              type="password"
              placeholder="Confirmer le nouveau mot de passe"
              value={confirmNew}
              onChange={e => setConfirmNew(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>
        </div>

        <button
          data-testid="button-save-settings"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full text-black font-bold text-base py-4 rounded-full shadow-md active:opacity-80 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
        >
          {updateMutation.isPending ? "En cours..." : "Confirmer"}
        </button>
      </div>
    </div>
  );
}
