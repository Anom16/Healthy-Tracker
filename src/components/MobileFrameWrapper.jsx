import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function MobileFrameWrapper({ children, isLogin = false, theme: propTheme, onToggleTheme }) {
  const [localTheme, setLocalTheme] = useState(() => localStorage.getItem('glow_theme') || 'dark');

  const theme = propTheme !== undefined ? propTheme : localTheme;

  // Sync theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('glow_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      setLocalTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      background: 'var(--bg-surface)',
      color: 'var(--on-surface)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Floating Theme Switcher (Clean & Minimalist) */}
      <div style={{
        position: 'fixed',
        top: '12px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        background: theme === 'dark' ? 'rgba(23, 25, 26, 0.85)' : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--hairline-border)',
        padding: '6px',
        borderRadius: '999px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
      }}>
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
            border: 'none',
            color: theme === 'dark' ? '#adcfaf' : '#1b1c1d',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          title={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Main Full-Width Application Viewport */}
      <main style={{
        width: '100%',
        maxWidth: isLogin ? '480px' : '720px',
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: 'transparent',
        boxSizing: 'border-box'
      }}>
        {children}
      </main>
    </div>
  );
}
