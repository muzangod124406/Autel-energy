import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, MessageCircle, Phone, Globe } from "lucide-react";
import { useLocation } from "wouter";
import claraImg from "@assets/MV5BNmNkNmUyNjYtY2VhYi00ZjE4LWI0NmMtNmJkZDc2NzEyMzgxXkEyXkFqcG_1777886048395.jpg";
import headsetIcon from "@assets/icon_3-1_1774133434969.png";

export default function TelegramPage() {
  const [, navigate] = useLocation();
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });

  const serviceClient1 = settings?.serviceClient1 || "";
  const serviceClient2 = settings?.serviceClient2 || "";
  const telegramGroup  = settings?.telegramGroup  || "";

  const externalLinks = [
    ...(serviceClient1 ? [{ label: "Service en ligne 1",  url: serviceClient1, Icon: MessageCircle, color: "text-amber-500",  bg: "bg-amber-50" }]  : []),
    ...(serviceClient2 ? [{ label: "Service en ligne 2",  url: serviceClient2, Icon: Phone,         color: "text-emerald-600",bg: "bg-emerald-50" }] : []),
    ...(telegramGroup  ? [{ label: "Groupe officiel",     url: telegramGroup,  Icon: Globe,         color: "text-blue-500",   bg: "bg-blue-50" }]   : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header gold */}
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate("/account")} data-testid="button-back-service" className="text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-bold text-xl">DEEN SINOPEC</h1>
        </div>

        {/* Hero info */}
        <div className="bg-white/15 rounded-2xl px-4 py-4 border border-white/25 flex items-center gap-4">
          <img src={headsetIcon} alt="Support" className="w-16 h-16 object-contain" />
          <div>
            <p className="text-white font-bold text-lg">Support DEEN SINOPEC</p>
            <p className="text-white/75 text-xs mt-0.5">Assistance disponible 24h/7j</p>
            <div className="mt-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/80 text-xs font-medium">En ligne</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-3">

        {/* Chat direct avec Clara */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Assistance directe</p>
          </div>
          <button
            data-testid="button-clara-chat"
            onClick={() => navigate("/service-client")}
            className="w-full flex items-center justify-between px-4 py-4 active:bg-gray-50 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <img src={claraImg} alt="DEEN" className="w-12 h-12 rounded-full object-cover border-2 border-amber-100" />
                <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Clara — DEEN SINOPEC</p>
                <p className="text-emerald-500 text-xs mt-0.5 font-medium">En ligne · Répond rapidement</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-black text-xs font-bold px-3 py-2 rounded-xl"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
              <MessageCircle className="w-3.5 h-3.5" />
              Chat
            </div>
          </button>
        </div>

        {/* Liens externes */}
        {externalLinks.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Autres canaux</p>
            </div>
            <div className="divide-y divide-gray-50">
              {externalLinks.map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`link-service-${i}`}
                  className="flex items-center justify-between px-4 py-4 active:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                      <item.Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                      <p className="text-gray-400 text-xs mt-0.5 max-w-[200px] truncate">{item.url}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Info card */}
        <div className="bg-amber-50 rounded-2xl px-4 py-4 border border-amber-100">
          <p className="text-amber-800 font-bold text-sm mb-1">DEEN SINOPEC</p>
          <p className="text-amber-700 text-xs leading-relaxed">
            Notre équipe de support est disponible pour vous aider avec vos dépôts, retraits, commandes et toutes questions relatives à votre compte.
          </p>
        </div>

      </div>
    </div>
  );
}
