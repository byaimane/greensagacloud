import {
  ARTISAN_RECIPES,
  CROPS,
  FARM_EXPANSIONS,
  getSellBonusMultiplier,
  HOUSE_UPGRADES,
  ITEMS,
  LIVESTOCK_SHOP,
  MAX_LEVEL,
  SPRINKLER_UPGRADES,
  TOOLS,
  xpRequiredForLevel,
} from '../data/crops';
import { createInitialNeighbors, generateDailyQuests, NPCS } from '../data/npcs';
import {
  FIELD_MAX_H,
  FIELD_MAX_W,
  FIELD_ORIGIN_X,
  FIELD_ORIGIN_Y,
  isTileCoveredBySprinkler,
  isTileInExpansion,
  PEN_BOUNDS,
} from '../data/worldMap';
import { isPluginEnabled } from './adminStore';
import { AdminConfig } from '../types/admin';
import {
  AnimalSpecies,
  CropId,
  DaySummary,
  Direction,
  FarmSnapshot,
  FarmTile,
  FarmTileSnapshot,
  GameState,
  HotbarSlotType,
  ItemId,
  Language,
  LivestockAnimal,
  NpcId,
  OrchardTree,
  RemoteFarmer,
  ToolId,
  ToolTier,
} from '../types/game';

export const SAVE_KEY = 'ouagx_save_v1';

let runtimeAdminConfig: AdminConfig | null = null;
export function setRuntimeAdminConfig(cfg: AdminConfig | null): void {
  runtimeAdminConfig = cfg;
}

function getEffectiveXpForLevel(level: number): number {
  const ov = runtimeAdminConfig?.levelOverrides.find((o) => o.level === level);
  return ov ? ov.xpRequired : xpRequiredForLevel(level);
}

export const HOTBAR_SLOTS: HotbarSlotType[] = [
  { kind: 'tool', toolId: 'hoe' },
  { kind: 'tool', toolId: 'watering_can' },
  { kind: 'tool', toolId: 'scythe' },
  { kind: 'item', itemId: 'turnip_seed' },
  { kind: 'item', itemId: 'wheat_seed' },
  { kind: 'item', itemId: 'carrot_seed' },
  { kind: 'item', itemId: 'strawberry_seed' },
  { kind: 'item', itemId: 'corn_seed' },
  { kind: 'item', itemId: 'pumpkin_seed' },
  { kind: 'item', itemId: 'starfruit_seed' },
  { kind: 'item', itemId: 'golden_melon_seed' },
  { kind: 'item', itemId: 'fertilizer' },
  { kind: 'item', itemId: 'animal_feed' },
];

export function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function createInitialTiles(expansionLevel = 0): Record<string, FarmTile> {
  const tiles: Record<string, FarmTile> = {};
  for (let y = FIELD_ORIGIN_Y; y < FIELD_ORIGIN_Y + FIELD_MAX_H; y++) {
    for (let x = FIELD_ORIGIN_X; x < FIELD_ORIGIN_X + FIELD_MAX_W; x++) {
      const unlocked = isTileInExpansion(x, y, expansionLevel);
      const rx = x - FIELD_ORIGIN_X;
      const ry = y - FIELD_ORIGIN_Y;

      const isStarterCrop = unlocked && ry === 0 && rx >= 0 && rx <= 2;
      const isStarterWeed = unlocked && ((rx === 4 && ry === 3) || (rx === 5 && ry === 1));

      tiles[tileKey(x, y)] = {
        x,
        y,
        unlocked,
        tilled: isStarterCrop,
        watered: isStarterCrop,
        fertilized: false,
        hasWeed: isStarterWeed,
        crop: isStarterCrop
          ? { cropId: rx === 2 ? 'wheat' : 'turnip', progress: rx === 0 ? 0.88 : 0.45, plantedDay: 1 }
          : null,
      };
    }
  }
  return tiles;
}

export function createInitialLivestock(): LivestockAnimal[] {
  return [
    {
      id: 'animal_chicken_1',
      species: 'chicken',
      name: 'Pip',
      x: 5.2,
      y: 16.0,
      targetX: 6.8,
      targetY: 16.6,
      fedToday: false,
      pettedToday: false,
      productReady: true,
      facing: 'right',
      animOffset: 0.4,
    },
    {
      id: 'animal_cow_1',
      species: 'cow',
      name: 'Clover',
      x: 9.2,
      y: 16.5,
      targetX: 7.8,
      targetY: 16.8,
      fedToday: false,
      pettedToday: false,
      productReady: false,
      facing: 'left',
      animOffset: 2.1,
    },
  ];
}

export function createInitialOrchard(): OrchardTree[] {
  return [
    { id: 'orchard_apple_1', fruit: 'apple', x: 10.2, y: 1.9, fruitsReady: 2 },
    { id: 'orchard_apple_2', fruit: 'apple', x: 12.2, y: 1.9, fruitsReady: 1 },
    { id: 'orchard_peach_1', fruit: 'peach', x: 14.1, y: 2.1, fruitsReady: 2 },
  ];
}

