import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { getPaymentMethods, COUNTRIES } from "@/lib/constants";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CreditCard, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function BankCardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: existingCard, isLoading } = useQuery({ queryKey: ["/api/user/bank-card"] });

  const [country, setCountry] = useState(user?.country || "");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const paymentMethods = getPaymentMethods(country);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/user/bank-card", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Enregistré", description: "Carte bancaire enregistrée avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bank-card"] });
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 pt-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate("/account")} className="flex items-center gap-2 text-white mb-2" data-testid="button-back-card">
            <ArrowLeft className="w-5 h-5" /> Retour
          </button>
          <h1 className="text-white text-xl font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6" /> Carte Bancaire
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4">
        {existingCard && (
          <Card className="p-4 mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-700 dark:text-green-400 text-sm">Carte enregistrée</span>
            </div>
            <div className="text-sm space-y-1 text-green-800 dark:text-green-300">
              <p>Pays: {COUNTRIES.find(c => c.id === existingCard.country)?.name}</p>
              <p>Moyen: {existingCard.paymentMethod}</p>
              <p>Numéro: {existingCard.phoneNumber}</p>
            </div>
          </Card>
        )}

        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-sm">{existingCard ? "Modifier la carte" : "Enregistrer une carte"}</h3>
          <div>
            <label className="text-sm font-medium mb-1 block">Pays</label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger data-testid="select-card-country">
                <SelectValue placeholder="Sélectionnez le pays" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.flag} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Moyen de paiement</label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger data-testid="select-card-method">
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
            <label className="text-sm font-medium mb-1 block">Numéro de réception des fonds</label>
            <Input
              data-testid="input-card-phone"
              placeholder="Numéro de réception"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
            />
          </div>
          <Button
            data-testid="button-save-card"
            onClick={() => saveMutation.mutate({ country, paymentMethod, phoneNumber })}
            disabled={saveMutation.isPending || !country || !paymentMethod || !phoneNumber}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold"
          >
            {saveMutation.isPending ? "En cours..." : "Enregistrer"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
