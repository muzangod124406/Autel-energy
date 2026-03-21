import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Phone, KeyRound, User, Shield, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import autelLogo from "@assets/autel_green_logo_110x@2x_1773598927579.png";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [loginData, setLoginData] = useState({ phone: "", password: "", country: "" });
  const [regData, setRegData] = useState({ phone: "", password: "", country: "", nickname: "", inviteCode: "", otp: "" });
  const [showPass, setShowPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showRegCountryDropdown, setShowRegCountryDropdown] = useState(false);

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
  const getCountryObj = (slug: string) => countries.find((c: any) => c.slug === slug);

  const handleSendOtp = async (phone: string) => {
    if (!phone) {
      toast({ title: "Erreur", description: "Veuillez entrer votre numéro de téléphone", variant: "destructive" });
      return;
    }
    setOtpLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/send-otp", { phone });
      const data = await res.json();
      setOtpCountdown(70);
      setTimeout(() => {
        setRegData(d => ({ ...d, otp: data.code }));
      }, 10000);
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
    setLoading(true);
    try {
      await register(regData);
      navigate("/trade-password");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur d'inscription", variant: "destructive" });
    }
    setLoading(false);
  };

  const loginCountry = getCountryObj(loginData.country);
  const regCountry = getCountryObj(regData.country);

  return (
    <div className="min-h-screen bg-[#f0f0e4] flex flex-col items-center pt-12 px-4 pb-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-10">
          <img src={autelLogo} alt="Autel Energy" className="h-12 object-contain" />
        </div>

        {mode === "login" && (
          <div className="space-y-5">
            <div>
              <p className="text-gray-800 font-medium mb-2">Pays</p>
              <div className="relative">
                <button
                  data-testid="select-country-login"
                  type="button"
                  className="w-full bg-[#e8e8d8] rounded-xl px-4 py-3 text-left text-gray-700 flex items-center justify-between"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                >
                  <span>{loginCountry ? `${loginCountry.flag} ${loginCountry.code}` : "Veuillez sélectionner votre pays"}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {showCountryDropdown && (
                  <div className="absolute z-50 w-full bg-white rounded-xl shadow-lg mt-1 overflow-hidden">
                    {countries.map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-800"
                        onClick={() => { setLoginData({ ...loginData, country: c.slug }); setShowCountryDropdown(false); }}
                      >
                        <span>{c.flag}</span>
                        <span>{c.name} ({c.code})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-gray-800 font-medium mb-2">Numéro de téléphone</p>
              <div className="flex items-center bg-[#e8e8d8] rounded-xl px-4 py-3 gap-3">
                <Phone className="w-5 h-5 text-gray-500 shrink-0" />
                <input
                  data-testid="input-phone-login"
                  type="tel"
                  placeholder="Veuillez entrer votre numéro de téléphone"
                  value={loginData.phone}
                  onChange={e => setLoginData({ ...loginData, phone: e.target.value })}
                  className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
                />
              </div>
            </div>

            <div>
              <p className="text-gray-800 font-medium mb-2">Mot de passe de connexion</p>
              <div className="flex items-center bg-[#e8e8d8] rounded-xl px-4 py-3 gap-3">
                <KeyRound className="w-5 h-5 text-gray-500 shrink-0" />
                <input
                  data-testid="input-password-login"
                  type={showPass ? "text" : "password"}
                  placeholder="Mot de passe de connexion"
                  value={loginData.password}
                  onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                  className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <Eye className="w-5 h-5 text-gray-400" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                data-testid="tab-register"
                type="button"
                onClick={() => setMode("register")}
                className="flex-1 py-3 rounded-full border-2 border-[#22c55e] text-[#22c55e] font-semibold bg-white"
              >
                S'inscrire
              </button>
              <button
                data-testid="button-login"
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="flex-1 py-3 rounded-full bg-[#22c55e] text-white font-semibold shadow-md"
              >
                {loading ? "..." : "Se connecter"}
              </button>
            </div>
          </div>
        )}

        {mode === "register" && (
          <div className="space-y-5">
            <div>
              <p className="text-gray-800 font-medium mb-2">Pays</p>
              <div className="relative">
                <button
                  data-testid="select-country-register"
                  type="button"
                  className="w-full bg-[#e8e8d8] rounded-xl px-4 py-3 text-left text-gray-700 flex items-center justify-between"
                  onClick={() => setShowRegCountryDropdown(!showRegCountryDropdown)}
                >
                  <span>{regCountry ? `${regCountry.flag} ${regCountry.name}` : "Veuillez sélectionner votre pays"}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {showRegCountryDropdown && (
                  <div className="absolute z-50 w-full bg-white rounded-xl shadow-lg mt-1 overflow-hidden">
                    {countries.map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-800"
                        onClick={() => { setRegData({ ...regData, country: c.slug }); setShowRegCountryDropdown(false); }}
                      >
                        <span>{c.flag}</span>
                        <span>{c.name} ({c.code})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-gray-800 font-medium mb-2">Numéro de téléphone</p>
              <div className="flex items-center bg-[#e8e8d8] rounded-xl px-4 py-3 gap-3">
                <Phone className="w-5 h-5 text-gray-500 shrink-0" />
                <input
                  data-testid="input-phone-register"
                  type="tel"
                  placeholder="Veuillez entrer votre numéro de téléphone"
                  value={regData.phone}
                  onChange={e => setRegData({ ...regData, phone: e.target.value })}
                  className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
                />
              </div>
            </div>

            <div>
              <p className="text-gray-800 font-medium mb-2">Mot de passe de connexion</p>
              <div className="flex items-center bg-[#e8e8d8] rounded-xl px-4 py-3 gap-3">
                <KeyRound className="w-5 h-5 text-gray-500 shrink-0" />
                <input
                  data-testid="input-password-register"
                  type={showRegPass ? "text" : "password"}
                  placeholder="Mot de passe de connexion"
                  value={regData.password}
                  onChange={e => setRegData({ ...regData, password: e.target.value })}
                  className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
                />
                <button type="button" onClick={() => setShowRegPass(!showRegPass)}>
                  {showRegPass ? <Eye className="w-5 h-5 text-gray-400" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-gray-800 font-medium mb-2">Surnom</p>
              <div className="flex items-center bg-[#e8e8d8] rounded-xl px-4 py-3 gap-3">
                <User className="w-5 h-5 text-gray-500 shrink-0" />
                <input
                  data-testid="input-nickname"
                  type="text"
                  placeholder="Entrez votre surnom"
                  value={regData.nickname}
                  onChange={e => setRegData({ ...regData, nickname: e.target.value })}
                  className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
                />
              </div>
            </div>

            <div>
              <p className="text-gray-800 font-medium mb-2">Code d'invitation</p>
              <div className="flex items-center bg-[#e8e8d8] rounded-xl px-4 py-3 gap-3">
                <input
                  data-testid="input-invite-code"
                  type="text"
                  placeholder="Code d'invitation (optionnel)"
                  value={regData.inviteCode}
                  onChange={e => setRegData({ ...regData, inviteCode: e.target.value })}
                  className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
                />
                {regData.inviteCode && (
                  <button type="button" onClick={() => setRegData({ ...regData, inviteCode: "" })}>
                    <span className="w-5 h-5 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center">✕</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <p className="text-gray-800 font-medium mb-2">Code de vérification (OTP)</p>
              <div className="flex items-center bg-[#e8e8d8] rounded-xl px-4 py-3 gap-3">
                <Shield className="w-5 h-5 text-gray-500 shrink-0" />
                <input
                  data-testid="input-otp-register"
                  type="text"
                  placeholder="Code de vérification"
                  value={regData.otp}
                  onChange={e => setRegData({ ...regData, otp: e.target.value })}
                  className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
                />
                <button
                  type="button"
                  disabled={otpLoading || otpCountdown > 0}
                  onClick={() => handleSendOtp(regData.phone)}
                  className="text-blue-500 font-semibold text-sm whitespace-nowrap disabled:text-gray-400"
                >
                  {otpCountdown > 0 ? `${otpCountdown}s` : otpLoading ? "..." : "Envoyer"}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                data-testid="tab-login"
                type="button"
                onClick={() => setMode("login")}
                className="flex-1 py-3 rounded-full border-2 border-[#22c55e] text-[#22c55e] font-semibold bg-white"
              >
                Se connecter
              </button>
              <button
                data-testid="button-register"
                type="button"
                onClick={handleRegister}
                disabled={loading}
                className="flex-1 py-3 rounded-full bg-[#22c55e] text-white font-semibold shadow-md"
              >
                {loading ? "..." : "S'inscrire"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
