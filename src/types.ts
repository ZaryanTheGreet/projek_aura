// Data types for Aura MVP

export type ZoneType = 'calm' | 'watch' | 'heavy';

export interface TriggerKeyItem {
  key: string;
  label: string;
}

export type TriggerCategory = 'workload' | 'relasi_kerja' | 'fisik_istirahat' | 'lainnya';

export type InterpretationCase = 'berat_ganda' | 'tegang_mental' | 'lelah_fisik' | 'stabil';

export interface JournalEntry {
  id: string;
  created_at: string; // ISO string
  date: string; // YYYY-MM-DD
  daily_stress_score: number; // 1 - 10
  burnout_index: number | null; // 0 - 100 or null if < 3 entries
  trend?: 'rising' | 'falling' | 'stable';
  mood_status: string;
  triggers: string[];
  trigger_keys: string[];
  trigger_category: TriggerCategory;
  remediation_tips: string;
  recommended_exercise_id: string;
  suggest_task_breaker?: boolean;
  crisis_flag: boolean;
  journal_text?: string;
  is_checkin?: boolean;
  interpretation_case?: InterpretationCase;
  validation?: string | null;
}

export interface CheckinInput {
  mental_stress: number; // 1 - 5
  energy_drain: number; // 1 - 5
  sleep_bucket: 'lt5' | '5_6' | '7_8' | 'gt8';
  trigger_category: TriggerCategory;
}

export type StepKind = 'text' | 'breath' | 'count_guide' | 'observe' | 'pose' | 'timer' | 'write';

export type PoseType = 'sit' | 'stand' | 'neck_left' | 'neck_right' | 'arms_up' | 'hands_chest';

export interface BreathPhase {
  label: string;
  sec: number;
  scale: 'up' | 'hold' | 'down';
}

export interface PoseSequenceItem {
  pose: PoseType;
  sec: number;
  cue?: string;
}

export interface ExerciseStep {
  kind: StepKind;
  text: string;
  hint?: string;
  icon?: string;
  placeholder?: string;
  pose?: PoseType;
  sequence?: PoseSequenceItem[];
  seconds?: number;
  duration_sec?: number;
  cue?: string;
  phases?: BreathPhase[];
  rounds?: number;
  max?: number;
  loop?: boolean;
}

export interface Exercise {
  id: string;
  title: string;
  duration_min: number;
  suits: string[];
  benefit: string;
  steps: ExerciseStep[];
}

export interface ExerciseSession {
  session_id: string;
  exercise_id: string;
  journal_id?: string;
  completed: boolean;
  created_at: string;
  helpful?: number; // 1 - 5
}

export interface FollowupPending {
  session_id: string;
  exercise_id: string;
  exercise_title: string;
  done_at: string;
}

export interface TriggerSummaryItem {
  key: string;
  label: string;
  count: number;
  percent: number;
}

export interface TriggerSummaryResponse {
  total_entries: number;
  items: TriggerSummaryItem[];
  summary: string;
}

export interface TrustedContact {
  name: string;
  relation: 'Teman' | 'Keluarga' | 'Pasangan' | 'Rekan kerja tepercaya' | 'Mentor' | 'Lainnya';
  phone: string;
}

export interface BreakPlan {
  end_time: string; // HH:mm (e.g. "18:00")
  ritual_ids: string[];
  reminder_enabled: boolean;
}

export interface ReminderConfig {
  close_day: {
    enabled: boolean;
    time: string;
    days: number[]; // 1=Mon, ..., 7=Sun
  };
  daily_note: {
    enabled: boolean;
    time: string;
    days: number[];
  };
  calendar_title: string;
}

export interface Division {
  id: string;
  name: string;
}

export interface MonthlyIndex {
  month: string; // YYYY-MM
  index: number;
}

export interface HeatmapCell {
  date: string;
  high_load_percent: number | null; // null if contributor < 5
}

export interface HRDriver {
  category: TriggerCategory;
  label: string;
  percent: number;
  count: number;
}

export interface HRSuggestion {
  division: string;
  category: TriggerCategory;
  weekday: string;
  text: string;
}

export interface HRDashboardData {
  suppressed: boolean;
  contributor_count?: number;
  suppression_reason?: string;
  monthly_index: MonthlyIndex[];
  heatmap: {
    weeks: number;
    cells: HeatmapCell[];
  };
  drivers: HRDriver[];
  suggestions: HRSuggestion[];
}

export interface UserAuth {
  token: string | null;
  role: 'employee' | 'hrd' | null;
  email: string | null;
}
