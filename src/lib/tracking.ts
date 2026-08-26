export const FB_PIXEL_ID = "2612945209143453";

export const UTMIFY_TOKEN = "OEgW6qAdCAZKHmJ6ytWtMdrQ3aqz1AZDTnWu";
export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_id?: string;
}

const UTM_STORAGE_KEY = "instaspy_utm_params";

export function captureUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const utmKeys: (keyof UtmParams)[] = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "utm_id",
    ];

    const captured: UtmParams = {};
    let hasAny = false;

    for (const key of utmKeys) {
      const val = params.get(key);
      if (val) {
        captured[key] = val;
        hasAny = true;
      }
    }


    if (hasAny) {
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(captured));
      return captured;
    }

    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {

  }
  return {};
}

export function getStoredUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {

  }
  return {};
}

export function fbTrack(
  eventName: string,
  params?: Record<string, any>,

  eventId?: string,
): void {
  if (typeof window === "undefined") return;
  try {
    const fbq = (window as any).fbq;
    const utms = getStoredUtmParams();
    const enrichedParams = { ...utms, ...params };
    const options = eventId ? { eventID: eventId } : undefined;
    if (typeof fbq === "function") {
      if (Object.keys(enrichedParams).length > 0) {
        fbq("track", eventName, enrichedParams, options);
      } else if (options) {
        fbq("track", eventName, {}, options);
      } else {
        fbq("track", eventName);
      }
    }

    const utmify = (window as any).utmify;
    if (typeof utmify?.track === "function") {
      utmify.track(eventName, enrichedParams);
    }
  } catch (err) {
    console.warn("[Tracking] Erro ao disparar evento:", eventName, err);
  }
}

export function fbTrackCustom(eventName: string, params?: Record<string, any>): void {
  if (typeof window === "undefined") return;
  try {
    const fbq = (window as any).fbq;
    const utms = getStoredUtmParams();
    const enrichedParams = { ...utms, ...params };

    if (typeof fbq === "function") {
      if (Object.keys(enrichedParams).length > 0) {
        fbq("trackCustom", eventName, enrichedParams);
      } else {
        fbq("trackCustom", eventName);
      }
    }

    const utmify = (window as any).utmify;
    if (typeof utmify?.trackCustom === "function") {
      utmify.trackCustom(eventName, enrichedParams);
    }
  } catch (err) {
    console.warn("[Tracking] Erro ao disparar evento customizado:", eventName, err);
  }
}

export function trackPageView(path?: string): void {
  const currentPath = path || (typeof window !== "undefined" ? window.location.pathname : "/");
  fbTrack("PageView", {
    page_path: currentPath,
  });
}

export function trackViewContent(contentName: string, value?: number, currency = "BRL"): void {
  const params: Record<string, any> = {
    content_name: contentName,
    content_type: "product",
  };
  if (value !== undefined) {
    params["value"] = value;
    params["currency"] = currency;
  }
  fbTrack("ViewContent", params);
}

export function trackCompleteRegistration(method = "instaspy_form"): void {
  fbTrack("CompleteRegistration", {
    content_name: "InstaSpy Cadastro",
    status: true,
    method,
  });
}

export function trackSearch(searchTerm: string): void {
  fbTrack("Search", {
    search_string: searchTerm,
    content_category: "instagram_profile",
  });
}

export function trackInitiateCheckout(value: number, currency = "BRL"): void {
  fbTrack("InitiateCheckout", {
    value,
    currency,
    content_category: "pix_checkout",
    num_items: 1,
  });
}

export function trackOpenPaymentModal(page: string, value: number): void {
  fbTrackCustom("OpenPaymentModal", {
    page,
    value,
    currency: "BRL",
  });
}

export function trackAddPaymentInfo(value: number, currency = "BRL"): void {
  fbTrack("AddPaymentInfo", {
    value,
    currency,
    payment_type: "pix",
    content_category: "pix_generated",
  });
}

export function trackCopyPixCode(page: string, value: number): void {
  fbTrackCustom("CopyPixCode", {
    page,
    value,
    currency: "BRL",
  });
}

export function trackPurchase(
  value: number,
  currency = "BRL",
  contentName?: string,
  chargeId?: string,
): void {
  fbTrack(
    "Purchase",
    {
      value,
      currency,
      content_name: contentName || "InstaSpy Acesso VIP",
      content_type: "product",
      num_items: 1,
    },
    chargeId ? `purchase_${chargeId}` : undefined,
  );
}
export function trackLead(contentName: string, value?: number): void {
  const params: Record<string, any> = {
    content_name: contentName,
    content_category: "lead",
  };
  if (value !== undefined) {
    params["value"] = value;
    params["currency"] = "BRL";
  }
  fbTrack("Lead", params);
}

export function trackStartScanning(username: string): void {
  fbTrackCustom("StartScanning", {
    content_name: username,
    content_category: "profile_scan",
  });
}

export function trackDeclineUpsell(): void {
  fbTrackCustom("DeclineUpsell", {
    content_category: "upsell_declined",
  });
}
