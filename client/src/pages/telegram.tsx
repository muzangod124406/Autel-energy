import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import headsetIcon from "@assets/icon_3-1_1774133434969.png";
import claraImg from "@assets/561c62c4e80617ebf5313bc562f02542_1774182788114.jpg";
import { SiTelegram } from "react-icons/si";
import EmptyState from "@/components/empty-state";

export default function TelegramPage() {
  const [, navigate] = useLocation();
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });

  const serviceClient1 = settings?.serviceClient1 || "";
  const serviceClient2 = settings?.serviceClient2 || "";
  const telegramGroup = settings?.telegramGroup || "";

  const links = [
    ...(serviceClient1 ? [{ label: "Services en ligne", url: serviceClient1 }] : []),
    ...(serviceClient2 ? [{ label: "Service client 2", url: serviceClient2 }] : []),
    ...(telegramGroup ? [{ label: "Groupe officiel", url: telegramGroup }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header gold */}
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} data-testid="button-back-service" className="text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-bold text-lg">Service client</h1>
        </div>
      </div>

      {/* Hero card */}
      <div className="mx-4 -mt-2 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mt-4">
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <p className="font-extrabold text-gray-900 text-lg leading-tight">Un service en ligne</p>
            <p className="text-gray-500 text-xs mt-1">Bonjour, comment puis-je vous aider!</p>
            <div className="mt-3 px-3 py-1.5 rounded-full text-black text-xs font-bold inline-block" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
              Disponible 24h/7j
            </div>
          </div>
          <img src={headsetIcon} alt="Service client" className="w-20 h-20 object-contain" />
        </div>
      </div>

      {/* Service links */}
      <div className="px-4 mt-4 space-y-3">

        {/* Clara card */}
        <button
          data-testid="button-clara-chat"
          onClick={() => navigate("/service-client")}
          className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-4 shadow-sm border border-gray-100 active:bg-gray-50 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <img src={claraImg} alt="Clara" className="w-11 h-11 rounded-full object-cover" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Clara autel service</p>
              <p className="text-emerald-500 text-xs mt-0.5">En ligne</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-300" />
        </button>

        {links.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`link-service-${i}`}
            className="flex items-center justify-between bg-white rounded-2xl px-4 py-4 shadow-sm border border-gray-100 active:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                <SiTelegram className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                <p className="text-gray-400 text-xs mt-0.5 max-w-[200px] truncate">{item.url}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-300" />
          </a>
        ))}
      </div>
    </div>
  );
}
