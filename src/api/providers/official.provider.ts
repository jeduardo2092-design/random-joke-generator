import axios, { AxiosError } from 'axios';
import { Joke, OfficialJokeResponse, JokeProvider, JokeType } from '../../types';
import { retry } from '../../utils/retry';
import logger from '../../utils/logger';

const API_BASE = 'https://official-joke-api.appspot.com/random_joke';
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  timeoutMs: 5000,
};

const SUPPORTED_TYPES: JokeType[] = ['programming', 'general', 'knock-knock'];

export class OfficialJokeProvider implements JokeProvider {
  name: JokeProvider['name'] = 'official-joke-api';

  async getJoke(type?: JokeType): Promise<Joke> {
    return retry(
      () => this.fetchJoke(type),
      RETRY_CONFIG
    );
  }

  async getJokes(count: number, type?: JokeType): Promise<Joke[]> {
    const jokes: Joke[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const joke = await this.getJoke(type);
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

  private async fetchJoke(type?: JokeType): Promise<Joke> {
    try {
      const url = type && SUPPORTED_TYPES.includes(type)
        ? `https://official-joke-api.appspot.com/jokes/${type}/random`
        : API_BASE;

      const response = await axios.get<OfficialJokeResponse | OfficialJokeResponse[]>(
        url,
        {
          timeout: RETRY_CONFIG.timeoutMs,
        }
      );

      const data = Array.isArray(response.data) ? response.data[0] : response.data;

      return {
        id: `official-joke-${data.id}`,
        setup: data.setup,
        delivery: data.punchline,
        type: (data.type as JokeType) || 'general',
        source: 'official-joke-api',
      };
    } catch (error) {
      const message = error instanceof AxiosError 
        ? error.message 
        : 'Unknown error';
      logger.error(`Official Joke API request failed: ${message}`);
      throw error;
    }
  }
}
