import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import EmptyState from "@/components/empty-state";
import type { Transaction } from "@shared/schema";

export default function DepositHistoryPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/user/transactions"],
  });

  const deposits = transactions.filter(t => t.type === "deposit");

  const statusLabel = (status: string) => {
    if (status === "approved") return { text: "Approuvé", color: "text-emerald-600" };
    if (status === "rejected") return { text: "Rejeté", color: "text-red-500" };
    return { text: "En cours", color: "text-amber-500" };
  };

  const formatDate = (d: string | Date) => {
    const date = new Date(d);
    return date.toISOString().replace("T", " ").slice(0, 19);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* Header gold */}
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/deposit")} data-testid="button-back-history" className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-bold text-lg">Historique des recharges</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">

        {/* Balance card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs mb-1">Solde de recharge</p>
          <p className="text-gray-900 font-bold text-2xl">FCFA {(user?.depositBalance || 0).toFixed(2)}</p>
        </div>

        {deposits.length === 0 ? (
          <EmptyState text="Aucun historique" subtext="Vous n'avez pas encore effectué de recharge." />
        ) : (
          deposits.map(tx => {
            const s = statusLabel(tx.status);
            return (
              <div key={tx.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-0"
                data-testid={`deposit-tx-${tx.id}`}>
                {[
                  { label: "Statut de recharge", value: <span className={`font-semibold ${s.color}`}>{s.text}</span> },
                  { label: "Montant de recharge", value: `FCFA ${tx.amount.toFixed(2)}` },
                  { label: "Montant reçu", value: `FCFA ${(tx.netAmount ?? tx.amount).toFixed(2)}` },
                  { label: "Montant de la taxe", value: `FCFA ${(tx.fees ?? 0).toFixed(2)}` },
                  { label: "Heure d'initiation", value: formatDate(tx.createdAt) },
                ].map((row, i, arr) => (
                  <div key={i} className={`flex items-center justify-between py-2.5 ${i < arr.length - 1 ? "border-b border-gray-50" : ""}`}>
                    <span className="text-gray-500 text-sm">{row.label}</span>
                    {typeof row.value === "string"
                      ? <span className="text-gray-900 font-bold text-sm">{row.value}</span>
                      : row.value}
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
