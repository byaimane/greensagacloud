import React, { useEffect, useState } from 'react';
import { CAMPAIGN_STAGES, CampaignStage, HERO_TEMPLATE_MAP, getHeroComputedStats } from '@shared/gameData';
import { Flame, Lock, Shield, Skull, Sparkles, Star, Swords, Trophy, X } from 'lucide-react';
import { apiRequest, formatNum } from '../api';
import { useI18n } from '../i18n';
import type { BattleRound, PlayerState } from '../types';

interface Props {
  state: PlayerState;
  onStateChange: (s: PlayerState) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

interface BattleReplayState {
  stage: CampaignStage;
  heroKey: string;
  victory: boolean;
  stars: number;
  attackerPower: number;
  defenderPower: number;
  rounds: BattleRound[];
  earnedRewards: any;
  droppedGear: any;
}

export const CampaignView: React.FC<Props> = ({ state, onStateChange, onToast }) => {
  const { t } = useI18n();
  const [chapter, setChapter] = useState(1);
  const [selectedHero, setSelectedHero] = useState(state.heroes[0]?.hero_key || 'aldric');
  const [busy, setBusy] = useState(false);
  const [replay, setReplay] = useState<BattleReplayState | null>(null);
  const [roundIdx, setRoundIdx] = useState(0);

  const progressMap = Object.fromEntries(state.campaign.map((c) => [c.stage_id, c.stars]));
  const maxCleared = state.campaign.reduce((m, c) => Math.max(m, c.stage_id), 0);
  const totalStars = state.campaign.reduce((s, c) => s + c.stars, 0);

  const chapters = [
    { id: 1, title: 'I. Whispering Woods', theme: 'from-emerald-950/80 to-slate-950' },
    { id: 2, title: 'II. Ironfang Foothills', theme: 'from-sky-950/80 to-slate-950' },
    { id: 3, title: 'III. Cinderpeak Citadel', theme: 'from-orange-950/80 to-slate-950' },
    { id: 4, title: 'IV. Obsidian Abyss', theme: 'from-purple-950/80 to-slate-950' },
  ];

  const visibleStages = CAMPAIGN_STAGES.filter((s) => s.chapter === chapter);
  const totalArmyCount = state.troops.reduce((s, t) => s + t.count, 0);

  // Animate through rounds during battle modal
  useEffect(() => {
    if (!replay) return;
    if (roundIdx >= replay.rounds.length - 1) return;
    const t = setTimeout(() => setRoundIdx((r) => r + 1), 650);
    return () => clearTimeout(t);
  }, [replay, roundIdx]);

  const startBattle = async (stage: CampaignStage) => {
    setBusy(true);
    try {
      const data = await apiRequest<any>('/api/campaign/battle', {
        method: 'POST',
        body: JSON.stringify({ stageId: stage.id, heroKey: selectedHero }),
      });
      onStateChange(data.state);
      setRoundIdx(0);
      setReplay({
        stage,
        heroKey: selectedHero,
        victory: data.outcome.victory,
        stars: data.outcome.stars,
        attackerPower: data.outcome.attackerPower,
        defenderPower: data.outcome.defenderPower,
        rounds: data.outcome.rounds,
        earnedRewards: data.earnedRewards,
        droppedGear: data.droppedGear,
      });
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const currentRound = replay ? replay.rounds[Math.min(roundIdx, replay.rounds.length - 1)] : null;
  const battleDone = replay ? roundIdx >= replay.rounds.length - 1 : false;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header & Formation Bar */}
        <div className="panel-stone panel-gold-border rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-400" />
              <h1 className="font-royal text-2xl font-bold text-amber-200">{t('campaignTitle')}</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">{t('campaignSub')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-950/80 border border-amber-500/25 rounded-xl px-3.5 py-2 text-xs">
              <div className="text-slate-400 text-[10px] uppercase">{t('campaignStars')}</div>
              <div className="font-bold text-amber-300 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {totalStars} / 60
              </div>
            </div>

            <div className="bg-slate-950/80 border border-amber-500/25 rounded-xl px-3.5 py-2 text-xs">
              <div className="text-slate-400 text-[10px] uppercase">{t('standingArmy')}</div>
              <div className="font-bold text-emerald-300">{formatNum(totalArmyCount)}</div>
            </div>

            <div className="bg-slate-950/80 border border-amber-500/35 rounded-xl px-3 py-1.5">
              <div className="text-[10px] uppercase text-amber-300/80">{t('leadHero')}</div>
              <select
                value={selectedHero}
                onChange={(e) => setSelectedHero(e.target.value)}
                className="bg-transparent text-xs font-semibold text-amber-100 focus:outline-none cursor-pointer"
              >
                {state.heroes.map((h) => {
                  const tmpl = HERO_TEMPLATE_MAP[h.hero_key];
                  const stats = tmpl ? getHeroComputedStats(tmpl, h.level, h.skill_level, h.gearBonus) : null;
                  return (
                    <option key={h.hero_key} value={h.hero_key} className="bg-slate-950">
                      {tmpl?.avatar} {tmpl?.name} — Lv.{h.level} (Pwr {stats?.power})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Chapter Selector */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {chapters.map((ch) => {
            const chStages = CAMPAIGN_STAGES.filter((s) => s.chapter === ch.id);
            const chStars = chStages.reduce((acc, s) => acc + (progressMap[s.id] || 0), 0);
            const unlocked = ch.id === 1 || maxCleared >= (ch.id - 1) * 5;
            return (
              <button
                key={ch.id}
                onClick={() => setChapter(ch.id)}
                className={`rounded-2xl p-4 text-left border transition cursor-pointer bg-gradient-to-br ${ch.theme} ${
                  chapter === ch.id
                    ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                    : 'border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-amber-300/80 font-bold">
                    Chapter {ch.id}
                  </span>
                  {!unlocked && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                </div>
                <div className="font-royal text-sm font-bold text-amber-100 mt-1">{ch.title}</div>
                <div className="text-xs text-amber-400/90 mt-2 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400" /> {chStars} / 15 Stars
                </div>
              </button>
            );
          })}
        </div>

        {/* Stages List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleStages.map((stage) => {
            const stars = progressMap[stage.id] || 0;
            const unlocked = stage.id === 1 || maxCleared >= stage.id - 1;

            return (
              <div
                key={stage.id}
                className={`panel-stone rounded-2xl p-4 flex flex-col justify-between transition ${
                  stage.isBoss ? 'border-rose-500/50 shadow-[0_0_22px_rgba(244,63,94,0.12)]' : ''
                } ${!unlocked ? 'opacity-55' : ''}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${
                          stage.isBoss
                            ? 'bg-rose-950/80 border-rose-500/60'
                            : 'bg-slate-900 border-amber-500/30'
                        }`}
                      >
                        {stage.enemyAvatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">
                            Stage {stage.chapter}-{stage.stageNum}
                          </span>
                          {stage.isBoss && (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-900/80 text-rose-200 flex items-center gap-0.5">
                              <Skull className="w-2.5 h-2.5" /> BOSS
                            </span>
                          )}
                        </div>
                        <h3 className="font-royal text-sm font-bold text-amber-100 mt-1">{stage.name}</h3>
                      </div>
                    </div>

                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((n) => (
                        <Star
                          key={n}
                          className={`w-4 h-4 ${
                            n <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Enemy Force</span>
                      <span className="text-slate-200 font-medium">{stage.enemyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Recommended Power</span>
                      <span
                        className={`font-bold ${
                          state.user.power >= stage.recommendedPower ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatNum(stage.recommendedPower)}
                      </span>
                    </div>
                  </div>

                  {/* Rewards Preview */}
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-amber-200">
                      💰 {formatNum(stage.rewards.gold)}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-cyan-300">
                      💎 {stage.rewards.gems}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-purple-300">
                      ✨ +{stage.rewards.heroXp} XP
                    </span>
                    {stage.rewards.gearDropKey && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/50 text-amber-300 font-semibold">
                        ⚔️ Boss Gear Drop
                      </span>
                    )}
                  </div>
                </div>

                <button
                  disabled={busy || !unlocked}
                  onClick={() => startBattle(stage)}
                  className="btn-royal mt-4 w-full py-2.5 rounded-xl font-royal font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {unlocked ? (
                    <>
                      <Swords className="w-4 h-4" />
                      {stars > 0 ? t('battleAgain') : t('launchAssault')}
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" /> {t('locked')}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ANIMATED TACTICAL BATTLE ARENA MODAL */}
      {replay && currentRound && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="panel-stone panel-gold-border rounded-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-950/90 border-b border-amber-500/25 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h2 className="font-royal text-lg font-bold text-amber-200">
                  Battle Arena — {replay.stage.name}
                </h2>
              </div>
              <button
                onClick={() => setReplay(null)}
                className="text-slate-400 hover:text-amber-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Battlefield Stage */}
            <div className="p-5 bg-gradient-to-b from-slate-950 via-[#151825] to-slate-950">
              <div className="grid grid-cols-2 gap-6 items-center">
                {/* Player Side */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-amber-950/60 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                      {HERO_TEMPLATE_MAP[replay.heroKey]?.avatar || state.user.avatar}
                    </div>
                    <div>
                      <div className="font-royal font-bold text-amber-200 text-sm">{state.user.username}</div>
                      <div className="text-[11px] text-slate-400">
                        {HERO_TEMPLATE_MAP[replay.heroKey]?.name} • Pwr {formatNum(replay.attackerPower)}
                      </div>
                    </div>
                  </div>
                  <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                      style={{ width: `${currentRound.attackerHpPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-300 font-bold">{currentRound.attackerHpPct}% Army HP</span>
                    {currentRound.defenderDamage > 0 && (
                      <span className="text-rose-400 font-mono font-bold">-{formatNum(currentRound.defenderDamage)}</span>
                    )}
                  </div>
                </div>

                {/* Enemy Side */}
                <div className="space-y-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <div>
                      <div className="font-royal font-bold text-rose-200 text-sm">{replay.stage.enemyName}</div>
                      <div className="text-[11px] text-slate-400">Power {formatNum(replay.defenderPower)}</div>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border-2 border-rose-500 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                      {replay.stage.enemyAvatar}
                    </div>
                  </div>
                  <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-rose-600 to-orange-500 transition-all duration-500 ml-auto"
                      style={{ width: `${currentRound.defenderHpPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-300 font-mono font-bold">-{formatNum(currentRound.attackerDamage)}</span>
                    <span className="text-rose-300 font-bold">{currentRound.defenderHpPct}% Enemy HP</span>
                  </div>
                </div>
              </div>

              {/* Hero Skill Flash */}
              {currentRound.heroSkillTriggered && (
                <div className="mt-4 rounded-xl bg-amber-500/15 border border-amber-400/60 px-4 py-2 text-center text-xs font-bold text-amber-200 flex items-center justify-center gap-2 animate-pulse">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  HERO SKILL ACTIVATED: {currentRound.heroSkillName}!
                </div>
              )}

              {/* Round-by-round Combat Log */}
              <div className="mt-4 bg-slate-950/90 border border-slate-800 rounded-xl p-3 h-36 overflow-y-auto space-y-1.5 text-xs font-mono">
                {replay.rounds.slice(0, roundIdx + 1).map((r) => (
                  <div
                    key={r.round}
                    className={r.heroSkillTriggered ? 'text-amber-300 font-semibold' : 'text-slate-300'}
                  >
                    {r.log}
                  </div>
                ))}
              </div>

              {/* Outcome & Rewards */}
              {battleDone && (
                <div className="mt-4 pt-4 border-t border-amber-500/25">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {replay.victory ? (
                        <Trophy className="w-9 h-9 text-amber-400" />
                      ) : (
                        <Shield className="w-9 h-9 text-rose-400" />
                      )}
                      <div>
                        <div
                          className={`font-royal text-xl font-extrabold ${
                            replay.victory ? 'text-amber-300' : 'text-rose-400'
                          }`}
                        >
                          {replay.victory ? 'GLORIOUS VICTORY!' : 'ARMY REPELLED'}
                        </div>
                        {replay.victory && (
                          <div className="flex items-center gap-1 mt-0.5">
                            {[1, 2, 3].map((n) => (
                              <Star
                                key={n}
                                className={`w-4 h-4 ${
                                  n <= replay.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {replay.victory && replay.earnedRewards && (
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700">
                          🌾 +{formatNum(replay.earnedRewards.food)}
                        </span>
                        <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700">
                          🌲 +{formatNum(replay.earnedRewards.wood)}
                        </span>
                        <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700">
                          💰 +{formatNum(replay.earnedRewards.gold)}
                        </span>
                        {replay.earnedRewards.gems > 0 && (
                          <span className="px-2 py-1 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                            💎 +{replay.earnedRewards.gems}
                          </span>
                        )}
                        <span className="px-2 py-1 rounded bg-purple-950 border border-purple-500/40 text-purple-200">
                          ✨ +{replay.earnedRewards.heroXp} XP
                        </span>
                      </div>
                    )}
                  </div>

                  {replay.droppedGear && (
                    <div className="mt-3 rounded-xl bg-amber-950/60 border border-amber-400/60 p-2.5 text-xs text-amber-200 text-center font-semibold">
                      🎁 BOSS DROP OBTAINED: {replay.droppedGear.icon} {replay.droppedGear.name} ({replay.droppedGear.rarity}) — Equip it in Heroes & Forge!
                    </div>
                  )}

                  <button
                    onClick={() => setReplay(null)}
                    className="btn-royal mt-4 w-full py-2.5 rounded-xl font-royal font-bold text-sm cursor-pointer"
                  >
                    Continue Conquest
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
