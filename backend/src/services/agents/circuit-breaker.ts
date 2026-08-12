/**
 * Circuit Breaker — Blueprint Phase 4.4
 * Prevents cascading failures by opening the circuit after N failures.
 * Falls back to cached/mock data while the circuit is open.
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: CircuitState = 'closed';

  constructor(
    private readonly threshold = 3,       // Open after N failures
    private readonly resetTimeoutMs = 30_000 // Try again after 30s
  ) {}

  get currentState(): CircuitState {
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'half-open';
      } else {
        return fallback();
      }
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      return fallback();
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  getMetrics() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}
