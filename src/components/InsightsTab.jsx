import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Activity, Calendar, Award, Sparkles, Filter, Info,
  ChevronRight, ArrowUpRight, ArrowDownRight, Compass, ShieldAlert,
  BarChart3, CheckCircle2, Moon, Droplets, Zap, Coffee
} from 'lucide-react';
import {
  getDynamicCorrelation,
  detectHabitPatterns,
  generateWeeklyHealthReport,
  generateMonthlyJourneyReport,
  getCalendarHeatmapMatrix
} from '../services/analyticsEngine';

const X_METRICS = ['Sleep', 'Water', 'Sodium', 'Sugar', 'Caffeine', 'Dinner time', 'Activity'];
const Y_METRICS = ['Self-reported puffiness', 'Wellness score', 'Sleep quality', 'Energy'];

export const X_METRIC_LABELS = {
  'Sleep': 'Durasi Tidur (Jam)',
  'Water': 'Asupan Air Putih (Liter)',
  'Sodium': 'Kadar Garam/Sodium (mg)',
  'Sugar': 'Kadar Gula (gram)',
  'Caffeine': 'Porsi Kafein (Cangkir)',
  'Dinner time': 'Jam Makan Malam Terakhir',
  'Activity': 'Durasi Aktivitas Fisik (Menit)'
};

export const Y_METRIC_LABELS = {
  'Self-reported puffiness': 'Tingkat Sembab Wajah (Skala 1-5)',
  'Wellness score': 'Skor Kebugaran Harian',
  'Sleep quality': 'Kualitas Tidur',
  'Energy': 'Tingkat Energi'
};
const TIMEFRAMES = [
  { days: 7, label: '7 Hari' },
  { days: 14, label: '14 Hari' },
  { days: 30, label: '30 Hari' },
  { days: 90, label: '90 Hari' }
];

