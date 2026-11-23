import {
  ArtisanRecipe,
  CropDefinition,
  CropId,
  ItemDefinition,
  ItemId,
  Language,
  ToolId,
  ToolTier,
} from '../types/game';

export const MAX_LEVEL = 10;

export const CROPS: Record<CropId, CropDefinition> = {
  turnip: {
    id: 'turnip',
    name: 'Turnip',
    seedId: 'turnip_seed',
    seedName: 'Turnip Seeds',
    seedPrice: 15,
    sellPrice: 38,
    growthSeconds: 28,
    overnightBonus: 0.7,
    xpReward: 14,
    unlockLevel: 1,
    color: '#c084fc',
    accentColor: '#f5f3ff',
    description: 'Crisp purple-top root. Fast growing and reliable.',
  },
  wheat: {
    id: 'wheat',
    name: 'Golden Wheat',
    seedId: 'wheat_seed',
    seedName: 'Wheat Seeds',
    seedPrice: 28,
    sellPrice: 72,
    growthSeconds: 44,
    overnightBonus: 0.58,
    xpReward: 22,
    unlockLevel: 1,
    color: '#facc15',
    accentColor: '#fef08a',
    description: 'Sun-kissed grain used to mill Artisan Flour.',
  },
  carrot: {
    id: 'carrot',
    name: 'Sweet Carrot',
    seedId: 'carrot_seed',
    seedName: 'Carrot Seeds',
    seedPrice: 40,
    sellPrice: 105,
    growthSeconds: 54,
    overnightBonus: 0.52,
    xpReward: 30,
    unlockLevel: 2,
    color: '#fb923c',
    accentColor: '#ffedd5',
    description: 'Crunchy orange root loved across Cloverbrook.',
  },
  strawberry: {
    id: 'strawberry',
    name: 'Ruby Strawberry',
    seedId: 'strawberry_seed',
    seedName: 'Strawberry Seeds',
    seedPrice: 58,
    sellPrice: 155,
    growthSeconds: 66,
    overnightBonus: 0.46,
    xpReward: 40,
    unlockLevel: 2,
    color: '#f43f5e',
    accentColor: '#fda4af',
    description: 'Juicy scarlet berries ideal for Ruby Jam.',
  },
  corn: {
    id: 'corn',
    name: 'Sunburst Corn',
    seedId: 'corn_seed',
    seedName: 'Corn Seeds',
    seedPrice: 80,
    sellPrice: 215,
    growthSeconds: 78,
    overnightBonus: 0.44,
    xpReward: 52,
    unlockLevel: 3,
    color: '#fde047',
    accentColor: '#bef264',
    description: 'Tall golden stalks bursting with sweet kernels.',
  },
  pumpkin: {
    id: 'pumpkin',
    name: 'Harvest Pumpkin',
    seedId: 'pumpkin_seed',
    seedName: 'Pumpkin Seeds',
    seedPrice: 110,
    sellPrice: 295,
    growthSeconds: 92,
    overnightBonus: 0.4,
    xpReward: 70,
    unlockLevel: 4,
    color: '#f97316',
    accentColor: '#fed7aa',
    description: 'Plump autumn gourd that fetches a hefty sum.',
  },
  starfruit: {
    id: 'starfruit',
    name: 'Starfruit Berry',
    seedId: 'starfruit_seed',
    seedName: 'Starfruit Seeds',
    seedPrice: 165,
    sellPrice: 460,
    growthSeconds: 112,
    overnightBonus: 0.36,
    xpReward: 95,
    unlockLevel: 6,
    color: '#38bdf8',
    accentColor: '#e0f2fe',
    description: 'Luminous sky-blue fruit prized by master growers.',
  },
  golden_melon: {
    id: 'golden_melon',
    name: 'Golden Melon',
    seedId: 'golden_melon_seed',
    seedName: 'Golden Melon Seeds',
    seedPrice: 240,
    sellPrice: 690,
    growthSeconds: 130,
    overnightBonus: 0.34,
    xpReward: 140,
    unlockLevel: 8,
    color: '#eab308',
    accentColor: '#fef9c3',
    description: 'Legendary shimmering melon of GreenSAGA Valley!',
  },
};

export const CROP_ORDER: CropId[] = [
  'turnip',
  'wheat',
  'carrot',
  'strawberry',
  'corn',
  'pumpkin',
  'starfruit',
  'golden_melon',
];

