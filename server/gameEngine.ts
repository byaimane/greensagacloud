import { db } from './db.js';
import { simulateBattle, ArmyUnit } from './combat.js';
import {
  BUILDING_MAP,
  BuildingType,
  GEAR_RECIPES,
  HERO_TEMPLATE_MAP,
  QUESTS,
  TECH_MAP,
  THRONE_X,
  THRONE_Y,
  TROOP_MAP,
  getHeroComputedStats,
  getHeroXpForNextLevel,
  getResourceProductionPerHour,
} from '../shared/gameData.js';

export interface TechBonuses {
  foodWoodPct: number;
  ironGoldPct: number;
  buildSpeedPct: number;
  atkBonusPct: number;
  defBonusPct: number;
  marchSpeedPct: number;
  cityDefensePct: number;
  hospitalRecoveryRatio: number;
}

export function getUserTechBonuses(userId: number): TechBonuses {
  const rows = db.prepare('SELECT tech_key, level FROM research WHERE user_id = ?').all(userId) as {
    tech_key: string;
    level: number;
  }[];
  const map: Record<string, number> = {};
  for (const r of rows) map[r.tech_key] = r.level;

  const hospitalRow = db
    .prepare("SELECT level FROM buildings WHERE user_id = ? AND type = 'hospital'")
    .get(userId) as { level: number } | undefined;
  const hospitalLvl = hospitalRow?.level ?? 1;

  return {
    foodWoodPct: (map['crop_rotation'] ?? 0) * TECH_MAP['crop_rotation'].effectPerLevelPct,
    ironGoldPct: (map['deep_mining'] ?? 0) * TECH_MAP['deep_mining'].effectPerLevelPct,
    buildSpeedPct: (map['masonry'] ?? 0) * TECH_MAP['masonry'].effectPerLevelPct,
    atkBonusPct: (map['steel_forging'] ?? 0) * TECH_MAP['steel_forging'].effectPerLevelPct,
    defBonusPct: (map['war_formations'] ?? 0) * TECH_MAP['war_formations'].effectPerLevelPct,
    marchSpeedPct: (map['forced_march'] ?? 0) * TECH_MAP['forced_march'].effectPerLevelPct,
    cityDefensePct: (map['fortifications'] ?? 0) * TECH_MAP['fortifications'].effectPerLevelPct,
    hospitalRecoveryRatio: Math.min(
      0.92,
      0.55 + hospitalLvl * 0.015 + ((map['field_medicine'] ?? 0) * TECH_MAP['field_medicine'].effectPerLevelPct) / 100
    ),
  };
}

export function getHeroGearBonus(userId: number, heroKey: string) {
  const rows = db
    .prepare('SELECT attack_bonus, defense_bonus, hp_bonus FROM gear_items WHERE user_id = ? AND equipped_hero_key = ?')
    .all(userId, heroKey) as { attack_bonus: number; defense_bonus: number; hp_bonus: number }[];
  return rows.reduce(
    (acc, r) => ({
      attack: acc.attack + r.attack_bonus,
      defense: acc.defense + r.defense_bonus,
      hp: acc.hp + r.hp_bonus,
    }),
    { attack: 0, defense: 0, hp: 0 }
  );
}

export function grantHeroXp(userId: number, heroKey: string, xpGain: number) {
  const hero = db
    .prepare('SELECT level, xp FROM heroes WHERE user_id = ? AND hero_key = ?')
    .get(userId, heroKey) as { level: number; xp: number } | undefined;
  if (!hero) return;

  let level = hero.level;
  let xp = hero.xp + xpGain;
  while (level < 100) {
    const needed = getHeroXpForNextLevel(level);
    if (xp >= needed) {
      xp -= needed;
      level += 1;
    } else {
      break;
    }
  }
  db.prepare('UPDATE heroes SET level = ?, xp = ? WHERE user_id = ? AND hero_key = ?').run(level, xp, userId, heroKey);
}

