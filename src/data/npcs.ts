import { ItemId, NeighborFarm, NpcDefinition, NpcId, Quest, RemoteFarmer } from '../types/game';

export const NPCS: Record<NpcId, NpcDefinition> = {
  maya: {
    id: 'maya',
    name: 'Maya',
    role: 'Seed & Market Merchant',
    x: 22.5,
    y: 7.2,
    shirtColor: '#16a34a',
    hairColor: '#7c2d12',
    hatColor: '#fde047',
    favoriteItem: 'golden_melon',
    opensShop: true,
    greetingSunny: [
      'Welcome to GreenSAGA Market! Fresh seeds, sprinklers, and house upgrades await!',
      'Sunny skies mean happy roots. Check out the Artisan Mill on your farm for big profits!',
      'Your farm is flourishing! Don’t forget to visit the Multiplayer Plaza just east of the village.',
    ],
    greetingRainy: [
      'Oh, I love rainy mornings—Mother Nature waters every crop for free!',
      'Stay dry under my awning! Great day to stock up on Fertilizer and Animal Feed.',
    ],
  },
  barnaby: {
    id: 'barnaby',
    name: 'Barnaby',
    role: 'Master Blacksmith & Elder',
    x: 26.2,
    y: 12.2,
    shirtColor: '#b45309',
    hairColor: '#94a3b8',
    favoriteItem: 'pumpkin',
    greetingSunny: [
      'Ha! Nothing beats the smell of freshly tilled earth in GreenSAGA Valley.',
      'Tip from an old hand: Copper tools hit 3×1 tiles, and Gold tools sweep 3×3!',
      'Install Automated Sprinklers as soon as you hit Level 2—they save loads of stamina!',
    ],
    greetingRainy: [
      'Rain keeps the forge steamy and your soil soaked! Save your stamina today.',
      'Good weather to mill Flour and press Aged Cheese in your Artisan Windmill.',
    ],
  },
  lina: {
    id: 'lina',
    name: 'Lina',
    role: 'Village Baker',
    x: 20.5,
    y: 14.2,
    shirtColor: '#ec4899',
    hairColor: '#451a03',
    hatColor: '#ffffff',
    favoriteItem: 'berry_jam',
    greetingSunny: [
      'Mmm, the oven is warm! Do you have fresh wheat, berries, or Artisan Flour?',
      'Everyone in Cloverbrook adores pies made with GreenSAGA orchard apples & peaches!',
      'Check my daily requests—I always pay extra gold and XP for fresh ingredients.',
    ],
    greetingRainy: [
      'Rainy days call for warm turnip soup, aged cheese, and ruby jam tarts!',
      'Pop in anytime—my quests refresh whenever you complete them or start a new day.',
    ],
  },
};

export const NPC_LIST: NpcDefinition[] = [NPCS.maya, NPCS.barnaby, NPCS.lina];

interface QuestTemplate {
  npcId: NpcId;
  title: string;
  description: string;
  itemId: ItemId;
  requiredQty: number;
  rewardGold: number;
  rewardXp: number;
  rewardFriendship: number;
  minLevel: number;
}

const QUEST_POOL: QuestTemplate[] = [
  {
    npcId: 'lina',
    title: 'Warm Turnip Soup',
    description: 'Deliver crisp Turnips for the lunchtime village stew.',
    itemId: 'turnip',
    requiredQty: 3,
    rewardGold: 175,
    rewardXp: 55,
    rewardFriendship: 14,
    minLevel: 1,
  },
  {
    npcId: 'lina',
    title: 'Artisan Baker Order',
    description: 'Mill Golden Wheat at your Windmill and bring Artisan Flour!',
    itemId: 'flour',
    requiredQty: 1,
    rewardGold: 290,
    rewardXp: 85,
    rewardFriendship: 16,
    minLevel: 1,
  },
  {
    npcId: 'barnaby',
    title: 'Hearty Breakfast',
    description: 'Barnaby craves Farm Fresh Eggs to keep his hammer swinging.',
    itemId: 'egg',
    requiredQty: 2,
    rewardGold: 165,
    rewardXp: 60,
    rewardFriendship: 15,
    minLevel: 1,
  },
  {
    npcId: 'maya',
    title: 'Orchard Basket',
    description: 'Pick Crisp Apples from your orchard trees for Maya’s display.',
    itemId: 'apple',
    requiredQty: 3,
    rewardGold: 195,
    rewardXp: 65,
    rewardFriendship: 14,
    minLevel: 1,
  },
  {
    npcId: 'lina',
    title: 'Ruby Berry Tarts',
    description: 'Deliver sweet Ruby Strawberries for Lina’s signature tarts.',
    itemId: 'strawberry',
    requiredQty: 3,
    rewardGold: 540,
    rewardXp: 120,
    rewardFriendship: 18,
    minLevel: 2,
  },
  {
    npcId: 'barnaby',
    title: 'Sweet Carrot Stew',
    description: 'Bring crunchy Sweet Carrots for tonight’s village feast.',
    itemId: 'carrot',
    requiredQty: 3,
    rewardGold: 390,
    rewardXp: 95,
    rewardFriendship: 16,
    minLevel: 2,
  },
  {
    npcId: 'maya',
    title: 'Cozy Wool Scarves',
    description: 'Bring Fluffy Wool from your pasture sheep for winter looms.',
    itemId: 'wool',
    requiredQty: 2,
    rewardGold: 420,
    rewardXp: 125,
    rewardFriendship: 18,
    minLevel: 3,
  },
  {
    npcId: 'barnaby',
    title: 'Festival Lanterns',
    description: 'Barnaby needs plump Harvest Pumpkins for the village square.',
    itemId: 'pumpkin',
    requiredQty: 2,
    rewardGold: 680,
    rewardXp: 165,
    rewardFriendship: 20,
    minLevel: 4,
  },
  {
    npcId: 'lina',
    title: 'Celestial Tart',
    description: 'Bring luminous Starfruit Berries for a royal banquet dessert!',
    itemId: 'starfruit',
    requiredQty: 2,
    rewardGold: 1050,
    rewardXp: 230,
    rewardFriendship: 22,
    minLevel: 6,
  },
  {
    npcId: 'maya',
    title: 'Royal Melon Order',
    description: 'A noble merchant asked Maya for a legendary Golden Melon!',
    itemId: 'golden_melon',
    requiredQty: 1,
    rewardGold: 950,
    rewardXp: 280,
    rewardFriendship: 25,
    minLevel: 8,
  },
];

