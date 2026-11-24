import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { Direction, FarmSnapshot, ItemId } from '../types/game';

export interface RealtimePosPayload {
  peerId: string;
  name: string;
  level: number;
  gold: number;
  x: number;
  y: number;
  facing: Direction;
  shirtColor: string;
  hatColor: string;
  room: string;
  visitingFarmOwnerId?: string | null;
}

export interface RealtimeChatPayload {
  peerId: string;
  sender: string;
  text: string;
  room: string;
}

export interface RealtimeEmotePayload {
  peerId: string;
  sender: string;
  emote: string;
  room: string;
}

export interface RealtimeGiftPayload {
  fromPeerId: string;
  fromName: string;
  toPeerId: string;
  kind: 'gold' | 'item';
  amount?: number;
  itemId?: ItemId;
  qty?: number;
  room: string;
}

export interface RealtimeFarmHelpPayload {
  fromPeerId: string;
  fromName: string;
  toPeerId: string;
  room: string;
}

export interface MultiplayerCallbacks {
  onStatusChange: (status: 'connecting' | 'connected' | 'local') => void;
  onPeerMove: (payload: RealtimePosPayload) => void;
  onPeerLeave: (peerId: string) => void;
  onPeerFarmSnapshot: (snapshot: FarmSnapshot) => void;
  onPeerHello: (fromPeerId: string) => void;
  onFarmHelped: (payload: RealtimeFarmHelpPayload) => void;
  onChat: (payload: RealtimeChatPayload) => void;
  onEmote: (payload: RealtimeEmotePayload) => void;
  onGiftReceived: (payload: RealtimeGiftPayload) => void;
}

export class ValleyRealtimeSession {
  private peerId: string;
  private room: string;
  private callbacks: MultiplayerCallbacks;
  private sbChannel: RealtimeChannel | null = null;
  private bc: BroadcastChannel | null = null;
  private connected = false;
  private presentPeers = new Set<string>();

  constructor(peerId: string, room: string, callbacks: MultiplayerCallbacks) {
    this.peerId = peerId;
    this.room = room.trim().toUpperCase() || 'VALLEY-01';
    this.callbacks = callbacks;
  }

