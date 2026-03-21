import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import type { Transaction } from "@shared/schema";

export default function DepositHistoryPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/user/transactions"],
  });

  const deposits = transactions.filter(t => t.type === "deposit");

  const statusLabel = (status: string) => {
    if (status === "approved") return { text: "Approuvé", color: "text-green-600" };
    if (status === "rejected") return { text: "Rejeté", color: "text-red-500" };
    return { text: "En cours", color: "text-orange-500" };
  };

  const formatDate = (d: string | Date) => {
    const date = new Date(d);
    return date.toISOString().replace("T", " ").slice(0, 19);
  };

  return (
    <div className="min-h-screen bg-[#f0f0e4]">
      <div className="bg-[#22c55e] px-4 pt-5 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/deposit")} data-testid="button-back-history">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white font-bold text-lg">Historique des recharges</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-gray-900 font-bold text-lg">FCFA{(user?.depositBalance || 0).toFixed(2)}</p>
          <p className="text-gray-500 text-sm">Solde de recharge</p>
        </div>

        {deposits.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <p className="text-gray-400 text-sm">Aucun historique de recharge</p>
          </div>
        ) : (
          deposits.map(tx => {
            const s = statusLabel(tx.status);
            return (
              <div key={tx.id} className="bg-white rounded-2xl p-4 shadow-sm space-y-3" data-testid={`deposit-tx-${tx.id}`}>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Statut de recharge</span>
                  <span className={`text-sm font-semibold ${s.color}`}>{s.text}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Montant de recharge</span>
                  <span className="text-gray-900 font-bold text-sm">FCFA{tx.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Montant reçu</span>
                  <span className="text-gray-900 font-bold text-sm">FCFA{(tx.netAmount ?? tx.amount).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Montant de la taxe</span>
                  <span className="text-gray-900 font-bold text-sm">FCFA {(tx.fees ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500 text-sm">Heure d'initiation</span>
                  <span className="text-gray-900 font-bold text-sm">{formatDate(tx.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
