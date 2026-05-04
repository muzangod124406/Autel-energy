import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft, Gift, Sparkles, Star } from "lucide-react";
import giftIcon from "@assets/—Pngtree—vector_gift_icon_3988959_1774170175431.png";

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
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #FFF8E7 0%, #FEF3C7 50%, #FDE68A 100%)" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 pt-10 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/account")} className="text-white" data-testid="button-back-treasure">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-bold text-xl flex-1 text-center pr-6">Cadeau</h1>
        </div>
        {/* Decorative stars */}
        <div className="flex justify-center gap-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-white/60 fill-white/40" />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16 pt-4">

        {success !== null ? (
          /* Success state */
          <div className="text-center w-full max-w-sm">
            <div className="relative mx-auto w-28 h-28 mb-6">
              <div className="absolute inset-0 rounded-full bg-amber-100 animate-ping opacity-30" />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl">
                <span className="text-5xl">🎉</span>
              </div>
            </div>
            <h2 className="text-gray-900 font-extrabold text-2xl mb-1">Félicitations !</h2>
            <p className="text-gray-500 text-sm mb-4">Vous avez reçu un bonus cadeau</p>
            <div className="bg-white rounded-3xl px-8 py-5 shadow-md border border-amber-100 mb-6 mx-auto inline-block">
              <p className="text-amber-500 font-extrabold text-5xl">{success.toLocaleString()}</p>
              <p className="text-gray-400 text-sm font-semibold mt-1">FCFA</p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="w-full py-4 text-black font-bold rounded-2xl shadow-md text-base"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
              data-testid="button-treasure-again"
            >
              Utiliser un autre code
            </button>
          </div>
        ) : (
          /* Main state */
          <div className="text-center w-full max-w-sm">

            {/* Gift box visual */}
            <div className="relative mx-auto mb-6 flex items-center justify-center">
              {/* Glow effect */}
              <div className="absolute w-48 h-48 rounded-full bg-amber-300/30 blur-2xl" />
              {/* Rotating sparkles */}
              <div className="relative">
                {[0,60,120,180,240,300].map((deg, i) => (
                  <div key={i} className="absolute" style={{
                    width: 8, height: 8,
                    top: "50%", left: "50%",
                    transform: `rotate(${deg}deg) translateX(70px) translateY(-50%)`,
                  }}>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                ))}
                <div className="w-36 h-36 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl border-4 border-white">
                  <img src={giftIcon} alt="cadeau" className="w-20 h-20 object-contain" />
                </div>
              </div>
            </div>

            <h2 className="text-gray-900 font-extrabold text-2xl mb-2">Code Cadeau</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Entrez votre code cadeau exclusif pour recevoir un bonus sur votre solde de retrait.
            </p>

            <button
              onClick={() => setShowDialog(true)}
              className="w-full flex items-center justify-center gap-2 text-black font-bold text-base px-8 py-4 rounded-2xl shadow-lg active:scale-95 transition-transform"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
              data-testid="button-open-treasure"
            >
              <Gift className="w-5 h-5" />
              Entrer mon code cadeau
            </button>
          </div>
        )}
      </div>

      {/* Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="pt-7 pb-4 px-6">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                <Gift className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-gray-900 font-bold text-lg text-center mb-1">Code cadeau</h3>
              <p className="text-gray-400 text-xs text-center mb-5">Entrez la clé secrète de votre cadeau</p>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="EX: SINOPEC2024"
                className="w-full border-2 border-gray-200 focus:border-amber-400 rounded-2xl px-4 py-3.5 text-center text-gray-800 text-base bg-gray-50 uppercase font-mono tracking-widest placeholder-gray-300 focus:outline-none transition-colors"
                data-testid="input-gift-code"
                onKeyDown={e => e.key === "Enter" && handleOk()}
              />
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => { setShowDialog(false); setCode(""); }}
                className="flex-1 py-4 text-gray-400 font-semibold text-sm border-r border-gray-100 active:bg-gray-50"
                data-testid="button-cancel-treasure"
              >
                Annuler
              </button>
              <button
                onClick={handleOk}
                disabled={redeemMutation.isPending || !code.trim()}
                className="flex-1 py-4 text-amber-500 font-bold text-sm disabled:opacity-40"
                data-testid="button-ok-treasure"
              >
                {redeemMutation.isPending ? "Vérification..." : "Valider"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
