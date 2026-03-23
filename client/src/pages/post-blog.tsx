import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { ArrowLeft, Image as ImageIcon, CheckCircle, XCircle } from "lucide-react";

export default function PostBlogPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const fileRef1 = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [preview1, setPreview1] = useState<string | null>(null);
  const [preview2, setPreview2] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
  };

  const handlePublish = async () => {
    if (!file1 || !file2) {
      toast({ title: "2 captures d'écran requises" });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("images", file1);
      formData.append("images", file2);
      if (content.trim()) formData.append("description", content.trim());
      const res = await fetch("/api/user/tickets", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.message || "Erreur lors de l'envoi" });
        return;
      }
      toast({ title: "Envoyé ! Votre publication sera validée par un administrateur." });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      navigate("/billet");
    } catch {
      toast({ title: "Erreur lors de l'envoi" });
    } finally {
      setLoading(false);
    }
  };

  const conditions = [
    { ok: true, text: "Avoir au moins un retrait approuvé" },
    { ok: true, text: "Une seule publication par jour" },
    { ok: file1 !== null && file2 !== null, text: "Importer 2 captures d'écran de retrait" },
  ];

  return (
    <div className="min-h-screen bg-[#f0f0e4] pb-44">
      <div className="bg-[#22c55e] px-4 pt-6 pb-5">
        <div className="flex items-center">
          <button onClick={() => navigate("/billet")} className="text-white mr-4" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white text-xl font-bold flex-1 text-center mr-9">Publier un blog</h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">

        {/* Conditions */}
        <div className="bg-white rounded-2xl p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Conditions pour publier</h3>
          <div className="space-y-2">
            {conditions.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                {c.ok
                  ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                }
                <span className={`text-xs ${c.ok ? "text-gray-700" : "text-red-500"}`}>{c.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 space-y-5">
          {/* Contenu */}
          <div>
            <h3 className="font-bold text-gray-800 text-base mb-2">Contenu (optionnel)</h3>
            <textarea
              data-testid="input-content"
              placeholder="Veuillez saisir le contenu"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              className="w-full bg-[#f5f5f5] rounded-xl p-3 text-sm text-gray-700 placeholder-gray-400 resize-none outline-none border-none focus:ring-0"
            />
          </div>

          {/* 2 photos */}
          <div>
            <h3 className="font-bold text-gray-800 text-base mb-1">Captures d'écran <span className="text-red-500">*</span></h3>
            <p className="text-xs text-gray-500 mb-3">Importez 2 captures d'écran de votre retrait approuvé</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Image 1 */}
              <div>
                <p className="text-xs text-gray-500 mb-1 text-center">Capture 1</p>
                <input type="file" ref={fileRef1} accept="image/*" className="hidden" onChange={handleFile(1)} data-testid="input-file-1" />
                <button
                  data-testid="button-upload-1"
                  onClick={() => fileRef1.current?.click()}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-gray-300 bg-[#f5f5f5] flex items-center justify-center overflow-hidden"
                >
                  {preview1
                    ? <img src={preview1} alt="preview 1" className="w-full h-full object-cover rounded-xl" />
                    : <ImageIcon className="w-8 h-8 text-teal-500" />
                  }
                </button>
              </div>

              {/* Image 2 */}
              <div>
                <p className="text-xs text-gray-500 mb-1 text-center">Capture 2</p>
                <input type="file" ref={fileRef2} accept="image/*" className="hidden" onChange={handleFile(2)} data-testid="input-file-2" />
                <button
                  data-testid="button-upload-2"
                  onClick={() => fileRef2.current?.click()}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-gray-300 bg-[#f5f5f5] flex items-center justify-center overflow-hidden"
                >
                  {preview2
                    ? <img src={preview2} alt="preview 2" className="w-full h-full object-cover rounded-xl" />
                    : <ImageIcon className="w-8 h-8 text-teal-500" />
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 px-4 pb-6 bg-[#f0f0e4] pt-2">
        <button
          data-testid="button-publish"
          onClick={handlePublish}
          disabled={loading || !file1 || !file2}
          className="w-full h-12 rounded-full bg-[#22c55e] text-white font-bold text-base disabled:opacity-50 shadow-lg"
        >
          {loading ? "Publication..." : "Publier"}
        </button>
      </div>
    </div>
  );
}
