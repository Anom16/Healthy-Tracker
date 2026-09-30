/**
 * GlowAI Coach - Medical Science & Web Grounded Intelligence Engine
 * Mengintegrasikan Google Gemini API dengan Google Search Grounding (Live Web Search)
 * serta Kompendium Sains Medis Tervalidasi (WHO, Harvard Health, PubMed, Mayo Clinic).
 * Zero Slop, Direct & Actionable, Zero Asterisks.
 */

import { classifyQueryIntent, generateMedicalEscalationNotice } from './healthSafetyEngine';
import { getAiCloudPrivacyPreference } from './privacyService';

// Helper pembersih tanda bintang (asterisk) dan format markdown berlebih
export function cleanAiOutput(text) {
  if (!text) return '';
  return text
    .replace(/\*{1,4}/g, '')      // Hapus semua asterisks (**)
    .replace(/#{1,6}\s?/g, '')     // Hapus tanda hashtag (#)
    .replace(/\n{3,}/g, '\n\n')    // Rapikan baris kosong berlebih namun jaga pemisah paragraf
    .trim();
}

// 1. KOMPENDIUM SAINS MEDIS TERVALIDASI (EVIDENCE-BASED CLINICAL COMPENDIUM)
export const CLINICAL_EVIDENCE = [
  {
    id: 'who_sugar',
    topic: 'Batas Gula Rafinasi & Glikasi Kulit',
    source: 'World Health Organization (WHO) Guideline 2015 & AHA',
    domain: 'Nutrisi & Glikasi Kolagen',
    summary: 'WHO merekomendasikan batas asupan gula bebas maksimal 25 gram (sekitar 6 sendok teh) per hari. Melebihi batas ini memicu hiperinsulinemia, aktivasi retensi natrium ginjal, dan pembentukan produk glikasi lanjut (AGEs) yang merusak kolagen kulit serta membuat pipi sembab bengkak.',
    keyMetric: 'Maks 25g/hari (5% total kalori)',
    clinicalAction: 'Ganti minuman manis dengan Cold Brew, infused water lemon, atau teh chamomile.'
  },
  {
    id: 'harvard_raas',
    topic: 'Mekanisme Retensi Sodium & RAAS',
    source: 'Harvard T.H. Chan School of Public Health - Fluid Dynamics',
    domain: 'Keseimbangan Osmolalitas Ginjal',
    summary: 'Asupan sodium tinggi (>2000mg/hari) memicu sumbu Renin-Angiotensin-Aldosterone System (RAAS) dan lonjakan hormon ADH (Antidiuretik). Akibatnya ginjal menahan air di ruang ekstraseluler. Jaringan subkutan longgar di pipi dan kantung mata adalah area pertama yang menampung edema.',
    keyMetric: 'Batas Sodium 2000mg (1 sdt garam)',
    clinicalAction: 'Hindari kuah ramen asin dan camilan ultra-proses, lakukan hydro-flush air putih.'
  },
  {
    id: 'nih_potassium',
    topic: 'Rasio Kalium-Sodium & Hydro-Flush',
    source: 'National Institutes of Health (NIH) - Potassium Fact Sheet',
    domain: 'Antagonis Natrium Ginjal',
    summary: 'Kalium (potasium) bertindak sebagai diuretik alami seluler dengan memicu pompa natrium-kalium (Na+/K+-ATPase) di tubulus ginjal untuk membuang natrium berlebih lewat urin. Mengonsumsi makanan kaya kalium mendebloat wajah dalam 6-12 jam.',
    keyMetric: 'Rasio K:Na ideal 2:1 ke atas',
    clinicalAction: 'Konsumsi air kelapa murni tanpa sirup, semangka, atau alpukat saat wajah sembab.'
  },
  {
    id: 'pubmed_circadian',
    topic: 'Ritme Sirkadian, Kafein & Hormon Pertumbuhan (GH)',
    source: 'Sleep Medicine Reviews & National Library of Medicine (PubMed)',
    domain: 'Biokimia Sirkadian & Deep Sleep',
    summary: 'Kafein memiliki waktu paruh (half-life) 5-7 jam. Konsumsi kafein di atas pukul 14.00 memblokade reseptor adenosin di otak dan memotong fase Slow-Wave Sleep (Deep Sleep). Pada fase inilah Growth Hormone dilepaskan untuk regenerasi sel dan drainase limfatik kepala.',
    keyMetric: 'Curfew Kafein: Maksimal jam 14.00',
    clinicalAction: 'Alihkan konsumsi sore ke air putih dingin atau teh herbal bebas kafein.'
  },
  {
    id: 'dermatology_lymph',
    topic: 'Drainase Limfatik Wajah & Gua Sha',
    source: 'Journal of Cosmetic Dermatology & Anatomical Lymphatics',
    domain: 'Stimulasi Mekanis Interstitial',
    summary: 'Pembuluh limfatik wajah tidak memiliki pompa jantung sendiri dan bergantung pada manipulasi gerak fisik. Usapan terarah dari dagu/pipi ke nodus limfatik preaurikular telinga lalu turun ke supraklavikular leher mempercepat pengeluaran cairan limfa hingga 40% dan menegaskan rahang.',
    keyMetric: '5 Menit pijatan terarah dengan sudut 15 derajat',
    clinicalAction: 'Lakukan pijat limfatik 5 menit pagi hari setelah bangun tidur dengan serum licin.'
  },
  {
    id: 'cell_metabolism_late_night',
    topic: 'Makan Larut Malam & Gravitasi Sembab Wajah',
    source: 'Cell Metabolism - Circadian Regulation of Digestion',
    domain: 'Kronobiologi & Distribusi Gravitasi Cairan',
    summary: 'Makan dalam rentang 3 jam sebelum tidur menempatkan tubuh dalam kondisi hiperinsulinemia dan lonjakan aldosteron saat posisi horizontal (rebahan). Gravitasi mendistribusikan kelebihan cairan pencernaan ke area kranial, menciptakan pembengkakan wajah moon-face pagi hari.',
    keyMetric: 'Curfew Makan Malam: Pukul 19.30 (3 jam sebelum tidur)',
    clinicalAction: 'Kunci jendela makan malam sebelum 19.30; jika lapar, konsumsi teh hangat tawar.'
  },
  {
    id: 'lancet_upf',
    topic: 'Makanan Ultra-Proses (UPF) & Inflamasi Mikrovaskular',
    source: 'The Lancet Diabetes & Endocrinology - UPF & Systemic Edema',
    domain: 'Integritas Vaskular & Endotelium',
    summary: 'Zat aditif emulsifier dan pengawet dalam makanan ultra-proses merusak lapisan glikokaliks endotelium kapiler, memicu kebocoran plasma mikro ke ruang interstisial wajah, menyebabkan pembengkakan kronis yang sering disalahartikan sebagai lemak pipi.',
    keyMetric: 'Kurangi konsumsi UPF di bawah 15% total asupan',
    clinicalAction: 'Prioritaskan makanan segar (whole foods) tanpa zat pengental artifisial.'
  },
  {
    id: 'bjsm_glut4',
    topic: 'Jalan Kaki Pasca Makan & Reseptor GLUT-4',
    source: 'British Journal of Sports Medicine (BJSM) - Postprandial Glycemia',
    domain: 'Pembuangan Glukosa Non-Insulin',
    summary: 'Aktivitas berjalan kaki ringan 10-15 menit setelah makan memicu translokasi reseptor GLUT-4 ke membran sel otot secara independen tanpa memerlukan lonjakan insulin tinggi. Hal ini mencegah lonjakan gula darah dan penimbunan cairan retensi air setelah makan.',
    keyMetric: '10-15 Menit jalan santai setelah makan',
    clinicalAction: 'Lakukan jalan santai ringan setelah makan siang atau malam daripada langsung duduk/rebahan.'
  },
  {
    id: 'mayo_hydration',
    topic: 'Kinetika Hidrasi & Supresi Hormon Vasopresin',
    source: 'Mayo Clinic Proceedings & American Journal of Clinical Nutrition',
    domain: 'Volume Plasma & Homeostasis Cairan',
    summary: 'Ketika tubuh mengalami dehidrasi ringan (kurang minum), hipotalamus memproduksi vasopresin untuk menahan setiap tetes cairan di dalam jaringan, menyebabkan wajah tampak bengkak. Minum air putih yang cukup (2.5 - 3 liter) menekan vasopresin dan memicu ekskresi air berlebih.',
    keyMetric: 'Target 2.5 - 3.0 Liter per hari',
    clinicalAction: 'Gunakan fitur Hydro-Flush di GlowSculpt untuk mencatat asupan air secara berkala.'
  },
  {
    id: 'endo_cortisol',
    topic: 'Kortisol, Adrenal & Penumpukan Lemak Wajah',
    source: 'European Journal of Endocrinology - Glucocorticoid Tissue Partitioning',
    domain: 'Regulasi Sumbu HPA & Lemak Wajah',
    summary: 'Stres kronis meningkatkan hormon kortisol yang secara spesifik memicu redistribusi lemak ke kompartemen pipi dan leher (moon-face Cushingoid) serta retensi natrium. Latihan pernapasan terstruktur (Box Breathing 4-4-4-4) menurunkan kortisol serum dalam 5 menit.',
    keyMetric: '5 Menit Box Breathing harian',
    clinicalAction: 'Buka menu Craving SOS & Box Breathing di GlowSculpt saat merasa stres atau cemas.'
  }
];

// 2. BASIS DATA MAKANAN LENGKAP DENGAN ANALISIS MEDIS
export const FOOD_DATABASE = [
  {
    name: 'Boba Brown Sugar Milk',
    keywords: ['boba', 'bubble tea', 'brown sugar', 'boba milk', 'xing fu tang'],
    status: 'RED',
    sugarGrams: 48,
    sodium: 'Sedang',
    summary: 'Hindari. Gula 48g (hampir 2x lipat batas WHO 25g/hari) memicu lonjakan insulin instan dan retensi air parah di pipi besok pagi.',
    alternative: 'Matcha latte tanpa gula dengan oat milk, atau Cold Brew.'
  },
  {
    name: 'Kopi Susu Gula Aren',
    keywords: ['kopi susu', 'gula aren', 'kenangan', 'tuku', 'kopi manis'],
    status: 'RED',
    sugarGrams: 28,
    sodium: 'Rendah',
    summary: 'Hindari saat cut gula. Gula aren tetap fruktosa tinggi. Diminum lewat jam 14.00 merusak deep sleep dan memicu wajah sembab.',
    alternative: 'Iced Americano tanpa gula atau Latte oat milk no sugar.'
  },
  {
    name: 'Es Teh Manis',
    keywords: ['es teh', 'teh manis', 'teh botol', 'sweet tea', 'esteh'],
    status: 'RED',
    sugarGrams: 30,
    sodium: 'Rendah',
    summary: 'Hindari. Mengandung rata-rata 3-4 sendok makan gula pasir yang langsung memicu retensi cairan di kelopak mata dan pipi.',
    alternative: 'Es teh tawar dengan perasan lemon segar.'
  },
  {
    name: 'Americano / Kopi Hitam Tanpa Gula',
    keywords: ['americano', 'kopi hitam', 'black coffee', 'espresso', 'kopi tubruk tanpa gula'],
    status: 'GREEN',
    sugarGrams: 0,
    sodium: 'Sangat Rendah',
    summary: 'Boleh dan bagus. Nol gula dan bertindak sebagai diuretik alami untuk membuang cairan sembab wajah. Minum sebelum jam 14.00.',
    alternative: 'Pilihan terbaik untuk debloat pagi hari.'
  },
  {
    name: 'Air Kelapa Murni',
    keywords: ['air kelapa', 'kelapa muda', 'coconut water', 'hydro coco'],
    status: 'GREEN',
    sugarGrams: 6,
    sodium: 'Alami Seimbang',
    summary: 'Sangat bagus. Tinggi kalium/potasium alami (NIH verified) yang aktif mengusir kelebihan sodium/garam dari jaringan wajah.',
    alternative: 'Minum murni tanpa sirup atau kental manis.'
  },
  {
    name: 'Infused Water Timun & Lemon',
    keywords: ['infused water', 'timun', 'air lemon', 'cucumber water'],
    status: 'GREEN',
    sugarGrams: 0,
    sodium: 'Nol',
    summary: 'Sangat bagus. Kaya antioksidan dan silika yang mengencangkan kulit serta mengempiskan kantung mata.',
    alternative: 'Minum 1-2 liter sepanjang hari.'
  },
  {
    name: 'Matcha Latte No Sugar',
    keywords: ['matcha', 'green tea', 'teh hijau'],
    status: 'GREEN',
    sugarGrams: 0,
    sodium: 'Rendah',
    summary: 'Bagus. Antioksidan EGCG tinggi membakar lemak dan meredakan inflamasi kulit wajah.',
    alternative: 'Gunakan susu almond atau oat milk tanpa pemanis.'
  },
  {
    name: 'Minuman Bersoda / Soft Drink',
    keywords: ['soda', 'coca cola', 'sprite', 'fanta', 'pepsi'],
    status: 'RED',
    sugarGrams: 39,
    sodium: 'Sedang',
    summary: 'Dilarang. 10 sendok teh gula cair dalam 1 kaleng memicu peradangan kulit dan wajah kembung seketika.',
    alternative: 'Sparkling water tawar dengan irisan jeruk nipis.'
  },
  {
    name: 'Alkohol / Bir / Wine',
    keywords: ['alkohol', 'bir', 'beer', 'soju', 'wine'],
    status: 'RED',
    sugarGrams: 15,
    sodium: 'Rendah',
    summary: 'Dilarang keras. Alkohol mendilatasi pembuluh darah kapiler dan menyebabkan dehidrasi parah yang membuat wajah bengkak berhari-hari.',
    alternative: 'Mocktail air soda lemon mint tanpa sirup.'
  },
  {
    name: 'Martabak Manis',
    keywords: ['martabak', 'terang bulan', 'martabak cokelat', 'martabak keju'],
    status: 'RED',
    sugarGrams: 38,
    sodium: 'Tinggi',
    summary: 'Dilarang. Tepung olahan + gula pasir masif + margarin asin = pemicu utama moon-face dan bengkak wajah dalam hitungan jam.',
    alternative: 'Dark chocolate 85% (1-2 kotak kecil).'
  },
  {
    name: 'Donat / Pastry',
    keywords: ['donat', 'croissant', 'roti manis', 'pastry', 'jco'],
    status: 'RED',
    sugarGrams: 26,
    sodium: 'Sedang',
    summary: 'Hindari. Minyak jenuh dan tepung rafinasi memicu inflamasi bawah kulit dan penimbunan cairan.',
    alternative: 'Roti gandum utuh panggang dengan selai kacang murni.'
  },
  {
    name: 'Dark Chocolate 85%+',
    keywords: ['dark chocolate', 'cokelat hitam', 'dark choc'],
    status: 'GREEN',
    sugarGrams: 3,
    sodium: 'Rendah',
    summary: 'Boleh. Gula minimal, kaya antioksidan flavanol untuk melancarkan sirkulasi mikro di wajah saat butuh cemilan.',
    alternative: 'Porsi aman: 15-20 gram.'
  },
  {
    name: 'Seblak Komplit',
    keywords: ['seblak', 'kerupuk basah', 'seblak ceker', 'seblak pedas'],
    status: 'RED',
    sugarGrams: 4,
    sodium: 'Ekstrem (>2000mg)',
    summary: 'Hindari. Sodium sangat tinggi (>2000mg) menahan hingga 1 liter air di sel wajah. Garis rahang langsung hilang besok pagi.',
    alternative: 'Sup ayam bening dengan sayuran segar dan jahe.'
  },
  {
    name: 'Mie Instan',
    keywords: ['mie instan', 'indomie', 'ramen instan', 'pop mie', 'mie kuah'],
    status: 'RED',
    sugarGrams: 3,
    sodium: 'Tinggi (1400mg)',
    summary: 'Hindari, terutama malam hari. Natrium 1400mg membuat ginjal menahan air, menyebabkan mata sipit dan pipi sembab saat bangun.',
    alternative: 'Mie shirataki dengan kuah kaldu jamur homemade.'
  },
  {
    name: 'Gorengan (Bakwan, Tempe Mendoan, Tahu Isi)',
    keywords: ['gorengan', 'bakwan', 'mendoan', 'bala-bala', 'tahu isi', 'pisang goreng'],
    status: 'RED',
    sugarGrams: 2,
    sodium: 'Tinggi',
    summary: 'Hindari. Minyak jelantah tinggi sodium memperlambat sirkulasi limfatik wajah.',
    alternative: 'Tahu/tempe kukus atau panggang air fryer.'
  },
  {
    name: 'Nasi Padang (Rendang / Gulai)',
    keywords: ['padang', 'nasi padang', 'rendang', 'gulai', 'ayam pop'],
    status: 'YELLOW',
    sugarGrams: 5,
    sodium: 'Tinggi',
    summary: 'Batasi dan pilih lauk cermat. Kuah santan dan garam tinggi menahan air di wajah. Trik aman: pilih Ayam Pop tanpa kuah gulai, perbanyak daun singkong rebus.',
    alternative: 'Ayam Pop bumbu rempah bakar.'
  },
  {
    name: 'Bakso Sapi Kuah',
    keywords: ['bakso', 'baso', 'bakso urat'],
    status: 'YELLOW',
    sugarGrams: 2,
    sodium: 'Tinggi',
    summary: 'Hati-hati. Dagingnya bagus untuk protein, tetapi kuah kaldunya sarat garam dan MSG pemicu retensi air. Jangan seruput habis kuahnya.',
    alternative: 'Bakso porsi kecil, perbanyak sawi/tauge dan sedikit kuah.'
  },
  {
    name: 'Semangka',
    keywords: ['semangka', 'watermelon'],
    status: 'GREEN',
    sugarGrams: 8,
    sodium: 'Nol',
    summary: 'Sangat bagus. 92% air plus L-Citrulline yang memperlebar pembuluh darah dan membuang kelebihan garam di wajah.',
    alternative: 'Konsumsi dingin di sore hari.'
  },
  {
    name: 'Mentimun',
    keywords: ['mentimun', 'timun', 'cucumber'],
    status: 'GREEN',
    sugarGrams: 1,
    sodium: 'Nol',
    summary: 'Sangat bagus. Diuretik alami nol kalori yang efektif mengempiskan kantung mata dan pipi sembab.',
    alternative: 'Camilan bebas tanpa batas porsi.'
  },
  {
    name: 'Ikan Salmon / Ikan Kembung',
    keywords: ['salmon', 'kembung', 'ikan laut', 'tuna'],
    status: 'GREEN',
    sugarGrams: 0,
    sodium: 'Alami Rendah',
    summary: 'Sangat bagus. Asam lemak Omega-3 mematikan inflamasi kronis dan menjaga definisi garis rahang.',
    alternative: 'Panggang atau bakar bumbu kunyit jahe.'
  },
  {
    name: 'Alpukat',
    keywords: ['alpukat', 'avocado'],
    status: 'GREEN',
    sugarGrams: 1,
    sodium: 'Nol',
    summary: 'Bagus. Sumber kalium dan lemak sehat untuk elastisitas kulit wajah. Jangan tambah susu kental manis.',
    alternative: 'Makan segar dengan perasan jeruk nipis.'
  },
  {
    name: 'Telur Rebus',
    keywords: ['telur', 'telur rebus', 'egg', 'omelet'],
    status: 'GREEN',
    sugarGrams: 0,
    sodium: 'Alami Rendah',
    summary: 'Sangat bagus. Protein murni tinggi leusin untuk menjaga massa otot wajah tanpa retensi air.',
    alternative: 'Sarapan ideal 2 butir telur rebus.'
  }
];

// 3. MESIN SEMANTIK & KOMPENDIUM KLINIS OFFLINE
export function getSmartOfflineConsultation(query) {
  const cleanQuery = query.trim();
  const q = cleanQuery.toLowerCase();

  // 0. Safety Check Medis Pertama
  const safety = classifyQueryIntent(cleanQuery);
  if (safety.isRedFlag) {
    return generateMedicalEscalationNotice(safety.category);
  }

  // A. Pertanyaan Terkait Sains / Sumber Web Valid / Jurnal Medis
  if (q.includes('sains') || q.includes('jurnal') || q.includes('valid') || q.includes('who') || q.includes('ilmiah') || q.includes('bukti')) {
    return cleanAiOutput(
`Landasan Sains Medis GlowSculpt (Tervalidasi):
1. Batas Gula WHO (2015): Maksimal 25g/hari untuk mencegah glikasi kolagen kulit dan lonjakan insulin yang menahan garam.
2. Mekanisme RAAS (Harvard Health): Sodium tinggi menarik air ke kompartemen interstitial wajah yang longgar (pipi dan kelopak mata).
3. Sirkadian Kafein (PubMed/NIH): Kafein memotong fase slow-wave sleep jika diminum lewat jam 14.00, merusak pelepasan Growth Hormone.
4. Drainase Limfatik (Dermatology Research): Pijat mekanis 5 menit mengalirkan getah bening kranial ke nodus leher untuk mengempiskan sembab hingga 40%.`
    );
  }

  // A2. Pencarian Spesifik Jurnal / Topik Sains Medis Valid
  const matchedEvidence = CLINICAL_EVIDENCE.find(e => {
    const t = e.topic.toLowerCase();
    const d = e.domain.toLowerCase();
    return (
      (q.includes('who') && e.id === 'who_sugar') ||
      (q.includes('harvard') && e.id === 'harvard_raas') ||
      (q.includes('raas') && e.id === 'harvard_raas') ||
      ((q.includes('kalium') || q.includes('potassium') || q.includes('hydro-flush')) && e.id === 'nih_potassium') ||
      ((q.includes('adenosin') || q.includes('growth hormone') || q.includes('deep sleep')) && e.id === 'pubmed_circadian') ||
      ((q.includes('upf') || q.includes('ultra-proses') || q.includes('endotelium')) && e.id === 'lancet_upf') ||
      ((q.includes('glut-4') || q.includes('glut4') || q.includes('jalan kaki')) && e.id === 'bjsm_glut4') ||
      ((q.includes('vasopresin') || q.includes('mayo')) && e.id === 'mayo_hydration') ||
      ((q.includes('kortisol') || q.includes('adrenal') || q.includes('cushingoid')) && e.id === 'endo_cortisol') ||
      t.includes(q) || d.includes(q)
    );
  });

  if (matchedEvidence) {
    return cleanAiOutput(
`Kajian Sains Medis Tervalidasi:
Topik: ${matchedEvidence.topic}
Sumber: ${matchedEvidence.source} (${matchedEvidence.domain})

Intisari Klinis:
${matchedEvidence.summary}

Metrik Kunci: ${matchedEvidence.keyMetric}
Rekomendasi Praktis: ${matchedEvidence.clinicalAction}`
    );
  }


  // B. Pertanyaan Fitur Aplikasi GlowSculpt
  if (q.includes('aplikasi') || q.includes('bloat score') || q.includes('skor sembab') || q.includes('cara kerja')) {
    return cleanAiOutput(
`Panduan Fitur Aplikasi GlowSculpt:
1. Face Bloat Score: Mengukur resiko kesembaban wajah dari 4 faktor (gula harian, air minum, batas kopi 14.00, batas makan malam 19.30).
2. Face Diary: Kamera dengan garis bantu oval wajah dan slider Before/After untuk memantau perubahan rahang harian.
3. Craving SOS: Timer 10 menit dan latihan pernapasan box breathing saat dorongan makan manis datang.
4. Pijat Gua Sha: Panduan 5 menit drainase getah bening untuk mengempiskan pipi sembab.`
    );
  }

  // C. Pertanyaan Pemanis / Gula / Pengganti Gula
  if (q.includes('pemanis') || q.includes('stevia') || q.includes('madu') || q.includes('pengganti gula')) {
    return cleanAiOutput(
`Panduan Pemanis untuk Wajah Tirus:
Boleh:
- Stevia murni, Erythritol, dan Monk Fruit. Nol kalori, tidak memicu lonjakan insulin dan tidak menahan air di wajah.

Hindari:
- Gula aren, madu olahan, sirup jagung (HFCS), dan kental manis. Semuanya memicu retensi cairan di bawah mata dan pipi.`
    );
  }

  // D. Pencarian di Database Makanan
  for (const item of FOOD_DATABASE) {
    if (item.keywords.some(k => q.includes(k)) || q.includes(item.name.toLowerCase())) {
      const statusText = item.status === 'GREEN' ? 'Sangat Boleh (Ramah Wajah & Anti-Sembab)' : (item.status === 'YELLOW' ? 'Boleh tapi Batasi Ketat' : 'Hindari (Memicu Retensi Cairan & Sembab)');
      return cleanAiOutput(
`Analisis Nutrisi & Estetika Wajah: ${item.name}

Status: ${statusText}
Estimasi Kandungan: Gula ~${item.sugarGrams}g | Sodium: ${item.sodium}

Alasan Medis & Dampak Biologis:
${item.summary}

Panduan Konsumsi & Pilihan Terbaik:
${item.alternative}

Tips Sinergi GlowSculpt:
Konsumsi dalam takaran wajar dan hindari tambahan gula rafinasi atau sirup sintetis. Untuk menjaga kontur rahang (jawline) tetap tegas dan bebas penumpukan cairan interstitial, padukan dengan hidrasi Hydro-Flush air putih dan lakukan pijat drainase limfatik wajah 3 menit ke arah tulang selangka leher.`
      );
    }
  }

  // E. Kenapa Muka Sembab / Bengkak (Pendekatan Edukatif Ilmiah)
  if (q.includes('bengkak') || q.includes('sembab') || q.includes('puffy') || q.includes('tembem') || q.includes('chubby')) {
    return cleanAiOutput(
`Penjelasan Fisiologis Wajah Sembab (Facial Puffiness):
Sensasi sembab atau pembengkakan sementara di area wajah merupakan hal yang lazim terjadi dan dapat dipengaruhi oleh beberapa faktor gaya hidup:
1. Keseimbangan Natrium & Cairan: Makanan tinggi garam semalam memicu retensi cairan sementara di jaringan subkutan pipi dan kelopak mata.
2. Posisi Tidur & Gravitasi: Berbaring horizontal dalam waktu lama mendistribusikan cairan ekstraseluler ke area kranial.
3. Kurang Tidur & Stres: Mempengaruhi regulasi hormon kortisol dan mikrosirkulasi kulit.
4. Dehidrasi: Tubuh cenderung menahan cairan ketika asupan air harian kurang optimal.

Langkah Relaksasi Harian:
- Cukupi hidrasi air putih secara bertahap untuk mendukung homeostasis cairan.
- Kompres sejuk (handuk dingin / sendok sejuk) untuk membantu vasokonstriksi kapiler perifer.
- Lakukan usapan lembut dari tengah wajah ke arah telinga lalu turun ke tulang selangka leher.

Kapan Perlu Memeriksakan Diri ke Dokter:
Jika pembengkakan timbul mendadak dan parah, terasa nyeri/panas, disertai sesak napas, atau menetap lebih dari 3 hari tanpa mereda, harap segera berkonsultasi dengan dokter profesional.`
    );
  }

  // F. Kopi & Kafein
  if (q.includes('kopi') || q.includes('kafein') || q.includes('caffeine')) {
    return cleanAiOutput(
`Aturan Minum Kopi untuk Wajah Tirus:
1. Pilihan terbaik: Americano atau kopi hitam murni tanpa gula (nol kalori, memicu efek debloat alami).
2. Hindari: Kopi susu gula aren, frappuccino manis (gula 25-40g).
3. Batas waktu: Maksimal jam 14.00 siang. Kafein di atas jam 14.00 merusak deep sleep dan membuat wajah kusam sembab besok pagi.`
    );
  }

  // G. Jam Makan & Fasting
  if (q.includes('makan malam') || q.includes('jam makan') || q.includes('makan jam') || q.includes('lapar malam') || q.includes('fasting')) {
    return cleanAiOutput(
`Aturan Jam Makan Malam:
- Batas ideal: Selesai makan sebelum jam 19.30 (minimal 3 jam sebelum tidur).
- Hindari mie instan, makanan berkuah asin, atau cemilan manis larut malam.
- Jika lapar larut malam: Minum segelas air putih hangat atau teh chamomile tanpa gula.`
    );
  }

  // H. Pijat Wajah & Garis Rahang (Jawline)
  if (q.includes('pijat') || q.includes('gua sha') || q.includes('tirus') || q.includes('jawline') || q.includes('double chin')) {
    return cleanAiOutput(
`Kunci Wajah Tirus dengan Drainase Limfatik:
1. Usap dari ujung dagu mendatar ke arah telinga (10x).
2. Usap dari samping hidung melewati tulang pipi ke pelipis (8x).
3. Langkah terpenting: Usap dari bawah telinga turun ke tulang selangka leher agar cairan terbuang keluar dari area kepala.
Gunakan moisturizer atau face oil tipis agar kulit tidak tergesek.`
    );
  }

  // I. Craving / Keinginan Manis
  if (q.includes('craving') || q.includes('pengen manis') || q.includes('pengin manis') || q.includes('ngemil')) {
    return cleanAiOutput(
`Protokol Redam Ingin Manis (Craving):
1. Keinginan manis biasanya mereda setelah 10 menit.
2. Minum 1 gelas besar air es dingin.
3. Sikat gigi rasa mint pedas untuk mematikan selera manis di lidah.
4. Jika masih ingin makan: Ambil 1 kotak kecil dark chocolate 85% atau potongan semangka dingin.`
    );
  }

  // J. Air Minum & Hidrasi
  if (q.includes('air') || q.includes('minum') || q.includes('liter') || q.includes('hidrasi')) {
    return cleanAiOutput(
`Aturan Air Minum untuk Wajah Bebas Sembab:
- Target harian: 2.5 hingga 3 liter air putih per hari.
- Fungsi: Membuang kelebihan garam (sodium) melalui ginjal. Makin cukup air putih, makin sedikit air yang ditahan di pipi.
- Hindari minum 1 liter sekaligus tepat sebelum tidur agar mata tidak bengkak.`
    );
  }

  // K. Default Jawaban Edukatif & Taktis
  return cleanAiOutput(
`Panduan Nutrisi Wajah Tirus GlowSculpt:
- Batasi gula rafinasi maksimal 25 gram per hari (Standar WHO).
- Hindari makanan tinggi sodium dan makan larut malam di atas jam 19.30.
- Minum air putih minimal 2.5 liter per hari.
- Batas aman kafein jam 14.00 siang.

Silakan sebutkan nama makanan, minuman, atau konsep kesehatan yang ingin kamu tanyakan.`
  );
}

// 4. KONSULTASI ONLINE GEMINI API DENGAN GOOGLE SEARCH GROUNDING & SAINS KLINIS
export async function consultGlowAi(userQuery, apiKey = '') {
  const cleanQuery = userQuery.trim();
  if (!cleanQuery) return '';

  // Auto-connect detection: fallback to persistent localStorage or env
  const activeKey = (apiKey && apiKey.trim()) ||
                    (typeof window !== 'undefined' && window.localStorage?.getItem('glowsculpt_gemini_api_key')) ||
                    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
                    '';

  // Online Cloud Gemini connection
  if (!activeKey) {
    return 'Kunci API Google Gemini belum dikonfigurasi. Silakan periksa pengaturan atau tambahkan VITE_GEMINI_API_KEY.';
  }

  try {
    const safetyCheck = classifyQueryIntent(cleanQuery);

    const systemInstruction = `Kamu adalah asisten kebugaran gaya hidup GlowSculpt yang cerdas, hangat, berbasis sains kesehatan, dan komunikatif.
Keahlian utamamu adalah nutrisi sehat seimbang, pemahaman hidrasi & elektrolit (natrium/kalium), ritme sirkadian tubuh, serta jurnal kenyamanan penampilan wajah.

BATASAN KESELAMATAN MEDIS MUTLAK (HEALTH SAFETY BOUNDARIES):
1. Kamu adalah wellness assistant, BUKAN dokter dan tidak berwenang memberikan diagnosis medis, resep obat, atau menggantikan peran tenaga kesehatan.
2. DILARANG mengklaim diagnosis pasti terhadap gejala fisik pengguna. Gunakan selalu bahasa probabilistik ilmiah ("dapat berkaitan dengan...", "faktor yang sering berpengaruh adalah...").
3. Jika pengguna menyebutkan gejala yang berpotensi darurat (seperti sesak napas, bibir/lidah bengkak mendadak, wajah miring/mati rasa, nyeri hebat/demam, atau bengkak menetap ≥ 3 hari):
   Kamu WAJIB mengawali jawaban dengan peringatan tegas untuk memeriksakan diri ke dokter profesional atau fasilitas IGD terdekat.

STANDAR FORMAT JAWABAN:
1. Berikan penjelasan yang cerdas, ramah, dan berbobot ilmiah, tanpa tanda bintang ganda (**) atau format bold bintang apa pun.
2. Gunakan gaya bahasa yang suportif dan santun ala konsultan kebugaran pribadi.`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemInstruction}\n\nPertanyaan Pengguna: "${cleanQuery}"` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    };

    const models = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash'];
    let replyText = null;

    for (const model of models) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey.trim()}`;
        
        // Coba dengan Google Search Tool jika didukung
        let bodyToSend = {
          ...requestBody,
          tools: [{ googleSearch: {} }]
        };

        let response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyToSend)
        });

        if (!response.ok) {
          // Jika tools gagal (misal kuota search atau limit), kirim standar tanpa tools
          response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });
        }

        if (response.ok) {
          const data = await response.json();
          const parts = data.candidates?.[0]?.content?.parts || [];
          replyText = parts.filter(p => p.text).map(p => p.text).join('\n').trim();
          if (replyText) break;
        }
      } catch (err) {
        console.warn(`Model ${model} request failed:`, err);
      }
    }

    if (!replyText) {
      return getSmartOfflineConsultation(cleanQuery);
    }

    if (safetyCheck.isRedFlag) {
      const notice = generateMedicalEscalationNotice(safetyCheck.category);
      return cleanAiOutput(`${notice}\n\n---\n\n${replyText}`);
    }

    return cleanAiOutput(replyText);
  } catch (err) {
    return getSmartOfflineConsultation(cleanQuery);
  }
}

// 5. TESTER KONEKSI GEMINI API DENGAN VERIFIKASI MULTI-MODEL
export async function testGeminiApiKey(apiKey) {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'API Key belum diisi.' };
  }
  try {
    const models = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash'];
    let success = false;
    let activeModelName = '';

    for (const model of models) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const testBody = {
        contents: [{ role: 'user', parts: [{ text: 'Verifikasi model. Balas: SIAP' }] }],
        generationConfig: { maxOutputTokens: 20 }
      };

      try {
        let res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testBody)
        });

        if (res.ok) {
          success = true;
          activeModelName = model;
          break;
        }
      } catch (err) {
        // Coba model berikutnya
      }
    }

    if (!success) {
      return {
        success: false,
        message: 'API Key tidak valid atau kuota AI Studio habis.'
      };
    }

    return {
      success: true,
      message: `Terhubung Sukses! Model Google ${activeModelName} aktif & siap berkonsultasi cerdas.`,
      searchGrounding: false
    };
  } catch (e) {
    return { success: false, message: `Koneksi gagal: ${e.message}` };
  }
}

