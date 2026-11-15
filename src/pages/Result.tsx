import React, { useState, useEffect } from 'react';
import { JournalEntry, Exercise } from '../types';
import { Button, Card, ZonePill, Chip } from '../components/UI';
import { Companion } from '../components/Companion';
import { getZoneFromIndex, EXERCISES_LIBRARY } from '../api';

interface ResultProps {
  entry: JournalEntry;
  onFinish: () => void;
  onViewTrend: () => void;
  onStartExercise: (exercise: Exercise) => void;
  onOpenTaskBreaker?: () => void;
  onOpenCounselorSummary?: () => void;
  onOpenCareMode?: () => void;
}

export const Result: React.FC<ResultProps> = ({
  entry,
  onFinish,
  onViewTrend,
  onStartExercise,
  onOpenTaskBreaker,
  onOpenCounselorSummary,
  onOpenCareMode,
}) => {
  // If crisis_flag, safety rule: no scores, redirect to Care Mode
  useEffect(() => {
    if (entry.crisis_flag && onOpenCareMode) {
      onOpenCareMode();
    }
  }, [entry.crisis_flag, onOpenCareMode]);

  // Target score & index
  const targetScore = entry.daily_stress_score;
  const targetIndex = entry.burnout_index;
  const effectiveZone = getZoneFromIndex(targetIndex, targetScore);

  // Count-up animation state (~1200 ms)
  const [displayValue, setDisplayValue] = useState(0);
  const [morphCompanion, setMorphCompanion] = useState(false);

  useEffect(() => {
    const endVal = targetIndex !== null ? targetIndex : targetScore;
    const duration = 1200;
    const start = performance.now();

    const frame = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // Easing cubic-bezier(0.22, 1, 0.36, 1) or easeOutQuad
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * endVal));

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setMorphCompanion(true);
      }
    };

    requestAnimationFrame(frame);
  }, [targetIndex, targetScore]);

  const recommendedExercise =
    EXERCISES_LIBRARY.find((e) => e.id === entry.recommended_exercise_id) ||
    EXERCISES_LIBRARY[0];

  return (
    <div className="app-container-no-nav" style={{ padding: '24px 20px 48px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 className="text-h2" style={{ fontSize: 18 }}>Hasil Refleksi Hari Ini</h1>
        <ZonePill zone={effectiveZone} />
      </div>

      {/* Hero Score & Companion Signature Moment */}
      <div
        className="aura-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 20px',
          marginBottom: 16,
        }}
      >
        <div>
          <span className="text-caption" style={{ display: 'block', marginBottom: 4 }}>
            {targetIndex !== null ? 'Indeks beban 7 hari' : 'Beban hari ini'}
          </span>
          <div className="text-display" style={{ fontSize: 64 }}>
            {displayValue}
            {targetIndex === null && (
              <span style={{ fontSize: 24, fontWeight: 500, color: 'var(--ink-muted)' }}>
                /10
              </span>
            )}
          </div>
          {targetIndex !== null && (
            <span className="text-caption" style={{ marginTop: 4, display: 'block' }}>
              Beban hari ini: {targetScore}/10
            </span>
          )}
        </div>

        <Companion
          state={morphCompanion ? effectiveZone : 'neutral'}
          size={90}
          pose={effectiveZone === 'calm' ? 'sit' : effectiveZone === 'watch' ? 'stand' : 'neck_left'}
        />
      </div>

      {/* Description & Validation */}
      <div className="fade-up-card" style={{ animationDelay: '150ms', marginBottom: 16 }}>
        <Card>
          <p className="text-body" style={{ fontWeight: 600, marginBottom: 4 }}>
            {entry.mood_status}
          </p>
          <p className="text-body" style={{ color: 'var(--ink-muted)', marginBottom: 8 }}>
            {entry.remediation_tips}
          </p>
          {entry.validation && (
            <p className="text-caption" style={{ color: 'var(--ink)', fontStyle: 'italic', borderLeft: '2px solid var(--ink)', paddingLeft: 8 }}>
              {entry.validation}
            </p>
          )}

          {/* Neutral Trigger Chips */}
          {entry.triggers && entry.triggers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {entry.triggers.map((t, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid var(--border)',
                    fontSize: 12,
                    color: 'var(--ink)',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Small Step Recommendation Card */}
      <div className="fade-up-card" style={{ animationDelay: '300ms', marginBottom: 16 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <i className="fa-solid fa-leaf" style={{ color: 'var(--ink)', fontSize: 16 }} />
            <h2 className="text-h2" style={{ fontSize: 16 }}>Langkah kecil untukmu</h2>
          </div>
          <p className="text-body" style={{ fontWeight: 600, marginBottom: 2 }}>
            {recommendedExercise.title}
          </p>
          <p className="text-caption" style={{ marginBottom: 6 }}>
            Sekitar {recommendedExercise.duration_min} menit
          </p>
          <p className="text-caption" style={{ color: 'var(--ink)', marginBottom: 14 }}>
            {recommendedExercise.benefit}
          </p>
          <Button
            variant="secondary"
            style={{ width: '100%' }}
            onClick={() => onStartExercise(recommendedExercise)}
          >
            Mulai langkah ini
          </Button>
        </Card>
      </div>

      {/* Task Breaker link if suggested */}
      {entry.suggest_task_breaker && onOpenTaskBreaker && (
        <div className="fade-up-card" style={{ animationDelay: '400ms', marginBottom: 16 }}>
          <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="text-body" style={{ fontWeight: 600 }}>Tugas terasa menumpuk?</p>
              <p className="text-caption">Pecah jadi langkah kecil 15 menit agar tidak membebani pikiran.</p>
            </div>
            <Button variant="secondary" onClick={onOpenTaskBreaker} style={{ minHeight: 40, padding: '0 14px' }}>
              Pecah tugas
            </Button>
          </Card>
        </div>
      )}

      {/* Soft Counselor Card if Heavy Zone */}
      {effectiveZone === 'heavy' && (
        <div className="fade-up-card" style={{ animationDelay: '450ms', marginBottom: 16 }}>
          <Card style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-control)' }}>
            <p className="text-body" style={{ fontWeight: 600, marginBottom: 6 }}>
              Beban terasa cukup berat beberapa hari ini
            </p>
            <p className="text-caption" style={{ marginBottom: 12 }}>
              Kalau beban ini terus terasa, berbicara dengan konselor, layanan EAP kantor, atau orang yang kamu percaya bisa sangat membantu.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {onOpenCareMode && (
                <Button variant="secondary" onClick={onOpenCareMode} style={{ minHeight: 38, fontSize: 13, padding: '0 12px' }}>
                  Lihat kontak bantuan
                </Button>
              )}
              {onOpenCounselorSummary && (
                <Button variant="text" onClick={onOpenCounselorSummary} style={{ minHeight: 38, fontSize: 13, padding: '0 12px' }}>
                  Ringkasan untuk konselor
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="fade-up-card" style={{ animationDelay: '500ms', marginTop: 12 }}>
        <Button variant="primary" style={{ width: '100%', marginBottom: 12 }} onClick={onFinish}>
          Selesai
        </Button>
        <button
          type="button"
          className="aura-btn-text"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={onViewTrend}
        >
          Lihat tren catatanmu
        </button>
      </div>
    </div>
  );
};
