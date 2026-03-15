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
  fix1: {
    name: "Fixé 1",
    duration: 60,
    plans: [
      { vip: 1, amount: 2500, dailyGain: 300, totalGain: 18000 },
      { vip: 2, amount: 5000, dailyGain: 600, totalGain: 36000 },
      { vip: 3, amount: 10000, dailyGain: 1200, totalGain: 72000 },
      { vip: 4, amount: 20000, dailyGain: 2400, totalGain: 144000 },
      { vip: 5, amount: 50000, dailyGain: 6000, totalGain: 360000 },
      { vip: 6, amount: 100000, dailyGain: 12000, totalGain: 720000 },
      { vip: 7, amount: 200000, dailyGain: 24000, totalGain: 1440000 },
    ]
  },
  fix2: {
    name: "Fixé 2",
    duration: 90,
    plans: [
      { vip: 1, amount: 2500, dailyGain: 300, totalGain: 27000 },
      { vip: 2, amount: 5000, dailyGain: 600, totalGain: 54000 },
      { vip: 3, amount: 10000, dailyGain: 1200, totalGain: 108000 },
      { vip: 4, amount: 20000, dailyGain: 2400, totalGain: 216000 },
      { vip: 5, amount: 50000, dailyGain: 6000, totalGain: 540000 },
      { vip: 6, amount: 100000, dailyGain: 12000, totalGain: 1080000 },
      { vip: 7, amount: 200000, dailyGain: 24000, totalGain: 2160000 },
    ]
  },
  fix3: {
    name: "Fixé 3",
    duration: 180,
    plans: [
      { vip: 1, amount: 2500, dailyGain: 300, totalGain: 54000 },
      { vip: 2, amount: 5000, dailyGain: 600, totalGain: 108000 },
      { vip: 3, amount: 10000, dailyGain: 1200, totalGain: 216000 },
      { vip: 4, amount: 20000, dailyGain: 2400, totalGain: 432000 },
      { vip: 5, amount: 50000, dailyGain: 6000, totalGain: 1080000 },
      { vip: 6, amount: 100000, dailyGain: 12000, totalGain: 2160000 },
      { vip: 7, amount: 200000, dailyGain: 24000, totalGain: 4320000 },
    ]
  },
  activity_3: {
    name: "3 Jours",
    duration: 3,
    plans: [
      { vip: 1, amount: 2500, dailyGain: 300, totalGain: 3400 },
      { vip: 2, amount: 5000, dailyGain: 600, totalGain: 6800 },
      { vip: 3, amount: 10000, dailyGain: 1200, totalGain: 13600 },
      { vip: 4, amount: 20000, dailyGain: 2400, totalGain: 27200 },
      { vip: 5, amount: 50000, dailyGain: 6000, totalGain: 68000 },
      { vip: 6, amount: 100000, dailyGain: 12000, totalGain: 136000 },
      { vip: 7, amount: 200000, dailyGain: 24000, totalGain: 272000 },
    ]
  },
  activity_5: {
    name: "5 Jours",
    duration: 5,
    plans: [
      { vip: 1, amount: 2500, dailyGain: 300, totalGain: 4000 },
      { vip: 2, amount: 5000, dailyGain: 600, totalGain: 8000 },
      { vip: 3, amount: 10000, dailyGain: 1200, totalGain: 16000 },
      { vip: 4, amount: 20000, dailyGain: 2400, totalGain: 32000 },
      { vip: 5, amount: 50000, dailyGain: 6000, totalGain: 80000 },
      { vip: 6, amount: 100000, dailyGain: 12000, totalGain: 160000 },
      { vip: 7, amount: 200000, dailyGain: 24000, totalGain: 320000 },
    ]
  },
  activity_15: {
    name: "15 Jours",
    duration: 15,
    plans: [
      { vip: 1, amount: 2500, dailyGain: 200, totalGain: 5500 },
      { vip: 2, amount: 5000, dailyGain: 400, totalGain: 11000 },
      { vip: 3, amount: 10000, dailyGain: 800, totalGain: 22000 },
      { vip: 4, amount: 20000, dailyGain: 1600, totalGain: 44000 },
      { vip: 5, amount: 50000, dailyGain: 4000, totalGain: 110000 },
      { vip: 6, amount: 100000, dailyGain: 8000, totalGain: 220000 },
      { vip: 7, amount: 200000, dailyGain: 16000, totalGain: 440000 },
    ]
  },
  activity_30: {
    name: "30 Jours",
    duration: 30,
    plans: [
      { vip: 1, amount: 2500, dailyGain: 200, totalGain: 8500 },
      { vip: 2, amount: 5000, dailyGain: 400, totalGain: 17000 },
      { vip: 3, amount: 10000, dailyGain: 800, totalGain: 34000 },
      { vip: 4, amount: 20000, dailyGain: 1600, totalGain: 68000 },
      { vip: 5, amount: 50000, dailyGain: 4000, totalGain: 170000 },
      { vip: 6, amount: 100000, dailyGain: 8000, totalGain: 340000 },
      { vip: 7, amount: 200000, dailyGain: 16000, totalGain: 680000 },
    ]
  }
};

export function formatCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}
