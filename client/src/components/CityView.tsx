import React, { useState } from 'react';
import {
  BUILDINGS,
  BUILDING_MAP,
  getBuildingUpgradeCost,
  getBuildingUpgradeTimeSec,
  getResourceProductionPerHour,
} from '@shared/gameData';
import {
  ArrowUpCircle,
  Clock,
  FastForward,
  Gem,
  Handshake,
  Hammer,
  X,
  ExternalLink,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { apiRequest, formatNum, formatTimeLeft } from '../api';
import { useI18n } from '../i18n';
import type { BuildingState, GameTab, PlayerState } from '../types';

interface Props {
  state: PlayerState;
  nowMs: number;
  onStateChange: (s: PlayerState) => void;
  onNavigate: (tab: GameTab) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

const FOREST_TREES: [number, number, number][] = [
  [48, 70, 1.1], [86, 62, 0.95], [135, 52, 1.15], [195, 48, 0.9], [250, 58, 1.0],
  [760, 56, 1.05], [815, 48, 1.15], [875, 58, 0.95], [935, 65, 1.15], [960, 145, 1.0],
  [45, 165, 1.1], [65, 315, 1.15], [42, 470, 1.2], [85, 535, 1.05], [150, 565, 1.1],
  [215, 575, 0.95], [275, 585, 0.9], [740, 580, 1.0], [810, 565, 1.15], [885, 545, 1.1],
  [948, 495, 1.2], [952, 330, 1.1], [930, 185, 1.0], [220, 168, 0.9], [782, 168, 0.9],
];

export const CityView: React.FC<Props> = ({ state, nowMs, onStateChange, onNavigate, onToast }) => {
  const { t } = useI18n();
  const [selectedSlot, setSelectedSlot] = useState<string | null>('castle');
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState(false);

  const buildingBySlot = Object.fromEntries(state.buildings.map((b) => [b.slot_id, b]));
  const selectedBuilding: BuildingState | undefined = selectedSlot ? buildingBySlot[selectedSlot] : undefined;
  const selectedDef = selectedBuilding ? BUILDING_MAP[selectedBuilding.type] : undefined;

  const activeQueues = state.buildings.filter((b) => b.finish_at && b.finish_at > nowMs);

  const handleUpgrade = async (slotId: string) => {
    setBusy(true);
    try {
      const data = await apiRequest<{ state: PlayerState }>('/api/buildings/upgrade', {
        method: 'POST',
        body: JSON.stringify({ slotId }),
      });
      onStateChange(data.state);
      onToast('Construction started!', 'success');
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSpeedup = async (slotId: string, mode: 'speedup' | 'gems') => {
    setBusy(true);
    try {
      const data = await apiRequest<{ state: PlayerState }>('/api/buildings/speedup', {
        method: 'POST',
        body: JSON.stringify({ slotId, mode }),
      });
      onStateChange(data.state);
      onToast(mode === 'speedup' ? 'Speed-up used!' : 'Completed with Gems!', 'success');
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRequestHelp = async (slotId: string) => {
    setBusy(true);
    try {
      const data = await apiRequest<{ state: PlayerState }>('/api/buildings/request-help', {
        method: 'POST',
        body: JSON.stringify({ slotId }),
      });
      onStateChange(data.state);
      onToast('Alliance Help requested!', 'success');
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const getShortcutTab = (type: string): { label: string; tab: GameTab } | null => {
    if (['barracks', 'archery', 'stables', 'siege_workshop', 'hospital'].includes(type)) {
      return { label: type === 'hospital' ? t('warHospital') : t('tabArmy'), tab: 'army' };
    }
    if (type === 'academy') return { label: t('academyTitle'), tab: 'academy' };
    if (type === 'forge') return { label: t('tabForgeSub'), tab: 'heroes' };
    if (type === 'alliance_hall') return { label: t('tabAlliance'), tab: 'alliance' };
    return null;
  };

  return (
    <div className="relative w-full h-full flex overflow-hidden">
      {/* Interactive Medieval City Panorama */}
      <div className="relative flex-1 overflow-auto bg-[#173021] grid place-items-center p-4">
        {/* Zoom Controls & Active Queue Pill */}
        <div className="absolute top-3 start-3 z-20 flex flex-col gap-2">
          <div className="panel-stone rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
            <Hammer className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300">{t('buildQueues')}:</span>
            <span className="font-bold text-amber-300">{activeQueues.length} / 2</span>
          </div>
          {activeQueues.map((q) => {
            const def = BUILDING_MAP[q.type];
            return (
              <button
                key={q.slot_id}
                onClick={() => setSelectedSlot(q.slot_id)}
                className="panel-stone rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs hover:border-amber-400 cursor-pointer"
              >
                <span>{def.icon}</span>
                <span className="text-amber-100 font-medium">{def.name} Lv.{q.upgrading_to}</span>
                <span className="text-emerald-400 font-mono">{formatTimeLeft(q.finish_at, nowMs)}</span>
              </button>
            );
          })}
        </div>

        <div className="absolute top-3 end-3 z-20 flex gap-1.5">
          <button
            onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.1).toFixed(2)))}
            className="panel-stone p-2 rounded-lg hover:border-amber-400 cursor-pointer"
          >
            <ZoomOut className="w-4 h-4 text-amber-200" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(1.35, +(z + 0.1).toFixed(2)))}
            className="panel-stone p-2 rounded-lg hover:border-amber-400 cursor-pointer"
          >
            <ZoomIn className="w-4 h-4 text-amber-200" />
          </button>
        </div>

        {/* Scalable Kingdom Grounds */}
        <div
          className="relative select-none transition-transform duration-200 shrink-0 shadow-2xl rounded-2xl"
          style={{
            width: 1000,
            height: 620,
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* SVG Terrain: Sunlit Valley, Mountains, Sparkling River, Stone Bridge, Forests & Fortress */}
          <svg viewBox="0 0 1000 620" className="absolute inset-0 w-full h-full rounded-2xl">
            <defs>
              <radialGradient id="meadowGrad" cx="50%" cy="48%" r="65%">
                <stop offset="0%" stopColor="#356b3e" />
                <stop offset="55%" stopColor="#265130" />
                <stop offset="100%" stopColor="#173521" />
              </radialGradient>
              <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
              <radialGradient id="keepGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(251,191,36,0.38)" />
                <stop offset="100%" stopColor="rgba(251,191,36,0)" />
              </radialGradient>
            </defs>

            <rect width="1000" height="620" fill="url(#meadowGrad)" rx="18" />

            {/* Distant Northern Highland Ridges */}
            <polygon points="280,95 360,22 440,95" fill="#334155" opacity="0.7" />
            <polygon points="360,22 338,44 360,38 382,44" fill="#e2e8f0" opacity="0.75" />
            <polygon points="560,95 650,18 740,95" fill="#475569" opacity="0.7" />
            <polygon points="650,18 625,42 650,35 675,42" fill="#e2e8f0" opacity="0.75" />

            {/* Winding Crystal Castle River / Moat */}
            <path
              d="M -10 105 Q 240 55, 500 95 T 1010 85 L 1010 132 Q 750 148, 500 138 T -10 150 Z"
              fill="url(#riverGrad)"
              opacity="0.88"
            />
            <path
              d="M 10 124 Q 250 88, 500 116 T 990 108"
              fill="none"
              stroke="#bae6fd"
              strokeWidth="2.5"
              strokeDasharray="14 10"
              opacity="0.55"
            />

            {/* Stone Bridge over River */}
            <rect x="472" y="88" width="56" height="58" rx="6" fill="#78716c" stroke="#d6d3d1" strokeWidth="2" />

            {/* Golden Wheat Fields around Royal Farms */}
            <ellipse cx="145" cy="245" rx="76" ry="58" fill="#65a30d" opacity="0.35" stroke="#bef264" strokeDasharray="5 4" />
            {/* Rocky Quarry Cliffs around Iron Mine */}
            <ellipse cx="855" cy="245" rx="78" ry="60" fill="#475569" opacity="0.45" stroke="#94a3b8" strokeDasharray="5 4" />

            {/* Inner Stone Fortress Courtyard */}
            <polygon
              points="500,130 780,250 725,525 275,525 220,250"
              fill="#272e3f"
              stroke="#94a3b8"
              strokeWidth="7"
            />
            <polygon
              points="500,142 768,256 716,515 284,515 232,256"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeDasharray="6 6"
              opacity="0.5"
            />

            {/* Corner Fortress Watchtowers */}
            {[
              [500, 130], [780, 250], [725, 525], [275, 525], [220, 250],
            ].map(([wx, wy], idx) => (
              <circle key={idx} cx={wx} cy={wy} r="14" fill="#64748b" stroke="#e2e8f0" strokeWidth="2.5" />
            ))}

            {/* Stone Cobblestone Roads */}
            <line x1="500" y1="145" x2="500" y2="525" stroke="#475569" strokeWidth="16" strokeLinecap="round" />
            <line x1="270" y1="320" x2="730" y2="320" stroke="#475569" strokeWidth="11" strokeLinecap="round" />
            <line x1="330" y1="195" x2="670" y2="195" stroke="#475569" strokeWidth="9" strokeLinecap="round" />
            <line x1="340" y1="425" x2="660" y2="425" stroke="#475569" strokeWidth="9" strokeLinecap="round" />

            {/* Golden Sun Aura under Citadel Keep */}
            <circle cx="500" cy="230" r="98" fill="url(#keepGlow)" />

            {/* Lush Multi-Layered Forest Trees framing the Kingdom */}
            {FOREST_TREES.map(([tx, ty, sc], i) => (
              <g key={i} transform={`translate(${tx}, ${ty}) scale(${sc})`}>
                <ellipse cx="2" cy="12" rx="13" ry="5" fill="rgba(5,20,10,0.45)" />
                <rect x="-2.5" y="4" width="5" height="9" fill="#5c3a21" />
                <polygon points="0,-16 -14,7 14,7" fill="#14532d" />
                <polygon points="0,-26 -11,-2 11,-2" fill="#228b49" />
              </g>
            ))}
          </svg>

          {/* Interactive Building Nodes */}
          {BUILDINGS.map((def) => {
            const b = buildingBySlot[def.slotId];
            if (!b) return null;
            const isSelected = selectedSlot === def.slotId;
            const isUpgrading = Boolean(b.finish_at && b.finish_at > nowMs);
            const isKeep = def.type === 'castle';

            return (
              <button
                key={def.slotId}
                onClick={() => setSelectedSlot(def.slotId)}
                style={{
                  left: def.x,
                  top: def.y,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute group flex flex-col items-center cursor-pointer transition-all duration-150 ${
                  isSelected ? 'z-20 scale-110' : 'z-10 hover:scale-105'
                }`}
              >
                {isUpgrading && (
                  <div className="mb-1 px-2 py-0.5 rounded-full bg-emerald-950/95 border border-emerald-400/70 text-[10px] font-mono text-emerald-300 shadow-lg flex items-center gap-1 whitespace-nowrap">
                    <Clock className="w-2.5 h-2.5 animate-spin" />
                    {formatTimeLeft(b.finish_at, nowMs)}
                  </div>
                )}

                <div
                  className={`relative flex items-center justify-center rounded-2xl border-2 shadow-xl transition-all ${
                    isKeep ? 'w-24 h-24 text-5xl' : 'w-16 h-16 text-3xl'
                  } ${
                    isSelected
                      ? 'border-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.65)]'
                      : isUpgrading
                      ? 'border-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.45)]'
                      : 'border-amber-500/50 group-hover:border-amber-300'
                  }`}
                  style={{
                    background: `radial-gradient(circle at 35% 25%, ${def.color}dd, #0f172a 85%)`,
                  }}
                >
                  <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{def.icon}</span>
                  <span className="absolute -top-2 -end-2 min-w-6 h-6 px-1 rounded-full bg-slate-950 border border-amber-400 text-[11px] font-bold text-amber-300 flex items-center justify-center shadow">
                    {b.level}
                  </span>
                </div>

                <div
                  className={`mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide whitespace-nowrap border ${
                    isSelected
                      ? 'bg-amber-950/95 border-amber-400 text-amber-100'
                      : 'bg-slate-950/90 border-slate-700/80 text-slate-100'
                  }`}
                >
                  {def.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Building Inspector Side Drawer */}
      {selectedBuilding && selectedDef && (
        <aside className="w-80 shrink-0 panel-stone border-s border-amber-500/30 p-4 flex flex-col overflow-y-auto z-30">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-amber-400/50"
                style={{ background: `linear-gradient(135deg, ${selectedDef.color}88, #0f172a)` }}
              >
                {selectedDef.icon}
              </div>
              <div>
                <h2 className="font-royal text-base font-bold text-amber-200 leading-tight">{selectedDef.name}</h2>
                <div className="text-xs text-amber-400/90 font-semibold">
                  {t('level')} {selectedBuilding.level} / {selectedDef.maxLevel}
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedSlot(null)}
              className="p-1 text-slate-400 hover:text-amber-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mt-3">{selectedDef.description}</p>

          <div className="mt-4 bg-slate-950/70 rounded-xl p-3 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">{t('powerContrib')}</span>
              <span className="font-bold text-amber-300">
                +{formatNum(selectedDef.powerPerLevel * selectedBuilding.level)}
              </span>
            </div>
            {selectedDef.productionResource && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('currentProd')}</span>
                  <span className="font-bold text-emerald-400">
                    +{formatNum(getResourceProductionPerHour(selectedDef.type, selectedBuilding.level))}/hr
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('nextProd')}</span>
                  <span className="font-bold text-emerald-300">
                    +{formatNum(getResourceProductionPerHour(selectedDef.type, selectedBuilding.level + 1))}/hr
                  </span>
                </div>
              </>
            )}
          </div>

          {(() => {
            const sc = getShortcutTab(selectedDef.type);
            if (!sc) return null;
            return (
              <button
                onClick={() => onNavigate(sc.tab)}
                className="btn-steel mt-3 w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                {sc.label}
              </button>
            );
          })()}

          <div className="mt-4 pt-4 border-t border-amber-500/20 flex-1 flex flex-col justify-between">
            {selectedBuilding.finish_at && selectedBuilding.finish_at > nowMs ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-emerald-950/50 border border-emerald-500/40 p-3 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-emerald-300">
                    {t('upgradingTo')} {selectedBuilding.upgrading_to}
                  </div>
                  <div className="font-mono text-2xl font-bold text-emerald-200 mt-1">
                    {formatTimeLeft(selectedBuilding.finish_at, nowMs)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={busy || state.user.speedups <= 0}
                    onClick={() => handleSpeedup(selectedBuilding.slot_id, 'speedup')}
                    className="btn-royal py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    {t('speedUp')} ({state.user.speedups})
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => handleSpeedup(selectedBuilding.slot_id, 'gems')}
                    className="btn-steel py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Gem className="w-3.5 h-3.5 text-cyan-400" />
                    {t('instantGem')}
                  </button>
                </div>

                <button
                  disabled={busy || !state.alliance}
                  onClick={() => handleRequestHelp(selectedBuilding.slot_id)}
                  className="btn-steel w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-45"
                >
                  <Handshake className="w-3.5 h-3.5 text-amber-400" />
                  {state.alliance ? t('reqHelp') : t('joinAllianceHelp')}
                </button>
              </div>
            ) : selectedBuilding.level >= selectedDef.maxLevel ? (
              <div className="rounded-xl bg-amber-950/40 border border-amber-400/40 p-3 text-center text-xs text-amber-200 font-semibold">
                {t('maxLevelReached')}
              </div>
            ) : (
              (() => {
                const cost = getBuildingUpgradeCost(selectedDef.type, selectedBuilding.level);
                const timeSec = getBuildingUpgradeTimeSec(
                  selectedDef.type,
                  selectedBuilding.level,
                  state.bonuses.buildSpeedPct
                );
                const needsKeep = selectedDef.type !== 'castle' && selectedBuilding.level >= state.user.castleLevel;
                const canAfford =
                  state.user.food >= cost.food &&
                  state.user.wood >= cost.wood &&
                  state.user.iron >= cost.iron &&
                  state.user.gold >= cost.gold;

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-200">
                        {t('upgradeTo')} {selectedBuilding.level + 1}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeSec}s
                      </span>
                    </div>

                    {needsKeep && (
                      <div className="rounded-lg bg-amber-950/60 border border-amber-500/40 px-2.5 py-2 text-[11px] text-amber-200">
                        {t('requiresKeep')} <strong>{selectedBuilding.level + 1}</strong>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {([
                        [`🌾 ${t('food')}`, cost.food, state.user.food],
                        [`🌲 ${t('wood')}`, cost.wood, state.user.wood],
                        [`⛏️ ${t('iron')}`, cost.iron, state.user.iron],
                        [`💰 ${t('gold')}`, cost.gold, state.user.gold],
                      ] as const).map(([label, req, have]) => (
                        <div
                          key={label}
                          className={`rounded-lg px-2.5 py-1.5 border ${
                            have >= req
                              ? 'bg-slate-950/70 border-slate-800 text-slate-200'
                              : 'bg-red-950/40 border-red-500/40 text-red-300'
                          }`}
                        >
                          <div className="text-[10px] text-slate-400">{label}</div>
                          <div className="font-bold">{formatNum(req)}</div>
                        </div>
                      ))}
                    </div>

                    <button
                      disabled={busy || !canAfford || needsKeep}
                      onClick={() => handleUpgrade(selectedBuilding.slot_id)}
                      className="btn-royal w-full py-3 rounded-xl font-royal font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      {t('upgradeBuilding')}
                    </button>
                  </div>
                );
              })()
            )}
          </div>
        </aside>
      )}
    </div>
  );
};
