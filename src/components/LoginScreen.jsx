import React, { useState } from 'react';
import { Sparkles, User, Mail, Lock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { db } from '../services/db';

export default function LoginScreen({ onLoginSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isNewAccount, setIsNewAccount] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const finalName = name.trim() || 'Sobat Glow';
    const finalEmail = email.trim() || `${finalName.toLowerCase().replace(/\s+/g, '')}@glowsculpt.app`;

    const profile = {
      name: finalName,
      email: finalEmail,
      pin: pin.trim(),
      isGuest: false,
      loginAt: new Date().toISOString()
    };

    localStorage.setItem('glowsculpt_user', JSON.stringify(profile));
    await db.appSettings.put({ key: 'userProfile', value: profile });
    await db.appSettings.put({ key: 'userName', value: finalName });

    onLoginSuccess(profile);
  };

  const handleQuickGuest = async () => {
    const profile = {
      name: 'Sobat Glow',
      email: 'guest@glowsculpt.app',
      pin: '',
      isGuest: true,
      loginAt: new Date().toISOString()
    };

    localStorage.setItem('glowsculpt_user', JSON.stringify(profile));
    await db.appSettings.put({ key: 'userProfile', value: profile });
    await db.appSettings.put({ key: 'userName', value: 'Sobat Glow' });

    onLoginSuccess(profile);
  };

  return (
    <div style={{
      minHeight: '100%',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '24px 20px',
      background: '#faf8ff'
    }}>
      {/* Brand Header with Stitch Logo */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'inline-block', marginBottom: '10px' }}>
          <img
            src="/glowsculpt_logo.png"
            alt="GlowSculpt"
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              objectFit: 'contain',
              boxShadow: '0 10px 25px -4px rgba(16, 185, 129, 0.2)',
              border: '1px solid #e2e8f0',
              background: '#ffffff'
            }}
            onError={(e) => {
              // fallback if image not found
              e.target.style.display = 'none';
            }}
          />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>
          GlowSculpt
        </h1>
        <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0', fontWeight: 500 }}>
          Anti-Aging, Sugar Detox & Sculpting Tracker
        </p>
      </div>

      {/* Login Card */}
      <div style={{
        padding: '24px 22px',
        borderRadius: '24px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.05), 0 4px 12px -2px rgba(15, 23, 42, 0.02)'
      }}>
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {isNewAccount ? 'Buat Profil Tracker' : 'Masuk ke Akun Anda'}
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '3px 0 0' }}>
            Data tersimpan otomatis di penyimpanan lokal perangkat
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Input Nama */}
          <div>
            <label style={{ fontSize: '11.5px', color: '#334155', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Nama Panggilan
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Contoh: Sarah / Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: '13.5px',
                  outline: 'none'
                }}
                required
              />
            </div>
          </div>

          {/* Input Email / Akun */}
          <div>
            <label style={{ fontSize: '11.5px', color: '#334155', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Email / Akun
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: '13.5px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Input PIN (opsional) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '11.5px', color: '#334155', fontWeight: 600 }}>
                PIN Keamanan (Opsional)
              </label>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Bebas / Kosongkan</span>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                maxLength={6}
                placeholder="Misal: 1234"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: '13.5px',
                  letterSpacing: '0.15em',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Tombol Masuk */}
          <button
            type="submit"
            style={{
              padding: '12px',
              fontSize: '13.5px',
              fontWeight: 700,
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderRadius: '9999px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.32)'
            }}
          >
            <span>Masuk & Mulai Detoks</span>
            <ArrowRight size={15} />
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          margin: '16px 0'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>atau</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* Tombol Tamu 1-Klik */}
        <button
          type="button"
          onClick={handleQuickGuest}
          style={{
            width: '100%',
            padding: '11px',
            fontSize: '12.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            borderRadius: '9999px',
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
            color: '#1e293b',
            cursor: 'pointer'
          }}
        >
          <Zap size={14} color="#f59e0b" />
          <span>Masuk Cepat sebagai Tamu (1-Klik)</span>
        </button>
      </div>

      {/* Footer Info */}
      <div style={{ textAlign: 'center', marginTop: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
        <ShieldCheck size={14} color="#10b981" />
        <span style={{ fontSize: '11.5px', color: '#64748b' }}>
          Tersimpan aman & lokal di perangkat Anda
        </span>
      </div>
    </div>
  );
}
