import { HERO_TEMPLATE_MAP, TROOP_MAP, getHeroComputedStats, } from '../shared/gameData.js';
function getDominantBranch(army) {
    const totals = { infantry: 0, cavalry: 0, archer: 0, siege: 0 };
    for (const u of army) {
        const def = TROOP_MAP[u.troopId];
        if (def && u.count > 0)
            totals[def.branch] += u.count * def.power;
    }
    let best = null;
    let max = 0;
    for (const b of ['infantry', 'cavalry', 'archer', 'siege']) {
        if (totals[b] > max) {
            max = totals[b];
            best = b;
        }
    }
    return best;
}
function getCounterBonus(att, def, isWallDefender) {
    if (!att)
        return { mult: 1 };
    if (att === 'siege' && isWallDefender)
        return { mult: 1.25, label: 'Siege shattered Fortress Walls (+25%)' };
    if (!def)
        return { mult: 1 };
    if (att === 'infantry' && def === 'cavalry')
        return { mult: 1.18, label: 'Infantry countered Cavalry (+18%)' };
    if (att === 'cavalry' && def === 'archer')
        return { mult: 1.18, label: 'Cavalry flanked Archers (+18%)' };
    if (att === 'archer' && def === 'infantry')
        return { mult: 1.18, label: 'Archers volleyed Infantry (+18%)' };
    return { mult: 1 };
}
function computeSideTotals(side) {
    let totalAtk = 0;
    let totalDef = 0;
    let totalHp = 0;
    let totalPower = 0;
    let heroSkillName;
    let heroSkillMult = 1.6;
    let heroBranchBonus = null;
    let heroBranchPct = 0;
    if (side.hero) {
        const tmpl = HERO_TEMPLATE_MAP[side.hero.heroKey];
        if (tmpl) {
            const stats = getHeroComputedStats(tmpl, side.hero.level, side.hero.skillLevel, side.hero.gearBonus);
            totalAtk += stats.attack * 2.2;
            totalDef += stats.defense * 1.8;
            totalHp += stats.hp * 2.5;
            totalPower += stats.power;
            heroSkillName = tmpl.skillName;
            heroSkillMult = stats.skillPower;
            heroBranchBonus = tmpl.armyBonusBranch;
            heroBranchPct = tmpl.armyBonusPct;
        }
    }
    else if (side.syntheticHeroPower) {
        totalAtk += side.syntheticHeroPower * 0.48;
        totalDef += side.syntheticHeroPower * 0.35;
        totalHp += side.syntheticHeroPower * 1.45;
        totalPower += side.syntheticHeroPower;
    }
    for (const unit of side.army) {
        if (unit.count <= 0)
            continue;
        const def = TROOP_MAP[unit.troopId];
        if (!def)
            continue;
        const branchMult = heroBranchBonus === def.branch ? 1 + heroBranchPct / 100 : 1;
        totalAtk += def.attack * unit.count * branchMult;
        totalDef += def.defense * unit.count * branchMult;
        totalHp += def.hp * unit.count * branchMult;
        totalPower += def.power * unit.count;
    }
    const atkMod = 1 + (side.attackBonusPct ?? 0) / 100;
    const defMod = 1 + (side.defenseBonusPct ?? 0) / 100;
    return {
        atk: Math.max(10, Math.round(totalAtk * atkMod)),
        def: Math.max(10, Math.round(totalDef * defMod)),
        hp: Math.max(100, Math.round(totalHp * defMod)),
        power: Math.round(totalPower),
        heroSkillName,
        heroSkillMult,
        dominantBranch: getDominantBranch(side.army),
    };
}
export function simulateBattle(attacker, defender, hospitalRecoveryRatio = 0.65) {
    const att = computeSideTotals(attacker);
    const def = computeSideTotals(defender);
    const attCounter = getCounterBonus(att.dominantBranch, def.dominantBranch, defender.isWallDefender);
    const defCounter = getCounterBonus(def.dominantBranch, att.dominantBranch, false);
    let attHp = att.hp;
    let defHp = def.hp;
    const maxAttHp = att.hp;
    const maxDefHp = def.hp;
    const rounds = [];
    const maxRounds = 8;
    for (let r = 1; r <= maxRounds; r++) {
        const attRatio = Math.max(0.2, attHp / maxAttHp);
        const defRatio = Math.max(0.2, defHp / maxDefHp);
        const skillCast = Boolean(att.heroSkillName) && (r === 2 || r === 5);
        const skillBoost = skillCast ? att.heroSkillMult : 1;
        const varianceA = 0.92 + Math.random() * 0.16;
        const varianceD = 0.92 + Math.random() * 0.16;
        const rawAttDmg = (att.atk * attRatio * attCounter.mult * skillBoost * varianceA) / (1 + def.def / (att.atk * 1.6 + 150));
        const rawDefDmg = (def.atk * defRatio * defCounter.mult * varianceD) / (1 + att.def / (def.atk * 1.6 + 150));
        const attDmg = Math.max(12, Math.round(rawAttDmg * 0.85));
        const defDmg = Math.max(8, Math.round(rawDefDmg * 0.78));
        defHp = Math.max(0, defHp - attDmg);
        if (defHp > 0) {
            attHp = Math.max(0, attHp - defDmg);
        }
        const attHpPct = Math.max(0, Math.round((attHp / maxAttHp) * 100));
        const defHpPct = Math.max(0, Math.round((defHp / maxDefHp) * 100));
        let log = `Round ${r}: ${attacker.name} dealt ${attDmg.toLocaleString()} dmg`;
        if (skillCast && att.heroSkillName) {
            log = `Round ${r}: ⚡ ${att.heroSkillName} triggered! Dealt ${attDmg.toLocaleString()} devastating dmg!`;
        }
        if (defHp > 0) {
            log += ` | ${defender.name} struck back for ${defDmg.toLocaleString()} dmg.`;
        }
        else {
            log += ` | ${defender.name}'s army collapsed!`;
        }
        rounds.push({
            round: r,
            attackerDamage: attDmg,
            defenderDamage: defHp > 0 ? defDmg : 0,
            attackerHpPct: attHpPct,
            defenderHpPct: defHpPct,
            heroSkillTriggered: skillCast,
            heroSkillName: skillCast ? att.heroSkillName : undefined,
            counterAdvantage: r === 1 ? attCounter.label : undefined,
            log,
        });
        if (defHp <= 0 || attHp <= 0)
            break;
    }
    const victory = defHp <= 0 || attHp / maxAttHp > defHp / maxDefHp;
    const attHpLeftRatio = attHp / maxAttHp;
    let stars = 0;
    if (victory) {
        stars = attHpLeftRatio >= 0.7 ? 3 : attHpLeftRatio >= 0.35 ? 2 : 1;
    }
    // Calculate casualties (moderate in PvE/world so game stays fun and tactical; hospital saves wounded)
    const damageTakenRatio = Math.min(0.65, Math.max(0.03, (1 - attHpLeftRatio) * (victory ? 0.38 : 0.6)));
    const attackerLosses = {};
    for (const unit of attacker.army) {
        if (unit.count <= 0)
            continue;
        const totalCasualties = Math.min(unit.count, Math.floor(unit.count * damageTakenRatio));
        if (totalCasualties > 0) {
            const wounded = Math.round(totalCasualties * Math.min(0.92, hospitalRecoveryRatio));
            const lost = Math.max(0, totalCasualties - wounded);
            attackerLosses[unit.troopId] = { lost, wounded };
        }
    }
    return {
        victory,
        stars,
        attackerPower: att.power,
        defenderPower: def.power,
        attackerLosses,
        defenderRemainingRatio: defHp / maxDefHp,
        rounds,
    };
}
