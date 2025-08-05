/**
 * Cache Storage Manager
 * Handles temporary in-memory storage for user settings and session data
 * Data is lost when app is closed/restarted
 */

import { PlayerSettings } from '@/contexts/PlayerSettingsContext';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt?: number; // Optional expiration time
}

type CacheStorage = {
  [key: string]: CacheEntry<any>;
};

class CacheStorageManager {
  private static cache: CacheStorage = {};

  /**
   * Store data in cache with optional TTL (time to live)
   */
  static set<T>(key: string, data: T, ttlMs?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined
    };
    
    this.cache[key] = entry;
  }

  /**
   * Get data from cache
   * Returns null if expired or doesn't exist
   */
  static get<T>(key: string): T | null {
    const entry = this.cache[key];
    
    if (!entry) return null;
    
    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      delete this.cache[key];
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  static has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove specific key from cache
   */
  static delete(key: string): void {
    delete this.cache[key];
  }

  /**
   * Clear all cache data
   */
  static clear(): void {
    this.cache = {};
  }

  /**
   * Get all cache keys
   */
  static keys(): string[] {
    return Object.keys(this.cache);
  }

  /**
   * Get cache size (number of entries)
   */
  static size(): number {
    return Object.keys(this.cache).length;
  }

  /**
   * Clean expired entries
   */
  static cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of Object.entries(this.cache)) {
      if (entry.expiresAt && now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => delete this.cache[key]);
  }

  /**
   * Get cache statistics for debugging
   */
  static getStats(): {
    totalEntries: number;
    expiredEntries: number;
    memoryUsage: number; // Rough estimate in bytes
  } {
    const now = Date.now();
    let expiredCount = 0;
    let memoryEstimate = 0;
    
    for (const entry of Object.values(this.cache)) {
      if (entry.expiresAt && now > entry.expiresAt) {
        expiredCount++;
      }
      // Rough memory estimate
      memoryEstimate += JSON.stringify(entry).length * 2; // UTF-16 encoding
    }
    
    return {
      totalEntries: this.size(),
      expiredEntries: expiredCount,
      memoryUsage: memoryEstimate
    };
  }
}

// Specific cache keys for different data types
export const CACHE_KEYS = {
  PLAYER_SETTINGS: 'player_settings',
  SESSION_DATA: 'session_data',
  UI_STATE: 'ui_state',
  TEMP_PROGRESS: 'temp_progress'
} as const;

// Convenience methods for common data types
export class UserCache {
  
  /**
   * Store player settings in cache
   */
  static setPlayerSettings(settings: PlayerSettings, ttlMs?: number): void {
    CacheStorageManager.set(CACHE_KEYS.PLAYER_SETTINGS, settings, ttlMs);
  }

  /**
   * Get player settings from cache
   */
  static getPlayerSettings(): PlayerSettings | null {
    return CacheStorageManager.get<PlayerSettings>(CACHE_KEYS.PLAYER_SETTINGS);
  }

  /**
   * Update specific player setting
   */
  static updatePlayerSetting<K extends keyof PlayerSettings>(
    key: K, 
    value: PlayerSettings[K]
  ): void {
    const current = this.getPlayerSettings();
    if (current) {
      const updated = { ...current, [key]: value };
      this.setPlayerSettings(updated);
    }
  }

  /**
   * Store session-specific data
   */
  static setSessionData<T>(data: T, ttlMs: number = 30 * 60 * 1000): void { // 30 min default
    CacheStorageManager.set(CACHE_KEYS.SESSION_DATA, data, ttlMs);
  }

  /**
   * Get session data
   */
  static getSessionData<T>(): T | null {
    return CacheStorageManager.get<T>(CACHE_KEYS.SESSION_DATA);
  }

  /**
   * Clear all user cache data
   */
  static clearAll(): void {
    CacheStorageManager.clear();
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    return CacheStorageManager.getStats();
  }

  /**
   * Clean expired entries
   */
  static cleanup(): void {
    CacheStorageManager.cleanup();
  }
}

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
  UserCache.cleanup();
}, 5 * 60 * 1000);

export default CacheStorageManager;