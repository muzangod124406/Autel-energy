import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ChevronLeft, Volume2, VolumeX } from "lucide-react";

const SEGMENTS = [
  { value: 50,    label: "Cash\nRewards",    color: "#e74c3c" },
  { value: 100,   label: "Cash\nRewards",    color: "#3498db" },
  { value: 200,   label: "Cash\nRewards",    color: "#e67e22" },
  { value: 400,   label: "Cash\nRewards",    color: "#27ae60" },
  { value: 600,   label: "Grand\nPrize",     color: "#9b59b6" },
  { value: 1000,  label: "Cash\nRewards",    color: "#1abc9c" },
  { value: 5000,  label: "Special\nBonus",   color: "#f39c12" },
  { value: 7000,  label: "5 lucky\ndraws",   color: "#2980b9" },
  { value: 77000, label: "2 lucky\ndraws",   color: "#16a085" },
];

const NUM_SEGS = SEGMENTS.length;

const FAKE_PHONES = [
  "22****73","77****09","90****81","65****34","96****47",
  "07****12","55****98","78****54","66****01","44****73",
  "81****70","33****12","70****41","98****23","62****54",
  "51****90","87****63","74****02","43****95","69****10",
];
const FAKE_AMOUNTS = [50, 100, 200, 400, 600, 1000, 5000];

function makeFakeHistory() {
  const now = Date.now();
  return Array.from({ length: 20 }, (_, i) => ({
    phone: FAKE_PHONES[i % FAKE_PHONES.length],
    amount: FAKE_AMOUNTS[Math.floor(Math.random() * FAKE_AMOUNTS.length)],
  }));
}

function HorizontalTicker() {
  const [items] = useState(() => makeFakeHistory());
  const text = items.map(it => `📢 ${it.phone} a retiré avec succès ${it.amount.toLocaleString()} FCFA`).join("   ·   ");

  return (
    <div className="overflow-hidden flex items-center gap-2 py-2 px-3" style={{ background: "rgba(0,0,0,0.25)", borderRadius: 10 }}>
      <Volume2 className="w-4 h-4 text-white shrink-0" />
      <div className="overflow-hidden flex-1">
        <div className="whitespace-nowrap text-white text-xs animate-marquee">
          {text}&nbsp;&nbsp;&nbsp;&nbsp;{text}
        </div>
      </div>
    </div>
  );
}

function drawWheel(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = canvas.width;
  const cx = size / 2, cy = size / 2;
  const outerR = size / 2 - 2;
  const ringR = outerR - 4;
  const segR = ringR - 22;
  const segAngle = (2 * Math.PI) / NUM_SEGS;

  ctx.clearRect(0, 0, size, size);

  // Outer gold ring
  const grad = ctx.createRadialGradient(cx, cy, segR + 4, cx, cy, outerR);
  grad.addColorStop(0, "#f5c842");
  grad.addColorStop(0.5, "#d4a017");
  grad.addColorStop(1, "#b8860b");
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
  ctx.fillStyle = grad;
  ctx.fill();

  // Gold studs
  const numDots = 36;
  for (let i = 0; i < numDots; i++) {
    const angle = (i / numDots) * 2 * Math.PI - Math.PI / 2;
    const r = outerR - 10;
    const dx = cx + r * Math.cos(angle);
    const dy = cy + r * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(dx, dy, 4.5, 0, 2 * Math.PI);
    const dotGrad = ctx.createRadialGradient(dx - 1, dy - 1, 0.5, dx, dy, 4.5);
    dotGrad.addColorStop(0, "#fff7d6");
    dotGrad.addColorStop(1, "#d4a017");
    ctx.fillStyle = dotGrad;
    ctx.fill();
  }

  // Segments
  SEGMENTS.forEach((seg, i) => {
    const startAngle = i * segAngle - Math.PI / 2;
    const endAngle = startAngle + segAngle;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, segR, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Coin icon on segment
    const coinAngle = startAngle + segAngle / 2;
    const coinR = segR * 0.75;
    const cx2 = cx + coinR * Math.cos(coinAngle);
    const cy2 = cy + coinR * Math.sin(coinAngle);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx2, cy2, 8, 0, 2 * Math.PI);
    const coinG = ctx.createRadialGradient(cx2 - 2, cy2 - 2, 1, cx2, cy2, 8);
    coinG.addColorStop(0, "#fff176");
    coinG.addColorStop(1, "#f59e0b");
    ctx.fillStyle = coinG;
    ctx.fill();
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#7c3a0a";
    ctx.font = "bold 7px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", cx2, cy2);
    ctx.restore();

    // Text label
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + segAngle / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 8px Arial";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 2;
    const lines = seg.label.split("\n");
    const textR = segR * 0.43;
    lines.forEach((line, li) => {
      ctx.fillText(line, textR, (li - (lines.length - 1) / 2) * 10);
    });
    ctx.restore();
  });

  // Inner white circle (center hub)
  const hubR = segR * 0.22;
  ctx.beginPath();
  ctx.arc(cx, cy, hubR, 0, 2 * Math.PI);
  const hubGrad = ctx.createRadialGradient(cx - hubR * 0.3, cy - hubR * 0.3, 2, cx, cy, hubR);
  hubGrad.addColorStop(0, "#ffffff");
  hubGrad.addColorStop(1, "#e0e0e0");
  ctx.fillStyle = hubGrad;
  ctx.fill();
  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 2;
  ctx.stroke();
}

