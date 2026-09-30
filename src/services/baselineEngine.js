/**
 * Personal Baseline & Trend Engine (Mesin Baseline & Analisis Tren Personal)
 * 
 * Filosofi Ilmiah:
 * - Menghindari pembandingan pengguna dengan standar universal yang kaku atau rata-rata populasi umum.
 * - Membangun acuan dasar pribadi (personal baseline) berdasarkan data 14–30 hari pengguna sendiri.
 * - Menganalisis korelasi kebiasaan harian (tidur, hidrasi, jadwal makan, sodium, kafein) dengan sensasi fisik yang dilaporkan (self-reported puffiness).
 * - Menerapkan prinsip ilmiah tegas: "Korelasi observasional tidak membuktikan hubungan sebab-akibat langsung."
 */

import { db } from './db';

/**
 * Menghitung baseline pribadi pengguna selama rentang hari tertentu (default 30 hari)
 */
export async function calculatePersonalBaseline(days = 30) {
  const dates = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dates.push(dateStr);
  }

  // Ambil data dari Dexie
  const habits = await db.dailyHabits.where('date').anyOf(dates).toArray();
  const sugars = await db.sugarLogs.where('date').anyOf(dates).toArray();
  const photos = await db.facePhotos.where('date').anyOf(dates).toArray();

  const totalDaysTracked = habits.length;

  if (totalDaysTracked === 0) {
    return {
      hasBaseline: false,
      confidence: 'insufficient',
      confidenceText: 'Belum cukup data (perlu minimal 3–7 hari pencatatan)',
      daysTracked: 0,
      avgWaterMl: 2000,
      avgWaterL: 2.0,
      avgSleepHours: 7.5,
      avgSleepFormatted: '7j 30m',
      avgSugarGrams: 20,
      avgSodiumMg: 1450,
      avgCaffeineServings: 1.2,
      avgActivityMinutes: 30,
      avgPhotoQuality: 88,
      avgPuffinessRating: 2.1,
      puffinessRate: { none: 0, mild: 0, noticeable: 0 },
      insights: []
    };
  }

  // Hitung rata-rata air
  const waterSum = habits.reduce((acc, h) => acc + (Number(h.waterMl) || 0), 0);
  const avgWaterMl = Math.round(waterSum / totalDaysTracked);
  const avgWaterL = parseFloat((avgWaterMl / 1000).toFixed(2));

  // Hitung rata-rata tidur
  const validSleepHabits = habits.filter(h => Number(h.sleepHours) > 0);
  const sleepSum = validSleepHabits.reduce((acc, h) => acc + Number(h.sleepHours), 0);
  const avgSleepHours = validSleepHabits.length > 0 
    ? parseFloat((sleepSum / validSleepHabits.length).toFixed(1)) 
    : 7.5;
  const sleepH = Math.floor(avgSleepHours);
  const sleepM = Math.round((avgSleepHours - sleepH) * 60);
  const avgSleepFormatted = `${sleepH}j ${sleepM > 0 ? `${sleepM}m` : ''}`.trim();

  // Hitung rata-rata gula per hari
  const sugarDaysCount = new Set(sugars.map(s => s.date)).size || 1;
  const totalSugarAll = sugars.reduce((acc, s) => acc + (Number(s.grams) || 0), 0);
  const avgSugarGrams = Math.round(totalSugarAll / Math.max(1, sugarDaysCount));

  // Hitung rata-rata sodium
  const sodiumSum = habits.reduce((acc, h) => acc + (Number(h.sodiumMg) || 1400), 0);
  const avgSodiumMg = Math.round(sodiumSum / totalDaysTracked);

  // Hitung rata-rata kafein
  const caffeineSum = habits.reduce((acc, h) => acc + (Number(h.caffeineServings) || 1), 0);
  const avgCaffeineServings = parseFloat((caffeineSum / totalDaysTracked).toFixed(1));

  // Hitung rata-rata aktivitas
  const activitySum = habits.reduce((acc, h) => acc + (Number(h.activityMinutes) || 0), 0);
  const avgActivityMinutes = Math.round(activitySum / totalDaysTracked);

  // Hitung rata-rata kualitas foto
  const validPhotos = photos.filter(p => p.photoQualityScore > 0);
  const photoQualitySum = validPhotos.reduce((acc, p) => acc + p.photoQualityScore, 0);
  const avgPhotoQuality = validPhotos.length > 0 
    ? Math.round(photoQualitySum / validPhotos.length) 
    : 88;

  // Distribusi laporan puffiness subjektif (skala 1 - 5: none = 1, mild = 2.5, noticeable = 4.5)
  const puffinessCounts = { none: 0, mild: 0, noticeable: 0 };
  let puffRatingSum = 0;
  photos.forEach(p => {
    const val = p.selfReportedPuffiness;
    if (val in puffinessCounts) {
      puffinessCounts[val]++;
      puffRatingSum += val === 'none' ? 1.5 : val === 'mild' ? 2.5 : 4.2;
    } else {
      puffinessCounts.none++;
      puffRatingSum += 1.5;
    }
  });
  const avgPuffinessRating = photos.length > 0
    ? parseFloat((puffRatingSum / photos.length).toFixed(1))
    : 2.1;

  // Derajat keyakinan baseline
  let confidence = 'preliminary';
  let confidenceText = 'Baseline Awal (Observasi 3–6 hari)';
  if (totalDaysTracked >= 21) {
    confidence = 'robust';
    confidenceText = 'Baseline Sangat Akurat (Observasi 21+ hari)';
  } else if (totalDaysTracked >= 7) {
    confidence = 'moderate';
    confidenceText = 'Baseline Terkalibrasi (Observasi 7–20 hari)';
  }

  // Temuan Pola dan Korelasi Personal
  const insights = detectPersonalTrends(habits, sugars, photos, { avgWaterMl, avgSleepHours, avgSugarGrams });

  return {
    hasBaseline: true,
    confidence,
    confidenceText,
    daysTracked: totalDaysTracked,
    avgWaterMl,
    avgWaterL,
    avgSleepHours,
    avgSleepFormatted,
    avgSugarGrams,
    avgSodiumMg,
    avgCaffeineServings,
    avgActivityMinutes,
    avgPhotoQuality,
    avgPuffinessRating,
    puffinessCounts,
    insights
  };
}

