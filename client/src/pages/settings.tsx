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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => window.history.back()} data-testid="button-back-settings">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex items-center gap-2">
          <img src="/sinopec-logo.jpeg" alt="SINOPEC" className="w-7 h-7 rounded-full object-cover" />
          <span className="text-[#22c55e] font-bold text-base">Modifier le mot de passe</span>
        </div>
        <div className="w-6" />
      </div>

      <div className="px-4 pt-6 space-y-5">
        {/* Fields card */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {/* Field 1 */}
          <div className="flex items-center px-4 py-4 border-b border-gray-100">
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

          {/* Field 2 */}
          <div className="flex items-center px-4 py-4 border-b border-gray-100">
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

          {/* Field 3 */}
          <div className="flex items-center px-4 py-4">
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

        {/* Confirm button */}
        <button
          data-testid="button-save-settings"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full bg-[#22c55e] text-white font-bold text-base py-4 rounded-full shadow-md active:opacity-80 disabled:opacity-60"
        >
          {updateMutation.isPending ? "En cours..." : "Confirmer"}
        </button>
      </div>
    </div>
  );
}
