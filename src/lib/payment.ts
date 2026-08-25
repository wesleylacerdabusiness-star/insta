import { createServerFn } from "@tanstack/react-start";

export type PaymentStatus = "pending" | "paid" | "expired" | "failed";

export interface CreatePixChargeInput {
  amount: number;
  description: string;
  customer?: {
    name?: string;
    email?: string;
    taxId?: string;
    phone?: string;
  };
  metadata?: Record<string, any>;
  tracking?: OrderTracking;
}

export interface OrderTracking {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_id?: string;
}

interface OrderContext {
  productName: string;
  amount: number;
  createdAtMs: number;
  customer?: { name?: string; email?: string; phone?: string } | undefined;
  tracking?: OrderTracking | undefined;
}
const orderContexts = new Map<string, OrderContext>();

export interface PixChargeData {
  id: string;
  status: PaymentStatus;
  amount: number;
  description: string;
  pix: {
    copyPasteKey: string;
    qrCodeUrl: string;
    expiresAt: string;
    expiresInSeconds: number;
  };
  createdAt: string;
  paidAt?: string;
}

const TICHUPAY_API_KEY =
  process.env["TICHUPAY_API_KEY"] ||
  "tichu_live_3c810571cfb532b92da8f01e702e70ca95e43afad2c36842fccc7cbb3c6825ec";

const TICHUPAY_BASE_URL = "https://tichupay.com/api/pix";

const chargesDb = new Map<string, PixChargeData>();

function generateFallbackPixCopyPaste(id: string, amount: number): string {
  const formattedAmount = amount.toFixed(2);
  const randomTxId = id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 25);
  return `00020126580014br.gov.bcb.pix0136${id}-instaspy-secure520400005303986540${formattedAmount.length.toString().padStart(2, "0")}${formattedAmount}5802BR5913INSTASPY PAG6009SAO PAULO62070503***6304${randomTxId.slice(0, 4)}`;
}

export const createPixChargeServer = createServerFn({ method: "POST" })
  .validator((input: CreatePixChargeInput) => input)
  .handler(async ({ data }): Promise<PixChargeData> => {
    const externalId = `instaspy_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date();
    const expirationSeconds = 1800;

    try {
      const response = await fetch(`${TICHUPAY_BASE_URL}/create`, {
        method: "POST",
        headers: {
          "x-api-key": TICHUPAY_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(data.amount),
          description: data.description || "InstaSpy Acesso VIP",
          external_id: externalId,
          expiration: expirationSeconds,
        }),
      });

      if (response.ok) {
        const resData = await response.json();


        const tx = resData.transaction || resData;
        if (tx && (tx.id || tx.pix_copia_cola)) {
          const chargeId = tx.id || tx.txid || externalId;
          const copyPasteKey = tx.pix_copia_cola || tx.pix_copia_e_cola || "";

          let qrCodeUrl = tx.qr_code_base64 || tx.qr_code || "";
          if (qrCodeUrl && !qrCodeUrl.startsWith("data:") && !qrCodeUrl.startsWith("http")) {
            qrCodeUrl = `data:image/png;base64,${qrCodeUrl}`;
          }
          if (!qrCodeUrl && copyPasteKey) {
            qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(copyPasteKey)}&margin=10`;
          }

          const expiresAt = tx.expires_at || new Date(now.getTime() + expirationSeconds * 1000).toISOString();

          const newCharge: PixChargeData = {
            id: chargeId,
            status: (tx.status as PaymentStatus) || "pending",
            amount: Number(tx.amount || data.amount),
            description: data.description,
            pix: {
              copyPasteKey,
              qrCodeUrl,
              expiresAt,
              expiresInSeconds: expirationSeconds,
            },
            createdAt: now.toISOString(),
          };

          chargesDb.set(chargeId, newCharge);
          const context: OrderContext = {
            productName: data.description || "InstaSpy Acesso VIP",
            amount: newCharge.amount,
            createdAtMs: now.getTime(),
            customer: data.customer,
            tracking: data.tracking,
          };
          orderContexts.set(chargeId, context);

          await reportOrderToUtmify(chargeId, "waiting_payment", context);
          return newCharge;
        }
      } else {
        const errorText = await response.text();
        console.warn(`[TichuPay] Resposta inesperada ao criar PIX (${response.status}):`, errorText);
      }
    } catch (err) {
      console.error("[TichuPay] Erro de rede ao conectar à API:", err);
    }


    const fallbackId = `ch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const copyPasteKey = generateFallbackPixCopyPaste(fallbackId, data.amount);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(copyPasteKey)}&margin=10`;
    const expiresAt = new Date(now.getTime() + expirationSeconds * 1000).toISOString();

    const fallbackCharge: PixChargeData = {
      id: fallbackId,
      status: "pending",
      amount: data.amount,
      description: data.description,
      pix: {
        copyPasteKey,
        qrCodeUrl,
        expiresAt,
        expiresInSeconds: expirationSeconds,
      },
      createdAt: now.toISOString(),
    };

    chargesDb.set(fallbackId, fallbackCharge);
    orderContexts.set(fallbackId, {
      productName: data.description || "InstaSpy Acesso VIP",
      amount: fallbackCharge.amount,
      createdAtMs: now.getTime(),
      customer: data.customer,
      tracking: data.tracking,
    });
    return fallbackCharge;
  });

export interface CheckChargeStatusInput {
  chargeId: string;

  amount?: number;
  contentName?: string;

  externalId?: string;
  tracking?: OrderTracking;
}

