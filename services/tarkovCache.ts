/**
 * @fileoverview Advanced caching and request deduplication for Tarkov API
 * Provides in-memory caching with TTL, request deduplication, and intelligent cache management
 */

import type { CacheConfig } from './tarkovTypes';

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  /** Cached data */
  data: T;
  /** Timestamp when data was cached */
  timestamp: number;
  /** Time-to-live in milliseconds */
  ttl: number;
  /** Cache hit count for statistics */
  hits: number;
}

/**
 * Pending request information for deduplication
 */
interface PendingRequest<T> {
  /** The promise that resolves to the data */
  promise: Promise<T>;
  /** Timestamp when request was initiated */
  timestamp: number;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  /** Total number of cache hits */
  hits: number;
  /** Total number of cache misses */
  misses: number;
  /** Current number of cached entries */
  entries: number;
  /** Total memory usage estimate in bytes */
  memoryUsage: number;
  /** Number of deduplicated requests */
  deduplicatedRequests: number;
}

/**
 * Advanced cache configuration
 */
export interface AdvancedCacheConfig extends CacheConfig {
  /** Maximum number of entries to keep in cache */
  maxEntries?: number;
  /** Whether to enable request deduplication */
  enableDeduplication?: boolean;
  /** Cleanup interval in milliseconds */
  cleanupInterval?: number;
}

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: Required<AdvancedCacheConfig> = {
  forceRefresh: false,
  ttl: 5 * 60 * 1000, // 5 minutes
  maxEntries: 100,
  enableDeduplication: true,
  cleanupInterval: 2 * 60 * 1000, // 2 minutes
} as const;

/**
 * Advanced cache manager with deduplication and TTL support
 */
