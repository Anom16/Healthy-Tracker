import React, { useState, useEffect } from 'react';
import { 
  X, Heart, Droplets, Utensils, Smile, Wind, Sparkles, 
  CheckCircle2, Compass, Coffee, Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CravingSosModal({ isOpen, onClose }) {
  const [selectedFeeling, setSelectedFeeling] = useState(null); // 'hungry' | 'thirsty' | 'bored' | 'stressed' | 'craving'
  const [breathPhase, setBreathPhase] = useState('Tarik Napas');
  const [phaseCount, setPhaseCount] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);

  // Guided 4-4-4 Box Breathing
  useEffect(() => {
    if (!isOpen || !isBreathingActive) return;
    const breathInterval = setInterval(() => {
      setPhaseCount(prev => {
        if (prev <= 1) {
          setBreathPhase(curr => {
            if (curr === 'Tarik Napas') return 'Tahan Napas';
            if (curr === 'Tahan Napas') return 'Hembuskan Perlahan';
            if (curr === 'Hembuskan Perlahan') return 'Istirahat / Tenang';
            return 'Tarik Napas';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(breathInterval);
  }, [isOpen, isBreathingActive]);

  if (!isOpen) return null;

  const handleFinish = () => {
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    onClose();
  };

  const feelings = [
    {
      id: 'hungry',
      icon: <Utensils size={18} color="#059669" />,
      label: 'Lapar Fisik',
      desc: 'Perut kosong, lemas, butuh energi nyata',
      color: '#ecfdf5',
      border: '#a7f3d0',
      activeColor: '#059669'
    },
    {
      id: 'thirsty',
      icon: <Droplets size={18} color="#0284c7" />,
      label: 'Haus / Dehidrasi',
      desc: 'Mulut kering, belum minum sejak tadi',
      color: '#f0f9ff',
      border: '#bae6fd',
      activeColor: '#0284c7'
    },
    {
      id: 'stressed',
      icon: <Wind size={18} color="#7c3aed" />,
      label: 'Stres / Emosional',
      desc: 'Pikiran penat, mencari dopamin cepat',
      color: '#f5f3ff',
      border: '#ddd6fe',
      activeColor: '#7c3aed'
    },
    {
      id: 'bored',
      icon: <Clock size={18} color="#d97706" />,
      label: 'Bosan / Melamun',
      desc: 'Hanya ingin mengunyah sebagai distraksi',
      color: '#fffbeb',
      border: '#fde68a',
      activeColor: '#d97706'
    },
    {
      id: 'craving',
      icon: <Sparkles size={18} color="#e11d48" />,
      label: 'Hanya Ingin Manis',
      desc: 'Ingin mencicipi rasa manis tertentu',
      color: '#fff1f2',
      border: '#fecdd3',
      activeColor: '#e11d48'
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '430px',
        padding: '24px 22px',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#ffffff',
        borderRadius: '28px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.2)'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            cursor: 'pointer'
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '14px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Compass size={22} color="#059669" />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Panduan Mindful Eating
            </h3>
            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
              Refleksi Pola Makan Sadar & Kenali Tubuh Anda
            </span>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, margin: '0 0 14px' }}>
          Makan bukanlah soal 'hukuman' atau 'pantangan ketat'. Jeda sejenak untuk mengenali apa yang sebenarnya sedang dibutuhkan oleh tubuh Anda saat ini.
        </p>

        {/* Pertanyaan Interaktif */}
        <div style={{ marginBottom: '14px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '8px' }}>
            Apa yang sebenarnya sedang Anda rasakan?
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {feelings.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedFeeling(item.id);
                  if (item.id === 'stressed') setIsBreathingActive(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '14px',
                  border: selectedFeeling === item.id ? `2px solid ${item.activeColor}` : `1px solid ${item.border}`,
                  background: selectedFeeling === item.id ? item.color : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>{item.label}</div>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>{item.desc}</div>
                </div>
                {selectedFeeling === item.id && <CheckCircle2 size={16} color={item.activeColor} />}
              </button>
            ))}
          </div>
        </div>

        {/* Kotak Rekomendasi Mindful Berdasarkan Pilihan */}
        {selectedFeeling && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            padding: '14px',
            marginBottom: '14px'
          }}>
            {selectedFeeling === 'hungry' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Utensils size={15} color="#059669" />
                  <strong style={{ fontSize: '12.5px', color: '#065f46' }}>Tidak apa-apa untuk makan!</strong>
                </div>
                <p style={{ fontSize: '11.5px', color: '#475569', margin: '0 0 8px', lineHeight: 1.5 }}>
                  Tubuh Anda membutuhkan energi biologis. Pilihlah makanan padat gizi seimbang yang memadukan protein (telur/ikan/ayam), serat sayuran hijau, dan karbohidrat utuh.
                </p>
                <div style={{ fontSize: '10.5px', color: '#059669', background: '#ecfdf5', padding: '6px 10px', borderRadius: '10px' }}>
                  💡 <em>Makan dengan perlahan dan nikmati kunyahannya tanpa menatap layar HP.</em>
                </div>
              </div>
            )}

            {selectedFeeling === 'thirsty' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Droplets size={15} color="#0284c7" />
                  <strong style={{ fontSize: '12.5px', color: '#0369a1' }}>Coba Minum Air Putih Terlebih Dahulu</strong>
                </div>
                <p style={{ fontSize: '11.5px', color: '#475569', margin: '0 0 8px', lineHeight: 1.5 }}>
                  Hipotalamus di otak sering kali membingungkan sinyal rasa haus sebagai rasa lapar. Ambil 1 gelas besar air putih dingin atau hangat, minum perlahan, dan tunggu 5 menit.
                </p>
                <div style={{ fontSize: '10.5px', color: '#0284c7', background: '#f0f9ff', padding: '6px 10px', borderRadius: '10px' }}>
                  💧 <em>Sering kali keinginan ngemil mereda setelah sel tubuh terhidrasi baik.</em>
                </div>
              </div>
            )}

            {selectedFeeling === 'stressed' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Wind size={15} color="#7c3aed" />
                  <strong style={{ fontSize: '12.5px', color: '#5b21b6' }}>Penenang Sistem Saraf (Box Breathing 4-4-4)</strong>
                </div>
                <p style={{ fontSize: '11.5px', color: '#475569', margin: '0 0 8px', lineHeight: 1.45 }}>
                  Stres memicu lonjakan kortisol yang mendorong otak mencari dopamin manis. Lakukan napas berirama berikut selama 60 detik:
                </p>

                {/* Breathing Visualizer */}
                <div style={{
                  background: '#f5f3ff',
                  border: '1px solid #ddd6fe',
                  borderRadius: '16px',
                  padding: '12px',
                  textAlign: 'center',
                  marginBottom: '6px'
                }}>
                  <div style={{ fontSize: '11px', color: '#7c3aed', textTransform: 'uppercase', fontWeight: 700 }}>
                    {breathPhase}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#4c1d95', margin: '2px 0' }}>
                    {phaseCount}
                  </div>
                  <span style={{ fontSize: '10px', color: '#6d28d9' }}>Fokuskan perhatian pada tarikan & hembusan napas</span>
                </div>
              </div>
            )}

            {selectedFeeling === 'bored' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Clock size={15} color="#d97706" />
                  <strong style={{ fontSize: '12.5px', color: '#92400e' }}>Ubah Stimulasi Fisik Sejenak</strong>
                </div>
                <p style={{ fontSize: '11.5px', color: '#475569', margin: '0 0 8px', lineHeight: 1.5 }}>
                  Rasa bosan adalah sinyal otak mencari aktivitas baru, bukan makanan. Cobalah berdiri, berjalan santai 5 menit ke luar ruangan, regangkan bahu, atau cuci muka dengan air segar.
                </p>
                <div style={{ fontSize: '10.5px', color: '#92400e', background: '#fffbeb', padding: '6px 10px', borderRadius: '10px' }}>
                  🚶 <em>Gerakan tubuh ringan 5 menit efektif merestart fokus mental Anda.</em>
                </div>
              </div>
            )}

            {selectedFeeling === 'craving' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Sparkles size={15} color="#e11d48" />
                  <strong style={{ fontSize: '12.5px', color: '#9f1239' }}>Nikmati Secara Sadar Tanpa Rasa Bersalah</strong>
                </div>
                <p style={{ fontSize: '11.5px', color: '#475569', margin: '0 0 8px', lineHeight: 1.5 }}>
                  Anda tidak perlu 'menebus' makanan. Jika Anda memang memilih untuk menikmati sesuatu yang manis:
                </p>
                <ul style={{ fontSize: '11px', color: '#475569', margin: '0 0 8px', paddingLeft: '18px', lineHeight: 1.45 }}>
                  <li>Pilih porsi yang disadari (misal: 1 buah segar atau sepotong kecil dark chocolate).</li>
                  <li>Makan perlahan dan nikmati teksturnya tanpa terburu-buru.</li>
                  <li>Berhentilah saat rasa puas sudah tercapai.</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleFinish}
          className="btn-primary"
          style={{ width: '100%', padding: '12px', borderRadius: '14px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <CheckCircle2 size={16} /> Saya Memahami Kebutuhan Tubuh Saya
        </button>
      </div>
    </div>
  );
}