export const ITEMS: Record<ItemId, ItemDefinition> = {
  turnip_seed: {
    id: 'turnip_seed',
    name: 'Turnip Seeds',
    category: 'seed',
    buyPrice: CROPS.turnip.seedPrice,
    sellPrice: 7,
    unlockLevel: CROPS.turnip.unlockLevel,
    color: '#a855f7',
    emoji: '🌱',
    description: 'Plant on tilled soil. Matures quickly.',
    cropId: 'turnip',
  },
  wheat_seed: {
    id: 'wheat_seed',
    name: 'Wheat Seeds',
    category: 'seed',
    buyPrice: CROPS.wheat.seedPrice,
    sellPrice: 14,
    unlockLevel: CROPS.wheat.unlockLevel,
    color: '#eab308',
    emoji: '🌾',
    description: 'Plant on tilled soil for golden grain.',
    cropId: 'wheat',
  },
  carrot_seed: {
    id: 'carrot_seed',
    name: 'Carrot Seeds',
    category: 'seed',
    buyPrice: CROPS.carrot.seedPrice,
    sellPrice: 20,
    unlockLevel: CROPS.carrot.unlockLevel,
    color: '#fb923c',
    emoji: '🥕',
    description: 'Plant on tilled soil for sweet carrots.',
    cropId: 'carrot',
  },
  strawberry_seed: {
    id: 'strawberry_seed',
    name: 'Strawberry Seeds',
    category: 'seed',
    buyPrice: CROPS.strawberry.seedPrice,
    sellPrice: 28,
    unlockLevel: CROPS.strawberry.unlockLevel,
    color: '#f43f5e',
    emoji: '🍓',
    description: 'Plant on tilled soil for sweet berries.',
    cropId: 'strawberry',
  },
  corn_seed: {
    id: 'corn_seed',
    name: 'Corn Seeds',
    category: 'seed',
    buyPrice: CROPS.corn.seedPrice,
    sellPrice: 38,
    unlockLevel: CROPS.corn.unlockLevel,
    color: '#fde047',
    emoji: '🌽',
    description: 'Plant on tilled soil for tall sunlit corn.',
    cropId: 'corn',
  },
  pumpkin_seed: {
    id: 'pumpkin_seed',
    name: 'Pumpkin Seeds',
    category: 'seed',
    buyPrice: CROPS.pumpkin.seedPrice,
    sellPrice: 52,
    unlockLevel: CROPS.pumpkin.unlockLevel,
    color: '#f97316',
    emoji: '🎃',
    description: 'Plant on tilled soil for hearty pumpkins.',
    cropId: 'pumpkin',
  },
  starfruit_seed: {
    id: 'starfruit_seed',
    name: 'Starfruit Seeds',
    category: 'seed',
    buyPrice: CROPS.starfruit.seedPrice,
    sellPrice: 78,
    unlockLevel: CROPS.starfruit.unlockLevel,
    color: '#38bdf8',
    emoji: '⭐',
    description: 'Rare celestial seeds for expert farmers.',
    cropId: 'starfruit',
  },
  golden_melon_seed: {
    id: 'golden_melon_seed',
    name: 'Golden Melon Seeds',
    category: 'seed',
    buyPrice: CROPS.golden_melon.seedPrice,
    sellPrice: 115,
    unlockLevel: CROPS.golden_melon.unlockLevel,
    color: '#facc15',
    emoji: '✨',
    description: 'Legendary seeds of the prized Golden Melon.',
    cropId: 'golden_melon',
  },
  turnip: {
    id: 'turnip',
    name: 'Turnip',
    category: 'crop',
    sellPrice: CROPS.turnip.sellPrice,
    color: '#c084fc',
    emoji: '🟣',
    description: 'Freshly harvested Turnip.',
    cropId: 'turnip',
  },
  wheat: {
    id: 'wheat',
    name: 'Golden Wheat',
    category: 'crop',
    sellPrice: CROPS.wheat.sellPrice,
    color: '#facc15',
    emoji: '🌾',
    description: 'Bundle of sunlit Golden Wheat.',
    cropId: 'wheat',
  },
  carrot: {
    id: 'carrot',
    name: 'Sweet Carrot',
    category: 'crop',
    sellPrice: CROPS.carrot.sellPrice,
    color: '#fb923c',
    emoji: '🥕',
    description: 'Crunchy garden carrot.',
    cropId: 'carrot',
  },
  strawberry: {
    id: 'strawberry',
    name: 'Ruby Strawberry',
    category: 'crop',
    sellPrice: CROPS.strawberry.sellPrice,
    color: '#f43f5e',
    emoji: '🍓',
    description: 'Juicy basket of Ruby Strawberries.',
    cropId: 'strawberry',
  },
  corn: {
    id: 'corn',
    name: 'Sunburst Corn',
    category: 'crop',
    sellPrice: CROPS.corn.sellPrice,
    color: '#fde047',
    emoji: '🌽',
    description: 'Sweet golden ears of corn.',
    cropId: 'corn',
  },
  pumpkin: {
    id: 'pumpkin',
    name: 'Harvest Pumpkin',
    category: 'crop',
    sellPrice: CROPS.pumpkin.sellPrice,
    color: '#f97316',
    emoji: '🎃',
    description: 'Hefty orange Harvest Pumpkin.',
    cropId: 'pumpkin',
  },
  starfruit: {
    id: 'starfruit',
    name: 'Starfruit Berry',
    category: 'crop',
    sellPrice: CROPS.starfruit.sellPrice,
    color: '#38bdf8',
    emoji: '⭐',
    description: 'Glowing Starfruit prized across the valley.',
    cropId: 'starfruit',
  },
  golden_melon: {
    id: 'golden_melon',
    name: 'Golden Melon',
    category: 'crop',
    sellPrice: CROPS.golden_melon.sellPrice,
    color: '#eab308',
    emoji: '🍈',
    description: 'Radiant Golden Melon prized across the realm.',
    cropId: 'golden_melon',
  },
  fertilizer: {
    id: 'fertilizer',
    name: 'Rich Fertilizer',
    category: 'supply',
    buyPrice: 25,
    sellPrice: 10,
    unlockLevel: 1,
    color: '#22c55e',
    emoji: '🧪',
    description: '+60% growth speed & 25% double harvest chance!',
  },
  animal_feed: {
    id: 'animal_feed',
    name: 'Animal Feed',
    category: 'supply',
    buyPrice: 12,
    sellPrice: 5,
    unlockLevel: 1,
    color: '#d97706',
    emoji: '🥣',
    description: 'Feed Chickens, Cows & Sheep daily for fresh produce.',
  },
  egg: {
    id: 'egg',
    name: 'Farm Fresh Egg',
    category: 'animal_product',
    sellPrice: 52,
    color: '#fef3c7',
    emoji: '🥚',
    description: 'Laid by a happy GreenSAGA chicken.',
  },
  milk: {
    id: 'milk',
    name: 'Creamy Milk',
    category: 'animal_product',
    sellPrice: 105,
    color: '#f8fafc',
    emoji: '🥛',
    description: 'Rich milk from a pasture cow.',
  },
  wool: {
    id: 'wool',
    name: 'Fluffy Wool',
    category: 'animal_product',
    sellPrice: 165,
    color: '#f1f5f9',
    emoji: '🧶',
    description: 'Soft fleece sheared from a content sheep.',
  },
  apple: {
    id: 'apple',
    name: 'Crisp Apple',
    category: 'fruit',
    sellPrice: 44,
    color: '#ef4444',
    emoji: '🍎',
    description: 'Picked fresh from your GreenSAGA orchard.',
  },
  peach: {
    id: 'peach',
    name: 'Sweet Peach',
    category: 'fruit',
    sellPrice: 60,
    color: '#fb7185',
    emoji: '🍑',
    description: 'Sun-ripened orchard peach.',
  },
  flour: {
    id: 'flour',
    name: 'Artisan Flour',
    category: 'artisan',
    sellPrice: 195,
    color: '#fef3c7',
    emoji: '🥖',
    description: 'Stone-ground from Golden Wheat at your Artisan Mill.',
  },
  cheese: {
    id: 'cheese',
    name: 'Aged Cheese',
    category: 'artisan',
    sellPrice: 270,
    color: '#facc15',
    emoji: '🧀',
    description: 'Golden farmstead cheese pressed from Creamy Milk.',
  },
  berry_jam: {
    id: 'berry_jam',
    name: 'Ruby Jam',
    category: 'artisan',
    sellPrice: 390,
    color: '#e11d48',
    emoji: '🫙',
    description: 'Sweet ruby preserve crafted from fresh Strawberries.',
  },
};

