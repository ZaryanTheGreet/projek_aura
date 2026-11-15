import React, { useState, useEffect } from 'react';
import { Card, Button } from '../components/UI';
import { Companion } from '../components/Companion';
import { api } from '../api';

interface TaskBreakerProps {
  onBack: () => void;
}

interface StepItem {
  id: number;
  text: string;
  minutes: number;
  done: boolean;
}

export const TaskBreaker: React.FC<TaskBreakerProps> = ({ onBack }) => {
  const [taskInput, setTaskInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<StepItem[]>([]);
  const [focusTimerActive, setFocusTimerActive] = useState(false);
  const [focusTimeLeft, setFocusTimeLeft] = useState(15 * 60);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (focusTimerActive && focusTimeLeft > 0) {
      interval = setInterval(() => {
        setFocusTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (focusTimeLeft === 0) {
      setFocusTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [focusTimerActive, focusTimeLeft]);

  const handleBreakdown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;

    setLoading(true);
    try {
      const generated = await api.breakdownTask(taskInput);
      setSteps(generated.map((s) => ({ ...s, done: false })));
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (id: number) => {
    setSteps(
      steps.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  const startFocusTimer = (minutes = 15) => {
    setFocusTimeLeft(minutes * 60);
    setFocusTimerActive(true);
  };

  return (
    <div className="app-container-no-nav" style={{ padding: '20px 20px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="text-h1" style={{ fontSize: 22 }}>Pemecah Tugas Besar</h1>
          <p className="text-caption">Ubah tugas yang membebani jadi langkah 15 menit</p>
        </div>
        <Button variant="text" onClick={onBack} aria-label="Kembali">
          <i className="fa-solid fa-xmark" style={{ fontSize: 18 }} />
        </Button>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <form onSubmit={handleBreakdown}>
          <label htmlFor="task-name" className="text-body" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Tugas apa yang terasa paling berat hari ini?
          </label>
          <input
            id="task-name"
            type="text"
            className="aura-input"
            placeholder="Contoh: Menyusun laporan kuartalan dan analisis data klien"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <Button type="submit" variant="primary" style={{ width: '100%' }} disabled={!taskInput.trim() || loading}>
            {loading ? 'Memecah langkah...' : 'Pecah jadi langkah kecil'}
          </Button>
        </form>
      </Card>

      {/* Focus Timer Card */}
      {focusTimerActive && (
        <Card style={{ marginBottom: 20, textAlign: 'center', padding: '20px 16px' }}>
          <Companion state="neutral" size={60} pose="sit" />
          <p className="text-caption" style={{ marginTop: 8 }}>Sesi fokus tanpa distraksi</p>
          <div className="text-display" style={{ fontSize: 44, margin: '8px 0' }}>
            {Math.floor(focusTimeLeft / 60)}:{(focusTimeLeft % 60).toString().padStart(2, '0')}
          </div>
          <Button variant="secondary" onClick={() => setFocusTimerActive(false)} style={{ minHeight: 36, fontSize: 13 }}>
            Selesaikan fokus
          </Button>
        </Card>
      )}

      {/* Steps List */}
      {steps.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 className="text-h2" style={{ fontSize: 16 }}>Langkah yang Bisa Dikerjakan</h2>
            {!focusTimerActive && (
              <button
                type="button"
                className="aura-btn-text"
                onClick={() => startFocusTimer(15)}
                style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600, padding: 0 }}
              >
                <i className="fa-solid fa-stopwatch" style={{ marginRight: 6 }} />
                Mulai fokus 15 menit
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {steps.map((step) => (
              <div
                key={step.id}
                onClick={() => toggleStep(step.id)}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') toggleStep(step.id);
                }}
              >
                <Card
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    backgroundColor: step.done ? 'var(--bg)' : 'var(--surface)',
                    opacity: step.done ? 0.7 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={step.done}
                    onChange={() => toggleStep(step.id)}
                    aria-label={`Tandai langkah ${step.id} selesai`}
                    style={{ width: 20, height: 20, cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <p
                      className="text-body"
                      style={{
                        fontSize: 14,
                        textDecoration: step.done ? 'line-through' : 'none',
                        color: step.done ? 'var(--ink-muted)' : 'var(--ink)',
                      }}
                    >
                      {step.text}
                    </p>
                  </div>
                  <span className="text-caption tabular-nums" style={{ flexShrink: 0 }}>
                    ~{step.minutes}m
                  </span>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
