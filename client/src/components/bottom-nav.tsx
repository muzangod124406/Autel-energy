import { useLocation } from "wouter";
import { Users } from "lucide-react"; 
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
  { path: "/invite", label: "Invité", icon: Users },
  { path: "/billet", label: "Billet", imgIcon: billetIcon },
  { path: "/account", label: "Compte", imgIcon: compteIcon },
];

export default function BottomNav() {
  const [location, navigate] = useLocation();

  const hideOn = ["/game", "/bank-card", "/service-client"];
  if (hideOn.some(p => location.startsWith(p))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 safe-area-bottom" data-testid="bottom-nav">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {tabs.map(tab => {
          const isActive = location === tab.path || (tab.path !== "/" && location.startsWith(tab.path));
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              data-testid={`nav-${tab.label.toLowerCase()}`}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? "text-[#22c55e]" : "text-gray-500"
              }`}
            >
              {tab.imgIcon ? (
                <img
                  src={tab.imgIcon}
                  alt={tab.label}
                  className={`w-5 h-5 object-contain ${isActive ? "opacity-100" : "opacity-40"}`}
                />
              ) : (
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              )}
              <span className={`text-[10px] ${isActive ? "font-semibold text-[#22c55e]" : "font-medium"}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
