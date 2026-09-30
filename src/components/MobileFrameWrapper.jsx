import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Wifi, Battery, Sun, Moon } from 'lucide-react';

export default function MobileFrameWrapper({ children, isLogin = false, theme: propTheme, onToggleTheme }) {
  const [isSimulatorMode, setIsSimulatorMode] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [localTheme, setLocalTheme] = useState(() => localStorage.getItem('glow_theme') || 'dark');

  const theme = propTheme !== undefined ? propTheme : localTheme;

  // Sync theme
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

  // Clock for the status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: 'var(--bg-surface)' }}>
      {/* Top Floating Control Bar */}
      <div style={{
        position: 'fixed',
        top: '12px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: theme === 'dark' ? 'rgba(23, 25, 26, 0.88)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--hairline-border)',
        padding: '5px 12px',
        borderRadius: '999px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Dark/Light Mode Toggle Icon */}
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
            border: 'none',
            color: theme === 'dark' ? '#adcfaf' : '#1b1c1d',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Sanctuary Theme'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div style={{ width: '1px', height: '16px', background: 'var(--hairline-border)' }} />

        <button
          onClick={() => setIsSimulatorMode(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: isSimulatorMode ? 'var(--primary-accent)' : 'transparent',
            color: isSimulatorMode ? '#0e0f10' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '999px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          title="Mode HP"
        >
          <Smartphone size={13} /> Mobile
        </button>
        <button
          onClick={() => setIsSimulatorMode(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: !isSimulatorMode ? 'var(--primary-accent)' : 'transparent',
            color: !isSimulatorMode ? '#0e0f10' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '999px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          title="Mode Layar Penuh"
        >
          <Monitor size={13} /> Full
        </button>
      </div>

      {/* Main Container */}
      <div className={isSimulatorMode ? 'simulator-desktop-backdrop' : ''}>
        <div className={isSimulatorMode ? 'phone-mockup' : ''} style={{
          width: isSimulatorMode ? undefined : '100%',
          maxWidth: isSimulatorMode ? undefined : '540px',
          margin: isSimulatorMode ? undefined : '0 auto',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          background: isLogin ? '#ffffff' : 'var(--bg-primary)'
        }}>
          {/* Dynamic Island / Notch in Simulator */}
          {isSimulatorMode && (
            <div className="phone-notch">
              <div className="phone-camera-lens"></div>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary-accent)' }}></div>
            </div>
          )}

          {/* Status Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: isSimulatorMode ? '14px 22px 6px' : '12px 18px 6px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--on-surface)',
            zIndex: 90,
            userSelect: 'none'
          }}>
            <span>{currentTime || '09:41'}</span>

            {/* Quick theme toggle in status bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={toggleTheme}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme === 'dark' ? '#adcfaf' : '#1b1c1d',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px'
                }}
                title="Toggle Dark/Light Mode"
              >
                {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
              </button>

              <span style={{ fontSize: '10px', color: 'var(--primary-accent)', fontWeight: 700, letterSpacing: '0.05em' }}>5G</span>
              <Wifi size={13} color="var(--text-muted)" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>100%</span>
                <Battery size={14} color="var(--primary-accent)" />
              </div>
            </div>
          </div>

          {/* App Body Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'relative' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
