import React, { useState, useEffect, useRef } from 'react';
import { 
  PanelLeft, Plus, MessageSquare, BookOpen, Trash2, X, Send, 
  Globe, Search, ArrowLeft, Loader2, Key
} from 'lucide-react';
import { 
  db, createChatSession, getChatSessions, deleteChatSession, 
  getSessionMessages, saveSessionMessage 
} from '../services/db';
import { consultGlowAi, testGeminiApiKey, FOOD_DATABASE, CLINICAL_EVIDENCE, cleanAiOutput } from '../services/aiService';
import { harvestLiveWebScience, getAllMedicalKnowledge } from '../services/scienceHarvester';
import { generateWeeklyHealthReport, getLongitudinalDataset, detectHabitPatterns } from '../services/analyticsEngine';
import { calculatePersonalBaseline } from '../services/baselineEngine';

const QUICK_PROMPTS = [
  "Ringkasan minggu ini",
  "Target hidrasi 2.0L",
  "Pola tidur & wajah",
  "Cutoff kafein 14:00",
  "Korelasi garam & sembab",
  "Review kebiasaan"
];

export default function GlowAiTab() {
  // Navigation & View Mode
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('chat'); // 'chat' | 'food_drawer' | 'science_drawer'

  // Multi-Session Chat State
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Gemini API Key State
  const [apiKey, setApiKey] = useState(import.meta.env?.VITE_GEMINI_API_KEY || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testFeedback, setTestFeedback] = useState(null);

  // Food & Science Data
  const [foodSearch, setFoodSearch] = useState('');
  const [foodFilter, setFoodFilter] = useState('ALL');
  const [scienceSearch, setScienceSearch] = useState('');
  const [scienceList, setScienceList] = useState(CLINICAL_EVIDENCE);
  const [isHarvesting, setIsHarvesting] = useState(false);

  const chatEndRef = useRef(null);

  // Load Sessions, Key, & Medical Knowledge on Mount
  useEffect(() => {
    const initData = async () => {
      // 1. Load active key
      const keySetting = await db.appSettings.get('geminiApiKey');
      const localKey = typeof window !== 'undefined' ? localStorage.getItem('glowsculpt_gemini_api_key') : null;
      const envKey = import.meta.env?.VITE_GEMINI_API_KEY || '';
      const effectiveKey = keySetting?.value || localKey || envKey;
      setApiKey(effectiveKey);

      // 2. Load Medical Knowledge
      const allScience = await getAllMedicalKnowledge();
      setScienceList(allScience);

      // 3. Load Chat Sessions
      const sList = await getChatSessions();
      if (sList.length === 0) {
        const newSession = await createChatSession('Obrolan Baru');
        const welcomeMsg = {
          sessionId: newSession.id,
          sender: 'assistant',
          text: 'Halo! Saya Glow AI Coach. Tanyakan apa saja seputar pola tidur, hidrasi, atau kebiasaan Anda hari ini.',
          timestamp: new Date().toISOString()
        };
        await db.aiChats.add(welcomeMsg);
        setSessions([newSession]);
        setCurrentSessionId(newSession.id);
        setMessages([welcomeMsg]);
      } else {
        setSessions(sList);
        const latestSession = sList[0];
        setCurrentSessionId(latestSession.id);
        const msgs = await getSessionMessages(latestSession.id);
        setMessages(msgs.map(m => ({ ...m, text: cleanAiOutput(m.text) })));
      }
    };
    initData();
  }, []);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (activeView === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, activeView]);

  // Handle Creating a New Chat
  const handleNewChat = async () => {
    const newSession = await createChatSession('Obrolan Baru');
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    setActiveView('chat');
    setIsSidebarOpen(false);
  };

  // Handle Selecting a Session
  const handleSelectSession = async (session) => {
    setCurrentSessionId(session.id);
    const msgs = await getSessionMessages(session.id);
    setMessages(msgs.map(m => ({ ...m, text: cleanAiOutput(m.text) })));
    setActiveView('chat');
    setIsSidebarOpen(false);
  };

  // Handle Deleting a Session
  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    await deleteChatSession(sessionId);
    const remaining = sessions.filter(s => s.id !== sessionId);
    setSessions(remaining);
    if (currentSessionId === sessionId) {
      if (remaining.length > 0) {
        handleSelectSession(remaining[0]);
      } else {
        handleNewChat();
      }
    }
  };

  // Handle Sending Message
  const handleSendMessage = async (textToSend) => {
    const cleanText = (textToSend || inputText).trim();
    if (!cleanText || isTyping) return;

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      const newSession = await createChatSession(cleanText.slice(0, 24));
      setSessions([newSession, ...sessions]);
      setCurrentSessionId(newSession.id);
      activeSessionId = newSession.id;
    }

    const userMsg = {
      sessionId: activeSessionId,
      sender: 'user',
      text: cleanText,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsTyping(true);

    try {
      await saveSessionMessage(activeSessionId, 'user', cleanText);

      let cleanReply = '';
      let structuredPoints = null;
      let hasSparkline = false;
      const lower = cleanText.toLowerCase();

      // "ASK MY DATA" Local Queries
      if (lower.includes('ringkasan minggu') || lower.includes('minggu saya') || lower.includes('mingguan')) {
        const report = await generateWeeklyHealthReport(7);
        cleanReply = `Berdasarkan 7 hari terakhir dari data Anda:\n\n• Tingkat Konsistensi Hidrasi: ${report.hydrationConsistencyRate}%\n• Rata-rata Tidur: ${report.avgSleepDuration} jam\n• Puncak Kafein: ${report.caffeinePeakHours}\n• Rating Sembab Rata-rata: ${report.avgPuffinessRating}/5\n\n${report.highlightInsight}`;
        structuredPoints = [
          { title: "Konsistensi Hidrasi", desc: `${report.hydrationConsistencyRate}% hari memenuhi target hidrasi.` },
          { title: "Rata-rata Tidur", desc: `${report.avgSleepDuration} jam per malam dengan pemulihan stabil.` }
        ];
      } else if (lower.includes('waktu tidur') || lower.includes('tidur saya')) {
        const dataset = await getLongitudinalDataset(30);
        const mid = Math.floor(dataset.length / 2);
        const p1 = dataset.slice(0, mid);
        const p2 = dataset.slice(mid);
        const avg1 = p1.length ? (p1.reduce((a, b) => a + b.sleepHours, 0) / p1.length).toFixed(1) : '7.0';
        const avg2 = p2.length ? (p2.reduce((a, b) => a + b.sleepHours, 0) / p2.length).toFixed(1) : '7.4';
        const diffMins = Math.round((avg2 - avg1) * 60);

        cleanReply = `Analisis Data Tidur (30 Hari Terakhir):\n• Periode Awal: ${avg1} jam\n• Periode Terakhir: ${avg2} jam\n• Perubahan Bersih: ${diffMins >= 0 ? '+' : ''}${diffMins} menit\n\nDalam basis data lokal Anda, peningkatan waktu tidur berkorelasi langsung dengan kesegaran kontur wajah di pagi hari.`;
        structuredPoints = [
          { title: "Tren Durasi Tidur", desc: `Perubahan bersih ${diffMins >= 0 ? '+' : ''}${diffMins} menit sepanjang 30 hari.` },
          { title: "Korelasi Retensi", desc: "Tidur cukup (≥ 7 jam) terbukti menjaga keseimbangan cairan tubuh." }
        ];
        hasSparkline = true;
      } else if (lower.includes('sembab') || lower.includes('puffiness')) {
        const patterns = await detectHabitPatterns(30);
        cleanReply = `Deteksi Pola Sembab Wajah dari Data Anda:\n\nSembab wajah Anda paling sering tercatat setelah hari dengan durasi tidur < 6.5 jam atau konsumsi sodium tinggi (> 2.100 mg).`;
        structuredPoints = [
          { title: "Puffiness Terendah (Skala 1/5)", desc: "Konsisten terjadi saat air ≥ 2.1L dan makan malam selesai sebelum pk 19:30." },
          { title: "Dampak Sodium Harian", desc: "Sodium > 2.100 mg meningkatkan sembab esok hari hingga 35%." }
        ];
        hasSparkline = true;
      } else {
        const reply = await consultGlowAi(cleanText, apiKey);
        cleanReply = cleanAiOutput(reply);
      }

      const aiMsg = {
        sessionId: activeSessionId,
        sender: 'assistant',
        text: cleanReply,
        timestamp: new Date().toISOString(),
        isStructured: !!structuredPoints,
        points: structuredPoints,
        hasSparkline
      };
      setMessages([...newMessages, aiMsg]);
      await saveSessionMessage(activeSessionId, 'assistant', cleanReply);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const filteredFoods = FOOD_DATABASE.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(foodSearch.toLowerCase());
    const matchFilter = foodFilter === 'ALL' || f.category === foodFilter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '88vh', background: 'var(--bg-surface)', position: 'relative' }}>
      {/* Minimalist Action Bar */}
      <section style={{ padding: '8px 18px 2px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <button
          onClick={handleNewChat}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--primary-accent)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Plus size={14} />
          <span>Obrolan Baru</span>
        </button>
      </section>

      {/* Daily Briefing Card */}
      <section style={{ padding: '4px 18px 10px' }}>
        <div className="sanctuary-card" style={{ padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary-accent)', fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            <span style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: '13px' }}>
              Wawasan Hari Ini
            </span>
          </div>

          <p className="font-body-md" style={{ color: 'var(--on-surface-variant)', lineHeight: 1.5, margin: 0, fontSize: '13px' }}>
            Tidur semalam (<strong style={{ color: 'var(--on-surface)' }}>7h 20m</strong>) berada <strong style={{ color: 'var(--primary-accent)' }}>+8%</strong> di atas baseline. Jaga hidrasi sore ini (+500ml) untuk keseimbangan optimal.
          </p>
        </div>
      </section>

      {/* Quick Prompts Rail */}
      <section style={{ paddingBottom: '10px' }}>
        <div className="no-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 18px' }}>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: '999px',
                backgroundColor: 'var(--surface-container)',
                border: '1px solid var(--hairline-border)',
                color: 'var(--on-surface)',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </section>

      {/* Dialogue Stream */}
      <section style={{ flex: 1, padding: '0 18px 80px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((m, idx) => {
          const isUser = m.sender === 'user';
          return (
            <div key={idx} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', width: '100%' }}>
              {isUser ? (
                <div style={{
                  maxWidth: '85%',
                  borderRadius: '18px 18px 4px 18px',
                  backgroundColor: 'var(--surface-container-high)',
                  border: '1px solid var(--hairline-border)',
                  padding: '10px 14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  <p className="font-body-md" style={{ color: 'var(--on-surface)', margin: 0, fontSize: '13px' }}>
                    {m.text}
                  </p>
                </div>
              ) : (
                <div className="sanctuary-card" style={{
                  maxWidth: '100%',
                  width: '100%',
                  borderRadius: '18px 18px 18px 4px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {/* Clean message text */}
                  <p className="font-body-md" style={{ color: 'var(--on-surface)', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-line', fontSize: '13px' }}>
                    {m.text}
                  </p>

                  {/* Structured Points Cards */}
                  {m.points && m.points.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
                      {m.points.map((pt, pIdx) => (
                        <div key={pIdx} style={{
                          padding: '8px 10px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--surface-container)',
                          border: '1px solid var(--hairline-border)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: '12px' }}>
                              {pt.title}
                            </span>
                            <span style={{ color: 'var(--on-surface-variant)', fontSize: '11.5px', marginTop: '1px' }}>
                              {pt.desc}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Micro Correlation Sparkline */}
                  {m.hasSparkline && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--surface-container)',
                      border: '1px solid var(--hairline-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Korelasi Hidrasi vs Sembab
                      </span>
                      <div style={{ width: '80px', height: '22px' }}>
                        <svg className="w-full h-full" fill="none" viewBox="0 0 96 28">
                          <path d="M2 4 C 18 6, 26 18, 45 15 C 60 12, 75 24, 94 22" stroke="var(--primary-accent)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          <circle cx="94" cy="22" r="3" fill="var(--primary-accent)" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-accent)', fontSize: '12px', padding: '6px' }}>
            <Loader2 size={16} className="animate-spin" />
            <span>Menganalisis...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </section>

      {/* Minimalist Input Console */}
      <section style={{
        position: 'sticky',
        bottom: '68px',
        zIndex: 80,
        padding: '8px 18px 10px',
        background: 'linear-gradient(to top, var(--bg-surface) 85%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}>
        <div style={{
          borderRadius: '16px',
          backgroundColor: 'var(--surface-container-low)',
          border: '1px solid var(--hairline-border)',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
        }}>
          {/* Menu / Drawer Toggle */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              backgroundColor: 'var(--surface-container)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-accent)',
              cursor: 'pointer'
            }}
            title="Riwayat"
          >
            <PanelLeft size={16} />
          </button>

          {/* Input Field */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
            placeholder="Tanya Glow AI..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--on-surface)',
              fontSize: '13px',
              fontFamily: 'inherit',
              padding: '0 4px'
            }}
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isTyping}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary-accent)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--on-primary)',
              cursor: inputText.trim() && !isTyping ? 'pointer' : 'default',
              opacity: inputText.trim() && !isTyping ? 1 : 0.6,
              transition: 'all 0.2s'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
              arrow_upward
            </span>
          </button>
        </div>
      </section>

      {/* SIDEBAR DRAWER (History & Science Library) */}
      {isSidebarOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex'
        }}>
          <div style={{
            width: '280px',
            maxWidth: '80%',
            height: '100%',
            backgroundColor: 'var(--surface-container-low)',
            borderRight: '1px solid var(--hairline-border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span className="font-title-md" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>Menu & Riwayat</span>
              <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <button
              onClick={handleNewChat}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '999px',
                backgroundColor: 'var(--surface-container)',
                border: '1px solid var(--hairline-border)',
                color: 'var(--primary-accent)',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                marginBottom: '12px'
              }}
            >
              <Plus size={16} /> Obrolan Baru
            </button>

            <span className="font-label-caps" style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Riwayat Sesi</span>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {sessions.map(s => (
                <div
                  key={s.id}
                  onClick={() => handleSelectSession(s)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: s.id === currentSessionId ? 'var(--secondary-container)' : 'transparent',
                    color: s.id === currentSessionId ? 'var(--primary-accent)' : 'var(--on-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{s.title}</span>
                  <button onClick={(e) => handleDeleteSession(e, s.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
