/**
 * Core type definitions for the joke generator application
 */

/**
 * Supported joke types/categories
 */
export type JokeType = 'programming' | 'general' | 'knock-knock' | 'dad-joke' | 'dark' | 'pun' | 'spooky' | 'christmas';

/**
 * Joke sources/providers
 */
export type JokeSource = 'joke-api' | 'dad-jokes-api' | 'official-joke-api';

/**
 * Core Joke interface
 */
export interface Joke {
  id: string;
  setup: string;
  delivery: string;
  type: JokeType;
  source: JokeSource;
  category?: string;
  safe?: boolean;
}

/**
 * Raw response from JokeAPI
 */
export interface JokeAPIResponse {
  error: boolean;
  category: string;
  type: string;
  setup: string;
  delivery: string;
  id: number;
  safe: boolean;
  lang: string;
}

/**
 * Raw response from Dad Jokes API
 */
export interface DadJokeResponse {
  id: string;
  joke: string;
  status: number;
}

/**
 * Raw response from Official Joke API
 */
export interface OfficialJokeResponse {
  id: number;
  type: string;
  setup: string;
  punchline: string;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  cachedJokes: number;
  totalRequests: number;
  avgResponseTime: number;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  backoffMultiplier: number;
  maxDelay: number;
  timeoutMs: number;
}

/**
 * API provider interface
 */
export interface JokeProvider {
  name: JokeSource;
  getJoke(type?: JokeType): Promise<Joke>;
  getJokes(count: number, type?: JokeType): Promise<Joke[]>;
  getSupportedTypes(): JokeType[];
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * CLI command options
 */
export interface CliOptions {
  type?: JokeType;
  count?: number;
  verbose?: boolean;
  json?: boolean;
  source?: JokeSource;
}
