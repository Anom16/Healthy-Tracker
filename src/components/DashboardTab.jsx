import React, { useState, useEffect } from 'react';
import { 
  Flame, Droplets, Moon, Coffee, Sparkles, ShieldAlert, 
  Plus, CheckCircle, AlertTriangle, ChevronRight, X, HeartPulse, Heart,
  Cigarette, Citrus, Sun, Bed, Clock, Trash2, History, TrendingUp, BarChart2, Activity,
  Camera, Scan, Utensils, Zap, Bell, Check, ArrowUp, ArrowDown, ArrowRight, ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db, getTodayKey, calculateSugarStreak } from '../services/db';
import { calculateDailyWellnessScore } from '../services/bloatCalculator';
import { calculatePersonalBaseline, compareTodayWithBaseline } from '../services/baselineEngine';
import { getPersonalAnalyticsData } from '../services/analyticsEngine';
import SmartHabitLoggerModal from './SmartHabitLoggerModal';
import NutritionScannerModal from './NutritionScannerModal';

// Strictly valid mathematical sleep duration calculator (handles cross-midnight)
export function calcValidSleepHours(startTimeStr, endTimeStr) {
  if (!startTimeStr || !endTimeStr) {
    return { hours: 7.5, hoursInt: 7, minutesInt: 30, text: '7 Jam 30 Menit', isValid: true, warning: null };
  }
  const [sH, sM] = startTimeStr.split(':').map(Number);
  const [eH, eM] = endTimeStr.split(':').map(Number);
  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) {
    return { hours: 7.5, hoursInt: 7, minutesInt: 30, text: '7 Jam 30 Menit', isValid: false, warning: 'Format jam tidak valid' };
  }
  
  const sTotal = sH * 60 + sM;
  let eTotal = eH * 60 + eM;
  
  // Crosses midnight (e.g. 23:00 to 06:30)
  if (eTotal <= sTotal) {
    eTotal += 24 * 60;
  }
  
  const diffMinutes = eTotal - sTotal;
  const hoursDecimal = parseFloat((diffMinutes / 60).toFixed(1));
  const hoursInt = Math.floor(diffMinutes / 60);
  const minutesInt = diffMinutes % 60;

  let warning = null;
  if (hoursDecimal < 4.0) {
    warning = '⚠️ Waktu tidur kurang dari 4 jam (sangat singkat, risiko sembab/lingkar hitam)';
  } else if (hoursDecimal > 12.0) {
    warning = '⚠️ Waktu tidur melebihi 12 jam (risiko wajah bengkak/hypersomnia)';
  }

  return {
    hours: hoursDecimal,
    hoursInt,
    minutesInt,
    text: `${hoursInt} Jam ${minutesInt > 0 ? `${minutesInt} Menit` : ''}`.trim(),
    isValid: true,
    warning
  };
}

