import React, { useState } from 'react';
import { ArrowLeft, Crown, Shield, Swords, Sparkles } from 'lucide-react';
import { apiRequest, setToken } from '../api';
import { LanguageSwitcher, useI18n } from '../i18n';
import type { PlayerState } from '../types';

interface Props {
  initialMode?: 'guest' | 'login' | 'register';
  onBackHome: () => void;
  onAuthSuccess: (state: PlayerState) => void;
}

const AVATARS = ['👑', '🦁', '⚔️', '🐉', '🛡️', '🔥', '🦅', '💀'];

export const AuthScreen: React.FC<Props> = ({ initialMode = 'guest', onBackHome, onAuthSuccess }) => {
  const { t } = useI18n();
  const [mode, setMode] = useState<'guest' | 'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('👑');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint =
        mode === 'guest' ? '/api/auth/guest' : mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const data = await apiRequest<{ token: string; state: PlayerState }>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ username, password, avatar }),
      });
      setToken(data.token);
      onAuthSuccess(data.state);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#07090f] flex flex-col items-center justify-center p-4">
      {/* Top Bar: Back to Home + Language */}
      <div className="absolute top-4 inset-x-4 max-w-5xl mx-auto flex items-center justify-between z-20">
        <button
          onClick={onBackHome}
          className="btn-steel px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('backHome')}
        </button>
        <LanguageSwitcher />
      </div>

      {/* Atmospheric Medieval Backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 20%, rgba(217,119,6,0.22) 0%, rgba(15,23,42,0.85) 55%, #07090f 100%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 w-full max-w-md mt-10">
        {/* Royal Title Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/30 to-red-900/40 border border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.35)] mb-3 animate-float">
            <Crown className="w-9 h-9 text-amber-300" />
          </div>
          <h1 className="font-royal text-5xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 drop-shadow-[0_2px_10px_rgba(245,158,11,0.4)]">
            OUAGX
          </h1>
          <p className="text-xs uppercase tracking-[0.25em] text-amber-300/80 mt-1">
            {t('brandSubtitle')}
          </p>
        </div>

        <div className="panel-stone panel-gold-border rounded-2xl p-6">
          {/* Mode Tabs */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-amber-500/20 mb-5">
            {(['guest', 'login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError('');
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  mode === m
                    ? 'bg-amber-600/90 text-amber-50 shadow'
                    : 'text-slate-400 hover:text-amber-200'
                }`}
              >
                {m === 'guest' ? t('quickPlay') : m === 'login' ? t('signIn') : t('createAccount')}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/80 mb-1.5">
                {mode === 'guest' ? t('lordNameOpt') : t('lordName')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={mode === 'guest' ? t('guestPlaceholder') : t('lordPlaceholder')}
                required={mode !== 'guest'}
                className="w-full rounded-xl bg-slate-950/90 border border-slate-700/80 px-3.5 py-2.5 text-sm text-amber-50 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {mode !== 'guest' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/80 mb-1.5">
                  {t('passphrase')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl bg-slate-950/90 border border-slate-700/80 px-3.5 py-2.5 text-sm text-amber-50 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            {mode !== 'login' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/80 mb-1.5">
                  {t('royalCrest')}
                </label>
                <div className="grid grid-cols-8 gap-1.5">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAvatar(a)}
                      className={`h-9 rounded-lg flex items-center justify-center text-lg border transition cursor-pointer ${
                        avatar === a
                          ? 'bg-amber-500/25 border-amber-400 scale-105'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-950/80 border border-red-500/50 px-3.5 py-2 text-xs text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-royal w-full py-3 rounded-xl font-royal font-bold tracking-wider text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              {loading
                ? t('forgingKingdom')
                : mode === 'guest'
                ? t('enterRealm')
                : mode === 'login'
                ? t('returnCitadel')
                : t('claimKingdom')}
            </button>
          </form>

          {/* Feature Highlights */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-amber-500/15 text-center">
            <div className="bg-slate-950/60 rounded-lg p-2">
              <Shield className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="text-[11px] font-semibold text-amber-100">Lv.1–30</div>
              <div className="text-[10px] text-slate-400">{t('statBuildings')}</div>
            </div>
            <div className="bg-slate-950/60 rounded-lg p-2">
              <Sparkles className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <div className="text-[11px] font-semibold text-amber-100">20 PvE</div>
              <div className="text-[10px] text-slate-400">{t('tabCampaign')}</div>
            </div>
            <div className="bg-slate-950/60 rounded-lg p-2">
              <Swords className="w-4 h-4 text-rose-400 mx-auto mb-1" />
              <div className="text-[11px] font-semibold text-amber-100">40×40</div>
              <div className="text-[10px] text-slate-400">{t('tabWorld')}</div>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-5">{t('copyright')}</p>
      </div>
    </div>
  );
};
