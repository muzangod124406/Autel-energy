import { useAuth } from "@/lib/auth";
import { formatCFA, getCountry } from "@/lib/constants";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ShoppingBag, DollarSign, Users, CreditCard, Crown,
  HelpCircle, Info, MessageCircle, Settings, LogOut, ChevronRight, Wallet, Download
} from "lucide-react";
import BottomNav from "@/components/bottom-nav";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  if (!user) return null;

  const country = getCountry(user.country);
  const maskedPhone = user.phone.slice(0, 3) + "****" + user.phone.slice(-3);
  const vipProgress = Math.min((user.depositBalance / 35000) * 100, 100);

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const quickButtons = [
    { label: "Commandes", icon: ShoppingBag, action: () => navigate("/orders") },
    { label: "Mon Solde", icon: DollarSign, action: () => navigate("/balance") },
    { label: "Mon Équipe", icon: Users, action: () => navigate("/invite") },
    { label: "Carte Bancaire", icon: CreditCard, action: () => navigate("/bank-card") },
  ];

  const services = [
    { label: "VIP", icon: Crown, action: () => navigate("/invest") },
    { label: "Centre d'Aide", icon: HelpCircle, action: () => navigate("/telegram") },
    { label: "À Propos de Nous", icon: Info, action: () => navigate("/about") },
    { label: "Telegram", icon: MessageCircle, action: () => navigate("/telegram") },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-4 pt-6 pb-2">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">RB</span>
              </div>
              <div>
                <p className="text-white font-semibold">{maskedPhone}</p>
                <p className="text-white/60 text-xs">ID: {user.referralCode}</p>
              </div>
            </div>
            <button onClick={() => navigate("/settings")} data-testid="button-settings-top">
              <Settings className="w-5 h-5 text-white/70" />
            </button>
          </div>

          <div className="bg-gradient-to-r from-purple-500/50 to-blue-500/50 rounded-xl p-4 mb-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-bold text-sm">NIVEAU VIP</span>
              </div>
              <Badge className="bg-white/20 text-white border-0">VIP {user.vipLevel}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-white/80 text-xs">Progression actuelle</p>
              <p className="text-white text-xs font-semibold">{formatCFA(user.depositBalance).replace(" FCFA", "")} / 35 000</p>
            </div>
            <Progress value={vipProgress} className="h-2 bg-white/20" />
          </div>

          <div className="flex gap-2 mb-4">
            <Button
              data-testid="button-recharge-account"
              onClick={() => navigate("/deposit")}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold"
            >
              <Wallet className="w-4 h-4 mr-2" /> Recharge
            </Button>
            <Button
              data-testid="button-retrait-account"
              onClick={() => navigate("/withdraw")}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold"
            >
              <Download className="w-4 h-4 mr-2" /> Retrait
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        <Card className="p-4">
          <div className="grid grid-cols-4 gap-3">
            {quickButtons.map(btn => (
              <button
                key={btn.label}
                data-testid={`button-${btn.label.toLowerCase().replace(/\s/g, "-")}`}
                onClick={btn.action}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="w-11 h-11 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                  <btn.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">{btn.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="font-bold text-sm">Mes Revenus</h3>
            <button
              onClick={() => navigate("/transactions")}
              className="flex items-center gap-1 text-xs text-muted-foreground"
              data-testid="button-details-revenus"
            >
              Détails des Revenus <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Solde de Recharge</p>
              <p className="text-lg font-bold text-orange-500">{user.depositBalance.toLocaleString("fr-FR")}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Solde de Retrait</p>
              <p className="text-lg font-bold text-blue-600">{user.withdrawBalance.toLocaleString("fr-FR")}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-blue-600">{user.productRevenue.toLocaleString("fr-FR")}</p>
              <p className="text-[10px] text-muted-foreground">Revenu Produit</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600">{user.commissionBalance.toLocaleString("fr-FR")}</p>
              <p className="text-[10px] text-muted-foreground">Commission</p>
            </div>
            <div>
              <p className="text-lg font-bold">{0}</p>
              <p className="text-[10px] text-muted-foreground">Commandes</p>
            </div>
          </div>
        </Card>

        {user.isPromoter && (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300 w-full justify-center py-1">
            Promoteur
          </Badge>
        )}

        <Card className="p-4">
          <h3 className="font-bold text-sm mb-3">Plus de services</h3>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {services.map(s => (
              <button
                key={s.label}
                data-testid={`service-${s.label.toLowerCase().replace(/\s/g, "-")}`}
                onClick={s.action}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="w-11 h-11 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">{s.label}</span>
              </button>
            ))}
          </div>

          <button
            data-testid="button-parametres"
            onClick={() => navigate("/settings")}
            className="flex items-center justify-between gap-2 w-full py-3 border-t"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium">Paramètres</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            data-testid="button-logout"
            onClick={handleLogout}
            className="flex items-center gap-2 w-full py-3 border-t text-red-500"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Déconnexion</span>
          </button>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}
