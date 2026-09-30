/**
 * Wellness Engine (Daily Wellness Index & Daily Wellness Pattern)
 * Sesuai arsitektur Section 5 Master Prompt.
 * 
 * Filosofi:
 * - Menilai Daily Wellness Pattern (0 - 100) sebagai indikator gaya hidup gabungan.
 * - Bukan medical risk score atau probabilitas edema.
 * - Berpedoman pada literatur fisiologi umum: hidrasi, pola nutrisi, sirkadian, dan istirahat.
 */

export { 
  calculateDailyWellnessScore,
  calculateDailyWellnessScore as calculateDailyWellnessIndex,
  calculateDailyWellnessScore as calculateDailyWellnessPattern,
  calculateFaceBloatScore
} from './bloatCalculator';
