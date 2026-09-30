/**
 * Notification & Alarm Service
 * Menangani izin notifikasi native (Capacitor Local Notifications untuk Android / iOS),
 * Web Notification API untuk desktop/PWA, audio chime Web Audio API multi-nada yang tenang,
 * Screen Wake Lock API, dan penjadwalan pengingat kebiasaan sirkadian yang ramah & bebas stres.
 */
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { db } from './db';

let activeWakeLock = null;
let cachedCustomAudio = null;
let activeWebAlarmTimer = null;

export const BUILTIN_TONES = [
  { id: 'zen', name: '🧘 Zen Temple Bell (Mewah & Tenang)' },
  { id: 'crisp', name: '🔔 Crisp High Chime (Tinggi & Jernih)' },
  { id: 'harp', name: '🎶 Crystal Harp (Santai & Melodi)' },
  { id: 'pulse', name: '⚡ Vibrant Pulse (Ceria & Energik)' },
  { id: 'radar', name: '📡 Gentle Radar (Modern & Tegas)' },
  { id: 'marimba', name: '🪵 Warm Marimba (Hangat & Alami)' },
  { id: 'breeze', name: '🍃 Morning Breeze (Seruling Pagi)' },
  { id: 'digital', name: '💬 Digital Sweet Ping (Ringan & Singkat)' },
  { id: 'custom', name: '🎵 Ringtone Kustom (Upload Sendiri)' }
];

export function setCustomAudioCache(dataUrl) {
  cachedCustomAudio = dataUrl;
}

export async function getCustomAudioData() {
  if (cachedCustomAudio) return cachedCustomAudio;
  try {
    const item = await db.appSettings.get('customRingtoneAudio');
    if (item && item.value) {
      cachedCustomAudio = item.value;
      return item.value;
    }
  } catch (e) {
    console.warn('Could not read custom audio from db:', e);
  }
  return null;
}

function playSynthesizedChime(tone = 'zen') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (tone === 'crisp') {
      const notes = [1046.5, 1318.51, 1567.98];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.45);
      });
    } else if (tone === 'harp') {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + idx * 0.09 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.65);
      });
    } else if (tone === 'pulse') {
      const notes = [587.33, 880, 1174.66];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + idx * 0.1 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.55);
      });
    } else if (tone === 'radar') {
      [1100, 1650].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.14);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.14 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.14 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.14);
        osc.stop(ctx.currentTime + idx * 0.14 + 0.4);
      });
    } else if (tone === 'marimba') {
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.11);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.11);
        gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + idx * 0.11 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.11 + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.11);
        osc.stop(ctx.currentTime + idx * 0.11 + 0.42);
      });
    } else if (tone === 'breeze') {
      const notes = [587.33, 659.25, 783.99, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + idx * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.6);
      });
    } else if (tone === 'digital') {
      const notes = [880, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + idx * 0.09 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.35);
      });
    } else {
      // Default: Zen Bell (E5 -> G#5 -> B5) - Santai, tidak memicu lonjakan kaget/stres
      const notes = [659.25, 830.61, 987.77];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + idx * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.55);
      });
    }
  } catch (err) {
    console.log('Audio chime not supported or muted');
  }
}

// Play notification sound (synthesized or custom uploaded audio)
export async function playNotificationChime(tone = 'zen', customAudioSrc = null) {
  try {
    if (tone === 'custom') {
      const src = customAudioSrc || cachedCustomAudio || await getCustomAudioData();
      if (src) {
        const audio = new Audio(src);
        audio.volume = 0.95;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('Custom ringtone play error, fallback to zen:', err);
            playSynthesizedChime('zen');
          });
        }
        return;
      }
    }
    playSynthesizedChime(tone);
  } catch (err) {
    console.log('Audio error:', err);
  }
}

// Request permission for Native (Capacitor) or Web Notifications
export async function requestNotificationPermission() {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await LocalNotifications.requestPermissions();
      return res.display === 'granted' ? 'granted' : 'denied';
    } catch (err) {
      console.warn('Native notification permission error:', err);
    }
  }

  if (!('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    return 'denied';
  }
}

// Check current notification permission state
export async function checkNotificationPermission() {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await LocalNotifications.checkPermissions();
      return res.display;
    } catch (err) {
      console.warn('Native check permission error:', err);
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission;
  }
  return 'unsupported';
}

// Trigger an immediate notification with calm chime
export async function sendAppNotification({ title, body, icon = '/favicon.svg', tone = 'zen', customAudio = null }) {
  playNotificationChime(tone, customAudio);

  // If Capacitor Native Platform
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 100000) + 1,
            title,
            body,
            schedule: { at: new Date(Date.now() + 200) },
            sound: 'res://raw/beep.wav',
            smallIcon: 'ic_stat_icon_config_sample'
          }
        ]
      });
      return true;
    } catch (err) {
      console.warn('Native local notification trigger error:', err);
    }
  }

  // Web Notification Fallback
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon,
        badge: icon,
        vibrate: [150, 80, 150]
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return true;
    } catch (err) {
      console.warn('Web notification trigger error:', err);
    }
  }

  return false;
}

