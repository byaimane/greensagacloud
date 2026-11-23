export type ResourceKey = 'food' | 'wood' | 'iron' | 'gold';

export interface ResourceCost {
  food: number;
  wood: number;
  iron: number;
  gold: number;
}

export type BuildingType =
  | 'castle'
  | 'barracks'
  | 'archery'
  | 'stables'
  | 'siege_workshop'
  | 'farm'
  | 'sawmill'
  | 'iron_mine'
  | 'gold_mint'
  | 'academy'
  | 'forge'
  | 'hospital'
  | 'alliance_hall'
  | 'walls';

export interface BuildingDefinition {
  type: BuildingType;
  slotId: string;
  name: string;
  category: 'core' | 'military' | 'resource' | 'support';
  description: string;
  maxLevel: number;
  baseCost: ResourceCost;
  baseTimeSec: number;
  powerPerLevel: number;
  /** Position on the 1000x640 city canvas */
  x: number;
  y: number;
  color: string;
  accent: string;
  icon: string;
  productionResource?: ResourceKey;
  baseProductionPerHour?: number;
}

export const BUILDINGS: BuildingDefinition[] = [
  {
    type: 'castle',
    slotId: 'castle',
    name: 'Citadel Keep',
    category: 'core',
    description: 'The heart of your OUAGX kingdom. Unlocks max levels for all buildings, higher troop tiers, and march size.',
    maxLevel: 30,
    baseCost: { food: 180, wood: 200, iron: 120, gold: 80 },
    baseTimeSec: 15,
    powerPerLevel: 250,
    x: 500,
    y: 230,
    color: '#d97706',
    accent: '#fef3c7',
    icon: '🏰',
  },
  {
    type: 'walls',
    slotId: 'walls',
    name: 'Fortress Walls',
    category: 'core',
    description: 'Defends your kingdom against enemy sieges and increases garrison defense bonus.',
    maxLevel: 30,
    baseCost: { food: 100, wood: 180, iron: 140, gold: 40 },
    baseTimeSec: 12,
    powerPerLevel: 120,
    x: 500,
    y: 525,
    color: '#64748b',
    accent: '#e2e8f0',
    icon: '🛡️',
  },
  {
    type: 'barracks',
    slotId: 'barracks',
    name: 'Infantry Barracks',
    category: 'military',
    description: 'Trains shielded Footmen, Pikemen, and Royal Guards. Strong against Cavalry.',
    maxLevel: 30,
    baseCost: { food: 110, wood: 130, iron: 90, gold: 40 },
    baseTimeSec: 10,
    powerPerLevel: 95,
    x: 270,
    y: 320,
    color: '#b91c1c',
    accent: '#fecaca',
    icon: '⚔️',
  },
  {
    type: 'archery',
    slotId: 'archery',
    name: 'Archery Range',
    category: 'military',
    description: 'Trains Bowmen, Crossbowmen, and Shadow Snipers. Strong against Infantry.',
    maxLevel: 30,
    baseCost: { food: 100, wood: 160, iron: 70, gold: 45 },
    baseTimeSec: 10,
    powerPerLevel: 95,
    x: 340,
    y: 425,
    color: '#15803d',
    accent: '#bbf7d0',
    icon: '🏹',
  },
  {
    type: 'stables',
    slotId: 'stables',
    name: 'War Stables',
    category: 'military',
    description: 'Trains Light Riders, Lancers, and Dragon Knights. Strong against Archers.',
    maxLevel: 30,
    baseCost: { food: 150, wood: 110, iron: 100, gold: 55 },
    baseTimeSec: 12,
    powerPerLevel: 105,
    x: 730,
    y: 320,
    color: '#1d4ed8',
    accent: '#bfdbfe',
    icon: '🐎',
  },
  {
    type: 'siege_workshop',
    slotId: 'siege_workshop',
    name: 'Siege Workshop',
    category: 'military',
    description: 'Constructs Battering Rams, Trebuchets, and Hellfire Cannons for shattering castles.',
    maxLevel: 30,
    baseCost: { food: 90, wood: 180, iron: 150, gold: 70 },
    baseTimeSec: 14,
    powerPerLevel: 115,
    x: 660,
    y: 425,
    color: '#9333ea',
    accent: '#e9d5ff',
    icon: '💣',
  },
  {
    type: 'academy',
    slotId: 'academy',
    name: 'Royal Academy',
    category: 'support',
    description: 'Unlocks Economy, Military, and City Defense technologies to empower your empire.',
    maxLevel: 30,
    baseCost: { food: 120, wood: 150, iron: 110, gold: 100 },
    baseTimeSec: 14,
    powerPerLevel: 130,
    x: 330,
    y: 195,
    color: '#0284c7',
    accent: '#bae6fd',
    icon: '📜',
  },
  {
    type: 'forge',
    slotId: 'forge',
    name: 'Dragon Forge',
    category: 'support',
    description: 'Crafts legendary weapons, armor, rings, and relics for your Heroes.',
    maxLevel: 30,
    baseCost: { food: 80, wood: 120, iron: 170, gold: 90 },
    baseTimeSec: 12,
    powerPerLevel: 110,
    x: 670,
    y: 195,
    color: '#ea580c',
    accent: '#fed7aa',
    icon: '⚒️',
  },
  {
    type: 'hospital',
    slotId: 'hospital',
    name: 'War Hospital',
    category: 'support',
    description: 'Saves wounded soldiers from battle so they can be healed instead of lost forever.',
    maxLevel: 30,
    baseCost: { food: 140, wood: 120, iron: 80, gold: 60 },
    baseTimeSec: 10,
    powerPerLevel: 90,
    x: 410,
    y: 335,
    color: '#0d9488',
    accent: '#99f6e4',
    icon: '⚕️',
  },
  {
    type: 'alliance_hall',
    slotId: 'alliance_hall',
    name: 'Alliance Embassy',
    category: 'support',
    description: 'Increases alliance help capacity and enables rally attacks with your clan.',
    maxLevel: 30,
    baseCost: { food: 110, wood: 140, iron: 90, gold: 80 },
    baseTimeSec: 12,
    powerPerLevel: 100,
    x: 590,
    y: 335,
    color: '#ca8a04',
    accent: '#fef08a',
    icon: '🚩',
  },
  {
    type: 'farm',
    slotId: 'farm',
    name: 'Royal Farms',
    category: 'resource',
    description: 'Produces Food continuously to sustain and train your armies.',
    maxLevel: 30,
    baseCost: { food: 60, wood: 100, iron: 40, gold: 20 },
    baseTimeSec: 8,
    powerPerLevel: 65,
    x: 135,
    y: 235,
    color: '#65a30d',
    accent: '#d9f99d',
    icon: '🌾',
    productionResource: 'food',
    baseProductionPerHour: 1800,
  },
  {
    type: 'sawmill',
    slotId: 'sawmill',
    name: 'Timber Sawmill',
    category: 'resource',
    description: 'Produces Wood for upgrading buildings, arrows, and siege engines.',
    maxLevel: 30,
    baseCost: { food: 90, wood: 70, iron: 45, gold: 20 },
    baseTimeSec: 8,
    powerPerLevel: 65,
    x: 155,
    y: 420,
    color: '#a16207',
    accent: '#fde68a',
    icon: '🌲',
    productionResource: 'wood',
    baseProductionPerHour: 1800,
  },
  {
    type: 'iron_mine',
    slotId: 'iron_mine',
    name: 'Iron Quarry',
    category: 'resource',
    description: 'Extracts Iron ore for steel weapons, armor, and fortifications.',
    maxLevel: 30,
    baseCost: { food: 95, wood: 110, iron: 60, gold: 30 },
    baseTimeSec: 9,
    powerPerLevel: 70,
    x: 855,
    y: 235,
    color: '#475569',
    accent: '#cbd5e1',
    icon: '⛏️',
    productionResource: 'iron',
    baseProductionPerHour: 1300,
  },
  {
    type: 'gold_mint',
    slotId: 'gold_mint',
    name: 'Treasury Mint',
    category: 'resource',
    description: 'Generates Gold coins for royal research, hero recruitment, and forging.',
    maxLevel: 30,
    baseCost: { food: 100, wood: 120, iron: 90, gold: 50 },
    baseTimeSec: 10,
    powerPerLevel: 80,
    x: 845,
    y: 420,
    color: '#eab308',
    accent: '#fef9c3',
    icon: '💰',
    productionResource: 'gold',
    baseProductionPerHour: 950,
  },
];

