import type { BuildingType, GearSlot, Rarity } from '@shared/gameData';

export interface UserProfile {
  id: number;
  username: string;
  realm: string;
  avatar: string;
  castleX: number;
  castleY: number;
  food: number;
  wood: number;
  iron: number;
  gold: number;
  gems: number;
  speedups: number;
  power: number;
  kills: number;
  monstersSlain: number;
  castleLevel: number;
}

export interface BuildingState {
  id: number;
  slot_id: string;
  type: BuildingType;
  level: number;
  upgrading_to: number | null;
  finish_at: number | null;
}

export interface TroopState {
  troop_id: string;
  count: number;
  wounded: number;
  training_count: number;
  training_finish_at: number | null;
}

export interface HeroState {
  id: number;
  hero_key: string;
  level: number;
  xp: number;
  skill_level: number;
  gearBonus: { attack: number; defense: number; hp: number };
}

export interface GearItemState {
  id: number;
  recipe_key: string;
  name: string;
  slot: GearSlot;
  rarity: Rarity;
  attack_bonus: number;
  defense_bonus: number;
  hp_bonus: number;
  icon: string;
  equipped_hero_key: string | null;
}

export interface ResearchState {
  tech_key: string;
  level: number;
  upgrading_to: number | null;
  finish_at: number | null;
}

export interface CampaignProgressState {
  stage_id: number;
  stars: number;
}

export interface MarchState {
  id: number;
  user_id: number;
  username?: string;
  alliance_tag?: string;
  hero_key: string;
  troops: { troopId: string; count: number }[];
  from_x: number;
  from_y: number;
  to_x: number;
  to_y: number;
  action: string;
  status: 'marching' | 'returning';
  depart_at: number;
  arrive_at: number;
  return_at: number;
  loot: Record<string, number> | null;
}

export interface BattleRound {
  round: number;
  attackerDamage: number;
  defenderDamage: number;
  attackerHpPct: number;
  defenderHpPct: number;
  heroSkillTriggered: boolean;
  heroSkillName?: string;
  counterAdvantage?: string;
  log: string;
}

export interface BattleReportState {
  id: number;
  title: string;
  battle_type: string;
  victory: boolean;
  isRead: boolean;
  summary: any;
  replay: BattleRound[];
  created_at: number;
}

export interface AllianceHelpState {
  id: number;
  requester_id: number;
  requester_name: string;
  building_slot: string;
  building_name: string;
  helpers: number[];
  max_helps: number;
}

export interface AllianceState {
  id: number;
  tag: string;
  name: string;
  description: string;
  role: string;
  leader_id: number;
  totalPower: number;
  members: {
    id: number;
    username: string;
    avatar: string;
    power: number;
    castle_x: number;
    castle_y: number;
    role: string;
  }[];
  helps: AllianceHelpState[];
}

export interface QuestState {
  key: string;
  title: string;
  description: string;
  reward: { food: number; wood: number; iron: number; gold: number; gems: number };
  current: number;
  target: number;
  completed: boolean;
  claimed: boolean;
}

export interface PlayerState {
  serverTime: number;
  user: UserProfile;
  productionRates: { food: number; wood: number; iron: number; gold: number };
  bonuses: {
    foodWoodPct: number;
    ironGoldPct: number;
    buildSpeedPct: number;
    atkBonusPct: number;
    defBonusPct: number;
    marchSpeedPct: number;
    cityDefensePct: number;
    hospitalRecoveryRatio: number;
  };
  buildings: BuildingState[];
  troops: TroopState[];
  heroes: HeroState[];
  gear: GearItemState[];
  research: ResearchState[];
  campaign: CampaignProgressState[];
  marches: MarchState[];
  reports: BattleReportState[];
  alliance: AllianceState | null;
  quests: QuestState[];
}

export interface WorldTile {
  x: number;
  y: number;
  tile_type: 'castle' | 'resource' | 'monster' | 'throne';
  level: number;
  name: string;
  owner_id: number | null;
  owner_name?: string | null;
  owner_power?: number | null;
  alliance_tag?: string | null;
  resource_type: string | null;
  resource_amount: number;
  monster_power: number;
  monster_avatar: string | null;
}

export interface ChatMessage {
  id: number;
  channel: 'kingdom' | 'alliance';
  alliance_id: number | null;
  user_id: number;
  username: string;
  alliance_tag: string | null;
  message: string;
  created_at: number;
}

export type GameTab =
  | 'city'
  | 'world'
  | 'campaign'
  | 'heroes'
  | 'army'
  | 'academy'
  | 'alliance'
  | 'reports'
  | 'quests'
  | 'leaderboard';
