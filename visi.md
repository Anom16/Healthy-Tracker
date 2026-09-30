# VISI PRODUK & ROADMAP TEKNIS: GLOWSCULPT (HEALTHY TRACKER)

> **Dokumen Visi & Panduan Arsitektur Pengembangan**  
> Status: **Aktif & Menjadi Acuan Tunggal Pengembangan**  
> Filosofi Utama: **Personal Wellness Tracker, Appearance Journal, & Scientific Pattern Analytics** (Bukan Diet Wajah / Bukan Prediksi Deterministik).

---

## 1. Executive Summary & Alasan Pivot Ilmiah

Aplikasi **GlowSculpt** memiliki fondasi teknis yang kuat: *local-first privacy*, Dexie.js IndexedDB, habit logging, integrasi kamera, audio sintetis, dan kesiapan mobile Android via Capacitor. Namun, positioning awal sebagai *"face slimming / sugar detox"* dengan target mengubah bentuk lemak wajah memiliki kelemahan saintifik mendasar:

1. **Bentuk wajah & lemak wajah tidak ditentukan secara instan oleh konsumsi gula satu hari.**
2. **False Precision:** Angka seperti *"73% risiko wajah sembab besok"* tidak memiliki dasar klinis/epidemiologis yang valid dan memberikan ilusi presisi semu.
3. **Hubungan Psikologis Negatif terhadap Makanan:** Istilah seperti *"relapse"*, *"hukuman"*, atau *"cheat"* dapat memicu pola pikir restriktif yang tidak sehat.
4. **Faktor Retensi Cairan Kompleks:** Pembengkakan wajah (*facial puffiness*) dipengaruhi oleh interaksi multi-faktor: variasi cairan tubuh, asupan sodium (garam), posisi tidur, hidrasi, hormon, alkohol, stres, alergi, dan pencahayaan kamera—bukan semata-mata gula rafinasi.

### Pivot Strategis:
| Aspek | Konsep Lama (Ditinggalkan) | Konsep Baru (Diadopsi) |
| :--- | :--- | :--- |
| **Positioning** | Face Slimming & Sugar Detox App | Personal Wellness Tracker & Appearance Journal |
| **Metrik Utama** | Bloat Risk 0–100% & Prediksi Besok | **Daily Wellness Score & Fluid Balance Pattern** |
| **Bahasa Ilmiah** | Deterministik (*"Besok wajah Anda bengkak 76%"*) | **Probabilistik & Edukatif** (*"Kebiasaan hari ini berkaitan dengan fluktuasi cairan sementara"*) |
| **Craving Mode** | Anti-Relapse / Emergency Panic Button | **Mindful Eating SOS** (Refleksi lapar vs haus vs emosi) |
| **Pijat Wajah** | Gua Sha Pembakar Lemak Rahang | **Facial Relaxation & Lymphatic Circulation** |
| **Kamera Progres** | Deteksi Lemak Wajah Otomatis | **Photo Standardization & Appearance Consistency Journal** |
| **AI Coach** | Diagnosis Medis Instan | **Wellness Assistant dengan Health Safety & Escalation Layer** |
| **Gamifikasi** | Sugar-Free Streak (gagal = reset 0) | **Healthy Habit Consistency Index** |

---

## 2. Arsitektur Target Sistem

```text
                        GlowSculpt Hub
                              │
          ┌───────────────────┴───────────────────┐
          │                                       │
    DATA KEBIASAAN HARI INI                 DATA KAMERA STANDAR
  (Air, Tidur, Nutrisi/Sodium,             (Pencahayaan, Sudut Wajah,
   Gula, Kafein, Curfew, Gerak)            Jarak, Pose, Kualitas Foto)
          │                                       │
          └───────────────────┬───────────────────┘
                              ↓
                      PERSONAL BASELINE
            (Rata-rata 14–30 Hari Pengguna Sendiri)
                              ↓
                        TREND ENGINE
           (Korelasi Kebiasaan vs Fluktuasi Fisik)
                              ↓
              ┌───────────────┴───────────────┐
              ↓                               ↓
      Wellness Insights               Appearance Journal
     (Skor Pola Seimbang)            (Jurnal Visual Objektif)
              │                               │
              └───────────────┬───────────────┘
                              ↓
                        GlowAI Coach
                              ↓
                     HEALTH SAFETY LAYER
            (Eskalasi Medis: Gejala Persisten / Darurat)
                              ↓
                   Panduan Berkelanjutan
```

---

## 3. Prioritas & Roadmap Eksekusi (1 s/d 9)

