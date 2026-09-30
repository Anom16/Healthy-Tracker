/**
 * Daily Wellness & Fluid Balance Engine (Kalkulator Pola Kebugaran & Keseimbangan Cairan)
 * 
 * Filosofi Ilmiah:
 * - Menilai pola kebiasaan harian secara heuristik (bukan model deterministik atau klaim medis mutlak).
 * - Menggunakan bahasa probabilistik: kebiasaan tertentu berkaitan dengan fluktuasi retensi cairan sementara (edema/puffiness),
 *   bukan perubahan struktur atau persentase lemak wajah.
 * - Berpedoman pada literatur fisiologi umum: keseimbangan natrium-kalium, kecukupan hidrasi, regulasi sirkadian, dan istirahat.
 */

export function calculateDailyWellnessScore({
  sugarGrams = 0,
  maxSugar = 25,
  sodiumMg = 0,
  maxSodium = 2000,
  activityMinutes = 0,
  targetActivity = 30,
  cigarettes = 0,
  maxCigarettes = 3,
  vitaminCMg = 0,
  targetVitaminCMg = 100,
  waterMl = 0,
  targetWater = 2500,
  sleepHours = 7.5,
  dinnerTime = '19:00',
  dinnerCurfew = '19:30',
  lastCoffeeTime = '',
  coffeeCurfew = '14:00',
  skincarePm = false,
  consistencyRate = 86
}) {
  const breakdown = [];

  // 1. Sub-skor Hidrasi (0 - 100)
  let hydrationSubScore = Math.min(100, Math.round((waterMl / Math.max(1, targetWater)) * 100));
  if (waterMl >= targetWater) {
    breakdown.push({
      factor: 'Hidrasi Tercapai',
      badge: 'Optimal',
      status: 'good',
      impact: '+15 Poin',
      desc: `Asupan ${waterMl}ml mendukung pembuangan kelebihan natrium dan kestabilan cairan tubuh.`
    });
  } else if (waterMl >= targetWater * 0.6) {
    breakdown.push({
      factor: 'Hidrasi Cukup',
      badge: 'Cukup',
      status: 'warning',
      impact: '+8 Poin',
      desc: `Tercatat ${waterMl}ml dari sasaran ${targetWater}ml. Menambah 1-2 gelas lagi membantu sirkulasi optimal.`
    });
  } else {
    breakdown.push({
      factor: 'Hidrasi Rendah',
      badge: 'Perlu Perhatian',
      status: 'danger',
      impact: '-12 Poin',
      desc: `Asupan ${waterMl}ml relatif rendah. Tubuh cenderung menahan cairan ekstraseluler saat dehidrasi ringan.`
    });
  }

  // 2. Sub-skor Tidur (0 - 100)
  let sleepSubScore = 80;
  if (sleepHours >= 7.0 && sleepHours <= 8.5) {
    sleepSubScore = 95;
    breakdown.push({
      factor: 'Durasi Tidur Sirkadian',
      badge: 'Optimal',
      status: 'good',
      impact: '+15 Poin',
      desc: `Durasi tidur ${sleepHours} jam berada dalam rentang pemulihan fisiologis ideal.`
    });
  } else if (sleepHours >= 6.0 && sleepHours < 7.0) {
    sleepSubScore = 75;
    breakdown.push({
      factor: 'Tidur Cukup',
      badge: 'Moderat',
      status: 'warning',
      impact: '+5 Poin',
      desc: `Tidur ${sleepHours} jam cukup, namun tidur lebih lelap dapat memaksimalkan drainase cairan kepala.`
    });
  } else {
    sleepSubScore = Math.max(30, Math.round((sleepHours / 7) * 70));
    breakdown.push({
      factor: 'Tidur Kurang',
      badge: 'Perlu Istirahat',
      status: 'danger',
      impact: '-10 Poin',
      desc: `Tidur ${sleepHours} jam berpotensi meningkatkan kortisol dan retensi cairan di kelopak mata.`
    });
  }

  // 3. Sub-skor Gula & Nutrisi (0 - 100)
  let nutritionSubScore = 90;
  if (sugarGrams === 0) {
    nutritionSubScore = 100;
    breakdown.push({
      factor: 'Bebas Gula Tambahan',
      badge: 'Sangat Baik',
      status: 'good',
      impact: '+12 Poin',
      desc: 'Menghindari lonjakan insulin tinggi membantu menjaga stabilitas elektrolit ginjal.'
    });
  } else if (sugarGrams <= maxSugar) {
    nutritionSubScore = 85;
    breakdown.push({
      factor: 'Gula Terkendali',
      badge: 'Sesuai Batas',
      status: 'good',
      impact: '+6 Poin',
      desc: `${sugarGrams}g masih dalam ambang rekomendasi harian (${maxSugar}g).`
    });
  } else {
    const overGrams = sugarGrams - maxSugar;
    nutritionSubScore = Math.max(30, Math.round(85 - overGrams * 2.5));
    breakdown.push({
      factor: 'Gula Melebihi Batas',
      badge: 'Tinggi',
      status: 'danger',
      impact: '-12 Poin',
      desc: `Kelebihan ${overGrams}g gula. Konsumsi air putih dan kalium disarankan untuk keseimbangan.`
    });
  }

  // 4. Sub-skor Sodium (0 - 100)
  let sodiumSubScore = 90;
  if (sodiumMg > 0) {
    if (sodiumMg <= maxSodium * 0.75) {
      sodiumSubScore = 95;
      breakdown.push({
        factor: 'Natrium/Sodium Terjaga',
        badge: 'Seimbang',
        status: 'good',
        impact: '+10 Poin',
        desc: `Asupan sodium ${sodiumMg}mg berada dalam batas aman ideal ginjal (<${maxSodium}mg).`
      });
    } else if (sodiumMg <= maxSodium) {
      sodiumSubScore = 80;
      breakdown.push({
        factor: 'Natrium Mendekati Batas',
        badge: 'Cukup',
        status: 'warning',
        impact: '+3 Poin',
        desc: `Tercatat ${sodiumMg}mg sodium. Perbanyak air putih untuk membantu pengeluaran natrium lewat urin.`
      });
    } else {
      sodiumSubScore = Math.max(25, Math.round(80 - ((sodiumMg - maxSodium) / 50)));
      breakdown.push({
        factor: 'Asupan Sodium Tinggi',
        badge: 'Perhatian',
        status: 'danger',
        impact: '-12 Poin',
        desc: `Asupan ${sodiumMg}mg melebihi panduan (${maxSodium}mg). Osmolalitas seluler dapat menahan air di wajah.`
      });
    }
  }

  // 5. Sub-skor Aktivitas Fisik (0 - 100)
  let activitySubScore = Math.min(100, Math.round((activityMinutes / Math.max(1, targetActivity)) * 95));
  if (activityMinutes >= targetActivity) {
    breakdown.push({
      factor: 'Aktivitas Sirkulasi',
      badge: 'Tercapai',
      status: 'good',
      impact: '+10 Poin',
      desc: `${activityMinutes} menit aktivitas membantu mengaktifkan pompa otot dan sirkulasi getah bening.`
    });
  }

  // 6. Sub-skor Kafein & Waktu Makan Malam (0 - 100)
  let caffeineSubScore = 85;
  if (lastCoffeeTime && coffeeCurfew) {
    const [cH, cM] = lastCoffeeTime.split(':').map(Number);
    const [limitH, limitM] = coffeeCurfew.split(':').map(Number);
    if (!isNaN(cH) && !isNaN(limitH) && (cH > limitH || (cH === limitH && cM > limitM))) {
      caffeineSubScore = 60;
      breakdown.push({
        factor: 'Kopi Lewat Jam Batas',
        badge: 'Perlu Penyesuaian',
        status: 'warning',
        impact: '-5 Poin',
        desc: `Kopi terakhir jam ${lastCoffeeTime} (melewati ${coffeeCurfew}). Waktu paruh kafein dapat menggeser fase deep sleep.`
      });
    }
  }

  if (dinnerTime && dinnerCurfew) {
    const [dH, dM] = dinnerTime.split(':').map(Number);
    const [limitH, limitM] = dinnerCurfew.split(':').map(Number);
    if (!isNaN(dH) && !isNaN(limitH) && (dH > limitH || (dH === limitH && dM > limitM))) {
      breakdown.push({
        factor: 'Makan Malam Larut',
        badge: 'Dekat Jam Tidur',
        status: 'warning',
        impact: '-6 Poin',
        desc: `Makan malam jam ${dinnerTime}. Berbaring segera setelah makan memicu redistribusi cairan ke leher dan wajah.`
      });
    }
  }

  // 7. Konsistensi Kebiasaan
  const consistencySubScore = Math.max(20, Math.min(100, consistencyRate || 85));

  // Hitung Skor Komposit Akhir (Weighted Composite Index 0 - 100)
  const compositeScore = Math.round(
    hydrationSubScore * 0.22 +
    sleepSubScore * 0.22 +
    nutritionSubScore * 0.16 +
    sodiumSubScore * 0.14 +
    activitySubScore * 0.12 +
    caffeineSubScore * 0.08 +
    consistencySubScore * 0.06
  );

  const finalScore = Math.max(15, Math.min(100, compositeScore));

  let status = 'BALANCED';
  let title = 'Pola Cukup Baik & Terjaga ⚖️';
  let color = '#10b981';
  let fluidTendency = 'Keseimbangan Relatif Stabil';
  let summary = 'Kebiasaan hari ini mendukung sirkulasi alami tubuh.';

  if (finalScore >= 80) {
    status = 'OPTIMAL';
    title = 'Pola Kebugaran Optimal 🌱';
    color = '#006c49';
    fluidTendency = 'Homeostasis Cairan Sangat Baik';
    summary = 'Kombinasi hidrasi, istirahat, dan nutrisi harian Anda memberikan dukungan pemulihan biologis yang prima.';
  } else if (finalScore >= 60) {
    status = 'BALANCED';
    title = 'Pola Cukup Baik ⚖️';
    color = '#10b981';
    fluidTendency = 'Keseimbangan Cairan Stabil';
    summary = 'Pola kebiasaan berjalan stabil. Menjaga hidrasi dan waktu istirahat teratur akan menjaga kesegaran tubuh.';
  } else {
    status = 'NEEDS_ATTENTION';
    title = 'Perlu Relaksasi & Pemulihan 💧';
    color = '#6366f1';
    fluidTendency = 'Kecenderungan Retensi Lebih Terasa';
    summary = 'Data menunjukkan waktu istirahat singkat atau hidrasi minim. Berikan waktu istirahat lebih awal malam ini.';
  }

  return {
    score: finalScore,
    status,
    title,
    color,
    fluidTendency,
    summary,
    breakdown,
    subScores: {
      hydration: hydrationSubScore,
      sleep: sleepSubScore,
      nutrition: nutritionSubScore,
      sodium: sodiumSubScore,
      activity: activitySubScore,
      caffeine: caffeineSubScore,
      consistency: consistencySubScore
    }
  };
}

export const calculateFaceBloatScore = calculateDailyWellnessScore;
