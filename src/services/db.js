import Dexie from 'dexie';

export const db = new Dexie('GlowSculptDB');

// Define database schema versions
db.version(1).stores({
  sugarLogs: '++id, date, name, grams, isCheat, createdAt',
  dailyHabits: 'date, waterMl, sleepHours, skincareAm, skincarePm, lastCoffeeTime, dinnerTime',
  facePhotos: '++id, date, bloatScore, rating, createdAt',
  aiChats: '++id, sender, timestamp',
  appSettings: 'key'
});

db.version(2).stores({
  medicalKnowledge: '++id, topic, source, domain, timestamp'
});

db.version(3).stores({
  chatSessions: 'id, title, createdAt, updatedAt',
  aiChats: '++id, sessionId, sender, timestamp'
});

db.version(4).stores({
  facePhotos: '++id, date, photoQualityScore, selfReportedPuffiness, createdAt'
});

db.version(5).stores({
  nutritionLogs: '++id, date, mealType, name, sugarGrams, sodiumMg, calories, servingSize, createdAt',
  activityLogs: '++id, date, type, minutes, steps, intensity, createdAt',
  caffeineLogs: '++id, date, type, servings, time, mg, createdAt'
});

// Helper for formatted date key: YYYY-MM-DD
export function getTodayKey(offsetDays = 0) {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() - offsetDays);
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Initial settings & demo longitudinal seed
export async function initDbDefaults() {
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';
  const defaultKey = envKey || (typeof window !== 'undefined' && localStorage.getItem('glowsculpt_gemini_api_key')) || '';
  const currentKey = await db.appSettings.get('geminiApiKey');
  if (!currentKey || !currentKey.value) {
    if (defaultKey) {
      await db.appSettings.put({ key: 'geminiApiKey', value: defaultKey });
      if (typeof window !== 'undefined') {
        localStorage.setItem('glowsculpt_gemini_api_key', defaultKey);
      }
    }
  }

  const targetWater = await db.appSettings.get('targetWaterMl');
  if (!targetWater) {
    await db.appSettings.bulkPut([
      { key: 'targetWaterMl', value: 2500 },
      { key: 'maxSugarGrams', value: 25 },
      { key: 'maxSodiumMg', value: 2000 },
      { key: 'targetActivityMinutes', value: 30 },
      { key: 'maxCigarettes', value: 3 },
      { key: 'targetVitaminCMg', value: 100 },
      { key: 'targetSleepHours', value: 8 },
      { key: 'sleepReminderTime', value: '22:30' },
      { key: 'dinnerCurfewTime', value: '19:30' },
      { key: 'coffeeCurfewTime', value: '14:00' },
      { key: 'skincareAmTime', value: '07:30' },
      { key: 'skincarePmTime', value: '21:30' },
      { key: 'notifWaterInterval', value: 2 },
      { key: 'notifEarlyWarning', value: true },
      { key: 'notifSoundTone', value: 'zen' },
      { key: 'geminiApiKey', value: defaultKey },
      { key: 'userName', value: 'Sobat Glow' },
      { key: 'personalGoals', value: JSON.stringify(['sleep', 'hydration', 'nutrition', 'activity', 'photo']) }
    ]);
  } else {
    // Ensure new settings keys exist
    const checkSod = await db.appSettings.get('maxSodiumMg');
    if (!checkSod) await db.appSettings.put({ key: 'maxSodiumMg', value: 2000 });
    const checkAct = await db.appSettings.get('targetActivityMinutes');
    if (!checkAct) await db.appSettings.put({ key: 'targetActivityMinutes', value: 30 });
    const checkGoals = await db.appSettings.get('personalGoals');
    if (!checkGoals) await db.appSettings.put({ key: 'personalGoals', value: JSON.stringify(['sleep', 'hydration', 'nutrition', 'activity', 'photo']) });
  }

  // Ensure today's habit record exists
  const today = getTodayKey();
  const existingHabit = await db.dailyHabits.get(today);
  if (!existingHabit) {
    await db.dailyHabits.put({
      date: today,
      waterMl: 0,
      sodiumMg: 0,
      activityMinutes: 0,
      caffeineServings: 0,
      cigarettes: 0,
      vitaminCMg: 0,
      sleepHours: 7.5,
      sleepTime: '23:00',
      wakeTime: '06:30',
      isSleeping: false,
      sleepStartTime: '',
      skincareAm: false,
      skincarePm: false,
      lastCoffeeTime: '',
      dinnerTime: '19:00',
      mood: 'energized',
      notes: ''
    });
  }

  // Seed realistic historical data (last 21 days) if database is relatively empty
  // Allows user to immediately experience Heatmap, 30-Day Journey, and Analytics
  const totalHabits = await db.dailyHabits.count();
  if (totalHabits < 4) {
    await seedRealisticLongitudinalData();
  }
}

