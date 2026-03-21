import { useQuery } from "@tanstack/react-query";
import { formatCFA } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingBag, Clock, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import EmptyState from "@/components/empty-state";

export default function OrdersPage() {
  const [, navigate] = useLocation();
  const { data: investments = [], isLoading } = useQuery({ queryKey: ["/api/user/investments"] });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 pt-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate("/account")} className="flex items-center gap-2 text-white mb-2" data-testid="button-back-orders">
            <ArrowLeft className="w-5 h-5" /> Retour
          </button>
          <h1 className="text-white text-xl font-bold">Mes Commandes</h1>
          <p className="text-white/70 text-sm mt-1">Historique de vos investissements</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded" />
              </Card>
            ))}
          </div>
        ) : investments.length === 0 ? (
          <EmptyState text="Aucune commande" subtext="Vous n'avez pas encore souscrit à un produit." />
        ) : (
          (investments as any[]).map((inv: any) => {
            const daysLeft = Math.max(0, Math.ceil((new Date(inv.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            const isCompleted = inv.status === "completed" || daysLeft === 0;
            return (
              <Card key={inv.id} className="p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">VIP {inv.vipLevel} {inv.planType}</h3>
                      <p className="text-[10px] text-muted-foreground">{new Date(inv.startDate).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                  <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-green-500 text-white" : "bg-blue-100 text-blue-700"}>
                    {isCompleted ? "Terminé" : "En cours"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Montant investi</p>
                    <p className="text-sm font-bold text-blue-600">{formatCFA(inv.amount)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Gain total</p>
                    <p className="text-sm font-bold text-green-600">{formatCFA(inv.totalGain)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Fin: {new Date(inv.endDate).toLocaleDateString("fr-FR")}</span>
                  <span className="flex items-center gap-1 text-blue-600"><Clock className="w-3 h-3" /> {daysLeft} jours restants</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <span>Gain journalier: {formatCFA(inv.dailyGain)}</span>
                </p>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
