/**
 * @fileoverview Repository pattern implementation for Tarkov API data
 * Provides a clean abstraction layer between business logic and data sources
 */

import { PersistentStorage } from './persistentStorage';
import { globalCache, CacheKeys } from './tarkovCache';
import { TarkovService } from './tarkovService';
import { QUERIES } from './tarkovQueries';
import type {
  Trader,
  Quest,
  HideoutStation,
  Item,
  PlayerSettings,
  CacheConfig,
} from './tarkovTypes';

/**
 * Repository interface for Tarkov data operations
 * Abstracts away the complexity of multiple data sources (API, cache, storage)
 */
interface ITarkovRepository {
  // Traders
  getAllTraders(config?: CacheConfig): Promise<Trader[]>;
  getTraderById(id: string): Promise<Trader | null>;
  
  // Quests
  getAllQuests(config?: CacheConfig): Promise<Quest[]>;
  getQuestsByTrader(traderId: string, config?: CacheConfig): Promise<Quest[]>;
  getKappaRequiredQuests(config?: CacheConfig): Promise<Quest[]>;
  getQuestById(id: string): Promise<Quest | null>;
  getQuestDependencies(questId: string): Promise<Quest[]>;
  
  // Hideout
  getAllHideoutStations(config?: CacheConfig): Promise<HideoutStation[]>;
  getHideoutStationById(id: string): Promise<HideoutStation | null>;
  
  // Items
  getAllItems(playerSettings?: {
    hideoutModuleLevels: Record<string, number>;
    completedQuestIds: string[];
  }, config?: CacheConfig): Promise<Item[]>;
  
  // Data integrity
  validateDataConsistency(): Promise<{
    valid: boolean;
    issues: string[];
    suggestions: string[];
  }>;
}

/**
 * Production implementation of the Tarkov repository
 * Uses API service with caching and persistent storage fallbacks
 */
export class TarkovRepository implements ITarkovRepository {
  private readonly service: TarkovService;
  private readonly questCache = new Map<string, Quest>();
  private readonly traderCache = new Map<string, Trader>();

  constructor(service?: TarkovService) {
    this.service = service || new TarkovService();
  }

  /**
   * Get all traders with intelligent caching
   */
  async getAllTraders(config: CacheConfig = {}): Promise<Trader[]> {
    const traders = await this.service.fetchTraders(config);
    
    // Populate local cache for quick lookups
    traders.forEach(trader => {
      this.traderCache.set(trader.id, trader);
    });
    
    return traders;
  }

  /**
   * Get a specific trader by ID (optimized for single lookups)
   */
  async getTraderById(id: string): Promise<Trader | null> {
    // Check local cache first
    if (this.traderCache.has(id)) {
      return this.traderCache.get(id)!;
    }
    
    // Load all traders if not cached (batch efficiency)
    const traders = await this.getAllTraders();
    return this.traderCache.get(id) || null;
  }

  /**
   * Get all quests using a single optimized query
   * This replaces the need for separate quest fetching methods
   */
  async getAllQuests(config: CacheConfig = {}): Promise<Quest[]> {
    const cacheKey = CacheKeys.quests();
    
    return globalCache.get(
      cacheKey,
      async () => {
        // Use the optimized single query instead of multiple calls
        const response = await this.service['executeQuery']<{ tasks: Quest[] }>(QUERIES.allTasks);
        const quests = response.tasks || [];
        
        // Populate local cache
        quests.forEach((quest: Quest) => {
          this.questCache.set(quest.id, quest);
        });
        
        // Store in persistent storage
        await this.safeStorageOperation(() => 
          PersistentStorage.storeQuests([...quests])
        );
        
        return quests;
      },
      config
    );
  }

  /**
   * Get quests for a specific trader (filtered from complete dataset)
   */
  async getQuestsByTrader(traderId: string, config: CacheConfig = {}): Promise<Quest[]> {
    const allQuests = await this.getAllQuests(config);
    return allQuests.filter(quest => quest.trader.id === traderId);
  }

  /**
   * Get Kappa-required quests (filtered from complete dataset)
   */
  async getKappaRequiredQuests(config: CacheConfig = {}): Promise<Quest[]> {
    const allQuests = await this.getAllQuests(config);
    return allQuests.filter(quest => quest.kappaRequired === true);
  }

  /**
   * Get a specific quest by ID
   */
  async getQuestById(id: string): Promise<Quest | null> {
    if (this.questCache.has(id)) {
      return this.questCache.get(id)!;
    }
    
    // Load all quests to populate cache
    await this.getAllQuests();
    return this.questCache.get(id) || null;
  }

  /**
   * Get quest dependencies (prerequisite quests)
   * Uses cached quest data for efficient traversal
   */
  async getQuestDependencies(questId: string): Promise<Quest[]> {
    const quest = await this.getQuestById(questId);
    if (!quest) return [];

    const dependencies: Quest[] = [];
    
    for (const requirement of quest.taskRequirements) {
      const dependentQuest = await this.getQuestById(requirement.task.id);
      if (dependentQuest) {
        dependencies.push(dependentQuest);
        // Recursively get dependencies of dependencies
        const nestedDeps = await this.getQuestDependencies(dependentQuest.id);
        dependencies.push(...nestedDeps);
      }
    }
    
    // Remove duplicates
    return dependencies.filter((quest, index, self) => 
      index === self.findIndex(q => q.id === quest.id)
    );
  }

