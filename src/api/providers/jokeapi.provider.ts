import axios, { AxiosError } from 'axios';
import { Joke, JokeAPIResponse, JokeProvider, JokeType } from '../../types';
import { retry, RetryError } from '../../utils/retry';
import logger from '../../utils/logger';

const API_BASE = 'https://v2.jokeapi.dev/joke';
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  timeoutMs: 5000,
};

const SUPPORTED_TYPES: JokeType[] = [
  'programming',
  'general',
  'knock-knock',
  'dark',
  'pun',
  'spooky',
  'christmas',
];

export class JokeApiProvider implements JokeProvider {
  name: JokeProvider['name'] = 'joke-api';

  async getJoke(type?: JokeType): Promise<Joke> {
    const category = type || 'Any';
    return retry(
      () => this.fetchJoke(category),
      RETRY_CONFIG
    );
  }

  async getJokes(count: number, type?: JokeType): Promise<Joke[]> {
    const jokes: Joke[] = [];
    const category = type || 'Any';

    for (let i = 0; i < count; i++) {
      try {
        const joke = await this.getJoke(category as JokeType);
        jokes.push(joke);
      } catch (error) {
        logger.warn(`Failed to fetch joke ${i + 1}/${count}`);
      }
    }

    return jokes;
  }

  getSupportedTypes(): JokeType[] {
    return SUPPORTED_TYPES;
  }

  private async fetchJoke(category: string): Promise<Joke> {
    try {
      const response = await axios.get<JokeAPIResponse>(
        `${API_BASE}/${category}`,
        {
          params: {
            type: 'twopart',
          },
          timeout: RETRY_CONFIG.timeoutMs,
        }
      );

      if (response.data.error) {
        throw new Error(`JokeAPI error: ${response.data}`);
      }

      return {
        id: `joke-api-${response.data.id}`,
        setup: response.data.setup,
        delivery: response.data.delivery,
        type: (response.data.category.toLowerCase() as JokeType) || 'general',
        source: 'joke-api',
        safe: response.data.safe,
      };
    } catch (error) {
      const message = error instanceof AxiosError 
        ? error.message 
        : 'Unknown error';
      logger.error(`JokeAPI request failed: ${message}`);
      throw error;
    }
  }
}
