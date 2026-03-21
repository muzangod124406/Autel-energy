import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import headsetIcon from "@assets/icon_3-1_1774133434969.png";
import redirectIcon from "@assets/17496245_1774133420846.png";
import { SiWhatsapp } from "react-icons/si";

export default function TelegramPage() {
  const [, navigate] = useLocation();
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });

  const serviceClient1 = settings?.serviceClient1 || "";
  const serviceClient2 = settings?.serviceClient2 || "";
  const telegramGroup = settings?.telegramGroup || "";
  const telegramService = settings?.telegramService || "";

  const links = [
    ...(serviceClient1 ? [{ label: "Services en ligne", url: serviceClient1 }] : []),
    ...(serviceClient2 ? [{ label: "Service client 2", url: serviceClient2 }] : []),
    ...(telegramGroup ? [{ label: "Groupe officiel", url: telegramGroup }] : []),
    ...(telegramService && telegramService.startsWith("http")
      ? [{ label: "Service Telegram", url: telegramService }]
      : telegramService
      ? [{ label: "Service Telegram", url: `https://t.me/${telegramService.replace("@", "")}` }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Green header */}
      <div className="bg-[#22c55e] px-4 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} data-testid="button-back-service">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white font-bold text-lg">Service client</h1>
        </div>
      </div>

      {/* Hero section */}
      <div className="relative bg-white mx-4 mt-4 rounded-2xl overflow-hidden shadow-sm">
        {/* Green blob top-left */}
        <div
          className="absolute top-0 left-0 w-44 h-28 bg-[#22c55e] rounded-br-[80px]"
        />
        <div className="relative flex items-center justify-between px-5 pt-5 pb-6">
          <div className="z-10">
            <p className="font-extrabold text-gray-900 text-lg leading-tight">Un service en ligne</p>
            <p className="text-gray-500 text-xs mt-1">Bonjour, comment puis-je vous aider!</p>
          </div>
          <img
            src={headsetIcon}
            alt="Service client"
            className="w-20 h-20 object-contain z-10"
          />
        </div>
      </div>

      {/* Service links */}
      <div className="px-4 mt-4 space-y-3">
        {links.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center text-gray-400 text-sm shadow-sm">
            Aucun lien de service configuré
          </div>
        ) : (
          links.map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`link-service-${i}`}
              className="flex items-center justify-between bg-white rounded-2xl px-4 py-4 shadow-sm active:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#22c55e] flex items-center justify-center flex-shrink-0">
                  <SiWhatsapp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                  <p className="text-gray-400 text-xs mt-0.5 max-w-[200px] truncate">{item.url}</p>
                </div>
              </div>
              <img
                src={redirectIcon}
                alt="Ouvrir"
                className="w-6 h-6 object-contain"
                style={{ mixBlendMode: "multiply" }}
              />
            </a>
          ))
        )}
      </div>
    </div>
  );
}
