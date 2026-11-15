import {
  JournalEntry,
  CheckinInput,
  Exercise,
  ExerciseSession,
  FollowupPending,
  TriggerSummaryResponse,
  TrustedContact,
  BreakPlan,
  ReminderConfig,
  HRDashboardData,
  Division,
  ZoneType,
  TriggerCategory,
  InterpretationCase,
} from './types';

export const USE_MOCK = true;

const delay = (ms = 900) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Calculate zone from score or index
export function getZoneFromIndex(index: number | null, fallbackScore?: number): ZoneType {
  if (index !== null) {
    if (index >= 70) return 'heavy';
    if (index >= 40) return 'watch';
    return 'calm';
  }
  if (fallbackScore !== undefined) {
    if (fallbackScore >= 7) return 'heavy';
    if (fallbackScore >= 4) return 'watch';
    return 'calm';
  }
  return 'calm';
}

export function getZoneLabel(zone: ZoneType): string {
  switch (zone) {
    case 'calm':
      return 'Tenang';
    case 'watch':
      return 'Waspada';
    case 'heavy':
      return 'Butuh istirahat';
  }
}

// Scoring rules
export function calculateDailyStressFromCheckin(mental: number, energy: number): number {
  // score = clamp(round(1 + (0.7*mental_stress + 0.3*energy_drain - 1) * 2.25), 1, 10)
  const raw = 1 + (0.7 * mental + 0.3 * energy - 1) * 2.25;
  const rounded = Math.round(raw);
  return Math.min(10, Math.max(1, rounded));
}

export function calculateDailyStressFromJournal(text: string): {
  score: number;
  crisis_flag: boolean;
  triggers: string[];
  trigger_keys: string[];
  category: TriggerCategory;
} {
  const lower = text.toLowerCase();

  // Crisis detection
  const crisisPhrases = [
    'bunuh diri',
    'ingin mati',
    'menyakiti diri',
    'suicide',
    'akhiri hidup',
    'tidak sanggup hidup lagi',
    'mengakhiri hidup',
  ];
  const crisis_flag = crisisPhrases.some((phrase) => lower.includes(phrase));

  // Triggers detection
  const triggerMatches: { key: string; label: string; cat: TriggerCategory }[] = [];

  if (lower.includes('deadline') || lower.includes('tenggat')) {
    triggerMatches.push({ key: 'deadline_kerja', label: 'Deadline kerja', cat: 'workload' });
  }
  if (lower.includes('numpuk') || lower.includes('beban') || lower.includes('banyak')) {
    triggerMatches.push({ key: 'beban_numpuk', label: 'Beban numpuk', cat: 'workload' });
  }
  if (lower.includes('rapat') || lower.includes('meeting') || lower.includes('zoom')) {
    triggerMatches.push({ key: 'rapat_beruntun', label: 'Rapat beruntun', cat: 'workload' });
  }
  if (lower.includes('lembur') || lower.includes('malam') || lower.includes('overtime')) {
    triggerMatches.push({ key: 'lembur', label: 'Lembur', cat: 'workload' });
  }
  if (lower.includes('atasan') || lower.includes('bos') || lower.includes('rekan') || lower.includes('klien')) {
    triggerMatches.push({ key: 'atasan_rekan', label: 'Atasan atau rekan kerja', cat: 'relasi_kerja' });
  }
  if (lower.includes('tidur') || lower.includes('begadang') || lower.includes('ngantuk')) {
    triggerMatches.push({ key: 'kurang_tidur', label: 'Kurang tidur', cat: 'fisik_istirahat' });
  }
  if (lower.includes('lelah') || lower.includes('capek') || lower.includes('pegal') || lower.includes('sakit')) {
    triggerMatches.push({ key: 'kelelahan_fisik', label: 'Kelelahan fisik', cat: 'fisik_istirahat' });
  }
  if (lower.includes('overthinking') || lower.includes('cemas') || lower.includes('takut') || lower.includes('gelisah')) {
    triggerMatches.push({ key: 'overthinking', label: 'Overthinking', cat: 'lainnya' });
  }

  if (triggerMatches.length === 0) {
    triggerMatches.push({ key: 'umum', label: 'Beban kerja umum', cat: 'workload' });
  }

  const detectedKeywordsCount = triggerMatches.length;
  // Mock score: 3 + 1.5 per detected burden keyword, bounded 1-10
  const rawScore = Math.round(3 + detectedKeywordsCount * 1.5);
  const score = Math.min(10, Math.max(1, rawScore));

  const primaryCat = triggerMatches[0]?.cat || 'workload';

  return {
    score,
    crisis_flag,
    triggers: triggerMatches.map((t) => t.label),
    trigger_keys: triggerMatches.map((t) => t.key),
    category: primaryCat,
  };
}

export function calculateBurnoutIndex(entries: JournalEntry[]): number | null {
  // From up to 7 latest entries (minimum 3)
  if (entries.length < 3) return null;

  const slice = entries.slice(-7);
  const n = slice.length;

  let weightedSum = 0;
  let weightSum = 0;
  let highLoadCount = 0;

  slice.forEach((entry, idx) => {
    const weight = idx + 1; // 1 to n (most recent heaviest)
    weightedSum += entry.daily_stress_score * weight;
    weightSum += weight;
    if (entry.daily_stress_score >= 7) {
      highLoadCount++;
    }
  });

  const weightedMean = weightedSum / weightSum;
  const scaled = ((weightedMean - 1) / 9) * 100;
  const persistence = (highLoadCount / n) * 100;
  const index = Math.round(0.7 * scaled + 0.3 * persistence);

  return Math.min(100, Math.max(0, index));
}

