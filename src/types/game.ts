export type Language = 'en' | 'fr' | 'ar';

export type CropId =
  | 'turnip'
  | 'wheat'
  | 'carrot'
  | 'strawberry'
  | 'corn'
  | 'pumpkin'
  | 'starfruit'
  | 'golden_melon';

export type ItemId =
  | CropId
  | `${CropId}_seed`
  | 'fertilizer'
  | 'animal_feed'
  | 'egg'
  | 'milk'
  | 'wool'
  | 'apple'
  | 'peach'
  | 'flour'
  | 'cheese'
  | 'berry_jam';

export type ToolId = 'hoe' | 'watering_can' | 'scythe';

export type ToolTier = 1 | 2 | 3; // 1 = Rustic (1x1), 2 = Copper (3x1), 3 = Gold (3x3)

export type HotbarSlotType =
  | { kind: 'tool'; toolId: ToolId }
  | { kind: 'item'; itemId: ItemId };

export type WeatherType = 'sunny' | 'rainy';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface CropDefinition {
  id: CropId;
  name: string;
  seedId: `${CropId}_seed`;
  seedName: string;
  seedPrice: number;
  sellPrice: number;
  growthSeconds: number;
  overnightBonus: number;
  xpReward: number;
  unlockLevel: number;
  color: string;
  accentColor: string;
  description: string;
}

export interface ItemDefinition {
  id: ItemId;
  name: string;
  category: 'seed' | 'crop' | 'supply' | 'animal_product' | 'fruit' | 'artisan';
  buyPrice?: number;
  sellPrice?: number;
  unlockLevel?: number;
  color: string;
  emoji: string;
  description: string;
  cropId?: CropId;
}

export interface PlantedCrop {
  cropId: CropId;
  progress: number; // 0 to 1
  plantedDay: number;
}

export interface FarmTile {
  x: number;
  y: number;
  unlocked: boolean;
  tilled: boolean;
  watered: boolean;
  fertilized: boolean;
  hasWeed: boolean;
  crop: PlantedCrop | null;
}

export type AnimalSpecies = 'chicken' | 'cow' | 'sheep';

export interface LivestockAnimal {
  id: string;
  species: AnimalSpecies;
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  fedToday: boolean;
  pettedToday: boolean;
  productReady: boolean;
  facing: 'left' | 'right';
  animOffset: number;
}

export interface OrchardTree {
  id: string;
  fruit: 'apple' | 'peach';
  x: number;
  y: number;
  fruitsReady: number;
}

export type NpcId = 'maya' | 'barnaby' | 'lina';

export interface NpcDefinition {
  id: NpcId;
  name: string;
  role: string;
  x: number;
  y: number;
  shirtColor: string;
  hairColor: string;
  hatColor?: string;
  greetingSunny: string[];
  greetingRainy: string[];
  favoriteItem: ItemId;
  opensShop?: boolean;
}

export interface Quest {
  id: string;
  npcId: NpcId;
  title: string;
  description: string;
  itemId: ItemId;
  requiredQty: number;
  rewardGold: number;
  rewardXp: number;
  rewardFriendship: number;
  claimed: boolean;
}

export interface ArtisanRecipe {
  id: string;
  name: string;
  inputId: ItemId;
  inputQty: number;
  outputId: ItemId;
  outputQty: number;
  xpReward: number;
  unlockLevel: number;
}

export interface NeighborFarm {
  id: string;
  ownerName: string;
  farmName: string;
  regionLabel: string;
  level: number;
  specialtyCrop: CropId;
  accentColor: string;
  mapX: number; // 0..100 % on multiplayer world map
  mapY: number;
  wateredToday: boolean;
  harvestedToday: boolean;
  online: boolean;
}

export interface RemoteFarmer {
  id: string;
  name: string;
  level: number;
  gold?: number;
  activity?: string;
  aiTimer?: number;
  wavedToday?: boolean;
  room: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  facing: Direction;
  shirtColor: string;
  hatColor: string;
  isRealPlayer: boolean;
  emote?: string;
  emoteTimer?: number;
  chatBubble?: string;
  chatBubbleTimer?: number;
  lastSeen: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  system?: boolean;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  age: number;
  duration: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  age: number;
  duration: number;
  gravity: number;
  shape: 'circle' | 'square' | 'sparkle' | 'heart';
}

export interface PlayerState {
  name: string;
  roomCode: string;
  shirtColor?: string;
  hatColor?: string;
  x: number;
  y: number;
  facing: Direction;
  moving: boolean;
  walkPhase: number;
  targetX: number | null;
  targetY: number | null;
  stamina: number;
  maxStamina: number;
  gold: number;
  level: number;
  xp: number;
  xpToNext: number;
  toolTiers: Record<ToolId, ToolTier>;
  actionAnimTimer: number;
  actionTool: ToolId | 'hand' | null;
  emote?: string;
  emoteTimer?: number;
  chatBubble?: string;
  chatBubbleTimer?: number;
}

export interface DaySummary {
  day: number;
  weather: WeatherType;
  cropsMatured: number;
  productsReady: number;
  fruitsGrown: number;
  sprinklerWatered: number;
  staminaRestored: number;
}

export interface GameState {
  version: number;
  language: Language;
  day: number;
  timeOfDay: number;
  weather: WeatherType;
  farmExpansionLevel: number; // 0..3
  sprinklerLevel: number; // 0..3
  houseLevel: number; // 1..3
  player: PlayerState;
  inventory: Partial<Record<ItemId, number>>;
  selectedHotbarIndex: number;
  tiles: Record<string, FarmTile>;
  livestock: LivestockAnimal[];
  orchardTrees: OrchardTree[];
  neighbors: NeighborFarm[];
  npcFriendship: Record<NpcId, number>;
  npcTalkedToday: Record<NpcId, boolean>;
  npcGiftedToday: Record<NpcId, boolean>;
  quests: Quest[];
  stats: {
    cropsHarvested: number;
    questsCompleted: number;
    goldEarned: number;
    artisanCrafted: number;
    neighborsHelped: number;
  };
  tutorialDismissed: boolean;
  muted: boolean;
}
