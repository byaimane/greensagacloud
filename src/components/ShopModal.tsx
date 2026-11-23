import React, { useState } from 'react';
import { Coins, Lock, Sparkles, Store, X } from 'lucide-react';
import {
  CROP_ORDER,
  CROPS,
  FARM_EXPANSIONS,
  getSellBonusMultiplier,
  HOUSE_UPGRADES,
  ITEMS,
  LIVESTOCK_SHOP,
  SPRINKLER_UPGRADES,
  TOOLS,
} from '../data/crops';
import { getEffectiveSellPrice, getItemCount } from '../engine/gameLogic';
import { ITEM_NAMES, t, TOOL_NAMES } from '../i18n/translations';
import { AdminConfig } from '../types/admin';
import { AnimalSpecies, GameState, ItemId, ToolId } from '../types/game';

interface ShopModalProps {
  state: GameState;
  adminConfig?: AdminConfig;
  onClickAd?: (adId: string) => void;
  onBuyItem: (itemId: ItemId, qty: number) => void;
  onSellItem: (itemId: ItemId, qty: number) => void;
  onSellAllProduce: () => void;
  onUpgradeTool: (toolId: ToolId) => void;
  onExpandFarm: () => void;
  onUpgradeSprinkler: () => void;
  onUpgradeHouse: () => void;
  onAdoptLivestock: (species: AnimalSpecies) => void;
  onClose: () => void;
}

type ShopTab = 'buy' | 'sell' | 'upgrades' | 'livestock';

