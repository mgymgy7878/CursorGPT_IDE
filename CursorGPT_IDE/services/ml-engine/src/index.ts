import store, {
  createExperiment,
  createTrial,
  saveTrialResult,
  getBestTrial,
  type Experiment,
  type Trial
} from "./store";

export type { Experiment, Trial };

// Eski tüketiciler default `store` bekleyebilir:
export default store;

// Named API (bazı tüketiciler sadece named import kullanıyor)
export { store, createExperiment, createTrial, saveTrialResult, getBestTrial };

// Promise yüzeyi bekleyenler için async sarmalayıcılar (şekil uyumu için)
export async function createExperimentAsync(name: string, params?: Record<string, unknown>): Promise<Experiment> {
  return createExperiment(name, params);
}
export async function createTrialAsync(experimentId: string, params: Record<string, unknown>): Promise<Trial> {
  return createTrial(experimentId, params);
}
export async function saveTrialResultAsync(input: { trialId: string; score: number }): Promise<void> {
  return saveTrialResult(input);
}
export async function getBestTrialAsync(x: { experimentId: string }): Promise<{ trialId: string; score: number } | null> {
  return getBestTrial(x);
}

// API yüzeyi
export * from "./api"; 