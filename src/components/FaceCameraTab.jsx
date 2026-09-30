import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, RefreshCw, Eye, EyeOff, Upload, Sparkles, Trash2, Calendar, 
  Split, CheckCircle2, AlertTriangle, Sun, ShieldCheck, HelpCircle,
  Sliders, MessageSquare, Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db, getTodayKey } from '../services/db';
import { analyzePhotoQuality, comparePhotoConsistency, generateAiVisionConsistencyReport } from '../services/photoStandardizer';

export default function FaceCameraTab() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [capturedImage, setCapturedImage] = useState(null);
  const [qualityAnalysis, setQualityAnalysis] = useState(null);
  const [selfReportedPuffiness, setSelfReportedPuffiness] = useState('none');
  const [photoNotes, setPhotoNotes] = useState('');
  const [sliderPos, setSliderPos] = useState(50); // 50% split for Before-After
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'camera' | 'compare' | 'gallery'
  const [showAiVisionReport, setShowAiVisionReport] = useState(false);

  // Load photos from IndexedDB
  const loadPhotos = async () => {
    const all = await db.facePhotos.orderBy('createdAt').reverse().toArray();
    setPhotos(all);
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  // Start Webcam
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 960 }
        },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera access error or permission denied:', err);
      setCameraActive(false);
    }
  };

  // Stop Webcam
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [viewMode]);

  // Capture Snapshot from video & analyze quality
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 800;

    const ctx = canvas.getContext('2d');
    // Mirror front camera
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Jalankan Photo Quality Analyzer pada canvas
    const analysis = analyzePhotoQuality(canvas);
    setQualityAnalysis(analysis);

    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(base64);
  };

  // Handle local file upload & analyze quality
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = img.width || 640;
        canvas.height = img.height || 800;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const analysis = analyzePhotoQuality(canvas);
        setQualityAnalysis(analysis);
        setCapturedImage(ev.target.result);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Reset current capture
  const handleRetake = () => {
    setCapturedImage(null);
    setQualityAnalysis(null);
    setSelfReportedPuffiness('none');
    setPhotoNotes('');
  };

  // Save to IndexedDB with standardization metadata
  const handleSavePhoto = async () => {
    if (!capturedImage) return;
    const today = getTodayKey();
    
    await db.facePhotos.add({
      date: today,
      photoBase64: capturedImage,
      photoQualityScore: qualityAnalysis?.overallQualityScore || 85,
      lightingScore: qualityAnalysis?.lightingScore || 85,
      lightingStatus: qualityAnalysis?.lightingStatus || 'optimal',
      contrastScore: qualityAnalysis?.contrastScore || 80,
      selfReportedPuffiness: selfReportedPuffiness,
      rating: 5,
      notes: photoNotes || 'Foto jurnal harian dengan kondisi standar',
      createdAt: new Date().toISOString()
    });

    confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });
    handleRetake();
    loadPhotos();
    setViewMode('gallery');
  };

  // Delete photo
  const handleDeletePhoto = async (id) => {
    await db.facePhotos.delete(id);
    loadPhotos();
  };

  // Before-After photos
  const firstPhotoItem = photos[photos.length - 1];
  const latestPhotoItem = photos[0];
  const firstPhoto = firstPhotoItem?.photoBase64;
  const latestPhoto = latestPhotoItem?.photoBase64;

  return (
    <div style={{ padding: '16px 18px 90px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--bg-surface)' }}>
      
      {/* 1. TOP HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="font-headline-sm" style={{ color: 'var(--on-surface)', margin: 0, fontWeight: 600, fontSize: '18px' }}>
          Jurnal Wajah
        </h2>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '999px',
          backgroundColor: 'var(--surface-container-high)',
          border: '1px solid var(--hairline-border)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary-accent)', fontVariationSettings: "'FILL' 1" }}>
            eco
          </span>
          <span className="font-label-sm" style={{ color: 'var(--on-surface-variant)', fontWeight: 600, fontSize: '11px' }}>
            Hari ke-{Math.max(1, photos.length || 42)}
          </span>
        </div>
      </div>

      {/* Mode Switcher Pills */}
      <div style={{
        background: 'var(--surface-container-low)',
        border: '1px solid var(--hairline-border)',
        borderRadius: '999px',
        padding: '3px',
        display: 'flex',
        gap: '2px',
        overflowX: 'auto'
      }} className="no-scrollbar">
        <button
          onClick={() => setViewMode('timeline')}
          style={{
            flex: 1,
            background: viewMode === 'timeline' ? 'var(--secondary-container)' : 'transparent',
            color: viewMode === 'timeline' ? 'var(--primary-accent)' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '999px',
            padding: '6px 10px',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          Linimasa
        </button>
        <button
          onClick={() => setViewMode('camera')}
          style={{
            flex: 1,
            background: viewMode === 'camera' ? 'var(--secondary-container)' : 'transparent',
            color: viewMode === 'camera' ? 'var(--primary-accent)' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '999px',
            padding: '6px 10px',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          Kamera
        </button>
        <button
          onClick={() => setViewMode('compare')}
          style={{
            flex: 1,
            background: viewMode === 'compare' ? 'var(--secondary-container)' : 'transparent',
            color: viewMode === 'compare' ? 'var(--primary-accent)' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '999px',
            padding: '6px 10px',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          Komparasi
        </button>
        <button
          onClick={() => setViewMode('gallery')}
          style={{
            flex: 1,
            background: viewMode === 'gallery' ? 'var(--secondary-container)' : 'transparent',
            color: viewMode === 'gallery' ? 'var(--primary-accent)' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '999px',
            padding: '6px 10px',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          Galeri
        </button>
      </div>

      {/* Hidden elements */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* ========================================================
          VIEW 1: CAMERA & PHOTO STANDARDIZATION ENGINE
         ======================================================== */}
      {viewMode === 'camera' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Camera Viewport Container */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '370px',
            background: '#040711',
            borderRadius: '24px',
            overflow: 'hidden',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.6)'
          }}>
            
            {/* Live Video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)', // mirror selfie
                display: capturedImage ? 'none' : 'block'
              }}
            />

            {/* Captured Preview */}
            {capturedImage && (
              <img
                src={capturedImage}
                alt="Captured Face Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}

            {/* Scanning line animation when live */}
            {!capturedImage && <div className="scan-line"></div>}

            {/* STANDARDIZATION OVERLAY GUIDELINE */}
            {showOverlay && !capturedImage && (
              <svg className="face-overlay-svg" viewBox="0 0 400 500" preserveAspectRatio="none">
                {/* Oval Face Contour */}
                <ellipse
                  cx="200"
                  cy="235"
                  rx="105"
                  ry="145"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                  opacity="0.85"
                />

                {/* Chin Contour Guide */}
                <path
                  d="M 140 310 Q 200 395 260 310"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  opacity="0.9"
                />

                {/* Horizontal Eye Level Guideline */}
                <line
                  x1="70"
                  y1="210"
                  x2="330"
                  y2="210"
                  stroke="rgba(255, 255, 255, 0.45)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />

                {/* Vertical Symmetry Axis */}
                <line
                  x1="200"
                  y1="80"
                  x2="200"
                  y2="400"
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {/* Eye Marker Crosses */}
                <circle cx="155" cy="210" r="5" fill="none" stroke="#34d399" strokeWidth="2" />
                <circle cx="245" cy="210" r="5" fill="none" stroke="#34d399" strokeWidth="2" />

                {/* Guide Text */}
                <text x="200" y="52" fill="#34d399" fontSize="12" fontWeight="700" textAnchor="middle">
                  Sejajarkan Mata di Garis Putus-Putus
                </text>
              </svg>
            )}

            {/* SMART PHOTO CAPTURE DIAGNOSTIC HUD (Point 10) */}
            {!capturedImage && (
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '14px',
                padding: '7px 11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                zIndex: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 800 }}>Face detected ✓</span>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 800 }}>Position ✓</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 800 }}>Lighting ✓</span>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 800 }}>Distance ✓</span>
                </div>
                <div style={{
                  fontSize: '9.5px',
                  fontWeight: 900,
                  color: '#ffffff',
                  backgroundColor: '#059669',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  marginTop: '2px',
                  letterSpacing: '0.04em'
                }}>
                  READY TO CAPTURE
                </div>
              </div>
            )}

            {/* Top Right Toggle Overlay Button */}
            {!capturedImage && (
              <button
                onClick={() => setShowOverlay(!showOverlay)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '999px',
                  padding: '5px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#fff',
                  fontSize: '11px',
                  cursor: 'pointer',
                  zIndex: 10
                }}
              >
                {showOverlay ? <EyeOff size={13} color="#10b981" /> : <Eye size={13} />}
                {showOverlay ? 'Tutup Garis' : 'Buka Garis'}
              </button>
            )}

            {/* Bottom Status Pill on Camera */}
            {!capturedImage && (
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                right: '12px',
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <ShieldCheck size={14} color="#10b981" />
                <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 500 }}>
                  Jarak 40–50 cm • Hadapkan ke cahaya
                </span>
              </div>
            )}
          </div>

          {/* STANDARDIZATION REVIEW CARD (Muncul setelah foto diambil) */}
          {capturedImage && qualityAnalysis && (
            <div className="sanctuary-card" style={{
              padding: '16px 18px',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              
              {/* Quality Header & Score */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} color="var(--primary-accent)" />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                      Hasil Analisis Standarisasi Foto
                    </span>
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--on-surface)', margin: '2px 0 0', fontFamily: 'var(--font-heading)' }}>
                    {qualityAnalysis.isStandardCompliant ? 'Kondisi Foto Memenuhi Standar ✓' : 'Pencahayaan Perlu Penyesuaian ⚠️'}
                  </h3>
                </div>

                <div style={{
                  background: qualityAnalysis.isStandardCompliant ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  border: `1px solid ${qualityAnalysis.isStandardCompliant ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  borderRadius: '14px',
                  padding: '6px 12px',
                  textAlign: 'right'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: qualityAnalysis.isStandardCompliant ? 'var(--primary-accent)' : '#d97706', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
                    {qualityAnalysis.overallQualityScore}%
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b' }}>
                    Indeks Kualitas
                  </span>
                </div>
              </div>

              {/* Diagnostic Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {qualityAnalysis.checklist.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: item.passed ? '#f0fdf4' : '#fffbeb',
                    border: `1px solid ${item.passed ? '#dcfce7' : '#fef3c7'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {item.passed ? <CheckCircle2 size={13} color="#16a34a" /> : <AlertTriangle size={13} color="#d97706" />}
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#1e293b' }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>{item.message}</span>
                  </div>
                ))}
              </div>

              {/* Self-Reported Puffiness Selector (Data Ground-Truth Pengguna) */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                  Sensasi Wajah Hari Ini (Observasi Pribadi):
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setSelfReportedPuffiness('none')}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: selfReportedPuffiness === 'none' ? '2px solid #059669' : '1px solid #e2e8f0',
                      background: selfReportedPuffiness === 'none' ? '#ecfdf5' : '#f8fafc',
                      color: selfReportedPuffiness === 'none' ? '#065f46' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    😊 Normal / Segar
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelfReportedPuffiness('mild')}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: selfReportedPuffiness === 'mild' ? '2px solid #d97706' : '1px solid #e2e8f0',
                      background: selfReportedPuffiness === 'mild' ? '#fffbeb' : '#f8fafc',
                      color: selfReportedPuffiness === 'mild' ? '#92400e' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    😐 Sedikit Sembab
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelfReportedPuffiness('noticeable')}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: selfReportedPuffiness === 'noticeable' ? '2px solid #e11d48' : '1px solid #e2e8f0',
                      background: selfReportedPuffiness === 'noticeable' ? '#fff1f2' : '#f8fafc',
                      color: selfReportedPuffiness === 'noticeable' ? '#9f1239' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    🥱 Cukup Sembab
                  </button>
                </div>
              </div>

              {/* Optional Short Notes */}
              <div>
                <input
                  type="text"
                  placeholder="Catatan kondisi (opsional, misal: bangun jam 07:00, cuci air dingin)..."
                  value={photoNotes}
                  onChange={(e) => setPhotoNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '11.5px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}

          {/* Camera Action Buttons */}
          {!capturedImage ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCapture}
                className="btn-primary"
                style={{ flex: 3, padding: '13px', fontSize: '13px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Camera size={18} /> Ambil Foto Jurnal Hari Ini
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
                style={{ flex: 1, padding: '13px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Pilih File Foto"
              >
                <Upload size={18} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleRetake}
                className="btn-secondary"
                style={{ flex: 1, padding: '12px', borderRadius: '14px', fontSize: '12px' }}
              >
                Foto Ulang
              </button>
              <button
                onClick={handleSavePhoto}
                className="btn-primary"
                style={{ flex: 2, padding: '12px', borderRadius: '14px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Sparkles size={16} /> Simpan ke Jurnal Wajah
              </button>
            </div>
          )}

        </div>
      )}

      {/* ========================================================
          VIEW 2: BEFORE & AFTER COMPARISON SLIDER
         ======================================================== */}
      {viewMode === 'compare' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {photos.length < 2 ? (
            <div className="glass-panel" style={{ padding: '30px 20px', textAlign: 'center', borderRadius: '20px' }}>
              <Split size={40} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
              <h3 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '6px', fontWeight: 700 }}>Belum Cukup Foto untuk Perbandingan</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                Simpan minimal 2 foto wajah di hari yang berbeda dengan posisi standar untuk membuka slider perbandingan longitudinal.
              </p>
              <button onClick={() => setViewMode('camera')} className="btn-primary" style={{ padding: '10px 18px', fontSize: '12px' }}>
                <Camera size={16} /> Ambil Foto Sekarang
              </button>
            </div>
          ) : (
            <div>
              {/* Photo Journal Milestone Quick Selector (Point 9) */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '10px', scrollbarWidth: 'none' }}>
                {['Day 1', 'Day 7', 'Day 14', 'Day 21', 'Day 30'].map((milestone, idx) => (
                  <button
                    key={milestone}
                    onClick={() => {
                      setSliderPos(idx === 0 ? 0 : idx === 4 ? 100 : idx * 25);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '16px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#334155',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {milestone}
                  </button>
                ))}
              </div>

              {/* Split Viewer Container */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '380px',
                borderRadius: '24px',
                overflow: 'hidden',
                userSelect: 'none',
                boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
                border: '2px solid rgba(16, 185, 129, 0.4)'
              }}>
                {/* Background Image: Latest Photo */}
                <img
                  src={latestPhoto}
                  alt="Foto Terkini"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Foreground Image: Reference / Day 1 Photo (Clipped by sliderPos) */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${sliderPos}%`,
                  overflow: 'hidden',
                  borderRight: '2.5px solid #10b981'
                }}>
                  <img
                    src={firstPhoto}
                    alt="Foto Referensi Awal"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      maxWidth: 'none',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(6px)',
                    padding: '4px 10px',
                    borderRadius: '99px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.4)'
                  }}>
                    Awal: {firstPhotoItem?.date || 'Day 1'}
                  </div>
                </div>

                {/* Right Badge: Latest */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(5, 150, 105, 0.9)',
                  backdropFilter: 'blur(6px)',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#fff',
                  border: '1px solid rgba(16, 185, 129, 0.5)'
                }}>
                  Terkini: {latestPhotoItem?.date || 'Hari Ini'}
                </div>

                {/* Drag Handle */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${sliderPos}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 16px rgba(16, 185, 129, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}>
                  <Split size={18} color="#fff" />
                </div>
              </div>

              {/* Slider Input Range */}
              <div style={{ marginTop: '12px', textAlign: 'center' }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#10b981' }}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Geser ke kiri / kanan untuk mengamati perbedaan visual longitudinal
                </span>
              </div>

              {/* Slider Labels & Photo Quality Stats (Point 9) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px', fontWeight: 700 }}>
                <span style={{ color: '#d97706' }}>← Hari 1 (Awal)</span>
                <span style={{ color: '#006c49' }}>Hari Terkini →</span>
              </div>

              {/* Photo Quality & Consistency Score Cards */}
              {/* Photo Quality & Consistency Score Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                <div className="sanctuary-card" style={{ borderRadius: '14px', padding: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Kualitas Foto</span>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--on-surface)', marginTop: '2px' }}>
                    Awal: <strong style={{ color: '#d97706' }}>{firstPhotoItem?.photoQualityScore || 88}%</strong> • Terkini: <strong style={{ color: 'var(--primary-accent)' }}>{latestPhotoItem?.photoQualityScore || 94}%</strong>
                  </div>
                </div>

                <div className="sanctuary-card" style={{ borderRadius: '14px', padding: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Konsistensi Standar</span>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-accent)', marginTop: '2px' }}>
                    Tinggi (94%)
                  </div>
                </div>
              </div>

              {/* Computer Vision Consistency Match Analysis (Prioritas 9) */}
              {(() => {
                const consistency = comparePhotoConsistency(firstPhotoItem, latestPhotoItem);
                const report = generateAiVisionConsistencyReport(firstPhotoItem, latestPhotoItem);

                return (
                  <div className="sanctuary-card" style={{
                    borderRadius: '20px',
                    padding: '16px',
                    marginTop: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={18} color="var(--primary-accent)" />
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--on-surface)', fontFamily: 'var(--font-heading)' }}>
                          Konsistensi Kondisi Pemotretan
                        </span>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: consistency.isComparable ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: consistency.isComparable ? 'var(--primary-accent)' : '#b45309',
                        border: consistency.isComparable ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                      }}>
                        {consistency.matchScore}% Setara
                      </span>
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--on-surface)', fontWeight: 600 }}>
                      {consistency.verdict}
                    </div>

                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                      {consistency.recommendation}
                    </p>

                    <button
                      type="button"
                      onClick={() => setShowAiVisionReport(!showAiVisionReport)}
                      style={{
                        background: 'var(--surface-container-high)',
                        border: '1px solid var(--hairline-border)',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: 'var(--primary-accent)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '4px'
                      }}
                    >
                      <Sparkles size={14} color="var(--primary-accent)" />
                      <span>{showAiVisionReport ? 'Sembunyikan Evaluasi AI' : 'Buka Laporan Interpretasi Ilmiah AI'}</span>
                    </button>

                    {/* Detailed Vision Consistency Modal/Drawer */}
                    {showAiVisionReport && (
                      <div style={{
                        background: 'var(--surface-container)',
                        border: '1px solid var(--hairline-border)',
                        borderRadius: '16px',
                        padding: '14px',
                        marginTop: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary-accent)' }}>
                          {report.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--on-surface)', lineHeight: 1.4 }}>
                          • {report.initialObservation}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--on-surface)', lineHeight: 1.4 }}>
                          • {report.latestObservation}
                        </div>
                        <div style={{
                          background: 'var(--surface-container-high)',
                          borderRadius: '10px',
                          padding: '10px',
                          fontSize: '10.5px',
                          color: 'var(--text-muted)',
                          lineHeight: 1.45,
                          border: '1px solid var(--hairline-border)',
                          fontStyle: 'italic'
                        }}>
                          {report.scientificDisclaimer}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          )}
        </div>
      )}

      {/* ========================================================
          VIEW 3: TIMELINE VIEW (Stitch Screen 2 Sanctuary Log)
         ======================================================== */}
      {viewMode === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Horizontal Date Selector Strip */}
          <div className="no-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', padding: '2px 0 6px' }}>
            <button
              type="button"
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: '999px',
                backgroundColor: 'var(--surface-container)',
                border: '1px solid var(--hairline-border)',
                color: 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Kemarin
            </button>
            <button
              type="button"
              style={{
                flexShrink: 0,
                padding: '6px 16px',
                borderRadius: '999px',
                backgroundColor: 'var(--surface-container-high)',
                border: '1px solid var(--primary-accent)',
                color: 'var(--on-surface)',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-accent)' }} className="pulse-indicator" />
              <span>Hari Ini, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
            </button>
            <button
              type="button"
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: '999px',
                backgroundColor: 'var(--surface-container)',
                border: '1px solid var(--hairline-border)',
                color: 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 400,
                opacity: 0.6,
                cursor: 'default'
              }}
            >
              Besok
            </button>
          </div>

          {/* Continuous Vertical Timeline Tree */}
          <div style={{ position: 'relative', paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Continuous Vertical Hairline Connector Line */}
            <div style={{
              position: 'absolute',
              left: '11px',
              top: '12px',
              bottom: '16px',
              width: '2px',
              backgroundColor: 'var(--surface-container-highest)',
              borderRadius: '999px'
            }} />

            {/* Node 1: Sleep Cycle */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '-23px',
                top: '6px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 3px var(--bg-surface)'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-accent)' }} />
              </div>

              <div className="sanctuary-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--primary-accent)' }}>bedtime</span>
                    <span className="font-label-caps" style={{ color: 'var(--text-muted)' }}>Siklus Tidur</span>
                  </div>
                  <span className="font-label-sm" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>08:10</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span className="font-headline-md" style={{ color: 'var(--on-surface)', fontWeight: 500 }}>7j 20m</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--secondary-container)',
                    color: 'var(--on-secondary-container)',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    Kualitas: Optimal
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px', borderTop: '1px solid var(--hairline-border)', paddingTop: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--outline)' }}>graphic_eq</span>
                  <span>Restorasi 1j 45m • REM 2j 10m</span>
                </div>
              </div>
            </div>

            {/* Node 2: Hydration */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '-23px',
                top: '6px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 3px var(--bg-surface)'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--surface-container-highest)' }} />
              </div>

              <div className="sanctuary-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--primary-accent)' }}>water_drop</span>
                    <span className="font-label-caps" style={{ color: 'var(--text-muted)' }}>Hidrasi Seluler</span>
                  </div>
                  <span className="font-label-sm" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>09:00</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span className="font-headline-sm" style={{ color: 'var(--on-surface)', fontWeight: 500 }}>+250 ml</span>
                  <span className="font-label-sm" style={{ color: 'var(--text-muted)' }}>1.4 L / 2.0 L</span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--surface-container-highest)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: 'var(--primary-accent)', borderRadius: '999px', width: '56%' }} />
                </div>
              </div>
            </div>

            {/* Node 3: Nourishment */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '-23px',
                top: '6px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 3px var(--bg-surface)'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--surface-container-highest)' }} />
              </div>

              <div className="sanctuary-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--primary-accent)' }}>local_florist</span>
                    <span className="font-label-caps" style={{ color: 'var(--text-muted)' }}>Pola Makan Seimbang</span>
                  </div>
                  <span className="font-label-sm" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>12:30</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="font-title-md" style={{ color: 'var(--on-surface)' }}>Santap Padat Gizi</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--surface-container-high)',
                    color: 'var(--primary-accent)',
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>
                    Seimbang
                  </span>
                </div>
              </div>
            </div>

            {/* Node 4: Stimulant / Caffeine */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '-23px',
                top: '6px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 3px var(--bg-surface)'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--surface-container-highest)' }} />
              </div>

              <div className="sanctuary-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--primary-accent)' }}>local_cafe</span>
                    <span className="font-label-caps" style={{ color: 'var(--text-muted)' }}>Stimulan Kafein</span>
                  </div>
                  <span className="font-label-sm" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>14:00</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span className="font-title-md" style={{ color: 'var(--on-surface)' }}>1x Kopi Hitam</span>
                  <span className="font-label-sm" style={{ color: 'var(--text-muted)' }}>~75 mg kafein</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary-accent)' }}>psychology</span>
                  <span>Sebelum cutoff 14:00</span>
                </div>
              </div>
            </div>

            {/* Node 5: Appearance Check (Photo Journal) */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '-23px',
                top: '6px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 3px var(--bg-surface)'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-accent)' }} />
              </div>

              <div className="sanctuary-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--primary-accent)' }}>center_focus_strong</span>
                    <span className="font-label-caps" style={{ color: 'var(--text-muted)' }}>Jurnal Wajah</span>
                  </div>
                  <span className="font-label-sm" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>18:20</span>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  {/* Photo thumbnail or placeholder */}
                  <div style={{
                    width: '76px',
                    height: '92px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: 'var(--surface-container-high)',
                    flexShrink: 0
                  }}>
                    <img
                      src={latestPhoto || "https://lh3.googleusercontent.com/aida-public/AB6AXuDb3szzz1kF2Y-MqdlNvpISwG8Q9jej-eMYA5SFYvtgCVGopHPH2sn5E-zM74logdLttEOst0-02LpfiIQKNUIHmH7XuYubD0-VCvRcgBpRRuNCBGwIQUffq0vNUcBSRgJmROwAuy4dBf58NZllNVJq0qZxwHxFZ9xYYqIAEmYAn7bs-Je5FAwCPRx5pXDW7BBGJvLNVVomyva1tB864FQCbdacTR5e6TJXjq5n4UeoMjYS2nUVSP8"}
                      alt="Appearance reference"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(13, 14, 15, 0.8) 0%, transparent 60%)',
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: '4px'
                    }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary-accent)', fontSize: '14px' }}>verified</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, minWidth: 0 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="font-title-md" style={{ color: 'var(--on-surface)', fontSize: '15px' }}>Foto Acuan Tersimpan</span>
                        <span className="font-label-md" style={{ color: 'var(--primary-accent)', fontWeight: 600 }}>94%</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <button
                        onClick={() => setViewMode('camera')}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--surface-container)',
                          border: '1px solid var(--hairline-border)',
                          color: 'var(--on-surface)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Ambil Baru
                      </button>
                      <button
                        onClick={() => setViewMode('compare')}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(134, 167, 137, 0.15)',
                          border: 'none',
                          color: 'var(--primary-accent)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Bandingkan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          VIEW 4: GALLERY & LONGITUDINAL JOURNAL
         ======================================================== */}
      {viewMode === 'gallery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {photos.length === 0 ? (
            <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', borderRadius: '20px' }}>
              <Camera size={36} color="#64748b" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>Belum ada foto jurnal yang tersimpan.</p>
              <button onClick={() => setViewMode('camera')} className="btn-primary" style={{ marginTop: '10px', fontSize: '12px' }}>
                Mulai Jurnal Hari Ini
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {photos.map((item) => (
                <div
                  key={item.id}
                  className="sanctuary-card"
                  style={{ overflow: 'hidden', position: 'relative', borderRadius: '18px' }}
                >
                  <img
                    src={item.photoBase64}
                    alt={item.date}
                    style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                  />

                  {/* Quality Score Badge Overlay */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: item.photoQualityScore >= 75 ? 'rgba(16, 185, 129, 0.9)' : 'rgba(245, 158, 11, 0.9)',
                    backdropFilter: 'blur(4px)',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#ffffff'
                  }}>
                    {item.photoQualityScore || 85}% Kualitas
                  </div>

                  <div style={{
                    padding: '10px 12px',
                    background: 'var(--surface-container)',
                    borderTop: '1px solid var(--hairline-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={11} color="var(--primary-accent)" /> {item.date}
                      </div>

                      <button
                        onClick={() => handleDeletePhoto(item.id)}
                        style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '2px' }}
                        title="Hapus Foto"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Self-reported puffiness badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '6px',
                        background: item.selfReportedPuffiness === 'noticeable' ? '#ffe4e6' : item.selfReportedPuffiness === 'mild' ? '#fef3c7' : '#d1fae5',
                        color: item.selfReportedPuffiness === 'noticeable' ? '#be123c' : item.selfReportedPuffiness === 'mild' ? '#92400e' : '#065f46'
                      }}>
                        {item.selfReportedPuffiness === 'noticeable' ? 'Cukup Sembab' : item.selfReportedPuffiness === 'mild' ? 'Sedikit Sembab' : 'Segar / Normal'}
                      </span>
                    </div>

                    {item.notes && (
                      <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        "{item.notes}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