export const ARTISAN_RECIPES: ArtisanRecipe[] = [
  {
    id: 'recipe_flour',
    name: 'Artisan Flour',
    inputId: 'wheat',
    inputQty: 2,
    outputId: 'flour',
    outputQty: 1,
    xpReward: 34,
    unlockLevel: 1,
  },
  {
    id: 'recipe_cheese',
    name: 'Aged Cheese',
    inputId: 'milk',
    inputQty: 2,
    outputId: 'cheese',
    outputQty: 1,
    xpReward: 48,
    unlockLevel: 2,
  },
  {
    id: 'recipe_jam',
    name: 'Ruby Jam',
    inputId: 'strawberry',
    inputQty: 2,
    outputId: 'berry_jam',
    outputQty: 1,
    xpReward: 65,
    unlockLevel: 3,
  },
];

export interface ToolInfo {
  id: ToolId;
  name: string;
  staminaCost: number;
  description: string;
  tierNames: Record<ToolTier, string>;
  upgradeCosts: Record<2 | 3, { gold: number; level: number; areaDesc: string }>;
}

export const TOOLS: Record<ToolId, ToolInfo> = {
  hoe: {
    id: 'hoe',
    name: 'Hoe',
    staminaCost: 3,
    description: 'Tills grassy farm plots into fertile soil.',
    tierNames: { 1: 'Rustic Hoe', 2: 'Copper Hoe', 3: 'Gold Hoe' },
    upgradeCosts: {
      2: { gold: 220, level: 2, areaDesc: 'Tills a 3×1 strip at once' },
      3: { gold: 580, level: 5, areaDesc: 'Tills a 3×3 patch at once' },
    },
  },
  watering_can: {
    id: 'watering_can',
    name: 'Watering Can',
    staminaCost: 2,
    description: 'Waters tilled soil so crops grow briskly.',
    tierNames: { 1: 'Tin Watering Can', 2: 'Copper Watering Can', 3: 'Gold Watering Can' },
    upgradeCosts: {
      2: { gold: 260, level: 2, areaDesc: 'Waters a 3×1 strip at once' },
      3: { gold: 640, level: 5, areaDesc: 'Waters a 3×3 patch at once' },
    },
  },
  scythe: {
    id: 'scythe',
    name: 'Scythe',
    staminaCost: 2,
    description: 'Harvests ripe crops & clears pesky weeds.',
    tierNames: { 1: 'Hand Scythe', 2: 'Copper Scythe', 3: 'Gold Scythe' },
    upgradeCosts: {
      2: { gold: 240, level: 2, areaDesc: 'Sweeps a 3×1 strip at once' },
      3: { gold: 600, level: 5, areaDesc: 'Sweeps a 3×3 patch at once' },
    },
  },
};

