import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, ChevronDown, User, Shield, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [loginData, setLoginData] = useState({ phone: "", password: "", country: "" });
  const [regData, setRegData] = useState({ phone: "", password: "", country: "", nickname: "", inviteCode: "", otp: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [showLoginCountry, setShowLoginCountry] = useState(false);
  const [showRegCountry, setShowRegCountry] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code") || params.get("reg");
    if (code) { setRegData(d => ({ ...d, inviteCode: code })); setMode("register"); }
  }, []);

  useEffect(() => {
    if (otpCountdown > 0) {
      const t = setTimeout(() => setOtpCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpCountdown]);

  const { data: countriesRaw = [] } = useQuery({ queryKey: ["/api/countries"] });
  const countries = countriesRaw as any[];
  const getCountry = (slug: string) => countries.find((c: any) => c.slug === slug);

  const handleSendOtp = async (phone: string) => {
    if (!phone) { toast({ title: "Entrez d'abord votre numéro", variant: "destructive" }); return; }
    setOtpLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/send-otp", { phone });
      const data = await res.json();
      setOtpCountdown(70);
      toast({ title: "Code OTP envoyé !" });
      setTimeout(() => setRegData(d => ({ ...d, otp: data.code })), 6000);
    } catch (e: any) {
      toast({ title: e.message?.replace(/^\d+:\s*/, "") || "Impossible d'envoyer le code OTP", variant: "destructive" });
    }
    setOtpLoading(false);
  };

  const handleLogin = async () => {
    if (!loginData.country || !loginData.phone || !loginData.password) {
      toast({ title: "Veuillez remplir tous les champs", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      await login(loginData.phone, loginData.password, loginData.country);
      navigate("/");
    } catch (e: any) {
      toast({ title: e.message?.replace(/^\d+:\s*/, "") || "Erreur de connexion", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!regData.country || !regData.phone || !regData.password) {
      toast({ title: "Veuillez remplir tous les champs", variant: "destructive" }); return;
    }
    if (regData.password !== confirmPassword) {
      toast({ title: "Les mots de passe ne correspondent pas", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      await register(regData);
      navigate("/trade-password");
    } catch (e: any) {
      toast({ title: e.message?.replace(/^\d+:\s*/, "") || "Erreur d'inscription", variant: "destructive" });
    }
    setLoading(false);
  };

  const loginCountry = getCountry(loginData.country);
  const regCountry = getCountry(regData.country);

  const inputCls = "flex items-center bg-[#1a1a28] border border-[#252538] rounded-2xl px-4 py-3.5 gap-3 focus-within:border-amber-500/60 transition-colors";

  if (countries.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0B0B14 0%, #12121F 100%)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-amber-500/70 text-sm font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #0B0B14 0%, #0E0E1A 50%, #111120 100%)" }}>

      {/* ── Logo / Header ─────────────────────── */}
      <div className="flex flex-col items-center pt-12 pb-6 px-6">
        <div className="w-16 h-16 rounded-2xl overflow-hidden mb-4 shadow-lg shadow-amber-500/10 border border-amber-500/20">
          <img src="/sinopec-logo.jpeg" alt="SINOPEC" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-white font-bold text-xl tracking-wide">SINOPEC</h1>
        <p className="text-amber-500/60 text-xs mt-1 tracking-widest uppercase">Plateforme d'investissement</p>
      </div>

      {/* ── Onglets ─────────────────────────── */}
      <div className="flex items-center mx-5 mb-5 bg-[#16162A] rounded-2xl p-1 border border-[#252538]">
        <button data-testid="tab-login" onClick={() => setMode("login")}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${mode === "login" ? "bg-amber-500 text-black shadow-md" : "text-[#888899]"}`}>
          Se Connecter
        </button>
        <button data-testid="tab-register" onClick={() => setMode("register")}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${mode === "register" ? "bg-amber-500 text-black shadow-md" : "text-[#888899]"}`}>
          S'inscrire
        </button>
      </div>

      {/* ── Bannière promo inscription ─────── */}
      {mode === "register" && (
        <div className="mx-5 mb-4 rounded-2xl overflow-hidden relative border border-amber-500/20"
          style={{ background: "linear-gradient(135deg, #1a1200 0%, #2a1f00 50%, #1a1400 100%)", minHeight: 80 }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "repeating-linear-gradient(45deg,#F59E0B 0,#F59E0B 1px,transparent 0,transparent 8px)", backgroundSize: "14px 14px" }} />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
            <Sparkles className="w-16 h-16 text-amber-400" />
          </div>
          <div className="relative px-5 py-4">
            <p className="text-amber-400/80 font-medium text-xs uppercase tracking-widest">Offre de bienvenue</p>
            <p className="text-amber-400 font-extrabold text-2xl leading-tight">36 000 XOF+</p>
          </div>
        </div>
      )}

      {/* ── Carte formulaire ─────────────── */}
      <div className="flex-1 mx-5 rounded-3xl px-5 pt-6 pb-8 border border-[#252538]"
        style={{ background: "linear-gradient(160deg, #14142A 0%, #16162E 100%)" }}>

        {/* ══ CONNEXION ══ */}
        {mode === "login" && (
          <div className="space-y-4">
            {/* Sélecteur pays */}
            <div className="relative z-30">
              <button data-testid="select-country-login" type="button"
                onClick={() => setShowLoginCountry(v => !v)}
                className="w-full bg-[#1a1a28] border border-[#252538] rounded-2xl px-4 py-3.5 flex items-center justify-between text-sm focus:border-amber-500/60 transition-colors">
                <span className={loginCountry ? "text-white" : "text-[#888899]"}>
                  {loginCountry ? `${loginCountry.flag} ${loginCountry.name} (${loginCountry.code})` : "Sélectionnez votre pays"}
                </span>
                <ChevronDown className={`w-4 h-4 text-amber-500/60 transition-transform ${showLoginCountry ? "rotate-180" : ""}`} />
              </button>
              {showLoginCountry && (
                <div className="absolute z-50 w-full rounded-2xl shadow-2xl mt-1 border border-[#252538] overflow-hidden"
                  style={{ background: "#1a1a28" }}>
                  {countries.map((c: any) => (
                    <button key={c.id} type="button"
                      className="w-full px-4 py-3 text-left flex items-center gap-3 text-sm border-b border-[#252538] last:border-0 hover:bg-amber-500/5 transition-colors"
                      onClick={() => { setLoginData(d => ({ ...d, country: c.slug })); setShowLoginCountry(false); }}>
                      <span className="text-xl">{c.flag}</span>
                      <div>
                        <p className="font-medium text-white">{c.name}</p>
                        <p className="text-[#888899] text-xs">{c.code}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Téléphone */}
            <div className={inputCls}>
              {loginCountry && <span className="text-amber-500 text-sm font-semibold shrink-0 border-r border-[#252538] pr-3">{loginCountry.code}</span>}
              <input data-testid="input-phone-login" type="tel"
                placeholder="Numéro de téléphone"
                value={loginData.phone}
                onChange={e => setLoginData(d => ({ ...d, phone: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-white placeholder:text-[#888899] text-sm" />
            </div>

            {/* Mot de passe */}
            <div className={inputCls}>
              <Lock className="w-4 h-4 text-amber-500/60 shrink-0" />
              <input data-testid="input-password-login" type={showLoginPass ? "text" : "password"}
                placeholder="Mot de passe"
                value={loginData.password}
                onChange={e => setLoginData(d => ({ ...d, password: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-white placeholder:text-[#888899] text-sm" />
              <button type="button" onClick={() => setShowLoginPass(v => !v)}>
                {showLoginPass ? <Eye className="w-4 h-4 text-[#888899]" /> : <EyeOff className="w-4 h-4 text-[#888899]" />}
              </button>
            </div>

            <button data-testid="button-login" type="button" onClick={handleLogin} disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-black text-base tracking-wide shadow-lg disabled:opacity-60"
              style={{ background: loading ? "#888" : "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
              {loading ? "Connexion..." : "SE CONNECTER"}
            </button>

            <p className="text-center text-[#888899] text-sm pt-1">
              Pas encore de compte ?{" "}
              <button onClick={() => setMode("register")} className="text-amber-500 font-semibold">S'inscrire</button>
            </p>
          </div>
        )}

        {/* ══ INSCRIPTION ══ */}
        {mode === "register" && (
          <div className="space-y-3">
            {/* Sélecteur pays */}
            <div className="relative z-30">
              <button data-testid="select-country-register" type="button"
                onClick={() => setShowRegCountry(v => !v)}
                className="w-full bg-[#1a1a28] border border-[#252538] rounded-2xl px-4 py-3.5 flex items-center justify-between text-sm transition-colors focus:border-amber-500/60">
                <span className={regCountry ? "text-white" : "text-[#888899]"}>
                  {regCountry ? `${regCountry.flag} ${regCountry.code} — ${regCountry.name}` : "Sélectionnez votre pays"}
                </span>
                <ChevronDown className={`w-4 h-4 text-amber-500/60 transition-transform ${showRegCountry ? "rotate-180" : ""}`} />
              </button>
              {showRegCountry && (
                <div className="absolute z-50 w-full rounded-2xl shadow-2xl mt-1 border border-[#252538] overflow-hidden"
                  style={{ background: "#1a1a28" }}>
                  {countries.map((c: any) => (
                    <button key={c.id} type="button"
                      className="w-full px-4 py-3 text-left flex items-center gap-3 text-sm border-b border-[#252538] last:border-0 hover:bg-amber-500/5 transition-colors"
                      onClick={() => { setRegData(d => ({ ...d, country: c.slug })); setShowRegCountry(false); }}>
                      <span className="text-xl">{c.flag}</span>
                      <div>
                        <p className="font-medium text-white">{c.name}</p>
                        <p className="text-[#888899] text-xs">{c.code}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Téléphone */}
            <div className={inputCls}>
              {regCountry && <span className="text-amber-500 text-sm font-semibold shrink-0 border-r border-[#252538] pr-3">{regCountry.code}</span>}
              <input data-testid="input-phone-register" type="tel"
                placeholder="Numéro de téléphone"
                value={regData.phone}
                onChange={e => setRegData(d => ({ ...d, phone: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-white placeholder:text-[#888899] text-sm" />
            </div>

            {/* Mot de passe */}
            <div className={inputCls}>
              <Lock className="w-4 h-4 text-amber-500/60 shrink-0" />
              <input data-testid="input-password-register" type={showRegPass ? "text" : "password"}
                placeholder="Mot de passe"
                value={regData.password}
                onChange={e => setRegData(d => ({ ...d, password: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-white placeholder:text-[#888899] text-sm" />
              <button type="button" onClick={() => setShowRegPass(v => !v)}>
                {showRegPass ? <Eye className="w-4 h-4 text-[#888899]" /> : <EyeOff className="w-4 h-4 text-[#888899]" />}
              </button>
            </div>

            {/* Confirmer */}
            <div className={inputCls}>
              <Lock className="w-4 h-4 text-amber-500/60 shrink-0" />
              <input data-testid="input-confirm-password" type={showConfirmPass ? "text" : "password"}
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="flex-1 bg-transparent outline-none text-white placeholder:text-[#888899] text-sm" />
              <button type="button" onClick={() => setShowConfirmPass(v => !v)}>
                {showConfirmPass ? <Eye className="w-4 h-4 text-[#888899]" /> : <EyeOff className="w-4 h-4 text-[#888899]" />}
              </button>
            </div>

            {/* Surnom */}
            <div className={inputCls}>
              <User className="w-4 h-4 text-amber-500/60 shrink-0" />
              <input data-testid="input-nickname" type="text"
                placeholder="Votre surnom"
                value={regData.nickname}
                onChange={e => setRegData(d => ({ ...d, nickname: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-white placeholder:text-[#888899] text-sm" />
            </div>

            {/* Code invitation */}
            <div className={inputCls}>
              <input data-testid="input-invite-code" type="text"
                placeholder="Code d'invitation (optionnel)"
                value={regData.inviteCode}
                onChange={e => setRegData(d => ({ ...d, inviteCode: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-white placeholder:text-[#888899] text-sm" />
              {regData.inviteCode && (
                <button type="button" onClick={() => setRegData(d => ({ ...d, inviteCode: "" }))}>
                  <span className="w-5 h-5 rounded-full bg-[#252538] text-[#888899] text-xs flex items-center justify-center">✕</span>
                </button>
              )}
            </div>

            {/* OTP */}
            <div className={inputCls}>
              <Shield className="w-4 h-4 text-amber-500/60 shrink-0" />
              <input data-testid="input-otp-register" type="text"
                placeholder="Code de vérification OTP"
                value={regData.otp}
                onChange={e => setRegData(d => ({ ...d, otp: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-white placeholder:text-[#888899] text-sm" />
              <button type="button"
                disabled={otpLoading || otpCountdown > 0 || !regData.phone}
                onClick={() => handleSendOtp(regData.phone)}
                className={`text-xs font-bold whitespace-nowrap px-3 py-1.5 rounded-full transition-all ${
                  otpCountdown > 0 || otpLoading || !regData.phone
                    ? "text-[#888899] bg-[#252538]"
                    : "text-black bg-amber-500"
                }`}>
                {otpCountdown > 0 ? `${otpCountdown}s` : otpLoading ? "..." : "Envoyer"}
              </button>
            </div>

            <button data-testid="button-register" type="button" onClick={handleRegister} disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-black text-base tracking-wide shadow-lg disabled:opacity-60"
              style={{ background: loading ? "#888" : "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
              {loading ? "Inscription..." : "SOUMETTRE"}
            </button>

            <p className="text-center text-[#888899] text-sm pt-1">
              Déjà un compte ?{" "}
              <button onClick={() => setMode("login")} className="text-amber-500 font-semibold">Se connecter</button>
            </p>
          </div>
        )}
      </div>
      <div className="h-8" />
    </div>
  );
}
