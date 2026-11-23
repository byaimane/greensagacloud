import React from 'react';
import { CheckCircle2, ScrollText, X } from 'lucide-react';
import { ITEMS } from '../data/crops';
import { NPCS } from '../data/npcs';
import { getItemCount } from '../engine/gameLogic';
import { ITEM_NAMES, t } from '../i18n/translations';
import { GameState } from '../types/game';

interface QuestLogModalProps {
  state: GameState;
  onCompleteQuest: (questId: string) => void;
  onClose: () => void;
}

export const QuestLogModal: React.FC<QuestLogModalProps> = ({
  state,
  onCompleteQuest,
  onClose,
}) => {
  const { language } = state;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="rpg-panel modal-card" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ScrollText size={20} color="#fde047" />
            <h2 className="font-display" style={{ margin: 0, fontSize: 20 }}>
              Cloverbrook {t(language, 'quests')}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#fef3c7', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {state.quests.map((q) => {
            const npc = NPCS[q.npcId];
            const item = ITEMS[q.itemId];
            const have = getItemCount(state, q.itemId);
            const ready = !q.claimed && have >= q.requiredQty;

            return (
              <div
                key={q.id}
                className="item-card"
                style={{
                  opacity: q.claimed ? 0.65 : 1,
                  borderColor: ready ? '#22c55e' : '#e7e5e4',
                  background: ready ? '#f0fdf4' : '#ffffff',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{q.title}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: '#fef3c7',
                        color: '#92400e',
                      }}
                    >
                      {npc.name}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#57534e', marginTop: 2 }}>{q.description}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>
                    {item.emoji} {ITEM_NAMES[language][q.itemId]}{' '}
                    <span style={{ color: ready ? '#16a34a' : '#78350f' }}>
                      {Math.min(have, q.requiredQty)} / {q.requiredQty}
                    </span>{' '}
                    · <span style={{ color: '#ca8a04' }}>+{q.rewardGold}g</span> ·{' '}
                    <span style={{ color: '#2563eb' }}>+{q.rewardXp} XP</span> ·{' '}
                    <span style={{ color: '#e11d48' }}>+{q.rewardFriendship} ♥</span>
                  </div>
                </div>

                {q.claimed ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 800, color: '#16a34a', fontSize: 13 }}>
                    <CheckCircle2 size={16} />
                  </span>
                ) : (
                  <button className="rpg-btn rpg-btn-primary" disabled={!ready} onClick={() => onCompleteQuest(q.id)}>
                    ✓
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
