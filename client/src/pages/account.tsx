import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import {
  ChevronRight, TrendingUp, ShoppingBag, Receipt,
  CreditCard, Headset, Gift, LogOut, Shield,
} from "lucide-react";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  if (!user) return null;

  const maskedPhone = user.phone.slice(0, 3) + "****" + user.phone.slice(-3);
  const handleLogout = async () => { await logout(); };

  const menuItems = [
    { label: "Investir",                  Icon: TrendingUp, color: "text-amber-500",  bg: "bg-amber-50",   route: "/invest",        testId: "button-investir" },
    { label: "Commandes",                 Icon: ShoppingBag,color: "text-blue-500",   bg: "bg-blue-50",    route: "/orders",        testId: "button-commandes" },
    { label: "Historique de transaction", Icon: Receipt,    color: "text-purple-500", bg: "bg-purple-50",  route: "/transactions",  testId: "button-transactions" },
    { label: "Compte retrait",            Icon: CreditCard, color: "text-emerald-600",bg: "bg-emerald-50", route: "/bank-card",     testId: "button-compte-retrait" },
    { label: "DEEN SINOPEC",              Icon: Headset,    color: "text-cyan-500",   bg: "bg-cyan-50",    route: "/telegram",      testId: "button-service-client" },
    { label: "Cadeau",                    Icon: Gift,       color: "text-pink-500",   bg: "bg-pink-50",    route: "/treasure",      testId: "button-cadeau" },
    { label: "Déconnecter",               Icon: LogOut,     color: "text-red-500",    bg: "bg-red-50",     route: "__logout__",     testId: "button-logout-grid" },
  ];

  if (user.isAdmin) {
    menuItems.push({
      label: "Admin", Icon: Shield, color: "text-amber-500", bg: "bg-amber-50",
      route: "/admin", testId: "button-admin-panel",
    });
  }

  return (
    <div className="min-h-screen pb-28 bg-gray-50">

      {/* Header gold */}
      <div className="px-5 pt-10 pb-8" style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/40 shadow-lg">
            <img src="/sinopec-logo.jpeg" alt="SINOPEC" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-bold text-white text-lg">{user.nickname || maskedPhone}</p>
            <p className="text-white/70 text-xs mt-0.5">ID: {user.referralCode}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-2xl px-4 py-3 border border-white/25">
            <p className="text-white/70 text-xs mb-1">Mon Solde</p>
            <p className="text-white font-extrabold text-xl">{(user.depositBalance + user.withdrawBalance).toFixed(2)}</p>
            <p className="text-white/50 text-[10px]">FCFA</p>
          </div>
          <div className="bg-white/15 rounded-2xl px-4 py-3 border border-white/25">
            <p className="text-white/70 text-xs mb-1">Revenu quotidien</p>
            <p className="text-white font-extrabold text-xl">{user.productRevenue.toFixed(2)}</p>
            <p className="text-white/50 text-[10px]">FCFA</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-3">

        {/* Solde card */}
        <div className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm border border-gray-100">
          <div>
            <p className="text-gray-500 text-xs font-medium">Solde de recharge</p>
            <p className="text-gray-900 font-extrabold text-2xl">{user.depositBalance.toFixed(2)}</p>
            <p className="text-gray-400 text-[10px]">FCFA</p>
          </div>
          <button onClick={() => navigate("/transactions")} data-testid="button-consulter-points"
            className="text-black font-semibold text-sm px-4 py-2 rounded-full"
            style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
            Consulter
          </button>
        </div>

        {/* Recharger / Retirer */}
        <div className="grid grid-cols-2 gap-3">
          <button data-testid="button-recharge-account" onClick={() => navigate("/deposit")}
            className="bg-white rounded-2xl px-4 py-4 flex items-center justify-between border border-gray-100 shadow-sm transition-all active:scale-95">
            <span className="font-bold text-gray-800 text-sm">Recharger</span>
            <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-amber-500" />
            </div>
          </button>
          <button data-testid="button-retrait" onClick={() => navigate("/withdraw")}
            className="bg-white rounded-2xl px-4 py-4 flex items-center justify-between border border-gray-100 shadow-sm transition-all active:scale-95">
            <span className="font-bold text-gray-800 text-sm">Retirer</span>
            <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-amber-500" />
            </div>
          </button>
        </div>

        {/* Menu — liste verticale */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {menuItems.map((item) => {
            const { Icon } = item;
            const isLogout = item.route === "__logout__";
            return (
              <button
                key={item.testId}
                data-testid={item.testId}
                onClick={() => isLogout ? handleLogout() : navigate(item.route)}
                className="w-full flex items-center gap-4 px-5 py-3.5 active:bg-gray-50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className={`flex-1 text-left font-semibold text-sm ${isLogout ? "text-red-500" : "text-gray-800"}`}>
                  {item.label}
                </span>
                {!isLogout && <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