// 9 Mock Exercises
export const EXERCISES_LIBRARY: Exercise[] = [
  {
    id: 'ex_box_breathing',
    title: 'Napas kotak',
    duration_min: 3,
    suits: ['deadline_kerja', 'overthinking', 'umum'],
    benefit: 'Membantu tubuh melambat saat pikiran terasa penuh.',
    steps: [
      {
        kind: 'pose',
        pose: 'sit',
        duration_sec: 10,
        cue: 'Duduk nyaman dan lepaskan bahu.',
        text: 'Duduk nyaman dan lepaskan bahu.',
      },
      {
        kind: 'breath',
        text: 'Ikuti lingkaran. Tarik napas lewat hidung, tahan, lalu embuskan pelan lewat mulut.',
        duration_sec: 64,
        phases: [
          { label: 'Tarik napas', sec: 4, scale: 'up' },
          { label: 'Tahan', sec: 4, scale: 'hold' },
          { label: 'Embuskan', sec: 4, scale: 'down' },
          { label: 'Tahan', sec: 4, scale: 'hold' },
        ],
        rounds: 4,
      },
      {
        kind: 'text',
        pose: 'sit',
        text: 'Kembali bernapas seperti biasa. Perhatikan bagaimana badanmu terasa sekarang.',
      },
    ],
  },
  {
    id: 'ex_grounding',
    title: 'Kembali ke saat ini (5-4-3-2-1)',
    duration_min: 4,
    suits: ['overthinking', 'atasan_rekan', 'umum'],
    benefit: 'Mengalihkan perhatian dari pikiran yang berputar ke apa yang ada di sekitarmu.',
    steps: [
      {
        kind: 'count_guide',
        max: 5,
        duration_sec: 25,
        icon: 'fa-eye',
        text: 'Sebutkan pelan-pelan 5 hal yang kamu lihat.',
        hint: 'Perhatikan benda di sekitarmu satu per satu secara tenang.',
      },
      {
        kind: 'count_guide',
        max: 4,
        duration_sec: 20,
        icon: 'fa-hand',
        text: 'Sebutkan 4 hal yang bisa kamu sentuh.',
        hint: 'Rasakan tekstur meja, kain baju, atau permukaan di dekatmu.',
      },
      {
        kind: 'count_guide',
        max: 3,
        duration_sec: 15,
        icon: 'fa-ear-listen',
        text: 'Sebutkan 3 hal yang kamu dengar.',
        hint: 'Dengarkan suara pendingin ruangan, ketikan keyboard, atau suara di luar.',
      },
      {
        kind: 'count_guide',
        max: 2,
        duration_sec: 10,
        text: 'Sebutkan 2 hal yang bisa kamu cium aromanya.',
        hint: 'Perhatikan aroma kopi, udara ruangan, atau aroma di sekitarmu.',
      },
      {
        kind: 'count_guide',
        max: 1,
        duration_sec: 10,
        text: 'Sebutkan 1 rasa di lidahmu, lalu tarik napas dalam sekali.',
        hint: 'Rasakan rasa di mulutmu dan selesaikan dengan napas dalam.',
      },
    ],
  },
  {
    id: 'ex_reframe',
    title: 'Lihat pikiranmu dari sisi lain',
    duration_min: 6,
    suits: ['overthinking', 'atasan_rekan', 'deadline_kerja'],
    benefit: 'Membantu menimbang pikiran yang terasa terlalu keras pada dirimu sendiri.',
    steps: [
      {
        kind: 'write',
        text: 'Tulis satu pikiran yang paling mengganggu sekarang.',
        placeholder: 'Contoh: aku pasti mengecewakan tim jika tugas ini terlambat',
      },
      {
        kind: 'write',
        text: 'Tulis apa yang membuat pikiran itu terasa nyata.',
        placeholder: 'Contoh: karena tenggatnya besok sore dan belum kelar',
      },
      {
        kind: 'write',
        text: 'Tulis apa bukti bahwa hal tersebut mungkin tidak sepenuhnya seburuk itu.',
        placeholder: 'Contoh: aku sudah menyelesaikan 80% dan bisa minta bantuan rekan kerja',
      },
      {
        kind: 'write',
        text: 'Tulis versi yang lebih seimbang, seperti yang akan kamu katakan ke rekan kerjamu.',
        placeholder: 'Contoh: wajar kalau terdesak, yang penting komunikasikan progres dengan jujur.',
      },
    ],
  },
  {
    id: 'ex_one_priority',
    title: 'Pilih satu prioritas hari ini',
    duration_min: 5,
    suits: ['beban_numpuk', 'deadline_kerja', 'lembur'],
    benefit: 'Mengurangi rasa kewalahan dengan memilih satu hal saja untuk sekarang.',
    steps: [
      {
        kind: 'write',
        text: 'Tulis semua pekerjaan yang sedang menunggu, tanpa perlu diurutkan.',
        placeholder: 'Tulis daftar tugas yang berseliweran di kepala...',
      },
      {
        kind: 'write',
        text: 'Tulis satu hal yang paling dekat tenggatnya atau paling penting dampaknya.',
        placeholder: 'Satu prioritas utama...',
      },
      {
        kind: 'write',
        text: 'Tulis langkah pertama yang bisa selesai dalam 15 menit ke depan.',
        placeholder: 'Langkah terkecil untuk mulai...',
      },
      {
        kind: 'text',
        text: 'Yang tidak muat hari ini, catat untuk dijadwalkan ulang atau dibicarakan dengan atasan besok.',
      },
    ],
  },
  {
    id: 'ex_between_meetings',
    title: 'Jeda 2 menit antar rapat',
    duration_min: 2,
    suits: ['rapat_beruntun', 'atasan_rekan'],
    benefit: 'Memberi ruang bernapas di antara rapat yang berurutan.',
    steps: [
      {
        kind: 'pose',
        duration_sec: 20,
        sequence: [
          { pose: 'neck_left', sec: 5, cue: 'Miringkan kepala pelan ke kiri' },
          { pose: 'neck_right', sec: 5, cue: 'Miringkan kepala pelan ke kanan' },
          { pose: 'arms_up', sec: 10, cue: 'Angkat kedua lengan ke atas dan regangkan tubuh' },
        ],
        text: 'Berdiri dan regangkan leher serta bahu.',
      },
      {
        kind: 'breath',
        duration_sec: 30,
        text: 'Tarik tiga napas dalam dan pelan.',
        phases: [
          { label: 'Tarik napas', sec: 4, scale: 'up' },
          { label: 'Embuskan', sec: 6, scale: 'down' },
        ],
        rounds: 3,
      },
      {
        kind: 'write',
        text: 'Tulis satu hal terpenting yang perlu kamu capai di rapat berikutnya.',
        placeholder: 'Tujuan singkat di rapat nanti...',
      },
    ],
  },
  {
    id: 'ex_screen_break',
    title: 'Jeda 10 menit tanpa layar',
    duration_min: 10,
    suits: ['kelelahan_fisik', 'kurang_tidur', 'rapat_beruntun', 'umum'],
    benefit: 'Memberi mata dan kepala waktu istirahat yang nyata.',
    steps: [
      {
        kind: 'pose',
        pose: 'stand',
        duration_sec: 10,
        cue: 'Berdiri tegak, jauhkan diri dari meja kerja',
        text: 'Jauhkan diri dari meja kerja dan letakkan ponsel.',
      },
      {
        kind: 'pose',
        duration_sec: 30,
        sequence: [
          { pose: 'neck_left', sec: 10, cue: 'Miringkan kepala pelan ke kiri, rasakan regangan leher' },
          { pose: 'neck_right', sec: 10, cue: 'Miringkan kepala pelan ke kanan secara perlahan' },
          { pose: 'arms_up', sec: 10, cue: 'Angkat lengan ke atas dan regangkan bahu' },
        ],
        text: 'Berdiri, regangkan leher dan bahu pelan-pelan.',
      },
      {
        kind: 'text',
        pose: 'stand',
        text: 'Minum segelas air putih dan regangkan pergelangan tangan.',
      },
      {
        kind: 'timer',
        seconds: 120,
        duration_sec: 120,
        text: 'Lihat keluar jendela atau ke titik terjauh selama 2 menit (aturan 20-20-20).',
      },
    ],
  },
  {
    id: 'ex_brain_dump',
    title: 'Tuang isi kepala',
    duration_min: 5,
    suits: ['overthinking', 'beban_numpuk', 'kurang_tidur'],
    benefit: 'Memindahkan pikiran ke tulisan supaya kepala terasa lebih ringan.',
    steps: [
      {
        kind: 'text',
        text: 'Siapkan diri sejenak. Tulisan ini tidak disimpan di mana pun.',
      },
      {
        kind: 'write',
        seconds: 180,
        duration_sec: 180,
        text: 'Tulis semua yang berputar di kepala selama 3 menit, tanpa menyaring.',
        placeholder: 'Tuangkan apa pun yang mengganjal...',
      },
      {
        kind: 'write',
        text: 'Tandai 1-2 hal yang bisa dikerjakan besok.',
        placeholder: 'Yang bisa ditunda sampai besok...',
      },
      {
        kind: 'text',
        pose: 'sit',
        text: "Tutup pikiranmu dan katakan pada diri sendiri: 'Sudah tercatat, besok kulanjutkan.'",
      },
    ],
  },
  {
    id: 'ex_mindful_breath',
    title: 'Tiga menit memperhatikan napas',
    duration_min: 3,
    suits: ['umum', 'kurang_tidur', 'atasan_rekan', 'rapat_beruntun'],
    benefit: 'Latihan sederhana untuk memperhatikan saat ini tanpa menilai.',
    steps: [
      {
        kind: 'pose',
        pose: 'sit',
        duration_sec: 10,
        cue: 'Duduk nyaman dan turunkan bahu',
        text: 'Pejamkan mata atau turunkan pandangan dengan santai.',
      },
      {
        kind: 'observe',
        duration_sec: 150,
        text: 'Perhatikan napas masuk dan keluar tanpa mengubah ritmenya.',
        hint: 'Biarkan napas mengalir alami. Nafasmu tidak perlu mengikuti gerakan apa pun.',
      },
      {
        kind: 'text',
        pose: 'sit',
        text: 'Kalau pikiran melayang, sadari lalu kembali ke napas, tanpa menyalahkan diri.',
      },
    ],
  },
  {
    id: 'ex_shutdown',
    title: 'Ritual menutup hari kerja',
    duration_min: 5,
    suits: ['lembur', 'deadline_kerja', 'beban_numpuk', 'umum'],
    benefit: 'Memberi tanda jelas bahwa hari kerja sudah selesai.',
    steps: [
      {
        kind: 'write',
        text: 'Tulis tiga hal yang sudah kamu selesaikan hari ini, sekecil apa pun.',
        placeholder: '1. ...\n2. ...\n3. ...',
      },
      {
        kind: 'write',
        text: 'Tulis satu hal pertama untuk besok pagi agar tidak memikirkannya malam ini.',
        placeholder: 'Besok pagi mulai dari...',
      },
      {
        kind: 'text',
        pose: 'sit',
        text: 'Tutup laptop dan matikan notifikasi chat kantor jika memungkinkan.',
      },
      {
        kind: 'text',
        pose: 'sit',
        text: "Katakan pada dirimu: 'Hari ini cukup.'",
      },
    ],
  },
];

