import { Joke, JokeType, JokeProvider, ApiResponse } from '../types';
import { JokeApiProvider } from './providers/jokeapi.provider';
import { DadJokesProvider } from './providers/dadjokes.provider';
import { OfficialJokeProvider } from './providers/official.provider';
import { cache } from './cache';
import { normalizeJokeType } from '../utils/validators';
import logger from '../utils/logger';

export class JokeService {
  private providers: JokeProvider[];

  constructor() {
    this.providers = [
      new JokeApiProvider(),
      new DadJokesProvider(),
      new OfficialJokeProvider(),
    ];
  }

  /**
   * Gets a random joke from any provider
   */
  async getRandomJoke(type?: JokeType): Promise<Joke> {
    const start = Date.now();
    try {
      const normalizedType = type ? normalizeJokeType(String(type)) : undefined;
      
      // Try to get from cache
      const cacheKey = `joke:${normalizedType || 'any'}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        cache.recordResponseTime(Date.now() - start);
        return cached;
      }

      // Get random provider that supports this type
      const provider = this.getRandomProvider(normalizedType);
      const joke = await provider.getJoke(normalizedType);

      // Cache the result
      cache.set(joke.id, joke);

      cache.recordResponseTime(Date.now() - start);
      return joke;
    } catch (error) {
      logger.error(`Failed to get random joke: ${error}`);
      throw error;
    }
  }

  /**
   * Gets multiple random jokes
   */
  async getRandomJokes(count: number, type?: JokeType): Promise<Joke[]> {
    const start = Date.now();
    const jokes: Joke[] = [];
    const normalizedType = type ? normalizeJokeType(String(type)) : undefined;

    for (let i = 0; i < count; i++) {
      try {
        const joke = await this.getRandomJoke(normalizedType);
        jokes.push(joke);
      } catch (error) {
        logger.warn(`Failed to fetch joke ${i + 1}/${count}: ${error}`);
      }
    }

    cache.recordResponseTime(Date.now() - start);
    return jokes;
  }

  /**
   * Gets all supported joke types
   */
  getSupportedTypes(): JokeType[] {
    const types = new Set<JokeType>();
    this.providers.forEach((provider) => {
      provider.getSupportedTypes().forEach((type) => {
        types.add(type);
      });
    });
    return Array.from(types).sort();
  }

  /**
   * Gets a random provider that supports the given type
   */
  private getRandomProvider(type?: JokeType): JokeProvider {
    if (!type) {
      // Return random provider
      return this.providers[Math.floor(Math.random() * this.providers.length)];
    }

    // Filter providers that support the type
    const supportingProviders = this.providers.filter((p) =>
      p.getSupportedTypes().includes(type)
    );

    if (supportingProviders.length === 0) {
      logger.warn(`No provider supports type '${type}', using random provider`);
      return this.providers[Math.floor(Math.random() * this.providers.length)];
    }

    return supportingProviders[
      Math.floor(Math.random() * supportingProviders.length)
    ];
  }
}

export const jokeService = new JokeService();
