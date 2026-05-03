import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Home, TrendingUp, Users, FileText, CircleUser } from "lucide-react";

type Tab = { path: string; label: string; Icon: any; };

const tabs: Tab[] = [
  { path: "/",       label: "Accueil",  Icon: Home },
  { path: "/invest", label: "Produits", Icon: TrendingUp },
  { path: "/invite", label: "Invité",   Icon: Users },
  { path: "/billet", label: "Billet",   Icon: FileText },
  { path: "/account",label: "Compte",   Icon: CircleUser },
];

function NotificationPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-5"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-amber-500/20"
        style={{ background: "linear-gradient(160deg, #14142A 0%, #1a1a32 100%)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex flex-col items-center pt-8 pb-4 px-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <span className="text-3xl">📢</span>
          </div>
          <h2 className="text-amber-400 font-bold text-lg text-center">Dernière annonce</h2>
        </div>
        <div className="px-5 pb-5 text-[#a0a0b8] text-sm leading-relaxed space-y-3">
          <p>
            Bienvenue sur <span className="font-bold text-white">SINOPEC</span>, la plateforme d'investissement mobile pour l'Afrique francophone !
          </p>
          <p>
            Profitez de plans d'investissement fixes à revenus journaliers garantis, d'un système de parrainage multi-niveaux et de récompenses exclusives.
          </p>
          <p className="text-amber-400/80 font-medium">Rejoignez notre communauté officielle pour rester informé.</p>
        </div>
        <div className="px-5 pb-6 flex flex-col gap-3">
          <button
            data-testid="button-join-channel"
            onClick={() => window.open("https://t.me/sinopecgroup", "_blank")}
            className="w-full py-3.5 rounded-2xl font-bold text-black text-sm"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
            📣 Rejoindre la chaîne officielle
          </button>
          <button
            data-testid="button-close-notification"
            onClick={onClose}
            className="w-full py-3 rounded-2xl font-semibold text-[#888899] text-sm border border-[#252538] bg-transparent">
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

  useEffect(() => { if (location === "/") setShowNotif(true); }, []);

  const hideOn = ["/game", "/bank-card", "/service-client"];
  if (hideOn.some(p => location.startsWith(p))) return null;

  const handleTabClick = (path: string) => {
    if (path === "/") setShowNotif(true);
    navigate(path);
  };

  return (
    <>
      {showNotif && <NotificationPopup onClose={() => setShowNotif(false)} />}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t"
        data-testid="bottom-nav"
        style={{
          background: "linear-gradient(180deg, rgba(14,14,26,0.95) 0%, rgba(11,11,20,0.98) 100%)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(37,37,56,0.8)",
        }}>
        <div className="flex items-center justify-around max-w-lg mx-auto h-20 px-2">
          {tabs.map(tab => {
            const isActive = location === tab.path || (tab.path !== "/" && location.startsWith(tab.path));
            const { Icon } = tab;
            return (
              <button
                key={tab.path}
                data-testid={`nav-${tab.label.toLowerCase()}`}
                onClick={() => handleTabClick(tab.path)}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all"
              >
                <div className={`relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all ${
                  isActive ? "bg-amber-500/15" : ""
                }`}>
                  <Icon
                    className={`w-5 h-5 transition-all ${isActive ? "text-amber-500 animate-tab-pop" : "text-[#555570]"}`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500" />
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-amber-500" : "text-[#555570]"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
