import React, { useState, useRef, useEffect } from 'react';
import {
  X, Camera, Barcode, Check, AlertCircle, RefreshCw, Upload, Sparkles, Utensils
} from 'lucide-react';
import {
  analyzeNutritionLabelImage,
  scanBarcodeFromImage,
  searchProductByName,
  saveScannedNutrition,
  PRODUCT_NUTRITION_DATABASE
} from '../services/nutritionScanner';

export default function NutritionScannerModal({ isOpen, onClose, onSuccess }) {
  const [activeMode, setActiveMode] = useState('camera'); // 'camera' | 'search' | 'manual'
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedData, setDetectedData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editable Form fields
  const [productName, setProductName] = useState('');
  const [sugarGrams, setSugarGrams] = useState(0);
  const [sodiumMg, setSodiumMg] = useState(0);
  const [calories, setCalories] = useState(0);
  const [servingSize, setServingSize] = useState('1 porsi');
  const [mealType, setMealType] = useState('Snack');

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && activeMode === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activeMode, capturedImage]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setErrorMsg('Kamera tidak dapat diakses. Anda dapat mengunggah foto label nutrisi atau memilih dari database produk.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setCapturedImage(dataUrl);
    stopCamera();
    processImage(dataUrl);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setCapturedImage(dataUrl);
      stopCamera();
      processImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (dataUrl) => {
    setIsAnalyzing(true);
    setErrorMsg('');
    try {
      // 1. Cek barcode terlebih dahulu
      const barcodeResult = await scanBarcodeFromImage(videoRef.current || null);
      if (barcodeResult && barcodeResult.detected && barcodeResult.product) {
        populateForm(barcodeResult.product);
        setIsAnalyzing(false);
        return;
      }

      // 2. Scan Nutrition Label OCR via Gemini Vision / Smart Heuristics
      const ocrResult = await analyzeNutritionLabelImage(dataUrl);
      populateForm(ocrResult);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal menganalisis label. Silakan masukkan data secara manual.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const populateForm = (data) => {
    setDetectedData(data);
    setProductName(data.productName || data.name || 'Produk Terdeteksi');
    setSugarGrams(Number(data.sugarGrams) || 0);
    setSodiumMg(Number(data.sodiumMg) || 0);
    setCalories(Number(data.calories) || 0);
    setServingSize(data.servingSize || '1 porsi');
  };

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
    } else {
      setSearchResults(searchProductByName(q));
    }
  };

  const handleSelectProduct = (product) => {
    populateForm(product);
    setActiveMode('camera'); // view result
  };

  const handleSave = async () => {
    try {
      await saveScannedNutrition({
        productName: productName || 'Makanan/Minuman',
        sugarGrams: Number(sugarGrams) || 0,
        sodiumMg: Number(sodiumMg) || 0,
        calories: Number(calories) || 0,
        servingSize,
        mealType
      });
      setSuccessMsg('Nutrisi berhasil ditambahkan ke catatan harian!');
      setTimeout(() => {
        setSuccessMsg('');
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal menyimpan nutrisi ke database.');
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setDetectedData(null);
    setErrorMsg('');
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 1050,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 20px 50px -10px rgba(0,0,0,0.3)',
        maxHeight: '92vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Pindai Nutrisi
            </h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
          {[
            { id: 'camera', label: 'Kamera' },
            { id: 'search', label: 'Cari Produk' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveMode(tab.id);
                if (tab.id === 'search') stopCamera();
              }}
              style={{
                flex: 1,
                padding: '12px 8px',
                border: 'none',
                background: 'transparent',
                borderBottom: activeMode === tab.id ? '2px solid #006c49' : '2px solid transparent',
                fontWeight: activeMode === tab.id ? 700 : 500,
                color: activeMode === tab.id ? '#006c49' : '#64748b',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {successMsg && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #10b981',
              color: '#065f46',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Check size={16} /> {successMsg}
            </div>
          )}

          {errorMsg && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          {/* SEARCH MODE */}
          {activeMode === 'search' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Ketik nama makanan/minuman (misal: Teh Botol, Pocari, Indomie...)"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px'
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {(searchQuery ? searchResults : PRODUCT_NUTRITION_DATABASE).map(item => (
                  <div
                    key={item.barcode}
                    onClick={() => handleSelectProduct(item)}
                    style={{
                      padding: '12px',
                      borderRadius: '14px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{item.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {item.brand} • {item.servingSize}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>
                        Gula {item.sugarGrams}g
                      </div>
                      <div style={{ fontSize: '11px', color: '#d97706' }}>
                        Sodium {item.sodiumMg}mg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CAMERA / SCANNER MODE */}
          {activeMode === 'camera' && !detectedData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              {/* Camera Preview Frame */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '240px',
                backgroundColor: '#0f172a',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Reticle / Viewfinder Overlay */}
                <div style={{
                  position: 'absolute',
                  inset: '24px 32px',
                  border: '2px dashed rgba(255,255,255,0.7)',
                  borderRadius: '12px',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    Arahkan ke Tabel Informasi Nilai Gizi
                  </span>
                </div>
              </div>

              {/* Shutter / Capture Button */}
              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button
                  onClick={handleCapture}
                  disabled={isAnalyzing}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    backgroundColor: '#006c49',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Camera size={16} /> Ambil Foto Label
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 16px',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                  title="Upload Foto"
                >
                  <Upload size={16} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>

              <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                Mendukung OCR AI Gemini Vision untuk ekstraksi otomatis Gula, Sodium, & Kalori.
              </div>
            </div>
          )}

          {/* DETECTED RESULTS & CONFIRM FORM */}
          {detectedData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '16px',
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                    ✓ Nutrisi Terdeteksi
                  </span>
                  <button
                    onClick={resetCapture}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RefreshCw size={12} /> Scan Ulang
                  </button>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Nama Produk:</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: 700,
                      marginTop: '2px'
                    }}
                  />
                </div>
              </div>

              {/* Nutrients Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div style={{
                  padding: '10px',
                  borderRadius: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca'
                }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#b91c1c' }}>GULA (SUGAR)</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginTop: '4px' }}>
                    <input
                      type="number"
                      value={sugarGrams}
                      onChange={e => setSugarGrams(Number(e.target.value))}
                      style={{
                        width: '50px',
                        fontSize: '16px',
                        fontWeight: 800,
                        color: '#991b1b',
                        border: 'none',
                        background: 'transparent'
                      }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#b91c1c' }}>g</span>
                  </div>
                </div>

                <div style={{
                  padding: '10px',
                  borderRadius: '12px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a'
                }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#b45309' }}>SODIUM</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginTop: '4px' }}>
                    <input
                      type="number"
                      value={sodiumMg}
                      onChange={e => setSodiumMg(Number(e.target.value))}
                      style={{
                        width: '55px',
                        fontSize: '16px',
                        fontWeight: 800,
                        color: '#92400e',
                        border: 'none',
                        background: 'transparent'
                      }}
                    />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#b45309' }}>mg</span>
                  </div>
                </div>

                <div style={{
                  padding: '10px',
                  borderRadius: '12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569' }}>KALORI</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginTop: '4px' }}>
                    <input
                      type="number"
                      value={calories}
                      onChange={e => setCalories(Number(e.target.value))}
                      style={{
                        width: '55px',
                        fontSize: '16px',
                        fontWeight: 800,
                        color: '#1e293b',
                        border: 'none',
                        background: 'transparent'
                      }}
                    />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>kkal</span>
                  </div>
                </div>
              </div>

              {/* Serving size & meal type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Takaran Saji:</label>
                  <input
                    type="text"
                    value={servingSize}
                    onChange={e => setServingSize(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      marginTop: '2px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Waktu Makan:</label>
                  <select
                    value={mealType}
                    onChange={e => setMealType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      marginTop: '2px'
                    }}
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>
              </div>

              {/* Confirm Save CTA */}
              <button
                onClick={handleSave}
                style={{
                  backgroundColor: '#006c49',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Check size={18} /> [ Add to Log ] Simpan ke Catatan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
