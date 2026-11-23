import React, { useState } from 'react';
import { BUILDING_MAP, TROOPS, TroopBranch } from '@shared/gameData';
import { Clock, HeartPulse, Shield, Swords } from 'lucide-react';
import { apiRequest, formatNum, formatTimeLeft } from '../api';
import { useI18n } from '../i18n';
import type { PlayerState } from '../types';

interface Props {
  state: PlayerState;
  nowMs: number;
  onStateChange: (s: PlayerState) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

const BRANCH_META: Record<TroopBranch, { label: string; icon: string; counter: string }> = {
  infantry: { label: 'Infantry', icon: '⚔️', counter: 'Counters Cavalry • Weak vs Archers' },
  cavalry: { label: 'Cavalry', icon: '🐎', counter: 'Counters Archers • Weak vs Infantry' },
  archer: { label: 'Archers', icon: '🏹', counter: 'Counters Infantry • Weak vs Cavalry' },
  siege: { label: 'Siege', icon: '💣', counter: 'Destroys Castle Walls • Heavy Load' },
};

export const ArmyView: React.FC<Props> = ({ state, nowMs, onStateChange, onToast }) => {
  const { t } = useI18n();
  const [branch, setBranch] = useState<TroopBranch>('infantry');
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);

  const troopById = Object.fromEntries(state.troops.map((t) => [t.troop_id, t]));
  const buildingLevel = (type: string) => state.buildings.find((b) => b.type === type)?.level ?? 1;

  const totalStanding = state.troops.reduce((s, t) => s + t.count, 0);
  const totalWounded = state.troops.reduce((s, t) => s + t.wounded, 0);

  const trainTroops = async (troopId: string) => {
    const amount = amounts[troopId] || 15;
    setBusy(true);
    try {
      const data = await apiRequest<{ state: PlayerState }>('/api/troops/train', {
        method: 'POST',
        body: JSON.stringify({ troopId, amount }),
      });
      onStateChange(data.state);
      onToast(`Training ${amount} troops!`, 'success');
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const healAll = async () => {
    setBusy(true);
    try {
      const data = await apiRequest<{ state: PlayerState }>('/api/troops/heal', { method: 'POST' });
      onStateChange(data.state);
      onToast('All wounded troops healed and returned to duty!', 'success');
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Summary & War Hospital Banner */}
        <div className="panel-stone panel-gold-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-royal text-2xl font-bold text-amber-200 flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-400" />
              {t('barracksTitle')}
            </h1>
            <p className="text-xs text-slate-400 mt-1">{t('barracksSub')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-950/80 border border-amber-500/25 rounded-xl px-4 py-2 text-xs">
              <div className="text-slate-400 text-[10px] uppercase">{t('standingArmy')}</div>
              <div className="text-base font-bold text-amber-200">{formatNum(totalStanding)}</div>
            </div>

            <div className="bg-slate-950/80 border border-teal-500/35 rounded-xl px-4 py-2 text-xs flex items-center gap-3">
              <div>
                <div className="text-teal-300 text-[10px] uppercase flex items-center gap-1">
                  <HeartPulse className="w-3 h-3" /> {t('warHospital')}
                </div>
                <div className="text-base font-bold text-teal-200">
                  {formatNum(totalWounded)} {t('wounded')}
                </div>
              </div>
              {totalWounded > 0 && (
                <button
                  disabled={busy}
                  onClick={healAll}
                  className="btn-royal px-3 py-2 rounded-lg text-xs font-bold cursor-pointer"
                >
                  {t('healAll')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Branch Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['infantry', 'cavalry', 'archer', 'siege'] as TroopBranch[]).map((b) => {
            const meta = BRANCH_META[b];
            const branchTotal = TROOPS.filter((t) => t.branch === b).reduce(
              (sum, t) => sum + (troopById[t.id]?.count ?? 0),
              0
            );
            return (
              <button
                key={b}
                onClick={() => setBranch(b)}
                className={`panel-stone rounded-xl p-3.5 text-left transition cursor-pointer ${
                  branch === b ? 'border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.2)]' : 'hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{meta.icon}</span>
                  <span className="text-xs font-bold text-amber-300">{formatNum(branchTotal)}</span>
                </div>
                <div className="font-royal text-sm font-bold text-amber-100 mt-1">{meta.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{meta.counter}</div>
              </button>
            );
          })}
        </div>

        {/* Troop Tiers 1–10 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TROOPS.filter((t) => t.branch === branch).map((t) => {
            const owned = troopById[t.id];
            const reqLvl = buildingLevel(t.buildingReq);
            const unlocked = reqLvl >= t.buildingLevelReq;
            const training = Boolean(owned?.training_finish_at && owned.training_finish_at > nowMs);
            const qty = amounts[t.id] || 15;

            return (
              <div
                key={t.id}
                className={`panel-stone rounded-2xl p-4 flex flex-col justify-between ${!unlocked ? 'opacity-60' : ''}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-950/90 border border-amber-500/40 text-amber-300">
                        Tier {t.tier}
                      </span>
                      <h3 className="font-royal text-base font-bold text-amber-100 mt-1">{t.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Owned</div>
                      <div className="text-lg font-bold text-emerald-300">{formatNum(owned?.count ?? 0)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mt-3 text-[11px] bg-slate-950/75 rounded-xl p-2.5 border border-slate-800 text-center">
                    <div>
                      <div className="text-slate-500">ATK</div>
                      <div className="font-bold text-rose-300">{t.attack}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">DEF</div>
                      <div className="font-bold text-sky-300">{t.defense}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">HP</div>
                      <div className="font-bold text-emerald-300">{t.hp}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">PWR</div>
                      <div className="font-bold text-amber-300">{t.power}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  {training ? (
                    <div className="rounded-xl bg-emerald-950/50 border border-emerald-500/40 px-3 py-2.5 flex items-center justify-between text-xs">
                      <span className="text-emerald-200 font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        Training {owned?.training_count} units...
                      </span>
                      <span className="font-mono font-bold text-emerald-300">
                        {formatTimeLeft(owned?.training_finish_at ?? null, nowMs)}
                      </span>
                    </div>
                  ) : !unlocked ? (
                    <div className="text-xs text-amber-300/90 flex items-center gap-1.5 bg-slate-950/70 rounded-xl px-3 py-2 border border-amber-500/20">
                      <Shield className="w-3.5 h-3.5" />
                      Requires {BUILDING_MAP[t.buildingReq].name} Lv.{t.buildingLevelReq} (Current: Lv.{reqLvl})
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={5}
                          max={200}
                          step={5}
                          value={qty}
                          onChange={(e) => setAmounts((prev) => ({ ...prev, [t.id]: Number(e.target.value) }))}
                          className="flex-1 accent-amber-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-amber-200 w-14 text-right">×{qty}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                        <span>🌾 {formatNum(t.cost.food * qty)}</span>
                        <span>🌲 {formatNum(t.cost.wood * qty)}</span>
                        <span>⛏️ {formatNum(t.cost.iron * qty)}</span>
                        <span>💰 {formatNum(t.cost.gold * qty)}</span>
                      </div>

                      <button
                        disabled={busy}
                        onClick={() => trainTroops(t.id)}
                        className="btn-royal w-full py-2.5 rounded-xl font-royal font-bold text-xs cursor-pointer"
                      >
                        Train {qty} {t.name}
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
