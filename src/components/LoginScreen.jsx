import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { db } from '../services/db';

const SAVED_CREDS_KEY = 'healthy_tracker_saved_creds';

export default function LoginScreen({ onLoginSuccess }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [hasSavedAccount, setHasSavedAccount] = useState(false);

  // Load saved credentials on mount for instant 1-click login
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_CREDS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) {
          setName(parsed.name);
          setPassword(parsed.password || '');
          setHasSavedAccount(true);
        }
      }
    } catch (e) {
      console.warn('Failed to load saved credentials', e);
    }
  }, []);

  const handleLogin = async (e) => {
    e?.preventDefault?.();
    const finalName = name.trim() || 'Pengguna';
    const finalEmail = `${finalName.toLowerCase().replace(/\s+/g, '')}@healthytracker.app`;

    const profile = {
      name: finalName,
      email: finalEmail,
      isGuest: false,
      loginAt: new Date().toISOString()
    };

    // Save or clear credentials
    if (rememberMe) {
      localStorage.setItem(SAVED_CREDS_KEY, JSON.stringify({
        name: finalName,
        password: password
      }));
    } else {
      localStorage.removeItem(SAVED_CREDS_KEY);
    }

    localStorage.setItem('glowsculpt_user', JSON.stringify(profile));
    await db.appSettings.put({ key: 'userProfile', value: profile });
    await db.appSettings.put({ key: 'userName', value: finalName });

    onLoginSuccess(profile);
  };

  const handleQuickGuest = async () => {
    const profile = {
      name: 'Tamu',
      email: 'guest@healthytracker.app',
      isGuest: true,
      loginAt: new Date().toISOString()
    };

    localStorage.setItem('glowsculpt_user', JSON.stringify(profile));
    await db.appSettings.put({ key: 'userProfile', value: profile });
    await db.appSettings.put({ key: 'userName', value: 'Tamu' });

    onLoginSuccess(profile);
  };

  return (
    <div style={{
      minHeight: '100vh',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '32px 20px',
      background: 'var(--bg-surface)',
      color: 'var(--on-surface)'
    }}>
      {/* Brand Header with Transparent Emblem Logo */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ display: 'inline-block', marginBottom: '12px' }}>
          <img
            src="/glowsculpt_logo.svg"
            alt="Healthy Tracker"
            style={{
              width: '76px',
              height: '76px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 8px 18px rgba(134, 167, 137, 0.35))'
            }}
            onError={(e) => {
              e.target.src = '/glowsculpt_logo.png';
            }}
          />
        </div>
        <h1 style={{
          fontSize: '26px',
          fontWeight: 800,
          color: 'var(--on-surface)',
          margin: 0,
          letterSpacing: '-0.02em',
          fontFamily: 'var(--font-heading)'
        }}>
          Healthy Tracker
        </h1>
        <p style={{
          fontSize: '13px',
          color: 'var(--text-muted)',
          margin: '4px 0 0',
          fontWeight: 500
        }}>
          Jurnal & Pelacak Gaya Hidup Sehat
        </p>
      </div>

      {/* Login Card */}
      <div style={{
        padding: '24px 22px',
        borderRadius: '24px',
        background: 'var(--surface-container)',
        border: '1px solid var(--hairline-border)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18)'
      }}>
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
            {hasSavedAccount ? 'Selamat Datang Kembali' : 'Masuk ke Akun'}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
            Data tersimpan aman di perangkat Anda
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Input Nama Pengguna */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--on-surface)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Nama Pengguna
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Masukkan nama Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  borderRadius: '12px',
                  background: 'var(--surface-container-high)',
                  border: '1px solid var(--hairline-border)',
                  color: 'var(--on-surface)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
          </div>

          {/* Input Kata Sandi */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--on-surface)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Kata Sandi
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 40px',
                  borderRadius: '12px',
                  background: 'var(--surface-container-high)',
                  border: '1px solid var(--hairline-border)',
                  color: 'var(--on-surface)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
                title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Checkbox Simpan Sandi */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 2px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12.5px',
              color: 'var(--on-surface)',
              cursor: 'pointer',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: 'var(--primary-accent)',
                  cursor: 'pointer'
                }}
              />
              <span>Simpan sandi (bisa langsung masuk)</span>
            </label>
          </div>

          {/* Tombol Masuk */}
          <button
            type="submit"
            style={{
              padding: '12px',
              fontSize: '14px',
              fontWeight: 700,
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: '9999px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--primary-accent) 0%, #3f5844 100%)',
              color: '#0e0f10',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(134, 167, 137, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            <span>{hasSavedAccount ? 'Masuk Langsung' : 'Masuk'}</span>
            <ArrowRight size={16} color="#0e0f10" />
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          margin: '16px 0'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--hairline-border)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>atau</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--hairline-border)' }} />
        </div>

        {/* Tombol Tamu 1-Klik */}
        <button
          type="button"
          onClick={handleQuickGuest}
          style={{
            width: '100%',
            padding: '11px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            borderRadius: '9999px',
            border: '1px solid var(--hairline-border)',
            background: 'var(--surface-container-high)',
            color: 'var(--on-surface)',
            cursor: 'pointer'
          }}
        >
          <Zap size={14} color="#f59e0b" />
          <span>Masuk Cepat sebagai Tamu (1-Klik)</span>
        </button>
      </div>

      {/* Footer Info */}
      <div style={{ textAlign: 'center', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
        <ShieldCheck size={14} color="var(--primary-accent)" />
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Penyimpanan lokal aman & privasi terlindungi
        </span>
      </div>
    </div>
  );
}
