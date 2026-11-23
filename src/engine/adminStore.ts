import { xpRequiredForLevel } from '../data/crops';
import { getDefaultPushServerUrl } from './appSyncClient';
import {
  AdminConfig,
  AdCampaign,
  LevelOverride,
  ManagedUser,
  MapPreset,
  PluginEntry,
  ThemeId,
  ThemePalette,
} from '../types/admin';

export const ADMIN_STORAGE_KEY = 'ouagx_admin_config_v1';

export const THEME_PALETTES: Record<ThemeId, ThemePalette> = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Valley',
    grassA: '#72bd64',
    grassB: '#6ab55d',
    grassTuft: '#5aa34e',
    pathColor: '#d6be8a',
    plazaColor: '#cfc4ab',
    waterLight: '#38bdf8',
    waterDeep: '#0ea5e9',
    treePalettes: [
      ['#15803d', '#22c55e', '#4ade80'],
      ['#166534', '#16a34a', '#86efac'],
      ['#3f6212', '#65a30d', '#a3e635'],
    ],
    uiAccent: '#16a34a',
    heroGradient: 'radial-gradient(circle at 50% 15%, #4ade80 0%, #24783e 45%, #163d23 100%)',
    previewSwatches: ['#72bd64', '#38bdf8', '#f59e0b'],
  },
  autumn: {
    id: 'autumn',
    name: 'Autumn Harvest',
    grassA: '#c8a556',
    grassB: '#bd9a4d',
    grassTuft: '#a47d34',
    pathColor: '#dfbe8f',
    plazaColor: '#d6c3a5',
    waterLight: '#2dd4bf',
    waterDeep: '#0d9488',
    treePalettes: [
      ['#b45309', '#f59e0b', '#fcd34d'],
      ['#9a3412', '#ea580c', '#fb923c'],
      ['#991b1b', '#dc2626', '#f87171'],
    ],
    uiAccent: '#ea580c',
    heroGradient: 'radial-gradient(circle at 50% 15%, #fb923c 0%, #9a3412 48%, #431407 100%)',
    previewSwatches: ['#c8a556', '#ea580c', '#dc2626'],
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura Blossom',
    grassA: '#8fd18b',
    grassB: '#85c981',
    grassTuft: '#6db369',
    pathColor: '#ecd9c6',
    plazaColor: '#e8dce0',
    waterLight: '#60a5fa',
    waterDeep: '#3b82f6',
    treePalettes: [
      ['#be185d', '#f472b6', '#fbcfe8'],
      ['#db2777', '#f9a8d4', '#fce7f3'],
      ['#9d174d', '#ec4899', '#fbcfe8'],
    ],
    uiAccent: '#ec4899',
    heroGradient: 'radial-gradient(circle at 50% 15%, #f472b6 0%, #9d174d 48%, #500724 100%)',
    previewSwatches: ['#8fd18b', '#f472b6', '#fbcfe8'],
  },
  winter: {
    id: 'winter',
    name: 'Winter Frost',
    grassA: '#dcebf7',
    grassB: '#d1e3f2',
    grassTuft: '#b3cde0',
    pathColor: '#cbd5e1',
    plazaColor: '#e2e8f0',
    waterLight: '#7dd3fc',
    waterDeep: '#0284c7',
    treePalettes: [
      ['#0f766e', '#14b8a6', '#e0f2fe'],
      ['#1e3a5f', '#2d5a87', '#f0f9ff'],
      ['#334155', '#475569', '#f8fafc'],
    ],
    uiAccent: '#0284c7',
    heroGradient: 'radial-gradient(circle at 50% 15%, #38bdf8 0%, #1d4ed8 48%, #0f172a 100%)',
    previewSwatches: ['#dcebf7', '#38bdf8', '#1e3a5f'],
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Neon',
    grassA: '#1e3a4c',
    grassB: '#1a3344',
    grassTuft: '#122634',
    pathColor: '#475569',
    plazaColor: '#334155',
    waterLight: '#22d3ee',
    waterDeep: '#0891b2',
    treePalettes: [
      ['#4c1d95', '#7c3aed', '#c084fc'],
      ['#155e75', '#06b6d4', '#67e8f9'],
      ['#312e81', '#6366f1', '#a5b4fc'],
    ],
    uiAccent: '#6366f1',
    heroGradient: 'radial-gradient(circle at 50% 15%, #818cf8 0%, #312e81 48%, #0f172a 100%)',
    previewSwatches: ['#1e3a4c', '#22d3ee', '#7c3aed'],
  },
};

export const THEME_LIST: ThemePalette[] = Object.values(THEME_PALETTES);

