import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { House, Package2, UserPlus, Ticket, UserCircle2 } from "lucide-react";

type Tab = { path: string; label: string; Icon: any; };

const tabs: Tab[] = [
  { path: "/",       label: "Accueil",  Icon: House },
  { path: "/invest", label: "Produits", Icon: Package2 },
  { path: "/invite", label: "Invité",   Icon: UserPlus },
  { path: "/billet", label: "Billet",   Icon: Ticket },
  { path: "/account",label: "Compte",   Icon: UserCircle2 },
];

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5 fill-white flex-shrink-0" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function NotificationPopup({ onClose, link }: { onClose: () => void; link: string }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl bg-white"
        style={{ animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header navy */}
        <div className="flex flex-col items-center px-5 pt-5 pb-4" style={{ background: "linear-gradient(160deg, #1A1A2E 0%, #16213E 100%)" }}>
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-lg mb-2">
            <img src="/sinopec-logo.jpeg" alt="SINOPEC" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-white font-extrabold text-base text-center">SINOPEC</h2>
          <p className="text-amber-400 text-[10px] font-semibold uppercase tracking-widest mt-0.5">Plateforme d'Investissement</p>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <div className="bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
            <p className="text-amber-800 font-bold text-xs mb-0.5">Bienvenue sur SINOPEC 👋</p>
            <p className="text-amber-700 text-[11px] leading-relaxed">
              Revenus journaliers garantis · Parrainage multi-niveaux · Support 24h/7j
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { value: "20%",   label: "Commission" },
              { value: "120J",  label: "Plan fixe" },
              { value: "24h/7", label: "Support" },
            ].map((s, i) => (
              <div key={i} className="bg-gray-50 rounded-xl py-2 text-center border border-gray-100">
                <p className="text-amber-500 font-extrabold text-sm">{s.value}</p>
                <p className="text-gray-400 text-[9px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="px-5 pb-5 flex flex-col gap-2">
          <button
            data-testid="button-join-channel"
            onClick={() => window.open(link || "https://whatsapp.com/channel/0029VbCPaD2IiRokvjSXNN2p", "_blank")}
            className="w-full py-3 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}
          >
            <WhatsAppIcon />
            Rejoindre WhatsApp
          </button>
          <button
            data-testid="button-close-notification"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl font-semibold text-gray-400 text-xs border border-gray-100 bg-gray-50"
          >
            Plus tard
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.85); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function BottomNav() {
  const [location, navigate] = useLocation();
  const [showNotif, setShowNotif] = useState(false);
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });
  const popupLink = (settings as any)?.popupLink || "https://whatsapp.com/channel/0029VbCPaD2IiRokvjSXNN2p";

  useEffect(() => { if (location === "/") setShowNotif(true); }, []);

  const hideOn = ["/game", "/bank-card", "/service-client"];
  if (hideOn.some(p => location.startsWith(p))) return null;

  const handleTabClick = (path: string) => {
    if (path === "/") setShowNotif(true);
    navigate(path);
  };

  return (
    <>
      {showNotif && <NotificationPopup onClose={() => setShowNotif(false)} link={popupLink} />}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white"
        data-testid="bottom-nav"
        style={{ backdropFilter: "blur(16px)" }}>
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
                  isActive ? "bg-amber-500/10" : ""
                }`}>
                  <Icon
                    className={`w-5 h-5 transition-all ${isActive ? "text-amber-500 animate-tab-pop" : "text-gray-400"}`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500" />
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-amber-500" : "text-gray-400"}`}>
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
