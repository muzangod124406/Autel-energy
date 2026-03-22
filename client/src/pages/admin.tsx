import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { formatCFA, INVESTMENT_PLANS } from "@/lib/constants";
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
  Link2, Package, Edit2, ToggleLeft, ToggleRight,
  Upload, Calendar, UserCheck, Globe, Wallet, Award, RotateCcw, CreditCard,
  AlertTriangle, Zap, Clock, ShoppingCart, MessageCircle, Send, Image, ChevronLeft
} from "lucide-react";
import { useLocation } from "wouter";

function StatCard({ label, value, sub, icon: Icon, iconColor, iconBg }: any) {
  return (
    <Card className="p-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </Card>
  );
}

function TxFilterTabs({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { key: string; label: string }[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {options.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            value === o.key ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: any = {
    pending: { label: "pending", className: "bg-gray-100 text-gray-600" },
    approved: { label: "approuvé", className: "bg-green-100 text-green-700" },
    rejected: { label: "rejeté", className: "bg-red-100 text-red-700" },
    processing: { label: "en cours", className: "bg-blue-100 text-blue-700" },
  };
  const { label, className } = map[status] || { label: status, className: "bg-gray-100 text-gray-600" };
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${className}`}>{label}</span>;
}

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
  const [editTxPassword, setEditTxPassword] = useState("");
  const [assignPlan, setAssignPlan] = useState("");
  const [txSearch, setTxSearch] = useState("");
  const [depositStatus, setDepositStatus] = useState("all");
  const [withdrawalStatus, setWithdrawalStatus] = useState("all");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userReferrals, setUserReferrals] = useState<any>(null);
  const [userInvestments, setUserInvestments] = useState<any[]>([]);
  const [teamModalUser, setTeamModalUser] = useState<any>(null);
  const [ticketBonuses, setTicketBonuses] = useState<Record<string, string>>({});

  // Chat state
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const [chatText, setChatText] = useState("");
  const chatFileRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

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

  // Settings local state
  const [settingsForm, setSettingsForm] = useState<any>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Country form state
  const [showCountryForm, setShowCountryForm] = useState(false);
  const [editingCountry, setEditingCountry] = useState<any>(null);
  const [countryForm, setCountryForm] = useState({ name: "", flag: "", code: "", operators: "", isActive: true });

  // Stats date filter
  const [statsFrom, setStatsFrom] = useState("");
  const [appliedStatsFrom, setAppliedStatsFrom] = useState("");


  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 font-bold">Accès refusé</p>
      </div>
    );
  }

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats", appliedStatsFrom],
    queryFn: async () => {
      const url = appliedStatsFrom ? `/api/admin/stats?from=${appliedStatsFrom}` : "/api/admin/stats";
      const res = await fetch(url, { credentials: "include" });
      return res.json();
    }
  });
  const { data: allUsers = [] } = useQuery({ queryKey: ["/api/admin/users"] });
  const { data: teamOverview = [] } = useQuery({ queryKey: ["/api/admin/team-overview"] });
  const { data: adminCountries = [] } = useQuery({ queryKey: ["/api/admin/countries"] });

  // WestPay — toujours appelé (règle des hooks), activé uniquement sur l'onglet
  const { data: wpStatus } = useQuery<any>({ queryKey: ["/api/admin/westpay/status"], enabled: activeTab === "westpay" });
  const { data: wpBalances, refetch: refetchBalances, isFetching: balFetching } = useQuery<any[]>({
    queryKey: ["/api/admin/westpay/balances"], enabled: false,
  });

  const createCountryMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/countries", data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/countries"] }); queryClient.invalidateQueries({ queryKey: ["/api/countries"] }); setShowCountryForm(false); setEditingCountry(null); setCountryForm({ name: "", flag: "", code: "", operators: "", isActive: true }); toast({ title: "Pays créé" }); },
    onError: (e: any) => toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, ""), variant: "destructive" }),
  });
  const updateCountryMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/admin/countries/${id}`, data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/countries"] }); queryClient.invalidateQueries({ queryKey: ["/api/countries"] }); setShowCountryForm(false); setEditingCountry(null); toast({ title: "Pays mis à jour" }); },
    onError: (e: any) => toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, ""), variant: "destructive" }),
  });
  const deleteCountryMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/countries/${id}`).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/countries"] }); queryClient.invalidateQueries({ queryKey: ["/api/countries"] }); toast({ title: "Pays supprimé" }); },
    onError: (e: any) => toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, ""), variant: "destructive" }),
  });
  const { data: deposits = [], refetch: refetchDeposits } = useQuery({
    queryKey: ["/api/admin/transactions", "deposit", txSearch, depositStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (txSearch) params.set("search", txSearch);
      if (depositStatus !== "all") params.set("status", depositStatus);
      else params.set("status", "all");
      const res = await fetch(`/api/admin/transactions/deposit?${params}`, { credentials: "include" });
      return res.json();
    }
  });
  const { data: withdrawals = [], refetch: refetchWithdrawals } = useQuery({
    queryKey: ["/api/admin/transactions", "withdrawal", txSearch, withdrawalStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (txSearch) params.set("search", txSearch);
      if (withdrawalStatus !== "all") params.set("status", withdrawalStatus);
      else params.set("status", "all");
      const res = await fetch(`/api/admin/transactions/withdrawal?${params}`, { credentials: "include" });
      return res.json();
    }
  });
  const { data: pendingTickets = [] } = useQuery({ queryKey: ["/api/admin/tickets"] });
  const { data: settingsData, refetch: refetchSettings } = useQuery({ queryKey: ["/api/settings"] });
  useEffect(() => {
    if (settingsData && !settingsForm) setSettingsForm(settingsData);
  }, [settingsData]);
  const { data: channels = [], refetch: refetchChannels } = useQuery({ queryKey: ["/api/admin/channels"] });
  const { data: adminProducts = [], refetch: refetchProducts } = useQuery({ queryKey: ["/api/admin/products"] });
  const { data: chatConversations = [] } = useQuery<any[]>({ queryKey: ["/api/admin/chat/conversations"], refetchInterval: 10000 });
  const { data: chatMessages = [] } = useQuery<any[]>({ queryKey: ["/api/admin/chat", chatUserId, "messages"], enabled: !!chatUserId && activeTab === "chat", refetchInterval: chatUserId ? 4000 : false });

  useEffect(() => {
    if (chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const s = stats as any;

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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
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

  const resetStatsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/reset-stats", {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Statistiques réinitialisées" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" })
  });

  const { data: giftCodes = [] } = useQuery({ queryKey: ["/api/admin/gift-codes"] });
  const [newCode, setNewCode] = useState({ code: "", recipientPhone: "", amount: "", expiresAt: "" });

  const createGiftCodeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/gift-codes", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Code cadeau créé" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gift-codes"] });
      setNewCode({ code: "", recipientPhone: "", amount: "", expiresAt: "" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, ""), variant: "destructive" })
  });

  const deleteGiftCodeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/gift-codes/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Code supprimé" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gift-codes"] });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/admin/settings", data);
      return res.json();
    },
    onSuccess: (saved: any) => {
      toast({ title: "Paramètres enregistrés ✓" });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      if (saved && saved.id) setSettingsForm(saved);
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, ""), variant: "destructive" })
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
      if (selectedUser) loadUserInvestments(selectedUser.id);
    }
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest("POST", "/api/admin/channels", data); return res.json(); },
    onSuccess: () => { toast({ title: "Canal créé" }); refetchChannels(); setChannelForm({ name: "", type: "link", redirectUrl: "", isActive: true }); }
  });

  const updateChannelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => { const res = await apiRequest("PUT", `/api/admin/channels/${id}`, data); return res.json(); },
    onSuccess: () => { toast({ title: "Canal mis à jour" }); refetchChannels(); setEditingChannel(null); }
  });

  const deleteChannelMutation = useMutation({
    mutationFn: async (id: string) => { const res = await apiRequest("DELETE", `/api/admin/channels/${id}`); return res.json(); },
    onSuccess: () => { toast({ title: "Canal supprimé" }); refetchChannels(); }
  });

  const createProductMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/admin/products", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { toast({ title: "Produit créé" }); refetchProducts(); setShowProductForm(false); resetProductForm(); },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" })
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const res = await fetch(`/api/admin/products/${id}`, { method: "PUT", body: formData, credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { toast({ title: "Produit mis à jour" }); refetchProducts(); setEditingProduct(null); resetProductForm(); },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" })
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => { const res = await apiRequest("DELETE", `/api/admin/products/${id}`); return res.json(); },
    onSuccess: () => { toast({ title: "Produit supprimé" }); refetchProducts(); }
  });

  const resetProductForm = () => {
    setProductForm({ name: "", price: "", dailyGain: "", totalGain: "", cycleDays: "", purchaseLimit: "0", isActive: true, launchDate: "" });
    setProductImageFile(null);
    if (productImageRef.current) productImageRef.current.value = "";
  };

  const parseBulkText = (text: string) => {
    const cleanNum = (s: string) => parseInt(s.replace(/\s+/g, "").replace(/[^\d]/g, ""), 10);
    const prods: any[] = [];
    const blocks = text.split(/(?=📦)/);
    for (const block of blocks) {
      if (!block.trim()) continue;
      const nameMatch = block.match(/📦\s*(.+)/);
      const priceMatch = block.match(/💵[^\d]*(\d[\d\s]*)/);
      const dailyMatch = block.match(/📈[^\d]*(\d[\d\s]*)/);
      const totalMatch = block.match(/💸[^\d]*(\d[\d\s]*)/);
      const daysMatch = block.match(/⏳[^\d]*(\d+)\s*jours/i);
      const limitMatch = block.match(/🔢[^\d]*(\d+)/);
      if (!nameMatch || !priceMatch) continue;
      prods.push({
        name: nameMatch[1].trim(), price: cleanNum(priceMatch[1]),
        dailyGain: dailyMatch ? cleanNum(dailyMatch[1]) : 0,
        totalGain: totalMatch ? cleanNum(totalMatch[1]) : 0,
        cycleDays: daysMatch ? parseInt(daysMatch[1]) : 120,
        purchaseLimit: limitMatch ? parseInt(limitMatch[1]) : 0, isActive: true,
      });
    }
    return prods;
  };

  const handleBulkGenerate = () => {
    const parsed = parseBulkText(bulkText);
    if (parsed.length === 0) { toast({ title: "Aucun produit détecté", variant: "destructive" }); return; }
    setBulkParsed(parsed); setBulkShowModal(true);
  };

  const confirmBulkGenerate = async () => {
    setBulkLoading(true);
    let ok = 0; let err = 0;
    for (const p of bulkParsed) {
      try {
        const body = { ...p, ...(bulkLaunchDate ? { launchDate: new Date(bulkLaunchDate).toISOString() } : {}) };
        await apiRequest("POST", "/api/admin/products", body); ok++;
      } catch { err++; }
    }
    setBulkLoading(false); setBulkShowModal(false); setBulkText(""); setBulkParsed([]); setBulkLaunchDate("");
    refetchProducts();
    toast({ title: `${ok} produit${ok > 1 ? "s" : ""} créé${ok > 1 ? "s" : ""}${err > 0 ? ` (${err} erreur${err > 1 ? "s" : ""})` : ""}` });
  };

  const loadUserReferrals = async (userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}/referrals`, { credentials: "include" });
    setUserReferrals(await res.json());
  };

  const loadUserInvestments = async (userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}/investments`, { credentials: "include" });
    setUserInvestments(await res.json());
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

  const submitProductForm = () => {
    const formData = new FormData();
    Object.entries(productForm).forEach(([k, v]) => formData.append(k, String(v)));
    if (productImageFile) formData.append("image", productImageFile);
    if (editingProduct) updateProductMutation.mutate({ id: editingProduct.id, formData });
    else createProductMutation.mutate(formData);
  };

  const startEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name, price: String(product.price), dailyGain: String(product.dailyGain),
      totalGain: String(product.totalGain), cycleDays: String(product.cycleDays),
      purchaseLimit: String(product.purchaseLimit), isActive: product.isActive,
      launchDate: product.launchDate ? new Date(product.launchDate).toISOString().slice(0, 16) : ""
    });
    setShowProductForm(true);
  };

  const saveSettings = async (patch: any) => {
    setSettingsSaving(true);
    try { await updateSettingsMutation.mutateAsync(patch); } finally { setSettingsSaving(false); }
  };

  const currentSettings = settingsForm || settingsData as any || {};

  const totalUnread = (chatConversations as any[]).reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);

  const sendAdminChatMutation = useMutation({
    mutationFn: async ({ userId, formData }: { userId: string; formData: FormData }) => {
      const res = await fetch(`/api/admin/chat/${userId}/messages`, { method: "POST", credentials: "include", body: formData });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setChatText("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chat", chatUserId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chat/conversations"] });
    },
  });

  const tabs = [
    { key: "dashboard", label: "Tableau de bord" },
    { key: "deposits", label: "Dépôts" },
    { key: "withdrawals", label: "Retraits" },
    { key: "users", label: "Utilisateurs" },
    { key: "products", label: "Produits" },
    { key: "channels", label: "Canaux" },
    { key: "billets", label: "Billets" },
    { key: "tickets", label: "Codes Cadeaux" },
    { key: "pays", label: "Pays" },
    { key: "westpay", label: "WestPay" },
    { key: "chat", label: totalUnread > 0 ? `Chat (${totalUnread})` : "Chat" },
    { key: "settings", label: "Paramètres" },
  ];

  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return `${dt.getDate().toString().padStart(2,"0")}/${(dt.getMonth()+1).toString().padStart(2,"0")}/${dt.getFullYear()} a ${dt.getHours().toString().padStart(2,"0")}:${dt.getMinutes().toString().padStart(2,"0")}`;
  };

  const countryCode = (country: string) => {
    const map: any = { togo: "TG", benin: "BJ", ivory_coast: "CI", senegal: "SN", cameroun: "CM" };
    return map[country] || (country || "").toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-6 pb-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate("/")} className="flex items-center gap-1 text-gray-700" data-testid="button-back-admin">
              <ArrowLeft className="w-5 h-5" /> <span className="font-medium">Administration</span>
            </button>
            {totalUnread > 0 && (
              <button
                onClick={() => setActiveTab("chat")}
                data-testid="admin-notif-chat"
                className="relative flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-red-100 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{totalUnread} message{totalUnread > 1 ? "s" : ""} non lu{totalUnread > 1 ? "s" : ""}</span>
              </button>
            )}
          </div>
          {/* Tabs */}
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                data-testid={`admin-tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* ===================== TABLEAU DE BORD ===================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-4">
            {/* Date filter */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-sm">Filtrer les statistiques depuis</span>
                {appliedStatsFrom && (
                  <span className="ml-auto text-xs text-blue-600 font-medium">depuis {new Date(appliedStatsFrom).toLocaleDateString("fr-FR")}</span>
                )}
              </div>
              <Input type="date" value={statsFrom} onChange={e => setStatsFrom(e.target.value)}
                className="mb-2" data-testid="admin-stats-from-date" />
              <div className="flex gap-2">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" size="sm"
                  onClick={() => setAppliedStatsFrom(statsFrom || "")}
                  data-testid="btn-apply-stats-filter">
                  Appliquer
                </Button>
                {appliedStatsFrom && (
                  <Button variant="outline" size="sm" className="flex-shrink-0"
                    onClick={() => { setStatsFrom(""); setAppliedStatsFrom(""); }}
                    data-testid="btn-clear-stats-filter">
                    Tout
                  </Button>
                )}
              </div>
            </Card>

            {/* Vue générale */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Vue générale</p>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Utilisateurs totaux" value={s?.totalUsers || 0}
                  sub={`+${s?.todayRegistrations || 0} aujourd'hui`}
                  icon={Users} iconColor="text-blue-600" iconBg="bg-blue-100" />
                <StatCard label="Investisseurs actifs" value={s?.usersWithProducts || 0}
                  sub={`${s?.activeProductsCount || 0} produits actifs`}
                  icon={ShoppingCart} iconColor="text-purple-600" iconBg="bg-purple-100" />
              </div>
            </div>

            {/* Dépôts */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Dépôts</p>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Total dépôts approuvés" value={formatCFA(s?.totalDeposits || 0)}
                  sub={`+${formatCFA(s?.todayDepositsAmount || 0)} aujourd'hui`}
                  icon={Download} iconColor="text-green-600" iconBg="bg-green-100" />
                <StatCard label="Dépôts en attente" value={formatCFA(s?.pendingDeposits?.amount || 0)}
                  sub={`${s?.pendingDeposits?.count || 0} demande(s)`}
                  icon={Clock} iconColor="text-blue-600" iconBg="bg-blue-100" />
              </div>
            </div>

            {/* Retraits */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Retraits</p>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Total retraits approuvés" value={formatCFA(s?.totalWithdrawals || 0)}
                  sub={`+${formatCFA(s?.todayWithdrawalsAmount || 0)} aujourd'hui`}
                  icon={Upload} iconColor="text-red-500" iconBg="bg-red-100" />
                <StatCard label="Retraits en attente" value={formatCFA(s?.pendingWithdrawals?.amount || 0)}
                  sub={`${s?.pendingWithdrawals?.count || 0} demande(s)`}
                  icon={Clock} iconColor="text-blue-600" iconBg="bg-blue-100" />
              </div>
            </div>

            {/* Finances */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Finances</p>
              <div className="space-y-3">
                <StatCard label="Solde total plateforme" value={formatCFA(s?.totalPlatformBalance || 0)}
                  sub="Tous les utilisateurs" icon={Wallet} iconColor="text-blue-600" iconBg="bg-blue-100" />
                <StatCard label="Gains totaux distribués" value={formatCFA(s?.totalDistributedGains || 0)}
                  sub="Depuis le début" icon={TrendingUp} iconColor="text-green-600" iconBg="bg-green-100" />
                <StatCard label="Commissions versées" value={formatCFA(s?.totalCommissions || 0)}
                  sub="Parrainages" icon={Award} iconColor="text-purple-600" iconBg="bg-purple-100" />
              </div>
            </div>

            {/* Reset */}
            <Card className="p-4 border-red-200 bg-red-50">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-gray-900">Réinitialiser les statistiques</p>
                    <p className="text-xs text-gray-500">Remet à zéro tous les compteurs</p>
                  </div>
                </div>
                <Button variant="destructive" size="sm" className="flex-shrink-0 flex items-center gap-1"
                  disabled={resetStatsMutation.isPending}
                  onClick={() => { if (confirm("Réinitialiser toutes les statistiques ?")) resetStatsMutation.mutate(); }}>
                  <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ===================== DÉPÔTS ===================== */}
        {activeTab === "deposits" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input data-testid="admin-search-deposits" placeholder="Rechercher par numéro ou nom..."
                value={txSearch} onChange={e => setTxSearch(e.target.value)} className="pl-9 bg-white" />
            </div>
            <TxFilterTabs value={depositStatus} onChange={setDepositStatus}
              options={[{ key: "all", label: "Tous" }, { key: "pending", label: "En attente" }, { key: "approved", label: "Approuvés" }, { key: "rejected", label: "Rejetés" }]} />

            {(deposits as any[]).length === 0 ? (
              <Card className="p-6 text-center text-gray-400 text-sm">Aucun dépôt</Card>
            ) : (
              (deposits as any[]).map((tx: any) => (
                <Card key={tx.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-sm">User_{tx.user?.phone}</p>
                      <p className="text-xs text-gray-500">{tx.user?.phone}</p>
                      <p className="text-xs text-gray-500">Pays: {countryCode(tx.country || tx.user?.country)}</p>
                    </div>
                    <StatusBadge status={tx.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-2">
                    <div><span className="text-xs text-gray-400">Montant</span><p className="font-semibold">{formatCFA(tx.amount)}</p></div>
                    <div><span className="text-xs text-gray-400">Moyen</span><p className="font-semibold">{tx.paymentMethod}</p></div>
                    <div><span className="text-xs text-gray-400">Numéro</span><p className="font-semibold">{tx.phoneNumber}</p></div>
                    <div><span className="text-xs text-gray-400">Pays</span><p className="font-semibold">{countryCode(tx.country || tx.user?.country)}</p></div>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">Date et heure<br /><span className="text-gray-600 font-medium">{fmtDate(tx.createdAt)}</span></p>
                  {tx.status === "pending" && (
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" size="sm"
                        onClick={() => updateTxMutation.mutate({ id: tx.id, status: "approved" })}
                        data-testid={`btn-approve-deposit-${tx.id}`}>
                        <Check className="w-4 h-4 mr-1" /> Valider
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1"
                        onClick={() => updateTxMutation.mutate({ id: tx.id, status: "rejected" })}
                        data-testid={`btn-reject-deposit-${tx.id}`}>
                        <X className="w-4 h-4 mr-1" /> Rejeter
                      </Button>
                      <Button size="sm" variant="outline" className="w-10 text-red-500 border-red-200"
                        onClick={() => { updateTxMutation.mutate({ id: tx.id, status: "rejected" }); if (tx.user) updateUserMutation.mutate({ id: tx.user.id, data: { isBanned: true } }); }}
                        data-testid={`btn-ban-deposit-${tx.id}`}>
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* ===================== RETRAITS ===================== */}
        {activeTab === "withdrawals" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input data-testid="admin-search-withdrawals" placeholder="Rechercher par numéro ou nom..."
                value={txSearch} onChange={e => setTxSearch(e.target.value)} className="pl-9 bg-white" />
            </div>
            <TxFilterTabs value={withdrawalStatus} onChange={setWithdrawalStatus}
              options={[{ key: "all", label: "Tous" }, { key: "pending", label: "En attente" }, { key: "processing", label: "En cours" }, { key: "approved", label: "Approuvés" }]} />

            {(withdrawals as any[]).length === 0 ? (
              <Card className="p-6 text-center text-gray-400 text-sm">Aucun retrait</Card>
            ) : (
              (withdrawals as any[]).map((tx: any) => (
                <Card key={tx.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-sm">User_{tx.user?.phone}</p>
                      <p className="text-xs text-gray-500">{tx.user?.phone}</p>
                      <p className="text-xs text-gray-500">Pays: {countryCode(tx.country || tx.user?.country)}</p>
                    </div>
                    <StatusBadge status={tx.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-2">
                    <div><span className="text-xs text-gray-400">Montant demandé</span><p className="font-semibold">{formatCFA(tx.amount)}</p></div>
                    <div><span className="text-xs text-gray-400">Montant net</span><p className="font-semibold text-blue-600">{formatCFA(tx.netAmount || 0)}</p></div>
                    <div><span className="text-xs text-gray-400">Frais</span><p className="font-semibold text-red-500">{formatCFA(tx.fees || 0)}</p></div>
                    <div><span className="text-xs text-gray-400">Moyen</span><p className="font-semibold">{tx.paymentMethod}</p></div>
                  </div>
                  <p className="text-xs text-gray-400 mb-0.5">Numéro de réception</p>
                  <p className="text-sm font-semibold mb-2">{tx.phoneNumber}{tx.accountName ? ` - ${tx.accountName}` : ""}</p>
                  <p className="text-xs text-gray-400 mb-3">Date et heure<br /><span className="text-gray-600 font-medium">{fmtDate(tx.createdAt)}</span></p>
                  {tx.status === "pending" && (
                    <div className="space-y-2">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="sm"
                        onClick={() => toast({ title: "OmniPay", description: "Paiement envoyé via OmniPay" })}>
                        <Zap className="w-4 h-4 mr-2" /> Envoyer via OmniPay
                      </Button>
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" size="sm"
                          onClick={() => updateTxMutation.mutate({ id: tx.id, status: "approved" })}
                          data-testid={`btn-approve-withdrawal-${tx.id}`}>
                          <Check className="w-4 h-4 mr-1" /> Valider
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1"
                          onClick={() => updateTxMutation.mutate({ id: tx.id, status: "rejected" })}
                          data-testid={`btn-reject-withdrawal-${tx.id}`}>
                          <X className="w-4 h-4 mr-1" /> Rejeter
                        </Button>
                        <Button size="sm" variant="outline" className="w-10 text-red-500 border-red-200"
                          onClick={() => { updateTxMutation.mutate({ id: tx.id, status: "rejected" }); if (tx.user) updateUserMutation.mutate({ id: tx.user.id, data: { isBanned: true } }); }}>
                          <Ban className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* ===================== UTILISATEURS ===================== */}
        {activeTab === "users" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input data-testid="admin-search-users" placeholder="Téléphone, code parrainage..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-white" />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-36 bg-white" data-testid="admin-filter-users"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="banned">Bannis</SelectItem>
                  <SelectItem value="blocked">Retrait bloqué</SelectItem>
                  <SelectItem value="promoter">Promoteurs</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredUsers.map((u: any) => (
              <Card key={u.id} className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-sm">{u.phone} {u.nickname && <span className="text-gray-400">({u.nickname})</span>}</p>
                    <p className="text-[10px] text-gray-400">Code: {u.referralCode} | {countryCode(u.country)} | Inscrit: {new Date(u.createdAt).toLocaleDateString("fr-FR")}</p>
                    <p className="text-[10px] text-gray-400">Recharge: {formatCFA(u.depositBalance)} | Retrait: {formatCFA(u.withdrawBalance)}</p>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {u.isBanned && <Badge variant="destructive" className="text-[10px]">Banni</Badge>}
                    {u.isPromoter && <Badge className="text-[10px] bg-yellow-100 text-yellow-800 border-0">Promoteur</Badge>}
                    {u.isAdmin && <Badge className="text-[10px] bg-blue-100 text-blue-800 border-0">Admin</Badge>}
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap mb-1">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedUser(u); loadUserInvestments(u.id); loadUserReferrals(u.id); }} className="text-xs h-7" data-testid={`btn-manage-user-${u.id}`}>
                    <Eye className="w-3 h-3 mr-1" /> Gérer
                  </Button>
                  <Button size="sm" variant={u.isBanned ? "default" : "destructive"} onClick={() => updateUserMutation.mutate({ id: u.id, data: { isBanned: !u.isBanned } })} className="text-xs h-7" data-testid={`btn-ban-user-${u.id}`}>
                    <Ban className="w-3 h-3 mr-1" /> {u.isBanned ? "Débannir" : "Bannir"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateUserMutation.mutate({ id: u.id, data: { withdrawBlocked: !u.withdrawBlocked } })} className="text-xs h-7" data-testid={`btn-block-withdraw-${u.id}`}>
                    {u.withdrawBlocked ? "Débloquer retrait" : "Bloquer retrait"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateUserMutation.mutate({ id: u.id, data: { isPromoter: !u.isPromoter } })} className="text-xs h-7" data-testid={`btn-promoter-${u.id}`}>
                    {u.isPromoter ? "Retirer Promoteur" : "Promoteur"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateUserMutation.mutate({ id: u.id, data: { isAdmin: !u.isAdmin } })} className="text-xs h-7" data-testid={`btn-admin-${u.id}`}>
                    {u.isAdmin ? "Retirer Admin" : "Donner Admin"}
                  </Button>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setTeamModalUser(u); setUserReferrals(null); loadUserReferrals(u.id); }} className="text-xs h-7" data-testid={`btn-team-${u.id}`}>
                  <Users className="w-3 h-3 mr-1" /> Voir l'équipe
                </Button>
              </Card>
            ))}

            {/* User Management Modal */}
            {selectedUser && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
                <Card className="max-w-md w-full p-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="font-bold mb-3">Gérer: {selectedUser.phone}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium">Solde recharge</label>
                      <div className="flex gap-2 mt-1">
                        <Input type="number" placeholder="Nouveau solde recharge" value={editBalance} onChange={e => setEditBalance(e.target.value)} data-testid="admin-edit-balance" />
                        <Button size="sm" onClick={() => { updateUserMutation.mutate({ id: selectedUser.id, data: { depositBalance: parseInt(editBalance) } }); setEditBalance(""); }}>OK</Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Solde retrait</label>
                      <div className="flex gap-2 mt-1">
                        <Input type="number" placeholder="Solde retrait" value={editWithdrawBalance} onChange={e => setEditWithdrawBalance(e.target.value)} data-testid="admin-edit-withdraw-balance" />
                        <Button size="sm" onClick={() => { updateUserMutation.mutate({ id: selectedUser.id, data: { withdrawBalance: parseInt(editWithdrawBalance) } }); setEditWithdrawBalance(""); }}>OK</Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Réinitialiser mot de passe de connexion</label>
                      <div className="flex gap-2 mt-1">
                        <Input type="text" placeholder="Nouveau mot de passe" value={editPassword} onChange={e => setEditPassword(e.target.value)} data-testid="admin-edit-password" />
                        <Button size="sm" onClick={() => { updateUserMutation.mutate({ id: selectedUser.id, data: { password: editPassword } }); setEditPassword(""); }}>OK</Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Modifier mot de passe de retrait</label>
                      <div className="flex gap-2 mt-1">
                        <Input type="text" placeholder="Nouveau mot de passe retrait" value={editTxPassword} onChange={e => setEditTxPassword(e.target.value)} data-testid="admin-edit-tx-password" />
                        <Button size="sm" onClick={() => { updateUserMutation.mutate({ id: selectedUser.id, data: { transactionPassword: editTxPassword } }); setEditTxPassword(""); }}>OK</Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Attribuer plan Fixé 120J</label>
                      <Select value={assignPlan} onValueChange={setAssignPlan}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir un niveau VIP" /></SelectTrigger>
                        <SelectContent>
                          {INVESTMENT_PLANS.fix.plans.map((p: any) => (
                            <SelectItem key={`fix-${p.vip}`} value={`fix-${p.vip}`}>VIP {p.vip} — {formatCFA(p.amount)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" className="mt-2 w-full" onClick={() => {
                        if (!assignPlan) return;
                        const [, vipStr] = assignPlan.split("-");
                        const vipPlan = INVESTMENT_PLANS.fix.plans.find((p: any) => p.vip === parseInt(vipStr));
                        if (vipPlan) assignProductMutation.mutate({ userId: selectedUser.id, plan: { planType: "fix", vipLevel: vipPlan.vip, amount: vipPlan.amount, dailyGain: vipPlan.dailyGain, duration: INVESTMENT_PLANS.fix.duration, totalGain: vipPlan.totalGain } });
                      }} data-testid="admin-assign-product">
                        <Plus className="w-3 h-3 mr-1" /> Attribuer plan fixé
                      </Button>
                    </div>
                    {(adminProducts as any[]).length > 0 && (
                      <div>
                        <label className="text-xs font-medium">Attribuer un produit d'activité</label>
                        <div className="space-y-1 mt-1">
                          {(adminProducts as any[]).filter((p: any) => p.isActive).map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded p-2 text-xs">
                              <span className="font-medium">{p.name} — {formatCFA(p.price)}</span>
                              <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => assignProductMutation.mutate({ userId: selectedUser.id, plan: { planType: "activity", vipLevel: 1, amount: p.price, dailyGain: p.dailyGain, duration: p.cycleDays, totalGain: p.totalGain } })} data-testid={`admin-assign-admin-product-${p.id}`}>
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {userInvestments.length > 0 && (
                      <div>
                        <label className="text-xs font-medium">Produits actifs</label>
                        <div className="space-y-1 mt-1">
                          {userInvestments.map((inv: any) => (
                            <div key={inv.id} className="flex items-center justify-between bg-gray-50 rounded p-2 text-xs">
                              <div><span className="font-medium">{inv.planType}</span> VIP {inv.vipLevel} — {formatCFA(inv.amount)}<Badge variant={inv.status === "active" ? "default" : "secondary"} className="ml-1 text-[9px]">{inv.status}</Badge></div>
                              <Button size="sm" variant="destructive" className="h-6 text-[10px] px-2" onClick={() => deleteInvestmentMutation.mutate(inv.id)} data-testid={`btn-delete-inv-${inv.id}`}><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button variant="outline" onClick={() => setSelectedUser(null)} className="w-full">Fermer</Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Team Modal */}
            {teamModalUser && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setTeamModalUser(null)}>
                <Card className="max-w-md w-full p-4 max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-sm">{teamModalUser.phone}{teamModalUser.nickname ? ` (${teamModalUser.nickname})` : ""}</h3>
                      <p className="text-xs text-gray-400">{(adminCountries as any[]).find((c: any) => c.slug === teamModalUser.country)?.name || teamModalUser.country} · Code: {teamModalUser.referralCode}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setTeamModalUser(null)}>✕</Button>
                  </div>

                  {/* Own stats */}
                  {(() => {
                    const td = (teamOverview as any[]).find((x: any) => x.id === teamModalUser.id);
                    return td ? (
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-green-600 font-medium">Investissement propre</p>
                          <p className="font-bold text-green-800">{formatCFA(td.ownInvested)}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-orange-600 font-medium">Commissions totales</p>
                          <p className="font-bold text-orange-800">{formatCFA(td.commissionBalance)}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-blue-600 font-medium">Invest. total équipe</p>
                          <p className="font-bold text-blue-800">{formatCFA(td.teamTotalInvested)}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-purple-600 font-medium">Total filleuls</p>
                          <p className="font-bold text-purple-800">{td.teamL1 + td.teamL2 + td.teamL3}</p>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {!userReferrals ? (
                    <p className="text-center text-sm text-gray-400 py-4">Chargement de l'équipe...</p>
                  ) : (
                    <div className="space-y-4">
                      {(["level1", "level2", "level3"] as const).map((lvl, idx) => {
                        const members = userReferrals[lvl] || [];
                        if (members.length === 0) return (
                          <div key={lvl}>
                            <p className="text-xs font-semibold text-gray-500 mb-1">Niveau {idx + 1} — 0 filleul</p>
                          </div>
                        );
                        return (
                          <div key={lvl}>
                            <p className="text-xs font-semibold text-gray-500 mb-2">Niveau {idx + 1} — {members.length} filleul(s)</p>
                            <div className="space-y-2">
                              {members.map((ref: any) => {
                                const referred = ref.referred;
                                const td2 = (teamOverview as any[]).find((x: any) => x.id === ref.referredId);
                                return (
                                  <div key={ref.id} className="bg-gray-50 rounded-lg px-3 py-2 text-xs" data-testid={`team-member-${ref.referredId}`}>
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-semibold">{referred?.phone || ref.referredId}</p>
                                        <p className="text-gray-400">{(adminCountries as any[]).find((c: any) => c.slug === referred?.country)?.name || referred?.country} · {referred?.referralCode}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-green-700 font-bold">{formatCFA(td2?.ownInvested || 0)}</p>
                                        <p className="text-gray-400">investi</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-3 mt-1 pt-1 border-t border-gray-200">
                                      <span>Commission: <strong className="text-orange-600">{formatCFA(referred?.commissionBalance || 0)}</strong></span>
                                      <span>Retrait: <strong className="text-blue-600">{formatCFA(referred?.withdrawBalance || 0)}</strong></span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <Button variant="outline" onClick={() => setTeamModalUser(null)} className="w-full mt-4">Fermer</Button>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ===================== PRODUITS ===================== */}
        {activeTab === "products" && (
          <div className="space-y-3">
            {/* Bulk generation */}
            <Card className="p-4 border-blue-200 bg-blue-50">
              <h3 className="font-bold text-sm mb-1 flex items-center gap-2 text-blue-700">
                <Package className="w-4 h-4" /> Génération en lot
              </h3>
              <p className="text-xs text-blue-600 mb-2">Collez votre liste (format 📦 💵 📈 💸 ⏳) puis cliquez Générer.</p>
              <textarea className="w-full border rounded-lg p-2 text-sm min-h-[110px] bg-white resize-y"
                placeholder={"📦 Nom du produit\n💵 Prix : FCFA 5 000\n📈 Revenu quotidien : FCFA 1 100\n💸 Revenu total : FCFA 132 000\n⏳ Temps : 120 jours"}
                value={bulkText} onChange={e => setBulkText(e.target.value)} data-testid="admin-bulk-text" />
              <Button className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleBulkGenerate} data-testid="btn-bulk-generate">
                <Plus className="w-4 h-4 mr-2" /> Générer les produits
              </Button>
            </Card>

            {/* Bulk modal */}
            {bulkShowModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                <Card className="w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
                  <h3 className="font-bold text-base mb-1">Confirmer la génération</h3>
                  <p className="text-sm text-gray-500 mb-3">{bulkParsed.length} produit(s) détecté(s)</p>
                  <div className="space-y-1 mb-4 max-h-48 overflow-y-auto">
                    {bulkParsed.map((p, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-xs">
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-gray-400">{formatCFA(p.price)} · {formatCFA(p.dailyGain)}/j · {p.cycleDays}j</p>
                      </div>
                    ))}
                  </div>
                  <div className="mb-4">
                    <label className="text-xs font-medium flex items-center gap-1 mb-1"><Calendar className="w-3 h-3" /> Date de lancement (optionnel — même pour tous)</label>
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
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Package className="w-4 h-4" /> {editingProduct ? "Modifier" : "Nouveau produit"}</h3>
                <div className="space-y-2">
                  <Input placeholder="Nom du produit" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} data-testid="admin-product-name" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" placeholder="Prix (FCFA)" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} data-testid="admin-product-price" />
                    <Input type="number" placeholder="Gain journalier" value={productForm.dailyGain} onChange={e => setProductForm({ ...productForm, dailyGain: e.target.value })} data-testid="admin-product-daily-gain" />
                    <Input type="number" placeholder="Gain total" value={productForm.totalGain} onChange={e => setProductForm({ ...productForm, totalGain: e.target.value })} data-testid="admin-product-total-gain" />
                    <Input type="number" placeholder="Cycle (jours)" value={productForm.cycleDays} onChange={e => setProductForm({ ...productForm, cycleDays: e.target.value })} data-testid="admin-product-cycle" />
                  </div>
                  <Input type="number" placeholder="Limite d'achat (0 = illimité)" value={productForm.purchaseLimit} onChange={e => setProductForm({ ...productForm, purchaseLimit: e.target.value })} data-testid="admin-product-limit" />
                  <div>
                    <label className="text-xs font-medium flex items-center gap-1"><Calendar className="w-3 h-3" /> Date de lancement</label>
                    <Input type="datetime-local" value={productForm.launchDate} onChange={e => setProductForm({ ...productForm, launchDate: e.target.value })} data-testid="admin-product-launch" />
                  </div>
                  <div>
                    <label className="text-xs font-medium flex items-center gap-1"><Upload className="w-3 h-3" /> Image</label>
                    <input ref={productImageRef} type="file" accept="image/*" className="mt-1 text-sm" onChange={e => setProductImageFile(e.target.files?.[0] || null)} data-testid="admin-product-image" />
                    {editingProduct?.imageUrl && !productImageFile && <img src={editingProduct.imageUrl} alt="Produit" className="mt-2 h-16 object-contain rounded" />}
                  </div>
                  <Select value={String(productForm.isActive)} onValueChange={v => setProductForm({ ...productForm, isActive: v === "true" })}>
                    <SelectTrigger data-testid="admin-product-active"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="true">Actif</SelectItem><SelectItem value="false">Inactif</SelectItem></SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={submitProductForm} disabled={createProductMutation.isPending || updateProductMutation.isPending} data-testid="btn-save-product">
                      <Check className="w-4 h-4 mr-1" /> {editingProduct ? "Enregistrer" : "Créer le produit"}
                    </Button>
                    {editingProduct && <Button variant="outline" onClick={() => { setEditingProduct(null); setShowProductForm(false); resetProductForm(); }}>Annuler</Button>}
                  </div>
                </div>
              </Card>
            )}

            {(adminProducts as any[]).length === 0 ? (
              <Card className="p-6 text-center text-gray-400 text-sm">Aucun produit créé</Card>
            ) : (
              (adminProducts as any[]).map((p: any) => (
                <Card key={p.id} className="p-3">
                  <div className="flex gap-3">
                    {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">{p.name}</p>
                          <p className="text-xs text-gray-400">Prix: {formatCFA(p.price)} | Gain/j: {formatCFA(p.dailyGain)}</p>
                          <p className="text-xs text-gray-400">Total: {formatCFA(p.totalGain)} | {p.cycleDays}j | {p.purchaseCount}/{p.purchaseLimit > 0 ? p.purchaseLimit : "∞"}</p>
                          {p.launchDate && <p className="text-xs text-blue-500">Lancement: {new Date(p.launchDate).toLocaleString("fr-FR")}</p>}
                        </div>
                        <Badge variant={p.isActive ? "default" : "secondary"} className="text-[10px] flex-shrink-0">{p.isActive ? "Actif" : "Inactif"}</Badge>
                      </div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => updateProductMutation.mutate({ id: p.id, formData: (() => { const f = new FormData(); f.append("isActive", String(!p.isActive)); return f; })() })} data-testid={`btn-toggle-product-${p.id}`}>
                          {p.isActive ? "Désactiver" : "Activer"}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => startEditProduct(p)} data-testid={`btn-edit-product-${p.id}`}><Edit2 className="w-3 h-3 mr-1" /> Modifier</Button>
                        <Button size="sm" variant="destructive" className="h-7 text-[10px] px-2" onClick={() => deleteProductMutation.mutate(p.id)} data-testid={`btn-delete-product-${p.id}`}><Trash2 className="w-3 h-3 mr-1" /> Supprimer</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* ===================== CANAUX ===================== */}
        {activeTab === "channels" && (
          <div className="space-y-3">
            <Card className="p-4">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Link2 className="w-4 h-4" /> {editingChannel ? "Modifier le canal" : "Ajouter un canal de recharge"}</h3>
              <div className="space-y-2">
                <Input placeholder="Nom du canal (ex: Wave, Orange Money...)"
                  value={editingChannel ? editingChannel.name : channelForm.name}
                  onChange={e => editingChannel ? setEditingChannel({ ...editingChannel, name: e.target.value }) : setChannelForm({ ...channelForm, name: e.target.value })}
                  data-testid="admin-channel-name" />
                <Select value={editingChannel ? editingChannel.type : channelForm.type}
                  onValueChange={v => editingChannel ? setEditingChannel({ ...editingChannel, type: v }) : setChannelForm({ ...channelForm, type: v })}>
                  <SelectTrigger data-testid="admin-channel-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Lien de paiement</SelectItem>
                    <SelectItem value="leekpay">LeekPay (API automatique)</SelectItem>
                    <SelectItem value="westpay">WestPay / RobotPay (Mobile Money)</SelectItem>
                  </SelectContent>
                </Select>
                {(editingChannel ? editingChannel.type : channelForm.type) === "link" && (
                  <Input placeholder="URL de redirection"
                    value={editingChannel ? editingChannel.redirectUrl || "" : channelForm.redirectUrl}
                    onChange={e => editingChannel ? setEditingChannel({ ...editingChannel, redirectUrl: e.target.value }) : setChannelForm({ ...channelForm, redirectUrl: e.target.value })}
                    data-testid="admin-channel-url" />
                )}
                <div className="flex gap-2">
                  {editingChannel ? (
                    <>
                      <Button className="flex-1" size="sm" onClick={() => updateChannelMutation.mutate({ id: editingChannel.id, data: editingChannel })} data-testid="btn-save-channel"><Check className="w-4 h-4 mr-1" /> Enregistrer</Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingChannel(null)}>Annuler</Button>
                    </>
                  ) : (
                    <Button className="w-full" size="sm" onClick={() => createChannelMutation.mutate(channelForm)} data-testid="btn-add-channel"><Plus className="w-4 h-4 mr-1" /> Ajouter le canal</Button>
                  )}
                </div>
              </div>
            </Card>
            {(channels as any[]).length === 0 ? (
              <Card className="p-6 text-center text-gray-400 text-sm">Aucun canal configuré</Card>
            ) : (
              (channels as any[]).map((ch: any) => (
                <Card key={ch.id} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{ch.name}</p>
                      <p className="text-xs text-gray-400">{ch.type === "leekpay" ? "LeekPay (API)" : ch.type === "westpay" ? "WestPay / RobotPay" : "Lien de paiement"}</p>
                      {ch.redirectUrl && <p className="text-xs text-blue-500 truncate max-w-[180px]">{ch.redirectUrl}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={ch.isActive ? "default" : "secondary"} className="text-[10px]">{ch.isActive ? "Actif" : "Inactif"}</Badge>
                      <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => updateChannelMutation.mutate({ id: ch.id, data: { isActive: !ch.isActive } })} data-testid={`btn-toggle-channel-${ch.id}`}>
                        {ch.isActive ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setEditingChannel({ ...ch })} data-testid={`btn-edit-channel-${ch.id}`}><Edit2 className="w-3 h-3" /></Button>
                      <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => deleteChannelMutation.mutate(ch.id)} data-testid={`btn-delete-channel-${ch.id}`}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* ===================== BILLETS ===================== */}
        {activeTab === "billets" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 text-center">
              {(pendingTickets as any[]).length} billet(s) en attente
            </p>
            {(pendingTickets as any[]).length === 0 ? (
              <Card className="p-6 text-center text-gray-400 text-sm">Aucun billet en attente</Card>
            ) : (
              (pendingTickets as any[]).map((t: any) => (
                <Card key={t.id} className="p-4 space-y-3" data-testid={`card-ticket-${t.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{t.user?.phone || t.userId}</p>
                      <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <Badge className={
                      t.status === "pending" ? "bg-yellow-100 text-yellow-800 border-0 text-xs" :
                      t.status === "approved" ? "bg-green-100 text-green-800 border-0 text-xs" :
                      "bg-red-100 text-red-700 border-0 text-xs"
                    }>{t.status === "pending" ? "En attente" : t.status === "approved" ? "Approuvé" : "Refusé"}</Badge>
                  </div>

                  {t.description && (
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2">{t.description}</p>
                  )}
                  {t.imageUrl && (
                    <img src={t.imageUrl} alt="Capture" className="rounded-lg w-full max-h-48 object-contain bg-gray-100" />
                  )}

                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="Bonus (FCFA)"
                      className="h-8 text-sm"
                      value={ticketBonuses[t.id] || ""}
                      onChange={e => setTicketBonuses(p => ({ ...p, [t.id]: e.target.value }))}
                      data-testid={`input-ticket-bonus-${t.id}`}
                    />
                    <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                      onClick={() => updateTicketMutation.mutate({ id: t.id, status: "approved", bonus: parseInt(ticketBonuses[t.id] || "0") })}
                      data-testid={`btn-approve-ticket-${t.id}`}>
                      <Check className="w-3 h-3 mr-1" /> Approuver
                    </Button>
                    <Button size="sm" variant="destructive" className="h-8 whitespace-nowrap"
                      onClick={() => updateTicketMutation.mutate({ id: t.id, status: "rejected" })}
                      data-testid={`btn-reject-ticket-${t.id}`}>
                      <X className="w-3 h-3 mr-1" /> Refuser
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* ===================== CODES CADEAUX ===================== */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            {/* Create form */}
            <Card className="p-4 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2 text-blue-600"><Award className="w-4 h-4" /> Créer un code cadeau</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-700">Code</label>
                  <Input className="mt-1 uppercase" placeholder="ex: PROMO2025" value={newCode.code}
                    onChange={e => setNewCode(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    data-testid="input-gift-code" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Montant (FCFA)</label>
                  <Input className="mt-1" type="number" placeholder="5000" value={newCode.amount}
                    onChange={e => setNewCode(p => ({ ...p, amount: e.target.value }))}
                    data-testid="input-gift-amount" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Téléphone destinataire (optionnel)</label>
                <Input className="mt-1" placeholder="Laisser vide = tout le monde" value={newCode.recipientPhone}
                  onChange={e => setNewCode(p => ({ ...p, recipientPhone: e.target.value }))}
                  data-testid="input-gift-recipient" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Date d'expiration</label>
                <Input className="mt-1" type="datetime-local" value={newCode.expiresAt}
                  onChange={e => setNewCode(p => ({ ...p, expiresAt: e.target.value }))}
                  data-testid="input-gift-expires" />
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={createGiftCodeMutation.isPending}
                onClick={() => {
                  if (!newCode.code || !newCode.amount || !newCode.expiresAt) return;
                  createGiftCodeMutation.mutate({ code: newCode.code, recipientPhone: newCode.recipientPhone || null, amount: parseInt(newCode.amount), expiresAt: newCode.expiresAt });
                }}
                data-testid="button-create-gift-code">
                <Plus className="w-4 h-4 mr-2" /> Créer le code
              </Button>
            </Card>

            {/* List */}
            <p className="text-xs text-gray-400 text-center">{(giftCodes as any[]).length} code(s) au total</p>
            {(giftCodes as any[]).length === 0 ? (
              <Card className="p-6 text-center text-gray-400 text-sm">Aucun code cadeau créé</Card>
            ) : (
              (giftCodes as any[]).map((gc: any) => (
                <Card key={gc.id} className="p-4" data-testid={`card-gift-code-${gc.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-blue-700 text-sm">{gc.code}</span>
                        {gc.isUsed ? (
                          <Badge className="bg-gray-200 text-gray-600 text-xs">Utilisé</Badge>
                        ) : new Date(gc.expiresAt) < new Date() ? (
                          <Badge className="bg-red-100 text-red-600 text-xs">Expiré</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 text-xs">Actif</Badge>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{formatCFA(gc.amount)}</p>
                      {gc.recipientPhone && <p className="text-xs text-gray-500">Pour: {gc.recipientPhone}</p>}
                      {gc.isUsed && gc.usedBy && <p className="text-xs text-gray-400">Utilisé par: {gc.usedBy}</p>}
                      <p className="text-xs text-gray-400">Expire: {new Date(gc.expiresAt).toLocaleString("fr-FR")}</p>
                    </div>
                    <Button size="sm" variant="outline" className="text-red-500 border-red-200 flex-shrink-0"
                      onClick={() => deleteGiftCodeMutation.mutate(gc.id)}
                      data-testid={`button-delete-gift-${gc.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* ===================== PARAMÈTRES ===================== */}
        {activeTab === "pays" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Gestion des Pays</h3>
              <Button size="sm" onClick={() => { setEditingCountry(null); setCountryForm({ name: "", flag: "", code: "", operators: "", isActive: true }); setShowCountryForm(true); }} data-testid="button-add-country">
                <Plus className="w-4 h-4 mr-1" /> Ajouter
              </Button>
            </div>

            {showCountryForm && (
              <Card className="p-4 space-y-3 border-2 border-blue-200">
                <h4 className="font-semibold text-sm text-blue-700">{editingCountry ? "Modifier le pays" : "Nouveau pays"}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Nom du pays</label>
                    <Input className="mt-1" placeholder="ex: Sénégal" value={countryForm.name}
                      onChange={e => setCountryForm(f => ({ ...f, name: e.target.value }))}
                      data-testid="input-country-name" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Drapeau (emoji)</label>
                    <Input className="mt-1" placeholder="🇸🇳" value={countryForm.flag}
                      onChange={e => setCountryForm(f => ({ ...f, flag: e.target.value }))}
                      data-testid="input-country-flag" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Indicatif téléphonique</label>
                  <Input className="mt-1" placeholder="+221" value={countryForm.code}
                    onChange={e => setCountryForm(f => ({ ...f, code: e.target.value }))}
                    data-testid="input-country-code" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Opérateurs (séparés par des virgules)</label>
                  <Input className="mt-1" placeholder="Orange Money, Wave, MTN" value={countryForm.operators}
                    onChange={e => setCountryForm(f => ({ ...f, operators: e.target.value }))}
                    data-testid="input-country-operators" />
                  <p className="text-xs text-gray-400 mt-1">Ces opérateurs apparaîtront dans le formulaire de carte bancaire des utilisateurs de ce pays</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="country-active" checked={countryForm.isActive}
                    onChange={e => setCountryForm(f => ({ ...f, isActive: e.target.checked }))}
                    data-testid="check-country-active" />
                  <label htmlFor="country-active" className="text-sm text-gray-700">Pays actif (visible sur la plateforme)</label>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setShowCountryForm(false); setEditingCountry(null); }} className="flex-1">Annuler</Button>
                  <Button size="sm" className="flex-1" data-testid="button-save-country"
                    disabled={createCountryMutation.isPending || updateCountryMutation.isPending}
                    onClick={() => {
                      const payload = { name: countryForm.name, flag: countryForm.flag, code: countryForm.code, operators: countryForm.operators, isActive: countryForm.isActive };
                      if (editingCountry) { updateCountryMutation.mutate({ id: editingCountry.id, ...payload }); }
                      else { createCountryMutation.mutate(payload); }
                    }}>
                    <Check className="w-4 h-4 mr-1" /> Enregistrer
                  </Button>
                </div>
              </Card>
            )}

            {(adminCountries as any[]).length === 0 ? (
              <Card className="p-6 text-center text-gray-400 text-sm">Aucun pays configuré</Card>
            ) : (
              (adminCountries as any[]).map((c: any) => (
                <Card key={c.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.flag}</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{c.name} <span className="text-gray-400 font-normal">{c.code}</span></p>
                        <p className="text-xs text-gray-500">{(c.operators || []).join(", ") || "Aucun opérateur"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {c.isActive ? "Actif" : "Inactif"}
                      </Badge>
                      <button title="Modifier" onClick={() => { setEditingCountry(c); setCountryForm({ name: c.name, flag: c.flag || "", code: c.code || "", operators: (c.operators || []).join(", "), isActive: c.isActive }); setShowCountryForm(true); }}
                        data-testid={`button-edit-country-${c.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 text-blue-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button title={c.isActive ? "Désactiver" : "Activer"} onClick={() => updateCountryMutation.mutate({ id: c.id, isActive: !c.isActive })}
                        data-testid={`button-toggle-country-${c.id}`} className="p-1.5 rounded-lg hover:bg-gray-100">
                        {c.isActive ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                      </button>
                      <button title="Supprimer" onClick={() => { if (confirm(`Supprimer ${c.name} ?`)) deleteCountryMutation.mutate(c.id); }}
                        data-testid={`button-delete-country-${c.id}`} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "westpay" && (() => {
          const COUNTRY_KEYS = [
            { slug: "CAMEROUN", label: "🇨🇲 Cameroun", envVar: "WESTPAY_API_KEY_CAMEROUN" },
            { slug: "BENIN", label: "🇧🇯 Bénin", envVar: "WESTPAY_API_KEY_BENIN" },
            { slug: "BURKINA_FASO", label: "🇧🇫 Burkina Faso", envVar: "WESTPAY_API_KEY_BURKINA_FASO" },
            { slug: "TOGO", label: "🇹🇬 Togo", envVar: "WESTPAY_API_KEY_TOGO" },
            { slug: "SENEGAL", label: "🇸🇳 Sénégal", envVar: "WESTPAY_API_KEY_SENEGAL" },
            { slug: "COTE_DIVOIRE", label: "🇨🇮 Côte d'Ivoire", envVar: "WESTPAY_API_KEY_COTE_DIVOIRE" },
            { slug: "MALI", label: "🇲🇱 Mali", envVar: "WESTPAY_API_KEY_MALI" },
          ];

          return (
            <div className="space-y-3">
              {/* Statut général */}
              <Card className="p-4">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" /> Statut WestPay / RobotPay
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Intégration</span>
                    <Badge variant={wpStatus?.enabled ? "default" : "secondary"} className={wpStatus?.enabled ? "bg-green-500" : ""}>
                      {wpStatus?.enabled ? "✓ Activé" : "Non configuré"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Marchand (slug)</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{wpStatus?.merchantSlug || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Clé secrète webhook</span>
                    <Badge variant={wpStatus?.webhookSecretConfigured ? "default" : "secondary"} className={wpStatus?.webhookSecretConfigured ? "bg-green-500" : "bg-orange-400 text-white"}>
                      {wpStatus?.webhookSecretConfigured ? "✓ Configurée" : "⚠ Manquante"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">URL Webhook</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded max-w-[200px] truncate">{window.location.origin}/api/webhook/westpay</span>
                  </div>
                </div>
                {!wpStatus?.webhookSecretConfigured && (
                  <p className="text-xs text-orange-600 bg-orange-50 rounded p-2 mt-2">
                    Ajoutez le secret <strong>WESTPAY_WEBHOOK_SECRET</strong> dans les secrets Replit pour sécuriser les webhooks.
                  </p>
                )}
              </Card>

              {/* Clés API par pays */}
              <Card className="p-4">
                <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-green-500" /> Clés API par pays
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Chaque pays actif nécessite une clé API séparée. Ajoutez-les dans les <strong>Secrets Replit</strong> avec les noms ci-dessous.
                </p>
                <div className="space-y-1">
                  {COUNTRY_KEYS.map(ck => {
                    const configured = wpStatus?.countryApiKeys?.[ck.slug];
                    return (
                      <div key={ck.slug} className="flex items-center justify-between py-2 border-b border-gray-50">
                        <div>
                          <span className="text-sm font-medium">{ck.label}</span>
                          <p className="text-xs font-mono text-gray-400">{ck.envVar}</p>
                        </div>
                        <Badge variant={configured ? "default" : "secondary"} className={configured ? "bg-green-500 text-xs" : "text-xs"}>
                          {configured ? "✓ OK" : "Manquant"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Trouvez vos clés dans le dashboard WestPay → onglet <strong>"Clés API"</strong>. Format : CMR-xxxxxx...
                </p>
              </Card>

              {/* Soldes WestPay */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" /> Soldes WestPay
                  </h3>
                  <Button size="sm" variant="outline" onClick={() => refetchBalances()} disabled={balFetching} data-testid="btn-refresh-balances">
                    {balFetching ? "Chargement..." : "Actualiser"}
                  </Button>
                </div>
                {!wpBalances ? (
                  <p className="text-sm text-gray-400">Cliquez sur "Actualiser" pour charger les soldes.</p>
                ) : wpBalances.length === 0 ? (
                  <p className="text-sm text-gray-400">Aucun solde disponible.</p>
                ) : (
                  <div className="space-y-2">
                    {wpBalances.map((b: any, i: number) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-700">{b.country}</span>
                        <span className="font-bold text-sm text-green-600">{(b.balance || 0).toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          );
        })()}

        {/* ══════════ CHAT ══════════ */}
        {activeTab === "chat" && (
          <div className="flex gap-3" style={{ height: "calc(100vh - 130px)" }}>
            {/* Liste conversations */}
            <div className={`${chatUserId ? "hidden md:flex" : "flex"} flex-col w-full md:w-72 bg-white rounded-xl shadow overflow-hidden`}>
              <div className="px-4 py-3 border-b border-gray-100 font-bold text-sm text-gray-700">
                Conversations {totalUnread > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{totalUnread}</span>}
              </div>
              <div className="flex-1 overflow-y-auto">
                {(chatConversations as any[]).length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-8">Aucune conversation</p>
                )}
                {[...(chatConversations as any[])].sort((a, b) => (b.unreadCount || 0) - (a.unreadCount || 0)).map((conv: any) => {
                  const hasUnread = conv.unreadCount > 0;
                  const isSelected = chatUserId === conv.userId;
                  return (
                    <button
                      key={conv.userId}
                      onClick={() => { setChatUserId(conv.userId); queryClient.invalidateQueries({ queryKey: ["/api/admin/chat", conv.userId, "messages"] }); }}
                      className={`w-full text-left px-4 py-3 border-b flex items-center gap-3 transition-colors relative
                        ${isSelected ? "bg-green-50 border-gray-100" : hasUnread ? "bg-red-50 border-red-100 hover:bg-red-100" : "border-gray-50 hover:bg-gray-50"}`}
                      data-testid={`admin-chat-conv-${conv.userId}`}
                    >
                      {hasUnread && !isSelected && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-r" />
                      )}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${hasUnread ? "bg-red-500" : "bg-[#22c55e]"}`}>
                        {(conv.user?.phone || "?").slice(-2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs truncate ${hasUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                          {conv.user?.phone || conv.userId}
                        </p>
                        <p className={`text-xs truncate ${hasUnread ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                          {conv.lastMessage?.content || (conv.lastMessage?.imageUrl ? "📷 Image" : "")}
                        </p>
                      </div>
                      {hasUnread && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 animate-pulse">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zone messages */}
            {chatUserId ? (
              <div className="flex-1 flex flex-col bg-white rounded-xl shadow overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                  <button onClick={() => setChatUserId(null)} className="md:hidden">
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-[#22c55e] flex items-center justify-center text-white font-bold text-xs">
                    {((chatConversations as any[]).find((c: any) => c.userId === chatUserId)?.user?.phone || "?").slice(-2)}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{(chatConversations as any[]).find((c: any) => c.userId === chatUserId)?.user?.phone || chatUserId}</p>
                    <p className="text-xs text-gray-400">Utilisateur</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50">
                  {(chatMessages as any[]).map((msg: any) => {
                    const isAdmin = msg.senderType === "admin";
                    return (
                      <div key={msg.id} className={`flex ${isAdmin ? "flex-row-reverse" : "flex-row"} gap-2`}>
                        <div className={`max-w-[70%] flex flex-col gap-0.5 ${isAdmin ? "items-end" : "items-start"}`}>
                          {msg.imageUrl && (
                            <a href={msg.imageUrl} target="_blank" rel="noreferrer">
                              <img src={msg.imageUrl} alt="img" className="rounded-xl max-h-40 object-cover shadow" />
                            </a>
                          )}
                          {msg.content && (
                            <div className={`px-3 py-2 rounded-2xl text-xs shadow-sm ${isAdmin ? "bg-[#22c55e] text-white rounded-tr-sm" : "bg-white text-gray-800 rounded-tl-sm"}`}>
                              {msg.content}
                            </div>
                          )}
                          <span className="text-gray-400 text-[10px]">{new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input */}
                <div className="px-3 py-2 border-t border-gray-100 flex items-center gap-2 bg-white">
                  <button onClick={() => chatFileRef.current?.click()} className="text-gray-400 hover:text-[#22c55e]">
                    <Image className="w-5 h-5" />
                  </button>
                  <input ref={chatFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file || !chatUserId) return;
                    const fd = new FormData();
                    fd.append("image", file);
                    sendAdminChatMutation.mutate({ userId: chatUserId, formData: fd });
                    e.target.value = "";
                  }} />
                  <input
                    type="text"
                    value={chatText}
                    onChange={e => setChatText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && chatText.trim() && chatUserId) {
                        const fd = new FormData();
                        fd.append("content", chatText.trim());
                        sendAdminChatMutation.mutate({ userId: chatUserId, formData: fd });
                      }
                    }}
                    placeholder="Répondre..."
                    data-testid="admin-chat-input"
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none"
                  />
                  <button
                    onClick={() => {
                      if (!chatText.trim() || !chatUserId) return;
                      const fd = new FormData();
                      fd.append("content", chatText.trim());
                      sendAdminChatMutation.mutate({ userId: chatUserId, formData: fd });
                    }}
                    disabled={!chatText.trim() || sendAdminChatMutation.isPending}
                    data-testid="admin-chat-send"
                    className="w-8 h-8 bg-[#22c55e] rounded-full flex items-center justify-center disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex flex-1 bg-white rounded-xl shadow items-center justify-center">
                <div className="text-center text-gray-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sélectionnez une conversation</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (() => {
          const sf = settingsForm || {};
          const set = (k: string, v: any) => setSettingsForm((p: any) => ({ ...p, [k]: v }));
          const saving = updateSettingsMutation.isPending;

          const SaveBtn = ({ fields }: { fields: string[] }) => (
            <Button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white" size="sm" disabled={saving}
              onClick={() => {
                const patch: any = {};
                fields.forEach(k => { patch[k] = sf[k]; });
                updateSettingsMutation.mutate(patch);
              }}
              data-testid="btn-save-settings">
              <Check className="w-4 h-4 mr-2" /> {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          );

          return (
            <div className="space-y-4">
              {!settingsForm && <Card className="p-4 text-center text-gray-400 text-sm">Chargement des paramètres...</Card>}

              {/* Recharge */}
              <Card className="p-4 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2 text-blue-600"><Wallet className="w-4 h-4" /> Configuration des recharges</h3>
                <div>
                  <label className="text-xs font-medium text-gray-700">Recharge minimum (FCFA)</label>
                  <Input className="mt-1" type="number" value={sf.depositMinAmount ?? 1000}
                    onChange={e => set("depositMinAmount", parseInt(e.target.value) || 0)}
                    data-testid="admin-setting-depositMinAmount" />
                </div>
                <SaveBtn fields={["depositMinAmount"]} />
              </Card>

              {/* Retraits */}
              <Card className="p-4 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2 text-blue-600"><Clock className="w-4 h-4" /> Configuration des retraits</h3>
                <div>
                  <label className="text-xs font-medium text-gray-700">Retrait minimum (FCFA)</label>
                  <Input className="mt-1" type="number" value={sf.withdrawMinAmount ?? 3500}
                    onChange={e => set("withdrawMinAmount", parseInt(e.target.value) || 0)}
                    data-testid="admin-setting-withdrawMinAmount" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Frais de retrait (%)</label>
                  <Input className="mt-1" type="number" value={sf.withdrawFeePercent ?? 10}
                    onChange={e => set("withdrawFeePercent", parseInt(e.target.value) || 0)}
                    data-testid="admin-setting-withdrawFeePercent" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Heure de début</label>
                    <Input className="mt-1" type="number" min={0} max={23} value={sf.withdrawStartHour ?? 10}
                      onChange={e => set("withdrawStartHour", parseInt(e.target.value) || 0)}
                      data-testid="admin-setting-withdrawStartHour" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Heure de fin</label>
                    <Input className="mt-1" type="number" min={0} max={23} value={sf.withdrawEndHour ?? 15}
                      onChange={e => set("withdrawEndHour", parseInt(e.target.value) || 0)}
                      data-testid="admin-setting-withdrawEndHour" />
                  </div>
                </div>
                <SaveBtn fields={["withdrawMinAmount", "withdrawFeePercent", "withdrawStartHour", "withdrawEndHour"]} />
              </Card>

              {/* Commissions de parrainage */}
              <Card className="p-4 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2 text-blue-600"><Users className="w-4 h-4" /> Commissions de parrainage</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Niveau 1 (%)</label>
                    <Input className="mt-1" type="number" min={0} max={100} value={sf.referralCommission1 ?? 20}
                      onChange={e => set("referralCommission1", parseInt(e.target.value) || 0)}
                      data-testid="admin-setting-commission1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Niveau 2 (%)</label>
                    <Input className="mt-1" type="number" min={0} max={100} value={sf.referralCommission2 ?? 3}
                      onChange={e => set("referralCommission2", parseInt(e.target.value) || 0)}
                      data-testid="admin-setting-commission2" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Niveau 3 (%)</label>
                    <Input className="mt-1" type="number" min={0} max={100} value={sf.referralCommission3 ?? 2}
                      onChange={e => set("referralCommission3", parseInt(e.target.value) || 0)}
                      data-testid="admin-setting-commission3" />
                  </div>
                </div>
                <SaveBtn fields={["referralCommission1", "referralCommission2", "referralCommission3"]} />
              </Card>

              {/* Liens officiels */}
              <Card className="p-4 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2 text-blue-600"><Globe className="w-4 h-4" /> Liens officiels</h3>
                <div>
                  <label className="text-xs font-medium text-gray-700">Groupe officiel (lien)</label>
                  <Input className="mt-1" value={sf.telegramGroup || ""}
                    onChange={e => set("telegramGroup", e.target.value)}
                    data-testid="admin-telegram-group" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Chaîne officielle (lien)</label>
                  <Input className="mt-1" value={sf.telegramChannel || ""}
                    onChange={e => set("telegramChannel", e.target.value)}
                    data-testid="admin-telegram-channel" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Service client (Telegram)</label>
                  <Input className="mt-1" value={sf.telegramService || ""}
                    onChange={e => set("telegramService", e.target.value)}
                    data-testid="admin-telegram-service" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Service client 1 (lien WhatsApp/autre)</label>
                  <Input className="mt-1" placeholder="https://wa.me/..." value={sf.serviceClient1 || ""}
                    onChange={e => set("serviceClient1", e.target.value)}
                    data-testid="admin-service-client1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Service client 2 (lien WhatsApp/autre)</label>
                  <Input className="mt-1" placeholder="https://wa.me/..." value={sf.serviceClient2 || ""}
                    onChange={e => set("serviceClient2", e.target.value)}
                    data-testid="admin-service-client2" />
                </div>
                <SaveBtn fields={["telegramGroup", "telegramChannel", "telegramService", "serviceClient1", "serviceClient2"]} />
              </Card>

              {/* Activités */}
              <Card className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm">Activités d'investissement</h3>
                    <p className="text-xs text-gray-400">Activer/Désactiver les activités</p>
                  </div>
                  <Button size="sm" variant={sf.activitiesEnabled ? "destructive" : "default"}
                    onClick={() => updateSettingsMutation.mutate({ activitiesEnabled: !sf.activitiesEnabled })}
                    data-testid="admin-toggle-activities">
                    {sf.activitiesEnabled ? "Désactiver" : "Activer"}
                  </Button>
                </div>
              </Card>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
