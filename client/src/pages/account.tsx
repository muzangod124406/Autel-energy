import { useAuth } from "@/lib/auth";
import { getCountry } from "@/lib/constants";
import { useLocation } from "wouter";
import { ChevronRight, LogOut, Shield, Headphones, Diamond, Settings } from "lucide-react";
import lv0Img from "@assets/lv0_1773607669331.png";
import noticeImg from "@assets/notice_1773607669301.png";
import withdrawRecordImg from "@assets/withdraw_record_1773607669270.png";
import { SiTelegram } from "react-icons/si";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  if (!user) return null;

  const country = getCountry(user.country);
  const maskedPhone = user.phone.slice(0, 3) + "****" + user.phone.slice(-3);
  const vipTarget = 2000;
  const vipProgress = Math.min((user.depositBalance / vipTarget) * 100, 100);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-[#f0f0e4] pb-24">
      <div className="bg-[#22c55e] px-4 pt-6 pb-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full border-2 border-white/50 bg-white/20 flex items-center justify-center overflow-hidden">
              <span className="text-2xl">🦁</span>
            </div>
            <div>
              <p className="text-white font-bold text-base">{user.nickname || "Utilisateur"}</p>
              <p className="text-white/80 text-sm">{maskedPhone} ID: {user.referralCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              data-testid="button-notice"
              onClick={() => navigate("/transactions")}
              className="w-9 h-9 rounded-full border border-white/50 bg-white/10 flex items-center justify-center"
            >
              <img src={noticeImg} alt="notice" className="w-5 h-5 object-contain" />
            </button>
          </div>
        </div>

        <div className="bg-[#1aa84f] rounded-2xl px-4 pt-3 pb-4 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Diamond className="w-4 h-4 text-yellow-300" />
            <span className="text-white font-bold text-sm tracking-wide">NIVEAU VIP</span>
            <span className="ml-1 bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">VIP {user.vipLevel}</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2 mb-1">
            <div
              className="bg-white h-2 rounded-full transition-all"
              style={{ width: `${vipProgress}%` }}
            />
          </div>
          <p className="text-white/80 text-xs">Progression actuelle {user.depositBalance} / {vipTarget}</p>
          <img
            src={lv0Img}
            alt="VIP level"
            className="absolute right-3 bottom-2 w-14 h-14 object-contain"
          />
        </div>
      </div>

      <div className="px-4 -mt-5 space-y-3">
        <div className="bg-white rounded-2xl px-4 py-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm mb-0.5">Revenu des produits</p>
            <p className="text-gray-900 font-bold text-xl">{user.productRevenue.toFixed(2)}</p>
          </div>
          <button
            data-testid="button-recharge-account"
            onClick={() => navigate("/deposit")}
            className="bg-[#22c55e] text-white font-bold px-5 py-3 rounded-xl flex items-center gap-1"
          >
            Recharger <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            data-testid="button-retrait"
            onClick={() => navigate("/withdraw")}
            className="bg-white rounded-2xl p-3 shadow-sm flex flex-col items-start relative"
          >
            <ChevronRight className="w-4 h-4 text-gray-300 absolute top-2 right-2" />
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-2">
              <img src={withdrawRecordImg} alt="retrait" className="w-6 h-6 object-contain" />
            </div>
            <p className="text-gray-800 font-semibold text-sm">Retrait</p>
            <p className="text-gray-500 text-xs">{user.withdrawBalance.toFixed(2)}</p>
          </button>

          <button
            data-testid="button-commandes"
            onClick={() => navigate("/orders")}
            className="bg-white rounded-2xl p-3 shadow-sm flex flex-col items-start relative"
          >
            <ChevronRight className="w-4 h-4 text-gray-300 absolute top-2 right-2" />
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-2">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#22c55e]" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
            </div>
            <p className="text-gray-800 font-semibold text-sm">Commandes</p>
            <p className="text-gray-500 text-xs">0</p>
          </button>

          <button
            data-testid="button-carte-bancaire"
            onClick={() => navigate("/bank-card")}
            className="bg-white rounded-2xl p-3 shadow-sm flex flex-col items-start relative"
          >
            <ChevronRight className="w-4 h-4 text-gray-300 absolute top-2 right-2" />
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-2">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#22c55e]" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <p className="text-gray-800 font-semibold text-sm">Carte bancaire</p>
          </button>
        </div>

        <div className="bg-white rounded-2xl px-4 py-4 shadow-sm">
          <div className="mb-3">
            <h2 className="text-gray-900 font-bold text-base">Entrée de fonds</h2>
            <div className="w-10 h-1 bg-[#22c55e] rounded-full mt-1" />
          </div>
          <div className="divide-y divide-gray-100">
            <button
              data-testid="button-details-solde"
              onClick={() => navigate("/balance")}
              className="flex items-center justify-between w-full py-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <img src={withdrawRecordImg} alt="" className="w-5 h-5 object-contain" />
                </div>
                <span className="text-gray-700 text-sm">Détails du solde</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
            <button
              data-testid="button-historique-recompenses"
              onClick={() => navigate("/transactions")}
              className="flex items-center justify-between w-full py-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#22c55e]" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                </div>
                <span className="text-gray-700 text-sm">Historique des récompenses</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
            <button
              data-testid="button-historique-connexion"
              onClick={() => navigate("/transactions")}
              className="flex items-center justify-between w-full py-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#22c55e]" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <span className="text-gray-700 text-sm">Historique des récompenses de connexion</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl px-4 py-4 shadow-sm">
          <div className="mb-3">
            <h2 className="text-gray-900 font-bold text-base">Plus de services</h2>
            <div className="w-10 h-1 bg-[#22c55e] rounded-full mt-1" />
          </div>

          <div className="space-y-2 mb-3">
            <button
              data-testid="button-service-client"
              onClick={() => navigate("/telegram")}
              className="w-full bg-green-50 rounded-xl p-3 flex items-center gap-3 text-left"
            >
              <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center shrink-0 overflow-hidden">
                <Headphones className="w-6 h-6 text-[#22c55e]" />
              </div>
              <div>
                <p className="text-gray-900 font-bold text-sm">Service client en ligne</p>
                <p className="text-gray-500 text-xs leading-relaxed">Les heures du service client en ligne sont de 10h00 à 18h00.</p>
              </div>
            </button>

            <button
              data-testid="button-canal-telegram"
              onClick={() => navigate("/telegram")}
              className="w-full bg-blue-50 rounded-xl p-3 flex items-center gap-3 text-left"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                <SiTelegram className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-900 font-bold text-sm">Canal Telegram</p>
                <p className="text-gray-500 text-xs leading-relaxed">Dernières nouvelles et annonces, nouvelles informations sur les avantages !</p>
              </div>
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            <button
              data-testid="button-niveau-vip"
              onClick={() => navigate("/invest")}
              className="flex items-center justify-between w-full py-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <Diamond className="w-4 h-4 text-[#22c55e]" />
                </div>
                <span className="text-gray-700 text-sm">Niveau VIP</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
            <button
              data-testid="button-centre-aide"
              onClick={() => navigate("/telegram")}
              className="flex items-center justify-between w-full py-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <Headphones className="w-4 h-4 text-[#22c55e]" />
                </div>
                <span className="text-gray-700 text-sm">Centre d'aide</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
            <button
              data-testid="button-parametres"
              onClick={() => navigate("/settings")}
              className="flex items-center justify-between w-full py-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-[#22c55e]" />
                </div>
                <span className="text-gray-700 text-sm">Paramètres</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
            {user.isAdmin && (
              <button
                data-testid="button-admin-panel"
                onClick={() => navigate("/admin")}
                className="flex items-center justify-between w-full py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-blue-600 text-sm font-medium">Administration</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            )}
          </div>
        </div>

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