export function grantGearDrop(userId: number, recipeKey: string) {
  const recipe = GEAR_RECIPES.find((g) => g.key === recipeKey);
  if (!recipe) return null;
  const now = Date.now();
  db.prepare(
    `INSERT INTO gear_items (user_id, recipe_key, name, slot, rarity, attack_bonus, defense_bonus, hp_bonus, icon, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    userId,
    recipe.key,
    recipe.name,
    recipe.slot,
    recipe.rarity,
    recipe.attackBonus,
    recipe.defenseBonus,
    recipe.hpBonus,
    recipe.icon,
    now
  );
  return recipe;
}

export function computeUserProductionRates(userId: number) {
  const bonuses = getUserTechBonuses(userId);
  const buildings = db.prepare('SELECT type, level FROM buildings WHERE user_id = ?').all(userId) as {
    type: BuildingType;
    level: number;
  }[];

  const rates = { food: 400, wood: 400, iron: 250, gold: 180 };
  for (const b of buildings) {
    const def = BUILDING_MAP[b.type];
    if (!def?.productionResource) continue;
    const bonus =
      def.productionResource === 'food' || def.productionResource === 'wood'
        ? bonuses.foodWoodPct
        : bonuses.ironGoldPct;
    rates[def.productionResource] += getResourceProductionPerHour(b.type, b.level, bonus);
  }
  return rates;
}

export function recalculatePower(userId: number): number {
  const buildings = db.prepare('SELECT type, level FROM buildings WHERE user_id = ?').all(userId) as {
    type: BuildingType;
    level: number;
  }[];
  let power = 0;
  let castleLevel = 1;
  for (const b of buildings) {
    const def = BUILDING_MAP[b.type];
    if (def) power += def.powerPerLevel * b.level;
    if (b.type === 'castle') castleLevel = b.level;
  }

  const troops = db.prepare('SELECT troop_id, count FROM troops WHERE user_id = ?').all(userId) as {
    troop_id: string;
    count: number;
  }[];
  for (const t of troops) {
    const def = TROOP_MAP[t.troop_id];
    if (def) power += def.power * t.count;
  }

  const heroes = db.prepare('SELECT hero_key, level, skill_level FROM heroes WHERE user_id = ?').all(userId) as {
    hero_key: string;
    level: number;
    skill_level: number;
  }[];
  for (const h of heroes) {
    const tmpl = HERO_TEMPLATE_MAP[h.hero_key];
    if (tmpl) {
      const gear = getHeroGearBonus(userId, h.hero_key);
      power += getHeroComputedStats(tmpl, h.level, h.skill_level, gear).power;
    }
  }

  const techs = db.prepare('SELECT level FROM research WHERE user_id = ?').all(userId) as { level: number }[];
  for (const r of techs) power += r.level * 180;

  db.prepare('UPDATE users SET power = ? WHERE id = ?').run(power, userId);
  db.prepare("UPDATE world_tiles SET level = ? WHERE owner_id = ? AND tile_type = 'castle'").run(castleLevel, userId);
  return power;
}

export function tickPlayer(userId: number) {
  const now = Date.now();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) return;

  // 1. Complete finished building upgrades
  const finishedBuildings = db
    .prepare('SELECT id, slot_id, upgrading_to FROM buildings WHERE user_id = ? AND finish_at IS NOT NULL AND finish_at <= ?')
    .all(userId, now) as { id: number; slot_id: string; upgrading_to: number }[];

  let powerDirty = false;
  for (const b of finishedBuildings) {
    db.prepare('UPDATE buildings SET level = ?, upgrading_to = NULL, finish_at = NULL WHERE id = ?').run(
      b.upgrading_to,
      b.id
    );
    db.prepare('DELETE FROM alliance_helps WHERE requester_id = ? AND building_slot = ?').run(userId, b.slot_id);
    powerDirty = true;
  }

  // 2. Complete finished troop training
  const finishedTroops = db
    .prepare(
      'SELECT id, training_count FROM troops WHERE user_id = ? AND training_finish_at IS NOT NULL AND training_finish_at <= ?'
    )
    .all(userId, now) as { id: number; training_count: number }[];
  for (const t of finishedTroops) {
    db.prepare('UPDATE troops SET count = count + ?, training_count = 0, training_finish_at = NULL WHERE id = ?').run(
      t.training_count,
      t.id
    );
    powerDirty = true;
  }

  // 3. Complete finished research
  const finishedTech = db
    .prepare('SELECT id, upgrading_to FROM research WHERE user_id = ? AND finish_at IS NOT NULL AND finish_at <= ?')
    .all(userId, now) as { id: number; upgrading_to: number }[];
  for (const r of finishedTech) {
    db.prepare('UPDATE research SET level = ?, upgrading_to = NULL, finish_at = NULL WHERE id = ?').run(
      r.upgrading_to,
      r.id
    );
    powerDirty = true;
  }

  // 4. Tick resources
  const elapsedHours = Math.max(0, (now - user.last_tick_at) / 3600000);
  if (elapsedHours > 0.0001) {
    const rates = computeUserProductionRates(userId);
    const newFood = user.food + rates.food * elapsedHours;
    const newWood = user.wood + rates.wood * elapsedHours;
    const newIron = user.iron + rates.iron * elapsedHours;
    const newGold = user.gold + rates.gold * elapsedHours;
    db.prepare('UPDATE users SET food = ?, wood = ?, iron = ?, gold = ?, last_tick_at = ? WHERE id = ?').run(
      newFood,
      newWood,
      newIron,
      newGold,
      now,
      userId
    );
  }

  if (powerDirty) {
    recalculatePower(userId);
  }
}

export function tickAllMarches(onUpdate?: (affectedUserIds: number[]) => void) {
  const now = Date.now();
  const affected = new Set<number>();

  // 1. Marches arriving at destination
  const arriving = db
    .prepare("SELECT * FROM marches WHERE status = 'marching' AND arrive_at <= ?")
    .all(now) as any[];

  for (const m of arriving) {
    affected.add(m.user_id);
    const troops: ArmyUnit[] = JSON.parse(m.troops_json);
    const tile = db.prepare('SELECT * FROM world_tiles WHERE x = ? AND y = ?').get(m.to_x, m.to_y) as any;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(m.user_id) as any;
    if (!user) {
      db.prepare('DELETE FROM marches WHERE id = ?').run(m.id);
      continue;
    }

    const bonuses = getUserTechBonuses(m.user_id);
    const heroRow = db
      .prepare('SELECT hero_key, level, skill_level FROM heroes WHERE user_id = ? AND hero_key = ?')
      .get(m.user_id, m.hero_key) as { hero_key: string; level: number; skill_level: number } | undefined;

    let loot: Record<string, number> = { food: 0, wood: 0, iron: 0, gold: 0, gems: 0 };
    let survivingTroops = [...troops];

    if (m.action === 'gather' && tile && tile.tile_type === 'resource') {
      const totalLoad = troops.reduce((sum, u) => sum + (TROOP_MAP[u.troopId]?.load ?? 10) * u.count, 0);
      const gathered = Math.min(tile.resource_amount, Math.max(350, totalLoad));
      loot[tile.resource_type] = gathered;

      const remaining = tile.resource_amount - gathered;
      if (remaining <= 0) {
        // Respawn resource amount so map stays rich
        db.prepare('UPDATE world_tiles SET resource_amount = ? WHERE x = ? AND y = ?').run(
          tile.level * 1200,
          tile.x,
          tile.y
        );
      } else {
        db.prepare('UPDATE world_tiles SET resource_amount = ? WHERE x = ? AND y = ?').run(remaining, tile.x, tile.y);
      }

      db.prepare(
        `INSERT INTO battle_reports (user_id, title, battle_type, victory, summary_json, replay_json, created_at)
         VALUES (?, ?, 'gather', 1, ?, '[]', ?)`
      ).run(
        m.user_id,
        `Gathered ${tile.name} (${tile.x}, ${tile.y})`,
        JSON.stringify({ loot, target: tile.name, coords: { x: tile.x, y: tile.y } }),
        now
      );
    } else if (tile && (tile.tile_type === 'monster' || tile.tile_type === 'throne')) {
      const isThrone = tile.tile_type === 'throne';
      const monsterTier = Math.max(1, Math.min(10, Math.ceil(tile.level / 3)));
      const enemyArmy: ArmyUnit[] = [
        { troopId: `infantry_t${monsterTier}`, count: Math.max(8, Math.round(tile.monster_power / (monsterTier * 22))) },
        { troopId: `cavalry_t${monsterTier}`, count: Math.max(5, Math.round(tile.monster_power / (monsterTier * 30))) },
      ];

      const outcome = simulateBattle(
        {
          name: user.username,
          avatar: user.avatar,
          hero: heroRow
            ? {
                heroKey: heroRow.hero_key,
                level: heroRow.level,
                skillLevel: heroRow.skill_level,
                gearBonus: getHeroGearBonus(m.user_id, heroRow.hero_key),
              }
            : undefined,
          army: troops,
          attackBonusPct: bonuses.atkBonusPct,
          defenseBonusPct: bonuses.defBonusPct,
        },
        {
          name: tile.name,
          avatar: tile.monster_avatar || '👹',
          syntheticHeroPower: Math.round(tile.monster_power * 0.45),
          army: enemyArmy,
          isWallDefender: isThrone,
        },
        bonuses.hospitalRecoveryRatio
      );

      // Apply casualties & hospital wounded
      survivingTroops = troops
        .map((u) => {
          const loss = outcome.attackerLosses[u.troopId];
          if (!loss) return u;
          if (loss.wounded > 0) {
            db.prepare('UPDATE troops SET wounded = wounded + ? WHERE user_id = ? AND troop_id = ?').run(
              loss.wounded,
              m.user_id,
              u.troopId
            );
          }
          return { ...u, count: Math.max(0, u.count - loss.lost - loss.wounded) };
        })
        .filter((u) => u.count > 0);

      if (outcome.victory) {
        const mult = tile.level;
        loot = {
          food: mult * 420,
          wood: mult * 420,
          iron: mult * 320,
          gold: mult * 280,
          gems: isThrone ? 300 : Math.max(10, mult * 5),
        };
        grantHeroXp(m.user_id, m.hero_key, mult * 140);
        db.prepare('UPDATE users SET monsters_slain = monsters_slain + 1, kills = kills + ? WHERE id = ?').run(
          mult * 25,
          m.user_id
        );
        if (isThrone) {
          db.prepare('UPDATE world_tiles SET owner_id = ?, name = ? WHERE x = ? AND y = ?').run(
            m.user_id,
            `Dragon Throne (Held by ${user.username})`,
            THRONE_X,
            THRONE_Y
          );
        }
      }

      db.prepare(
        `INSERT INTO battle_reports (user_id, title, battle_type, victory, summary_json, replay_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        m.user_id,
        `${outcome.victory ? 'Victory' : 'Defeat'} vs ${tile.name} (${tile.x}, ${tile.y})`,
        isThrone ? 'throne' : 'monster',
        outcome.victory ? 1 : 0,
        JSON.stringify({
          loot,
          target: tile.name,
          attackerPower: outcome.attackerPower,
          defenderPower: outcome.defenderPower,
          losses: outcome.attackerLosses,
          stars: outcome.stars,
        }),
        JSON.stringify(outcome.rounds),
        now
      );
    } else if (tile && tile.tile_type === 'castle' && tile.owner_id && tile.owner_id !== m.user_id) {
      // PvP / Rival Castle Siege!
      const defenderUser = db.prepare('SELECT * FROM users WHERE id = ?').get(tile.owner_id) as any;
      const defTroopsRows = db
        .prepare('SELECT troop_id, count FROM troops WHERE user_id = ? AND count > 0')
        .all(tile.owner_id) as { troop_id: string; count: number }[];
      const defBonuses = getUserTechBonuses(tile.owner_id);
      const defHero = db
        .prepare('SELECT hero_key, level, skill_level FROM heroes WHERE user_id = ? ORDER BY level DESC LIMIT 1')
        .get(tile.owner_id) as { hero_key: string; level: number; skill_level: number } | undefined;

      const outcome = simulateBattle(
        {
          name: user.username,
          avatar: user.avatar,
          hero: heroRow
            ? {
                heroKey: heroRow.hero_key,
                level: heroRow.level,
                skillLevel: heroRow.skill_level,
                gearBonus: getHeroGearBonus(m.user_id, heroRow.hero_key),
              }
            : undefined,
          army: troops,
          attackBonusPct: bonuses.atkBonusPct,
          defenseBonusPct: bonuses.defBonusPct,
        },
        {
          name: defenderUser?.username ?? tile.name,
          avatar: defenderUser?.avatar ?? '🏰',
          hero: defHero
            ? {
                heroKey: defHero.hero_key,
                level: defHero.level,
                skillLevel: defHero.skill_level,
                gearBonus: getHeroGearBonus(tile.owner_id, defHero.hero_key),
              }
            : undefined,
          army: defTroopsRows.map((r) => ({ troopId: r.troop_id, count: r.count })),
          attackBonusPct: defBonuses.atkBonusPct,
          defenseBonusPct: defBonuses.defBonusPct + defBonuses.cityDefensePct,
          isWallDefender: true,
        },
        bonuses.hospitalRecoveryRatio
      );

      survivingTroops = troops
        .map((u) => {
          const loss = outcome.attackerLosses[u.troopId];
          if (!loss) return u;
          if (loss.wounded > 0) {
            db.prepare('UPDATE troops SET wounded = wounded + ? WHERE user_id = ? AND troop_id = ?').run(
              loss.wounded,
              m.user_id,
              u.troopId
            );
          }
          return { ...u, count: Math.max(0, u.count - loss.lost - loss.wounded) };
        })
        .filter((u) => u.count > 0);

      if (outcome.victory && defenderUser) {
        loot = {
          food: Math.min(Math.round(defenderUser.food * 0.2), 4500),
          wood: Math.min(Math.round(defenderUser.wood * 0.2), 4500),
          iron: Math.min(Math.round(defenderUser.iron * 0.2), 3500),
          gold: Math.min(Math.round(defenderUser.gold * 0.2), 3000),
          gems: 25,
        };
        db.prepare('UPDATE users SET food = MAX(0, food - ?), wood = MAX(0, wood - ?), iron = MAX(0, iron - ?), gold = MAX(0, gold - ?) WHERE id = ?').run(
          loot.food,
          loot.wood,
          loot.iron,
          loot.gold,
          defenderUser.id
        );
        db.prepare('UPDATE users SET kills = kills + ? WHERE id = ?').run(
          Math.max(40, Math.round(outcome.defenderPower * 0.08)),
          m.user_id
        );
        grantHeroXp(m.user_id, m.hero_key, 240);
        affected.add(defenderUser.id);
      }

      db.prepare(
        `INSERT INTO battle_reports (user_id, title, battle_type, victory, summary_json, replay_json, created_at)
         VALUES (?, ?, 'pvp', ?, ?, ?, ?)`
      ).run(
        m.user_id,
        `Siege of ${tile.name} (${tile.x}, ${tile.y}) — ${outcome.victory ? 'Victory!' : 'Repelled'}`,
        outcome.victory ? 1 : 0,
        JSON.stringify({
          loot,
          target: tile.name,
          attackerPower: outcome.attackerPower,
          defenderPower: outcome.defenderPower,
          losses: outcome.attackerLosses,
          stars: outcome.stars,
        }),
        JSON.stringify(outcome.rounds),
        now
      );
    }

    db.prepare("UPDATE marches SET status = 'returning', troops_json = ?, loot_json = ? WHERE id = ?").run(
      JSON.stringify(survivingTroops),
      JSON.stringify(loot),
      m.id
    );
  }

  // 2. Marches returning home
  const returning = db
    .prepare("SELECT * FROM marches WHERE status = 'returning' AND return_at <= ?")
    .all(now) as any[];

  for (const m of returning) {
    affected.add(m.user_id);
    const troops: ArmyUnit[] = JSON.parse(m.troops_json || '[]');
    const loot = JSON.parse(m.loot_json || '{}');

    for (const u of troops) {
      if (u.count > 0) {
        db.prepare(
          `INSERT INTO troops (user_id, troop_id, count, wounded) VALUES (?, ?, ?, 0)
           ON CONFLICT(user_id, troop_id) DO UPDATE SET count = count + excluded.count`
        ).run(m.user_id, u.troopId, u.count);
      }
    }

    db.prepare(
      `UPDATE users SET food = food + ?, wood = wood + ?, iron = iron + ?, gold = gold + ?, gems = gems + ? WHERE id = ?`
    ).run(loot.food || 0, loot.wood || 0, loot.iron || 0, loot.gold || 0, loot.gems || 0, m.user_id);

    db.prepare('DELETE FROM marches WHERE id = ?').run(m.id);
    recalculatePower(m.user_id);
  }

  if (affected.size > 0 && onUpdate) {
    onUpdate(Array.from(affected));
  }
}