export function createInitialState(language: Language = 'en'): GameState {
  return {
    version: 2,
    language,
    day: 1,
    timeOfDay: 0.08,
    weather: 'sunny',
    farmExpansionLevel: 0,
    sprinklerLevel: 0,
    houseLevel: 1,
    player: {
      name: 'Farmer GreenSAGA',
      roomCode: 'VALLEY-01',
      x: 6.5,
      y: 5.2,
      facing: 'down',
      moving: false,
      walkPhase: 0,
      targetX: null,
      targetY: null,
      stamina: 100,
      maxStamina: 100,
      gold: 180,
      level: 1,
      xp: 0,
      xpToNext: xpRequiredForLevel(1),
      toolTiers: {
        hoe: 1,
        watering_can: 1,
        scythe: 1,
      },
      actionAnimTimer: 0,
      actionTool: null,
    },
    inventory: {
      turnip_seed: 6,
      wheat_seed: 4,
      fertilizer: 3,
      animal_feed: 4,
    },
    selectedHotbarIndex: 0,
    tiles: createInitialTiles(0),
    livestock: createInitialLivestock(),
    orchardTrees: createInitialOrchard(),
    neighbors: createInitialNeighbors(),
    npcFriendship: {
      maya: 15,
      barnaby: 10,
      lina: 15,
    },
    npcTalkedToday: {
      maya: false,
      barnaby: false,
      lina: false,
    },
    npcGiftedToday: {
      maya: false,
      barnaby: false,
      lina: false,
    },
    quests: generateDailyQuests(1, 1),
    stats: {
      cropsHarvested: 0,
      questsCompleted: 0,
      goldEarned: 0,
      artisanCrafted: 0,
      neighborsHelped: 0,
    },
    tutorialDismissed: false,
    muted: false,
  };
}

export function migrateState(raw: Partial<GameState>): GameState {
  const fresh = createInitialState((raw.language as Language) || 'en');
  const merged: GameState = {
    ...fresh,
    ...raw,
    version: 2,
    language: raw.language ?? 'en',
    sprinklerLevel: raw.sprinklerLevel ?? 0,
    houseLevel: raw.houseLevel ?? 1,
    orchardTrees: raw.orchardTrees?.length ? raw.orchardTrees : fresh.orchardTrees,
    neighbors: raw.neighbors?.length ? raw.neighbors : fresh.neighbors,
    player: {
      ...fresh.player,
      ...(raw.player ?? {}),
      name: !raw.player?.name || raw.player.name === 'Farmer OUAGX' ? 'Farmer GreenSAGA' : raw.player.name,
      roomCode: raw.player?.roomCode || 'VALLEY-01',
    },
    stats: {
      ...fresh.stats,
      ...(raw.stats ?? {}),
    },
    tiles: { ...fresh.tiles, ...(raw.tiles ?? {}) },
  };
  // Ensure 12x6 field tiles exist
  for (let y = FIELD_ORIGIN_Y; y < FIELD_ORIGIN_Y + FIELD_MAX_H; y++) {
    for (let x = FIELD_ORIGIN_X; x < FIELD_ORIGIN_X + FIELD_MAX_W; x++) {
      const k = tileKey(x, y);
      if (!merged.tiles[k]) {
        merged.tiles[k] = {
          x,
          y,
          unlocked: isTileInExpansion(x, y, merged.farmExpansionLevel),
          tilled: false,
          watered: false,
          fertilized: false,
          hasWeed: false,
          crop: null,
        };
      }
    }
  }
  return merged;
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (!parsed || typeof parsed.day !== 'number' || !parsed.player || !parsed.tiles) {
      return null;
    }
    return migrateState(parsed);
  } catch {
    return null;
  }
}

export function getItemCount(state: GameState, itemId: ItemId): number {
  return state.inventory[itemId] ?? 0;
}

export function addItem(state: GameState, itemId: ItemId, qty: number): void {
  const cur = state.inventory[itemId] ?? 0;
  const next = Math.max(0, cur + qty);
  if (next === 0) {
    delete state.inventory[itemId];
  } else {
    state.inventory[itemId] = next;
  }
}

export function grantXp(
  state: GameState,
  amount: number
): { leveledUp: boolean; newLevel: number } {
  if (state.player.level >= MAX_LEVEL) {
    state.player.xp = state.player.xpToNext;
    return { leveledUp: false, newLevel: state.player.level };
  }
  const xpMult = runtimeAdminConfig?.economy.xpMultiplier ?? 1;
  state.player.xp += Math.max(1, Math.round(amount * xpMult));
  let leveledUp = false;
  while (state.player.level < MAX_LEVEL && state.player.xp >= state.player.xpToNext) {
    state.player.xp -= state.player.xpToNext;
    state.player.level += 1;
    state.player.xpToNext = getEffectiveXpForLevel(state.player.level);
    state.player.maxStamina += 12;
    state.player.stamina = state.player.maxStamina;
    leveledUp = true;
  }
  return { leveledUp, newLevel: state.player.level };
}

