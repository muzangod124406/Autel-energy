// Sendavapay payment integration
// API base: https://sendavapay.com/api/v1
// Auth: HMAC-SHA256(API_SECRET, JSON.stringify(body)) → x-signature header
// Webhook headers: X-SendavaPay-Signature, X-SendavaPay-Event

import crypto from "crypto";

const SENDAVAPAY_BASE = "https://sendavapay.com/api/v1";

export interface SendavapayCollectParams {
  apiKey: string;
  apiSecret?: string;
  amount: number;
  currency: string;
  phone: string;
  operator: string;
  country: string;
  orderId: string;
  callbackUrl: string;
  description?: string;
}

export interface SendavapayCollectResult {
  reference: string;
  status: string;
  paymentUrl?: string;
}

// Countries: slug → { code (API), currency, operators (exact API values) }
export const SENDAVAPAY_COUNTRIES: Record<string, {
  label: string;
  code: string;
  currency: string;
  operators: { name: string; value: string }[];
}> = {
  benin:        { label: "Bénin",          code: "BJ",  currency: "XOF", operators: [{ name: "MTN",     value: "MTN"     }, { name: "Moov",   value: "Moov"   }] },
  burkina_faso: { label: "Burkina Faso",   code: "BF",  currency: "XOF", operators: [{ name: "Moov",    value: "Moov"    }, { name: "Orange", value: "Orange" }] },
  togo:         { label: "Togo",           code: "TG",  currency: "XOF", operators: [{ name: "T-Money", value: "TMoney"  }, { name: "Moov",   value: "Moov"   }] },
  cameroun:     { label: "Cameroun",       code: "CM",  currency: "XAF", operators: [{ name: "MTN",     value: "MTN"     }, { name: "Orange", value: "Orange" }] },
  cote_divoire: { label: "Côte d'Ivoire",  code: "CI",  currency: "XOF", operators: [{ name: "Orange",  value: "Orange"  }, { name: "MTN",    value: "MTN"    }, { name: "Moov", value: "Moov" }, { name: "Wave", value: "Wave" }] },
  senegal:      { label: "Sénégal",        code: "SN",  currency: "XOF", operators: [{ name: "Orange",  value: "Orange"  }, { name: "Wave",   value: "Wave"   }] },
  congo:        { label: "Congo",          code: "COG", currency: "XAF", operators: [{ name: "Airtel",  value: "Airtel"  }, { name: "MTN",    value: "MTN"    }] },
  rdc:          { label: "RDC",            code: "COD", currency: "CDF", operators: [{ name: "Vodacom", value: "Vodacom" }, { name: "Airtel", value: "Airtel" }, { name: "Orange", value: "Orange" }] },
  gabon:        { label: "Gabon",          code: "GA",  currency: "XAF", operators: [{ name: "Airtel",  value: "Airtel"  }, { name: "Moov",   value: "Moov"   }] },
  mali:         { label: "Mali",           code: "ML",  currency: "XOF", operators: [{ name: "Orange",  value: "Orange"  }, { name: "Moov",   value: "Moov"   }] },
};

export function getSendavapayOperators(countrySlug: string): { name: string; value: string }[] {
  return SENDAVAPAY_COUNTRIES[countrySlug]?.operators || [];
}

export function getSendavapayCurrency(countrySlug: string): string {
  return SENDAVAPAY_COUNTRIES[countrySlug]?.currency || "XAF";
}

export function getSendavapayCountryCode(countrySlug: string): string {
  return SENDAVAPAY_COUNTRIES[countrySlug]?.code || countrySlug.toUpperCase();
}

function signRequest(apiSecret: string, body: object): string {
  return crypto.createHmac("sha256", apiSecret).update(JSON.stringify(body)).digest("hex");
}

export async function sendavapayCollect(params: SendavapayCollectParams): Promise<SendavapayCollectResult> {
  const body: Record<string, any> = {
    amount: params.amount,
    currency: params.currency,
    phone: params.phone,
    operator: params.operator,
    country: params.country,
    order_id: params.orderId,
    callback_url: params.callbackUrl,
    description: params.description || "Dépôt SINOPEC",
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${params.apiKey}`,
  };

  // Sign request if secret is provided
  if (params.apiSecret) {
    headers["x-signature"] = signRequest(params.apiSecret, body);
  }

  const res = await fetch(`${SENDAVAPAY_BASE}/create-payment`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json() as any;
  if (!res.ok || data.success === false) {
    throw new Error(data.message || data.error || `Sendavapay error: ${res.status}`);
  }
  return {
    reference: data.reference || data.data?.reference || data.order_id || data.orderId || "",
    status: data.status || "PROCESSING",
    paymentUrl: data.payment_url || data.data?.payment_url,
  };
}

export function verifySendavapaySignature(rawBody: string, signatureHeader: string, secretKey: string): boolean {
  if (!secretKey || !signatureHeader) return true;
  try {
    const expected = crypto.createHmac("sha256", secretKey).update(rawBody).digest("hex");
    if (expected.length !== signatureHeader.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signatureHeader, "hex"));
  } catch {
    return false;
  }
}