export function getPlayerState(userId: number) {
  tickPlayer(userId);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) return null;

  const buildings = db.prepare('SELECT * FROM buildings WHERE user_id = ?').all(userId) as any[];
  const troops = db.prepare('SELECT * FROM troops WHERE user_id = ?').all(userId) as any[];
  const heroes = db.prepare('SELECT * FROM heroes WHERE user_id = ?').all(userId) as any[];
  const gear = db.prepare('SELECT * FROM gear_items WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[];
  const research = db.prepare('SELECT * FROM research WHERE user_id = ?').all(userId) as any[];
  const campaign = db.prepare('SELECT stage_id, stars FROM campaign_progress WHERE user_id = ?').all(userId) as any[];
  const marches = db.prepare('SELECT * FROM marches WHERE user_id = ?').all(userId) as any[];
  const reports = db
    .prepare('SELECT * FROM battle_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 30')
    .all(userId) as any[];
  const claimedQuests = db
    .prepare('SELECT quest_key FROM claimed_quests WHERE user_id = ?')
    .all(userId)
    .map((r: any) => r.quest_key);

  const allianceMember = db
    .prepare(
      `SELECT am.role, a.id, a.tag, a.name, a.description, a.leader_id
       FROM alliance_members am JOIN alliances a ON a.id = am.alliance_id
       WHERE am.user_id = ?`
    )
    .get(userId) as any;

  let allianceDetails: any = null;
  if (allianceMember) {
    const members = db
      .prepare(
        `SELECT u.id, u.username, u.avatar, u.power, u.castle_x, u.castle_y, am.role
         FROM alliance_members am JOIN users u ON u.id = am.user_id
         WHERE am.alliance_id = ? ORDER BY u.power DESC`
      )
      .all(allianceMember.id) as any[];
    const helps = db
      .prepare(
        `SELECT h.*, u.username as requester_name
         FROM alliance_helps h JOIN users u ON u.id = h.requester_id
         WHERE h.alliance_id = ? ORDER BY h.created_at DESC`
      )
      .all(allianceMember.id) as any[];
    allianceDetails = {
      ...allianceMember,
      totalPower: members.reduce((s, m) => s + m.power, 0),
      members,
      helps: helps.map((h) => ({ ...h, helpers: JSON.parse(h.helpers_json || '[]') })),
    };
  }

  const productionRates = computeUserProductionRates(userId);
  const bonuses = getUserTechBonuses(userId);

  // Quest status calculation
  const castleLevel = buildings.find((b) => b.type === 'castle')?.level ?? 1;
  const totalTroops = troops.reduce((s, t) => s + t.count, 0);
  const maxCampaignStage = campaign.reduce((m, c) => Math.max(m, c.stage_id), 0);
  const totalTechLevels = research.reduce((s, r) => s + r.level, 0);

  const quests = QUESTS.map((q) => {
    let current = 0;
    if (q.checkType === 'castle_level') current = castleLevel;
    else if (q.checkType === 'total_troops') current = totalTroops;
    else if (q.checkType === 'campaign_cleared') current = maxCampaignStage;
    else if (q.checkType === 'tech_levels') current = totalTechLevels;
    else if (q.checkType === 'hero_count') current = heroes.length;
    else if (q.checkType === 'gear_count') current = gear.length;
    else if (q.checkType === 'alliance_joined') current = allianceDetails ? 1 : 0;
    else if (q.checkType === 'monsters_slain') current = user.monsters_slain;

    return {
      ...q,
      current,
      completed: current >= q.target,
      claimed: claimedQuests.includes(q.key),
    };
  });

  return {
    serverTime: Date.now(),
    user: {
      id: user.id,
      username: user.username,
      realm: user.realm,
      avatar: user.avatar,
      castleX: user.castle_x,
      castleY: user.castle_y,
      food: Math.floor(user.food),
      wood: Math.floor(user.wood),
      iron: Math.floor(user.iron),
      gold: Math.floor(user.gold),
      gems: user.gems,
      speedups: user.speedups,
      power: user.power,
      kills: user.kills,
      monstersSlain: user.monsters_slain,
      castleLevel,
    },
    productionRates,
    bonuses,
    buildings,
    troops,
    heroes: heroes.map((h) => ({
      ...h,
      gearBonus: getHeroGearBonus(userId, h.hero_key),
    })),
    gear,
    research,
    campaign,
    marches: marches.map((m) => ({
      ...m,
      troops: JSON.parse(m.troops_json || '[]'),
      loot: m.loot_json ? JSON.parse(m.loot_json) : null,
    })),
    reports: reports.map((r) => ({
      ...r,
      victory: Boolean(r.victory),
      isRead: Boolean(r.is_read),
      summary: JSON.parse(r.summary_json || '{}'),
      replay: JSON.parse(r.replay_json || '[]'),
    })),
    alliance: allianceDetails,
    quests,
  };
}
