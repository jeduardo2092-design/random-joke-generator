import { RetryConfig } from '../types';
import logger from './logger';

export class RetryError extends Error {
  constructor(
    public readonly attempts: number,
    public readonly lastError: Error,
    message?: string
  ) {
    super(message || `Failed after ${attempts} attempts: ${lastError.message}`);
    this.name = 'RetryError';
  }
}

/**
 * Executes a function with exponential backoff retry logic
 */
export async function retry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error | null = null;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise<T>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Request timeout after ${config.timeoutMs}ms`)),
            config.timeoutMs
          )
        ),
      ]);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(
        `Attempt ${attempt}/${config.maxAttempts} failed: ${lastError.message}`
      );

      if (attempt < config.maxAttempts) {
        logger.debug(`Retrying in ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(
          delay * config.backoffMultiplier,
          config.maxDelay
        );
      }
    }
  }

  throw new RetryError(
    config.maxAttempts,
    lastError || new Error('Unknown error'),
    `Failed to execute function after ${config.maxAttempts} attempts`
  );
}