// Seed 21 days of realistic healthy data for initial delight
async function seedRealisticLongitudinalData() {
  const habitsToSeed = [];
  const sugarsToSeed = [];
  const nutritionToSeed = [];
  const activityToSeed = [];
  const caffeineToSeed = [];
  const photosToSeed = [];

  const now = new Date();

  for (let i = 1; i <= 21; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Randomize slightly around healthy realistic targets
    const water = 1600 + Math.floor(Math.sin(i) * 600 + 400); // 1600 - 2600ml
    const sleep = parseFloat((6.5 + (i % 3) * 0.5 + Math.random() * 0.4).toFixed(1)); // 6.5 - 8.0 jam
    const sodium = 1200 + Math.floor(Math.cos(i) * 400 + 300); // 1100 - 1900mg
    const activity = 20 + ((i * 7) % 35); // 20 - 55 menit
    const caffeine = (i % 2 === 0) ? 1 : 2;
    const mood = i % 3 === 0 ? 'energized' : i % 2 === 0 ? 'calm' : 'tired';

    habitsToSeed.push({
      date: dateStr,
      waterMl: water,
      sodiumMg: sodium,
      activityMinutes: activity,
      caffeineServings: caffeine,
      cigarettes: 0,
      vitaminCMg: 100,
      sleepHours: sleep,
      sleepTime: '23:00',
      wakeTime: '06:30',
      skincareAm: true,
      skincarePm: true,
      lastCoffeeTime: '13:30',
      dinnerTime: '19:15',
      mood
    });

    // Meal records
    nutritionToSeed.push({
      date: dateStr,
      mealType: 'Lunch',
      name: 'Salad Dada Ayam & Sayur Segar',
      sugarGrams: 4,
      sodiumMg: 450,
      calories: 380,
      servingSize: '1 porsi',
      createdAt: `${dateStr}T12:30:00.000Z`
    });

    sugarsToSeed.push({
      date: dateStr,
      name: 'Buah Pepaya / Jeruk',
      grams: 8,
      isCheat: false,
      createdAt: `${dateStr}T15:00:00.000Z`
    });

    activityToSeed.push({
      date: dateStr,
      type: 'Jalan Santai / Kardio Ringan',
      minutes: activity,
      steps: activity * 120,
      intensity: 'moderate',
      createdAt: `${dateStr}T07:15:00.000Z`
    });

    caffeineToSeed.push({
      date: dateStr,
      type: 'Americano Dingin',
      servings: caffeine,
      time: '10:00',
      mg: caffeine * 85,
      createdAt: `${dateStr}T10:00:00.000Z`
    });

    // Seed photos every 3-4 days
    if (i % 4 === 0 || i === 1 || i === 21) {
      const puffScore = sleep >= 7.5 ? 'none' : sleep < 6.8 ? 'noticeable' : 'mild';
      photosToSeed.push({
        date: dateStr,
        photoQualityScore: 88 + (i % 8),
        selfReportedPuffiness: puffScore,
        lightingScore: 86 + (i % 6),
        contrastScore: 82 + (i % 5),
        createdAt: `${dateStr}T07:00:00.000Z`,
        notes: `Jurnal visual hari ke-${i}`
      });
    }
  }

  await db.dailyHabits.bulkPut(habitsToSeed);
  await db.sugarLogs.bulkPut(sugarsToSeed);
  await db.nutritionLogs.bulkPut(nutritionToSeed);
  await db.activityLogs.bulkPut(activityToSeed);
  await db.caffeineLogs.bulkPut(caffeineToSeed);
  await db.facePhotos.bulkPut(photosToSeed);
}

// ----------------------------------------------------
// SMART HABIT QUICK LOGGERS
// ----------------------------------------------------

export async function logQuickWater(amountMl, date = getTodayKey()) {
  const habit = (await db.dailyHabits.get(date)) || { date, waterMl: 0 };
  const newAmount = Math.max(0, (habit.waterMl || 0) + Number(amountMl));
  await db.dailyHabits.put({ ...habit, date, waterMl: newAmount });
  return newAmount;
}

export async function logQuickMeal({ mealType = 'Lunch', name = 'Makanan Sehat', sugarGrams = 0, sodiumMg = 0, calories = 0, servingSize = '1 porsi', date = getTodayKey() }) {
  const entry = {
    date,
    mealType,
    name,
    sugarGrams: Number(sugarGrams) || 0,
    sodiumMg: Number(sodiumMg) || 0,
    calories: Number(calories) || 0,
    servingSize,
    createdAt: new Date().toISOString()
  };
  await db.nutritionLogs.add(entry);

  if (entry.sugarGrams > 0) {
    await db.sugarLogs.add({
      date,
      name,
      grams: entry.sugarGrams,
      isCheat: false,
      createdAt: entry.createdAt
    });
  }

  // Update daily habit totals
  const habit = (await db.dailyHabits.get(date)) || { date };
  const currentSodium = Number(habit.sodiumMg || 0);
  await db.dailyHabits.put({
    ...habit,
    date,
    sodiumMg: currentSodium + entry.sodiumMg
  });

  return entry;
}

