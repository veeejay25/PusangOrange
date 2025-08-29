/**
 * @fileoverview Custom error classes for Tarkov API operations
 * Provides specific error types for better error handling and user feedback
 */

import type { GraphQLError } from './tarkovTypes';

/**
 * Base error class for all Tarkov API related errors
 */
export abstract class TarkovApiError extends Error {
  /** Error code for programmatic handling */
  public readonly code: string;
  /** Original error that caused this error (if any) */
  public readonly cause?: Error;
  /** Timestamp when the error occurred */
  public readonly timestamp: Date;

  constructor(message: string, code: string, cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.cause = cause;
    this.timestamp = new Date();

    // Maintain proper stack trace for V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when network request fails
 */
export class NetworkError extends TarkovApiError {
  /** HTTP status code if available */
  public readonly statusCode?: number;
  /** Response status text if available */
  public readonly statusText?: string;

  constructor(
    message: string,
    statusCode?: number,
    statusText?: string,
    cause?: Error
  ) {
    super(
      message || `Network request failed${statusCode ? ` with status ${statusCode}` : ''}`,
      'NETWORK_ERROR',
      cause
    );
    this.statusCode = statusCode;
    this.statusText = statusText;
  }

  /**
   * Create NetworkError from fetch response
   */
  static fromResponse(response: Response, cause?: Error): NetworkError {
    return new NetworkError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      response.statusText,
      cause
    );
  }
}

/**
 * Error thrown when GraphQL query returns errors
 */
export class GraphQLApiError extends TarkovApiError {
  /** GraphQL errors from the response */
  public readonly graphqlErrors: readonly GraphQLError[];

  constructor(errors: readonly GraphQLError[], cause?: Error) {
    const message = `GraphQL errors: ${errors.map(e => e.message).join('; ')}`;
    super(message, 'GRAPHQL_ERROR', cause);
    this.graphqlErrors = errors;
  }

  /**
   * Get the first error message for simple error display
   */
  get primaryError(): string {
    return this.graphqlErrors[0]?.message || 'Unknown GraphQL error';
  }
}

/**
 * Error thrown when API response cannot be parsed
 */
export class ParseError extends TarkovApiError {
  /** The raw response that failed to parse */
  public readonly rawResponse: string;

  constructor(message: string, rawResponse: string, cause?: Error) {
    super(message || 'Failed to parse API response', 'PARSE_ERROR', cause);
    this.rawResponse = rawResponse;
  }
}

/**
 * Error thrown when persistent storage operations fail
 */
export class StorageError extends TarkovApiError {
  /** The storage key that failed */
  public readonly key?: string;
  /** The operation that failed */
  public readonly operation: 'read' | 'write' | 'delete';

  constructor(
    message: string,
    operation: 'read' | 'write' | 'delete',
    key?: string,
    cause?: Error
  ) {
    super(message || `Storage ${operation} operation failed`, 'STORAGE_ERROR', cause);
    this.key = key;
    this.operation = operation;
  }
}

/**
 * Error thrown when requested data is not found
 */
export class DataNotFoundError extends TarkovApiError {
  /** The resource type that was not found */
  public readonly resourceType: string;
  /** The identifier that was not found */
  public readonly resourceId?: string;

  constructor(resourceType: string, resourceId?: string) {
    const message = resourceId
      ? `${resourceType} with ID '${resourceId}' not found`
      : `${resourceType} not found`;
    
    super(message, 'DATA_NOT_FOUND');
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

/**
 * Error thrown when operation times out
 */
export class TimeoutError extends TarkovApiError {
  /** Timeout duration in milliseconds */
  public readonly timeout: number;

  constructor(timeout: number, operation?: string) {
    const message = operation
      ? `${operation} timed out after ${timeout}ms`
      : `Operation timed out after ${timeout}ms`;
    
    super(message, 'TIMEOUT_ERROR');
    this.timeout = timeout;
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends TarkovApiError {
  /** Time until rate limit resets (in seconds) */
  public readonly retryAfter?: number;
  /** Current rate limit */
  public readonly limit?: number;
  /** Remaining requests */
  public readonly remaining?: number;

  constructor(
    retryAfter?: number,
    limit?: number,
    remaining?: number
  ) {
    const message = retryAfter
      ? `Rate limit exceeded. Retry after ${retryAfter} seconds`
      : 'Rate limit exceeded';
    
    super(message, 'RATE_LIMIT_ERROR');
    this.retryAfter = retryAfter;
    this.limit = limit;
    this.remaining = remaining;
  }
}

/**
 * Utility functions for error handling
 */
export const ErrorUtils = {
  /**
   * Check if an error is a specific Tarkov API error type
   */
  isErrorType<T extends TarkovApiError>(
    error: unknown,
    errorClass: new (...args: any[]) => T
  ): error is T {
    return error instanceof errorClass;
  },

  /**
   * Check if an error is network-related
   */
  isNetworkError(error: unknown): error is NetworkError {
    return this.isErrorType(error, NetworkError);
  },

  /**
   * Check if an error is GraphQL-related
   */
  isGraphQLError(error: unknown): error is GraphQLApiError {
    return this.isErrorType(error, GraphQLApiError);
  },

  /**
   * Check if error suggests data should be retrieved from cache
   */
  shouldFallbackToCache(error: unknown): boolean {
    return (
      this.isNetworkError(error) ||
      this.isErrorType(error, TimeoutError) ||
      this.isErrorType(error, RateLimitError)
    );
  },

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: unknown): string {
    if (error instanceof TarkovApiError) {
      switch (error.code) {
        case 'NETWORK_ERROR':
          return 'Unable to connect to Tarkov API. Using cached data if available.';
        case 'GRAPHQL_ERROR':
          return 'API returned an error. Please try again later.';
        case 'PARSE_ERROR':
          return 'Received invalid data from API. Please try again.';
        case 'STORAGE_ERROR':
          return 'Failed to save data locally. Some features may not work offline.';
        case 'DATA_NOT_FOUND':
          return 'Requested data not found.';
        case 'TIMEOUT_ERROR':
          return 'Request took too long. Please check your connection.';
        case 'RATE_LIMIT_ERROR':
          return 'Too many requests. Please wait a moment before trying again.';
        default:
          return error.message;
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unexpected error occurred';
  },

  /**
   * Convert unknown error to TarkovApiError
   */
  normalize(error: unknown, context?: string): TarkovApiError {
    if (error instanceof TarkovApiError) {
      return error;
    }

    if (error instanceof Error) {
      const message = context ? `${context}: ${error.message}` : error.message;
      return new NetworkError(message, undefined, undefined, error);
    }

    const message = context || 'Unknown error occurred';
    return new NetworkError(message);
  }
} as const;