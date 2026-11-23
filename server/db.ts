import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  BUILDINGS,
  THRONE_X,
  THRONE_Y,
  WORLD_SIZE,
} from '../shared/gameData.js';

const dataDir = path.resolve(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(path.join(dataDir, 'ouagx.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      token TEXT UNIQUE,
      realm TEXT NOT NULL DEFAULT 'Realm #1 - Valoria',
      avatar TEXT NOT NULL DEFAULT '👑',
      castle_x INTEGER NOT NULL,
      castle_y INTEGER NOT NULL,
      food REAL NOT NULL DEFAULT 2600,
      wood REAL NOT NULL DEFAULT 2600,
      iron REAL NOT NULL DEFAULT 1800,
      gold REAL NOT NULL DEFAULT 1400,
      gems INTEGER NOT NULL DEFAULT 350,
      speedups INTEGER NOT NULL DEFAULT 6,
      power INTEGER NOT NULL DEFAULT 1000,
      kills INTEGER NOT NULL DEFAULT 0,
      monsters_slain INTEGER NOT NULL DEFAULT 0,
      is_ai INTEGER NOT NULL DEFAULT 0,
      last_tick_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS buildings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      slot_id TEXT NOT NULL,
      type TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      upgrading_to INTEGER,
      finish_at INTEGER,
      UNIQUE(user_id, slot_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS troops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      troop_id TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      wounded INTEGER NOT NULL DEFAULT 0,
      training_count INTEGER NOT NULL DEFAULT 0,
      training_finish_at INTEGER,
      UNIQUE(user_id, troop_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS heroes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      hero_key TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      xp INTEGER NOT NULL DEFAULT 0,
      skill_level INTEGER NOT NULL DEFAULT 1,
      UNIQUE(user_id, hero_key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS gear_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      recipe_key TEXT NOT NULL,
      name TEXT NOT NULL,
      slot TEXT NOT NULL,
      rarity TEXT NOT NULL,
      attack_bonus INTEGER NOT NULL,
      defense_bonus INTEGER NOT NULL,
      hp_bonus INTEGER NOT NULL,
      icon TEXT NOT NULL,
      equipped_hero_key TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS research (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tech_key TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 0,
      upgrading_to INTEGER,
      finish_at INTEGER,
      UNIQUE(user_id, tech_key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS campaign_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      stage_id INTEGER NOT NULL,
      stars INTEGER NOT NULL DEFAULT 0,
      cleared_at INTEGER NOT NULL,
      UNIQUE(user_id, stage_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS world_tiles (
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      tile_type TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL,
      owner_id INTEGER,
      resource_type TEXT,
      resource_amount INTEGER DEFAULT 0,
      monster_power INTEGER DEFAULT 0,
      monster_avatar TEXT,
      PRIMARY KEY (x, y)
    );

    CREATE TABLE IF NOT EXISTS marches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      hero_key TEXT NOT NULL,
      troops_json TEXT NOT NULL,
      from_x INTEGER NOT NULL,
      from_y INTEGER NOT NULL,
      to_x INTEGER NOT NULL,
      to_y INTEGER NOT NULL,
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      depart_at INTEGER NOT NULL,
      arrive_at INTEGER NOT NULL,
      return_at INTEGER NOT NULL,
      loot_json TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alliances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag TEXT UNIQUE NOT NULL,
      name TEXT UNIQUE NOT NULL,
      leader_id INTEGER NOT NULL,
      description TEXT NOT NULL DEFAULT 'United in the Realm of OUAGX.',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alliance_members (
      alliance_id INTEGER NOT NULL,
      user_id INTEGER UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'Member',
      joined_at INTEGER NOT NULL,
      FOREIGN KEY (alliance_id) REFERENCES alliances(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alliance_helps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alliance_id INTEGER NOT NULL,
      requester_id INTEGER NOT NULL,
      building_slot TEXT NOT NULL,
      building_name TEXT NOT NULL,
      helpers_json TEXT NOT NULL DEFAULT '[]',
      max_helps INTEGER NOT NULL DEFAULT 5,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (alliance_id) REFERENCES alliances(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS battle_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      battle_type TEXT NOT NULL,
      victory INTEGER NOT NULL,
      summary_json TEXT NOT NULL,
      replay_json TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel TEXT NOT NULL,
      alliance_id INTEGER,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      alliance_tag TEXT,
      message TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS claimed_quests (
      user_id INTEGER NOT NULL,
      quest_key TEXT NOT NULL,
      claimed_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, quest_key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  seedWorldIfEmpty();
  // Ensure cross-platform emoji compatibility on existing worlds
  db.prepare("UPDATE world_tiles SET monster_avatar = '💰' WHERE monster_avatar = '🪙'").run();
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function findFreeCastleCoordinate(): { x: number; y: number } {
  for (let attempt = 0; attempt < 250; attempt++) {
    const x = Math.floor(Math.random() * (WORLD_SIZE - 4)) + 2;
    const y = Math.floor(Math.random() * (WORLD_SIZE - 4)) + 2;
    const distFromThrone = Math.hypot(x - THRONE_X, y - THRONE_Y);
    if (distFromThrone < 4) continue;
    const existing = db.prepare('SELECT tile_type FROM world_tiles WHERE x = ? AND y = ?').get(x, y) as
      | { tile_type: string }
      | undefined;
    if (!existing) {
      return { x, y };
    }
  }
  return { x: 5, y: 5 };
}

export function provisionNewKingdom(userId: number, username: string, x: number, y: number, starterBoost = 1) {
  const insertBuilding = db.prepare(
    'INSERT OR IGNORE INTO buildings (user_id, slot_id, type, level) VALUES (?, ?, ?, ?)'
  );
  for (const b of BUILDINGS) {
    const lvl = b.type === 'castle' ? starterBoost : Math.max(1, starterBoost - 1);
    insertBuilding.run(userId, b.slotId, b.type, lvl);
  }

  // Starter hero: Sir Aldric
  db.prepare('INSERT OR IGNORE INTO heroes (user_id, hero_key, level, xp, skill_level) VALUES (?, ?, ?, ?, ?)').run(
    userId,
    'aldric',
    Math.max(1, starterBoost * 2 - 1),
    0,
    1
  );

  // Starter army
  const insertTroop = db.prepare(
    'INSERT OR IGNORE INTO troops (user_id, troop_id, count, wounded) VALUES (?, ?, ?, 0)'
  );
  insertTroop.run(userId, 'infantry_t1', 25 * starterBoost);
  insertTroop.run(userId, 'archer_t1', 15 * starterBoost);
  insertTroop.run(userId, 'cavalry_t1', 10 * starterBoost);
  insertTroop.run(userId, 'siege_t1', 4 * starterBoost);

  // Place castle on world map
  db.prepare(
    `INSERT OR REPLACE INTO world_tiles (x, y, tile_type, level, name, owner_id, monster_avatar)
     VALUES (?, ?, 'castle', ?, ?, ?, '🏰')`
  ).run(x, y, starterBoost, `${username}'s Citadel`, userId);
}

function seedWorldIfEmpty() {
  const countRow = db.prepare('SELECT COUNT(*) as c FROM world_tiles').get() as { c: number };
  if (countRow.c > 0) return;

  const now = Date.now();

  // 1. Central OUAGX Dragon Throne
  db.prepare(
    `INSERT INTO world_tiles (x, y, tile_type, level, name, monster_power, monster_avatar)
     VALUES (?, ?, 'throne', 30, 'OUAGX Dragon Throne', 45000, '👑')`
  ).run(THRONE_X, THRONE_Y);

  // 2. Seed AI Rival Kingdoms + Alliances so the world feels alive
  const aiLords = [
    { name: 'Lord Draven', avatar: '🦅', lvl: 2, x: 14, y: 15, kills: 140 },
    { name: 'Lady Morgana', avatar: '🌙', lvl: 3, x: 26, y: 15, kills: 290 },
    { name: 'Baron Ironhelm', avatar: '🪓', lvl: 4, x: 15, y: 25, kills: 510 },
    { name: 'Duke Valerius', avatar: '🦁', lvl: 6, x: 25, y: 25, kills: 1120 },
    { name: 'Warlord Korr', avatar: '🔥', lvl: 8, x: 10, y: 10, kills: 2400 },
    { name: 'Empress Nyx', avatar: '🐉', lvl: 11, x: 30, y: 30, kills: 4850 },
  ];

  const aiIds: number[] = [];
  for (const ai of aiLords) {
    const res = db
      .prepare(
        `INSERT INTO users (username, password_hash, token, avatar, castle_x, castle_y, food, wood, iron, gold, gems, power, kills, is_ai, last_tick_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
      )
      .run(
        ai.name,
        hashPassword(crypto.randomBytes(16).toString('hex')),
        generateToken(),
        ai.avatar,
        ai.x,
        ai.y,
        3500 * ai.lvl,
        3500 * ai.lvl,
        2500 * ai.lvl,
        2000 * ai.lvl,
        500,
        ai.lvl * 1450,
        ai.kills,
        now,
        now
      );
    const id = Number(res.lastInsertRowid);
    aiIds.push(id);
    provisionNewKingdom(id, ai.name, ai.x, ai.y, ai.lvl);
  }

  // Create 2 NPC Alliances
  const a1 = db
    .prepare(
      `INSERT INTO alliances (tag, name, leader_id, description, created_at)
       VALUES ('OGX', 'Order of OUAGX', ?, 'Defenders of the Dragon Throne. All noble lords welcome!', ?)`
    )
    .run(aiIds[0], now);
  const a2 = db
    .prepare(
      `INSERT INTO alliances (tag, name, leader_id, description, created_at)
       VALUES ('DRK', 'Obsidian Vanguard', ?, 'Conquerors of the Realm. Strength above all.', ?)`
    )
    .run(aiIds[3], now);

  const joinAlliance = db.prepare(
    'INSERT INTO alliance_members (alliance_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)'
  );
  joinAlliance.run(Number(a1.lastInsertRowid), aiIds[0], 'Leader', now);
  joinAlliance.run(Number(a1.lastInsertRowid), aiIds[1], 'Officer', now);
  joinAlliance.run(Number(a1.lastInsertRowid), aiIds[2], 'Member', now);
  joinAlliance.run(Number(a2.lastInsertRowid), aiIds[3], 'Leader', now);
  joinAlliance.run(Number(a2.lastInsertRowid), aiIds[4], 'Officer', now);
  joinAlliance.run(Number(a2.lastInsertRowid), aiIds[5], 'Member', now);

  // Welcome kingdom chat messages
  const insertChat = db.prepare(
    `INSERT INTO chat_messages (channel, alliance_id, user_id, username, alliance_tag, message, created_at)
     VALUES ('kingdom', NULL, ?, ?, ?, ?, ?)`
  );
  insertChat.run(
    aiIds[0],
    'Lord Draven',
    'OGX',
    'Welcome to OUAGX! Upgrade your Citadel, recruit Heroes, and rally to claim the Dragon Throne at (20, 20)!',
    now - 120000
  );
  insertChat.run(
    aiIds[3],
    'Duke Valerius',
    'DRK',
    'The Obsidian Vanguard is hunting Crimson Dragons near the center. Join an alliance to speed up your builds!',
    now - 45000
  );

  // 3. Seed Resource Nodes & Roaming PvE Monsters across the 40x40 map
  const resourceConfigs = [
    { resource: 'food', name: 'Fertile Wheatfield', avatar: '🌾' },
    { resource: 'wood', name: 'Ancient Timberland', avatar: '🌲' },
    { resource: 'iron', name: 'Ironfang Vein', avatar: '⛏️' },
    { resource: 'gold', name: 'Sovereign Gold Mine', avatar: '💰' },
  ];

  const monsterCatalog = [
    { minDist: 14, lvl: 1, name: 'Goblin Raider', power: 260, avatar: '👺' },
    { minDist: 12, lvl: 3, name: 'Direwolf Alpha', power: 680, avatar: '🐺' },
    { minDist: 10, lvl: 6, name: 'Orc Warlord', power: 1550, avatar: '👹' },
    { minDist: 7, lvl: 10, name: 'Frost Giant', power: 3800, avatar: '🧊' },
    { minDist: 5, lvl: 16, name: 'Shadow Wyvern', power: 9200, avatar: '🐲' },
    { minDist: 0, lvl: 25, name: 'Crimson Dragon', power: 24000, avatar: '🐉' },
  ];

  const insertTile = db.prepare(
    `INSERT OR IGNORE INTO world_tiles (x, y, tile_type, level, name, resource_type, resource_amount, monster_power, monster_avatar)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  // Deterministic pseudo-random for rich, balanced map
  let seed = 421337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let y = 0; y < WORLD_SIZE; y++) {
    for (let x = 0; x < WORLD_SIZE; x++) {
      if (x === THRONE_X && y === THRONE_Y) continue;
      const exists = db.prepare('SELECT 1 FROM world_tiles WHERE x = ? AND y = ?').get(x, y);
      if (exists) continue;

      const dist = Math.hypot(x - THRONE_X, y - THRONE_Y);
      const roll = rand();

      if (roll < 0.085) {
        // Resource node — higher levels nearer the center Throne
        const cfg = resourceConfigs[Math.floor(rand() * resourceConfigs.length)];
        const lvl = Math.max(1, Math.min(10, Math.round(10 - dist * 0.35 + rand() * 2)));
        const amount = lvl * 1200;
        insertTile.run(x, y, 'resource', lvl, `Lv.${lvl} ${cfg.name}`, cfg.resource, amount, 0, cfg.avatar);
      } else if (roll < 0.145) {
        // Roaming PvE Monster
        const eligible = monsterCatalog.filter((m) => dist >= m.minDist - 4 && dist <= m.minDist + 8);
        const pick = eligible.length
          ? eligible[Math.floor(rand() * eligible.length)]
          : monsterCatalog[Math.floor(rand() * 3)];
        insertTile.run(
          x,
          y,
          'monster',
          pick.lvl,
          `Lv.${pick.lvl} ${pick.name}`,
          null,
          0,
          pick.power,
          pick.avatar
        );
      }
    }
  }
}