export function getToolAffectedTiles(
  centerX: number,
  centerY: number,
  tier: ToolTier,
  facing: Direction
): Array<{ x: number; y: number }> {
  if (tier === 1) return [{ x: centerX, y: centerY }];
  if (tier === 2) {
    if (facing === 'left' || facing === 'right') {
      return [
        { x: centerX, y: centerY - 1 },
        { x: centerX, y: centerY },
        { x: centerX, y: centerY + 1 },
      ];
    }
    return [
      { x: centerX - 1, y: centerY },
      { x: centerX, y: centerY },
      { x: centerX + 1, y: centerY },
    ];
  }
  const out: Array<{ x: number; y: number }> = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      out.push({ x: centerX + dx, y: centerY + dy });
    }
  }
  return out;
}

export interface TileActionResult {
  performed: boolean;
  actionType?: 'till' | 'water' | 'plant' | 'harvest' | 'weed' | 'fertilize' | 'error';
  message?: string;
  xpGained: number;
  leveledUp: boolean;
  harvestedItems: Array<{ cropId: CropId; qty: number; x: number; y: number }>;
  affectedCoords: Array<{ x: number; y: number }>;
}

export function performTileAction(
  state: GameState,
  targetX: number,
  targetY: number
): TileActionResult {
  const result: TileActionResult = {
    performed: false,
    xpGained: 0,
    leveledUp: false,
    harvestedItems: [],
    affectedCoords: [],
  };

  const centerTile = state.tiles[tileKey(targetX, targetY)];
  if (!centerTile || !centerTile.unlocked) return result;

  const slot = HOTBAR_SLOTS[state.selectedHotbarIndex] ?? HOTBAR_SLOTS[0];
  const isScythe = slot.kind === 'tool' && slot.toolId === 'scythe';

  // Quick-harvest ripe crops with any non-scythe click
  if (!isScythe && centerTile.crop && centerTile.crop.progress >= 1) {
    const cropDef = CROPS[centerTile.crop.cropId];
    const bonus = centerTile.fertilized && Math.random() < 0.25 ? 2 : 1;
    addItem(state, cropDef.id, bonus);
    state.stats.cropsHarvested += bonus;
    const xpRes = grantXp(state, cropDef.xpReward * bonus);
    centerTile.crop = null;
    centerTile.fertilized = false;
    state.player.actionAnimTimer = 0.22;
    state.player.actionTool = 'hand';
    result.performed = true;
    result.actionType = 'harvest';
    result.xpGained = cropDef.xpReward * bonus;
    result.leveledUp = xpRes.leveledUp;
    result.harvestedItems.push({ cropId: cropDef.id, qty: bonus, x: targetX, y: targetY });
    result.affectedCoords.push({ x: targetX, y: targetY });
    return result;
  }

  // Allow Hoe to clear weed directly
  if (!isScythe && centerTile.hasWeed && slot.kind === 'tool' && slot.toolId === 'hoe') {
    if (state.player.stamina < 2) {
      result.actionType = 'error';
      result.message = 'Out of stamina! Sleep at the Farmhouse to restore.';
      return result;
    }
    state.player.stamina = Math.max(0, state.player.stamina - 2);
    centerTile.hasWeed = false;
    const xpRes = grantXp(state, 5);
    state.player.actionAnimTimer = 0.24;
    state.player.actionTool = 'hoe';
    result.performed = true;
    result.actionType = 'weed';
    result.xpGained = 5;
    result.leveledUp = xpRes.leveledUp;
    result.affectedCoords.push({ x: targetX, y: targetY });
    return result;
  }

  if (slot.kind === 'tool') {
    const tool = TOOLS[slot.toolId];
    const tier = state.player.toolTiers[slot.toolId];
    const coords = getToolAffectedTiles(targetX, targetY, tier, state.player.facing);

    if (state.player.stamina < tool.staminaCost) {
      result.actionType = 'error';
      result.message = 'Out of stamina! Sleep at the Farmhouse or sip from the Spring Well.';
      return result;
    }

    let didAnything = false;
    let totalXp = 0;

    for (const c of coords) {
      const tile = state.tiles[tileKey(c.x, c.y)];
      if (!tile || !tile.unlocked) continue;

      if (slot.toolId === 'hoe') {
        if (!tile.tilled && !tile.hasWeed) {
          tile.tilled = true;
          if (state.weather === 'rainy' || isTileCoveredBySprinkler(c.x, c.y, state.sprinklerLevel)) {
            tile.watered = true;
          }
          totalXp += 4;
          didAnything = true;
          result.actionType = 'till';
          result.affectedCoords.push(c);
        }
      } else if (slot.toolId === 'watering_can') {
        if (tile.tilled && !tile.watered) {
          tile.watered = true;
          totalXp += 3;
          didAnything = true;
          result.actionType = 'water';
          result.affectedCoords.push(c);
        }
      } else if (slot.toolId === 'scythe') {
        if (tile.crop && tile.crop.progress >= 1) {
          const cropDef = CROPS[tile.crop.cropId];
          const bonus = tile.fertilized && Math.random() < 0.25 ? 2 : 1;
          addItem(state, cropDef.id, bonus);
          state.stats.cropsHarvested += bonus;
          totalXp += cropDef.xpReward * bonus;
          tile.crop = null;
          tile.fertilized = false;
          didAnything = true;
          result.actionType = 'harvest';
          result.harvestedItems.push({ cropId: cropDef.id, qty: bonus, x: c.x, y: c.y });
          result.affectedCoords.push(c);
        } else if (tile.hasWeed) {
          tile.hasWeed = false;
          totalXp += 5;
          didAnything = true;
          if (!result.actionType) result.actionType = 'weed';
          result.affectedCoords.push(c);
        }
      }
    }

    if (didAnything) {
      state.player.stamina = Math.max(0, state.player.stamina - tool.staminaCost);
      state.player.actionAnimTimer = 0.26;
      state.player.actionTool = slot.toolId;
      const xpRes = grantXp(state, totalXp);
      result.performed = true;
      result.xpGained = totalXp;
      result.leveledUp = xpRes.leveledUp;
    }
    return result;
  }

  // Seed or Fertilizer
  const itemDef = ITEMS[slot.itemId];
  const count = getItemCount(state, slot.itemId);

  if (itemDef.category === 'seed' && itemDef.cropId) {
    if (count <= 0) {
      result.actionType = 'error';
      result.message = `No ${itemDef.name} left! Buy more at Maya’s Market.`;
      return result;
    }
    if (!centerTile.tilled) {
      result.actionType = 'error';
      result.message = 'Till the soil with your Hoe (1) first!';
      return result;
    }
    if (centerTile.crop) {
      result.actionType = 'error';
      result.message = 'A crop is already growing here.';
      return result;
    }
    if (state.player.stamina < 1) {
      result.actionType = 'error';
      result.message = 'Too tired! Sleep at the Farmhouse.';
      return result;
    }
    addItem(state, slot.itemId, -1);
    state.player.stamina = Math.max(0, state.player.stamina - 1);
    centerTile.crop = {
      cropId: itemDef.cropId,
      progress: 0.02,
      plantedDay: state.day,
    };
    const xpRes = grantXp(state, 4);
    state.player.actionAnimTimer = 0.2;
    state.player.actionTool = 'hand';
    result.performed = true;
    result.actionType = 'plant';
    result.xpGained = 4;
    result.leveledUp = xpRes.leveledUp;
    result.affectedCoords.push({ x: targetX, y: targetY });
    return result;
  }

  if (slot.itemId === 'fertilizer') {
    if (count <= 0) {
      result.actionType = 'error';
      result.message = 'No Rich Fertilizer left!';
      return result;
    }
    if (!centerTile.tilled) {
      result.actionType = 'error';
      result.message = 'Fertilize tilled soil!';
      return result;
    }
    if (centerTile.fertilized) {
      result.actionType = 'error';
      result.message = 'Already fertilized.';
      return result;
    }
    addItem(state, 'fertilizer', -1);
    centerTile.fertilized = true;
    const xpRes = grantXp(state, 5);
    state.player.actionAnimTimer = 0.2;
    state.player.actionTool = 'hand';
    result.performed = true;
    result.actionType = 'fertilize';
    result.xpGained = 5;
    result.leveledUp = xpRes.leveledUp;
    result.affectedCoords.push({ x: targetX, y: targetY });
    return result;
  }

  return result;
}

