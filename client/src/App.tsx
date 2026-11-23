import React, { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  BookOpen,
  Castle,
  Crown,
  Globe,
  Home,
  LogOut,
  Mail,
  MessageSquare,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Zap,
} from 'lucide-react';
import { apiRequest, formatNum, getToken, setToken } from './api';
import { LanguageSwitcher, useI18n } from './i18n';
import type { ChatMessage, GameTab, PlayerState } from './types';
import { LandingPage } from './components/LandingPage';
import { AuthScreen } from './components/AuthScreen';
import { CityView } from './components/CityView';
import { WorldMapView } from './components/WorldMapView';
import { CampaignView } from './components/CampaignView';
import { HeroesForgeView } from './components/HeroesForgeView';
import { ArmyView } from './components/ArmyView';
import { AcademyView } from './components/AcademyView';
import { AllianceView } from './components/AllianceView';
import { ChatDrawer, LeaderboardView, QuestsView, ReportsView } from './components/SecondaryViews';

export function App() {
  const { t } = useI18n();
  const [state, setState] = useState<PlayerState | null>(null);
  const [loadingBoot, setLoadingBoot] = useState(true);
  const [publicView, setPublicView] = useState<'landing' | 'auth'>('landing');
  const [authInitialMode, setAuthInitialMode] = useState<'guest' | 'login' | 'register'>('guest');
  const [viewingHomeWhileAuthed, setViewingHomeWhileAuthed] = useState(false);

  const [tab, setTab] = useState<GameTab>('city');
  const [nowMs, setNowMs] = useState(Date.now());
  const [worldVersion, setWorldVersion] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const toastTimeout = useRef<number | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    if (toastTimeout.current) window.clearTimeout(toastTimeout.current);
    toastTimeout.current = window.setTimeout(() => setToast(null), 3400);
  }, []);

  const refreshState = useCallback(async () => {
    try {
      const s = await apiRequest<PlayerState>('/api/state');
      setState(s);
    } catch {
      setToken(null);
      setState(null);
    }
  }, []);

  // Boot check existing token
  useEffect(() => {
    if (!getToken()) {
      setLoadingBoot(false);
      return;
    }
    refreshState().finally(() => setLoadingBoot(false));
  }, [refreshState]);

  // Connect Socket.io & fetch initial chat once authenticated
  useEffect(() => {
    const token = getToken();
    if (!state?.user.id || !token) return;

    apiRequest<{ kingdom: ChatMessage[]; alliance: ChatMessage[] }>('/api/chat')
      .then((d) => setChatMessages([...d.kingdom, ...d.alliance]))
      .catch(() => {});

    const socket = io({ auth: { token } });
    socketRef.current = socket;

    socket.on('state:dirty', () => {
      refreshState();
    });
    socket.on('world:dirty', () => {
      setWorldVersion((v) => v + 1);
    });
    socket.on('chat:message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev.slice(-80), msg]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [state?.user.id, refreshState]);

  // Smooth 1-second local timer + resource projection + auto-sync when a timer finishes
  useEffect(() => {
    if (!state) return;
    const interval = window.setInterval(() => {
      const now = Date.now();
      setNowMs(now);

      const anyBuildingDone = state.buildings.some((b) => b.finish_at && b.finish_at <= now);
      const anyTroopDone = state.troops.some((tr) => tr.training_finish_at && tr.training_finish_at <= now);
      const anyTechDone = state.research.some((r) => r.finish_at && r.finish_at <= now);
      if (anyBuildingDone || anyTroopDone || anyTechDone) {
        refreshState();
        return;
      }

      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          user: {
            ...prev.user,
            food: prev.user.food + prev.productionRates.food / 3600,
            wood: prev.user.wood + prev.productionRates.wood / 3600,
            iron: prev.user.iron + prev.productionRates.iron / 3600,
            gold: prev.user.gold + prev.productionRates.gold / 3600,
          },
        };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [state, refreshState]);

  const handleLogout = () => {
    setToken(null);
    setState(null);
    setViewingHomeWhileAuthed(false);
    setPublicView('landing');
    socketRef.current?.disconnect();
  };

  if (loadingBoot) {
    return (
      <div className="h-screen w-screen bg-[#07090f] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Crown className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
          <div className="font-royal text-2xl font-bold text-amber-200 tracking-widest">OUAGX</div>
          <div className="text-xs text-slate-400">{t('forgingKingdom')}</div>
        </div>
      </div>
    );
  }

  // Landing Page (shown when not logged in OR when user clicks Home button)
  if (!state || viewingHomeWhileAuthed) {
    if (!state && publicView === 'auth') {
      return (
        <AuthScreen
          initialMode={authInitialMode}
          onBackHome={() => setPublicView('landing')}
          onAuthSuccess={(s) => {
            setState(s);
            setViewingHomeWhileAuthed(false);
          }}
        />
      );
    }
    return (
      <LandingPage
        onOpenAuth={(mode) => {
          if (state) {
            setViewingHomeWhileAuthed(false);
          } else {
            setAuthInitialMode(mode);
            setPublicView('auth');
          }
        }}
        onQuickPlaySuccess={(s) => {
          setState(s);
          setViewingHomeWhileAuthed(false);
        }}
      />
    );
  }

  const unreadReports = state.reports.filter((r) => !r.isRead).length;
  const claimableQuests = state.quests.filter((q) => q.completed && !q.claimed).length;

  const navItems: { id: GameTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'city', label: t('tabCity'), icon: <Castle className="w-4 h-4" /> },
    { id: 'world', label: t('tabWorld'), icon: <Globe className="w-4 h-4" /> },
    { id: 'campaign', label: t('tabCampaign'), icon: <Swords className="w-4 h-4" /> },
    { id: 'heroes', label: t('tabHeroes'), icon: <Sparkles className="w-4 h-4" /> },
    { id: 'army', label: t('tabArmy'), icon: <Shield className="w-4 h-4" /> },
    { id: 'academy', label: t('tabAcademy'), icon: <BookOpen className="w-4 h-4" /> },
    { id: 'alliance', label: t('tabAlliance'), icon: <Crown className="w-4 h-4" /> },
    { id: 'quests', label: t('tabQuests'), icon: <ScrollText className="w-4 h-4" />, badge: claimableQuests },
    { id: 'reports', label: t('tabReports'), icon: <Mail className="w-4 h-4" />, badge: unreadReports },
    { id: 'leaderboard', label: t('tabLeaderboard'), icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b0d13] overflow-hidden select-none">
      {/* PERSISTENT TOP KINGDOM HUD */}
      <header className="shrink-0 h-16 px-3 md:px-4 bg-gradient-to-b from-[#171b27] to-[#0f131d] border-b border-amber-500/30 flex items-center justify-between gap-2 z-30 shadow-lg">
        {/* Lord Identity & Power */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-slate-950 border-2 border-amber-400 flex items-center justify-center text-xl shrink-0">
            {state.user.avatar}
            <span className="absolute -bottom-1.5 -end-1.5 px-1.5 rounded-full bg-slate-950 border border-amber-400 text-[9px] font-bold text-amber-300">
              Lv.{state.user.castleLevel}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-royal font-extrabold text-sm md:text-base text-amber-200 tracking-wider">
                OUAGX
              </span>
              <span className="text-xs text-slate-400 truncate hidden lg:inline">
                • {state.alliance ? `[${state.alliance.tag}] ` : ''}
                {state.user.username}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-amber-400 font-bold flex items-center gap-0.5">
                <Zap className="w-3 h-3 fill-amber-400" /> {formatNum(state.user.power)}
              </span>
              <span className="text-slate-400 hidden xl:inline">
                ({state.user.castleX}, {state.user.castleY})
              </span>
            </div>
          </div>
        </div>

        {/* Live Ticking Resource Bar + Language Switcher */}
        <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto">
          {[
            { icon: '🌾', val: state.user.food, rate: state.productionRates.food, title: t('food') },
            { icon: '🌲', val: state.user.wood, rate: state.productionRates.wood, title: t('wood') },
            { icon: '⛏️', val: state.user.iron, rate: state.productionRates.iron, title: t('iron') },
            { icon: '💰', val: state.user.gold, rate: state.productionRates.gold, title: t('gold') },
          ].map((r) => (
            <div
              key={r.title}
              title={`${r.title}: +${formatNum(r.rate)}/hr`}
              className="px-2 py-1 rounded-xl bg-slate-950/85 border border-slate-800 flex items-center gap-1.5 shrink-0"
            >
              <span className="text-sm">{r.icon}</span>
              <div>
                <div className="text-xs font-bold text-amber-50 leading-none">{formatNum(r.val)}</div>
                <div className="text-[9px] text-emerald-400/90 leading-none mt-0.5 hidden md:block">
                  +{formatNum(r.rate)}/h
                </div>
              </div>
            </div>
          ))}

          <div
            title={t('gems')}
            className="px-2 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center gap-1 shrink-0"
          >
            <span className="text-sm">💎</span>
            <span className="text-xs font-bold text-cyan-200">{formatNum(state.user.gems)}</span>
          </div>

          <LanguageSwitcher compact />

          <button
            onClick={() => setViewingHomeWhileAuthed(true)}
            title={t('backHome')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-400/50 cursor-pointer shrink-0"
          >
            <Home className="w-4 h-4" />
          </button>

          <button
            onClick={handleLogout}
            title={t('logout')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-300 hover:border-rose-500/40 cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="relative flex-1 min-h-0 overflow-hidden">
        {tab === 'city' && (
          <CityView
            state={state}
            nowMs={nowMs}
            onStateChange={setState}
            onNavigate={setTab}
            onToast={showToast}
          />
        )}
        {tab === 'world' && (
          <WorldMapView
            state={state}
            nowMs={nowMs}
            worldVersion={worldVersion}
            onStateChange={setState}
            onToast={showToast}
          />
        )}
        {tab === 'campaign' && <CampaignView state={state} onStateChange={setState} onToast={showToast} />}
        {tab === 'heroes' && <HeroesForgeView state={state} onStateChange={setState} onToast={showToast} />}
        {tab === 'army' && <ArmyView state={state} nowMs={nowMs} onStateChange={setState} onToast={showToast} />}
        {tab === 'academy' && <AcademyView state={state} nowMs={nowMs} onStateChange={setState} onToast={showToast} />}
        {tab === 'alliance' && <AllianceView state={state} onStateChange={setState} onToast={showToast} />}
        {tab === 'reports' && <ReportsView state={state} onStateChange={setState} />}
        {tab === 'quests' && <QuestsView state={state} onStateChange={setState} onToast={showToast} />}
        {tab === 'leaderboard' && <LeaderboardView currentUserId={state.user.id} />}

        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl border ${
              toast.type === 'error'
                ? 'bg-rose-950/95 border-rose-500 text-rose-100'
                : 'bg-emerald-950/95 border-emerald-400 text-emerald-100'
            }`}
          >
            {toast.msg}
          </div>
        )}

        {/* Live WebSocket Chat Drawer */}
        <ChatDrawer
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          messages={chatMessages}
          hasAlliance={Boolean(state.alliance)}
          onSend={(channel, message) => socketRef.current?.emit('chat:send', { channel, message })}
        />
      </main>

      {/* BOTTOM ROYAL NAVIGATION DOCK */}
      <nav className="shrink-0 h-16 px-2 md:px-4 bg-gradient-to-t from-[#090b10] to-[#141824] border-t border-amber-500/30 flex items-center gap-2 z-30">
        <div className="flex items-center gap-1 overflow-x-auto min-w-0 flex-1 justify-start xl:justify-center pr-1">
          {navItems.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`relative flex flex-col items-center justify-center px-2.5 md:px-3.5 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                  active
                    ? 'bg-amber-600/25 border border-amber-400/70 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'text-slate-400 hover:text-amber-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-semibold mt-0.5 tracking-wide">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -end-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-[9px] font-bold text-white flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Live Chat Toggle */}
        <button
          onClick={() => setChatOpen((o) => !o)}
          className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition ${
            chatOpen
              ? 'bg-amber-600 border-amber-300 text-amber-50'
              : 'panel-stone text-amber-200 hover:border-amber-400'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">{t('chat')}</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
