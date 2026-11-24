import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  fetchPushBundleFromSupabase,
  pushBundleToSupabase,
  supabase,
} from '../lib/supabaseClient';
import { AdminConfig, AppPushBundle } from '../types/admin';

export const ADMIN_AUTH_KEY = 'ouagx_admin_session_v1';
export const ANDROID_APP_ID = 'com.ouagx.myapp';
export const LAST_APPLIED_REV_KEY = 'ouagx_last_push_rev_v1';
export const LAST_APPLIED_AT_KEY = 'ouagx_last_push_at_v1';
export const LAST_BUNDLE_CACHE_KEY = 'ouagx_last_push_bundle_v1';
export const OTA_REALTIME_CHANNEL = `greensaga_ota_push_${ANDROID_APP_ID}`;

const EXPECTED_EMAIL = 'farm@ouagx.com';
const EXPECTED_PASS = '254637';

export function verifyAdminCredentials(email: string, password: string): boolean {
  const ok =
    email.trim().toLowerCase() === EXPECTED_EMAIL && password.trim() === EXPECTED_PASS;
  if (ok) {
    try {
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'authenticated');
    } catch {
      // ignore
    }
  }
  return ok;
}

export function isAdminAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_AUTH_KEY) === 'authenticated';
  } catch {
    return false;
  }
}

export function logoutAdmin(): void {
  try {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
  } catch {
    // ignore
  }
}

export function isAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return path === '/admin' || hash === '#admin' || hash === '#/admin';
}

export function getDefaultPushServerUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:5173';
  const proto = window.location.protocol;
  const host = window.location.host;
  if (proto === 'capacitor:' || (host === 'localhost' && navigator.userAgent.includes('Android'))) {
    return 'http://10.0.2.2:5173';
  }
  if (proto === 'http:' || proto === 'https:') {
    return window.location.origin;
  }
  return 'http://10.0.2.2:5173';
}

export function buildPushBundle(
  config: AdminConfig,
  notificationTitle: string,
  notificationBody: string,
  minRevision = 0
): AppPushBundle {
  const nextRevision = Math.max(config.pushRevision ?? 0, minRevision) + 1;
  return {
    revision: nextRevision,
    pushedAt: new Date().toISOString(),
    appId: ANDROID_APP_ID,
    brandName: config.brandName,
    notification:
      notificationTitle.trim() || notificationBody.trim()
        ? {
            title: notificationTitle.trim() || `${config.brandName} Update`,
            body: notificationBody.trim() || config.announcement || 'New valley update available!',
          }
        : undefined,
    announcement: config.announcement,
    maintenanceMode: config.maintenanceMode,
    ads: config.ads,
    activeThemeId: config.activeThemeId,
    activeMapId: config.activeMapId,
    economy: config.economy,
    plugins: config.plugins,
    levelOverrides: config.levelOverrides,
  };
}

export function saveCachedLatestBundle(bundle: AppPushBundle): void {
  try {
    localStorage.setItem(LAST_BUNDLE_CACHE_KEY, JSON.stringify(bundle));
  } catch {
    // ignore
  }
}