- [x] **Prioritas 1: Rework Bloat Risk Engine $\rightarrow$ Daily Wellness Score** *(Selesai Dikerjakan)*
  - Mengubah `bloatCalculator.js` menjadi formula holistik *Heuristic Wellness Score* (0–100) dan *Fluid Balance Pattern*.
  - Menghapus klaim deterministik palsu (*"Chiseled Jawline Mode"* / *"Wajah bengkak 76%"*).
  - Mengganti teks menjadi bahasa probabilistik ilmiah.
  - Memperbarui komponen `DashboardTab.jsx` untuk menampilkan pola harian yang positif & widget rincian gaya hidup.

- [x] **Prioritas 2: Photo Quality & Standardization Engine** *(Selesai Dikerjakan)*
  - Mengimplementasikan `photoStandardizer.js` yang menganalisis luminansi piksel (ITU-R BT.601), kontras, dan ketajaman gambar secara real-time di sisi klien.
  - Menghadirkan panel diagnostik standarisasi foto (*Photo Quality Score %*) sebelum foto disimpan.
  - Menambahkan selector observasi subjektif (*Self-Reported Puffiness*: Segar / Sedikit Sembab / Cukup Sembab) sebagai data *ground-truth* pengguna.
  - Memperbarui skema Dexie DB v4 dengan indeks `photoQualityScore` dan `selfReportedPuffiness`.
  - Merombak tampilan Sebelum/Sesudah dan Galeri menjadi *Appearance Consistency Journal* yang objektif dan bebas klaim semu.

- [x] **Prioritas 3: Personal Baseline & Trend Engine** *(Selesai Dikerjakan)*
  - Mengimplementasikan `baselineEngine.js` untuk menghitung rata-rata personal (air, tidur, gula, kualitas foto) selama 14–30 hari pencatatan.
  - Menghitung perbandingan harian vs acuan pribadi (*Today vs Personal Baseline*).
  - Mengembangkan pendeteksi korelasi empiris antara durasi tidur, hidrasi, dan jadwal makan malam terhadap sensasi fisik wajah yang dilaporkan (*self-reported puffiness*).
  - Mengintegrasikan view switcher *Baseline & Tren* di `DashboardTab.jsx` lengkap dengan tingkat keyakinan (*confidence level*) dan *scientific disclaimer on correlation vs causation*.

- [x] **Prioritas 4: Health Safety Engine untuk GlowAI Coach** *(Selesai Dikerjakan)*
  - Mengimplementasikan `healthSafetyEngine.js` dengan deteksi *Red Flags* (reaksi anafilaksis, asimetri wajah, infeksi/demam nyeri akut, pembengkakan menetap $\ge 3$ hari).
  - Mengintegrasikan *Intent Classification* dan menyisipkan *Medical Escalation Layer* proaktif pada respons online Gemini & respons offline.
  - Memperbarui sistem instruksi prompt Gemini agar bertindak sebagai asisten gaya hidup, tidak membuat klaim diagnosis klinis, dan selalu menyarankan evaluasi dokter saat terdeteksi risiko bahaya.
  - Menghadirkan *Medical Safety Warning Banner* di antarmuka obrolan `GlowAiTab.jsx` dan disclaimer etika medis di bagian bawah.

- [x] **Prioritas 5: Mindful Eating SOS & Healthy Habit Streak** *(Selesai Dikerjakan)*
  - Merombak total `CravingSosModal.jsx` menjadi **Panduan Mindful Eating**: refleksi interaktif mengenali sinyal tubuh (*Lapar Fisik* vs *Dehidrasi/Haus* vs *Stres Emosional* vs *Bosan* vs *Keinginan Manis Disadari*).
  - Menghapus narasi rasa bersalah (*anti-relapse guilt*) dan menggantinya dengan latihan relaksasi pernapasan *Box Breathing (4-4-4)* serta edukasi mencicipi secara sadar (*mindful tasting*).
  - Mengubah algoritma *streak* di `db.js` menjadi **Healthy Habit Consistency Index (7-Day Rolling Consistency)** agar kebiasaan tidak di-reset ke 0 hanya karena satu kali makan manis.
  - Memperbarui tombol dashboard menjadi *Mindful Eating* dan menampilkan lencana *Konsistensi X/7 Hari*.

- [x] **Prioritas 6: Personal Analytics & Correlation Explorer** *(Selesai Dikerjakan)*
  - Mengimplementasikan `analyticsEngine.js` yang menghitung koefisien korelasi Pearson ($r$) secara matematis murni.
  - Memetakan observasi empiris data kebiasaan (Durasi Tidur, Asupan Hidrasi, Jadwal Makan Malam) terhadap skor sembab yang dilaporkan pengguna.
  - Menghadirkan visualisasi interaktif responsive SVG Scatter Plot Studio & garis tren regresi pada tab *Baseline & Tren* di `DashboardTab.jsx`.
  - Dilengkapi disclaimer ilmiah tegas: *"Correlation does not establish causation (Korelasi statistik tidak membuktikan hubungan sebab-akibat langsung)."*

