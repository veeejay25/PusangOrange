/**
 * @fileoverview Advanced resilience patterns for Tarkov API
 * Implements circuit breaker, exponential backoff, and adaptive retry strategies
 */

import { NetworkError, TimeoutError, RateLimitError, ErrorUtils } from './tarkovErrors';

/**
 * Circuit breaker states
 */
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Circuit breaker configuration
 */
interface CircuitBreakerConfig {
  /** Failure threshold to open circuit */
  failureThreshold: number;
  /** Success threshold to close circuit */
  successThreshold: number;
  /** Timeout before attempting half-open */
  timeout: number;
  /** Window size for failure counting */
  windowSize: number;
}

/**
 * Retry strategy configuration
 */
interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Base delay between retries (ms) */
  baseDelay: number;
  /** Maximum delay cap (ms) */
  maxDelay: number;
  /** Exponential backoff multiplier */
  backoffMultiplier: number;
  /** Jitter to prevent thundering herd */
  jitter: boolean;
}

/**
 * Circuit breaker for API resilience
 * Prevents cascading failures by temporarily stopping requests to failing services
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private readonly failures: number[] = [];

  constructor(private readonly config: CircuitBreakerConfig) {}

  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new NetworkError('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get current circuit breaker status
   */
  getStatus(): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    failureRate: number;
  } {
    const now = Date.now();
    const recentFailures = this.failures.filter(
      time => now - time < this.config.windowSize
    );

    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      failureRate: recentFailures.length / this.config.windowSize * 100,
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.failures.length = 0;
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = 'CLOSED';
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    const now = Date.now();
    this.failures.push(now);
    this.failureCount++;
    this.lastFailureTime = now;

    // Clean old failures outside window
    const windowStart = now - this.config.windowSize;
    const recentFailures = this.failures.filter(time => time >= windowStart);
    this.failures.length = 0;
    this.failures.push(...recentFailures);

    if (recentFailures.length >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.successCount = 0;
    }
  }

  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime >= this.config.timeout;
  }
}

/**
 * Advanced retry strategy with exponential backoff and jitter
 */
export class RetryStrategy {
  constructor(private readonly config: RetryConfig) {}

  /**
   * Execute function with retry logic
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error;
    let attempt = 0;

    while (attempt < this.config.maxAttempts) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Don't retry certain errors
        if (!this.shouldRetry(error as Error)) {
          throw error;
        }

        if (attempt >= this.config.maxAttempts) {
          break;
        }

        const delay = this.calculateDelay(attempt);
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Calculate delay for next retry attempt
   */
  private calculateDelay(attempt: number): number {
    let delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, this.config.maxDelay);

