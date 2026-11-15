import { BreathPhase } from '../types';

export interface BreathCalculation {
  cycleLen: number;
  totalDuration: number;
  currentRound: number;
  totalRounds: number;
  phaseIndex: number;
  currentPhase: BreathPhase;
  nextPhase: BreathPhase;
  phaseRemainingSec: number;
  phaseElapsedSec: number;
  phaseProgress: number; // 0 to 1 in current phase
  totalRemainingSec: number;
  isComplete: boolean;
  scaleProgress: number; // 0 (contracted, ~0.65) to 1 (expanded, 1.0)
}

/**
 * Pure calculation function for breath guide derived strictly from elapsed seconds.
 * Solves Issue 1 & Issue 2 by providing a single source of truth without per-tick state accumulation.
 */
export function calculateBreathProgress(
  elapsedSec: number,
  phases: BreathPhase[],
  rounds: number
): BreathCalculation {
  const safePhases = phases && phases.length > 0 ? phases : [
    { label: 'Tarik napas', sec: 4, scale: 'up' as const },
    { label: 'Tahan', sec: 4, scale: 'hold' as const },
    { label: 'Embuskan', sec: 4, scale: 'down' as const },
    { label: 'Tahan', sec: 4, scale: 'hold' as const },
  ];

  const cycleLen = safePhases.reduce((acc, p) => acc + p.sec, 0);
  const totalRounds = Math.max(1, rounds);
  const totalDuration = cycleLen * totalRounds;

  // Clamp elapsed
  const clampedElapsed = Math.max(0, elapsedSec);
  const isComplete = clampedElapsed >= totalDuration;

  const currentRound = Math.min(
    totalRounds,
    Math.floor(clampedElapsed / cycleLen) + 1
  );

  const posInCycle = isComplete ? cycleLen : clampedElapsed % cycleLen;

  // Find phase
  let accumulated = 0;
  let phaseIndex = 0;
  for (let i = 0; i < safePhases.length; i++) {
    const end = accumulated + safePhases[i].sec;
    if (posInCycle < end || i === safePhases.length - 1) {
      phaseIndex = i;
      break;
    }
    accumulated = end;
  }

  const currentPhase = safePhases[phaseIndex];
  const nextPhase = safePhases[(phaseIndex + 1) % safePhases.length];

  const phaseStart = accumulated;
  const phaseEnd = phaseStart + currentPhase.sec;
  const phaseElapsedSec = Math.max(0, Math.min(currentPhase.sec, posInCycle - phaseStart));
  const phaseRemainingSec = Math.max(1, Math.ceil(phaseEnd - posInCycle));
  const phaseProgress = currentPhase.sec > 0 ? phaseElapsedSec / currentPhase.sec : 1;

  const totalRemainingSec = Math.max(0, Math.ceil(totalDuration - clampedElapsed));

  // Compute smooth scaleProgress between 0 (contracted) and 1 (expanded)
  let scaleProgress = 0.5;
  if (currentPhase.scale === 'up') {
    scaleProgress = phaseProgress; // 0 -> 1
  } else if (currentPhase.scale === 'down') {
    scaleProgress = 1 - phaseProgress; // 1 -> 0
  } else {
    // 'hold'
    // check previous phase scale to know if holding at expanded (1) or contracted (0)
    const prevPhase = safePhases[(phaseIndex - 1 + safePhases.length) % safePhases.length];
    scaleProgress = prevPhase.scale === 'up' ? 1 : 0;
  }

  return {
    cycleLen,
    totalDuration,
    currentRound,
    totalRounds,
    phaseIndex,
    currentPhase,
    nextPhase,
    phaseRemainingSec,
    phaseElapsedSec,
    phaseProgress,
    totalRemainingSec,
    isComplete,
    scaleProgress,
  };
}
