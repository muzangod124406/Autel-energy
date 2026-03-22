import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TreasurePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [code, setCode] = useState("");
  const [success, setSuccess] = useState<number | null>(null);

  const redeemMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/redeem-gift-code", { code });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setShowDialog(false);
      setSuccess(data.amount);
      setCode("");
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    },
  });

  const handleOk = () => {
    if (!code.trim()) return;
    redeemMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #fffde7 0%, #fff8e1 100%)" }}>

      {/* ── Header vert ─────────────────────────── */}
      <div className="bg-[#22c55e] px-4 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => navigate("/account")} className="text-white" data-testid="button-back-treasure">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white font-bold text-lg flex-1 text-center pr-6">Coffre au trésor</h1>
      </div>

      {/* ── Corps ───────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">

        {success !== null ? (
          /* ── Succès ──────────────────────────── */
          <div className="text-center">
            <div className="text-8xl mb-6">🎉</div>
            <p className="text-orange-600 font-bold text-xl mb-2">Félicitations !</p>
            <p className="text-gray-700 text-base mb-1">Vous avez reçu</p>
            <p className="text-[#22c55e] font-extrabold text-4xl mb-6">{success} FCFA</p>
            <button
              onClick={() => setSuccess(null)}
              className="bg-[#22c55e] text-white font-bold px-8 py-3 rounded-2xl"
              data-testid="button-treasure-again"
            >
              Utiliser un autre code
            </button>
          </div>
        ) : (
          /* ── Coffre ──────────────────────────── */
          <div className="text-center w-full">
            <p className="text-orange-600 font-semibold text-base mb-8">
              <span className="text-[#22c55e] font-bold">Vous</span> avez trouvé un coffre au trésor
            </p>

            {/* Coffre dessiné en CSS */}
            <div className="relative mx-auto mb-8" style={{ width: 200, height: 160 }}>
              {/* Rayons de lumière */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute bg-yellow-200/60 rounded-full"
                    style={{
                      width: 3,
                      height: 100,
                      transform: `rotate(${i * 30}deg)`,
                      transformOrigin: "50% 100%",
                      top: "50%",
                      left: "50%",
                      marginLeft: -1.5,
                      marginTop: -100,
                    }}
                  />
                ))}
              </div>

              {/* Couvercle */}
              <div
                className="absolute left-1/2 -translate-x-1/2 rounded-t-[50%] border-b-0"
                style={{
                  width: 160,
                  height: 70,
                  top: 10,
                  background: "linear-gradient(180deg, #c0392b 0%, #8B1a1a 100%)",
                  border: "4px solid #f0a500",
                  borderBottom: "none",
                }}
              >
                {/* Déco couvercle */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 bg-yellow-400 rounded"
                  style={{ width: 30, height: 20, bottom: 8 }}
                />
                <div
                  className="absolute left-1/2 -translate-x-1/2 rounded-full bg-yellow-300"
                  style={{ width: 10, height: 10, bottom: 13 }}
                />
              </div>

              {/* Corps du coffre */}
              <div
                className="absolute left-1/2 -translate-x-1/2 rounded-b-xl"
                style={{
                  width: 160,
                  height: 80,
                  top: 75,
                  background: "linear-gradient(180deg, #c0392b 0%, #922b21 100%)",
                  border: "4px solid #f0a500",
                  borderTop: "none",
                }}
              >
                {/* Serrure */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 bg-yellow-400 rounded"
                  style={{ width: 20, height: 24, top: 14 }}
                />
                <div
                  className="absolute left-1/2 -translate-x-1/2 bg-yellow-600 rounded-full"
                  style={{ width: 10, height: 10, top: 22 }}
                />
                {/* Bande dorée horizontale */}
                <div
                  className="absolute left-0 right-0 bg-yellow-400/50"
                  style={{ height: 3, top: 0 }}
                />
              </div>
            </div>

            <button
              onClick={() => setShowDialog(true)}
              className="text-orange-500 font-bold text-lg underline underline-offset-2"
              data-testid="button-open-treasure"
            >
              Ouvrir le trésor →
            </button>
          </div>
        )}
      </div>

      {/* ── Dialogue code secret ─────────────────── */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl w-72 overflow-hidden shadow-xl">
            <div className="px-6 pt-6 pb-4 text-center">
              <p className="text-gray-800 font-semibold text-base mb-4">Entrez la clé secrète</p>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Code cadeau"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-gray-800 text-sm focus:outline-none focus:border-[#22c55e]"
                data-testid="input-gift-code"
                onKeyDown={e => e.key === "Enter" && handleOk()}
              />
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => { setShowDialog(false); setCode(""); }}
                className="flex-1 py-3.5 text-gray-600 font-medium text-sm border-r border-gray-100"
                data-testid="button-cancel-treasure"
              >
                Annuler
              </button>
              <button
                onClick={handleOk}
                disabled={redeemMutation.isPending || !code.trim()}
                className="flex-1 py-3.5 text-[#22c55e] font-bold text-sm disabled:opacity-50"
                data-testid="button-ok-treasure"
              >
                {redeemMutation.isPending ? "..." : "Ok"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
