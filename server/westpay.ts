import crypto from "crypto";

const BASE_URL = "https://westpay.cloud";

let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getWestpayToken(): Promise<string> {
  const email = process.env.WESTPAY_EMAIL;
  const password = process.env.WESTPAY_PASSWORD;
  if (!email || !password) throw new Error("WESTPAY_EMAIL / WESTPAY_PASSWORD non configurés");

  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch(`${BASE_URL}/api/auth/merchant/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WestPay auth failed: ${err}`);
  }

  const data = await res.json() as any;
  if (!data.token) throw new Error("WestPay: token absent dans la réponse");

  cachedToken = data.token;
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
  return cachedToken!;
}

// Returns the X-API-KEY for a given country slug (optional but required for some endpoints)
export function getCountryApiKey(countrySlug: string): string | undefined {
  const slug = countrySlug.toUpperCase().replace(/-/g, "_");
  return process.env[`WESTPAY_API_KEY_${slug}`] || undefined;
}

// Returns status of all configured country API keys (without exposing values)
export function getCountryApiKeyStatus(): Record<string, boolean> {
  const countries = ["CAMEROUN", "BENIN", "BURKINA_FASO", "TOGO", "SENEGAL", "COTE_DIVOIRE", "MALI", "CONGO", "GABON"];
  const result: Record<string, boolean> = {};
  for (const c of countries) {
    result[c] = !!process.env[`WESTPAY_API_KEY_${c}`];
  }
  return result;
}

export function buildWestpayPaymentUrl(params: {
  amount: number;
  country: string;
  redirectUrl: string;
}): string {
  const slug = process.env.WESTPAY_MERCHANT_SLUG;
  if (!slug) throw new Error("WESTPAY_MERCHANT_SLUG non configuré");

  const url = new URL(`${BASE_URL}/pay`);
  url.searchParams.set("merchant", slug);
  url.searchParams.set("amount", String(params.amount));
  if (params.country) url.searchParams.set("country", params.country);
  url.searchParams.set("redirect", params.redirectUrl);
  return url.toString();
}

export async function westpayTransfer(params: {
  country: string;       // WestPay country name (e.g. "Cameroun")
  countrySlug: string;   // our slug (e.g. "cameroun") for API key lookup
  msisdn: string;
  amount: number;
  firstName: string;
  lastName: string;
}): Promise<{ reference: string; status: string; fees: number }> {
  const token = await getWestpayToken();
  const apiKey = getCountryApiKey(params.countrySlug);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
  if (apiKey) headers["X-API-KEY"] = apiKey;

  const { countrySlug: _skip, ...body } = params;

  const res = await fetch(`${BASE_URL}/api/merchant/transfer`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText })) as any;
    throw new Error(err.message || `WestPay transfer error ${res.status}`);
  }

  return res.json() as any;
}

export async function westpayGetBalances(): Promise<any[]> {
  const token = await getWestpayToken();
  const res = await fetch(`${BASE_URL}/api/merchant/balance`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`WestPay balance error ${res.status}`);
  return res.json() as any;
}

export function verifyWestpaySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.WESTPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

export function slugToWestpayCountry(slug: string): string {
  const map: Record<string, string> = {
    cameroun: "Cameroun",
    benin: "Bénin",
    burkina_faso: "Burkina Faso",
    togo: "Togo",
    senegal: "Sénégal",
    cote_divoire: "Côte d'Ivoire",
    mali: "Mali",
    congo: "Congo Brazzaville",
    gabon: "Gabon",
  };
  return map[slug] || slug;
}

export function slugToMsisdnPrefix(slug: string): string {
  const map: Record<string, string> = {
    cameroun: "237",
    benin: "229",
    burkina_faso: "226",
    togo: "228",
    senegal: "221",
    cote_divoire: "225",
    mali: "223",
    congo: "242",
    gabon: "241",
  };
  return map[slug] || "";
}

export function buildMsisdn(phone: string, countrySlug: string): string {
  const prefix = slugToMsisdnPrefix(countrySlug);
  const digits = phone.replace(/\D/g, "");
  if (prefix && !digits.startsWith(prefix)) return prefix + digits;
  return digits;
}

export const WESTPAY_ENABLED = !!(
  process.env.WESTPAY_MERCHANT_SLUG &&
  process.env.WESTPAY_EMAIL &&
  process.env.WESTPAY_PASSWORD
);
