declare global {
  interface GlobalThis {
    __SPARK?: Record<string, unknown>;
  }
}
export {};
