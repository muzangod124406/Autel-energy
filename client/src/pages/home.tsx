import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Gamepad2 } from "lucide-react";
import autelLogo from "@assets/autel_green_logo_110x@2x_1773598927579.png";
import rechargeIcon from "@assets/recharge_(1)_1773608231085.png";
import withdrawIcon from "@assets/withdraw_1773608230743.png";
import blogIcon from "@assets/blog_(1)_1773608231117.png";
import telegramIcon from "@assets/telegram_(1)_1773608231149.png";
import withdrawRecordIcon from "@assets/withdraw_record_1773608231188.png";
import lv0Img from "@assets/lv0_1773608793133.png";
import rechargeCircleImg from "@assets/recharge_1773608793085.png";

export default function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  if (!user) return null;

  const ACTION_BUTTONS = [
    { label: "Recharger", icon: rechargeIcon, path: "/deposit", testId: "button-recharge" },
    { label: "Retrait", icon: withdrawIcon, path: "/withdraw", testId: "button-withdraw" },
    { label: "Équipe", icon: withdrawRecordIcon, path: "/invite", testId: "button-team" },
    { label: "Blog", icon: blogIcon, path: "/billet", testId: "button-blog" },
    { label: "Telegram", icon: telegramIcon, path: "/telegram", testId: "button-telegram" },
  ];

  return (
    <div className="min-h-screen bg-[#22c55e] pb-24">
      <div className="px-4 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-full border-2 border-white bg-white flex items-center justify-center overflow-hidden shrink-0">
            <span className="text-2xl">🦁</span>
          </div>
          <img src={autelLogo} alt="Autel" className="h-7 object-contain brightness-0 invert" />
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
          <div className="flex items-center gap-2 shrink-0">
            <button data-testid="button-recharge-circle" onClick={() => navigate("/deposit")}>
              <img src={rechargeCircleImg} alt="recharge" className="w-10 h-10 object-contain" />
            </button>
            <button data-testid="button-vip" onClick={() => navigate("/invest")}>
              <img src={lv0Img} alt="vip" className="w-10 h-10 object-contain" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1">
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
        <button
          onClick={() => navigate("/game")}
          data-testid="button-game-card"
          className="w-full rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-6 text-white text-center overflow-hidden relative shadow-xl"
        >
          <div className="relative z-10 space-y-2">
            <div className="flex justify-center mb-2">
              <div className="bg-white/20 p-3 rounded-full">
                <Gamepad2 className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-xl font-bold">Roue de la Fortune</h3>
            <p className="text-sm opacity-90">
              Invitez des amis pour gagner des tours gratuits et remporter des récompenses !
            </p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
        </button>
      </div>
    </div>
  );
}
