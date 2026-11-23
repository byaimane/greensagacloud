import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AdminConfig, AppPushBundle, ManagedUser } from '../types/admin';
import { ChatMessage, GameState } from '../types/game';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://anfgaheimvvyjncytawk.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_IIaqhNuEvarUQfXd_enKwg_hn99b2FL';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

const PLAYER_ID_KEY = 'greensaga_player_id_v1';

export function getOrCreatePlayerId(): string {
  try {
    let id = localStorage.getItem(PLAYER_ID_KEY);
    if (!id) {
      id = `gs_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
      localStorage.setItem(PLAYER_ID_KEY, id);
    }
    return id;
  } catch {
    return 'gs_local_player';
  }
}

export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  tablesReady: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('greensaga_app_config')
      .select('id, revision')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      return { connected: true, tablesReady: false, error: error.message };
    }
    return { connected: true, tablesReady: true };
  } catch (err) {
    return {
      connected: false,
      tablesReady: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

export async function pushBundleToSupabase(
  config: AdminConfig,
  bundle: AppPushBundle
): Promise<boolean> {
  try {
    const { error: upsertErr } = await supabase.from('greensaga_app_config').upsert(
      {
        id: 'default',
        app_id: bundle.appId,
        brand_name: config.brandName,
        revision: bundle.revision,
        announcement: bundle.announcement,
        config_json: config,
        push_bundle_json: bundle,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (upsertErr) return false;

    await supabase.from('greensaga_push_history').insert({
      app_id: bundle.appId,
      revision: bundle.revision,
      title: bundle.notification?.title ?? `${config.brandName} Update`,
      body: bundle.notification?.body ?? bundle.announcement,
      announcement: bundle.announcement,
      active_ads_count: bundle.ads.filter((a) => a.active).length,
      theme_id: bundle.activeThemeId,
      pushed_at: bundle.pushedAt,
    });
    return true;
  } catch {
    return false;
  }
}

export async function fetchPushBundleFromSupabase(): Promise<AppPushBundle | null> {
  try {
    const { data, error } = await supabase
      .from('greensaga_app_config')
      .select('push_bundle_json')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data?.push_bundle_json) return null;
    const bundle = data.push_bundle_json as AppPushBundle;
    if (typeof bundle.revision === 'number') {
      return bundle;
    }
    return null;
  } catch {
    return null;
  }
}

export async function syncPlayerSaveToSupabase(state: GameState): Promise<boolean> {
  try {
    const playerId = getOrCreatePlayerId();
    const { error } = await supabase.from('greensaga_player_saves').upsert(
      {
        player_id: playerId,
        username: state.player.name,
        level: state.player.level,
        gold: state.player.gold,
        day: state.day,
        room_code: state.player.roomCode,
        save_json: state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'player_id' }
    );
    return !error;
  } catch {
    return false;
  }
}

export async function fetchCloudPlayersFromSupabase(): Promise<ManagedUser[]> {
  try {
    const { data, error } = await supabase
      .from('greensaga_player_saves')
      .select('player_id, username, level, gold, day, role, status, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error || !data) return [];
    const localId = getOrCreatePlayerId();
    return data.map((row) => ({
      id: row.player_id as string,
      username: row.username as string,
      email: `${String(row.username).toLowerCase().replace(/\s+/g, '')}@greensaga.cloud`,
      role: (row.role as ManagedUser['role']) || 'player',
      status: (row.status as ManagedUser['status']) || 'active',
      level: Number(row.level) || 1,
      gold: Number(row.gold) || 0,
      day: Number(row.day) || 1,
      joinedDate: String(row.updated_at || '').slice(0, 10),
      isCurrentPlayer: row.player_id === localId,
    }));
  } catch {
    return [];
  }
}

export async function sendCloudChatMessage(
  roomCode: string,
  sender: string,
  message: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('greensaga_valley_chat').insert({
      room_code: roomCode,
      sender,
      message,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function fetchCloudChatMessages(roomCode: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('greensaga_valley_chat')
      .select('id, sender, message, created_at')
      .eq('room_code', roomCode)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) return [];
    return [...data].reverse().map((row) => {
      const d = new Date(row.created_at as string);
      const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      return {
        id: `sb_${row.id}`,
        sender: row.sender as string,
        text: row.message as string,
        time,
      };
    });
  } catch {
    return [];
  }
}