    // Add jitter to prevent thundering herd
    if (this.config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  /**
   * Determine if error should be retried
   */
  private shouldRetry(error: Error): boolean {
    // Don't retry client errors (400-499) except for specific cases
    if (ErrorUtils.isNetworkError(error)) {
      const networkError = error as NetworkError;
      if (networkError.statusCode && networkError.statusCode >= 400 && networkError.statusCode < 500) {
        // Retry on 408 (timeout), 429 (rate limit), and 502-504 (server errors)
        return [408, 429, 502, 503, 504].includes(networkError.statusCode);
      }
      return true; // Retry network errors without status codes
    }

    // Retry timeouts
    if (ErrorUtils.isErrorType(error, TimeoutError)) {
      return true;
    }

    // Don't retry GraphQL or parse errors
    return false;
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Adaptive resilience manager
 * Combines circuit breaker, retry logic, and adaptive strategies
 */
export class ResilienceManager {
  private readonly circuitBreaker: CircuitBreaker;
  private readonly retryStrategy: RetryStrategy;
  private readonly metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    lastUpdateTime: Date.now(),
  };

  constructor(
    circuitConfig?: Partial<CircuitBreakerConfig>,
    retryConfig?: Partial<RetryConfig>
  ) {
    // Default circuit breaker config optimized for API calls
    const defaultCircuitConfig: CircuitBreakerConfig = {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 60000, // 1 minute
      windowSize: 300000, // 5 minutes
    };

    // Default retry config with reasonable mobile-friendly values
    const defaultRetryConfig: RetryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
    };

    this.circuitBreaker = new CircuitBreaker({
      ...defaultCircuitConfig,
      ...circuitConfig,
    });

    this.retryStrategy = new RetryStrategy({
      ...defaultRetryConfig,
      ...retryConfig,
    });
  }

  /**
   * Execute function with full resilience (circuit breaker + retry + metrics)
   */
  async execute<T>(
    fn: () => Promise<T>,
    context?: { operation: string; priority: 'high' | 'medium' | 'low' }
  ): Promise<T> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const result = await this.circuitBreaker.execute(async () => {
        return this.retryStrategy.execute(fn);
      });

      // Record success metrics
      this.metrics.successfulRequests++;
      this.updateAverageResponseTime(Date.now() - startTime);

      return result;
    } catch (error) {
      // Record failure metrics
      this.metrics.failedRequests++;
      this.updateAverageResponseTime(Date.now() - startTime);

      // Add context to error
      if (context?.operation && error instanceof Error) {
        error.message = `${context.operation}: ${error.message}`;
      }

      throw error;
    }
  }

  /**
   * Get resilience metrics and health status
   */
  getMetrics() {
    const cbStatus = this.circuitBreaker.getStatus();
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
      : 100;

    let healthStatus: 'healthy' | 'degraded' | 'unhealthy';
    const recommendations: string[] = [];

    if (cbStatus.state === 'OPEN') {
      healthStatus = 'unhealthy';
      recommendations.push('Circuit breaker is open - service is unavailable');
    } else if (successRate < 90) {
      healthStatus = 'degraded';
      recommendations.push('High failure rate detected - consider reducing request frequency');
    } else if (this.metrics.averageResponseTime > 10000) {
      healthStatus = 'degraded';
      recommendations.push('High response times - consider optimizing queries');
    } else {
      healthStatus = 'healthy';
    }

    if (cbStatus.failureRate > 20) {
      recommendations.push('Consider implementing request deduplication or batching');
    }

    return {
      requests: { ...this.metrics },
      circuitBreaker: cbStatus,
      healthStatus,
      recommendations,
    };
  }

  /**
   * Reset all resilience components
   */
  reset(): void {
    this.circuitBreaker.reset();
    this.metrics.totalRequests = 0;
    this.metrics.successfulRequests = 0;
    this.metrics.failedRequests = 0;
    this.metrics.averageResponseTime = 0;
    this.metrics.lastUpdateTime = Date.now();
  }

  /**
   * Update rolling average response time
   */
  private updateAverageResponseTime(responseTime: number): void {
    const alpha = 0.1; // Smoothing factor
    this.metrics.averageResponseTime = 
      this.metrics.averageResponseTime * (1 - alpha) + responseTime * alpha;
  }
}

/**
 * Global resilience manager instance
 */
export const globalResilienceManager = new ResilienceManager();

/**
 * Resilience decorator for easy function wrapping
 */
export function withResilience<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: { operation: string; priority: 'high' | 'medium' | 'low' }
): T {
  return ((...args: Parameters<T>) => {
    return globalResilienceManager.execute(() => fn(...args), context);
  }) as T;
}

/**
 * Health check utilities
 */
export const HealthCheck = {
  /**
   * Perform a comprehensive health check
   */
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warn';
      message: string;
      responseTime?: number;
    }>;
    recommendations: string[];
  }> {
    const checks: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warn';
      message: string;
      responseTime?: number;
    }> = [];
    const startTime = Date.now();

    // Check circuit breaker status
    const cbStatus = globalResilienceManager.getMetrics().circuitBreaker;
    checks.push({
      name: 'Circuit Breaker',
      status: cbStatus.state === 'CLOSED' ? 'pass' : cbStatus.state === 'HALF_OPEN' ? 'warn' : 'fail',
      message: `Circuit breaker is ${cbStatus.state}`,
    });

    // Check response times
    const metrics = globalResilienceManager.getMetrics();
    checks.push({
      name: 'Response Time',
      status: metrics.requests.averageResponseTime < 5000 ? 'pass' : 
              metrics.requests.averageResponseTime < 10000 ? 'warn' : 'fail',
      message: `Average response time: ${Math.round(metrics.requests.averageResponseTime)}ms`,
      responseTime: metrics.requests.averageResponseTime,
    });

    // Test basic connectivity (simple ping-like check)
    try {
      const pingStart = Date.now();
      await fetch('https://api.tarkov.dev/graphql', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ __typename }' }),
      });
      const pingTime = Date.now() - pingStart;
      
      checks.push({
        name: 'API Connectivity',
        status: 'pass',
        message: 'API is reachable',
        responseTime: pingTime,
      });
    } catch (error) {
      checks.push({
        name: 'API Connectivity',
        status: 'fail',
        message: `API unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    // Determine overall status
    const hasFailures = checks.some(check => check.status === 'fail');
    const hasWarnings = checks.some(check => check.status === 'warn');
    
    const status = hasFailures ? 'unhealthy' : hasWarnings ? 'degraded' : 'healthy';
    
    return {
      status,
      checks,
      recommendations: metrics.recommendations,
    };
  },
} as const;