export default function InsightsTab() {
  const [activeSubTab, setActiveSubTab] = useState('correlation'); // 'correlation' | 'weekly' | 'monthly' | 'heatmap'

  // Correlation Explorer State
  const [xMetric, setXMetric] = useState('Sleep');
  const [yMetric, setYMetric] = useState('Self-reported puffiness');
  const [timeframe, setTimeframe] = useState(30);
  const [correlationData, setCorrelationData] = useState(null);
  const [patterns, setPatterns] = useState([]);
  const [loadingCorrelation, setLoadingCorrelation] = useState(true);

  // Weekly Report State
  const [weeklyReport, setWeeklyReport] = useState(null);

  // Monthly Report State
  const [monthlyReport, setMonthlyReport] = useState(null);

  // Heatmap State
  const [heatmapMetric, setHeatmapMetric] = useState('Overall');
  const [heatmapData, setHeatmapData] = useState(null);

  // Load all reports on mount and when parameters change
  useEffect(() => {
    loadCorrelation();
    loadWeekly();
    loadMonthly();
    loadHeatmap();
  }, [timeframe, xMetric, yMetric]);

  useEffect(() => {
    loadHeatmap();
  }, [heatmapMetric]);

  const loadCorrelation = async () => {
    setLoadingCorrelation(true);
    try {
      const data = await getDynamicCorrelation({ xMetric, yMetric, days: timeframe });
      const detected = await detectHabitPatterns(timeframe);
      setCorrelationData(data);
      setPatterns(detected);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCorrelation(false);
    }
  };

  const loadWeekly = async () => {
    try {
      const rep = await generateWeeklyHealthReport();
      setWeeklyReport(rep);
    } catch (e) {
      console.error(e);
    }
  };

  const loadMonthly = async () => {
    try {
      const rep = await generateMonthlyJourneyReport();
      setMonthlyReport(rep);
    } catch (e) {
      console.error(e);
    }
  };

  const loadHeatmap = async () => {
    try {
      const heat = await getCalendarHeatmapMatrix(heatmapMetric, 35);
      setHeatmapData(heat);
    } catch (e) {
      console.error(e);
    }
  };

  // Helper render scatter plot SVG
  const renderScatterPlot = () => {
    if (!correlationData || !correlationData.points || correlationData.points.length === 0) {
      return (
        <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
          Belum ada cukup data untuk korelasi {xMetric} vs {yMetric}.
        </div>
      );
    }

    const { points, regression } = correlationData;
    const padding = 36;
    const width = 340;
    const height = 190;

    const xVals = points.map(p => p.x);
    const yVals = points.map(p => p.y);
    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals) || minX + 1;
    const minY = Math.min(...yVals);
    const maxY = Math.max(...yVals) || minY + 1;

    const scaleX = (val) => padding + ((val - minX) / (maxX - minX || 1)) * (width - 2 * padding);
    const scaleY = (val) => height - padding - ((val - minY) / (maxY - minY || 1)) * (height - 2 * padding);

    // Regression Line endpoints
    let lineP1 = null;
    let lineP2 = null;
    if (regression) {
      const y1 = regression.slope * minX + regression.intercept;
      const y2 = regression.slope * maxX + regression.intercept;
      lineP1 = { x: scaleX(minX), y: scaleY(y1) };
      lineP2 = { x: scaleX(maxX), y: scaleY(y2) };
    }

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        {/* Background Grid & Axes */}
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1.5" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1.5" />

        {/* Regression Trendline */}
        {lineP1 && lineP2 && (
          <line
            x1={lineP1.x}
            y1={Math.min(height - padding, Math.max(padding, lineP1.y))}
            x2={lineP2.x}
            y2={Math.min(height - padding, Math.max(padding, lineP2.y))}
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
        )}

        {/* Data Points */}
        {points.map((p, idx) => {
          const cx = scaleX(p.x);
          const cy = scaleY(p.y);
          return (
            <g key={idx}>
              <circle
                cx={cx}
                cy={cy}
                r="4.5"
                fill="#006c49"
                stroke="#ffffff"
                strokeWidth="1.5"
                style={{ cursor: 'pointer', transition: 'r 0.15s' }}
              >
                <title>{`${p.date}: X=${p.x.toFixed(1)}, Y=${p.y.toFixed(1)}`}</title>
              </circle>
            </g>
          );
        })}

        {/* Axis Labels */}
        <text x={padding} y={height - 12} fontSize="10" fill="#94a3b8" textAnchor="start">
          {minX.toFixed(1)}
        </text>
        <text x={width - padding} y={height - 12} fontSize="10" fill="#94a3b8" textAnchor="end">
          {maxX.toFixed(1)} ({xMetric})
        </text>
        <text x={padding - 6} y={padding} fontSize="10" fill="#94a3b8" textAnchor="end">
          {maxY.toFixed(1)}
        </text>
        <text x={padding - 6} y={height - padding} fontSize="10" fill="#94a3b8" textAnchor="end">
          {minY.toFixed(1)}
        </text>
      </svg>
    );
  };

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>
          Korelasi & Pola
        </h1>
      </div>

      {/* Sub Tabs Selector */}
      <div style={{
        display: 'flex',
        backgroundColor: 'var(--surface-container-low)',
        padding: '3px',
        borderRadius: '14px',
        border: '1px solid var(--hairline-border)',
        gap: '2px'
      }}>
        {[
          { id: 'correlation', label: 'Korelasi' },
          { id: 'patterns', label: 'Pola' },
          { id: 'weekly', label: 'Mingguan' },
          { id: 'monthly', label: '30 Hari' },
          { id: 'heatmap', label: 'Heatmap' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              borderRadius: '11px',
              backgroundColor: activeSubTab === tab.id ? 'var(--surface-container-high)' : 'transparent',
              color: activeSubTab === tab.id ? 'var(--primary-accent)' : 'var(--text-muted)',
              fontWeight: activeSubTab === tab.id ? 700 : 500,
              fontSize: '11px',
              boxShadow: activeSubTab === tab.id ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* VIEW 1: CORRELATION EXPLORER */}
      {activeSubTab === 'correlation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Controls Card */}
          <div className="sanctuary-card" style={{
            borderRadius: '20px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--on-surface)' }}>Pilih Variabel Analisis:</span>
              {/* Timeframe Pills */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {TIMEFRAMES.map(tf => (
                  <button
                    key={tf.days}
                    onClick={() => setTimeframe(tf.days)}
                    style={{
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      fontSize: '10px',
                      fontWeight: timeframe === tf.days ? 700 : 500,
                      backgroundColor: timeframe === tf.days ? 'var(--primary-accent)' : 'var(--surface-container-high)',
                      color: timeframe === tf.days ? '#ffffff' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                  Sumbu X (Kebiasaan):
                </label>
                <select
                  value={xMetric}
                  onChange={e => setXMetric(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    border: '1px solid var(--hairline-border)',
                    background: 'var(--surface-container)',
                    color: 'var(--on-surface)',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {X_METRICS.map(m => (
                    <option key={m} value={m} style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}>{X_METRIC_LABELS[m] || m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                  Sumbu Y (Hasil Observasi):
                </label>
                <select
                  value={yMetric}
                  onChange={e => setYMetric(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    border: '1px solid var(--hairline-border)',
                    background: 'var(--surface-container)',
                    color: 'var(--on-surface)',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {Y_METRICS.map(m => (
                    <option key={m} value={m} style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}>{Y_METRIC_LABELS[m] || m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Scatter Plot & Pearson Stats Card */}
          <div className="sanctuary-card" style={{
            borderRadius: '20px',
            padding: '18px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--on-surface)', margin: 0 }}>
                  {xMetric} vs {yMetric}
                </h3>
              </div>

              {correlationData && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: 'var(--primary-accent)',
                    fontSize: '12px',
                    fontWeight: 800
                  }}>
                    r = {correlationData.r}
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--surface-container-high)',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 700
                  }}>
                    n = {correlationData.sampleSize}
                  </span>
                </div>
              )}
            </div>

            {/* SVG Plot */}
            <div style={{ backgroundColor: 'var(--surface-container)', borderRadius: '16px', padding: '8px 0', border: '1px solid var(--hairline-border)' }}>
              {renderScatterPlot()}
            </div>

            {/* Interpretation */}
            {correlationData && (
              <div style={{
                backgroundColor: 'var(--surface-container)',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '12px',
                color: 'var(--on-surface)',
                lineHeight: 1.5,
                borderLeft: '3px solid var(--primary-accent)'
              }}>
                <span style={{ fontWeight: 700, display: 'block', marginBottom: '2px', color: 'var(--on-surface)' }}>
                  Interpretasi Statistik:
                </span>
                {correlationData.interpretation}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: HABIT PATTERN DETECTION */}
      {activeSubTab === 'patterns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {patterns.length === 0 ? (
            <div className="sanctuary-card" style={{
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px'
            }}>
              Lakukan logging rutin selama minimal 5 hari untuk mendeteksi pola kebiasaan otomatis.
            </div>
          ) : (
            patterns.map(p => (
              <div
                key={p.id}
                className="sanctuary-card"
                style={{
                  borderRadius: '18px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--on-surface)' }}>
                    {p.title}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '20px',
                    backgroundColor: `${p.color}15`,
                    color: p.color
                  }}>
                    {p.badge}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  {p.description}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 3: WEEKLY HEALTH REVIEW */}
      {activeSubTab === 'weekly' && weeklyReport && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Consistency Hero Card */}
          <div style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #006c49 100%)',
            color: '#ffffff',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 8px 24px -4px rgba(0, 108, 73, 0.3)'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', opacity: 0.85, textTransform: 'uppercase' }}>
              Pekan Ini
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
              <div>
                <span style={{ fontSize: '36px', fontWeight: 800 }}>{weeklyReport.consistencyPct}%</span>
                <span style={{ fontSize: '13px', marginLeft: '6px', opacity: 0.9 }}>Konsistensi</span>
              </div>
              <span style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700
              }}>
                📷 {weeklyReport.appearancePhotos}
              </span>
            </div>
          </div>

          {/* Metric Change Pills Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div className="sanctuary-card" style={{ borderRadius: '16px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#0284c7', fontWeight: 700 }}>
                <Droplets size={14} /> Hidrasi
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--on-surface)', marginTop: '4px' }}>
                {weeklyReport.hydrationChange}
              </div>
            </div>

            <div className="sanctuary-card" style={{ borderRadius: '16px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6366f1', fontWeight: 700 }}>
                <Moon size={14} /> Tidur
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--on-surface)', marginTop: '4px' }}>
                {weeklyReport.sleepStatus}
              </div>
            </div>

            <div className="sanctuary-card" style={{ borderRadius: '16px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#b45309', fontWeight: 700 }}>
                <Coffee size={14} /> Kafein
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--on-surface)', marginTop: '4px' }}>
                {weeklyReport.caffeineChange}
              </div>
            </div>

            <div className="sanctuary-card" style={{ borderRadius: '16px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#e11d48', fontWeight: 700 }}>
                <Activity size={14} /> Aktivitas
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--on-surface)', marginTop: '4px' }}>
                {weeklyReport.activityChange}
              </div>
            </div>
          </div>

          {/* Observations Narrative */}
          <div className="sanctuary-card" style={{
            borderRadius: '20px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--on-surface)', margin: 0 }}>
              Observasi
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {weeklyReport.observations.map((obs, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  <span style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>•</span>
                  <span>{obs}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What to Focus on Next Week */}
          <div className="sanctuary-card" style={{
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            borderRadius: '20px',
            padding: '16px 18px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-accent)', margin: 0 }}>
              Rekomendasi Pekan Depan
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {weeklyReport.nextWeekFocus.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--on-surface)', fontWeight: 600 }}>
                  <span style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-accent)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px'
                  }}>
                    {i + 1}
                  </span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: MONTHLY 30-DAY JOURNEY */}
      {activeSubTab === 'monthly' && monthlyReport && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Header Timeline Card */}
          <div className="sanctuary-card" style={{
            borderRadius: '20px',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--on-surface)' }}>
                Tren 30 Hari
              </span>
            </div>

            {/* Sparklines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              {/* Sleep Sparkline */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>😴 Tidur (Jam)</span>
                  <span style={{ color: '#818cf8' }}>Rata-rata {monthlyReport.averageSleepDiff}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '36px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--hairline-border)', borderRadius: '8px', padding: '4px 6px' }}>
                  {monthlyReport.sleepSparkline.map((val, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${Math.min(100, Math.max(15, (val / 9) * 100))}%`,
                        backgroundColor: '#6366f1',
                        borderRadius: '2px'
                      }}
                      title={`Hari ${i+1}: ${val}h`}
                    />
                  ))}
                </div>
              </div>

              {/* Water Sparkline */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>💧 Air (ml)</span>
                  <span style={{ color: '#38bdf8' }}>Konsistensi {monthlyReport.hydrationConsistencyDiff}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '36px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--hairline-border)', borderRadius: '8px', padding: '4px 6px' }}>
                  {monthlyReport.waterSparkline.map((val, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${Math.min(100, Math.max(15, (val / 2500) * 100))}%`,
                        backgroundColor: '#0ea5e9',
                        borderRadius: '2px'
                      }}
                      title={`Hari ${i+1}: ${val}ml`}
                    />
                  ))}
                </div>
              </div>

              {/* Activity Sparkline */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>🏃 Aktivitas (menit)</span>
                  <span style={{ color: '#fb7185' }}>Aktif</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '36px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--hairline-border)', borderRadius: '8px', padding: '4px 6px' }}>
                  {monthlyReport.activitySparkline.map((val, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${Math.min(100, Math.max(15, (val / 60) * 100))}%`,
                        backgroundColor: '#f43f5e',
                        borderRadius: '2px'
                      }}
                      title={`Hari ${i+1}: ${val}m`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Personal Changes 3-metric summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div className="sanctuary-card" style={{ borderRadius: '16px', padding: '14px 10px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Rata-rata Tidur</span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#818cf8', marginTop: '4px' }}>
                {monthlyReport.averageSleepDiff}
              </div>
            </div>

            <div className="sanctuary-card" style={{ borderRadius: '16px', padding: '14px 10px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Konsistensi Air</span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                {monthlyReport.hydrationConsistencyDiff}
              </div>
            </div>

            <div className="sanctuary-card" style={{ borderRadius: '16px', padding: '14px 10px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Konsistensi Habit</span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-accent)', marginTop: '4px' }}>
                {monthlyReport.habitConsistencyRate}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: CONSISTENCY CALENDAR & HEATMAP */}
      {activeSubTab === 'heatmap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Heatmap filter selector */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {['Overall', 'Hydration', 'Sleep', 'Activity', 'Photo'].map(met => (
              <button
                key={met}
                onClick={() => setHeatmapMetric(met)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: heatmapMetric === met ? 700 : 500,
                  backgroundColor: heatmapMetric === met ? 'var(--primary-accent)' : 'var(--surface-container)',
                  color: heatmapMetric === met ? '#ffffff' : 'var(--text-muted)',
                  border: '1px solid var(--hairline-border)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {met}
              </button>
            ))}
          </div>

          {/* GitHub-style Heatmap Card */}
          <div className="sanctuary-card" style={{
            borderRadius: '20px',
            padding: '18px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--on-surface)' }}>
                  Matriks Konsistensi ({heatmapMetric})
                </span>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>35 Hari Terakhir</div>
              </div>

              {heatmapData && (
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary-accent)' }}>
                  {heatmapData.activeDays} / {heatmapData.totalDays} hari ({heatmapData.consistencyPercent}%)
                </span>
              )}
            </div>

            {/* Heatmap Grid (7 columns x 5 rows) */}
            {heatmapData && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginTop: '6px' }}>
                {heatmapData.cells.map((cell, idx) => {
                  const colors = ['#f1f5f9', '#bbf7d0', '#4ade80', '#16a34a', '#065f46'];
                  return (
                    <div
                      key={idx}
                      title={`${cell.date}: ${cell.valLabel}`}
                      style={{
                        aspectRatio: '1 / 1',
                        borderRadius: '6px',
                        backgroundColor: colors[cell.level] || '#f1f5f9',
                        transition: 'transform 0.15s ease',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Heatmap Legend */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '8px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Kurang</span>
              {['#f1f5f9', '#bbf7d0', '#4ade80', '#16a34a', '#065f46'].map((color, i) => (
                <div
                  key={i}
                  style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: color }}
                />
              ))}
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Optimal</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
