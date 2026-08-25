import {
  getCookie,
  getRequestHeader,
  getRequestIP,
  getRequestUrl,
} from "@tanstack/react-start/server";

import { FB_PIXEL_ID } from "./tracking";

const GRAPH_API_VERSION = "v21.0";
const FB_ACCESS_TOKEN =
  "EAAM1AZBZAXRZCsBSbQvmzUIwmMUb8shWiZAZBc2DQIUDfa94KYUtYK5b20rrDqX4E5Xk27dCYJE1keZBDOCPZBTawFIA8ySvhF6QLP1b0CuEeIXKxlZAY7PEpZCazcD5osby4CVN2VpZBH5r9m3ZCg0WI4qZC0a2cfKZCmKh3ERPFCPaZB7SOks4bq0kPBnOlDcoUMkroRCQZDZD";
const CAPI_PIXEL_ID = FB_PIXEL_ID;
const FB_TEST_EVENT_CODE = "";
async function hash(value: string | undefined | null): Promise<string | undefined> {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return undefined;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

const sentEvents = new Map<string, number>();
const SENT_TTL_MS = 6 * 60 * 60_000;
function alreadySent(eventId: string): boolean {
  const now = Date.now();
  for (const [key, at] of sentEvents) {
    if (now - at > SENT_TTL_MS) sentEvents.delete(key);
  }
  if (sentEvents.has(eventId)) return true;
  sentEvents.set(eventId, now);
  return false;
}
interface RequestContext {
  clientIp?: string | undefined;
  userAgent?: string | undefined;
  fbp?: string | undefined;
  fbc?: string | undefined;
  sourceUrl?: string | undefined;
}

export function collectRequestContext(): RequestContext {
  const context: RequestContext = {};
  try {
    context.clientIp = getRequestIP({ xForwardedFor: true });
    context.userAgent = getRequestHeader("user-agent");
    context.fbp = getCookie("_fbp");
    context.fbc = getCookie("_fbc");
    context.sourceUrl = getRequestUrl({ xForwardedHost: true, xForwardedProto: true }).toString();
  } catch {

  }
  return context;
}

export interface ServerEventInput {
  eventName: string;

  eventId: string;
  eventTimeMs?: number;
  value?: number;
  currency?: string;
  contentName?: string;

  externalId?: string;
  email?: string;
  phone?: string;
  context?: RequestContext;
}
export interface ServerEventResult {
  sent: boolean;
  reason?: string;
  eventsReceived?: number;
}

export async function sendFacebookServerEvent(input: ServerEventInput): Promise<ServerEventResult> {
  const pixelId = CAPI_PIXEL_ID;
  const accessToken = FB_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    return { sent: false, reason: "pixel id ou access token ausente" };
  }

  if (alreadySent(input.eventId)) {
    return { sent: false, reason: "já enviado (dedup local)" };
  }

  const context = input.context ?? collectRequestContext();

  const [emailHash, phoneHash, externalIdHash] = await Promise.all([
    hash(input.email),
    hash(input.phone?.replace(/\D/g, "")),
    hash(input.externalId),
  ]);

  const userData: Record<string, unknown> = {};
  if (emailHash) userData["em"] = [emailHash];
  if (phoneHash) userData["ph"] = [phoneHash];
  if (externalIdHash) userData["external_id"] = [externalIdHash];
  if (context.clientIp) userData["client_ip_address"] = context.clientIp;
  if (context.userAgent) userData["client_user_agent"] = context.userAgent;
  if (context.fbp) userData["fbp"] = context.fbp;
  if (context.fbc) userData["fbc"] = context.fbc;
  const customData: Record<string, unknown> = {};
  if (input.value !== undefined) {
    customData["value"] = input.value;
    customData["currency"] = input.currency ?? "BRL";
  }
  if (input.contentName) {
    customData["content_name"] = input.contentName;
    customData["content_type"] = "product";
    customData["num_items"] = 1;
  }

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor((input.eventTimeMs ?? Date.now()) / 1000),
        event_id: input.eventId,
        action_source: "website",
        ...(context.sourceUrl ? { event_source_url: context.sourceUrl } : {}),
        user_data: userData,
        ...(Object.keys(customData).length > 0 ? { custom_data: customData } : {}),
      },
    ],
  };

  const testEventCode = FB_TEST_EVENT_CODE;
  if (testEventCode) payload["test_event_code"] = testEventCode;

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8_000),
      },
    );

    const body = (await response.json().catch(() => ({}))) as {
      events_received?: number;
      error?: { message?: string };
    };

    if (!response.ok) {

      sentEvents.delete(input.eventId);
      const reason = body?.error?.message ?? `HTTP ${response.status}`;
      console.warn(`[FB CAPI] ${input.eventName} recusado: ${reason}`);
      return { sent: false, reason };
    }

    console.info(
      `[FB CAPI] ${input.eventName} enviado (event_id=${input.eventId}, recebidos=${body?.events_received ?? 0})`,
    );
    return { sent: true, eventsReceived: body?.events_received ?? 0 };
  } catch (error) {
    sentEvents.delete(input.eventId);
    const reason = (error as Error)?.message ?? "erro de rede";
    console.warn(`[FB CAPI] falha ao enviar ${input.eventName}: ${reason}`);
    return { sent: false, reason };
  }
}

export function purchaseEventId(chargeId: string): string {
  return `purchase_${chargeId}`;
}

export async function sendFacebookPurchase(params: {
  chargeId: string;
  value: number;
  currency?: string;
  contentName?: string;
  externalId?: string;
  paidAtMs?: number;
  context?: RequestContext;
}): Promise<ServerEventResult> {
  return sendFacebookServerEvent({
    eventName: "Purchase",
    eventId: purchaseEventId(params.chargeId),
    ...(params.paidAtMs !== undefined ? { eventTimeMs: params.paidAtMs } : {}),
    value: params.value,
    currency: params.currency ?? "BRL",
    ...(params.contentName ? { contentName: params.contentName } : {}),
    ...(params.externalId ? { externalId: params.externalId } : {}),
    ...(params.context ? { context: params.context } : {}),
  });
}
