import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Upload, ImagePlus, CheckCircle2, XCircle,
  AlertCircle, X, Send, ChevronDown, ChevronUp,
} from "lucide-react";
import EmptyState from "@/components/empty-state";
import rewardIcon from "@assets/reward_icon_1773608863536.png";

function maskPhone(phone: string) {
  if (!phone || phone.length <= 4) return "****";
  return phone.slice(0, 2) + "****" + phone.slice(-2);
}

export default function BilletPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileRef1 = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [content, setContent] = useState("");
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [preview1, setPreview1] = useState<string | null>(null);
  const [preview2, setPreview2] = useState<string | null>(null);

  const { data: tickets = [] } = useQuery({ queryKey: ["/api/tickets"] });
  const posts = tickets as any[];

  const { data: userTransactions = [] } = useQuery({ queryKey: ["/api/user/transactions"] });
  const txs = userTransactions as any[];
  const hasApprovedWithdrawal = txs.some((t: any) => t.type === "withdrawal" && t.status === "approved");

  const handleFile = (idx: 1 | 2) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      if (idx === 1) { setFile1(file); setPreview1(result); }
      else { setFile2(file); setPreview2(result); }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!file1 || !file2) throw new Error("2 captures d'écran requises");
      const formData = new FormData();
      formData.append("images", file1);
      formData.append("images", file2);
      if (content.trim()) formData.append("description", content.trim());
      const res = await fetch("/api/user/tickets", {
        method: "POST", body: formData, credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");
      return data;
    },
    onSuccess: () => {
      toast({ title: "Publication envoyée ! En attente de validation." });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setFile1(null); setFile2(null); setPreview1(null); setPreview2(null);
      setContent(""); setShowPublish(false);
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const canPublish = !!file1 && !!file2;

  return (
    <div className="min-h-screen pb-28 bg-gray-50">

      {/* Header gold */}
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 pt-10 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white font-extrabold text-xl">Blog SINOPEC</h1>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
            <span className="text-white text-xs font-bold">{posts.length} post{posts.length > 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            data-testid="button-publier"
            onClick={() => setShowPublish(v => !v)}
            className="flex items-center gap-2 bg-white/20 rounded-2xl px-3 py-3 border border-white/20 active:bg-white/30 transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-bold text-sm">Publier</p>
              <p className="text-white/70 text-xs">Partager un retrait</p>
            </div>
            {showPublish ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
          </button>

          <button
            data-testid="button-regles"
            onClick={() => setShowRules(true)}
            className="flex items-center gap-2 bg-white/20 rounded-2xl px-3 py-3 border border-white/20 active:bg-white/30 transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-bold text-sm">Règles</p>
              <p className="text-white/70 text-xs">Conditions</p>
            </div>
          </button>
        </div>
      </div>

      {/* Inline publish form */}
      {showPublish && (
        <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <p className="font-bold text-gray-800 text-sm">Nouvelle publication</p>
            <button onClick={() => setShowPublish(false)} className="text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Conditions checklist */}
          <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-50">
            {[
              { ok: hasApprovedWithdrawal, text: "Avoir au moins un retrait approuvé" },
              { ok: true,                  text: "Une seule publication par jour" },
              { ok: canPublish,            text: "2 captures d'écran importées" },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
                {c.ok
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                <span className={`text-xs ${c.ok ? "text-gray-600" : "text-red-500 font-medium"}`}>{c.text}</span>
              </div>
            ))}
          </div>

          <div className="px-4 py-4 space-y-4">

            {/* Screenshot import — 2 slots */}
            <div>
              <p className="text-gray-700 font-bold text-sm mb-2">
                Captures d'écran <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal text-xs ml-2">(retrait approuvé)</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { idx: 1 as const, ref: fileRef1, preview: preview1, file: file1 },
                  { idx: 2 as const, ref: fileRef2, preview: preview2, file: file2 },
                ]).map(({ idx, ref, preview, file }) => (
                  <div key={idx}>
                    <input type="file" ref={ref} accept="image/*" className="hidden"
                      onChange={handleFile(idx)} data-testid={`input-file-${idx}`} />
                    <button
                      data-testid={`button-upload-${idx}`}
                      onClick={() => ref.current?.click()}
                      className="w-full h-36 rounded-2xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center transition-all relative"
                      style={{ borderColor: preview ? "#10B981" : "#D1D5DB", background: preview ? "#F0FDF4" : "#F9FAFB" }}
                    >
                      {preview ? (
                        <>
                          <img src={preview} alt={`capture ${idx}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-end justify-center pb-2">
                            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              ✓ Capture {idx}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <ImagePlus className="w-7 h-7 text-gray-300 mb-1.5" />
                          <span className="text-gray-400 text-xs font-medium">Capture {idx}</span>
                          <span className="text-gray-300 text-[10px] mt-0.5">Appuyer pour importer</span>
                        </>
                      )}
                    </button>
                    {file && (
                      <button
                        onClick={() => { if (idx === 1) { setFile1(null); setPreview1(null); } else { setFile2(null); setPreview2(null); } }}
                        className="w-full mt-1 text-red-400 text-xs text-center"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Optional text */}
            <div>
              <p className="text-gray-700 font-bold text-sm mb-2">Message <span className="text-gray-400 font-normal">(optionnel)</span></p>
              <textarea
                data-testid="input-content"
                placeholder="Partagez votre expérience avec la communauté..."
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={3}
                className="w-full bg-gray-50 rounded-xl p-3 text-sm text-gray-700 placeholder-gray-300 resize-none outline-none border border-gray-100 focus:border-amber-300 transition-colors"
              />
            </div>

            {/* Publish button */}
            <button
              data-testid="button-publish"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending || !canPublish || !hasApprovedWithdrawal}
              className="w-full py-3.5 rounded-2xl font-bold text-black text-sm disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
            >
              <Send className="w-4 h-4" />
              {publishMutation.isPending ? "Publication en cours..." : "Publier maintenant"}
            </button>
          </div>
        </div>
      )}

      {/* Posts list */}
      <div className="px-4 mt-3 space-y-3">
        {posts.length === 0 ? (
          <EmptyState text="Aucune publication" subtext="Soyez le premier à partager votre retrait et gagner une récompense !" />
        ) : (
          posts.map((post: any) => (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Post header */}
              <div className="flex items-center gap-3 px-4 pt-3 pb-2">
                <div className="w-10 h-10 rounded-xl border-2 border-amber-100 overflow-hidden shrink-0">
                  <img src="/sinopec-logo.jpeg" alt="SINOPEC" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 font-bold text-sm">{maskPhone(post.user?.phone || "")}</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(post.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                {post.bonus > 0 && (
                  <div className="flex items-center gap-1 text-black text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                    +{post.bonus.toLocaleString()} FCFA
                  </div>
                )}
              </div>

              {/* Description */}
              {post.description && (
                <p className="text-sm text-gray-600 px-4 pb-2 leading-relaxed">{post.description}</p>
              )}

              {/* Images */}
              {(post.imageUrl || post.imageUrl2) && (
                <div className={`px-3 pb-3 ${post.imageUrl && post.imageUrl2 ? "grid grid-cols-2 gap-2" : ""}`}>
                  {post.imageUrl && (
                    <a href={post.imageUrl} target="_blank" rel="noreferrer">
                      <img src={post.imageUrl} alt="capture 1" className="w-full h-36 object-cover rounded-xl" />
                    </a>
                  )}
                  {post.imageUrl2 && (
                    <a href={post.imageUrl2} target="_blank" rel="noreferrer">
                      <img src={post.imageUrl2} alt="capture 2" className="w-full h-36 object-cover rounded-xl" />
                    </a>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-50">
                <span className="text-gray-400 text-xs">
                  {new Date(post.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  post.status === "approved" ? "bg-emerald-50 text-emerald-600" :
                  post.status === "rejected" ? "bg-red-50 text-red-500" :
                  "bg-amber-50 text-amber-600"
                }`}>
                  {post.status === "approved" ? "✓ Approuvé" :
                   post.status === "rejected" ? "✗ Rejeté" : "⏳ En attente"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rules modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowRules(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-full bg-white rounded-t-3xl px-6 pt-5 pb-10 shadow-2xl"
            onClick={e => e.stopPropagation()}
            style={{ animation: "slideUp 0.3s ease-out" }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="flex justify-center mb-4">
              <img src={rewardIcon} alt="récompense" className="w-20 h-20 object-contain" />
            </div>
            <h2 className="text-gray-900 font-extrabold text-lg text-center mb-1">Règles de publication</h2>
            <p className="text-gray-400 text-xs text-center mb-5">Partagez vos retraits et recevez une récompense</p>

            <div className="space-y-3 mb-6">
              {[
                { emoji: "✅", title: "Retrait approuvé requis", desc: "Vous devez avoir au moins un retrait approuvé sur votre compte." },
                { emoji: "📅", title: "1 publication par jour", desc: "Une seule publication par jour est autorisée par compte." },
                { emoji: "📸", title: "2 captures d'écran obligatoires", desc: "Importez 2 captures d'écran de votre retrait réussi pour valider la publication." },
                { emoji: "💰", title: "Récompense de 10 à 400 FCFA", desc: "Une fois approuvée par un administrateur, vous recevez immédiatement votre bonus." },
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                  <span className="text-xl">{r.emoji}</span>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{r.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              data-testid="button-compris"
              onClick={() => setShowRules(false)}
              className="w-full py-4 rounded-2xl text-black font-bold text-base"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
