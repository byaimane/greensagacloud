import { CropId } from '../types/game';

export const TILE_SIZE = 48;
export const MAP_COLS = 72;
export const MAP_ROWS = 46;

// Player Home Farm field bounds (maximum 12x6 grid at x: 3..14, y: 6..11)
// Kept at original coordinates so all existing saves remain 100% compatible!
export const FIELD_ORIGIN_X = 3;
export const FIELD_ORIGIN_Y = 6;
export const FIELD_MAX_W = 12;
export const FIELD_MAX_H = 6;

export function isTileInExpansion(x: number, y: number, expansionLevel: number): boolean {
  const rx = x - FIELD_ORIGIN_X;
  const ry = y - FIELD_ORIGIN_Y;
  if (rx < 0 || ry < 0) return false;
  if (expansionLevel === 0) return rx < 6 && ry < 5; // 6x5 = 30 plots
  if (expansionLevel === 1) return rx < 8 && ry < 5; // 8x5 = 40 plots
  if (expansionLevel === 2) return rx < 10 && ry < 6; // 10x6 = 60 plots
  return rx < 12 && ry < 6; // 12x6 = 72 plots
}

export function isTileCoveredBySprinkler(x: number, y: number, sprinklerLevel: number): boolean {
  if (sprinklerLevel <= 0) return false;
  const rx = x - FIELD_ORIGIN_X;
  const ry = y - FIELD_ORIGIN_Y;
  if (rx < 0 || ry < 0 || rx >= FIELD_MAX_W || ry >= FIELD_MAX_H) return false;
  if (sprinklerLevel === 1) return rx >= 1 && rx <= 3 && ry >= 1 && ry <= 3; // 3x3
  if (sprinklerLevel === 2) return rx >= 0 && rx < 6 && ry >= 0 && ry < 5; // 6x5
  return true; // Full field!
}

// Livestock pasture pen bounds (walkable grass pen with barn & fence)
export const PEN_BOUNDS = {
  minX: 3,
  maxX: 13,
  minY: 14.5,
  maxY: 18.8,
};

// Walkable physical Neighbor Farm Estates across the expanded 72x46 Valley!
export interface WorldEstate {
  neighborId: string;
  botId: string;
  ownerName: string;
  farmName: string;
  specialtyCrop: CropId;
  roofColor: string;
  wallColor: string;
  accentColor: string;
  houseRect: { x: number; y: number; w: number; h: number };
  fieldRect: { x: number; y: number; w: number; h: number };
  gateX: number;
  gateY: number;
  signX: number;
  signY: number;
}

export const WORLD_ESTATES: WorldEstate[] = [
  {
    neighborId: 'nbr_amine',
    botId: 'bot_amine',
    ownerName: 'Amine',
    farmName: "Amine's Oasis Terrace",
    specialtyCrop: 'corn',
    roofColor: '#d97706',
    wallColor: '#fef3c7',
    accentColor: '#f59e0b',
    houseRect: { x: 4.5, y: 25.5, w: 3.6, h: 2.4 },
    fieldRect: { x: 4, y: 30, w: 9, h: 5 },
    gateX: 8.6,
    gateY: 28.8,
    signX: 9.2,
    signY: 27.6,
  },
  {
    neighborId: 'nbr_claire',
    botId: 'bot_claire',
    ownerName: 'Claire',
    farmName: "Claire's Lavender Meadow",
    specialtyCrop: 'strawberry',
    roofColor: '#db2777',
    wallColor: '#fdf2f8',
    accentColor: '#ec4899',
    houseRect: { x: 55.0, y: 4.0, w: 3.6, h: 2.4 },
    fieldRect: { x: 54, y: 8, w: 10, h: 5 },
    gateX: 56.8,
    gateY: 7.3,
    signX: 59.6,
    signY: 6.2,
  },
  {
    neighborId: 'nbr_yasmine',
    botId: 'bot_yasmine',
    ownerName: 'Yasmine',
    farmName: "Yasmine's Star Orchard",
    specialtyCrop: 'starfruit',
    roofColor: '#0284c7',
    wallColor: '#f0f9ff',
    accentColor: '#0ea5e9',
    houseRect: { x: 24.0, y: 31.2, w: 3.6, h: 2.4 },
    fieldRect: { x: 23, y: 35, w: 10, h: 5 },
    gateX: 25.8,
    gateY: 34.4,
    signX: 28.6,
    signY: 33.4,
  },
  {
    neighborId: 'nbr_leo',
    botId: 'bot_leo',
    ownerName: 'Leo',
    farmName: "Leo's Golden Valley",
    specialtyCrop: 'golden_melon',
    roofColor: '#ca8a04',
    wallColor: '#fffbeb',
    accentColor: '#eab308',
    houseRect: { x: 53.0, y: 26.0, w: 4.0, h: 2.6 },
    fieldRect: { x: 51, y: 30, w: 11, h: 6 },
    gateX: 55.0,
    gateY: 29.4,
    signX: 58.0,
    signY: 28.3,
  },
];