export function harvestOrchardTree(
  state: GameState,
  treeId: string
): { picked: number; fruit: 'apple' | 'peach'; xpGained: number; leveledUp: boolean } | null {
  const tree = state.orchardTrees.find((t) => t.id === treeId);
  if (!tree || tree.fruitsReady <= 0) return null;
  const qty = tree.fruitsReady;
  tree.fruitsReady = 0;
  addItem(state, tree.fruit, qty);
  const xpGained = qty * 12;
  const xpRes = grantXp(state, xpGained);
  saveGame(state);
  return { picked: qty, fruit: tree.fruit, xpGained, leveledUp: xpRes.leveledUp };
}

export function interactWithAnimal(
  state: GameState,
  animal: LivestockAnimal
): {
  type: 'collect' | 'feed' | 'pet' | 'info';
  message: string;
  product?: ItemId;
  xpGained: number;
  leveledUp: boolean;
} {
  if (animal.productReady) {
    const product: ItemId =
      animal.species === 'chicken' ? 'egg' : animal.species === 'cow' ? 'milk' : 'wool';
    addItem(state, product, 1);
    animal.productReady = false;
    const xpRes = grantXp(state, 18);
    return {
      type: 'collect',
      product,
      message: `Collected ${ITEMS[product].name} from ${animal.name}!`,
      xpGained: 18,
      leveledUp: xpRes.leveledUp,
    };
  }

  if (!animal.fedToday) {
    const feedCount = getItemCount(state, 'animal_feed');
    if (feedCount > 0) {
      addItem(state, 'animal_feed', -1);
      animal.fedToday = true;
      const xpRes = grantXp(state, 10);
      return {
        type: 'feed',
        message: `Fed ${animal.name}! Fresh produce will be ready tomorrow morning.`,
        xpGained: 10,
        leveledUp: xpRes.leveledUp,
      };
    }
    if (!animal.pettedToday) {
      animal.pettedToday = true;
      const xpRes = grantXp(state, 5);
      return {
        type: 'pet',
        message: `Petted ${animal.name} ♥ (Bring Animal Feed from Maya’s Market!)`,
        xpGained: 5,
        leveledUp: xpRes.leveledUp,
      };
    }
    return {
      type: 'info',
      message: `${animal.name} is hungry! Buy Animal Feed at Maya’s Market.`,
      xpGained: 0,
      leveledUp: false,
    };
  }

  if (!animal.pettedToday) {
    animal.pettedToday = true;
    const xpRes = grantXp(state, 5);
    return {
      type: 'pet',
      message: `${animal.name} loves the affection! ♥`,
      xpGained: 5,
      leveledUp: xpRes.leveledUp,
    };
  }

  return {
    type: 'info',
    message: `${animal.name} is happy and well-fed today!`,
    xpGained: 0,
    leveledUp: false,
  };
}

