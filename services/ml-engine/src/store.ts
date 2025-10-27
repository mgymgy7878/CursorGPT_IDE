export interface Experiment {
  id: string;
  name: string;
  created_at: string;
  params?: Record<string, unknown>;
}

export type TrialStatus = "PENDING" | "COMPLETED" | "FAILED" | string;

export interface Trial {
  experimentId: string;
  trialId: string;
  params: Record<string, unknown>;
  score?: number;

  // zorunlu alanlar
  status: TrialStatus;
  created_at: string;

  // opsiyonel
  completed_at?: string;

  // legacy alias'lar (tüketicileri kırmamak için)
  id?: string;              // alias of trialId
  experiment_id?: string;   // alias of experimentId
}

const experiments: Experiment[] = [];
const trials: Trial[] = [];

export function createExperiment(name: string, params?: Record<string, unknown>): Experiment {
  const exp: Experiment = { id: `exp-${Date.now()}`, name, created_at: new Date().toISOString(), params };
  experiments.push(exp);
  return exp;
}

export function getExperiment(id: string): Experiment | null {
  return experiments.find(e => e.id === id) ?? null;
}

export function listExperiments(): Experiment[] {
  return [...experiments];
}

export function createTrial(experimentId: string, params: Record<string, unknown>): Trial {
  const trialId = `trial-${Date.now()}`;
  const t: Trial = {
    experimentId,
    experiment_id: experimentId,
    trialId,
    id: trialId,
    params,
    status: "PENDING",
    created_at: new Date().toISOString()
  };
  trials.push(t);
  return t;
}

export function getTrial(trialId: string): Trial | null {
  return trials.find(t => t.trialId === trialId || t.id === trialId) ?? null;
}

export function listTrials(experimentId?: string): Trial[] {
  const xs = experimentId
    ? trials.filter(t => t.experimentId === experimentId || t.experiment_id === experimentId)
    : trials;
  return [...xs];
}

export function saveTrialResult(input: { trialId: string; score: number; status?: TrialStatus }): void {
  const t = trials.find(x => x.trialId === input.trialId || x.id === input.trialId);
  if (t) {
    t.score = input.score;
    t.status = input.status ?? "COMPLETED";
    t.completed_at = new Date().toISOString();
  }
}

export function getBestTrial(x: { experimentId: string }): { trialId: string; score: number } | null {
  const list = trials.filter(t =>
    (t.experimentId === x.experimentId || t.experiment_id === x.experimentId) &&
    typeof t.score === "number"
  ) as Array<Required<Pick<Trial,"trialId"|"score">>>;
  if (list.length === 0) return null;
  const best = list.sort((a,b) => b.score - a.score)[0];
  return best ? { trialId: best.trialId, score: best.score } : null;
}

// default aggregate
const store = {
  createExperiment, getExperiment, listExperiments,
  createTrial, getTrial, listTrials,
  saveTrialResult, getBestTrial
};
export default store; 