export const BUILDING_MAP: Record<BuildingType, BuildingDefinition> = Object.fromEntries(
  BUILDINGS.map((b) => [b.type, b])
) as Record<BuildingType, BuildingDefinition>;

export function getBuildingUpgradeCost(type: BuildingType, currentLevel: number): ResourceCost {
  const def = BUILDING_MAP[type];
  const scale = Math.pow(1.42, currentLevel);
  return {
    food: Math.round(def.baseCost.food * scale),
    wood: Math.round(def.baseCost.wood * scale),
    iron: Math.round(def.baseCost.iron * scale),
    gold: Math.round(def.baseCost.gold * scale),
  };
}

export function getBuildingUpgradeTimeSec(type: BuildingType, currentLevel: number, speedBonusPct = 0): number {
  const def = BUILDING_MAP[type];
  // Fun responsive timers: ~10s at lv1, scaling smoothly up to a few minutes at high levels
  const raw = Math.round(def.baseTimeSec * Math.pow(1.32, currentLevel));
  return Math.max(4, Math.round(raw / (1 + speedBonusPct / 100)));
}

export function getResourceProductionPerHour(type: BuildingType, level: number, ecoBonusPct = 0): number {
  const def = BUILDING_MAP[type];
  if (!def.baseProductionPerHour || level <= 0) return 0;
  return Math.round(def.baseProductionPerHour * Math.pow(1.26, level - 1) * (1 + ecoBonusPct / 100));
}

// ---------------------------------------------------------------------------
// TROOPS (Tiers 1–10 across 4 Branches with Rock-Paper-Scissors counters)
// ---------------------------------------------------------------------------
export type TroopBranch = 'infantry' | 'cavalry' | 'archer' | 'siege';

export interface TroopDefinition {
  id: string;
  branch: TroopBranch;
  tier: number;
  name: string;
  buildingReq: BuildingType;
  buildingLevelReq: number;
  attack: number;
  defense: number;
  hp: number;
  speed: number;
  load: number;
  power: number;
  cost: ResourceCost;
  trainTimeSec: number;
  strongAgainst: TroopBranch | 'walls';
  weakAgainst: TroopBranch;
}

const TROOP_NAMES: Record<TroopBranch, string[]> = {
  infantry: [
    'Militia Footman',
    'Shieldbearer',
    'Heavy Pikeman',
    'Iron Halberdier',
    'Vanguard Swordsman',
    'Oathsworn Guard',
    'Templar Warden',
    'Obsidian Phalanx',
    'Royal Paladin',
    'Immortal Titan',
  ],
  cavalry: [
    'Scout Rider',
    'Light Lancer',
    'Steppe Horseman',
    'Armored Knight',
    'War Charger',
    'Griffin Rider',
    'Storm Chevalier',
    'Dread Cataphract',
    'Dragon Knight',
    'Celestial Sovereign',
  ],
  archer: [
    'Village Bowman',
    'Longbowman',
    'Skirmish Crossbow',
    'Marksman',
    'Sharpshooter',
    'Ranger Elite',
    'Shadow Sniper',
    'Arcane Arbalest',
    'Phoenix Bowmaster',
    'Eclipse Deadeye',
  ],
  siege: [
    'Battering Ram',
    'Stone Thrower',
    'Ballista Crew',
    'Siege Tower',
    'Heavy Mangonel',
    'War Trebuchet',
    'Iron Bombard',
    'Hellfire Cannon',
    'Dragonfire Mortar',
    'Worldbreaker Titan',
  ],
};

