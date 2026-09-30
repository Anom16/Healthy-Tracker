import React, { useState } from 'react';
import {
  logQuickWater,
  logQuickMeal,
  logQuickCaffeine,
  logQuickSleep,
  logQuickActivity,
  logQuickMood,
  db
} from '../services/db';

export default function SmartHabitLoggerModal({
  isOpen,
  onClose,
  onOpenScanner,
  onOpenPhoto,
  onSuccess
}) {
  const [activeSubModal, setActiveSubModal] = useState(null); // null | 'water' | 'meal' | 'sleep' | 'activity' | 'mood'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [recentLog, setRecentLog] = useState('+250ml Pure Spring logged at 10:15 AM');

  // Quick State
  const [mealType, setMealType] = useState('Lunch');
  const [mealSugar, setMealSugar] = useState(0);
  const [mealSodium, setMealSodium] = useState(300);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState(4);
  const [exerciseMinutes, setExerciseMinutes] = useState(30);

  if (!isOpen) return null;

  const showToast = (msg) => {
    setToastMessage(msg);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setRecentLog(`${msg} at ${timeStr}`);
    
    setTimeout(() => {
      setToastMessage('');
      if (onSuccess) onSuccess();
    }, 2200);
  };

  // Direct 1-tap loggers matching Stitch Rapid Bento Grid
  const handleQuickWater = async (amountMl) => {
    setIsSubmitting(true);
    try {
      await logQuickWater(amountMl);
      showToast(`+${amountMl}ml Air berhasil dicatat`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickMeal = async (type, name) => {
    setIsSubmitting(true);
    const typeMap = {
      Breakfast: 'Sarapan',
      Lunch: 'Makan Siang',
      Dinner: 'Makan Malam',
      Snack: 'Camilan'
    };
    try {
      await logQuickMeal({
        mealType: type,
        foodName: name || `${typeMap[type] || type} Seimbang`,
        sugarGrams: mealSugar,
        sodiumMg: mealSodium,
        isLateNight: false
      });
      showToast(`${typeMap[type] || type} berhasil dicatat`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickCaffeine = async (type) => {
    setIsSubmitting(true);
    try {
      await logQuickCaffeine(type || 'Coffee', 1);
      showToast(`+1 ${type === 'Coffee' ? 'Kopi' : type} berhasil dicatat`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSleep = async () => {
    setIsSubmitting(true);
    try {
      await logQuickSleep(sleepHours, sleepQuality);
      showToast(`${sleepHours} Jam Tidur berhasil dicatat`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickActivity = async (type, mins) => {
    setIsSubmitting(true);
    try {
      await logQuickActivity(type, mins);
      showToast(`${mins}m ${type} berhasil dicatat`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickMood = async (stateText) => {
    setIsSubmitting(true);
    try {
      await logQuickMood({
        energyLevel: 4,
        puffinessRating: 2,
        moodTag: stateText
      });
      showToast(`Kondisi: ${stateText} berhasil dicatat`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: 0
    }}>
      <div 
        className="modal-bottom-sheet"
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '16px 20px 32px',
          position: 'relative',
          background: 'var(--surface-container-low)',
          color: 'var(--on-surface)'
        }}
      >
        {/* Subtle Ambient Glow Aura */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '260px',
          height: '120px',
          background: 'rgba(134, 167, 137, 0.1)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }} />

        {/* Modal Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{
            width: '40px',
            height: '4px',
            backgroundColor: 'var(--surface-container-highest)',
            borderRadius: '999px',
            marginBottom: '12px',
            opacity: 0.8
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <h2 className="font-headline-md" style={{ color: 'var(--on-surface)', margin: 0, fontSize: '18px', fontWeight: 600 }}>
              Catat Cepat
            </h2>
            
            <button 
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface-container-high)',
                border: '1px solid var(--hairline-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--on-surface-variant)',
                cursor: 'pointer'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          </div>
        </div>

        {/* Fast Interactive Feedback Toast */}
        {toastMessage && (
          <div style={{
            marginBottom: '14px',
            width: '100%',
            backgroundColor: 'var(--secondary-container)',
            color: 'var(--on-secondary-container)',
            padding: '10px 14px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            border: '1px solid var(--hairline-border)',
            animation: 'fadeIn 0.25s ease'
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary-accent)', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            <span className="font-label-md" style={{ fontWeight: 600 }}>{toastMessage}</span>
          </div>
        )}

        {/* 8-Item Bento Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
          
          {/* 1. Water */}
          <div style={{
            background: 'var(--surface-container)',
            border: '1px solid var(--hairline-border)',
            borderRadius: '16px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '104px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--surface-container-high)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-accent)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>water_drop</span>
              </div>
              <span style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: '13px' }}>Air</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
              <button 
                onClick={() => handleQuickWater(250)}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  background: 'var(--surface-container-highest)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--on-surface)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                +250ml
              </button>
              <button 
                onClick={() => handleQuickWater(500)}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  background: 'var(--surface-container-highest)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--on-surface)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                +500ml
              </button>
            </div>
          </div>

          {/* 2. Sleep */}
          <div style={{
            background: 'var(--surface-container)',
            border: '1px solid var(--hairline-border)',
            borderRadius: '16px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '104px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--surface-container-high)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-accent)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>bedtime</span>
              </div>
              <span style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: '13px' }}>Tidur</span>
            </div>
            <button 
              onClick={handleQuickSleep}
              disabled={isSubmitting}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '6px 8px',
                background: 'rgba(134, 167, 137, 0.15)',
                border: 'none',
                borderRadius: '8px',
                color: 'var(--primary-accent)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Catat (7.5j)
            </button>
          </div>

          {/* 3. Nourishment */}
          <div style={{
            background: 'var(--surface-container)',
            border: '1px solid var(--hairline-border)',
            borderRadius: '16px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '104px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--surface-container-high)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-accent)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>restaurant</span>
              </div>
              <span style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: '13px' }}>Makan</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', marginTop: '8px' }}>
              <button 
                onClick={() => handleQuickMeal('Breakfast', 'Sarapan Seimbang')}
                style={{ padding: '5px 0', background: 'var(--surface-container-highest)', border: 'none', borderRadius: '6px', color: 'var(--on-surface)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
              >
                Pagi
              </button>
              <button 
                onClick={() => handleQuickMeal('Lunch', 'Makan Siang Seimbang')}
                style={{ padding: '5px 0', background: 'var(--surface-container-highest)', border: 'none', borderRadius: '6px', color: 'var(--on-surface)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
              >
                Siang
              </button>
              <button 
                onClick={() => handleQuickMeal('Dinner', 'Makan Malam')}
                style={{ padding: '5px 0', background: 'var(--surface-container-highest)', border: 'none', borderRadius: '6px', color: 'var(--on-surface)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
              >
                Malam
              </button>
              <button 
                onClick={() => handleQuickMeal('Snack', 'Camilan Sehat')}
                style={{ padding: '5px 0', background: 'var(--surface-container-highest)', border: 'none', borderRadius: '6px', color: 'var(--on-surface)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
              >
                Snack
              </button>
            </div>
          </div>

          {/* 4. Caffeine */}
          <div style={{
            background: 'var(--surface-container)',
            border: '1px solid var(--hairline-border)',
            borderRadius: '16px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '104px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--surface-container-high)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-accent)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>local_cafe</span>
              </div>
              <span style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: '13px' }}>Kafein</span>
            </div>
            <button 
              onClick={() => handleQuickCaffeine('Coffee')}
              disabled={isSubmitting}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '6px 8px',
                background: 'var(--surface-container-highest)',
                border: 'none',
                borderRadius: '8px',
                color: 'var(--primary-accent)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              +1 Kopi / Teh
            </button>
          </div>

          {/* 5. Activity */}
          <div style={{
            background: 'var(--surface-container)',
            border: '1px solid var(--hairline-border)',
            borderRadius: '16px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '104px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--surface-container-high)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-accent)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>directions_walk</span>
              </div>
              <span style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: '13px' }}>Aktivitas</span>
            </div>
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
              <button 
                onClick={() => handleQuickActivity('Jalan Santai', 30)}
                style={{ flex: 1, padding: '5px 0', background: 'var(--surface-container-highest)', border: 'none', borderRadius: '6px', color: 'var(--on-surface)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
              >
                Jalan
              </button>
              <button 
                onClick={() => handleQuickActivity('Latihan Beban', 45)}
                style={{ flex: 1, padding: '5px 0', background: 'var(--surface-container-highest)', border: 'none', borderRadius: '6px', color: 'var(--on-surface)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
              >
                Beban
              </button>
              <button 
                onClick={() => handleQuickActivity('Yoga & Stretch', 25)}
                style={{ flex: 1, padding: '5px 0', background: 'var(--surface-container-highest)', border: 'none', borderRadius: '6px', color: 'var(--on-surface)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
              >
                Yoga
              </button>
            </div>
          </div>

          {/* 6. Appearance / Photo */}
          <div style={{
            background: 'var(--surface-container)',
            border: '1px solid var(--hairline-border)',
            borderRadius: '16px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '104px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--surface-container-high)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-accent)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
              </div>
              <span style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: '13px' }}>Foto Wajah</span>
            </div>
            <button 
              onClick={() => {
                onClose();
                if (onOpenPhoto) onOpenPhoto();
              }}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '6px 8px',
                background: 'rgba(134, 167, 137, 0.15)',
                border: 'none',
                borderRadius: '8px',
                color: 'var(--primary-accent)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Ambil Foto
            </button>
          </div>

          {/* 7. Mental State */}
          <div style={{
            background: 'var(--surface-container)',
            border: '1px solid var(--hairline-border)',
            borderRadius: '16px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '104px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--surface-container-high)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-accent)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>mood</span>
              </div>
              <span style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: '13px' }}>Mood</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', marginTop: '8px' }}>
              <button onClick={() => handleQuickMood('Tenang')} style={{ padding: '5px 0', background: 'var(--surface-container-highest)', border: 'none', borderRadius: '6px', color: 'var(--on-surface)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Tenang</button>
              <button onClick={() => handleQuickMood('Berenergi')} style={{ padding: '5px 0', background: 'var(--surface-container-highest)', border: 'none', borderRadius: '6px', color: 'var(--on-surface)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Semangat</button>
              <button onClick={() => handleQuickMood('Stabil')} style={{ padding: '5px 0', background: 'var(--surface-container-highest)', border: 'none', borderRadius: '6px', color: 'var(--on-surface)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Stabil</button>
              <button onClick={() => handleQuickMood('Letih')} style={{ padding: '5px 0', background: 'var(--surface-container-highest)', border: 'none', borderRadius: '6px', color: 'var(--on-surface)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Lelah</button>
            </div>
          </div>

          {/* 8. Label Scanner */}
          <div style={{
            background: 'var(--surface-container)',
            border: '1px solid var(--hairline-border)',
            borderRadius: '16px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '104px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--surface-container-high)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-accent)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>document_scanner</span>
              </div>
              <span style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: '13px' }}>Pindai</span>
            </div>
            <button 
              onClick={() => {
                onClose();
                if (onOpenScanner) onOpenScanner();
              }}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '6px 8px',
                background: 'var(--surface-container-highest)',
                border: 'none',
                borderRadius: '8px',
                color: 'var(--primary-accent)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Buka Scanner
            </button>
          </div>

        </div>

        {/* Recent Log Indicator & Audit Pill from Stitch */}
        <div style={{
          width: '100%',
          backgroundColor: 'var(--surface-container)',
          border: '1px solid var(--hairline-border)',
          padding: '12px 16px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'rgba(134, 167, 137, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-accent)',
              flexShrink: 0
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>history</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span className="font-label-caps" style={{ color: 'var(--outline)', fontSize: '10px' }}>
                CATATAN TERAKHIR
              </span>
              <span className="font-body-md" style={{ color: 'var(--on-surface)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {recentLog}
              </span>
            </div>
          </div>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-accent)', flexShrink: 0 }} className="pulse-indicator" />
        </div>

        {/* Primary Action Capsule (Complete Session) */}
        <button
          onClick={() => {
            showToast('Data kebiasaan berhasil disimpan');
            setTimeout(onClose, 800);
          }}
          className="btn-sanctuary-primary"
          style={{ width: '100%', padding: '14px 20px', fontSize: '15px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check</span>
          <span>Selesai &amp; Sinkronkan</span>
        </button>

      </div>
    </div>
  );
}
