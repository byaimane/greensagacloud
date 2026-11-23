import React, { useState } from 'react';
import { ArrowLeft, Lock, Mail, Shield } from 'lucide-react';
import { verifyAdminCredentials } from '../engine/appSyncClient';

interface AdminLoginProps {
  brandName: string;
  onSuccess: () => void;
  onBack: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ brandName, onSuccess, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminCredentials(email, password)) {
      setError(null);
      onSuccess();
    } else {
      setError('Invalid administrator email or password.');
    }
  };

  return (
    <div className="admin-login-screen">
      <div className="admin-login-card">
        <div className="admin-login-badge">
          <Shield size={26} color="#fde047" />
        </div>

        <h1 className="font-display" style={{ margin: '10px 0 4px', fontSize: 26, color: '#ffffff' }}>
          {brandName} Admin Portal
        </h1>
        <p style={{ margin: '0 0 22px', fontSize: 13, color: '#94a3b8' }}>
          Restricted Console · Android Package <code style={{ color: '#fde047' }}>com.ouagx.myapp</code>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'start' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 700, color: '#cbd5e1' }}>
            Admin Email
            <div className="admin-login-input-wrap">
              <Mail size={15} color="#94a3b8" />
              <input
                type="email"
                required
                autoFocus
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 700, color: '#cbd5e1' }}>
            Password
            <div className="admin-login-input-wrap">
              <Lock size={15} color="#94a3b8" />
              <input
                type="password"
                required
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </label>

          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.16)',
                border: '1px solid rgba(248, 113, 113, 0.5)',
                color: '#fecaca',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 12.5,
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          )}

          <button type="submit" className="rpg-btn rpg-btn-primary" style={{ marginTop: 6, padding: '11px 16px', fontSize: 15 }}>
            Sign In to Admin Control Center
          </button>
        </form>

        <button
          onClick={onBack}
          style={{
            marginTop: 18,
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ArrowLeft size={14} /> Return to {brandName}
        </button>
      </div>
    </div>
  );
};