const BRANCH_BUILDING: Record<TroopBranch, BuildingType> = {
  infantry: 'barracks',
  cavalry: 'stables',
  archer: 'archery',
  siege: 'siege_workshop',
};

const BRANCH_COUNTERS: Record<TroopBranch, { strong: TroopBranch | 'walls'; weak: TroopBranch }> = {
  infantry: { strong: 'cavalry', weak: 'archer' },
  cavalry: { strong: 'archer', weak: 'infantry' },
  archer: { strong: 'infantry', weak: 'cavalry' },
  siege: { strong: 'walls', weak: 'cavalry' },
};

export const TROOPS: TroopDefinition[] = (['infantry', 'cavalry', 'archer', 'siege'] as TroopBranch[]).flatMap(
  (branch) =>
    Array.from({ length: 10 }, (_, idx) => {
      const tier = idx + 1;
      const mult = Math.pow(1.48, idx);
      const baseAtk = branch === 'archer' ? 16 : branch === 'siege' ? 20 : branch === 'cavalry' ? 15 : 12;
      const baseDef = branch === 'infantry' ? 16 : branch === 'cavalry' ? 12 : branch === 'siege' ? 10 : 9;
      const baseHp = branch === 'infantry' ? 32 : branch === 'cavalry' ? 26 : branch === 'siege' ? 24 : 20;
      return {
        id: `${branch}_t${tier}`,
        branch,
        tier,
        name: TROOP_NAMES[branch][idx],
        buildingReq: BRANCH_BUILDING[branch],
        buildingLevelReq: tier === 1 ? 1 : (tier - 1) * 3,
        attack: Math.round(baseAtk * mult),
        defense: Math.round(baseDef * mult),
        hp: Math.round(baseHp * mult),
        speed: branch === 'cavalry' ? 16 : branch === 'archer' ? 12 : branch === 'infantry' ? 10 : 7,
        load: branch === 'siege' ? Math.round(40 * mult) : Math.round(14 * mult),
        power: Math.round(4 * Math.pow(1.55, idx)),
        cost: {
          food: Math.round((branch === 'cavalry' ? 18 : 14) * Math.pow(1.4, idx)),
          wood: Math.round((branch === 'archer' || branch === 'siege' ? 18 : 10) * Math.pow(1.4, idx)),
          iron: Math.round((branch === 'infantry' || branch === 'siege' ? 14 : 8) * Math.pow(1.4, idx)),
          gold: Math.round((tier >= 3 ? 6 : 2) * Math.pow(1.42, idx)),
        },
        trainTimeSec: Math.max(1, Math.round(1.5 * Math.pow(1.3, idx))),
        strongAgainst: BRANCH_COUNTERS[branch].strong,
        weakAgainst: BRANCH_COUNTERS[branch].weak,
      };
    })
);

export const TROOP_MAP: Record<string, TroopDefinition> = Object.fromEntries(TROOPS.map((t) => [t.id, t]));

// ---------------------------------------------------------------------------
// HEROES (RPG Progression, Classes, Skills, Rarity)
// ---------------------------------------------------------------------------
export type HeroClass = 'Warrior' | 'Archer' | 'Mage' | 'Paladin';
export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export interface HeroTemplate {
  key: string;
  name: string;
  title: string;
  heroClass: HeroClass;
  rarity: Rarity;
  avatar: string;
  color: string;
  baseAttack: number;
  baseDefense: number;
  baseHp: number;
  armyBonusBranch: TroopBranch;
  armyBonusPct: number;
  skillName: string;
  skillDescription: string;
  skillMultiplier: number;
  recruitCostGold: number;
  recruitCostGems: number;
}

