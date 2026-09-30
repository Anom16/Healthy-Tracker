import React from 'react';

export default function Navbar({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'dashboard', label: 'Beranda', icon: 'spa' },
    { id: 'camera', label: 'Jurnal', icon: 'auto_stories' },
    { id: 'insights', label: 'Wawasan', icon: 'ssid_chart' },
    { id: 'ai', label: 'AI Coach', icon: 'hotel_class' },
    { id: 'habits', label: 'Pengaturan', icon: 'tune' },
  ];

  return (
    <nav style={{
      position: 'sticky',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--dock-bg)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid var(--hairline-border)',
      padding: '8px 12px calc(env(safe-area-inset-bottom, 0px) + 10px)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 99,
      boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.35)',
      userSelect: 'none'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto'
      }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                padding: '4px 10px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                minWidth: '56px',
                minHeight: '44px'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '28px',
                borderRadius: '9999px',
                background: isActive ? 'var(--secondary-container)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                transition: 'all 0.25s ease'
              }}>
                <span 
                  className="material-symbols-outlined" 
                  style={{ 
                    fontSize: '22px',
                    fontVariationSettings: isActive ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400"
                  }}
                >
                  {tab.icon}
                </span>
              </div>
              
              <span style={{
                fontSize: '11px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                letterSpacing: '0.02em',
                transition: 'color 0.2s ease'
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