export const FARM_EXPANSIONS = [
  { level: 1, name: 'East Field Expansion', plotsLabel: '8×5 (40 plots)', gold: 320, reqLevel: 2 },
  { level: 2, name: 'Valley Estate Field', plotsLabel: '10×6 (60 plots)', gold: 720, reqLevel: 4 },
  { level: 3, name: 'Grand GreenSAGA Plantation', plotsLabel: '12×6 (72 plots)', gold: 1350, reqLevel: 7 },
];

export const SPRINKLER_UPGRADES = [
  { level: 1, name: 'Copper Sprinkler', desc: 'Auto-waters 3×3 center plots every morning', gold: 280, reqLevel: 2 },
  { level: 2, name: 'Twin Valley Sprinklers', desc: 'Auto-waters 6×5 plots every morning', gold: 620, reqLevel: 4 },
  { level: 3, name: 'Full-Field Irrigation', desc: 'Auto-waters your ENTIRE field every morning!', gold: 1200, reqLevel: 6 },
];

export const HOUSE_UPGRADES = [
  { level: 2, name: 'Cozy Timber Manor', desc: '+25 Max Stamina & ornate porch roof', gold: 480, reqLevel: 3, staminaBonus: 25 },
  { level: 3, name: 'Grand GreenSAGA Villa', desc: '+40 Max Stamina & golden royal roof', gold: 1150, reqLevel: 6, staminaBonus: 40 },
];

export const LIVESTOCK_SHOP = [
  {
    species: 'chicken' as const,
    name: 'Cozy Chicken',
    price: 170,
    reqLevel: 1,
    maxCount: 4,
    produces: 'Farm Fresh Egg (52g/day)',
    emoji: '🐔',
  },
  {
    species: 'cow' as const,
    name: 'Pasture Cow',
    price: 360,
    reqLevel: 2,
    maxCount: 3,
    produces: 'Creamy Milk (105g/day)',
    emoji: '🐄',
  },
  {
    species: 'sheep' as const,
    name: 'Fluffy Sheep',
    price: 540,
    reqLevel: 3,
    maxCount: 3,
    produces: 'Fluffy Wool (165g/day)',
    emoji: '🐑',
  },
];

export interface LevelMilestone {
  level: number;
  unlocks: Record<Language, string>;
}

