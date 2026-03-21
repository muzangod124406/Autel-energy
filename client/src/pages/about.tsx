import { Card } from "@/components/ui/card";
import { ArrowLeft, Shield, Globe, Clock, Award } from "lucide-react";
import { useLocation } from "wouter";

export default function AboutPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 pt-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate("/account")} className="flex items-center gap-2 text-white mb-2" data-testid="button-back-about">
            <ArrowLeft className="w-5 h-5" /> Retour
          </button>
          <h1 className="text-white text-xl font-bold">À Propos de Nous</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-yellow-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">RB</span>
            </div>
            <div>
              <h2 className="font-bold">Red Bull Invest</h2>
              <p className="text-xs text-muted-foreground">Plateforme d'investissement</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Red Bull Invest est une plateforme d'investissement qui vous permet de faire fructifier votre argent 
            grâce à des plans d'investissement attractifs. Nous offrons des solutions d'investissement accessibles 
            à tous, avec des rendements compétitifs et une gestion transparente.
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Shield, label: "Sécurisé", desc: "Transactions protégées" },
            { icon: Globe, label: "Multi-pays", desc: "Cameroun, Bénin, Burkina Faso" },
            { icon: Clock, label: "24/7", desc: "Investissement continu" },
            { icon: Award, label: "Fiable", desc: "Paiements garantis" },
          ].map(item => (
            <Card key={item.label} className="p-3 text-center">
              <item.icon className="w-8 h-8 mx-auto text-blue-500 mb-2" />
              <p className="font-semibold text-sm">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