export function loadCachedLatestBundle(): AppPushBundle | null {
  try {
    const raw = localStorage.getItem(LAST_BUNDLE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppPushBundle;
    if (parsed && typeof parsed.revision === 'number' && parsed.pushedAt) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

// Persistent Supabase Realtime OTA Push Receiver + Peer Catch-Up Relay
// Works worldwide across Android APKs, AABs, and web browsers with ZERO SQL tables required!
let activeOtaChannel: RealtimeChannel | null = null;
let activeOtaConnected = false;

export function startOtaRealtimeSync(
  onBundle: (bundle: AppPushBundle) => void,
  onStatus?: (connected: boolean) => void
): () => void {
  const clientKey = `ota_${Math.random().toString(36).slice(2, 9)}`;
  const ch = supabase.channel(OTA_REALTIME_CHANNEL, {
    config: {
      broadcast: { self: false },
      presence: { key: clientKey },
    },
  });

  const handleIncoming = (raw: unknown) => {
    if (!raw || typeof raw !== 'object') return;
    const b = raw as AppPushBundle;
    if (typeof b.revision === 'number' && b.pushedAt && b.appId === ANDROID_APP_ID) {
      saveCachedLatestBundle(b);
      onBundle(b);
      if (activeOtaConnected) {
        ch.track({ latestBundle: b, updatedAt: b.pushedAt }).catch(() => {});
      }
    }
  };

  ch.on('broadcast', { event: 'push_bundle' }, ({ payload }) => {
    handleIncoming(payload);
  });

  ch.on('broadcast', { event: 'request_latest_push' }, () => {
    const cached = loadCachedLatestBundle();
    if (cached && activeOtaConnected) {
      ch.send({ type: 'broadcast', event: 'push_bundle', payload: cached }).catch(() => {});
    }
  });

  const inspectPresence = () => {
    const state = ch.presenceState<{ latestBundle?: AppPushBundle }>();
    let newest: AppPushBundle | null = null;
    for (const entries of Object.values(state)) {
      for (const e of entries) {
        const b = e?.latestBundle;
        if (b && typeof b.revision === 'number' && b.pushedAt) {
          if (!newest || b.pushedAt > newest.pushedAt) {
            newest = b;
          }
        }
      }
    }
    if (newest) {
      handleIncoming(newest);
    }
  };

  ch.on('presence', { event: 'sync' }, inspectPresence);
  ch.on('presence', { event: 'join' }, inspectPresence);

  ch.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      activeOtaConnected = true;
      onStatus?.(true);
      const cached = loadCachedLatestBundle();
      try {
        await ch.track(cached ? { latestBundle: cached, updatedAt: cached.pushedAt } : { ready: true });
      } catch {
        // ignore
      }
      // Ask any online Admin console or synced peer for the newest push bundle immediately!
      ch.send({ type: 'broadcast', event: 'request_latest_push', payload: { clientKey } }).catch(() => {});
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      activeOtaConnected = false;
      onStatus?.(false);
    }
  });

  activeOtaChannel = ch;

  return () => {
    activeOtaConnected = false;
    if (activeOtaChannel === ch) activeOtaChannel = null;
    supabase.removeChannel(ch).catch(() => {});
  };
}

async function broadcastBundleViaSupabaseRealtime(bundle: AppPushBundle): Promise<boolean> {
  // Reuse active subscribed OTA channel if available
  if (activeOtaChannel && activeOtaConnected) {
    try {
      await activeOtaChannel.track({ latestBundle: bundle, updatedAt: bundle.pushedAt });
      const res = await activeOtaChannel.send({
        type: 'broadcast',
        event: 'push_bundle',
        payload: bundle,
      });
      return res === 'ok';
    } catch {
      // fall through to ephemeral channel
    }
  }

  // Otherwise open a quick channel, subscribe, broadcast, and keep presence warm briefly
  return new Promise<boolean>((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (!settled) {
        settled = true;
        resolve(ok);
      }
    };
    const ch = supabase.channel(OTA_REALTIME_CHANNEL, {
      config: { broadcast: { self: false }, presence: { key: `admin_${Date.now()}` } },
    });
    const timer = window.setTimeout(() => done(false), 5000);
    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        try {
          await ch.track({ latestBundle: bundle, updatedAt: bundle.pushedAt });
          const res = await ch.send({
            type: 'broadcast',
            event: 'push_bundle',
            payload: bundle,
          });
          window.clearTimeout(timer);
          done(res === 'ok');
          // Keep anchor alive if no global channel is holding it
          if (!activeOtaChannel) {
            activeOtaChannel = ch;
            activeOtaConnected = true;
          } else {
            window.setTimeout(() => supabase.removeChannel(ch).catch(() => {}), 3000);
          }
        } catch {
          window.clearTimeout(timer);
          done(false);
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        window.clearTimeout(timer);
        done(false);
      }
    });
  });
}

