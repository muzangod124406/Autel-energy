import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import backIcon from "@assets/back_1773610656109.png";
import musicIcon from "@assets/music_1773610656200.png";
import luckySignImg from "@assets/img_2_1773610656230.png";
import myPrizesImg from "@assets/img_4_1773610656263.png";
import startBtnImg from "@assets/img13_1773610656306.png";

const SEGMENTS = [
  { value: 50,    label: "FCFA50" },
  { value: 100,   label: "FCFA100" },
  { value: 200,   label: "FCFA200" },
  { value: 400,   label: "FCFA400" },
  { value: 600,   label: "FCFA600" },
  { value: 1000,  label: "FCFA1000" },
  { value: 5000,  label: "FCFA5000" },
  { value: 7000,  label: "FCFA7000" },
  { value: 77000, label: "FCFA77000" },
];

const PRIZE_LABELS: Record<number, string> = {
  50: "Lucky Bonus-50",
  100: "Lucky Bonus-100",
  200: "Lucky Bonus-200",
  400: "Lucky Bonus-400",
  600: "Lucky Bonus-600",
  1000: "Lucky Bonus-1000",
  5000: "Lucky Bonus-5000",
  7000: "Lucky Bonus-7000",
  77000: "Lucky Bonus-77000",
};

const NUM_SEGS = SEGMENTS.length;
const COLORS_A = "#2563eb";
const COLORS_B = "#c9a46e";
const TEXT_A = "#ffffff";
const TEXT_B = "#7c3a0a";

function drawWheel(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const dotRingR = outerR - 20;
  const segR = dotRingR - 6;
  const segAngle = (2 * Math.PI) / NUM_SEGS;

  ctx.clearRect(0, 0, size, size);

  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
  ctx.fillStyle = "#1a3a8f";
  ctx.fill();

  const numDots = 32;
  for (let i = 0; i < numDots; i++) {
    const angle = (i / numDots) * 2 * Math.PI - Math.PI / 2;
    const dx = cx + (outerR - 12) * Math.cos(angle);
    const dy = cy + (outerR - 12) * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(dx, dy, 5, 0, 2 * Math.PI);
    ctx.fillStyle = i % 2 === 0 ? "#f59e0b" : "#ffffff";
    ctx.fill();
  }

  SEGMENTS.forEach((seg, i) => {
    const startAngle = i * segAngle - Math.PI / 2;
    const endAngle = startAngle + segAngle;
    const isBlue = i % 2 === 0;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, segR, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = isBlue ? COLORS_A : COLORS_B;
    ctx.fill();
    ctx.strokeStyle = "#1a3a8f";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + segAngle / 2);
    ctx.textAlign = "center";
    ctx.fillStyle = isBlue ? TEXT_A : TEXT_B;
    ctx.font = "bold 9px Arial";
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 2;
    const textR = segR * 0.58;
    const lines = seg.label.split(/(?<=CFA)/);
    if (lines.length > 1) {
      ctx.fillText(lines[0], textR, -4);
      ctx.fillText(lines[1], textR, 8);
    } else {
      ctx.fillText(seg.label, textR, 4);
    }
    ctx.restore();
  });
}