export default function GamePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: ticketData } = useQuery({
    queryKey: ["/api/user/spin-tickets"],
    refetchOnMount: true,
    staleTime: 0,
    refetchInterval: 10000,
  });
  const tickets = (ticketData as any)?.tickets ?? user?.spinTickets ?? 0;

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
    canvas.width = 300;
    canvas.height = 300;
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

      setSpinning(true);
      setResult(null);
      setRotation(prev => prev + spins * 360 + targetAngle);

      setTimeout(() => {
        setSpinning(false);
        setResult(winAmount);
        toast({ title: "🎉 Félicitations !", description: `Vous avez gagné FCFA ${winAmount.toLocaleString()}` });
        queryClient.invalidateQueries({ queryKey: ["/api/user/spin-tickets"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        refreshUser();
      }, 4500);
    },
    onError: (e: any) => {
      toast({ title: e.message || "Erreur", variant: "destructive" });
    }
  });

  const handleSpin = () => {
    if (!spinning && tickets > 0) {
      setResult(null);
      spinMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen pb-8" style={{ background: "linear-gradient(160deg, #16a34a 0%, #22c55e 40%, #4ade80 100%)" }}>

      {/* ── Header ─────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-8 pb-4">
        <button data-testid="button-back" onClick={() => navigate("/")}
          className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white font-bold text-lg">Tirage Au Sort</h1>
        <button data-testid="button-music" onClick={toggleMusic}
          className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
          {musicPlaying
            ? <Volume2 className="w-5 h-5 text-white" />
            : <VolumeX className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* ── Ticker horizontal ─────────────── */}
      <div className="mx-4 mb-4">
        <HorizontalTicker />
      </div>

      {/* ── Badge tickets ─────────────────── */}
      <div className="flex justify-center mb-3">
        <div className="bg-red-500 rounded-full px-5 py-1.5 shadow-lg">
          <p className="text-white font-bold text-sm">
            Loterie : {tickets} &nbsp;·&nbsp; Tirez votre chance !
          </p>
        </div>
      </div>

      {/* ── Roue ──────────────────────────── */}
      <div className="flex justify-center relative">
        {/* Flèche pointeur */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
          <div style={{
            width: 0, height: 0,
            borderLeft: "12px solid transparent",
            borderRight: "12px solid transparent",
            borderTop: "26px solid #ef4444",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
          }} />
        </div>

        {/* Canvas roue */}
        <div style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? "transform 4.5s cubic-bezier(0.17,0.67,0.12,0.99)" : "none",
        }}>
          <canvas ref={canvasRef} style={{ width: 300, height: 300 }} />
        </div>

        {/* Bouton GO au centre */}
        <button
          data-testid="button-spin"
          onClick={handleSpin}
          disabled={spinning || tickets <= 0 || spinMutation.isPending}
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: spinning ? "none" : "auto" }}
        >
          <div style={{
            width: 68, height: 68,
            borderRadius: "50%",
            background: spinning
              ? "radial-gradient(circle at 35% 35%, #f87171, #dc2626)"
              : "radial-gradient(circle at 35% 35%, #ff8080, #ef4444)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.35), inset 0 -4px 8px rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "3px solid #fff",
            transition: "transform 0.15s",
            transform: spinning ? "scale(0.95)" : "scale(1)"
          }}>
            <span className="text-white font-extrabold text-xl tracking-wide"
              style={{ textShadow: "0 2px 4px rgba(0,0,0,0.4)" }}>
              GO
            </span>
          </div>
        </button>
      </div>

      {/* ── Résultat ─────────────────────── */}
      <div className="text-center mt-4 min-h-[40px]">
        {spinning && (
          <p className="text-white/80 text-sm animate-pulse">La roue tourne...</p>
        )}
        {result !== null && !spinning && (
          <div className="inline-flex flex-col items-center bg-white/20 rounded-2xl px-6 py-2">
            <p className="text-yellow-300 font-extrabold text-2xl">+ FCFA {result.toLocaleString()}</p>
            <p className="text-white/80 text-xs mt-0.5">Ajouté à votre solde</p>
          </div>
        )}
        {tickets <= 0 && result === null && !spinning && (
          <p className="text-white/70 text-sm">Plus de tickets — achetez un produit pour en gagner</p>
        )}
      </div>

      {/* ── Règles ───────────────────────── */}
      <div className="mx-4 mt-6 bg-white/15 rounded-2xl p-4">
        <h2 className="text-white font-bold text-sm mb-2">Règles de la loterie</h2>
        <p className="text-white/80 text-xs leading-relaxed">
          Règle 1 : Chaque achat d'un produit donne droit à une participation au tirage au sort.
        </p>
        <p className="text-white/80 text-xs leading-relaxed mt-1">
          Règle 2 : Chaque invitation d'un membre valide donne droit à une participation au tirage au sort.
        </p>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 28s linear infinite;
        }
      `}</style>
    </div>
  );
}
