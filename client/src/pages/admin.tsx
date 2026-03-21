import { useState, useRef } from "react";
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
  Check, X, DollarSign, Settings, Shield, Eye, Trash2, Plus,
  Link2, Package, ChevronDown, ChevronUp, Edit2, ToggleLeft, ToggleRight,
  Upload, Calendar, UserCheck, Globe
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
  const [editWithdrawBalance, setEditWithdrawBalance] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [assignPlan, setAssignPlan] = useState("");
  const [txSearch, setTxSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userReferrals, setUserReferrals] = useState<any>(null);
  const [userInvestments, setUserInvestments] = useState<any[]>([]);

  // Channel form state
  const [channelForm, setChannelForm] = useState({ name: "", type: "link", redirectUrl: "", isActive: true });
  const [editingChannel, setEditingChannel] = useState<any>(null);

  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: "", price: "", dailyGain: "", totalGain: "", cycleDays: "", purchaseLimit: "0", isActive: true, launchDate: ""
  });
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const productImageRef = useRef<HTMLInputElement>(null);

  // Bulk generation state
  const [bulkText, setBulkText] = useState("");
  const [bulkParsed, setBulkParsed] = useState<any[]>([]);
  const [bulkShowModal, setBulkShowModal] = useState(false);
  const [bulkLaunchDate, setBulkLaunchDate] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 font-bold">Accès refusé</p>
      </div>
    );
  }

  const { data: stats } = useQuery({ queryKey: ["/api/admin/stats"] });
  const { data: allUsers = [] } = useQuery({ queryKey: ["/api/admin/users"] });
  const { data: pendingDeposits = [] } = useQuery({
    queryKey: ["/api/admin/transactions", "deposit", txSearch],
    queryFn: async () => {
      const res = await fetch(`/api/admin/transactions/deposit${txSearch ? `?search=${encodeURIComponent(txSearch)}` : ""}`, { credentials: "include" });
      return res.json();
    }
  });
  const { data: pendingWithdrawals = [] } = useQuery({
    queryKey: ["/api/admin/transactions", "withdrawal", txSearch],
    queryFn: async () => {
      const res = await fetch(`/api/admin/transactions/withdrawal${txSearch ? `?search=${encodeURIComponent(txSearch)}` : ""}`, { credentials: "include" });
      return res.json();
    }
  });
  const { data: pendingTickets = [] } = useQuery({ queryKey: ["/api/admin/tickets"] });
  const { data: settingsData, refetch: refetchSettings } = useQuery({ queryKey: ["/api/settings"] });
  const { data: channels = [], refetch: refetchChannels } = useQuery({ queryKey: ["/api/admin/channels"] });
  const { data: adminProducts = [], refetch: refetchProducts } = useQuery({ queryKey: ["/api/admin/products"] });

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
      if (selectedUser) {
        loadUserInvestments(selectedUser.id);
      }
    }
  });

  // Channel mutations
  const createChannelMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/channels", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Canal créé" });
      refetchChannels();
      setChannelForm({ name: "", type: "link", redirectUrl: "", isActive: true });
    }
  });

  const updateChannelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/channels/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Canal mis à jour" });
      refetchChannels();
      setEditingChannel(null);
    }
  });

  const deleteChannelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/channels/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Canal supprimé" });
      refetchChannels();
    }
  });

  // Product mutations
  const createProductMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Produit créé" });
      refetchProducts();
      setShowProductForm(false);
      resetProductForm();
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" })
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        body: formData,
        credentials: "include"
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Produit mis à jour" });
      refetchProducts();
      setEditingProduct(null);
      resetProductForm();
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" })
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/products/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Produit supprimé" });
      refetchProducts();
    }
  });

  const resetProductForm = () => {
    setProductForm({ name: "", price: "", dailyGain: "", totalGain: "", cycleDays: "", purchaseLimit: "0", isActive: true, launchDate: "" });
    setProductImageFile(null);
    if (productImageRef.current) productImageRef.current.value = "";
  };

  // Parse a pasted product list into structured objects
  const parseBulkText = (text: string) => {
    const cleanNum = (s: string) => parseInt(s.replace(/\s+/g, "").replace(/[^\d]/g, ""), 10);
    const products: any[] = [];
    const blocks = text.split(/(?=📦)/);
    for (const block of blocks) {
      if (!block.trim()) continue;
      const nameMatch = block.match(/📦\s*(.+)/);
      const priceMatch = block.match(/💵[^\d]*(\d[\d\s]*)/);
      const dailyMatch = block.match(/📈[^\d]*(\d[\d\s]*)/);
      const totalMatch = block.match(/💸[^\d]*(\d[\d\s]*)/);
      const daysMatch  = block.match(/⏳[^\d]*(\d+)\s*jours/i);
      const limitMatch = block.match(/🔢[^\d]*(\d+)/);
      if (!nameMatch || !priceMatch) continue;
      products.push({
        name:          nameMatch[1].trim(),
        price:         cleanNum(priceMatch[1]),
        dailyGain:     dailyMatch  ? cleanNum(dailyMatch[1])  : 0,
        totalGain:     totalMatch  ? cleanNum(totalMatch[1])  : 0,
        cycleDays:     daysMatch   ? parseInt(daysMatch[1])   : 120,
        purchaseLimit: limitMatch  ? parseInt(limitMatch[1])  : 0,
        isActive:      true,
      });
    }
    return products;
  };

  const handleBulkGenerate = () => {
    const parsed = parseBulkText(bulkText);
    if (parsed.length === 0) {
      toast({ title: "Aucun produit détecté", description: "Vérifiez le format de votre liste", variant: "destructive" });
      return;
    }
    setBulkParsed(parsed);
    setBulkShowModal(true);
  };

  const confirmBulkGenerate = async () => {
    setBulkLoading(true);
    let ok = 0; let err = 0;
    for (const p of bulkParsed) {
      try {
        const body = { ...p, ...(bulkLaunchDate ? { launchDate: new Date(bulkLaunchDate).toISOString() } : {}) };
        await apiRequest("POST", "/api/admin/products", body);
        ok++;
      } catch { err++; }
    }
    setBulkLoading(false);
    setBulkShowModal(false);
    setBulkText("");
    setBulkParsed([]);
    setBulkLaunchDate("");
    refetchProducts();
    toast({ title: `${ok} produit${ok > 1 ? "s" : ""} créé${ok > 1 ? "s" : ""}${err > 0 ? ` (${err} erreur${err > 1 ? "s" : ""})` : ""}` });
  };

  const loadUserReferrals = async (userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}/referrals`, { credentials: "include" });
    const data = await res.json();
    setUserReferrals(data);
  };

  const loadUserInvestments = async (userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}/investments`, { credentials: "include" });
    const data = await res.json();
    setUserInvestments(data);
  };

  const filteredUsers = (allUsers as any[]).filter((u: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!u.phone?.toLowerCase().includes(q) && !u.referralCode?.toLowerCase().includes(q) && !u.nickname?.toLowerCase().includes(q)) return false;
    }
    if (filterType === "banned") return u.isBanned;
    if (filterType === "blocked") return u.withdrawBlocked;
    if (filterType === "promoter") return u.isPromoter;
    if (filterType === "admin") return u.isAdmin;
    if (filterType === "requireInvite") return u.requireInviteToWithdraw;
    return true;
  });

  const tabs = [
    { key: "dashboard", label: "Stats" },
    { key: "deposits", label: `Dépôts (${(pendingDeposits as any[]).length})` },
    { key: "withdrawals", label: `Retraits (${(pendingWithdrawals as any[]).length})` },
    { key: "users", label: "Utilisateurs" },
    { key: "channels", label: "Canaux" },
    { key: "products", label: "Produits" },
    { key: "tickets", label: `Billets (${(pendingTickets as any[]).length})` },
    { key: "settings", label: "Paramètres" },
  ];

  const submitProductForm = () => {
    const formData = new FormData();
    Object.entries(productForm).forEach(([k, v]) => formData.append(k, String(v)));
    if (productImageFile) formData.append("image", productImageFile);
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, formData });
    } else {
      createProductMutation.mutate(formData);
    }
  };

  const startEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: String(product.price),
      dailyGain: String(product.dailyGain),
      totalGain: String(product.totalGain),
      cycleDays: String(product.cycleDays),
      purchaseLimit: String(product.purchaseLimit),
      isActive: product.isActive,
      launchDate: product.launchDate ? new Date(product.launchDate).toISOString().slice(0, 16) : ""
    });
    setShowProductForm(true);
  };

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

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Utilisateurs total", value: (stats as any)?.totalUsers || 0, icon: Users, color: "text-blue-600" },
                { label: "Inscrits aujourd'hui", value: (stats as any)?.todayRegistrations || 0, icon: Users, color: "text-green-600" },
                { label: "Dépôts aujourd'hui", value: (stats as any)?.todayDeposits || 0, icon: TrendingUp, color: "text-purple-600" },
                { label: "Retraits aujourd'hui", value: (stats as any)?.todayWithdrawals || 0, icon: Download, color: "text-orange-600" },
                { label: "Total dépôts", value: formatCFA((stats as any)?.totalDeposits || 0), icon: DollarSign, color: "text-emerald-600" },
                { label: "Total retraits", value: formatCFA((stats as any)?.totalWithdrawals || 0), icon: DollarSign, color: "text-red-600" },
                { label: "Investissements actifs", value: (stats as any)?.activeInvestments || 0, icon: TrendingUp, color: "text-cyan-600" },
                { label: "Déposants aujourd'hui", value: (stats as any)?.todayDepositors || 0, icon: UserCheck, color: "text-indigo-600" },
                { label: "Retraits effectués auj.", value: (stats as any)?.todayWithdrawers || 0, icon: UserCheck, color: "text-pink-600" },
                { label: "Utilisateurs avec produits", value: (stats as any)?.usersWithProducts || 0, icon: Package, color: "text-yellow-600" },
              ].map(item => (
                <Card key={item.label} className="p-3">
                  <item.icon className={`w-6 h-6 ${item.color} mb-2`} />
                  <p className="text-lg font-bold">{item.value}</p>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* DEPOSITS */}
        {activeTab === "deposits" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                data-testid="admin-search-deposits"
                placeholder="Filtrer par numéro de compte ou utilisateur..."
                value={txSearch}
                onChange={e => setTxSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {(pendingDeposits as any[]).length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground text-sm">Aucun dépôt en attente</Card>
            ) : (
              (pendingDeposits as any[]).map((tx: any) => (
                <Card key={tx.id} className="p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div><span className="text-muted-foreground text-xs">Numéro paiement:</span> <span className="font-medium">{tx.phoneNumber}</span></div>
                    <div><span className="text-muted-foreground text-xs">Nom du compte:</span> <span className="font-medium">{tx.accountName || "-"}</span></div>
                    <div><span className="text-muted-foreground text-xs">Moyen de paiement:</span> <span className="font-medium">{tx.paymentMethod}</span></div>
                    <div><span className="text-muted-foreground text-xs">Pays:</span> <span className="font-medium">{tx.country}</span></div>
                    <div><span className="text-muted-foreground text-xs">Montant:</span> <span className="font-bold text-green-600">{formatCFA(tx.amount)}</span></div>
                    <div><span className="text-muted-foreground text-xs">Utilisateur:</span> <span className="font-medium">{tx.user?.phone}</span></div>
                    {tx.channelName && <div className="col-span-2"><span className="text-muted-foreground text-xs">Canal:</span> <span className="font-medium">{tx.channelName}</span></div>}
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-2">{new Date(tx.createdAt).toLocaleString("fr-FR")}</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateTxMutation.mutate({ id: tx.id, status: "approved" })} className="bg-green-500 text-white flex-1" data-testid={`btn-approve-deposit-${tx.id}`}>
                      <Check className="w-4 h-4 mr-1" /> Valider
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateTxMutation.mutate({ id: tx.id, status: "rejected" })} className="flex-1" data-testid={`btn-reject-deposit-${tx.id}`}>
                      <X className="w-4 h-4 mr-1" /> Rejeter
                    </Button>
                    <Button size="sm" variant="outline" title="Bannir pour fraude" onClick={() => {
                      updateTxMutation.mutate({ id: tx.id, status: "rejected" });
                      if (tx.user) updateUserMutation.mutate({ id: tx.user.id, data: { isBanned: true } });
                    }} data-testid={`btn-ban-deposit-${tx.id}`}>
                      <Ban className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* WITHDRAWALS */}
        {activeTab === "withdrawals" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                data-testid="admin-search-withdrawals"
                placeholder="Filtrer par numéro de compte ou utilisateur..."
                value={txSearch}
                onChange={e => setTxSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {(pendingWithdrawals as any[]).length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground text-sm">Aucun retrait en attente</Card>
            ) : (
              (pendingWithdrawals as any[]).map((tx: any) => (
                <Card key={tx.id} className="p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div><span className="text-muted-foreground text-xs">Numéro réception:</span> <span className="font-medium">{tx.phoneNumber}</span></div>
                    <div><span className="text-muted-foreground text-xs">Montant net:</span> <span className="font-bold text-orange-600">{formatCFA(tx.netAmount || 0)}</span></div>
                    <div><span className="text-muted-foreground text-xs">Frais:</span> <span>{formatCFA(tx.fees || 0)}</span></div>
                    <div><span className="text-muted-foreground text-xs">Pays:</span> <span>{tx.country}</span></div>
                    <div><span className="text-muted-foreground text-xs">Moyen de paiement:</span> <span>{tx.paymentMethod}</span></div>
                    <div><span className="text-muted-foreground text-xs">Nom du compte:</span> <span>{tx.accountName || "-"}</span></div>
                    <div><span className="text-muted-foreground text-xs">Utilisateur:</span> <span>{tx.user?.phone}</span></div>
                    <div><span className="text-muted-foreground text-xs">Montant total:</span> <span>{formatCFA(tx.amount)}</span></div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-2">{new Date(tx.createdAt).toLocaleString("fr-FR")}</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateTxMutation.mutate({ id: tx.id, status: "approved" })} className="bg-green-500 text-white flex-1" data-testid={`btn-approve-withdrawal-${tx.id}`}>
                      <Check className="w-4 h-4 mr-1" /> Valider
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateTxMutation.mutate({ id: tx.id, status: "rejected" })} className="flex-1" data-testid={`btn-reject-withdrawal-${tx.id}`}>
                      <X className="w-4 h-4 mr-1" /> Rejeter
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  data-testid="admin-search-users"
                  placeholder="Téléphone, code parrainage..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-36" data-testid="admin-filter-users">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="banned">Bannis</SelectItem>
                  <SelectItem value="blocked">Retrait bloqué</SelectItem>
                  <SelectItem value="promoter">Promoteurs</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="requireInvite">Invitation requise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredUsers.map((u: any) => (
              <Card key={u.id} className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-sm">{u.phone} {u.nickname && <span className="text-muted-foreground">({u.nickname})</span>}</p>
                    <p className="text-[10px] text-muted-foreground">Code: {u.referralCode} | {COUNTRIES.find((c: any) => c.id === u.country)?.name || u.country}</p>
                    <p className="text-[10px] text-muted-foreground">Recharge: {formatCFA(u.depositBalance)} | Retrait: {formatCFA(u.withdrawBalance)} | VIP: {u.vipLevel} | Inscrit: {new Date(u.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {u.isBanned && <Badge variant="destructive" className="text-[10px]">Banni</Badge>}
                    {u.isPromoter && <Badge className="text-[10px] bg-yellow-100 text-yellow-800 border-0">Promoteur</Badge>}
                    {u.withdrawBlocked && <Badge variant="secondary" className="text-[10px]">Retrait bloqué</Badge>}
                    {u.isAdmin && <Badge className="text-[10px] bg-blue-100 text-blue-800 border-0">Admin</Badge>}
                    {u.requireInviteToWithdraw && <Badge className="text-[10px] bg-orange-100 text-orange-800 border-0">Invite requis</Badge>}
                  </div>
                </div>

                <div className="flex gap-1 flex-wrap mb-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    setSelectedUser(u);
                    loadUserInvestments(u.id);
                    loadUserReferrals(u.id);
                  }} className="text-xs" data-testid={`btn-manage-user-${u.id}`}>
                    <Eye className="w-3 h-3 mr-1" /> Gérer
                  </Button>
                  <Button size="sm" variant={u.isBanned ? "default" : "destructive"} onClick={() => updateUserMutation.mutate({ id: u.id, data: { isBanned: !u.isBanned } })} className="text-xs" data-testid={`btn-ban-user-${u.id}`}>
                    <Ban className="w-3 h-3 mr-1" /> {u.isBanned ? "Débannir" : "Bannir"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateUserMutation.mutate({ id: u.id, data: { withdrawBlocked: !u.withdrawBlocked } })} className="text-xs" data-testid={`btn-block-withdraw-${u.id}`}>
                    {u.withdrawBlocked ? "Débloquer retrait" : "Bloquer retrait"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateUserMutation.mutate({ id: u.id, data: { isPromoter: !u.isPromoter } })} className="text-xs" data-testid={`btn-promoter-${u.id}`}>
                    {u.isPromoter ? "Retirer Promoteur" : "Promoteur"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateUserMutation.mutate({ id: u.id, data: { isAdmin: !u.isAdmin } })} className="text-xs" data-testid={`btn-admin-${u.id}`}>
                    {u.isAdmin ? "Retirer Admin" : "Donner Admin"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateUserMutation.mutate({ id: u.id, data: { requireInviteToWithdraw: !u.requireInviteToWithdraw } })} className="text-xs" data-testid={`btn-require-invite-${u.id}`}>
                    {u.requireInviteToWithdraw ? "Retirer obligation inv." : "Obliger invitation"}
                  </Button>
                </div>

                <button
                  className="flex items-center gap-1 text-xs text-muted-foreground"
                  onClick={() => {
                    const newExp = expandedUser === u.id ? null : u.id;
                    setExpandedUser(newExp);
                    if (newExp) {
                      loadUserReferrals(u.id);
                      loadUserInvestments(u.id);
                    }
                  }}
                >
                  {expandedUser === u.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Voir équipe de parrainage
                </button>

                {expandedUser === u.id && (
                  <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs space-y-1">
                    {userReferrals ? (
                      <>
                        <p className="font-semibold">Équipe de parrainage:</p>
                        <p>Niveau 1: <span className="font-bold">{userReferrals.level1?.length || 0}</span> personnes</p>
                        <p>Niveau 2: <span className="font-bold">{userReferrals.level2?.length || 0}</span> personnes</p>
                        <p>Niveau 3: <span className="font-bold">{userReferrals.level3?.length || 0}</span> personnes</p>
                        <p>Commission totale: <span className="font-bold text-green-600">{formatCFA(u.commissionBalance)}</span></p>
                        {userReferrals.level1?.length > 0 && (
                          <div className="mt-1">
                            <p className="font-semibold">Niveau 1:</p>
                            {userReferrals.level1.map((r: any) => (
                              <div key={r.id} className="flex justify-between py-0.5 border-b border-gray-200 dark:border-gray-700">
                                <span>{r.referred?.phone}</span>
                                <span className="text-muted-foreground">{r.referred?.country}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p>Chargement...</p>
                    )}
                  </div>
                )}
              </Card>
            ))}

            {/* User Management Modal */}
            {selectedUser && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
                <Card className="max-w-md w-full p-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="font-bold mb-1">Gérer: {selectedUser.phone}</h3>
                  {selectedUser.isPromoter && <Badge className="mb-3 bg-yellow-100 text-yellow-800 border-0">Promoteur</Badge>}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium">Modifier le solde de recharge</label>
                      <div className="flex gap-2">
                        <Input type="number" placeholder="Nouveau solde recharge" value={editBalance} onChange={e => setEditBalance(e.target.value)} data-testid="admin-edit-balance" />
                        <Button size="sm" onClick={() => {
                          updateUserMutation.mutate({ id: selectedUser.id, data: { depositBalance: parseInt(editBalance) } });
                          setEditBalance("");
                        }}>OK</Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Modifier le solde retrait</label>
                      <div className="flex gap-2">
                        <Input type="number" placeholder="Solde retrait" value={editWithdrawBalance} onChange={e => setEditWithdrawBalance(e.target.value)} data-testid="admin-edit-withdraw-balance" />
                        <Button size="sm" onClick={() => {
                          updateUserMutation.mutate({ id: selectedUser.id, data: { withdrawBalance: parseInt(editWithdrawBalance) } });
                          setEditWithdrawBalance("");
                        }}>OK</Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Réinitialiser mot de passe</label>
                      <div className="flex gap-2">
                        <Input type="text" placeholder="Nouveau mot de passe" value={editPassword} onChange={e => setEditPassword(e.target.value)} data-testid="admin-edit-password" />
                        <Button size="sm" onClick={() => {
                          updateUserMutation.mutate({ id: selectedUser.id, data: { password: editPassword } });
                          setEditPassword("");
                        }}>OK</Button>
                      </div>
                    </div>

                    {/* Assign fixed plan (120j) */}
                    <div>
                      <label className="text-xs font-medium">Attribuer plan Fixé 120J</label>
                      <Select value={assignPlan} onValueChange={setAssignPlan}>
                        <SelectTrigger><SelectValue placeholder="Choisir un niveau VIP" /></SelectTrigger>
                        <SelectContent>
                          {INVESTMENT_PLANS.fix.plans.map((p: any) => (
                            <SelectItem key={`fix-${p.vip}`} value={`fix-${p.vip}`}>
                              Fixé 120J — VIP {p.vip} — {formatCFA(p.amount)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" className="mt-2 w-full" onClick={() => {
                        if (!assignPlan) return;
                        const [, vipStr] = assignPlan.split("-");
                        const vipPlan = INVESTMENT_PLANS.fix.plans.find((p: any) => p.vip === parseInt(vipStr));
                        if (vipPlan) {
                          assignProductMutation.mutate({
                            userId: selectedUser.id,
                            plan: {
                              planType: "fix", vipLevel: vipPlan.vip, amount: vipPlan.amount,
                              dailyGain: vipPlan.dailyGain, duration: INVESTMENT_PLANS.fix.duration, totalGain: vipPlan.totalGain
                            }
                          });
                        }
                      }} data-testid="admin-assign-product">
                        <Plus className="w-3 h-3 mr-1" /> Attribuer plan fixé
                      </Button>
                    </div>

                    {/* Assign admin-created product */}
                    {(adminProducts as any[]).length > 0 && (
                      <div>
                        <label className="text-xs font-medium">Attribuer un produit d'activité</label>
                        <div className="space-y-1 mt-1">
                          {(adminProducts as any[]).filter((p: any) => p.isActive).map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs">
                              <div>
                                <span className="font-medium">{p.name}</span>
                                <span className="text-muted-foreground ml-2">{formatCFA(p.price)}</span>
                              </div>
                              <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => {
                                assignProductMutation.mutate({
                                  userId: selectedUser.id,
                                  plan: {
                                    planType: "activity", vipLevel: 1, amount: p.price,
                                    dailyGain: p.dailyGain, duration: p.cycleDays, totalGain: p.totalGain
                                  }
                                });
                              }} data-testid={`admin-assign-admin-product-${p.id}`}>
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* User investments */}
                    {userInvestments.length > 0 && (
                      <div>
                        <label className="text-xs font-medium">Produits actifs</label>
                        <div className="space-y-1 mt-1">
                          {userInvestments.map((inv: any) => (
                            <div key={inv.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs">
                              <div>
                                <span className="font-medium">{inv.planType}</span> VIP {inv.vipLevel}
                                <span className="text-muted-foreground ml-2">{formatCFA(inv.amount)}</span>
                                <Badge variant={inv.status === "active" ? "default" : "secondary"} className="ml-1 text-[9px]">{inv.status}</Badge>
                              </div>
                              <Button size="sm" variant="destructive" className="h-6 text-[10px] px-2" onClick={() => deleteInvestmentMutation.mutate(inv.id)} data-testid={`btn-delete-inv-${inv.id}`}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Referral team */}
                    {userReferrals && (
                      <div>
                        <label className="text-xs font-medium">Équipe de parrainage</label>
                        <div className="mt-1 text-xs space-y-1 bg-gray-50 dark:bg-gray-800 rounded p-2">
                          <p>Niv. 1: <strong>{userReferrals.level1?.length || 0}</strong> | Niv. 2: <strong>{userReferrals.level2?.length || 0}</strong> | Niv. 3: <strong>{userReferrals.level3?.length || 0}</strong></p>
                          <p>Commission: <strong className="text-green-600">{formatCFA(selectedUser.commissionBalance)}</strong></p>
                        </div>
                      </div>
                    )}

                    <Button variant="outline" onClick={() => setSelectedUser(null)} className="w-full">Fermer</Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* CHANNELS */}
        {activeTab === "channels" && (
          <div className="space-y-3">
            <Card className="p-4">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Link2 className="w-4 h-4" /> {editingChannel ? "Modifier le canal" : "Ajouter un canal de recharge"}</h3>
              <div className="space-y-2">
                <Input
                  placeholder="Nom du canal (ex: Wave, Orange Money...)"
                  value={editingChannel ? editingChannel.name : channelForm.name}
                  onChange={e => editingChannel ? setEditingChannel({ ...editingChannel, name: e.target.value }) : setChannelForm({ ...channelForm, name: e.target.value })}
                  data-testid="admin-channel-name"
                />
                <Select
                  value={editingChannel ? editingChannel.type : channelForm.type}
                  onValueChange={v => editingChannel ? setEditingChannel({ ...editingChannel, type: v }) : setChannelForm({ ...channelForm, type: v })}
                >
                  <SelectTrigger data-testid="admin-channel-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Lien de paiement</SelectItem>
                    <SelectItem value="leekpay">LeekPay (API automatique)</SelectItem>
                  </SelectContent>
                </Select>
                {(editingChannel ? editingChannel.type : channelForm.type) === "link" && (
                  <Input
                    placeholder="URL de redirection"
                    value={editingChannel ? editingChannel.redirectUrl || "" : channelForm.redirectUrl}
                    onChange={e => editingChannel ? setEditingChannel({ ...editingChannel, redirectUrl: e.target.value }) : setChannelForm({ ...channelForm, redirectUrl: e.target.value })}
                    data-testid="admin-channel-url"
                  />
                )}
                <div className="flex gap-2">
                  {editingChannel ? (
                    <>
                      <Button className="flex-1" size="sm" onClick={() => updateChannelMutation.mutate({ id: editingChannel.id, data: editingChannel })} data-testid="btn-save-channel">
                        <Check className="w-4 h-4 mr-1" /> Enregistrer
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingChannel(null)}>Annuler</Button>
                    </>
                  ) : (
                    <Button className="w-full" size="sm" onClick={() => createChannelMutation.mutate(channelForm)} data-testid="btn-add-channel">
                      <Plus className="w-4 h-4 mr-1" /> Ajouter le canal
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {(channels as any[]).length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground text-sm">Aucun canal configuré</Card>
            ) : (
              (channels as any[]).map((ch: any) => (
                <Card key={ch.id} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{ch.name}</p>
                      <p className="text-xs text-muted-foreground">{ch.type === "leekpay" ? "LeekPay (API)" : "Lien de paiement"}</p>
                      {ch.redirectUrl && <p className="text-xs text-blue-500 truncate max-w-[180px]">{ch.redirectUrl}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={ch.isActive ? "default" : "secondary"} className="text-[10px]">{ch.isActive ? "Actif" : "Inactif"}</Badge>
                      <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => updateChannelMutation.mutate({ id: ch.id, data: { isActive: !ch.isActive } })} data-testid={`btn-toggle-channel-${ch.id}`}>
                        {ch.isActive ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setEditingChannel({ ...ch })} data-testid={`btn-edit-channel-${ch.id}`}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => deleteChannelMutation.mutate(ch.id)} data-testid={`btn-delete-channel-${ch.id}`}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* PRODUCTS */}
        {activeTab === "products" && (
          <div className="space-y-3">

            {/* BULK GENERATION */}
            <Card className="p-4 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Package className="w-4 h-4" /> Génération en lot
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                Collez votre liste de produits ci-dessous (format emoji 📦 💵 📈 💸 ⏳), puis cliquez sur Générer.
              </p>
              <textarea
                className="w-full border rounded-lg p-2 text-sm min-h-[120px] bg-white dark:bg-gray-900 resize-y"
                placeholder={"📦 Nom du produit\n💵 Prix : FCFA 5 000\n📈 Revenu quotidien : FCFA 1 100\n💸 Revenu total : FCFA 132 000\n⏳ Temps : 120 jours\n\n📦 Produit 2\n..."}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                data-testid="admin-bulk-text"
              />
              <Button className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleBulkGenerate} data-testid="btn-bulk-generate">
                <Plus className="w-4 h-4 mr-2" /> Générer les produits
              </Button>
            </Card>

            {/* BULK CONFIRMATION MODAL */}
            {bulkShowModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                <Card className="w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
                  <h3 className="font-bold text-base mb-1">Confirmer la génération</h3>
                  <p className="text-sm text-muted-foreground mb-3">{bulkParsed.length} produit{bulkParsed.length > 1 ? "s" : ""} détecté{bulkParsed.length > 1 ? "s" : ""}</p>

                  {/* Preview */}
                  <div className="space-y-1 mb-4 max-h-48 overflow-y-auto">
                    {bulkParsed.map((p, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-xs">
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-muted-foreground">{formatCFA(p.price)} · {formatCFA(p.dailyGain)}/j · {p.cycleDays}j</p>
                      </div>
                    ))}
                  </div>

                  {/* Launch date */}
                  <div className="mb-4">
                    <label className="text-xs font-medium flex items-center gap-1 mb-1">
                      <Calendar className="w-3 h-3" /> Date et heure de lancement (optionnel — même date pour tous)
                    </label>
                    <Input type="datetime-local" value={bulkLaunchDate} onChange={e => setBulkLaunchDate(e.target.value)} data-testid="admin-bulk-launch-date" />
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={confirmBulkGenerate} disabled={bulkLoading} data-testid="btn-bulk-confirm">
                      <Check className="w-4 h-4 mr-1" /> {bulkLoading ? "Création..." : "Confirmer et créer"}
                    </Button>
                    <Button variant="outline" onClick={() => { setBulkShowModal(false); setBulkParsed([]); }}>Annuler</Button>
                  </div>
                </Card>
              </div>
            )}

            <Button className="w-full" onClick={() => { setEditingProduct(null); resetProductForm(); setShowProductForm(!showProductForm); }} data-testid="btn-toggle-product-form">
              <Plus className="w-4 h-4 mr-2" /> {showProductForm && !editingProduct ? "Masquer le formulaire" : "Créer un nouveau produit"}
            </Button>

            {showProductForm && (
              <Card className="p-4">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" /> {editingProduct ? "Modifier le produit" : "Nouveau produit"}
                </h3>
                <div className="space-y-2">
                  <Input placeholder="Nom du produit" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} data-testid="admin-product-name" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" placeholder="Prix (FCFA)" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} data-testid="admin-product-price" />
                    <Input type="number" placeholder="Gain journalier (FCFA)" value={productForm.dailyGain} onChange={e => setProductForm({ ...productForm, dailyGain: e.target.value })} data-testid="admin-product-daily-gain" />
                    <Input type="number" placeholder="Gain total (FCFA)" value={productForm.totalGain} onChange={e => setProductForm({ ...productForm, totalGain: e.target.value })} data-testid="admin-product-total-gain" />
                    <Input type="number" placeholder="Cycle (jours)" value={productForm.cycleDays} onChange={e => setProductForm({ ...productForm, cycleDays: e.target.value })} data-testid="admin-product-cycle" />
                  </div>
                  <Input type="number" placeholder="Limite d'achat (0 = illimité)" value={productForm.purchaseLimit} onChange={e => setProductForm({ ...productForm, purchaseLimit: e.target.value })} data-testid="admin-product-limit" />
                  <div>
                    <label className="text-xs font-medium flex items-center gap-1"><Calendar className="w-3 h-3" /> Date et heure de lancement</label>
                    <Input type="datetime-local" value={productForm.launchDate} onChange={e => setProductForm({ ...productForm, launchDate: e.target.value })} data-testid="admin-product-launch" />
                  </div>
                  <div>
                    <label className="text-xs font-medium flex items-center gap-1"><Upload className="w-3 h-3" /> Image du produit</label>
                    <input ref={productImageRef} type="file" accept="image/*" className="mt-1 text-sm" onChange={e => setProductImageFile(e.target.files?.[0] || null)} data-testid="admin-product-image" />
                    {editingProduct?.imageUrl && !productImageFile && (
                      <img src={editingProduct.imageUrl} alt="Produit" className="mt-2 h-16 object-contain rounded" />
                    )}
                  </div>
                  <Select value={String(productForm.isActive)} onValueChange={v => setProductForm({ ...productForm, isActive: v === "true" })}>
                    <SelectTrigger data-testid="admin-product-active">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Actif</SelectItem>
                      <SelectItem value="false">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={submitProductForm} disabled={createProductMutation.isPending || updateProductMutation.isPending} data-testid="btn-save-product">
                      <Check className="w-4 h-4 mr-1" /> {editingProduct ? "Enregistrer les modifications" : "Créer le produit"}
                    </Button>
                    {editingProduct && (
                      <Button variant="outline" onClick={() => { setEditingProduct(null); setShowProductForm(false); resetProductForm(); }}>Annuler</Button>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {(adminProducts as any[]).length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground text-sm">Aucun produit créé</Card>
            ) : (
              (adminProducts as any[]).map((p: any) => (
                <Card key={p.id} className="p-3">
                  <div className="flex gap-3">
                    {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground">Prix: {formatCFA(p.price)}</p>
                          <p className="text-xs text-muted-foreground">Gain/jour: {formatCFA(p.dailyGain)} | Total: {formatCFA(p.totalGain)}</p>
                          <p className="text-xs text-muted-foreground">Cycle: {p.cycleDays} jours | Achats: {p.purchaseCount}/{p.purchaseLimit > 0 ? p.purchaseLimit : "∞"}</p>
                          {p.launchDate && <p className="text-xs text-blue-500">Lancement: {new Date(p.launchDate).toLocaleString("fr-FR")}</p>}
                        </div>
                        <Badge variant={p.isActive ? "default" : "secondary"} className="text-[10px] flex-shrink-0">{p.isActive ? "Actif" : "Inactif"}</Badge>
                      </div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => updateProductMutation.mutate({ id: p.id, formData: (() => { const f = new FormData(); f.append("isActive", String(!p.isActive)); return f; })() })} data-testid={`btn-toggle-product-${p.id}`}>
                          {p.isActive ? "Désactiver" : "Activer"}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => startEditProduct(p)} data-testid={`btn-edit-product-${p.id}`}>
                          <Edit2 className="w-3 h-3 mr-1" /> Modifier
                        </Button>
                        <Button size="sm" variant="destructive" className="h-7 text-[10px] px-2" onClick={() => deleteProductMutation.mutate(p.id)} data-testid={`btn-delete-product-${p.id}`}>
                          <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* TICKETS */}
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

        {/* SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            <Card className="p-4 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2"><Globe className="w-4 h-4" /> Liens officiels</h3>
              <div>
                <label className="text-xs font-medium">Groupe officiel (lien)</label>
                <Input
                  data-testid="admin-telegram-group"
                  defaultValue={(settingsData as any)?.telegramGroup || ""}
                  onBlur={e => updateSettingsMutation.mutate({ telegramGroup: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Chaîne officielle (lien)</label>
                <Input
                  data-testid="admin-telegram-channel"
                  defaultValue={(settingsData as any)?.telegramChannel || ""}
                  onBlur={e => updateSettingsMutation.mutate({ telegramChannel: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Service client (lien ou @username)</label>
                <Input
                  data-testid="admin-telegram-service"
                  defaultValue={(settingsData as any)?.telegramService || "@redbull_service"}
                  onBlur={e => updateSettingsMutation.mutate({ telegramService: e.target.value })}
                />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm">Activités d'investissement</h3>
                  <p className="text-xs text-muted-foreground">Activer/Désactiver les activités</p>
                </div>
                <Button
                  size="sm"
                  variant={(settingsData as any)?.activitiesEnabled ? "destructive" : "default"}
                  onClick={() => updateSettingsMutation.mutate({ activitiesEnabled: !(settingsData as any)?.activitiesEnabled })}
                  data-testid="admin-toggle-activities"
                >
                  {(settingsData as any)?.activitiesEnabled ? "Désactiver" : "Activer"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
