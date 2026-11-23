import React from 'react';
import { Award, CheckCircle2, Lock, X, Zap } from 'lucide-react';
import { getSellBonusMultiplier, LEVEL_MILESTONES, MAX_LEVEL } from '../data/crops';
import { getLevelTitle, t } from '../i18n/translations';
import { GameState } from '../types/game';

interface LevelsModalProps {
  state: GameState;
  onClose: () => void;
}

export const LevelsModal: React.FC<LevelsModalProps> = ({ state, onClose }) => {
  const { player, language } = state;
  const sellBonusPct = Math.round((getSellBonusMultiplier(player.level) - 1) * 100);
  const xpPct =
    player.level >= MAX_LEVEL ? 100 : Math.min(100, Math.round((player.xp / player.xpToNext) * 100));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="rpg-panel modal-card" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Award size={22} color="#fde047" />
            <h2 className="font-display" style={{ margin: 0, fontSize: 20 }}>
              {t(language, 'levelsTitle')}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#fef3c7', cursor: 'pointer' }}
          >
            <X size={21} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Current Rank Summary */}
          <div
            style={{
              background: 'linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)',
              border: '2px solid #d97706',
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>
                {t(language, 'currentRank')}
              </div>
              <div className="font-display" style={{ fontSize: 22, color: '#451a03' }}>
                {t(language, 'level')} {player.level} · {getLevelTitle(language, player.level)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <div className="bar-track" style={{ width: 180, background: 'rgba(120,53,15,0.2)' }}>
                  <div
                    className="bar-fill"
                    style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg, #2563eb, #38bdf8)' }}
                  />
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#78350f' }}>
                  {player.level >= MAX_LEVEL ? 'MAX LEVEL ★' : `${player.xp} / ${player.xpToNext} XP`}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  padding: '8px 12px',
                  border: '2px solid #f59e0b',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, color: '#78716c', fontWeight: 700 }}>{t(language, 'sellBonus')}</div>
                <div className="font-display" style={{ fontSize: 18, color: '#16a34a' }}>
                  +{sellBonusPct}%
                </div>
              </div>
              <div
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  padding: '8px 12px',
                  border: '2px solid #f59e0b',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, color: '#78716c', fontWeight: 700 }}>{t(language, 'maxStamina')}</div>
                <div className="font-display" style={{ fontSize: 18, color: '#0284c7', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Zap size={15} /> {player.maxStamina}
                </div>
              </div>
            </div>
          </div>

          {/* 10-Level Roadmap */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LEVEL_MILESTONES.map((m) => {
              const reached = player.level >= m.level;
              const isCurrent = player.level === m.level;
              return (
                <div
                  key={m.level}
                  className="item-card"
                  style={{
                    background: isCurrent ? '#fefce8' : reached ? '#f0fdf4' : '#ffffff',
                    borderColor: isCurrent ? '#eab308' : reached ? '#86efac' : '#e7e5e4',
                    opacity: reached ? 1 : 0.78,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: reached ? '#16a34a' : '#e7e5e4',
                        color: reached ? '#ffffff' : '#57534e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 15,
                        flexShrink: 0,
                      }}
                    >
                      {m.level}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#292524' }}>
                        {getLevelTitle(language, m.level)}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#57534e' }}>{m.unlocks[language]}</div>
                    </div>
                  </div>
                  {reached ? (
                    <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0 }} />
                  ) : (
                    <Lock size={17} color="#a8a29e" style={{ flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