function createDefaultLevelOverrides(): LevelOverride[] {
  return Array.from({ length: 10 }, (_, idx) => {
    const level = idx + 1;
    const sellBonusPct = level >= 10 ? 45 : level < 3 ? 0 : (level - 2) * 5;
    return {
      level,
      xpRequired: xpRequiredForLevel(level),
      sellBonusPct,
    };
  });
}

const DEFAULT_ADS: AdCampaign[] = [
  {
    id: 'ad_harvest_fest',
    title: 'OUAGX Harvest Pass · Season 1',
    description: 'Unlock golden sprinklers, exclusive orchard trees & double weekend XP!',
    ctaLabel: 'Explore Market',
    targetUrl: '#shop',
    placement: 'landing_banner',
    accentColor: '#eab308',
    active: true,
    impressions: 1240,
    clicks: 184,
  },
  {
    id: 'ad_mp_event',
    title: 'Weekend Valley Co-op Event',
    description: 'Water neighbor farms in Room VALLEY-01 for bonus Gold & XP!',
    ctaLabel: 'Open Map',
    targetUrl: '#map',
    placement: 'game_hud_pill',
    accentColor: '#6366f1',
    active: true,
    impressions: 892,
    clicks: 147,
  },
  {
    id: 'ad_seed_bundle',
    title: 'Maya’s Mega Fertilizer Sale',
    description: 'Boost growth speed by +60% with Rich Fertilizer — only 25g!',
    ctaLabel: 'Buy Now',
    targetUrl: '#shop',
    placement: 'shop_banner',
    accentColor: '#16a34a',
    active: true,
    impressions: 640,
    clicks: 98,
  },
];

const DEFAULT_USERS: ManagedUser[] = [
  {
    id: 'usr_self',
    username: 'Farmer OUAGX',
    email: 'admin@ouagx.valley',
    role: 'admin',
    status: 'active',
    level: 1,
    gold: 180,
    day: 1,
    joinedDate: '2026-11-01',
    isCurrentPlayer: true,
  },
  {
    id: 'usr_amine',
    username: 'Amine',
    email: 'amine@ouagx.valley',
    role: 'vip',
    status: 'active',
    level: 5,
    gold: 1420,
    day: 14,
    joinedDate: '2026-11-04',
  },
  {
    id: 'usr_claire',
    username: 'Claire',
    email: 'claire@ouagx.valley',
    role: 'vip',
    status: 'active',
    level: 7,
    gold: 2890,
    day: 21,
    joinedDate: '2026-11-06',
  },
  {
    id: 'usr_yasmine',
    username: 'Yasmine',
    email: 'yasmine@ouagx.valley',
    role: 'player',
    status: 'active',
    level: 6,
    gold: 1960,
    day: 17,
    joinedDate: '2026-11-10',
  },
  {
    id: 'usr_leo',
    username: 'Leo',
    email: 'leo@ouagx.valley',
    role: 'player',
    status: 'active',
    level: 9,
    gold: 5400,
    day: 32,
    joinedDate: '2026-11-12',
  },
];

const DEFAULT_PLUGINS: PluginEntry[] = [
  {
    id: 'auto_harvest_aura',
    name: 'Auto-Harvest Magnet',
    version: '1.2.0',
    author: 'OUAGX Core',
    category: 'gameplay',
    description: 'Automatically harvests ripe crops as your farmer walks right next to them.',
    enabled: false,
  },
  {
    id: 'minimap_radar',
    name: 'Live Valley Mini-Map Radar',
    version: '2.0.1',
    author: 'OUAGX Core',
    category: 'ui',
    description: 'Shows a live tactical mini-map radar in the bottom-right corner of the canvas.',
    enabled: true,
  },
  {
    id: 'golden_rain_event',
    name: 'Double Gold Festival',
    version: '1.0.4',
    author: 'Valley Events',
    category: 'economy',
    description: 'Adds +50% bonus gold on every crop, fruit & artisan sale across the valley.',
    enabled: false,
  },
  {
    id: 'fps_perf_hud',
    name: 'FPS & Coords Telemetry',
    version: '1.1.0',
    author: 'DevTools',
    category: 'ui',
    description: 'Displays real-time FPS and player tile (X, Y) coordinates on screen.',
    enabled: false,
  },
  {
    id: 'realtime_chat_filter',
    name: 'Cozy Chat Moderator',
    version: '1.3.0',
    author: 'OUAGX Safety',
    category: 'social',
    description: 'Automatically keeps Multiplayer Valley Chat family-friendly.',
    enabled: true,
  },
  {
    id: 'starter_welcome_pack',
    name: 'VIP Starter Welcome Pack',
    version: '1.0.0',
    author: 'OUAGX Core',
    category: 'economy',
    description: 'Grants +250g bonus gold and +5 Rich Fertilizer whenever starting a new farm.',
    enabled: false,
  },
];

