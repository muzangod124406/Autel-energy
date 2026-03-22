import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";

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

  const { data: countriesRaw = [] } = useQuery({ queryKey: ["/api/countries"] });
  const countries = countriesRaw as any[];
  const getCountry = (slug: string) => countries.find((c: any) => c.slug === slug);

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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FFD600" }}>

      {/* ── Onglets ─────────────────────────── */}
      <div className="flex items-end justify-center gap-10 pt-10 pb-4 px-6">
        <button
          data-testid="tab-login"
          onClick={() => setMode("login")}
          className="flex flex-col items-center gap-1"
        >
          <span className={`text-base font-bold ${mode === "login" ? "text-gray-900" : "text-gray-500"}`}>
            Se Connecter
          </span>
          {mode === "login" && <span className="w-8 h-1 rounded-full bg-gray-900" />}
        </button>
        <button
          data-testid="tab-register"
          onClick={() => setMode("register")}
          className="flex flex-col items-center gap-1"
        >
          <span className={`text-base font-bold ${mode === "register" ? "text-gray-900" : "text-gray-500"}`}>
            S'inscrire
          </span>
          {mode === "register" && <span className="w-8 h-1 rounded-full bg-gray-900" />}
        </button>
      </div>

      {/* ── Bannière promo (register uniquement) ── */}
      {mode === "register" && (
        <div className="mx-4 mb-3 rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, #FF6B00 0%, #FF3300 50%, #CC0000 100%)", minHeight: 100 }}>
          <div className="absolute top-0 left-0 w-full h-full opacity-20"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 8px)", backgroundSize: "12px 12px" }} />
          {/* Blocs décoratifs */}
          <div className="absolute top-2 right-3 w-10 h-10 rounded-lg bg-orange-400 opacity-70 rotate-12" />
          <div className="absolute bottom-2 right-8 w-6 h-6 rounded bg-yellow-400 opacity-80 -rotate-6" />
          <div className="absolute top-4 right-14 w-5 h-5 rounded bg-red-300 opacity-60 rotate-3" />
          <div className="relative px-5 py-4">
            <p className="text-white font-bold text-base italic leading-tight drop-shadow">
              Inscrivez-vous pour gagner
            </p>
            <p className="text-white font-extrabold text-3xl italic leading-tight drop-shadow tracking-wide">
              250XOF+
            </p>
          </div>
        </div>
      )}

      {/* ── Carte formulaire ─────────────────── */}
      <div className="flex-1 bg-white mx-3 rounded-3xl px-5 pt-6 pb-8 shadow-xl" style={{ minHeight: mode === "login" ? "70vh" : undefined }}>

        {/* ══ CONNEXION ══ */}
        {mode === "login" && (
          <div className="space-y-4">
            {/* Pays */}
            <div className="relative">
              <button
                data-testid="select-country-login"
                type="button"
                onClick={() => setShowLoginCountry(!showLoginCountry)}
                className="w-full bg-gray-100 rounded-2xl px-4 py-3.5 flex items-center justify-between text-gray-700"
              >
                <span className="text-sm">{loginCountry ? `${loginCountry.flag} ${loginCountry.code}` : "Sélectionnez votre pays"}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              {showLoginCountry && (
                <div className="absolute z-50 w-full bg-white rounded-2xl shadow-xl mt-1 overflow-hidden border border-gray-100">
                  {countries.map((c: any) => (
                    <button key={c.id} type="button"
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-800 text-sm"
                      onClick={() => { setLoginData({ ...loginData, country: c.slug }); setShowLoginCountry(false); }}>
                      <span className="text-lg">{c.flag}</span>
                      <span>{c.name} <span className="text-gray-400">{c.code}</span></span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Téléphone avec préfixe pays */}
            <div className="flex items-center bg-gray-100 rounded-2xl overflow-hidden">
              {loginCountry ? (
                <span className="pl-4 pr-2 text-sm font-semibold text-gray-700 whitespace-nowrap">{loginCountry.code}</span>
              ) : null}
              <input
                data-testid="input-phone-login"
                type="tel"
                placeholder="Entrez votre numéro de téléphone"
                value={loginData.phone}
                onChange={e => setLoginData({ ...loginData, phone: e.target.value })}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm px-4 py-3.5"
              />
            </div>

            {/* Mot de passe */}
            <div className="flex items-center bg-gray-100 rounded-2xl px-4 py-3.5 gap-3">
              <Lock className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                data-testid="input-password-login"
                type={showLoginPass ? "text" : "password"}
                placeholder="Entrez votre mot de passe"
                value={loginData.password}
                onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
              />
              <button type="button" onClick={() => setShowLoginPass(!showLoginPass)}>
                {showLoginPass ? <Eye className="w-5 h-5 text-gray-400" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
              </button>
            </div>

            {/* Flèche */}
            <div className="text-center text-gray-400 text-xl">↓</div>

            {/* Bouton */}
            <button
              data-testid="button-login"
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-4 rounded-full font-extrabold text-gray-900 text-base tracking-widest shadow-md"
              style={{ background: "#FFD600" }}
            >
              {loading ? "..." : "SE CONNECTER"}
            </button>

            <p className="text-center text-gray-500 text-sm pt-2">
              Pas encore de compte ?{" "}
              <button onClick={() => setMode("register")} className="text-orange-500 font-semibold">
                S'inscrire
              </button>
            </p>
          </div>
        )}

        {/* ══ INSCRIPTION ══ */}
        {mode === "register" && (
          <div className="space-y-4">
            {/* Pays + téléphone */}
            <div className="flex items-center bg-gray-100 rounded-2xl overflow-hidden">
              <div className="relative">
                <button
                  data-testid="select-country-register"
                  type="button"
                  onClick={() => setShowRegCountry(!showRegCountry)}
                  className="flex items-center gap-1 pl-4 pr-2 py-3.5 text-sm font-semibold text-gray-700 whitespace-nowrap"
                >
                  <span>{regCountry ? `${regCountry.code}` : "+---"}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>
                {showRegCountry && (
                  <div className="absolute z-50 left-0 top-full w-56 bg-white rounded-2xl shadow-xl mt-1 overflow-hidden border border-gray-100">
                    {countries.map((c: any) => (
                      <button key={c.id} type="button"
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-800 text-sm"
                        onClick={() => { setRegData({ ...regData, country: c.slug }); setShowRegCountry(false); }}>
                        <span className="text-lg">{c.flag}</span>
                        <span>{c.name} <span className="text-gray-400">{c.code}</span></span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-px h-6 bg-gray-300" />
              <input
                data-testid="input-phone-register"
                type="tel"
                placeholder="Entrez votre numéro de téléphone"
                value={regData.phone}
                onChange={e => setRegData({ ...regData, phone: e.target.value })}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm px-4 py-3.5"
              />
            </div>

            {/* Mot de passe */}
            <div className="flex items-center bg-gray-100 rounded-2xl px-4 py-3.5 gap-3">
              <Lock className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                data-testid="input-password-register"
                type={showRegPass ? "text" : "password"}
                placeholder="Entrez votre mot de passe"
                value={regData.password}
                onChange={e => setRegData({ ...regData, password: e.target.value })}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
              />
              <button type="button" onClick={() => setShowRegPass(!showRegPass)}>
                {showRegPass ? <Eye className="w-5 h-5 text-gray-400" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
              </button>
            </div>

            {/* Confirmer mot de passe */}
            <div className="flex items-center bg-gray-100 rounded-2xl px-4 py-3.5 gap-3">
              <Lock className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                data-testid="input-confirm-password"
                type={showConfirmPass ? "text" : "password"}
                placeholder="Veuillez saisir à nouveau le mot de passe"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
              />
              <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                {showConfirmPass ? <Eye className="w-5 h-5 text-gray-400" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
              </button>
            </div>

            {/* Code d'invitation (optionnel, visible si non pré-rempli) */}
            {!regData.inviteCode && (
              <div className="flex items-center bg-gray-100 rounded-2xl px-4 py-3.5 gap-3">
                <input
                  data-testid="input-invite-code"
                  type="text"
                  placeholder="Code d'invitation (optionnel)"
                  value={regData.inviteCode}
                  onChange={e => setRegData({ ...regData, inviteCode: e.target.value })}
                  className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
                />
              </div>
            )}

            {/* Flèche */}
            <div className="text-center text-gray-400 text-xl">↓</div>

            {/* Bouton */}
            <button
              data-testid="button-register"
              type="button"
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-4 rounded-full font-extrabold text-gray-900 text-base tracking-widest shadow-md"
              style={{ background: "#FFD600" }}
            >
              {loading ? "..." : "SOUMETTRE"}
            </button>

            <p className="text-center text-gray-500 text-sm pt-2">
              Déjà un compte ?{" "}
              <button onClick={() => setMode("login")} className="text-orange-500 font-semibold">
                Se connecter
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
