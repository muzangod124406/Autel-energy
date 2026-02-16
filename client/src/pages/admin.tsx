import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { formatCFA, COUNTRIES, INVESTMENT_PLANS } from "@/lib/constants";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, TrendingUp, Download, ArrowLeft, Search, Ban,
  Check, X, DollarSign, Settings, Shield, Eye, Trash2, Plus
} from "lucide-react";
import { useLocation } from "wouter";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editBalance, setEditBalance] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [assignPlan, setAssignPlan] = useState("");

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 font-bold">Accès refusé</p>
      </div>
    );
  }

  const { data: stats } = useQuery({ queryKey: ["/api/admin/stats"] });
  const { data: allUsers = [] } = useQuery({ queryKey: ["/api/admin/users"] });
  const { data: pendingDeposits = [] } = useQuery({ queryKey: ["/api/admin/transactions", "deposit"] });
  const { data: pendingWithdrawals = [] } = useQuery({ queryKey: ["/api/admin/transactions", "withdrawal"] });
  const { data: pendingTickets = [] } = useQuery({ queryKey: ["/api/admin/tickets"] });
  const { data: settingsData } = useQuery({ queryKey: ["/api/settings"] });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Mis à jour" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(null);
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, ""), variant: "destructive" })
  });

  const updateTxMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PUT", `/api/admin/transactions/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Transaction mise à jour" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
    }
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, status, bonus }: { id: string; status: string; bonus?: number }) => {
      const res = await apiRequest("PUT", `/api/admin/tickets/${id}`, { status, bonus });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Billet mis à jour" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/admin/settings", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Paramètres mis à jour" });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    }
  });

  const assignProductMutation = useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: any }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/assign-product`, plan);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Produit attribué" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    }
  });

  const deleteInvestmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/investments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Produit supprimé" });
    }
  });

  const filteredUsers = (allUsers as any[]).filter((u: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!u.phone?.toLowerCase().includes(q) && !u.referralCode?.toLowerCase().includes(q)) return false;
    }
    if (filterType === "banned") return u.isBanned;
    if (filterType === "blocked") return u.withdrawBlocked;
    if (filterType === "promoter") return u.isPromoter;
    return true;
  });

  const tabs = [
    { key: "dashboard", label: "Stats" },
    { key: "deposits", label: `Dépôts (${(pendingDeposits as any[]).length})` },
    { key: "withdrawals", label: `Retraits (${(pendingWithdrawals as any[]).length})` },
    { key: "users", label: "Utilisateurs" },
    { key: "tickets", label: `Billets (${(pendingTickets as any[]).length})` },
    { key: "settings", label: "Paramètres" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 pt-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white mb-2" data-testid="button-back-admin">
            <ArrowLeft className="w-5 h-5" /> Retour
          </button>
          <h1 className="text-white text-xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" /> Administration
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-4">
        <div className="flex gap-1 overflow-x-auto bg-white dark:bg-gray-900 rounded-xl p-1 shadow-sm mb-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              data-testid={`admin-tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === tab.key ? "bg-gray-800 text-white" : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Utilisateurs total", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-600" },
              { label: "Inscrits aujourd'hui", value: stats?.todayRegistrations || 0, icon: Users, color: "text-green-600" },
              { label: "Dépôts aujourd'hui", value: stats?.todayDeposits || 0, icon: TrendingUp, color: "text-purple-600" },
              { label: "Retraits aujourd'hui", value: stats?.todayWithdrawals || 0, icon: Download, color: "text-orange-600" },
              { label: "Total dépôts", value: formatCFA(stats?.totalDeposits || 0), icon: DollarSign, color: "text-emerald-600" },
              { label: "Investissements actifs", value: stats?.activeInvestments || 0, icon: TrendingUp, color: "text-cyan-600" },
            ].map(item => (
              <Card key={item.label} className="p-3">
                <item.icon className={`w-6 h-6 ${item.color} mb-2`} />
                <p className="text-lg font-bold">{item.value}</p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "deposits" && (
          <div className="space-y-3">
            {(pendingDeposits as any[]).length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground text-sm">Aucun dépôt en attente</Card>
            ) : (
              (pendingDeposits as any[]).map((tx: any) => (
                <Card key={tx.id} className="p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div><span className="text-muted-foreground text-xs">Numéro:</span> <span className="font-medium">{tx.phoneNumber}</span></div>
                    <div><span className="text-muted-foreground text-xs">Nom:</span> <span className="font-medium">{tx.accountName || "-"}</span></div>
                    <div><span className="text-muted-foreground text-xs">Moyen:</span> <span className="font-medium">{tx.paymentMethod}</span></div>
                    <div><span className="text-muted-foreground text-xs">Pays:</span> <span className="font-medium">{tx.country}</span></div>
                    <div><span className="text-muted-foreground text-xs">Montant:</span> <span className="font-bold text-green-600">{formatCFA(tx.amount)}</span></div>
                    <div><span className="text-muted-foreground text-xs">Utilisateur:</span> <span className="font-medium">{tx.user?.phone}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateTxMutation.mutate({ id: tx.id, status: "approved" })} className="bg-green-500 text-white flex-1">
                      <Check className="w-4 h-4 mr-1" /> Valider
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateTxMutation.mutate({ id: tx.id, status: "rejected" })} className="flex-1">
                      <X className="w-4 h-4 mr-1" /> Rejeter
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      updateTxMutation.mutate({ id: tx.id, status: "rejected" });
                      if (tx.user) updateUserMutation.mutate({ id: tx.user.id, data: { isBanned: true } });
                    }}>
                      <Ban className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "withdrawals" && (
          <div className="space-y-3">
            {(pendingWithdrawals as any[]).length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground text-sm">Aucun retrait en attente</Card>
            ) : (
              (pendingWithdrawals as any[]).map((tx: any) => (
                <Card key={tx.id} className="p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div><span className="text-muted-foreground text-xs">Numéro:</span> <span className="font-medium">{tx.phoneNumber}</span></div>
                    <div><span className="text-muted-foreground text-xs">Montant net:</span> <span className="font-bold text-orange-600">{formatCFA(tx.netAmount || 0)}</span></div>
                    <div><span className="text-muted-foreground text-xs">Frais:</span> <span>{formatCFA(tx.fees || 0)}</span></div>
                    <div><span className="text-muted-foreground text-xs">Pays:</span> <span>{tx.country}</span></div>
                    <div><span className="text-muted-foreground text-xs">Moyen:</span> <span>{tx.paymentMethod}</span></div>
                    <div><span className="text-muted-foreground text-xs">Nom:</span> <span>{tx.accountName || "-"}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateTxMutation.mutate({ id: tx.id, status: "approved" })} className="bg-green-500 text-white flex-1">
                      <Check className="w-4 h-4 mr-1" /> Valider
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateTxMutation.mutate({ id: tx.id, status: "rejected" })} className="flex-1">
                      <X className="w-4 h-4 mr-1" /> Rejeter
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  data-testid="admin-search-users"
                  placeholder="Rechercher par téléphone ou code..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32" data-testid="admin-filter-users">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="banned">Bannis</SelectItem>
                  <SelectItem value="blocked">Retrait bloqué</SelectItem>
                  <SelectItem value="promoter">Promoteurs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredUsers.map((u: any) => (
              <Card key={u.id} className="p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-sm">{u.phone}</p>
                    <p className="text-[10px] text-muted-foreground">Code: {u.referralCode} | {COUNTRIES.find(c => c.id === u.country)?.name}</p>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {u.isBanned && <Badge variant="destructive" className="text-[10px]">Banni</Badge>}
                    {u.isPromoter && <Badge className="text-[10px] bg-yellow-100 text-yellow-800 border-0">Promoteur</Badge>}
                    {u.withdrawBlocked && <Badge variant="secondary" className="text-[10px]">Retrait bloqué</Badge>}
                    {u.isAdmin && <Badge className="text-[10px] bg-blue-100 text-blue-800 border-0">Admin</Badge>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Solde: {formatCFA(u.balance)} | VIP: {u.vipLevel}</p>
                <div className="flex gap-1 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => setSelectedUser(u)} className="text-xs">
                    <Eye className="w-3 h-3 mr-1" /> Gérer
                  </Button>
                  <Button size="sm" variant={u.isBanned ? "default" : "destructive"} onClick={() => updateUserMutation.mutate({ id: u.id, data: { isBanned: !u.isBanned } })} className="text-xs">
                    <Ban className="w-3 h-3 mr-1" /> {u.isBanned ? "Débannir" : "Bannir"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateUserMutation.mutate({ id: u.id, data: { withdrawBlocked: !u.withdrawBlocked } })} className="text-xs">
                    {u.withdrawBlocked ? "Débloquer retrait" : "Bloquer retrait"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateUserMutation.mutate({ id: u.id, data: { isPromoter: !u.isPromoter } })} className="text-xs">
                    {u.isPromoter ? "Retirer Promoteur" : "Promoteur"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateUserMutation.mutate({ id: u.id, data: { isAdmin: !u.isAdmin } })} className="text-xs">
                    {u.isAdmin ? "Retirer Admin" : "Admin"}
                  </Button>
                </div>
              </Card>
            ))}

            {selectedUser && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
                <Card className="max-w-md w-full p-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="font-bold mb-3">Gérer: {selectedUser.phone}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium">Modifier le solde</label>
                      <div className="flex gap-2">
                        <Input type="number" placeholder="Nouveau solde" value={editBalance} onChange={e => setEditBalance(e.target.value)} />
                        <Button size="sm" onClick={() => {
                          updateUserMutation.mutate({ id: selectedUser.id, data: { balance: parseInt(editBalance) } });
                          setEditBalance("");
                        }}>OK</Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Réinitialiser mot de passe</label>
                      <div className="flex gap-2">
                        <Input type="text" placeholder="Nouveau mot de passe" value={editPassword} onChange={e => setEditPassword(e.target.value)} />
                        <Button size="sm" onClick={() => {
                          updateUserMutation.mutate({ id: selectedUser.id, data: { password: editPassword } });
                          setEditPassword("");
                        }}>OK</Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Attribuer un produit</label>
                      <Select value={assignPlan} onValueChange={setAssignPlan}>
                        <SelectTrigger><SelectValue placeholder="Choisir un plan" /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(INVESTMENT_PLANS).map(([key, plan]) =>
                            plan.plans.map(p => (
                              <SelectItem key={`${key}-${p.vip}`} value={`${key}-${p.vip}`}>
                                {plan.name} VIP {p.vip} - {formatCFA(p.amount)}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <Button size="sm" className="mt-2 w-full" onClick={() => {
                        if (!assignPlan) return;
                        const [planKey, vipStr] = assignPlan.split("-");
                        const plan = INVESTMENT_PLANS[planKey as keyof typeof INVESTMENT_PLANS];
                        const vipPlan = plan.plans.find(p => p.vip === parseInt(vipStr));
                        if (plan && vipPlan) {
                          assignProductMutation.mutate({
                            userId: selectedUser.id,
                            plan: {
                              planType: planKey, vipLevel: vipPlan.vip, amount: vipPlan.amount,
                              dailyGain: vipPlan.dailyGain, duration: plan.duration, totalGain: vipPlan.totalGain
                            }
                          });
                        }
                      }}>
                        <Plus className="w-3 h-3 mr-1" /> Attribuer
                      </Button>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedUser(null)} className="w-full">Fermer</Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === "tickets" && (
          <div className="space-y-3">
            {(pendingTickets as any[]).length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground text-sm">Aucun billet en attente</Card>
            ) : (
              (pendingTickets as any[]).map((ticket: any) => (
                <Card key={ticket.id} className="p-4">
                  {ticket.imageUrl && <img src={ticket.imageUrl} alt="Ticket" className="w-full h-40 object-cover rounded-lg mb-3" />}
                  <p className="text-sm mb-1">{ticket.description || "Pas de description"}</p>
                  <p className="text-xs text-muted-foreground mb-3">Par: {ticket.user?.phone} | {new Date(ticket.createdAt).toLocaleDateString("fr-FR")}</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateTicketMutation.mutate({ id: ticket.id, status: "approved", bonus: 100 })} className="bg-green-500 text-white flex-1">
                      <Check className="w-4 h-4 mr-1" /> Approuver (+100)
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateTicketMutation.mutate({ id: ticket.id, status: "rejected" })} className="flex-1">
                      <X className="w-4 h-4 mr-1" /> Rejeter
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4">
            <Card className="p-4 space-y-3">
              <h3 className="font-bold text-sm">Liens Telegram</h3>
              <div>
                <label className="text-xs font-medium">Service client</label>
                <Input
                  data-testid="admin-telegram-service"
                  defaultValue={settingsData?.telegramService || "@redbull_service"}
                  onBlur={e => updateSettingsMutation.mutate({ telegramService: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Chaîne officielle</label>
                <Input
                  data-testid="admin-telegram-group"
                  defaultValue={settingsData?.telegramGroup || ""}
                  onBlur={e => updateSettingsMutation.mutate({ telegramGroup: e.target.value })}
                />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm">Activités</h3>
                  <p className="text-xs text-muted-foreground">Activer/Désactiver les activités d'investissement</p>
                </div>
                <Button
                  size="sm"
                  variant={settingsData?.activitiesEnabled ? "destructive" : "default"}
                  onClick={() => updateSettingsMutation.mutate({ activitiesEnabled: !settingsData?.activitiesEnabled })}
                >
                  {settingsData?.activitiesEnabled ? "Désactiver" : "Activer"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