export const HERO_TEMPLATES: HeroTemplate[] = [
  {
    key: 'aldric',
    name: 'Sir Aldric',
    title: 'Lionheart Vanguard',
    heroClass: 'Warrior',
    rarity: 'Rare',
    avatar: '🦁',
    color: '#f59e0b',
    baseAttack: 115,
    baseDefense: 95,
    baseHp: 900,
    armyBonusBranch: 'infantry',
    armyBonusPct: 12,
    skillName: 'Sovereign Cleave',
    skillDescription: 'Unleashes a golden greatsword shockwave dealing massive frontline damage and rallying Infantry.',
    skillMultiplier: 1.9,
    recruitCostGold: 0,
    recruitCostGems: 0,
  },
  {
    key: 'lyra',
    name: 'Lyra',
    title: 'Shadowbow Huntress',
    heroClass: 'Archer',
    rarity: 'Rare',
    avatar: '🏹',
    color: '#10b981',
    baseAttack: 135,
    baseDefense: 65,
    baseHp: 740,
    armyBonusBranch: 'archer',
    armyBonusPct: 15,
    skillName: 'Volley of Eclipse',
    skillDescription: 'Rains piercing shadow arrows across enemy formations, ignoring 25% of armor.',
    skillMultiplier: 2.1,
    recruitCostGold: 1200,
    recruitCostGems: 0,
  },
  {
    key: 'vaelor',
    name: 'Archmage Vaelor',
    title: 'Keeper of Embers',
    heroClass: 'Mage',
    rarity: 'Epic',
    avatar: '🔥',
    color: '#ef4444',
    baseAttack: 165,
    baseDefense: 70,
    baseHp: 820,
    armyBonusBranch: 'siege',
    armyBonusPct: 18,
    skillName: 'Meteor Cataclysm',
    skillDescription: 'Summons flaming meteors from the sky, incinerating enemy ranks with arcane fire.',
    skillMultiplier: 2.35,
    recruitCostGold: 3500,
    recruitCostGems: 50,
  },
  {
    key: 'kaelen',
    name: 'Kaelen',
    title: 'Stormrider General',
    heroClass: 'Warrior',
    rarity: 'Epic',
    avatar: '⚡',
    color: '#3b82f6',
    baseAttack: 155,
    baseDefense: 110,
    baseHp: 1050,
    armyBonusBranch: 'cavalry',
    armyBonusPct: 20,
    skillName: 'Thunderous Charge',
    skillDescription: 'Leads a lightning cavalry stampede that shatters archer lines and boosts march speed.',
    skillMultiplier: 2.2,
    recruitCostGold: 4200,
    recruitCostGems: 75,
  },
  {
    key: 'isolde',
    name: 'Valkyrie Isolde',
    title: 'Aegis of Dawn',
    heroClass: 'Paladin',
    rarity: 'Legendary',
    avatar: '🛡️',
    color: '#eab308',
    baseAttack: 170,
    baseDefense: 160,
    baseHp: 1450,
    armyBonusBranch: 'infantry',
    armyBonusPct: 25,
    skillName: 'Sanctuary of Light',
    skillDescription: 'Calls down divine radiance, striking foes while shielding allied troops from heavy casualties.',
    skillMultiplier: 2.4,
    recruitCostGold: 9000,
    recruitCostGems: 180,
  },
  {
    key: 'malakor',
    name: 'Dreadknight Malakor',
    title: 'Scourge of OUAGX',
    heroClass: 'Warrior',
    rarity: 'Legendary',
    avatar: '💀',
    color: '#a855f7',
    baseAttack: 215,
    baseDefense: 135,
    baseHp: 1380,
    armyBonusBranch: 'cavalry',
    armyBonusPct: 28,
    skillName: 'Soulreaver Nova',
    skillDescription: 'Devours battlefield morale with dark runes, inflicting devastating critical damage.',
    skillMultiplier: 2.65,
    recruitCostGold: 12000,
    recruitCostGems: 250,
  },
  {
    key: 'seraphina',
    name: 'Empress Seraphina',
    title: 'Dragonborn Sovereign',
    heroClass: 'Mage',
    rarity: 'Mythic',
    avatar: '🐉',
    color: '#ec4899',
    baseAttack: 270,
    baseDefense: 170,
    baseHp: 1750,
    armyBonusBranch: 'siege',
    armyBonusPct: 35,
    skillName: 'Draconic Annihilation',
    skillDescription: 'Awakens the Ancient Crimson Wyrm to sweep the entire battlefield in apocalyptic flames.',
    skillMultiplier: 3.1,
    recruitCostGold: 25000,
    recruitCostGems: 500,
  },
];

export const HERO_TEMPLATE_MAP: Record<string, HeroTemplate> = Object.fromEntries(
  HERO_TEMPLATES.map((h) => [h.key, h])
);

export function getHeroXpForNextLevel(level: number): number {
  return Math.round(120 * Math.pow(1.24, level - 1));
}

export function getHeroComputedStats(
  template: HeroTemplate,
  level: number,
  skillLevel: number,
  gearBonus: { attack: number; defense: number; hp: number } = { attack: 0, defense: 0, hp: 0 }
) {
  const lvlMult = 1 + (level - 1) * 0.12;
  const attack = Math.round(template.baseAttack * lvlMult + gearBonus.attack);
  const defense = Math.round(template.baseDefense * lvlMult + gearBonus.defense);
  const hp = Math.round(template.baseHp * lvlMult + gearBonus.hp);
  const skillPower = +(template.skillMultiplier + (skillLevel - 1) * 0.18).toFixed(2);
  const power = Math.round(attack * 4 + defense * 3 + hp * 0.6 + skillLevel * 120);
  return { attack, defense, hp, skillPower, power };
}

// ---------------------------------------------------------------------------
// FORGE GEAR RECIPES
// ---------------------------------------------------------------------------
export type GearSlot = 'weapon' | 'armor' | 'ring' | 'relic';

export interface GearRecipe {
  key: string;
  name: string;
  slot: GearSlot;
  rarity: Rarity;
  forgeLevelReq: number;
  attackBonus: number;
  defenseBonus: number;
  hpBonus: number;
  cost: ResourceCost;
  icon: string;
}

