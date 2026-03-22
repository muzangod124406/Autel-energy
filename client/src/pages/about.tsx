import { ArrowLeft, Zap, Globe, Building2, Cpu } from "lucide-react";
import img1 from "@assets/1768190153833_1774184180382.jpeg";
import img2 from "@assets/Autel_Energy_Officially_Releases_Maxi_Charger_DC_Hi_Power_in__1774184180469.webp";
import img3 from "@assets/1768190148862_1774184180508.jpeg";
import img4 from "@assets/Autel-Energy-integrates-Phoenix-Contacts-liquid-cooled-cable-a_1774184180548.jpg";
import img5 from "@assets/Autel-Energy-MaxiCharger-DC-HiPower-1125x635_1774184180639.jpeg";
import img6 from "@assets/Autel-MaxiCharger-DC-haute-puissance-768x768-1_1774184180669.jpg";
import autelLogo from "@assets/images_(11)_1774131992392.png";

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
        <img src={img1} alt="Autel Energy" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <img src={autelLogo} alt="Autel" className="w-12 h-12 rounded-full border-2 border-white object-cover" />
          <div>
            <p className="text-white font-bold text-xl">Autel Energy</p>
            <p className="text-white/80 text-xs">Powering the Planet</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">

        {/* Présentation */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-gray-900 font-bold text-base mb-2">Présentation</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Autel Energy est une entreprise spécialisée dans les solutions de recharge pour véhicules électriques
            et les technologies d'énergie intelligente. Fondée en 2021, elle est une filiale du groupe Autel fondé
            en 2004 en Chine. Son activité principale est la fabrication de bornes de recharge électriques
            intelligentes, avec une présence dans plus de 70 pays.
          </p>
        </div>

        {/* Chiffres clés */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Globe, label: "70+ pays", sub: "Présence mondiale" },
            { icon: Zap, label: "1M+ chargeurs", sub: "Vendus dans le monde" },
            { icon: Building2, label: "20 000+", sub: "Bornes en Europe" },
            { icon: Cpu, label: "Depuis 2021", sub: "Fondée en Chine" },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-2xl p-3 shadow-sm flex flex-col items-center text-center">
              <item.icon className="w-7 h-7 text-[#22c55e] mb-1" />
              <p className="font-bold text-gray-900 text-sm">{item.label}</p>
              <p className="text-gray-500 text-[11px]">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Image produit */}
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <img src={img2} alt="MaxiCharger DC" className="w-full object-cover" />
        </div>

        {/* Bornes de recharge */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-gray-900 font-bold text-base mb-3">Bornes de recharge</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span>Recharge AC (lente)</span>
              <span className="font-semibold text-gray-800">7 à 22 kW</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span>Recharge DC (rapide)</span>
              <span className="font-semibold text-gray-800">jusqu'à 480 kW</span>
            </div>
            <div className="pt-1">
              <p className="font-medium text-gray-700 mb-1">Produits principaux</p>
              <p className="text-gray-500 text-xs leading-relaxed">MaxiCharger AC · MaxiCharger DC Fast · Solutions ultra-rapides jusqu'au mégawatt</p>
            </div>
          </div>
        </div>

        {/* Image stand CES */}
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <img src={img3} alt="Autel CES" className="w-full object-cover" />
        </div>

        {/* Solutions intelligentes */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-gray-900 font-bold text-base mb-2">Solutions intelligentes</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Logiciels de gestion cloud et monitoring en temps réel. Intégration avec les énergies renouvelables
            (solaire). Gestion intelligente des flottes de véhicules. Stations de recharge publiques, recharge
            pour entreprises et systèmes avec stockage d'énergie.
          </p>
        </div>

        {/* Image présentation */}
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <img src={img4} alt="Conférence Autel" className="w-full object-cover" />
        </div>

        {/* Présence mondiale */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-gray-900 font-bold text-base mb-3">Présence mondiale</h2>
          <div className="space-y-2 text-sm text-gray-600">
            {[
              ["Europe", "France, Allemagne, Pays-Bas et plus"],
              ["États-Unis", "Recharge + stockage d'énergie"],
              ["Afrique", "120 bus électriques à Cape Town"],
              ["Asie", "Siège et R&D"],
            ].map(([region, detail]) => (
              <div key={region} className="flex items-start gap-2 pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-gray-800">{region} — </span>
                  <span>{detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Image DC HiPower */}
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <img src={img5} alt="MaxiCharger DC HiPower" className="w-full object-cover" />
        </div>

        {/* Innovation */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-gray-900 font-bold text-base mb-2">Innovation</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Autel Energy investit dans l'intelligence artificielle pour les villes intelligentes, la recharge
            ultra-rapide nouvelle génération et les technologies évolutives et modulaires. L'entreprise vise
            le Top 5 mondial des fabricants de bornes de recharge.
          </p>
        </div>

        {/* Image Powering Business */}
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <img src={img6} alt="Powering Your Business" className="w-full object-cover" />
        </div>

        {/* Mission */}
        <div className="bg-[#22c55e] rounded-2xl p-4 shadow-sm">
          <h2 className="text-white font-bold text-base mb-2">Mission</h2>
          <p className="text-white/90 text-sm leading-relaxed">
            Accélérer la transition vers la mobilité électrique et les énergies propres. Rendre la recharge
            plus rapide, intelligente et durable pour tous.
          </p>
        </div>

      </div>
    </div>
  );
}
