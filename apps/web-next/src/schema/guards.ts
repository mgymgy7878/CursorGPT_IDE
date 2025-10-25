/**
 * Type Guard Utilities
 * 
 * Runtime type checking and assertion helpers.
 * Use these for safe type narrowing from unknown/any.
 */

/**
 * Asserts that a value is defined (not null/undefined)
 */
export function assertDefined<T>(
  value: T,
  message = 'Value is null or undefined'
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * Checks if value is defined
 */
export function isDefined<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

/**
 * Asserts that a value is a string
 */
export function assertString(value: unknown, message = 'Value is not a string'): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(message);
  }
}

/**
 * Checks if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Asserts that a value is a number
 */
export function assertNumber(value: unknown, message = 'Value is not a number'): asserts value is number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(message);
  }
}

/**
 * Checks if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * Asserts that a value is an array
 */
export function assertArray<T>(value: unknown, message = 'Value is not an array'): asserts value is T[] {
  if (!Array.isArray(value)) {
    throw new Error(message);
  }
}

/**
 * Checks if value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Asserts that a value is an object
 */
export function assertObject(
  value: unknown,
  message = 'Value is not an object'
): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(message);
  }
}

/**
 * Checks if value is a plain object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Asserts that an object has a specific key
 */
export function assertHasKey<K extends string>(
  obj: object,
  key: K,
  message?: string
): asserts obj is Record<K, unknown> {
  if (!(key in obj)) {
    throw new Error(message || `Object missing required key: ${key}`);
  }
}

/**
 * Checks if object has a specific key
 */
export function hasKey<K extends string>(obj: object, key: K): obj is Record<K, unknown> {
  return key in obj;
}

/**
 * Safe array index access with bounds checking
 */
export function safeArrayAccess<T>(arr: T[], index: number): T | undefined {
  return index >= 0 && index < arr.length ? arr[index] : undefined;
}

/**
 * Safe array index access with assertion
 */
export function assertArrayIndex<T>(arr: T[], index: number, message?: string): asserts index is number {
  if (index < 0 || index >= arr.length) {
    throw new Error(message || `Array index ${index} out of bounds [0, ${arr.length})`);
  }
}

/**
 * Exhaustiveness check for switch/if statements
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

/**
 * Runtime enum validation
 */
export function isEnum<T extends Record<string, string>>(
  value: unknown,
  enumObj: T
): value is T[keyof T] {
  return Object.values(enumObj).includes(value as T[keyof T]);
}

/**
 * Assert enum value
 */
export function assertEnum<T extends Record<string, string>>(
  value: unknown,
  enumObj: T,
  message?: string
): asserts value is T[keyof T] {
  if (!isEnum(value, enumObj)) {
    throw new Error(message || `Value ${value} is not a valid enum member`);
  }
}