export default function DashboardTab({ onOpenSos, onOpenGuaSha, currentUser, onLogout, onNavigateToTab }) {
  const [streak, setStreak] = useState(1);
  const [todayHabit, setTodayHabit] = useState({
    waterMl: 0,
    cigarettes: 0,
    vitaminCMg: 0,
    skincareAm: false,
    skincarePm: false,
    lastCoffeeTime: '',
    dinnerTime: '19:00',
    sleepHours: 7.5,
    sleepTime: '23:00',
    wakeTime: '06:30',
    isSleeping: false,
    sleepStartTime: ''
  });
  const [todaySugarLogs, setTodaySugarLogs] = useState([]);
  const [caffeineServings, setCaffeineServings] = useState(1);
  const [sodiumMgToday, setSodiumMgToday] = useState(450);
  const [mealsCountToday, setMealsCountToday] = useState(2);
  const [activityMinutesToday, setActivityMinutesToday] = useState(30);
  const [hasTodayPhoto, setHasTodayPhoto] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [showSmartLoggerModal, setShowSmartLoggerModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showScoreBreakdownModal, setShowScoreBreakdownModal] = useState(false);
  const [breakdownModalTab, setBreakdownModalTab] = useState('scores'); // 'scores' | 'targets'
  const [sevenDayAverages, setSevenDayAverages] = useState({ sugar: 24, sodium: 1420, water: 1.8 });
  const [notificationAlert, setNotificationAlert] = useState(null);
  const [settings, setSettings] = useState({
    targetWaterMl: 2500,
    maxSugarGrams: 25,
    maxCigarettes: 3,
    targetVitaminCMg: 100,
    dinnerCurfewTime: '19:30',
    coffeeCurfewTime: '14:00'
  });
  const [showSugarModal, setShowSugarModal] = useState(false);
  const [sugarInput, setSugarInput] = useState({ name: '', grams: 10 });

  const [showWaterModal, setShowWaterModal] = useState(false);
  const [waterCustomInput, setWaterCustomInput] = useState('');

  const [showCigaretteModal, setShowCigaretteModal] = useState(false);
  const [cigaretteCustomInput, setCigaretteCustomInput] = useState('');

  const [showVitCModal, setShowVitCModal] = useState(false);
  const [vitCCustomInput, setVitCCustomInput] = useState('');

  const [showSleepModal, setShowSleepModal] = useState(false);
  const [sleepForm, setSleepForm] = useState({
    sleepTime: '23:00',
    wakeTime: '06:30'
  });

  const [dailyHistory, setDailyHistory] = useState([]);
  const [historyViewMode, setHistoryViewMode] = useState('today');
  const [personalBaseline, setPersonalBaseline] = useState(null);
  const [baselineComparison, setBaselineComparison] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedAnalyticsFactor, setSelectedAnalyticsFactor] = useState('sleep');

  const [showWellnessDetails, setShowWellnessDetails] = useState(false);
  const [wellnessData, setWellnessData] = useState({
    score: 75,
    status: 'MODERATE_BALANCE',
    title: 'Pola Cukup Baik ⚖️',
    color: '#10b981',
    fluidTendency: 'Homeostasis Stabil (Kecenderungan Sembab Rendah)',
    summary: 'Pola kebiasaan hari ini mendukung keseimbangan cairan tubuh yang baik.',
    breakdown: []
  });

  const baselineDiff = baselineComparison?.wellnessDiff ?? (wellnessData?.score ? wellnessData.score - 76 : 4);

  // Delete a sugar log entry
  const handleDeleteSugarLog = async (id) => {
    await db.sugarLogs.delete(id);
    loadData();
  };

  // Load data from IndexedDB
  const loadData = async () => {
    const today = getTodayKey();
    const habit = await db.dailyHabits.get(today);
    if (habit) {
      setTodayHabit(habit);
      setSleepForm({
        sleepTime: habit.sleepTime || '23:00',
        wakeTime: habit.wakeTime || '06:30'
      });
    }

    const [logs, caffeines, nutritions, activities, todayPhoto, allPastHabits] = await Promise.all([
      db.sugarLogs.where('date').equals(today).toArray(),
      db.caffeineLogs.where('date').equals(today).toArray(),
      db.nutritionLogs.where('date').equals(today).toArray(),
      db.activityLogs.where('date').equals(today).toArray(),
      db.facePhotos.where('date').equals(today).first(),
      db.dailyHabits.orderBy('date').reverse().limit(10).toArray()
    ]);

    setTodaySugarLogs(logs);

    const cCount = caffeines.reduce((acc, c) => acc + Number(c.servings || 1), 0);
    const sodTotal = nutritions.reduce((acc, n) => acc + Number(n.sodiumMg || 0), 0);
    const mCount = nutritions.length;
    const actMins = activities.reduce((acc, a) => acc + Number(a.durationMinutes || 0), 0);

    setCaffeineServings(cCount > 0 ? cCount : 1);
    setSodiumMgToday(sodTotal > 0 ? sodTotal : 450);
    setMealsCountToday(mCount > 0 ? mCount : 2);
    setActivityMinutesToday(actMins > 0 ? actMins : 30);
    setHasTodayPhoto(!!todayPhoto);

    // Check Recovery Mode (if gap since previous logged habit >= 2 days)
    if (allPastHabits && allPastHabits.length > 1) {
      const prevLog = allPastHabits.find(h => h.date !== today);
      if (prevLog) {
        const diffMs = new Date(today) - new Date(prevLog.date);
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        setIsRecoveryMode(diffDays >= 2);
      }
    }

    // Contextual Notification Intelligence
    const currentHour = new Date().getHours();
    if ((habit?.waterMl || 0) < 500 && currentHour >= 12) {
      setNotificationAlert({
        title: 'Pengingat Hidrasi',
        message: 'Belum mencatat hidrasi optimal siang ini. Ambil segelas air putih untuk menjaga sirkulasi.',
        actionLabel: '+ Minum 250ml',
        actionType: 'water'
      });
    } else if (currentHour >= 18 && currentHour <= 20 && mCount < 2) {
      setNotificationAlert({
        title: 'Waktu Makan Malam',
        message: 'Anda biasanya mencatat makan malam pada jam ini sebelum waktu curfew 19:30.',
        actionLabel: '+ Catat Makan',
        actionType: 'meal'
      });
    } else {
      setNotificationAlert(null);
    }

    const streakVal = await calculateSugarStreak();
    setStreak(streakVal);

    // Settings
    const tw = await db.appSettings.get('targetWaterMl');
    const ms = await db.appSettings.get('maxSugarGrams');
    const mc = await db.appSettings.get('maxCigarettes');
    const vc = await db.appSettings.get('targetVitaminCMg');
    const dc = await db.appSettings.get('dinnerCurfewTime');
    const cc = await db.appSettings.get('coffeeCurfewTime');

    const currentSettings = {
      targetWaterMl: tw?.value || 2500,
      maxSugarGrams: ms?.value || 25,
      maxCigarettes: mc?.value || 3,
      targetVitaminCMg: vc?.value || 100,
      dinnerCurfewTime: dc?.value || '19:30',
      coffeeCurfewTime: cc?.value || '14:00'
    };
    setSettings(currentSettings);

    // Calculate total sugar
    const totalSugar = logs.reduce((acc, curr) => acc + Number(curr.grams || 0), 0);

    // Calculate Daily Wellness & Fluid Balance Pattern
    const wellness = calculateDailyWellnessScore({
      sugarGrams: totalSugar,
      maxSugar: currentSettings.maxSugarGrams,
      sodiumMg: sodTotal,
      maxSodium: 2000,
      activityMinutes: actMins,
      targetActivity: 30,
      cigarettes: habit?.cigarettes || 0,
      maxCigarettes: currentSettings.maxCigarettes,
      vitaminCMg: habit?.vitaminCMg || 0,
      targetVitaminCMg: currentSettings.targetVitaminCMg,
      waterMl: habit?.waterMl || 0,
      targetWater: currentSettings.targetWaterMl,
      sleepHours: habit?.sleepHours || 7.5,
      dinnerTime: habit?.dinnerTime || '19:00',
      dinnerCurfew: currentSettings.dinnerCurfewTime,
      lastCoffeeTime: habit?.lastCoffeeTime || '',
      coffeeCurfew: currentSettings.coffeeCurfewTime,
      skincarePm: habit?.skincarePm || false
    });
    setWellnessData(wellness);

    // Load past 7 days history
    const dates = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dates.push(dateStr);
    }
    const allHabits = await db.dailyHabits.where('date').anyOf(dates).toArray();
    const allSugars = await db.sugarLogs.where('date').anyOf(dates).toArray();
    const past7Nutritions = await db.nutritionLogs.where('date').anyOf(dates).toArray();

    // 7-day average calculations for Section 4 Sodium Tracker
    const avg7Sugar = Math.round(allSugars.reduce((acc, s) => acc + Number(s.grams || s.amountGrams || 0), 0) / 7) || 22;
    const avg7Sodium = Math.round(past7Nutritions.reduce((acc, n) => acc + Number(n.sodiumMg || 0), 0) / 7) || 1280;
    const avg7Water = parseFloat((allHabits.reduce((acc, h) => acc + Number(h.waterMl || 0), 0) / (7 * 1000)).toFixed(1)) || 1.8;
    setSevenDayAverages({ sugar: avg7Sugar, sodium: avg7Sodium, water: avg7Water });

    const historyList = dates.map(dateStr => {
      const h = allHabits.find(x => x.date === dateStr) || {};
      const s = allSugars.filter(x => x.date === dateStr);
      const sTotal = s.reduce((acc, curr) => acc + Number(curr.grams || 0), 0);
      return {
        date: dateStr,
        habit: h,
        sugars: s,
        totalSugar: sTotal
      };
    });
    setDailyHistory(historyList);

    // Calculate Personal Baseline (30 days) and today's comparison
    const baseline = await calculatePersonalBaseline(30);
    setPersonalBaseline(baseline);
    const comparison = compareTodayWithBaseline(habit || todayHabit, totalSugar, baseline);
    setBaselineComparison(comparison);

    // Calculate Personal Analytics (Pearson Correlations)
    const analytics = await getPersonalAnalyticsData(30);
    setAnalyticsData(analytics);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Total sugar grams today
  const totalSugarToday = todaySugarLogs.reduce((acc, curr) => acc + Number(curr.grams || 0), 0);
  const sugarPercent = Math.min(100, Math.round((totalSugarToday / settings.maxSugarGrams) * 100));

  // Water calculations
  const waterPercent = Math.min(100, Math.round(((todayHabit.waterMl || 0) / settings.targetWaterMl) * 100));

  // Vitamin C percent
  const vitCPercent = Math.min(100, Math.round(((todayHabit.vitaminCMg || 0) / settings.targetVitaminCMg) * 100));

  // Add water helper
  const handleAddWater = async (amount) => {
    const today = getTodayKey();
    const newAmount = Math.max(0, (todayHabit.waterMl || 0) + amount);
    await db.dailyHabits.update(today, { waterMl: newAmount });
    setTodayHabit(prev => ({ ...prev, waterMl: newAmount }));

    if (newAmount >= settings.targetWaterMl && (todayHabit.waterMl || 0) < settings.targetWaterMl) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    }
    loadData();
  };

  // Add cigarette helper
  const handleAddCigarettes = async (delta) => {
    const today = getTodayKey();
    const current = Number(todayHabit.cigarettes || 0);
    const updated = Math.max(0, current + delta);
    await db.dailyHabits.update(today, { cigarettes: updated });
    setTodayHabit(prev => ({ ...prev, cigarettes: updated }));
    loadData();
  };

  // Add vitamin C helper
  const handleAddVitaminC = async (amount) => {
    const today = getTodayKey();
    const current = Number(todayHabit.vitaminCMg || 0);
    const updated = Math.max(0, current + amount);
    await db.dailyHabits.update(today, { vitaminCMg: updated });
    setTodayHabit(prev => ({ ...prev, vitaminCMg: updated }));
    if (updated >= settings.targetVitaminCMg && current < settings.targetVitaminCMg) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }
    loadData();
  };

  // Save sleep times from modal helper (calculates exact valid duration)
  const handleSaveSleepTimes = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const result = calcValidSleepHours(sleepForm.sleepTime, sleepForm.wakeTime);
    const today = getTodayKey();
    await db.dailyHabits.update(today, { 
      sleepTime: sleepForm.sleepTime,
      wakeTime: sleepForm.wakeTime,
      sleepHours: result.hours
    });
    setTodayHabit(prev => ({ 
      ...prev, 
      sleepTime: sleepForm.sleepTime,
      wakeTime: sleepForm.wakeTime,
      sleepHours: result.hours 
    }));
    setShowSleepModal(false);
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
    loadData();
  };

  // Cancel sleep mode helper
  const handleCancelSleep = async () => {
    const today = getTodayKey();
    await db.dailyHabits.update(today, { isSleeping: false });
    setTodayHabit(prev => ({ ...prev, isSleeping: false }));
    loadData();
  };

  // Toggle sleep mode helper (1-tap sleep recording)
  const handleToggleSleepMode = async () => {
    const today = getTodayKey();
    if (!todayHabit.isSleeping) {
      // Start sleep
      const now = new Date().toISOString();
      await db.dailyHabits.update(today, { isSleeping: true, sleepStartTime: now });
      setTodayHabit(prev => ({ ...prev, isSleeping: true, sleepStartTime: now }));
    } else {
      // Wake up
      const start = todayHabit.sleepStartTime ? new Date(todayHabit.sleepStartTime) : new Date(Date.now() - 7.5 * 3600000);
      const end = new Date();
      const diffMs = end - start;
      const diffHours = diffMs / (1000 * 60 * 60);

      // Jika tidur kurang dari 30 menit (misal hanya klik coba-coba / tidak sengaja klik)
      if (diffHours < 0.5) {
        const minutes = Math.max(1, Math.round(diffMs / 60000));
        alert(`Durasi terdeteksi baru ${minutes} menit (klik coba-coba / batal tidur).\n\nMode tidur dinonaktifkan tanpa merusak catatan jam tidur Anda (tetap ${todayHabit.sleepHours >= 3 ? todayHabit.sleepHours : 7.5} jam).`);
        const safeHours = todayHabit.sleepHours >= 3 ? todayHabit.sleepHours : 7.5;
        await db.dailyHabits.update(today, { isSleeping: false, sleepHours: safeHours });
        setTodayHabit(prev => ({ ...prev, isSleeping: false, sleepHours: safeHours }));
        loadData();
        return;
      }

      // Durasi tidur valid (> 30 menit)
      const sleepHours = parseFloat(Math.min(14, diffHours).toFixed(1));
      const sH = String(start.getHours()).padStart(2, '0');
      const sM = String(start.getMinutes()).padStart(2, '0');
      const sleepTime = `${sH}:${sM}`;
      const eH = String(end.getHours()).padStart(2, '0');
      const eM = String(end.getMinutes()).padStart(2, '0');
      const wakeTime = `${eH}:${eM}`;

      await db.dailyHabits.update(today, { 
        isSleeping: false, 
        sleepHours,
        sleepTime,
        wakeTime
      });
      setTodayHabit(prev => ({ ...prev, isSleeping: false, sleepHours, sleepTime, wakeTime }));
      setSleepForm({ sleepTime, wakeTime });
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      loadData();
    }
  };

  // Toggle habit checkbox
  const handleToggleHabit = async (field) => {
    const today = getTodayKey();
    const newVal = !todayHabit[field];
    await db.dailyHabits.update(today, { [field]: newVal });
    setTodayHabit(prev => ({ ...prev, [field]: newVal }));
    loadData();
  };

  // Add sugar entry
  const handleSaveSugar = async (e) => {
    e.preventDefault();
    if (!sugarInput.name) return;
    const today = getTodayKey();
    await db.sugarLogs.add({
      date: today,
      name: sugarInput.name,
      grams: Number(sugarInput.grams || 0),
      isCheat: Number(sugarInput.grams) > 15,
      createdAt: new Date().toISOString()
    });
    setSugarInput({ name: '', grams: 10 });
    setShowSugarModal(false);
    loadData();
  };

  return (
    <div style={{ padding: '16px 18px 90px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-surface)' }}>
      
      {/* 1. TOP GREETING SECTION */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '2px' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
          <h1 style={{ fontSize: '18px', color: 'var(--on-surface)', margin: '1px 0 0', fontWeight: 600 }}>
            Halo, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Sobat'}
          </h1>
        </div>
      </div>

      {/* 15. RECOVERY MODE BANNER */}
      {isRecoveryMode && (
        <div className="sanctuary-card" style={{
          background: 'var(--surface-container)',
          border: '1px solid rgba(134, 167, 137, 0.4)',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary-accent)', flexShrink: 0, marginTop: '2px' }}>
            spa
          </span>
          <div style={{ flex: 1 }}>
            <div className="font-label-caps" style={{ color: 'var(--primary-accent)' }}>
              MODE PEMULIHAN • SELAMAT DATANG KEMBALI
            </div>
            <p className="font-body-md" style={{ color: 'var(--on-surface-variant)', margin: '4px 0 0', lineHeight: 1.4, fontSize: '12px' }}>
              Riwayat kebiasaan Anda tetap tersimpan utuh di perangkat. Lanjutkan dari hari ini sebagai periode baru tanpa beban rasa bersalah.
            </p>
          </div>
        </div>
      )}

      {/* 20. NOTIFICATION INTELLIGENCE BANNER */}
      {notificationAlert && (
        <div className="sanctuary-card" style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          border: '1px solid rgba(217, 119, 6, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#f59e0b' }}>notifications_active</span>
            <div>
              <strong className="font-label-md" style={{ color: 'var(--on-surface)', display: 'block' }}>{notificationAlert.title}</strong>
              <span className="font-label-sm" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{notificationAlert.message}</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (notificationAlert.actionType === 'water') handleAddWater(250);
              else setShowSmartLoggerModal(true);
            }}
            className="btn-sanctuary-ghost"
            style={{ padding: '6px 12px', fontSize: '11px', whiteSpace: 'nowrap' }}
          >
            {notificationAlert.actionLabel}
          </button>
        </div>
      )}

      {/* 2. FOCAL POINT: DAILY WELLNESS VITALITY INDICATOR (Stitch Screen 3) */}
      <div className="sanctuary-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient Subtle Glow Aura */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          backgroundColor: 'rgba(134, 167, 137, 0.08)',
          filter: 'blur(45px)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="font-label-caps" style={{ color: 'var(--primary-accent)', letterSpacing: '0.12em' }}>
              SKOR KEBUGARAN HARIAN
            </span>
            <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: '20px' }}>
              nature_people
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span className="font-display-hero-mobile" style={{ color: 'var(--on-surface)', lineHeight: 1 }}>
                {wellnessData?.score || 78}
              </span>
              <span className="font-title-md" style={{ color: 'var(--text-muted)', fontWeight: 300 }}>
                /100
              </span>
            </div>

            {/* Serene Organic Arc (SVG circular gauge with spa icon) */}
            <div style={{ position: 'relative', width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg aria-hidden="true" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="var(--surface-container-highest)" strokeWidth="3" opacity="0.4" />
                <circle 
                  cx="36" 
                  cy="36" 
                  r="30" 
                  fill="none" 
                  stroke="var(--primary-accent)" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  strokeDasharray="188.5"
                  strokeDashoffset={188.5 * (1 - (wellnessData?.score || 78) / 100)}
                  style={{ transition: 'all 0.8s ease-out' }}
                />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary-accent)', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
                  spa
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '999px',
              backgroundColor: 'var(--surface-container)',
              border: '1px solid var(--hairline-border)'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-accent)' }} />
              <span className="font-label-sm" style={{ color: 'var(--on-surface)', fontSize: '11px' }}>
                {baselineDiff !== undefined && baselineDiff >= 0 ? `+${baselineDiff}` : baselineDiff || '+4'} vs baseline
              </span>
            </div>

            <button 
              onClick={() => {
                setBreakdownModalTab('targets');
                setShowScoreBreakdownModal(true);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary-accent)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              Detail Skor ℹ️
            </button>
          </div>
        </div>
      </div>

      {/* 3. TODAY'S HABITS: CURATED 2x2 BENTO GRID */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          <span className="font-label-caps" style={{ color: 'var(--text-muted)' }}>
            KEBIASAAN HARI INI
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          
          {/* Habit 1: Hydration */}
          <div 
            onClick={() => handleAddWater(250)}
            className="sanctuary-card" 
            style={{ padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '124px', cursor: 'pointer' }}
            title="Klik untuk +250ml Air"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="font-label-sm" style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: '13px' }}>Air</span>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-accent)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>water_drop</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span className="font-headline-sm" style={{ color: 'var(--on-surface)', fontWeight: 400 }}>
                  {((todayHabit.waterMl || 0) / 1000).toFixed(1)} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 300 }}>/ 2.0L</span>
                </span>
                <span className="font-label-caps" style={{ color: 'var(--primary-accent)', fontSize: '11px' }}>
                  {Math.min(100, Math.round(((todayHabit.waterMl || 0) / 2000) * 100))}%
                </span>
              </div>
              <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--surface-container-highest)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  backgroundColor: 'var(--primary-accent)',
                  borderRadius: '999px',
                  width: `${Math.min(100, Math.round(((todayHabit.waterMl || 0) / 2000) * 100))}%`,
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Habit 2: Sleep */}
          <div 
            onClick={() => setShowSleepModal(true)}
            className="sanctuary-card" 
            style={{ padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '124px', cursor: 'pointer' }}
            title="Klik untuk atur jam tidur"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="font-label-sm" style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: '13px' }}>Tidur</span>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-accent)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bedtime</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '8px' }}>
              <span className="font-headline-sm" style={{ color: 'var(--on-surface)', fontWeight: 400 }}>
                {todayHabit.sleepHours || 7.5} jam
              </span>
              <span className="font-label-sm" style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
                Target 7.5j
              </span>
            </div>
          </div>

          {/* Habit 3: Caffeine */}
          <div 
            onClick={() => handleQuickCaffeine('Coffee')}
            className="sanctuary-card" 
            style={{ padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '124px', cursor: 'pointer' }}
            title="Klik untuk +1 Porsi Kopi/Teh"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="font-label-sm" style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: '13px' }}>Kafein</span>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-accent)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>local_cafe</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '8px' }}>
              <span className="font-headline-sm" style={{ color: 'var(--on-surface)', fontWeight: 400 }}>
                {caffeineServings} cangkir
              </span>
              <span className="font-label-sm" style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
                Cutoff 14:00
              </span>
            </div>
          </div>

          {/* Habit 4: Active Motion */}
          <div 
            onClick={() => setShowSmartLoggerModal(true)}
            className="sanctuary-card" 
            style={{ padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '124px', cursor: 'pointer' }}
            title="Klik untuk catat aktivitas"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="font-label-sm" style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: '13px' }}>Aktivitas</span>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-accent)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>directions_walk</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span className="font-headline-sm" style={{ color: 'var(--on-surface)', fontWeight: 400 }}>
                  {activityMinutesToday}m <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 300 }}>/ 30m</span>
                </span>
                <span className="font-label-caps" style={{ color: 'var(--primary-accent)', fontSize: '11px' }}>
                  {Math.min(100, Math.round((activityMinutesToday / 30) * 100))}%
                </span>
              </div>
              <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--surface-container-highest)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  backgroundColor: 'var(--primary-accent)',
                  borderRadius: '999px',
                  width: `${Math.min(100, Math.round((activityMinutesToday / 30) * 100))}%`,
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 4. SANCTUARY VISUAL ATMOSPHERE */}
      <div 
        className="sanctuary-card"
        style={{
          width: '100%',
          height: '130px',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid var(--hairline-border)'
        }}
      >
        <div style={{
          width: '100%',
          height: '100%',
          backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA8_OKv7y0QzqQer1wBGVMDFNjIXHqNSZkF9nwYyuA8VnR5CusN5CFCEDRk22q1ka-WatTKAD4_sQq8Ankef22bz_icumc5FSxJFq6vYBSC-OMmzwE4u_B_EIfRxaOsJl36jsC-Ii8_35qWagwcKr4SzpECQDTUPdTCZewtrpLIEZF2zqJrY_C7nrx8FcF6FH0vg2ECOZM-wVLjWCU29LbEu-ByyHxSVnFu_9oLupF00r1tsJDjWTs')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}>
          <div style={{
            background: 'linear-gradient(to top, var(--surface-container-lowest) 10%, rgba(13, 14, 15, 0.7) 60%, transparent 100%)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span className="font-title-md" style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: '15px' }}>
              Momen Bernapas &amp; Relaksasi
            </span>
            <button
              onClick={onOpenSos}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(31, 32, 33, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--hairline-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--on-surface)',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              title="Reset Pernapasan"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_arrow</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. TODAY'S PATTERN */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span className="font-label-caps" style={{ color: 'var(--text-muted)', padding: '0 4px' }}>
          POLA HARIAN
        </span>
        <div className="sanctuary-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p className="font-body-md" style={{ color: 'var(--on-surface-variant)', fontStyle: 'italic', fontWeight: 400, lineHeight: 1.5, margin: 0, fontSize: '13px' }}>
            "Pola istirahat dan hidrasi hari ini mendukung pemulihan seluler optimal dan stabilitas sirkadian."
          </p>

          {/* Multi-Metric Trend Indicators */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            borderTop: '1px solid var(--hairline-border)',
            paddingTop: '8px',
            fontSize: '12px',
            fontWeight: 600
          }}>
            <span style={{ color: 'var(--primary-accent)' }}>Tidur ↑</span>
            <span style={{ color: '#fde047' }}>Hidrasi →</span>
            <span style={{ color: '#67e8f9' }}>Sembab ↓</span>
            <span style={{ color: 'var(--primary-accent)' }}>Gerak ↑</span>
          </div>
        </div>
      </div>

      {/* 6. PROMINENT QUICK LOG ACTION BUTTON */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4px' }}>
        <button
          onClick={() => setShowSmartLoggerModal(true)}
          style={{
            width: '100%',
            maxWidth: '420px',
            height: '52px',
            borderRadius: '999px',
            backgroundColor: 'var(--surface-container)',
            border: '1px solid var(--hairline-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '0 24px',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            backgroundColor: 'rgba(134, 167, 137, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary-accent)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          </div>
          <span className="font-title-md" style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: '14px' }}>
            Catat Cepat
          </span>
        </button>
      </div>

      {/* Quick Action Pills: Nutrition Scanner & Photo */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button
          onClick={() => setShowScannerModal(true)}
          className="btn-sanctuary-ghost"
          style={{ padding: '8px 16px', fontSize: '12px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary-accent)' }}>document_scanner</span>
          <span>Pindai Nutrisi</span>
        </button>
        <button
          onClick={() => onNavigateToTab ? onNavigateToTab('camera') : null}
          className="btn-sanctuary-ghost"
          style={{ padding: '8px 16px', fontSize: '12px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary-accent)' }}>photo_camera</span>
          <span>Foto Wajah</span>
        </button>
      </div>

      {/* Sleep Time & Valid Calculation Modal */}
      {showSleepModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="sanctuary-card" style={{
            width: '100%',
            maxWidth: '400px',
            padding: '24px',
            borderRadius: '28px',
            background: 'var(--surface-container-low)',
            border: '1px solid var(--hairline-border)',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--surface-container)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-accent)'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>bedtime</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', color: 'var(--on-surface)', margin: 0, fontWeight: 600 }}>Atur Waktu Tidur</h3>
                </div>
              </div>
              <button
                onClick={() => setShowSleepModal(false)}
                style={{
                  background: 'var(--surface-container)',
                  border: 'none',
                  color: 'var(--on-surface-variant)',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            {(() => {
              const calc = calcValidSleepHours(sleepForm.sleepTime, sleepForm.wakeTime);
              return (
                <form onSubmit={handleSaveSleepTimes} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--on-surface-variant)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                        Jam Mulai
                      </label>
                      <input
                        type="time"
                        value={sleepForm.sleepTime}
                        onChange={(e) => setSleepForm({ ...sleepForm, sleepTime: e.target.value })}
                        style={{
                          width: '100%',
                          borderRadius: '14px',
                          padding: '10px',
                          fontSize: '15px',
                          fontWeight: 700,
                          textAlign: 'center',
                          background: 'var(--surface-container)',
                          color: 'var(--on-surface)',
                          border: '1px solid var(--hairline-border)'
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--on-surface-variant)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                        Jam Bangun
                      </label>
                      <input
                        type="time"
                        value={sleepForm.wakeTime}
                        onChange={(e) => setSleepForm({ ...sleepForm, wakeTime: e.target.value })}
                        style={{
                          width: '100%',
                          borderRadius: '14px',
                          padding: '10px',
                          fontSize: '15px',
                          fontWeight: 700,
                          textAlign: 'center',
                          background: 'var(--surface-container)',
                          color: 'var(--on-surface)',
                          border: '1px solid var(--hairline-border)'
                        }}
                        required
                      />
                    </div>
                  </div>

                  {/* Live Calculation Display Box */}
                  <div style={{
                    background: 'var(--surface-container)',
                    border: '1px solid var(--hairline-border)',
                    borderRadius: '16px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Durasi Terhitung:</span>
                      <span style={{ 
                        fontSize: '16px', 
                        fontWeight: 700, 
                        color: calc.hours >= 7.5 ? 'var(--primary-accent)' : (calc.hours >= 6 ? '#f59e0b' : '#f87171')
                      }}>
                        {calc.hours} jam <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>({calc.text})</span>
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {calc.hours >= 7.5 && calc.hours <= 9 && (
                        <span>✨ Durasi optimal untuk regenerasi seluler & hidrasi kulit wajah.</span>
                      )}
                      {calc.hours >= 6 && calc.hours < 7.5 && (
                        <span>⚠️ Cukup, imbangi dengan hidrasi optimal siang ini.</span>
                      )}
                      {calc.hours < 6 && (
                        <span style={{ color: '#f87171' }}>❌ Kurang tidur memicu retensi cairan & sembab pagi hari.</span>
                      )}
                      {calc.hours > 9 && (
                        <span>ℹ️ Tidur lebih dari 9 jam dapat memperlambat sirkulasi cairan wajah.</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setShowSleepModal(false)}
                      className="btn-sanctuary-ghost"
                      style={{ flex: 1, padding: '12px', fontSize: '13px', borderRadius: '999px' }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="btn-sanctuary-primary"
                      style={{ flex: 1, padding: '12px', fontSize: '13px' }}
                    >
                      Simpan Jadwal
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* 2. SMART HABIT LOGGER MODAL */}
      <SmartHabitLoggerModal
        isOpen={showSmartLoggerModal}
        onClose={() => setShowSmartLoggerModal(false)}
        onOpenScanner={() => setShowScannerModal(true)}
        onOpenPhoto={() => onNavigateToTab && onNavigateToTab('camera')}
        onSuccess={loadData}
      />

      {/* 3 & 23. NUTRITION SCANNER MODAL */}
      <NutritionScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onSuccess={loadData}
      />

      {/* 19. WELLNESS SCORE BREAKDOWN & TARGET PURPOSE MODAL */}
      {showScoreBreakdownModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="sanctuary-card" style={{
            width: '100%',
            maxWidth: '440px',
            maxHeight: '90vh',
            backgroundColor: 'var(--surface-container-low)',
            border: '1px solid var(--hairline-border)',
            borderRadius: '28px',
            padding: '22px',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="font-label-caps" style={{ color: 'var(--primary-accent)', letterSpacing: '0.08em' }}>
                  PANDUAN TARGET &amp; BIO-MEKANISME
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--on-surface)', margin: '2px 0 0' }}>
                  {breakdownModalTab === 'scores' ? `Skor Harian: ${wellnessData.score}/100` : 'Mengapa Target Ini Krusial?'}
                </h3>
              </div>
              <button
                onClick={() => setShowScoreBreakdownModal(false)}
                style={{
                  background: 'var(--surface-container)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--on-surface-variant)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            {/* Segmented Switch */}
            <div style={{
              display: 'flex',
              padding: '3px',
              borderRadius: '999px',
              backgroundColor: 'var(--surface-container)',
              border: '1px solid var(--hairline-border)'
            }}>
              <button
                type="button"
                onClick={() => setBreakdownModalTab('scores')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: breakdownModalTab === 'scores' ? 'var(--secondary-container)' : 'transparent',
                  color: breakdownModalTab === 'scores' ? 'var(--primary-accent)' : 'var(--text-muted)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📊 Skor 7 Pilar
              </button>
              <button
                type="button"
                onClick={() => setBreakdownModalTab('targets')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: breakdownModalTab === 'targets' ? 'var(--secondary-container)' : 'transparent',
                  color: breakdownModalTab === 'targets' ? 'var(--primary-accent)' : 'var(--text-muted)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🔬 Sains Target (Untuk Apa?)
              </button>
            </div>

            {/* TAB 1: SCORES PROGRESS */}
            {breakdownModalTab === 'scores' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: '💧 Hidrasi Tubuh & Sel', score: Math.min(100, Math.round(((todayHabit.waterMl || 0) / 2000) * 100)) || 88, color: '#38bdf8', sub: 'Target 2.0L • Supresi Vasopressin' },
                    { label: '😴 Durasi & Kualitas Tidur', score: Math.min(100, Math.round(((todayHabit.sleepHours || 7.2) / 7.5) * 100)) || 76, color: 'var(--primary-accent)', sub: 'Target 7.5j • Sintesis Kolagen Deep Sleep' },
                    { label: '🍽️ Keseimbangan Nutrisi', score: 84, color: '#4ade80', sub: 'Pola Whole Food Padat Gizi' },
                    { label: '🧂 Keseimbangan Sodium', score: 80, color: '#fbbf24', sub: 'Batas < 2.000mg • Cegah Retensi Cairan' },
                    { label: '🏃 Gerak & Aktivitas Fisik', score: Math.min(100, Math.round(((activityMinutesToday || 30) / 30) * 100)) || 91, color: '#f87171', sub: 'Target 30m • Pompa Limfatik Wajah' },
                    { label: '☕ Cutoff Kafein Siang', score: caffeineServings <= 2 ? 88 : 72, color: '#fb923c', sub: 'Cutoff Pk 14:00 • Jaga Reseptor Adenosin' },
                    { label: '🔥 Tingkat Konsistensi Ritual', score: streak >= 6 ? 92 : streak >= 4 ? 86 : 76, color: 'var(--primary-accent)', sub: 'Stabilitas Rantai Kebiasaan Harian' }
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                        <span style={{ color: 'var(--on-surface)' }}>{item.label}</span>
                        <strong style={{ color: item.color }}>{item.score}/100</strong>
                      </div>
                      <div style={{ height: '6px', backgroundColor: 'var(--surface-container-highest)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${item.score}%`, height: '100%', backgroundColor: item.color, borderRadius: '999px', transition: 'width 0.3s ease' }} />
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.sub}</span>
                    </div>
                  ))}
                </div>

                <div style={{
                  padding: '12px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--surface-container)',
                  border: '1px solid var(--hairline-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Ingin tahu sains biologis di balik tiap target angka?
                  </span>
                  <button
                    onClick={() => setBreakdownModalTab('targets')}
                    className="btn-sanctuary-ghost"
                    style={{ padding: '6px 10px', fontSize: '11px', whiteSpace: 'nowrap' }}
                  >
                    Buka Panduan →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: DETAILED TARGET PURPOSE & BIOLOGICAL RATIONALE */}
            {breakdownModalTab === 'targets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '0 0 4px', lineHeight: 1.45 }}>
                  Setiap target dirancang secara empiris berdasarkan homeostasis cairan, ritme sirkadian, dan dinamika mikrovaskular:
                </p>

                {[
                  {
                    icon: 'water_drop',
                    color: '#38bdf8',
                    title: '1. Hidrasi Air Putih (Target 2.0L - 2.5L)',
                    purpose: 'Supresi Hormon Vasopressin (ADH) & Anti-Sembab',
                    desc: 'Saat tubuh kekurangan cairan mikro, ginjal mengompensasi dengan menahan air ekstraseluler di bawah kulit (terutama pipi & kantung mata). Asupan 2.0L+ membuang sisa natrium dan melancarkan drainase limfatik wajah.'
                  },
                  {
                    icon: 'bedtime',
                    color: 'var(--primary-accent)',
                    title: '2. Tidur Sirkadian (Target 7.5 Jam • 23:00 - 06:30)',
                    purpose: 'Pelepasan HGH & Sintesis Kolagen Deep Sleep',
                    desc: 'Fase Slow-Wave Sleep (Deep Sleep) melepaskan Human Growth Hormone untuk regenerasi sel dan perbaikan sawar kulit. Kurang tidur memicu lonjakan kortisol yang memecah kolagen dan merangsang retensi cairan wajah.'
                  },
                  {
                    icon: 'local_cafe',
                    color: '#fb923c',
                    title: '3. Batas Waktu Kafein (Cutoff Pk 14:00 • Maks 2 Porsi)',
                    purpose: 'Proteksi Reseptor Adenosin & Kualitas Restorasi',
                    desc: 'Waktu paruh (half-life) kafein adalah 5–7 jam. Menghentikan konsumsi sebelum Pk 14:00 memastikan reseptor adenosin di otak bersih saat malam, mencegah tidur terfragmentasi dan sembab mata di pagi hari.'
                  },
                  {
                    icon: 'grain',
                    color: '#fbbf24',
                    title: '4. Batas Sodium / Garam (Target < 2.000 mg/hari)',
                    purpose: 'Pengendalian Osmosis Ginjal & Jalur RAAS',
                    desc: 'Kelebihan natrium menarik air ke ruang interstisial. Saat tidur dalam posisi berbaring terlentang, cairan ini terkumpul di area berkulit tipis (orbicularis oculi/kantung mata & pipi).'
                  },
                  {
                    icon: 'cookie',
                    color: '#f43f5e',
                    title: '5. Batas Gula Bebas (Target < 25 g/hari)',
                    purpose: 'Pencegahan Glikasi (AGEs) & Lonjakan Insulin',
                    desc: 'Gula berlebih memicu Advanced Glycation End-products (AGEs) yang mengikat serat kolagen menjadi kaku, kusam, dan rapuh. Lonjakan insulin juga memicu retensi natrium oleh tubulus ginjal.'
                  },
                  {
                    icon: 'directions_walk',
                    color: '#4ade80',
                    title: '6. Gerak & Aktivitas Fisik (Target Min. 30 Menit/hari)',
                    purpose: 'Aktivasi Pompa Otot Limfatik Wajah',
                    desc: 'Sistem limfatik tidak memiliki pompa mekanis jantung sendiri; alirannya digerakkan kontraksi otot (muscle pump). 30 menit jalan cepat atau gerak menguras akumulasi cairan stagnan dari kepala dan leher ke vena sentral.'
                  },
                  {
                    icon: 'restaurant',
                    color: '#a855f7',
                    title: '7. Jeda Makan Malam (Batas Maksimal Pk 19:30)',
                    purpose: 'Pencegahan Redistribusi Cairan Kranial ("Moon-Face")',
                    desc: 'Memberi lambung jeda 3–4 jam sebelum tidur horizontal. Berbaring tidur saat pencernaan masih bekerja aktif memicu refluks dan redistribusi cairan ke kranial, menyebabkan wajah tampak bengkak keesokan harinya.'
                  }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    padding: '12px 14px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--surface-container)',
                    border: '1px solid var(--hairline-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: item.color }}>{item.icon}</span>
                      <strong style={{ fontSize: '12.5px', color: 'var(--on-surface)' }}>{item.title}</strong>
                    </div>
                    <span style={{ fontSize: '11px', color: item.color, fontWeight: 600, marginLeft: '26px' }}>
                      {item.purpose}
                    </span>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 26px', lineHeight: 1.45 }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowScoreBreakdownModal(false)}
              className="btn-sanctuary-primary"
              style={{ width: '100%', padding: '12px', marginTop: '4px' }}
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
