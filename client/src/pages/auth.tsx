import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { COUNTRIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, UserPlus, LogIn } from "lucide-react";
import { useLocation } from "wouter";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showRegister, setShowRegister] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [loginData, setLoginData] = useState({ phone: "", password: "", country: "" });
  const [regData, setRegData] = useState({ phone: "", password: "", confirmPassword: "", country: "", inviteCode: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reg = params.get("reg");
    if (reg) {
      setRegData(d => ({ ...d, inviteCode: reg }));
      setMode("register");
      setShowRegister(true);
    }
  }, []);

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
    if (regData.password !== regData.confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await register(regData);
      navigate("/");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message?.replace(/^\d+:\s*/, "") || "Erreur d'inscription", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1145] via-[#2d1b69] to-[#0f0a2e] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-yellow-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">RB</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Red Bull Invest</h1>
          </div>
          <p className="text-gray-400 text-sm">Plateforme d'investissement</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex gap-2 mb-6">
            <Button
              data-testid="tab-login"
              variant={mode === "login" ? "default" : "ghost"}
              className={`flex-1 ${mode === "login" ? "bg-gradient-to-r from-red-500 to-orange-500 text-white" : "text-gray-300"}`}
              onClick={() => setMode("login")}
            >
              <LogIn className="w-4 h-4 mr-2" /> Connexion
            </Button>
            <Button
              data-testid="tab-register"
              variant={mode === "register" ? "default" : "ghost"}
              className={`flex-1 ${mode === "register" ? "bg-gradient-to-r from-red-500 to-orange-500 text-white" : "text-gray-300"}`}
              onClick={() => { setMode("register"); setShowRegister(true); }}
            >
              <UserPlus className="w-4 h-4 mr-2" /> Inscription
            </Button>
          </div>

          {mode === "login" && (
            <div className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Pays</label>
                <Select value={loginData.country} onValueChange={v => setLoginData({ ...loginData, country: v })}>
                  <SelectTrigger data-testid="select-country-login" className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Sélectionnez le pays..." />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.flag} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Numéro de téléphone</label>
                <Input
                  data-testid="input-phone-login"
                  placeholder="Numéro de téléphone"
                  value={loginData.phone}
                  onChange={e => setLoginData({ ...loginData, phone: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="relative">
                <label className="text-gray-300 text-sm mb-1 block">Mot de passe</label>
                <Input
                  data-testid="input-password-login"
                  type={showPass ? "text" : "password"}
                  placeholder="Mot de passe"
                  value={loginData.password}
                  onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-8 text-gray-400"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                data-testid="button-login"
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </div>
          )}

          {mode === "register" && (
            <div className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Pays</label>
                <Select value={regData.country} onValueChange={v => setRegData({ ...regData, country: v })}>
                  <SelectTrigger data-testid="select-country-register" className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Sélectionnez le pays..." />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.flag} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Numéro de téléphone</label>
                <Input
                  data-testid="input-phone-register"
                  placeholder="Numéro de téléphone"
                  value={regData.phone}
                  onChange={e => setRegData({ ...regData, phone: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="relative">
                <label className="text-gray-300 text-sm mb-1 block">Mot de passe</label>
                <Input
                  data-testid="input-password-register"
                  type={showPass ? "text" : "password"}
                  placeholder="Mot de passe"
                  value={regData.password}
                  onChange={e => setRegData({ ...regData, password: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-8 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Confirmer le mot de passe</label>
                <Input
                  data-testid="input-confirm-password"
                  type={showPass ? "text" : "password"}
                  placeholder="Confirmer le mot de passe"
                  value={regData.confirmPassword}
                  onChange={e => setRegData({ ...regData, confirmPassword: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Code d'invitation (optionnel)</label>
                <Input
                  data-testid="input-invite-code"
                  placeholder="Code d'invitation"
                  value={regData.inviteCode}
                  onChange={e => setRegData({ ...regData, inviteCode: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
              <Button
                data-testid="button-register"
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold"
              >
                {loading ? "Inscription..." : "S'inscrire"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
