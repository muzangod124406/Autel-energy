import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

const TABS = [
  { label: "Niveau 1", key: "level1" },
  { label: "Niveau 2", key: "level2" },
  { label: "Niveau 3", key: "level3" },
];

export default function TeamDetailsPage() {
  const [location, navigate] = useLocation();

  const params = new URLSearchParams(location.split("?")[1] || "");
  const initialLevel = Math.max(0, parseInt(params.get("level") || "1") - 1);
  const [activeTab, setActiveTab] = useState(initialLevel);

  const { data: referrals, isLoading } = useQuery<any>({ queryKey: ["/api/user/referrals"] });

  const currentKey = TABS[activeTab]?.key || "level1";
  const members: any[] = referrals?.[currentKey] || [];

  const totalMembers = members.length;
  const totalInvested = members.reduce((acc: number, m: any) => acc + (m.totalInvested || 0), 0);

  const formatPhone = (phone: string) => {
    if (!phone) return "******????";
    const digits = phone.replace(/\D/g, "");
    return `******${digits.slice(-4)}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* Header gold */}
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 pt-10 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/invite")} data-testid="button-back-team-details" className="text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-center text-white font-bold text-lg pr-8">Historique d'équipe</h1>
        </div>

        {/* Tabs dans le header */}
        <div className="flex bg-white/20 rounded-xl p-1 mb-0">
          {TABS.map((tab, i) => (
            <button
              key={i}
              data-testid={`tab-level-${i + 1}`}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === i ? "bg-white text-amber-600 shadow" : "text-white/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex px-4 py-4 gap-3">
        <div className="flex-1 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-400 text-xs mb-1">Membres</p>
          <p className="text-gray-900 font-extrabold text-2xl">{totalMembers}</p>
        </div>
        <div className="flex-1 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-400 text-xs mb-1">Dépôts équipe</p>
          <p className="text-amber-500 font-extrabold text-lg">
            {totalInvested.toLocaleString("fr-FR")} FCFA
          </p>
        </div>
      </div>

      {/* Members list */}
      <div className="px-4 space-y-3">
        {isLoading && (
          <div className="text-center py-10 text-gray-400 text-sm">Chargement...</div>
        )}

        {!isLoading && members.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">Aucun membre à ce niveau</div>
        )}

        {members.map((m: any, i: number) => (
          <div key={i} className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-3 animate-card-in"
            style={{ animationDelay: `${i * 0.05}s` }}
            data-testid={`member-card-${i}`}>
            <div className="w-11 h-11 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center shrink-0">
              <span className="text-amber-500 font-bold text-base">
                {(m.referred?.phone || m.phone || "U")[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-700 text-sm font-medium">
                Compte : {formatPhone(m.referred?.phone || "")}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                Date : {formatDate(m.referred?.createdAt || m.createdAt)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-gray-800 font-bold text-sm">
                {(m.totalInvested || 0).toLocaleString("fr-FR")} FCFA
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
