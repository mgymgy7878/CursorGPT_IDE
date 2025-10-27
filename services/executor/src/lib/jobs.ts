export type JobState = "queued" | "running" | "done" | "error" | "canceled";

export interface Job<T = any> {
  id: string;
  kind: "backtest" | "optimize";
  state: JobState;
  createdAt: number;
  updatedAt: number;
  input: any;
  output?: any;
  error?: { message: string; stack?: string };
  listeners: Set<(ev: any) => void>;
}

const jobs = new Map<string, Job>();
import { jobStore } from "./jobstore.js";

export function createJob(kind: Job["kind"], input: any): Job {
  const id = `${kind}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const job: Job = {
    id,
    kind,
    input,
    state: "queued",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    listeners: new Set(),
  };
  jobs.set(id, job);
  // persist
  void jobStore.put({ id, kind, input, state: job.state, createdAt: job.createdAt, updatedAt: job.updatedAt });
  return job;
}

export function getJob(id: string) {
  return jobs.get(id);
}

export function onJobEvent(id: string, cb: (ev: any) => void) {
  const j = jobs.get(id);
  if (!j) return false;
  j.listeners.add(cb);
  return true;
}

export function offJobEvent(id: string, cb: (ev: any) => void) {
  const j = jobs.get(id);
  if (!j) return;
  j.listeners.delete(cb);
}

export function emitJobEvent(id: string, ev: any) {
  const j = jobs.get(id);
  if (!j) return;
  j.listeners.forEach((fn) => fn(ev));
}

export function setJobState(id: string, state: JobState) {
  const j = jobs.get(id);
  if (!j) return;
  j.state = state;
  j.updatedAt = Date.now();
  void jobStore.update({ id: j.id, kind: j.kind, input: j.input, state: j.state, createdAt: j.createdAt, updatedAt: j.updatedAt, output: j.output, error: j.error });
}

export function setJobOutput(id: string, output: any) {
  const j = jobs.get(id);
  if (!j) return;
  j.output = output;
  j.updatedAt = Date.now();
  void jobStore.update({ id: j.id, kind: j.kind, input: j.input, state: j.state, createdAt: j.createdAt, updatedAt: j.updatedAt, output: j.output, error: j.error });
}

export function setJobError(id: string, err: any) {
  const j = jobs.get(id);
  if (!j) return;
  j.state = "error";
  j.error = err;
  j.updatedAt = Date.now();
  void jobStore.update({ id: j.id, kind: j.kind, input: j.input, state: j.state, createdAt: j.createdAt, updatedAt: j.updatedAt, output: j.output, error: j.error });
}

export function cancelJob(id: string) {
  const j = jobs.get(id);
  if (!j) return false;
  j.state = "canceled";
  j.updatedAt = Date.now();
  emitJobEvent(id, { event: "canceled" });
  void jobStore.update({ id: j.id, kind: j.kind, input: j.input, state: j.state, createdAt: j.createdAt, updatedAt: j.updatedAt, output: j.output, error: j.error });
  return true;
}

export function allJobs() {
  return Array.from(jobs.values());
}