function resolveOrderContext(
  input: CheckChargeStatusInput,
  fallbackAmount?: number,
): OrderContext | undefined {
  const stored = orderContexts.get(input.chargeId);
  if (stored) {
    return input.tracking && !stored.tracking ? { ...stored, tracking: input.tracking } : stored;
  }

  const amount = input.amount ?? fallbackAmount;
  if (!amount) return undefined;

  return {
    productName: input.contentName || "InstaSpy Acesso VIP",
    amount,
    createdAtMs: Date.now(),
    customer: input.externalId ? { name: input.externalId } : undefined,
    tracking: input.tracking,
  };
}

async function reportOrderToUtmify(
  chargeId: string,
  status: "waiting_payment" | "paid",
  context: OrderContext | undefined,
  approvedAtMs?: number,
): Promise<void> {
  if (!context || !context.amount || context.amount <= 0) return;
  try {
    const { sendUtmifyOrder } = await import("./utmify");
    await sendUtmifyOrder({
      orderId: chargeId,
      status,
      amount: context.amount,
      productName: context.productName,
      createdAtMs: context.createdAtMs,
      ...(approvedAtMs !== undefined ? { approvedAtMs } : {}),
      customer: context.customer,
      tracking: context.tracking,
    });
  } catch (err) {
    console.warn("[Payment] Falha ao reportar pedido para a Utmify:", err);
  }
}

async function reportPurchaseToFacebook(
  input: CheckChargeStatusInput,
  paidAt: string | undefined,
  fallbackAmount?: number,
): Promise<void> {
  const value = input.amount ?? fallbackAmount;
  if (!value || value <= 0) return;

  try {
    const { sendFacebookPurchase } = await import("./facebook-capi");
    await sendFacebookPurchase({
      chargeId: input.chargeId,
      value,
      currency: "BRL",
      ...(input.contentName ? { contentName: input.contentName } : {}),
      ...(input.externalId ? { externalId: input.externalId } : {}),
      ...(paidAt ? { paidAtMs: new Date(paidAt).getTime() } : {}),
    });
  } catch (err) {

    console.warn("[Payment] Falha ao reportar Purchase para o Facebook:", err);
  }
}

export const checkPixChargeStatusServer = createServerFn({ method: "GET" })
  .validator((input: string | CheckChargeStatusInput): CheckChargeStatusInput =>
    typeof input === "string" ? { chargeId: input } : input,
  )
  .handler(async ({ data }): Promise<{ status: PaymentStatus; paidAt?: string }> => {
    const chargeId = data.chargeId;

    const localCharge = chargesDb.get(chargeId);
    if (localCharge && localCharge.status === "paid") {
      const paidAtMs = localCharge.paidAt ? new Date(localCharge.paidAt).getTime() : Date.now();
      await Promise.all([
        reportPurchaseToFacebook(data, localCharge.paidAt, localCharge.amount),
        reportOrderToUtmify(
          chargeId,
          "paid",
          resolveOrderContext(data, localCharge.amount),
          paidAtMs,
        ),
      ]);
      return localCharge.paidAt
        ? { status: "paid", paidAt: localCharge.paidAt }
        : { status: "paid" };
    }

    try {
      const response = await fetch(`${TICHUPAY_BASE_URL}/${encodeURIComponent(chargeId)}`, {
        method: "GET",
        headers: {
          "x-api-key": TICHUPAY_API_KEY,
        },
      });

      if (response.ok) {

        const gateway = await response.json();
        const txStatus = String(gateway.status || gateway.transaction?.status || "").toLowerCase();

        if (txStatus === "paid" || txStatus === "approved" || txStatus === "completed") {
          const paidAt =
            gateway.paid_at || gateway.transaction?.paid_at || new Date().toISOString();
          if (localCharge) {
            localCharge.status = "paid";
            localCharge.paidAt = paidAt;
            chargesDb.set(chargeId, localCharge);
          }
          const gatewayAmount = Number(gateway.amount ?? gateway.transaction?.amount) || undefined;
          await Promise.all([
            reportPurchaseToFacebook(data, paidAt, localCharge?.amount ?? gatewayAmount),
            reportOrderToUtmify(
              chargeId,
              "paid",
              resolveOrderContext(data, localCharge?.amount ?? gatewayAmount),
              new Date(paidAt).getTime(),
            ),
          ]);
          return { status: "paid", paidAt };
        }

        if (txStatus === "expired") {
          return { status: "expired" };
        }

        if (txStatus === "failed" || txStatus === "canceled" || txStatus === "cancelled") {
          return { status: "failed" };
        }
      }
    } catch (err) {
      console.warn(`[TichuPay] Erro ao consultar status da cobrança ${chargeId}:`, err);
    }

    return { status: localCharge?.status || "pending" };
  });

export const simulatePixPaymentServer = createServerFn({ method: "POST" })
  .validator((chargeId: string) => chargeId)
  .handler(async ({ data: chargeId }): Promise<boolean> => {
    const now = new Date().toISOString();
    const charge = chargesDb.get(chargeId);
    if (charge) {
      charge.status = "paid";
      charge.paidAt = now;
      chargesDb.set(chargeId, charge);
    } else {
      chargesDb.set(chargeId, {
        id: chargeId,
        status: "paid",
        amount: 23.97,
        description: "Acesso VIP",
        pix: {
          copyPasteKey: "",
          qrCodeUrl: "",
          expiresAt: now,
          expiresInSeconds: 0,
        },
        createdAt: now,
        paidAt: now,
      });
    }
    return true;
  });
