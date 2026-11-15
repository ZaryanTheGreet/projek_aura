import React, { useState, useEffect, useRef } from 'react';
import { Exercise, ExerciseStep, PoseType } from '../types';
import { Button } from '../components/UI';
import { Companion } from '../components/Companion';
import { HumanFigure } from '../components/HumanFigure';
import { api } from '../api';
import { calculateBreathProgress } from '../utils/breath';

interface ExercisePlayerProps {
  exercise: Exercise;
  onFinish: () => void;
  onExit: () => void;
}

type ScreenPhase = 'intro' | 'active' | 'completed';

export const ExercisePlayer: React.FC<ExercisePlayerProps> = ({
  exercise,
  onFinish,
  onExit,
}) => {
  const [phase, setPhase] = useState<ScreenPhase>('intro');
  const [stepIndex, setStepIndex] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // In-memory buffer for write steps (never saved to localStorage)
  const [writeMemory, setWriteMemory] = useState<Record<number, string>>({});

  // Auto-advance temporary completion state ("Selesai" banner for ~1.5s before moving)
  const [isStepFinishing, setIsStepFinishing] = useState(false);

  // Time & animation tracking
  const [elapsedSec, setElapsedSec] = useState(0);
  const [sequenceIndex, setSequenceIndex] = useState(0);

  // References for precision rAF
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const pauseStartRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const lastNavTimeRef = useRef<number>(0);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentStep: ExerciseStep | undefined = exercise.steps[stepIndex];
  const totalSteps = exercise.steps.length;

  // Derive duration for current step
  const getStepDuration = (step: ExerciseStep | undefined): number => {
    if (!step) return 30;
    if (step.duration_sec) return step.duration_sec;
    if (step.kind === 'breath' && step.phases) {
      const cycle = step.phases.reduce((a, b) => a + b.sec, 0);
      const rounds = step.rounds || 4;
      return cycle * rounds;
    }
    if (step.kind === 'timer') return step.seconds || 60;
    if (step.kind === 'observe') return 150;
    if (step.kind === 'pose') {
      if (step.sequence) return step.sequence.reduce((a, s) => a + s.sec, 0);
      return 15;
    }
    return 30;
  };

  const stepDuration = getStepDuration(currentStep);
  const isGuidedStep = currentStep
    ? ['breath', 'count_guide', 'observe', 'timer', 'pose'].includes(currentStep.kind)
    : false;

  // Reset clock when entering a new step
  useEffect(() => {
    if (phase !== 'active' || !currentStep) return;

    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }

    setElapsedSec(0);
    setIsStepFinishing(false);
    setIsPaused(false);
    setSequenceIndex(0);

    startTimeRef.current = performance.now();
    pausedTimeRef.current = 0;
    pauseStartRef.current = 0;
  }, [stepIndex, phase]);

  // Master timer loop using performance.now()
  useEffect(() => {
    if (phase !== 'active' || !currentStep || !isGuidedStep) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    if (isPaused) {
      if (pauseStartRef.current === 0) {
        pauseStartRef.current = performance.now();
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    } else {
      if (pauseStartRef.current > 0) {
        pausedTimeRef.current += performance.now() - pauseStartRef.current;
        pauseStartRef.current = 0;
      }
    }

    const loop = (now: number) => {
      const totalElapsed = (now - startTimeRef.current - pausedTimeRef.current) / 1000;
      const safeElapsed = Math.max(0, totalElapsed);
      setElapsedSec(safeElapsed);

      // Check pose sequence progression
      if (currentStep.kind === 'pose' && currentStep.sequence) {
        let acc = 0;
        let sIdx = 0;
        for (let i = 0; i < currentStep.sequence.length; i++) {
          acc += currentStep.sequence[i].sec;
          if (safeElapsed < acc || i === currentStep.sequence.length - 1) {
            sIdx = i;
            break;
          }
        }
        setSequenceIndex(sIdx);
      }

      // Check auto-advance trigger
      if (safeElapsed >= stepDuration) {
        if (!isStepFinishing) {
          setIsStepFinishing(true);
          autoAdvanceTimeoutRef.current = setTimeout(() => {
            handleNext(true);
          }, 1500);
        }
        return; // stop loop
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, isPaused, stepIndex, currentStep, isGuidedStep, stepDuration, isStepFinishing]);

  // Keyboard controls
  useEffect(() => {
    if (phase !== 'active') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (isGuidedStep) {
          setIsPaused((p) => !p);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, stepIndex, currentStep, isPaused, isGuidedStep]);

  const handleNext = (auto = false) => {
    const now = Date.now();
    if (!auto && now - lastNavTimeRef.current < 300) return;
    lastNavTimeRef.current = now;

    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }

    if (stepIndex < totalSteps - 1) {
      setStepIndex((idx) => idx + 1);
    } else {
      // Completed all steps
      api.logExerciseSession(exercise.id, undefined, true);
      setPhase('completed');
    }
  };

  const handlePrev = () => {
    const now = Date.now();
    if (now - lastNavTimeRef.current < 300) return;
    lastNavTimeRef.current = now;

    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }

    if (stepIndex > 0) {
      setStepIndex((idx) => idx - 1);
    }
  };

  const handleQuitConfirm = () => {
    api.logExerciseSession(exercise.id, undefined, false);
    onExit();
  };

  // Remaining time for current step
  const remainingTotalSec = Math.max(0, Math.ceil(stepDuration - elapsedSec));
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Breath calculations (derived purely from elapsedSec)
  const breathCalc = currentStep?.kind === 'breath'
    ? calculateBreathProgress(elapsedSec, currentStep.phases || [], currentStep.rounds || 4)
    : null;

  // Pose calculations
  let activePose: PoseType = currentStep?.pose || 'sit';
  let activePoseCue = currentStep?.cue || '';
  let nextPoseCue = '';
  let poseSectionRemaining = remainingTotalSec;

  if (currentStep?.kind === 'pose' && currentStep.sequence && currentStep.sequence.length > 0) {
    const currentSeq = currentStep.sequence[sequenceIndex];
    activePose = currentSeq.pose;
    activePoseCue = currentSeq.cue || '';

    // Calculate time remaining in this sequence segment
    let pastSec = 0;
    for (let i = 0; i < sequenceIndex; i++) {
      pastSec += currentStep.sequence[i].sec;
    }
    const seqElapsed = Math.max(0, elapsedSec - pastSec);
    poseSectionRemaining = Math.max(1, Math.ceil(currentSeq.sec - seqElapsed));

    if (sequenceIndex < currentStep.sequence.length - 1) {
      const nextSeq = currentStep.sequence[sequenceIndex + 1];
      nextPoseCue = nextSeq.cue || nextSeq.pose.replace('_', ' ');
    }
  }

  // Count guide calculations (Issue 4)
  const countMax = currentStep?.max || 5;
  const countProgress = Math.min(1, elapsedSec / stepDuration);
  const activeCountIndex = Math.min(countMax, Math.floor(countProgress * countMax) + 1);

  // Intro Screen
  if (phase === 'intro') {
    return (
      <div className="app-container-no-nav" style={{ padding: '24px 20px', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <span className="text-caption">Langkah kecil</span>
            <button
              type="button"
              onClick={onExit}
              aria-label="Keluar"
              style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', fontSize: 18, cursor: 'pointer', padding: 8 }}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <h1 className="text-h1" style={{ marginBottom: 8 }}>{exercise.title}</h1>
          <p className="text-caption" style={{ marginBottom: 16 }}>
            Sekitar {exercise.duration_min} menit
          </p>

          <p className="text-body" style={{ marginBottom: 20 }}>
            {exercise.benefit}
          </p>

          <div
            className="aura-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '28px 16px',
              marginBottom: 20,
            }}
          >
            <HumanFigure pose={exercise.steps[0]?.pose || 'sit'} size={110} />
            <p className="text-caption" style={{ marginTop: 12, textAlign: 'center' }}>
              Cari posisi nyaman. Kamu bisa berhenti kapan saja tanpa rasa bersalah.
            </p>
          </div>
        </div>

        <div>
          <Button variant="primary" style={{ width: '100%', marginBottom: 12 }} onClick={() => setPhase('active')}>
            Mulai latihan
          </Button>
          <p className="text-caption" style={{ textAlign: 'center' }}>
            Ini bukan pengganti bantuan profesional.
          </p>
        </div>
      </div>
    );
  }

  // Completed Screen
  if (phase === 'completed') {
    return (
      <div
        className="app-container-no-nav"
        style={{
          padding: '32px 20px',
          textAlign: 'center',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ maxWidth: 360, margin: '0 auto' }}>
          <Companion state="neutral" size={100} pose="sit" />
          <h1 className="text-h1" style={{ marginTop: 24, marginBottom: 8 }}>
            Selesai.
          </h1>
          <p className="text-body" style={{ color: 'var(--ink-muted)', marginBottom: 32 }}>
            Terima kasih sudah meluangkan waktu sejenak untuk dirimu.
          </p>

          <Button variant="primary" style={{ width: '100%', marginBottom: 16 }} onClick={onFinish}>
            Selesai
          </Button>
          <p className="text-caption">
            Latihan ini dirancang untuk jeda singkat, bukan pengganti bantuan profesional.
          </p>
        </div>
      </div>
    );
  }

  // Active step rendering
  return (
    <div className="app-container-no-nav" style={{ padding: '16px 20px', justifyContent: 'space-between' }}>
      <div>
        {/* Top bar: Exit, Step info & Time remaining (Issue 1) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            aria-label="Keluar dari latihan"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-muted)',
              fontSize: 18,
              cursor: 'pointer',
              padding: 8,
              minWidth: 44,
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>

          <div style={{ textAlign: 'center' }}>
            <span className="text-caption" style={{ display: 'block', fontWeight: 600 }}>
              Langkah {stepIndex + 1} dari {totalSteps}
            </span>
            {isGuidedStep && (
              <span className="text-caption tabular-nums" style={{ fontSize: 12 }}>
                Sisa {formatTime(remainingTotalSec)}
              </span>
            )}
          </div>

          <div style={{ width: 44 }} />
        </div>

        {/* Step Progress Bar (scaleX) */}
        <div
          style={{
            width: '100%',
            height: 3,
            backgroundColor: 'var(--border)',
            borderRadius: 999,
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'var(--ink)',
              transform: `scaleX(${isGuidedStep ? Math.min(1, elapsedSec / stepDuration) : (stepIndex + 1) / totalSteps})`,
              transformOrigin: 'left',
              transition: isPaused ? 'none' : 'transform 200ms linear',
            }}
          />
        </div>

        {/* Visual Area (approx 240px height) */}
        <div
          style={{
            height: 250,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            marginBottom: 16,
            padding: 16,
            position: 'relative',
          }}
        >
          {/* Status "Selesai" banner when step finishes before auto-advance */}
          {isStepFinishing && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                backgroundColor: 'var(--ink)',
                color: 'var(--surface)',
                padding: '4px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                zIndex: 20,
              }}
            >
              Langkah selesai, melanjutkan...
            </div>
          )}

          {/* 1. BREATH GUIDE (Issue 1, 2, 5) */}
          {currentStep?.kind === 'breath' && breathCalc && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
              }}
              aria-label={`Latihan napas: ${breathCalc.currentPhase.label} sisa ${breathCalc.phaseRemainingSec} detik. Putaran ${breathCalc.currentRound} dari ${breathCalc.totalRounds}.`}
            >
              {/* Outer boundary ring + Inner scaling circle (Issue 5) */}
              <div
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  border: '1px dashed var(--border-control)', // Static outer ring showing max target size!
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 130,
                    height: 130,
                    borderRadius: '50%',
                    border: '2px solid var(--ink)',
                    backgroundColor: 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `scale(${0.68 + breathCalc.scaleProgress * 0.32})`,
                    transition: isPaused ? 'none' : 'transform 100ms linear',
                  }}
                >
                  <span className="text-h2" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
                    {breathCalc.currentPhase.label}
                  </span>
                  <span className="tabular-nums" style={{ fontSize: 26, fontWeight: 700, marginTop: 2 }}>
                    {breathCalc.phaseRemainingSec}
                  </span>
                </div>
              </div>

              {/* Strip of 4 rectangular phase segments below circle (Issue 5) */}
              <div style={{ display: 'flex', gap: 6, width: 140, marginTop: 12 }}>
                {(currentStep.phases || []).map((p, idx) => {
                  const isActive = idx === breathCalc.phaseIndex;
                  const isPast = idx < breathCalc.phaseIndex;
                  return (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        height: 5,
                        backgroundColor: 'var(--border)',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          backgroundColor: 'var(--ink)',
                          width: isPast ? '100%' : isActive ? `${Math.min(100, breathCalc.phaseProgress * 100)}%` : '0%',
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Info text: Round and Next phase (Issue 5 answers question 3) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 220, marginTop: 8 }}>
                <span className="text-caption" style={{ fontSize: 11, fontWeight: 600 }}>
                  Putaran {breathCalc.currentRound} dari {breathCalc.totalRounds}
                </span>
                <span className="text-caption" style={{ fontSize: 11, color: 'var(--ink)' }}>
                  Berikutnya: {breathCalc.nextPhase.label}
                </span>
              </div>
            </div>
          )}

          {/* 2. COUNT GUIDE (Issue 4 - Automatic, no tap dots!) */}
          {currentStep?.kind === 'count_guide' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              {currentStep.icon && (
                <i className={`fa-solid ${currentStep.icon}`} style={{ fontSize: 28, marginBottom: 8, color: 'var(--ink)' }} />
              )}
              <div className="text-display" style={{ fontSize: 44, marginBottom: 6 }}>
                {activeCountIndex} / {countMax}
              </div>
              <p className="text-body" style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
                Hal ke-{activeCountIndex} dari {countMax}
              </p>

              {/* N automatic rectangular segment bars */}
              <div style={{ display: 'flex', gap: 6, width: '100%', maxWidth: 240 }}>
                {Array.from({ length: countMax }).map((_, i) => {
                  const isFilled = i < activeCountIndex;
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 6,
                        borderRadius: 2,
                        backgroundColor: isFilled ? 'var(--ink)' : 'var(--border)',
                        transition: 'background-color 200ms ease',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. POSE (Issue 5 - Human figure, target ghost, cue lines) */}
          {currentStep?.kind === 'pose' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <HumanFigure pose={activePose} size={130} />
              {activePoseCue && (
                <p className="text-body" style={{ fontWeight: 600, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
                  {activePoseCue}
                </p>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 6, alignItems: 'center' }}>
                <span className="text-caption tabular-nums" style={{ fontSize: 12, fontWeight: 600 }}>
                  Tahan: {poseSectionRemaining}d
                </span>
                {nextPoseCue && (
                  <span className="text-caption" style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                    · Berikutnya: {nextPoseCue}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 4. OBSERVE (Issue 4 - Mindful breath observation) */}
          {currentStep?.kind === 'observe' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <Companion state="neutral" size={85} pose="sit" />
              <div className="text-display" style={{ fontSize: 36, marginTop: 10 }}>
                {formatTime(remainingTotalSec)}
              </div>
              <p className="text-caption" style={{ marginTop: 4, fontStyle: 'italic', fontSize: 12 }}>
                Napasmu tidak perlu mengikuti gerakan apa pun.
              </p>
            </div>
          )}

          {/* 5. TIMER */}
          {currentStep?.kind === 'timer' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Companion state="neutral" size={80} pose="sit" />
              <div className="text-display" style={{ fontSize: 44, marginTop: 8 }}>
                {formatTime(remainingTotalSec)}
              </div>
              <p className="text-caption" style={{ marginTop: 4 }}>
                Hitung mundur jeda
              </p>
            </div>
          )}

          {/* 6. WRITE (With timer remaining & "Waktu habis" badge if timed) */}
          {currentStep?.kind === 'write' && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {currentStep.seconds && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="text-caption tabular-nums">
                    Sisa waktu: {formatTime(remainingTotalSec)}
                  </span>
                  {remainingTotalSec === 0 && (
                    <span
                      style={{
                        backgroundColor: 'var(--border-control)',
                        color: 'var(--surface)',
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      Waktu habis (lanjutkan saat siap)
                    </span>
                  )}
                </div>
              )}
              <textarea
                className="aura-textarea"
                style={{ flex: 1, minHeight: 120, border: 'none', background: 'transparent', resize: 'none' }}
                placeholder={currentStep.placeholder || 'Tulis di sini...'}
                value={writeMemory[stepIndex] || ''}
                onChange={(e) => setWriteMemory({ ...writeMemory, [stepIndex]: e.target.value })}
              />
              <span className="text-caption" style={{ alignSelf: 'flex-start', fontStyle: 'italic', fontSize: 11 }}>
                Tulisan ini tidak disimpan di mana pun.
              </span>
            </div>
          )}

          {/* 7. TEXT default */}
          {currentStep?.kind === 'text' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <HumanFigure pose={currentStep.pose || 'sit'} size={110} showGhost={false} />
            </div>
          )}
        </div>

        {/* Step Instructions */}
        <h1 className="text-h1" style={{ fontSize: 20, marginBottom: 6 }}>
          {currentStep?.text}
        </h1>
        {currentStep?.hint && <p className="text-caption" style={{ marginBottom: 4 }}>{currentStep.hint}</p>}
        {currentStep?.kind === 'pose' && (
          <p className="text-caption" style={{ color: 'var(--ink-muted)', fontStyle: 'italic', fontSize: 12 }}>
            Berhenti kalau terasa sakit.
          </p>
        )}
      </div>

      {/* Bottom Controls: [Sebelumnya] [Jeda/Lanjutkan] [Lanjut/Selesai] */}
      <div style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Button
            type="button"
            variant="secondary"
            onClick={handlePrev}
            disabled={stepIndex === 0}
            style={{ flex: 1 }}
          >
            <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }} />
            Sebelumnya
          </Button>

          {isGuidedStep && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPaused((p) => !p)}
              style={{ flex: 1 }}
            >
              {isPaused ? 'Lanjutkan' : 'Jeda'}
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            onClick={() => handleNext(false)}
            style={{ flex: 1.4 }}
          >
            {stepIndex === totalSteps - 1 ? 'Selesai' : 'Lanjut'}
          </Button>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="aura-overlay" role="dialog" aria-modal="true">
          <div className="aura-sheet" style={{ padding: 24 }}>
            <h2 className="text-h2" style={{ marginBottom: 8 }}>
              Berhenti sekarang?
            </h2>
            <p className="text-body" style={{ color: 'var(--ink-muted)', marginBottom: 20 }}>
              Tidak apa-apa, kamu bisa mulai lagi kapan saja tanpa rasa bersalah.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button variant="primary" onClick={() => setShowExitModal(false)}>
                Lanjutkan latihan
              </Button>
              <Button variant="secondary" onClick={handleQuitConfirm}>
                Berhenti
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
