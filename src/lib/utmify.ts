import { getRequestIP } from "@tanstack/react-start/server";
const UTMIFY_API_URL = "https://api.utmify.com.br/api-credentials/orders";
const UTMIFY_API_TOKEN = "x9yUBxqSLYYm7pODiAxHViGSxxDa3B8MrCBr";
export type UtmifyStatus = "waiting_payment" | "paid" | "refused" | "refunded" | "chargedback";
export interface UtmifyTracking {
  src?: string | null;
  sck?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
}

export interface UtmifyCustomer {
  name?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  document?: string | undefined;
  ip?: string | undefined;
}

export interface SendUtmifyOrderInput {

  orderId: string;
  status: UtmifyStatus;

  amount: number;
  productName: string;
  createdAtMs?: number;
  approvedAtMs?: number | null;
  customer?: UtmifyCustomer | undefined;
  tracking?: UtmifyTracking | undefined;

  isTest?: boolean;
}

export interface UtmifyResult {
  sent: boolean;
  reason?: string;
}

function utcStamp(ms: number): string {
  return new Date(ms).toISOString().slice(0, 19).replace("T", " ");
}

const sentOrders = new Map<string, number>();
const SENT_TTL_MS = 6 * 60 * 60_000;
function alreadySent(key: string): boolean {
  const now = Date.now();
  for (const [k, at] of sentOrders) {
    if (now - at > SENT_TTL_MS) sentOrders.delete(k);
  }
  if (sentOrders.has(key)) return true;
  sentOrders.set(key, now);
  return false;
}

export async function sendUtmifyOrder(input: SendUtmifyOrderInput): Promise<UtmifyResult> {
  if (!UTMIFY_API_TOKEN) return { sent: false, reason: "token da Utmify ausente" };

  const dedupKey = `${input.orderId}:${input.status}`;
  if (!input.isTest && alreadySent(dedupKey)) {
    return { sent: false, reason: "já enviado (dedup local)" };
  }

  const priceInCents = Math.round(input.amount * 100);
  if (priceInCents <= 0) {
    sentOrders.delete(dedupKey);
    return { sent: false, reason: "valor inválido" };
  }

  const createdAtMs = input.createdAtMs ?? Date.now();



  let clientIp = input.customer?.ip;
  if (!clientIp) {
    try {
      clientIp = getRequestIP({ xForwardedFor: true });
    } catch {
      clientIp = undefined;
    }
  }

  const body = {
    orderId: input.orderId,
    platform: "InstaSpy",
    paymentMethod: "pix",
    status: input.status,
    createdAt: utcStamp(createdAtMs),
    approvedDate: input.status === "paid" ? utcStamp(input.approvedAtMs ?? Date.now()) : null,
    refundedAt: null,
    customer: {
      name: input.customer?.name || "Cliente InstaSpy",



      email: input.customer?.email || `${input.orderId}@sem-email.instaspy`,
      phone: input.customer?.phone ?? null,
      document: input.customer?.document ?? null,
      country: "BR",



      ...(clientIp ? { ip: clientIp } : {}),
    },
    products: [
      {
        id: "instaspy_acesso",
        name: input.productName,
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents,
      },
    ],
    trackingParameters: {
      src: input.tracking?.src ?? null,
      sck: input.tracking?.sck ?? null,
      utm_source: input.tracking?.utm_source ?? null,
      utm_medium: input.tracking?.utm_medium ?? null,
      utm_campaign: input.tracking?.utm_campaign ?? null,
      utm_content: input.tracking?.utm_content ?? null,
      utm_term: input.tracking?.utm_term ?? null,
    },
    commission: {
      totalPriceInCents: priceInCents,
      gatewayFeeInCents: 0,
      userCommissionInCents: priceInCents,
      currency: "BRL",
    },
    isTest: input.isTest === true,
  };

  try {
    const response = await fetch(UTMIFY_API_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-token": UTMIFY_API_TOKEN },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      sentOrders.delete(dedupKey);
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Utmify] pedido ${input.orderId} recusado: HTTP ${response.status} ${detail.slice(0, 200)}`,
      );
      return { sent: false, reason: `HTTP ${response.status}` };
    }

    console.info(`[Utmify] pedido ${input.orderId} enviado como "${input.status}"`);
    return { sent: true };
  } catch (error) {
    sentOrders.delete(dedupKey);
    const reason = (error as Error)?.message ?? "erro de rede";
    console.warn(`[Utmify] falha ao enviar pedido ${input.orderId}: ${reason}`);
    return { sent: false, reason };
  }
}
