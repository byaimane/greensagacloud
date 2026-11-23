import express from 'express';
import cors from 'cors';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { Server as SocketIOServer } from 'socket.io';
import { db, findFreeCastleCoordinate, generateToken, hashPassword, initDatabase, provisionNewKingdom, verifyPassword, } from './db.js';
import { getHeroGearBonus, getPlayerState, getUserTechBonuses, grantGearDrop, grantHeroXp, recalculatePower, tickAllMarches, tickPlayer, } from './gameEngine.js';
import { simulateBattle } from './combat.js';
import { BUILDING_MAP, CAMPAIGN_STAGES, GEAR_RECIPES, HERO_TEMPLATE_MAP, QUESTS, TECH_MAP, TROOP_MAP, getBuildingUpgradeCost, getBuildingUpgradeTimeSec, getTechUpgradeCost, } from '../shared/gameData.js';
initDatabase();
const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: { origin: '*' },
});
// Map userId -> socket IDs for real-time state updates
const userSockets = new Map();
function notifyUser(userId, event = 'state:dirty') {
    const sockets = userSockets.get(userId);
    if (sockets) {
        for (const sid of sockets) {
            io.to(sid).emit(event);
        }
    }
}
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const row = db.prepare('SELECT id FROM users WHERE token = ?').get(token);
    if (!row) {
        res.status(401).json({ error: 'Invalid session token' });
        return;
    }
    req.userId = row.id;
    next();
}
function deductResources(userId, cost) {
    tickPlayer(userId);
    const user = db.prepare('SELECT food, wood, iron, gold FROM users WHERE id = ?').get(userId);
    if (!user)
        return false;
    if (user.food < cost.food || user.wood < cost.wood || user.iron < cost.iron || user.gold < cost.gold) {
        return false;
    }
    db.prepare('UPDATE users SET food = food - ?, wood = wood - ?, iron = iron - ?, gold = gold - ? WHERE id = ?').run(cost.food, cost.wood, cost.iron, cost.gold, userId);
    return true;
}
// ---------------------------------------------------------------------------
// AUTH ENDPOINTS
// ---------------------------------------------------------------------------
app.post('/api/auth/register', (req, res) => {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    const avatar = String(req.body?.avatar || '👑').slice(0, 4);
    if (username.length < 3 || username.length > 20) {
        res.status(400).json({ error: 'Lord name must be 3–20 characters.' });
        return;
    }
    if (password.length < 4) {
        res.status(400).json({ error: 'Password must be at least 4 characters.' });
        return;
    }
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(username);
    if (existing) {
        res.status(409).json({ error: 'That Lord name is already claimed in OUAGX.' });
        return;
    }
    const coords = findFreeCastleCoordinate();
    const token = generateToken();
    const now = Date.now();
    const insert = db
        .prepare(`INSERT INTO users (username, password_hash, token, avatar, castle_x, castle_y, last_tick_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(username, hashPassword(password), token, avatar, coords.x, coords.y, now, now);
    const userId = Number(insert.lastInsertRowid);
    provisionNewKingdom(userId, username, coords.x, coords.y, 1);
    recalculatePower(userId);
    io.emit('world:dirty');
    res.json({ token, state: getPlayerState(userId) });
});
app.post('/api/auth/login', (req, res) => {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    const user = db.prepare('SELECT id, password_hash FROM users WHERE LOWER(username) = LOWER(?)').get(username);
    if (!user || !verifyPassword(password, user.password_hash)) {
        res.status(401).json({ error: 'Invalid Lord name or password.' });
        return;
    }
    const token = generateToken();
    db.prepare('UPDATE users SET token = ? WHERE id = ?').run(token, user.id);
    res.json({ token, state: getPlayerState(user.id) });
});
app.post('/api/auth/guest', (req, res) => {
    const custom = String(req.body?.username || '').trim();
    const suffix = Math.floor(100 + Math.random() * 899);
    const username = custom.length >= 3 && custom.length <= 16 ? custom : `LordOUAGX_${suffix}`;
    const avatar = String(req.body?.avatar || '⚔️').slice(0, 4);
    const uniqueName = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(username)
        ? `${username.slice(0, 14)}_${Math.floor(10 + Math.random() * 89)}`
        : username;
    const coords = findFreeCastleCoordinate();
    const token = generateToken();
    const now = Date.now();
    const insert = db
        .prepare(`INSERT INTO users (username, password_hash, token, avatar, castle_x, castle_y, last_tick_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(uniqueName, hashPassword(generateToken()), token, avatar, coords.x, coords.y, now, now);
    const userId = Number(insert.lastInsertRowid);
    provisionNewKingdom(userId, uniqueName, coords.x, coords.y, 1);
    recalculatePower(userId);
    io.emit('world:dirty');
    res.json({ token, state: getPlayerState(userId) });
});
// ---------------------------------------------------------------------------
// PLAYER STATE
// ---------------------------------------------------------------------------
app.get('/api/state', requireAuth, (req, res) => {
    const state = getPlayerState(req.userId);
    res.json(state);
});
// ---------------------------------------------------------------------------
// BUILDINGS
// ---------------------------------------------------------------------------
app.post('/api/buildings/upgrade', requireAuth, (req, res) => {
    const userId = req.userId;
    const slotId = String(req.body?.slotId || '');
    tickPlayer(userId);
    const b = db.prepare('SELECT * FROM buildings WHERE user_id = ? AND slot_id = ?').get(userId, slotId);
    if (!b) {
        res.status(404).json({ error: 'Building not found.' });
        return;
    }
    const def = BUILDING_MAP[b.type];
    if (b.finish_at) {
        res.status(400).json({ error: 'Building is already upgrading.' });
        return;
    }
    if (b.level >= def.maxLevel) {
        res.status(400).json({ error: 'Building is already at max level.' });
        return;
    }
    // Max 2 concurrent construction queues
    const activeBuilds = db
        .prepare('SELECT COUNT(*) as c FROM buildings WHERE user_id = ? AND finish_at IS NOT NULL')
        .get(userId);
    if (activeBuilds.c >= 2) {
        res.status(400).json({ error: 'Maximum 2 concurrent constructions reached. Finish or speed up one first.' });
        return;
    }
    // Gate non-castle buildings by castle level
    if (b.type !== 'castle') {
        const castle = db.prepare("SELECT level FROM buildings WHERE user_id = ? AND type = 'castle'").get(userId);
        if (b.level >= castle.level) {
            res.status(400).json({ error: `Upgrade your Citadel Keep to Level ${b.level + 1} first.` });
            return;
        }
    }
    const cost = getBuildingUpgradeCost(b.type, b.level);
    if (!deductResources(userId, cost)) {
        res.status(400).json({ error: 'Insufficient resources for this upgrade.' });
        return;
    }
    const bonuses = getUserTechBonuses(userId);
    const durationSec = getBuildingUpgradeTimeSec(b.type, b.level, bonuses.buildSpeedPct);
    const finishAt = Date.now() + durationSec * 1000;
    db.prepare('UPDATE buildings SET upgrading_to = ?, finish_at = ? WHERE id = ?').run(b.level + 1, finishAt, b.id);
    res.json({ state: getPlayerState(userId) });
});
app.post('/api/buildings/speedup', requireAuth, (req, res) => {
    const userId = req.userId;
    const slotId = String(req.body?.slotId || '');
    const mode = String(req.body?.mode || 'speedup'); // 'speedup' or 'gems'
    tickPlayer(userId);
    const b = db.prepare('SELECT * FROM buildings WHERE user_id = ? AND slot_id = ?').get(userId, slotId);
    if (!b || !b.finish_at) {
        res.status(400).json({ error: 'No active upgrade on this building.' });
        return;
    }
    const user = db.prepare('SELECT gems, speedups FROM users WHERE id = ?').get(userId);
    if (mode === 'speedup') {
        if (user.speedups <= 0) {
            res.status(400).json({ error: 'No Speed-up scrolls left. Use Gems instead.' });
            return;
        }
        db.prepare('UPDATE users SET speedups = speedups - 1 WHERE id = ?').run(userId);
        // Shave 60 seconds or finish immediately
        const newFinish = b.finish_at - 60000;
        db.prepare('UPDATE buildings SET finish_at = ? WHERE id = ?').run(Math.min(Date.now(), newFinish), b.id);
    }
    else {
        const remainingSec = Math.max(1, Math.ceil((b.finish_at - Date.now()) / 1000));
        const gemCost = Math.max(5, Math.ceil(remainingSec / 12));
        if (user.gems < gemCost) {
            res.status(400).json({ error: `Need ${gemCost} Gems to finish instantly.` });
            return;
        }
        db.prepare('UPDATE users SET gems = gems - ? WHERE id = ?').run(gemCost, userId);
        db.prepare('UPDATE buildings SET finish_at = ? WHERE id = ?').run(Date.now(), b.id);
    }
    tickPlayer(userId);
    res.json({ state: getPlayerState(userId) });
});
app.post('/api/buildings/request-help', requireAuth, (req, res) => {
    const userId = req.userId;
    const slotId = String(req.body?.slotId || '');
    const b = db.prepare('SELECT * FROM buildings WHERE user_id = ? AND slot_id = ?').get(userId, slotId);
    if (!b || !b.finish_at) {
        res.status(400).json({ error: 'Building is not currently upgrading.' });
        return;
    }
    const member = db.prepare('SELECT alliance_id FROM alliance_members WHERE user_id = ?').get(userId);
    if (!member) {
        res.status(400).json({ error: 'Join an Alliance first to request build help.' });
        return;
    }
    const existing = db
        .prepare('SELECT id FROM alliance_helps WHERE requester_id = ? AND building_slot = ?')
        .get(userId, slotId);
    if (existing) {
        res.status(400).json({ error: 'Alliance help already requested for this building.' });
        return;
    }
    const def = BUILDING_MAP[b.type];
    db.prepare(`INSERT INTO alliance_helps (alliance_id, requester_id, building_slot, building_name, created_at)
     VALUES (?, ?, ?, ?, ?)`).run(member.alliance_id, userId, slotId, `${def.name} Lv.${b.upgrading_to}`, Date.now());
    // AI alliance members automatically lend a helping hand!
    const aiAllies = db
        .prepare(`SELECT u.id FROM alliance_members am JOIN users u ON u.id = am.user_id
       WHERE am.alliance_id = ? AND u.is_ai = 1 LIMIT 2`)
        .all(member.alliance_id);
    if (aiAllies.length > 0) {
        const shaveMs = aiAllies.length * 8000;
        db.prepare('UPDATE buildings SET finish_at = MAX(?, finish_at - ?) WHERE id = ?').run(Date.now(), shaveMs, b.id);
        db.prepare('UPDATE alliance_helps SET helpers_json = ? WHERE requester_id = ? AND building_slot = ?').run(JSON.stringify(aiAllies.map((a) => a.id)), userId, slotId);
    }
    res.json({ state: getPlayerState(userId) });
});
// ---------------------------------------------------------------------------
// TROOPS & HOSPITAL
// ---------------------------------------------------------------------------
app.post('/api/troops/train', requireAuth, (req, res) => {
    const userId = req.userId;
    const troopId = String(req.body?.troopId || '');
    const amount = Math.max(1, Math.min(500, Math.floor(Number(req.body?.amount) || 10)));
    tickPlayer(userId);
    const def = TROOP_MAP[troopId];
    if (!def) {
        res.status(404).json({ error: 'Unknown troop type.' });
        return;
    }
    const reqBuilding = db
        .prepare('SELECT level FROM buildings WHERE user_id = ? AND type = ?')
        .get(userId, def.buildingReq);
    if (!reqBuilding || reqBuilding.level < def.buildingLevelReq) {
        res.status(400).json({
            error: `Requires ${BUILDING_MAP[def.buildingReq].name} Lv.${def.buildingLevelReq}.`,
        });
        return;
    }
    const existing = db.prepare('SELECT * FROM troops WHERE user_id = ? AND troop_id = ?').get(userId, troopId);
    if (existing?.training_finish_at) {
        res.status(400).json({ error: 'Already training this unit tier. Wait for current batch to complete.' });
        return;
    }
    const totalCost = {
        food: def.cost.food * amount,
        wood: def.cost.wood * amount,
        iron: def.cost.iron * amount,
        gold: def.cost.gold * amount,
    };
    if (!deductResources(userId, totalCost)) {
        res.status(400).json({ error: 'Not enough resources to train these troops.' });
        return;
    }
    const durationSec = Math.max(3, Math.min(180, Math.round(def.trainTimeSec * Math.sqrt(amount) * 1.4)));
    const finishAt = Date.now() + durationSec * 1000;
    db.prepare(`INSERT INTO troops (user_id, troop_id, count, wounded, training_count, training_finish_at)
     VALUES (?, ?, 0, 0, ?, ?)
     ON CONFLICT(user_id, troop_id) DO UPDATE SET training_count = excluded.training_count, training_finish_at = excluded.training_finish_at`).run(userId, troopId, amount, finishAt);
    res.json({ state: getPlayerState(userId) });
});
app.post('/api/troops/heal', requireAuth, (req, res) => {
    const userId = req.userId;
    tickPlayer(userId);
    const woundedRows = db
        .prepare('SELECT troop_id, wounded FROM troops WHERE user_id = ? AND wounded > 0')
        .all(userId);
    if (woundedRows.length === 0) {
        res.status(400).json({ error: 'No wounded troops in the Hospital.' });
        return;
    }
    const cost = { food: 0, wood: 0, iron: 0, gold: 0 };
    for (const w of woundedRows) {
        const def = TROOP_MAP[w.troop_id];
        if (!def)
            continue;
        cost.food += Math.round(def.cost.food * w.wounded * 0.35);
        cost.wood += Math.round(def.cost.wood * w.wounded * 0.25);
        cost.iron += Math.round(def.cost.iron * w.wounded * 0.2);
        cost.gold += Math.round(def.cost.gold * w.wounded * 0.2);
    }
    if (!deductResources(userId, cost)) {
        res.status(400).json({ error: 'Insufficient resources to heal all wounded troops.' });
        return;
    }
    db.prepare('UPDATE troops SET count = count + wounded, wounded = 0 WHERE user_id = ? AND wounded > 0').run(userId);
    recalculatePower(userId);
    res.json({ state: getPlayerState(userId) });
});
// ---------------------------------------------------------------------------
// HEROES & DRAGON FORGE
// ---------------------------------------------------------------------------
app.post('/api/heroes/recruit', requireAuth, (req, res) => {
    const userId = req.userId;
    const heroKey = String(req.body?.heroKey || '');
    const tmpl = HERO_TEMPLATE_MAP[heroKey];
    if (!tmpl) {
        res.status(404).json({ error: 'Hero not found.' });
        return;
    }
    const owned = db.prepare('SELECT id FROM heroes WHERE user_id = ? AND hero_key = ?').get(userId, heroKey);
    if (owned) {
        res.status(400).json({ error: 'Hero already recruited.' });
        return;
    }
    tickPlayer(userId);
    const user = db.prepare('SELECT gold, gems FROM users WHERE id = ?').get(userId);
    if (user.gold < tmpl.recruitCostGold || user.gems < tmpl.recruitCostGems) {
        res.status(400).json({ error: `Need ${tmpl.recruitCostGold} Gold and ${tmpl.recruitCostGems} Gems.` });
        return;
    }
    db.prepare('UPDATE users SET gold = gold - ?, gems = gems - ? WHERE id = ?').run(tmpl.recruitCostGold, tmpl.recruitCostGems, userId);
    db.prepare('INSERT INTO heroes (user_id, hero_key, level, xp, skill_level) VALUES (?, ?, 1, 0, 1)').run(userId, heroKey);
    recalculatePower(userId);
    res.json({ state: getPlayerState(userId) });
});
app.post('/api/heroes/upgrade-skill', requireAuth, (req, res) => {
    const userId = req.userId;
    const heroKey = String(req.body?.heroKey || '');
    const hero = db.prepare('SELECT * FROM heroes WHERE user_id = ? AND hero_key = ?').get(userId, heroKey);
    if (!hero) {
        res.status(404).json({ error: 'Hero not recruited.' });
        return;
    }
    if (hero.skill_level >= 20) {
        res.status(400).json({ error: 'Skill already at max level.' });
        return;
    }
    const goldCost = Math.round(350 * Math.pow(1.45, hero.skill_level - 1));
    if (!deductResources(userId, { food: 0, wood: 0, iron: 0, gold: goldCost })) {
        res.status(400).json({ error: `Need ${goldCost} Gold to upgrade skill.` });
        return;
    }
    db.prepare('UPDATE heroes SET skill_level = skill_level + 1 WHERE id = ?').run(hero.id);
    recalculatePower(userId);
    res.json({ state: getPlayerState(userId) });
});
app.post('/api/heroes/train-xp', requireAuth, (req, res) => {
    const userId = req.userId;
    const heroKey = String(req.body?.heroKey || '');
    const hero = db.prepare('SELECT * FROM heroes WHERE user_id = ? AND hero_key = ?').get(userId, heroKey);
    if (!hero) {
        res.status(404).json({ error: 'Hero not recruited.' });
        return;
    }
    const cost = { food: 450, wood: 0, iron: 0, gold: 250 };
    if (!deductResources(userId, cost)) {
        res.status(400).json({ error: 'Need 450 Food & 250 Gold for Hero Combat Drill.' });
        return;
    }
    grantHeroXp(userId, heroKey, 180);
    recalculatePower(userId);
    res.json({ state: getPlayerState(userId) });
});
app.post('/api/forge/craft', requireAuth, (req, res) => {
    const userId = req.userId;
    const recipeKey = String(req.body?.recipeKey || '');
    const recipe = GEAR_RECIPES.find((r) => r.key === recipeKey);
    if (!recipe) {
        res.status(404).json({ error: 'Gear recipe not found.' });
        return;
    }
    const forge = db.prepare("SELECT level FROM buildings WHERE user_id = ? AND type = 'forge'").get(userId);
    if (!forge || forge.level < recipe.forgeLevelReq) {
        res.status(400).json({ error: `Requires Dragon Forge Lv.${recipe.forgeLevelReq}.` });
        return;
    }
    if (!deductResources(userId, recipe.cost)) {
        res.status(400).json({ error: 'Insufficient resources to forge this gear.' });
        return;
    }
    grantGearDrop(userId, recipe.key);
    res.json({ state: getPlayerState(userId) });
});
app.post('/api/forge/equip', requireAuth, (req, res) => {
    const userId = req.userId;
    const itemId = Number(req.body?.itemId);
    const heroKey = req.body?.heroKey ? String(req.body.heroKey) : null;
    const item = db.prepare('SELECT * FROM gear_items WHERE id = ? AND user_id = ?').get(itemId, userId);
    if (!item) {
        res.status(404).json({ error: 'Gear item not found.' });
        return;
    }
    if (heroKey) {
        const hero = db.prepare('SELECT id FROM heroes WHERE user_id = ? AND hero_key = ?').get(userId, heroKey);
        if (!hero) {
            res.status(404).json({ error: 'Hero not found.' });
            return;
        }
        // Unequip existing item in same slot for that hero
        db.prepare('UPDATE gear_items SET equipped_hero_key = NULL WHERE user_id = ? AND equipped_hero_key = ? AND slot = ?').run(userId, heroKey, item.slot);
    }
    db.prepare('UPDATE gear_items SET equipped_hero_key = ? WHERE id = ?').run(heroKey, itemId);
    recalculatePower(userId);
    res.json({ state: getPlayerState(userId) });
});
// ---------------------------------------------------------------------------
// ACADEMY RESEARCH
// ---------------------------------------------------------------------------
app.post('/api/research/start', requireAuth, (req, res) => {
    const userId = req.userId;
    const techKey = String(req.body?.techKey || '');
    const def = TECH_MAP[techKey];
    if (!def) {
        res.status(404).json({ error: 'Unknown technology.' });
        return;
    }
    tickPlayer(userId);
    const academy = db.prepare("SELECT level FROM buildings WHERE user_id = ? AND type = 'academy'").get(userId);
    if (!academy || academy.level < def.academyReq) {
        res.status(400).json({ error: `Requires Royal Academy Lv.${def.academyReq}.` });
        return;
    }
    const active = db.prepare('SELECT id FROM research WHERE user_id = ? AND finish_at IS NOT NULL').get(userId);
    if (active) {
        res.status(400).json({ error: 'Another technology is already being researched.' });
        return;
    }
    const existing = db.prepare('SELECT * FROM research WHERE user_id = ? AND tech_key = ?').get(userId, techKey);
    const currentLevel = existing?.level ?? 0;
    if (currentLevel >= def.maxLevel) {
        res.status(400).json({ error: 'Technology already mastered.' });
        return;
    }
    const cost = getTechUpgradeCost(techKey, currentLevel);
    if (!deductResources(userId, cost)) {
        res.status(400).json({ error: 'Insufficient resources for this research.' });
        return;
    }
    const durationSec = Math.round(def.baseTimeSec * Math.pow(1.35, currentLevel));
    const finishAt = Date.now() + durationSec * 1000;
    db.prepare(`INSERT INTO research (user_id, tech_key, level, upgrading_to, finish_at)
     VALUES (?, ?, 0, 1, ?)
     ON CONFLICT(user_id, tech_key) DO UPDATE SET upgrading_to = excluded.upgrading_to, finish_at = excluded.finish_at`).run(userId, techKey, finishAt);
    if (existing) {
        db.prepare('UPDATE research SET upgrading_to = ?, finish_at = ? WHERE id = ?').run(currentLevel + 1, finishAt, existing.id);
    }
    res.json({ state: getPlayerState(userId) });
});
app.post('/api/research/speedup', requireAuth, (req, res) => {
    const userId = req.userId;
    const techKey = String(req.body?.techKey || '');
    const r = db
        .prepare('SELECT * FROM research WHERE user_id = ? AND tech_key = ? AND finish_at IS NOT NULL')
        .get(userId, techKey);
    if (!r) {
        res.status(400).json({ error: 'No active research found.' });
        return;
    }
    const user = db.prepare('SELECT speedups, gems FROM users WHERE id = ?').get(userId);
    if (user.speedups > 0) {
        db.prepare('UPDATE users SET speedups = speedups - 1 WHERE id = ?').run(userId);
        db.prepare('UPDATE research SET finish_at = ? WHERE id = ?').run(Date.now(), r.id);
    }
    else if (user.gems >= 15) {
        db.prepare('UPDATE users SET gems = gems - 15 WHERE id = ?').run(userId);
        db.prepare('UPDATE research SET finish_at = ? WHERE id = ?').run(Date.now(), r.id);
    }
    else {
        res.status(400).json({ error: 'Need 1 Speed-up or 15 Gems.' });
        return;
    }
    tickPlayer(userId);
    res.json({ state: getPlayerState(userId) });
});
// ---------------------------------------------------------------------------
// MULTI-LEVEL PvE CAMPAIGN
// ---------------------------------------------------------------------------
app.post('/api/campaign/battle', requireAuth, (req, res) => {
    const userId = req.userId;
    const stageId = Number(req.body?.stageId);
    const heroKey = String(req.body?.heroKey || 'aldric');
    const stage = CAMPAIGN_STAGES.find((s) => s.id === stageId);
    if (!stage) {
        res.status(404).json({ error: 'Campaign stage not found.' });
        return;
    }
    // Must have cleared previous stage
    if (stageId > 1) {
        const prev = db
            .prepare('SELECT stars FROM campaign_progress WHERE user_id = ? AND stage_id = ?')
            .get(userId, stageId - 1);
        if (!prev || prev.stars <= 0) {
            res.status(400).json({ error: `Clear Stage ${stageId - 1} first to unlock this level.` });
            return;
        }
    }
    tickPlayer(userId);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const hero = db.prepare('SELECT * FROM heroes WHERE user_id = ? AND hero_key = ?').get(userId, heroKey);
    if (!hero) {
        res.status(400).json({ error: 'Selected Hero is not recruited.' });
        return;
    }
    const troopRows = db
        .prepare('SELECT troop_id, count FROM troops WHERE user_id = ? AND count > 0')
        .all(userId);
    const army = troopRows.map((t) => ({ troopId: t.troop_id, count: t.count }));
    if (army.length === 0) {
        res.status(400).json({ error: 'Train troops in your Barracks before entering battle!' });
        return;
    }
    const bonuses = getUserTechBonuses(userId);
    const outcome = simulateBattle({
        name: user.username,
        avatar: user.avatar,
        hero: {
            heroKey: hero.hero_key,
            level: hero.level,
            skillLevel: hero.skill_level,
            gearBonus: getHeroGearBonus(userId, hero.hero_key),
        },
        army,
        attackBonusPct: bonuses.atkBonusPct,
        defenseBonusPct: bonuses.defBonusPct,
    }, {
        name: stage.enemyName,
        avatar: stage.enemyAvatar,
        syntheticHeroPower: stage.enemyHeroPower,
        army: stage.enemyArmy,
        isWallDefender: stage.isBoss,
    }, bonuses.hospitalRecoveryRatio);
    // Apply lighter casualties for campaign (40% of normal casualties) so players can progress enjoyably
    for (const [troopId, loss] of Object.entries(outcome.attackerLosses)) {
        const actualLost = Math.floor(loss.lost * 0.4);
        const actualWounded = Math.floor(loss.wounded * 0.5);
        if (actualLost + actualWounded > 0) {
            db.prepare('UPDATE troops SET count = MAX(0, count - ?), wounded = wounded + ? WHERE user_id = ? AND troop_id = ?').run(actualLost + actualWounded, actualWounded, userId, troopId);
        }
    }
    let droppedGear = null;
    let earnedRewards = null;
    if (outcome.victory) {
        const prevClear = db
            .prepare('SELECT stars FROM campaign_progress WHERE user_id = ? AND stage_id = ?')
            .get(userId, stageId);
        const isFirstClear = !prevClear;
        const rewardMult = isFirstClear ? 1 : 0.45; // Repeat farm yields 45%
        earnedRewards = {
            food: Math.round(stage.rewards.food * rewardMult),
            wood: Math.round(stage.rewards.wood * rewardMult),
            iron: Math.round(stage.rewards.iron * rewardMult),
            gold: Math.round(stage.rewards.gold * rewardMult),
            gems: isFirstClear ? stage.rewards.gems : 0,
            heroXp: Math.round(stage.rewards.heroXp * rewardMult),
        };
        db.prepare('UPDATE users SET food = food + ?, wood = wood + ?, iron = iron + ?, gold = gold + ?, gems = gems + ?, kills = kills + ? WHERE id = ?').run(earnedRewards.food, earnedRewards.wood, earnedRewards.iron, earnedRewards.gold, earnedRewards.gems, stage.id * 18, userId);
        grantHeroXp(userId, heroKey, earnedRewards.heroXp);
        if (isFirstClear && stage.rewards.gearDropKey) {
            droppedGear = grantGearDrop(userId, stage.rewards.gearDropKey);
        }
        const bestStars = Math.max(prevClear?.stars ?? 0, outcome.stars);
        db.prepare(`INSERT INTO campaign_progress (user_id, stage_id, stars, cleared_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, stage_id) DO UPDATE SET stars = excluded.stars, cleared_at = excluded.cleared_at`).run(userId, stageId, bestStars, Date.now());
    }
    db.prepare(`INSERT INTO battle_reports (user_id, title, battle_type, victory, summary_json, replay_json, created_at)
     VALUES (?, ?, 'campaign', ?, ?, ?, ?)`).run(userId, `Campaign ${stage.chapter}-${stage.stageNum}: ${stage.name} (${outcome.victory ? `${outcome.stars}★ Victory` : 'Defeat'})`, outcome.victory ? 1 : 0, JSON.stringify({
        stageId: stage.id,
        target: stage.enemyName,
        attackerPower: outcome.attackerPower,
        defenderPower: outcome.defenderPower,
        losses: outcome.attackerLosses,
        stars: outcome.stars,
        loot: earnedRewards,
        droppedGear: droppedGear?.name,
    }), JSON.stringify(outcome.rounds), Date.now());
    recalculatePower(userId);
    res.json({
        outcome,
        stage,
        earnedRewards,
        droppedGear,
        state: getPlayerState(userId),
    });
});
// ---------------------------------------------------------------------------
// WORLD MAP & LIVE MARCHES
// ---------------------------------------------------------------------------
app.get('/api/world', requireAuth, (_req, res) => {
    const tiles = db
        .prepare(`SELECT wt.*, u.username as owner_name, u.power as owner_power, a.tag as alliance_tag
       FROM world_tiles wt
       LEFT JOIN users u ON u.id = wt.owner_id
       LEFT JOIN alliance_members am ON am.user_id = wt.owner_id
       LEFT JOIN alliances a ON a.id = am.alliance_id`)
        .all();
    const marches = db
        .prepare(`SELECT m.*, u.username, a.tag as alliance_tag
       FROM marches m
       JOIN users u ON u.id = m.user_id
       LEFT JOIN alliance_members am ON am.user_id = m.user_id
       LEFT JOIN alliances a ON a.id = am.alliance_id`)
        .all();
    res.json({
        serverTime: Date.now(),
        tiles,
        marches: marches.map((m) => ({ ...m, troops: JSON.parse(m.troops_json || '[]') })),
    });
});
app.post('/api/world/march', requireAuth, (req, res) => {
    const userId = req.userId;
    const toX = Number(req.body?.x);
    const toY = Number(req.body?.y);
    const heroKey = String(req.body?.heroKey || 'aldric');
    const action = String(req.body?.action || 'attack'); // 'gather' | 'attack'
    tickPlayer(userId);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const tile = db.prepare('SELECT * FROM world_tiles WHERE x = ? AND y = ?').get(toX, toY);
    if (!tile) {
        res.status(404).json({ error: 'Target tile is empty plains.' });
        return;
    }
    if (tile.owner_id === userId) {
        res.status(400).json({ error: 'You cannot march against your own holding.' });
        return;
    }
    const activeMarches = db.prepare('SELECT COUNT(*) as c FROM marches WHERE user_id = ?').get(userId);
    if (activeMarches.c >= 3) {
        res.status(400).json({ error: 'Maximum 3 active marches simultaneously.' });
        return;
    }
    // Pull up to 65% of available troops for this march so player can run multiple marches
    const availableTroops = db
        .prepare('SELECT troop_id, count FROM troops WHERE user_id = ? AND count > 0')
        .all(userId);
    if (availableTroops.length === 0) {
        res.status(400).json({ error: 'No available troops in your castle to march!' });
        return;
    }
    const sentTroops = [];
    for (const t of availableTroops) {
        const sendCount = Math.max(1, Math.ceil(t.count * 0.7));
        db.prepare('UPDATE troops SET count = count - ? WHERE user_id = ? AND troop_id = ?').run(sendCount, userId, t.troop_id);
        sentTroops.push({ troopId: t.troop_id, count: sendCount });
    }
    const dist = Math.max(1, Math.hypot(toX - user.castle_x, toY - user.castle_y));
    const bonuses = getUserTechBonuses(userId);
    const travelSec = Math.max(4, Math.min(28, Math.round((dist * 1.15) / (1 + bonuses.marchSpeedPct / 100))));
    const now = Date.now();
    const arriveAt = now + travelSec * 1000;
    const returnAt = arriveAt + travelSec * 1000;
    db.prepare(`INSERT INTO marches (user_id, hero_key, troops_json, from_x, from_y, to_x, to_y, action, status, depart_at, arrive_at, return_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'marching', ?, ?, ?)`).run(userId, heroKey, JSON.stringify(sentTroops), user.castle_x, user.castle_y, toX, toY, action, now, arriveAt, returnAt);
    io.emit('world:dirty');
    res.json({ state: getPlayerState(userId), travelSec });
});
// ---------------------------------------------------------------------------
// ALLIANCES
// ---------------------------------------------------------------------------
app.get('/api/alliances', requireAuth, (_req, res) => {
    const list = db
        .prepare(`SELECT a.*, u.username as leader_name,
        (SELECT COUNT(*) FROM alliance_members WHERE alliance_id = a.id) as member_count,
        (SELECT COALESCE(SUM(u2.power), 0) FROM alliance_members am2 JOIN users u2 ON u2.id = am2.user_id WHERE am2.alliance_id = a.id) as total_power
       FROM alliances a JOIN users u ON u.id = a.leader_id
       ORDER BY total_power DESC`)
        .all();
    res.json({ alliances: list });
});
app.post('/api/alliances/create', requireAuth, (req, res) => {
    const userId = req.userId;
    const tag = String(req.body?.tag || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    const name = String(req.body?.name || '').trim().slice(0, 28);
    const description = String(req.body?.description || 'Forged in blood and glory.').trim().slice(0, 140);
    if (tag.length < 2 || name.length < 3) {
        res.status(400).json({ error: 'Provide a 2–4 letter Tag and an Alliance Name (3+ chars).' });
        return;
    }
    const already = db.prepare('SELECT alliance_id FROM alliance_members WHERE user_id = ?').get(userId);
    if (already) {
        res.status(400).json({ error: 'Leave your current alliance first.' });
        return;
    }
    try {
        const now = Date.now();
        const r = db
            .prepare('INSERT INTO alliances (tag, name, leader_id, description, created_at) VALUES (?, ?, ?, ?, ?)')
            .run(tag, name, userId, description, now);
        db.prepare("INSERT INTO alliance_members (alliance_id, user_id, role, joined_at) VALUES (?, ?, 'Leader', ?)").run(Number(r.lastInsertRowid), userId, now);
        io.emit('world:dirty');
        res.json({ state: getPlayerState(userId) });
    }
    catch {
        res.status(409).json({ error: 'Alliance Tag or Name is already taken.' });
    }
});
app.post('/api/alliances/join', requireAuth, (req, res) => {
    const userId = req.userId;
    const allianceId = Number(req.body?.allianceId);
    const exists = db.prepare('SELECT id FROM alliances WHERE id = ?').get(allianceId);
    if (!exists) {
        res.status(404).json({ error: 'Alliance not found.' });
        return;
    }
    db.prepare('DELETE FROM alliance_members WHERE user_id = ?').run(userId);
    db.prepare("INSERT INTO alliance_members (alliance_id, user_id, role, joined_at) VALUES (?, ?, 'Member', ?)").run(allianceId, userId, Date.now());
    io.emit('world:dirty');
    res.json({ state: getPlayerState(userId) });
});
app.post('/api/alliances/leave', requireAuth, (req, res) => {
    const userId = req.userId;
    db.prepare('DELETE FROM alliance_members WHERE user_id = ?').run(userId);
    io.emit('world:dirty');
    res.json({ state: getPlayerState(userId) });
});
app.post('/api/alliances/help/:helpId', requireAuth, (req, res) => {
    const userId = req.userId;
    const helpId = Number(req.params.helpId);
    const help = db.prepare('SELECT * FROM alliance_helps WHERE id = ?').get(helpId);
    if (!help) {
        res.status(404).json({ error: 'Help request already completed.' });
        return;
    }
    if (help.requester_id === userId) {
        res.status(400).json({ error: 'Cannot help your own build.' });
        return;
    }
    const helpers = JSON.parse(help.helpers_json || '[]');
    if (helpers.includes(userId)) {
        res.status(400).json({ error: 'Already helped this ally.' });
        return;
    }
    helpers.push(userId);
    db.prepare('UPDATE alliance_helps SET helpers_json = ? WHERE id = ?').run(JSON.stringify(helpers), helpId);
    db.prepare('UPDATE buildings SET finish_at = MAX(?, finish_at - 12000) WHERE user_id = ? AND slot_id = ?').run(Date.now(), help.requester_id, help.building_slot);
    // Reward helper with 25 Gold
    db.prepare('UPDATE users SET gold = gold + 25 WHERE id = ?').run(userId);
    notifyUser(help.requester_id);
    res.json({ state: getPlayerState(userId) });
});
// ---------------------------------------------------------------------------
// QUESTS, REPORTS, LEADERBOARD, CHAT
// ---------------------------------------------------------------------------
app.post('/api/quests/claim', requireAuth, (req, res) => {
    const userId = req.userId;
    const questKey = String(req.body?.questKey || '');
    const state = getPlayerState(userId);
    const quest = state?.quests.find((q) => q.key === questKey);
    if (!quest || !quest.completed || quest.claimed) {
        res.status(400).json({ error: 'Quest is not eligible to claim.' });
        return;
    }
    const def = QUESTS.find((q) => q.key === questKey);
    db.prepare('INSERT INTO claimed_quests (user_id, quest_key, claimed_at) VALUES (?, ?, ?)').run(userId, questKey, Date.now());
    db.prepare('UPDATE users SET food = food + ?, wood = wood + ?, iron = iron + ?, gold = gold + ?, gems = gems + ? WHERE id = ?').run(def.reward.food, def.reward.wood, def.reward.iron, def.reward.gold, def.reward.gems, userId);
    res.json({ state: getPlayerState(userId) });
});
app.post('/api/reports/read-all', requireAuth, (req, res) => {
    db.prepare('UPDATE battle_reports SET is_read = 1 WHERE user_id = ?').run(req.userId);
    res.json({ state: getPlayerState(req.userId) });
});
app.get('/api/leaderboard', requireAuth, (_req, res) => {
    const lords = db
        .prepare(`SELECT u.id, u.username, u.avatar, u.power, u.kills, u.monsters_slain, u.castle_x, u.castle_y,
        (SELECT level FROM buildings WHERE user_id = u.id AND type = 'castle') as castle_level,
        a.tag as alliance_tag
       FROM users u
       LEFT JOIN alliance_members am ON am.user_id = u.id
       LEFT JOIN alliances a ON a.id = am.alliance_id
       ORDER BY u.power DESC LIMIT 25`)
        .all();
    const alliances = db
        .prepare(`SELECT a.id, a.tag, a.name,
        (SELECT COUNT(*) FROM alliance_members WHERE alliance_id = a.id) as member_count,
        (SELECT COALESCE(SUM(u.power), 0) FROM alliance_members am JOIN users u ON u.id = am.user_id WHERE am.alliance_id = a.id) as total_power
       FROM alliances a
       ORDER BY total_power DESC LIMIT 15`)
        .all();
    res.json({ lords, alliances });
});
app.get('/api/chat', requireAuth, (req, res) => {
    const member = db.prepare('SELECT alliance_id FROM alliance_members WHERE user_id = ?').get(req.userId);
    const kingdom = db
        .prepare("SELECT * FROM chat_messages WHERE channel = 'kingdom' ORDER BY created_at DESC LIMIT 40")
        .all()
        .reverse();
    const alliance = member
        ? db
            .prepare("SELECT * FROM chat_messages WHERE channel = 'alliance' AND alliance_id = ? ORDER BY created_at DESC LIMIT 40")
            .all(member.alliance_id)
            .reverse()
        : [];
    res.json({ kingdom, alliance });
});
// ---------------------------------------------------------------------------
// SOCKET.IO REALTIME
// ---------------------------------------------------------------------------
io.on('connection', (socket) => {
    const token = String(socket.handshake.auth?.token || '');
    const user = token
        ? db.prepare('SELECT id, username FROM users WHERE token = ?').get(token)
        : undefined;
    if (user) {
        if (!userSockets.has(user.id))
            userSockets.set(user.id, new Set());
        userSockets.get(user.id).add(socket.id);
    }
    socket.on('chat:send', (payload) => {
        if (!user)
            return;
        const text = String(payload?.message || '').trim().slice(0, 260);
        if (!text)
            return;
        const member = db
            .prepare(`SELECT am.alliance_id, a.tag FROM alliance_members am JOIN alliances a ON a.id = am.alliance_id WHERE am.user_id = ?`)
            .get(user.id);
        const channel = payload.channel === 'alliance' && member ? 'alliance' : 'kingdom';
        const now = Date.now();
        const res = db
            .prepare(`INSERT INTO chat_messages (channel, alliance_id, user_id, username, alliance_tag, message, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`)
            .run(channel, channel === 'alliance' ? member.alliance_id : null, user.id, user.username, member?.tag ?? null, text, now);
        const msg = {
            id: Number(res.lastInsertRowid),
            channel,
            alliance_id: channel === 'alliance' ? member.alliance_id : null,
            user_id: user.id,
            username: user.username,
            alliance_tag: member?.tag ?? null,
            message: text,
            created_at: now,
        };
        io.emit('chat:message', msg);
    });
    socket.on('disconnect', () => {
        if (user && userSockets.has(user.id)) {
            userSockets.get(user.id).delete(socket.id);
        }
    });
});
// Serve built frontend in production if present
const distDir = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
    });
}
// Authoritative 1-second server loop for marches
setInterval(() => {
    try {
        tickAllMarches((affectedIds) => {
            for (const uid of affectedIds)
                notifyUser(uid);
            io.emit('world:dirty');
        });
    }
    catch (err) {
        console.error('[OUAGX Loop Error]', err);
    }
}, 1000);
const PORT = Number(process.env.PORT || 4000);
server.listen(PORT, () => {
    console.log(`⚔️  OUAGX Kingdom Server running on http://localhost:${PORT}`);
});