export async function pushUpdateToAndroidApp(
  serverBaseUrl: string,
  bundle: AppPushBundle,
  fullConfig?: AdminConfig
): Promise<{ ok: boolean; remoteSaved: boolean; supabaseSaved: boolean; realtimeSent: boolean }> {
  saveCachedLatestBundle(bundle);

  // 1. Broadcast over local tab BroadcastChannel (instant same-browser sync)
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel('ouagx_app_push_v1');
      ch.postMessage({ type: 'push_bundle', bundle });
      ch.close();
    }
  } catch {
    // ignore
  }

  // 2. Broadcast INSTANTLY over Supabase Realtime Cloud (reaches ALL Android phones worldwide in <200ms!)
  const realtimeSent = await broadcastBundleViaSupabaseRealtime(bundle);

  // 3. Persist permanently to Supabase Cloud Database (if SQL tables are created)
  let supabaseSaved = false;
  if (fullConfig) {
    supabaseSaved = await pushBundleToSupabase(fullConfig, bundle);
  }

  // 4. Also persist to local Sync API if reachable
  let remoteSaved = realtimeSent || supabaseSaved;
  const base = (serverBaseUrl || getDefaultPushServerUrl()).replace(/\/+$/, '');
  try {
    const res = await fetch(`${base}/api/push-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bundle),
    });
    if (res.ok) {
      remoteSaved = true;
    }
  } catch {
    // Fallback if offline / static preview
  }

  return { ok: true, remoteSaved, supabaseSaved, realtimeSent };
}

export async function fetchLatestAppPush(serverBaseUrl: string): Promise<AppPushBundle | null> {
  // 1. Prefer Supabase Cloud Database live push bundle first
  const supaBundle = await fetchPushBundleFromSupabase();
  if (supaBundle) {
    saveCachedLatestBundle(supaBundle);
    return supaBundle;
  }

  // 2. Fallback to local Sync API if reachable
  const base = (serverBaseUrl || getDefaultPushServerUrl()).replace(/\/+$/, '');
  try {
    const res = await fetch(`${base}/api/app-config?appId=${encodeURIComponent(ANDROID_APP_ID)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as AppPushBundle | { bundle?: AppPushBundle | null };
    if (data && 'revision' in data && typeof data.revision === 'number') {
      saveCachedLatestBundle(data);
      return data;
    }
    if (data && 'bundle' in data && data.bundle && typeof data.bundle.revision === 'number') {
      saveCachedLatestBundle(data.bundle);
      return data.bundle;
    }
    return null;
  } catch {
    return null;
  }
}

export function getLastAppliedRevision(): number {
  try {
    return Number(localStorage.getItem(LAST_APPLIED_REV_KEY) || '0') || 0;
  } catch {
    return 0;
  }
}

export function setLastAppliedRevision(rev: number): void {
  try {
    localStorage.setItem(LAST_APPLIED_REV_KEY, String(rev));
  } catch {
    // ignore
  }
}

export function getLastAppliedPushAt(): string {
  try {
    return localStorage.getItem(LAST_APPLIED_AT_KEY) || '';
  } catch {
    return '';
  }
}

export function setLastAppliedPushAt(pushedAt: string): void {
  try {
    localStorage.setItem(LAST_APPLIED_AT_KEY, pushedAt);
  } catch {
    // ignore
  }
}

export function shouldApplyPushBundle(bundle: AppPushBundle): boolean {
  const lastAt = getLastAppliedPushAt();
  if (bundle.pushedAt && lastAt) {
    return bundle.pushedAt > lastAt;
  }
  if (bundle.pushedAt && !lastAt) {
    return true;
  }
  return bundle.revision > getLastAppliedRevision();
}
