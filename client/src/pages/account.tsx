import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { LogOut, Shield, ChevronRight } from "lucide-react";
import autelLogo from "@assets/images_(11)_1774131992392.png";
import headsetIcon from "@assets/icon_3-1_1774133434969.png";
import lv0Img from "@assets/lv0_1773607669331.png";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  if (!user) return null;

  const maskedPhone = user.phone.slice(0, 3) + "****" + user.phone.slice(-3);

  const handleLogout = async () => { await logout(); };

  /* ── Menu grid items ─────────────────────────── */
  const menuItems = [
    {
      label: "Investir",
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#22c55e" />
        </svg>
      ),
      bg: "bg-green-50",
      route: "/invest",
      testId: "button-investir",
    },
    {
      label: "Inviter",
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
          <rect x="2" y="4" width="20" height="16" rx="3" fill="#f97316" opacity=".15" />
          <rect x="2" y="4" width="20" height="16" rx="3" stroke="#f97316" strokeWidth="1.5" />
          <path d="M2 8l10 7 10-7" stroke="#f97316" strokeWidth="1.5" />
        </svg>
      ),
      bg: "bg-orange-50",
      route: "/referral",
      testId: "button-inviter",
    },
    {
      label: "Commandes",
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
          <rect x="4" y="2" width="16" height="20" rx="2" fill="#3b82f6" opacity=".15" />
          <rect x="4" y="2" width="16" height="20" rx="2" stroke="#3b82f6" strokeWidth="1.5" />
          <line x1="8" y1="8" x2="16" y2="8" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="8" y1="12" x2="16" y2="12" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="8" y1="16" x2="12" y2="16" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      bg: "bg-blue-50",
      route: "/orders",
      testId: "button-commandes",
    },
    {
      label: "Mot de passe",
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
          <rect x="5" y="10" width="14" height="11" rx="2" fill="#f97316" opacity=".15" />
          <rect x="5" y="10" width="14" height="11" rx="2" stroke="#f97316" strokeWidth="1.5" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="15" r="1.5" fill="#f97316" />
        </svg>
      ),
      bg: "bg-orange-50",
      route: "/trade-password",
      testId: "button-mot-de-passe",
    },
    {
      label: "Compte retrait",
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
          <rect x="2" y="6" width="20" height="14" rx="3" fill="#22c55e" opacity=".15" />
          <rect x="2" y="6" width="20" height="14" rx="3" stroke="#22c55e" strokeWidth="1.5" />
          <circle cx="8" cy="13" r="2" fill="#22c55e" />
          <path d="M14 11h4M14 15h2" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      bg: "bg-green-50",
      route: "/bank-card",
      testId: "button-compte-retrait",
    },
    {
      label: "Mon équipe",
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
          <circle cx="9" cy="7" r="3" fill="#ef4444" opacity=".7" />
          <circle cx="17" cy="7" r="2.5" fill="#ef4444" opacity=".5" />
          <path d="M2 20c0-3.31 3.13-6 7-6s7 2.69 7 6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M17 14c2.21 0 4 1.79 4 4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      bg: "bg-red-50",
      route: "/referral",
      testId: "button-mon-equipe",
    },
    {
      label: "Service client",
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
          <circle cx="12" cy="12" r="9" fill="#22c55e" opacity=".15" stroke="#22c55e" strokeWidth="1.5" />
          <path d="M9 9a3 3 0 1 1 4.5 2.6c-.5.3-.5.9-.5 1.4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="17" r="1" fill="#22c55e" />
        </svg>
      ),
      bg: "bg-green-50",
      route: "/telegram",
      testId: "button-service-client",
    },
    {
      label: "Publications",
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="3" fill="#f59e0b" opacity=".15" />
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="#f59e0b" strokeWidth="1.5" />
          <path d="M8 7h8M8 12h5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 17l2-2 2 2 4-4" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      bg: "bg-amber-50",
      route: "/billet",
      testId: "button-publications",
    },
    {
      label: "Paramètres",
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
          <circle cx="12" cy="12" r="3" stroke="#6366f1" strokeWidth="1.5" />
          <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      bg: "bg-indigo-50",
      route: "/settings",
      testId: "button-parametres",
    },
  ];

  if (user.isAdmin) {
    menuItems.push({
      label: "Admin",
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
          <path d="M12 2l3 7h7l-6 4.5 2.3 7L12 17l-6.3 3.5L8 13.5 2 9h7z" fill="#3b82f6" opacity=".2" stroke="#3b82f6" strokeWidth="1.5" />
        </svg>
      ),
      bg: "bg-blue-50",
      route: "/admin",
      testId: "button-admin-panel",
    });
  }

  return (
    <div className="min-h-screen pb-24 overflow-x-hidden" style={{ background: "linear-gradient(180deg, #d1fae5 0%, #f0fdf4 60%, #f9fafb 100%)" }}>

      {/* ── Header ─────────────────────────────────── */}
      <div className="relative px-4 pt-6 pb-6 overflow-hidden">
        {/* Decorative circles — clipped to header */}
        <div className="absolute -top-6 right-0 w-40 h-40 rounded-full bg-green-200/40 pointer-events-none" />
        <div className="absolute top-4 -left-6 w-28 h-28 rounded-full bg-green-300/20 pointer-events-none" />

        <div className="relative flex items-center justify-between">
          {/* Left: logo + name */}
          <div className="flex items-center gap-3">
            <img src={autelLogo} alt="Autel" className="w-14 h-14 rounded-full border-2 border-white shadow-sm object-cover" />
            <div>
              <p className="font-bold text-gray-800 text-base">{user.nickname || maskedPhone}</p>
              <p className="text-gray-500 text-xs mt-0.5">ID: {user.referralCode}</p>
            </div>
          </div>

          {/* Right: avatar character */}
          <img src={headsetIcon} alt="avatar" className="w-16 h-16 object-contain drop-shadow-md" />
        </div>

        {/* Balance stats */}
        <div className="flex gap-8 mt-5">
          <div>
            <p className="text-gray-900 font-extrabold text-2xl">{(user.depositBalance + user.withdrawBalance).toFixed(2)}</p>
            <p className="text-gray-500 text-xs mt-0.5">Mon Solde</p>
          </div>
          <div>
            <p className="text-gray-900 font-extrabold text-2xl">{user.productRevenue.toFixed(2)}</p>
            <p className="text-gray-500 text-xs mt-0.5">Revenu quotidien</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-3">

        {/* ── Points card ─────────────────────────── */}
        <div className="bg-[#22c55e] rounded-2xl px-4 py-3 flex items-center justify-between relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "12px 12px" }}
          />
          <div className="relative">
            <p className="text-white/80 text-xs font-medium">Solde de recharge</p>
            <p className="text-white font-extrabold text-2xl">{user.depositBalance.toFixed(2)}</p>
          </div>
          <button
            onClick={() => navigate("/deposit-history")}
            className="relative bg-white/20 border border-white/40 text-white font-semibold text-sm px-4 py-1.5 rounded-full"
            data-testid="button-consulter-points"
          >
            consulter
          </button>
        </div>

        {/* ── Recharger / Retirer ──────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            data-testid="button-recharge-account"
            onClick={() => navigate("/deposit")}
            className="bg-white rounded-2xl px-4 py-4 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐣</span>
              <span className="font-bold text-gray-800 text-sm">Recharger</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#22c55e] flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
          </button>

          <button
            data-testid="button-retrait"
            onClick={() => navigate("/withdraw")}
            className="bg-white rounded-2xl px-4 py-4 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐥</span>
              <span className="font-bold text-gray-800 text-sm">Retirer</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#22c55e] flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
          </button>
        </div>

        {/* ── Menu grid ───────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-y-5">
            {menuItems.map((item) => (
              <button
                key={item.testId}
                data-testid={item.testId}
                onClick={() => navigate(item.route)}
                className="flex flex-col items-center gap-1.5"
              >
                <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center`}>
                  {item.icon}
                </div>
                <p className="text-gray-700 text-xs font-medium text-center leading-tight">{item.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Déconnexion ─────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm">
          <button
            data-testid="button-logout"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-4 text-orange-500"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold text-base">Déconnexion</span>
          </button>
        </div>

      </div>
    </div>
  );
}
