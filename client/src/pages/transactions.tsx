import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download } from "lucide-react";
import { useLocation } from "wouter";
import EmptyState from "@/components/empty-state";
import atmIcon from "@assets/icon_2_1774134662224.png";

function downloadReceipt(tx: any, type: "deposit" | "withdrawal") {
  const label = type === "deposit" ? "Dépôt" : "Retrait";
  const sign  = type === "deposit" ? "+" : "-";
  const statusMap: Record<string, string> = {
    pending: "En attente", approved: "Succès", rejected: "Rejeté",
  };
  const content = [
    "========================================",
    `         BON DE ${label.toUpperCase()}`,
    "========================================",
    `Type        : ${label}`,
    `Montant     : ${sign}${tx.amount} FCFA`,
    `Statut      : ${statusMap[tx.status] || tx.status}`,
    `Date        : ${new Date(tx.createdAt).toLocaleString("fr-FR")}`,
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
  a.href = url; a.download = `${label.toLowerCase()}_${tx.id}.txt`; a.click();
  URL.revokeObjectURL(url);
}

export default function TransactionsPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"deposit" | "withdrawal">("withdrawal");

  const { data: transactions = [], isLoading } = useQuery({ queryKey: ["/api/user/transactions"] });
  const filtered = (transactions as any[]).filter((t: any) => t.type === tab);

  const statusMap: Record<string, { label: string; color: string }> = {
    pending:  { label: "En attente", color: "text-amber-500" },
    approved: { label: tab === "deposit" ? "Dépôt réussi" : "Retrait réussi", color: "text-emerald-600" },
    rejected: { label: "Rejeté", color: "text-red-500" },
  };

  const isDeposit = tab === "deposit";

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* Header gold */}
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 pt-10 pb-4">
        <div className="flex items-center gap-3">
          <button data-testid="button-back-transactions" onClick={() => navigate("/account")} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-bold text-lg flex-1 text-center pr-6">Historique de transaction</h1>
        </div>
      </div>

      <div className="px-4 pt-4 pb-10 space-y-3">

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
          {([
            { key: "withdrawal", label: "Retraits" },
            { key: "deposit",    label: "Dépôts"   },
          ] as const).map(t => (
            <button key={t.key} data-testid={`tab-${t.key}`}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                tab === t.key ? "text-black shadow" : "text-gray-400"
              }`}
              style={tab === t.key ? { background: "linear-gradient(135deg, #F59E0B, #D97706)" } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Download all shortcut — only visible if transactions exist */}
        {filtered.length > 0 && (
          <div className="flex justify-end">
            <button data-testid="button-download-all"
              onClick={() => filtered.forEach((tx: any) => downloadReceipt(tx, tab))}
              className="text-black text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
              <Download className="w-3 h-3" />
              Tout télécharger
            </button>
          </div>
        )}

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
              return (
                <div key={tx.id} data-testid={`card-transaction-${tx.id}`}
                  className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm border border-gray-100 border-l-4"
                  style={{ borderLeftColor: isDeposit ? "#10B981" : "#F59E0B" }}>
                  <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                    <img src={atmIcon} alt="atm" className="w-6 h-6 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm">{isDeposit ? "Dépôt" : "Retrait"}</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {new Date(tx.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-sm ${amountColor}`}>{sign}{tx.amount} FCFA</p>
                    <p className={`text-xs mt-0.5 ${st.color}`}>{st.label}</p>
                  </div>
                  <button data-testid={`button-download-${tx.id}`}
                    onClick={() => downloadReceipt(tx, tab)}
                    className="w-9 h-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 ml-1 active:bg-gray-100">
                    <Download className="w-4 h-4 text-gray-400" />
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