const DEFAULT_MAPS: MapPreset[] = [
  {
    id: 'map_cloverbrook',
    name: 'Cloverbrook Valley',
    regionCode: 'VALLEY-01',
    themeId: 'emerald',
    sizeLabel: '38×22 Classic River Map',
    multiplayerEnabled: true,
    weatherRainChance: 0.28,
    butterfliesEnabled: true,
    defaultRoomCode: 'VALLEY-01',
    description: 'Lush river valley featuring Homestead, Cloverbrook Village & Multiplayer Plaza.',
  },
  {
    id: 'map_autumn_ridge',
    name: 'Golden Harvest Ridge',
    regionCode: 'HARVEST-02',
    themeId: 'autumn',
    sizeLabel: '38×22 Autumn Estates',
    multiplayerEnabled: true,
    weatherRainChance: 0.22,
    butterfliesEnabled: true,
    defaultRoomCode: 'HARVEST-02',
    description: 'Warm maple hills with golden foliage and crisp harvest breezes.',
  },
  {
    id: 'map_sakura_hills',
    name: 'Sakura Blossom Hills',
    regionCode: 'SAKURA-03',
    themeId: 'sakura',
    sizeLabel: '38×22 Blossom Meadows',
    multiplayerEnabled: true,
    weatherRainChance: 0.35,
    butterfliesEnabled: true,
    defaultRoomCode: 'SAKURA-03',
    description: 'Pastel pink orchard valley bathed in drifting spring petals.',
  },
  {
    id: 'map_frostpeak',
    name: 'Frostpeak Alpine Farm',
    regionCode: 'FROST-04',
    themeId: 'winter',
    sizeLabel: '38×22 Winter Valley',
    multiplayerEnabled: true,
    weatherRainChance: 0.4,
    butterfliesEnabled: false,
    defaultRoomCode: 'FROST-04',
    description: 'Sparkling snow-dusted homestead with crystal alpine waters.',
  },
];

export function createDefaultAdminConfig(): AdminConfig {
  return {
    version: 3,
    brandName: 'GreenSAGA',
    copyrightText: '© 2026 GreenSAGA Interactive Valley. All rights reserved.',
    announcement: '',
    maintenanceMode: false,
    activeThemeId: 'emerald',
    activeMapId: 'map_cloverbrook',
    pushServerUrl: getDefaultPushServerUrl(),
    pushRevision: 0,
    pushHistory: [],
    economy: {
      xpMultiplier: 1.0,
      growthMultiplier: 1.0,
      sellMultiplier: 1.0,
    },
    levelOverrides: createDefaultLevelOverrides(),
    ads: DEFAULT_ADS,
    users: DEFAULT_USERS,
    plugins: DEFAULT_PLUGINS,
    maps: DEFAULT_MAPS,
  };
}

export function loadAdminConfig(): AdminConfig {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return createDefaultAdminConfig();
    const parsed = JSON.parse(raw) as Partial<AdminConfig>;
    const def = createDefaultAdminConfig();
    const migratedBrand =
      !parsed.brandName || parsed.brandName === 'OUAGX' || parsed.brandName === 'GreenSaga'
        ? 'GreenSAGA'
        : parsed.brandName;
    const migratedCopy =
      !parsed.copyrightText || parsed.copyrightText.includes('OUAGX')
        ? def.copyrightText
        : parsed.copyrightText;
    return {
      ...def,
      ...parsed,
      brandName: migratedBrand,
      copyrightText: migratedCopy,
      pushServerUrl: parsed.pushServerUrl || def.pushServerUrl,
      pushRevision: parsed.pushRevision ?? 0,
      pushHistory: parsed.pushHistory ?? [],
      economy: { ...def.economy, ...(parsed.economy ?? {}) },
      levelOverrides: parsed.levelOverrides?.length === 10 ? parsed.levelOverrides : def.levelOverrides,
      ads: parsed.ads ?? def.ads,
      users: parsed.users ?? def.users,
      plugins: parsed.plugins ?? def.plugins,
      maps: parsed.maps ?? def.maps,
    };
  } catch {
    return createDefaultAdminConfig();
  }
}

export function saveAdminConfig(config: AdminConfig): void {
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore storage errors
  }
}

export function isPluginEnabled(config: AdminConfig, pluginId: string): boolean {
  return config.plugins.some((p) => p.id === pluginId && p.enabled);
}

export function getActiveTheme(config: AdminConfig): ThemePalette {
  return THEME_PALETTES[config.activeThemeId] ?? THEME_PALETTES.emerald;
}
