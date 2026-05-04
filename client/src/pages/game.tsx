import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ChevronLeft, Volume2, VolumeX, Ticket, Gift } from "lucide-react";

const SEGMENTS = [
  { value: 50,  label: "50",  color: "#F59E0B", dark: "#D97706", prob: "70%" },
  { value: 100, label: "100", color: "#10B981", dark: "#047857", prob: "20%" },
  { value: 200, label: "200", color: "#6366F1", dark: "#4338CA", prob: "10%" },
];

const NUM_SEGS = SEGMENTS.length;

const FAKE_PHONES = [
  "22****73","77****09","90****81","65****34","96****47",
  "07****12","55****98","78****54","66****01","44****73",
  "81****70","33****12","70****41","98****23","62****54",
];
const FAKE_AMOUNTS = [50, 100, 200];

function makeFakeHistory() {
  return Array.from({ length: 15 }, (_, i) => ({
    phone: FAKE_PHONES[i % FAKE_PHONES.length],
    amount: FAKE_AMOUNTS[Math.floor(Math.random() * FAKE_AMOUNTS.length)],
  }));
}

function HorizontalTicker() {
  const [items] = useState(() => makeFakeHistory());
  const text = items.map(it => `🎉 ${it.phone} → ${it.amount.toLocaleString()} FCFA`).join("   ·   ");
  return (
    <div className="overflow-hidden flex items-center gap-2 py-2 px-3 rounded-xl" style={{ background: "rgba(0,0,0,0.25)" }}>
      <Volume2 className="w-3.5 h-3.5 text-white/70 shrink-0" />
      <div className="overflow-hidden flex-1">
        <div className="whitespace-nowrap text-white/90 text-xs animate-marquee font-medium">
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
  const ringR  = outerR - 6;
  const segR   = ringR - 20;
  const segAngle = (2 * Math.PI) / NUM_SEGS;

  ctx.clearRect(0, 0, size, size);

  // Outer dark ring
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
  ctx.fillStyle = "#1A1A2E";
  ctx.fill();

  // Gold ring
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#FFD700");
  grad.addColorStop(0.3, "#FFA500");
  grad.addColorStop(0.6, "#FFD700");
  grad.addColorStop(1, "#DAA520");
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, 2 * Math.PI);
  ctx.fillStyle = grad;
  ctx.fill();

  // Gold studs on ring
  const numDots = 36;
  for (let i = 0; i < numDots; i++) {
    const angle = (i / numDots) * 2 * Math.PI - Math.PI / 2;
    const r = ringR - 10;
    const dx = cx + r * Math.cos(angle);
    const dy = cy + r * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(dx, dy, 4, 0, 2 * Math.PI);
    const dg = ctx.createRadialGradient(dx - 1, dy - 1, 0.5, dx, dy, 4);
    dg.addColorStop(0, "#FFFDE7");
    dg.addColorStop(1, "#B8860B");
    ctx.fillStyle = dg;
    ctx.fill();
  }

  // Segments (3 segments, 120° each)
  SEGMENTS.forEach((seg, i) => {
    const startAngle = i * segAngle - Math.PI / 2;
    const endAngle   = startAngle + segAngle;

    const midAngle = startAngle + segAngle / 2;
    const gx1 = cx + (segR * 0.3) * Math.cos(midAngle);
    const gy1 = cy + (segR * 0.3) * Math.sin(midAngle);
    const gx2 = cx + segR * Math.cos(midAngle);
    const gy2 = cy + segR * Math.sin(midAngle);
    const segGrad = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
    segGrad.addColorStop(0, seg.color + "EE");
    segGrad.addColorStop(1, seg.dark + "CC");

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, segR, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = segGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Divider line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + segR * Math.cos(startAngle), cy + segR * Math.sin(startAngle));
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Label text
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + segAngle / 2);

    const textR = segR * 0.58;
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 5;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(seg.label, textR, -6);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "bold 10px Arial";
    ctx.fillText("FCFA", textR, 8);

    // Probability
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "9px Arial";
    ctx.fillText(seg.prob, textR, 20);

    ctx.restore();
  });

  // Inner shadow ring
  const shadowGrad = ctx.createRadialGradient(cx, cy, segR - 8, cx, cy, segR);
  shadowGrad.addColorStop(0, "transparent");
  shadowGrad.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.beginPath();
  ctx.arc(cx, cy, segR, 0, 2 * Math.PI);
  ctx.fillStyle = shadowGrad;
  ctx.fill();

  // Center hub
  const hubR = segR * 0.22;
  const hubGrad = ctx.createRadialGradient(cx - hubR * 0.3, cy - hubR * 0.3, 2, cx, cy, hubR);
  hubGrad.addColorStop(0, "#FFFFFF");
  hubGrad.addColorStop(0.6, "#F3F4F6");
  hubGrad.addColorStop(1, "#D1D5DB");
  ctx.beginPath();
  ctx.arc(cx, cy, hubR, 0, 2 * Math.PI);
  ctx.fillStyle = hubGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
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
    refetchInterval: 30000,
  });
  const tickets = (ticketData as any)?.tickets ?? user?.spinTickets ?? 0;

  useEffect(() => {
    audioRef.current = new Audio("/game-music.m4a");
    audioRef.current.loop = true;
    return () => { audioRef.current?.pause(); };
  }, []);

  const toggleMusic = useCallback(() => {
    if (!audioRef.current) return;
    if (musicPlaying) { audioRef.current.pause(); setMusicPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setMusicPlaying(true); }
  }, [musicPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 320;
    canvas.height = 320;
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
    if (!spinning && tickets > 0) { setResult(null); spinMutation.mutate(); }
  };

  return (
    <div className="min-h-screen pb-8 flex flex-col" style={{ background: "linear-gradient(160deg, #0F0F1A 0%, #1A1A2E 40%, #16213E 100%)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-3">
        <button data-testid="button-back" onClick={() => navigate("/")}
          className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center">
          <h1 className="text-white font-extrabold text-lg tracking-wide">Tirage Au Sort</h1>
          <p className="text-amber-400 text-xs font-semibold">SINOPEC LUCKY DRAW</p>
        </div>
        <button data-testid="button-music" onClick={toggleMusic}
          className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
          {musicPlaying ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5 text-white/50" />}
        </button>
      </div>

      {/* Ticker */}
      <div className="mx-4 mb-3">
        <HorizontalTicker />
      </div>

      {/* Ticket badge */}
      <div className="flex justify-center mb-4">
        <div className="flex items-center gap-2 px-5 py-2 rounded-full border border-amber-400/40"
          style={{ background: "rgba(245,158,11,0.15)" }}>
          <Ticket className="w-4 h-4 text-amber-400" />
          <p className="text-amber-300 font-bold text-sm">
            {tickets} ticket{tickets > 1 ? "s" : ""} disponible{tickets > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Wheel + needle */}
      <div className="flex justify-center relative mb-2">

        {/* Outer glow ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[340px] h-[340px] rounded-full"
            style={{ boxShadow: "0 0 40px rgba(245,158,11,0.35), 0 0 80px rgba(245,158,11,0.15)" }} />
        </div>

        {/* Needle at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 flex flex-col items-center">
          <div style={{
            width: 0, height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: "28px solid #EF4444",
            filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.5))"
          }} />
          <div className="w-4 h-4 rounded-full bg-red-500 -mt-1 border-2 border-white"
            style={{ boxShadow: "0 2px 8px rgba(239,68,68,0.6)" }} />
        </div>

        {/* Rotating wheel */}
        <div style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? "transform 4.5s cubic-bezier(0.17,0.67,0.12,0.99)" : "none",
        }}>
          <canvas ref={canvasRef} style={{ width: 320, height: 320 }} />
        </div>

        {/* Center GO button */}
        <button
          data-testid="button-spin"
          onClick={handleSpin}
          disabled={spinning || tickets <= 0 || spinMutation.isPending}
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: spinning ? "none" : "auto" }}
        >
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            background: spinning
              ? "radial-gradient(circle at 35% 35%, #6B7280, #374151)"
              : "radial-gradient(circle at 35% 35%, #FCD34D, #F59E0B)",
            boxShadow: spinning
              ? "0 2px 8px rgba(0,0,0,0.4)"
              : "0 4px 20px rgba(245,158,11,0.6), inset 0 -3px 6px rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "3px solid rgba(255,255,255,0.8)",
            transition: "all 0.2s",
          }}>
            <span className="font-extrabold text-base text-white"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
              {spinning ? "..." : "GO"}
            </span>
          </div>
        </button>
      </div>

      {/* Result */}
      <div className="text-center min-h-[56px] flex items-center justify-center px-4">
        {spinning && (
          <p className="text-amber-300/80 text-sm animate-pulse font-medium">La roue tourne... 🎰</p>
        )}
        {result !== null && !spinning && (
          <div className="inline-flex flex-col items-center rounded-2xl px-8 py-3 border border-amber-400/30"
            style={{ background: "rgba(245,158,11,0.15)" }}>
            <p className="text-amber-300 font-extrabold text-3xl">+{result.toLocaleString()} FCFA</p>
            <p className="text-white/60 text-xs mt-0.5">Ajouté à votre solde de retrait ✓</p>
          </div>
        )}
        {tickets <= 0 && result === null && !spinning && (
          <div className="bg-white/5 rounded-2xl px-5 py-3 border border-white/10">
            <p className="text-white/60 text-sm text-center">Plus de tickets disponibles</p>
            <p className="text-amber-400 text-xs text-center mt-1">Achetez un produit ou invitez des amis</p>
          </div>
        )}
      </div>

      {/* Prizes legend */}
      <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
        {SEGMENTS.map(seg => (
          <div key={seg.value}
            className="flex flex-col items-center gap-1 rounded-2xl px-3 py-3 border border-white/8"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="w-4 h-4 rounded-full mb-0.5" style={{ background: seg.color, boxShadow: `0 0 8px ${seg.color}80` }} />
            <span className="text-white font-extrabold text-base">{seg.value.toLocaleString()}</span>
            <span className="text-white/40 text-[10px]">FCFA</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: seg.color + "33", color: seg.color }}>
              {seg.prob}
            </span>
          </div>
        ))}
      </div>

      {/* Rules */}
      <div className="mx-4 mt-4 rounded-2xl px-4 py-3 border border-white/10"
        style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-3.5 h-3.5 text-amber-400" />
          <h2 className="text-white/80 font-bold text-xs uppercase tracking-wider">Règles</h2>
        </div>
        <p className="text-white/50 text-xs leading-relaxed">
          • Chaque achat de produit → 1 participation au tirage
        </p>
        <p className="text-white/50 text-xs leading-relaxed mt-0.5">
          • Chaque invitation d'un membre valide → 1 participation
        </p>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
