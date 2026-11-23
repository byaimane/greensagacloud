import { CropId } from './game';

export type AdPlacement = 'landing_banner' | 'game_hud_pill' | 'shop_banner';

export interface AdCampaign {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  targetUrl: string;
  placement: AdPlacement;
  accentColor: string;
  active: boolean;
  impressions: number;
  clicks: number;
}

export type UserRole = 'admin' | 'vip' | 'player';
export type UserStatus = 'active' | 'muted' | 'banned';

export interface ManagedUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  level: number;
  gold: number;
  day: number;
  joinedDate: string;
  isCurrentPlayer?: boolean;
}

export interface PluginEntry {
  id: string;
  name: string;
  version: string;
  author: string;
  category: 'gameplay' | 'ui' | 'social' | 'economy';
  description: string;
  enabled: boolean;
}

export type ThemeId = 'emerald' | 'autumn' | 'sakura' | 'winter' | 'midnight';

export interface ThemePalette {
  id: ThemeId;
  name: string;
  grassA: string;
  grassB: string;
  grassTuft: string;
  pathColor: string;
  plazaColor: string;
  waterLight: string;
  waterDeep: string;
  treePalettes: [string, string, string][];
  uiAccent: string;
  heroGradient: string;
  previewSwatches: [string, string, string];
}

export interface MapPreset {
  id: string;
  name: string;
  regionCode: string;
  themeId: ThemeId;
  sizeLabel: string;
  multiplayerEnabled: boolean;
  weatherRainChance: number; // 0..1
  butterfliesEnabled: boolean;
  defaultRoomCode: string;
  description: string;
}

export interface LevelOverride {
  level: number;
  xpRequired: number;
  sellBonusPct: number;
  customTitle?: string;
}

export interface PushHistoryEntry {
  revision: number;
  pushedAt: string;
  notificationTitle: string;
  notificationBody: string;
  announcement: string;
  activeAdsCount: number;
  themeId: ThemeId;
  mapId: string;
  status: 'delivered' | 'local_only';
}

export interface AppPushBundle {
  revision: number;
  pushedAt: string;
  appId: string;
  notification?: {
    title: string;
    body: string;
  };
  announcement: string;
  maintenanceMode: boolean;
  ads: AdCampaign[];
  activeThemeId: ThemeId;
  activeMapId: string;
  economy: AdminConfig['economy'];
  plugins: PluginEntry[];
  levelOverrides: LevelOverride[];
}

export interface AdminConfig {
  version: number;
  brandName: string;
  copyrightText: string;
  announcement: string;
  maintenanceMode: boolean;
  activeThemeId: ThemeId;
  activeMapId: string;
  pushServerUrl: string;
  pushRevision: number;
  pushHistory: PushHistoryEntry[];
  economy: {
    xpMultiplier: number;
    growthMultiplier: number;
    sellMultiplier: number;
  };
  levelOverrides: LevelOverride[];
  ads: AdCampaign[];
  users: ManagedUser[];
  plugins: PluginEntry[];
  maps: MapPreset[];
  customNeighborSeeds?: CropId[];
}