// 29 Days realistic baseline sample data
function createSampleEntries(): JournalEntry[] {
  const now = new Date('2026-11-01T17:30:00Z');
  const entries: JournalEntry[] = [];

  // 29 days back
  const patterns = [
    { daysAgo: 28, mental: 2, energy: 2, trig: 'umum', note: 'Hari Senin yang cukup santai, catch up mingguan aman.' },
    { daysAgo: 27, mental: 2, energy: 3, trig: 'rapat_beruntun', note: 'Banyak meeting tapi tugas harian selesai.' },
    { daysAgo: 26, mental: 3, energy: 3, trig: 'deadline_kerja', note: 'Mulai garap revisi materi presentasi klien.' },
    { daysAgo: 25, mental: 3, energy: 2, trig: 'umum', note: 'Diskusi lancar bareng tim desain.' },
    { daysAgo: 24, mental: 2, energy: 2, trig: 'umum', note: 'Jumat selesai tepat waktu, weekend santai.' },
    { daysAgo: 21, mental: 3, energy: 3, trig: 'beban_numpuk', note: 'Awal sprint baru, backlog lumayan panjang.' },
    { daysAgo: 20, mental: 3, energy: 4, trig: 'kelelahan_fisik', note: 'Agak pegal di leher karena duduk seharian.' },
    { daysAgo: 19, mental: 4, energy: 4, trig: 'deadline_kerja', note: 'Sprint planning rada molor, ada revisi mendadak.' },
    { daysAgo: 18, mental: 4, energy: 3, trig: 'atasan_rekan', note: 'Miskomunikasi dengan lead terkait estimasi waktu.' },
    { daysAgo: 17, mental: 4, energy: 4, trig: 'lembur', note: 'Lembur sampai jam 8 malam untuk ngejar rilis bugfix.' },
    // A heavy week (days 16 to 10)
    { daysAgo: 14, mental: 5, energy: 4, trig: 'deadline_kerja', note: 'Deadline proyek Q4 dimajukan seminggu, rasanya overwhelmed.' },
    { daysAgo: 13, mental: 5, energy: 5, trig: 'beban_numpuk', note: 'Rapat berturut-turut dari pagi sampai sore, tugas utama belum tersentuh.' },
    { daysAgo: 12, mental: 4, energy: 5, trig: 'kurang_tidur', note: 'Tidur hanya 4 jam, kepala pusing dan mata lelah.' },
    { daysAgo: 11, mental: 5, energy: 4, trig: 'atasan_rekan', note: 'Ekspektasi atasan terasa berat dan feedback terlalu mendadak.' },
    { daysAgo: 10, mental: 4, energy: 5, trig: 'lembur', note: 'Lembur lagi, makan malam seadanya di meja kerja.' },
    // Recovery week
    { daysAgo: 7, mental: 3, energy: 4, trig: 'umum', note: 'Mencoba ambil jeda dan delegasi tugas ke tim.' },
    { daysAgo: 6, mental: 3, energy: 3, trig: 'rapat_beruntun', note: 'Rapat lebih terkendali, ada jeda antar sesi.' },
    { daysAgo: 5, mental: 2, energy: 3, trig: 'umum', note: 'Fokus beresin satu per satu, kepala lebih lega.' },
    { daysAgo: 4, mental: 3, energy: 2, trig: 'deadline_kerja', note: 'Kirim draf laporan pertama, tinggal menunggu review.' },
    { daysAgo: 3, mental: 2, energy: 2, trig: 'umum', note: 'Jumat yang tenang, wrap-up tugas minggu ini.' },
    // Last 2 days
    { daysAgo: 1, mental: 4, energy: 3, trig: 'deadline_kerja', note: 'Mulai persiapan rilis awal bulan, tenggat lumayan mepet.' },
    { daysAgo: 0, mental: 4, energy: 4, trig: 'rapat_beruntun', note: 'Hari ini melelahkan, rapat dari pagi dan deadline laporan belum selesai.' },
  ];

  for (let i = 0; i < patterns.length; i++) {
    const p = patterns[i];
    const dateObj = new Date(now.getTime() - p.daysAgo * 86400000);
    const dateStr = dateObj.toISOString().split('T')[0];
    const score = calculateDailyStressFromCheckin(p.mental, p.energy);

    const entry: JournalEntry = {
      id: `j_${dateStr}`,
      created_at: dateObj.toISOString(),
      date: dateStr,
      daily_stress_score: score,
      burnout_index: null, // will be computed in sequence
      mood_status: score >= 7 ? 'Beban tinggi hari ini' : score >= 4 ? 'Waspada beban bertambah' : 'Kondisi stabil',
      triggers: [p.trig === 'deadline_kerja' ? 'Deadline kerja' : p.trig === 'rapat_beruntun' ? 'Rapat beruntun' : p.trig === 'lembur' ? 'Lembur' : p.trig === 'atasan_rekan' ? 'Atasan atau rekan kerja' : p.trig === 'kurang_tidur' ? 'Kurang tidur' : 'Beban dan deadline kerja'],
      trigger_keys: [p.trig],
      trigger_category: p.trig === 'atasan_rekan' ? 'relasi_kerja' : p.trig === 'kurang_tidur' || p.trig === 'kelelahan_fisik' ? 'fisik_istirahat' : 'workload',
      remediation_tips: 'Prioritaskan satu hal mendesak dan ambil jeda 10 menit tanpa layar sebelum jam pulang.',
      recommended_exercise_id: p.trig === 'rapat_beruntun' ? 'ex_between_meetings' : p.trig === 'atasan_rekan' ? 'ex_grounding' : 'ex_box_breathing',
      suggest_task_breaker: p.mental >= 4,
      crisis_flag: false,
      journal_text: p.note,
    };
    entries.push(entry);
    // Recalculate burnout index progressively
    entry.burnout_index = calculateBurnoutIndex(entries);
  }

  return entries;
}