export function generateDailyQuests(day: number, playerLevel: number): Quest[] {
  const eligible = QUEST_POOL.filter((q) => q.minLevel <= playerLevel);
  const shuffled = [...eligible].sort((a, b) => {
    const ha = (a.title.length * 31 + day * 17) % 97;
    const hb = (b.title.length * 31 + day * 17) % 97;
    return ha - hb;
  });

  const chosen: Quest[] = [];
  const usedItems = new Set<string>();
  for (const tpl of shuffled) {
    if (chosen.length >= 3) break;
    if (usedItems.has(tpl.itemId) && eligible.length > 3) continue;
    usedItems.add(tpl.itemId);
    chosen.push({
      id: `q_d${day}_${chosen.length}_${tpl.itemId}`,
      npcId: tpl.npcId,
      title: tpl.title,
      description: tpl.description,
      itemId: tpl.itemId,
      requiredQty: tpl.requiredQty,
      rewardGold: tpl.rewardGold,
      rewardXp: tpl.rewardXp,
      rewardFriendship: tpl.rewardFriendship,
      claimed: false,
    });
  }
  return chosen;
}

export function createInitialNeighbors(): NeighborFarm[] {
  return [
    {
      id: 'nbr_amine',
      ownerName: 'Amine',
      farmName: "Amine's Oasis Terrace",
      regionLabel: 'Southwest Oasis',
      level: 5,
      specialtyCrop: 'corn',
      accentColor: '#f59e0b',
      mapX: 13,
      mapY: 67,
      wateredToday: false,
      harvestedToday: false,
      online: true,
    },
    {
      id: 'nbr_claire',
      ownerName: 'Claire',
      farmName: "Claire's Lavender Meadow",
      regionLabel: 'Northeast Hills',
      level: 7,
      specialtyCrop: 'strawberry',
      accentColor: '#ec4899',
      mapX: 82,
      mapY: 18,
      wateredToday: false,
      harvestedToday: false,
      online: true,
    },
    {
      id: 'nbr_yasmine',
      ownerName: 'Yasmine',
      farmName: "Yasmine's Star Orchard",
      regionLabel: 'South Lakefront',
      level: 6,
      specialtyCrop: 'starfruit',
      accentColor: '#0ea5e9',
      mapX: 39,
      mapY: 79,
      wateredToday: false,
      harvestedToday: false,
      online: true,
    },
    {
      id: 'nbr_leo',
      ownerName: 'Leo',
      farmName: "Leo's Golden Valley",
      regionLabel: 'Southeast Highlands',
      level: 9,
      specialtyCrop: 'golden_melon',
      accentColor: '#eab308',
      mapX: 79,
      mapY: 69,
      wateredToday: false,
      harvestedToday: false,
      online: true,
    },
  ];
}