export const LEVEL_MILESTONES: LevelMilestone[] = [
  {
    level: 1,
    unlocks: {
      en: 'Turnip, Wheat, Chickens, Artisan Flour & 6×5 Homestead',
      fr: 'Navet, Blé, Poules, Farine Artisanale & Domaine 6×5',
      ar: 'اللفت، القمح، الدجاج، الدقيق الحرفي ومزرعة 6×5',
    },
  },
  {
    level: 2,
    unlocks: {
      en: 'Carrots, Strawberries, Copper Tools (3×1), Cows, Sprinklers Lv.1 & 8×5 Field',
      fr: 'Carottes, Fraises, Outils Cuivre (3×1), Vaches, Arroseur N1 & Champ 8×5',
      ar: 'الجزر، الفراولة، أدوات نحاسية (3×1)، الأبقار، مرشات م1 وتوسعة 8×5',
    },
  },
  {
    level: 3,
    unlocks: {
      en: 'Sunburst Corn, Fluffy Sheep, Ruby Jam, Cozy Manor House & +5% Sell Bonus',
      fr: 'Maïs Soleil, Moutons, Confiture Rubis, Manoir & +5% Vente',
      ar: 'الذرة المشمسة، الأغنام، مربى الفراولة، تطوير المنزل ومكافأة بيع +5%',
    },
  },
  {
    level: 4,
    unlocks: {
      en: 'Harvest Pumpkin, 10×6 Valley Field, Twin Sprinklers & +10% Sell Bonus',
      fr: 'Citrouille, Champ 10×6, Doubles Arroseurs & +10% Vente',
      ar: 'يقطين الحصاد، توسعة 10×6، مرشات مزدوجة ومكافأة بيع +10%',
    },
  },
  {
    level: 5,
    unlocks: {
      en: 'Gold Tools (3×3 Master Sweep!), +15% Sell Bonus & Master Badge',
      fr: 'Outils en Or (Zone 3×3 !), +15% Vente & Badge Maître',
      ar: 'الأدوات الذهبية (نطاق 3×3!)، مكافأة بيع +15% ووسام الخبير',
    },
  },
  {
    level: 6,
    unlocks: {
      en: 'Starfruit Berry, Full-Field Irrigation, Grand GreenSAGA Villa & +20% Sell Bonus',
      fr: 'Carambole Étoilée, Irrigation Totale, Grande Villa & +20% Vente',
      ar: 'فاكهة النجمة، ري آلي شامل، فيلا GreenSAGA الكبرى ومكافأة +20%',
    },
  },
  {
    level: 7,
    unlocks: {
      en: 'Grand 12×6 Plantation (72 Plots!) & +25% Crop Sell Bonus',
      fr: 'Grande Plantation 12×6 (72 Parcelles !) & +25% Vente',
      ar: 'المزرعة الكبرى 12×6 (72 قطعة!) ومكافأة بيع +25%',
    },
  },
  {
    level: 8,
    unlocks: {
      en: 'Legendary Golden Melon Seeds & +30% Crop Sell Bonus',
      fr: 'Graines Légendaires de Melon d’Or & +30% Vente',
      ar: 'بذور البطيخ الذهبي الأسطوري ومكافأة بيع +30%',
    },
  },
  {
    level: 9,
    unlocks: {
      en: 'Cloverbrook Hero Title, +35% Sell Bonus & Extra Stamina Mastery',
      fr: 'Titre Héros de Cloverbrook, +35% Vente & Maîtrise d’Endurance',
      ar: 'لقب بطل كلوفربروك، مكافأة بيع +35% وإتقان الطاقة',
    },
  },
  {
    level: 10,
    unlocks: {
      en: 'GreenSAGA Valley Legend Crown & +45% Ultimate Harvest Sell Bonus!',
      fr: 'Couronne Légende d’GreenSAGA & +45% Bonus de Vente Ultime !',
      ar: 'تاج أسطورة وادي GreenSAGA ومكافأة بيع قصوى +45%!',
    },
  },
];

export function getSellBonusMultiplier(level: number): number {
  if (level >= 10) return 1.45;
  if (level < 3) return 1.0;
  return 1 + (level - 2) * 0.05;
}

export function xpRequiredForLevel(level: number): number {
  if (level >= MAX_LEVEL) return 9999;
  return Math.round(85 + (level - 1) * 90 + Math.pow(level - 1, 1.55) * 40);
}

export function getCropStage(progress: number): 0 | 1 | 2 | 3 {
  if (progress >= 1) return 3;
  if (progress >= 0.62) return 2;
  if (progress >= 0.28) return 1;
  return 0;
}
