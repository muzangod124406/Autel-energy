import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { formatCFA, getPaymentMethods } from "@/lib/constants";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

export default function WithdrawPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const paymentMethods = getPaymentMethods(user?.country || "");

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const withdrawMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/user/withdraw", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Retrait soumis", description: "Votre retrait est en attente de validation" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      refreshUser();
      navigate("/");
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
  });

  const handleWithdraw = () => {
    const amt = parseInt(amount);
    if (!amt || amt < 1000) {
      toast({ title: "Erreur", description: "Retrait minimum: 1 000 FCFA", variant: "destructive" });
      return;
    }
    if (!paymentMethod || !phoneNumber) {
      toast({ title: "Erreur", description: "Remplissez tous les champs", variant: "destructive" });
      return;
    }
    withdrawMutation.mutate({
      amount: amt,
      country: user?.country,
      paymentMethod,
      phoneNumber,
      accountName,
    });
  };

  const fees = amount ? Math.floor(parseInt(amount) * 0.10) : 0;
  const net = amount ? parseInt(amount) - fees : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 pt-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white mb-2" data-testid="button-back-withdraw">
            <ArrowLeft className="w-5 h-5" /> Retour
          </button>
          <h1 className="text-white text-xl font-bold flex items-center gap-2">
            <Download className="w-6 h-6" /> Retirer
          </h1>
          <p className="text-white/80 text-sm mt-1">Solde disponible: {formatCFA(user?.withdrawBalance || 0)}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
            <p>Retrait minimum : 1 000 FCFA</p>
            <p>Frais : 10%</p>
            <p>Horaire : 10h à 15h</p>
            <p>1 retrait par jour</p>
            <p>Condition : avoir au moins un produit actif</p>
          </div>
        </div>

        <Card className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Pays</label>
            <Input value={user?.country || ""} disabled className="bg-gray-50 dark:bg-gray-800" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Moyen de paiement</label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger data-testid="select-withdrawal-method">
                <SelectValue placeholder="Choisir le moyen de paiement" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Numéro de réception</label>
            <Input
              data-testid="input-withdraw-phone"
              placeholder="Numéro de réception"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Nom du compte</label>
            <Input
              data-testid="input-withdraw-name"
              placeholder="Nom du titulaire"
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Montant (FCFA)</label>
            <Input
              data-testid="input-withdraw-amount"
              type="number"
              placeholder="Montant minimum: 1 000 FCFA"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          {amount && parseInt(amount) >= 1000 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Frais (10%)</span><span className="font-medium text-red-500">-{formatCFA(fees)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Montant net</span><span className="font-bold text-green-600">{formatCFA(net)}</span></div>
            </div>
          )}
          <Button
            data-testid="button-submit-withdraw"
            onClick={handleWithdraw}
            disabled={withdrawMutation.isPending}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold"
          >
            {withdrawMutation.isPending ? "En cours..." : "Soumettre le retrait"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
