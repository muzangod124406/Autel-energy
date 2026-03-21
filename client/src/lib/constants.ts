export const COUNTRIES = [
  { id: "senegal", name: "Sénégal", flag: "\u{1F1F8}\u{1F1F3}", code: "+221", payments: ["Orange Money", "Wave"] },
  { id: "cote_divoire", name: "Côte d'Ivoire", flag: "\u{1F1E8}\u{1F1EE}", code: "+225", payments: ["Wave", "MTN", "Orange Money", "Moov Money"] },
  { id: "burkina_faso", name: "Burkina Faso", flag: "\u{1F1E7}\u{1F1EB}", code: "+226", payments: ["Orange Money", "Moov Money"] },
  { id: "togo", name: "Togo", flag: "\u{1F1F9}\u{1F1EC}", code: "+228", payments: ["Moov Money", "Mixx by Yas"] },
  { id: "benin", name: "Bénin", flag: "\u{1F1E7}\u{1F1EF}", code: "+229", payments: ["Celtis", "Moov Money", "MTN", "Momo"] },
  { id: "cameroun", name: "Cameroun", flag: "\u{1F1E8}\u{1F1F2}", code: "+237", payments: ["Orange Money", "MTN Mobile Money"] },
];

export function getCountry(id: string) {
  return COUNTRIES.find(c => c.id === id);
}

export function getPaymentMethods(countryId: string) {
  return getCountry(countryId)?.payments || [];
}

export const BKAPAY_KEY = "pk_live_d1ed8abc-648a-46a3-901e-cff82daf6b25";

export const INVESTMENT_PLANS = {
  fix: {
    name: "Fixé 120J",
    duration: 120,
    plans: [
      { vip: 1, amount: 2500, dailyGain: 300, totalGain: 36000 },
      { vip: 2, amount: 5000, dailyGain: 600, totalGain: 72000 },
      { vip: 3, amount: 10000, dailyGain: 1200, totalGain: 144000 },
      { vip: 4, amount: 20000, dailyGain: 2400, totalGain: 288000 },
      { vip: 5, amount: 50000, dailyGain: 6000, totalGain: 720000 },
      { vip: 6, amount: 100000, dailyGain: 12000, totalGain: 1440000 },
      { vip: 7, amount: 200000, dailyGain: 24000, totalGain: 2880000 },
    ]
  },
};

export function formatCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}
