import { postPublic, useNoStoreJson } from "./client";

// Types
export interface Strategy {
  id: string;
  name: string;
  versionsCount: number;
  updatedAt: number;
  createdAt: number;
}

export interface StrategyDetail {
  id: string;
  name: string;
  versionsCount: number;
  updatedAt: number;
  createdAt: number;
  versions?: Array<{
    id: string;
    code: string;
    createdAt: number;
    note?: string;
  }>;
}

export interface StrategyListResponse {
  items: Strategy[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BacktestJob {
  jobId: string;
  status: 'queued' | 'running' | 'done' | 'error';
  progress: number;
  createdAt: number;
  result?: any;
  error?: string;
}

export interface BacktestStartResponse {
  jobId: string;
}

export interface OptimizeJob {
  jobId: string;
  status: 'queued' | 'running' | 'done' | 'error';
  progress: number;
  createdAt: number;
  result?: any;
  error?: string;
}

export interface OptimizeStartResponse {
  jobId: string;
}

export interface RunJob {
  jobId: string;
  status: 'queued' | 'running' | 'done' | 'error';
  progress: number;
  createdAt: number;
  result?: any;
  error?: string;
}

export interface RunStartResponse {
  jobId: string;
}

// API Functions
export async function fetchStrategies(params: {
  query?: string;
  page?: number;
  sort?: string;
}): Promise<StrategyListResponse> {
  const searchParams = new URLSearchParams();
  if (params.query) searchParams.set('query', params.query);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.sort) searchParams.set('sort', params.sort);

  const response = await fetch(`/api/public/lab/strategies?${searchParams}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // Normalize fields
  return {
    items: data.items?.map((item: any) => ({
      id: item.id || item._id,
      name: item.name || item.strategyName || 'Bilinmeyen Strateji',
      versionsCount: item.versionsCount || item.versions?.length || 0,
      updatedAt: item.updatedAt || item.updated_at || item.lastModified || Date.now(),
      createdAt: item.createdAt || item.created_at || Date.now(),
    })) || [],
    total: data.total || data.count || 0,
    page: data.page || 1,
    pageSize: data.pageSize || data.limit || 10,
  };
}

export async function fetchStrategyById(id: string): Promise<StrategyDetail> {
  const response = await fetch(`/api/public/lab/strategies?id=${id}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // Normalize fields
  return {
    id: data.id || data._id || id,
    name: data.name || data.strategyName || 'Bilinmeyen Strateji',
    versionsCount: data.versionsCount || data.versions?.length || 0,
    updatedAt: data.updatedAt || data.updated_at || data.lastModified || Date.now(),
    createdAt: data.createdAt || data.created_at || Date.now(),
    versions: data.versions?.map((v: any) => ({
      id: v.id || v._id || `v${Date.now()}`,
      code: v.code || v.strategyCode || '',
      createdAt: v.createdAt || v.created_at || Date.now(),
      note: v.note || v.commitMessage || v.description,
    })) || [],
  };
}

export async function startBacktest(params: {
  code: string;
  params?: any;
}): Promise<BacktestStartResponse> {
  const response = await postPublic('/api/public/lab/backtest', {
    code: params.code,
    params: params.params || {},
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    jobId: data.jobId || data.id || `bt_${Date.now()}`,
  };
}

export async function pollBacktest(jobId: string, signal?: AbortSignal): Promise<BacktestJob> {
  const response = await fetch(`/api/public/lab/status?jobId=${jobId}`, {
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // Normalize fields
  return {
    jobId: data.jobId || data.id || jobId,
    status: data.status || 'queued',
    progress: data.progress || data.percent || 0,
    createdAt: data.createdAt || data.created_at || Date.now(),
    result: data.result || data.data,
    error: data.error || data.errorMessage,
  };
}

export async function startOptimize(params: {
  code: string;
  params?: any;
}): Promise<OptimizeStartResponse> {
  const response = await postPublic('/api/public/lab/optimize', {
    code: params.code,
    params: params.params || {},
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    jobId: data.jobId || data.id || `opt_${Date.now()}`,
  };
}

export async function pollOptimize(jobId: string, signal?: AbortSignal): Promise<OptimizeJob> {
  const response = await fetch(`/api/public/lab/optimize/status?jobId=${jobId}`, {
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // Normalize fields
  return {
    jobId: data.jobId || data.id || jobId,
    status: data.status || 'queued',
    progress: data.progress || data.percent || 0,
    createdAt: data.createdAt || data.created_at || Date.now(),
    result: data.result || data.data,
    error: data.error || data.errorMessage,
  };
}

export async function startRun(params: {
  code: string;
  params?: any;
}): Promise<RunStartResponse> {
  const response = await postPublic('/api/public/lab/run', {
    code: params.code,
    params: params.params || {},
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    jobId: data.jobId || data.id || `run_${Date.now()}`,
  };
}

export async function pollRun(jobId: string, signal?: AbortSignal): Promise<RunJob> {
  const response = await fetch(`/api/public/lab/run/status?jobId=${jobId}`, {
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // Normalize fields
  return {
    jobId: data.jobId || data.id || jobId,
    status: data.status || 'queued',
    progress: data.progress || data.percent || 0,
    createdAt: data.createdAt || data.created_at || Date.now(),
    result: data.result || data.data,
    error: data.error || data.errorMessage,
  };
}

// React Hooks
export function useStrategies(params: {
  query?: string;
  page?: number;
  sort?: string;
}) {
  return useNoStoreJson(
    `/api/public/lab/strategies?${new URLSearchParams({
      ...(params.query && { query: params.query }),
      ...(params.page && { page: params.page.toString() }),
      ...(params.sort && { sort: params.sort }),
    })}`,
    1500
  );
}

export function useStrategyById(id: string) {
  return useNoStoreJson(`/api/public/lab/strategies?id=${id}`, 1500);
} 