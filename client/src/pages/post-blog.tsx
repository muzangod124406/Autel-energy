import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";

export default function PostBlogPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    if (!content.trim() && !selectedFile) {
      toast({ title: "Erreur", description: "Veuillez saisir un contenu ou une image", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      if (selectedFile) formData.append("image", selectedFile);
      if (content.trim()) formData.append("description", content.trim());
      const res = await fetch("/api/user/tickets", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erreur lors de l'envoi");
      toast({ title: "Envoyé !", description: "Votre publication sera validée par un administrateur" });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      navigate("/billet");
    } catch {
      toast({ title: "Erreur", description: "Erreur lors de l'envoi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-5 space-y-5">
          <div>
            <h3 className="font-bold text-gray-800 text-base mb-2">Contenu</h3>
            <textarea
              data-testid="input-content"
              placeholder="Veuillez saisir le contenu"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={8}
              className="w-full bg-[#f5f5f5] rounded-xl p-3 text-sm text-gray-700 placeholder-gray-400 resize-none outline-none border-none focus:ring-0"
            />
          </div>

          <div>
            <h3 className="font-bold text-gray-800 text-base mb-3">Télécharger des photos</h3>
            <input
              type="file"
              ref={fileRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              data-testid="input-file"
            />
            <button
              data-testid="button-upload"
              onClick={() => fileRef.current?.click()}
              className="w-28 h-28 rounded-xl border-2 border-dashed border-gray-300 bg-[#f5f5f5] flex items-center justify-center overflow-hidden"
            >
              {preview ? (
                <img src={preview} alt="preview" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <ImageIcon className="w-8 h-8 text-teal-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 px-4 pb-6 bg-[#f0f0e4] pt-2">
        <button
          data-testid="button-publish"
          onClick={handlePublish}
          disabled={loading}
          className="w-full h-12 rounded-full bg-[#22c55e] text-white font-bold text-base disabled:opacity-60 shadow-lg"
        >
          {loading ? "Publication..." : "Publish"}
        </button>
      </div>
    </div>
  );
}
