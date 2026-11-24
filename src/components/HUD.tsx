import React, { useState } from 'react';
import {
  Award,
  Backpack,
  CloudRain,
  Coins,
  Globe,
  HelpCircle,
  Home,
  Map,
  Maximize2,
  Megaphone,
  MessageCircle,
  Minimize2,
  Moon,
  ScrollText,
  Store,
  Sun,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { ITEMS, MAX_LEVEL } from '../data/crops';
import { MAP_COLS, MAP_ROWS } from '../data/worldMap';
import { isPluginEnabled } from '../engine/adminStore';
import { formatClock, getItemCount, HOTBAR_SLOTS } from '../engine/gameLogic';
import {
  CROP_NAMES,
  getLevelTitle,
  getStageLabelLocalized,
  ITEM_NAMES,
  LANGUAGES,
  t,
  TOOL_NAMES,
} from '../i18n/translations';
import { AdminConfig } from '../types/admin';
import { FarmTile, GameState, Language, RemoteFarmer } from '../types/game';

interface HUDProps {
  state: GameState;
  adminConfig: AdminConfig;
  remoteFarmers: RemoteFarmer[];
  fps: number;
  onlineCount: number;
  hoverInfo: { tile: FarmTile; screenX: number; screenY: number } | null;
  onSelectHotbar: (idx: number) => void;
  onOpenQuests: () => void;
  onOpenBag: () => void;
  onOpenShop: () => void;
  onOpenMap: () => void;
  onOpenLevels: () => void;
  chatOpen: boolean;
  unreadChat: number;
  onToggleChat: () => void;
  onClickAd: (adId: string) => void;
  onSleep: () => void;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenHelp: () => void;
  onChangeLanguage: (lang: Language) => void;
  onGoHome: () => void;
}

const TOOL_EMOJIS = {
  hoe: '⛏️',
  watering_can: '🚿',
  scythe: '🗡️',
};

const TIER_BADGE: Record<number, string> = {
  1: '',
  2: 'Cu',
  3: 'Au',
};

export const HUD: React.FC<HUDProps> = ({
  state,
  adminConfig,
  remoteFarmers,
  fps,
  onlineCount,
  hoverInfo,
  onSelectHotbar,
  onOpenQuests,
  onOpenBag,
  onOpenShop,
  onOpenMap,
  onOpenLevels,
  chatOpen,
  unreadChat,
  onToggleChat,
  onClickAd,
  onSleep,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  onOpenHelp,
  onChangeLanguage,
  onGoHome,
}) => {
  const [dismissedAd, setDismissedAd] = useState(false);
  const { player, language } = state;
  const hudAd = !dismissedAd
    ? adminConfig.ads.find((a) => a.active && a.placement === 'game_hud_pill')
    : undefined;
  const showMinimap = isPluginEnabled(adminConfig, 'minimap_radar');
  const showFps = isPluginEnabled(adminConfig, 'fps_perf_hud');
  const staminaPct = Math.round((player.stamina / player.maxStamina) * 100);
  const xpPct =
    player.level >= MAX_LEVEL ? 100 : Math.min(100, Math.round((player.xp / player.xpToNext) * 100));

  const activeQuests = state.quests.filter((q) => !q.claimed);
  const readyQuests = activeQuests.filter(
    (q) => getItemCount(state, q.itemId) >= q.requiredQty
  ).length;

  const selectedSlot = HOTBAR_SLOTS[state.selectedHotbarIndex] ?? HOTBAR_SLOTS[0];
  const selectedLabel =
    selectedSlot.kind === 'tool'
      ? TOOL_NAMES[language][selectedSlot.toolId][player.toolTiers[selectedSlot.toolId]]
      : `${ITEM_NAMES[language][selectedSlot.itemId]} (${getItemCount(state, selectedSlot.itemId)})`;

  const cycleLang = () => {
    const idx = LANGUAGES.findIndex((l) => l.code === language);
    const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
    onChangeLanguage(next.code);
  };

  return (
    <>
      <div className="hud-layer">
        {/* TOP ROW */}
        <div className="hud-top">
          {/* Top Left: Player Stats & Clickable Level Badge */}
          <div className="hud-card hud-interactive" style={{ minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
              <div>
                <div className="font-display" style={{ fontSize: 15, fontWeight: 700, color: '#fde047' }}>
                  {player.name}
                </div>
                <div style={{ fontSize: 10.5, color: '#d6d3d1', fontWeight: 700 }}>
                  {getLevelTitle(language, player.level)}
                </div>
              </div>
              <button
                onClick={onOpenLevels}
                title={t(language, 'levels')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: '#eab308',
                  color: '#422006',
                  fontWeight: 800,
                  fontSize: 11,
                  padding: '4px 9px',
                  borderRadius: 999,
                  border: '1.5px solid #fef08a',
                  cursor: 'pointer',
                }}
              >
                <Award size={12} /> {t(language, 'level')} {player.level}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <Zap size={13} color="#4ade80" />
              <div className="bar-track" style={{ flex: 1 }}>
                <div
                  className="bar-fill"
                  style={{
                    width: `${staminaPct}%`,
                    background:
                      staminaPct < 25
                        ? 'linear-gradient(90deg, #ef4444, #f97316)'
                        : 'linear-gradient(90deg, #22c55e, #86efac)',
                  }}
                />
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, minWidth: 42, textAlign: 'end' }}>
                {Math.round(player.stamina)}/{player.maxStamina}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }} onClick={onOpenLevels}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#93c5fd', width: 13 }}>XP</span>
              <div className="bar-track" style={{ flex: 1, height: 7 }}>
                <div
                  className="bar-fill"
                  style={{
                    width: `${xpPct}%`,
                    background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                  }}
                />
              </div>
              <span style={{ fontSize: 10, color: '#cbd5e1', minWidth: 42, textAlign: 'end' }}>
                {player.level >= MAX_LEVEL ? 'MAX' : `${player.xp}/${player.xpToNext}`}
              </span>
            </div>
          </div>

          {/* Top Center: Day / Time / Weather / Sleep / Language / Home */}
          <div
            className="rpg-pill hud-interactive"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '7px 13px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {state.weather === 'sunny' ? (
                <Sun size={17} color="#fde047" />
              ) : (
                <CloudRain size={17} color="#7dd3fc" />
              )}
              <span className="font-display" style={{ fontWeight: 700, fontSize: 14 }}>
                {t(language, 'day')} {state.day}
              </span>
            </div>
            <span style={{ opacity: 0.35 }}>|</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#fef08a' }}>
              {formatClock(state.timeOfDay)}
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 999,
                background: state.weather === 'rainy' ? 'rgba(56,189,248,0.25)' : 'rgba(250,204,21,0.2)',
                color: state.weather === 'rainy' ? '#bae6fd' : '#fef08a',
              }}
            >
              {state.weather === 'rainy' ? t(language, 'rainy') : t(language, 'sunny')}
            </span>
            <button
              onClick={onSleep}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: '#4f46e5',
                color: '#fff',
                border: '1px solid #818cf8',
                borderRadius: 999,
                padding: '4px 9px',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Moon size={12} /> {t(language, 'sleep')}
            </button>
            <button
              onClick={cycleLang}
              title="Switch Language (EN / FR / العربية)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(255,255,255,0.14)',
                color: '#fefce8',
                border: '1px solid rgba(255,255,255,0.28)',
                borderRadius: 999,
                padding: '3px 8px',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <Globe size={12} /> {language.toUpperCase()}
            </button>
            <button
              title={state.muted ? 'Unmute' : 'Mute'}
              onClick={onToggleMute}
              style={{ background: 'transparent', border: 'none', color: '#fefce8', cursor: 'pointer', padding: 2, display: 'flex' }}
            >
              {state.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
              onClick={onToggleFullscreen}
              style={{ background: 'transparent', border: 'none', color: '#86efac', cursor: 'pointer', padding: 2, display: 'flex' }}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              title="Help (H)"
              onClick={onOpenHelp}
              style={{ background: 'transparent', border: 'none', color: '#fef08a', cursor: 'pointer', padding: 2, display: 'flex' }}
            >
              <HelpCircle size={16} />
            </button>
            <button
              title={t(language, 'backHome')}
              onClick={onGoHome}
              style={{ background: 'transparent', border: 'none', color: '#fed7aa', cursor: 'pointer', padding: 2, display: 'flex' }}
            >
              <Home size={16} />
            </button>
          </div>

          {/* Top Right: Gold + Action Buttons */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 6, marginInlineStart: 'auto', flexWrap: 'wrap' }}
            className="hud-interactive"
          >
            <div
              className="rpg-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 13px',
                fontWeight: 800,
                fontSize: 15,
                color: '#fde047',
              }}
            >
              <Coins size={16} color="#facc15" />
              {player.gold.toLocaleString()}g
            </div>

            <button
              className="rpg-btn rpg-btn-indigo"
              style={{ padding: '6px 10px', fontSize: 12 }}
              onClick={onOpenMap}
              title="Multiplayer Valley Map (G)"
            >
              <Map size={15} />
              {t(language, 'map')} ({onlineCount})
            </button>

            <button
              className={`rpg-btn ${chatOpen ? 'rpg-btn-primary' : 'rpg-btn-neutral'}`}
              style={{ padding: '6px 10px', fontSize: 12, position: 'relative' }}
              onClick={onToggleChat}
              title="Live Multiplayer Chat (T)"
            >
              <MessageCircle size={15} />
              Chat
              {!chatOpen && unreadChat > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    minWidth: 18,
                    height: 18,
                    padding: '0 4px',
                    borderRadius: 999,
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #fff',
                  }}
                >
                  {unreadChat > 9 ? '9+' : unreadChat}
                </span>
              )}
            </button>

            <button
              className="rpg-btn rpg-btn-warm"
              style={{ padding: '6px 10px', fontSize: 12, position: 'relative' }}
              onClick={onOpenQuests}
              title="Quests (Q)"
            >
              <ScrollText size={15} />
              {t(language, 'quests')}
              {readyQuests > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 19,
                    height: 19,
                    borderRadius: '50%',
                    background: '#16a34a',
                    color: '#fff',
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #fff',
                  }}
                >
                  {readyQuests}
                </span>
              )}
            </button>

            <button
              className="rpg-btn rpg-btn-neutral"
              style={{ padding: '6px 10px', fontSize: 12 }}
              onClick={onOpenBag}
              title="Bag (B)"
            >
              <Backpack size={15} />
              {t(language, 'bag')}
            </button>

            <button
              className="rpg-btn rpg-btn-gold"
              style={{ padding: '6px 10px', fontSize: 12 }}
              onClick={onOpenShop}
              title="Market (M)"
            >
              <Store size={15} />
              {t(language, 'market')}
            </button>
          </div>
        </div>

        {/* BOTTOM HOTBAR + ADMIN AD PILL + PLUGIN OVERLAYS */}
        <div className="hotbar-wrap">
          {adminConfig.announcement.trim() && (
            <div
              className="hud-interactive"
              style={{
                background: 'rgba(79, 70, 229, 0.9)',
                color: '#fff',
                padding: '4px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Megaphone size={13} /> {adminConfig.announcement}
            </div>
          )}

          {hudAd && (
            <div
              className="hud-interactive"
              style={{
                background: 'rgba(28, 25, 23, 0.88)',
                border: `1.5px solid ${hudAd.accentColor}`,
                color: '#fefce8',
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  background: hudAd.accentColor,
                  color: '#1c1917',
                  fontSize: 9.5,
                  fontWeight: 900,
                  padding: '1px 6px',
                  borderRadius: 999,
                }}
              >
                AD
              </span>
              <span>{hudAd.title}</span>
              <button
                onClick={() => {
                  onClickAd(hudAd.id);
                  if (hudAd.targetUrl === '#shop') onOpenShop();
                  else onOpenMap();
                }}
                style={{
                  background: '#fde047',
                  color: '#422006',
                  border: 'none',
                  borderRadius: 999,
                  padding: '2px 8px',
                  fontSize: 10.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {hudAd.ctaLabel}
              </button>
              <button
                onClick={() => setDismissedAd(true)}
                style={{ background: 'transparent', border: 'none', color: '#a8a29e', cursor: 'pointer', padding: 0, display: 'flex' }}
              >
                <X size={13} />
              </button>
            </div>
          )}

          <div
            style={{
              background: 'rgba(28, 25, 23, 0.8)',
              color: '#fefce8',
              padding: '4px 14px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              border: '1px solid rgba(254, 240, 138, 0.28)',
            }}
          >
            {selectedLabel}
          </div>

          <div className="hotbar hud-interactive">
            {HOTBAR_SLOTS.map((slot, idx) => {
              const keyLabel = idx < 9 ? String(idx + 1) : idx === 9 ? '0' : '';
              const isSelected = state.selectedHotbarIndex === idx;

              if (slot.kind === 'tool') {
                const tier = player.toolTiers[slot.toolId];
                return (
                  <button
                    key={slot.toolId}
                    className={`hotbar-slot ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectHotbar(idx)}
                    title={TOOL_NAMES[language][slot.toolId][tier]}
                  >
                    {keyLabel && <span className="slot-key">{keyLabel}</span>}
                    {TIER_BADGE[tier] && <span className="slot-tier">{TIER_BADGE[tier]}</span>}
                    <span style={{ fontSize: 20 }}>{TOOL_EMOJIS[slot.toolId]}</span>
                    <span style={{ fontSize: 8.5, fontWeight: 700, opacity: 0.9 }}>
                      {TOOL_NAMES[language][slot.toolId][tier].split(' ')[0]}
                    </span>
                  </button>
                );
              }

              const item = ITEMS[slot.itemId];
              const count = getItemCount(state, slot.itemId);
              const locked = (item.unlockLevel ?? 1) > player.level;

              return (
                <button
                  key={slot.itemId}
                  className={`hotbar-slot ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectHotbar(idx)}
                  style={{ opacity: locked ? 0.42 : count === 0 ? 0.58 : 1 }}
                  title={
                    locked
                      ? `${ITEM_NAMES[language][slot.itemId]} (Lv.${item.unlockLevel})`
                      : ITEM_NAMES[language][slot.itemId]
                  }
                >
                  {keyLabel && <span className="slot-key">{keyLabel}</span>}
                  {locked && <span className="slot-tier">Lv{item.unlockLevel}</span>}
                  <span style={{ fontSize: 19, marginTop: 2 }}>{item.emoji}</span>
                  {!locked && <span className="slot-qty">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PLUGIN: LIVE VALLEY MINI-MAP RADAR */}
      {showMinimap && (
        <div
          className="minimap-radar hud-interactive"
          onClick={onOpenMap}
          title="Live Valley Mini-Map Radar (Click to open World Map)"
        >
          <div className="minimap-river" />
          <div
            className="minimap-dot"
            style={{
              left: `${(player.x / MAP_COLS) * 100}%`,
              top: `${(player.y / MAP_ROWS) * 100}%`,
              background: '#ef4444',
              width: 8,
              height: 8,
            }}
          />
          {remoteFarmers.map((rf) => (
            <div
              key={rf.id}
              className="minimap-dot"
              style={{
                left: `${(rf.x / MAP_COLS) * 100}%`,
                top: `${(rf.y / MAP_ROWS) * 100}%`,
                background: '#38bdf8',
                width: 6,
                height: 6,
              }}
            />
          ))}
          <span className="minimap-label">RADAR</span>
        </div>
      )}

      {/* PLUGIN: FPS & COORDS TELEMETRY */}
      {showFps && (
        <div className="fps-telemetry">
          FPS: <b>{fps}</b> · XY: ({player.x.toFixed(1)}, {player.y.toFixed(1)})
        </div>
      )}

      {/* HOVER CROP PROGRESS TOOLTIP */}
      {hoverInfo &&
        hoverInfo.tile.unlocked &&
        (hoverInfo.tile.crop || hoverInfo.tile.hasWeed || hoverInfo.tile.tilled) && (
          <div
            className="crop-tooltip"
            style={{
              left: Math.min(window.innerWidth - 205, hoverInfo.screenX + 18),
              top: Math.max(16, hoverInfo.screenY - 12),
            }}
          >
            {hoverInfo.tile.crop ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginBottom: 4 }}>
                  <span style={{ color: '#fde047' }}>
                    {CROP_NAMES[language][hoverInfo.tile.crop.cropId]}
                  </span>
                  <span>{Math.round(hoverInfo.tile.crop.progress * 100)}%</span>
                </div>
                <div
                  style={{
                    height: 7,
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.18)',
                    overflow: 'hidden',
                    marginBottom: 5,
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.round(hoverInfo.tile.crop.progress * 100)}%`,
                      background:
                        hoverInfo.tile.crop.progress >= 1
                          ? '#facc15'
                          : 'linear-gradient(90deg, #4ade80, #22c55e)',
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: '#d6d3d1' }}>
                  {getStageLabelLocalized(language, hoverInfo.tile.crop.progress)}
                </div>
                <div style={{ fontSize: 11, marginTop: 3, display: 'flex', gap: 8 }}>
                  <span style={{ color: hoverInfo.tile.watered ? '#7dd3fc' : '#fca5a5' }}>
                    {hoverInfo.tile.watered ? `💧 ${t(language, 'watered')}` : `🌵 ${t(language, 'needsWater')}`}
                  </span>
                  {hoverInfo.tile.fertilized && (
                    <span style={{ color: '#86efac' }}>✨ {t(language, 'fertilized')}</span>
                  )}
                </div>
              </>
            ) : hoverInfo.tile.hasWeed ? (
              <div style={{ fontWeight: 700, color: '#bef264' }}>🌿 Wild Weed — (1 / 3)</div>
            ) : (
              <div style={{ fontSize: 11 }}>
                <b style={{ color: '#fde68a' }}>Soil</b> —{' '}
                {hoverInfo.tile.watered ? `💧 ${t(language, 'watered')}` : t(language, 'needsWater')}
              </div>
            )}
          </div>
        )}
    </>
  );
};