export function craftArtisanRecipe(
  state: GameState,
  recipeId: string
): { success: boolean; leveledUp: boolean } {
  const recipe = ARTISAN_RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return { success: false, leveledUp: false };
  if (state.player.level < recipe.unlockLevel) return { success: false, leveledUp: false };
  if (getItemCount(state, recipe.inputId) < recipe.inputQty) return { success: false, leveledUp: false };

  addItem(state, recipe.inputId, -recipe.inputQty);
  addItem(state, recipe.outputId, recipe.outputQty);
  state.stats.artisanCrafted += 1;
  const xpRes = grantXp(state, recipe.xpReward);
  saveGame(state);
  return { success: true, leveledUp: xpRes.leveledUp };
}

export function helpNeighborWater(
  state: GameState,
  neighborId: string
): { success: boolean; leveledUp: boolean } {
  const nbr = state.neighbors.find((n) => n.id === neighborId);
  if (!nbr || nbr.wateredToday) return { success: false, leveledUp: false };
  nbr.wateredToday = true;
  state.player.gold += 25;
  state.stats.goldEarned += 25;
  state.stats.neighborsHelped += 1;
  const xpRes = grantXp(state, 20);
  saveGame(state);
  return { success: true, leveledUp: xpRes.leveledUp };
}

export function pickNeighborCrop(
  state: GameState,
  neighborId: string
): { success: boolean; cropId?: CropId; leveledUp: boolean } {
  const nbr = state.neighbors.find((n) => n.id === neighborId);
  if (!nbr || nbr.harvestedToday) return { success: false, leveledUp: false };
  nbr.harvestedToday = true;
  addItem(state, nbr.specialtyCrop, 1);
  const xpRes = grantXp(state, 15);
  saveGame(state);
  return { success: true, cropId: nbr.specialtyCrop, leveledUp: xpRes.leveledUp };
}

export function advanceRealTimeSimulation(state: GameState, dt: number): void {
  state.timeOfDay = Math.min(1, state.timeOfDay + dt / 230);
  const growthMult = runtimeAdminConfig?.economy.growthMultiplier ?? 1;

  for (const tile of Object.values(state.tiles)) {
    if (!tile.unlocked || !tile.crop || tile.crop.progress >= 1) continue;
    const def = CROPS[tile.crop.cropId];
    const waterMult = tile.watered ? 1 : 0.14;
    const fertMult = tile.fertilized ? 1.6 : 1.0;
    tile.crop.progress = Math.min(
      1,
      tile.crop.progress + (dt / def.growthSeconds) * waterMult * fertMult * growthMult
    );
  }

  for (const animal of state.livestock) {
    const dx = animal.targetX - animal.x;
    const dy = animal.targetY - animal.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.08) {
      if (Math.random() < dt * 0.45) {
        animal.targetX = PEN_BOUNDS.minX + 0.7 + Math.random() * (PEN_BOUNDS.maxX - PEN_BOUNDS.minX - 1.4);
        animal.targetY = PEN_BOUNDS.minY + 0.7 + Math.random() * (PEN_BOUNDS.maxY - PEN_BOUNDS.minY - 1.4);
      }
    } else {
      const speed = animal.species === 'chicken' ? 0.9 : 0.55;
      animal.x += (dx / dist) * speed * dt;
      animal.y += (dy / dist) * speed * dt;
      animal.facing = dx >= 0 ? 'right' : 'left';
    }
  }
}

