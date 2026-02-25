import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "tcghub_session_id";

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Check if current URL has ?noTrack=1 */
function isNoTrack(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("noTrack") === "1";
  } catch {
    return false;
  }
}

interface TrackPayload {
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
}

const recentEvents = new Map<string, number>();
const DEBOUNCE_MS = 2000;

export async function trackEvent(eventName: string, payload: TrackPayload = {}) {
  if (isNoTrack()) return;

  try {
    // Check if analytics is paused (dev mode)
    const { data: setting } = await (supabase as any)
      .from("app_settings")
      .select("value")
      .eq("key", "analytics_paused")
      .maybeSingle();
    if ((setting as any)?.value === true) return;

    const key = `${eventName}:${payload.entity_type || ""}:${payload.entity_id || ""}`;
    const now = Date.now();
    const last = recentEvents.get(key);
    if (last && now - last < DEBOUNCE_MS) return;
    recentEvents.set(key, now);

    const sessionId = getSessionId();
    const { data: { user } } = await supabase.auth.getUser();

    await (supabase as any).from("analytics_events").insert({
      event_name: eventName,
      entity_type: payload.entity_type || null,
      entity_id: payload.entity_id || null,
      user_id: user?.id || null,
      session_id: sessionId,
      metadata: payload.metadata || {},
    });
  } catch {
    // Silent fail — analytics should never break UX
  }
}
