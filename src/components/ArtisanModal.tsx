import React from 'react';
import { Lock, Sparkles, X } from 'lucide-react';
import { ARTISAN_RECIPES, ITEMS } from '../data/crops';
import { getEffectiveSellPrice, getItemCount } from '../engine/gameLogic';
import { ITEM_NAMES, t } from '../i18n/translations';
import { GameState } from '../types/game';

interface ArtisanModalProps {
  state: GameState;
  onCraft: (recipeId: string) => void;
  onClose: () => void;
}

export const ArtisanModal: React.FC<ArtisanModalProps> = ({ state, onCraft, onClose }) => {
  const { language, player } = state;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="rpg-panel modal-card" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Sparkles size={20} color="#fde047" />
            <h2 className="font-display" style={{ margin: 0, fontSize: 20 }}>
              {t(language, 'artisanTitle')}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#fef3c7', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13.5, color: '#57534e' }}>{t(language, 'artisanDesc')}</div>

          {ARTISAN_RECIPES.map((r) => {
            const locked = player.level < r.unlockLevel;
            const have = getItemCount(state, r.inputId);
            const canCraft = !locked && have >= r.inputQty;
            const inputDef = ITEMS[r.inputId];
            const outDef = ITEMS[r.outputId];
            const sellVal = getEffectiveSellPrice(state, r.outputId);

            return (
              <div key={r.id} className={`item-card ${locked ? 'locked' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 30 }}>{outDef.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>
                      {ITEM_NAMES[language][r.outputId]}{' '}
                      <span style={{ fontSize: 12, color: '#16a34a' }}>({sellVal}g · +{r.xpReward} XP)</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#57534e' }}>
                      {inputDef.emoji} {ITEM_NAMES[language][r.inputId]}: <b>{have} / {r.inputQty}</b>
                    </div>
                  </div>
                </div>

                {locked ? (
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#78716c', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Lock size={14} /> {t(language, 'level')} {r.unlockLevel}
                  </span>
                ) : (
                  <button
                    className="rpg-btn rpg-btn-primary"
                    disabled={!canCraft}
                    onClick={() => onCraft(r.id)}
                  >
                    {t(language, 'craft')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