export function sleepAndAdvanceDay(state: GameState): DaySummary {
  state.day += 1;
  state.timeOfDay = 0.05;

  const isRainy = Math.random() < 0.28;
  state.weather = isRainy ? 'rainy' : 'sunny';

  let cropsMatured = 0;
  let sprinklerWatered = 0;

  for (const tile of Object.values(state.tiles)) {
    if (!tile.unlocked) continue;

    if (tile.crop && tile.crop.progress < 1) {
      const def = CROPS[tile.crop.cropId];
      const wasMature = tile.crop.progress >= 1;
      const fertMult = tile.fertilized ? 1.35 : 1;
      const gain = tile.watered ? def.overnightBonus * fertMult : def.overnightBonus * 0.18;
      tile.crop.progress = Math.min(1, tile.crop.progress + gain);
      if (!wasMature && tile.crop.progress >= 1) cropsMatured += 1;
    }

    const coveredBySprinkler =
      tile.tilled && isTileCoveredBySprinkler(tile.x, tile.y, state.sprinklerLevel);
    if (coveredBySprinkler && !isRainy) sprinklerWatered += 1;
    tile.watered = tile.tilled && (isRainy || coveredBySprinkler);

    if (!tile.tilled && !tile.crop && !tile.hasWeed && Math.random() < 0.06) {
      tile.hasWeed = true;
    }
  }

  let productsReady = 0;
  for (const animal of state.livestock) {
    if (animal.fedToday) animal.productReady = true;
    if (animal.productReady) productsReady += 1;
    animal.fedToday = false;
    animal.pettedToday = false;
  }

  let fruitsGrown = 0;
  for (const tree of state.orchardTrees) {
    if (tree.fruitsReady < 3) {
      const add = Math.min(3 - tree.fruitsReady, 1 + (Math.random() < 0.45 ? 1 : 0));
      tree.fruitsReady += add;
      fruitsGrown += add;
    }
  }

  // Reset neighbor daily actions
  for (const nbr of state.neighbors) {
    nbr.wateredToday = false;
    nbr.harvestedToday = false;
  }

  state.npcTalkedToday = { maya: false, barnaby: false, lina: false };
  state.npcGiftedToday = { maya: false, barnaby: false, lina: false };

  const unclaimed = state.quests.filter((q) => !q.claimed);
  if (unclaimed.length === 0 || state.day % 2 === 0) {
    state.quests = generateDailyQuests(state.day, state.player.level);
  }

  const staminaRestored = state.player.maxStamina - state.player.stamina;
  state.player.stamina = state.player.maxStamina;
  state.player.x = 6.5;
  state.player.y = 5.0;
  state.player.targetX = null;
  state.player.targetY = null;
  state.player.facing = 'down';

  saveGame(state);

  return {
    day: state.day,
    weather: state.weather,
    cropsMatured,
    productsReady,
    fruitsGrown,
    sprinklerWatered,
    staminaRestored,
  };
}

export function getEffectiveSellPrice(state: GameState, itemId: ItemId): number {
  const def = ITEMS[itemId];
  if (!def?.sellPrice) return 0;
  if (
    def.category === 'crop' ||
    def.category === 'fruit' ||
    def.category === 'artisan' ||
    def.category === 'animal_product'
  ) {
    const lvOv = runtimeAdminConfig?.levelOverrides.find((o) => o.level === state.player.level);
    const lvMult = lvOv ? 1 + lvOv.sellBonusPct / 100 : getSellBonusMultiplier(state.player.level);
    const adminMult = runtimeAdminConfig?.economy.sellMultiplier ?? 1;
    const festivalMult =
      runtimeAdminConfig && isPluginEnabled(runtimeAdminConfig, 'golden_rain_event') ? 1.5 : 1;
    return Math.round(def.sellPrice * lvMult * adminMult * festivalMult);
  }
  return def.sellPrice;
}

export function buyItem(state: GameState, itemId: ItemId, qty: number): boolean {
  const def = ITEMS[itemId];
  if (!def.buyPrice) return false;
  if (def.unlockLevel && state.player.level < def.unlockLevel) return false;
  const cost = def.buyPrice * qty;
  if (state.player.gold < cost) return false;
  state.player.gold -= cost;
  addItem(state, itemId, qty);
  saveGame(state);
  return true;
}

export function sellItem(state: GameState, itemId: ItemId, qty: number): number {
  const unit = getEffectiveSellPrice(state, itemId);
  if (!unit) return 0;
  const have = getItemCount(state, itemId);
  const actual = Math.min(have, qty);
  if (actual <= 0) return 0;
  const earned = unit * actual;
  addItem(state, itemId, -actual);
  state.player.gold += earned;
  state.stats.goldEarned += earned;
  saveGame(state);
  return earned;
}

