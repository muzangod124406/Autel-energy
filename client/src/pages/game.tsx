import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { formatCFA } from "@/lib/constants";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import { useLocation } from "wouter";

const SEGMENTS = [
  { value: 0, color: "#ef4444", label: "0" },
  { value: 500, color: "#22c55e", label: "500" },
  { value: 0, color: "#f97316", label: "0" },
  { value: 50, color: "#eab308", label: "50" },
  { value: 0, color: "#ec4899", label: "0" },
  { value: 100, color: "#f59e0b", label: "100" },
  { value: 0, color: "#14b8a6", label: "0" },
  { value: 200, color: "#3b82f6", label: "200" },
  { value: 0, color: "#6366f1", label: "0" },
  { value: 300, color: "#8b5cf6", label: "300" },
];

export default function GamePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: ticketData } = useQuery({ queryKey: ["/api/user/spin-tickets"] });
  const tickets = ticketData?.tickets || user?.spinTickets || 0;

  const spinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/spin");
      return res.json();
    },
    onSuccess: (data: any) => {
      const winAmount = data.amount;
      const segmentIndex = SEGMENTS.findIndex(s => s.value === winAmount);
      const idx = segmentIndex >= 0 ? segmentIndex : 0;
      const segmentAngle = 360 / SEGMENTS.length;
      const targetAngle = 360 - (idx * segmentAngle + segmentAngle / 2);
      const spins = 5 + Math.floor(Math.random() * 3);
      const finalRotation = spins * 360 + targetAngle;

      setSpinning(true);
      setRotation(prev => prev + finalRotation);

      setTimeout(() => {
        setSpinning(false);
        setResult(winAmount);
        if (winAmount > 0) {
          toast({ title: "Félicitations!", description: `Vous avez gagné ${formatCFA(winAmount)}` });
        } else {
          toast({ title: "Pas de chance", description: "Réessayez la prochaine fois!" });
        }
        queryClient.invalidateQueries({ queryKey: ["/api/user/spin-tickets"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        refreshUser();
      }, 4000);
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 5;
    const segAngle = (2 * Math.PI) / SEGMENTS.length;

    SEGMENTS.forEach((seg, i) => {
      const startAngle = i * segAngle - Math.PI / 2;
      const endAngle = startAngle + segAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + segAngle / 2);
      ctx.textAlign = "center";
      ctx.fillStyle = "white";
      ctx.font = "bold 18px sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 3;
      ctx.fillText(seg.label, radius * 0.65, 6);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, 2 * Math.PI);
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 15);
    gradient.addColorStop(0, "#fff");
    gradient.addColorStop(1, "#ddd");
    ctx.fillStyle = gradient;
    ctx.fill();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600">
      <div className="max-w-lg mx-auto px-4 py-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-white mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" /> Retour
        </button>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Roue de la Fortune</h1>
          <p className="text-white/80 text-sm mt-1">Tentez votre chance et gagnez des récompenses !</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <div className="relative flex items-center justify-center">
            <div className="absolute -top-2 z-10">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-yellow-500 drop-shadow-lg" />
            </div>

            <div
              className="transition-transform"
              style={{
                transform: `rotate(${rotation}deg)`,
                transitionDuration: spinning ? "4s" : "0s",
                transitionTimingFunction: "cubic-bezier(0.17, 0.67, 0.12, 0.99)"
              }}
            >
              <canvas ref={canvasRef} className="w-[280px] h-[280px]" />
            </div>
          </div>

          <p className="text-center mt-4 text-sm font-medium">
            Tours disponibles: <span className="font-bold text-lg">{tickets}</span>
          </p>

          {result !== null && !spinning && (
            <div className="text-center mt-2">
              <p className={`text-lg font-bold ${result > 0 ? "text-green-600" : "text-gray-500"}`}>
                {result > 0 ? `+ ${formatCFA(result)}` : "Pas de gain"}
              </p>
            </div>
          )}

          <Button
            data-testid="button-spin"
            onClick={() => {
              setResult(null);
              spinMutation.mutate();
            }}
            disabled={spinning || tickets <= 0 || spinMutation.isPending}
            className="w-full mt-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold"
          >
            {spinning ? "En cours..." : tickets <= 0 ? "Pas de tours disponibles" : "Tourner la roue"}
          </Button>
        </div>

        <div className="bg-white/20 backdrop-blur rounded-xl p-4 mt-4 text-white text-xs space-y-1">
          <p className="font-semibold">Comment obtenir des tours :</p>
          <p>- Invitez un ami qui investit = 1 tour gratuit</p>
          <p>- Achetez un produit d'investissement = 1 tour gratuit</p>
        </div>
      </div>
    </div>
  );
}
