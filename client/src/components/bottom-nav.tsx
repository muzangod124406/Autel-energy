import { useLocation } from "wouter";
import { Home, TrendingUp, Users, Newspaper, User } from "lucide-react";

const tabs = [
  { path: "/", label: "Accueil", icon: Home },
  { path: "/invest", label: "Investir", icon: TrendingUp },
  { path: "/invite", label: "Invité", icon: Users },
  { path: "/billet", label: "Billet", icon: Newspaper },
  { path: "/account", label: "Compte", icon: User },
];

export default function BottomNav() {
  const [location, navigate] = useLocation();

  const hideOn = ["/game", "/bank-card"];
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
                isActive ? "text-blue-600" : "text-gray-500"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
