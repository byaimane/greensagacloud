import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Wifi, X } from 'lucide-react';
import { ChatMessage } from '../types/game';

interface LiveChatOverlayProps {
  open: boolean;
  roomCode: string;
  rtStatus: 'connecting' | 'connected' | 'local';
  realPlayerCount: number;
  messages: ChatMessage[];
  onSendChat: (text: string) => void;
  onSendEmote: (emote: string) => void;
  onClose: () => void;
}

const QUICK_EMOTES = ['👋', '❤️', '🌾', '🎉', '🍓', '⭐'];

export const LiveChatOverlay: React.FC<LiveChatOverlayProps> = ({
  open,
  roomCode,
  rtStatus,
  realPlayerCount,
  messages,
  onSendChat,
  onSendEmote,
  onClose,
}) => {
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendChat(trimmed);
    setText('');
  };

  return (
    <div className="live-chat-drawer hud-interactive">
      <div className="live-chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MessageCircle size={15} color="#fde047" />
          <span className="font-display" style={{ fontSize: 13.5, fontWeight: 700 }}>
            Valley Chat · {roomCode}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 10,
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: 999,
              background:
                rtStatus === 'connected'
                  ? 'rgba(34, 197, 94, 0.25)'
                  : 'rgba(250, 204, 21, 0.22)',
              color: rtStatus === 'connected' ? '#86efac' : '#fde047',
            }}
          >
            <Wifi size={10} />
            {rtStatus === 'connected' ? `Live (${realPlayerCount})` : 'Local'}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#cbd5e1',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
          }}
        >
          <X size={16} />
        </button>
      </div>

      <div ref={listRef} className="live-chat-list">
        {messages.map((m) => (
          <div key={m.id} className="live-chat-row">
            <span style={{ opacity: 0.55, fontSize: 10, marginInlineEnd: 4 }}>{m.time}</span>
            <b style={{ color: m.system ? '#86efac' : '#fde047' }}>{m.sender}:</b>{' '}
            <span>{m.text}</span>
          </div>
        ))}
      </div>

      {/* Quick Emote Bar */}
      <div className="live-chat-emotes">
        {QUICK_EMOTES.map((em) => (
          <button
            key={em}
            type="button"
            className="live-emote-btn"
            onClick={() => onSendEmote(em)}
            title={`Send ${em} emote`}
          >
            {em}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="live-chat-form">
        <input
          value={text}
          maxLength={140}
          onChange={(e) => setText(e.target.value)}
          placeholder="Chat with nearby players..."
          className="live-chat-input"
        />
        <button type="submit" className="rpg-btn rpg-btn-primary" style={{ padding: '6px 10px', fontSize: 12 }}>
          <Send size={13} />
        </button>
      </form>
    </div>
  );
};
