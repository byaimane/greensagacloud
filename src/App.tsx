import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { soundEngine } from './audio/soundEngine';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';
import { ArtisanModal } from './components/ArtisanModal';
import { AuthModal } from './components/AuthModal';
import { BagModal } from './components/BagModal';
import { DaySummaryModal } from './components/DaySummaryModal';
import { HUD } from './components/HUD';
import { LandingPage } from './components/LandingPage';
import { LevelsModal } from './components/LevelsModal';
import { LiveChatOverlay } from './components/LiveChatOverlay';
import { MultiplayerMapModal } from './components/MultiplayerMapModal';
import { NpcModal } from './components/NpcModal';
import { PlayerInteractModal } from './components/PlayerInteractModal';
import { QuestLogModal } from './components/QuestLogModal';
import { ShopModal } from './components/ShopModal';
import { TutorialOverlay } from './components/TutorialOverlay';
import { CROPS, xpRequiredForLevel } from './data/crops';
import { AI_CHAT_LINES, AI_WAYPOINTS, createInitialBotFarmers, NPC_LIST } from './data/npcs';
import {
  getCurrentAccount,
  PlayerAccount,
  signOutPlayerAccount,
} from './engine/accountStore';
import {
  FastTravelRegion,
  FIELD_MAX_H,
  FIELD_MAX_W,
  FIELD_ORIGIN_X,
  FIELD_ORIGIN_Y,
  isPositionBlocked,
  LANDMARKS,
  MAP_COLS,
  MAP_ROWS,
  TILE_SIZE,
  WORLD_ESTATES,
  WORLD_REGIONS,
} from './data/worldMap';
import {
  getActiveTheme,
  isPluginEnabled,
  loadAdminConfig,
  saveAdminConfig,
} from './engine/adminStore';
import {
  fetchLatestAppPush,
  isAdminAuthenticated,
  isAdminRoute,
  logoutAdmin,
  setLastAppliedPushAt,
  setLastAppliedRevision,
  shouldApplyPushBundle,
  startOtaRealtimeSync,
} from './engine/appSyncClient';
import {
  addItem,
  adoptLivestock,
  advanceRealTimeSimulation,
  buildFallbackFarmSnapshot,
  buildFarmSnapshot,
  buyItem,
  completeQuest,
  craftArtisanRecipe,
  createInitialState,
  expandFarm,
  giftNpc,
  grantCoopHelpReward,
  harvestOrchardTree,
  helpNeighborWater,
  HOTBAR_SLOTS,
  interactWithAnimal,
  loadGame,
  performTileAction,
  pickNeighborCrop,
  saveGame,
  sellAllProduce,
  sellItem,
  setRuntimeAdminConfig,
  sleepAndAdvanceDay,
  talkToNpc,
  tileKey,
  upgradeHouse,
  upgradeSprinkler,
  upgradeTool,
} from './engine/gameLogic';
import { getNearestLandmarkPrompt, renderGameWorld } from './engine/renderer';
import {
  fetchCloudChatMessages,
  sendCloudChatMessage,
  syncPlayerSaveToSupabase,
} from './lib/supabaseClient';
import { ValleyRealtimeSession } from './lib/realtimeMultiplayer';
import { CROP_NAMES, ITEM_NAMES } from './i18n/translations';
import { AdminConfig, AppPushBundle, MapPreset } from './types/admin';
import {
  AnimalSpecies,
  ChatMessage,
  DaySummary,
  FarmTile,
  FloatingText,
  GameState,
  ItemId,
  Language,
  NeighborFarm,
  NpcId,
  Particle,
  RemoteFarmer,
  ToolId,
  VisitingFarmState,
} from './types/game';

type ActiveModal =
  | null
  | { type: 'shop' }
  | { type: 'quests' }
  | { type: 'bag' }
  | { type: 'help' }
  | { type: 'levels' }
  | { type: 'artisan' }
  | { type: 'map' }
  | { type: 'npc'; npcId: NpcId }
  | { type: 'player_interact'; farmerId: string }
  | { type: 'day_summary'; summary: DaySummary };

interface PendingClickAction {
  kind: 'tile' | 'npc' | 'animal' | 'landmark' | 'orchard' | 'estate';
  x: number;
  y: number;
  id?: string;
}

