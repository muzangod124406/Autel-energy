import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Settings as SettingsIcon, Lock, Phone } from "lucide-react";
import { useLocation } from "wouter";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [phone, setPhone] = useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/user/profile", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Mis à jour", description: "Vos informations ont été mises à jour" });
      refreshUser();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNew("");
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
  });

  const handleSave = () => {
    const data: any = {};
    if (phone !== user?.phone) data.phone = phone;
    if (newPassword) {
      if (newPassword !== confirmNew) {
        toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" });
        return;
      }
      data.password = currentPassword;
      data.newPassword = newPassword;
    }
    if (Object.keys(data).length === 0) {
      toast({ title: "Info", description: "Aucune modification détectée" });
      return;
    }
    updateMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-4 pt-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate("/account")} className="flex items-center gap-2 text-white mb-2" data-testid="button-back-settings">
            <ArrowLeft className="w-5 h-5" /> Retour
          </button>
          <h1 className="text-white text-xl font-bold flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" /> Paramètres
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-500" /> Modifier le numéro
          </h3>
          <Input
            data-testid="input-settings-phone"
            placeholder="Numéro de téléphone"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </Card>

        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-500" /> Modifier le mot de passe
          </h3>
          <Input
            data-testid="input-current-password"
            type="password"
            placeholder="Mot de passe actuel"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
          />
          <Input
            data-testid="input-new-password"
            type="password"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
          <Input
            data-testid="input-confirm-new-password"
            type="password"
            placeholder="Confirmer le nouveau mot de passe"
            value={confirmNew}
            onChange={e => setConfirmNew(e.target.value)}
          />
        </Card>

        <Button
          data-testid="button-save-settings"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold"
        >
          {updateMutation.isPending ? "En cours..." : "Enregistrer les modifications"}
        </Button>
      </div>
    </div>
  );
}
