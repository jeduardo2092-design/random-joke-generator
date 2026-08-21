import NodeCache from 'node-cache';
import { Joke, CacheStats } from '../types';
import logger from '../utils/logger';

const CACHE_TTL = parseInt(process.env.CACHE_TTL || '3600', 10);
const MAX_CACHE_SIZE = parseInt(process.env.MAX_CACHE_SIZE || '100', 10);
const CACHE_ENABLED = process.env.CACHE_ENABLED !== 'false';

export class JokeCache {
  private cache: NodeCache;
  private hits: number = 0;
  private misses: number = 0;
  private responseTimes: number[] = [];

  constructor() {
    this.cache = new NodeCache({
      stdTTL: CACHE_TTL / 1000, // Convert ms to seconds
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false,
    });
  }

  /**
   * Gets a joke from cache
   */
  get(key: string): Joke | undefined {
    if (!CACHE_ENABLED) return undefined;

    const value = this.cache.get<Joke>(key);
    if (value) {
      this.hits++;
      logger.debug(`Cache hit: ${key}`);
    } else {
      this.misses++;
      logger.debug(`Cache miss: ${key}`);
    }
    return value;
  }

  /**
   * Sets a joke in cache
   */
  set(key: string, value: Joke): void {
    if (!CACHE_ENABLED) return;

    // Check cache size and evict if necessary
    const keys = this.cache.keys();
    if (keys.length >= MAX_CACHE_SIZE) {
      const oldestKey = keys[0];
      this.cache.del(oldestKey);
      logger.debug(`Cache evicted: ${oldestKey}`);
    }

    this.cache.set(key, value);
    logger.debug(`Cache set: ${key}`);
  }

  /**
   * Gets multiple jokes from cache
   */
  getMultiple(keys: string[]): (Joke | undefined)[] {
    return keys.map((key) => this.get(key));
  }

  /**
   * Sets multiple jokes in cache
   */
  setMultiple(jokes: Joke[]): void {
    jokes.forEach((joke) => {
      this.set(joke.id, joke);
    });
  }

  /**
   * Clears the cache
   */
  clear(): void {
    this.cache.flushAll();
    this.hits = 0;
    this.misses = 0;
    this.responseTimes = [];
    logger.info('Cache cleared');
  }

  /**
   * Records response time for statistics
   */
  recordResponseTime(ms: number): void {
    this.responseTimes.push(ms);
    // Keep only last 1000 measurements to avoid memory bloat
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
  }

  /**
   * Gets cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const avgResponseTime =
      this.responseTimes.length > 0
        ? Math.round(
            this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
          )
        : 0;

    return {
      cacheHits: this.hits,
      cacheMisses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      cachedJokes: this.cache.keys().length,
      totalRequests: total,
      avgResponseTime,
    };
  }

  /**
   * Gets cache size
   */
  getSize(): number {
    return this.cache.keys().length;
  }
}

export const cache = new JokeCache();