// Local storage management
const STORAGE_KEYS = {
  ENTRIES: 'aura_entries',
  SESSIONS: 'aura_exercise_sessions',
  TRUSTED_CONTACT: 'aura_trusted_contact',
  BREAK_PLAN: 'aura_break_plan',
  REMINDERS: 'aura_reminders',
  AUTH: 'aura_token',
  HR_AUTH: 'aura_hr_token',
  HR_OPT_IN: 'aura_hr_opt_in',
};

export const api = {
  // Init or reset
  initStorage(forceSample = false) {
    if (forceSample || !localStorage.getItem(STORAGE_KEYS.ENTRIES)) {
      const sample = createSampleEntries();
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(sample));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REMINDERS)) {
      const defaultReminders: ReminderConfig = {
        close_day: { enabled: false, time: '18:00', days: [1, 2, 3, 4, 5] },
        daily_note: { enabled: false, time: '16:30', days: [1, 2, 3, 4, 5] },
        calendar_title: 'Waktunya menutup hari kerja',
      };
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(defaultReminders));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BREAK_PLAN)) {
      const defaultBreakPlan: BreakPlan = {
        end_time: '18:00',
        ritual_ids: ['close_laptop', 'note_tomorrow'],
        reminder_enabled: false,
      };
      localStorage.setItem(STORAGE_KEYS.BREAK_PLAN, JSON.stringify(defaultBreakPlan));
    }
  },

  clearAllData(): Promise<boolean> {
    localStorage.removeItem(STORAGE_KEYS.ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.TRUSTED_CONTACT);
    localStorage.removeItem(STORAGE_KEYS.BREAK_PLAN);
    localStorage.removeItem(STORAGE_KEYS.REMINDERS);
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem(STORAGE_KEYS.HR_AUTH);
    localStorage.removeItem(STORAGE_KEYS.HR_OPT_IN);
    return Promise.resolve(true);
  },

  seedEmptyUser() {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.TRUSTED_CONTACT);
  },

  seedSample30Days() {
    const sample = createSampleEntries();
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(sample));
  },

  // Auth
  loginSimulation(email: string): Promise<{ token: string; role: 'employee' }> {
    const token = 'aura-token-' + Date.now();
    localStorage.setItem(STORAGE_KEYS.AUTH, token);
    localStorage.setItem('aura_user_email', email);
    return delay(600).then(() => ({ token, role: 'employee' }));
  },

  loginHRSimulation(email: string): Promise<{ token: string; role: 'hrd' }> {
    const token = 'aura-hr-token-' + Date.now();
    localStorage.setItem(STORAGE_KEYS.HR_AUTH, token);
    localStorage.setItem('aura_hr_email', email);
    return delay(600).then(() => ({ token, role: 'hrd' }));
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem(STORAGE_KEYS.HR_AUTH);
  },

  getCurrentRole(): 'employee' | 'hrd' | null {
    if (localStorage.getItem(STORAGE_KEYS.HR_AUTH)) return 'hrd';
    if (localStorage.getItem(STORAGE_KEYS.AUTH)) return 'employee';
    return null;
  },

  // Journal entries
  async getEntries(): Promise<JournalEntry[]> {
    await delay(300);
    const data = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  async postJournal(text: string): Promise<JournalEntry> {
    await delay(1100);

    // Error simulation hook
    if (text.includes('#error')) {
      throw new Error('Ada kendala sebentar saat menganalisis jurnal. Coba lagi ya.');
    }

    const { score, crisis_flag, triggers, trigger_keys, category } = calculateDailyStressFromJournal(text);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // Read existing
    const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    const existing: JournalEntry[] = raw ? JSON.parse(raw) : [];

    // Recommended exercise
    let recommended_exercise_id = 'ex_box_breathing';
    if (category === 'relasi_kerja') recommended_exercise_id = 'ex_grounding';
    else if (category === 'fisik_istirahat') recommended_exercise_id = 'ex_screen_break';
    else if (trigger_keys.includes('beban_numpuk')) recommended_exercise_id = 'ex_one_priority';
    else if (trigger_keys.includes('rapat_beruntun')) recommended_exercise_id = 'ex_between_meetings';

    const newEntry: JournalEntry = {
      id: `j_${Date.now()}`,
      created_at: now.toISOString(),
      date: dateStr,
      daily_stress_score: score,
      burnout_index: null,
      mood_status: score >= 7 ? 'Beban tinggi hari ini' : score >= 4 ? 'Waspada beban bertambah' : 'Kondisi stabil',
      triggers,
      trigger_keys,
      trigger_category: category,
      remediation_tips:
        category === 'workload'
          ? 'Karena deadline dan beban kerja menumpuk, coba pilih satu prioritas sebelum jam pulang, lalu jeda 10 menit tanpa layar.'
          : category === 'relasi_kerja'
          ? 'Pikiran terasa tegang setelah interaksi kerja. Coba latihan grounding sejenak untuk memusatkan kembali energimu.'
          : 'Badanmu memberi sinyal butuh rehat. Kurangi melihat layar malam ini dan jadwalkan istirahat lebih awal.',
      recommended_exercise_id,
      suggest_task_breaker: score >= 6 && category === 'workload',
      crisis_flag,
      journal_text: text,
      is_checkin: false,
    };

    if (!crisis_flag) {
      existing.push(newEntry);
      newEntry.burnout_index = calculateBurnoutIndex(existing);
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(existing));
    }

    return newEntry;
  },

  async postCheckin(input: CheckinInput): Promise<JournalEntry> {
    await delay(900);

    const score = calculateDailyStressFromCheckin(input.mental_stress, input.energy_drain);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // Checkin interpretation cases
    let interpCase: InterpretationCase = 'stabil';
    let description = 'Hari ini terasa cukup stabil.';
    let validation: string | null = null;

    if (input.mental_stress >= 4 && input.energy_drain >= 4) {
      interpCase = 'berat_ganda';
      description = 'Hari ini terasa berat di pikiran dan badan sekaligus.';
      validation = 'Wajar kalau hari ini terasa melelahkan.';
    } else if (input.mental_stress >= 4 && input.energy_drain <= 3) {
      interpCase = 'tegang_mental';
      description = 'Badanmu masih punya tenaga, tapi pikiranmu terasa tegang hari ini.';
      validation = 'Wajar kalau pikiran terasa penuh.';
    } else if (input.mental_stress <= 3 && input.energy_drain >= 4) {
      interpCase = 'lelah_fisik';
      description = 'Badanmu lagi lelah, sementara pikiranmu relatif tenang.';
      if (input.sleep_bucket === 'lt5') {
        description += ' Semalam kamu tidur kurang dari 5 jam. Coba tidur lebih awal malam ini dan minum air yang cukup.';
      }
      validation = 'Lelah itu wajar, badanmu sedang minta jeda.';
    }

    // Exercise selection rule
    let recExercise = 'ex_mindful_breath';
    if (input.mental_stress >= 4) {
      if (input.trigger_category === 'workload') recExercise = 'ex_box_breathing';
      else if (input.trigger_category === 'relasi_kerja') recExercise = 'ex_grounding';
      else if (input.trigger_category === 'fisik_istirahat') recExercise = 'ex_screen_break';
      else recExercise = 'ex_mindful_breath';
    } else if (interpCase === 'lelah_fisik') {
      recExercise = 'ex_screen_break';
    }

    const triggerLabels: Record<TriggerCategory, string> = {
      workload: 'Beban dan deadline kerja',
      relasi_kerja: 'Atasan atau rekan kerja',
      fisik_istirahat: 'Fisik dan istirahat',
      lainnya: 'Di luar kerja atau lainnya',
    };

    const triggerKeysMap: Record<TriggerCategory, string[]> = {
      workload: ['deadline_kerja'],
      relasi_kerja: ['atasan_rekan'],
      fisik_istirahat: ['kelelahan_fisik'],
      lainnya: ['umum'],
    };

    const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    const existing: JournalEntry[] = raw ? JSON.parse(raw) : [];

    const newEntry: JournalEntry = {
      id: `c_${Date.now()}`,
      created_at: now.toISOString(),
      date: dateStr,
      daily_stress_score: score,
      burnout_index: null,
      mood_status: score >= 7 ? 'Beban tinggi hari ini' : score >= 4 ? 'Waspada beban bertambah' : 'Kondisi stabil',
      triggers: [triggerLabels[input.trigger_category]],
      trigger_keys: triggerKeysMap[input.trigger_category],
      trigger_category: input.trigger_category,
      remediation_tips: description,
      recommended_exercise_id: recExercise,
      suggest_task_breaker: input.trigger_category === 'workload',
      crisis_flag: false,
      is_checkin: true,
      interpretation_case: interpCase,
      validation,
    };

    existing.push(newEntry);
    newEntry.burnout_index = calculateBurnoutIndex(existing);
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(existing));

    return newEntry;
  },

  // Exercises
  async getExercises(): Promise<Exercise[]> {
    return Promise.resolve(EXERCISES_LIBRARY);
  },

  async logExerciseSession(exercise_id: string, journal_id?: string, completed = true): Promise<string> {
    const sessionId = `s_${Date.now()}`;
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    const sessions: ExerciseSession[] = raw ? JSON.parse(raw) : [];

    sessions.push({
      session_id: sessionId,
      exercise_id,
      journal_id,
      completed,
      created_at: new Date().toISOString(),
    });

    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    return sessionId;
  },

  async getPendingFollowup(): Promise<FollowupPending | null> {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) return null;
    const sessions: ExerciseSession[] = JSON.parse(raw);
    const unrated = sessions.filter((s) => s.completed && s.helpful === undefined);
    if (unrated.length === 0) return null;

    const latest = unrated[unrated.length - 1];
    const exercise = EXERCISES_LIBRARY.find((e) => e.id === latest.exercise_id);

    return {
      session_id: latest.session_id,
      exercise_id: latest.exercise_id,
      exercise_title: exercise?.title || 'Latihan relaksasi',
      done_at: latest.created_at,
    };
  },

  async submitExerciseFeedback(session_id: string, helpful: number): Promise<boolean> {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) return false;
    const sessions: ExerciseSession[] = JSON.parse(raw);
    const idx = sessions.findIndex((s) => s.session_id === session_id);
    if (idx !== -1) {
      sessions[idx].helpful = helpful;
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      return true;
    }
    return false;
  },

  // Trigger map summary
  async getTriggerSummary(range: '7d' | '30d' = '30d'): Promise<TriggerSummaryResponse> {
    await delay(300);
    const entries = await this.getEntries();
    const daysLimit = range === '7d' ? 7 : 30;
    const cutoff = new Date(Date.now() - daysLimit * 86400000).toISOString().split('T')[0];
    const filtered = entries.filter((e) => e.date >= cutoff && !e.crisis_flag);

    const counts: Record<string, { label: string; count: number }> = {
      workload: { label: 'Beban dan deadline kerja', count: 0 },
      relasi_kerja: { label: 'Atasan atau rekan kerja', count: 0 },
      fisik_istirahat: { label: 'Fisik dan istirahat', count: 0 },
      lainnya: { label: 'Di luar kerja atau lainnya', count: 0 },
    };

    let total = 0;
    filtered.forEach((e) => {
      const cat = e.trigger_category || 'workload';
      if (counts[cat]) {
        counts[cat].count++;
        total++;
      }
    });

    const items = Object.entries(counts).map(([key, val]) => ({
      key,
      label: val.label,
      count: val.count,
      percent: total > 0 ? Math.round((val.count / total) * 100) : 0,
    }));

    // Sort descending
    items.sort((a, b) => b.count - a.count);

    const top = items[0];
    const summary =
      total >= 5
        ? `Dalam ${daysLimit} hari terakhir, ${top?.label.toLowerCase()} paling sering muncul bersamaan dengan bebanmu yang tinggi.`
        : 'Data belum cukup untuk melihat pola pemicu (minimal 5 catatan).';

    return {
      total_entries: total,
      items,
      summary,
    };
  },

  // Trusted contact (F5)
  async getTrustedContact(): Promise<TrustedContact | null> {
    const raw = localStorage.getItem(STORAGE_KEYS.TRUSTED_CONTACT);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async saveTrustedContact(contact: TrustedContact): Promise<boolean> {
    localStorage.setItem(STORAGE_KEYS.TRUSTED_CONTACT, JSON.stringify(contact));
    return true;
  },

  // Break planner (F6)
  async getBreakPlan(): Promise<BreakPlan> {
    const raw = localStorage.getItem(STORAGE_KEYS.BREAK_PLAN);
    if (!raw) {
      return { end_time: '18:00', ritual_ids: ['close_laptop', 'note_tomorrow'], reminder_enabled: false };
    }
    return JSON.parse(raw);
  },

  async saveBreakPlan(plan: BreakPlan): Promise<boolean> {
    localStorage.setItem(STORAGE_KEYS.BREAK_PLAN, JSON.stringify(plan));
    // sync to reminders
    const reminders = await this.getReminders();
    reminders.close_day.enabled = plan.reminder_enabled;
    reminders.close_day.time = plan.end_time;
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
    return true;
  },

  // Reminders (F10)
  async getReminders(): Promise<ReminderConfig> {
    const raw = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (!raw) {
      return {
        close_day: { enabled: false, time: '18:00', days: [1, 2, 3, 4, 5] },
        daily_note: { enabled: false, time: '16:30', days: [1, 2, 3, 4, 5] },
        calendar_title: 'Waktunya menutup hari kerja',
      };
    }
    return JSON.parse(raw);
  },

  async saveReminders(cfg: ReminderConfig): Promise<boolean> {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(cfg));
    return true;
  },

  // Task breaker (F7)
  async breakdownTask(task: string): Promise<{ id: number; text: string; minutes: number }[]> {
    await delay(700);
    return [
      { id: 1, text: `Kumpulkan data, dokumen, atau file referensi untuk "${task.slice(0, 32)}"`, minutes: 10 },
      { id: 2, text: 'Tulis kerangka utama dalam 3-5 poin sederhana tanpa detail berlebihan', minutes: 15 },
      { id: 3, text: 'Selesaikan draf bagian pertama yang paling kamu kuasai', minutes: 20 },
      { id: 4, text: 'Periksa kembali draf dan tentukan langkah tindak lanjut untuk besok', minutes: 15 },
    ];
  },

  // HR opt-in
  getHROptIn(): boolean {
    return localStorage.getItem(STORAGE_KEYS.HR_OPT_IN) === 'true';
  },

  setHROptIn(val: boolean) {
    localStorage.setItem(STORAGE_KEYS.HR_OPT_IN, val ? 'true' : 'false');
  },

  // HR Divisions & Dashboard (F12)
  async getHRDivisions(): Promise<Division[]> {
    return [
      { id: 'all', name: 'Semua divisi' },
      { id: 'marketing', name: 'Marketing' },
      { id: 'it', name: 'IT' },
      { id: 'sales', name: 'Sales' },
      { id: 'ops', name: 'Operasional' },
      { id: 'other', name: 'Divisi lain (digabung)' },
      { id: 'small_team', name: 'Tim Khusus (< 5 orang)' }, // to test suppression scenario!
    ];
  },

  async getHRDashboard(divisionId = 'all'): Promise<HRDashboardData> {
    await delay(700);

    // Suppression scenario: if contributors < 5
    if (divisionId === 'small_team') {
      return {
        suppressed: true,
        contributor_count: 3,
        suppression_reason: 'Data belum cukup untuk ditampilkan demi menjaga kerahasiaan tim (minimal 5 orang kontributor).',
        monthly_index: [],
        heatmap: { weeks: 4, cells: [] },
        drivers: [],
        suggestions: [],
      };
    }

    // Realistic aggregate 12-month data
    const monthlyIndex = [
      { month: '2025-12', index: 66 },
      { month: '2026-01', index: 58 },
      { month: '2026-02', index: 54 },
      { month: '2026-03', index: 61 },
      { month: '2026-04', index: 59 },
      { month: '2026-05', index: 52 },
      { month: '2026-06', index: 48 },
      { month: '2026-07', index: 51 },
      { month: '2026-08', index: 56 },
      { month: '2026-09', index: 63 },
      { month: '2026-10', index: 68 },
      { month: '2026-11', index: 62 },
    ];

    // 4 weeks heatmap (28 days)
    const heatmapCells: { date: string; high_load_percent: number | null }[] = [];
    const baseDate = new Date('2026-10-05T00:00:00Z');

    // Pattern: Thursdays & Fridays typically higher
    for (let day = 0; day < 28; day++) {
      const d = new Date(baseDate.getTime() + day * 86400000);
      const dayOfWeek = d.getUTCDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
      const dateStr = d.toISOString().split('T')[0];

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Weekend usually no data or null
        heatmapCells.push({ date: dateStr, high_load_percent: null });
      } else if (dayOfWeek === 4) {
        // Thursday high
        heatmapCells.push({ date: dateStr, high_load_percent: 42 });
      } else if (dayOfWeek === 5) {
        // Friday high
        heatmapCells.push({ date: dateStr, high_load_percent: 38 });
      } else if (dayOfWeek === 1) {
        // Monday
        heatmapCells.push({ date: dateStr, high_load_percent: 24 });
      } else {
        // Tue/Wed
        heatmapCells.push({ date: dateStr, high_load_percent: 16 });
      }
    }

    // Drivers per division
    let drivers = [
      { category: 'workload' as TriggerCategory, label: 'Beban dan deadline kerja', percent: 48, count: 58 },
      { category: 'relasi_kerja' as TriggerCategory, label: 'Atasan atau rekan kerja', percent: 26, count: 31 },
      { category: 'fisik_istirahat' as TriggerCategory, label: 'Fisik dan istirahat', percent: 16, count: 19 },
      { category: 'lainnya' as TriggerCategory, label: 'Di luar kerja atau lainnya', percent: 10, count: 12 },
    ];

    let suggestions = [
      {
        division: divisionId === 'all' ? 'Seluruh Tim' : divisionId.toUpperCase(),
        category: 'workload' as TriggerCategory,
        weekday: 'Kamis',
        text: 'Beban kerja dan tenggat paling sering dilaporkan pada hari Kamis. Pertimbangkan hari tenang rapat (Focus Day) atau penyesuaian jadwal review proyek di pertengahan minggu.',
      },
      {
        division: divisionId === 'all' ? 'Seluruh Tim' : divisionId.toUpperCase(),
        category: 'relasi_kerja' as TriggerCategory,
        weekday: 'Selasa',
        text: 'Pemicu terkait hubungan kerja muncul secara berulang. Pertimbangkan pelatihan feedback dua arah yang konstruktif bagi para team lead.',
      },
      {
        division: divisionId === 'all' ? 'Seluruh Tim' : divisionId.toUpperCase(),
        category: 'fisik_istirahat' as TriggerCategory,
        weekday: 'Jumat',
        text: 'Kelelahan fisik terakumulasi di akhir pekan kerja. Pertimbangkan menegakkan batasan jam offline setelah jam kerja selesai.',
      },
    ];

    if (divisionId === 'sales') {
      drivers = [
        { category: 'workload', label: 'Beban dan deadline kerja', percent: 62, count: 28 },
        { category: 'relasi_kerja', label: 'Atasan atau rekan kerja', percent: 18, count: 8 },
        { category: 'fisik_istirahat', label: 'Fisik dan istirahat', percent: 12, count: 5 },
        { category: 'lainnya', label: 'Di luar kerja atau lainnya', percent: 8, count: 4 },
      ];
      suggestions = [
        {
          division: 'Sales',
          category: 'workload',
          weekday: 'Jumat',
          text: 'Divisi Sales sering mencatat beban tinggi pada hari Jumat, dengan pemicu terbanyak beban dan deadline closing. Pertimbangkan meninjau jadwal target mingguan agar tidak bertumpuk di akhir pekan.',
        },
      ];
    } else if (divisionId === 'it') {
      drivers = [
        { category: 'relasi_kerja', label: 'Atasan atau rekan kerja', percent: 45, count: 22 },
        { category: 'workload', label: 'Beban dan deadline kerja', percent: 35, count: 17 },
        { category: 'fisik_istirahat', label: 'Fisik dan istirahat', percent: 15, count: 7 },
        { category: 'lainnya', label: 'Di luar kerja atau lainnya', percent: 5, count: 3 },
      ];
      suggestions = [
        {
          division: 'IT',
          category: 'relasi_kerja',
          weekday: 'Rabu',
          text: 'Pada divisi IT, pemicu terbanyak adalah koordinasi dengan tim dan ekspektasi lintas fungsi. Pertimbangkan sesi retrospektif berkala dengan fasilitator netral.',
        },
      ];
    }

    return {
      suppressed: false,
      contributor_count: 42,
      monthly_index: monthlyIndex,
      heatmap: {
        weeks: 4,
        cells: heatmapCells,
      },
      drivers,
      suggestions,
    };
  },
};
