/**
 * Privacy & Encrypted Backup Service
 * 
 * Filosofi Privasi & Keamanan:
 * - 100% Offline-First: Foto wajah dan jurnal kesehatan adalah data biometrik/pribadi sensitif.
 * - Menggunakan Web Cryptography API (AES-GCM 256-bit + PBKDF2 100.000 iterasi) untuk enkripsi cadangan.
 * - Pengguna memiliki kontrol penuh atas transmisi data AI (Mode Cloud Gemini vs Mode Offline Lokal).
 * - Hak untuk Dihapus (Right to be Forgotten): Opsi penghapusan foto biometrik atau reset total satu klik.
 */

import { db } from './db';

// Helper: Convert ArrayBuffer to Base64
function bufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper: Convert Base64 to ArrayBuffer
function base64ToBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive AES-GCM Key from User Password using PBKDF2 (100,000 iterations)
async function deriveEncryptionKey(password, salt) {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Enkripsi payload JSON/teks menggunakan AES-GCM 256-bit
 */
export async function encryptDataWithPassword(dataObject, password) {
  if (!password || password.length < 4) {
    throw new Error('Kata sandi enkripsi minimal 4 karakter.');
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveEncryptionKey(password, salt);

  const enc = new TextEncoder();
  const plaintextBuffer = enc.encode(JSON.stringify(dataObject));

  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintextBuffer
  );

  return {
    version: '1.0',
    cipher: 'AES-GCM-256',
    kdf: 'PBKDF2-SHA256-100K',
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    payload: bufferToBase64(cipherBuffer)
  };
}

/**
 * Dekripsi payload terenkripsi menggunakan kata sandi
 */
export async function decryptDataWithPassword(encryptedPackage, password) {
  if (!encryptedPackage || !encryptedPackage.payload || !encryptedPackage.salt || !encryptedPackage.iv) {
    throw new Error('Format paket cadangan terenkripsi tidak valid.');
  }

  const salt = new Uint8Array(base64ToBuffer(encryptedPackage.salt));
  const iv = new Uint8Array(base64ToBuffer(encryptedPackage.iv));
  const cipherBuffer = base64ToBuffer(encryptedPackage.payload);

  const key = await deriveEncryptionKey(password, salt);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBuffer
    );

    const dec = new TextDecoder();
    const jsonString = dec.decode(decryptedBuffer);
    return JSON.parse(jsonString);
  } catch (err) {
    throw new Error('Kata sandi salah atau file cadangan telah rusak.');
  }
}

/**
 * Ekspor seluruh data aplikasi (dengan atau tanpa enkripsi password)
 */
export async function exportFullAppData({ includePhotos = true, password = null }) {
  const habits = await db.dailyHabits.toArray();
  const sugars = await db.sugarLogs.toArray();
  let photos = await db.facePhotos.toArray();
  const settings = await db.appSettings.toArray();
  const chatSessions = await db.chatSessions.toArray();
  const chats = await db.aiChats.toArray();

  if (!includePhotos) {
    // Hilangkan base64 foto besar jika user hanya ingin ekspor ringan
    photos = photos.map(p => {
      const { photoBase64, ...rest } = p;
      return { ...rest, photoStripped: true };
    });
  }

  const dataPackage = {
    appName: 'Healthy Tracker & Wellness Journal',
    appVersion: '2.0.0',
    exportDate: new Date().toISOString(),
    isEncrypted: !!password,
    metrics: {
      habitsCount: habits.length,
      sugarsCount: sugars.length,
      photosCount: photos.length
    },
    data: {
      habits,
      sugars,
      photos,
      settings,
      chatSessions,
      chats
    }
  };

  let fileContent = '';
  let filename = '';

  if (password) {
    const encrypted = await encryptDataWithPassword(dataPackage, password);
    fileContent = JSON.stringify(encrypted, null, 2);
    filename = `HealthyTracker_Encrypted_Backup_${new Date().toISOString().slice(0, 10)}.aes.json`;
  } else {
    fileContent = JSON.stringify(dataPackage, null, 2);
    filename = `HealthyTracker_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  }

  const blob = new Blob([fileContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  return { success: true, filename, isEncrypted: !!password };
}

/**
 * Pulihkan data dari file cadangan JSON atau Terenkripsi
 */
export async function restoreAppDataFromFile(fileContentString, password = null) {
  let parsed = JSON.parse(fileContentString);

  // Jika paket terenkripsi (AES-GCM)
  if (parsed.cipher === 'AES-GCM-256') {
    if (!password) {
      throw new Error('File cadangan ini dilindungi enkripsi. Silakan masukkan kata sandi.');
    }
    parsed = await decryptDataWithPassword(parsed, password);
  }

  if (!parsed.data || !parsed.appName) {
    throw new Error('Struktur file cadangan tidak dikenali.');
  }

  const { habits = [], sugars = [], photos = [], settings = [], chatSessions = [], chats = [] } = parsed.data;

  // Restore ke IndexedDB
  if (habits.length > 0) {
    await db.dailyHabits.bulkPut(habits);
  }
  if (sugars.length > 0) {
    await db.sugarLogs.bulkPut(sugars);
  }
  if (photos.length > 0) {
    await db.facePhotos.bulkPut(photos);
  }
  if (settings.length > 0) {
    await db.appSettings.bulkPut(settings);
  }
  if (chatSessions.length > 0) {
    await db.chatSessions.bulkPut(chatSessions);
  }
  if (chats.length > 0) {
    await db.aiChats.bulkPut(chats);
  }

  return {
    success: true,
    habitsRestored: habits.length,
    sugarsRestored: sugars.length,
    photosRestored: photos.length
  };
}

/**
 * Hapus seluruh foto biometrik wajah (Right to be Forgotten)
 */
export async function purgeAllFacePhotos() {
  await db.facePhotos.clear();
  return { success: true };
}

/**
 * Reset total semua data aplikasi kembali ke nol
 */
export async function purgeEntireDatabase() {
  await db.dailyHabits.clear();
  await db.sugarLogs.clear();
  await db.facePhotos.clear();
  await db.aiChats.clear();
  await db.chatSessions.clear();
  return { success: true };
}

/**
 * Preferensi Transmisi Privasi AI
 */
export async function getAiCloudPrivacyPreference() {
  const item = await db.appSettings.get('allowCloudAiTransmission');
  return item ? Boolean(item.value) : true; // Default true (Gemini online aktif)
}

export async function setAiCloudPrivacyPreference(allow) {
  await db.appSettings.put({ key: 'allowCloudAiTransmission', value: Boolean(allow) });
}
