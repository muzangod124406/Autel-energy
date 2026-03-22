import { useState } from "react";
import { useLocation } from "wouter";
import inviteIcon from "@assets/20260322_131635_1774189399662.png";
import produitsIcon from "@assets/20260322_131838_1774186541685.png";
import accueilIcon from "@assets/téléchargement_(37)_1774187714341.png";
import billetIcon from "@assets/bloguer_1774189352527.png";
import compteIcon from "@assets/utilisateur_1774189352602.png";

type Tab = {
  path: string;
  label: string;
  icon?: any;
  imgIcon?: string;
};

const tabs: Tab[] = [
  { path: "/", label: "Accueil", imgIcon: accueilIcon },
  { path: "/invest", label: "Produits", imgIcon: produitsIcon },
  { path: "/invite", label: "Invité", imgIcon: inviteIcon },
  { path: "/billet", label: "Billet", imgIcon: billetIcon },
  { path: "/account", label: "Compte", imgIcon: compteIcon },
];

function NotificationPopup({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-5"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(160deg, #1a3a6e 0%, #0f2040 100%)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Icône megaphone + titre */}
        <div className="flex flex-col items-center pt-7 pb-4 px-5">
          <div className="text-6xl mb-2">📢</div>
          <h2 className="text-[#60a5fa] font-bold text-lg text-center">Dernière annonce</h2>
        </div>

        {/* Corps */}
        <div className="px-5 pb-5 text-[#93c5fd] text-sm leading-relaxed space-y-2">
          <p>
            Bienvenue sur <span className="font-bold text-white">Autel Energy</span>, la plateforme d'investissement mobile pour l'Afrique francophone !
          </p>
          <p>
            Profitez de plans d'investissement fixes à revenus journaliers garantis, d'un système de parrainage multi-niveaux et de récompenses exclusives.
          </p>
          <p className="text-white font-semibold">Rejoignez notre communauté officielle pour rester informé des dernières offres et annonces.</p>
        </div>

        {/* Boutons */}
        <div className="px-5 pb-6 flex flex-col gap-3">
          <button
            data-testid="button-join-channel"
            onClick={() => window.open("https://t.me/autelenergy", "_blank")}
            className="w-full py-3 rounded-xl font-bold text-white text-sm"
            style={{ background: "linear-gradient(90deg, #2563eb, #1d4ed8)" }}
          >
            📣 Rejoindre la chaîne officielle
          </button>
          <button
            data-testid="button-close-notification"
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-[#1e3a6e] text-sm bg-white"
          >
            D'accord
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BottomNav() {
  const [location, navigate] = useLocation();
  const [showNotif, setShowNotif] = useState(false);

  const hideOn = ["/game", "/bank-card", "/service-client"];
  if (hideOn.some(p => location.startsWith(p))) return null;

  const handleTabClick = (path: string) => {
    if (path === "/") {
      setShowNotif(true);
    }
    navigate(path);
  };

  return (
    <>
      {showNotif && <NotificationPopup onClose={() => setShowNotif(false)} />}

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 safe-area-bottom" data-testid="bottom-nav">
        <div className="flex items-center justify-around max-w-lg mx-auto h-20">
          {tabs.map(tab => {
            const isActive = location === tab.path || (tab.path !== "/" && location.startsWith(tab.path));
            const Icon = tab.icon;
            return (
              <button
                key={tab.path}
                data-testid={`nav-${tab.label.toLowerCase()}`}
                onClick={() => handleTabClick(tab.path)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                  isActive ? "text-[#22c55e]" : "text-gray-500"
                }`}
              >
                {tab.imgIcon ? (
                  <img
                    key={isActive ? `${tab.path}-active` : tab.path}
                    src={tab.imgIcon}
                    alt={tab.label}
                    className={`w-9 h-9 object-contain ${isActive ? "opacity-100 animate-tab-pop" : "opacity-40 transition-opacity duration-200"}`}
                  />
                ) : (
                  <Icon
                    key={isActive ? `${tab.path}-active` : tab.path}
                    className={`w-6 h-6 ${isActive ? "animate-tab-pop" : "transition-all duration-200"}`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                )}
                <span className={`text-[10px] ${isActive ? "font-semibold text-[#22c55e]" : "font-medium text-gray-500"}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
