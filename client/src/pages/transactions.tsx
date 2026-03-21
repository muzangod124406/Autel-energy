import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCFA } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useLocation } from "wouter";
import EmptyState from "@/components/empty-state";

export default function TransactionsPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"deposit" | "withdrawal">("deposit");

  const { data: transactions = [], isLoading } = useQuery({ queryKey: ["/api/user/transactions"] });

  const filtered = (transactions as any[]).filter((t: any) => t.type === tab);

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
    approved: { label: "Approuvé", color: "bg-green-100 text-green-700" },
    rejected: { label: "Rejeté", color: "bg-red-100 text-red-700" },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 pt-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate("/account")} className="flex items-center gap-2 text-white mb-2" data-testid="button-back-transactions">
            <ArrowLeft className="w-5 h-5" /> Retour
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-2">
        <div className="flex bg-white dark:bg-gray-900 rounded-xl p-1 shadow-sm mb-4">
          <button
            data-testid="tab-deposits"
            onClick={() => setTab("deposit")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              tab === "deposit" ? "bg-white dark:bg-gray-800 shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" /> Dépôts
          </button>
          <button
            data-testid="tab-withdrawals"
            onClick={() => setTab("withdrawal")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              tab === "withdrawal" ? "bg-white dark:bg-gray-800 shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" /> Retraits
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <Card key={i} className="h-20 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState text="Aucune transaction" subtext="Aucun mouvement enregistré pour le moment." />
        ) : (
          <div className="space-y-3">
            {filtered.map((tx: any) => {
              const st = statusLabels[tx.status] || statusLabels.pending;
              return (
                <Card key={tx.id} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tab === "deposit" ? "bg-green-100" : "bg-orange-100"}`}>
                        {tab === "deposit" ? <ArrowUpCircle className="w-5 h-5 text-green-600" /> : <ArrowDownCircle className="w-5 h-5 text-orange-600" />}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${tab === "deposit" ? "text-green-600" : "text-orange-600"}`}>
                          {tab === "deposit" ? "+" : "-"}{formatCFA(tx.amount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{tx.paymentMethod}</p>
                      </div>
                    </div>
                    <Badge className={`text-[10px] ${st.color} border-0`}>{st.label}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-2 text-[10px] text-muted-foreground">
                    <span>{new Date(tx.createdAt).toLocaleString("fr-FR")}</span>
                    <span>{tx.phoneNumber}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
