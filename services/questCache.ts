import AsyncStorage from '@react-native-async-storage/async-storage';
import { Quest, Trader, HideoutStation } from './tarkovTypes';

interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface QuestCache {
  [traderId: string]: CachedData<Quest[]>;
}

type TraderCache = CachedData<Trader[]>;
type HideoutStationCache = CachedData<HideoutStation[]>;

const QUEST_CACHE_KEY = '@quest_cache';
const TRADER_CACHE_KEY = '@trader_cache';
const HIDEOUT_CACHE_KEY = '@hideout_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export class QuestCacheManager {
  private static questCache: QuestCache = {};
  private static traderCache: Trader[] | null = null;
  private static traderCacheExpiry = 0;
  private static hideoutCache: HideoutStation[] | null = null;
  private static hideoutCacheExpiry = 0;

  // Initialize cache from storage
  static async initialize() {
    try {
      const [questCacheData, traderCacheData, hideoutCacheData] = await Promise.all([
        AsyncStorage.getItem(QUEST_CACHE_KEY),
        AsyncStorage.getItem(TRADER_CACHE_KEY),
        AsyncStorage.getItem(HIDEOUT_CACHE_KEY)
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

      if (hideoutCacheData) {
        const cached: HideoutStationCache = JSON.parse(hideoutCacheData);
        if (Date.now() < cached.expiresAt) {
          this.hideoutCache = cached.data;
          this.hideoutCacheExpiry = cached.expiresAt;
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

  // Save hideout cache to storage
  private static async saveHideoutCache() {
    try {
      const cacheData: HideoutStationCache = {
        data: this.hideoutCache!,
        timestamp: Date.now(),
        expiresAt: this.hideoutCacheExpiry
      };
      await AsyncStorage.setItem(HIDEOUT_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving hideout cache:', error);
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

  // Get cached hideout stations
  static getCachedHideoutStations(): HideoutStation[] | null {
    if (!this.hideoutCache || Date.now() > this.hideoutCacheExpiry) {
      this.hideoutCache = null;
      this.hideoutCacheExpiry = 0;
      return null;
    }
    return this.hideoutCache;
  }

  // Cache hideout stations
  static async cacheHideoutStations(stations: HideoutStation[]) {
    const now = Date.now();
    this.hideoutCache = stations;
    this.hideoutCacheExpiry = now + CACHE_DURATION;

    await this.saveHideoutCache();
  }

  // Clear all caches
  static async clearAllCaches() {
    this.questCache = {};
    this.traderCache = null;
    this.traderCacheExpiry = 0;
    this.hideoutCache = null;
    this.hideoutCacheExpiry = 0;

    try {
      await Promise.all([
        AsyncStorage.removeItem(QUEST_CACHE_KEY),
        AsyncStorage.removeItem(TRADER_CACHE_KEY),
        AsyncStorage.removeItem(HIDEOUT_CACHE_KEY)
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
      hideout: {
        cached: this.hideoutCache !== null,
        expires: this.hideoutCacheExpiry > now ? new Date(this.hideoutCacheExpiry) : null,
        count: this.hideoutCache?.length || 0
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