  /**
   * Get all hideout stations
   */
  async getAllHideoutStations(config: CacheConfig = {}): Promise<HideoutStation[]> {
    return this.service.fetchHideoutStations(config);
  }

  /**
   * Get a specific hideout station by ID
   */
  async getHideoutStationById(id: string): Promise<HideoutStation | null> {
    const stations = await this.getAllHideoutStations();
    return stations.find(station => station.id === id) || null;
  }

  /**
   * Get all items with player-specific filtering
   */
  async getAllItems(
    playerSettings?: {
      hideoutModuleLevels: Record<string, number>;
      completedQuestIds: string[];
    },
    config: CacheConfig = {}
  ): Promise<Item[]> {
    return this.service.fetchAllItems(playerSettings, config);
  }

  /**
   * Validate data consistency across different sources
   */
  async validateDataConsistency(): Promise<{
    valid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    try {
      // Check quest reference integrity
      const allQuests = await this.getAllQuests({ forceRefresh: true });
      const allTraders = await this.getAllTraders({ forceRefresh: true });
      
      const traderIds = new Set(allTraders.map(t => t.id));
      const questIds = new Set(allQuests.map(q => q.id));

      // Validate trader references in quests
      allQuests.forEach(quest => {
        if (!traderIds.has(quest.trader.id)) {
          issues.push(`Quest "${quest.name}" references unknown trader ID: ${quest.trader.id}`);
        }

        // Validate quest dependencies
        quest.taskRequirements.forEach(req => {
          if (!questIds.has(req.task.id)) {
            issues.push(`Quest "${quest.name}" has invalid dependency: ${req.task.id}`);
          }
        });

        // Check for circular dependencies (simplified check)
        if (quest.taskRequirements.some(req => req.task.id === quest.id)) {
          issues.push(`Quest "${quest.name}" has circular self-dependency`);
        }
      });

      // Performance suggestions
      const duplicateQueries = this.detectDuplicateQueries();
      if (duplicateQueries.length > 0) {
        suggestions.push('Consider batching these duplicate queries: ' + duplicateQueries.join(', '));
      }

      return {
        valid: issues.length === 0,
        issues,
        suggestions,
      };

    } catch (error) {
      issues.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, issues, suggestions };
    }
  }

  /**
   * Detect potentially duplicate or inefficient query patterns
   * @private
   */
  private detectDuplicateQueries(): string[] {
    // This would analyze the cache access patterns to identify
    // frequently requested data that could be batched
    const cacheStats = globalCache.getStats();
    const duplicates: string[] = [];
    
    // Simple heuristic: if we have many cache misses, suggest batching
    if (cacheStats.misses > cacheStats.hits * 0.3) {
      duplicates.push('High cache miss ratio suggests unbatched queries');
    }
    
    return duplicates;
  }

  /**
   * Safe storage operation with error handling
   * @private
   */
  private async safeStorageOperation<T>(operation: () => Promise<T>): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      console.warn('Storage operation failed:', error);
      return null;
    }
  }
}

/**
 * Mock repository for testing
 * Provides predictable data for unit tests
 */
export class MockTarkovRepository implements ITarkovRepository {
  private mockTraders: Trader[] = [];
  private mockQuests: Quest[] = [];
  private mockStations: HideoutStation[] = [];
  private mockItems: Item[] = [];

  constructor(mockData?: {
    traders?: Trader[];
    quests?: Quest[];
    stations?: HideoutStation[];
    items?: Item[];
  }) {
    this.mockTraders = mockData?.traders || [];
    this.mockQuests = mockData?.quests || [];
    this.mockStations = mockData?.stations || [];
    this.mockItems = mockData?.items || [];
  }

  async getAllTraders(): Promise<Trader[]> {
    return [...this.mockTraders];
  }

  async getTraderById(id: string): Promise<Trader | null> {
    return this.mockTraders.find(t => t.id === id) || null;
  }

  async getAllQuests(): Promise<Quest[]> {
    return [...this.mockQuests];
  }

  async getQuestsByTrader(traderId: string): Promise<Quest[]> {
    return this.mockQuests.filter(q => q.trader.id === traderId);
  }

  async getKappaRequiredQuests(): Promise<Quest[]> {
    return this.mockQuests.filter(q => q.kappaRequired === true);
  }

  async getQuestById(id: string): Promise<Quest | null> {
    return this.mockQuests.find(q => q.id === id) || null;
  }

  async getQuestDependencies(questId: string): Promise<Quest[]> {
    const quest = await this.getQuestById(questId);
    if (!quest) return [];
    
    return this.mockQuests.filter(q => 
      quest.taskRequirements.some(req => req.task.id === q.id)
    );
  }

  async getAllHideoutStations(): Promise<HideoutStation[]> {
    return [...this.mockStations];
  }

  async getHideoutStationById(id: string): Promise<HideoutStation | null> {
    return this.mockStations.find(s => s.id === id) || null;
  }

  async getAllItems(): Promise<Item[]> {
    return [...this.mockItems];
  }

  async validateDataConsistency(): Promise<{
    valid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    return { valid: true, issues: [], suggestions: [] };
  }
}

/**
 * Default repository instance
 */
export const defaultTarkovRepository = new TarkovRepository();