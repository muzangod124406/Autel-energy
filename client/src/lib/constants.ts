export const COUNTRIES = [
  { id: "cameroun", name: "Cameroun", flag: "\u{1F1E8}\u{1F1F2}", code: "+237", payments: ["Orange Money", "MTN Mobile Money"] },
  { id: "benin", name: "Bénin", flag: "\u{1F1E7}\u{1F1EF}", code: "+229", payments: ["Celtis", "Moov Money", "MTN", "Momo"] },
  { id: "burkina_faso", name: "Burkina Faso", flag: "\u{1F1E7}\u{1F1EB}", code: "+226", payments: ["Orange Money", "Moov Money"] },
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
    name: "Fixé 90J",
    duration: 90,
    plans: [
      { vip: 1, name: "SINOPEC S1", amount: 2500,   dailyGain: 500,    totalGain: 60000    },
      { vip: 2, name: "SINOPEC S2", amount: 5000,   dailyGain: 1100,   totalGain: 132000   },
      { vip: 3, name: "SINOPEC S3", amount: 10000,  dailyGain: 2500,   totalGain: 300000   },
      { vip: 4, name: "SINOPEC S4", amount: 25000,  dailyGain: 6500,   totalGain: 780000   },
      { vip: 5, name: "SINOPEC S5", amount: 50000,  dailyGain: 14000,  totalGain: 1680000  },
      { vip: 6, name: "SINOPEC S6", amount: 100000, dailyGain: 30000,  totalGain: 3600000  },
      { vip: 7, name: "SINOPEC S7", amount: 250000, dailyGain: 80000,  totalGain: 9600000  },
      { vip: 8, name: "SINOPEC S8", amount: 500000, dailyGain: 170000, totalGain: 20400000 },
      { vip: 9, name: "SINOPEC S9", amount: 900000, dailyGain: 320000, totalGain: 38400000 },
    ]
  },
};

export function formatCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}
