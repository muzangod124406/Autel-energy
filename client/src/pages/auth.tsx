import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, ChevronDown, User, Shield } from "lucide-react";
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
    const reg = params.get("reg");
    if (reg) {
      setRegData(d => ({ ...d, inviteCode: reg }));
      setMode("register");
    }
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
    if (!phone) {
      toast({ title: "Erreur", description: "Entrez votre numéro de téléphone d'abord", variant: "destructive" });
      return;
    }
    setOtpLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/send-otp", { phone });
      const data = await res.json();
      setOtpCountdown(70);
      toast({ title: "Code envoyé !", description: "Un code OTP a été envoyé sur votre numéro de téléphone." });
      setTimeout(() => setRegData(d => ({ ...d, otp: data.code })), 10000);
    } catch {
      toast({ title: "Erreur", description: "Impossible d'envoyer le code OTP", variant: "destructive" });
    }
    setOtpLoading(false);
  };

  const handleLogin = async () => {
    if (!loginData.country || !loginData.phone || !loginData.password) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await login(loginData.phone, loginData.password, loginData.country);
      navigate("/");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur de connexion", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!regData.country || !regData.phone || !regData.password) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }
    if (regData.password !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await register(regData);
      navigate("/trade-password");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur d'inscription", variant: "destructive" });
    }
    setLoading(false);
  };

  const loginCountry = getCountry(loginData.country);
  const regCountry = getCountry(regData.country);

  const inputCls = "flex items-center bg-gray-100 rounded-2xl px-4 py-3.5 gap-3";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#22c55e" }}>

      {/* ── Onglets ─────────────────────────── */}
      <div className="flex items-end justify-center gap-10 pt-10 pb-4 px-6">
        <button data-testid="tab-login" onClick={() => setMode("login")} className="flex flex-col items-center gap-1">
          <span className={`text-base font-bold ${mode === "login" ? "text-white" : "text-green-200"}`}>Se Connecter</span>
          {mode === "login" && <span className="w-8 h-1 rounded-full bg-white" />}
        </button>
        <button data-testid="tab-register" onClick={() => setMode("register")} className="flex flex-col items-center gap-1">
          <span className={`text-base font-bold ${mode === "register" ? "text-white" : "text-green-200"}`}>S'inscrire</span>
          {mode === "register" && <span className="w-8 h-1 rounded-full bg-white" />}
        </button>
      </div>

      {/* ── Bannière promo inscription ─────── */}
      {mode === "register" && (
        <div className="mx-4 mb-3 rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, #FF6B00 0%, #FF3300 50%, #CC0000 100%)", minHeight: 90, fontFamily: "'Poppins', sans-serif" }}>
          <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 8px)", backgroundSize: "12px 12px" }} />
          <div className="absolute top-2 right-3 w-10 h-10 rounded-lg bg-orange-400 opacity-70 rotate-12" />
          <div className="absolute bottom-2 right-8 w-6 h-6 rounded bg-yellow-400 opacity-80 -rotate-6" />
          <div className="absolute top-4 right-14 w-5 h-5 rounded bg-red-300 opacity-60 rotate-3" />
          <div className="relative px-5 py-4">
            <p className="text-white font-bold text-base italic leading-tight drop-shadow">Inscrivez-vous pour gagner</p>
            <p className="text-white font-extrabold text-3xl italic leading-tight drop-shadow tracking-wide">36 000XOF+</p>
          </div>
        </div>
      )}

      {/* ── Carte formulaire ─────────────── */}
      <div className="flex-1 bg-white mx-3 rounded-3xl px-5 pt-6 pb-8 shadow-xl">

        {/* ══ CONNEXION ══ */}
        {mode === "login" && (
          <div className="space-y-4">

            {/* Sélecteur de pays */}
            <div className="relative z-30">
              <button
                data-testid="select-country-login"
                type="button"
                onClick={() => setShowLoginCountry(v => !v)}
                className="w-full bg-gray-100 rounded-2xl px-4 py-3.5 flex items-center justify-between text-gray-700"
              >
                <span className="text-sm">{loginCountry ? `${loginCountry.flag} ${loginCountry.name} (${loginCountry.code})` : "Sélectionnez votre pays"}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showLoginCountry ? "rotate-180" : ""}`} />
              </button>
              {showLoginCountry && (
                <div className="absolute z-50 w-full bg-white rounded-2xl shadow-2xl mt-1 border border-gray-100 overflow-hidden">
                  {countries.map((c: any) => (
                    <button key={c.id} type="button"
                      className="w-full px-4 py-3 text-left hover:bg-green-50 flex items-center gap-3 text-gray-800 text-sm border-b border-gray-50 last:border-0"
                      onClick={() => { setLoginData(d => ({ ...d, country: c.slug })); setShowLoginCountry(false); }}>
                      <span className="text-xl">{c.flag}</span>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-gray-400 text-xs">{c.code}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Téléphone */}
            <div className={inputCls}>
              {loginCountry && <span className="text-sm font-semibold text-gray-600 shrink-0">{loginCountry.code}</span>}
              <input data-testid="input-phone-login" type="tel"
                placeholder="Entrez votre numéro de téléphone"
                value={loginData.phone}
                onChange={e => setLoginData(d => ({ ...d, phone: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
              />
            </div>

            {/* Mot de passe */}
            <div className={inputCls}>
              <Lock className="w-5 h-5 text-gray-400 shrink-0" />
              <input data-testid="input-password-login" type={showLoginPass ? "text" : "password"}
                placeholder="Entrez votre mot de passe"
                value={loginData.password}
                onChange={e => setLoginData(d => ({ ...d, password: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
              />
              <button type="button" onClick={() => setShowLoginPass(v => !v)}>
                {showLoginPass ? <Eye className="w-5 h-5 text-gray-400" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
              </button>
            </div>

            <div className="text-center text-gray-300 text-xl">↓</div>

            <button data-testid="button-login" type="button" onClick={handleLogin} disabled={loading}
              className="w-full py-4 rounded-full font-extrabold text-white text-base tracking-widest shadow-md bg-[#22c55e]">
              {loading ? "..." : "SE CONNECTER"}
            </button>

            <p className="text-center text-gray-500 text-sm pt-1">
              Pas encore de compte ?{" "}
              <button onClick={() => setMode("register")} className="text-[#22c55e] font-semibold">S'inscrire</button>
            </p>
          </div>
        )}

        {/* ══ INSCRIPTION ══ */}
        {mode === "register" && (
          <div className="space-y-3">

            {/* Sélecteur de pays séparé */}
            <div className="relative z-30">
              <button
                data-testid="select-country-register"
                type="button"
                onClick={() => setShowRegCountry(v => !v)}
                className="w-full bg-gray-100 rounded-2xl px-4 py-3.5 flex items-center justify-between text-gray-700"
              >
                <span className="text-sm">{regCountry ? `${regCountry.flag} ${regCountry.code} — ${regCountry.name}` : "Sélectionnez votre pays"}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showRegCountry ? "rotate-180" : ""}`} />
              </button>
              {showRegCountry && (
                <div className="absolute z-50 w-full bg-white rounded-2xl shadow-2xl mt-1 border border-gray-100 overflow-hidden">
                  {countries.map((c: any) => (
                    <button key={c.id} type="button"
                      className="w-full px-4 py-3 text-left hover:bg-green-50 flex items-center gap-3 text-gray-800 text-sm border-b border-gray-50 last:border-0"
                      onClick={() => { setRegData(d => ({ ...d, country: c.slug })); setShowRegCountry(false); }}>
                      <span className="text-xl">{c.flag}</span>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-gray-400 text-xs">{c.code}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Téléphone avec préfixe */}
            <div className={inputCls}>
              {regCountry && <span className="text-sm font-semibold text-gray-600 shrink-0 border-r border-gray-300 pr-3">{regCountry.code}</span>}
              <input data-testid="input-phone-register" type="tel"
                placeholder="Entrez votre numéro de téléphone"
                value={regData.phone}
                onChange={e => setRegData(d => ({ ...d, phone: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
              />
            </div>

            {/* Mot de passe */}
            <div className={inputCls}>
              <Lock className="w-5 h-5 text-gray-400 shrink-0" />
              <input data-testid="input-password-register" type={showRegPass ? "text" : "password"}
                placeholder="Entrez votre mot de passe"
                value={regData.password}
                onChange={e => setRegData(d => ({ ...d, password: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
              />
              <button type="button" onClick={() => setShowRegPass(v => !v)}>
                {showRegPass ? <Eye className="w-5 h-5 text-gray-400" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
              </button>
            </div>

            {/* Confirmer mot de passe */}
            <div className={inputCls}>
              <Lock className="w-5 h-5 text-gray-400 shrink-0" />
              <input data-testid="input-confirm-password" type={showConfirmPass ? "text" : "password"}
                placeholder="Veuillez saisir à nouveau le mot de passe"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
              />
              <button type="button" onClick={() => setShowConfirmPass(v => !v)}>
                {showConfirmPass ? <Eye className="w-5 h-5 text-gray-400" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
              </button>
            </div>

            {/* Surnom */}
            <div className={inputCls}>
              <User className="w-5 h-5 text-gray-400 shrink-0" />
              <input data-testid="input-nickname" type="text"
                placeholder="Entrez votre surnom"
                value={regData.nickname}
                onChange={e => setRegData(d => ({ ...d, nickname: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
              />
            </div>

            {/* Code d'invitation */}
            <div className={inputCls}>
              <input data-testid="input-invite-code" type="text"
                placeholder="Code d'invitation (optionnel)"
                value={regData.inviteCode}
                onChange={e => setRegData(d => ({ ...d, inviteCode: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
              />
              {regData.inviteCode && (
                <button type="button" onClick={() => setRegData(d => ({ ...d, inviteCode: "" }))}>
                  <span className="w-5 h-5 rounded-full bg-gray-300 text-white text-xs flex items-center justify-center">✕</span>
                </button>
              )}
            </div>

            {/* OTP */}
            <div className={inputCls}>
              <Shield className="w-5 h-5 text-gray-400 shrink-0" />
              <input data-testid="input-otp-register" type="text"
                placeholder="Code de vérification OTP"
                value={regData.otp}
                onChange={e => setRegData(d => ({ ...d, otp: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
              />
              <button type="button"
                disabled={otpLoading || otpCountdown > 0}
                onClick={() => handleSendOtp(regData.phone)}
                className={`text-sm font-bold whitespace-nowrap px-3 py-1.5 rounded-full ${otpCountdown > 0 || otpLoading ? "text-gray-400 bg-gray-100" : "text-white bg-[#22c55e]"}`}>
                {otpCountdown > 0 ? `${otpCountdown}s` : otpLoading ? "..." : "Envoyer"}
              </button>
            </div>

            <div className="text-center text-gray-300 text-xl">↓</div>

            <button data-testid="button-register" type="button" onClick={handleRegister} disabled={loading}
              className="w-full py-4 rounded-full font-extrabold text-white text-base tracking-widest shadow-md bg-[#22c55e]">
              {loading ? "..." : "SOUMETTRE"}
            </button>

            <p className="text-center text-gray-500 text-sm pt-1">
              Déjà un compte ?{" "}
              <button onClick={() => setMode("login")} className="text-[#22c55e] font-semibold">Se connecter</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
