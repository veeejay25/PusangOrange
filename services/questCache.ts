import AsyncStorage from '@react-native-async-storage/async-storage';
import { Quest, Trader } from './tarkovApi';

interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface QuestCache {
  [traderId: string]: CachedData<Quest[]>;
}

interface TraderCache extends CachedData<Trader[]> {}

const QUEST_CACHE_KEY = '@quest_cache';
const TRADER_CACHE_KEY = '@trader_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export class QuestCacheManager {
  private static questCache: QuestCache = {};
  private static traderCache: Trader[] | null = null;
  private static traderCacheExpiry = 0;

  // Initialize cache from storage
  static async initialize() {
    try {
      const [questCacheData, traderCacheData] = await Promise.all([
        AsyncStorage.getItem(QUEST_CACHE_KEY),
        AsyncStorage.getItem(TRADER_CACHE_KEY)
      ]);

      if (questCacheData) {
        this.questCache = JSON.parse(questCacheData);
      }

      if (traderCacheData) {
        const cached: TraderCache = JSON.parse(traderCacheData);
        if (Date.now() < cached.expiresAt) {
          this.traderCache = cached.data;
          this.traderCacheExpiry = cached.expiresAt;
        }
      }
    } catch (error) {
      console.error('Error initializing quest cache:', error);
    }
  }

  // Save quest cache to storage
  private static async saveQuestCache() {
    try {
      await AsyncStorage.setItem(QUEST_CACHE_KEY, JSON.stringify(this.questCache));
    } catch (error) {
      console.error('Error saving quest cache:', error);
    }
  }

  // Save trader cache to storage
  private static async saveTraderCache() {
    try {
      const cacheData: TraderCache = {
        data: this.traderCache!,
        timestamp: Date.now(),
        expiresAt: this.traderCacheExpiry
      };
      await AsyncStorage.setItem(TRADER_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving trader cache:', error);
    }
  }

  // Get cached quests for a trader
  static getCachedQuests(traderId: string): Quest[] | null {
    const cached = this.questCache[traderId];
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() > cached.expiresAt) {
      delete this.questCache[traderId];
      this.saveQuestCache(); // Clean up expired cache
      return null;
    }

    return cached.data;
  }

  // Cache quests for a trader
  static async cacheQuests(traderId: string, quests: Quest[]) {
    const now = Date.now();
    this.questCache[traderId] = {
      data: quests,
      timestamp: now,
      expiresAt: now + CACHE_DURATION
    };

    await this.saveQuestCache();
  }

  // Get cached traders
  static getCachedTraders(): Trader[] | null {
    if (!this.traderCache || Date.now() > this.traderCacheExpiry) {
      this.traderCache = null;
      this.traderCacheExpiry = 0;
      return null;
    }
    return this.traderCache;
  }

  // Cache traders
  static async cacheTraders(traders: Trader[]) {
    const now = Date.now();
    this.traderCache = traders;
    this.traderCacheExpiry = now + CACHE_DURATION;

    await this.saveTraderCache();
  }

  // Clear all caches
  static async clearAllCaches() {
    this.questCache = {};
    this.traderCache = null;
    this.traderCacheExpiry = 0;

    try {
      await Promise.all([
        AsyncStorage.removeItem(QUEST_CACHE_KEY),
        AsyncStorage.removeItem(TRADER_CACHE_KEY)
      ]);
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  }

  // Clear cache for specific trader
  static async clearTraderQuests(traderId: string) {
    delete this.questCache[traderId];
    await this.saveQuestCache();
  }

  // Get cache status for debugging
  static getCacheStatus() {
    const now = Date.now();
    return {
      traders: {
        cached: this.traderCache !== null,
        expires: this.traderCacheExpiry > now ? new Date(this.traderCacheExpiry) : null,
        count: this.traderCache?.length || 0
      },
      quests: Object.entries(this.questCache).map(([traderId, cache]) => ({
        traderId,
        cached: cache.expiresAt > now,
        expires: new Date(cache.expiresAt),
        count: cache.data.length
      }))
    };
  }
}