export const TILE_SIZE = 48;
export const MAP_COLS = 38;
export const MAP_ROWS = 22;

// Farm field bounds (maximum 12x6 grid at x: 3..14, y: 6..11)
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

// Fast-travel regions on the world map
export const WORLD_REGIONS = {
  homestead: { x: 6.5, y: 5.0, mapX: 22, mapY: 54 },
  village: { x: 22.0, y: 9.2, mapX: 54, mapY: 48 },
  plaza: { x: 32.5, y: 8.8, mapX: 82, mapY: 52 },
};

// Key interactive landmarks
export const LANDMARKS = {
  farmhouseDoor: { x: 6.5, y: 4.3, radius: 1.7, label: 'Sleep & Save' },
  artisanMill: { x: 2.3, y: 4.2, radius: 1.8, label: 'Artisan Windmill' },
  shippingBin: { x: 10.0, y: 4.2, radius: 1.5, label: 'Shipping Bin (Quick Sell)' },
  waterWell: { x: 12.6, y: 4.4, radius: 1.5, label: 'Spring Well (+Stamina)' },
  marketStall: { x: 22.5, y: 6.6, radius: 2.1, label: "Maya's Market" },
  questBoard: { x: 19.5, y: 9.8, radius: 1.7, label: 'Village Quest Board' },
  mpSignpost: { x: 32.5, y: 8.6, radius: 2.0, label: 'Multiplayer Valley Map' },
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
  // Multiplayer Plaza Central Fountain
  { x: 31.6, y: 10.2, w: 1.8, h: 1.8 },
];

// Creek runs vertically at x = 16..17.4, bridge at y = 8..10.5
export const CREEK_X_MIN = 15.7;
export const CREEK_X_MAX = 17.4;
export const BRIDGE_Y_MIN = 8.0;
export const BRIDGE_Y_MAX = 10.5;

export function isPositionBlocked(px: number, py: number): boolean {
  if (px < 1.1 || px > MAP_COLS - 1.1 || py < 1.1 || py > MAP_ROWS - 1.1) {
    return true;
  }

  if (px > CREEK_X_MIN && px < CREEK_X_MAX) {
    if (py < BRIDGE_Y_MIN || py > BRIDGE_Y_MAX) {
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
  { x: 1.4, y: 8.5, scale: 1.05, variant: 0 },
  { x: 1.5, y: 12.2, scale: 1.0, variant: 2 },
  { x: 1.8, y: 19.8, scale: 1.1, variant: 1 },
  { x: 14.3, y: 18.2, scale: 1.05, variant: 0 },
  { x: 18.6, y: 2.1, scale: 1.1, variant: 0 },
  { x: 25.6, y: 2.3, scale: 1.15, variant: 2 },
  { x: 29.0, y: 3.2, scale: 1.05, variant: 1 },
  { x: 35.8, y: 3.0, scale: 1.12, variant: 0 },
  { x: 36.4, y: 8.8, scale: 1.0, variant: 2 },
  { x: 36.2, y: 15.6, scale: 1.1, variant: 1 },
  { x: 33.4, y: 19.2, scale: 1.05, variant: 0 },
  { x: 26.8, y: 19.0, scale: 1.05, variant: 2 },
  { x: 18.5, y: 19.4, scale: 0.95, variant: 1 },
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
  { x: 29.8, y: 7.4, color: '#f472b6' },
  { x: 34.8, y: 7.5, color: '#facc15' },
  { x: 29.8, y: 14.8, color: '#60a5fa' },
  { x: 35.0, y: 14.8, color: '#c084fc' },
];
