import { tr } from "./tr";
import { en } from "./en";

export type Locale = "tr" | "en";
export const dict = { tr, en };
export type Dict = typeof tr;

/**
 * Create typed translation function
 */
export const createT = (locale: Locale = "tr") => {
  const d = dict[locale];
  
  return (path: string, vars?: Record<string, any>): string => {
    const keys = path.split('.');
    let value: any = d;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) return path;
    }
    
    if (typeof value !== 'string') return path;
    
    // Template replacement
    if (vars) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ''));
    }
    
    return value;
  };
};

// Default TR instance
export const t = createT("tr");
export { tr, en };

