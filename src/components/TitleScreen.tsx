import React from 'react';
import { Play, RotateCcw, Sparkles, Sprout, Sun, Users } from 'lucide-react';
import { GameState } from '../types/game';

interface TitleScreenProps {
  savedGame: GameState | null;
  onNewGame: () => void;
  onContinue: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  savedGame,
  onNewGame,
  onContinue,
}) => {
  return (
    <div className="title-screen">
      <div className="rpg-panel title-card">
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 14px',
            borderRadius: 999,
            background: '#dcfce7',
            border: '2px solid #16a34a',
            color: '#166534',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '0.06em',
            marginBottom: 12,
          }}
        >
          <Sparkles size={14} /> COZY FARMING RPG
        </div>

        <h1
          className="font-display"
          style={{
            fontSize: 56,
            margin: '0 0 6px',
            letterSpacing: '0.05em',
            color: '#78350f',
            textShadow: '0 3px 0 #fde047',
          }}
        >
          OUAGX
        </h1>

        <p style={{ margin: '0 0 22px', color: '#57534e', fontSize: 15, lineHeight: 1.5 }}>
          Till sunny plots, grow vibrant crops in real time, care for chickens & cows,
          befriend Cloverbrook villagers, and build your dream valley homestead.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '2px solid #fde68a',
              borderRadius: 12,
              padding: '10px 8px',
            }}
          >
            <Sprout size={20} color="#16a34a" style={{ marginBottom: 4 }} />
            <div style={{ fontWeight: 800, fontSize: 12 }}>5 Crops & Tools</div>
            <div style={{ fontSize: 11, color: '#78716c' }}>Real-time + upgrades</div>
          </div>
          <div
            style={{
              background: '#fff',
              border: '2px solid #fde68a',
              borderRadius: 12,
              padding: '10px 8px',
            }}
          >
            <Sun size={20} color="#eab308" style={{ marginBottom: 4 }} />
            <div style={{ fontWeight: 800, fontSize: 12 }}>Weather & Days</div>
            <div style={{ fontSize: 11, color: '#78716c' }}>Rain auto-waters!</div>
          </div>
          <div
            style={{
              background: '#fff',
              border: '2px solid #fde68a',
              borderRadius: 12,
              padding: '10px 8px',
            }}
          >
            <Users size={20} color="#ec4899" style={{ marginBottom: 4 }} />
            <div style={{ fontWeight: 800, fontSize: 12 }}>Village & Quests</div>
            <div style={{ fontSize: 11, color: '#78716c' }}>Shop, NPCs & hearts</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {savedGame && (
            <button
              className="rpg-btn rpg-btn-primary"
              style={{ fontSize: 17, padding: '13px 20px' }}
              onClick={onContinue}
            >
              <Play size={19} fill="currentColor" />
              Continue Farm (Day {savedGame.day} · Lv.{savedGame.player.level} · {savedGame.player.gold}g)
            </button>
          )}

          <button
            className={`rpg-btn ${savedGame ? 'rpg-btn-gold' : 'rpg-btn-primary'}`}
            style={{ fontSize: 16, padding: '12px 20px' }}
            onClick={onNewGame}
          >
            {savedGame ? <RotateCcw size={17} /> : <Play size={18} fill="currentColor" />}
            {savedGame ? 'Start New Farm' : 'Start Farming in OUAGX'}
          </button>
        </div>

        <div style={{ marginTop: 18, fontSize: 12, color: '#78716c' }}>
          Controls: <b>WASD / Arrows</b> or <b>Click</b> to walk · <b>1–0</b> switch tools/seeds · <b>E / Space</b> interact
        </div>
      </div>
    </div>
  );
};