export type FastTravelRegion =
  | 'homestead'
  | 'village'
  | 'plaza'
  | 'lake'
  | 'estate_amine'
  | 'estate_claire'
  | 'estate_yasmine'
  | 'estate_leo';

// Fast-travel regions on the expanded 72x46 world map
export const WORLD_REGIONS: Record<
  FastTravelRegion,
  { x: number; y: number; mapX: number; mapY: number; label: string; emoji: string }
> = {
  homestead: { x: 6.5, y: 5.0, mapX: 11, mapY: 16, label: 'My Farm', emoji: '🏡' },
  village: { x: 22.0, y: 9.2, mapX: 33, mapY: 22, label: 'Cloverbrook', emoji: '🏘️' },
  plaza: { x: 37.5, y: 9.0, mapX: 53, mapY: 22, label: 'MP Plaza', emoji: '🌐' },
  lake: { x: 29.0, y: 20.6, mapX: 41, mapY: 51, label: 'Emerald Lake', emoji: '🌊' },
  estate_amine: { x: 8.6, y: 28.8, mapX: 12, mapY: 67, label: "Amine's Farm", emoji: '🌽' },
  estate_claire: { x: 56.8, y: 7.3, mapX: 82, mapY: 18, label: "Claire's Farm", emoji: '🍓' },
  estate_yasmine: { x: 25.8, y: 34.4, mapX: 39, mapY: 79, label: "Yasmine's Farm", emoji: '⭐' },
  estate_leo: { x: 55.0, y: 29.4, mapX: 79, mapY: 69, label: "Leo's Estate", emoji: '🍈' },
};

// Key interactive landmarks
export const LANDMARKS = {
  farmhouseDoor: { x: 6.5, y: 4.3, radius: 1.7, label: 'Sleep & Save' },
  artisanMill: { x: 2.3, y: 4.2, radius: 1.8, label: 'Artisan Windmill' },
  shippingBin: { x: 10.0, y: 4.2, radius: 1.5, label: 'Shipping Bin (Quick Sell)' },
  waterWell: { x: 12.6, y: 4.4, radius: 1.5, label: 'Spring Well (+Stamina)' },
  marketStall: { x: 22.5, y: 6.6, radius: 2.1, label: "Maya's Market" },
  questBoard: { x: 19.5, y: 9.8, radius: 1.7, label: 'Village Quest Board' },
  mpSignpost: { x: 37.5, y: 8.4, radius: 2.2, label: 'Multiplayer Valley Map' },
  lakePier: { x: 29.0, y: 22.4, radius: 1.8, label: 'Emerald Lake Pier (+12 Stamina)' },
};

