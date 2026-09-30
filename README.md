# GlowSculpt - Sugar Detox & Face Slimming App

Aplikasi cerdas untuk transformasi penirusan wajah, bebas sembab (*debloat*), dan *cut* gula rafinasi dengan integrasi **GlowAI Coach**.

---

## 🚀 Cara Menjalankan di Laptop (Preview Instan)

Server saat ini sudah aktif dan berjalan! Anda bisa langsung buka di browser:
- **Di Laptop ini**: [http://localhost:5180/](http://localhost:5180/)
- **Di HP Anda (yang terhubung Wi-Fi yang sama)**: [http://192.168.10.197:5180/](http://192.168.10.197:5180/)

Jika nanti ingin menjalankan ulang dari terminal:
```bash
npm run dev
```

---

## 📱 Cara Membuka & Memasang di HP Android

### Cara 1: Buka via Wi-Fi Lokal (Paling Cepat Tanpa Install)
1. Pastikan HP Android dan Laptop terhubung ke **Wi-Fi yang sama**.
2. Buka browser **Google Chrome** di HP Anda, lalu ketik alamat:
   ```
   http://192.168.10.197:5180/
   ```
3. Di Chrome HP, tap **Titik Tiga di pojok kanan atas** $\rightarrow$ pilih **"Tambahkan ke Layar Utama" (Add to Home Screen)**.
4. Aplikasi akan langsung muncul di menu HP Anda dengan ikon GlowSculpt seperti aplikasi native!

---

### Cara 2: Online-kan ke Internet (Bisa Diakses dari Mana Saja)
1. Deploy folder ini ke **Vercel** atau **Netlify** (gratis):
   ```bash
   npx vercel
   ```
   atau drag & drop folder `dist/` ke [app.netlify.com/drop](https://app.netlify.com/drop).
2. Anda akan mendapatkan link website online (contoh: `https://glowsculpt.vercel.app`).
3. Buka link tersebut di HP mana saja dan pasang ke Home Screen.

---

### Cara 3: Build Menjadi File APK Android Native (.apk)
Aplikasi ini sudah dilengkapi **Capacitor Android**. Untuk mem-build file `.apk`:
```bash
# 1. Build aset web terbaru
npm run build

# 2. Tambahkan platform Android
npx cap add android

# 3. Buka di Android Studio
npx cap open android
```
Di Android Studio, pilih menu **Build > Build Bundle(s) / APK(s) > Build APK(s)** $\rightarrow$ file `app-debug.apk` siap diinstall di HP Android!

---

## 💎 Fitur Unggulan

1. **Dashboard (Glow Hub)**:
   - Indeks Resiko Sembab Wajah (Face Bloat Risk Gauge 0-100%).
   - Penghitung Streak Cut Gula (No Sugar Counter).
   - Hydro-Flush Tracker (Animasi air dengan tombol quick-add).
   - Checklist kebiasaan harian (Skincare AM/PM, Kopi, Jadwal Makan).
2. **Face Diary & Transformation**:
   - Kamera selfie harian dengan **Face Oval & Jawline Alignment Guide Overlay**.
   - **Split Before/After Comparison Slider** untuk melihat perubahan garis rahang dari Hari Pertama vs Hari Ini.
   - Galeri linimasa perkembangan wajah.
3. **GlowAI Personal Coach**:
   - Chat konsultasi makanan, minuman, dan tips penirusan wajah.
   - **Kamus Makanan Tirus**: 120+ makanan Indonesia & internasional dengan lampu indikator Hijau / Kuning / Merah.
   - Mendukung Google Gemini API Key opsional untuk jawaban berbasis generative AI.
4. **Craving SOS & Pijat Gua Sha**:
   - Countdown timer 10 menit + Box Breathing untuk menahan nafsu manis.
   - Panduan interaktif 5 langkah pijat wajah drainase limfatik.
5. **Smart Habits & Alarms**:
   - Pengaturan jam tidur, makan malam, skincare, dan batas kopi jam 14.00.
   - Uji coba simulasi audio chime & notifikasi layar.
