import React, { useState } from 'react';
import { Compass, Droplets, Hand, Home, Map, MapPin, Search, Send, Sparkles, Users, X } from 'lucide-react';
import { CROPS } from '../data/crops';
import { FastTravelRegion, MAP_COLS, MAP_ROWS, WORLD_REGIONS } from '../data/worldMap';
import { CROP_NAMES, t } from '../i18n/translations';
import { ChatMessage, GameState, NeighborFarm, RemoteFarmer } from '../types/game';

interface MultiplayerMapModalProps {
  state: GameState;
  remoteFarmers: RemoteFarmer[];
  chatMessages: ChatMessage[];
  onFastTravel: (region: FastTravelRegion) => void;
  onMeetPlayer: (farmer: RemoteFarmer) => void;
  onVisitPlayerFarm: (farmer: RemoteFarmer) => void;
  onVisitNeighborEstate: (neighborId: string) => void;
  onInteractPlayer: (farmer: RemoteFarmer) => void;
  onUpdateProfile: (name: string, roomCode: string) => void;
  onSendChat: (text: string) => void;
  onWaveEmote: () => void;
  onHelpNeighbor: (neighborId: string) => void;
  onPickNeighborCrop: (neighborId: string) => void;
  onClose: () => void;
}

export const MultiplayerMapModal: React.FC<MultiplayerMapModalProps> = ({
  state,
  remoteFarmers,
  chatMessages,
  onFastTravel,
  onMeetPlayer,
  onVisitPlayerFarm,
  onVisitNeighborEstate,
  onInteractPlayer,
  onUpdateProfile,
  onSendChat,
  onWaveEmote,
  onHelpNeighbor,
  onPickNeighborCrop,
  onClose,
}) => {
  const { language, player, neighbors } = state;
  const [selectedNeighbor, setSelectedNeighbor] = useState<NeighborFarm | null>(neighbors[0] ?? null);
  const [nameInput, setNameInput] = useState(player.name);
  const [roomInput, setRoomInput] = useState(player.roomCode);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');

  const q = searchQuery.trim().toLowerCase();
  const matchingFarmers = remoteFarmers.filter((rf) =>
    !q ? true : rf.name.toLowerCase().includes(q)
  );
  const matchingNeighbors = neighbors.filter((nbr) =>
    !q
      ? true
      : nbr.ownerName.toLowerCase().includes(q) || nbr.farmName.toLowerCase().includes(q)
  );
  const realCount = remoteFarmers.filter((f) => f.isRealPlayer).length + 1;

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    onSendChat(trimmed);
    setChatInput('');
  };

  const activeNeighbor =
    selectedNeighbor ? neighbors.find((n) => n.id === selectedNeighbor.id) ?? selectedNeighbor : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="rpg-panel modal-card" style={{ maxWidth: 920 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Map size={22} color="#fde047" />
            <div>
              <h2 className="font-display" style={{ margin: 0, fontSize: 20 }}>
                {t(language, 'mpTitle')} <span style={{ fontSize: 12, color: '#86efac' }}>· 72×46 Open Valley</span>
              </h2>
              <div style={{ fontSize: 12, color: '#fde68a' }}>{t(language, 'mpSubtitle')}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#fef3c7', cursor: 'pointer' }}
          >
            <X size={21} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Player Multiplayer Profile & Room Code */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 10,
              background: '#fff',
              border: '2px solid #e7e5e4',
              borderRadius: 12,
              padding: '9px 12px',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700 }}>
              {t(language, 'yourName')}:
              <input
                value={nameInput}
                maxLength={18}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={() =>
                  onUpdateProfile(
                    nameInput.trim() || 'Farmer GreenSAGA',
                    roomInput.trim().toUpperCase() || 'VALLEY-01'
                  )
                }
                className="rpg-input"
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700 }}>
              {t(language, 'roomCode')}:
              <input
                value={roomInput}
                maxLength={12}
                onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                onBlur={() =>
                  onUpdateProfile(
                    nameInput.trim() || 'Farmer GreenSAGA',
                    roomInput.trim().toUpperCase() || 'VALLEY-01'
                  )
                }
                className="rpg-input"
                style={{ width: 112 }}
              />
            </label>
            <button
              className="rpg-btn rpg-btn-gold"
              style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={() => {
                onUpdateProfile(
                  nameInput.trim() || 'Farmer GreenSAGA',
                  roomInput.trim().toUpperCase() || 'VALLEY-01'
                );
                onWaveEmote();
              }}
            >
              <Hand size={14} /> {t(language, 'wave')}
            </button>
            <span
              style={{
                marginInlineStart: 'auto',
                fontSize: 12,
                fontWeight: 800,
                color: '#16a34a',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Users size={15} /> {realCount} Real · {remoteFarmers.length + 1} Total
            </span>
          </div>

          {/* Search Users by Name on the Map */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#fff',
              border: '2px solid #818cf8',
              borderRadius: 12,
              padding: '7px 12px',
            }}
          >
            <Search size={16} color="#4f46e5" />
            <input
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                const lower = val.trim().toLowerCase();
                if (lower) {
                  const hit = neighbors.find(
                    (n) => n.ownerName.toLowerCase().includes(lower) || n.farmName.toLowerCase().includes(lower)
                  );
                  if (hit) setSelectedNeighbor(hit);
                }
              }}
              placeholder={
                language === 'fr'
                  ? 'Rechercher un joueur par nom pour le rejoindre ou visiter sa ferme...'
                  : language === 'ar'
                  ? 'ابحث عن لاعب بالاسم للقائه أو زيارة مزرعته...'
                  : 'Search player by name to Meet or Visit their Farm...'
              }
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 700,
                color: '#1e1b4b',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: '#e0e7ff',
                  border: 'none',
                  borderRadius: 999,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#3730a3',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            )}
            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#4f46e5', whiteSpace: 'nowrap' }}>
              {matchingFarmers.length} live
            </span>
          </div>

          {/* Interactive Map + Right Panel Grid */}
          <div className="mp-grid">
            {/* Expanded 72x46 Interactive Valley World Map */}
            <div className="mp-map-board" style={{ minHeight: 340 }}>
              {/* Creek river decoration aligned with x = 16.5 / 72 ≈ 23% */}
              <div className="mp-river-line" style={{ left: '23%' }} />
              <div className="mp-road-line" style={{ top: '22%' }} />
              <div className="mp-road-line" style={{ top: '63%' }} />

              {/* Core Fast Travel Regions */}
              <button
                className="mp-node mp-node-core"
                style={{
                  left: `${WORLD_REGIONS.homestead.mapX}%`,
                  top: `${WORLD_REGIONS.homestead.mapY}%`,
                  background: '#16a34a',
                }}
                onClick={() => {
                  onFastTravel('homestead');
                  onClose();
                }}
              >
                <span>🏡</span>
                <b>My Farm</b>
              </button>

              <button
                className="mp-node mp-node-core"
                style={{
                  left: `${WORLD_REGIONS.village.mapX}%`,
                  top: `${WORLD_REGIONS.village.mapY}%`,
                  background: '#ea580c',
                }}
                onClick={() => {
                  onFastTravel('village');
                  onClose();
                }}
              >
                <span>🏘️</span>
                <b>Cloverbrook</b>
              </button>

              <button
                className="mp-node mp-node-core"
                style={{
                  left: `${WORLD_REGIONS.plaza.mapX}%`,
                  top: `${WORLD_REGIONS.plaza.mapY}%`,
                  background: '#4f46e5',
                }}
                onClick={() => {
                  onFastTravel('plaza');
                  onClose();
                }}
              >
                <span>🌐</span>
                <b>MP Plaza</b>
              </button>

              <button
                className="mp-node mp-node-core"
                style={{
                  left: `${WORLD_REGIONS.lake.mapX}%`,
                  top: `${WORLD_REGIONS.lake.mapY}%`,
                  background: '#0284c7',
                }}
                onClick={() => {
                  onFastTravel('lake');
                  onClose();
                }}
              >
                <span>🌊</span>
                <b>Emerald Lake</b>
              </button>

              {/* Walkable Neighbor Farm Estates */}
              {neighbors.map((nbr) => {
                const isSelected = activeNeighbor?.id === nbr.id;
                const matchesSearch = !q || matchingNeighbors.some((m) => m.id === nbr.id);
                return (
                  <button
                    key={nbr.id}
                    className={`mp-node mp-node-neighbor ${isSelected ? 'selected' : ''}`}
                    style={{
                      left: `${nbr.mapX}%`,
                      top: `${nbr.mapY}%`,
                      borderColor: nbr.accentColor,
                      opacity: matchesSearch ? 1 : 0.25,
                      transform: q && matchesSearch ? 'translate(-50%, -50%) scale(1.12)' : undefined,
                    }}
                    onClick={() => setSelectedNeighbor(nbr)}
                    onDoubleClick={() => {
                      onVisitNeighborEstate(nbr.id);
                      onClose();
                    }}
                  >
                    <span
                      className="mp-dot"
                      style={{ background: nbr.online ? '#22c55e' : '#94a3b8' }}
                    />
                    <b>{nbr.ownerName}</b>
                    <span style={{ fontSize: 10, opacity: 0.85 }}>🏡 Lv.{nbr.level}</span>
                  </button>
                );
              })}

              {/* Live Real Online & AI Farmer Pins Moving on the 72x46 Map! */}
              {remoteFarmers.map((rf) => {
                const isMatch = !q || rf.name.toLowerCase().includes(q);
                const leftPct = Math.min(94, Math.max(6, (rf.x / MAP_COLS) * 100));
                const topPct = Math.min(92, Math.max(8, (rf.y / MAP_ROWS) * 100));
                return (
                  <button
                    key={rf.id}
                    title={`Click to Meet ${rf.name} (Lv.${rf.level})`}
                    onClick={() => {
                      onMeetPlayer(rf);
                      onClose();
                    }}
                    style={{
                      position: 'absolute',
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      transform: `translate(-50%, -50%) scale(${q && isMatch ? 1.25 : rf.isRealPlayer ? 1.08 : 1})`,
                      opacity: isMatch ? 1 : 0.2,
                      background: rf.isRealPlayer ? '#4f46e5' : '#0f172a',
                      color: '#fff',
                      border: q && isMatch ? '2.5px solid #fde047' : rf.isRealPlayer ? '2px solid #86efac' : '2px solid #fff',
                      boxShadow:
                        q && isMatch
                          ? '0 0 0 5px rgba(250, 204, 21, 0.55), 0 4px 10px rgba(0,0,0,0.4)'
                          : rf.isRealPlayer
                          ? '0 0 0 4px rgba(74, 222, 128, 0.35), 0 3px 8px rgba(0,0,0,0.35)'
                          : '0 3px 8px rgba(0,0,0,0.3)',
                      borderRadius: 999,
                      padding: '2px 7px',
                      fontSize: 10,
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      zIndex: q && isMatch ? 9 : rf.isRealPlayer ? 6 : 3,
                    }}
                  >
                    {rf.isRealPlayer ? '★' : '🤖'} {rf.name}
                  </button>
                );
              })}

              {/* Live Player Marker */}
              <div
                className="mp-you-ping"
                style={{
                  left: `${Math.min(93, Math.max(7, (player.x / MAP_COLS) * 100))}%`,
                  top: `${Math.min(91, Math.max(9, (player.y / MAP_ROWS) * 100))}%`,
                }}
                title="You are here"
              />
            </div>

            {/* Right Sidebar: Selected Neighbor Estate + Live Players + Chat */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Neighbor Estate Card with Travel to Farm! */}
              {activeNeighbor && (
                <div className="item-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#292524' }}>
                        {activeNeighbor.farmName}
                      </div>
                      <div style={{ fontSize: 12, color: '#57534e' }}>
                        {activeNeighbor.ownerName} · {t(language, 'level')} {activeNeighbor.level} ·{' '}
                        {activeNeighbor.regionLabel}
                      </div>
                    </div>
                    <button
                      className="rpg-btn rpg-btn-indigo"
                      style={{ fontSize: 11.5, padding: '5px 10px' }}
                      onClick={() => {
                        onVisitNeighborEstate(activeNeighbor.id);
                        onClose();
                      }}
                    >
                      <Home size={13} /> Travel to Farm
                    </button>
                  </div>

                  <div style={{ fontSize: 12, color: '#78350f', fontWeight: 700 }}>
                    Specialty Crop: <span style={{ color: CROPS[activeNeighbor.specialtyCrop].color }}>●</span>{' '}
                    {CROP_NAMES[language][activeNeighbor.specialtyCrop]}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className="rpg-btn rpg-btn-primary"
                      style={{ flex: 1, fontSize: 11.5, padding: '6px 9px' }}
                      disabled={activeNeighbor.wateredToday}
                      onClick={() => onHelpNeighbor(activeNeighbor.id)}
                    >
                      <Droplets size={13} />
                      {activeNeighbor.wateredToday ? t(language, 'helpedDone') : t(language, 'visitHelp')}
                    </button>
                    <button
                      className="rpg-btn rpg-btn-gold"
                      style={{ flex: 1, fontSize: 11.5, padding: '6px 9px' }}
                      disabled={activeNeighbor.harvestedToday}
                      onClick={() => onPickNeighborCrop(activeNeighbor.id)}
                    >
                      <Sparkles size={13} />
                      {activeNeighbor.harvestedToday ? t(language, 'pickedDone') : t(language, 'visitHarvest')}
                    </button>
                  </div>
                </div>
              )}

              {/* Fast Travel Quick Buttons */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {(['homestead', 'village', 'plaza', 'lake'] as FastTravelRegion[]).map((reg) => (
                  <button
                    key={reg}
                    className={`rpg-btn ${reg === 'plaza' ? 'rpg-btn-warm' : 'rpg-btn-neutral'}`}
                    style={{ flex: 1, fontSize: 11, padding: '6px 7px', minWidth: 74 }}
                    onClick={() => {
                      onFastTravel(reg);
                      onClose();
                    }}
                  >
                    <Compass size={12} /> {WORLD_REGIONS[reg].label}
                  </button>
                ))}
              </div>

              {/* Live Real Online & AI Farmers List (Real players sorted first!) */}
              <div
                style={{
                  background: '#fff',
                  border: '2px solid #e7e5e4',
                  borderRadius: 12,
                  padding: '8px 10px',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 12, color: '#78350f', marginBottom: 6 }}>
                  🏆 {q ? `Search Results (${matchingFarmers.length})` : `Live Valley Farmers (${realCount} Real · ${remoteFarmers.length + 1} Active)`}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 145, overflowY: 'auto' }}>
                  {(() => {
                    const list = [
                      ...(!q || player.name.toLowerCase().includes(q)
                        ? [
                            {
                              id: 'you',
                              name: `${player.name} (You)`,
                              level: player.level,
                              gold: player.gold,
                              isReal: true,
                              isYou: true,
                              farmer: null as RemoteFarmer | null,
                            },
                          ]
                        : []),
                      ...matchingFarmers.map((rf) => ({
                        id: rf.id,
                        name: rf.name,
                        level: rf.level,
                        gold: rf.gold ?? rf.level * 240,
                        isReal: rf.isRealPlayer,
                        isYou: false,
                        farmer: rf,
                      })),
                    ].sort((a, b) => {
                      if (a.isReal !== b.isReal) return a.isReal ? -1 : 1;
                      return b.gold - a.gold;
                    });

                    if (list.length === 0) {
                      return (
                        <div style={{ fontSize: 12, color: '#78716c', textAlign: 'center', padding: '10px 0' }}>
                          No player found matching “{searchQuery}”.
                        </div>
                      );
                    }

                    return list.map((entry) => (
                      <div
                        key={entry.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 6,
                          fontSize: 11.5,
                          padding: '4px 6px',
                          borderRadius: 8,
                          background: entry.isYou
                            ? '#fef9c3'
                            : entry.isReal
                            ? '#eef2ff'
                            : '#f8fafc',
                          border: entry.isReal && !entry.isYou ? '1px solid #c7d2fe' : 'none',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontWeight: 800 }}>
                            {entry.isReal ? '★' : '🤖'} {entry.name}
                          </span>{' '}
                          {entry.isReal && !entry.isYou && (
                            <span
                              style={{
                                background: '#22c55e',
                                color: '#fff',
                                borderRadius: 999,
                                padding: '1px 5px',
                                fontSize: 9,
                                fontWeight: 900,
                                marginInlineEnd: 4,
                              }}
                            >
                              LIVE
                            </span>
                          )}
                          <span style={{ fontWeight: 600, color: '#64748b', fontSize: 10.5 }}>
                            Lv.{entry.level}
                          </span>
                        </div>
                        {entry.farmer && (
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => {
                                onMeetPlayer(entry.farmer!);
                                onClose();
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                background: '#4f46e5',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 7,
                                padding: '3px 7px',
                                fontSize: 10.5,
                                fontWeight: 800,
                                cursor: 'pointer',
                              }}
                              title={`Teleport to meet ${entry.name}`}
                            >
                              <MapPin size={11} /> Meet
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onVisitPlayerFarm(entry.farmer!);
                                onClose();
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                background: '#16a34a',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 7,
                                padding: '3px 7px',
                                fontSize: 10.5,
                                fontWeight: 800,
                                cursor: 'pointer',
                              }}
                              title={`Travel to ${entry.name}'s Farm`}
                            >
                              <Home size={11} /> Farm
                            </button>
                            <button
                              type="button"
                              onClick={() => onInteractPlayer(entry.farmer!)}
                              style={{
                                background: '#fef08a',
                                color: '#422006',
                                border: '1px solid #eab308',
                                borderRadius: 7,
                                padding: '3px 6px',
                                fontSize: 10.5,
                                fontWeight: 800,
                                cursor: 'pointer',
                              }}
                              title={`Wave, Gift, or Trade with ${entry.name}`}
                            >
                              👋
                            </button>
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Live Valley Chat */}
              <div className="chat-box">
                <div style={{ fontWeight: 800, fontSize: 12.5, color: '#78350f', marginBottom: 6 }}>
                  💬 {t(language, 'valleyChat')} ({player.roomCode})
                </div>
                <div className="chat-messages">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} style={{ fontSize: 12, lineHeight: 1.4 }}>
                      <span style={{ color: '#a8a29e', fontSize: 10, marginInlineEnd: 4 }}>{msg.time}</span>
                      <b style={{ color: msg.system ? '#16a34a' : '#4f46e5' }}>{msg.sender}:</b>{' '}
                      <span>{msg.text}</span>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Say hello to farmers..."
                    className="rpg-input"
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="rpg-btn rpg-btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>
                    <Send size={13} /> {t(language, 'send')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
