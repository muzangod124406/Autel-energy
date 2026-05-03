import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Phone, User, Gift } from "lucide-react";

export default function AuthPage() {
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ country: "", phone: "", password: "" });
  const [regData, setRegData] = useState({ country: "", phone: "", password: "", nickname: "", referralCode: "" });

  const { data: countries = [] } = useQuery<any[]>({ queryKey: ["/api/countries"] });
  const activeCountries = (countries as any[]).filter((c: any) => c.isActive);

  const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-amber-400 transition-colors";
  const selectCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-800 outline-none focus:border-amber-400 transition-colors appearance-none";

  const handleLogin = async () => {
    if (!loginData.country || !loginData.phone || !loginData.password) {
      toast({ title: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await login(loginData.phone, loginData.password, loginData.country);
    } catch (e: any) {
      toast({ title: e.message?.replace(/^\d+:\s*/, "") || "Erreur de connexion", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!regData.country || !regData.phone || !regData.password) {
      toast({ title: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await register(regData.phone, regData.password, regData.country, regData.nickname, regData.referralCode);
    } catch (e: any) {
      toast({ title: e.message?.replace(/^\d+:\s*/, "") || "Erreur d'inscription", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Gold header */}
      <div className="px-6 pt-14 pb-10 text-center" style={{ background: "linear-gradient(160deg, #F59E0B 0%, #D97706 60%, #B45309 100%)" }}>
        <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 shadow-lg border-2 border-white/30">
          <img src="/sinopec-logo.jpeg" alt="SINOPEC" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-white font-black text-2xl tracking-wide">SINOPEC</h1>
        <p className="text-white/80 text-xs tracking-widest uppercase mt-1">Plateforme d'Investissement</p>
      </div>

      {/* Tab switcher */}
      <div className="mx-5 -mt-5 bg-white rounded-2xl shadow-md overflow-hidden flex z-10">
        <button
          onClick={() => setTab("login")}
          data-testid="tab-login"
          className={`flex-1 py-3.5 font-bold text-sm transition-all ${tab === "login" ? "text-white" : "text-gray-400"}`}
          style={tab === "login" ? { background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" } : {}}
        >
          Se Connecter
        </button>
        <button
          onClick={() => setTab("register")}
          data-testid="tab-register"
          className={`flex-1 py-3.5 font-bold text-sm transition-all ${tab === "register" ? "text-white" : "text-gray-400"}`}
          style={tab === "register" ? { background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" } : {}}
        >
          S'inscrire
        </button>
      </div>

      {/* Form */}
      <div className="px-5 pt-6 pb-10 flex-1 space-y-4">
        <div className="relative">
          <select
            data-testid="select-country"
            value={tab === "login" ? loginData.country : regData.country}
            onChange={e => tab === "login"
              ? setLoginData({ ...loginData, country: e.target.value })
              : setRegData({ ...regData, country: e.target.value })}
            className={selectCls}
          >
            <option value="">🌍 Sélectionnez votre pays</option>
            {activeCountries.map((c: any) => (
              <option key={c.slug} value={c.slug}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>

        {tab === "register" && (
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              data-testid="input-nickname"
              type="text"
              placeholder="Pseudo (optionnel)"
              value={regData.nickname}
              onChange={e => setRegData({ ...regData, nickname: e.target.value })}
              className={`${inputCls} pl-10`}
            />
          </div>
        )}

        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            data-testid="input-phone"
            type="tel"
            placeholder="Numéro de téléphone"
            value={tab === "login" ? loginData.phone : regData.phone}
            onChange={e => tab === "login"
              ? setLoginData({ ...loginData, phone: e.target.value })
              : setRegData({ ...regData, phone: e.target.value })}
            className={`${inputCls} pl-10`}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            data-testid="input-password"
            type={showPass ? "text" : "password"}
            placeholder="Mot de passe"
            value={tab === "login" ? loginData.password : regData.password}
            onChange={e => tab === "login"
              ? setLoginData({ ...loginData, password: e.target.value })
              : setRegData({ ...regData, password: e.target.value })}
            className={`${inputCls} pl-10 pr-10`}
          />
          <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {tab === "register" && (
          <div className="relative">
            <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              data-testid="input-referral"
              type="text"
              placeholder="Code de parrainage (optionnel)"
              value={regData.referralCode}
              onChange={e => setRegData({ ...regData, referralCode: e.target.value })}
              className={`${inputCls} pl-10`}
            />
          </div>
        )}

        <button
          data-testid="button-submit"
          onClick={tab === "login" ? handleLogin : handleRegister}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-black text-base disabled:opacity-60 shadow-md mt-2"
          style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
        >
          {loading ? "Chargement..." : tab === "login" ? "SE CONNECTER" : "CRÉER UN COMPTE"}
        </button>

        <p className="text-center text-sm text-gray-500 pt-1">
          {tab === "login" ? (
            <>Pas encore de compte ?{" "}
              <button onClick={() => setTab("register")} className="text-amber-500 font-bold">S'inscrire</button>
            </>
          ) : (
            <>Déjà un compte ?{" "}
              <button onClick={() => setTab("login")} className="text-amber-500 font-bold">Se connecter</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
