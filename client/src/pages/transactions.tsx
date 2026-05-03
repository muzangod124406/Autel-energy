import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import EmptyState from "@/components/empty-state";
import atmIcon from "@assets/icon_2_1774134662224.png";
import downloadIcon from "@assets/telecharger_1774135111449.png";

function downloadReceipt(tx: any, type: "deposit" | "withdrawal") {
  const label = type === "deposit" ? "Dépôt" : "Retrait";
  const sign = type === "deposit" ? "+" : "-";
  const statusMap: Record<string, string> = {
    pending: "En attente",
    approved: "Succès",
    rejected: "Rejeté",
  };
  const dateStr = new Date(tx.createdAt).toLocaleString("fr-FR");
  const content = [
    "========================================",
    `         BON DE ${label.toUpperCase()}`,
    "========================================",
    `Type        : ${label}`,
    `Montant     : ${sign}${tx.amount} FCFA`,
    `Statut      : ${statusMap[tx.status] || tx.status}`,
    `Date        : ${dateStr}`,
    `Méthode     : ${tx.paymentMethod || "-"}`,
    `Téléphone   : ${tx.phoneNumber || "-"}`,
    `Réf.        : ${tx.id}`,
    "========================================",
    "      Merci de votre confiance",
    "========================================",
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${label.toLowerCase()}_${tx.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TransactionsPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"deposit" | "withdrawal">("withdrawal");

  const { data: transactions = [], isLoading } = useQuery({ queryKey: ["/api/user/transactions"] });
  const filtered = (transactions as any[]).filter((t: any) => t.type === tab);

  const statusMap: Record<string, { label: string; color: string }> = {
    pending:  { label: "En attente",       color: "text-yellow-500" },
    approved: { label: tab === "deposit" ? "Succès du dépôt" : "Succès du retrait", color: "text-emerald-600" },
    rejected: { label: "Rejeté",           color: "text-red-500" },
  };

  const isDeposit = tab === "deposit";
  const title = isDeposit ? "Ordre de dépôt" : "Ordre de retrait";
  const bannerText = isDeposit
    ? "Téléchargez le bon de dépôt pour partager la joie avec tout le monde"
    : "Téléchargez le bon de retrait pour partager la joie avec tout le monde";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header gold */}
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 pt-10 pb-4">
        <div className="flex items-center gap-3">
          <button data-testid="button-back-transactions" onClick={() => navigate("/account")} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-bold text-lg flex-1 text-center pr-6">{title}</h1>
        </div>
      </div>

      <div className="px-4 pt-4 pb-24 space-y-3">

        {/* Onglets */}
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
          <button
            data-testid="tab-withdrawals"
            onClick={() => setTab("withdrawal")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              tab === "withdrawal" ? "text-black shadow" : "text-gray-400"
            }`}
            style={tab === "withdrawal" ? { background: "linear-gradient(135deg, #F59E0B, #D97706)" } : {}}
          >
            Retraits
          </button>
          <button
            data-testid="tab-deposits"
            onClick={() => setTab("deposit")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              tab === "deposit" ? "text-black shadow" : "text-gray-400"
            }`}
            style={tab === "deposit" ? { background: "linear-gradient(135deg, #F59E0B, #D97706)" } : {}}
          >
            Dépôts
          </button>
        </div>

        {/* Banner */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <img src={atmIcon} alt="atm" className="w-7 h-7 object-contain" />
          </div>
          <p className="text-amber-700 font-semibold text-xs flex-1 leading-snug">{bannerText}</p>
          {filtered.length > 0 && (
            <button
              data-testid="button-download-all"
              onClick={() => filtered.forEach((tx: any) => downloadReceipt(tx, tab))}
              className="text-black text-xs font-bold px-3 py-1.5 rounded-full shrink-0"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
            >
              Tout télécharger
            </button>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState text="Aucune transaction" subtext="Aucun mouvement enregistré pour le moment." />
        ) : (
          <div className="space-y-3">
            {filtered.map((tx: any) => {
              const st = statusMap[tx.status] || statusMap.pending;
              const amountColor = isDeposit ? "text-emerald-600" : "text-red-500";
              const sign = isDeposit ? "+" : "-";
              const dateStr = new Date(tx.createdAt).toLocaleString("fr-FR");

              return (
                <div
                  key={tx.id}
                  data-testid={`card-transaction-${tx.id}`}
                  className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm border-l-4 border-amber-400"
                >
                  <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <img src={atmIcon} alt="atm" className="w-7 h-7 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm">{isDeposit ? "Déposer" : "Retirer"}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{dateStr}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-sm ${amountColor}`}>{sign}{tx.amount}FCFA</p>
                    <p className={`text-xs mt-0.5 ${st.color}`}>{st.label}</p>
                  </div>
                  <button
                    data-testid={`button-download-${tx.id}`}
                    onClick={() => downloadReceipt(tx, tab)}
                    className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center shrink-0 ml-1"
                  >
                    <img src={downloadIcon} alt="télécharger" className="w-5 h-5 object-contain" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
