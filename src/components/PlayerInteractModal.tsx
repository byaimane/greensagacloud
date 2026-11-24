import React from 'react';
import { Coins, Gift, Hand, MessageCircle, X } from 'lucide-react';
import { ITEMS } from '../data/crops';
import { ITEM_NAMES } from '../i18n/translations';
import { GameState, ItemId, RemoteFarmer } from '../types/game';

interface PlayerInteractModalProps {
  state: GameState;
  farmer: RemoteFarmer;
  onWave: (farmer: RemoteFarmer) => void;
  onGiftGold: (farmer: RemoteFarmer, amount: number) => void;
  onGiftItem: (farmer: RemoteFarmer, itemId: ItemId) => void;
  onQuickGreet: (farmer: RemoteFarmer) => void;
  onClose: () => void;
}

export const PlayerInteractModal: React.FC<PlayerInteractModalProps> = ({
  state,
  farmer,
  onWave,
  onGiftGold,
  onGiftItem,
  onQuickGreet,
  onClose,
}) => {
  const { language, player } = state;
  const giftableItems = (Object.entries(state.inventory) as Array<[ItemId, number]>).filter(
    ([id, qty]) =>
      qty > 0 &&
      (ITEMS[id].category === 'crop' ||
        ITEMS[id].category === 'fruit' ||
        ITEMS[id].category === 'animal_product' ||
        ITEMS[id].category === 'artisan')
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="rpg-panel modal-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: farmer.shirtColor,
                border: `3px solid ${farmer.hatColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              {farmer.isRealPlayer ? '⭐' : '🤖'}
            </div>
            <div>
              <h2 className="font-display" style={{ margin: 0, fontSize: 19 }}>
                {farmer.name}{' '}
                <span style={{ fontSize: 12, color: '#fde047' }}>Lv.{farmer.level}</span>
              </h2>
              <div style={{ fontSize: 11.5, color: '#fde68a' }}>
                {farmer.isRealPlayer
                  ? '🟢 Real Online Farmer (Live Sync)'
                  : `🤖 AI Farmer · ${farmer.activity || 'Exploring Valley'}`}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#fef3c7', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Quick Social Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="rpg-btn rpg-btn-primary"
              style={{ flex: 1, fontSize: 13 }}
              onClick={() => onWave(farmer)}
            >
              <Hand size={15} /> Wave 👋 {!farmer.wavedToday && '(+20g)'}
            </button>
            <button
              className="rpg-btn rpg-btn-indigo"
              style={{ flex: 1, fontSize: 13 }}
              onClick={() => {
                onQuickGreet(farmer);
                onClose();
              }}
            >
              <MessageCircle size={15} /> Say Hello!
            </button>
          </div>

          {/* Gift Gold */}
          <div className="item-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13.5, color: '#78350f' }}>
              <Coins size={15} color="#ca8a04" /> Send Gold Gift (Your Gold: {player.gold}g)
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="rpg-btn rpg-btn-gold"
                style={{ flex: 1, fontSize: 12.5, padding: '7px 10px' }}
                disabled={player.gold < 50}
                onClick={() => onGiftGold(farmer, 50)}
              >
                Gift 50g 💰
              </button>
              <button
                className="rpg-btn rpg-btn-warm"
                style={{ flex: 1, fontSize: 12.5, padding: '7px 10px' }}
                disabled={player.gold < 100}
                onClick={() => onGiftGold(farmer, 100)}
              >
                Gift 100g 💰
              </button>
            </div>
          </div>

          {/* Trade / Send Crop or Artisan Item */}
          <div className="item-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13.5, color: '#78350f' }}>
              <Gift size={15} color="#ec4899" /> Trade / Gift Harvested Item
            </div>
            {giftableItems.length === 0 ? (
              <div style={{ fontSize: 12, color: '#78716c' }}>
                Harvest crops, orchard fruit, eggs, milk, or artisan goods to gift to {farmer.name}!
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {giftableItems.map(([id, qty]) => (
                  <button
                    key={id}
                    className="rpg-btn rpg-btn-neutral"
                    style={{ padding: '5px 10px', fontSize: 12 }}
                    onClick={() => onGiftItem(farmer, id)}
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
