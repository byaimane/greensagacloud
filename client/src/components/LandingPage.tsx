import React, { useState } from 'react';
import { HERO_TEMPLATES } from '@shared/gameData';
import {
  ArrowLeft,
  ArrowRight,
  Castle,
  Crown,
  Flame,
  Globe,
  Shield,
  Sparkles,
  Swords,
} from 'lucide-react';
import { apiRequest, setToken } from '../api';
import { LanguageSwitcher, useI18n } from '../i18n';
import type { PlayerState } from '../types';

interface Props {
  onOpenAuth: (mode: 'login' | 'register' | 'guest') => void;
  onQuickPlaySuccess: (state: PlayerState) => void;
}

export const LandingPage: React.FC<Props> = ({ onOpenAuth, onQuickPlaySuccess }) => {
  const { t, isRtl } = useI18n();
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInstantGuest = async () => {
    setGuestLoading(true);
    setError('');
    try {
      const data = await apiRequest<{ token: string; state: PlayerState }>('/api/auth/guest', {
        method: 'POST',
        body: JSON.stringify({ avatar: '👑' }),
      });
      setToken(data.token);
      onQuickPlaySuccess(data.state);
    } catch (err: any) {
      setError(err.message || 'Could not enter realm.');
    } finally {
      setGuestLoading(false);
    }
  };

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen w-full bg-[#07090f] text-stone-100 flex flex-col">
      {/* STICKY ROYAL HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#090c14]/88 border-b border-amber-500/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <a href="#top" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/35 to-red-900/50 border border-amber-400/70 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="font-royal text-xl font-extrabold tracking-widest text-amber-200 leading-none">
                OUAGX
              </div>
              <div className="text-[10px] text-amber-400/80 tracking-wider hidden sm:block">
                {t('brandSubtitle')}
              </div>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <a href="#features" className="hover:text-amber-300 transition">
              {t('navFeatures')}
            </a>
            <a href="#heroes" className="hover:text-amber-300 transition">
              {t('navHeroes')}
            </a>
            <a href="#cta" className="hover:text-amber-300 transition">
              {t('navWorld')}
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <button
              onClick={() => onOpenAuth('login')}
              className="btn-steel px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer hidden sm:inline-flex"
            >
              {t('signIn')}
            </button>
            <button
              onClick={handleInstantGuest}
              disabled={guestLoading}
              className="btn-royal px-4 py-2 rounded-xl font-royal font-bold text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Swords className="w-3.5 h-3.5" />
              {t('playNow')}
            </button>
          </div>
        </div>
      </header>

      {/* HERO BANNER WITH ILLUSTRATED MEDIEVAL WORLD BACKDROP */}
      <section id="top" className="relative overflow-hidden border-b border-amber-500/20">
        {/* Atmospheric Radial Glow + Illustrated Forest/Mountains/Castle Silhouette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 15%, rgba(217,119,6,0.28) 0%, rgba(16,38,29,0.5) 48%, #07090f 90%)',
          }}
        />
        <svg
          viewBox="0 0 1440 420"
          preserveAspectRatio="none"
          className="pointer-events-none absolute bottom-0 inset-x-0 w-full h-56 opacity-45"
        >
          {/* Distant Snow Mountains */}
          <path
            d="M0,420 L0,250 L160,140 L310,240 L480,105 L660,235 L860,120 L1080,230 L1270,130 L1440,220 L1440,420 Z"
            fill="#142321"
          />
          {/* Midground Pine Forest Ridge */}
          <path
            d="M0,420 L0,305 L60,270 L110,305 L175,260 L240,305 L310,265 L380,310 L460,275 L540,315 L630,275 L720,240 L810,275 L900,310 L990,265 L1080,305 L1170,260 L1260,305 L1350,270 L1440,305 L1440,420 Z"
            fill="#0d1c16"
          />
          {/* Central Citadel Silhouette */}
          <g fill="#091018" opacity="0.95">
            <rect x="675" y="190" width="90" height="120" />
            <rect x="660" y="160" width="24" height="150" />
            <rect x="756" y="160" width="24" height="150" />
            <polygon points="720,115 692,190 748,190" />
            <polygon points="672,135 656,162 688,162" />
            <polygon points="768,135 752,162 784,162" />
          </g>
        </svg>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/75 border border-amber-400/50 text-[11px] font-bold tracking-widest text-amber-300 mb-6 shadow-[0_0_24px_rgba(245,158,11,0.2)]">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            {t('heroBadge')}
          </div>

          <h1 className="font-royal text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-tight">
            <span className="block text-amber-50 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              {t('heroTitle1')}
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 mt-1">
              {t('heroTitle2')}
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed mt-6">
            {t('heroDesc')}
          </p>

          {error && (
            <div className="max-w-md mx-auto mt-4 rounded-xl bg-rose-950/80 border border-rose-500/60 px-4 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
            <button
              onClick={handleInstantGuest}
              disabled={guestLoading}
              className="btn-royal px-7 py-4 rounded-2xl font-royal font-bold text-sm sm:text-base flex items-center gap-2.5 cursor-pointer"
            >
              <Swords className="w-5 h-5" />
              {guestLoading ? t('forgingKingdom') : t('playGuest')}
              <ArrowIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenAuth('register')}
              className="btn-steel px-6 py-4 rounded-2xl font-royal font-bold text-sm sm:text-base flex items-center gap-2 cursor-pointer"
            >
              <Shield className="w-5 h-5 text-amber-400" />
              {t('createAccount')} / {t('signIn')}
            </button>
          </div>

          {/* Realm Stats Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mt-14">
            {[
              { val: '14', label: t('statBuildings'), icon: '🏰' },
              { val: '20', label: t('statCampaign'), icon: '⚔️' },
              { val: '40', label: t('statTroops'), icon: '🛡️' },
              { val: '40×40', label: t('statWorld'), icon: '🌲' },
            ].map((s) => (
              <div
                key={s.label}
                className="panel-stone rounded-2xl p-4 text-center backdrop-blur-sm"
              >
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="font-royal text-2xl font-extrabold text-amber-300">{s.val}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SHOWCASE */}
      <section id="features" className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-royal text-3xl sm:text-4xl font-bold text-amber-200">
            {t('featSectionTitle')}
          </h2>
          <p className="text-sm text-slate-400 mt-2">{t('featSectionSub')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: <Castle className="w-6 h-6 text-amber-400" />,
              title: t('feat1Title'),
              desc: t('feat1Desc'),
              glow: 'from-amber-500/20 to-transparent',
            },
            {
              icon: <Sparkles className="w-6 h-6 text-purple-400" />,
              title: t('feat2Title'),
              desc: t('feat2Desc'),
              glow: 'from-purple-500/20 to-transparent',
            },
            {
              icon: <Swords className="w-6 h-6 text-rose-400" />,
              title: t('feat3Title'),
              desc: t('feat3Desc'),
              glow: 'from-rose-500/20 to-transparent',
            },
            {
              icon: <Globe className="w-6 h-6 text-emerald-400" />,
              title: t('feat4Title'),
              desc: t('feat4Desc'),
              glow: 'from-emerald-500/20 to-transparent',
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`panel-stone rounded-2xl p-6 bg-gradient-to-b ${f.glow} hover:border-amber-400/60 transition`}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-950/90 border border-amber-500/30 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-royal text-base font-bold text-amber-100">{f.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LEGENDARY HEROES PREVIEW */}
      <section id="heroes" className="bg-[#0a0e16] border-y border-amber-500/15 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-royal text-3xl font-bold text-amber-200">{t('heroesSectionTitle')}</h2>
            <p className="text-sm text-slate-400 mt-2">{t('heroesSectionSub')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[HERO_TEMPLATES[0], HERO_TEMPLATES[1], HERO_TEMPLATES[2], HERO_TEMPLATES[6]].map((h) => (
              <div
                key={h.key}
                className={`panel-stone rounded-2xl p-5 border rarity-${h.rarity} text-center`}
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-950 border border-current flex items-center justify-center text-4xl mb-3">
                  {h.avatar}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-950 border border-current">
                  {h.rarity} • {h.heroClass}
                </span>
                <h3 className="font-royal text-lg font-bold text-amber-100 mt-2">{h.name}</h3>
                <div className="text-xs text-slate-400">{h.title}</div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-amber-300 font-semibold">
                  ⚡ {h.skillName}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section id="cta" className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-16">
        <div className="panel-stone panel-gold-border rounded-3xl p-8 sm:p-12 text-center bg-gradient-to-br from-amber-950/40 via-slate-950 to-emerald-950/30">
          <Crown className="w-11 h-11 text-amber-400 mx-auto mb-3 animate-float" />
          <h2 className="font-royal text-3xl sm:text-4xl font-bold text-amber-100">{t('ctaTitle')}</h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto mt-2">{t('ctaDesc')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={handleInstantGuest}
              disabled={guestLoading}
              className="btn-royal px-8 py-3.5 rounded-2xl font-royal font-bold text-sm cursor-pointer inline-flex items-center gap-2"
            >
              <Swords className="w-4 h-4" />
              {t('playGuest')}
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="btn-steel px-6 py-3.5 rounded-2xl font-royal font-bold text-sm cursor-pointer"
            >
              {t('signIn')}
            </button>
          </div>
        </div>
      </section>

      {/* OFFICIAL FOOTER WITH COPYRIGHT */}
      <footer className="mt-auto border-t border-amber-500/20 bg-[#05070c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-center md:text-start">
              <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="font-royal text-lg font-extrabold tracking-widest text-amber-200">
                  OUAGX
                </div>
                <p className="text-xs text-slate-400 max-w-md">{t('footerTagline')}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-400">
              <a href="#features" className="hover:text-amber-300 transition">
                {t('footerTerms')}
              </a>
              <a href="#heroes" className="hover:text-amber-300 transition">
                {t('footerPrivacy')}
              </a>
              <a href="#top" className="hover:text-amber-300 transition">
                {t('footerRules')}
              </a>
              <LanguageSwitcher compact />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <p className="font-medium text-amber-200/80">{t('copyright')}</p>
            <p>OUAGX • Realm #1 Valoria • v1.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