export const ShopModal: React.FC<ShopModalProps> = ({
  state,
  adminConfig,
  onClickAd,
  onBuyItem,
  onSellItem,
  onSellAllProduce,
  onUpgradeTool,
  onExpandFarm,
  onUpgradeSprinkler,
  onUpgradeHouse,
  onAdoptLivestock,
  onClose,
}) => {
  const [tab, setTab] = useState<ShopTab>('buy');
  const { player, language } = state;
  const sellBonusPct = Math.round((getSellBonusMultiplier(player.level) - 1) * 100);
  const shopAd = adminConfig?.ads.find((a) => a.active && a.placement === 'shop_banner');

  const buyableItems: ItemId[] = [
    ...CROP_ORDER.map((c) => CROPS[c].seedId),
    'fertilizer',
    'animal_feed',
  ];

  const sellableEntries = (Object.entries(state.inventory) as Array<[ItemId, number]>).filter(
    ([id, qty]) => qty > 0 && ITEMS[id]?.sellPrice
  );

  const produceTotalValue = sellableEntries.reduce((acc, [id, qty]) => {
    const def = ITEMS[id];
    if (
      def.category === 'crop' ||
      def.category === 'animal_product' ||
      def.category === 'fruit' ||
      def.category === 'artisan'
    ) {
      return acc + getEffectiveSellPrice(state, id) * qty;
    }
    return acc;
  }, 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="rpg-panel modal-card" style={{ maxWidth: 780 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Store size={22} color="#fde047" />
            <div>
              <h2 className="font-display" style={{ margin: 0, fontSize: 20 }}>
                Maya’s GreenSAGA {t(language, 'market')}
              </h2>
              <div style={{ fontSize: 12, color: '#fde68a' }}>
                {sellBonusPct > 0 ? `+${sellBonusPct}% ${t(language, 'sellBonus')} ★` : 'GreenSAGA Valley Co-op'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(0,0,0,0.32)',
                padding: '5px 12px',
                borderRadius: 999,
                color: '#fde047',
                fontWeight: 800,
              }}
            >
              <Coins size={16} />
              {player.gold.toLocaleString()}g
            </div>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#fef3c7', cursor: 'pointer' }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="tab-bar">
          <button className={`tab-btn ${tab === 'buy' ? 'active' : ''}`} onClick={() => setTab('buy')}>
            🌱 {t(language, 'buyTab')}
          </button>
          <button className={`tab-btn ${tab === 'sell' ? 'active' : ''}`} onClick={() => setTab('sell')}>
            💰 {t(language, 'sellTab')} ({sellableEntries.length})
          </button>
          <button className={`tab-btn ${tab === 'upgrades' ? 'active' : ''}`} onClick={() => setTab('upgrades')}>
            ⚒️ {t(language, 'upgradeTab')}
          </button>
          <button className={`tab-btn ${tab === 'livestock' ? 'active' : ''}`} onClick={() => setTab('livestock')}>
            🐄 {t(language, 'livestockTab')}
          </button>
        </div>

        <div className="modal-body">
          {shopAd && (
            <div
              className="ad-banner-card"
              style={{ borderColor: shopAd.accentColor, marginBottom: 12, padding: '8px 12px' }}
            >
              <div>
                <span className="ad-sponsored-tag" style={{ background: shopAd.accentColor }}>
                  PROMO
                </span>
                <b style={{ marginInlineStart: 8, fontSize: 13.5 }}>{shopAd.title}</b>
                <div style={{ fontSize: 12, color: '#57534e' }}>{shopAd.description}</div>
              </div>
              <button
                className="rpg-btn rpg-btn-gold"
                style={{ fontSize: 11.5, padding: '5px 10px' }}
                onClick={() => {
                  onClickAd?.(shopAd.id);
                  setTab('buy');
                }}
              >
                {shopAd.ctaLabel}
              </button>
            </div>
          )}

          {tab === 'buy' && (
            <div className="item-grid">
              {buyableItems.map((id) => {
                const item = ITEMS[id];
                const crop = item.cropId ? CROPS[item.cropId] : null;
                const locked = (item.unlockLevel ?? 1) > player.level;
                const price = item.buyPrice ?? 0;
                const owned = getItemCount(state, id);

                return (
                  <div key={id} className={`item-card ${locked ? 'locked' : ''}`}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 26 }}>{item.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>
                          {ITEM_NAMES[language][id]}{' '}
                          <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700 }}>({owned})</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: '#57534e' }}>
                          {crop
                            ? `${getEffectiveSellPrice(state, crop.id)}g · +${crop.xpReward} XP · ${crop.growthSeconds}s`
                            : item.description}
                        </div>
                      </div>
                    </div>

                    {locked ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 800, color: '#78716c' }}>
                        <Lock size={14} /> Lv.{item.unlockLevel}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                        <button
                          className="rpg-btn rpg-btn-primary"
                          style={{ padding: '5px 9px', fontSize: 12 }}
                          disabled={player.gold < price}
                          onClick={() => onBuyItem(id, 1)}
                        >
                          +1 ({price}g)
                        </button>
                        <button
                          className="rpg-btn rpg-btn-gold"
                          style={{ padding: '5px 8px', fontSize: 12 }}
                          disabled={player.gold < price * 5}
                          onClick={() => onBuyItem(id, 5)}
                        >
                          ×5
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'sell' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#fef9c3',
                  border: '2px solid #eab308',
                  borderRadius: 12,
                  padding: '10px 14px',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{t(language, 'sellAllTitle')}</div>
                  <div style={{ fontSize: 12, color: '#713f12' }}>{t(language, 'sellAllDesc')}</div>
                </div>
                <button
                  className="rpg-btn rpg-btn-gold"
                  disabled={produceTotalValue <= 0}
                  onClick={onSellAllProduce}
                >
                  {t(language, 'sellAllBtn')} (+{produceTotalValue}g)
                </button>
              </div>

              {sellableEntries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#78716c' }}>
                  {t(language, 'emptyBasket')}
                </div>
              ) : (
                <div className="item-grid">
                  {sellableEntries.map(([id, qty]) => {
                    const item = ITEMS[id];
                    const unit = getEffectiveSellPrice(state, id);
                    return (
                      <div key={id} className="item-card">
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <span style={{ fontSize: 26 }}>{item.emoji}</span>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 14 }}>
                              {ITEM_NAMES[language][id]} ×{qty}
                            </div>
                            <div style={{ fontSize: 12, color: '#57534e' }}>{unit}g / unit</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button
                            className="rpg-btn rpg-btn-neutral"
                            style={{ padding: '5px 9px', fontSize: 12 }}
                            onClick={() => onSellItem(id, 1)}
                          >
                            -1
                          </button>
                          <button
                            className="rpg-btn rpg-btn-gold"
                            style={{ padding: '5px 9px', fontSize: 12 }}
                            onClick={() => onSellItem(id, qty)}
                          >
                            {unit * qty}g
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'upgrades' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Tools */}
              <div>
                <h3 className="font-display" style={{ margin: '0 0 8px', fontSize: 15, color: '#78350f' }}>
                  {t(language, 'toolUpgrades')}
                </h3>
                <div className="item-grid">
                  {(['hoe', 'watering_can', 'scythe'] as ToolId[]).map((toolId) => {
                    const info = TOOLS[toolId];
                    const curTier = player.toolTiers[toolId];
                    const isMax = curTier >= 3;
                    const nextTier = (curTier + 1) as 2 | 3;
                    const req = !isMax ? info.upgradeCosts[nextTier] : null;
                    const locked = req ? player.level < req.level : false;
                    return (
                      <div key={toolId} className={`item-card ${locked ? 'locked' : ''}`}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 13.5 }}>
                            {TOOL_NAMES[language][toolId][curTier]}
                            {!isMax && (
                              <span style={{ color: '#16a34a' }}>
                                {' '}
                                → {TOOL_NAMES[language][toolId][nextTier]}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#57534e' }}>
                            {isMax ? 'Master 3×3' : req?.areaDesc}
                          </div>
                        </div>
                        {isMax ? (
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#16a34a', display: 'inline-flex', gap: 3 }}>
                            <Sparkles size={14} /> {t(language, 'maxed')}
                          </span>
                        ) : req && locked ? (
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#78716c' }}>
                            <Lock size={13} /> Lv.{req.level}
                          </span>
                        ) : (
                          req && (
                            <button
                              className="rpg-btn rpg-btn-primary"
                              style={{ padding: '6px 11px', fontSize: 12 }}
                              disabled={player.gold < req.gold}
                              onClick={() => onUpgradeTool(toolId)}
                            >
                              {req.gold}g
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Automated Irrigation Sprinklers */}
              <div>
                <h3 className="font-display" style={{ margin: '0 0 8px', fontSize: 15, color: '#78350f' }}>
                  💧 {t(language, 'sprinklerUpgrades')}
                </h3>
                <div className="item-grid">
                  {SPRINKLER_UPGRADES.map((sp) => {
                    const owned = state.sprinklerLevel >= sp.level;
                    const isNext = state.sprinklerLevel + 1 === sp.level;
                    const locked = player.level < sp.reqLevel || !isNext;
                    return (
                      <div key={sp.level} className={`item-card ${!owned && locked ? 'locked' : ''}`}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 13.5 }}>{sp.name}</div>
                          <div style={{ fontSize: 11.5, color: '#57534e' }}>{sp.desc}</div>
                        </div>
                        {owned ? (
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#16a34a' }}>{t(language, 'owned')}</span>
                        ) : !isNext ? (
                          <span style={{ fontSize: 11, color: '#78716c' }}>Tier {sp.level - 1} first</span>
                        ) : player.level < sp.reqLevel ? (
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#78716c' }}>
                            <Lock size={13} /> Lv.{sp.reqLevel}
                          </span>
                        ) : (
                          <button
                            className="rpg-btn rpg-btn-primary"
                            style={{ padding: '6px 11px', fontSize: 12 }}
                            disabled={player.gold < sp.gold}
                            onClick={onUpgradeSprinkler}
                          >
                            {sp.gold}g
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Farm Expansions */}
              <div>
                <h3 className="font-display" style={{ margin: '0 0 8px', fontSize: 15, color: '#78350f' }}>
                  🌾 {t(language, 'farmExpansions')}
                </h3>
                <div className="item-grid">
                  {FARM_EXPANSIONS.map((exp) => {
                    const owned = state.farmExpansionLevel >= exp.level;
                    const isNext = state.farmExpansionLevel + 1 === exp.level;
                    const locked = player.level < exp.reqLevel || !isNext;
                    return (
                      <div key={exp.level} className={`item-card ${!owned && locked ? 'locked' : ''}`}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 13.5 }}>{exp.name}</div>
                          <div style={{ fontSize: 11.5, color: '#57534e' }}>{exp.plotsLabel}</div>
                        </div>
                        {owned ? (
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#16a34a' }}>{t(language, 'owned')}</span>
                        ) : !isNext ? (
                          <span style={{ fontSize: 11, color: '#78716c' }}>Previous first</span>
                        ) : player.level < exp.reqLevel ? (
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#78716c' }}>
                            <Lock size={13} /> Lv.{exp.reqLevel}
                          </span>
                        ) : (
                          <button
                            className="rpg-btn rpg-btn-gold"
                            style={{ padding: '6px 11px', fontSize: 12 }}
                            disabled={player.gold < exp.gold}
                            onClick={onExpandFarm}
                          >
                            {exp.gold}g
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Farmhouse Upgrades */}
              <div>
                <h3 className="font-display" style={{ margin: '0 0 8px', fontSize: 15, color: '#78350f' }}>
                  🏡 {t(language, 'houseUpgrades')}
                </h3>
                <div className="item-grid">
                  {HOUSE_UPGRADES.map((hu) => {
                    const owned = state.houseLevel >= hu.level;
                    const isNext = state.houseLevel + 1 === hu.level;
                    const locked = player.level < hu.reqLevel || !isNext;
                    return (
                      <div key={hu.level} className={`item-card ${!owned && locked ? 'locked' : ''}`}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 13.5 }}>{hu.name}</div>
                          <div style={{ fontSize: 11.5, color: '#57534e' }}>{hu.desc}</div>
                        </div>
                        {owned ? (
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#16a34a' }}>{t(language, 'owned')}</span>
                        ) : !isNext ? (
                          <span style={{ fontSize: 11, color: '#78716c' }}>Upgrade Manor first</span>
                        ) : player.level < hu.reqLevel ? (
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#78716c' }}>
                            <Lock size={13} /> Lv.{hu.reqLevel}
                          </span>
                        ) : (
                          <button
                            className="rpg-btn rpg-btn-warm"
                            style={{ padding: '6px 11px', fontSize: 12 }}
                            disabled={player.gold < hu.gold}
                            onClick={onUpgradeHouse}
                          >
                            {hu.gold}g
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'livestock' && (
            <div className="item-grid">
              {LIVESTOCK_SHOP.map((l) => {
                const count = state.livestock.filter((a) => a.species === l.species).length;
                const full = count >= l.maxCount;
                const locked = player.level < l.reqLevel;
                return (
                  <div key={l.species} className={`item-card ${locked ? 'locked' : ''}`}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 32 }}>{l.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14.5 }}>
                          {l.name}{' '}
                          <span style={{ fontSize: 12, color: '#78716c' }}>
                            ({count}/{l.maxCount})
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#57534e' }}>{l.produces}</div>
                      </div>
                    </div>

                    {full ? (
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#16a34a' }}>{t(language, 'pastureFull')}</span>
                    ) : locked ? (
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#78716c' }}>
                        <Lock size={13} /> Lv.{l.reqLevel}
                      </span>
                    ) : (
                      <button
                        className="rpg-btn rpg-btn-primary"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        disabled={player.gold < l.price}
                        onClick={() => onAdoptLivestock(l.species)}
                      >
                        {t(language, 'adopt')} ({l.price}g)
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
