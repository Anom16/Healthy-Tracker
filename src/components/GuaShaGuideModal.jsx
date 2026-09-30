import React, { useState } from 'react';
import { X, Sparkles, ChevronRight, ChevronLeft, Check, Compass } from 'lucide-react';
import confetti from 'canvas-confetti';

const STEPS = [
  {
    title: '1. Neck Drainage (Kunci Utama)',
    target: 'Leher & Tulang Selangka',
    desc: 'Langkah paling krusial! Buka "jalur keluar" cairan getah bening. Usap lembut dari belakang bawah telinga turun ke tulang selangka (klavikula).',
    direction: '⬇️ Arah: Dari telinga ke bawah menuju leher',
    reps: '10x sisi kiri & 10x sisi kanan',
    tip: 'Gunakan tekanan sangat lembut, jangan ditekan keras.'
  },
  {
    title: '2. Jawline Sculpt (Meniruskan Dagu)',
    target: 'Garis Rahang & Double Chin',
    desc: 'Bentuk garis rahang tajam (V-shape). Letakkan jari telunjuk/tengah atau alat Gua Sha di ujung dagu, tarik mendatar mengikuti tulang rahang hingga ke bawah daun telinga.',
    direction: '↗️ Arah: Dagu tengah mengarah ke telinga',
    reps: '10x tiap sisi',
    tip: 'Lakukan gerakan satu arah, jangan bolak-balik.'
  },
  {
    title: '3. Cheekbone Lift (Mengempiskan Pipi)',
    target: 'Pipi Chubby & Tulang Pipi',
    desc: 'Mengempiskan sembab di pipi tengah. Tempelkan di samping cuping hidung, lalu tarik meluncur ke atas melewati tulang pipi hingga ke pelipis.',
    direction: '↗️ Arah: Dari samping hidung naik ke pelipis',
    reps: '8x tiap sisi',
    tip: 'Oleskan moisturizer atau face oil tipis-tipis agar kulit licin.'
  },
  {
    title: '4. Under-Eye Debloat (Kantung Mata)',
    target: 'Bawah Mata & Mata Sembab',
    desc: 'Keluarkan cairan yang menumpuk di bawah mata akibat garam atau kurang tidur. Geser dengan tekanan seringan bulu dari sudut dalam mata ke arah luar.',
    direction: '➡️ Arah: Dari dalam ke luar',
    reps: '8x tiap mata',
    tip: 'Kulit bawah mata sangat tipis, gunakan jari manis dengan sentuhan halus.'
  },
  {
    title: '5. Forehead Smoothing (Dahi & Alis)',
    target: 'Dahi & Pengendur Stres Wajah',
    desc: 'Relaksasi otot ekspresi wajah dan memperlancar aliran sirkulasi darah ke kepala. Tarik dari atas alis lurus ke atas menuju garis rambut.',
    direction: '⬆️ Arah: Dari alis ke atas batas rambut',
    reps: '10x usapan merata',
    tip: 'Tutup dengan mengusap kembali dari pelipis turun ke leher.'
  }
];

export default function GuaShaGuideModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const handleFinish = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        padding: '24px',
        borderRadius: '28px',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.18)'
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
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '12px',
            padding: '8px',
            color: '#006c49'
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: 'var(--font-heading)' }}>5-Menit Face Sculpting</h3>
            <span style={{ fontSize: '11.5px', color: '#006c49', fontWeight: 600 }}>Lymphatic Drainage & Rahang Tirus</span>
          </div>
        </div>

        {/* Step Progress Pills */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: '5px',
                borderRadius: '9999px',
                background: idx === currentStep ? '#006c49' : (idx < currentStep ? '#10b981' : '#e2e8f0'),
                transition: 'background 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* Step Card */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '18px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#006c49', fontWeight: 700, textTransform: 'uppercase' }}>
              Langkah {currentStep + 1} dari 5
            </span>
            <span style={{
              background: '#ecfdf5',
              color: '#006c49',
              fontSize: '11px',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontWeight: 700,
              border: '1px solid #a7f3d0'
            }}>
              {step.reps}
            </span>
          </div>

          <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0f172a', marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>{step.title}</h4>
          
          <div style={{
            fontSize: '12px',
            color: '#0284c7',
            fontWeight: 600,
            background: '#e0f2fe',
            border: '1px solid #bae6fd',
            padding: '4px 10px',
            borderRadius: '9999px',
            display: 'inline-block',
            marginBottom: '10px'
          }}>
            {step.direction}
          </div>

          <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.55, marginBottom: '12px' }}>
            {step.desc}
          </p>

          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            padding: '8px 12px',
            borderRadius: '12px',
            fontSize: '11.5px',
            color: '#b45309',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Compass size={14} color="#d97706" /> Tips: {step.tip}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="btn-secondary"
              style={{ flex: 1, padding: '10px 14px', fontSize: '12.5px', borderRadius: '9999px' }}
            >
              <ChevronLeft size={16} /> Sebelumnya
            </button>
          )}

          {!isLast ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="btn-primary"
              style={{ flex: 2, padding: '10px 16px', fontSize: '12.5px', borderRadius: '9999px' }}
            >
              Lanjut Langkah Berikutnya <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="btn-primary"
              style={{ flex: 2, padding: '10px 16px', fontSize: '12.5px', borderRadius: '9999px' }}
            >
              <Check size={16} /> Selesai Pijat Wajah!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
