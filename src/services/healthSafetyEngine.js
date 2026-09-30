/**
 * Health Safety & Medical Escalation Engine
 * 
 * Bertugas mengklasifikasikan intent pertanyaan pengguna, mendeteksi tanda bahaya medis (red flags),
 * dan memastikan AI tidak bertindak sebagai dokter klinis pengganti.
 * 
 * Filosofi:
 * - Menjaga keamanan pengguna dengan eskalasi medis proaktif.
 * - Mengarahkan ke fasilitas medis profesional jika terdapat gejala akut, asimetris, atau persisten.
 */

// Kategori Red Flags Medis
export const RED_FLAG_CATEGORIES = {
  ANAPHYLAXIS_AIRWAY: {
    id: 'anaphylaxis_airway',
    severity: 'EMERGENCY',
    title: 'Peringatan Darurat: Potensi Reaksi Alergi Akut / Saluran Napas',
    guidance: 'Gejala seperti sesak napas, kesulitan menelan, atau pembengkakan cepat pada bibir dan lidah berpotensi merupakan reaksi anafilaksis. Segera menuju ke Instalasi Gawat Darurat (IGD) atau hubungi nomor darurat 112 / 119.'
  },
  PERSISTENT_SWELLING: {
    id: 'persistent_swelling',
    severity: 'HIGH_ATTENTION',
    title: 'Evaluasi Medis Diperlukan: Pembengkakan Menetap (≥3 Hari)',
    guidance: 'Pembengkakan wajah yang menetap selama berhari-hari dan tidak mereda dengan istirahat/hidrasi dapat mengindikasikan gangguan fungsi ginjal, kelenjar tiroid, jantung, atau infeksi sistemik. Disarankan memeriksakan diri ke dokter umum atau spesialis penyakit dalam.'
  },
  FACIAL_ASYMMETRY: {
    id: 'facial_asymmetry',
    severity: 'EMERGENCY',
    title: 'Peringatan Medis: Gejala Asimetri Wajah / Mati Rasa',
    guidance: 'Wajah yang miring mendadak, kelopak mata sulit menutup sebelah, atau mati rasa pada separuh wajah memerlukan pemeriksaan neurologis darurat untuk menyingkirkan kemungkinan Bell’s Palsy atau gangguan vaskular otak.'
  },
  INFECTION_PAIN: {
    id: 'infection_pain',
    severity: 'HIGH_ATTENTION',
    title: 'Perhatian Medis: Tanda Infeksi Lokal / Gigi',
    guidance: 'Pembengkakan yang disertai demam, rasa nyeri berdenyut, kemerahan panas pada kulit, atau berasal dari gigi/gusi berpotensi infeksi bakteri yang membutuhkan antibiotik resep dokter atau penanganan dokter gigi.'
  }
};

/**
 * Mengklasifikasikan pesan pengguna dan memeriksa red flags
 */
export function classifyQueryIntent(text = '') {
  if (!text) return { isRedFlag: false, category: null, sanitizedText: '' };

  const lower = text.toLowerCase();

  // 1. Cek Anafilaksis / Saluran Napas
  if (
    lower.includes('sesak') ||
    lower.includes('sulit bernapas') ||
    lower.includes('susah napas') ||
    lower.includes('tenggorokan bengkak') ||
    lower.includes('lidah bengkak') ||
    lower.includes('bibir bengkak tiba') ||
    lower.includes('bibir bengkak mendadak') ||
    lower.includes('sulit menelan')
  ) {
    return {
      isRedFlag: true,
      category: RED_FLAG_CATEGORIES.ANAPHYLAXIS_AIRWAY,
      level: 'CRITICAL_EMERGENCY'
    };
  }

  // 2. Cek Asimetri / Kelemahan Wajah
  if (
    lower.includes('muka miring') ||
    lower.includes('wajah miring') ||
    lower.includes('mati rasa') ||
    lower.includes('kebas sebelah') ||
    lower.includes('tidak bisa senyum sebelah') ||
    lower.includes('mulut miring')
  ) {
    return {
      isRedFlag: true,
      category: RED_FLAG_CATEGORIES.FACIAL_ASYMMETRY,
      level: 'URGENT_MEDICAL'
    };
  }

  // 3. Cek Nyeri Hebat / Demam / Sakit Gigi Akut
  if (
    (lower.includes('demam') && (lower.includes('bengkak') || lower.includes('sembab'))) ||
    lower.includes('nyeri parah') ||
    lower.includes('sakit banget') ||
    lower.includes('keluar nanah') ||
    (lower.includes('gigi') && lower.includes('pipi bengkak'))
  ) {
    return {
      isRedFlag: true,
      category: RED_FLAG_CATEGORIES.INFECTION_PAIN,
      level: 'HIGH_ATTENTION'
    };
  }

  // 4. Cek Pembengkakan Menetap (≥3 Hari)
  if (
    lower.includes('3 hari bengkak') ||
    lower.includes('sudah 3 hari') ||
    lower.includes('sudah seminggu') ||
    lower.includes('berhari-hari bengkak') ||
    lower.includes('tidak kunjung kempes') ||
    lower.includes('menetap bengkak')
  ) {
    return {
      isRedFlag: true,
      category: RED_FLAG_CATEGORIES.PERSISTENT_SWELLING,
      level: 'HIGH_ATTENTION'
    };
  }

  return {
    isRedFlag: false,
    category: null,
    level: 'LIFESTYLE_WELLNESS'
  };
}

/**
 * Format teks eskalasi medis yang disisipkan ke respons AI
 */
export function generateMedicalEscalationNotice(category) {
  if (!category) return '';

  return `[PERINGATAN MEDIS PENTING]
${category.title}

${category.guidance}

Catatan Etika:
GlowAI Coach adalah asisten kebugaran gaya hidup dan tidak berwenang memberikan diagnosis atau resep medis klinis. Jika Anda merasakan kondisi darurat di atas, harap prioritaskan penanganan dokter profesional segera.`;
}
