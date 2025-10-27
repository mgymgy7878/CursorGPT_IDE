// ML Engine API Endpoints
import express from "express";
import store, {
  createExperiment,
  listExperiments,
  getExperiment,
  createTrial,
  listTrials,
  getTrial,
  saveTrialResult,
  getBestTrial,
  type Experiment,
  type Trial
} from "./store";
import { generateGridParams } from "./optimization";
import { evaluateTrial } from "./score";

export type { Experiment, Trial };

// İstenen API isimleri (alias/wrapper)
export const getAllExperiments = () => listExperiments();
export const getExperimentTrials = (experimentId: string) => listTrials(experimentId);
export const updateTrialResult = (trialId: string, score: number, status: string = "COMPLETED") =>
  saveTrialResult({ trialId, score, status });

// Orijinal yüzeyi de dışa aç
export {
  store,
  createExperiment,
  listExperiments,
  getExperiment,
  createTrial,
  listTrials,
  getTrial,
  saveTrialResult,
  getBestTrial
};

export default store;

export interface CreateExperimentRequest {
  name: string;
  objective: string;
  bounds: Record<string, { min: number; max: number }>;
  budget: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface CreateTrialRequest {
  experiment_id: string;
  params: Record<string, any>;
  status?: 'pending' | 'running' | 'completed' | 'failed';
}

export function setupApi(app: express.Application) {
  // Create experiment
  app.post("/experiments", (req, res) => {
    try {
      const data: CreateExperimentRequest = req.body;
      const experiment = createExperiment(data.name, data as unknown as Record<string, unknown>);
      
      // Generate initial trials using grid search
      const gridParams = generateGridParams(data.bounds, 3); // 3 steps per parameter
      for (const params of gridParams.slice(0, Math.min(data.budget, gridParams.length))) {
        createTrial(experiment.id, params);
      }
      
      // updateActiveExperiments(getAllExperiments().filter((e: any) => e.status === 'running').length); // This line was removed from the new_code, so it's removed here.
      // updateQueueSize(getExperimentTrials(experiment.id).filter((t: any) => t.status === 'pending').length); // This line was removed from the new_code, so it's removed here.
      
      res.json(experiment);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(400).json({ error: errorMessage });
    }
  });

  // Get experiment
  app.get("/experiments/:id", (req, res) => {
    const experiment = getExperiment(req.params.id);
    if (!experiment) {
      return res.status(404).json({ error: "Experiment not found" });
    }
    res.json(experiment);
  });

  // List experiments
  app.get("/experiments", (req, res) => {
    res.json(getAllExperiments());
  });

  // Create trial
  app.post("/trials", (req, res) => {
    try {
      const data: CreateTrialRequest = req.body;
      const trial = createTrial(data.experiment_id, data.params);
      
      // updateTrialMetrics(data.experiment_id, 'pending'); // This line was removed from the new_code, so it's removed here.
      // updateQueueSize(getExperimentTrials(data.experiment_id).filter((t: any) => t.status === 'pending').length); // This line was removed from the new_code, so it's removed here.
      
      res.json(trial);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(400).json({ error: errorMessage });
    }
  });

  // Get trial
  app.get("/trials/:id", (req, res) => {
    const trial = getTrial(req.params.id);
    if (!trial) {
      return res.status(404).json({ error: "Trial not found" });
    }
    res.json(trial);
  });

  // Get experiment trials
  app.get("/experiments/:id/trials", (req, res) => {
    const trials = getExperimentTrials(req.params.id);
    res.json(trials);
  });

  // Process next trial (worker endpoint)
  app.post("/trials/process", async (req, res) => {
    try {
      const { experimentId } = req.body;
      const trials = getExperimentTrials(experimentId).filter(t => t.status === 'pending');
      
      if (trials.length === 0) {
        return res.json({ message: "No pending trials" });
      }
      
      const trial = trials[0];
      if (!trial) {
        return res.json({ message: "No pending trials" });
      }
      trial.status = 'running';
      
      const startTime = Date.now();
      const { score, metrics } = await evaluateTrial(trial as any);
      const runtime = Date.now() - startTime;
      
      saveTrialResult({ trialId: trial.id!, score }); // Changed to saveTrialResult
      // updateTrialMetrics(experimentId, 'completed'); // This line was removed from the new_code, so it's removed here.
      
      // Update best score if better
      const experiment = getExperiment(experimentId);
      if (experiment && trial.id && score > ((experiment as any).best_score || -Infinity)) {
        (experiment as any).best_score = score;
        (experiment as any).best_params = trial.params;
      }
      
      res.json({ trial, score, metrics, runtime });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: errorMessage });
    }
  });
} 