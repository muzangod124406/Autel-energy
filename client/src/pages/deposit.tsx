import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { COUNTRIES, getCountry, getPaymentMethods, BKAPAY_KEY } from "@/lib/constants";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Wallet } from "lucide-react";
import { useLocation } from "wouter";

export default function DepositPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const isCameroun = user?.country === "cameroun";
  const userCountry = getCountry(user?.country || "");
  const paymentMethods = getPaymentMethods(user?.country || "");

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const depositMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/user/deposit", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Dépôt enregistré", description: "Votre dépôt est en attente de validation" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      refreshUser();
      navigate("/");
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
  });

  const handleBKApay = () => {
    const amt = parseInt(amount);
    if (!amt || amt < 100) {
      toast({ title: "Erreur", description: "Montant minimum: 100 FCFA", variant: "destructive" });
      return;
    }
    const callbackUrl = encodeURIComponent(`${window.location.origin}/api/payment/callback`);
    const desc = encodeURIComponent(`Dépôt Red Bull Invest - ${user?.phone}`);
    const url = `https://bkapay.com/api-pay/${BKAPAY_KEY}?amount=${amt}&description=${desc}&callback=${callbackUrl}`;
    window.location.href = url;
  };

  const handleCamerounDeposit = () => {
    const amt = parseInt(amount);
    if (!amt || amt < 100) {
      toast({ title: "Erreur", description: "Montant minimum: 100 FCFA", variant: "destructive" });
      return;
    }
    if (!paymentMethod || !phoneNumber) {
      toast({ title: "Erreur", description: "Remplissez tous les champs", variant: "destructive" });
      return;
    }
    depositMutation.mutate({
      amount: amt,
      country: user?.country,
      paymentMethod,
      phoneNumber,
      accountName,
    });
    window.open("https://soleaspay.com/m/XVTH7OAP7W", "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 pt-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white mb-2" data-testid="button-back-deposit">
            <ArrowLeft className="w-5 h-5" /> Retour
          </button>
          <h1 className="text-white text-xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6" /> Recharger
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4">
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Montant (FCFA)</label>
              <Input
                data-testid="input-deposit-amount"
                type="number"
                placeholder="Montant minimum: 100 FCFA"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>

            {isCameroun ? (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Moyen de paiement</label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger data-testid="select-payment-method">
                      <SelectValue placeholder="Choisir le moyen de paiement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Orange Money">Orange Money</SelectItem>
                      <SelectItem value="MTN Mobile Money">MTN Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Numéro de paiement</label>
                  <Input
                    data-testid="input-payment-phone"
                    placeholder="Numéro de paiement"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Nom du compte (optionnel)</label>
                  <Input
                    data-testid="input-account-name"
                    placeholder="Nom du compte"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                  />
                </div>
                <Button
                  data-testid="button-proceed-deposit"
                  onClick={handleCamerounDeposit}
                  disabled={depositMutation.isPending}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold"
                >
                  {depositMutation.isPending ? "En cours..." : "Procéder au paiement"}
                </Button>
              </>
            ) : (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    Paiement via BKApay
                  </p>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                    Vous serez redirigé vers BKApay pour effectuer votre paiement de manière sécurisée.
                  </p>
                </div>
                <Button
                  data-testid="button-bkapay"
                  onClick={handleBKApay}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold"
                >
                  Payer avec BKApay
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
