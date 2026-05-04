import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import EmptyState from "@/components/empty-state";

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

const STATUS_CONFIG: Record<string, { label: string; icon: any; bg: string; text: string; border: string }> = {
  pending:  { label: "En attente", icon: Clock,         bg: "bg-amber-50",   text: "text-amber-600", border: "border-amber-200" },
  approved: { label: "Succès",     icon: CheckCircle2,  bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  rejected: { label: "Rejeté",     icon: XCircle,       bg: "bg-red-50",     text: "text-red-500", border: "border-red-200" },
};

export default function TransactionsPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"deposit" | "withdrawal">("withdrawal");

  const { data: transactions = [], isLoading } = useQuery({ queryKey: ["/api/user/transactions"] });
  const allTx = transactions as any[];
  const filtered = allTx.filter((t: any) => t.type === tab);

  const totalApproved = filtered
    .filter((t: any) => t.status === "approved")
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const isDeposit = tab === "deposit";

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-5">
          <button data-testid="button-back-transactions" onClick={() => navigate("/account")}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white font-extrabold text-lg flex-1 text-center pr-9">Historique</h1>
        </div>

        {/* Summary pill */}
        <div className="bg-white/15 border border-white/25 rounded-2xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white/70 text-xs font-medium">Total validé</p>
            <p className="text-white font-extrabold text-2xl mt-0.5">
              {totalApproved.toLocaleString("fr-FR")} <span className="text-sm font-semibold">FCFA</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            {isDeposit
              ? <ArrowDownCircle className="w-6 h-6 text-white" />
              : <ArrowUpCircle className="w-6 h-6 text-white" />}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 pb-10 space-y-3">

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
          {([
            { key: "withdrawal", label: "Retraits",  icon: ArrowUpCircle },
            { key: "deposit",    label: "Dépôts",    icon: ArrowDownCircle },
          ] as const).map(t => (
            <button key={t.key} data-testid={`tab-${t.key}`}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                tab === t.key ? "text-black shadow" : "text-gray-400"
              }`}
              style={tab === t.key ? { background: "linear-gradient(135deg, #F59E0B, #D97706)" } : {}}>
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Download all — only visible if transactions exist */}
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
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState text="Aucune transaction" subtext="Aucun mouvement enregistré pour le moment." />
        ) : (
          <div className="space-y-3">
            {filtered.map((tx: any) => {
              const st = STATUS_CONFIG[tx.status] || STATUS_CONFIG.pending;
              const StatusIcon = st.icon;
              const amountColor = isDeposit ? "text-emerald-600" : "text-red-500";
              const amountBg = isDeposit ? "bg-emerald-50" : "bg-red-50";
              const sign = isDeposit ? "+" : "-";
              return (
                <div key={tx.id} data-testid={`card-transaction-${tx.id}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">

                  {/* Top stripe */}
                  <div className="h-1 w-full" style={{
                    background: isDeposit
                      ? "linear-gradient(90deg, #10B981, #059669)"
                      : "linear-gradient(90deg, #F59E0B, #D97706)"
                  }} />

                  <div className="px-4 py-3 flex items-center gap-3">
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-2xl ${amountBg} flex items-center justify-center shrink-0`}>
                      {isDeposit
                        ? <ArrowDownCircle className="w-5 h-5 text-emerald-600" />
                        : <ArrowUpCircle className="w-5 h-5 text-amber-500" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-gray-800 text-sm">{isDeposit ? "Dépôt" : "Retrait"}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
                          <StatusIcon className="w-2.5 h-2.5" />
                          {st.label}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs">{new Date(tx.createdAt).toLocaleString("fr-FR")}</p>
                      {tx.paymentMethod && (
                        <p className="text-gray-500 text-xs mt-0.5 font-medium">{tx.paymentMethod}</p>
                      )}
                    </div>

                    {/* Amount + Download */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <p className={`font-extrabold text-base ${amountColor}`}>
                        {sign}{tx.amount.toLocaleString("fr-FR")}
                        <span className="text-xs font-semibold ml-0.5">F</span>
                      </p>
                      <button data-testid={`button-download-${tx.id}`}
                        onClick={() => downloadReceipt(tx, tab)}
                        className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center active:bg-gray-100">
                        <Download className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
