/**
 * @fileoverview Core API service for Escape from Tarkov data
 * Handles all external API communication with robust error handling and caching
 */

import { PersistentStorage } from './persistentStorage';
import { globalCache, CacheKeys, hashPlayerSettings } from './tarkovCache';
import {
  NetworkError,
  GraphQLApiError,
  ParseError,
  TimeoutError,
  ErrorUtils,
} from './tarkovErrors';
import type {
  Trader,
  Quest,
  HideoutStation,
  Item,
  TraderResponse,
  QuestsResponse,
  HideoutStationsResponse,
  GraphQLResponse,
  CacheConfig,
} from './tarkovTypes';

/**
 * Configuration for the Tarkov API service
 */
interface ServiceConfig {
  /** API endpoint URL */
  apiUrl: string;
  /** Default request timeout in milliseconds */
  timeout: number;
  /** Number of retry attempts for failed requests */
  retryAttempts: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay: number;
  /** Default cache TTL in milliseconds */
  cacheTtl: number;
}

/**
 * Default service configuration
 */
const DEFAULT_CONFIG: ServiceConfig = {
  apiUrl: 'https://api.tarkov.dev/graphql',
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  cacheTtl: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * Core service class for Tarkov API operations
 */
export class TarkovService {
  private readonly config: ServiceConfig;

  constructor(config: Partial<ServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Fetch all traders from the API with caching and error handling
   * @param cacheConfig - Cache configuration options
   * @returns Promise resolving to array of traders
   * @throws {NetworkError} When network request fails
   * @throws {GraphQLApiError} When GraphQL query returns errors
   * @throws {ParseError} When response cannot be parsed
   */
  async fetchTraders(cacheConfig: CacheConfig = {}): Promise<Trader[]> {
    const cacheKey = CacheKeys.traders();
    
    return globalCache.get(
      cacheKey,
      async () => {
        const query = `
          query GetTraders {
            traders(lang: en) {
              id
              name
              imageLink
            }
          }
        `;

        try {
          const response = await this.executeQuery<TraderResponse>(query);
          const traders = response.traders || [];
          
          // Store in persistent storage for offline access
          await this.safeStorageOperation(() => 
            PersistentStorage.storeTraders([...traders])
          );
          
          return [...traders];
        } catch (error) {
          // Attempt fallback to persistent storage
          const cachedTraders = await this.safeStorageOperation(() => 
            PersistentStorage.getTraders()
          );
          
          if (cachedTraders && cachedTraders.length > 0) {
            console.warn('Using cached traders due to API error:', error);
            return cachedTraders;
          }
          
          throw error;
        }
      },
      { ...cacheConfig, ttl: this.config.cacheTtl }
    );
  }

  /**
   * Fetch Kappa-required quests from the API with caching and error handling
   * @param cacheConfig - Cache configuration options
   * @returns Promise resolving to array of Kappa quests
   */
  async fetchKappaRequiredQuests(cacheConfig: CacheConfig = {}): Promise<Quest[]> {
    const cacheKey = CacheKeys.kappaQuests();
    
    return globalCache.get(
      cacheKey,
      async () => {
        const query = `
          query GetKappaQuests {
            tasks(lang: en) {
              id
              name
              normalizedName
              kappaRequired
              trader {
                id
                name
              }
              taskRequirements {
                task {
                  id
                  name
                }
              }
              objectives {
                id
                description
                type
                maps {
                  id
                  name
                }
              }
              experience
              minPlayerLevel
              traderLevelRequirements {
                trader {
                  id
                  name
                }
                level
              }
            }
          }
        `;

        try {
          const response = await this.executeQuery<QuestsResponse>(query);
          const allTasks = response.tasks || [];
          
          // Filter to only include kappa-required quests
          const kappaQuests = allTasks.filter((task: Quest) => task.kappaRequired === true);
          
          // Store in persistent storage
          await this.safeStorageOperation(() => 
            PersistentStorage.storeKappaQuests([...kappaQuests])
          );
          
          return kappaQuests;
        } catch (error) {
          // Attempt fallback to persistent storage
          const cachedQuests = await this.safeStorageOperation(() => 
            PersistentStorage.getKappaQuests()
          );
          
          if (cachedQuests && cachedQuests.length > 0) {
            console.warn('Using cached Kappa quests due to API error:', error);
            return cachedQuests;
          }
          
          throw error;
        }
      },
      { ...cacheConfig, ttl: this.config.cacheTtl }
    );
  }

  /**
   * Fetch quests for a specific trader with caching and error handling
   * @param traderId - The trader's unique identifier
   * @param cacheConfig - Cache configuration options
   * @returns Promise resolving to array of quests for the trader
   */
  async fetchQuestsByTrader(
    traderId: string,
    cacheConfig: CacheConfig = {}
  ): Promise<Quest[]> {
    const cacheKey = CacheKeys.quests(traderId);
    
    return globalCache.get(
      cacheKey,
      async () => {
        const query = `
          query GetQuestsByTrader {
            tasks(lang: en) {
              id
              name
              normalizedName
              kappaRequired
              trader {
                id
                name
              }
              taskRequirements {
                task {
                  id
                  name
                }
              }
              objectives {
                id
                description
                type
                maps {
                  id
                  name
                }
              }
              experience
              minPlayerLevel
              traderLevelRequirements {
                trader {
                  id
                  name
                }
                level
              }
            }
          }
        `;

        try {
          const response = await this.executeQuery<QuestsResponse>(query);
          const allTasks = response.tasks || [];
          
          // Filter tasks by trader
          const traderQuests = allTasks.filter((task: Quest) => task.trader.id === traderId);
          
          // Store all tasks in persistent storage for future use
          await this.safeStorageOperation(() => 
            PersistentStorage.storeQuests([...allTasks])
          );
          
          return traderQuests;
        } catch (error) {
          // Attempt fallback to persistent storage
          const cachedQuests = await this.safeStorageOperation(() => 
            PersistentStorage.getQuests()
          );
          
          if (cachedQuests && cachedQuests.length > 0) {
            const traderQuests = cachedQuests.filter(quest => quest.trader.id === traderId);
            console.warn('Using cached trader quests due to API error:', error);
            return traderQuests;
          }
          
          throw error;
        }
      },
      { ...cacheConfig, ttl: this.config.cacheTtl }
    );
  }

  /**
   * Fetch all hideout stations with their upgrade requirements
   * @param cacheConfig - Cache configuration options
   * @returns Promise resolving to array of hideout stations
   */
  async fetchHideoutStations(cacheConfig: CacheConfig = {}): Promise<HideoutStation[]> {
    const cacheKey = CacheKeys.hideoutStations();
    
    return globalCache.get(
      cacheKey,
      async () => {
        const query = `
          query GetHideoutStations {
            hideoutStations {
              id
              name
              imageLink
              levels {
                level
                constructionTime
                description
                itemRequirements {
                  item {
                    id
                    name
                    iconLink
                  }
                  count
                }
                stationLevelRequirements {
                  station {
                    id
                    name
                  }
                  level
                }
                traderRequirements {
                  trader {
                    id
                    name
                  }
                  level
                }
              }
            }
          }
        `;

        try {
          const response = await this.executeQuery<HideoutStationsResponse>(query);
          const stations = response.hideoutStations || [];
          
          // Store in persistent storage
          await this.safeStorageOperation(() => 
            PersistentStorage.storeHideoutStations([...stations])
          );
          
          return [...stations];
        } catch (error) {
          // Attempt fallback to persistent storage
          const cachedStations = await this.safeStorageOperation(() => 
            PersistentStorage.getHideoutStations()
          );
          
          if (cachedStations && cachedStations.length > 0) {
            console.warn('Using cached hideout stations due to API error:', error);
            return [...cachedStations];
          }
          
          throw error;
        }
      },
      { ...cacheConfig, ttl: this.config.cacheTtl }
    );
  }

  /**
   * Fetch all items needed for hideout and quest completion
   * @param playerSettings - Player progress settings to filter completed content
   * @param cacheConfig - Cache configuration options
   * @returns Promise resolving to array of items with usage information
   */
  async fetchAllItems(
    playerSettings?: {
      hideoutModuleLevels: Record<string, number>;
      completedQuestIds: string[];
    },
    cacheConfig: CacheConfig = {}
  ): Promise<Item[]> {
    const settingsHash = hashPlayerSettings(playerSettings);
    const cacheKey = CacheKeys.allItems(settingsHash);
    
    return globalCache.get(
      cacheKey,
      async () => {
        try {
          // Fetch required data in parallel
          const [hideoutStations, traders] = await Promise.all([
            this.fetchHideoutStations(cacheConfig),
            this.fetchTraders(cacheConfig),
          ]);
          
          // Use a map to combine items by their actual item ID
          const itemMap = new Map<string, Item>();
          
          // Get hideout items from station requirements
          this.processHideoutItems(hideoutStations, itemMap, playerSettings);
          
          // Get quest items from all traders
          await this.processQuestItems(traders, itemMap, playerSettings, cacheConfig);
          
          return Array.from(itemMap.values());
        } catch (error) {
          console.error('Error fetching all items:', error);
          throw ErrorUtils.normalize(error, 'Failed to fetch items');
        }
      },
      { ...cacheConfig, ttl: this.config.cacheTtl * 0.5 } // Shorter TTL for computed data
    );
  }

  /**
   * Execute a GraphQL query with retry logic and error handling
   * @param query - GraphQL query string
   * @returns Promise resolving to the query response data
   * @private
   */
  private async executeQuery<T>(query: string): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await this.makeRequest(query);
        
        if (!response.ok) {
          throw NetworkError.fromResponse(response);
        }

        const text = await response.text();
        let result: GraphQLResponse<T>;
        
        try {
          result = JSON.parse(text);
        } catch (parseError) {
          throw new ParseError('Invalid JSON response', text, parseError as Error);
        }
        
        if (result.errors && result.errors.length > 0) {
          throw new GraphQLApiError(result.errors);
        }

        if (!result.data) {
          throw new ParseError('No data in response', text);
        }

        return result.data;
        
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry certain types of errors
        if (
          error instanceof GraphQLApiError ||
          error instanceof ParseError ||
          (error instanceof NetworkError && error.statusCode && error.statusCode < 500)
        ) {
          throw error;
        }
        
        // Wait before retrying (except on last attempt)
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Make HTTP request with timeout
   * @param query - GraphQL query string
   * @returns Promise resolving to Response object
   * @private
   */
  private async makeRequest(query: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });
      
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(this.config.timeout, 'GraphQL request');
      }
      throw new NetworkError('Network request failed', undefined, undefined, error as Error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Process hideout items and add them to the item map
   * @private
   */
  private processHideoutItems(
    hideoutStations: HideoutStation[],
    itemMap: Map<string, Item>,
    playerSettings?: { hideoutModuleLevels: Record<string, number> }
  ): void {
    hideoutStations.forEach((station: HideoutStation) => {
      station.levels.forEach(level => {
        // Skip this level if player already has it or higher
        const currentStationLevel = playerSettings?.hideoutModuleLevels[station.id] || 0;
        if (currentStationLevel >= level.level) {
          return;
        }
        
        level.itemRequirements.forEach(itemReq => {
          const itemId = itemReq.item.id;
          const usage = {
            stationName: station.name,
            stationLevel: level.level,
            quantity: itemReq.count,
          };
          
          if (itemMap.has(itemId)) {
            const existingItem = itemMap.get(itemId)!;
            const newItem: Item = {
              ...existingItem,
              totalQuantity: existingItem.totalQuantity + itemReq.count,
              source: existingItem.source === 'quest' ? 'mixed' : existingItem.source,
              usages: [...existingItem.usages, usage],
            };
            itemMap.set(itemId, newItem);
          } else {
            itemMap.set(itemId, {
              id: itemId,
              name: itemReq.item.name,
              iconLink: itemReq.item.iconLink,
              totalQuantity: itemReq.count,
              foundInRaid: false,
              source: 'hideout',
              usages: [usage],
            });
          }
        });
      });
    });
  }

  /**
   * Process quest items and add them to the item map
   * @private
   */
  private async processQuestItems(
    traders: Trader[],
    itemMap: Map<string, Item>,
    playerSettings?: { completedQuestIds: string[] },
    cacheConfig?: CacheConfig
  ): Promise<void> {
    const questPromises = traders.map(async (trader: Trader) => {
      try {
        const quests = await this.fetchQuestsByTrader(trader.id, cacheConfig);
        return { trader, quests };
      } catch (err) {
        console.error(`Failed to fetch quests for ${trader.name}:`, err);
        return { trader, quests: [] };
      }
    });
    
    const traderQuests = await Promise.all(questPromises);
    
    traderQuests.forEach(({ trader, quests }) => {
      quests.forEach((quest: Quest) => {
        // Skip completed quests
        if (playerSettings?.completedQuestIds.includes(quest.id)) {
          return;
        }
        
        // Check if quest has item-related objectives
        quest.objectives.forEach(objective => {
          if (this.isItemObjective(objective)) {
            const questItemId = `quest-${quest.id}-${objective.id}`;
            const itemName = this.truncateName(objective.description, 50);
            const foundInRaid = this.isFoundInRaidObjective(objective);
            
            const usage = {
              questName: quest.name,
              traderName: trader.name,
              quantity: 1,
            };
            
            itemMap.set(questItemId, {
              id: questItemId,
              name: itemName,
              totalQuantity: 1,
              foundInRaid,
              source: 'quest',
              usages: [usage],
            });
          }
        });
      });
    });
  }

  /**
   * Check if objective is item-related
   * @private
   */
  private isItemObjective(objective: { type: string; description: string }): boolean {
    return (
      objective.type === 'findInRaid' ||
      objective.type === 'giveItem' ||
      objective.description.toLowerCase().includes('find') ||
      objective.description.toLowerCase().includes('hand over') ||
      objective.description.toLowerCase().includes('turn in')
    );
  }

  /**
   * Check if objective requires found-in-raid items
   * @private
   */
  private isFoundInRaidObjective(objective: { type: string; description: string }): boolean {
    return (
      objective.type === 'findInRaid' ||
      objective.description.toLowerCase().includes('found in raid')
    );
  }

  /**
   * Truncate name to specified length with ellipsis
   * @private
   */
  private truncateName(name: string, maxLength: number): string {
    return name.length > maxLength ? `${name.substring(0, maxLength - 3)}...` : name;
  }

  /**
   * Safely execute storage operation with error handling
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

  /**
   * Delay execution for specified milliseconds
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Default service instance with standard configuration
 */
export const defaultTarkovService = new TarkovService();