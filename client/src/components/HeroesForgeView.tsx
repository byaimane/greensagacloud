import React, { useState } from 'react';
import {
  GEAR_RECIPES,
  GearSlot,
  HERO_TEMPLATES,
  HERO_TEMPLATE_MAP,
  getHeroComputedStats,
  getHeroXpForNextLevel,
} from '@shared/gameData';
import { Anvil, Crown, Shield, Sparkles, Swords, UserPlus, Zap } from 'lucide-react';
import { apiRequest, formatNum } from '../api';
import { useI18n } from '../i18n';
import type { PlayerState } from '../types';

interface Props {
  state: PlayerState;
  onStateChange: (s: PlayerState) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const HeroesForgeView: React.FC<Props> = ({ state, onStateChange, onToast }) => {
  const { t } = useI18n();
  const [subTab, setSubTab] = useState<'heroes' | 'forge'>('heroes');
  const [selectedHeroKey, setSelectedHeroKey] = useState<string>(state.heroes[0]?.hero_key || 'aldric');
  const [busy, setBusy] = useState(false);

  const ownedMap = Object.fromEntries(state.heroes.map((h) => [h.hero_key, h]));
  const forgeLevel = state.buildings.find((b) => b.type === 'forge')?.level ?? 1;

  const callAction = async (url: string, body: any, successMsg: string) => {
    setBusy(true);
    try {
      const data = await apiRequest<{ state: PlayerState }>(url, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      onStateChange(data.state);
      onToast(successMsg, 'success');
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const selectedOwned = ownedMap[selectedHeroKey];
  const selectedTmpl = HERO_TEMPLATE_MAP[selectedHeroKey] || HERO_TEMPLATES[0];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Top Switcher */}
        <div className="panel-stone panel-gold-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-royal text-2xl font-bold text-amber-200 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              {t('heroesTitle')}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">{t('heroesSub')}</p>
          </div>
          <div className="flex gap-2 bg-slate-950/80 p-1 rounded-xl border border-amber-500/25">
            <button
              onClick={() => setSubTab('heroes')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                subTab === 'heroes' ? 'bg-amber-600 text-amber-50' : 'text-slate-400 hover:text-amber-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> {t('tabHeroesSub')} ({state.heroes.length}/{HERO_TEMPLATES.length})
            </button>
            <button
              onClick={() => setSubTab('forge')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                subTab === 'forge' ? 'bg-amber-600 text-amber-50' : 'text-slate-400 hover:text-amber-200'
              }`}
            >
              <Anvil className="w-3.5 h-3.5" /> {t('tabForgeSub')} (Lv.{forgeLevel})
            </button>
          </div>
        </div>

        {subTab === 'heroes' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Hero Roster */}
            <div className="lg:col-span-5 space-y-2.5">
              {HERO_TEMPLATES.map((tmpl) => {
                const owned = ownedMap[tmpl.key];
                const isSel = selectedHeroKey === tmpl.key;
                return (
                  <button
                    key={tmpl.key}
                    onClick={() => setSelectedHeroKey(tmpl.key)}
                    className={`w-full panel-stone rounded-xl p-3 flex items-center gap-3 text-left transition cursor-pointer border rarity-${tmpl.rarity} ${
                      isSel ? 'ring-2 ring-amber-400/80 bg-slate-900' : 'opacity-90 hover:opacity-100'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-current flex items-center justify-center text-2xl shrink-0">
                      {tmpl.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-royal font-bold text-sm text-amber-100 truncate">{tmpl.name}</span>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-950/90 border border-current">
                          {tmpl.rarity}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">{tmpl.title} • {tmpl.heroClass}</div>
                      <div className="text-[11px] mt-1">
                        {owned ? (
                          <span className="text-emerald-400 font-semibold">
                            Recruited • Level {owned.level} • Skill Lv.{owned.skill_level}
                          </span>
                        ) : (
                          <span className="text-amber-300">
                            Recruit: 💰 {formatNum(tmpl.recruitCostGold)}
                            {tmpl.recruitCostGems > 0 ? ` + 💎 ${tmpl.recruitCostGems}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Hero Sheet */}
            <div className="lg:col-span-7 panel-stone panel-gold-border rounded-2xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-20 h-20 rounded-2xl bg-slate-950 border-2 flex items-center justify-center text-5xl rarity-${selectedTmpl.rarity}`}
                  >
                    {selectedTmpl.avatar}
                  </div>
                  <div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider rarity-${selectedTmpl.rarity}`}>
                      {selectedTmpl.rarity} {selectedTmpl.heroClass}
                    </span>
                    <h2 className="font-royal text-2xl font-bold text-amber-100">{selectedTmpl.name}</h2>
                    <div className="text-xs text-slate-400">{selectedTmpl.title}</div>
                    <div className="text-xs text-emerald-400 mt-1 font-medium">
                      Army Aura: +{selectedTmpl.armyBonusPct}% {selectedTmpl.armyBonusBranch.toUpperCase()} Stats
                    </div>
                  </div>
                </div>

                {!selectedOwned && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      callAction('/api/heroes/recruit', { heroKey: selectedTmpl.key }, `${selectedTmpl.name} joined your Kingdom!`)
                    }
                    className="btn-royal px-5 py-3 rounded-xl font-royal font-bold text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Recruit Hero
                  </button>
                )}
              </div>

              {(() => {
                const lvl = selectedOwned?.level ?? 1;
                const skillLvl = selectedOwned?.skill_level ?? 1;
                const gearBonus = selectedOwned?.gearBonus ?? { attack: 0, defense: 0, hp: 0 };
                const stats = getHeroComputedStats(selectedTmpl, lvl, skillLvl, gearBonus);
                const xpNext = getHeroXpForNextLevel(lvl);
                const skillGoldCost = Math.round(350 * Math.pow(1.45, skillLvl - 1));

                return (
                  <>
                    {/* XP Bar */}
                    {selectedOwned && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-amber-200">Level {lvl} / 100</span>
                          <span className="text-purple-300 font-mono">
                            XP: {selectedOwned.xp} / {xpNext}
                          </span>
                        </div>
                        <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-amber-400"
                            style={{ width: `${Math.min(100, (selectedOwned.xp / xpNext) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Combat Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-950/75 rounded-xl p-3 border border-slate-800">
                        <div className="text-slate-400 flex items-center gap-1">
                          <Swords className="w-3.5 h-3.5 text-rose-400" /> Attack
                        </div>
                        <div className="text-lg font-bold text-amber-100 mt-0.5">{formatNum(stats.attack)}</div>
                      </div>
                      <div className="bg-slate-950/75 rounded-xl p-3 border border-slate-800">
                        <div className="text-slate-400 flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-sky-400" /> Defense
                        </div>
                        <div className="text-lg font-bold text-amber-100 mt-0.5">{formatNum(stats.defense)}</div>
                      </div>
                      <div className="bg-slate-950/75 rounded-xl p-3 border border-slate-800">
                        <div className="text-slate-400">❤️ Vitality</div>
                        <div className="text-lg font-bold text-emerald-300 mt-0.5">{formatNum(stats.hp)}</div>
                      </div>
                      <div className="bg-slate-950/75 rounded-xl p-3 border border-amber-500/30">
                        <div className="text-amber-300">⚡ Hero Power</div>
                        <div className="text-lg font-bold text-amber-300 mt-0.5">{formatNum(stats.power)}</div>
                      </div>
                    </div>

                    {/* Active Skill Box */}
                    <div className="rounded-xl bg-slate-950/80 border border-amber-500/25 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            <Zap className="w-4 h-4" />
                            {selectedTmpl.skillName} (Lv.{skillLvl})
                          </div>
                          <p className="text-xs text-slate-300 mt-1">{selectedTmpl.skillDescription}</p>
                          <div className="text-[11px] text-amber-400/90 mt-1 font-semibold">
                            Damage Multiplier: {stats.skillPower}x
                          </div>
                        </div>

                        {selectedOwned && (
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              disabled={busy}
                              onClick={() =>
                                callAction(
                                  '/api/heroes/upgrade-skill',
                                  { heroKey: selectedTmpl.key },
                                  `${selectedTmpl.skillName} upgraded!`
                                )
                              }
                              className="btn-royal px-3 py-2 rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              Upgrade (💰 {formatNum(skillGoldCost)})
                            </button>
                            <button
                              disabled={busy}
                              onClick={() =>
                                callAction(
                                  '/api/heroes/train-xp',
                                  { heroKey: selectedTmpl.key },
                                  '+180 Hero XP gained from Combat Drill!'
                                )
                              }
                              className="btn-steel px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer"
                            >
                              Combat Drill (+180 XP)
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 4 Equipment Slots */}
                    {selectedOwned && (
                      <div>
                        <h3 className="text-xs uppercase tracking-wider font-bold text-amber-300 mb-2.5">
                          Equipped Battle Gear
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {(['weapon', 'armor', 'ring', 'relic'] as GearSlot[]).map((slot) => {
                            const equipped = state.gear.find(
                              (g) => g.equipped_hero_key === selectedHeroKey && g.slot === slot
                            );
                            return (
                              <div
                                key={slot}
                                className={`rounded-xl p-3 bg-slate-950/80 border text-center ${
                                  equipped ? `rarity-${equipped.rarity}` : 'border-slate-800 border-dashed'
                                }`}
                              >
                                <div className="text-[10px] uppercase text-slate-500 font-semibold">{slot}</div>
                                {equipped ? (
                                  <>
                                    <div className="text-2xl my-1">{equipped.icon}</div>
                                    <div className="text-xs font-bold text-amber-100 truncate">{equipped.name}</div>
                                    <div className="text-[10px] text-emerald-400 mt-0.5">
                                      +{equipped.attack_bonus} ATK / +{equipped.defense_bonus} DEF
                                    </div>
                                    <button
                                      disabled={busy}
                                      onClick={() =>
                                        callAction(
                                          '/api/forge/equip',
                                          { itemId: equipped.id, heroKey: null },
                                          'Gear unequipped.'
                                        )
                                      }
                                      className="mt-2 text-[10px] text-slate-400 hover:text-rose-300 underline cursor-pointer"
                                    >
                                      Unequip
                                    </button>
                                  </>
                                ) : (
                                  <div className="py-4 text-[11px] text-slate-500">Empty Slot</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        ) : (
          /* DRAGON FORGE & INVENTORY */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 space-y-3">
              <h2 className="font-royal text-base font-bold text-amber-200">Forge Blueprints</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GEAR_RECIPES.map((r) => {
                  const locked = forgeLevel < r.forgeLevelReq;
                  return (
                    <div key={r.key} className={`panel-stone rounded-xl p-4 border rarity-${r.rarity}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-11 h-11 rounded-xl bg-slate-950 border border-current flex items-center justify-center text-2xl">
                            {r.icon}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-amber-100">{r.name}</div>
                            <div className="text-[10px] uppercase font-bold">
                              {r.rarity} • {r.slot}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300">
                          Forge Lv.{r.forgeLevelReq}
                        </span>
                      </div>

                      <div className="mt-3 text-xs text-emerald-300 font-medium">
                        +{r.attackBonus} ATK • +{r.defenseBonus} DEF • +{r.hpBonus} HP
                      </div>

                      <div className="mt-2 text-[11px] text-slate-400 flex flex-wrap gap-2">
                        <span>🌾 {formatNum(r.cost.food)}</span>
                        <span>🌲 {formatNum(r.cost.wood)}</span>
                        <span>⛏️ {formatNum(r.cost.iron)}</span>
                        <span>💰 {formatNum(r.cost.gold)}</span>
                      </div>

                      <button
                        disabled={busy || locked}
                        onClick={() => callAction('/api/forge/craft', { recipeKey: r.key }, `Forged ${r.name}!`)}
                        className="btn-royal mt-3 w-full py-2 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        {locked ? `Requires Dragon Forge Lv.${r.forgeLevelReq}` : 'Forge Gear'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-3">
              <h2 className="font-royal text-base font-bold text-amber-200">
                Armory Inventory ({state.gear.length})
              </h2>
              {state.gear.length === 0 ? (
                <div className="panel-stone rounded-xl p-6 text-center text-xs text-slate-400">
                  No forged gear yet. Craft your first weapon on the left or defeat Campaign Bosses!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {state.gear.map((item) => (
                    <div
                      key={item.id}
                      className={`panel-stone rounded-xl p-3 border rarity-${item.rarity} flex items-center justify-between gap-2`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl">{item.icon}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-amber-100 truncate">{item.name}</div>
                          <div className="text-[10px] text-emerald-400">
                            +{item.attack_bonus} ATK / +{item.defense_bonus} DEF / +{item.hp_bonus} HP
                          </div>
                        </div>
                      </div>
                      <select
                        value={item.equipped_hero_key || ''}
                        disabled={busy}
                        onChange={(e) =>
                          callAction(
                            '/api/forge/equip',
                            { itemId: item.id, heroKey: e.target.value || null },
                            e.target.value ? 'Gear equipped to Hero!' : 'Gear unequipped.'
                          )
                        }
                        className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-[11px] text-amber-100 cursor-pointer"
                      >
                        <option value="">Unequipped</option>
                        {state.heroes.map((h) => (
                          <option key={h.hero_key} value={h.hero_key}>
                            {HERO_TEMPLATE_MAP[h.hero_key]?.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
