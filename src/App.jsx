import React, { useState, useEffect } from 'react';
import MobileFrameWrapper from './components/MobileFrameWrapper';
import Navbar from './components/Navbar';
import DashboardTab from './components/DashboardTab';
import FaceCameraTab from './components/FaceCameraTab';
import InsightsTab from './components/InsightsTab';
import GlowAiTab from './components/GlowAiTab';
import HabitsConfigTab from './components/HabitsConfigTab';
import LoginScreen from './components/LoginScreen';
import CravingSosModal from './components/CravingSosModal';
import GuaShaGuideModal from './components/GuaShaGuideModal';
import { initDbDefaults, db } from './services/db';

const TAB_TITLES = {
  dashboard: 'Beranda',
  camera: 'Jurnal Wajah',
  insights: 'Korelasi & Pola',
  ai: 'Glow AI Coach',
  habits: 'Pengaturan'
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Sanctuary Error caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '32px 24px',
          margin: '24px 16px',
          borderRadius: '24px',
          background: 'var(--surface-container)',
          border: '1px solid var(--hairline-border)',
          color: 'var(--on-surface)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '14px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '42px', color: 'var(--primary-accent)' }}>
            spa
          </span>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Sanctuary Refresh</h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Data Anda tetap aman di perangkat. Terjadi penyesuaian tampilan yang memerlukan sinkronisasi ulang.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="btn-sanctuary-primary"
            style={{ marginTop: '6px' }}
          >
            Muat Ulang Tampilan
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isGuaShaOpen, setIsGuaShaOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('glow_theme') || 'dark');

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('glow_theme', theme);
  }, [theme]);

  // Simple local user session
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('glowsculpt_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    initDbDefaults();
    // Auto-restore profile from database if available
    if (!currentUser) {
      db.appSettings.get('userProfile').then(item => {
        if (item && item.value) {
          setCurrentUser(item.value);
          localStorage.setItem('glowsculpt_user', JSON.stringify(item.value));
        }
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('glowsculpt_user');
    setCurrentUser(null);
  };

  return (
    <MobileFrameWrapper isLogin={!currentUser} theme={theme} onToggleTheme={toggleTheme}>
      {!currentUser ? (
        <LoginScreen onLoginSuccess={setCurrentUser} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
          
          {/* STITCH SANCTUARY TOP HEADER */}
          <header style={{
            position: 'sticky',
            top: 0,
            width: '100%',
            zIndex: 90,
            background: 'var(--header-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--hairline-border)',
            height: '60px',
            padding: '0 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
                src="/glowsculpt_logo.svg" 
                alt="GlowSculpt Vitality" 
                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span className="font-label-caps" style={{ color: 'var(--primary-accent)', fontSize: '10px', letterSpacing: '0.12em' }}>
                  GLOWSCULPT
                </span>
                <span className="font-title-md" style={{ color: 'var(--on-surface)', fontSize: '16px', fontWeight: 600 }}>
                  {TAB_TITLES[activeTab] || 'Home'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Direct Light/Dark Mode Switcher */}
              <button 
                onClick={toggleTheme}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--surface-container)',
                  border: '1px solid var(--hairline-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--on-surface-variant)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary-accent)' }}>
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>

              <button 
                onClick={() => setActiveTab('habits')}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--surface-container)',
                  border: '1px solid var(--hairline-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--on-surface-variant)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title="Pengaturan"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span>
              </button>
              
              <div 
                onClick={() => setActiveTab('habits')}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--primary-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--on-primary)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(134, 167, 137, 0.25)'
                }}
                title={currentUser?.name || 'Sanctuary Profile'}
              >
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : (
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
                )}
              </div>
            </div>
          </header>

          {/* Dynamic Tab Views */}
          <ErrorBoundary>
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {activeTab === 'dashboard' && (
                <DashboardTab
                  currentUser={currentUser}
                  onOpenSos={() => setIsSosOpen(true)}
                  onOpenGuaSha={() => setIsGuaShaOpen(true)}
                  onLogout={handleLogout}
                  onNavigateToTab={setActiveTab}
                />
              )}
              {activeTab === 'camera' && <FaceCameraTab />}
              {activeTab === 'insights' && <InsightsTab />}
              {activeTab === 'ai' && <GlowAiTab />}
              {activeTab === 'habits' && (
                <HabitsConfigTab
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  theme={theme}
                  setTheme={setTheme}
                />
              )}
            </main>
          </ErrorBoundary>

          {/* Floating Bottom Navigation */}
          <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Modals */}
          <CravingSosModal
            isOpen={isSosOpen}
            onClose={() => setIsSosOpen(false)}
          />
          <GuaShaGuideModal
            isOpen={isGuaShaOpen}
            onClose={() => setIsGuaShaOpen(false)}
          />
        </div>
      )}
    </MobileFrameWrapper>
  );
}