// Schedule recurring habit reminders using Capacitor LocalNotifications and web in-app scheduler
export async function scheduleHabitReminders(alarmsList, settings) {
  const isNative = Capacitor.isNativePlatform();

  // Create Android Notification Channel if native
  if (isNative) {
    try {
      await LocalNotifications.createChannel({
        id: 'wellness_habits_channel',
        name: 'Pengingat Gaya Hidup Sehat',
        description: 'Pengingat lembut untuk hidrasi, makan malam seimbang, dan tidur',
        importance: 3,
        visibility: 1,
        vibration: true
      });
    } catch (err) {
      console.warn('Channel creation error:', err);
    }
  }

  // Clear existing pending native notifications
  if (isNative) {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
    } catch (err) {
      console.warn('Error clearing pending notifications:', err);
    }
  }

  const scheduledList = [];
  let notifIdCounter = 100;

  for (const alarm of alarmsList) {
    if (!alarm.enabled) continue;

    // Get time from settings or alarm defaults
    let timeStr = '20:00';
    if (alarm.timeKey && settings[alarm.timeKey]) {
      timeStr = settings[alarm.timeKey];
    } else if (alarm.defaultTime && alarm.defaultTime.includes(':')) {
      timeStr = alarm.defaultTime;
    }

    const [hour, minute] = timeStr.split(':').map(Number);
    if (isNaN(hour) || isNaN(minute)) continue;

    const notifItem = {
      alarmId: alarm.id,
      title: alarm.title,
      body: alarm.desc,
      hour,
      minute,
      days: alarm.days || [0, 1, 2, 3, 4, 5, 6]
    };

    scheduledList.push(notifItem);

    // Schedule in Native Capacitor
    if (isNative) {
      try {
        notifIdCounter++;
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifIdCounter,
              title: alarm.title,
              body: alarm.desc,
              channelId: 'wellness_habits_channel',
              schedule: {
                on: {
                  hour,
                  minute
                },
                repeats: true
              }
            }
          ]
        });
      } catch (err) {
        console.warn(`Error scheduling native alarm ${alarm.id}:`, err);
      }
    }
  }

  // Save active scheduled alarms to IndexedDB appSettings
  await db.appSettings.put({
    key: 'activeScheduledReminders',
    value: JSON.stringify(scheduledList)
  });

  // Setup Web in-app timer fallback (checks every minute)
  setupWebInAppAlarmListener(scheduledList);

  return {
    scheduledCount: scheduledList.length,
    isNative
  };
}

// In-app alarm listener when app is open on web or background PWA
function setupWebInAppAlarmListener(scheduledList) {
  if (activeWebAlarmTimer) {
    clearInterval(activeWebAlarmTimer);
  }

  let lastTriggeredMinute = -1;

  activeWebAlarmTimer = setInterval(() => {
    const now = new Date();
    const currentDay = (now.getDay() + 6) % 7; // Senin = 0, Minggu = 6
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const minuteKey = currentHour * 60 + currentMin;

    if (minuteKey === lastTriggeredMinute) return;

    scheduledList.forEach(alarm => {
      if (alarm.days.includes(currentDay) && alarm.hour === currentHour && alarm.minute === currentMin) {
        sendAppNotification({
          title: `🔔 ${alarm.title}`,
          body: alarm.body
        });
        lastTriggeredMinute = minuteKey;
      }
    });
  }, 30000);
}

// Screen Wake Lock API to prevent sleep during focused sessions
export async function enableScreenWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      activeWakeLock = await navigator.wakeLock.request('screen');
      activeWakeLock.addEventListener('release', () => {
        activeWakeLock = null;
      });
      return true;
    } catch (err) {
      console.warn('Wake Lock error:', err);
      return false;
    }
  }
  return false;
}

export function disableScreenWakeLock() {
  if (activeWakeLock) {
    activeWakeLock.release().catch(() => {});
    activeWakeLock = null;
    return true;
  }
  return false;
}

export function isWakeLockActive() {
  return activeWakeLock !== null;
}

// Preset Notification Triggers for testing & routine (Mindful, calm & scientifically grounded)
export const NOTIFICATION_PRESETS = [
  {
    id: 'water',
    title: '💧 Waktunya Hidrasi Tubuh',
    body: 'Nikmati 1 gelas air putih sejuk (250ml) untuk menjaga kelancaran sirkulasi dan homeostasis cairan tubuh Anda.'
  },
  {
    id: 'coffee_curfew',
    title: '☕ Batas Kafein Sore',
    body: 'Batas minum kopi harian telah tiba. Hindari kafein berlebih sekarang agar fase tidur nyenyak (deep sleep) malam nanti optimal.'
  },
  {
    id: 'dinner_curfew',
    title: '🍽️ Selesaikan Makan Malam',
    body: 'Waktu ideal menyelesaikan santap malam. Beri jeda bagi lambung dan ginjal beristirahat sebelum waktu tidur.'
  },
  {
    id: 'skincare_pm',
    title: '✨ Perawatan Kulit Malam & Relaksasi',
    body: 'Bersihkan wajah dan lakukan relaksasi otot rahang dengan pijatan ringan untuk melepas ketegangan seharian.'
  },
  {
    id: 'sleep_winddown',
    title: '🌙 Persiapan Istirahat Tenang',
    body: '30 menit menuju jam tidur ideal. Redupkan pencahayaan ruangan dan matikan layar agar produksi melatonin alami optimal.'
  },
  {
    id: 'cigarette_alert',
    title: '🚭 Pengingat Bebas Asap',
    body: 'Pertahankan kebiasaan sehat hari ini. Menahan dorongan rokok membantu menjaga mikrosirkulasi oksigen ke seluruh sel tubuh.'
  },
  {
    id: 'vitamin_c',
    title: '🍊 Waktunya Asupan Anti-Oksidan',
    body: 'Penuhi kebutuhan Vitamin C hari ini melalui buah segar atau nutrisi bergizi untuk mendukung daya tahan dan sintesis kolagen.'
  }
];
