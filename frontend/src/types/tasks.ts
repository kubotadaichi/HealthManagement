export interface PVTResult {
  id?: number;
  miss_count: number;
  average_reaction_time: number;
  all_reaction_times: number[];
  completed_at?: string;
}

export interface FlankerTrialDetail {
  stimulus: string;
  correct: boolean;
  reaction_time_ms: number;
  congruent: boolean;
}

export interface FlankerResult {
  id?: number;
  total_correct: number;
  congruent_correct: number;
  incongruent_correct: number;
  total_trials: number;
  trial_details?: FlankerTrialDetail[];
  completed_at?: string;
}

export interface EFSIResult {
  id?: number;
  total_score: number;
  answers: number[];
  completed_at?: string;
}

export interface VASResult {
  id?: number;
  sleepiness_score: number;
  fatigue_score: number;
  completed_at?: string;
}
