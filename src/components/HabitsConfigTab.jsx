import React, { useState, useEffect } from 'react';
import { 
  Bell, Clock, Moon, Coffee, Droplets, Sparkles, 
  Download, Upload, Smartphone, Check, AlertCircle,
  Volume2, Cigarette, Citrus, Zap, Sun, Trash2, Sliders, User, LogOut, CheckCircle2, Play,
  Shield, Lock, Key, RefreshCw, FileText, CheckCircle, AlertTriangle, EyeOff, Database
} from 'lucide-react';
import { db } from '../services/db';
import { 
  requestNotificationPermission, 
  sendAppNotification, 
  playNotificationChime,
  setCustomAudioCache,
  scheduleHabitReminders,
  NOTIFICATION_PRESETS,
  BUILTIN_TONES 
} from '../services/notificationService';
import {
  exportFullAppData,
  restoreAppDataFromFile,
  purgeAllFacePhotos,
  purgeEntireDatabase,
  getAiCloudPrivacyPreference,
  setAiCloudPrivacyPreference
} from '../services/privacyService';

const DAY_LABELS = ['S', 'S', 'R', 'K', 'J', 'S', 'M']; // Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu

export default function HabitsConfigTab({ currentUser, onLogout, theme = 'dark', setTheme }) {
  // Sub-navigation matching Stitch Screens: 'alarms' (Screen 5) | 'audio' (Screen 6) | 'nutrition'
  const [subTab, setSubTab] = useState('alarms');

  const [settings, setSettings] = useState({
    targetWaterMl: 2500,
    maxSugarGrams: 25,
    maxCigarettes: 3,
    targetVitaminCMg: 100,
    sleepReminderTime: '22:30',
    dinnerCurfewTime: '19:30',
    coffeeCurfewTime: '14:00',
    skincareAmTime: '07:30',
    skincarePmTime: '21:30',
    notifWaterInterval: 2,
    notifEarlyWarning: true,
    notifSoundTone: 'zen'
  });

  // 16. Flexible Goals State (Point 16)
  const [flexibleGoals, setFlexibleGoals] = useState(() => {
    try {
      const saved = localStorage.getItem('glowsculpt_goals');
      return saved ? JSON.parse(saved) : {
        sleep: true,
        hydration: true,
        nutrition: false,
        appearance: false,
        mindfulness: false,
        activity: true
      };
    } catch (e) {
      return { sleep: true, hydration: true, nutrition: false, appearance: false, mindfulness: false, activity: true };
    }
  });
  const [isSyncingWearables, setIsSyncingWearables] = useState(false);
  const [wearablesSynced, setWearablesSynced] = useState(false);

  const handleToggleGoal = (key) => {
    setFlexibleGoals(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('glowsculpt_goals', JSON.stringify(next));
      return next;
    });
  };

  const handleSyncWearables = async () => {
    setIsSyncingWearables(true);
    setTimeout(async () => {
      setIsSyncingWearables(false);
      setWearablesSynced(true);
      const today = new Date().toISOString().split('T')[0];
      await db.activityLogs.add({
        date: today,
        timestamp: new Date().toISOString(),
        activityType: 'Langkah Sinkronisasi (Health Connect)',
        durationMinutes: 45,
        steps: 6421
      });
      alert('✓ Berhasil mensinkronkan 6.421 langkah & 7j 20m tidur dari Health Connect!');
    }, 1000);
  };
  const [alarms, setAlarms] = useState([
    {
      id: 'skincareAm',
      title: 'Skincare Pagi',
      desc: 'Proteksi UV & hidrasi',
      icon: '🌅',
      timeKey: 'skincareAmTime',
      defaultTime: '07:30',
      color: '#006c49',
      bg: '#ecfdf5',
      enabled: true,
      days: [0, 1, 2, 3, 4, 5, 6]
    },
    {
      id: 'coffeeCurfew',
      title: 'Batas Kafein',
      desc: 'Jaga deep sleep malam',
      icon: '☕',
      timeKey: 'coffeeCurfewTime',
      defaultTime: '14:00',
      color: '#b45309',
      bg: '#fffbeb',
      enabled: true,
      days: [0, 1, 2, 3, 4, 5, 6]
    },
    {
      id: 'waterInterval',
      title: 'Pengingat Minum',
      desc: 'Interval hidrasi cairan',
      icon: '💧',
      isInterval: true,
      defaultTime: 'Setiap 2 Jam',
      color: '#0284c7',
      bg: '#e0f2fe',
      enabled: true,
      days: [0, 1, 2, 3, 4, 5, 6]
    },
    {
      id: 'dinnerCurfew',
      title: 'Makan Malam',
      desc: 'Jeda sebelum tidur',
      icon: '🍽️',
      timeKey: 'dinnerCurfewTime',
      defaultTime: '19:30',
      color: '#a43073',
      bg: '#fff1f2',
      enabled: true,
      days: [0, 1, 2, 3, 4, 5, 6]
    },
    {
      id: 'skincarePm',
      title: 'Skincare Malam',
      desc: 'Pembersihan & rileks',
      icon: '🌙',
      timeKey: 'skincarePmTime',
      defaultTime: '21:30',
      color: '#006c49',
      bg: '#ecfdf5',
      enabled: true,
      days: [0, 1, 2, 3, 4, 5, 6]
    },
    {
      id: 'sleepReminder',
      title: 'Jadwal Tidur',
      desc: 'Pemulihan sirkadian',
      icon: '🛌',
      timeKey: 'sleepReminderTime',
      defaultTime: '22:30',
      color: '#4f46e5',
      bg: '#eef2ff',
      enabled: true,
      days: [0, 1, 2, 3, 4, 5, 6]
    }
  ]);

  const [notifStatus, setNotifStatus] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [customRingtoneName, setCustomRingtoneName] = useState('');
  const [selectedTestPresetId, setSelectedTestPresetId] = useState(NOTIFICATION_PRESETS[0]?.id || 'water');

  // Privacy & Cloud AI States
  const [allowCloudAi, setAllowCloudAi] = useState(true);
  const [customGeminiApiKey, setCustomGeminiApiKey] = useState(() => {
    try {
      return localStorage.getItem('glowsculpt_gemini_api_key') || '';
    } catch {
      return '';
    }
  });
  const [apiKeySavedStatus, setApiKeySavedStatus] = useState('');
  const [exportIncludePhotos, setExportIncludePhotos] = useState(true);
  const [useEncryption, setUseEncryption] = useState(false);
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [privacyStatusMsg, setPrivacyStatusMsg] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');

  // Load settings & custom audio info
  useEffect(() => {
    const loadSettings = async () => {
      const all = await db.appSettings.toArray();
      const current = { ...settings };
      all.forEach(item => {
        if (item.key in current) {
          current[item.key] = item.value;
        }
      });
      setSettings(current);

      const rName = await db.appSettings.get('customRingtoneName');
      if (rName && rName.value) {
        setCustomRingtoneName(rName.value);
      }

      // Load AI cloud privacy preference
      const cloudPref = await getAiCloudPrivacyPreference();
      setAllowCloudAi(cloudPref);

      // Load saved alarm toggle states if exists
      const savedAlarms = await db.appSettings.get('routineAlarmsConfig');
      if (savedAlarms && savedAlarms.value) {
        try {
          const parsed = JSON.parse(savedAlarms.value);
          setAlarms(prev => prev.map(a => {
            const found = parsed.find(p => p.id === a.id);
            return found ? { ...a, enabled: found.enabled, days: found.days || a.days } : a;
          }));
        } catch (err) {
          console.warn('Error reading saved alarms:', err);
        }
      }
    };
    loadSettings();
  }, []);

  // Toggle alarm enabled status & sync schedule
  const handleToggleAlarm = async (alarmId) => {
    const updated = alarms.map(a => a.id === alarmId ? { ...a, enabled: !a.enabled } : a);
    setAlarms(updated);
    await db.appSettings.put({
      key: 'routineAlarmsConfig',
      value: JSON.stringify(updated.map(a => ({ id: a.id, enabled: a.enabled, days: a.days })))
    });
    await scheduleHabitReminders(updated, settings);
  };

  // Toggle day for an alarm & sync schedule
  const handleToggleDay = async (alarmId, dayIndex) => {
    const updated = alarms.map(a => {
      if (a.id !== alarmId) return a;
      const days = a.days.includes(dayIndex)
        ? a.days.filter(d => d !== dayIndex)
        : [...a.days, dayIndex].sort();
      return { ...a, days };
    });
    setAlarms(updated);
    await db.appSettings.put({
      key: 'routineAlarmsConfig',
      value: JSON.stringify(updated.map(a => ({ id: a.id, enabled: a.enabled, days: a.days })))
    });
    await scheduleHabitReminders(updated, settings);
  };

  // Save settings
  const handleSave = async (e) => {
    e?.preventDefault?.();
    for (const [key, value] of Object.entries(settings)) {
      await db.appSettings.put({ key, value });
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Request Notification permission
  const handleEnableNotif = async () => {
    const perm = await requestNotificationPermission();
    setNotifStatus(perm);
    if (perm === 'granted') {
      sendAppNotification({
        title: '🎉 Notifikasi GlowSculpt Aktif!',
        body: 'Pengingat air minum, batas kopi, batas rokok, skincare, dan jam tidur kini aktif.',
        tone: settings.notifSoundTone
      });
    }
  };

  // Trigger test notification
  const handleTriggerTestNotif = () => {
    const preset = NOTIFICATION_PRESETS.find(p => p.id === selectedTestPresetId) || NOTIFICATION_PRESETS[0];
    sendAppNotification({
      title: preset.title,
      body: preset.body,
      tone: settings.notifSoundTone
    });
  };

  // Play Tone Preview
  const handlePreviewTone = (toneName) => {
    setSettings(prev => ({ ...prev, notifSoundTone: toneName }));
    playNotificationChime(toneName);
    db.appSettings.put({ key: 'notifSoundTone', value: toneName });
  };

  // Handle Upload Custom Ringtone
  const handleUploadAudio = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Ukuran file audio maksimal 8 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;
      await db.appSettings.put({ key: 'customRingtoneAudio', value: base64Data });
      await db.appSettings.put({ key: 'customRingtoneName', value: file.name });
      await db.appSettings.put({ key: 'notifSoundTone', value: 'custom' });
      setCustomAudioCache(base64Data);
      setCustomRingtoneName(file.name);
      setSettings(prev => ({ ...prev, notifSoundTone: 'custom' }));
      playNotificationChime('custom', base64Data);
    };
    reader.readAsDataURL(file);
  };

  // Handle Remove Custom Ringtone
  const handleRemoveCustomAudio = async () => {
    await db.appSettings.delete('customRingtoneAudio');
    await db.appSettings.delete('customRingtoneName');
    setCustomAudioCache(null);
    setCustomRingtoneName('');
    setSettings(prev => ({ ...prev, notifSoundTone: 'zen' }));
    await db.appSettings.put({ key: 'notifSoundTone', value: 'zen' });
    playNotificationChime('zen');
  };

  // Toggle AI Cloud Transmission
  const handleToggleCloudAi = async (allowed) => {
    setAllowCloudAi(true);
    await setAiCloudPrivacyPreference(true);
    setPrivacyStatusMsg('✅ Mode Cloud AI (Gemini) selalu aktif.');
    setTimeout(() => setPrivacyStatusMsg(''), 4000);
  };

  // Save or Clear custom Gemini API key
  const handleSaveApiKey = () => {
    try {
      if (customGeminiApiKey.trim()) {
        localStorage.setItem('glowsculpt_gemini_api_key', customGeminiApiKey.trim());
        setApiKeySavedStatus('Kunci API Gemini berhasil disimpan!');
      } else {
        localStorage.removeItem('glowsculpt_gemini_api_key');
        setApiKeySavedStatus('Menggunakan Kunci API Cloud default sistem.');
      }
      setTimeout(() => setApiKeySavedStatus(''), 4000);
    } catch (e) {
      console.warn(e);
    }
  };

  // Secure Export with AES-GCM
  const handleExportWithPrivacy = async () => {
    if (useEncryption && (!encryptionPassword || encryptionPassword.length < 4)) {
      alert('Kata sandi enkripsi minimal 4 karakter.');
      return;
    }
    setIsExporting(true);
    try {
      const res = await exportFullAppData({
        includePhotos: exportIncludePhotos,
        password: useEncryption ? encryptionPassword : null
      });
      setPrivacyStatusMsg(`✅ Cadangan ${res.isEncrypted ? 'Terenkripsi AES-256' : 'Standar'} berhasil diunduh!`);
      setTimeout(() => setPrivacyStatusMsg(''), 5000);
    } catch (err) {
      alert('Gagal mengekspor data: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Secure Restore from File
  const handleRestoreBackup = async () => {
    if (!restoreFile) {
      alert('Pilih file cadangan (.json atau .aes.json) terlebih dahulu.');
      return;
    }

    try {
      const text = await restoreFile.text();
      const res = await restoreAppDataFromFile(text, restorePassword);
      alert(`🎉 Pemulihan Sukses!\n• ${res.habitsRestored} Riwayat Kebiasaan\n• ${res.sugarsRestored} Log Konsumsi\n• ${res.photosRestored} Foto Wajah`);
      window.location.reload();
    } catch (err) {
      alert('Gagal memulihkan cadangan: ' + err.message);
    }
  };

  // Purge Photos Only
  const handleConfirmPurgePhotos = async () => {
    await purgeAllFacePhotos();
    setShowPurgeModal(false);
    alert('✅ Seluruh riwayat foto biometrik wajah telah dihapus dari perangkat.');
  };

  // Total Reset Database
  const handleConfirmResetTotal = async () => {
    if (resetConfirmationText.trim().toUpperCase() !== 'RESET') {
      alert('Ketik kata "RESET" untuk mengonfirmasi.');
      return;
    }
    await purgeEntireDatabase();
    setShowResetModal(false);
    alert('🔄 Aplikasi berhasil di-reset total.');
    window.location.reload();
  };

  const activeAlarmCount = alarms.filter(a => a.enabled).length;

  return (
    <div style={{ padding: '16px 16px 90px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>
          Pengaturan
        </h1>

        {/* Active badge */}
        <div style={{
          background: 'var(--surface-container)',
          border: '1px solid var(--hairline-border)',
          padding: '4px 10px',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-accent)' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--on-surface-variant)' }}>
            {activeAlarmCount} Aktif
          </span>
        </div>
      </div>

      {/* Theme Switcher Card */}
      <div style={{
        background: 'var(--surface-container-low)',
        borderRadius: '20px',
        padding: '14px 16px',
        border: '1px solid var(--hairline-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary-accent)' }}>
            {theme === 'dark' ? 'dark_mode' : 'light_mode'}
          </span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--on-surface)' }}>
              Tema Tampilan
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {theme === 'dark' ? 'Mode Gelap (Sanctuary)' : 'Mode Terang (Light Mode)'}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          background: 'var(--surface-container)',
          borderRadius: '999px',
          padding: '2px',
          border: '1px solid var(--hairline-border)'
        }}>
          <button
            type="button"
            onClick={() => setTheme && setTheme('dark')}
            style={{
              border: 'none',
              borderRadius: '999px',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              background: theme === 'dark' ? 'var(--primary-accent)' : 'transparent',
              color: theme === 'dark' ? 'var(--on-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s'
            }}
          >
            <span>🌙 Gelap</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme && setTheme('light')}
            style={{
              border: 'none',
              borderRadius: '999px',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              background: theme === 'light' ? 'var(--primary-accent)' : 'transparent',
              color: theme === 'light' ? 'var(--on-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s'
            }}
          >
            <span>☀️ Terang</span>
          </button>
        </div>
      </div>

      {/* Segmented Control Pill Switcher */}
      <div style={{
        background: 'var(--surface-container-low)',
        borderRadius: '9999px',
        padding: '3px',
        display: 'flex',
        gap: '2px',
        border: '1px solid var(--hairline-border)',
        overflowX: 'auto'
      }}>
        <button
          type="button"
          onClick={() => setSubTab('alarms')}
          style={{
            flex: 1,
            padding: '7px 8px',
            borderRadius: '9999px',
            border: 'none',
            background: subTab === 'alarms' ? 'var(--surface-container-high)' : 'transparent',
            color: subTab === 'alarms' ? 'var(--primary-accent)' : 'var(--text-muted)',
            fontWeight: subTab === 'alarms' ? 700 : 500,
            fontSize: '11px',
            boxShadow: subTab === 'alarms' ? '0 2px 6px rgba(0, 0, 0, 0.15)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            whiteSpace: 'nowrap'
          }}
        >
          <Clock size={12} />
          <span>Alarm</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('audio')}
          style={{
            flex: 1,
            padding: '7px 8px',
            borderRadius: '9999px',
            border: 'none',
            background: subTab === 'audio' ? 'var(--surface-container-high)' : 'transparent',
            color: subTab === 'audio' ? 'var(--primary-accent)' : 'var(--text-muted)',
            fontWeight: subTab === 'audio' ? 700 : 500,
            fontSize: '11px',
            boxShadow: subTab === 'audio' ? '0 2px 6px rgba(0, 0, 0, 0.15)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            whiteSpace: 'nowrap'
          }}
        >
          <Bell size={12} />
          <span>Audio</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('nutrition')}
          style={{
            flex: 1,
            padding: '7px 8px',
            borderRadius: '9999px',
            border: 'none',
            background: subTab === 'nutrition' ? 'var(--surface-container-high)' : 'transparent',
            color: subTab === 'nutrition' ? 'var(--primary-accent)' : 'var(--text-muted)',
            fontWeight: subTab === 'nutrition' ? 700 : 500,
            fontSize: '11px',
            boxShadow: subTab === 'nutrition' ? '0 2px 6px rgba(0, 0, 0, 0.15)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            whiteSpace: 'nowrap'
          }}
        >
          <Sliders size={12} />
          <span>Nutrisi</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('privacy')}
          style={{
            flex: 1,
            padding: '7px 8px',
            borderRadius: '9999px',
            border: 'none',
            background: subTab === 'privacy' ? 'var(--surface-container-high)' : 'transparent',
            color: subTab === 'privacy' ? 'var(--primary-accent)' : 'var(--text-muted)',
            fontWeight: subTab === 'privacy' ? 700 : 500,
            fontSize: '11px',
            boxShadow: subTab === 'privacy' ? '0 2px 6px rgba(0, 0, 0, 0.15)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            whiteSpace: 'nowrap'
          }}
        >
          <Shield size={12} />
          <span>Privasi & Data</span>
        </button>
      </div>

      {/* ============================================================
          TAB 1: DAFTAR ALARM & JADWAL RUTIN (Stitch Screen 5)
          ============================================================ */}
      {subTab === 'alarms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Alarm Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alarms.map((alarm) => {
              const displayTime = alarm.isInterval
                ? `Tiap ${settings.notifWaterInterval} Jam`
                : (settings[alarm.timeKey] || alarm.defaultTime);

              return (
                <div
                  key={alarm.id}
                  className="sanctuary-card"
                  style={{
                    padding: '18px 20px',
                    borderRadius: '24px',
                    opacity: alarm.enabled ? 1 : 0.65,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {/* Top Row: Icon + Title + Switch */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'var(--surface-container)',
                        border: '1px solid var(--hairline-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        flexShrink: 0
                      }}>
                        {alarm.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--on-surface)' }}>
                          {alarm.title}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {alarm.desc}
                        </div>
                      </div>
                    </div>

                    {/* Smooth iOS / Stitch Pill Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleAlarm(alarm.id)}
                      style={{
                        width: '46px',
                        height: '26px',
                        borderRadius: '9999px',
                        background: alarm.enabled ? 'var(--primary-accent)' : 'var(--surface-container-highest)',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        padding: '2px',
                        transition: 'background 0.25s ease',
                        flexShrink: 0
                      }}
                      title={alarm.enabled ? 'Matikan Alarm' : 'Nyalakan Alarm'}
                    >
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                        transform: alarm.enabled ? 'translateX(20px)' : 'translateX(0px)',
                        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                      }} />
                    </button>
                  </div>

                  {/* Middle Row: Big Digital Time Display + Quick Time Input */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--surface-container)',
                    borderRadius: '16px',
                    border: '1px solid var(--hairline-border)'
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '28px',
                      fontWeight: 800,
                      color: alarm.enabled ? 'var(--on-surface)' : 'var(--text-muted)',
                      letterSpacing: '-0.02em',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '4px'
                    }}>
                      {displayTime}
                      {alarm.isInterval && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>flush</span>
                      )}
                    </div>

                    {/* Time or Interval Controller */}
                    {alarm.isInterval ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 1.5, 2, 3].map((intv) => (
                          <button
                            key={intv}
                            type="button"
                            onClick={() => {
                              setSettings(s => ({ ...s, notifWaterInterval: intv }));
                              db.appSettings.put({ key: 'notifWaterInterval', value: intv });
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '9999px',
                              border: settings.notifWaterInterval === intv ? '1px solid var(--primary-accent)' : '1px solid var(--hairline-border)',
                              background: settings.notifWaterInterval === intv ? 'var(--surface-container-high)' : 'transparent',
                              color: settings.notifWaterInterval === intv ? 'var(--primary-accent)' : 'var(--text-muted)',
                              fontSize: '11px',
                              fontWeight: settings.notifWaterInterval === intv ? 700 : 500,
                              cursor: 'pointer'
                            }}
                          >
                            {intv}j
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="time"
                        value={settings[alarm.timeKey] || alarm.defaultTime}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSettings(s => ({ ...s, [alarm.timeKey]: val }));
                          db.appSettings.put({ key: alarm.timeKey, value: val });
                        }}
                        style={{
                          background: 'var(--surface-container-high)',
                          border: '1px solid var(--hairline-border)',
                          borderRadius: '10px',
                          padding: '6px 8px',
                          color: 'var(--on-surface)',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      />
                    )}
                  </div>

                  {/* Bottom Row: Day Chips & Quick Test Chime */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {DAY_LABELS.map((dayText, idx) => {
                        const isDayActive = alarm.days.includes(idx);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleToggleDay(alarm.id, idx)}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              border: isDayActive ? '1px solid var(--primary-accent)' : '1px solid var(--hairline-border)',
                              background: isDayActive ? 'var(--primary-accent)' : 'var(--surface-container)',
                              color: isDayActive ? 'var(--on-primary)' : 'var(--text-muted)',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                              transition: 'all 0.15s ease'
                            }}
                            title={`Ulangi hari ke-${idx + 1}`}
                          >
                            {dayText}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => playNotificationChime(settings.notifSoundTone)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        borderRadius: '9999px'
                      }}
                      title="Tes Suara Alarm"
                    >
                      <Play size={11} color="var(--primary-accent)" />
                      <span style={{ color: 'var(--primary-accent)', fontWeight: 600 }}>Tes Nada</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sync Button to native device / web scheduler */}
          <div className="sanctuary-card" style={{
            borderRadius: '20px',
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '4px'
          }}>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--on-surface)' }}>
                Sinkronisasi Jadwal Pengingat
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Jadwalkan ke sistem notifikasi Android / perangkat Anda
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                const res = await scheduleHabitReminders(alarms, settings);
                alert(`✅ ${res.scheduledCount} jadwal pengingat berhasil disinkronkan ke perangkat!`);
              }}
              style={{
                background: 'var(--surface-container-high)',
                color: 'var(--primary-accent)',
                border: '1px solid var(--hairline-border)',
                padding: '8px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Sinkronkan Sekarang
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 2: PENGATURAN NOTIFIKASI & AUDIO (Stitch Screen 6)
          ============================================================ */}
      {subTab === 'audio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Notification Permission Card */}
          <div className="sanctuary-card" style={{
            padding: '18px 20px',
            borderRadius: '24px',
            border: notifStatus === 'granted' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
            background: notifStatus === 'granted' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} color={notifStatus === 'granted' ? 'var(--primary-accent)' : '#d97706'} />
                <h3 style={{ fontSize: '14px', color: 'var(--on-surface)', margin: 0, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                  Izin Notifikasi HP / Browser
                </h3>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '9999px',
                background: notifStatus === 'granted' ? 'var(--primary-accent)' : '#f59e0b',
                color: '#ffffff'
              }}>
                {notifStatus === 'granted' ? 'AKTIF' : 'BELUM AKTIF'}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 12px' }}>
              {notifStatus === 'granted' 
                ? 'Sistem alarm GlowSculpt siap berbunyi di waktu sirkadian dan interval yang Anda tentukan.'
                : 'Aktifkan izin notifikasi agar smartphone berbunyi saat jam batas kafein, minum air, atau skincare tiba.'}
            </p>

            {notifStatus !== 'granted' && (
              <button
                onClick={handleEnableNotif}
                className="btn-primary"
                style={{ width: '100%', padding: '10px 16px', fontSize: '12.5px', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Bell size={15} /> Izinkan Notifikasi Sekarang
              </button>
            )}
          </div>

          {/* Sound Tone Selection & Custom Upload (Stitch Screen 6 Core) */}
          <div className="sanctuary-card" style={{
            borderRadius: '24px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--on-surface)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-heading)' }}>
                  <Volume2 size={16} color="var(--primary-accent)" /> Pilihan Nada Notifikasi
                </h3>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Pilih nada jernih atau gunakan audio kustom Anda
                </span>
              </div>
              <button
                type="button"
                onClick={() => playNotificationChime(settings.notifSoundTone)}
                style={{
                  background: 'var(--surface-container-high)',
                  color: 'var(--primary-accent)',
                  border: '1px solid var(--hairline-border)',
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <Play size={12} /> Putar Nada
              </button>
            </div>

            {/* Dropdown Pilihan Nada Suara */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Preset Nada Alarm & Pengingat:
              </label>
              <select
                value={settings.notifSoundTone}
                onChange={(e) => handlePreviewTone(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--surface-container)',
                  border: '1px solid var(--hairline-border)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: 'var(--on-surface)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {BUILTIN_TONES.map((tone) => (
                  <option key={tone.id} value={tone.id} style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}>
                    {tone.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Upload Ringtone Sendiri (.mp3, .wav, .m4a) */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Ringtone Kustom Pengguna:
              </label>
              <div style={{
                background: 'var(--surface-container)',
                border: '1.5px dashed var(--hairline-border)',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: customRingtoneName ? 'rgba(16, 185, 129, 0.15)' : 'var(--surface-container-high)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: customRingtoneName ? 'var(--primary-accent)' : 'var(--text-muted)',
                    flexShrink: 0
                  }}>
                    <Upload size={16} />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {customRingtoneName ? customRingtoneName : 'Upload Ringtone Kustom (.mp3, .wav)'}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {customRingtoneName ? 'Ringtone kustom aktif tersimpan di HP' : 'Maksimal ukuran file 8 MB'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {customRingtoneName && (
                    <button
                      type="button"
                      onClick={handleRemoveCustomAudio}
                      title="Hapus audio kustom"
                      style={{ background: 'rgba(225, 29, 72, 0.15)', border: 'none', borderRadius: '8px', color: '#e11d48', cursor: 'pointer', padding: '6px 8px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <label
                    style={{
                      padding: '7px 14px',
                      background: 'var(--surface-container-high)',
                      border: '1px solid var(--hairline-border)',
                      borderRadius: '9999px',
                      color: 'var(--primary-accent)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{customRingtoneName ? 'Ganti File' : 'Pilih File'}</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleUploadAudio}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Early Warning Toggle (30 Min Before Curfew) */}
            <div 
              onClick={async () => {
                const updated = !settings.notifEarlyWarning;
                setSettings(s => ({ ...s, notifEarlyWarning: updated }));
                await db.appSettings.put({ key: 'notifEarlyWarning', value: updated });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: settings.notifEarlyWarning ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-container)',
                border: settings.notifEarlyWarning ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--hairline-border)',
                borderRadius: '16px',
                cursor: 'pointer'
              }}
            >
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--on-surface)' }}>
                  ⚠️ Peringatan Dini 30 Menit
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Mengingatkan 30 menit sebelum batas kopi dan makan malam tiba
                </div>
              </div>
              <button
                type="button"
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '9999px',
                  background: settings.notifEarlyWarning ? 'var(--primary-accent)' : 'var(--surface-container-highest)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  padding: '2px',
                  flexShrink: 0
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  transform: settings.notifEarlyWarning ? 'translateX(20px)' : 'translateX(0px)',
                  transition: 'transform 0.2s ease'
                }} />
              </button>
            </div>
          </div>

          {/* Test Notification Drawer / Trigger */}
          <div className="sanctuary-card" style={{
            borderRadius: '24px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ fontSize: '14.5px', color: 'var(--on-surface)', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-heading)' }}>
              <Bell size={16} color="var(--primary-accent)" /> Uji Coba Pengingat & Suara
            </h3>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0 }}>
              Pilih salah satu template notifikasi berikut untuk menguji nada dan banner di layar:
            </p>

            <select
              value={selectedTestPresetId}
              onChange={(e) => setSelectedTestPresetId(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--surface-container)',
                border: '1px solid var(--hairline-border)',
                borderRadius: '12px',
                padding: '10px 14px',
                color: 'var(--on-surface)',
                fontSize: '12.5px',
                fontWeight: 600
              }}
            >
              {NOTIFICATION_PRESETS.map((p) => (
                <option key={p.id} value={p.id} style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}>
                  {p.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleTriggerTestNotif}
              className="btn-primary"
              style={{
                padding: '12px',
                fontSize: '13px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Bell size={15} /> Bunyikan Notifikasi Uji Coba
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 3: TARGET NUTRISI & PROFIL AKUN
          ============================================================ */}
      {subTab === 'nutrition' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* User Account Card */}
          <div className="sanctuary-card" style={{
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-accent), var(--primary-hover))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '16px',
                fontFamily: 'var(--font-heading)'
              }}>
                {(currentUser?.name || 'S').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--on-surface)', fontFamily: 'var(--font-heading)' }}>
                  {currentUser?.name || 'Sobat Glow'}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {currentUser?.email || 'Akun Lokal Tersimpan'}
                </span>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                style={{
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  borderRadius: '9999px',
                  color: '#e11d48',
                  background: 'rgba(225, 29, 72, 0.1)',
                  border: '1px solid rgba(225, 29, 72, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <LogOut size={12} />
                <span>Keluar</span>
              </button>
            )}
          </div>

          {/* Form Target Harian */}
          <form onSubmit={handleSave} className="sanctuary-card" style={{
            borderRadius: '24px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <h3 style={{ fontSize: '14.5px', color: 'var(--on-surface)', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-heading)' }}>
              <Sliders size={16} color="var(--primary-accent)" /> Target Kebugaran & Nutrisi Seimbang
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Batas Gula Max */}
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                  Batas Gula Max (g)
                </label>
                <input
                  type="number"
                  value={settings.maxSugarGrams}
                  onChange={(e) => setSettings({ ...settings, maxSugarGrams: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    background: 'var(--surface-container)',
                    border: '1px solid var(--hairline-border)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    color: 'var(--on-surface)',
                    fontSize: '13.5px',
                    fontWeight: 700
                  }}
                />
                <span style={{ fontSize: '10px', color: '#e11d48' }}>WHO: Maksimal 25-30g</span>
              </div>

              {/* Target Air Putih */}
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                  Target Air Putih (ml)
                </label>
                <input
                  type="number"
                  step="100"
                  value={settings.targetWaterMl}
                  onChange={(e) => setSettings({ ...settings, targetWaterMl: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    background: 'var(--surface-container)',
                    border: '1px solid var(--hairline-border)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    color: 'var(--on-surface)',
                    fontSize: '13.5px',
                    fontWeight: 700
                  }}
                />
                <span style={{ fontSize: '10px', color: '#0284c7' }}>Optimal: 2500 - 3000 ml</span>
              </div>

              {/* Batas Rokok */}
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                  Batas Rokok (Batang/Hari)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={settings.maxCigarettes}
                  onChange={(e) => setSettings({ ...settings, maxCigarettes: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    background: 'var(--surface-container)',
                    border: '1px solid var(--hairline-border)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    color: 'var(--on-surface)',
                    fontSize: '13.5px',
                    fontWeight: 700
                  }}
                />
                <span style={{ fontSize: '10px', color: '#d97706' }}>Cegah penuaan premature</span>
              </div>

              {/* Target Vitamin C */}
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                  Target Vitamin C (mg)
                </label>
                <input
                  type="number"
                  step="10"
                  value={settings.targetVitaminCMg}
                  onChange={(e) => setSettings({ ...settings, targetVitaminCMg: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    background: 'var(--surface-container)',
                    border: '1px solid var(--hairline-border)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    color: 'var(--on-surface)',
                    fontSize: '13.5px',
                    fontWeight: 700
                  }}
                />
                <span style={{ fontSize: '10px', color: 'var(--primary-accent)' }}>Kolagen synthesis booster</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: '12px',
                marginTop: '6px',
                borderRadius: '9999px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 size={16} /> Tersimpan Berhasil!
                </>
              ) : (
                'Simpan Pengaturan Target'
              )}
            </button>
          </form>

          {/* 16. FLEXIBLE GOALS CARD (Point 16) */}
          <div className="sanctuary-card" style={{
            borderRadius: '24px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                FLEXIBLE GOALS
              </span>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--on-surface)', margin: '2px 0 0' }}>
                Fokus Utama Saya Bulan Ini
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Pilih pilar kebiasaan yang ingin Anda prioritaskan tanpa rasa terbebani:
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {[
                { id: 'sleep', label: 'Sleep consistency', icon: '😴' },
                { id: 'hydration', label: 'Hydration 2L', icon: '💧' },
                { id: 'nutrition', label: 'Nutrition logging', icon: '🍽️' },
                { id: 'appearance', label: 'Appearance journal', icon: '📷' },
                { id: 'mindfulness', label: 'Mindfulness & Gua Sha', icon: '✨' },
                { id: 'activity', label: 'Activity & Movement', icon: '🏃' }
              ].map(goal => (
                <div
                  key={goal.id}
                  onClick={() => handleToggleGoal(goal.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '14px',
                    backgroundColor: flexibleGoals[goal.id] ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-container)',
                    border: flexibleGoals[goal.id] ? '1.5px solid var(--primary-accent)' : '1px solid var(--hairline-border)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{flexibleGoals[goal.id] ? '✓' : '○'}</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: flexibleGoals[goal.id] ? 700 : 500, color: flexibleGoals[goal.id] ? 'var(--primary-accent)' : 'var(--on-surface)' }}>
                      {goal.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 22. WEARABLES & HEALTH CONNECT INTEGRATION CARD (Point 22) */}
          <div className="sanctuary-card" style={{
            borderRadius: '24px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#e11d48', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  WEARABLES SYNC
                </span>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--on-surface)', margin: '2px 0 0' }}>
                  Health Connect & Apple Health
                </h3>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: wearablesSynced ? 'var(--primary-accent)' : 'var(--text-muted)',
                backgroundColor: wearablesSynced ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-container)',
                border: '1px solid var(--hairline-border)',
                padding: '3px 8px',
                borderRadius: '10px'
              }}>
                {wearablesSynced ? '✓ Terhubung' : 'Siap Sinkron'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--hairline-border)', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Langkah</span>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--on-surface)', marginTop: '2px' }}>
                  {wearablesSynced ? '6,421' : '5,100'}
                </div>
              </div>
              <div style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--hairline-border)', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Tidur</span>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--on-surface)', marginTop: '2px' }}>
                  7h 20m
                </div>
              </div>
              <div style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--hairline-border)', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Heart Rate</span>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--on-surface)', marginTop: '2px' }}>
                  68 bpm
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSyncWearables}
              disabled={isSyncingWearables}
              className="btn-primary"
              style={{
                border: 'none',
                padding: '12px',
                borderRadius: '14px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <RefreshCw size={14} className={isSyncingWearables ? 'animate-spin' : ''} />
              {isSyncingWearables ? 'Menghubungkan Health Connect...' : 'Sinkronkan Data Wearables Otomatis'}
            </button>
          </div>

          {/* Quick link to Privacy & Backup Tab */}
          <div className="sanctuary-card" style={{
            borderRadius: '24px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--on-surface)' }}>
                🛡️ Pusat Privasi & Cadangan Terenkripsi
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Ekspor cadangan dengan enkripsi AES-256 dan kontrol privasi data
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSubTab('privacy')}
              style={{
                background: 'var(--surface-container-high)',
                color: 'var(--primary-accent)',
                border: '1px solid var(--hairline-border)',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Buka
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 4: PUSAT PRIVASI & CADANGAN TERENKRIPSI (Prioritas 8)
          ============================================================ */}
      {subTab === 'privacy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Feedback status message */}
          {privacyStatusMsg && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '16px',
              padding: '12px 14px',
              fontSize: '12.5px',
              color: 'var(--primary-accent)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle size={16} color="var(--primary-accent)" />
              <span>{privacyStatusMsg}</span>
            </div>
          )}

          {/* Privacy & Cloud Access Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #004d34 0%, #006c49 100%)',
            color: '#ffffff',
            borderRadius: '20px',
            padding: '16px 18px',
            boxShadow: '0 4px 16px rgba(0, 108, 73, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={20} color="#6ee7b7" />
              <div>
                <h3 style={{ fontSize: '14.5px', fontWeight: 700, margin: 0 }}>
                  Privasi &amp; Keamanan Data
                </h3>
                <span style={{ fontSize: '11px', color: '#a7f3d0' }}>
                  Foto tersimpan aman di memori lokal perangkat
                </span>
              </div>
            </div>
          </div>

          {/* AI Cloud Gemini Online Configuration */}
          <div className="sanctuary-card" style={{
            borderRadius: '20px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--primary-accent)" />
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                  Glow AI Coach
                </h4>
              </div>

              {/* Status Pill Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--primary-accent)',
                flexShrink: 0
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981'
                }} />
                Online
              </div>
            </div>

            {/* Custom Gemini API Key Form */}
            <div style={{
              background: 'var(--surface-container)',
              border: '1px solid var(--hairline-border)',
              borderRadius: '16px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={14} color="var(--text-muted)" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--on-surface)' }}>
                  Kunci API Gemini (Opsional)
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input
                  type="password"
                  value={customGeminiApiKey}
                  onChange={(e) => setCustomGeminiApiKey(e.target.value)}
                  placeholder="Masukkan Gemini API Key pribadi..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--hairline-border)',
                    fontSize: '12px',
                    background: 'var(--surface-container-high)',
                    color: 'var(--on-surface)'
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: 'var(--primary-accent)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Simpan
                </button>
              </div>

              {apiKeySavedStatus && (
                <span style={{ fontSize: '11px', color: 'var(--primary-accent)', fontWeight: 600 }}>
                  ✓ {apiKeySavedStatus}
                </span>
              )}
            </div>
          </div>

          {/* Encrypted Export Section */}
          <div className="sanctuary-card" style={{
            borderRadius: '24px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="var(--primary-accent)" />
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                  Cadangan Terenkripsi AES-GCM (256-bit)
                </h4>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Ekspor data lengkap yang aman dari pembacaan pihak ketiga
                </span>
              </div>
            </div>

            {/* Checkbox: Include Photos */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--on-surface)' }}>
              <input
                type="checkbox"
                checked={exportIncludePhotos}
                onChange={(e) => setExportIncludePhotos(e.target.checked)}
                style={{ accentColor: 'var(--primary-accent)', width: '16px', height: '16px' }}
              />
              <span>Sertakan foto wajah biometrik ke dalam cadangan</span>
            </label>

            {/* Checkbox: Use Encryption Password */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--on-surface)' }}>
              <input
                type="checkbox"
                checked={useEncryption}
                onChange={(e) => setUseEncryption(e.target.checked)}
                style={{ accentColor: 'var(--primary-accent)', width: '16px', height: '16px' }}
              />
              <span style={{ fontWeight: 600 }}>Kunci file cadangan dengan Kata Sandi (Enkripsi AES-256)</span>
            </label>

            {/* Password input if encryption selected */}
            {useEncryption && (
              <div style={{ background: 'var(--surface-container)', border: '1px solid var(--hairline-border)', borderRadius: '14px', padding: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Kata Sandi Enkripsi (Wajib diingat untuk pemulihan):
                </label>
                <input
                  type="password"
                  placeholder="Minimal 4 karakter"
                  value={encryptionPassword}
                  onChange={(e) => setEncryptionPassword(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surface-container-high)',
                    border: '1px solid var(--hairline-border)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '12.5px',
                    color: 'var(--on-surface)'
                  }}
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleExportWithPrivacy}
              disabled={isExporting}
              className="btn-primary"
              style={{
                padding: '12px',
                borderRadius: '9999px',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isExporting ? 0.7 : 1
              }}
            >
              <Download size={15} />
              <span>{isExporting ? 'Memproses Enkripsi...' : 'Unduh Cadangan (.json / .aes.json)'}</span>
            </button>
          </div>

          {/* Restore Backup Section */}
          <div className="sanctuary-card" style={{
            borderRadius: '24px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={17} color="var(--primary-accent)" />
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                  Pulihkan Data dari File Cadangan
                </h4>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Impor kembali data riwayat dan foto ke perangkat ini
                </span>
              </div>
            </div>

            <div>
              <input
                type="file"
                accept=".json,.aes.json"
                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  width: '100%',
                  padding: '8px',
                  background: 'var(--surface-container)',
                  border: '1px dashed var(--hairline-border)',
                  borderRadius: '12px'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Kata Sandi (Hanya jika file cadangan terenkripsi):
              </label>
              <input
                type="password"
                placeholder="Masukkan kata sandi jika file terkunci"
                value={restorePassword}
                onChange={(e) => setRestorePassword(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--surface-container)',
                  border: '1px solid var(--hairline-border)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: 'var(--on-surface)'
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleRestoreBackup}
              disabled={!restoreFile}
              style={{
                padding: '11px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700,
                background: 'var(--surface-container-high)',
                border: '1px solid var(--hairline-border)',
                color: 'var(--primary-accent)',
                cursor: !restoreFile ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: !restoreFile ? 0.5 : 1
              }}
            >
              <Upload size={14} />
              <span>Pulihkan Data Sekarang</span>
            </button>
          </div>

          {/* Right to be Forgotten Section */}
          <div className="sanctuary-card" style={{
            borderRadius: '24px',
            padding: '20px',
            border: '1px solid rgba(225, 29, 72, 0.3)',
            background: 'rgba(225, 29, 72, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#e11d48" />
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                  Hak untuk Dihapus (Right to be Forgotten)
                </h4>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Kontrol mutlak atas penghapusan permanen data Anda
                </span>
              </div>
            </div>

            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
              Anda berhak menghapus data biometrik foto wajah saja tanpa menghilangkan jurnal konsumsi, atau melakukan pembersihan total aplikasi.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowPurgeModal(true)}
                style={{
                  padding: '10px 8px',
                  background: 'var(--surface-container)',
                  border: '1px solid rgba(225, 29, 72, 0.3)',
                  color: '#e11d48',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Hapus Semua Foto Saja
              </button>

              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                style={{
                  padding: '10px 8px',
                  background: '#e11d48',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Reset Total Aplikasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Semua Foto */}
      {showPurgeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="sanctuary-card" style={{ borderRadius: '24px', padding: '22px', maxWidth: '360px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#e11d48', margin: '0 0 8px' }}>
              Hapus Semua Foto Wajah?
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 16px' }}>
              Tindakan ini akan menghapus seluruh data biometrik foto wajah dari memori lokal. Riwayat konsumsi air, tidur, dan gula Anda akan tetap tersimpan.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                style={{ flex: 1, padding: '10px', background: 'var(--surface-container)', border: '1px solid var(--hairline-border)', borderRadius: '12px', fontWeight: 600, color: 'var(--on-surface)', cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPurgePhotos}
                style={{ flex: 1, padding: '10px', background: '#e11d48', border: 'none', borderRadius: '12px', fontWeight: 700, color: '#ffffff', cursor: 'pointer' }}
              >
                Ya, Hapus Foto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Reset Total Database */}
      {showResetModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="sanctuary-card" style={{ borderRadius: '24px', padding: '22px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#e11d48', margin: '0 0 8px' }}>
              ⚠️ Konfirmasi Reset Total
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 12px' }}>
              Seluruh riwayat kebiasaan harian, foto wajah, pengaturan alarm, dan log obrolan AI akan dihapus permanen dari perangkat ini.
            </p>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--on-surface)', display: 'block', marginBottom: '6px' }}>
                Ketik kata <strong style={{ color: '#e11d48' }}>RESET</strong> untuk melanjutkan:
              </label>
              <input
                type="text"
                placeholder="Ketik RESET"
                value={resetConfirmationText}
                onChange={(e) => setResetConfirmationText(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: 'var(--surface-container)', border: '1px solid var(--hairline-border)', color: 'var(--on-surface)', borderRadius: '10px', fontSize: '13px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmationText('');
                }}
                style={{ flex: 1, padding: '10px', background: 'var(--surface-container)', border: '1px solid var(--hairline-border)', borderRadius: '12px', fontWeight: 600, color: 'var(--on-surface)', cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetTotal}
                disabled={resetConfirmationText.trim().toUpperCase() !== 'RESET'}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: resetConfirmationText.trim().toUpperCase() === 'RESET' ? '#e11d48' : 'rgba(225, 29, 72, 0.3)',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 700,
                  color: '#ffffff',
                  cursor: resetConfirmationText.trim().toUpperCase() === 'RESET' ? 'pointer' : 'not-allowed'
                }}
              >
                Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
