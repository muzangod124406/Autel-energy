// Sendavapay payment integration
// API docs: sendavapay.com
// Pattern: POST collection request → webhook callback on payment success

const SENDAVAPAY_BASE = "https://sendavapay.com";

export interface SendavapayCollectParams {
  apiKey: string;
  amount: number;
  currency: string;
  phone: string;
  operator: string;
  orderId: string;
  callbackUrl: string;
  description?: string;
}

export interface SendavapayCollectResult {
  reference: string;
  status: string;
  paymentUrl?: string;
}

// Supported countries and operators for Sendavapay
export const SENDAVAPAY_COUNTRIES: Record<string, { label: string; currency: string; operators: string[] }> = {
  cameroun:     { label: "Cameroun",      currency: "XAF", operators: ["MTN Mobile Money", "Orange Money"] },
  senegal:      { label: "Sénégal",       currency: "XOF", operators: ["Orange Money", "Wave", "Free Money"] },
  cote_divoire: { label: "Côte d'Ivoire", currency: "XOF", operators: ["Orange Money", "MTN Mobile Money", "Moov Money", "Wave"] },
  benin:        { label: "Bénin",         currency: "XOF", operators: ["MTN", "Moov Money"] },
  togo:         { label: "Togo",          currency: "XOF", operators: ["T-Money", "Moov Money"] },
  burkina_faso: { label: "Burkina Faso",  currency: "XOF", operators: ["Moov Money", "Orange Money"] },
  mali:         { label: "Mali",          currency: "XOF", operators: ["Orange Money", "Moov Money"] },
  congo:        { label: "Congo",         currency: "XAF", operators: ["MTN Mobile Money", "Airtel Money"] },
  gabon:        { label: "Gabon",         currency: "XAF", operators: ["Airtel Money"] },
};

export function getSendavapayOperators(countrySlug: string): string[] {
  return SENDAVAPAY_COUNTRIES[countrySlug]?.operators || [];
}

export function getSendavapayCurrency(countrySlug: string): string {
  return SENDAVAPAY_COUNTRIES[countrySlug]?.currency || "XAF";
}

export async function sendavapayCollect(params: SendavapayCollectParams): Promise<SendavapayCollectResult> {
  const res = await fetch(`${SENDAVAPAY_BASE}/api/v1/collect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      phone: params.phone,
      operator: params.operator,
      order_id: params.orderId,
      callback_url: params.callbackUrl,
      description: params.description || `Dépôt SINOPEC`,
    }),
  });

  const data = await res.json() as any;
  if (!res.ok || data.success === false) {
    throw new Error(data.message || data.error || `Sendavapay error: ${res.status}`);
  }
  return {
    reference: data.reference || data.data?.reference || data.transaction_id || "",
    status: data.status || "PROCESSING",
    paymentUrl: data.payment_url || data.data?.payment_url,
  };
}

export function verifySendavapaySignature(rawBody: string, signatureHeader: string, secretKey: string): boolean {
  if (!secretKey || !signatureHeader) return true;
  try {
    const crypto = require("crypto");
    const expected = crypto.createHmac("sha256", secretKey).update(rawBody).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signatureHeader, "hex"));
  } catch {
    return false;
  }
}
