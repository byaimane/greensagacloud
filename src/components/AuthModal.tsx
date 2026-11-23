import React, { useState } from 'react';
import { Lock, Mail, Sparkles, User, UserPlus, X } from 'lucide-react';
import {
  loginPlayerAccount,
  PlayerAccount,
  registerPlayerAccount,
} from '../engine/accountStore';
import { Language } from '../types/game';

interface AuthModalProps {
  brandName: string;
  language: Language;
  initialMode?: 'register' | 'login';
  onAuthenticated: (account: PlayerAccount, isNew: boolean) => void;
  onClose: () => void;
}

const SHIRT_COLORS = ['#ef4444', '#2563eb', '#16a34a', '#9333ea', '#f97316', '#ec4899'];
const HAT_COLORS = ['#facc15', '#fed7aa', '#fbcfe8', '#bae6fd', '#bef264'];

const COPY = {
  en: {
    registerTitle: 'Create Your Farmer Account',
    loginTitle: 'Sign In to Your Farm',
    registerTab: 'Create Account',
    loginTab: 'Sign In',
    username: 'Farmer Username',
    email: 'Email Address',
    password: 'Password (min 6 chars)',
    style: 'Farmer Outfit Style',
    createBtn: 'Create Account & Play',
    loginBtn: 'Sign In & Play',
    guestNote: 'Synced with GreenSAGA Cloud & Multiplayer Valley!',
  },
  fr: {
    registerTitle: 'Créer un Compte Fermier',
    loginTitle: 'Connexion à Votre Ferme',
    registerTab: 'Créer un Compte',
    loginTab: 'Connexion',
    username: 'Nom du Fermier',
    email: 'Adresse Email',
    password: 'Mot de passe (6 car. min)',
    style: 'Style du Fermier',
    createBtn: 'Créer le Compte & Jouer',
    loginBtn: 'Se Connecter',
    guestNote: 'Synchronisé avec GreenSAGA Cloud & la Vallée Multijoueur !',
  },
  ar: {
    registerTitle: 'إنشاء حساب مزارع جديد',
    loginTitle: 'تسجيل الدخول إلى مزرعتك',
    registerTab: 'إنشاء حساب',
    loginTab: 'تسجيل الدخول',
    username: 'اسم المزارع',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور (6 أحرف على الأقل)',
    style: 'لون زي المزارع',
    createBtn: 'إنشاء الحساب واللعب',
    loginBtn: 'دخول واللعب',
    guestNote: 'متصل بسحابة GreenSAGA ووادي اللاعبين المتعدد!',
  },
};

export const AuthModal: React.FC<AuthModalProps> = ({
  brandName,
  language,
  initialMode = 'register',
  onAuthenticated,
  onClose,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shirtColor, setShirtColor] = useState(SHIRT_COLORS[0]);
  const [hatColor, setHatColor] = useState(HAT_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const c = COPY[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (mode === 'register') {
      const res = await registerPlayerAccount({
        username,
        email,
        password,
        shirtColor,
        hatColor,
      });
      setLoading(false);
      if (res.ok && res.account) {
        onAuthenticated(res.account, true);
      } else {
        setError(res.error || 'Could not create account.');
      }
    } else {
      const res = await loginPlayerAccount(email, password);
      setLoading(false);
      if (res.ok && res.account) {
        onAuthenticated(res.account, false);
      } else {
        setError(res.error || 'Login failed.');
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="rpg-panel modal-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserPlus size={20} color="#fde047" />
            <h2 className="font-display" style={{ margin: 0, fontSize: 19 }}>
              {mode === 'register' ? c.registerTitle : c.loginTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#fef3c7', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="tab-bar">
          <button
            type="button"
            className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setError(null);
            }}
          >
            ✨ {c.registerTab}
          </button>
          <button
            type="button"
            className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            🔑 {c.loginTab}
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {mode === 'register' && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 800 }}>
                {c.username}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="rpg-input">
                  <User size={15} color="#78716c" />
                  <input
                    style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontWeight: 700 }}
                    required
                    maxLength={20}
                    placeholder="e.g. AimaneFarmer"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </label>
            )}

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 800 }}>
              {c.email}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="rpg-input">
                <Mail size={15} color="#78716c" />
                <input
                  type="email"
                  style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontWeight: 700 }}
                  required
                  placeholder="farmer@greensaga.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 800 }}>
              {c.password}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="rpg-input">
                <Lock size={15} color="#78716c" />
                <input
                  type="password"
                  style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontWeight: 700 }}
                  required
                  minLength={6}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </label>

            {mode === 'register' && (
              <div style={{ background: '#fff', border: '2px solid #e7e5e4', borderRadius: 12, padding: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#78350f', marginBottom: 6 }}>
                  {c.style}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {SHIRT_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setShirtColor(col)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: col,
                          border: shirtColor === col ? '3px solid #292524' : '2px solid #fff',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {HAT_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setHatColor(col)}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: col,
                          border: hatColor === col ? '3px solid #78350f' : '2px solid #e7e5e4',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1.5px solid #fca5a5',
                  color: '#b91c1c',
                  borderRadius: 10,
                  padding: '8px 10px',
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rpg-btn rpg-btn-primary"
              style={{ marginTop: 4, padding: '11px 16px', fontSize: 15 }}
            >
              <Sparkles size={16} />
              {loading ? '...' : mode === 'register' ? c.createBtn : c.loginBtn}
            </button>

            <div style={{ fontSize: 11.5, color: '#78716c', textAlign: 'center' }}>
              {brandName} · {c.guestNote}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
