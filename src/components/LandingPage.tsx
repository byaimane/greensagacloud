import React from 'react';
import {
  AlertTriangle,
  Award,
  Globe,
  Map,
  Megaphone,
  Play,
  RotateCcw,
  Sparkles,
  Sprout,
  Tractor,
  Users,
} from 'lucide-react';
import { LEVEL_MILESTONES } from '../data/crops';
import { getActiveTheme } from '../engine/adminStore';
import { getLevelTitle, LANGUAGES, t } from '../i18n/translations';
import { AdminConfig } from '../types/admin';
import { GameState, Language } from '../types/game';

interface LandingPageProps {
  language: Language;
  savedGame: GameState | null;
  adminConfig: AdminConfig;
  onChangeLanguage: (lang: Language) => void;
  onContinue: () => void;
  onNewGame: () => void;
  onClickAd: (adId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  language,
  savedGame,
  adminConfig,
  onChangeLanguage,
  onContinue,
  onNewGame,
  onClickAd,
}) => {
  const theme = getActiveTheme(adminConfig);
  const landingAds = adminConfig.ads.filter((a) => a.active && a.placement === 'landing_banner');

  return (
    <div className="landing-page">
      {/* Global Announcement or Maintenance Banner controlled by Admin */}
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
          <AlertTriangle size={15} /> Scheduled Maintenance Notice — Gameplay remains previewable for Admins.
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
            <div className="landing-logo-badge">🌾</div>
            <span
              className="font-display"
              style={{ fontSize: 24, fontWeight: 700, color: '#fef08a', letterSpacing: '0.05em' }}
            >
              {adminConfig.brandName}
            </span>
          </div>

          <nav className="landing-links">
            <a href="#features">{t(language, 'navFeatures')}</a>
            <a href="#levels">{t(language, 'navLevels')}</a>
            <a href="#multiplayer">{t(language, 'navMultiplayer')}</a>
            <a href="#controls">{t(language, 'navControls')}</a>
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

      {/* Hero Section (Theme-Aware!) */}
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
                  style={{ fontSize: 17, padding: '14px 26px' }}
                  onClick={onContinue}
                >
                  <Play size={19} fill="currentColor" />
                  {t(language, 'continueFarm')} ({t(language, 'day')} {savedGame.day} · {t(language, 'level')}{' '}
                  {savedGame.player.level} · {savedGame.player.gold}g)
                </button>
                <button
                  className="rpg-btn rpg-btn-gold"
                  style={{ fontSize: 16, padding: '14px 22px' }}
                  onClick={onNewGame}
                >
                  <RotateCcw size={17} />
                  {t(language, 'newFarm')}
                </button>
              </>
            ) : (
              <button
                className="rpg-btn rpg-btn-primary"
                style={{ fontSize: 18, padding: '15px 32px' }}
                onClick={onNewGame}
              >
                <Play size={20} fill="currentColor" />
                {t(language, 'playNow')}
              </button>
            )}
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
              <span className="hero-stat-num">72</span>
              <span>
                {language === 'fr' ? 'Parcelles Max' : language === 'ar' ? 'قطعة زراعية' : 'Max Farm Plots'}
              </span>
            </div>
            <div className="hero-stat-pill">
              <span className="hero-stat-num">10</span>
              <span>
                {language === 'fr' ? 'Niveaux RPG' : language === 'ar' ? 'مستويات RPG' : 'RPG Levels'}
              </span>
            </div>
            <div className="hero-stat-pill">
              <span className="hero-stat-num">{adminConfig.maps.length}</span>
              <span>
                {language === 'fr' ? 'Cartes & Thèmes' : language === 'ar' ? 'خرائط وثيمات' : 'Maps & Themes'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Admin-Managed Sponsor Ad Banner */}
      {landingAds.length > 0 && (
        <section style={{ background: '#fffdf5', padding: '22px 0 0' }}>
          <div className="landing-container">
            {landingAds.map((ad) => (
              <div
                key={ad.id}
                className="ad-banner-card"
                style={{ borderColor: ad.accentColor }}
              >
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

      {/* Multiplayer Map Showcase */}
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
                <Users size={14} /> LIVE VALLEY SYNC · ROOM CODES
              </div>
              <h2 className="font-display" style={{ margin: '0 0 10px', fontSize: 28, color: '#451a03' }}>
                {t(language, 'mpSectionTitle')}
              </h2>
              <p style={{ margin: '0 0 18px', color: '#57534e', lineHeight: 1.6, fontSize: 15 }}>
                {t(language, 'mpSectionDesc')}
              </p>
              <button
                className="rpg-btn rpg-btn-primary"
                onClick={savedGame ? onContinue : onNewGame}
              >
                <Map size={17} /> {t(language, 'playNow')}
              </button>
            </div>

            <div className="mp-mini-visual">
              <div className="mp-mini-pin" style={{ left: '20%', top: '52%', background: '#16a34a' }}>
                🏡 {adminConfig.brandName}
              </div>
              <div className="mp-mini-pin" style={{ left: '52%', top: '46%', background: '#ea580c' }}>
                🏘️ Village
              </div>
              <div className="mp-mini-pin" style={{ left: '80%', top: '50%', background: '#4f46e5' }}>
                🌐 Plaza
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

      {/* Controls Strip */}
      <section id="controls" className="landing-section" style={{ paddingTop: 10, paddingBottom: 42 }}>
        <div className="landing-container" style={{ textAlign: 'center' }}>
          <div className="rpg-panel" style={{ padding: '18px 24px', display: 'inline-block', maxWidth: 860 }}>
            <div className="font-display" style={{ fontWeight: 700, color: '#78350f', marginBottom: 6, fontSize: 17 }}>
              {t(language, 'controlsTitle')}
            </div>
            <div style={{ fontSize: 13.5, color: '#57534e', fontWeight: 600 }}>
              {t(language, 'controlsList')}
            </div>
          </div>
        </div>
      </section>

      {/* Copyright Footer */}
      <footer className="landing-footer">
        <div className="landing-container footer-inner">
          <div>
            <div className="font-display" style={{ fontSize: 20, fontWeight: 700, color: '#fef08a' }}>
              🌾 {adminConfig.brandName}
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
              v2.5 · Theme: {theme.name} · EN / FR / العربية
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