- [x] **Prioritas 7: Native Capacitor Local Notifications** *(Selesai Dikerjakan)*
  - Memasang `@capacitor/local-notifications` dan mengintegrasikannya dengan fallback Web Notification & in-app timer.
  - Mengimplementasikan `scheduleHabitReminders()` di `notificationService.js` untuk menjadwalkan notifikasi berulang di Android/iOS dan PWA.
  - Memperbarui redaksi notifikasi & preset menjadi pesan kesadaran yang santai, mendidik, dan bebas nada menakut-nakuti atau klaim semu rahang tirus.
  - Menghadirkan tombol sinkronisasi jadwal pengingat ke perangkat pada tab *Jadwal & Pengaturan* (`HabitsConfigTab.jsx`).

- [x] **Prioritas 8: Privacy Center & Encrypted Backup** *(Selesai Dikerjakan)*
  - Mengimplementasikan `privacyService.js` berbasis Web Cryptography API (AES-GCM 256-bit + PBKDF2 100.000 iterasi).
  - Menyediakan opsi ekspor cadangan terenkripsi dengan proteksi kata sandi dan pemulihan data (*restore*) yang aman.
  - Memberikan kendali penuh privasi transmisi AI (*Cloud Gemini vs 100% Offline Medical Compendium*).
  - Mengimplementasikan *Right to be Forgotten*: opsi pembersihan riwayat foto biometrik wajah saja atau *reset* total aplikasi dalam satu klik.
  - Mengintegrasikan antarmuka *Pusat Privasi & Data* pada tab konfigurasi (`HabitsConfigTab.jsx`).

- [x] **Prioritas 9: Computer Vision & AI Interpretation** *(Selesai Dikerjakan)*
  - Memperbarui `photoStandardizer.js` dengan kalkulasi simetri pencahayaan lateral (*lateral lighting symmetry*) untuk mendeteksi bayangan samping yang menipu mata.
  - Mengimplementasikan `comparePhotoConsistency()` untuk mengukur tingkat kesetaraan kondisi pemotretan antar dua foto (*Before vs After*).
  - Menghadirkan widget *Konsistensi Kondisi Pemotretan* dan laporan interpretasi ilmiah AI pada slider perbandingan longitudinal (`FaceCameraTab.jsx`).
  - Menegakkan batasan ilmiah ketat: tidak membuat klaim estimasi lemak wajah semu, melainkan mengedukasi peran retensi cairan, gravitasi posisi tidur, dan konsistensi pencahayaan.

---

## 4. Rincian Eksekusi Prioritas 1 (Langkah Pertama)

1. **Perombakan `src/services/bloatCalculator.js`:**
   - Ubah nama dan fungsi kalkulator menjadi `calculateDailyWellnessScore` (tetap menyediakan alias kompatibilitas agar tidak memecah kode lama).
   - Bobot komponen yang seimbang:
     - **Hidrasi (Air Putih):** Menunjang sirkulasi dan homeostasis cairan tubuh.
     - **Pola Nutrisi (Gula Tambahan & Kesadaran Sodium):** Menjaga stabilitas gula darah dan menghindari retensi natrium berlebih.
     - **Kualitas & Durasi Tidur:** Pemulihan biologis dan regulasi hormon kortisol.
     - **Jadwal Waktu Makan (Dinner Curfew):** Memberi jeda bagi lambung dan ginjal sebelum berbaring tidur.
     - **Jadwal Kafein:** Menjaga siklus tidur dalam (*deep sleep*).
     - **Perawatan & Kebiasaan Sehat (Skincare/Relaksasi Wajah & Bebas Asap Rokok):** Mikrosirkulasi dan elastisitas kulit.
   - Output Kategori:
     - `OPTIMAL` (Skor $\ge 80$): *Pola Seimbang & Terjaga Baik 🌱*
     - `BALANCED` (Skor $55 - 79$): *Pola Cukup Baik dengan Ruang Peningkatan ⚖️*
     - `NEEDS_ATTENTION` (Skor $< 55$): *Perlu Istirahat & Hidrasi Ekstra 💧*
   - Narasi deskripsi: Sepenuhnya probabilistik dan mengedukasi kaitan gaya hidup dengan retensi cairan sementara.

2. **Perombakan UI Dashboard (`src/components/DashboardTab.jsx`):**
   - Menghadirkan widget **"Pola Kebugaran & Keseimbangan Cairan Hari Ini"** (*Daily Wellness & Fluid Balance Pattern*).
   - Menampilkan status ringkas (Hidrasi, Waktu Makan, Tidur, Nutrisi) secara positif dan elegan tanpa nuansa menakut-nakuti atau klaim rahang tirus semu.