export default function GamePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [showPrizes, setShowPrizes] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: ticketData } = useQuery({ queryKey: ["/api/user/spin-tickets"] });
  const tickets = (ticketData as any)?.tickets ?? user?.spinTickets ?? 0;

  const { data: history } = useQuery({ queryKey: ["/api/spin-history"] });
  const spinHistory = (history as any[]) || [];

  useEffect(() => {
    audioRef.current = new Audio("/game-music.m4a");
    audioRef.current.loop = true;
    return () => { audioRef.current?.pause(); };
  }, []);

  const toggleMusic = useCallback(() => {
    if (!audioRef.current) return;
    if (musicPlaying) {
      audioRef.current.pause();
      setMusicPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setMusicPlaying(true);
    }
  }, [musicPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = 280;
    canvas.width = size;
    canvas.height = size;
    drawWheel(canvas);
  }, []);

  const spinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/spin");
      return res.json();
    },
    onSuccess: (data: any) => {
      const winAmount = data.amount;
      const idx = SEGMENTS.findIndex(s => s.value === winAmount);
      const segI = idx >= 0 ? idx : 0;
      const segAngle = 360 / NUM_SEGS;
      const targetAngle = 360 - (segI * segAngle + segAngle / 2);
      const spins = 5 + Math.floor(Math.random() * 3);
      const finalRotation = spins * 360 + targetAngle;

      setSpinning(true);
      setResult(null);
      setRotation(prev => prev + finalRotation);

      setTimeout(() => {
        setSpinning(false);
        setResult(winAmount);
        if (winAmount > 0) {
          toast({ title: "Félicitations!", description: `Vous avez gagné FCFA${winAmount.toFixed(2)}` });
        }
        queryClient.invalidateQueries({ queryKey: ["/api/user/spin-tickets"] });
        queryClient.invalidateQueries({ queryKey: ["/api/spin-history"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        refreshUser();
      }, 4500);
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur", variant: "destructive" });
    }
  });

  return (
    <div className="min-h-screen pb-6" style={{ background: "#22c55e" }}>
      <div className="relative flex items-center justify-between px-4 pt-6 pb-2">
        <button
          data-testid="button-back"
          onClick={() => navigate("/")}
          className="w-10 h-10 rounded-full bg-gray-700/80 flex items-center justify-center"
        >
          <img src={backIcon} alt="retour" className="w-6 h-6 object-contain" />
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 top-2">
          <img src={luckySignImg} alt="Lucky spinning" className="h-24 object-contain" />
        </div>

        <button
          data-testid="button-music"
          onClick={toggleMusic}
          className="w-10 h-10 rounded-full bg-[#1a6b3a] flex items-center justify-center relative"
        >
          <img
            src={musicIcon}
            alt="music"
            className={`w-6 h-6 object-contain ${musicPlaying ? "animate-spin" : ""}`}
            style={{ animationDuration: "3s" }}
          />
          {!musicPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-[1px] h-10 bg-white/80 rotate-45" />
            </div>
          )}
        </button>
      </div>

      <div className="flex flex-col items-center px-4 mt-6 relative">
        <div className="relative">
          <div
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
            }}
          >
            <canvas ref={canvasRef} className="w-[280px] h-[280px]" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-0 h-0 absolute -top-3"
              style={{
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderBottom: "20px solid #dc2626",
              }}
            />
          </div>

          <button
            data-testid="button-spin"
            onClick={() => { if (!spinning && tickets > 0) { setResult(null); spinMutation.mutate(); } }}
            disabled={spinning || tickets <= 0 || spinMutation.isPending}
            className="absolute inset-0 flex items-center justify-center"
          >
            <img
              src={startBtnImg}
              alt="Start"
              className={`w-16 h-16 object-contain ${spinning ? "opacity-60" : "hover:scale-105"} transition-transform`}
            />
          </button>

          <button
            data-testid="button-my-prizes"
            onClick={() => setShowPrizes(p => !p)}
            className="absolute -bottom-4 -right-4"
          >
            <img src={myPrizesImg} alt="My prizes" className="w-16 h-16 object-contain" />
          </button>
        </div>

        <p className="text-white mt-8 text-sm text-center">
          Vous avez{" "}
          <span className="font-bold text-yellow-300 text-base">{tickets}</span>{" "}
          chance{tickets !== 1 ? "s" : ""} de participer à la loterie
        </p>

        {result !== null && !spinning && (
          <div className="mt-2 text-center">
            <p className="text-yellow-300 font-bold text-lg">
              + FCFA{result.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      <div className="mx-4 mt-10">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#f5e6cc", border: "3px solid #d4944a" }}
        >
          <div className="py-3 text-center border-b border-[#d4944a]">
            <h2 className="text-red-600 font-bold text-xl">Prize Display</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 p-3">
            {SEGMENTS.map(seg => (
              <div
                key={seg.value}
                className="rounded-xl p-3 flex flex-col items-center gap-2"
                style={{ background: "#f0d8b0", border: "2px solid #c9a46e" }}
                data-testid={`prize-card-${seg.value}`}
              >
                <div
                  className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl font-bold"
                  style={{ background: "#fcebd0" }}
                >
                  {seg.value >= 10000 ? "🏆" : seg.value >= 1000 ? "💎" : seg.value >= 400 ? "🎁" : "🎯"}
                </div>
                <p className="text-gray-800 font-bold text-sm text-center">{PRIZE_LABELS[seg.value]}</p>
                <p className="text-red-600 font-bold text-sm">FCFA{seg.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4">
        <div className="rounded-2xl p-4" style={{ background: "#1a6b3a" }}>
          <h2 className="text-white font-bold text-base mb-3">Historique des tirages au sort</h2>
          {spinHistory.length === 0 ? (
            <p className="text-green-200 text-sm text-center py-4">Aucun tirage récent</p>
          ) : (
            <div className="space-y-0">
              {spinHistory.map((item: any, i: number) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-3 border-b border-dashed border-green-600"
                  data-testid={`history-item-${i}`}
                >
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-yellow-300 shrink-0">
                    👑
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{item.phone}</p>
                    <p className="text-red-400 text-xs">
                      {PRIZE_LABELS[item.amount] || `Lucky Bonus`} FCFA{Number(item.amount).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-green-300 text-xs shrink-0">
                    {new Date(item.createdAt).toLocaleString("fr-FR", {
                      year: "numeric", month: "2-digit", day: "2-digit",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-4 mt-4 bg-white rounded-2xl p-4">
        <h2 className="font-bold text-base mb-2">Règles de la loterie</h2>
        <p className="text-sm text-gray-500 mb-2">Sweepstakes Rules</p>
        <p className="text-sm text-gray-700">
          Règle 1 : Chaque achat d'un produit donne droit à une participation au tirage au sort
        </p>
        <p className="text-sm text-gray-700 mt-1">
          Règle 2 : Chaque invitation d'un membre valide donne droit à une participation au tirage au sort
        </p>
      </div>
    </div>
  );
}
