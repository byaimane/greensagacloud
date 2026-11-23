import React, { useState } from 'react';
import { Compass, Droplets, Hand, Map, Send, Sparkles, Users, X } from 'lucide-react';
import { CROPS } from '../data/crops';
import { WORLD_REGIONS } from '../data/worldMap';
import { CROP_NAMES, t } from '../i18n/translations';
import { ChatMessage, GameState, NeighborFarm, RemoteFarmer } from '../types/game';

interface MultiplayerMapModalProps {
  state: GameState;
  remoteFarmers: RemoteFarmer[];
  chatMessages: ChatMessage[];
  onFastTravel: (region: 'homestead' | 'village' | 'plaza') => void;
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
  const [chatInput, setChatInput] = useState('');

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
      <div className="rpg-panel modal-card" style={{ maxWidth: 880 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Map size={22} color="#fde047" />
            <div>
              <h2 className="font-display" style={{ margin: 0, fontSize: 20 }}>
                {t(language, 'mpTitle')}
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

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
              padding: '10px 12px',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700 }}>
              {t(language, 'yourName')}:
              <input
                value={nameInput}
                maxLength={18}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={() => onUpdateProfile(nameInput.trim() || 'Farmer GreenSAGA', roomInput.trim().toUpperCase() || 'VALLEY-01')}
                className="rpg-input"
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700 }}>
              {t(language, 'roomCode')}:
              <input
                value={roomInput}
                maxLength={12}
                onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                onBlur={() => onUpdateProfile(nameInput.trim() || 'Farmer GreenSAGA', roomInput.trim().toUpperCase() || 'VALLEY-01')}
                className="rpg-input"
                style={{ width: 112 }}
              />
            </label>
            <button
              className="rpg-btn rpg-btn-gold"
              style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={() => {
                onUpdateProfile(nameInput.trim() || 'Farmer GreenSAGA', roomInput.trim().toUpperCase() || 'VALLEY-01');
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
              <Users size={15} /> {remoteFarmers.length + 1} {t(language, 'onlinePlayers')}
            </span>
          </div>

          {/* Interactive Map + Right Panel Grid */}
          <div className="mp-grid">
            {/* Interactive Valley World Map */}
            <div className="mp-map-board">
              {/* Creek river decoration */}
              <div className="mp-river-line" />
              <div className="mp-road-line" />

              {/* Core Fast Travel Regions */}
              <button
                className="mp-node mp-node-core"
                style={{ left: `${WORLD_REGIONS.homestead.mapX}%`, top: `${WORLD_REGIONS.homestead.mapY}%`, background: '#16a34a' }}
                onClick={() => {
                  onFastTravel('homestead');
                  onClose();
                }}
              >
                <span>🏡</span>
                <b>GreenSAGA Farm</b>
              </button>

              <button
                className="mp-node mp-node-core"
                style={{ left: `${WORLD_REGIONS.village.mapX}%`, top: `${WORLD_REGIONS.village.mapY}%`, background: '#ea580c' }}
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
                style={{ left: `${WORLD_REGIONS.plaza.mapX}%`, top: `${WORLD_REGIONS.plaza.mapY}%`, background: '#4f46e5' }}
                onClick={() => {
                  onFastTravel('plaza');
                  onClose();
                }}
              >
                <span>🌐</span>
                <b>MP Plaza ({remoteFarmers.length + 1})</b>
              </button>

              {/* Neighbor Farms */}
              {neighbors.map((nbr) => {
                const isSelected = activeNeighbor?.id === nbr.id;
                return (
                  <button
                    key={nbr.id}
                    className={`mp-node mp-node-neighbor ${isSelected ? 'selected' : ''}`}
                    style={{ left: `${nbr.mapX}%`, top: `${nbr.mapY}%`, borderColor: nbr.accentColor }}
                    onClick={() => setSelectedNeighbor(nbr)}
                  >
                    <span
                      className="mp-dot"
                      style={{ background: nbr.online ? '#22c55e' : '#94a3b8' }}
                    />
                    <b>{nbr.ownerName}</b>
                    <span style={{ fontSize: 10, opacity: 0.85 }}>Lv.{nbr.level}</span>
                  </button>
                );
              })}

              {/* Live Player Marker */}
              <div
                className="mp-you-ping"
                style={{
                  left: `${Math.min(92, Math.max(8, (player.x / 38) * 100))}%`,
                  top: `${Math.min(90, Math.max(10, (player.y / 22) * 100))}%`,
                }}
                title="You are here"
              />
            </div>

            {/* Right Sidebar: Selected Neighbor Farm + Live Valley Chat */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Neighbor Interaction Card */}
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
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: activeNeighbor.online ? '#dcfce7' : '#f5f5f4',
                        color: activeNeighbor.online ? '#15803d' : '#78716c',
                      }}
                    >
                      {activeNeighbor.online ? '● Online' : 'Offline'}
                    </span>
                  </div>

                  <div style={{ fontSize: 12.5, color: '#78350f', fontWeight: 700 }}>
                    Specialty Crop: <span style={{ color: CROPS[activeNeighbor.specialtyCrop].color }}>●</span>{' '}
                    {CROP_NAMES[language][activeNeighbor.specialtyCrop]}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className="rpg-btn rpg-btn-primary"
                      style={{ flex: 1, fontSize: 12, padding: '7px 10px' }}
                      disabled={activeNeighbor.wateredToday}
                      onClick={() => onHelpNeighbor(activeNeighbor.id)}
                    >
                      <Droplets size={14} />
                      {activeNeighbor.wateredToday ? t(language, 'helpedDone') : t(language, 'visitHelp')}
                    </button>
                    <button
                      className="rpg-btn rpg-btn-gold"
                      style={{ flex: 1, fontSize: 12, padding: '7px 10px' }}
                      disabled={activeNeighbor.harvestedToday}
                      onClick={() => onPickNeighborCrop(activeNeighbor.id)}
                    >
                      <Sparkles size={14} />
                      {activeNeighbor.harvestedToday ? t(language, 'pickedDone') : t(language, 'visitHarvest')}
                    </button>
                  </div>
                </div>
              )}

              {/* Fast Travel Quick Buttons */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="rpg-btn rpg-btn-neutral"
                  style={{ flex: 1, fontSize: 11.5, padding: '6px 8px' }}
                  onClick={() => {
                    onFastTravel('homestead');
                    onClose();
                  }}
                >
                  <Compass size={13} /> Farm
                </button>
                <button
                  className="rpg-btn rpg-btn-neutral"
                  style={{ flex: 1, fontSize: 11.5, padding: '6px 8px' }}
                  onClick={() => {
                    onFastTravel('village');
                    onClose();
                  }}
                >
                  <Compass size={13} /> Village
                </button>
                <button
                  className="rpg-btn rpg-btn-warm"
                  style={{ flex: 1, fontSize: 11.5, padding: '6px 8px' }}
                  onClick={() => {
                    onFastTravel('plaza');
                    onClose();
                  }}
                >
                  <Compass size={13} /> MP Plaza
                </button>
              </div>

              {/* Live AI & Player Valley Leaderboard */}
              <div
                style={{
                  background: '#fff',
                  border: '2px solid #e7e5e4',
                  borderRadius: 12,
                  padding: '8px 10px',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 12, color: '#78350f', marginBottom: 6 }}>
                  🏆 Live Valley Players ({remoteFarmers.length + 1} Active)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 105, overflowY: 'auto' }}>
                  {[
                    {
                      id: 'you',
                      name: `${player.name} (You)`,
                      level: player.level,
                      gold: player.gold,
                      activity: 'Playing Live',
                      isAi: false,
                    },
                    ...remoteFarmers.map((rf) => ({
                      id: rf.id,
                      name: rf.name,
                      level: rf.level,
                      gold: rf.gold ?? rf.level * 240,
                      activity: rf.activity || 'Exploring',
                      isAi: !rf.isRealPlayer,
                    })),
                  ]
                    .sort((a, b) => b.gold - a.gold)
                    .map((entry, idx) => (
                      <div
                        key={entry.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 11.5,
                          padding: '3px 6px',
                          borderRadius: 8,
                          background: entry.id === 'you' ? '#fef9c3' : '#f8fafc',
                        }}
                      >
                        <span style={{ fontWeight: 800 }}>
                          #{idx + 1} {entry.isAi ? '🤖' : '⭐'} {entry.name}{' '}
                          <span style={{ fontWeight: 600, color: '#64748b' }}>({entry.activity})</span>
                        </span>
                        <span style={{ fontWeight: 800, color: '#ca8a04' }}>
                          Lv.{entry.level} · {entry.gold.toLocaleString()}g
                        </span>
                      </div>
                    ))}
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
