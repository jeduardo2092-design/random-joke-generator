import { JokeType } from '../types';

const VALID_JOKE_TYPES: JokeType[] = [
  'programming',
  'general',
  'knock-knock',
  'dad-joke',
  'dark',
  'pun',
  'spooky',
  'christmas',
];

/**
 * Validates if a string is a valid joke type
 */
export function isValidJokeType(type: string): type is JokeType {
  return VALID_JOKE_TYPES.includes(type as JokeType);
}

/**
 * Validates joke count parameter
 */
export function validateJokeCount(count: number): number {
  const validated = Math.max(1, Math.min(count, 10));
  if (count !== validated) {
    console.warn(`Joke count clamped from ${count} to ${validated}`);
  }
  return validated;
}

/**
 * Validates and sanitizes joke type input
 */
export function normalizeJokeType(type?: string): JokeType | undefined {
  if (!type) return undefined;
  const normalized = type.toLowerCase().trim();
  if (isValidJokeType(normalized)) {
    return normalized;
  }
  throw new Error(`Invalid joke type: ${type}. Valid types: ${VALID_JOKE_TYPES.join(', ')}`);
}

/**
 * Validates API response
 */
export function validateApiResponse<T>(response: unknown): response is T {
  return response !== null && typeof response === 'object';
}