export const AI_WAYPOINTS: Array<{ x: number; y: number; activity: string; emote: string }> = [
  { x: 14.5, y: 5.1, activity: 'Visiting Your Farm', emote: '🌾' },
  { x: 16.5, y: 9.2, activity: 'Crossing North Bridge', emote: '🌊' },
  { x: 22.4, y: 7.9, activity: 'Trading at Market', emote: '💰' },
  { x: 21.0, y: 13.4, activity: 'Visiting Bakery', emote: '🍓' },
  { x: 24.4, y: 12.2, activity: 'Upgrading Tools', emote: '⚒️' },
  { x: 35.0, y: 9.5, activity: 'Grand Plaza Hangout', emote: '👋' },
  { x: 40.5, y: 11.4, activity: 'Plaza Fountain', emote: '✨' },
  { x: 38.0, y: 14.2, activity: 'Harvest Showcase', emote: '🎃' },
  { x: 29.0, y: 20.6, activity: 'Emerald Lake Pier', emote: '🐟' },
  { x: 8.6, y: 28.8, activity: "Amine's Oasis Farm", emote: '🌽' },
  { x: 56.8, y: 7.5, activity: "Claire's Meadow Farm", emote: '🍓' },
  { x: 25.8, y: 34.4, activity: "Yasmine's Star Orchard", emote: '⭐' },
  { x: 55.0, y: 29.4, activity: "Leo's Golden Estate", emote: '🍈' },
  { x: 16.5, y: 29.2, activity: 'Crossing South Bridge', emote: '🌉' },
];

export const AI_CHAT_LINES: string[] = [
  'Just harvested a full patch of Ruby Strawberries! 🍓',
  'Anyone trading Golden Wheat at Maya’s Market? 🌾',
  'Bonjour farmers! Come visit my farm estate on the map! ☀️',
  'Salam! Just upgraded my Watering Can to Copper 3×1! 💧',
  'Hanging out by Emerald Lake Pier — the view is gorgeous! 🌊',
  'Waving from the Grand Multiplayer Plaza Fountain! 👋✨',
  'Tip: Click "Visit Farm" on any player to tour & water their crops! 🌱',
  'Just reached a new Farmer Level! GreenSAGA Valley is huge now ⭐',
];

export function createInitialBotFarmers(): RemoteFarmer[] {
  return [
    {
      id: 'bot_amine',
      name: 'Amine',
      level: 5,
      gold: 1420,
      activity: "Amine's Oasis Farm",
      aiTimer: 5,
      room: 'VALLEY-01',
      x: 9.0,
      y: 28.8,
      targetX: 16.5,
      targetY: 29.2,
      facing: 'right',
      shirtColor: '#0ea5e9',
      hatColor: '#fde047',
      isRealPlayer: false,
      lastSeen: Date.now(),
    },
    {
      id: 'bot_claire',
      name: 'Claire',
      level: 7,
      gold: 2890,
      activity: "Claire's Meadow Farm",
      aiTimer: 6,
      room: 'VALLEY-01',
      x: 56.8,
      y: 7.5,
      targetX: 43.0,
      targetY: 10.5,
      facing: 'left',
      shirtColor: '#a855f7',
      hatColor: '#fbcfe8',
      isRealPlayer: false,
      lastSeen: Date.now(),
    },
    {
      id: 'bot_yasmine',
      name: 'Yasmine',
      level: 6,
      gold: 1960,
      activity: "Yasmine's Star Orchard",
      aiTimer: 7,
      room: 'VALLEY-01',
      x: 26.2,
      y: 34.4,
      targetX: 29.0,
      targetY: 20.6,
      facing: 'up',
      shirtColor: '#10b981',
      hatColor: '#fed7aa',
      isRealPlayer: false,
      lastSeen: Date.now(),
    },
    {
      id: 'bot_leo',
      name: 'Leo',
      level: 9,
      gold: 5400,
      activity: "Leo's Golden Estate",
      aiTimer: 5,
      room: 'VALLEY-01',
      x: 55.0,
      y: 29.4,
      targetX: 40.5,
      targetY: 11.4,
      facing: 'left',
      shirtColor: '#f59e0b',
      hatColor: '#fef08a',
      isRealPlayer: false,
      lastSeen: Date.now(),
    },
    {
      id: 'bot_nadia',
      name: 'Nadia',
      level: 4,
      gold: 980,
      activity: 'Trading at Market',
      aiTimer: 7,
      room: 'VALLEY-01',
      x: 22.8,
      y: 8.4,
      targetX: 35.0,
      targetY: 9.5,
      facing: 'right',
      shirtColor: '#ec4899',
      hatColor: '#ffffff',
      isRealPlayer: false,
      lastSeen: Date.now(),
    },
    {
      id: 'bot_tariq',
      name: 'Tariq',
      level: 8,
      gold: 3750,
      activity: 'Grand Plaza Hangout',
      aiTimer: 8,
      room: 'VALLEY-01',
      x: 36.2,
      y: 12.2,
      targetX: 39.4,
      targetY: 9.2,
      facing: 'right',
      shirtColor: '#dc2626',
      hatColor: '#fde68a',
      isRealPlayer: false,
      lastSeen: Date.now(),
    },
  ];
}