/**
 * Membandingkan kebiasaan hari ini dengan baseline pribadi (Today vs Baseline)
 */
export function compareTodayWithBaseline(todayHabit = {}, sugarToday = 0, baseline = null, sodiumToday = 0, caffeineToday = 0, activityToday = 0) {
  if (!baseline || !baseline.hasBaseline) {
    return null;
  }

  const waterToday = Number(todayHabit.waterMl) || 0;
  const sleepToday = Number(todayHabit.sleepHours) || 7.5;
  const waterDiff = waterToday - baseline.avgWaterMl;
  const sleepDiff = parseFloat((sleepToday - baseline.avgSleepHours).toFixed(1));
  const sugarDiff = sugarToday - baseline.avgSugarGrams;
  const sodiumDiff = sodiumToday - baseline.avgSodiumMg;
  const caffeineDiff = parseFloat((caffeineToday - baseline.avgCaffeineServings).toFixed(1));
  const activityDiff = activityToday - baseline.avgActivityMinutes;

  const getArrow = (diff, threshold = 0) => {
    if (diff > threshold) return '↑';
    if (diff < -threshold) return '↓';
    return '→';
  };

  return {
    water: {
      today: waterToday,
      todayL: parseFloat((waterToday / 1000).toFixed(2)),
      baseline: baseline.avgWaterMl,
      baselineL: baseline.avgWaterL,
      diff: waterDiff,
      arrow: getArrow(waterDiff, 150),
      status: waterDiff >= 0 ? 'good' : 'warning',
      text: waterDiff >= 0 
        ? `+${Math.abs(waterDiff)}ml lebih optimal dari acuan Anda` 
        : `${Math.abs(waterDiff)}ml di bawah acuan personal`
    },
    sleep: {
      today: sleepToday,
      baseline: baseline.avgSleepHours,
      diff: sleepDiff,
      arrow: getArrow(sleepDiff, 0.3),
      status: sleepDiff >= 0 ? 'good' : 'warning',
      text: sleepDiff >= 0 
        ? `+${Math.abs(sleepDiff)} jam lebih panjang dari acuan Anda` 
        : `${Math.abs(sleepDiff)} jam lebih singkat dari acuan Anda`
    },
    sugar: {
      today: sugarToday,
      baseline: baseline.avgSugarGrams,
      diff: sugarDiff,
      arrow: getArrow(sugarDiff, 3),
      status: sugarDiff <= 0 ? 'good' : 'danger',
      text: sugarDiff <= 0 
        ? `${Math.abs(sugarDiff)}g lebih terkontrol dari acuan Anda` 
        : `+${sugarDiff}g di atas acuan personal`
    },
    sodium: {
      today: sodiumToday,
      baseline: baseline.avgSodiumMg,
      diff: sodiumDiff,
      arrow: getArrow(sodiumDiff, 100),
      status: sodiumDiff <= 0 ? 'good' : 'warning',
      text: sodiumDiff <= 0 ? 'Terkendali dari acuan' : `+${sodiumDiff}mg di atas acuan`
    },
    caffeine: {
      today: caffeineToday,
      baseline: baseline.avgCaffeineServings,
      diff: caffeineDiff,
      arrow: getArrow(caffeineDiff, 0.5),
      status: caffeineDiff <= 0 ? 'good' : 'warning',
      text: caffeineDiff <= 0 ? 'Sesuai batas rata-rata' : `+${caffeineDiff} serving ekstra`
    },
    activity: {
      today: activityToday,
      baseline: baseline.avgActivityMinutes,
      diff: activityDiff,
      arrow: getArrow(activityDiff, 5),
      status: activityDiff >= 0 ? 'good' : 'neutral',
      text: activityDiff >= 0 ? `+${activityDiff}m lebih aktif` : `${Math.abs(activityDiff)}m di bawah rata-rata`
    }
  };
}