export const GEAR_RECIPES: GearRecipe[] = [
  {
    key: 'iron_broadsword',
    name: 'Forged Broadsword',
    slot: 'weapon',
    rarity: 'Common',
    forgeLevelReq: 1,
    attackBonus: 28,
    defenseBonus: 5,
    hpBonus: 60,
    cost: { food: 100, wood: 150, iron: 250, gold: 120 },
    icon: '🗡️',
  },
  {
    key: 'steel_plate',
    name: 'Knight Steel Plate',
    slot: 'armor',
    rarity: 'Common',
    forgeLevelReq: 1,
    attackBonus: 5,
    defenseBonus: 32,
    hpBonus: 180,
    cost: { food: 120, wood: 120, iron: 280, gold: 120 },
    icon: '🦺',
  },
  {
    key: 'ruby_signet',
    name: 'Crimson Signet Ring',
    slot: 'ring',
    rarity: 'Rare',
    forgeLevelReq: 2,
    attackBonus: 48,
    defenseBonus: 20,
    hpBonus: 160,
    cost: { food: 180, wood: 220, iron: 450, gold: 320 },
    icon: '💍',
  },
  {
    key: 'sunfire_halberd',
    name: 'Sunfire Warblade',
    slot: 'weapon',
    rarity: 'Epic',
    forgeLevelReq: 4,
    attackBonus: 110,
    defenseBonus: 30,
    hpBonus: 260,
    cost: { food: 400, wood: 500, iron: 1100, gold: 750 },
    icon: '🔥',
  },
  {
    key: 'dragonscale_aegis',
    name: 'Dragonscale Cuirass',
    slot: 'armor',
    rarity: 'Epic',
    forgeLevelReq: 5,
    attackBonus: 25,
    defenseBonus: 115,
    hpBonus: 620,
    cost: { food: 450, wood: 500, iron: 1250, gold: 800 },
    icon: '🛡️',
  },
  {
    key: 'crown_of_ouagx',
    name: 'Crown Relic of OUAGX',
    slot: 'relic',
    rarity: 'Legendary',
    forgeLevelReq: 7,
    attackBonus: 175,
    defenseBonus: 140,
    hpBonus: 950,
    cost: { food: 1000, wood: 1200, iron: 2600, gold: 2200 },
    icon: '👑',
  },
  {
    key: 'obsidian_reaver',
    name: 'Obsidian Worldreaver',
    slot: 'weapon',
    rarity: 'Mythic',
    forgeLevelReq: 10,
    attackBonus: 320,
    defenseBonus: 90,
    hpBonus: 780,
    cost: { food: 2200, wood: 2500, iron: 5500, gold: 4800 },
    icon: '⚔️',
  },
];

// ---------------------------------------------------------------------------
// ACADEMY TECH TREE
// ---------------------------------------------------------------------------
export type TechBranch = 'economy' | 'military' | 'defense';

export interface TechDefinition {
  key: string;
  name: string;
  branch: TechBranch;
  description: string;
  maxLevel: number;
  academyReq: number;
  effectPerLevelPct: number;
  baseCost: ResourceCost;
  baseTimeSec: number;
  icon: string;
}

export const TECHNOLOGIES: TechDefinition[] = [
  {
    key: 'crop_rotation',
    name: 'Royal Agriculture',
    branch: 'economy',
    description: '+12% Food & Wood production per level.',
    maxLevel: 10,
    academyReq: 1,
    effectPerLevelPct: 12,
    baseCost: { food: 180, wood: 180, iron: 100, gold: 80 },
    baseTimeSec: 12,
    icon: '🌱',
  },
  {
    key: 'deep_mining',
    name: 'Deep Metallurgy',
    branch: 'economy',
    description: '+12% Iron & Gold production per level.',
    maxLevel: 10,
    academyReq: 2,
    effectPerLevelPct: 12,
    baseCost: { food: 200, wood: 220, iron: 180, gold: 120 },
    baseTimeSec: 15,
    icon: '⛏️',
  },
  {
    key: 'masonry',
    name: 'Imperial Masonry',
    branch: 'economy',
    description: '+10% Building Construction speed per level.',
    maxLevel: 10,
    academyReq: 1,
    effectPerLevelPct: 10,
    baseCost: { food: 160, wood: 240, iron: 150, gold: 100 },
    baseTimeSec: 14,
    icon: '🧱',
  },
  {
    key: 'steel_forging',
    name: 'Tempered Weapons',
    branch: 'military',
    description: '+8% Attack for all troops in Campaign & World battles.',
    maxLevel: 10,
    academyReq: 1,
    effectPerLevelPct: 8,
    baseCost: { food: 220, wood: 200, iron: 260, gold: 160 },
    baseTimeSec: 16,
    icon: '⚔️',
  },
  {
    key: 'war_formations',
    name: 'Tactical Formations',
    branch: 'military',
    description: '+8% HP & Defense for all marching armies.',
    maxLevel: 10,
    academyReq: 2,
    effectPerLevelPct: 8,
    baseCost: { food: 240, wood: 220, iron: 240, gold: 180 },
    baseTimeSec: 18,
    icon: '🚩',
  },
  {
    key: 'forced_march',
    name: 'Forced March',
    branch: 'military',
    description: '+10% World Map march speed per level.',
    maxLevel: 10,
    academyReq: 3,
    effectPerLevelPct: 10,
    baseCost: { food: 260, wood: 180, iron: 180, gold: 200 },
    baseTimeSec: 15,
    icon: '🐎',
  },
  {
    key: 'fortifications',
    name: 'Castle Ramparts',
    branch: 'defense',
    description: '+12% City Defense when defending against PvP sieges.',
    maxLevel: 10,
    academyReq: 1,
    effectPerLevelPct: 12,
    baseCost: { food: 180, wood: 260, iron: 260, gold: 140 },
    baseTimeSec: 15,
    icon: '🏰',
  },
  {
    key: 'field_medicine',
    name: 'Battlefield Triage',
    branch: 'defense',
    description: '+6% Wounded recovery rate (more troops saved to Hospital).',
    maxLevel: 10,
    academyReq: 2,
    effectPerLevelPct: 6,
    baseCost: { food: 250, wood: 200, iron: 180, gold: 180 },
    baseTimeSec: 16,
    icon: '⚕️',
  },
];

export const TECH_MAP: Record<string, TechDefinition> = Object.fromEntries(TECHNOLOGIES.map((t) => [t.key, t]));

