import React from 'react';
import { Gift, Heart, ScrollText, Store, X } from 'lucide-react';
import { ITEMS } from '../data/crops';
import { NPCS } from '../data/npcs';
import { getItemCount } from '../engine/gameLogic';
import { ITEM_NAMES, NPC_ROLES, t } from '../i18n/translations';
import { GameState, ItemId, NpcId } from '../types/game';

interface NpcModalProps {
  state: GameState;
  npcId: NpcId;
  onGift: (npcId: NpcId, itemId: ItemId) => void;
  onCompleteQuest: (questId: string) => void;
  onOpenShop: () => void;
  onClose: () => void;
}

export const NpcModal: React.FC<NpcModalProps> = ({
  state,
  npcId,
  onGift,
  onCompleteQuest,
  onOpenShop,
  onClose,
}) => {
  const { language } = state;
  const npc = NPCS[npcId];
  const friendship = state.npcFriendship[npcId];
  const hearts = Math.min(5, Math.floor(friendship / 20));
  const lines = state.weather === 'rainy' ? npc.greetingRainy : npc.greetingSunny;
  const line = lines[(state.day + friendship) % lines.length];

  const npcQuests = state.quests.filter((q) => q.npcId === npcId && !q.claimed);

  const giftableItems = (Object.entries(state.inventory) as Array<[ItemId, number]>).filter(
    ([id, qty]) =>
      qty > 0 &&
      (ITEMS[id].category === 'crop' ||
        ITEMS[id].category === 'animal_product' ||
        ITEMS[id].category === 'fruit' ||
        ITEMS[id].category === 'artisan')
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="rpg-panel modal-card" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="font-display" style={{ margin: 0, fontSize: 21 }}>
              {npc.name}
            </h2>
            <div style={{ fontSize: 12, color: '#fde68a' }}>{NPC_ROLES[language][npcId]}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Heart key={i} size={16} color="#fda4af" fill={i < hearts ? '#f43f5e' : 'transparent'} />
              ))}
              <span style={{ fontSize: 12, fontWeight: 700, marginInlineStart: 4 }}>{friendship}%</span>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#fef3c7', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              background: '#ffffff',
              border: '2px solid #f59e0b',
              borderRadius: 14,
              padding: '14px 16px',
              fontSize: 15,
              lineHeight: 1.5,
              color: '#292524',
            }}
          >
            “{line}”
            <div style={{ marginTop: 6, fontSize: 12, color: '#78716c' }}>
              ♥ <b>{ITEMS[npc.favoriteItem].emoji} {ITEM_NAMES[language][npc.favoriteItem]}</b>
            </div>
          </div>

          {npc.opensShop && (
            <button
              className="rpg-btn rpg-btn-gold"
              style={{ padding: '10px 16px', fontSize: 15 }}
              onClick={() => {
                onClose();
                onOpenShop();
              }}
            >
              <Store size={18} /> Maya’s GreenSAGA {t(language, 'market')}
            </button>
          )}

          {npcQuests.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 14, marginBottom: 8, color: '#78350f' }}>
                <ScrollText size={16} /> {t(language, 'quests')} ({npc.name})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {npcQuests.map((q) => {
                  const have = getItemCount(state, q.itemId);
                  const ready = have >= q.requiredQty;
                  const item = ITEMS[q.itemId];
                  return (
                    <div key={q.id} className="item-card">
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>{q.title}</div>
                        <div style={{ fontSize: 12, color: '#57534e' }}>{q.description}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                          {item.emoji} {ITEM_NAMES[language][q.itemId]} ({Math.min(have, q.requiredQty)}/{q.requiredQty}) ·{' '}
                          <span style={{ color: '#ca8a04' }}>{q.rewardGold}g</span> ·{' '}
                          <span style={{ color: '#2563eb' }}>+{q.rewardXp} XP</span>
                        </div>
                      </div>
                      <button className="rpg-btn rpg-btn-primary" disabled={!ready} onClick={() => onCompleteQuest(q.id)}>
                        ✓
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 14, marginBottom: 8, color: '#78350f' }}>
              <Gift size={16} /> Gift ({npc.name})
            </div>
            {state.npcGiftedToday[npcId] ? (
              <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 700 }}>♥ ✓</div>
            ) : giftableItems.length === 0 ? (
              <div style={{ fontSize: 13, color: '#78716c' }}>{t(language, 'emptyBasket')}</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {giftableItems.map(([id, qty]) => (
                  <button
                    key={id}
                    className="rpg-btn rpg-btn-neutral"
                    style={{ padding: '6px 12px', fontSize: 13 }}
                    onClick={() => onGift(npcId, id)}
                  >
                    {ITEMS[id].emoji} {ITEM_NAMES[language][id]} ({qty})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
