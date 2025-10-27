// ML Engine Queue System
import type { Trial, Experiment } from "./types";

// In-memory storage (replace with DB in production)
const experiments = new Map<string, Experiment>();
const trials = new Map<string, Trial>();
const trialQueue: string[] = [];

export function createExperiment(exp: Omit<Experiment, 'id' | 'created_at'>): Experiment {
  const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const experiment: Experiment = {
    ...exp,
    id,
    created_at: new Date().toISOString()
  };
  
  experiments.set(id, experiment);
  console.log(`Experiment created: ${id} - ${exp.name}`);
  return experiment;
}

export function createTrial(trial: Omit<Trial, 'id' | 'created_at'>): Trial {
  const id = `trial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newTrial: Trial = {
    ...trial,
    id,
    created_at: new Date().toISOString()
  };
  
  trials.set(id, newTrial);
  trialQueue.push(id);
  console.log(`Trial queued: ${id} for experiment ${trial.experiment_id}`);
  return newTrial;
}

export function getExperiment(id: string): Experiment | undefined {
  return experiments.get(id);
}

export function getTrial(id: string): Trial | undefined {
  return trials.get(id);
}

export function getNextTrial(): Trial | undefined {
  if (trialQueue.length === 0) return undefined;
  
  const trialId = trialQueue.shift()!;
  const trial = trials.get(trialId);
  if (trial) {
    trial.status = 'running';
  }
  return trial;
}

export function updateTrialResult(id: string, score: number, metrics: Record<string, any>) {
  const trial = trials.get(id);
  if (trial) {
    trial.score = score;
    trial.metrics = metrics;
    trial.status = 'completed';
    trial.completed_at = new Date().toISOString();
    
    // Update experiment best score
    const experiment = experiments.get(trial.experiment_id);
    if (experiment && (!experiment.best_score || score > experiment.best_score)) {
      experiment.best_score = score;
      experiment.best_params = trial.params;
    }
  }
}

export function getAllExperiments(): Experiment[] {
  return Array.from(experiments.values());
}

export function getExperimentTrials(experimentId: string): Trial[] {
  return Array.from(trials.values()).filter(t => t.experiment_id === experimentId);
} 