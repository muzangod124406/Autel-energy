import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { formatCFA } from "@/lib/constants";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Wallet, Download, Users, Send, MessageCircle, Eye, EyeOff, Gamepad2 } from "lucide-react";

interface ActionButton {
  id: string;
  label: string;
  icon: typeof Wallet;
  color: string;
  path: string;
  testId: string;
}

const actionButtons: ActionButton[] = [
  { id: "recharge", label: "Recharger", icon: Wallet, color: "bg-emerald-500", path: "/deposit", testId: "button-recharge" },
  { id: "withdraw", label: "Retirer", icon: Download, color: "bg-orange-500", path: "/withdraw", testId: "button-withdraw" },
  { id: "team", label: "Équipe", icon: Users, color: "bg-blue-500", path: "/invite", testId: "button-team" },
  { id: "invest", label: "Ordonné", icon: Send, color: "bg-purple-500", path: "/invest", testId: "button-invest" },
  { id: "telegram", label: "Telegram", icon: MessageCircle, color: "bg-cyan-500", path: "/telegram", testId: "button-telegram" },
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [showBalance, setShowBalance] = useState(true);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const maskPhone = (phone: string): string => {
    if (phone.length <= 4) return phone;
    return phone.slice(0, 3) + "*".repeat(Math.max(0, phone.length - 7)) + phone.slice(-4);
  };

  const initials = "RB";

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-4">
        <div
          className="rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 p-6 text-white overflow-hidden relative"
          data-testid="card-balance-gradient"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 bg-white/20 border border-white/30">
                  <AvatarFallback className="text-white font-bold text-sm" data-testid="avatar-initials">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="text-sm font-medium opacity-90" data-testid="text-masked-phone">
                    {maskPhone(user.phone)}
                  </div>
                  <div className="text-xs opacity-75" data-testid="text-referral-code">
                    ID: {user.referralCode}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                data-testid="button-toggle-balance"
              >
                {showBalance ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium opacity-90">Votre Solde</div>
              <div className="text-4xl font-bold" data-testid="text-balance-amount">
                {showBalance ? formatCFA(user.balance) : "FCFA ••••"}
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />
        </div>

        <div
          className="grid grid-cols-5 gap-3 bg-card rounded-2xl p-4"
          data-testid="grid-action-buttons"
        >
          {actionButtons.map((btn) => {
            const IconComponent = btn.icon;
            return (
              <button
                key={btn.id}
                onClick={() => navigate(btn.path)}
                className="flex flex-col items-center gap-2 group"
                data-testid={btn.testId}
              >
                <div
                  className={`${btn.color} w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-foreground text-center" data-testid={`label-${btn.id}`}>
                  {btn.label}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => navigate("/game")}
          className="w-full rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 p-6 text-white text-center overflow-hidden relative group hover:shadow-lg transition-shadow"
          data-testid="button-fortune-wheel"
        >
          <div className="relative z-10 space-y-2">
            <div className="flex justify-center mb-3">
              <div className="bg-white/20 p-3 rounded-full">
                <Gamepad2 className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-xl font-bold">Roue de la Fortune</h3>
            <p className="text-sm opacity-90">
              Invitez des amis ou achetez des produits pour gagner des tours gratuits !
            </p>
          </div>

          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
        </button>

        <div className="space-y-2" data-testid="section-announcements">
          <h3 className="text-sm font-semibold text-foreground px-2">Annonces</h3>
          <div className="bg-card rounded-2xl p-4 border border-card-border space-y-3">
            <div className="text-sm text-muted-foreground text-center py-4">
              Aucune annonce pour le moment
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