/**
 * Menemukan korelasi empiris antara kebiasaan harian dan sensasi kesegaran fisik
 */
function detectPersonalTrends(habits, sugars, photos, baselines) {
  const insights = [];

  const dateMap = {};
  habits.forEach(h => {
    dateMap[h.date] = { habit: h, sugars: [], photo: null };
  });

  sugars.forEach(s => {
    if (!dateMap[s.date]) dateMap[s.date] = { habit: {}, sugars: [], photo: null };
    dateMap[s.date].sugars.push(s);
  });

  photos.forEach(p => {
    if (!dateMap[p.date]) dateMap[p.date] = { habit: {}, sugars: [], photo: null };
    dateMap[p.date].photo = p;
  });

  const merged = Object.values(dateMap).filter(item => item.photo && item.photo.selfReportedPuffiness);

  if (merged.length >= 3) {
    // 1. Analisis Durasi Tidur vs Laporan Sembab
    const shortSleepWithPuffiness = merged.filter(item => {
      const sleep = Number(item.habit?.sleepHours) || 0;
      return sleep > 0 && sleep < 6.5 && item.photo.selfReportedPuffiness !== 'none';
    });

    const totalShortSleep = merged.filter(item => (Number(item.habit?.sleepHours) || 0) < 6.5 && (Number(item.habit?.sleepHours) || 0) > 0);

    if (totalShortSleep.length >= 2 && shortSleepWithPuffiness.length >= 1) {
      const pct = Math.round((shortSleepWithPuffiness.length / totalShortSleep.length) * 100);
      insights.push({
        type: 'sleep_puffiness',
        title: 'Korelasi Istirahat & Kesegaran Wajah',
        text: `Dalam ${merged.length} hari observasi berfoto, ${shortSleepWithPuffiness.length} dari ${totalShortSleep.length} hari (${pct}%) dengan tidur <6.5 jam bertepatan dengan sensasi sembab yang Anda laporkan.`,
        icon: 'Moon',
        tone: 'informative'
      });
    }

    // 2. Analisis Hidrasi Optimal vs Sensasi Segar
    const optimalWaterFresh = merged.filter(item => {
      const water = Number(item.habit?.waterMl) || 0;
      return water >= baselines.avgWaterMl && item.photo.selfReportedPuffiness === 'none';
    });

    const totalHighWater = merged.filter(item => (Number(item.habit?.waterMl) || 0) >= baselines.avgWaterMl);

    if (totalHighWater.length >= 2 && optimalWaterFresh.length >= 1) {
      insights.push({
        type: 'water_freshness',
        title: 'Keseimbangan Hidrasi Pribadi',
        text: `Hari-hari saat asupan air Anda mencapai ≥ ${baselines.avgWaterMl}ml paling konsisten bertepatan dengan laporan wajah terasa segar dan nyaman di pagi hari.`,
        icon: 'Droplets',
        tone: 'positive'
      });
    }

    // 3. Analisis Sodium & Retensi
    const highSodiumDays = merged.filter(item => (Number(item.habit?.sodiumMg) || 0) > 1800 && item.photo.selfReportedPuffiness !== 'none');
    if (highSodiumDays.length >= 2) {
      insights.push({
        type: 'sodium_retention',
        title: 'Asupan Sodium & Keseimbangan Cairan',
        text: `Tercatat ${highSodiumDays.length} hari dengan asupan sodium tinggi (>1800mg) beriringan dengan sensasi sembab sementara. Menjaga rasio air putih membantu pengeluaran natrium berlebih.`,
        icon: 'Flame',
        tone: 'neutral'
      });
    }

    // 4. Analisis Waktu Makan Malam Mendekati Tidur
    const lateDinnerWithRetention = merged.filter(item => {
      const dinner = item.habit?.dinnerTime;
      if (!dinner) return false;
      const [h] = dinner.split(':').map(Number);
      return h >= 20 && item.photo.selfReportedPuffiness !== 'none';
    });

    if (lateDinnerWithRetention.length >= 2) {
      insights.push({
        type: 'dinner_retention',
        title: 'Jadwal Santap Malam & Retensi',
        text: `Tercatat ${lateDinnerWithRetention.length} kali makan malam di atas jam 20:00 bertepatan dengan sensasi sembab keesokan paginya. Memberikan jeda 2–3 jam sebelum tidur membantu tubuh mencerna cairan lebih baik.`,
        icon: 'Clock',
        tone: 'neutral'
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      type: 'initial_guidance',
      title: 'Membangun Data Baseline Pribadi',
      text: `Sistem sedang merekam pola kebiasaan Anda. Pola korelasi personal akan disempurnakan secara otomatis seiring bertambahnya catatan harian.`,
      icon: 'HeartPulse',
      tone: 'neutral'
    });
  }

  return insights;
}
