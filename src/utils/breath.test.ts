import { calculateBreathProgress } from './breath';
import { BreathPhase } from '../types';

const phases: BreathPhase[] = [
  { label: 'Tarik napas', sec: 4, scale: 'up' },
  { label: 'Tahan', sec: 4, scale: 'hold' },
  { label: 'Embuskan', sec: 4, scale: 'down' },
  { label: 'Tahan', sec: 4, scale: 'hold' },
];

const rounds = 4;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    throw new Error(`FAIL: ${msg}`);
  }
}

console.log('Running Breath Progress Unit Tests (Issue 2 Table)...');

// 1. elapsed_sec = 0
const r0 = calculateBreathProgress(0, phases, rounds);
assert(r0.currentRound === 1, `r0 round should be 1, got ${r0.currentRound}`);
assert(r0.currentPhase.label === 'Tarik napas', `r0 label should be 'Tarik napas', got ${r0.currentPhase.label}`);
assert(r0.phaseRemainingSec === 4, `r0 phaseRemainingSec should be 4, got ${r0.phaseRemainingSec}`);
console.log('✓ elapsed_sec = 0: Putaran 1 dari 4, Tarik napas, sisa fase 4');

// 2. elapsed_sec = 3.9
const r3_9 = calculateBreathProgress(3.9, phases, rounds);
assert(r3_9.currentRound === 1, `r3_9 round should be 1, got ${r3_9.currentRound}`);
assert(r3_9.currentPhase.label === 'Tarik napas', `r3_9 label should be 'Tarik napas', got ${r3_9.currentPhase.label}`);
assert(r3_9.phaseRemainingSec === 1, `r3_9 phaseRemainingSec should be 1, got ${r3_9.phaseRemainingSec}`);
console.log('✓ elapsed_sec = 3.9: Putaran 1 dari 4, Tarik napas, sisa fase 1');

// 3. elapsed_sec = 4
const r4 = calculateBreathProgress(4, phases, rounds);
assert(r4.currentRound === 1, `r4 round should be 1, got ${r4.currentRound}`);
assert(r4.currentPhase.label === 'Tahan', `r4 label should be 'Tahan', got ${r4.currentPhase.label}`);
assert(r4.phaseRemainingSec === 4, `r4 phaseRemainingSec should be 4, got ${r4.phaseRemainingSec}`);
console.log('✓ elapsed_sec = 4: Putaran 1 dari 4, Tahan, sisa fase 4');

// 4. elapsed_sec = 15.9
const r15_9 = calculateBreathProgress(15.9, phases, rounds);
assert(r15_9.currentRound === 1, `r15_9 round should be 1, got ${r15_9.currentRound}`);
assert(r15_9.currentPhase.label === 'Tahan', `r15_9 label should be 'Tahan', got ${r15_9.currentPhase.label}`);
assert(r15_9.phaseIndex === 3, `r15_9 phaseIndex should be 3 (last phase), got ${r15_9.phaseIndex}`);
assert(r15_9.phaseRemainingSec === 1, `r15_9 phaseRemainingSec should be 1, got ${r15_9.phaseRemainingSec}`);
console.log('✓ elapsed_sec = 15.9: Putaran 1 dari 4, Tahan (fase terakhir), sisa fase 1');

// 5. elapsed_sec = 16
const r16 = calculateBreathProgress(16, phases, rounds);
assert(r16.currentRound === 2, `r16 round should be 2, got ${r16.currentRound}`);
assert(r16.currentPhase.label === 'Tarik napas', `r16 label should be 'Tarik napas', got ${r16.currentPhase.label}`);
assert(r16.phaseRemainingSec === 4, `r16 phaseRemainingSec should be 4, got ${r16.phaseRemainingSec}`);
console.log('✓ elapsed_sec = 16: Putaran 2 dari 4, Tarik napas');

// 6. elapsed_sec = 48
const r48 = calculateBreathProgress(48, phases, rounds);
assert(r48.currentRound === 4, `r48 round should be 4, got ${r48.currentRound}`);
assert(r48.currentPhase.label === 'Tarik napas', `r48 label should be 'Tarik napas', got ${r48.currentPhase.label}`);
assert(r48.phaseRemainingSec === 4, `r48 phaseRemainingSec should be 4, got ${r48.phaseRemainingSec}`);
console.log('✓ elapsed_sec = 48: Putaran 4 dari 4, Tarik napas');

// 7. elapsed_sec = 64
const r64 = calculateBreathProgress(64, phases, rounds);
assert(r64.isComplete === true, `r64 isComplete should be true, got ${r64.isComplete}`);
assert(r64.totalRemainingSec === 0, `r64 totalRemainingSec should be 0, got ${r64.totalRemainingSec}`);
console.log('✓ elapsed_sec = 64: Selesai, maju otomatis');

console.log('\nALL 7 ACCEPTANCE CRITERIA FROM ISSUE 2 TABLE PASSED PERFECTLY!');
