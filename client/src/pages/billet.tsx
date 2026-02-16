import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/bottom-nav";

export default function BilletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: tickets = [], isLoading } = useQuery({ queryKey: ["/api/tickets"] });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (selectedFile) formData.append("image", selectedFile);
      if (description) formData.append("description", description);
      const res = await fetch("/api/user/tickets", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erreur lors de l'envoi");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Envoyé", description: "Votre billet sera validé par un administrateur" });
      setDescription("");
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Erreur lors de l'envoi", variant: "destructive" });
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-4 pt-6">
        <h1 className="text-white text-xl font-bold text-center">Billet</h1>
        <p className="text-white/70 text-sm text-center mt-1">Partagez vos captures d'écran</p>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4">
        <Card className="p-4 mb-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-500" />
            Publier un billet
          </h3>
          <input
            type="file"
            ref={fileRef}
            accept="image/*"
            className="hidden"
            onChange={e => setSelectedFile(e.target.files?.[0] || null)}
          />
          <button
            data-testid="button-upload-image"
            onClick={() => fileRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center gap-2 mb-3 hover:border-blue-400 transition-colors"
          >
            {selectedFile ? (
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-600">{selectedFile.name}</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-xs text-muted-foreground">Cliquez pour télécharger une image</span>
              </>
            )}
          </button>
          <Textarea
            data-testid="input-description"
            placeholder="Description (optionnel)..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="mb-3 text-sm"
          />
          <Button
            data-testid="button-submit-ticket"
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || (!selectedFile && !description)}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white"
          >
            {submitMutation.isPending ? "Envoi..." : "Publier"}
          </Button>
        </Card>

        <h3 className="font-semibold mb-3">Publications approuvées</h3>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
              </Card>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <Card className="p-8 text-center">
            <ImageIcon className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-muted-foreground">Aucune publication pour le moment</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {(tickets as any[]).map((ticket: any) => (
              <Card key={ticket.id} className="overflow-hidden">
                {ticket.imageUrl && (
                  <img src={ticket.imageUrl} alt="Ticket" className="w-full h-48 object-cover" />
                )}
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs text-muted-foreground">
                      {ticket.user?.phone ? `****${ticket.user.phone.slice(-4)}` : "Utilisateur"}
                    </p>
                    {ticket.bonus > 0 && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        +{ticket.bonus} FCFA
                      </Badge>
                    )}
                  </div>
                  {ticket.description && <p className="text-sm">{ticket.description}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(ticket.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
