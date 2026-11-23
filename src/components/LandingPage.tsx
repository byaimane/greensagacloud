import React from 'react';
import {
  AlertTriangle,
  Award,
  Download,
  Globe,
  LogOut,
  Map,
  Megaphone,
  Play,
  RotateCcw,
  Smartphone,
  Sparkles,
  Sprout,
  Tractor,
  UserPlus,
  Users,
} from 'lucide-react';
import { LEVEL_MILESTONES } from '../data/crops';
import { PlayerAccount } from '../engine/accountStore';
import { getActiveTheme } from '../engine/adminStore';
import { getLevelTitle, LANGUAGES, t } from '../i18n/translations';
import { AdminConfig } from '../types/admin';
import { GameState, Language } from '../types/game';

interface LandingPageProps {
  language: Language;
  savedGame: GameState | null;
  adminConfig: AdminConfig;
  currentAccount: PlayerAccount | null;
  onChangeLanguage: (lang: Language) => void;
  onContinue: () => void;
  onNewGame: () => void;
  onOpenAuth: (mode: 'register' | 'login') => void;
  onSignOutAccount: () => void;
  onClickAd: (adId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  language,
  savedGame,
  adminConfig,
  currentAccount,
  onChangeLanguage,
  onContinue,
  onNewGame,
  onOpenAuth,
  onSignOutAccount,
  onClickAd,
}) => {
  const theme = getActiveTheme(adminConfig);
  const landingAds = adminConfig.ads.filter((a) => a.active && a.placement === 'landing_banner');

  const apkLabel =
    language === 'fr'
      ? 'Télécharger APK Android'
      : language === 'ar'
      ? 'تحميل تطبيق أندرويد APK'
      : 'Download Android APK';

  const createAccLabel =
    language === 'fr' ? 'Créer un Compte' : language === 'ar' ? 'إنشاء حساب' : 'Create Account';

  const signInLabel =
    language === 'fr' ? 'Connexion' : language === 'ar' ? 'دخول' : 'Sign In';

  return (
    <div className="landing-page">
      {adminConfig.maintenanceMode && (
        <div
          style={{
            background: '#b91c1c',
            color: '#fff',
            padding: '8px 16px',
            textAlign: 'center',
            fontWeight: 800,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={15} /> Scheduled Maintenance Notice — Gameplay remains previewable.
        </div>
      )}

      {adminConfig.announcement.trim() && (
        <div
          style={{
            background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
            color: '#fff',
            padding: '7px 16px',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
          }}
        >
          <Megaphone size={14} /> {adminConfig.announcement}
        </div>
      )}

      {/* Sticky Top Navbar */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="./favicon.svg"
              alt={adminConfig.brandName}
              style={{ width: 38, height: 38, borderRadius: 10, boxShadow: '0 3px 0 #78350f' }}
            />
            <span
              className="font-display"
              style={{ fontSize: 24, fontWeight: 700, color: '#fef08a', letterSpacing: '0.04em' }}
            >
              {adminConfig.brandName}
            </span>
          </div>

          <nav className="landing-links">
            <a href="#features">{t(language, 'navFeatures')}</a>
            <a href="#levels">{t(language, 'navLevels')}</a>
            <a href="#multiplayer">{t(language, 'navMultiplayer')}</a>
            <a href="#download-apk">Android APK</a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div className="lang-switcher" role="group" aria-label="Language">
              <Globe size={14} style={{ opacity: 0.75, marginInlineStart: 4 }} />
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  className={`lang-pill ${language === l.code ? 'active' : ''}`}
                  onClick={() => onChangeLanguage(l.code)}
                >
                  {l.native}
                </button>
              ))}
            </div>

            {currentAccount ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(255,255,255,0.14)',
                  border: '1.5px solid #fde047',
                  borderRadius: 999,
                  padding: '4px 10px',
                  color: '#fefce8',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: currentAccount.shirtColor,
                    border: '1.5px solid #fff',
                  }}
                />
                <span>{currentAccount.username}</span>
                <button
                  onClick={onSignOutAccount}
                  title="Sign Out"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <>
                <button
                  className="rpg-btn rpg-btn-neutral"
                  style={{ padding: '6px 12px', fontSize: 12.5 }}
                  onClick={() => onOpenAuth('login')}
                >
                  {signInLabel}
                </button>
                <button
                  className="rpg-btn rpg-btn-gold"
                  style={{ padding: '6px 12px', fontSize: 12.5 }}
                  onClick={() => onOpenAuth('register')}
                >
                  <UserPlus size={14} /> {createAccLabel}
                </button>
              </>
            )}

            <button
              className="rpg-btn rpg-btn-primary"
              style={{ padding: '7px 14px', fontSize: 13 }}
              onClick={savedGame ? onContinue : onNewGame}
            >
              <Play size={14} fill="currentColor" />
              {t(language, 'playNow')}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero" style={{ background: theme.heroGradient }}>
        <div className="landing-container">
          <div className="hero-badge">
            <Sparkles size={14} /> {t(language, 'badge')}
          </div>

          <h1 className="hero-title font-display">{adminConfig.brandName}</h1>
          <p className="hero-subtitle">{t(language, 'heroSubtitle')}</p>

          <div className="hero-cta-row">
            {savedGame ? (
              <>
                <button
                  className="rpg-btn rpg-btn-primary"
                  style={{ fontSize: 16.5, padding: '13px 24px' }}
                  onClick={onContinue}
                >
                  <Play size={18} fill="currentColor" />
                  {t(language, 'continueFarm')} ({t(language, 'day')} {savedGame.day} · {t(language, 'level')}{' '}
                  {savedGame.player.level} · {savedGame.player.gold}g)
                </button>
                <button
                  className="rpg-btn rpg-btn-gold"
                  style={{ fontSize: 15.5, padding: '13px 20px' }}
                  onClick={onNewGame}
                >
                  <RotateCcw size={16} />
                  {t(language, 'newFarm')}
                </button>
              </>
            ) : (
              <button
                className="rpg-btn rpg-btn-primary"
                style={{ fontSize: 18, padding: '15px 30px' }}
                onClick={onNewGame}
              >
                <Play size={20} fill="currentColor" />
                {t(language, 'playNow')}
              </button>
            )}

            <a
              href="./downloads/GreenSAGA-v2.6.0.apk"
              download="GreenSAGA-v2.6.0.apk"
              className="rpg-btn rpg-btn-indigo"
              style={{ fontSize: 15.5, padding: '13px 22px', textDecoration: 'none' }}
            >
              <Download size={17} /> {apkLabel}
            </a>
          </div>

          {/* Valley Highlight Stats */}
          <div className="hero-stats-grid">
            <div className="hero-stat-pill">
              <span className="hero-stat-num">8+</span>
              <span>
                {language === 'fr' ? 'Cultures & Fruits' : language === 'ar' ? 'محاصيل وفواكه' : 'Crops & Fruits'}
              </span>
            </div>
            <div className="hero-stat-pill">
              <span className="hero-stat-num">6+</span>
              <span>
                {language === 'fr' ? 'Joueurs IA Actifs' : language === 'ar' ? 'لاعبو ذكاء اصطناعي' : 'Live AI Players'}
              </span>
            </div>
            <div className="hero-stat-pill">
              <span className="hero-stat-num">10</span>
              <span>
                {language === 'fr' ? 'Niveaux RPG' : language === 'ar' ? 'مستويات RPG' : 'RPG Levels'}
              </span>
            </div>
            <div className="hero-stat-pill">
              <span className="hero-stat-num">APK</span>
              <span>com.ouagx.myapp</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Admin-Managed Sponsor Ad Banner */}
      {landingAds.length > 0 && (
        <section style={{ background: '#fffdf5', padding: '22px 0 0' }}>
          <div className="landing-container">
            {landingAds.map((ad) => (
              <div key={ad.id} className="ad-banner-card" style={{ borderColor: ad.accentColor }}>
                <div>
                  <span className="ad-sponsored-tag" style={{ background: ad.accentColor }}>
                    SPONSORED
                  </span>
                  <span style={{ fontWeight: 800, fontSize: 15, marginInlineStart: 8, color: '#1c1917' }}>
                    {ad.title}
                  </span>
                  <div style={{ fontSize: 13, color: '#57534e', marginTop: 3 }}>{ad.description}</div>
                </div>
                <button
                  className="rpg-btn rpg-btn-gold"
                  style={{ fontSize: 13, padding: '8px 16px', flexShrink: 0 }}
                  onClick={() => {
                    onClickAd(ad.id);
                    if (savedGame) onContinue();
                    else onNewGame();
                  }}
                >
                  {ad.ctaLabel}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section id="features" className="landing-section">
        <div className="landing-container">
          <h2 className="section-title font-display">{t(language, 'featuresTitle')}</h2>
          <div className="features-grid">
            <div className="rpg-panel feature-card">
              <div className="feature-icon" style={{ background: '#dcfce7', color: '#15803d' }}>
                <Sprout size={26} />
              </div>
              <h3 className="font-display">{t(language, 'feat1Title')}</h3>
              <p>{t(language, 'feat1Desc')}</p>
            </div>
            <div className="rpg-panel feature-card">
              <div className="feature-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                <Tractor size={26} />
              </div>
              <h3 className="font-display">{t(language, 'feat2Title')}</h3>
              <p>{t(language, 'feat2Desc')}</p>
            </div>
            <div className="rpg-panel feature-card">
              <div className="feature-icon" style={{ background: '#ede9fe', color: '#6d28d9' }}>
                <Award size={26} />
              </div>
              <h3 className="font-display">{t(language, 'feat3Title')}</h3>
              <p>{t(language, 'feat3Desc')}</p>
            </div>
            <div className="rpg-panel feature-card">
              <div className="feature-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                <Map size={26} />
              </div>
              <h3 className="font-display">{t(language, 'feat4Title')}</h3>
              <p>{t(language, 'feat4Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Levels 1-10 Roadmap Section */}
      <section id="levels" className="landing-section landing-section-alt">
        <div className="landing-container">
          <h2 className="section-title font-display">{t(language, 'levelsSectionTitle')}</h2>
          <div className="levels-preview-grid">
            {LEVEL_MILESTONES.map((m) => {
              const ov = adminConfig.levelOverrides.find((o) => o.level === m.level);
              return (
                <div key={m.level} className="rpg-panel level-preview-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="level-badge-pill">
                      {t(language, 'level')} {m.level}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: 13, color: '#78350f' }}>
                      {ov?.customTitle || getLevelTitle(language, m.level)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#57534e', lineHeight: 1.45 }}>
                    {m.unlocks[language]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Multiplayer & AI Players Showcase */}
      <section id="multiplayer" className="landing-section">
        <div className="landing-container">
          <div className="rpg-panel mp-showcase-card">
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 999,
                  background: '#e0e7ff',
                  color: '#3730a3',
                  fontWeight: 800,
                  fontSize: 12,
                  marginBottom: 10,
                }}
              >
                <Users size={14} /> LIVE AI FARMERS & MULTIPLAYER VALLEY
              </div>
              <h2 className="font-display" style={{ margin: '0 0 10px', fontSize: 28, color: '#451a03' }}>
                {t(language, 'mpSectionTitle')}
              </h2>
              <p style={{ margin: '0 0 18px', color: '#57534e', lineHeight: 1.6, fontSize: 15 }}>
                {t(language, 'mpSectionDesc')}
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="rpg-btn rpg-btn-primary" onClick={savedGame ? onContinue : onNewGame}>
                  <Map size={17} /> {t(language, 'playNow')}
                </button>
                {!currentAccount && (
                  <button className="rpg-btn rpg-btn-gold" onClick={() => onOpenAuth('register')}>
                    <UserPlus size={16} /> {createAccLabel}
                  </button>
                )}
              </div>
            </div>

            <div className="mp-mini-visual">
              <div className="mp-mini-pin" style={{ left: '20%', top: '52%', background: '#16a34a' }}>
                🏡 {adminConfig.brandName}
              </div>
              <div className="mp-mini-pin" style={{ left: '52%', top: '46%', background: '#ea580c' }}>
                🏘️ Village
              </div>
              <div className="mp-mini-pin" style={{ left: '80%', top: '50%', background: '#4f46e5' }}>
                🌐 Plaza (6 AI)
              </div>
              <div className="mp-mini-pin" style={{ left: '30%', top: '20%', background: '#d97706' }}>
                🌾 Amine
              </div>
              <div className="mp-mini-pin" style={{ left: '72%', top: '20%', background: '#db2777' }}>
                🍓 Claire
              </div>
              <div className="mp-mini-pin" style={{ left: '46%', top: '80%', background: '#0284c7' }}>
                ⭐ Yasmine
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dedicated Android APK Download Section */}
      <section id="download-apk" className="landing-section landing-section-alt">
        <div className="landing-container">
          <div className="rpg-panel" style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <img
                src="./icon-192.png"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = './favicon.svg';
                }}
                alt="GreenSAGA Android App Icon"
                style={{ width: 68, height: 68, borderRadius: 18, border: '3px solid #78350f', boxShadow: '0 6px 14px rgba(0,0,0,0.2)' }}
              />
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 800, color: '#166534', background: '#dcfce7', padding: '2px 10px', borderRadius: 999, marginBottom: 4 }}>
                  <Smartphone size={13} /> ANDROID APP · v2.6.0
                </div>
                <h3 className="font-display" style={{ margin: '0 0 4px', fontSize: 22, color: '#451a03' }}>
                  {adminConfig.brandName} for Android
                </h3>
                <div style={{ fontSize: 13, color: '#57534e' }}>
                  Package: <code>com.ouagx.myapp</code> · Signed APK · Cloud Supabase Sync & Live Push Updates
                </div>
              </div>
            </div>

            <a
              href="./downloads/GreenSAGA-v2.6.0.apk"
              download="GreenSAGA-v2.6.0.apk"
              className="rpg-btn rpg-btn-primary"
              style={{ fontSize: 15.5, padding: '13px 24px', textDecoration: 'none' }}
            >
              <Download size={18} /> {apkLabel} (.apk)
            </a>
          </div>
        </div>
      </section>

      {/* Copyright Footer */}
      <footer className="landing-footer">
        <div className="landing-container footer-inner">
          <div>
            <div className="font-display" style={{ fontSize: 20, fontWeight: 700, color: '#fef08a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="./favicon.svg" alt="" style={{ width: 24, height: 24, borderRadius: 6 }} />
              {adminConfig.brandName}
            </div>
            <div style={{ fontSize: 13, color: '#d6d3d1', marginTop: 4 }}>
              {t(language, 'copyrightSub')}
            </div>
          </div>
          <div style={{ textAlign: 'end' }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#fefce8' }}>
              {adminConfig.copyrightText || t(language, 'copyright')}
            </div>
            <div style={{ fontSize: 12, color: '#a8a29e', marginTop: 3 }}>
              v2.6 · Theme: {theme.name} · EN / FR / العربية
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
