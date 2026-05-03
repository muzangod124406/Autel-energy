import { ArrowLeft, Zap, Globe, Building2, Cpu } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* Header */}
      <div className="bg-[#22c55e] px-4 py-4 flex items-center gap-3">
        <button onClick={() => window.history.back()} data-testid="button-back-about">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <span className="text-white font-bold text-lg">À propos</span>
      </div>

      {/* Hero image */}
      <div className="relative h-52 overflow-hidden">
        <img src="/sinopec-logo.jpeg" alt="SINOPEC" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <img src="/sinopec-logo.jpeg" alt="SINOPEC" className="w-12 h-12 rounded-full border-2 border-white object-cover" />
          <div>
            <p className="text-white font-bold text-xl">SINOPEC</p>
            <p className="text-white/80 text-xs">Investissement mobile en Afrique francophone</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">

        {/* Présentation */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-gray-900 font-bold text-base mb-2">Présentation</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            SINOPEC est une plateforme d'investissement mobile pensée pour l'Afrique francophone. Elle permet
            de recharger son compte, choisir un plan VIP fixe de 120 jours, percevoir des gains journaliers et
            recommander des proches via un programme de parrainage simple et transparent.
          </p>
        </div>

        {/* Chiffres clés */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Globe, label: "5 pays", sub: "Afrique francophone" },
            { icon: Zap, label: "9 plans VIP", sub: "Fixes sur 120 jours" },
            { icon: Building2, label: "3 niveaux", sub: "Parrainage" },
            { icon: Cpu, label: "Support 24/7", sub: "Clara vous assiste" },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-2xl p-3 shadow-sm flex flex-col items-center text-center">
              <item.icon className="w-7 h-7 text-[#22c55e] mb-1" />
              <p className="font-bold text-gray-900 text-sm">{item.label}</p>
              <p className="text-gray-500 text-[11px]">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Image produit */}
        <div className="rounded-2xl overflow-hidden shadow-sm bg-white p-8 text-center">
          <p className="text-gray-900 font-bold text-lg">SINOPEC</p>
          <p className="text-gray-500 text-sm mt-2">Une plateforme claire, mobile-first et centrée sur le revenu passif.</p>
        </div>

        {/* Solutions intelligentes */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-gray-900 font-bold text-base mb-2">Solutions intelligentes</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
            Gestion des dépôts, retraits, plans VIP, commissions de parrainage et support client dans une seule
            interface simple à utiliser sur mobile.
          </p>
        </div>

        {/* Historique de développement */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-gray-900 font-bold text-base mb-3">Historique de développement</h2>
          <div className="space-y-4">
            {[
              {
                date: "Août 2023",
                text: "SINOPEC lance sa première série de plans VIP pour accompagner l'expansion de la plateforme.",
              },
              {
                date: "Novembre 2023",
                text: "La plateforme améliore son espace utilisateur, son support client et ses parcours de dépôt et retrait.",
              },
              {
                date: "Mai 2024",
                text: "De nouveaux plans VIP sont ajoutés pour répondre à différents niveaux d'investissement.",
              },
              {
                date: "Avril 2025",
                text: "SINOPEC renforce son système de parrainage avec des commissions multi-niveaux.",
              },
              {
                date: "Juillet 2025",
                text: "Clara, l'assistante IA, accompagne désormais les membres sur les principales questions de la plateforme.",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-[#22c55e] flex-shrink-0 mt-1" />
                  {i < 4 && <div className="w-0.5 bg-gray-200 flex-1 mt-1" />}
                </div>
                <div className="pb-2">
                  <p className="text-[#22c55e] font-bold text-xs mb-1">{item.date}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mission */}
        <div className="bg-[#22c55e] rounded-2xl p-4 shadow-sm">
          <h2 className="text-white font-bold text-base mb-2">Mission</h2>
          <p className="text-white/90 text-sm leading-relaxed">
            Offrir une expérience d'investissement simple, mobile et accessible, avec support, commissions et
            plans fixes transparents.
          </p>
        </div>

      </div>
    </div>
  );
}
