import React from 'react';
import { Backpack, Heart, X } from 'lucide-react';
import { ITEMS } from '../data/crops';
import { NPC_LIST } from '../data/npcs';
import { getEffectiveSellPrice } from '../engine/gameLogic';
import { ITEM_NAMES, t } from '../i18n/translations';
import { GameState, ItemId } from '../types/game';

interface BagModalProps {
  state: GameState;
  onClose: () => void;
}

export const BagModal: React.FC<BagModalProps> = ({ state, onClose }) => {
  const { language } = state;
  const entries = (Object.entries(state.inventory) as Array<[ItemId, number]>).filter(
    ([, qty]) => qty > 0
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="rpg-panel modal-card" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Backpack size={20} color="#fde047" />
            <h2 className="font-display" style={{ margin: 0, fontSize: 20 }}>
              GreenSAGA {t(language, 'bag')}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#fef3c7', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            <div className="item-card" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 10 }}>
              <div style={{ fontSize: 11, color: '#78716c', fontWeight: 700 }}>🌾 Harvested</div>
              <div className="font-display" style={{ fontSize: 21, color: '#16a34a' }}>{state.stats.cropsHarvested}</div>
            </div>
            <div className="item-card" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 10 }}>
              <div style={{ fontSize: 11, color: '#78716c', fontWeight: 700 }}>🥖 Artisan</div>
              <div className="font-display" style={{ fontSize: 21, color: '#9333ea' }}>{state.stats.artisanCrafted}</div>
            </div>
            <div className="item-card" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 10 }}>
              <div style={{ fontSize: 11, color: '#78716c', fontWeight: 700 }}>🌐 Neighbors</div>
              <div className="font-display" style={{ fontSize: 21, color: '#2563eb' }}>{state.stats.neighborsHelped}</div>
            </div>
            <div className="item-card" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 10 }}>
              <div style={{ fontSize: 11, color: '#78716c', fontWeight: 700 }}>💰 Gold</div>
              <div className="font-display" style={{ fontSize: 21, color: '#ca8a04' }}>{state.stats.goldEarned}g</div>
            </div>
          </div>

          <div>
            <h3 className="font-display" style={{ margin: '0 0 8px', fontSize: 15, color: '#78350f' }}>
              {t(language, 'bag')} ({entries.length})
            </h3>
            {entries.length === 0 ? (
              <div style={{ color: '#78716c', fontSize: 13 }}>{t(language, 'emptyBasket')}</div>
            ) : (
              <div className="item-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))' }}>
                {entries.map(([id, qty]) => {
                  const def = ITEMS[id];
                  const val = getEffectiveSellPrice(state, id);
                  return (
                    <div key={id} className="item-card" style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 22 }}>{def.emoji}</span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 12.5 }}>{ITEM_NAMES[language][id]}</div>
                          <div style={{ fontSize: 11, color: '#78716c' }}>
                            ×<b>{qty}</b>
                            {val ? ` · ${val}g` : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-display" style={{ margin: '0 0 8px', fontSize: 15, color: '#78350f' }}>
              Cloverbrook ♥
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {NPC_LIST.map((npc) => {
                const pts = state.npcFriendship[npc.id];
                const hearts = Math.min(5, Math.floor(pts / 20));
                return (
                  <div key={npc.id} className="item-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{npc.name}</div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Heart key={i} size={13} color="#f43f5e" fill={i < hearts ? '#f43f5e' : 'transparent'} />
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: '#78716c' }}>{pts}/100</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