  start(initialPos: RealtimePosPayload, initialFarm?: FarmSnapshot) {
    this.callbacks.onStatusChange('connecting');

    // 1. Local multi-tab BroadcastChannel (zero-latency same-browser sync)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.bc = new BroadcastChannel(`greensaga_rt_${this.room}`);
        this.bc.onmessage = (ev) => {
          const msg = ev.data;
          if (!msg || msg.senderPeerId === this.peerId) return;
          this.handleIncoming(msg.event, msg.payload);
        };
        // Immediately announce presence to any other open browser tabs
        this.bc.postMessage({
          senderPeerId: this.peerId,
          event: 'hello',
          payload: { peerId: this.peerId, room: this.room },
        });
        this.bc.postMessage({
          senderPeerId: this.peerId,
          event: 'pos',
          payload: initialPos,
        });
        if (initialFarm) {
          this.bc.postMessage({
            senderPeerId: this.peerId,
            event: 'farm_snapshot',
            payload: initialFarm,
          });
        }
      } catch {
        this.bc = null;
      }
    }

    // 2. Supabase Realtime Channel (real internet-wide cross-device multiplayer!)
    try {
      const channelName = `greensaga_valley_${this.room}`;
      const ch = supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: this.peerId },
        },
      });

      ch.on('broadcast', { event: 'hello' }, ({ payload }) => {
        this.handleIncoming('hello', payload);
      });
      ch.on('broadcast', { event: 'pos' }, ({ payload }) => {
        this.handleIncoming('pos', payload);
      });
      ch.on('broadcast', { event: 'farm_snapshot' }, ({ payload }) => {
        this.handleIncoming('farm_snapshot', payload);
      });
      ch.on('broadcast', { event: 'farm_help' }, ({ payload }) => {
        this.handleIncoming('farm_help', payload);
      });
      ch.on('broadcast', { event: 'chat' }, ({ payload }) => {
        this.handleIncoming('chat', payload);
      });
      ch.on('broadcast', { event: 'emote' }, ({ payload }) => {
        this.handleIncoming('emote', payload);
      });
      ch.on('broadcast', { event: 'gift' }, ({ payload }) => {
        this.handleIncoming('gift', payload);
      });

      const syncPresenceState = () => {
        const state = ch.presenceState<RealtimePosPayload>();
        const nextSet = new Set<string>();
        for (const [key, presences] of Object.entries(state)) {
          if (key === this.peerId) continue;
          nextSet.add(key);
          const latest = presences[presences.length - 1];
          if (latest && typeof latest.x === 'number') {
            this.callbacks.onPeerMove(latest);
          }
        }
        this.presentPeers = nextSet;
      };

      ch.on('presence', { event: 'sync' }, syncPresenceState);

      ch.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (!key || key === this.peerId) return;
        this.presentPeers.add(key);
        const latest = newPresences?.[newPresences.length - 1] as unknown as RealtimePosPayload | undefined;
        if (latest && typeof latest.x === 'number') {
          this.callbacks.onPeerMove(latest);
        }
        // Trigger immediate handshake reply so the joining player gets our latest pos + farm!
        this.callbacks.onPeerHello(key);
      });

      ch.on('presence', { event: 'leave' }, ({ key }) => {
        if (key && key !== this.peerId) {
          this.presentPeers.delete(key);
          this.callbacks.onPeerLeave(key);
        }
      });

      ch.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          this.connected = true;
          this.callbacks.onStatusChange('connected');
          try {
            await ch.track(initialPos);
          } catch {
            // ignore track error
          }
          // Immediate handshake: announce ourselves + ask peers for their pos & farm snapshot
          this.emit('hello', { peerId: this.peerId, room: this.room });
          this.sendPosition(initialPos);
          if (initialFarm) {
            this.sendFarmSnapshot(initialFarm);
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.connected = false;
          this.callbacks.onStatusChange('local');
        }
      });

      this.sbChannel = ch;
    } catch {
      this.callbacks.onStatusChange('local');
    }
  }

  isPeerInPresence(peerId: string): boolean {
    return this.presentPeers.has(peerId);
  }

  private handleIncoming(event: string, payload: unknown) {
    if (!payload || typeof payload !== 'object') return;
    if (event === 'hello') {
      const h = payload as { peerId?: string };
      if (h.peerId && h.peerId !== this.peerId) {
        this.callbacks.onPeerHello(h.peerId);
      }
    } else if (event === 'pos') {
      const p = payload as RealtimePosPayload;
      if (p.peerId && p.peerId !== this.peerId) {
        this.callbacks.onPeerMove(p);
      }
    } else if (event === 'farm_snapshot') {
      const snap = payload as FarmSnapshot;
      if (snap.ownerId && snap.ownerId !== this.peerId) {
        this.callbacks.onPeerFarmSnapshot(snap);
      }
    } else if (event === 'farm_help') {
      const help = payload as RealtimeFarmHelpPayload;
      if (help.toPeerId === this.peerId) {
        this.callbacks.onFarmHelped(help);
      }
    } else if (event === 'chat') {
      const c = payload as RealtimeChatPayload;
      if (c.peerId && c.peerId !== this.peerId) {
        this.callbacks.onChat(c);
      }
    } else if (event === 'emote') {
      const e = payload as RealtimeEmotePayload;
      if (e.peerId && e.peerId !== this.peerId) {
        this.callbacks.onEmote(e);
      }
    } else if (event === 'gift') {
      const g = payload as RealtimeGiftPayload;
      if (g.toPeerId === this.peerId) {
        this.callbacks.onGiftReceived(g);
      }
    }
  }

  private emit(event: string, payload: unknown) {
    if (this.bc) {
      try {
        this.bc.postMessage({ senderPeerId: this.peerId, event, payload });
      } catch {
        // ignore
      }
    }
    if (this.sbChannel && this.connected) {
      this.sbChannel
        .send({
          type: 'broadcast',
          event,
          payload,
        })
        .catch(() => {});
    }
  }

  sendPosition(payload: RealtimePosPayload) {
    this.emit('pos', payload);
  }

  sendFarmSnapshot(snapshot: FarmSnapshot) {
    this.emit('farm_snapshot', snapshot);
  }

  sendFarmHelp(fromName: string, toPeerId: string) {
    const payload: RealtimeFarmHelpPayload = {
      fromPeerId: this.peerId,
      fromName,
      toPeerId,
      room: this.room,
    };
    this.emit('farm_help', payload);
  }

  updatePresence(payload: RealtimePosPayload) {
    if (this.sbChannel && this.connected) {
      this.sbChannel.track(payload).catch(() => {});
    }
  }

  sendChat(sender: string, text: string) {
    const payload: RealtimeChatPayload = {
      peerId: this.peerId,
      sender,
      text,
      room: this.room,
    };
    this.emit('chat', payload);
  }

  sendEmote(sender: string, emote: string) {
    const payload: RealtimeEmotePayload = {
      peerId: this.peerId,
      sender,
      emote,
      room: this.room,
    };
    this.emit('emote', payload);
  }

  sendGift(gift: Omit<RealtimeGiftPayload, 'fromPeerId' | 'room'>) {
    const payload: RealtimeGiftPayload = {
      ...gift,
      fromPeerId: this.peerId,
      room: this.room,
    };
    this.emit('gift', payload);
  }

  stop() {
    this.connected = false;
    this.presentPeers.clear();
    if (this.bc) {
      this.bc.close();
      this.bc = null;
    }
    if (this.sbChannel) {
      supabase.removeChannel(this.sbChannel).catch(() => {});
      this.sbChannel = null;
    }
  }
}
