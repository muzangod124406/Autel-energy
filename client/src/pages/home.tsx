import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import autelLogo from "@assets/images_(11)_1774131992392.png";
import rechargeIcon from "@assets/recharge_(1)_1773608231085.png";
import withdrawIcon from "@assets/withdraw_1773608230743.png";
import blogIcon from "@assets/blog_(1)_1773608231117.png";
import telegramIcon from "@assets/telegram_(1)_1773608231149.png";
import walletIcon from "@assets/3930266_1773614141608.png";
import rewardIcon from "@assets/reward_icon_1773608863536.png";

export default function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  if (!user) return null;

  const ACTION_BUTTONS = [
    { label: "Recharger", icon: rechargeIcon, path: "/deposit", testId: "button-recharge" },
    { label: "Retrait", icon: withdrawIcon, path: "/withdraw", testId: "button-withdraw" },
    { label: "Billet", icon: blogIcon, path: "/billet", testId: "button-billet" },
    { label: "Telegram", icon: telegramIcon, path: "/telegram", testId: "button-telegram" },
  ];

  return (
    <div className="min-h-screen bg-[#22c55e] pb-24">
      <div className="px-4 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-full border-2 border-white bg-white flex items-center justify-center overflow-hidden shrink-0">
            <img src={autelLogo} alt="logo" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-8">
            <div>
              <p className="text-white/80 text-xs mb-1">Solde de recharge</p>
              <p className="text-white font-bold text-lg" data-testid="text-deposit-balance">
                FCFA{user.depositBalance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-white/80 text-xs mb-1">Solde de retrait</p>
              <p className="text-white font-bold text-lg" data-testid="text-withdraw-balance">
                FCFA{user.withdrawBalance.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex items-center shrink-0">
            <button data-testid="button-wallet" onClick={() => navigate("/balance")}
              className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
              <img src={walletIcon} alt="wallet" className="w-7 h-7 object-contain brightness-0 invert" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {ACTION_BUTTONS.map(btn => (
            <button
              key={btn.label}
              data-testid={btn.testId}
              onClick={() => navigate(btn.path)}
              className="flex flex-col items-center gap-2"
            >
              <img src={btn.icon} alt={btn.label} className="w-14 h-14 object-contain" />
              <span className="text-white text-xs font-medium">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        <div
          data-testid="game-card"
          className="w-full rounded-2xl overflow-hidden relative shadow-xl"
          style={{ background: "linear-gradient(135deg, #1a7a3c 0%, #14532d 50%, #0f3d22 100%)" }}
        >
          <div className="absolute inset-0 opacity-20"
            style={{ background: "radial-gradient(circle at 70% 50%, #4ade80 0%, transparent 60%)" }}
          />
          <div className="relative z-10 flex items-center justify-between p-5">
            <div className="flex-1 space-y-2">
              <p className="text-green-300 text-xs font-semibold uppercase tracking-wider">Jeu de récompenses</p>
              <h3 className="text-white text-xl font-bold leading-tight">Roue de la Fortune</h3>
              <p className="text-green-200 text-xs leading-relaxed">
                Invitez des amis pour gagner des tours gratuits et remporter des récompenses !
              </p>
              <button
                onClick={() => navigate("/game")}
                data-testid="button-play-game"
                className="mt-2 inline-flex items-center gap-1 bg-[#22c55e] hover:bg-[#16a34a] text-white text-sm font-bold px-5 py-2 rounded-full transition-colors"
              >
                Allez &gt;
              </button>
            </div>
            <div className="ml-4 shrink-0">
              <img src={rewardIcon} alt="cadeau" className="w-28 h-28 object-contain drop-shadow-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
