import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { getPaymentMethods } from "@/lib/constants";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, CreditCard, DollarSign, Lock, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";

const PAYMENT_METHODS = [
  "Moov Money", "MTN Mobile Money", "Orange Money", "Wave", "Free Money",
  "Airtel Money", "M-Pesa", "Flooz", "T-Money", "CeltisPay",
];

export default function BankCardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: existingCard } = useQuery({ queryKey: ["/api/user/bank-card"] });

  const [paymentMethod, setPaymentMethod] = useState((existingCard as any)?.paymentMethod || "");
  const [accountName, setAccountName] = useState((existingCard as any)?.accountName || "");
  const [phoneNumber, setPhoneNumber] = useState((existingCard as any)?.phoneNumber || "");
  const [usdtWallet, setUsdtWallet] = useState((existingCard as any)?.usdtWallet || "");
  const [txPassword, setTxPassword] = useState("");

  const paymentMethods = getPaymentMethods(user?.country || "");
  const allMethods = paymentMethods.length > 0 ? paymentMethods : PAYMENT_METHODS;

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/user/bank-card", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Enregistré", description: "Carte bancaire enregistrée avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bank-card"] });
      navigate("/withdraw");
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
  });

  const handleSave = () => {
    if (!paymentMethod) {
      toast({ title: "Erreur", description: "Veuillez sélectionner une banque", variant: "destructive" });
      return;
    }
    if (!accountName.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer le nom du titulaire", variant: "destructive" });
      return;
    }
    if (!phoneNumber.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer le numéro de carte", variant: "destructive" });
      return;
    }
    if (!txPassword.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer le mot de passe de transaction", variant: "destructive" });
      return;
    }
    saveMutation.mutate({
      country: user?.country || "togo",
      paymentMethod,
      phoneNumber,
      accountName,
      usdtWallet,
    });
  };

  return (
    <div className="min-h-screen bg-[#f0f0e4]">
      <div className="bg-[#22c55e] px-4 pt-6 pb-8">
        <button
          onClick={() => navigate("/withdraw")}
          className="flex items-center gap-2 text-white mb-4"
          data-testid="button-back-card"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white text-xl font-bold text-center -mt-8">
          Informations Mobile Money
        </h1>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow p-5 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Banque</label>
            <div className="relative">
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger
                  data-testid="select-card-method"
                  className="w-full h-12 bg-[#f5f5f5] border-none rounded-xl text-gray-500"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <SelectValue placeholder="Veuillez sélectionner une banque" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {allMethods.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Nom du titulaire</label>
            <div className="flex items-center gap-2 bg-[#f5f5f5] rounded-xl px-4 h-12">
              <User className="w-4 h-4 text-gray-400 shrink-0" />
              <Input
                data-testid="input-card-name"
                placeholder="Nom du titulaire du compte"
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                className="border-none bg-transparent p-0 h-auto focus-visible:ring-0 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Numéro de carte</label>
            <div className="flex items-center gap-2 bg-[#f5f5f5] rounded-xl px-4 h-12">
              <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
              <Input
                data-testid="input-card-phone"
                placeholder="Numéro de compte bancaire"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                className="border-none bg-transparent p-0 h-auto focus-visible:ring-0 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">USDT TRC-20</label>
            <div className="flex items-center gap-2 bg-[#f5f5f5] rounded-xl px-4 h-12">
              <DollarSign className="w-4 h-4 text-gray-400 shrink-0" />
              <Input
                data-testid="input-card-usdt"
                placeholder="USDT Wallet"
                value={usdtWallet}
                onChange={e => setUsdtWallet(e.target.value)}
                className="border-none bg-transparent p-0 h-auto focus-visible:ring-0 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Mot de passe de transaction</label>
            <div className="flex items-center gap-2 bg-[#f5f5f5] rounded-xl px-4 h-12">
              <Lock className="w-4 h-4 text-gray-400 shrink-0" />
              <Input
                data-testid="input-card-txpassword"
                type="password"
                placeholder="Mot de passe de transaction"
                value={txPassword}
                onChange={e => setTxPassword(e.target.value)}
                className="border-none bg-transparent p-0 h-auto focus-visible:ring-0 text-sm"
              />
            </div>
          </div>

          <button
            data-testid="button-save-card"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-full h-12 rounded-full bg-[#22c55e] text-white font-bold text-base disabled:opacity-60"
          >
            {saveMutation.isPending ? "En cours..." : "Ajouter une carte bancaire"}
          </button>
        </div>

        <div className="mt-4 pb-8">
          <h3 className="text-[#22c55e] font-bold text-base mb-3">Explication</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>1. Vous ne pouvez ajouter qu'une seule carte</p>
            <p>2. Le numéro de carte doit être un numéro de téléphone Mobile Money valide</p>
            <p>3. Le nom du titulaire doit correspondre au nom enregistré sur le compte Mobile Money</p>
            <p>4. Pour modifier votre carte, soumettez un nouveau formulaire</p>
          </div>
        </div>
      </div>
    </div>
  );
}
