import React, { useState } from 'react';
import { TECHNOLOGIES, TechBranch, getTechUpgradeCost } from '@shared/gameData';
import { BookOpen, Clock, FastForward, Lock } from 'lucide-react';
import { apiRequest, formatNum, formatTimeLeft } from '../api';
import { useI18n } from '../i18n';
import type { PlayerState } from '../types';

interface Props {
  state: PlayerState;
  nowMs: number;
  onStateChange: (s: PlayerState) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AcademyView: React.FC<Props> = ({ state, nowMs, onStateChange, onToast }) => {
  const { t } = useI18n();
  const [branch, setBranch] = useState<TechBranch>('economy');
  const [busy, setBusy] = useState(false);

  const academyLevel = state.buildings.find((b) => b.type === 'academy')?.level ?? 1;
  const techMap = Object.fromEntries(state.research.map((r) => [r.tech_key, r]));

  const startResearch = async (techKey: string) => {
    setBusy(true);
    try {
      const data = await apiRequest<{ state: PlayerState }>('/api/research/start', {
        method: 'POST',
        body: JSON.stringify({ techKey }),
      });
      onStateChange(data.state);
      onToast('Royal Scholars began researching!', 'success');
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const speedupResearch = async (techKey: string) => {
    setBusy(true);
    try {
      const data = await apiRequest<{ state: PlayerState }>('/api/research/speedup', {
        method: 'POST',
        body: JSON.stringify({ techKey }),
      });
      onStateChange(data.state);
      onToast('Research completed!', 'success');
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="panel-stone panel-gold-border rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="font-royal text-2xl font-bold text-amber-200 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-400" />
              {t('academyTitle')} (Lv.{academyLevel})
            </h1>
            <p className="text-xs text-slate-400 mt-1">{t('academySub')}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300">
              Eco +{state.bonuses.foodWoodPct}% / +{state.bonuses.ironGoldPct}%
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-rose-300">
              Army ATK +{state.bonuses.atkBonusPct}%
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-sky-300">
              City DEF +{state.bonuses.cityDefensePct}%
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {([
            ['economy', `🌾 ${t('branchEconomy')}`],
            ['military', `⚔️ ${t('branchMilitary')}`],
            ['defense', `🛡️ ${t('branchDefense')}`],
          ] as [TechBranch, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setBranch(key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                branch === key
                  ? 'bg-amber-600/90 border-amber-300 text-amber-50'
                  : 'panel-stone text-slate-300 hover:border-amber-400/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TECHNOLOGIES.filter((t) => t.branch === branch).map((tech) => {
            const cur = techMap[tech.key];
            const lvl = cur?.level ?? 0;
            const researching = Boolean(cur?.finish_at && cur.finish_at > nowMs);
            const locked = academyLevel < tech.academyReq;
            const cost = getTechUpgradeCost(tech.key, lvl);

            return (
              <div key={tech.key} className="panel-stone rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-950 border border-sky-500/40 flex items-center justify-center text-2xl">
                        {tech.icon}
                      </div>
                      <div>
                        <h3 className="font-royal font-bold text-sm text-amber-100">{tech.name}</h3>
                        <div className="text-xs text-sky-300 font-semibold">
                          Level {lvl} / {tech.maxLevel}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-3">{tech.description}</p>
                  <div className="mt-2 text-xs text-emerald-400 font-semibold">
                    Current Bonus: +{lvl * tech.effectPerLevelPct}%
                  </div>

                  <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-amber-400"
                      style={{ width: `${(lvl / tech.maxLevel) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800">
                  {researching ? (
                    <div className="space-y-2">
                      <div className="rounded-xl bg-sky-950/60 border border-sky-400/50 px-3 py-2 flex items-center justify-between text-xs">
                        <span className="text-sky-200 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-spin" /> Researching Lv.{cur?.upgrading_to}
                        </span>
                        <span className="font-mono font-bold text-sky-300">
                          {formatTimeLeft(cur?.finish_at ?? null, nowMs)}
                        </span>
                      </div>
                      <button
                        disabled={busy}
                        onClick={() => speedupResearch(tech.key)}
                        className="btn-royal w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FastForward className="w-3.5 h-3.5" /> Speed Up Research
                      </button>
                    </div>
                  ) : lvl >= tech.maxLevel ? (
                    <div className="text-center text-xs font-bold text-amber-300 py-2">Mastered</div>
                  ) : locked ? (
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 py-2">
                      <Lock className="w-3.5 h-3.5" /> Requires Royal Academy Lv.{tech.academyReq}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                        <span>🌾 {formatNum(cost.food)}</span>
                        <span>🌲 {formatNum(cost.wood)}</span>
                        <span>⛏️ {formatNum(cost.iron)}</span>
                        <span>💰 {formatNum(cost.gold)}</span>
                      </div>
                      <button
                        disabled={busy}
                        onClick={() => startResearch(tech.key)}
                        className="btn-royal w-full py-2.5 rounded-xl font-royal font-bold text-xs cursor-pointer"
                      >
                        Research Level {lvl + 1}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
