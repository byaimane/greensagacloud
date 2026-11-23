import {
  fetchPushBundleFromSupabase,
  pushBundleToSupabase,
} from '../lib/supabaseClient';
import { AdminConfig, AppPushBundle } from '../types/admin';

export const ADMIN_AUTH_KEY = 'ouagx_admin_session_v1';
export const ANDROID_APP_ID = 'com.ouagx.myapp';
export const LAST_APPLIED_REV_KEY = 'ouagx_last_push_rev_v1';

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
  // When running inside Capacitor Android WebView, default to Android Emulator host loopback
  if (proto === 'capacitor:' || host === 'localhost' && navigator.userAgent.includes('Android')) {
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
  notificationBody: string
): AppPushBundle {
  const nextRevision = (config.pushRevision ?? 0) + 1;
  return {
    revision: nextRevision,
    pushedAt: new Date().toISOString(),
    appId: ANDROID_APP_ID,
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

export async function pushUpdateToAndroidApp(
  serverBaseUrl: string,
  bundle: AppPushBundle,
  fullConfig?: AdminConfig
): Promise<{ ok: boolean; remoteSaved: boolean; supabaseSaved: boolean }> {
  // Always broadcast over local channel for instant multi-tab & preview sync
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel('ouagx_app_push_v1');
      ch.postMessage({ type: 'push_bundle', bundle });
      ch.close();
    }
  } catch {
    // ignore
  }

  // 1. Push directly to Supabase Cloud (works worldwide for Android APK & AAB!)
  let supabaseSaved = false;
  if (fullConfig) {
    supabaseSaved = await pushBundleToSupabase(fullConfig, bundle);
  }

  // 2. Also persist to local Sync API if reachable
  let remoteSaved = supabaseSaved;
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
  return { ok: true, remoteSaved, supabaseSaved };
}

export async function fetchLatestAppPush(serverBaseUrl: string): Promise<AppPushBundle | null> {
  // Prefer Supabase Cloud live push bundle first (worldwide Android OTA sync!)
  const supaBundle = await fetchPushBundleFromSupabase();
  if (supaBundle) return supaBundle;

  const base = (serverBaseUrl || getDefaultPushServerUrl()).replace(/\/+$/, '');
  try {
    const res = await fetch(`${base}/api/app-config?appId=${encodeURIComponent(ANDROID_APP_ID)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as AppPushBundle | { bundle?: AppPushBundle | null };
    if (data && 'revision' in data && typeof data.revision === 'number') {
      return data;
    }
    if (data && 'bundle' in data && data.bundle && typeof data.bundle.revision === 'number') {
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