export function sellAllProduce(state: GameState): number {
  let total = 0;
  for (const [id, qty] of Object.entries(state.inventory) as Array<[ItemId, number]>) {
    const def = ITEMS[id];
    if (
      (def.category === 'crop' ||
        def.category === 'animal_product' ||
        def.category === 'fruit' ||
        def.category === 'artisan') &&
      qty > 0
    ) {
      total += getEffectiveSellPrice(state, id) * qty;
      delete state.inventory[id];
    }
  }
  if (total > 0) {
    state.player.gold += total;
    state.stats.goldEarned += total;
    saveGame(state);
  }
  return total;
}

export function upgradeTool(state: GameState, toolId: ToolId): boolean {
  const curTier = state.player.toolTiers[toolId];
  if (curTier >= 3) return false;
  const nextTier = (curTier + 1) as 2 | 3;
  const req = TOOLS[toolId].upgradeCosts[nextTier];
  if (state.player.level < req.level || state.player.gold < req.gold) return false;
  state.player.gold -= req.gold;
  state.player.toolTiers[toolId] = nextTier;
  saveGame(state);
  return true;
}

export function expandFarm(state: GameState): boolean {
  const nextLevel = state.farmExpansionLevel + 1;
  const exp = FARM_EXPANSIONS.find((e) => e.level === nextLevel);
  if (!exp) return false;
  if (state.player.level < exp.reqLevel || state.player.gold < exp.gold) return false;
  state.player.gold -= exp.gold;
  state.farmExpansionLevel = nextLevel;
  for (const tile of Object.values(state.tiles)) {
    if (isTileInExpansion(tile.x, tile.y, nextLevel)) {
      tile.unlocked = true;
    }
  }
  saveGame(state);
  return true;
}

export function upgradeSprinkler(state: GameState): boolean {
  const nextLevel = state.sprinklerLevel + 1;
  const upg = SPRINKLER_UPGRADES.find((s) => s.level === nextLevel);
  if (!upg) return false;
  if (state.player.level < upg.reqLevel || state.player.gold < upg.gold) return false;
  state.player.gold -= upg.gold;
  state.sprinklerLevel = nextLevel;
  // Immediately water covered tilled tiles!
  for (const tile of Object.values(state.tiles)) {
    if (tile.unlocked && tile.tilled && isTileCoveredBySprinkler(tile.x, tile.y, nextLevel)) {
      tile.watered = true;
    }
  }
  saveGame(state);
  return true;
}

export function upgradeHouse(state: GameState): boolean {
  const nextLevel = state.houseLevel + 1;
  const upg = HOUSE_UPGRADES.find((h) => h.level === nextLevel);
  if (!upg) return false;
  if (state.player.level < upg.reqLevel || state.player.gold < upg.gold) return false;
  state.player.gold -= upg.gold;
  state.houseLevel = nextLevel;
  state.player.maxStamina += upg.staminaBonus;
  state.player.stamina = state.player.maxStamina;
  saveGame(state);
  return true;
}

const ANIMAL_NAMES: Record<AnimalSpecies, string[]> = {
  chicken: ['Pip', 'Sunny', 'Buttercup', 'Nugget'],
  cow: ['Clover', 'Bella', 'Maple'],
  sheep: ['Cloud', 'Cotton', 'Puff'],
};

export function adoptLivestock(state: GameState, species: AnimalSpecies): boolean {
  const shopItem = LIVESTOCK_SHOP.find((l) => l.species === species);
  if (!shopItem) return false;
  const curCount = state.livestock.filter((a) => a.species === species).length;
  if (curCount >= shopItem.maxCount) return false;
  if (state.player.level < shopItem.reqLevel || state.player.gold < shopItem.price) return false;

  state.player.gold -= shopItem.price;
  const names = ANIMAL_NAMES[species];
  const name = names[curCount % names.length];

  state.livestock.push({
    id: `animal_${species}_${Date.now()}`,
    species,
    name,
    x: PEN_BOUNDS.minX + 1.5 + Math.random() * 5,
    y: PEN_BOUNDS.minY + 1 + Math.random() * 2,
    targetX: PEN_BOUNDS.minX + 2 + Math.random() * 5,
    targetY: PEN_BOUNDS.minY + 1 + Math.random() * 2,
    fedToday: false,
    pettedToday: false,
    productReady: false,
    facing: 'right',
    animOffset: Math.random() * 5,
  });
  saveGame(state);
  return true;
}

export function completeQuest(
  state: GameState,
  questId: string
): { success: boolean; leveledUp: boolean } {
  const q = state.quests.find((item) => item.id === questId);
  if (!q || q.claimed) return { success: false, leveledUp: false };
  if (getItemCount(state, q.itemId) < q.requiredQty) {
    return { success: false, leveledUp: false };
  }
  addItem(state, q.itemId, -q.requiredQty);
  q.claimed = true;
  state.player.gold += q.rewardGold;
  state.stats.goldEarned += q.rewardGold;
  state.stats.questsCompleted += 1;
  state.npcFriendship[q.npcId] = Math.min(100, state.npcFriendship[q.npcId] + q.rewardFriendship);
  const xpRes = grantXp(state, q.rewardXp);
  saveGame(state);
  return { success: true, leveledUp: xpRes.leveledUp };
}