export function getTechUpgradeCost(key: string, currentLevel: number): ResourceCost {
  const def = TECH_MAP[key];
  const scale = Math.pow(1.5, currentLevel);
  return {
    food: Math.round(def.baseCost.food * scale),
    wood: Math.round(def.baseCost.wood * scale),
    iron: Math.round(def.baseCost.iron * scale),
    gold: Math.round(def.baseCost.gold * scale),
  };
}

// ---------------------------------------------------------------------------
// MULTI-LEVEL PvE CAMPAIGN (4 Chapters × 5 Stages = 20 Levels + Bosses)
// ---------------------------------------------------------------------------
export interface CampaignStage {
  id: number;
  chapter: number;
  chapterName: string;
  stageNum: number;
  name: string;
  isBoss: boolean;
  enemyName: string;
  enemyAvatar: string;
  recommendedPower: number;
  enemyArmy: { troopId: string; count: number }[];
  enemyHeroPower: number;
  rewards: {
    food: number;
    wood: number;
    iron: number;
    gold: number;
    gems: number;
    heroXp: number;
    gearDropKey?: string;
  };
}

export const CAMPAIGN_STAGES: CampaignStage[] = [
  // Chapter 1: Whispering Woods
  {
    id: 1, chapter: 1, chapterName: 'I. Whispering Woods', stageNum: 1,
    name: 'Bandit Outpost', isBoss: false, enemyName: 'Timberland Raiders', enemyAvatar: '🗡️',
    recommendedPower: 250,
    enemyArmy: [{ troopId: 'infantry_t1', count: 18 }, { troopId: 'archer_t1', count: 8 }],
    enemyHeroPower: 180,
    rewards: { food: 350, wood: 350, iron: 200, gold: 150, gems: 15, heroXp: 110 },
  },
  {
    id: 2, chapter: 1, chapterName: 'I. Whispering Woods', stageNum: 2,
    name: 'Wolfpack Ambush', isBoss: false, enemyName: 'Direwolf Tamers', enemyAvatar: '🐺',
    recommendedPower: 420,
    enemyArmy: [{ troopId: 'cavalry_t1', count: 22 }, { troopId: 'infantry_t1', count: 16 }],
    enemyHeroPower: 260,
    rewards: { food: 500, wood: 450, iron: 300, gold: 220, gems: 15, heroXp: 150 },
  },
  {
    id: 3, chapter: 1, chapterName: 'I. Whispering Woods', stageNum: 3,
    name: 'Bridge of Thorns', isBoss: false, enemyName: 'Briar Crossbowmen', enemyAvatar: '🏹',
    recommendedPower: 650,
    enemyArmy: [{ troopId: 'archer_t1', count: 32 }, { troopId: 'infantry_t2', count: 14 }],
    enemyHeroPower: 350,
    rewards: { food: 700, wood: 650, iron: 420, gold: 300, gems: 20, heroXp: 210 },
  },
  {
    id: 4, chapter: 1, chapterName: 'I. Whispering Woods', stageNum: 4,
    name: 'Sunken Watchtower', isBoss: false, enemyName: 'Rogue Garrison', enemyAvatar: '🗼',
    recommendedPower: 950,
    enemyArmy: [{ troopId: 'infantry_t2', count: 28 }, { troopId: 'cavalry_t2', count: 18 }, { troopId: 'siege_t1', count: 6 }],
    enemyHeroPower: 480,
    rewards: { food: 950, wood: 900, iron: 650, gold: 450, gems: 25, heroXp: 280 },
  },
  {
    id: 5, chapter: 1, chapterName: 'I. Whispering Woods', stageNum: 5,
    name: 'BOSS: Goblin Warlord Grak', isBoss: true, enemyName: 'Warlord Grak', enemyAvatar: '👹',
    recommendedPower: 1450,
    enemyArmy: [{ troopId: 'infantry_t2', count: 45 }, { troopId: 'archer_t2', count: 30 }, { troopId: 'siege_t2', count: 10 }],
    enemyHeroPower: 750,
    rewards: { food: 1600, wood: 1600, iron: 1200, gold: 900, gems: 60, heroXp: 520, gearDropKey: 'iron_broadsword' },
  },

  // Chapter 2: Ironfang Foothills
  {
    id: 6, chapter: 2, chapterName: 'II. Ironfang Foothills', stageNum: 1,
    name: 'Quarry Blockade', isBoss: false, enemyName: 'Ironfang Pikemen', enemyAvatar: '⛏️',
    recommendedPower: 2200,
    enemyArmy: [{ troopId: 'infantry_t3', count: 40 }, { troopId: 'archer_t2', count: 35 }],
    enemyHeroPower: 1050,
    rewards: { food: 2100, wood: 1900, iron: 1800, gold: 1100, gems: 30, heroXp: 680 },
  },
  {
    id: 7, chapter: 2, chapterName: 'II. Ironfang Foothills', stageNum: 2,
    name: 'Canyon Cavalry', isBoss: false, enemyName: 'Redmane Lancers', enemyAvatar: '🐎',
    recommendedPower: 3100,
    enemyArmy: [{ troopId: 'cavalry_t3', count: 55 }, { troopId: 'archer_t3', count: 30 }],
    enemyHeroPower: 1400,
    rewards: { food: 2800, wood: 2500, iron: 2200, gold: 1450, gems: 35, heroXp: 860 },
  },
  {
    id: 8, chapter: 2, chapterName: 'II. Ironfang Foothills', stageNum: 3,
    name: 'Blacksmith Bastion', isBoss: false, enemyName: 'Molten Guard', enemyAvatar: '⚒️',
    recommendedPower: 4300,
    enemyArmy: [{ troopId: 'infantry_t3', count: 65 }, { troopId: 'siege_t3', count: 22 }],
    enemyHeroPower: 1800,
    rewards: { food: 3500, wood: 3200, iron: 3000, gold: 1800, gems: 40, heroXp: 1050 },
  },
  {
    id: 9, chapter: 2, chapterName: 'II. Ironfang Foothills', stageNum: 4,
    name: 'Frostgate Pass', isBoss: false, enemyName: 'Glacier Sentinels', enemyAvatar: '❄️',
    recommendedPower: 5900,
    enemyArmy: [{ troopId: 'infantry_t4', count: 50 }, { troopId: 'archer_t4', count: 45 }, { troopId: 'cavalry_t3', count: 35 }],
    enemyHeroPower: 2400,
    rewards: { food: 4600, wood: 4200, iron: 3800, gold: 2400, gems: 45, heroXp: 1350 },
  },
  {
    id: 10, chapter: 2, chapterName: 'II. Ironfang Foothills', stageNum: 5,
    name: 'BOSS: Frost Giant King Ymir', isBoss: true, enemyName: 'Giant King Ymir', enemyAvatar: '🧊',
    recommendedPower: 8200,
    enemyArmy: [{ troopId: 'infantry_t4', count: 85 }, { troopId: 'cavalry_t4', count: 55 }, { troopId: 'siege_t4', count: 25 }],
    enemyHeroPower: 3600,
    rewards: { food: 7500, wood: 7000, iron: 6500, gold: 4200, gems: 100, heroXp: 2100, gearDropKey: 'ruby_signet' },
  },

  // Chapter 3: Cinderpeak Citadel
  {
    id: 11, chapter: 3, chapterName: 'III. Cinderpeak Citadel', stageNum: 1,
    name: 'Ashen Barricades', isBoss: false, enemyName: 'Cinder Legion', enemyAvatar: '🔥',
    recommendedPower: 12000,
    enemyArmy: [{ troopId: 'infantry_t5', count: 80 }, { troopId: 'archer_t5', count: 60 }],
    enemyHeroPower: 4800,
    rewards: { food: 9500, wood: 9000, iron: 8000, gold: 5500, gems: 50, heroXp: 2800 },
  },
  {
    id: 12, chapter: 3, chapterName: 'III. Cinderpeak Citadel', stageNum: 2,
    name: 'Brimstone Artillery', isBoss: false, enemyName: 'Hellfire Engineers', enemyAvatar: '💣',
    recommendedPower: 16500,
    enemyArmy: [{ troopId: 'siege_t5', count: 55 }, { troopId: 'infantry_t5', count: 95 }],
    enemyHeroPower: 6200,
    rewards: { food: 12000, wood: 11500, iron: 10500, gold: 7000, gems: 55, heroXp: 3500 },
  },
  {
    id: 13, chapter: 3, chapterName: 'III. Cinderpeak Citadel', stageNum: 3,
    name: 'Wyvern Roost', isBoss: false, enemyName: 'Drake Lancers', enemyAvatar: '🐲',
    recommendedPower: 22500,
    enemyArmy: [{ troopId: 'cavalry_t6', count: 95 }, { troopId: 'archer_t6', count: 75 }],
    enemyHeroPower: 8000,
    rewards: { food: 16000, wood: 15000, iron: 14000, gold: 9200, gems: 65, heroXp: 4400 },
  },
  {
    id: 14, chapter: 3, chapterName: 'III. Cinderpeak Citadel', stageNum: 4,
    name: 'Gates of Magma', isBoss: false, enemyName: 'Obsidian Wardens', enemyAvatar: '🌋',
    recommendedPower: 31000,
    enemyArmy: [{ troopId: 'infantry_t6', count: 130 }, { troopId: 'cavalry_t6', count: 90 }, { troopId: 'siege_t6', count: 40 }],
    enemyHeroPower: 10500,
    rewards: { food: 21000, wood: 20000, iron: 18500, gold: 12500, gems: 75, heroXp: 5600 },
  },
  {
    id: 15, chapter: 3, chapterName: 'III. Cinderpeak Citadel', stageNum: 5,
    name: 'BOSS: Shadow Wyvern Ignis', isBoss: true, enemyName: 'Wyvern Lord Ignis', enemyAvatar: '🐉',
    recommendedPower: 44000,
    enemyArmy: [{ troopId: 'infantry_t7', count: 140 }, { troopId: 'archer_t7', count: 110 }, { troopId: 'siege_t7', count: 55 }],
    enemyHeroPower: 15000,
    rewards: { food: 35000, wood: 32000, iron: 30000, gold: 22000, gems: 180, heroXp: 8500, gearDropKey: 'sunfire_halberd' },
  },

  // Chapter 4: Abyss of the Obsidian King
  {
    id: 16, chapter: 4, chapterName: 'IV. Obsidian Abyss', stageNum: 1,
    name: 'Blighted Causeway', isBoss: false, enemyName: 'Dread Vanguard', enemyAvatar: '💀',
    recommendedPower: 62000,
    enemyArmy: [{ troopId: 'infantry_t8', count: 150 }, { troopId: 'cavalry_t8', count: 110 }],
    enemyHeroPower: 20000,
    rewards: { food: 45000, wood: 42000, iron: 40000, gold: 28000, gems: 90, heroXp: 11000 },
  },
  {
    id: 17, chapter: 4, chapterName: 'IV. Obsidian Abyss', stageNum: 2,
    name: 'Eclipse Spire', isBoss: false, enemyName: 'Void Marksmen', enemyAvatar: '🌑',
    recommendedPower: 86000,
    enemyArmy: [{ troopId: 'archer_t8', count: 190 }, { troopId: 'infantry_t8', count: 150 }],
    enemyHeroPower: 27000,
    rewards: { food: 60000, wood: 56000, iron: 52000, gold: 38000, gems: 110, heroXp: 14500 },
  },
  {
    id: 18, chapter: 4, chapterName: 'IV. Obsidian Abyss', stageNum: 3,
    name: 'Hall of Fallen Kings', isBoss: false, enemyName: 'Immortal Paladins', enemyAvatar: '👑',
    recommendedPower: 120000,
    enemyArmy: [{ troopId: 'cavalry_t9', count: 175 }, { troopId: 'infantry_t9', count: 175 }, { troopId: 'siege_t8', count: 80 }],
    enemyHeroPower: 38000,
    rewards: { food: 85000, wood: 80000, iron: 75000, gold: 52000, gems: 140, heroXp: 19500 },
  },
  {
    id: 19, chapter: 4, chapterName: 'IV. Obsidian Abyss', stageNum: 4,
    name: 'Sanctum of Eternal Night', isBoss: false, enemyName: 'Abyssal Legion', enemyAvatar: '⚔️',
    recommendedPower: 168000,
    enemyArmy: [{ troopId: 'infantry_t9', count: 240 }, { troopId: 'archer_t9', count: 200 }, { troopId: 'siege_t9', count: 100 }],
    enemyHeroPower: 52000,
    rewards: { food: 120000, wood: 115000, iron: 105000, gold: 75000, gems: 180, heroXp: 26000 },
  },
  {
    id: 20, chapter: 4, chapterName: 'IV. Obsidian Abyss', stageNum: 5,
    name: 'FINAL BOSS: Obsidian Emperor', isBoss: true, enemyName: 'Obsidian Emperor Malrik', enemyAvatar: '👁️',
    recommendedPower: 240000,
    enemyArmy: [
      { troopId: 'infantry_t10', count: 260 },
      { troopId: 'cavalry_t10', count: 210 },
      { troopId: 'archer_t10', count: 210 },
      { troopId: 'siege_t10', count: 120 },
    ],
    enemyHeroPower: 80000,
    rewards: { food: 250000, wood: 250000, iron: 250000, gold: 180000, gems: 500, heroXp: 50000, gearDropKey: 'crown_of_ouagx' },
  },
];

