import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft, Gift } from "lucide-react";

export default function TreasurePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [code, setCode] = useState("");
  const [success, setSuccess] = useState<number | null>(null);

  const redeemMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/redeem-gift-code", { code });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setShowDialog(false);
      setSuccess(data.amount);
      setCode("");
    },
    onError: (e: any) => {
      toast({ title: e.message || "Code cadeau invalide", variant: "destructive" });
    },
  });

  const handleOk = () => {
    if (!code.trim()) return;
    redeemMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header gold */}
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => navigate("/account")} className="text-white" data-testid="button-back-treasure">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white font-bold text-lg flex-1 text-center pr-6">Coffre au trésor</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">

        {success !== null ? (
          <div className="text-center bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-full max-w-sm">
            <div className="text-8xl mb-6">🎉</div>
            <p className="text-gray-800 font-bold text-xl mb-2">Félicitations !</p>
            <p className="text-gray-500 text-base mb-1">Vous avez reçu</p>
            <p className="text-amber-500 font-extrabold text-4xl mb-6">{success} FCFA</p>
            <button
              onClick={() => setSuccess(null)}
              className="w-full py-3 text-black font-bold rounded-2xl"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
              data-testid="button-treasure-again"
            >
              Utiliser un autre code
            </button>
          </div>
        ) : (
          <div className="text-center w-full">
            <p className="text-gray-500 font-semibold text-base mb-8">
              Vous avez trouvé un <span className="text-amber-500 font-bold">coffre au trésor</span>
            </p>

            {/* Chest CSS */}
            <div className="relative mx-auto mb-8" style={{ width: 200, height: 160 }}>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="absolute bg-amber-200/40 rounded-full"
                    style={{ width: 3, height: 100, transform: `rotate(${i * 30}deg)`,
                      transformOrigin: "50% 100%", top: "50%", left: "50%",
                      marginLeft: -1.5, marginTop: -100 }} />
                ))}
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 rounded-t-[50%] border-b-0"
                style={{ width: 160, height: 70, top: 10,
                  background: "linear-gradient(180deg, #c0392b 0%, #8B1a1a 100%)",
                  border: "4px solid #F59E0B", borderBottom: "none" }}>
                <div className="absolute left-1/2 -translate-x-1/2 bg-amber-400 rounded"
                  style={{ width: 30, height: 20, bottom: 8 }} />
                <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-amber-300"
                  style={{ width: 10, height: 10, bottom: 13 }} />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 rounded-b-xl"
                style={{ width: 160, height: 80, top: 75,
                  background: "linear-gradient(180deg, #c0392b 0%, #922b21 100%)",
                  border: "4px solid #F59E0B", borderTop: "none" }}>
                <div className="absolute left-1/2 -translate-x-1/2 bg-amber-400 rounded"
                  style={{ width: 20, height: 24, top: 14 }} />
                <div className="absolute left-1/2 -translate-x-1/2 bg-amber-600 rounded-full"
                  style={{ width: 10, height: 10, top: 22 }} />
                <div className="absolute left-0 right-0 bg-amber-400/50" style={{ height: 3, top: 0 }} />
              </div>
            </div>

            <button
              onClick={() => setShowDialog(true)}
              className="inline-flex items-center gap-2 text-black font-bold text-lg px-8 py-3 rounded-2xl shadow-md"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
              data-testid="button-open-treasure"
            >
              <Gift className="w-5 h-5" />
              Ouvrir le trésor
            </button>
          </div>
        )}
      </div>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="px-6 pt-6 pb-4">
              <p className="text-gray-800 font-semibold text-base mb-4 text-center">Entrez la clé secrète</p>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="Code cadeau"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-gray-800 text-base bg-gray-50 uppercase font-mono placeholder-gray-300 focus:outline-none focus:border-amber-400"
                data-testid="input-gift-code"
                onKeyDown={e => e.key === "Enter" && handleOk()}
              />
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => { setShowDialog(false); setCode(""); }}
                className="flex-1 py-3.5 text-gray-500 font-medium text-sm border-r border-gray-100"
                data-testid="button-cancel-treasure"
              >
                Annuler
              </button>
              <button
                onClick={handleOk}
                disabled={redeemMutation.isPending || !code.trim()}
                className="flex-1 py-3.5 text-amber-500 font-bold text-sm disabled:opacity-50"
                data-testid="button-ok-treasure"
              >
                {redeemMutation.isPending ? "..." : "Valider"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