export async function logQuickCaffeine({ type = 'Kopi Hitam / Americano', servings = 1, time = '10:00', mg = 85, date = getTodayKey() }) {
  const entry = {
    date,
    type,
    servings: Number(servings) || 1,
    time,
    mg: Number(mg) || 85,
    createdAt: new Date().toISOString()
  };
  await db.caffeineLogs.add(entry);

  const habit = (await db.dailyHabits.get(date)) || { date };
  await db.dailyHabits.put({
    ...habit,
    date,
    lastCoffeeTime: time,
    caffeineServings: (habit.caffeineServings || 0) + entry.servings
  });
  return entry;
}

export async function logQuickActivity({ type = 'Jalan Santai', minutes = 30, steps = 3000, intensity = 'moderate', date = getTodayKey() }) {
  const entry = {
    date,
    type,
    minutes: Number(minutes) || 30,
    steps: Number(steps) || 0,
    intensity,
    createdAt: new Date().toISOString()
  };
  await db.activityLogs.add(entry);

  const habit = (await db.dailyHabits.get(date)) || { date };
  const currentMinutes = Number(habit.activityMinutes || 0);
  await db.dailyHabits.put({
    ...habit,
    date,
    activityMinutes: currentMinutes + entry.minutes
  });
  return entry;
}

export async function logQuickSleep({ sleepTime = '23:00', wakeTime = '06:30', sleepHours = 7.5, date = getTodayKey() }) {
  const habit = (await db.dailyHabits.get(date)) || { date };
  await db.dailyHabits.put({
    ...habit,
    date,
    sleepTime,
    wakeTime,
    sleepHours: Number(sleepHours) || 7.5
  });
  return { sleepTime, wakeTime, sleepHours };
}

export async function logQuickMood(mood, date = getTodayKey()) {
  const habit = (await db.dailyHabits.get(date)) || { date };
  await db.dailyHabits.put({
    ...habit,
    date,
    mood
  });
  return mood;
}

// ----------------------------------------------------
// CONSISTENCY CALCULATORS
// ----------------------------------------------------

export async function calculateHabitConsistency(days = 7) {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dates.push(key);
  }

  const habits = await db.dailyHabits.where('date').anyOf(dates).toArray();
  const sugars = await db.sugarLogs.where('date').anyOf(dates).toArray();
  const settings = await db.appSettings.get('maxSugarGrams');
  const maxSugar = settings?.value || 25;

  let consistentDays = 0;
  dates.forEach(dateStr => {
    const h = habits.find(x => x.date === dateStr);
    const s = sugars.filter(x => x.date === dateStr);
    const sugarTotal = s.reduce((acc, curr) => acc + Number(curr.grams || 0), 0);

    const hasWater = (h?.waterMl || 0) >= 1200;
    const hasSleep = (h?.sleepHours || 0) >= 6;
    const hasControlledSugar = sugarTotal <= maxSugar * 1.5;

    if (hasWater || hasSleep || (h && hasControlledSugar)) {
      consistentDays++;
    }
  });

  const rate = Math.round((consistentDays / days) * 100);
  return {
    consistentDays,
    totalDays: days,
    rate,
    label: `${consistentDays}/${days} Hari Konsisten`
  };
}

export async function calculateSugarStreak() {
  const consistency = await calculateHabitConsistency(7);
  return consistency.consistentDays || 1;
}

// ----------------------------------------------------
// CHAT SESSION STORAGE
// ----------------------------------------------------

export async function createChatSession(title = 'Percakapan Baru') {
  const sessionId = 'session_' + Date.now();
  const session = {
    id: sessionId,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await db.chatSessions.put(session);
  return session;
}

export async function getChatSessions() {
  const sessions = await db.chatSessions.toArray();
  return sessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export async function deleteChatSession(sessionId) {
  await db.chatSessions.delete(sessionId);
  await db.aiChats.where('sessionId').equals(sessionId).delete();
}

export async function getSessionMessages(sessionId) {
  return await db.aiChats.where('sessionId').equals(sessionId).toArray();
}

export async function saveSessionMessage(sessionId, sender, text) {
  const msg = {
    sessionId,
    sender,
    text,
    timestamp: new Date().toISOString()
  };
  await db.aiChats.add(msg);

  const session = await db.chatSessions.get(sessionId);
  if (session) {
    const updateObj = { updatedAt: new Date().toISOString() };
    if ((session.title === 'Percakapan Baru' || session.title === 'Obrolan Baru') && sender === 'user') {
      updateObj.title = text.length > 26 ? text.substring(0, 26) + '...' : text;
    }
    await db.chatSessions.update(sessionId, updateObj);
  }
  return msg;
}