export interface RectObstacle {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const BUILDINGS: RectObstacle[] = [
  // Artisan Windmill (West of Farmhouse)
  { x: 1.4, y: 1.6, w: 1.9, h: 2.3 },
  // Player Farmhouse
  { x: 4.5, y: 1.5, w: 4, h: 2.6 },
  // Shipping bin
  { x: 9.5, y: 3.4, w: 1.1, h: 0.9 },
  // Water well
  { x: 12.1, y: 3.6, w: 1.1, h: 1.0 },
  // Cozy Red Barn beside pasture
  { x: 1.2, y: 14.5, w: 1.6, h: 2.4 },
  // Maya's Market Stall
  { x: 20.5, y: 4.2, w: 4, h: 2.1 },
  // Village Notice Board
  { x: 19, y: 8.6, w: 1.1, h: 0.9 },
  // Barnaby's Forge Cottage
  { x: 25, y: 9.2, w: 3.3, h: 2.4 },
  // Lina's Bakery Cottage
  { x: 19.2, y: 15.2, w: 3.6, h: 2.5 },
  // Grand Multiplayer Plaza Central Fountain
  { x: 36.6, y: 10.1, w: 1.8, h: 1.8 },
  // Neighbor Estate Farmhouses
  ...WORLD_ESTATES.map((e) => e.houseRect),
];

// Creek runs vertically at x = 15.7..17.4 across entire map height (y = 0..46)
// Two walkable wooden bridges: Upper Bridge (y = 8..10.5) & Lower Bridge (y = 28..30.5)
export const CREEK_X_MIN = 15.7;
export const CREEK_X_MAX = 17.4;
export const BRIDGE_Y_MIN = 8.0;
export const BRIDGE_Y_MAX = 10.5;
export const SOUTH_BRIDGE_Y_MIN = 28.0;
export const SOUTH_BRIDGE_Y_MAX = 30.5;

// Emerald Lake in South-Center (walkable wooden fishing pier at x = 28.2..29.8, y = 20.4..23.6)
export const LAKE_BOUNDS = {
  minX: 22.0,
  maxX: 36.0,
  minY: 21.0,
  maxY: 27.4,
};

export const PIER_BOUNDS = {
  minX: 28.1,
  maxX: 29.9,
  minY: 20.4,
  maxY: 23.6,
};

export function isPositionBlocked(px: number, py: number): boolean {
  if (px < 1.1 || px > MAP_COLS - 1.1 || py < 1.1 || py > MAP_ROWS - 1.1) {
    return true;
  }

  // Creek check (allow crossing on both Upper and Lower Bridges)
  if (px > CREEK_X_MIN && px < CREEK_X_MAX) {
    const onNorthBridge = py >= BRIDGE_Y_MIN && py <= BRIDGE_Y_MAX;
    const onSouthBridge = py >= SOUTH_BRIDGE_Y_MIN && py <= SOUTH_BRIDGE_Y_MAX;
    if (!onNorthBridge && !onSouthBridge) {
      return true;
    }
  }

  // Emerald Lake check (allow walking on the Wooden Fishing Pier)
  if (px > LAKE_BOUNDS.minX && px < LAKE_BOUNDS.maxX && py > LAKE_BOUNDS.minY && py < LAKE_BOUNDS.maxY) {
    const onPier =
      px >= PIER_BOUNDS.minX && px <= PIER_BOUNDS.maxX && py >= PIER_BOUNDS.minY && py <= PIER_BOUNDS.maxY;
    if (!onPier) {
      return true;
    }
  }

  for (const b of BUILDINGS) {
    if (px > b.x - 0.22 && px < b.x + b.w + 0.22 && py > b.y - 0.15 && py < b.y + b.h + 0.15) {
      return true;
    }
  }

  return false;
}

export const TREES: Array<{ x: number; y: number; scale: number; variant: 0 | 1 | 2 }> = [
  // Homestead perimeter
  { x: 1.4, y: 8.5, scale: 1.05, variant: 0 },
  { x: 1.5, y: 12.2, scale: 1.0, variant: 2 },
  { x: 1.8, y: 20.2, scale: 1.1, variant: 1 },
  { x: 14.3, y: 18.2, scale: 1.05, variant: 0 },
  // Village & North Meadow
  { x: 18.6, y: 2.1, scale: 1.1, variant: 0 },
  { x: 25.6, y: 2.3, scale: 1.15, variant: 2 },
  { x: 29.8, y: 3.0, scale: 1.05, variant: 1 },
  { x: 34.4, y: 2.6, scale: 1.1, variant: 0 },
  { x: 42.6, y: 2.8, scale: 1.12, variant: 2 },
  { x: 47.2, y: 4.0, scale: 1.08, variant: 1 },
  // Northeast & Claire's Lavender Meadow
  { x: 51.8, y: 2.6, scale: 1.15, variant: 0 },
  { x: 61.5, y: 2.8, scale: 1.12, variant: 2 },
  { x: 67.6, y: 4.5, scale: 1.15, variant: 1 },
  { x: 68.5, y: 11.2, scale: 1.08, variant: 0 },
  { x: 67.4, y: 17.5, scale: 1.12, variant: 2 },
  { x: 51.2, y: 16.5, scale: 1.02, variant: 1 },
  // Whispering Pine Forest (Southwest)
  { x: 2.2, y: 22.8, scale: 1.18, variant: 2 },
  { x: 6.4, y: 22.4, scale: 1.12, variant: 0 },
  { x: 11.8, y: 22.6, scale: 1.15, variant: 2 },
  { x: 14.2, y: 25.0, scale: 1.05, variant: 1 },
  { x: 2.0, y: 30.8, scale: 1.15, variant: 0 },
  { x: 2.2, y: 36.8, scale: 1.18, variant: 2 },
  { x: 5.5, y: 41.2, scale: 1.1, variant: 1 },
  { x: 10.6, y: 41.6, scale: 1.12, variant: 0 },
  { x: 14.2, y: 39.2, scale: 1.08, variant: 2 },
  // Emerald Lake & Yasmine's Star Orchard (South-Center)
  { x: 19.2, y: 21.8, scale: 1.08, variant: 0 },
  { x: 19.4, y: 26.8, scale: 1.1, variant: 1 },
  { x: 38.4, y: 21.8, scale: 1.12, variant: 2 },
  { x: 39.2, y: 27.6, scale: 1.06, variant: 0 },
  { x: 19.5, y: 35.4, scale: 1.1, variant: 1 },
  { x: 20.6, y: 42.4, scale: 1.12, variant: 0 },
  { x: 28.4, y: 43.0, scale: 1.14, variant: 2 },
  { x: 36.8, y: 41.8, scale: 1.08, variant: 1 },
  { x: 38.2, y: 35.2, scale: 1.1, variant: 0 },
  // Golden Valley Highlands & Leo's Estate (Southeast)
  { x: 45.2, y: 21.4, scale: 1.12, variant: 2 },
  { x: 48.2, y: 25.2, scale: 1.05, variant: 1 },
  { x: 64.5, y: 23.6, scale: 1.15, variant: 0 },
  { x: 68.2, y: 28.8, scale: 1.18, variant: 2 },
  { x: 67.6, y: 35.8, scale: 1.12, variant: 1 },
  { x: 65.2, y: 42.0, scale: 1.16, variant: 0 },
  { x: 56.4, y: 42.4, scale: 1.1, variant: 2 },
  { x: 46.8, y: 41.5, scale: 1.14, variant: 1 },
  { x: 44.5, y: 33.4, scale: 1.06, variant: 0 },
];

export const FLOWERS: Array<{ x: number; y: number; color: string }> = [
  { x: 3.8, y: 3.6, color: '#f472b6' },
  { x: 9.0, y: 3.9, color: '#facc15' },
  { x: 14.6, y: 4.8, color: '#60a5fa' },
  { x: 14.8, y: 13.0, color: '#f472b6' },
  { x: 18.4, y: 5.4, color: '#facc15' },
  { x: 25.4, y: 6.8, color: '#fb7185' },
  { x: 23.6, y: 14.6, color: '#c084fc' },
  { x: 18.6, y: 12.4, color: '#facc15' },
  { x: 5.2, y: 20.0, color: '#60a5fa' },
  { x: 10.4, y: 20.1, color: '#fb7185' },
  // Plaza & East Meadow flowers
  { x: 32.5, y: 6.4, color: '#f472b6' },
  { x: 42.5, y: 6.4, color: '#facc15' },
  { x: 32.5, y: 15.6, color: '#60a5fa' },
  { x: 42.5, y: 15.6, color: '#c084fc' },
  { x: 49.5, y: 9.0, color: '#f472b6' },
  { x: 53.2, y: 6.6, color: '#c084fc' },
  { x: 64.8, y: 7.4, color: '#f472b6' },
  { x: 62.2, y: 14.8, color: '#a855f7' },
  // Lake & South Estates flowers
  { x: 21.2, y: 20.2, color: '#60a5fa' },
  { x: 36.8, y: 20.4, color: '#facc15' },
  { x: 21.8, y: 29.2, color: '#fb7185' },
  { x: 35.4, y: 29.5, color: '#60a5fa' },
  { x: 4.2, y: 37.2, color: '#facc15' },
  { x: 12.4, y: 37.6, color: '#f97316' },
  { x: 22.8, y: 41.2, color: '#38bdf8' },
  { x: 33.4, y: 41.0, color: '#facc15' },
  { x: 49.6, y: 38.0, color: '#facc15' },
  { x: 63.4, y: 38.4, color: '#fb7185' },
];
