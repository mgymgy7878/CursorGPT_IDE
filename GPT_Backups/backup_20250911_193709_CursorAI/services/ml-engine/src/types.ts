// ML Engine Types
export type Experiment = {
  id: string;
  name: string;
  objective: string;
  bounds: Record<string, { min: number; max: number }>;
  budget: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  best_score?: number;
  best_params?: Record<string, any>;
};

export type Trial = {
  id: string;
  experiment_id: string;
  params: Record<string, any>;
  score?: number;
  metrics?: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
};

export type CreateExperimentRequest = {
  name: string;
  objective: string;
  bounds: Record<string, { min: number; max: number }>;
  budget: number;
  status?: 'pending' | 'running' | 'completed' | 'failed';
};

export type CreateTrialRequest = {
  experiment_id: string;
  params: Record<string, any>;
  status?: 'pending' | 'running' | 'completed' | 'failed';
}; 