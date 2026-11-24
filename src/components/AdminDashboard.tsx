import React, { useState } from 'react';
import {
  Activity,
  Award,
  Bell,
  Check,
  Coins,
  Download,
  Globe,
  Layers,
  LogOut,
  Map as MapIcon,
  Megaphone,
  Palette,
  Play,
  Plus,
  Puzzle,
  RefreshCw,
  Send,
  Settings,
  Shield,
  Sliders,
  Smartphone,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { CROP_ORDER } from '../data/crops';
import {
  createDefaultAdminConfig,
  THEME_LIST,
  THEME_PALETTES,
} from '../engine/adminStore';
import {
  ANDROID_APP_ID,
  buildPushBundle,
  fetchLatestAppPush,
  pushUpdateToAndroidApp,
  setLastAppliedPushAt,
  setLastAppliedRevision,
} from '../engine/appSyncClient';
import {
  checkSupabaseConnection,
  fetchCloudPlayersFromSupabase,
  SUPABASE_URL,
} from '../lib/supabaseClient';
import { CROP_NAMES, getLevelTitle, LANGUAGES } from '../i18n/translations';
import {
  AdCampaign,
  AdminConfig,
  AdPlacement,
  ManagedUser,
  MapPreset,
  PluginEntry,
  PushHistoryEntry,
  ThemeId,
  UserRole,
  UserStatus,
} from '../types/admin';
import { CropId, GameState, Language, NeighborFarm } from '../types/game';

type AdminTab =
  | 'overview'
  | 'push'
  | 'ads'
  | 'users'
  | 'levels'
  | 'plugins'
  | 'themes'
  | 'maps'
  | 'settings';

interface AdminDashboardProps {
  config: AdminConfig;
  gameState: GameState;
  language: Language;
  onUpdateConfig: (next: AdminConfig) => void;
  onChangeLanguage: (lang: Language) => void;
  onLiveGameAction: (action:
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
  ) => void;
  onLogout: () => void;
  onClose: () => void;
}

const TAB_LABELS: Record<Language, Record<AdminTab, string>> = {
  en: {
    overview: 'Overview',
    push: 'Push to App',
    ads: 'Ads Manager',
    users: 'Users',
    levels: 'Levels & Economy',
    plugins: 'Plugins',
    themes: 'Themes & Brand',
    maps: 'Maps & World',
    settings: 'System',
  },
  fr: {
    overview: 'Vue globale',
    push: 'Push Android App',
    ads: 'Publicités',
    users: 'Utilisateurs',
    levels: 'Niveaux & Économie',
    plugins: 'Plugins',
    themes: 'Thèmes & Marque',
    maps: 'Cartes & Monde',
    settings: 'Système',
  },
  ar: {
    overview: 'نظرة عامة',
    push: 'إرسال للتطبيق',
    ads: 'إدارة الإعلانات',
    users: 'المستخدمون',
    levels: 'المستويات والاقتصاد',
    plugins: 'الإضافات',
    themes: 'الثيمات والهوية',
    maps: 'الخرائط والعالم',
    settings: 'النظام',
  },
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  config,
  gameState,
  language,
  onUpdateConfig,
  onChangeLanguage,
  onLiveGameAction,
  onLogout,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [importText, setImportText] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Push to Android App Composer State
  const [pushTitle, setPushTitle] = useState('🌾 GreenSAGA Live Update!');
  const [pushBody, setPushBody] = useState(
    'Fresh announcements, valley ads, and rewards just arrived in your app!'
  );
  const [pushing, setPushing] = useState(false);
  const [supaStatus, setSupaStatus] = useState<{ connected: boolean; tablesReady: boolean } | null>(null);

  React.useEffect(() => {
    checkSupabaseConnection().then(setSupaStatus);
  }, []);

  // New Ad Form State
  const [newAdTitle, setNewAdTitle] = useState('');
  const [newAdDesc, setNewAdDesc] = useState('');
  const [newAdCta, setNewAdCta] = useState('Learn More');
  const [newAdPlacement, setNewAdPlacement] = useState<AdPlacement>('landing_banner');
  const [newAdColor, setNewAdColor] = useState('#eab308');

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('player');

  // New Plugin Form State
  const [newPluginName, setNewPluginName] = useState('');
  const [newPluginDesc, setNewPluginDesc] = useState('');
  const [newPluginCat, setNewPluginCat] = useState<PluginEntry['category']>('gameplay');

  // New Map Form State
  const [newMapName, setNewMapName] = useState('');
  const [newMapRoom, setNewMapRoom] = useState('CUSTOM-05');
  const [newMapTheme, setNewMapTheme] = useState<ThemeId>('emerald');

  // New Neighbor Form State
  const [newNbrOwner, setNewNbrOwner] = useState('');
  const [newNbrCrop, setNewNbrCrop] = useState<CropId>('strawberry');

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 2600);
  };

  // Keep live player entry synced in users list
  const syncedUsers: ManagedUser[] = config.users.map((u) =>
    u.isCurrentPlayer
      ? {
          ...u,
          username: gameState.player.name,
          level: gameState.player.level,
          gold: gameState.player.gold,
          day: gameState.day,
        }
      : u
  );

  const activeAdsCount = config.ads.filter((a) => a.active).length;
  const enabledPluginsCount = config.plugins.filter((p) => p.enabled).length;
  const totalClicks = config.ads.reduce((s, a) => s + a.clicks, 0);

  const navItems: Array<{ id: AdminTab; icon: React.ReactNode }> = [
    { id: 'overview', icon: <Activity size={16} /> },
    { id: 'push', icon: <Smartphone size={16} /> },
    { id: 'ads', icon: <Megaphone size={16} /> },
    { id: 'users', icon: <Users size={16} /> },
    { id: 'levels', icon: <Award size={16} /> },
    { id: 'plugins', icon: <Puzzle size={16} /> },
    { id: 'themes', icon: <Palette size={16} /> },
    { id: 'maps', icon: <MapIcon size={16} /> },
    { id: 'settings', icon: <Settings size={16} /> },
  ];

  const handlePushToAndroidApp = async () => {
    setPushing(true);
    const existingRemote = await fetchLatestAppPush(config.pushServerUrl);
    const bundle = buildPushBundle(config, pushTitle, pushBody, existingRemote?.revision ?? 0);
    // Mark as applied locally so Admin's own tab doesn't double-toast itself
    setLastAppliedRevision(bundle.revision);
    if (bundle.pushedAt) setLastAppliedPushAt(bundle.pushedAt);
    const res = await pushUpdateToAndroidApp(config.pushServerUrl, bundle, config);
    const entry: PushHistoryEntry = {
      revision: bundle.revision,
      pushedAt: bundle.pushedAt,
      notificationTitle: pushTitle.trim() || `${config.brandName} Update`,
      notificationBody: pushBody.trim() || config.announcement || 'Live configuration updated',
      announcement: config.announcement,
      activeAdsCount: config.ads.filter((a) => a.active).length,
      themeId: config.activeThemeId,
      mapId: config.activeMapId,
      status: res.remoteSaved ? 'delivered' : 'local_only',
    };
    onUpdateConfig({
      ...config,
      pushRevision: bundle.revision,
      pushHistory: [entry, ...(config.pushHistory ?? [])].slice(0, 20),
    });
    setPushing(false);
    flash(
      res.realtimeSent && res.supabaseSaved
        ? `☁️ Pushed Rev #${bundle.revision} LIVE to Android (${ANDROID_APP_ID}) via Realtime + Cloud DB!`
        : res.realtimeSent
        ? `⚡ Pushed Rev #${bundle.revision} LIVE to Android (${ANDROID_APP_ID}) via Supabase Realtime Cloud!`
        : res.remoteSaved
        ? `📲 Pushed Rev #${bundle.revision} live to ${ANDROID_APP_ID}!`
        : `📲 Pushed Rev #${bundle.revision} (Local sync broadcast)!`
    );
  };

  const handleAddAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdTitle.trim()) return;
    const item: AdCampaign = {
      id: `ad_${Date.now()}`,
      title: newAdTitle.trim(),
      description: newAdDesc.trim() || 'Featured GreenSAGA Valley promotion.',
      ctaLabel: newAdCta.trim() || 'Open',
      targetUrl: newAdPlacement === 'shop_banner' ? '#shop' : '#map',
      placement: newAdPlacement,
      accentColor: newAdColor,
      active: true,
      impressions: 0,
      clicks: 0,
    };
    onUpdateConfig({ ...config, ads: [item, ...config.ads] });
    setNewAdTitle('');
    setNewAdDesc('');
    flash('Ad campaign created & live!');
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    const u: ManagedUser = {
      id: `usr_${Date.now()}`,
      username: newUserName.trim(),
      email: newUserEmail.trim() || `${newUserName.trim().toLowerCase().replace(/\s+/g, '')}@greensaga.valley`,
      role: newUserRole,
      status: 'active',
      level: 1,
      gold: 200,
      day: 1,
      joinedDate: new Date().toISOString().slice(0, 10),
    };
    onUpdateConfig({ ...config, users: [...config.users, u] });
    setNewUserName('');
    setNewUserEmail('');
    flash(`User "${u.username}" added!`);
  };

  const handleAddPlugin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPluginName.trim()) return;
    const pl: PluginEntry = {
      id: `custom_${Date.now()}`,
      name: newPluginName.trim(),
      version: '1.0.0',
      author: 'Admin',
      category: newPluginCat,
      description: newPluginDesc.trim() || 'Custom studio plugin installed via Admin Dashboard.',
      enabled: true,
    };
    onUpdateConfig({ ...config, plugins: [pl, ...config.plugins] });
    setNewPluginName('');
    setNewPluginDesc('');
    flash(`Plugin "${pl.name}" installed & enabled!`);
  };

  const handleAddMap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapName.trim()) return;
    const m: MapPreset = {
      id: `map_${Date.now()}`,
      name: newMapName.trim(),
      regionCode: newMapRoom.trim().toUpperCase() || 'CUSTOM-05',
      themeId: newMapTheme,
      sizeLabel: '38×22 Custom Valley',
      multiplayerEnabled: true,
      weatherRainChance: 0.25,
      butterfliesEnabled: true,
      defaultRoomCode: newMapRoom.trim().toUpperCase() || 'CUSTOM-05',
      description: 'Custom valley realm created in Admin Dashboard.',
    };
    onUpdateConfig({ ...config, maps: [...config.maps, m] });
    setNewMapName('');
    flash(`Map "${m.name}" added!`);
  };

  const handleAddNeighbor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNbrOwner.trim()) return;
    const nbr: NeighborFarm = {
      id: `nbr_${Date.now()}`,
      ownerName: newNbrOwner.trim(),
      farmName: `${newNbrOwner.trim()}'s Valley Farm`,
      regionLabel: 'Community Plot',
      level: Math.min(10, Math.max(2, gameState.player.level + 1)),
      specialtyCrop: newNbrCrop,
      accentColor: '#10b981',
      mapX: 24 + Math.round(Math.random() * 55),
      mapY: 18 + Math.round(Math.random() * 64),
      wateredToday: false,
      harvestedToday: false,
      online: true,
    };
    onLiveGameAction({ type: 'add_neighbor', neighbor: nbr });
    setNewNbrOwner('');
    flash(`Added ${nbr.farmName} to Multiplayer Map!`);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `greensaga-admin-config.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash('Exported greensaga-admin-config.json!');
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importText) as AdminConfig;
      if (!parsed || !Array.isArray(parsed.ads) || !Array.isArray(parsed.plugins)) {
        flash('Invalid Admin JSON format.');
        return;
      }
      onUpdateConfig(parsed);
      setImportText('');
      flash('Imported Admin configuration successfully!');
    } catch {
      flash('Could not parse JSON.');
    }
  };

  return (
    <div className="admin-overlay">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <Shield size={20} color="#fde047" />
          </div>
          <div>
            <div className="font-display" style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>
              {config.brandName} Admin
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Control Center v2.5</div>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`admin-nav-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{TAB_LABELS[language][item.id]}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                className={`admin-lang-btn ${language === l.code ? 'active' : ''}`}
                onClick={() => onChangeLanguage(l.code)}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button className="rpg-btn rpg-btn-primary" style={{ width: '100%', fontSize: 13 }} onClick={onClose}>
              <Play size={14} fill="currentColor" /> Back to {config.brandName}
            </button>
            <button
              className="admin-nav-btn"
              style={{ width: '100%', justifyContent: 'center', color: '#fca5a5', padding: '7px 10px' }}
              onClick={onLogout}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1 className="font-display" style={{ margin: 0, fontSize: 22, color: '#0f172a' }}>
              {TAB_LABELS[language][activeTab]}
            </h1>
            <div style={{ fontSize: 12.5, color: '#64748b' }}>
              Theme: <b>{THEME_PALETTES[config.activeThemeId].name}</b> · Map:{' '}
              <b>{config.maps.find((m) => m.id === config.activeMapId)?.name ?? 'Cloverbrook'}</b> · Live Player:{' '}
              <b>
                {gameState.player.name} (Lv.{gameState.player.level} · {gameState.player.gold}g)
              </b>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {notice && <span className="admin-notice-pill">{notice}</span>}
            <button className="admin-close-btn" onClick={onClose} title="Close Admin">
              <X size={19} />
            </button>
          </div>
        </header>

        <div className="admin-content">
          {/* ================= OVERVIEW ================= */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="admin-kpi-grid">
                <div className="admin-kpi-card">
                  <div className="admin-kpi-label">Registered Users</div>
                  <div className="admin-kpi-val">{syncedUsers.length}</div>
                  <div className="admin-kpi-sub">
                    {syncedUsers.filter((u) => u.status === 'active').length} active
                  </div>
                </div>
                <div className="admin-kpi-card">
                  <div className="admin-kpi-label">Active Ads / Clicks</div>
                  <div className="admin-kpi-val">
                    {activeAdsCount} / {totalClicks}
                  </div>
                  <div className="admin-kpi-sub">{config.ads.length} total campaigns</div>
                </div>
                <div className="admin-kpi-card">
                  <div className="admin-kpi-label">Enabled Plugins</div>
                  <div className="admin-kpi-val">
                    {enabledPluginsCount}/{config.plugins.length}
                  </div>
                  <div className="admin-kpi-sub">Live hot-swappable</div>
                </div>
                <div className="admin-kpi-card">
                  <div className="admin-kpi-label">Economy Boosts</div>
                  <div className="admin-kpi-val">{config.economy.xpMultiplier}× XP</div>
                  <div className="admin-kpi-sub">
                    {config.economy.growthMultiplier}× growth · {config.economy.sellMultiplier}× gold
                  </div>
                </div>
              </div>

              {/* Live Game Controls */}
              <div className="admin-card">
                <h3 className="admin-card-title">
                  <Sparkles size={17} color="#eab308" /> Live Game Quick Controls
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button
                    className="rpg-btn rpg-btn-gold"
                    style={{ fontSize: 12.5 }}
                    onClick={() => {
                      onLiveGameAction({ type: 'grant_gold', amount: 1000 });
                      flash('Granted +1,000g to live player!');
                    }}
                  >
                    <Coins size={14} /> +1,000 Gold
                  </button>
                  <button
                    className="rpg-btn rpg-btn-primary"
                    style={{ fontSize: 12.5 }}
                    onClick={() => {
                      const nextLv = Math.min(10, gameState.player.level + 1);
                      onLiveGameAction({ type: 'set_level', level: nextLv });
                      flash(`Promoted live player to Level ${nextLv}!`);
                    }}
                  >
                    <Award size={14} /> +1 Level (Now Lv.{gameState.player.level})
                  </button>
                  <button
                    className="rpg-btn rpg-btn-indigo"
                    style={{ fontSize: 12.5 }}
                    onClick={() => {
                      onLiveGameAction({ type: 'toggle_weather' });
                      flash('Toggled valley weather!');
                    }}
                  >
                    🌤️ Toggle Weather ({gameState.weather})
                  </button>
                  <button
                    className="rpg-btn rpg-btn-warm"
                    style={{ fontSize: 12.5 }}
                    onClick={() => {
                      onLiveGameAction({ type: 'refill_stamina' });
                      flash('Player stamina refilled to 100%!');
                    }}
                  >
                    ⚡ Refill Stamina
                  </button>
                  <button
                    className="rpg-btn rpg-btn-neutral"
                    style={{ fontSize: 12.5 }}
                    onClick={() => {
                      onLiveGameAction({ type: 'unlock_all_plots' });
                      flash('Unlocked all 72 farm plots!');
                    }}
                  >
                    🌾 Unlock All 72 Plots
                  </button>
                </div>
              </div>

              {/* Global Announcement & Maintenance */}
              <div className="admin-card">
                <h3 className="admin-card-title">
                  <Megaphone size={17} color="#6366f1" /> Global Broadcast & Site Status
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 700 }}>
                    Global Announcement Ticker (shown on Landing Page & Game):
                    <input
                      className="admin-input"
                      placeholder="e.g. 🎉 Double XP Weekend is LIVE across GreenSAGA Valley!"
                      value={config.announcement}
                      onChange={(e) => onUpdateConfig({ ...config, announcement: e.target.value })}
                    />
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={config.maintenanceMode}
                      onChange={(e) => onUpdateConfig({ ...config, maintenanceMode: e.target.checked })}
                    />
                    Show Maintenance Mode Notice Banner on Landing Page
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ================= PUSH TO ANDROID APP ================= */}
          {activeTab === 'push' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="admin-card" style={{ borderColor: '#4f46e5', background: 'linear-gradient(135deg, #ffffff 0%, #eef2ff 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 className="admin-card-title" style={{ marginBottom: 4 }}>
                      <Smartphone size={18} color="#4f46e5" /> Live Push to Android App
                    </h3>
                    <div style={{ fontSize: 12.5, color: '#475569' }}>
                      Package ID: <b style={{ color: '#312e81' }}>{ANDROID_APP_ID}</b> · Current OTA Revision:{' '}
                      <b>Rev #{config.pushRevision}</b> · Active Ads: <b>{activeAdsCount}</b>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span
                      className="admin-tag"
                      style={{
                        background: supaStatus?.tablesReady ? '#dcfce7' : '#fef3c7',
                        color: supaStatus?.tablesReady ? '#166534' : '#92400e',
                        padding: '4px 10px',
                      }}
                      title={SUPABASE_URL}
                    >
                      {supaStatus?.tablesReady
                        ? '☁️ Supabase Linked (Live)'
                        : '☁️ Supabase Configured'}
                    </span>
                    <span className="admin-tag" style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px' }}>
                      APK Ready
                    </span>
                    <span className="admin-tag" style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 10px' }}>
                      AAB Ready
                    </span>
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <h3 className="admin-card-title">
                  <Bell size={17} color="#eab308" /> Compose Live Push Update (Announcements, Ads, Theme & Plugins)
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="admin-form-grid">
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 700 }}>
                      Push Notification Title:
                      <input
                        className="admin-input"
                        value={pushTitle}
                        onChange={(e) => setPushTitle(e.target.value)}
                        placeholder="e.g. 🌾 Harvest Festival Live!"
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 700 }}>
                      Push Sync Server Endpoint URL:
                      <input
                        className="admin-input"
                        value={config.pushServerUrl}
                        onChange={(e) => onUpdateConfig({ ...config, pushServerUrl: e.target.value })}
                        placeholder="http://10.0.2.2:5173 or https://your-domain.com"
                      />
                    </label>
                  </div>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 700 }}>
                    Push Notification Message:
                    <input
                      className="admin-input"
                      value={pushBody}
                      onChange={(e) => setPushBody(e.target.value)}
                      placeholder="Message shown immediately inside the Android app..."
                    />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 700 }}>
                    Live In-App Announcement Banner (Included in Push):
                    <input
                      className="admin-input"
                      value={config.announcement}
                      onChange={(e) => onUpdateConfig({ ...config, announcement: e.target.value })}
                      placeholder="e.g. 🎉 Double Gold & New Ads Live on Android!"
                    />
                  </label>

                  {/* Quick Ads Toggle inside Push tab */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 12.5, marginBottom: 8, color: '#334155' }}>
                      Ads Included in This Push ({activeAdsCount}/{config.ads.length} active):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {config.ads.map((ad) => (
                        <button
                          key={ad.id}
                          type="button"
                          className={`admin-toggle-btn ${ad.active ? 'on' : 'off'}`}
                          onClick={() =>
                            onUpdateConfig({
                              ...config,
                              ads: config.ads.map((a) => (a.id === ad.id ? { ...a, active: !a.active } : a)),
                            })
                          }
                        >
                          {ad.active ? '✓' : '✕'} {ad.title} ({ad.placement.replace(/_/g, ' ')})
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      Pushes Announcements, Active Ads, Theme (<b>{THEME_PALETTES[config.activeThemeId].name}</b>),
                      Economy ({config.economy.xpMultiplier}× XP) & Plugins directly to <b>{ANDROID_APP_ID}</b>.
                    </div>
                    <button
                      type="button"
                      className="rpg-btn rpg-btn-indigo"
                      disabled={pushing}
                      onClick={handlePushToAndroidApp}
                      style={{ padding: '10px 20px', fontSize: 14 }}
                    >
                      <Send size={15} /> {pushing ? 'Pushing...' : 'Push Update to Android App Now'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Push History */}
              <div className="admin-card">
                <h3 className="admin-card-title">Push Delivery History ({config.pushHistory?.length ?? 0})</h3>
                {!config.pushHistory?.length ? (
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    No updates pushed yet. Click "Push Update to Android App Now" to deploy your first live OTA update!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {config.pushHistory.map((h) => (
                      <div key={h.revision} className="admin-row-card" style={{ padding: '9px 12px' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 13.5 }}>
                            Rev #{h.revision} · {h.notificationTitle}{' '}
                            <span
                              className="admin-tag"
                              style={{
                                background: h.status === 'delivered' ? '#dcfce7' : '#fef3c7',
                                color: h.status === 'delivered' ? '#166534' : '#92400e',
                              }}
                            >
                              {h.status === 'delivered' ? 'SYNC API DELIVERED' : 'LOCAL SYNC'}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#475569' }}>{h.notificationBody}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                            {new Date(h.pushedAt).toLocaleString()} · {h.activeAdsCount} ads · Theme: {h.themeId}
                            {h.announcement ? ` · Ticker: "${h.announcement}"` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= ADS MANAGER ================= */}
          {activeTab === 'ads' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <form className="admin-card" onSubmit={handleAddAd}>
                <h3 className="admin-card-title">
                  <Plus size={17} /> Create Ad Campaign
                </h3>
                <div className="admin-form-grid">
                  <input
                    className="admin-input"
                    placeholder="Campaign Title"
                    value={newAdTitle}
                    onChange={(e) => setNewAdTitle(e.target.value)}
                    required
                  />
                  <input
                    className="admin-input"
                    placeholder="Short Promo Copy"
                    value={newAdDesc}
                    onChange={(e) => setNewAdDesc(e.target.value)}
                  />
                  <input
                    className="admin-input"
                    placeholder="CTA Button Label"
                    value={newAdCta}
                    onChange={(e) => setNewAdCta(e.target.value)}
                  />
                  <select
                    className="admin-input"
                    value={newAdPlacement}
                    onChange={(e) => setNewAdPlacement(e.target.value as AdPlacement)}
                  >
                    <option value="landing_banner">Landing Page Banner</option>
                    <option value="game_hud_pill">In-Game HUD Sponsor Pill</option>
                    <option value="shop_banner">Maya’s Market Promo Banner</option>
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="color"
                      value={newAdColor}
                      onChange={(e) => setNewAdColor(e.target.value)}
                      style={{ width: 38, height: 34, border: 'none', cursor: 'pointer' }}
                    />
                    <button type="submit" className="rpg-btn rpg-btn-primary" style={{ flex: 1, fontSize: 12.5 }}>
                      Publish Ad
                    </button>
                  </div>
                </div>
              </form>

              <div className="admin-card">
                <h3 className="admin-card-title">Active & Scheduled Campaigns ({config.ads.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {config.ads.map((ad) => (
                    <div key={ad.id} className="admin-row-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            width: 12,
                            height: 36,
                            borderRadius: 6,
                            background: ad.accentColor,
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>
                            {ad.title}{' '}
                            <span className="admin-tag">{ad.placement.replace(/_/g, ' ')}</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{ad.description}</div>
                          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 3 }}>
                            👁️ {ad.impressions} views · 🖱️ {ad.clicks} clicks · CTA: <b>{ad.ctaLabel}</b>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          className={`admin-toggle-btn ${ad.active ? 'on' : 'off'}`}
                          onClick={() =>
                            onUpdateConfig({
                              ...config,
                              ads: config.ads.map((a) => (a.id === ad.id ? { ...a, active: !a.active } : a)),
                            })
                          }
                        >
                          {ad.active ? 'Active' : 'Paused'}
                        </button>
                        <button
                          className="admin-icon-danger"
                          onClick={() =>
                            onUpdateConfig({ ...config, ads: config.ads.filter((a) => a.id !== ad.id) })
                          }
                          title="Delete Ad"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= USERS MANAGER ================= */}
          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <form className="admin-card" onSubmit={handleAddUser}>
                <h3 className="admin-card-title">
                  <Plus size={17} /> Add New User
                </h3>
                <div className="admin-form-grid">
                  <input
                    className="admin-input"
                    placeholder="Farmer Username"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    required
                  />
                  <input
                    className="admin-input"
                    placeholder="Email (optional)"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                  <select
                    className="admin-input"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  >
                    <option value="player">Player</option>
                    <option value="vip">VIP</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button type="submit" className="rpg-btn rpg-btn-primary" style={{ fontSize: 12.5 }}>
                    Add User
                  </button>
                </div>
              </form>

              <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <h3 className="admin-card-title" style={{ margin: 0 }}>
                    Community & Player Directory ({syncedUsers.length})
                  </h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      className="admin-mini-btn"
                      onClick={async () => {
                        const cloud = await fetchCloudPlayersFromSupabase();
                        if (cloud.length > 0) {
                          const existingIds = new Set(config.users.map((u) => u.id));
                          const merged = [
                            ...config.users,
                            ...cloud.filter((c) => !existingIds.has(c.id) && !c.isCurrentPlayer),
                          ];
                          onUpdateConfig({ ...config, users: merged });
                          flash(`Synced ${cloud.length} cloud player(s) from Supabase!`);
                        } else {
                          flash('Checked Supabase Cloud (no new players yet).');
                        }
                      }}
                    >
                      ☁️ Sync Supabase
                    </button>
                    <input
                      className="admin-input"
                      style={{ maxWidth: 200 }}
                      placeholder="Search user..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {syncedUsers
                    .filter((u) => u.username.toLowerCase().includes(userSearch.toLowerCase()))
                    .map((u) => (
                      <div key={u.id} className="admin-row-card">
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>
                            {u.username}{' '}
                            {u.isCurrentPlayer && <span className="admin-tag" style={{ background: '#dcfce7', color: '#166534' }}>LIVE YOU</span>}
                            <span className="admin-tag">{u.role.toUpperCase()}</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            {u.email} · Lv.{u.level} · {u.gold.toLocaleString()}g · Day {u.day}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <select
                            className="admin-mini-select"
                            value={u.role}
                            onChange={(e) =>
                              onUpdateConfig({
                                ...config,
                                users: config.users.map((item) =>
                                  item.id === u.id ? { ...item, role: e.target.value as UserRole } : item
                                ),
                              })
                            }
                          >
                            <option value="player">Player</option>
                            <option value="vip">VIP</option>
                            <option value="admin">Admin</option>
                          </select>

                          <select
                            className="admin-mini-select"
                            value={u.status}
                            onChange={(e) =>
                              onUpdateConfig({
                                ...config,
                                users: config.users.map((item) =>
                                  item.id === u.id ? { ...item, status: e.target.value as UserStatus } : item
                                ),
                              })
                            }
                          >
                            <option value="active">Active</option>
                            <option value="muted">Muted</option>
                            <option value="banned">Banned</option>
                          </select>

                          <button
                            className="admin-mini-btn"
                            onClick={() => {
                              if (u.isCurrentPlayer) {
                                onLiveGameAction({ type: 'grant_gold', amount: 500 });
                              } else {
                                onUpdateConfig({
                                  ...config,
                                  users: config.users.map((item) =>
                                    item.id === u.id ? { ...item, gold: item.gold + 500 } : item
                                  ),
                                });
                              }
                              flash(`Gifted +500g to ${u.username}!`);
                            }}
                          >
                            +500g
                          </button>

                          <button
                            className="admin-mini-btn"
                            onClick={() => {
                              const nextLv = Math.min(10, u.level + 1);
                              if (u.isCurrentPlayer) {
                                onLiveGameAction({ type: 'set_level', level: nextLv });
                              } else {
                                onUpdateConfig({
                                  ...config,
                                  users: config.users.map((item) =>
                                    item.id === u.id ? { ...item, level: nextLv } : item
                                  ),
                                });
                              }
                              flash(`Set ${u.username} to Lv.${nextLv}!`);
                            }}
                          >
                            +Lv
                          </button>

                          {!u.isCurrentPlayer && (
                            <button
                              className="admin-icon-danger"
                              onClick={() =>
                                onUpdateConfig({
                                  ...config,
                                  users: config.users.filter((item) => item.id !== u.id),
                                })
                              }
                              title="Remove User"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= LEVELS & ECONOMY ================= */}
          {activeTab === 'levels' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="admin-card">
                <h3 className="admin-card-title">
                  <Sliders size={17} /> Global Economy Multipliers (Live)
                </h3>
                <div className="admin-sliders-grid">
                  <label className="admin-slider-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 13 }}>
                      <span>XP Gain Multiplier</span>
                      <span style={{ color: '#2563eb' }}>{config.economy.xpMultiplier.toFixed(1)}×</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.5"
                      value={config.economy.xpMultiplier}
                      onChange={(e) =>
                        onUpdateConfig({
                          ...config,
                          economy: { ...config.economy, xpMultiplier: Number(e.target.value) },
                        })
                      }
                    />
                  </label>

                  <label className="admin-slider-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 13 }}>
                      <span>Crop Growth Speed</span>
                      <span style={{ color: '#16a34a' }}>{config.economy.growthMultiplier.toFixed(1)}×</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="4"
                      step="0.5"
                      value={config.economy.growthMultiplier}
                      onChange={(e) =>
                        onUpdateConfig({
                          ...config,
                          economy: { ...config.economy, growthMultiplier: Number(e.target.value) },
                        })
                      }
                    />
                  </label>

                  <label className="admin-slider-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 13 }}>
                      <span>Harvest Sell Multiplier</span>
                      <span style={{ color: '#ca8a04' }}>{config.economy.sellMultiplier.toFixed(1)}×</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.25"
                      value={config.economy.sellMultiplier}
                      onChange={(e) =>
                        onUpdateConfig({
                          ...config,
                          economy: { ...config.economy, sellMultiplier: Number(e.target.value) },
                        })
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="admin-card">
                <h3 className="admin-card-title">
                  <Layers size={17} /> Levels 1–10 Balancing Table
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {config.levelOverrides.map((lv) => (
                    <div key={lv.level} className="admin-row-card" style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 185 }}>
                        <span className="level-badge-pill">LV {lv.level}</span>
                        <span style={{ fontWeight: 800, fontSize: 13 }}>
                          {lv.customTitle || getLevelTitle(language, lv.level)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <label style={{ fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          XP:
                          <input
                            type="number"
                            className="admin-input"
                            style={{ width: 82, padding: '4px 6px' }}
                            value={lv.xpRequired}
                            onChange={(e) =>
                              onUpdateConfig({
                                ...config,
                                levelOverrides: config.levelOverrides.map((o) =>
                                  o.level === lv.level ? { ...o, xpRequired: Math.max(10, Number(e.target.value)) } : o
                                ),
                              })
                            }
                          />
                        </label>
                        <label style={{ fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          Sell +% :
                          <input
                            type="number"
                            className="admin-input"
                            style={{ width: 68, padding: '4px 6px' }}
                            value={lv.sellBonusPct}
                            onChange={(e) =>
                              onUpdateConfig({
                                ...config,
                                levelOverrides: config.levelOverrides.map((o) =>
                                  o.level === lv.level ? { ...o, sellBonusPct: Math.max(0, Number(e.target.value)) } : o
                                ),
                              })
                            }
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= PLUGINS MANAGER ================= */}
          {activeTab === 'plugins' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <form className="admin-card" onSubmit={handleAddPlugin}>
                <h3 className="admin-card-title">
                  <Plus size={17} /> Install Custom Plugin
                </h3>
                <div className="admin-form-grid">
                  <input
                    className="admin-input"
                    placeholder="Plugin Name"
                    value={newPluginName}
                    onChange={(e) => setNewPluginName(e.target.value)}
                    required
                  />
                  <input
                    className="admin-input"
                    placeholder="Description"
                    value={newPluginDesc}
                    onChange={(e) => setNewPluginDesc(e.target.value)}
                  />
                  <select
                    className="admin-input"
                    value={newPluginCat}
                    onChange={(e) => setNewPluginCat(e.target.value as PluginEntry['category'])}
                  >
                    <option value="gameplay">Gameplay</option>
                    <option value="ui">UI Overlay</option>
                    <option value="economy">Economy</option>
                    <option value="social">Social</option>
                  </select>
                  <button type="submit" className="rpg-btn rpg-btn-primary" style={{ fontSize: 12.5 }}>
                    Install Plugin
                  </button>
                </div>
              </form>

              <div className="admin-card">
                <h3 className="admin-card-title">Installed Game Plugins ({config.plugins.length})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
                  {config.plugins.map((pl) => (
                    <div key={pl.id} className="admin-row-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>
                            {pl.name} <span style={{ fontSize: 11, color: '#64748b' }}>v{pl.version}</span>
                          </div>
                          <div style={{ fontSize: 11.5, color: '#64748b' }}>
                            by {pl.author} · <span className="admin-tag">{pl.category}</span>
                          </div>
                        </div>
                        <button
                          className={`admin-toggle-btn ${pl.enabled ? 'on' : 'off'}`}
                          onClick={() => {
                            onUpdateConfig({
                              ...config,
                              plugins: config.plugins.map((p) =>
                                p.id === pl.id ? { ...p, enabled: !p.enabled } : p
                              ),
                            });
                            flash(`${pl.name} ${pl.enabled ? 'disabled' : 'enabled'}!`);
                          }}
                        >
                          {pl.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#475569' }}>{pl.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= THEMES & BRANDING ================= */}
          {activeTab === 'themes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="admin-card">
                <h3 className="admin-card-title">
                  <Palette size={17} /> Live Game & World Themes
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {THEME_LIST.map((th) => {
                    const active = config.activeThemeId === th.id;
                    return (
                      <button
                        key={th.id}
                        className={`admin-theme-card ${active ? 'active' : ''}`}
                        onClick={() => {
                          onUpdateConfig({ ...config, activeThemeId: th.id });
                          flash(`Applied "${th.name}" live theme!`);
                        }}
                      >
                        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                          {th.previewSwatches.map((col, idx) => (
                            <span
                              key={idx}
                              style={{
                                flex: 1,
                                height: 28,
                                borderRadius: 8,
                                background: col,
                                border: '1px solid rgba(0,0,0,0.12)',
                              }}
                            />
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{th.name}</span>
                          {active && <Check size={16} color="#16a34a" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="admin-card">
                <h3 className="admin-card-title">
                  <Globe size={17} /> Brand Identity & Copyright
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 700 }}>
                    Game Brand Name:
                    <input
                      className="admin-input"
                      value={config.brandName}
                      onChange={(e) => onUpdateConfig({ ...config, brandName: e.target.value || 'GreenSAGA' })}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 700 }}>
                    Custom Footer Copyright Notice:
                    <input
                      className="admin-input"
                      value={config.copyrightText}
                      onChange={(e) => onUpdateConfig({ ...config, copyrightText: e.target.value })}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ================= MAPS & WORLD ================= */}
          {activeTab === 'maps' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="admin-card">
                <h3 className="admin-card-title">
                  <MapIcon size={17} /> Playable Valley Map Presets ({config.maps.length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 10 }}>
                  {config.maps.map((m) => {
                    const isActive = config.activeMapId === m.id;
                    return (
                      <div key={m.id} className="admin-row-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, borderColor: isActive ? '#16a34a' : '#e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 14.5 }}>{m.name}</div>
                            <div style={{ fontSize: 11.5, color: '#64748b' }}>
                              {m.sizeLabel} · Room: <b>{m.defaultRoomCode}</b>
                            </div>
                          </div>
                          {isActive ? (
                            <span className="admin-tag" style={{ background: '#dcfce7', color: '#166534' }}>ACTIVE</span>
                          ) : (
                            <button
                              className="rpg-btn rpg-btn-primary"
                              style={{ padding: '5px 11px', fontSize: 12 }}
                              onClick={() => {
                                onUpdateConfig({
                                  ...config,
                                  activeMapId: m.id,
                                  activeThemeId: m.themeId,
                                });
                                onLiveGameAction({ type: 'apply_map', map: m });
                                flash(`Activated map "${m.name}"!`);
                              }}
                            >
                              Activate
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#475569' }}>{m.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <form className="admin-card" onSubmit={handleAddMap}>
                <h3 className="admin-card-title">
                  <Plus size={17} /> Create New Map Realm
                </h3>
                <div className="admin-form-grid">
                  <input
                    className="admin-input"
                    placeholder="Map Name (e.g. Suncrest Oasis)"
                    value={newMapName}
                    onChange={(e) => setNewMapName(e.target.value)}
                    required
                  />
                  <input
                    className="admin-input"
                    placeholder="Room Code (e.g. OASIS-05)"
                    value={newMapRoom}
                    onChange={(e) => setNewMapRoom(e.target.value.toUpperCase())}
                  />
                  <select
                    className="admin-input"
                    value={newMapTheme}
                    onChange={(e) => setNewMapTheme(e.target.value as ThemeId)}
                  >
                    {THEME_LIST.map((th) => (
                      <option key={th.id} value={th.id}>
                        Theme: {th.name}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="rpg-btn rpg-btn-primary" style={{ fontSize: 12.5 }}>
                    Add Map
                  </button>
                </div>
              </form>

              {/* Manage Multiplayer Neighbor Farms */}
              <div className="admin-card">
                <h3 className="admin-card-title">
                  🌐 Multiplayer Neighbor Farms ({gameState.neighbors.length})
                </h3>
                <form onSubmit={handleAddNeighbor} style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <input
                    className="admin-input"
                    placeholder="New Neighbor Owner Name"
                    value={newNbrOwner}
                    onChange={(e) => setNewNbrOwner(e.target.value)}
                    required
                  />
                  <select
                    className="admin-input"
                    value={newNbrCrop}
                    onChange={(e) => setNewNbrCrop(e.target.value as CropId)}
                  >
                    {CROP_ORDER.map((c) => (
                      <option key={c} value={c}>
                        Specialty: {CROP_NAMES[language][c]}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="rpg-btn rpg-btn-indigo" style={{ fontSize: 12 }}>
                    <Plus size={14} /> Add Pin to MP Map
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {gameState.neighbors.map((nbr) => (
                    <div key={nbr.id} className="admin-row-card" style={{ padding: '8px 12px' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13.5 }}>
                          {nbr.farmName} <span className="admin-tag">Lv.{nbr.level}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          Owner: {nbr.ownerName} · Specialty: {CROP_NAMES[language][nbr.specialtyCrop]} · Coords ({nbr.mapX}%, {nbr.mapY}%)
                        </div>
                      </div>
                      <button
                        className="admin-icon-danger"
                        onClick={() => {
                          onLiveGameAction({ type: 'remove_neighbor', id: nbr.id });
                          flash(`Removed ${nbr.farmName}`);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= SYSTEM & BACKUP ================= */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="admin-card">
                <h3 className="admin-card-title">Backup & Configuration Import / Export</h3>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <button className="rpg-btn rpg-btn-primary" style={{ fontSize: 13 }} onClick={handleExportJson}>
                    <Download size={15} /> Export Admin JSON
                  </button>
                  <button
                    className="rpg-btn rpg-btn-warm"
                    style={{ fontSize: 13 }}
                    onClick={() => {
                      onUpdateConfig(createDefaultAdminConfig());
                      flash('Admin configuration reset to defaults!');
                    }}
                  >
                    <RefreshCw size={15} /> Reset Admin Defaults
                  </button>
                  <button
                    className="rpg-btn rpg-btn-neutral"
                    style={{ fontSize: 13, color: '#b91c1c' }}
                    onClick={() => {
                      onLiveGameAction({ type: 'reset_save' });
                      flash('Game save reset to Day 1!');
                    }}
                  >
                    <Trash2 size={15} /> Reset Player Farm Save
                  </button>
                </div>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 700 }}>
                  Paste Admin Config JSON to Import:
                  <textarea
                    className="admin-input"
                    rows={4}
                    placeholder='{"brandName": "GreenSAGA", ...}'
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                  />
                </label>
                <button
                  className="rpg-btn rpg-btn-indigo"
                  style={{ marginTop: 8, fontSize: 12.5 }}
                  disabled={!importText.trim()}
                  onClick={handleImportJson}
                >
                  Import JSON Config
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
