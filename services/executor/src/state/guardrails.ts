import { Guardrails } from "../types/guardrails";

let current: Guardrails = {
  killSwitch: false,
  maxExposurePct: 50,
  whitelist: [],
};

export const getGuardrails = (): Guardrails => current;
export const setGuardrails = (p: Partial<Guardrails>): Guardrails => {
  current = { ...current, ...p };
  return current;
};
