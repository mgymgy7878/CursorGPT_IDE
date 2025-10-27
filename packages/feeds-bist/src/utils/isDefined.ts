/**
 * Type guard to check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if an array is defined and has elements
 */
export function isArrayDefined<T>(value: T[] | null | undefined): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Safe array access with default value
 */
export function safeGet<T>(array: T[] | null | undefined, index: number, defaultValue: T): T {
  if (!isArrayDefined(array) || index < 0 || index >= array.length) {
    return defaultValue;
  }
  return array[index] ?? defaultValue;
}

/**
 * Safe object property access with default value
 */
export function safeGetProp<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue: T[K]
): T[K] {
  if (!isDefined(obj)) {
    return defaultValue;
  }
  return obj[key] ?? defaultValue;
} 