export function talkToNpc(state: GameState, npcId: NpcId): { firstToday: boolean } {
  const firstToday = !state.npcTalkedToday[npcId];
  if (firstToday) {
    state.npcTalkedToday[npcId] = true;
    state.npcFriendship[npcId] = Math.min(100, state.npcFriendship[npcId] + 6);
    grantXp(state, 8);
    saveGame(state);
  }
  return { firstToday };
}

export function giftNpc(
  state: GameState,
  npcId: NpcId,
  itemId: ItemId
): { success: boolean; loved: boolean; points: number } {
  if (state.npcGiftedToday[npcId]) return { success: false, loved: false, points: 0 };
  if (getItemCount(state, itemId) <= 0) return { success: false, loved: false, points: 0 };
  addItem(state, itemId, -1);
  state.npcGiftedToday[npcId] = true;
  const loved = NPCS[npcId].favoriteItem === itemId;
  const points = loved ? 20 : 10;
  state.npcFriendship[npcId] = Math.min(100, state.npcFriendship[npcId] + points);
  grantXp(state, loved ? 20 : 10);
  saveGame(state);
  return { success: true, loved, points };
}

export function formatClock(timeOfDay: number): string {
  const totalMinutes = Math.floor(6 * 60 + timeOfDay * 17 * 60);
  const h24 = Math.floor(totalMinutes / 60);
  const m = Math.floor((totalMinutes % 60) / 10) * 10;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function buildFarmSnapshot(state: GameState, ownerId: string): FarmSnapshot {
  const tiles: FarmTileSnapshot[] = [];
  for (const t of Object.values(state.tiles)) {
    if (!t.unlocked) continue;
    if (!t.tilled && !t.crop) continue;
    tiles.push({
      x: t.x,
      y: t.y,
      tilled: t.tilled,
      watered: t.watered,
      fertilized: t.fertilized,
      cropId: t.crop?.cropId,
      progress: t.crop ? Math.round(t.crop.progress * 100) / 100 : undefined,
    });
  }
  return {
    ownerId,
    ownerName: state.player.name,
    level: state.player.level,
    houseLevel: state.houseLevel,
    farmExpansionLevel: state.farmExpansionLevel,
    sprinklerLevel: state.sprinklerLevel,
    shirtColor: state.player.shirtColor || '#ef4444',
    hatColor: state.player.hatColor || '#facc15',
    tiles,
    animalCount: state.livestock.length,
  };
}

export function buildFallbackFarmSnapshot(farmer: RemoteFarmer): FarmSnapshot {
  const cropCycle: CropId[] = ['turnip', 'wheat', 'carrot', 'strawberry', 'corn', 'pumpkin', 'starfruit', 'golden_melon'];
  const tiles: FarmTileSnapshot[] = [];
  const exp = farmer.level >= 7 ? 3 : farmer.level >= 4 ? 2 : farmer.level >= 2 ? 1 : 0;
  const maxCols = exp === 0 ? 6 : exp === 1 ? 8 : exp === 2 ? 10 : 12;
  const maxRows = exp >= 2 ? 6 : 5;
  for (let ry = 0; ry < maxRows; ry++) {
    for (let rx = 0; rx < maxCols; rx++) {
      if ((rx + ry) % 3 === 2) continue;
      const cropIdx = Math.min(cropCycle.length - 1, Math.floor((rx + ry + farmer.level) % Math.max(2, farmer.level)));
      tiles.push({
        x: FIELD_ORIGIN_X + rx,
        y: FIELD_ORIGIN_Y + ry,
        tilled: true,
        watered: (rx + ry) % 2 === 0,
        fertilized: farmer.level >= 4 && rx % 2 === 0,
        cropId: cropCycle[cropIdx],
        progress: 0.45 + ((rx * 7 + ry * 13) % 55) / 100,
      });
    }
  }
  return {
    ownerId: farmer.id,
    ownerName: farmer.name,
    level: farmer.level,
    houseLevel: farmer.level >= 7 ? 3 : farmer.level >= 3 ? 2 : 1,
    farmExpansionLevel: exp,
    sprinklerLevel: farmer.level >= 6 ? 2 : farmer.level >= 2 ? 1 : 0,
    shirtColor: farmer.shirtColor,
    hatColor: farmer.hatColor,
    tiles,
    animalCount: 2,
  };
}

export function grantCoopHelpReward(state: GameState): { leveledUp: boolean } {
  state.player.gold += 30;
  state.stats.goldEarned += 30;
  state.stats.neighborsHelped += 1;
  const xpRes = grantXp(state, 24);
  saveGame(state);
  return { leveledUp: xpRes.leveledUp };
}
