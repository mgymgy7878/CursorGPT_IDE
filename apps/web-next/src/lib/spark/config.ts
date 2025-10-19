// EXECUTOR_BASE: gerçek executor servisi adresi
export const EXECUTOR_BASE =
  process.env.NEXT_PUBLIC_EXECUTOR_URL?.replace(/\/+$/,"") || "http://127.0.0.1:4001";