const SESSION_PEER_ID = (() => {
  try {
    const existing = sessionStorage.getItem('greensaga_tab_peer_id');
    if (existing) return existing;
    const fresh = `peer_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
    sessionStorage.setItem('greensaga_tab_peer_id', fresh);
    return fresh;
  } catch {
    return `peer_${Math.random().toString(36).slice(2, 9)}`;
  }
})();

function nowTimeStr(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function App() {
  const [adminConfig, setAdminConfig] = useState<AdminConfig>(() => {
    const cfg = loadAdminConfig();
    setRuntimeAdminConfig(cfg);
    return cfg;
  });
  const [adminRouteActive, setAdminRouteActive] = useState(() => isAdminRoute());
  const [adminAuthed, setAdminAuthed] = useState(() => isAdminAuthenticated());
  const [currentAccount, setCurrentAccount] = useState<PlayerAccount | null>(() => getCurrentAccount());
  const [authModalMode, setAuthModalMode] = useState<'register' | 'login' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);
  const [rtStatus, setRtStatus] = useState<'connecting' | 'connected' | 'local'>('connecting');
  const [activeRoomCode, setActiveRoomCode] = useState(() => (loadGame()?.player.roomCode || 'VALLEY-01').trim().toUpperCase());
  const [visitingFarm, setVisitingFarm] = useState<VisitingFarmState | null>(null);
  const [pushBanner, setPushBanner] = useState<{ title: string; body: string; revision: number } | null>(null);
  const [savedPreview, setSavedPreview] = useState<GameState | null>(() => loadGame());
  const [language, setLanguage] = useState<Language>(() => loadGame()?.language ?? 'en');
  const [started, setStarted] = useState(false);
  const [modal, setModal] = useState<ActiveModal>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [, setUiVersion] = useState(0);
  const [fps, setFps] = useState(60);
  const [hoverInfo, setHoverInfo] = useState<{
    tile: FarmTile;
    screenX: number;
    screenY: number;
  } | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome_1',
      sender: 'Valley',
      text: 'Welcome to GreenSAGA Multiplayer Plaza! Open another tab with the same Room Code to see live players!',
      time: nowTimeStr(),
      system: true,
    },
    {
      id: 'welcome_2',
      sender: 'Amine',
      text: 'Salam & Bonjour farmers! My corn fields are thriving today 🌽',
      time: nowTimeStr(),
    },
    {
      id: 'welcome_3',
      sender: 'Claire',
      text: 'Just crafted Ruby Jam at the windmill — sells for 390g! 🍓',
      time: nowTimeStr(),
    },
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(createInitialState(language));
  const remoteFarmersRef = useRef<RemoteFarmer[]>(createInitialBotFarmers());
  const rtSessionRef = useRef<ValleyRealtimeSession | null>(null);
  const chatOpenRef = useRef<boolean>(false);
  const keysRef = useRef<Set<string>>(new Set());
  const cameraRef = useRef({ x: 0, y: 0 });
  const hoverTileRef = useRef<{ x: number; y: number } | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const nextTextIdRef = useRef(1);
  const pendingActionRef = useRef<PendingClickAction | null>(null);
  const modalRef = useRef<ActiveModal>(null);
  const adminConfigRef = useRef<AdminConfig>(adminConfig);
  const adminOpenRef = useRef<boolean>(adminRouteActive);
  const visitingFarmRef = useRef<VisitingFarmState | null>(visitingFarm);
  const helpedRealFarmsRef = useRef<Set<string>>(new Set());
  const toastTimerRef = useRef<number | null>(null);

  modalRef.current = modal;
  adminConfigRef.current = adminConfig;
  adminOpenRef.current = adminRouteActive;
  chatOpenRef.current = chatOpen;
  visitingFarmRef.current = visitingFarm;

  const closeAdminRoute = useCallback(() => {
    setAdminRouteActive(false);
    if (window.location.pathname.toLowerCase().includes('/admin') || window.location.hash.toLowerCase().includes('admin')) {
      try {
        window.history.pushState(null, '', '/');
      } catch {
        window.location.hash = '';
      }
    }
  }, []);

  const handleAdminLogout = useCallback(() => {
    logoutAdmin();
    setAdminAuthed(false);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    const doc = document as Document & {
      webkitFullscreenElement?: Element;
      webkitExitFullscreen?: () => Promise<void>;
    };
    const rootEl = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    const active = Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
    if (!active) {
      if (rootEl.requestFullscreen) {
        rootEl.requestFullscreen().catch(() => {});
      } else if (rootEl.webkitRequestFullscreen) {
        rootEl.webkitRequestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen().catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element };
      setIsFullscreen(Boolean(document.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  // Listen to browser navigation for hidden /admin path
  useEffect(() => {
    const syncRoute = () => {
      setAdminRouteActive(isAdminRoute());
    };
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  const handleUpdateAdminConfig = useCallback((next: AdminConfig) => {
    setAdminConfig(next);
    adminConfigRef.current = next;
    setRuntimeAdminConfig(next);
    saveAdminConfig(next);
  }, []);

  const applyIncomingPushBundle = useCallback(
    (bundle: AppPushBundle) => {
      if (!shouldApplyPushBundle(bundle)) return;
      setLastAppliedRevision(bundle.revision);
      if (bundle.pushedAt) {
        setLastAppliedPushAt(bundle.pushedAt);
      }

      const merged: AdminConfig = {
        ...adminConfigRef.current,
        brandName: bundle.brandName || adminConfigRef.current.brandName,
        pushRevision: Math.max(adminConfigRef.current.pushRevision ?? 0, bundle.revision),
        announcement: bundle.announcement,
        maintenanceMode: bundle.maintenanceMode,
        ads: bundle.ads,
        activeThemeId: bundle.activeThemeId,
        activeMapId: bundle.activeMapId,
        economy: bundle.economy,
        plugins: bundle.plugins,
        levelOverrides: bundle.levelOverrides,
      };
      handleUpdateAdminConfig(merged);

      if (bundle.notification) {
        soundEngine.playHarvest();
        setPushBanner({
          title: bundle.notification.title,
          body: bundle.notification.body,
          revision: bundle.revision,
        });
      }
    },
    [handleUpdateAdminConfig]
  );

  // Live OTA Push Receiver: Supabase Realtime Cloud (<200ms worldwide to Android!) + Supabase DB + Local API + BroadcastChannel
  useEffect(() => {
    let ch: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      ch = new BroadcastChannel('ouagx_app_push_v1');
      ch.onmessage = (ev) => {
        if (ev.data?.type === 'push_bundle' && ev.data.bundle) {
          applyIncomingPushBundle(ev.data.bundle as AppPushBundle);
        }
      };
    }

    // Real-time cloud OTA push listener (works on physical Android phones worldwide, zero SQL tables needed!)
    const stopRealtimeOta = startOtaRealtimeSync((bundle) => {
      applyIncomingPushBundle(bundle);
    });

    const poll = async () => {
      const bundle = await fetchLatestAppPush(adminConfigRef.current.pushServerUrl);
      if (bundle) {
        applyIncomingPushBundle(bundle);
      }
    };

    poll();
    const timer = window.setInterval(poll, 8000);
    return () => {
      window.clearInterval(timer);
      stopRealtimeOta();
      ch?.close();
    };
  }, [applyIncomingPushBundle]);

  const handleClickAd = useCallback((adId: string) => {
    setAdminConfig((prev) => {
      const next: AdminConfig = {
        ...prev,
        ads: prev.ads.map((a) => (a.id === adId ? { ...a, clicks: a.clicks + 1 } : a)),
      };
      saveAdminConfig(next);
      return next;
    });
  }, []);

  // Apply HTML lang + RTL direction whenever language changes
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    stateRef.current.language = language;
  }, [language]);

  const forceUiSync = useCallback(() => {
    setUiVersion((v) => v + 1);
  }, []);

  const handleChangeLanguage = useCallback(
    (lang: Language) => {
      setLanguage(lang);
      stateRef.current.language = lang;
      if (started) {
        saveGame(stateRef.current);
      }
      forceUiSync();
    },
    [forceUiSync, started]
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2900);
  }, []);

  const spawnFloatingText = useCallback((tileX: number, tileY: number, text: string, color = '#fef08a') => {
    floatingTextsRef.current.push({
      id: nextTextIdRef.current++,
      x: (tileX + 0.5) * TILE_SIZE,
      y: tileY * TILE_SIZE,
      text,
      color,
      age: 0,
      duration: 1.35,
    });
  }, []);

  const spawnParticles = useCallback(
    (tileX: number, tileY: number, color: string, count: number, shape: Particle['shape'] = 'circle') => {
      const cx = (tileX + 0.5) * TILE_SIZE;
      const cy = (tileY + 0.5) * TILE_SIZE;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 28 + Math.random() * 64;
        particlesRef.current.push({
          x: cx + (Math.random() - 0.5) * 14,
          y: cy + (Math.random() - 0.5) * 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 48,
          size: shape === 'sparkle' ? 5 : 3 + Math.random() * 2.5,
          color,
          age: 0,
          duration: 0.55 + Math.random() * 0.35,
          gravity: shape === 'heart' ? -22 : 165,
          shape,
        });
      }
    },
    []
  );

  // Live Cross-Device Multiplayer via Supabase Realtime (Presence + Broadcast + Instant Handshake + Farm Sharing)
  useEffect(() => {
    if (!started) return;

    const buildPosPayload = () => {
      const p = stateRef.current.player;
      return {
        peerId: SESSION_PEER_ID,
        room: activeRoomCode,
        name: p.name,
        level: p.level,
        gold: p.gold,
        x: p.x,
        y: p.y,
        facing: p.facing,
        shirtColor: p.shirtColor || '#ef4444',
        hatColor: p.hatColor || '#facc15',
        visitingFarmOwnerId: visitingFarmRef.current?.ownerId ?? null,
      };
    };

    const session = new ValleyRealtimeSession(SESSION_PEER_ID, activeRoomCode, {
      onStatusChange: (status) => setRtStatus(status),
      onPeerHello: () => {
        // Instantly reply with our exact position + live farm snapshot so new peers see us in <250ms!
        session.sendPosition(buildPosPayload());
        session.sendFarmSnapshot(buildFarmSnapshot(stateRef.current, SESSION_PEER_ID));
      },
      onPeerMove: (data) => {
        const list = remoteFarmersRef.current;
        const idx = list.findIndex((f) => f.id === data.peerId);
        if (idx >= 0) {
          list[idx].targetX = data.x;
          list[idx].targetY = data.y;
          list[idx].name = data.name;
          list[idx].level = data.level;
          list[idx].gold = data.gold;
          list[idx].facing = data.facing;
          list[idx].shirtColor = data.shirtColor || list[idx].shirtColor;
          list[idx].hatColor = data.hatColor || list[idx].hatColor;
          list[idx].visitingFarmOwnerId = data.visitingFarmOwnerId ?? null;
          list[idx].lastSeen = Date.now();
        } else {
          list.push({
            id: data.peerId,
            name: data.name,
            level: data.level,
            gold: data.gold,
            activity: 'Online Now',
            room: data.room,
            x: data.x,
            y: data.y,
            targetX: data.x,
            targetY: data.y,
            facing: data.facing,
            shirtColor: data.shirtColor || '#4f46e5',
            hatColor: data.hatColor || '#fde047',
            isRealPlayer: true,
            visitingFarmOwnerId: data.visitingFarmOwnerId ?? null,
            lastSeen: Date.now(),
          });
          setChatMessages((prev) => [
            ...prev.slice(-28),
            {
              id: `join_${Date.now()}_${data.peerId}`,
              sender: 'Valley',
              text: `🌟 ${data.name} (Lv.${data.level}) joined Room ${activeRoomCode}! Tap Meet or Visit Farm!`,
              time: nowTimeStr(),
              system: true,
            },
          ]);
          showToast(`🌟 ${data.name} joined! Tap "Meet" or "Visit Farm" at top!`);
          forceUiSync();
        }
      },
      onPeerLeave: (peerId) => {
        const leaving = remoteFarmersRef.current.find((f) => f.id === peerId);
        remoteFarmersRef.current = remoteFarmersRef.current.filter((f) => f.id !== peerId);
        if (leaving) {
          forceUiSync();
        }
      },
      onPeerFarmSnapshot: (snap) => {
        const rf = remoteFarmersRef.current.find((f) => f.id === snap.ownerId);
        if (rf) {
          rf.farmSnapshot = snap;
        }
        if (visitingFarmRef.current && visitingFarmRef.current.ownerId === snap.ownerId) {
          setVisitingFarm((prev) => (prev ? { ...prev, snapshot: snap, level: snap.level } : prev));
        }
      },
      onFarmHelped: (help) => {
        const st = stateRef.current;
        let wateredCount = 0;
        Object.values(st.tiles).forEach((t) => {
          if (t.unlocked && t.tilled && !t.watered) {
            t.watered = true;
            wateredCount += 1;
          }
        });
        soundEngine.playWater();
        soundEngine.playHarvest();
        spawnParticles(st.player.x - 0.5, st.player.y - 0.6, '#38bdf8', 16, 'sparkle');
        spawnFloatingText(
          st.player.x - 0.5,
          st.player.y - 1.1,
          `💧 ${help.fromName} watered your farm!`,
          '#7dd3fc'
        );
        showToast(
          wateredCount > 0
            ? `💧 ${help.fromName} visited your farm and watered ${wateredCount} plots!`
            : `💧 ${help.fromName} visited your farm and blessed your crops!`
        );
        saveGame(st);
        session.sendFarmSnapshot(buildFarmSnapshot(st, SESSION_PEER_ID));
        forceUiSync();
      },
      onChat: (data) => {
        const rf = remoteFarmersRef.current.find((f) => f.id === data.peerId);
        if (rf) {
          rf.chatBubble = data.text;
          rf.chatBubbleTimer = 4.6;
        }
        setChatMessages((prev) => [
          ...prev.slice(-28),
          { id: `rt_${Date.now()}_${Math.random()}`, sender: data.sender, text: data.text, time: nowTimeStr() },
        ]);
        if (!chatOpenRef.current) setUnreadChat((u) => u + 1);
      },
      onEmote: (data) => {
        const rf = remoteFarmersRef.current.find((f) => f.id === data.peerId);
        if (rf) {
          rf.emote = data.emote;
          rf.emoteTimer = 2.8;
          spawnParticles(rf.x - 0.5, rf.y - 0.6, '#fde047', 6, 'sparkle');
        }
      },
      onGiftReceived: (gift) => {
        const st = stateRef.current;
        if (gift.kind === 'gold' && gift.amount) {
          st.player.gold += gift.amount;
          st.stats.goldEarned += gift.amount;
          soundEngine.playCoin();
          spawnParticles(st.player.x - 0.5, st.player.y - 0.6, '#facc15', 14, 'sparkle');
          spawnFloatingText(st.player.x - 0.5, st.player.y - 1.1, `+${gift.amount}g from ${gift.fromName}!`, '#fde047');
          showToast(`💰 ${gift.fromName} sent you +${gift.amount}g!`);
        } else if (gift.kind === 'item' && gift.itemId) {
          const q = gift.qty ?? 1;
          addItem(st, gift.itemId, q);
          soundEngine.playHarvest();
          spawnParticles(st.player.x - 0.5, st.player.y - 0.6, '#f472b6', 12, 'heart');
          spawnFloatingText(
            st.player.x - 0.5,
            st.player.y - 1.1,
            `+${q} ${ITEM_NAMES[st.language][gift.itemId]}!`,
            '#fda4af'
          );
          showToast(`🎁 ${gift.fromName} gifted you ${q}× ${ITEM_NAMES[st.language][gift.itemId]}!`);
        }
        saveGame(st);
        forceUiSync();
      },
    });

    session.start(buildPosPayload(), buildFarmSnapshot(stateRef.current, SESSION_PEER_ID));
    rtSessionRef.current = session;

    let lastSentX = stateRef.current.player.x;
    let lastSentY = stateRef.current.player.y;
    let tickCount = 0;

    const pingInterval = window.setInterval(() => {
      const p = stateRef.current.player;
      tickCount += 1;
      const moved = Math.hypot(p.x - lastSentX, p.y - lastSentY) > 0.03;
      if (moved || tickCount % 10 === 0) {
        lastSentX = p.x;
        lastSentY = p.y;
        const payload = buildPosPayload();
        session.sendPosition(payload);
        if (tickCount % 25 === 0) {
          session.updatePresence(payload);
        }
      }
      if (tickCount % 60 === 0) {
        session.sendFarmSnapshot(buildFarmSnapshot(stateRef.current, SESSION_PEER_ID));
      }
      // Keep peers alive if they are in Supabase Presence OR heard within 35s (handles background tab throttling)
      const now = Date.now();
      const before = remoteFarmersRef.current.length;
      remoteFarmersRef.current = remoteFarmersRef.current.filter(
        (f) => !f.isRealPlayer || session.isPeerInPresence(f.id) || now - f.lastSeen < 35000
      );
      if (remoteFarmersRef.current.length !== before) {
        forceUiSync();
      }
    }, 110);

    return () => {
      window.clearInterval(pingInterval);
      session.stop();
      rtSessionRef.current = null;
    };
  }, [activeRoomCode, forceUiSync, showToast, spawnFloatingText, spawnParticles, started]);

  const handleTileAction = useCallback(
    (tx: number, ty: number) => {
      const state = stateRef.current;
      const dx = tx + 0.5 - state.player.x;
      const dy = ty + 0.5 - state.player.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        state.player.facing = dx >= 0 ? 'right' : 'left';
      } else {
        state.player.facing = dy >= 0 ? 'down' : 'up';
      }

      const res = performTileAction(state, tx, ty);
      if (res.actionType === 'error' && res.message) {
        soundEngine.playError();
        showToast(res.message);
        return;
      }
      if (!res.performed) return;

      if (res.actionType === 'till') {
        soundEngine.playTill();
        res.affectedCoords.forEach((c) => spawnParticles(c.x, c.y, '#9c6b3b', 7, 'square'));
      } else if (res.actionType === 'water') {
        soundEngine.playWater();
        res.affectedCoords.forEach((c) => spawnParticles(c.x, c.y, '#38bdf8', 9, 'circle'));
      } else if (res.actionType === 'plant') {
        soundEngine.playPlant();
        res.affectedCoords.forEach((c) => spawnParticles(c.x, c.y, '#86efac', 7, 'circle'));
      } else if (res.actionType === 'fertilize') {
        soundEngine.playFertilize();
        res.affectedCoords.forEach((c) => spawnParticles(c.x, c.y, '#4ade80', 10, 'sparkle'));
        spawnFloatingText(tx, ty, '+60% ✨', '#86efac');
      } else if (res.actionType === 'weed') {
        soundEngine.playWeed();
        res.affectedCoords.forEach((c) => spawnParticles(c.x, c.y, '#65a30d', 8, 'square'));
      } else if (res.actionType === 'harvest') {
        soundEngine.playHarvest();
        res.harvestedItems.forEach((h) => {
          spawnParticles(h.x, h.y, CROPS[h.cropId].color, 11, 'sparkle');
          spawnFloatingText(h.x, h.y, `+${h.qty} ${CROP_NAMES[state.language][h.cropId]}`, '#fef08a');
        });
      }

      if (res.xpGained > 0) {
        spawnFloatingText(tx, ty - 0.45, `+${res.xpGained} XP`, '#93c5fd');
      }

      if (res.leveledUp) {
        soundEngine.playLevelUp();
        spawnParticles(state.player.x - 0.5, state.player.y - 0.5, '#facc15', 24, 'sparkle');
        spawnFloatingText(state.player.x - 0.5, state.player.y - 1.1, `LEVEL UP! Lv.${state.player.level}`, '#fde047');
        showToast(`🎉 Level Up! Lv.${state.player.level} — Check Levels (L) for new unlocks!`);
      }
      rtSessionRef.current?.sendFarmSnapshot(buildFarmSnapshot(state, SESSION_PEER_ID));
      forceUiSync();
    },
    [forceUiSync, showToast, spawnFloatingText, spawnParticles]
  );

  const handleHelpVisitingRealFarm = useCallback(
    (tx: number, ty: number) => {
      const vf = visitingFarmRef.current;
      if (!vf) return;
      if (vf.helpedToday || helpedRealFarmsRef.current.has(vf.ownerId)) {
        soundEngine.playWater();
        spawnParticles(tx, ty, '#38bdf8', 8, 'circle');
        showToast(`💧 Already watered ${vf.ownerName}'s farm today!`);
        return;
      }
      helpedRealFarmsRef.current.add(vf.ownerId);
      setVisitingFarm((prev) => (prev ? { ...prev, helpedToday: true } : prev));
      const res = grantCoopHelpReward(stateRef.current);
      if (vf.isRealPlayer) {
        rtSessionRef.current?.sendFarmHelp(stateRef.current.player.name, vf.ownerId);
      }
      soundEngine.playWater();
      soundEngine.playCoin();
      spawnParticles(tx, ty, '#38bdf8', 14, 'sparkle');
      spawnFloatingText(tx, ty - 0.5, '+30g  +24 XP 💧', '#7dd3fc');
      showToast(
        res.leveledUp
          ? `🎉 Watered ${vf.ownerName}'s farm & LEVEL UP!`
          : `💧 Watered ${vf.ownerName}'s farm! +30g & +24 XP`
      );
      forceUiSync();
    },
    [forceUiSync, showToast, spawnFloatingText, spawnParticles]
  );

  const handleSleep = useCallback(() => {
    const summary = sleepAndAdvanceDay(stateRef.current);
    syncPlayerSaveToSupabase(stateRef.current).catch(() => {});
    soundEngine.playMorning();
    setModal({ type: 'day_summary', summary });
    forceUiSync();
  }, [forceUiSync]);

  const handleTriggerLandmarkOrEntity = useCallback(
    (id: string) => {
      const state = stateRef.current;

      if (id.startsWith('farmer:')) {
        const farmerId = id.slice(7);
        soundEngine.playClick();
        setModal({ type: 'player_interact', farmerId });
        return;
      }

      if (id.startsWith('estate:')) {
        const neighborId = id.slice(7);
        const nbr = state.neighbors.find((n) => n.id === neighborId);
        const est = WORLD_ESTATES.find((e) => e.neighborId === neighborId);
        if (!nbr || !est) return;
        if (!nbr.wateredToday) {
          const res = helpNeighborWater(state, neighborId);
          if (res.success) {
            soundEngine.playWater();
            soundEngine.playCoin();
            spawnParticles(est.signX - 0.5, est.signY - 0.4, '#38bdf8', 14, 'sparkle');
            spawnFloatingText(est.signX - 0.5, est.signY - 0.8, '+25g  +20 XP 💧', '#7dd3fc');
            showToast(
              res.leveledUp
                ? `🎉 Watered ${est.ownerName}'s Farm & LEVEL UP!`
                : `💧 Watered ${est.ownerName}'s crops! +25g & +20 XP`
            );
            forceUiSync();
          }
        } else if (!nbr.harvestedToday) {
          const res = pickNeighborCrop(state, neighborId);
          if (res.success && res.cropId) {
            soundEngine.playHarvest();
            spawnParticles(est.signX - 0.5, est.signY - 0.4, '#facc15', 14, 'sparkle');
            spawnFloatingText(
              est.signX - 0.5,
              est.signY - 0.8,
              `+1 ${CROP_NAMES[state.language][res.cropId]}!`,
              '#fef08a'
            );
            showToast(`🌾 Picked +1 ${CROP_NAMES[state.language][res.cropId]} at ${est.farmName}!`);
            forceUiSync();
          }
        } else {
          soundEngine.playClick();
          showToast(`✓ You already helped & harvested at ${est.farmName} today!`);
        }
        return;
      }

      if (id.startsWith('npc:')) {
        const npcId = id.slice(4) as NpcId;
        const { firstToday } = talkToNpc(state, npcId);
        soundEngine.playClick();
        if (firstToday) {
          const npc = NPC_LIST.find((n) => n.id === npcId);
          if (npc) {
            spawnParticles(npc.x - 0.5, npc.y - 0.7, '#fb7185', 5, 'heart');
            spawnFloatingText(npc.x - 0.5, npc.y - 0.9, '+6 ♥  +8 XP', '#fda4af');
          }
        }
        setModal({ type: 'npc', npcId });
        forceUiSync();
        return;
      }

      if (id.startsWith('orchard:')) {
        const treeId = id.slice(8);
        const res = harvestOrchardTree(state, treeId);
        if (res) {
          const tree = state.orchardTrees.find((t) => t.id === treeId);
          soundEngine.playHarvest();
          if (tree) {
            spawnParticles(tree.x - 0.5, tree.y - 0.5, res.fruit === 'apple' ? '#ef4444' : '#fb7185', 12, 'sparkle');
            spawnFloatingText(
              tree.x - 0.5,
              tree.y - 0.9,
              `+${res.picked} ${ITEM_NAMES[state.language][res.fruit]}`,
              '#fef08a'
            );
          }
          if (res.leveledUp) {
            soundEngine.playLevelUp();
            showToast(`🎉 Level Up! Lv.${state.player.level}!`);
          }
          forceUiSync();
        }
        return;
      }

      if (id.startsWith('animal:')) {
        const animalId = id.slice(7);
        const animal = state.livestock.find((a) => a.id === animalId);
        if (!animal) return;
        const res = interactWithAnimal(state, animal);
        soundEngine.playAnimal(animal.species === 'sheep' ? 'chicken' : animal.species);
        if (res.type === 'collect' && res.product) {
          soundEngine.playHarvest();
          spawnParticles(animal.x - 0.5, animal.y - 0.5, '#fde047', 10, 'sparkle');
          spawnFloatingText(animal.x - 0.5, animal.y - 0.8, `+1 ${ITEM_NAMES[state.language][res.product]}`, '#fef08a');
        } else if (res.type === 'feed' || res.type === 'pet') {
          spawnParticles(animal.x - 0.5, animal.y - 0.5, '#f43f5e', 6, 'heart');
          if (res.xpGained > 0) {
            spawnFloatingText(animal.x - 0.5, animal.y - 0.8, `+${res.xpGained} XP ♥`, '#fda4af');
          }
        }
        if (res.leveledUp) {
          soundEngine.playLevelUp();
          showToast(`🎉 Level Up! Lv.${state.player.level}!`);
        }
        showToast(res.message);
        forceUiSync();
        return;
      }

      if (id === 'landmark:farmhouseDoor') {
        handleSleep();
      } else if (id === 'landmark:artisanMill') {
        soundEngine.playClick();
        setModal({ type: 'artisan' });
      } else if (id === 'landmark:marketStall') {
        soundEngine.playClick();
        setModal({ type: 'shop' });
      } else if (id === 'landmark:questBoard') {
        soundEngine.playClick();
        setModal({ type: 'quests' });
      } else if (id === 'landmark:mpSignpost') {
        soundEngine.playClick();
        setModal({ type: 'map' });
      } else if (id === 'landmark:shippingBin') {
        const earned = sellAllProduce(state);
        if (earned > 0) {
          soundEngine.playCoin();
          spawnParticles(LANDMARKS.shippingBin.x - 0.5, LANDMARKS.shippingBin.y - 0.5, '#facc15', 14, 'sparkle');
          spawnFloatingText(LANDMARKS.shippingBin.x - 0.5, LANDMARKS.shippingBin.y - 0.8, `+${earned}g`, '#fde047');
          showToast(`+${earned}g!`);
        } else {
          soundEngine.playClick();
          showToast('Shipping Bin sells all crops, fruits, animal & artisan goods instantly!');
        }
        forceUiSync();
      } else if (id === 'landmark:waterWell') {
        soundEngine.playWater();
        spawnParticles(LANDMARKS.waterWell.x - 0.5, LANDMARKS.waterWell.y - 0.5, '#38bdf8', 12, 'circle');
        state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + 8);
        spawnFloatingText(LANDMARKS.waterWell.x - 0.5, LANDMARKS.waterWell.y - 0.8, '+8 ⚡ 💧', '#7dd3fc');
        forceUiSync();
      } else if (id === 'landmark:lakePier') {
        soundEngine.playWater();
        spawnParticles(LANDMARKS.lakePier.x - 0.5, LANDMARKS.lakePier.y - 0.5, '#38bdf8', 14, 'sparkle');
        state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + 12);
        spawnFloatingText(LANDMARKS.lakePier.x - 0.5, LANDMARKS.lakePier.y - 0.8, '+12 ⚡ Lake Breeze 🌊', '#7dd3fc');
        showToast('🌊 Relaxed on Emerald Lake Pier! +12 Stamina restored.');
        forceUiSync();
      }
    },
    [forceUiSync, handleSleep, showToast, spawnFloatingText, spawnParticles]
  );

  const handlePrimaryInteract = useCallback(() => {
    const state = stateRef.current;
    const prompt = getNearestLandmarkPrompt(state, remoteFarmersRef.current, visitingFarmRef.current);
    if (prompt) {
      handleTriggerLandmarkOrEntity(prompt.id);
      return;
    }
    const offsets = {
      up: { dx: 0, dy: -0.9 },
      down: { dx: 0, dy: 0.9 },
      left: { dx: -0.9, dy: 0 },
      right: { dx: 0.9, dy: 0 },
    };
    const off = offsets[state.player.facing];
    const frontX = Math.floor(state.player.x + off.dx);
    const frontY = Math.floor(state.player.y + off.dy);
    if (visitingFarmRef.current) {
      if (
        frontX >= FIELD_ORIGIN_X &&
        frontX < FIELD_ORIGIN_X + FIELD_MAX_W &&
        frontY >= FIELD_ORIGIN_Y &&
        frontY < FIELD_ORIGIN_Y + FIELD_MAX_H
      ) {
        handleHelpVisitingRealFarm(frontX, frontY);
      }
      return;
    }
    if (state.tiles[tileKey(frontX, frontY)]?.unlocked) {
      handleTileAction(frontX, frontY);
      return;
    }
    const underX = Math.floor(state.player.x);
    const underY = Math.floor(state.player.y);
    if (state.tiles[tileKey(underX, underY)]?.unlocked) {
      handleTileAction(underX, underY);
    }
  }, [handleHelpVisitingRealFarm, handleTileAction, handleTriggerLandmarkOrEntity]);

  const startNewGame = () => {
    const fresh = createInitialState(language);
    if (currentAccount) {
      fresh.player.name = currentAccount.username;
      fresh.player.shirtColor = currentAccount.shirtColor;
      fresh.player.hatColor = currentAccount.hatColor;
    }
    if (isPluginEnabled(adminConfigRef.current, 'starter_welcome_pack')) {
      fresh.player.gold += 250;
      addItem(fresh, 'fertilizer', 5);
    }
    const activeMap = adminConfigRef.current.maps.find((m) => m.id === adminConfigRef.current.activeMapId);
    if (activeMap) {
      fresh.player.roomCode = activeMap.defaultRoomCode;
    }
    setActiveRoomCode((fresh.player.roomCode || 'VALLEY-01').trim().toUpperCase());
    setVisitingFarm(null);
    stateRef.current = fresh;
    soundEngine.muted = false;
    soundEngine.playMorning();
    saveGame(fresh);
    setSavedPreview(fresh);
    setStarted(true);
    setModal({ type: 'help' });
    forceUiSync();
  };

  const handleAccountAuthenticated = (account: PlayerAccount, isNew: boolean) => {
    setCurrentAccount(account);
    setAuthModalMode(null);
    // Register into Admin Users directory if new
    if (!adminConfigRef.current.users.some((u) => u.email.toLowerCase() === account.email.toLowerCase())) {
      const nextAdmin: AdminConfig = {
        ...adminConfigRef.current,
        users: [
          ...adminConfigRef.current.users,
          {
            id: account.id,
            username: account.username,
            email: account.email,
            role: 'player',
            status: 'active',
            level: 1,
            gold: 180,
            day: 1,
            joinedDate: account.createdAt,
          },
        ],
      };
      handleUpdateAdminConfig(nextAdmin);
    }

    const existing = loadGame();
    const targetState = existing ?? createInitialState(language);
    targetState.player.name = account.username;
    targetState.player.shirtColor = account.shirtColor;
    targetState.player.hatColor = account.hatColor;
    targetState.language = language;
    setActiveRoomCode((targetState.player.roomCode || 'VALLEY-01').trim().toUpperCase());
    setVisitingFarm(null);
    stateRef.current = targetState;
    saveGame(targetState);
    syncPlayerSaveToSupabase(targetState).catch(() => {});
    setSavedPreview({ ...targetState });
    soundEngine.playLevelUp();
    setStarted(true);
    if (isNew && !existing) {
      setModal({ type: 'help' });
    }
    showToast(`🌾 Welcome, ${account.username}! Account linked & ready.`);
    forceUiSync();
  };

  const handleSignOutAccount = async () => {
    await signOutPlayerAccount();
    setCurrentAccount(null);
    showToast('Signed out cleanly.');
  };

  const handleLiveGameAction = useCallback(
    (
      action:
        | { type: 'grant_gold'; amount: number }
        | { type: 'set_level'; level: number }
        | { type: 'toggle_weather' }
        | { type: 'refill_stamina' }
        | { type: 'unlock_all_plots' }
        | { type: 'sync_player_user'; name: string; gold: number; level: number }
        | { type: 'add_neighbor'; neighbor: NeighborFarm }
        | { type: 'remove_neighbor'; id: string }
        | { type: 'apply_map'; map: MapPreset }
        | { type: 'reset_save' }
    ) => {
      const st = stateRef.current;
      if (action.type === 'grant_gold') {
        st.player.gold += action.amount;
        st.stats.goldEarned += action.amount;
      } else if (action.type === 'set_level') {
        st.player.level = Math.min(10, Math.max(1, action.level));
        st.player.xp = 0;
        st.player.xpToNext = xpRequiredForLevel(st.player.level);
        st.player.maxStamina = 100 + (st.player.level - 1) * 12;
        st.player.stamina = st.player.maxStamina;
      } else if (action.type === 'toggle_weather') {
        st.weather = st.weather === 'sunny' ? 'rainy' : 'sunny';
        if (st.weather === 'rainy') {
          Object.values(st.tiles).forEach((t) => {
            if (t.unlocked && t.tilled) t.watered = true;
          });
        }
      } else if (action.type === 'refill_stamina') {
        st.player.stamina = st.player.maxStamina;
      } else if (action.type === 'unlock_all_plots') {
        st.farmExpansionLevel = 3;
        Object.values(st.tiles).forEach((t) => {
          t.unlocked = true;
        });
      } else if (action.type === 'add_neighbor') {
        st.neighbors = [...st.neighbors, action.neighbor];
      } else if (action.type === 'remove_neighbor') {
        st.neighbors = st.neighbors.filter((n) => n.id !== action.id);
      } else if (action.type === 'apply_map') {
        st.player.roomCode = action.map.defaultRoomCode;
        setActiveRoomCode((action.map.defaultRoomCode || 'VALLEY-01').trim().toUpperCase());
      } else if (action.type === 'reset_save') {
        const fresh = createInitialState(language);
        stateRef.current = fresh;
        saveGame(fresh);
        setSavedPreview(fresh);
        forceUiSync();
        return;
      }
      saveGame(st);
      setSavedPreview({ ...st });
      forceUiSync();
    },
    [forceUiSync, language]
  );

  const continueGame = () => {
    const loaded = loadGame();
    if (loaded) {
      loaded.language = language;
      // Align saved neighbor map coordinates with expanded 72x46 estates
      const estateCoords: Record<string, { mapX: number; mapY: number }> = {
        nbr_amine: { mapX: 13, mapY: 67 },
        nbr_claire: { mapX: 82, mapY: 18 },
        nbr_yasmine: { mapX: 39, mapY: 79 },
        nbr_leo: { mapX: 79, mapY: 69 },
      };
      loaded.neighbors = loaded.neighbors.map((n) =>
        estateCoords[n.id] ? { ...n, ...estateCoords[n.id] } : n
      );
      setActiveRoomCode((loaded.player.roomCode || 'VALLEY-01').trim().toUpperCase());
      setVisitingFarm(null);
      stateRef.current = loaded;
      soundEngine.muted = loaded.muted;
      soundEngine.playClick();
      setStarted(true);
      forceUiSync();
    } else {
      startNewGame();
    }
  };

  const handleGoHome = () => {
    saveGame(stateRef.current);
    setSavedPreview({ ...stateRef.current });
    setModal(null);
    setStarted(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!started) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Don't hijack typing inside inputs (like Valley Chat or Farmer Name)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') setModal(null);
        return;
      }

      const k = e.key.toLowerCase();
      if (k === 'escape') {
        if (adminOpenRef.current) {
          closeAdminRoute();
          return;
        }
        if (modalRef.current) setModal(null);
        return;
      }
      if (modalRef.current || adminOpenRef.current) return;

      if (['w', 'z', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        keysRef.current.add(k);
        stateRef.current.player.targetX = null;
        stateRef.current.player.targetY = null;
        pendingActionRef.current = null;
      }

      if (k === 'e' || k === ' ') {
        e.preventDefault();
        handlePrimaryInteract();
      } else if (k === 'q') {
        soundEngine.playClick();
        setModal({ type: 'quests' });
      } else if (k === 'b') {
        soundEngine.playClick();
        setModal({ type: 'bag' });
      } else if (k === 'm') {
        soundEngine.playClick();
        setModal({ type: 'shop' });
      } else if (k === 'g') {
        soundEngine.playClick();
        setModal({ type: 'map' });
      } else if (k === 'l') {
        soundEngine.playClick();
        setModal({ type: 'levels' });
      } else if (k === 'h') {
        soundEngine.playClick();
        setModal({ type: 'help' });
      } else if (k === 'f') {
        handleToggleFullscreen();
      } else if (k === 't') {
        soundEngine.playClick();
        setChatOpen((o) => {
          if (!o) setUnreadChat(0);
          return !o;
        });
      } else if (k >= '1' && k <= '9') {
        const idx = Number(k) - 1;
        if (idx < HOTBAR_SLOTS.length) {
          stateRef.current.selectedHotbarIndex = idx;
          soundEngine.playClick();
          forceUiSync();
        }
      } else if (k === '0') {
        stateRef.current.selectedHotbarIndex = 9;
        soundEngine.playClick();
        forceUiSync();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    const onWheel = (e: WheelEvent) => {
      if (modalRef.current) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      const len = HOTBAR_SLOTS.length;
      stateRef.current.selectedHotbarIndex =
        (stateRef.current.selectedHotbarIndex + dir + len) % len;
      forceUiSync();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('wheel', onWheel);
    };
  }, [forceUiSync, handlePrimaryInteract, started]);

  // Periodic Auto-Save (Local + Supabase Cloud) & HUD Sync
  useEffect(() => {
    if (!started) return;
    const hudInterval = window.setInterval(() => forceUiSync(), 180);
    const saveInterval = window.setInterval(() => {
      saveGame(stateRef.current);
      syncPlayerSaveToSupabase(stateRef.current).catch(() => {});
      setSavedPreview(stateRef.current);
    }, 15000);
    // Load latest Supabase cloud valley chat for active room
    fetchCloudChatMessages(stateRef.current.player.roomCode).then((cloudMsgs) => {
      if (cloudMsgs.length > 0) {
        setChatMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          return [...prev, ...cloudMsgs.filter((m) => !seen.has(m.id))].slice(-25);
        });
      }
    });
    return () => {
      window.clearInterval(hudInterval);
      window.clearInterval(saveInterval);
    };
  }, [forceUiSync, started]);

  // Main 60 FPS Canvas Loop
  useEffect(() => {
    if (!started) return;
    let rafId = 0;
    let lastTime = performance.now();
    let fpsFrames = 0;
    let fpsTimer = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      fpsFrames += 1;
      fpsTimer += dt;
      if (fpsTimer >= 0.5) {
        setFps(Math.round(fpsFrames / fpsTimer));
        fpsFrames = 0;
        fpsTimer = 0;
      }

      const canvas = canvasRef.current;
      const state = stateRef.current;

      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
          canvas.width = Math.round(rect.width * dpr);
          canvas.height = Math.round(rect.height * dpr);
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (!modalRef.current && !adminOpenRef.current) {
            advanceRealTimeSimulation(state, dt);

            // PLUGIN: Auto-Harvest Magnet harvests mature crops within 1.25 tiles (own farm only)
            if (!visitingFarmRef.current && isPluginEnabled(adminConfigRef.current, 'auto_harvest_aura')) {
              const px = Math.floor(state.player.x);
              const py = Math.floor(state.player.y);
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  const t = state.tiles[tileKey(px + dx, py + dy)];
                  if (t?.unlocked && t.crop && t.crop.progress >= 1) {
                    handleTileAction(t.x, t.y);
                  }
                }
              }
            }

            // Tick local player speech bubble & emote timers
            if ((state.player.chatBubbleTimer ?? 0) > 0) {
              state.player.chatBubbleTimer = Math.max(0, (state.player.chatBubbleTimer ?? 0) - dt);
            }
            if ((state.player.emoteTimer ?? 0) > 0) {
              state.player.emoteTimer = Math.max(0, (state.player.emoteTimer ?? 0) - dt);
            }

            // Autonomous AI Players + Smooth Lerp for Real Online Players!
            for (const rf of remoteFarmersRef.current) {
              if ((rf.emoteTimer ?? 0) > 0) {
                rf.emoteTimer = Math.max(0, (rf.emoteTimer ?? 0) - dt);
              }
              if ((rf.chatBubbleTimer ?? 0) > 0) {
                rf.chatBubbleTimer = Math.max(0, (rf.chatBubbleTimer ?? 0) - dt);
              }
              if (rf.isRealPlayer) {
                // Smooth 60 FPS movement interpolation for real remote players!
                rf.x += (rf.targetX - rf.x) * Math.min(1, dt * 11);
                rf.y += (rf.targetY - rf.y) * Math.min(1, dt * 11);
                continue;
              }

              rf.aiTimer = (rf.aiTimer ?? 5) - dt;
              const dx = rf.targetX - rf.x;
              const dy = rf.targetY - rf.y;
              const dist = Math.hypot(dx, dy);

              if (dist < 0.16) {
                if (rf.aiTimer <= 0) {
                  const wp = AI_WAYPOINTS[Math.floor(Math.random() * AI_WAYPOINTS.length)];
                  rf.targetX = wp.x + (Math.random() - 0.5) * 1.4;
                  rf.targetY = wp.y + (Math.random() - 0.5) * 1.2;
                  rf.activity = wp.activity;
                  rf.emote = wp.emote;
                  rf.emoteTimer = 2.6;
                  rf.gold = (rf.gold ?? 500) + 15 + Math.floor(Math.random() * 45);
                  if (rf.level < 10 && Math.random() < 0.08) {
                    rf.level += 1;
                    rf.emote = '⭐';
                  }
                  rf.aiTimer = 4 + Math.random() * 6;

                  // Occasional friendly live AI chat message!
                  if (Math.random() < 0.16) {
                    const line = AI_CHAT_LINES[Math.floor(Math.random() * AI_CHAT_LINES.length)];
                    setChatMessages((prev) => [
                      ...prev.slice(-24),
                      { id: `ai_${Date.now()}_${rf.id}`, sender: `🤖 ${rf.name}`, text: line, time: nowTimeStr() },
                    ]);
                  }
                }
              } else {
                const mx = (dx / dist) * 1.45 * dt;
                const my = (dy / dist) * 1.45 * dt;
                if (!isPositionBlocked(rf.x + mx, rf.y)) rf.x += mx;
                if (!isPositionBlocked(rf.x, rf.y + my)) rf.y += my;
                if (isPositionBlocked(rf.x + mx, rf.y) && isPositionBlocked(rf.x, rf.y + my)) {
                  rf.targetX = rf.x;
                  rf.targetY = rf.y;
                  rf.aiTimer = 1.2;
                }
                rf.facing = Math.abs(dx) > Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : dy >= 0 ? 'down' : 'up';
              }
            }

            // Player movement (WASD + ZQSD French AZERTY friendly + Arrows + Click-to-Move)
            const keys = keysRef.current;
            let vx = 0;
            let vy = 0;
            if (keys.has('w') || keys.has('z') || keys.has('arrowup')) vy -= 1;
            if (keys.has('s') || keys.has('arrowdown')) vy += 1;
            if (keys.has('a') || keys.has('arrowleft')) vx -= 1;
            if (keys.has('d') || keys.has('arrowright')) vx += 1;

            const speed = 5.4;

            if (vx !== 0 || vy !== 0) {
              const len = Math.hypot(vx, vy);
              vx /= len;
              vy /= len;
              state.player.facing =
                Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : vy > 0 ? 'down' : 'up';
              const nextX = state.player.x + vx * speed * dt;
              const nextY = state.player.y + vy * speed * dt;
              if (!isPositionBlocked(nextX, state.player.y)) state.player.x = nextX;
              if (!isPositionBlocked(state.player.x, nextY)) state.player.y = nextY;
              state.player.moving = true;
              state.player.walkPhase += dt;
            } else if (state.player.targetX !== null && state.player.targetY !== null) {
              const dx = state.player.targetX - state.player.x;
              const dy = state.player.targetY - state.player.y;
              const dist = Math.hypot(dx, dy);
              const stopDist = pendingActionRef.current ? 1.4 : 0.14;

              if (dist <= stopDist) {
                state.player.targetX = null;
                state.player.targetY = null;
                state.player.moving = false;
                if (pendingActionRef.current) {
                  const act = pendingActionRef.current;
                  pendingActionRef.current = null;
                  if (act.kind === 'tile') handleTileAction(act.x, act.y);
                  else if (act.id) handleTriggerLandmarkOrEntity(act.id);
                }
              } else {
                const mx = (dx / dist) * speed * dt;
                const my = (dy / dist) * speed * dt;
                state.player.facing =
                  Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
                const movedX = !isPositionBlocked(state.player.x + mx, state.player.y);
                const movedY = !isPositionBlocked(state.player.x, state.player.y + my);
                if (movedX) state.player.x += mx;
                if (movedY) state.player.y += my;
                if (!movedX && !movedY) {
                  state.player.targetX = null;
                  state.player.targetY = null;
                  pendingActionRef.current = null;
                  state.player.moving = false;
                } else {
                  state.player.moving = true;
                  state.player.walkPhase += dt;
                }
              }
            } else {
              state.player.moving = false;
            }

            if (state.player.actionAnimTimer > 0) {
              state.player.actionAnimTimer = Math.max(0, state.player.actionAnimTimer - dt);
            }
          }

          // Particles & floating texts
          for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            p.age += dt;
            if (p.age >= p.duration) particlesRef.current.splice(i, 1);
            else {
              p.x += p.vx * dt;
              p.y += p.vy * dt;
              p.vy += p.gravity * dt;
            }
          }
          for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
            const ft = floatingTextsRef.current[i];
            ft.age += dt;
            ft.y -= 28 * dt;
            if (ft.age >= ft.duration) floatingTextsRef.current.splice(i, 1);
          }

          // Camera clamp
          const worldW = MAP_COLS * TILE_SIZE;
          const worldH = MAP_ROWS * TILE_SIZE;
          const desiredX =
            worldW < rect.width
              ? -(rect.width - worldW) / 2
              : Math.max(0, Math.min(worldW - rect.width, state.player.x * TILE_SIZE - rect.width / 2));
          const desiredY =
            worldH < rect.height
              ? -(rect.height - worldH) / 2
              : Math.max(0, Math.min(worldH - rect.height, state.player.y * TILE_SIZE - rect.height / 2));

          cameraRef.current.x += (desiredX - cameraRef.current.x) * Math.min(1, dt * 8);
          cameraRef.current.y += (desiredY - cameraRef.current.y) * Math.min(1, dt * 8);

          const nearPrompt =
            modalRef.current || adminOpenRef.current
              ? null
              : getNearestLandmarkPrompt(state, remoteFarmersRef.current, visitingFarmRef.current);
          const activeTheme = getActiveTheme(adminConfigRef.current);
          const activeMap = adminConfigRef.current.maps.find(
            (m) => m.id === adminConfigRef.current.activeMapId
          );

          ctx.save();
          ctx.scale(dpr, dpr);
          renderGameWorld(ctx, {
            state,
            remoteFarmers: remoteFarmersRef.current,
            visitingFarm: visitingFarmRef.current,
            theme: activeTheme,
            butterfliesEnabled: activeMap?.butterfliesEnabled ?? true,
            cameraX: cameraRef.current.x,
            cameraY: cameraRef.current.y,
            width: rect.width,
            height: rect.height,
            timeSec: now / 1000,
            hoverTile: hoverTileRef.current,
            particles: particlesRef.current,
            floatingTexts: floatingTextsRef.current,
            nearPrompt,
          });
          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [handleTileAction, handleTriggerLandmarkOrEntity, started]);

  const getWorldTileFromPointer = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const wx = (sx + cameraRef.current.x) / TILE_SIZE;
    const wy = (sy + cameraRef.current.y) / TILE_SIZE;
    return { wx, wy, tx: Math.floor(wx), ty: Math.floor(wy) };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (modal) {
      hoverTileRef.current = null;
      setHoverInfo(null);
      return;
    }
    const { tx, ty } = getWorldTileFromPointer(e);
    const tile = stateRef.current.tiles[tileKey(tx, ty)];
    if (tile && tile.unlocked) {
      hoverTileRef.current = { x: tx, y: ty };
      setHoverInfo({ tile, screenX: e.clientX, screenY: e.clientY });
    } else {
      hoverTileRef.current = null;
      setHoverInfo(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (modal) return;
    const state = stateRef.current;
    const { wx, wy, tx, ty } = getWorldTileFromPointer(e);

    // 1. Orchard Fruit Trees
    for (const tree of state.orchardTrees) {
      if (tree.fruitsReady > 0 && Math.hypot(wx - tree.x, wy - (tree.y - 0.5)) < 1.1) {
        const dist = Math.hypot(state.player.x - tree.x, state.player.y - tree.y);
        if (dist <= 2.4) handleTriggerLandmarkOrEntity(`orchard:${tree.id}`);
        else {
          state.player.targetX = tree.x;
          state.player.targetY = tree.y + 0.9;
          pendingActionRef.current = { kind: 'orchard', x: tree.x, y: tree.y, id: `orchard:${tree.id}` };
        }
        return;
      }
    }

    // 1.5. Click on ANY Online or AI Farmer to open Meet / Trade / Gift / Wave panel!
    for (const rf of remoteFarmersRef.current) {
      if (Math.hypot(wx - rf.x, wy - (rf.y - 0.35)) < 1.05) {
        soundEngine.playClick();
        setModal({ type: 'player_interact', farmerId: rf.id });
        return;
      }
    }

    // 2. NPCs
    for (const npc of NPC_LIST) {
      if (Math.hypot(wx - npc.x, wy - (npc.y - 0.4)) < 1.05) {
        const dist = Math.hypot(state.player.x - npc.x, state.player.y - npc.y);
        if (dist <= 2.6) handleTriggerLandmarkOrEntity(`npc:${npc.id}`);
        else {
          state.player.targetX = npc.x;
          state.player.targetY = npc.y + 0.8;
          pendingActionRef.current = { kind: 'npc', x: npc.x, y: npc.y, id: `npc:${npc.id}` };
        }
        return;
      }
    }

    // 3. Livestock
    for (const animal of state.livestock) {
      if (Math.hypot(wx - animal.x, wy - animal.y) < 0.95) {
        const dist = Math.hypot(state.player.x - animal.x, state.player.y - animal.y);
        if (dist <= 2.4) handleTriggerLandmarkOrEntity(`animal:${animal.id}`);
        else {
          state.player.targetX = animal.x;
          state.player.targetY = animal.y;
          pendingActionRef.current = { kind: 'animal', x: animal.x, y: animal.y, id: `animal:${animal.id}` };
        }
        return;
      }
    }

    // 4. Landmarks
    for (const [key, lm] of Object.entries(LANDMARKS)) {
      if (Math.hypot(wx - lm.x, wy - (lm.y - 0.6)) < 1.35) {
        const dist = Math.hypot(state.player.x - lm.x, state.player.y - lm.y);
        if (dist <= 2.6) handleTriggerLandmarkOrEntity(`landmark:${key}`);
        else {
          state.player.targetX = lm.x;
          state.player.targetY = lm.y + 0.5;
          pendingActionRef.current = { kind: 'landmark', x: lm.x, y: lm.y, id: `landmark:${key}` };
        }
        return;
      }
    }

    // 4.5. Physical Walkable Neighbor Farm Estates (click sign or crop patch to water/pick!)
    for (const est of WORLD_ESTATES) {
      const clickedSign = Math.hypot(wx - est.signX, wy - est.signY) < 1.3;
      const clickedField =
        wx >= est.fieldRect.x &&
        wx <= est.fieldRect.x + est.fieldRect.w &&
        wy >= est.fieldRect.y &&
        wy <= est.fieldRect.y + est.fieldRect.h;
      if (clickedSign || clickedField) {
        const dist = Math.hypot(state.player.x - est.signX, state.player.y - est.signY);
        if (dist <= 3.6 || (clickedField && Math.hypot(state.player.x - wx, state.player.y - wy) <= 3.2)) {
          handleTriggerLandmarkOrEntity(`estate:${est.neighborId}`);
        } else {
          state.player.targetX = est.gateX;
          state.player.targetY = est.gateY;
          pendingActionRef.current = {
            kind: 'estate',
            x: est.gateX,
            y: est.gateY,
            id: `estate:${est.neighborId}`,
          };
        }
        return;
      }
    }

    // 5. Farm Plot (if visiting a real player's farm -> water & help their crops!)
    if (
      visitingFarmRef.current &&
      tx >= FIELD_ORIGIN_X &&
      tx < FIELD_ORIGIN_X + FIELD_MAX_W &&
      ty >= FIELD_ORIGIN_Y &&
      ty < FIELD_ORIGIN_Y + FIELD_MAX_H
    ) {
      const dist = Math.hypot(state.player.x - (tx + 0.5), state.player.y - (ty + 0.5));
      if (dist <= 3.2) {
        handleHelpVisitingRealFarm(tx, ty);
      } else {
        state.player.targetX = tx + 0.5;
        state.player.targetY = ty + 0.5;
        pendingActionRef.current = null;
        handleHelpVisitingRealFarm(tx, ty);
      }
      return;
    }

    const tile = state.tiles[tileKey(tx, ty)];
    if (tile && tile.unlocked) {
      const dist = Math.hypot(state.player.x - (tx + 0.5), state.player.y - (ty + 0.5));
      if (dist <= 2.8) handleTileAction(tx, ty);
      else {
        state.player.targetX = tx + 0.5;
        state.player.targetY = ty + 0.5;
        pendingActionRef.current = { kind: 'tile', x: tx, y: ty };
      }
      return;
    }

    // 6. Click-to-Move
    pendingActionRef.current = null;
    state.player.targetX = wx;
    state.player.targetY = wy;
  };

  // Shop / Artisan / Quest / Multiplayer Handlers
  const handleBuyItem = (itemId: ItemId, qty: number) => {
    if (buyItem(stateRef.current, itemId, qty)) {
      soundEngine.playCoin();
      showToast(`+${qty} ${ITEM_NAMES[language][itemId]}`);
      forceUiSync();
    } else soundEngine.playError();
  };

  const handleSellItem = (itemId: ItemId, qty: number) => {
    const earned = sellItem(stateRef.current, itemId, qty);
    if (earned > 0) {
      soundEngine.playCoin();
      showToast(`+${earned}g!`);
      forceUiSync();
    }
  };

  const handleSellAllProduce = () => {
    const earned = sellAllProduce(stateRef.current);
    if (earned > 0) {
      soundEngine.playCoin();
      showToast(`+${earned}g!`);
      forceUiSync();
    }
  };

  const handleUpgradeTool = (toolId: ToolId) => {
    if (upgradeTool(stateRef.current, toolId)) {
      soundEngine.playLevelUp();
      showToast(`⚒️ Upgraded tool to Tier ${stateRef.current.player.toolTiers[toolId]}!`);
      forceUiSync();
    }
  };

  const handleExpandFarm = () => {
    if (expandFarm(stateRef.current)) {
      soundEngine.playLevelUp();
      showToast('🌾 Farm expanded! New fertile plots unlocked!');
      forceUiSync();
    }
  };

  const handleUpgradeSprinkler = () => {
    if (upgradeSprinkler(stateRef.current)) {
      soundEngine.playWater();
      soundEngine.playLevelUp();
      showToast(`💧 Sprinklers upgraded to Tier ${stateRef.current.sprinklerLevel}!`);
      forceUiSync();
    }
  };

  const handleUpgradeHouse = () => {
    if (upgradeHouse(stateRef.current)) {
      soundEngine.playLevelUp();
      showToast('🏡 Farmhouse upgraded! Max Stamina increased!');
      forceUiSync();
    }
  };

  const handleAdoptLivestock = (species: AnimalSpecies) => {
    if (adoptLivestock(stateRef.current, species)) {
      soundEngine.playAnimal(species === 'sheep' ? 'chicken' : species);
      showToast(`Welcome home, new ${species}!`);
      forceUiSync();
    }
  };

  const handleCraftArtisan = (recipeId: string) => {
    const res = craftArtisanRecipe(stateRef.current, recipeId);
    if (res.success) {
      soundEngine.playHarvest();
      showToast(res.leveledUp ? `🎉 Crafted & LEVEL UP!` : '✨ Artisan craft complete!');
      forceUiSync();
    }
  };

  const handleCompleteQuest = (questId: string) => {
    const res = completeQuest(stateRef.current, questId);
    if (res.success) {
      soundEngine.playLevelUp();
      showToast(res.leveledUp ? `🎉 Quest Done & LEVEL UP!` : '✅ Quest Completed!');
      forceUiSync();
    }
  };

  const handleGiftNpc = (npcId: NpcId, itemId: ItemId) => {
    const res = giftNpc(stateRef.current, npcId, itemId);
    if (res.success) {
      soundEngine.playHarvest();
      showToast(res.loved ? `💖 +${res.points} ♥` : `♥ +${res.points} ♥`);
      forceUiSync();
    }
  };

  const handleFastTravel = (region: FastTravelRegion) => {
    const dest = WORLD_REGIONS[region];
    setVisitingFarm(null);
    stateRef.current.player.x = dest.x;
    stateRef.current.player.y = dest.y;
    stateRef.current.player.targetX = null;
    stateRef.current.player.targetY = null;
    soundEngine.playPlant();
    spawnParticles(dest.x - 0.5, dest.y - 0.5, '#818cf8', 14, 'sparkle');
    showToast(`${dest.emoji} Traveled to ${dest.label}!`);
    forceUiSync();
  };

  const handleVisitNeighborEstate = (neighborId: string) => {
    const est = WORLD_ESTATES.find((e) => e.neighborId === neighborId);
    if (!est) return;
    setVisitingFarm(null);
    stateRef.current.player.x = est.gateX;
    stateRef.current.player.y = est.gateY;
    stateRef.current.player.targetX = null;
    stateRef.current.player.targetY = null;
    soundEngine.playPlant();
    spawnParticles(est.gateX - 0.5, est.gateY - 0.5, est.accentColor, 16, 'sparkle');
    showToast(`🏡 Arrived at ${est.farmName}! Click crops or press [E] to water & pick!`);
    forceUiSync();
  };

  const handleVisitPlayerFarm = (farmer: RemoteFarmer) => {
    // If this AI farmer owns one of the 4 physical Valley Estates, travel straight to their estate!
    const physicalEstate = WORLD_ESTATES.find((e) => e.botId === farmer.id);
    if (physicalEstate) {
      handleVisitNeighborEstate(physicalEstate.neighborId);
      return;
    }
    const snap = farmer.farmSnapshot ?? buildFallbackFarmSnapshot(farmer);
    setVisitingFarm({
      ownerId: farmer.id,
      ownerName: farmer.name,
      level: farmer.level,
      isRealPlayer: farmer.isRealPlayer,
      snapshot: snap,
      helpedToday: helpedRealFarmsRef.current.has(farmer.id),
    });
    stateRef.current.player.x = 7.5;
    stateRef.current.player.y = 5.2;
    stateRef.current.player.targetX = null;
    stateRef.current.player.targetY = null;
    soundEngine.playPlant();
    spawnParticles(7.0, 4.7, '#fde047', 16, 'sparkle');
    showToast(`🏡 Visiting ${farmer.name}'s Farm! Click their crops to water & earn +30g!`);
    forceUiSync();
  };

  const handleReturnHomeFromVisit = () => {
    setVisitingFarm(null);
    stateRef.current.player.x = 6.5;
    stateRef.current.player.y = 5.0;
    stateRef.current.player.targetX = null;
    stateRef.current.player.targetY = null;
    soundEngine.playPlant();
    spawnParticles(6.0, 4.5, '#4ade80', 14, 'sparkle');
    showToast('🏠 Welcome back to your own GreenSAGA Farm!');
    forceUiSync();
  };

  const handleMeetPlayer = (farmer: RemoteFarmer) => {
    // If meeting a real player who is currently on their own homestead, visit their farm so you meet them there!
    if (farmer.isRealPlayer && farmer.x < 15.6 && farmer.y < 20.5 && !farmer.visitingFarmOwnerId) {
      const snap = farmer.farmSnapshot ?? buildFallbackFarmSnapshot(farmer);
      setVisitingFarm({
        ownerId: farmer.id,
        ownerName: farmer.name,
        level: farmer.level,
        isRealPlayer: true,
        snapshot: snap,
        helpedToday: helpedRealFarmsRef.current.has(farmer.id),
      });
    } else {
      setVisitingFarm(null);
    }

    // Pick a walkable spot right beside the target player
    const offsets = [
      { dx: -1.0, dy: 0 },
      { dx: 1.0, dy: 0 },
      { dx: 0, dy: 1.0 },
      { dx: 0, dy: -1.0 },
    ];
    let destX = farmer.x;
    let destY = farmer.y;
    for (const o of offsets) {
      if (!isPositionBlocked(farmer.x + o.dx, farmer.y + o.dy)) {
        destX = farmer.x + o.dx;
        destY = farmer.y + o.dy;
        break;
      }
    }
    stateRef.current.player.x = destX;
    stateRef.current.player.y = destY;
    stateRef.current.player.targetX = null;
    stateRef.current.player.targetY = null;
    soundEngine.playPlant();
    spawnParticles(destX - 0.5, destY - 0.5, '#fde047', 14, 'sparkle');
    showToast(`📍 Teleported right next to ${farmer.name}! Click them to wave, chat, or trade.`);
    forceUiSync();
  };

  const handleUpdateProfile = (name: string, roomCode: string) => {
    const cleanRoom = roomCode.trim().toUpperCase() || 'VALLEY-01';
    stateRef.current.player.name = name;
    stateRef.current.player.roomCode = cleanRoom;
    if (cleanRoom !== activeRoomCode) {
      remoteFarmersRef.current = remoteFarmersRef.current.filter((f) => !f.isRealPlayer);
      setActiveRoomCode(cleanRoom);
    }
    saveGame(stateRef.current);
    forceUiSync();
  };

  const handleSendChat = (text: string) => {
    const p = stateRef.current.player;
    const cleaned = isPluginEnabled(adminConfigRef.current, 'realtime_chat_filter')
      ? text.replace(/\b(spam|scam|hack)\b/gi, '***')
      : text;
    p.chatBubble = cleaned;
    p.chatBubbleTimer = 4.6;
    setChatMessages((prev) => [
      ...prev.slice(-28),
      { id: `self_${Date.now()}`, sender: p.name, text: cleaned, time: nowTimeStr() },
    ]);
    rtSessionRef.current?.sendChat(p.name, cleaned);
    sendCloudChatMessage(p.roomCode, p.name, cleaned).catch(() => {});
    soundEngine.playClick();
  };

  const handleSendEmote = (emote: string) => {
    const p = stateRef.current.player;
    p.emote = emote;
    p.emoteTimer = 2.8;
    spawnParticles(p.x - 0.5, p.y - 0.6, '#fde047', 6, 'sparkle');
    rtSessionRef.current?.sendEmote(p.name, emote);
    soundEngine.playHarvest();
  };

  const handleWaveEmote = () => {
    handleSendEmote('👋');
    showToast('👋 Waved to farmers in the Valley!');
  };

  const handleWaveAtFarmer = (rf: RemoteFarmer) => {
    const st = stateRef.current;
    handleSendEmote('👋');
    rf.emote = '👋';
    rf.emoteTimer = 2.8;
    spawnParticles(rf.x - 0.5, rf.y - 0.6, '#f472b6', 8, 'heart');
    if (!rf.wavedToday) {
      rf.wavedToday = true;
      st.player.gold += 20;
      st.stats.goldEarned += 20;
      spawnFloatingText(rf.x - 0.5, rf.y - 1.0, `👋 ${rf.name}: +20g!`, '#fde047');
      showToast(`👋 Waved at ${rf.name}! +20g co-op bonus!`);
      saveGame(st);
      forceUiSync();
    } else {
      showToast(`👋 Waved at ${rf.name}!`);
    }
  };

  const handleGiftGoldToFarmer = (rf: RemoteFarmer, amount: number) => {
    const st = stateRef.current;
    if (st.player.gold < amount) return;
    st.player.gold -= amount;
    rf.gold = (rf.gold ?? 500) + amount;
    rf.emote = '💰';
    rf.emoteTimer = 3.0;
    soundEngine.playCoin();
    spawnParticles(rf.x - 0.5, rf.y - 0.6, '#facc15', 12, 'sparkle');
    if (rf.isRealPlayer) {
      rtSessionRef.current?.sendGift({
        fromName: st.player.name,
        toPeerId: rf.id,
        kind: 'gold',
        amount,
      });
    } else {
      rf.chatBubble = `Thanks for ${amount}g, ${st.player.name}! 💛`;
      rf.chatBubbleTimer = 4.2;
    }
    saveGame(st);
    showToast(`💰 Sent ${amount}g gift to ${rf.name}!`);
    forceUiSync();
  };

  const handleGiftItemToFarmer = (rf: RemoteFarmer, itemId: ItemId) => {
    const st = stateRef.current;
    if ((st.inventory[itemId] ?? 0) <= 0) return;
    addItem(st, itemId, -1);
    rf.emote = '🎁';
    rf.emoteTimer = 3.0;
    soundEngine.playHarvest();
    spawnParticles(rf.x - 0.5, rf.y - 0.6, '#f472b6', 10, 'heart');
    if (rf.isRealPlayer) {
      rtSessionRef.current?.sendGift({
        fromName: st.player.name,
        toPeerId: rf.id,
        kind: 'item',
        itemId,
        qty: 1,
      });
    } else {
      rf.chatBubble = `Love this ${ITEM_NAMES[st.language][itemId]}! ♥`;
      rf.chatBubbleTimer = 4.2;
    }
    saveGame(st);
    showToast(`🎁 Gifted ${ITEM_NAMES[st.language][itemId]} to ${rf.name}!`);
    forceUiSync();
  };

  const handleHelpNeighbor = (neighborId: string) => {
    const res = helpNeighborWater(stateRef.current, neighborId);
    if (res.success) {
      soundEngine.playWater();
      soundEngine.playCoin();
      showToast(res.leveledUp ? '🎉 Helped neighbor & LEVEL UP!' : '💧 Helped water neighbor farm! +25g & +20 XP');
      forceUiSync();
    }
  };

  const handlePickNeighborCrop = (neighborId: string) => {
    const res = pickNeighborCrop(stateRef.current, neighborId);
    if (res.success && res.cropId) {
      soundEngine.playHarvest();
      showToast(`🌾 Picked +1 ${CROP_NAMES[language][res.cropId]} from neighbor's ripe patch!`);
      forceUiSync();
    }
  };

  const handleToggleMute = () => {
    stateRef.current.muted = !stateRef.current.muted;
    soundEngine.muted = stateRef.current.muted;
    saveGame(stateRef.current);
    forceUiSync();
  };

  // Hidden /admin route gate (shows Login until authenticated with farm@ouagx.com)
  if (adminRouteActive) {
    if (!adminAuthed) {
      return (
        <AdminLogin
          brandName={adminConfig.brandName}
          onSuccess={() => setAdminAuthed(true)}
          onBack={closeAdminRoute}
        />
      );
    }
    return (
      <AdminDashboard
        config={adminConfig}
        gameState={started ? stateRef.current : savedPreview ?? stateRef.current}
        language={language}
        onUpdateConfig={handleUpdateAdminConfig}
        onChangeLanguage={handleChangeLanguage}
        onLiveGameAction={handleLiveGameAction}
        onLogout={handleAdminLogout}
        onClose={closeAdminRoute}
      />
    );
  }

  const pushBannerEl = pushBanner && (
    <div className="push-notification-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="push-notif-icon">
          <Bell size={16} color="#fde047" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 13.5, color: '#fff' }}>
            {pushBanner.title}{' '}
            <span style={{ fontSize: 10, color: '#93c5fd', fontWeight: 700 }}>
              Rev #{pushBanner.revision}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#e2e8f0' }}>{pushBanner.body}</div>
        </div>
      </div>
      <button
        onClick={() => setPushBanner(null)}
        style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 4 }}
      >
        <X size={16} />
      </button>
    </div>
  );

  if (!started) {
    return (
      <>
        {pushBannerEl}
        <LandingPage
          language={language}
          savedGame={savedPreview}
          adminConfig={adminConfig}
          currentAccount={currentAccount}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onChangeLanguage={handleChangeLanguage}
          onNewGame={startNewGame}
          onContinue={continueGame}
          onOpenAuth={(mode) => setAuthModalMode(mode)}
          onSignOutAccount={handleSignOutAccount}
          onClickAd={handleClickAd}
        />
        {authModalMode && (
          <AuthModal
            brandName={adminConfig.brandName}
            language={language}
            initialMode={authModalMode}
            onAuthenticated={handleAccountAuthenticated}
            onClose={() => setAuthModalMode(null)}
          />
        )}
      </>
    );
  }

  return (
    <div className="game-shell">
      {pushBannerEl}
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={() => {
          hoverTileRef.current = null;
          setHoverInfo(null);
        }}
        onClick={handleCanvasClick}
      />

      <HUD
        state={stateRef.current}
        adminConfig={adminConfig}
        remoteFarmers={remoteFarmersRef.current}
        visitingFarm={visitingFarm}
        fps={fps}
        onlineCount={remoteFarmersRef.current.length + 1}
        hoverInfo={hoverInfo}
        onSelectHotbar={(idx) => {
          stateRef.current.selectedHotbarIndex = idx;
          soundEngine.playClick();
          forceUiSync();
        }}
        onOpenQuests={() => {
          soundEngine.playClick();
          setModal({ type: 'quests' });
        }}
        onOpenBag={() => {
          soundEngine.playClick();
          setModal({ type: 'bag' });
        }}
        onOpenShop={() => {
          soundEngine.playClick();
          setModal({ type: 'shop' });
        }}
        onOpenMap={() => {
          soundEngine.playClick();
          setModal({ type: 'map' });
        }}
        onOpenLevels={() => {
          soundEngine.playClick();
          setModal({ type: 'levels' });
        }}
        onReturnHomeFromVisit={handleReturnHomeFromVisit}
        onMeetPlayer={handleMeetPlayer}
        onVisitPlayerFarm={handleVisitPlayerFarm}
        chatOpen={chatOpen}
        unreadChat={unreadChat}
        onToggleChat={() => {
          soundEngine.playClick();
          setChatOpen((o) => {
            if (!o) setUnreadChat(0);
            return !o;
          });
        }}
        onClickAd={handleClickAd}
        onSleep={handleSleep}
        onToggleMute={handleToggleMute}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenHelp={() => {
          soundEngine.playClick();
          setModal({ type: 'help' });
        }}
        onChangeLanguage={handleChangeLanguage}
        onGoHome={handleGoHome}
      />

      {toast && <div className="toast-banner">{toast}</div>}

      {modal?.type === 'shop' && (
        <ShopModal
          state={stateRef.current}
          adminConfig={adminConfig}
          onClickAd={handleClickAd}
          onBuyItem={handleBuyItem}
          onSellItem={handleSellItem}
          onSellAllProduce={handleSellAllProduce}
          onUpgradeTool={handleUpgradeTool}
          onExpandFarm={handleExpandFarm}
          onUpgradeSprinkler={handleUpgradeSprinkler}
          onUpgradeHouse={handleUpgradeHouse}
          onAdoptLivestock={handleAdoptLivestock}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'artisan' && (
        <ArtisanModal
          state={stateRef.current}
          onCraft={handleCraftArtisan}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'levels' && (
        <LevelsModal state={stateRef.current} onClose={() => setModal(null)} />
      )}

      {modal?.type === 'map' && (
        <MultiplayerMapModal
          state={stateRef.current}
          remoteFarmers={remoteFarmersRef.current}
          chatMessages={chatMessages}
          onFastTravel={handleFastTravel}
          onMeetPlayer={handleMeetPlayer}
          onVisitPlayerFarm={handleVisitPlayerFarm}
          onVisitNeighborEstate={handleVisitNeighborEstate}
          onInteractPlayer={(farmer) => setModal({ type: 'player_interact', farmerId: farmer.id })}
          onUpdateProfile={handleUpdateProfile}
          onSendChat={handleSendChat}
          onWaveEmote={handleWaveEmote}
          onHelpNeighbor={handleHelpNeighbor}
          onPickNeighborCrop={handlePickNeighborCrop}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'npc' && (
        <NpcModal
          state={stateRef.current}
          npcId={modal.npcId}
          onGift={handleGiftNpc}
          onCompleteQuest={handleCompleteQuest}
          onOpenShop={() => setModal({ type: 'shop' })}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'quests' && (
        <QuestLogModal
          state={stateRef.current}
          onCompleteQuest={handleCompleteQuest}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'bag' && (
        <BagModal state={stateRef.current} onClose={() => setModal(null)} />
      )}

      {modal?.type === 'help' && (
        <TutorialOverlay
          language={language}
          onClose={() => {
            stateRef.current.tutorialDismissed = true;
            saveGame(stateRef.current);
            setModal(null);
          }}
        />
      )}

      <LiveChatOverlay
        open={chatOpen && !modal}
        roomCode={activeRoomCode}
        rtStatus={rtStatus}
        realPlayerCount={remoteFarmersRef.current.filter((f) => f.isRealPlayer).length + 1}
        messages={chatMessages}
        onSendChat={handleSendChat}
        onSendEmote={handleSendEmote}
        onClose={() => setChatOpen(false)}
      />

      {modal?.type === 'player_interact' && (() => {
        const target = remoteFarmersRef.current.find((f) => f.id === modal.farmerId);
        if (!target) return null;
        return (
          <PlayerInteractModal
            state={stateRef.current}
            farmer={target}
            onWave={handleWaveAtFarmer}
            onMeet={handleMeetPlayer}
            onVisitFarm={handleVisitPlayerFarm}
            onGiftGold={handleGiftGoldToFarmer}
            onGiftItem={handleGiftItemToFarmer}
            onQuickGreet={(f) => {
              handleSendChat(`Hey ${f.name}! 👋`);
              setChatOpen(true);
            }}
            onClose={() => setModal(null)}
          />
        );
      })()}

      {modal?.type === 'day_summary' && (
        <DaySummaryModal
          language={language}
          summary={modal.summary}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