export class TarkovCache {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly pendingRequests = new Map<string, PendingRequest<unknown>>();
  private readonly config: Required<AdvancedCacheConfig>;
  private cleanupTimer?: NodeJS.Timeout;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    entries: 0,
    memoryUsage: 0,
    deduplicatedRequests: 0,
  };

  constructor(config: AdvancedCacheConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanupTimer();
  }

  /**
   * Get cached data or execute provider function with deduplication
   * @param key - Unique cache key
   * @param provider - Function to fetch fresh data
   * @param config - Cache configuration overrides
   * @returns Cached or fresh data
   */
  async get<T>(
    key: string,
    provider: () => Promise<T>,
    config: CacheConfig = {}
  ): Promise<T> {
    const effectiveConfig = { ...this.config, ...config };
    
    // Force refresh bypasses all caching
    if (effectiveConfig.forceRefresh) {
      return this.fetchAndCache(key, provider, effectiveConfig.ttl);
    }

    // Check for valid cached data
    const cached = this.getCachedData<T>(key);
    if (cached !== null) {
      this.stats.hits++;
      cached.hits++;
      return cached.data;
    }

    // Check for pending request (deduplication)
    if (effectiveConfig.enableDeduplication) {
      const pending = this.pendingRequests.get(key);
      if (pending) {
        this.stats.deduplicatedRequests++;
        return pending.promise as Promise<T>;
      }
    }

    this.stats.misses++;
    return this.fetchAndCache(key, provider, effectiveConfig.ttl);
  }

  /**
   * Get data from cache without falling back to provider
   * @param key - Cache key
   * @returns Cached data or null if not found/expired
   */
  getCachedOnly<T>(key: string): T | null {
    const cached = this.getCachedData<T>(key);
    if (cached) {
      this.stats.hits++;
      cached.hits++;
      return cached.data;
    }
    return null;
  }

  /**
   * Manually set cache entry
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time-to-live in milliseconds
   */
  set<T>(key: string, data: T, ttl: number = this.config.ttl): void {
    this.setCacheEntry(key, data, ttl);
    this.updateStats();
  }

  /**
   * Check if key exists in cache and is not expired
   * @param key - Cache key
   * @returns True if key exists and is valid
   */
  has(key: string): boolean {
    return this.getCachedData(key) !== null;
  }

  /**
   * Remove specific cache entry
   * @param key - Cache key to remove
   * @returns True if entry was removed
   */
  delete(key: string): boolean {
    const removed = this.cache.delete(key);
    this.pendingRequests.delete(key);
    if (removed) {
      this.updateStats();
    }
    return removed;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    this.updateStats();
  }

  /**
   * Get cache statistics
   * @returns Current cache statistics
   */
  getStats(): Readonly<CacheStats> {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get cache hit ratio as percentage
   * @returns Hit ratio (0-100)
   */
  getHitRatio(): number {
    const total = this.stats.hits + this.stats.misses;
    return total === 0 ? 0 : (this.stats.hits / total) * 100;
  }

  /**
   * Get all cache keys
   * @returns Array of all cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Force cleanup of expired entries
   * @returns Number of entries removed
   */
  cleanup(): number {
    const initialSize = this.cache.size;
    const now = Date.now();
    
    // Use Array.from to avoid iterator compatibility issues
    const cacheEntries = Array.from(this.cache.entries());
    for (const [key, entry] of cacheEntries) {
      if (this.isExpired(entry, now)) {
        this.cache.delete(key);
      }
    }

    // Also cleanup old pending requests (older than 30 seconds)
    const pendingEntries = Array.from(this.pendingRequests.entries());
    for (const [key, pending] of pendingEntries) {
      if (now - pending.timestamp > 30000) {
        this.pendingRequests.delete(key);
      }
    }

    this.updateStats();
    return initialSize - this.cache.size;
  }

  /**
   * Resize cache to fit within maxEntries limit
   * Uses LRU eviction based on last hit time and hit count
   */
  private resize(): void {
    if (this.cache.size <= this.config.maxEntries) return;

    // Sort by hit count (ascending) and timestamp (ascending) for LRU
    const entries = Array.from(this.cache.entries()).sort(([, a], [, b]) => {
      if (a.hits !== b.hits) {
        return a.hits - b.hits; // Fewer hits first
      }
      return a.timestamp - b.timestamp; // Older first
    });

    // Remove oldest/least used entries
    const toRemove = this.cache.size - this.config.maxEntries;
    for (let i = 0; i < toRemove; i++) {
      const [key] = entries[i];
      this.cache.delete(key);
    }
  }

  /**
   * Fetch data and cache it with deduplication
   */
  private async fetchAndCache<T>(
    key: string,
    provider: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    try {
      // Create and track the pending request
      const promise = provider();
      
      if (this.config.enableDeduplication) {
        this.pendingRequests.set(key, {
          promise: promise as Promise<unknown>,
          timestamp: Date.now(),
        });
      }

      const data = await promise;
      
      // Cache the result
      this.setCacheEntry(key, data, ttl);
      
      return data;
    } catch (error) {
      // Don't cache errors, but clean up pending request
      this.pendingRequests.delete(key);
      throw error;
    } finally {
      // Always cleanup pending request when done
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Get cached data if valid, null otherwise
   */
  private getCachedData<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) return null;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }
    
    return entry;
  }

  /**
   * Set cache entry with metadata
   */
  private setCacheEntry<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
    });
    
    this.resize();
    this.updateStats();
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<unknown>, now: number = Date.now()): boolean {
    return now - entry.timestamp > entry.ttl;
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.entries = this.cache.size;
    
    // Rough memory usage estimate (in bytes)
    let memoryUsage = 0;
    const cacheValues = Array.from(this.cache.values());
    for (const entry of cacheValues) {
      memoryUsage += JSON.stringify(entry.data).length * 2; // Rough UTF-16 estimate
      memoryUsage += 32; // Metadata overhead estimate
    }
    this.stats.memoryUsage = memoryUsage;
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval) as any;
  }

  /**
   * Stop automatic cleanup and clear resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
  }
}

/**
 * Global cache instance for Tarkov API
 * Pre-configured with sensible defaults for API caching
 */
export const globalCache = new TarkovCache({
  ttl: 5 * 60 * 1000, // 5 minutes for most API data
  maxEntries: 50, // Reasonable limit for mobile apps
  enableDeduplication: true,
  cleanupInterval: 2 * 60 * 1000, // Cleanup every 2 minutes
});

/**
 * Cache key builders for consistent cache key generation
 */
export const CacheKeys = {
  traders: () => 'api:traders',
  quests: (traderId?: string) => traderId ? `api:quests:${traderId}` : 'api:quests:all',
  kappaQuests: () => 'api:quests:kappa',
  hideoutStations: () => 'api:hideout:stations',
  allItems: (playerSettingsHash?: string) => 
    playerSettingsHash ? `api:items:${playerSettingsHash}` : 'api:items',
} as const;

/**
 * Utility to generate consistent hash for player settings
 * Used to create unique cache keys based on player configuration
 */
export function hashPlayerSettings(settings?: {
  hideoutModuleLevels?: Record<string, number>;
  completedQuestIds?: readonly string[];
}): string {
  if (!settings) return 'default';
  
  const { hideoutModuleLevels = {}, completedQuestIds = [] } = settings;
  
  // Create a deterministic string representation
  const hideoutHash = Object.entries(hideoutModuleLevels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join(',');
  
  const questsHash = [...completedQuestIds].sort().join(',');
  
  // Simple hash function (for cache key, not cryptographic security)
  const input = `h:${hideoutHash}|q:${questsHash}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}