// ---------------------------------------------------------------------------
// ROYAL QUESTS (Guided Progression)
// ---------------------------------------------------------------------------
export interface QuestDefinition {
  key: string;
  title: string;
  description: string;
  reward: ResourceCost & { gems: number };
  checkType: 'castle_level' | 'total_troops' | 'campaign_cleared' | 'tech_levels' | 'hero_count' | 'gear_count' | 'alliance_joined' | 'monsters_slain';
  target: number;
}

export const QUESTS: QuestDefinition[] = [
  {
    key: 'q_castle_2',
    title: 'Rise of a Kingdom',
    description: 'Upgrade your Citadel Keep to Level 2.',
    reward: { food: 800, wood: 800, iron: 500, gold: 400, gems: 50 },
    checkType: 'castle_level',
    target: 2,
  },
  {
    key: 'q_troops_50',
    title: 'Muster the Bannermen',
    description: 'Command at least 50 total troops in your army.',
    reward: { food: 1000, wood: 900, iron: 600, gold: 450, gems: 40 },
    checkType: 'total_troops',
    target: 50,
  },
  {
    key: 'q_campaign_1',
    title: 'First Blood',
    description: 'Clear Stage 1-1 (Bandit Outpost) in the PvE Campaign.',
    reward: { food: 1200, wood: 1200, iron: 800, gold: 600, gems: 60 },
    checkType: 'campaign_cleared',
    target: 1,
  },
  {
    key: 'q_tech_1',
    title: 'Scholars of OUAGX',
    description: 'Research any 1 Technology level in the Royal Academy.',
    reward: { food: 1100, wood: 1100, iron: 900, gold: 700, gems: 50 },
    checkType: 'tech_levels',
    target: 1,
  },
  {
    key: 'q_hero_2',
    title: 'Champions Assemble',
    description: 'Recruit a 2nd Hero to lead your armies.',
    reward: { food: 1800, wood: 1800, iron: 1400, gold: 1200, gems: 80 },
    checkType: 'hero_count',
    target: 2,
  },
  {
    key: 'q_forge_1',
    title: 'Steel & Fire',
    description: 'Craft or obtain your first piece of Hero Gear.',
    reward: { food: 1500, wood: 1500, iron: 1500, gold: 1000, gems: 70 },
    checkType: 'gear_count',
    target: 1,
  },
  {
    key: 'q_alliance',
    title: 'United Under One Banner',
    description: 'Create or join an Alliance.',
    reward: { food: 2000, wood: 2000, iron: 1500, gold: 1500, gems: 120 },
    checkType: 'alliance_joined',
    target: 1,
  },
  {
    key: 'q_monster_1',
    title: 'Realm Hunter',
    description: 'Slay a roaming Monster on the World Map.',
    reward: { food: 2500, wood: 2500, iron: 2000, gold: 1600, gems: 100 },
    checkType: 'monsters_slain',
    target: 1,
  },
  {
    key: 'q_castle_5',
    title: 'Fortress Sovereign',
    description: 'Upgrade your Citadel Keep to Level 5.',
    reward: { food: 5000, wood: 5000, iron: 4000, gold: 3500, gems: 200 },
    checkType: 'castle_level',
    target: 5,
  },
  {
    key: 'q_campaign_5',
    title: 'Conqueror of Whispering Woods',
    description: 'Defeat Boss Stage 1-5 (Goblin Warlord Grak).',
    reward: { food: 6000, wood: 6000, iron: 5000, gold: 4500, gems: 250 },
    checkType: 'campaign_cleared',
    target: 5,
  },
];

export const WORLD_SIZE = 40;
export const THRONE_X = 20;
export const THRONE_Y = 20;
