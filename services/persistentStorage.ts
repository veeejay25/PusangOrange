import AsyncStorage from '@react-native-async-storage/async-storage';
import { Quest, Trader, HideoutStation } from './tarkovApi';
import { PlayerSettings } from '@/contexts/PlayerSettingsContext';

/**
 * Persistent Storage Manager
 * Handles long-term device storage for API data (quests, traders, hideout stations)
 * Data persists across app restarts and doesn't expire
 */

interface StoredApiData {
  data: any;
  lastUpdated: number;
  version: string; // For handling API schema changes
}

const API_DATA_KEYS = {
  QUESTS: '@persistent_quests',
  TRADERS: '@persistent_traders', 
  HIDEOUT_STATIONS: '@persistent_hideout_stations',
  KAPPA_QUESTS: '@persistent_kappa_quests',
  PLAYER_SETTINGS: '@persistent_player_settings'
};

const CURRENT_VERSION = '1.0.0';

export class PersistentStorage {
  
  /**
   * Store API data persistently (no expiration)
   */
  static async storeApiData<T>(key: string, data: T): Promise<void> {
    try {
      const storedData: StoredApiData = {
        data,
        lastUpdated: Date.now(),
        version: CURRENT_VERSION
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(storedData));
    } catch (error) {
      console.error(`Error storing API data for key ${key}:`, error);
    }
  }

  /**
   * Retrieve API data from persistent storage
   */
  static async getApiData<T>(key: string): Promise<T | null> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return null;

      const parsedData: StoredApiData = JSON.parse(stored);
      
      // Check version compatibility
      if (parsedData.version !== CURRENT_VERSION) {
        // Version mismatch - clear old data
        await AsyncStorage.removeItem(key);
        return null;
      }

      return parsedData.data as T;
    } catch (error) {
      console.error(`Error retrieving API data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Check when API data was last updated
   */
  static async getLastUpdated(key: string): Promise<number | null> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return null;

      const parsedData: StoredApiData = JSON.parse(stored);
      return parsedData.lastUpdated;
    } catch (error) {
      console.error(`Error getting last updated for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Clear all persistent API data (useful for reset/refresh)
   * Excludes player settings to preserve user data
   */
  static async clearAllApiData(): Promise<void> {
    try {
      const apiKeys = [
        API_DATA_KEYS.QUESTS,
        API_DATA_KEYS.TRADERS,
        API_DATA_KEYS.HIDEOUT_STATIONS,
        API_DATA_KEYS.KAPPA_QUESTS
      ];
      await Promise.all(apiKeys.map(key => AsyncStorage.removeItem(key)));
    } catch (error) {
      console.error('Error clearing API data:', error);
    }
  }

  // Specific methods for each data type
  
  static async storeQuests(quests: Quest[]): Promise<void> {
    await this.storeApiData(API_DATA_KEYS.QUESTS, quests);
  }

  static async getQuests(): Promise<Quest[] | null> {
    return await this.getApiData<Quest[]>(API_DATA_KEYS.QUESTS);
  }

  static async storeTraders(traders: Trader[]): Promise<void> {
    await this.storeApiData(API_DATA_KEYS.TRADERS, traders);
  }

  static async getTraders(): Promise<Trader[] | null> {
    return await this.getApiData<Trader[]>(API_DATA_KEYS.TRADERS);
  }

  static async storeHideoutStations(stations: HideoutStation[]): Promise<void> {
    await this.storeApiData(API_DATA_KEYS.HIDEOUT_STATIONS, stations);
  }

  static async getHideoutStations(): Promise<HideoutStation[] | null> {
    return await this.getApiData<HideoutStation[]>(API_DATA_KEYS.HIDEOUT_STATIONS);
  }

  static async storeKappaQuests(kappaQuests: Quest[]): Promise<void> {
    await this.storeApiData(API_DATA_KEYS.KAPPA_QUESTS, kappaQuests);
  }

  static async getKappaQuests(): Promise<Quest[] | null> {
    return await this.getApiData<Quest[]>(API_DATA_KEYS.KAPPA_QUESTS);
  }

  static async storePlayerSettings(settings: PlayerSettings): Promise<void> {
    await this.storeApiData(API_DATA_KEYS.PLAYER_SETTINGS, settings);
  }

  static async getPlayerSettings(): Promise<PlayerSettings | null> {
    return await this.getApiData<PlayerSettings>(API_DATA_KEYS.PLAYER_SETTINGS);
  }

  /**
   * Get storage info for debugging
   */
  static async getStorageInfo(): Promise<{[key: string]: {size: number, lastUpdated: number | null}}> {
    const info: {[key: string]: {size: number, lastUpdated: number | null}} = {};
    
    for (const [name, key] of Object.entries(API_DATA_KEYS)) {
      try {
        const data = await AsyncStorage.getItem(key);
        const lastUpdated = await this.getLastUpdated(key);
        
        info[name] = {
          size: data ? JSON.stringify(data).length : 0,
          lastUpdated
        };
      } catch (error) {
        info[name] = { size: 0, lastUpdated: null };
      }
    }
    
    return info;
  }
}