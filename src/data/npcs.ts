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
      regionLabel: 'North Palm Ridge',
      level: 5,
      specialtyCrop: 'corn',
      accentColor: '#f59e0b',
      mapX: 30,
      mapY: 22,
      wateredToday: false,
      harvestedToday: false,
      online: true,
    },
    {
      id: 'nbr_claire',
      ownerName: 'Claire',
      farmName: "Claire's Lavender Meadow",
      regionLabel: 'West Clover Hills',
      level: 7,
      specialtyCrop: 'strawberry',
      accentColor: '#ec4899',
      mapX: 68,
      mapY: 20,
      wateredToday: false,
      harvestedToday: false,
      online: true,
    },
    {
      id: 'nbr_yasmine',
      ownerName: 'Yasmine',
      farmName: "Yasmine's Star Orchard",
      regionLabel: 'South Riverbend',
      level: 6,
      specialtyCrop: 'starfruit',
      accentColor: '#0ea5e9',
      mapX: 44,
      mapY: 80,
      wateredToday: false,
      harvestedToday: false,
      online: true,
    },
    {
      id: 'nbr_leo',
      ownerName: 'Leo',
      farmName: "Leo's Golden Valley",
      regionLabel: 'East Suncrest',
      level: 9,
      specialtyCrop: 'golden_melon',
      accentColor: '#eab308',
      mapX: 78,
      mapY: 79,
      wateredToday: false,
      harvestedToday: false,
      online: false,
    },
  ];
}

export function createInitialBotFarmers(): RemoteFarmer[] {
  return [
    {
      id: 'bot_amine',
      name: 'Amine',
      level: 5,
      room: 'VALLEY-01',
      x: 30.6,
      y: 9.4,
      targetX: 33.8,
      targetY: 12.6,
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
      room: 'VALLEY-01',
      x: 34.2,
      y: 11.4,
      targetX: 30.5,
      targetY: 13.0,
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
      room: 'VALLEY-01',
      x: 32.0,
      y: 13.8,
      targetX: 34.4,
      targetY: 9.2,
      facing: 'up',
      shirtColor: '#10b981',
      hatColor: '#fed7aa',
      isRealPlayer: false,
      lastSeen: Date.now(),
    },
  ];
}
