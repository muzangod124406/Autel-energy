import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import {
  ChevronRight, TrendingUp, ShoppingBag, FileText,
  Lock, CreditCard, Headset, Gift, Info, LogOut, Shield,
} from "lucide-react";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  if (!user) return null;

  const maskedPhone = user.phone.slice(0, 3) + "****" + user.phone.slice(-3);
  const handleLogout = async () => { await logout(); };

  const menuItems = [
    { label: "Investir",       Icon: TrendingUp,  color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20",   route: "/invest",       testId: "button-investir" },
    { label: "Commandes",      Icon: ShoppingBag, color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20",     route: "/orders",       testId: "button-commandes" },
    { label: "Facture",        Icon: FileText,    color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", route: "/transactions", testId: "button-facture" },
    { label: "Mot de passe",   Icon: Lock,        color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", route: "/settings",     testId: "button-mot-de-passe" },
    { label: "Compte retrait", Icon: CreditCard,  color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20",route: "/bank-card",   testId: "button-compte-retrait" },
    { label: "Service client", Icon: Headset,     color: "text-cyan-400",   bg: "bg-cyan-500/10 border-cyan-500/20",     route: "/telegram",     testId: "button-service-client" },
    { label: "Cadeau",         Icon: Gift,        color: "text-pink-400",   bg: "bg-pink-500/10 border-pink-500/20",     route: "/treasure",     testId: "button-cadeau" },
    { label: "À propos",       Icon: Info,        color: "text-sky-400",    bg: "bg-sky-500/10 border-sky-500/20",       route: "/about",        testId: "button-apropos" },
    { label: "Déconnecter",    Icon: LogOut,      color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20",       route: "__logout__",    testId: "button-logout-grid" },
  ];

  if (user.isAdmin) {
    menuItems.push({
      label: "Admin", Icon: Shield, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20",
      route: "/admin", testId: "button-admin-panel",
    });
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: "linear-gradient(160deg, #0B0B14 0%, #0D0D1A 100%)" }}>

      {/* ── Header ─────────────────────────────────── */}
      <div className="relative px-5 pt-8 pb-6 overflow-hidden">
        <div className="absolute -top-8 right-0 w-48 h-48 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #F59E0B 0%, transparent 70%)" }} />

        <div className="relative flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-lg shadow-amber-500/10">
            <img src="/sinopec-logo.jpeg" alt="SINOPEC" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-bold text-white text-lg">{user.nickname || maskedPhone}</p>
            <p className="text-amber-500/60 text-xs mt-0.5">ID: {user.referralCode}</p>
          </div>
        </div>

        {/* Balance stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl px-4 py-3 border border-[#252538]" style={{ background: "#12121E" }}>
            <p className="text-amber-500/60 text-xs mb-1">Mon Solde</p>
            <p className="text-white font-extrabold text-xl">{(user.depositBalance + user.withdrawBalance).toFixed(2)}</p>
            <p className="text-amber-500/40 text-[10px]">FCFA</p>
          </div>
          <div className="rounded-2xl px-4 py-3 border border-[#252538]" style={{ background: "#12121E" }}>
            <p className="text-amber-500/60 text-xs mb-1">Revenu quotidien</p>
            <p className="text-white font-extrabold text-xl">{user.productRevenue.toFixed(2)}</p>
            <p className="text-amber-500/40 text-[10px]">FCFA</p>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-3">

        {/* ── Solde de recharge card ──────────────── */}
        <div className="rounded-2xl px-5 py-4 flex items-center justify-between relative overflow-hidden border border-amber-500/20"
          style={{ background: "linear-gradient(135deg, #1a1000 0%, #2a1800 50%, #1a1400 100%)" }}>
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: "repeating-linear-gradient(45deg,#F59E0B 0,#F59E0B 1px,transparent 0,transparent 8px)", backgroundSize: "12px 12px" }} />
          <div className="relative">
            <p className="text-amber-400/70 text-xs font-medium">Solde de recharge</p>
            <p className="text-white font-extrabold text-2xl">{user.depositBalance.toFixed(2)}</p>
            <p className="text-amber-500/40 text-[10px]">FCFA</p>
          </div>
          <button onClick={() => navigate("/transactions")} data-testid="button-consulter-points"
            className="relative bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold text-sm px-4 py-2 rounded-full">
            Consulter
          </button>
        </div>

        {/* ── Recharger / Retirer ──────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <button data-testid="button-recharge-account" onClick={() => navigate("/deposit")}
            className="rounded-2xl px-4 py-4 flex items-center justify-between border border-[#252538] transition-all active:scale-95"
            style={{ background: "#12121E" }}>
            <span className="font-bold text-white text-sm">Recharger</span>
            <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-amber-500" />
            </div>
          </button>
          <button data-testid="button-retrait" onClick={() => navigate("/withdraw")}
            className="rounded-2xl px-4 py-4 flex items-center justify-between border border-[#252538] transition-all active:scale-95"
            style={{ background: "#12121E" }}>
            <span className="font-bold text-white text-sm">Retirer</span>
            <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-amber-500" />
            </div>
          </button>
        </div>

        {/* ── Menu grid ───────────────────────────── */}
        <div className="rounded-2xl p-5 border border-[#252538]" style={{ background: "#12121E" }}>
          <div className="grid grid-cols-3 gap-y-6">
            {menuItems.map((item) => {
              const { Icon } = item;
              return (
                <button key={item.testId} data-testid={item.testId}
                  onClick={() => item.route === "__logout__" ? handleLogout() : navigate(item.route)}
                  className="flex flex-col items-center gap-2 transition-all active:scale-90">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${item.bg}`}>
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <p className="text-[#888899] text-xs font-medium text-center leading-tight">{item.label}</p>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
