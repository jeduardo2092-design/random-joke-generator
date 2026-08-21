import axios, { AxiosError } from 'axios';
import { Joke, DadJokeResponse, JokeProvider, JokeType } from '../../types';
import { retry } from '../../utils/retry';
import logger from '../../utils/logger';

const API_BASE = 'https://icanhazdadjoke.com';
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  timeoutMs: 5000,
};

const SUPPORTED_TYPES: JokeType[] = ['dad-joke', 'general', 'pun'];

export class DadJokesProvider implements JokeProvider {
  name: JokeProvider['name'] = 'dad-jokes-api';

  async getJoke(): Promise<Joke> {
    return retry(
      () => this.fetchJoke(),
      RETRY_CONFIG
    );
  }

  async getJokes(count: number): Promise<Joke[]> {
    const jokes: Joke[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const joke = await this.getJoke();
        jokes.push(joke);
      } catch (error) {
        logger.warn(`Failed to fetch dad joke ${i + 1}/${count}`);
      }
    }

    return jokes;
  }

  getSupportedTypes(): JokeType[] {
    return SUPPORTED_TYPES;
  }

  private async fetchJoke(): Promise<Joke> {
    try {
      const response = await axios.get<DadJokeResponse>(
        `${API_BASE}/joke`,
        {
          headers: {
            Accept: 'application/json',
          },
          timeout: RETRY_CONFIG.timeoutMs,
        }
      );

      if (response.data.status !== 200) {
        throw new Error(`Dad Jokes API error: status ${response.data.status}`);
      }

      // Parse the joke text - could be single line or two parts
      const jokeText = response.data.joke;
      const parts = jokeText.split('\n');

      return {
        id: `dad-jokes-${response.data.id}`,
        setup: parts[0],
        delivery: parts.length > 1 ? parts[1] : parts[0],
        type: 'dad-joke',
        source: 'dad-jokes-api',
      };
    } catch (error) {
      const message = error instanceof AxiosError 
        ? error.message 
        : 'Unknown error';
      logger.error(`Dad Jokes API request failed: ${message}`);
      throw error;
    }
  }
}
