import crypto from "crypto";

const BASE_URL = "https://soleaspay.com";

// SoleasPay service ID mapping: country slug + operator name → service ID
const SERVICE_MAP: Record<string, Record<string, number>> = {
  cameroun:     { "MTN Mobile Money": 1,  "Orange Money": 2  },
  benin:        { "MTN": 35, "Moov Money": 36 },
  togo:         { "T-Money": 37, "Moov Money": 38 },
  cote_divoire: { "Orange Money": 29, "MTN Mobile Money": 30, "Moov Money": 31, "Wave": 32 },
  burkina_faso: { "Moov Money": 33, "Orange Money": 34 },
  senegal:      { "Orange Money": 24, "Wave": 25, "Free Money": 26 },
  congo:        { "MTN Mobile Money": 56, "Airtel Money": 55 },
  gabon:        { "Airtel Money": 57 },
};

// Currency per country
const CURRENCY_MAP: Record<string, string> = {
  cameroun:     "XAF",
  congo:        "XAF",
  gabon:        "XAF",
  benin:        "XOF",
  burkina_faso: "XOF",
  togo:         "XOF",
  cote_divoire: "XOF",
  senegal:      "XOF",
  mali:         "XOF",
};

export function getSoleasPayServiceId(countrySlug: string, operator: string): number | undefined {
  return SERVICE_MAP[countrySlug]?.[operator];
}

export function getSoleasPayOperators(countrySlug: string): string[] {
  return Object.keys(SERVICE_MAP[countrySlug] || {});
}

export function getSoleasPayCurrency(countrySlug: string): string {
  return CURRENCY_MAP[countrySlug] || "XAF";
}

export async function soleasPayCollect(params: {
  apiKey: string;
  serviceId: number;
  wallet: string;
  amount: number;
  currency: string;
  orderId: string;
}): Promise<{ reference: string; status: string }> {
  const res = await fetch(`${BASE_URL}/api/agent/bills?from=SELF`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": params.apiKey,
      "operation": "2",
      "service": String(params.serviceId),
    },
    body: JSON.stringify({
      wallet: params.wallet,
      amount: params.amount,
      currency: params.currency,
      order_id: params.orderId,
    }),
  });

  const data = await res.json() as any;
  if (!data.success) throw new Error(data.message || `SoleasPay error: ${res.status}`);
  return { reference: data.data?.reference || data.reference || "", status: data.status || "PROCESSING" };
}

export function verifySoleasPayCallback(rawBody: string, xPrivateKey: string, secretHash: string): boolean {
  if (!secretHash) return true;
  const expected = crypto.createHash("sha512").update(secretHash, "utf8").digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(xPrivateKey, "hex"));
  } catch {
    return false;
  }
}
