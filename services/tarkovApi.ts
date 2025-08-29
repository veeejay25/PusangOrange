/**
 * @fileoverview Main Tarkov API module - Backward compatibility layer
 * 
 * This file maintains backward compatibility with existing imports while using
 * the new refactored modules internally. All functions now use improved error
 * handling, caching, and TypeScript strict typing.
 * 
 * @deprecated Individual function imports are deprecated. Consider using the new
 * modules directly:
 * - Import types from './tarkovTypes'
 * - Import service functions from './tarkovService'
 * - Import helper functions from './tarkovHelpers'
 * - Import error classes from './tarkovErrors'
 * - Import cache utilities from './tarkovCache'
 * 
 * For migration assistance, see the migration guide in the README.
 */

// Import the new service and helper modules
import { defaultTarkovService } from './tarkovService';
import { QuestHelpers, HideoutHelpers, LegacyHelpers } from './tarkovHelpers';
import type { 
  Quest, 
  Trader, 
  HideoutStation, 
  Item, 
  PlayerSettings, 
  PartialExtendedPlayerSettings, 
  QuestFilterType, 
  HideoutFilterType 
} from './tarkovTypes';

// Re-export all types for backward compatibility
export type {
  // Core entity types
  Trader,
  Quest,
  HideoutStation,
  Item,
  
  // Nested types
  ItemUsage,
  QuestObjective,
  QuestTrader,
  TaskRequirement,
  TraderLevelRequirement,
  HideoutStationLevel,
  HideoutItemRequirement,
  HideoutStationRequirement,
  HideoutTraderRequirement,
  
  // Response types
  TraderResponse,
  QuestsResponse,
  HideoutStationsResponse,
  
  // Configuration types
  PlayerSettings,
  ExtendedPlayerSettings,
  PartialExtendedPlayerSettings,
  CacheConfig,
  MissingRequirement,
  
  // Enum types
  PlayerFaction,
  GameEdition,
  ItemSource,
  QuestFilterType,
  HideoutFilterType,
  
  // Utility types
  GraphQLError,
  GraphQLResponse,
} from './tarkovTypes';

// Re-export error classes
export {
  TarkovApiError,
  NetworkError,
  GraphQLApiError,
  ParseError,
  StorageError,
  DataNotFoundError,
  TimeoutError,
  RateLimitError,
  ErrorUtils,
} from './tarkovErrors';

/**
 * Convert partial settings to full extended settings with defaults
 * @private
 */
const normalizePlayerSettings = (
  partialSettings: PartialExtendedPlayerSettings
): import('./tarkovTypes').ExtendedPlayerSettings => {
  return {
    level: partialSettings.level || 1,
    faction: partialSettings.faction || 'USEC',
    playerName: partialSettings.playerName || 'Player',
    completedQuestIds: partialSettings.completedQuestIds || [],
    traderLevels: partialSettings.traderLevels || {},
    gameEdition: partialSettings.gameEdition || 'Standard',
    hideoutModuleLevels: partialSettings.hideoutModuleLevels || {},
  };
};

// Backward-compatible API functions

/**
 * Fetch all traders from the API with caching and error handling
 * @param forceRefresh - Whether to bypass cache and fetch fresh data
 * @returns Promise resolving to array of traders
 * @throws {NetworkError} When network request fails
 * @throws {GraphQLApiError} When GraphQL query returns errors
 * 
 * @example
 * ```typescript
 * const traders = await fetchTraders();
 * const freshTraders = await fetchTraders(true); // Force refresh
 * ```
 */
export const fetchTraders = async (forceRefresh = false): Promise<Trader[]> => {
  return defaultTarkovService.fetchTraders({ forceRefresh });
};

/**
 * Fetch Kappa-required quests from the API with caching and error handling
 * @param forceRefresh - Whether to bypass cache and fetch fresh data
 * @returns Promise resolving to array of Kappa quests
 * 
 * @example
 * ```typescript
 * const kappaQuests = await fetchKappaRequiredQuests();
 * ```
 */
export const fetchKappaRequiredQuests = async (forceRefresh = false): Promise<Quest[]> => {
  return defaultTarkovService.fetchKappaRequiredQuests({ forceRefresh });
};

/**
 * Fetch quests for a specific trader with caching and error handling
 * @param traderId - The trader's unique identifier
 * @param forceRefresh - Whether to bypass cache and fetch fresh data
 * @returns Promise resolving to array of quests for the trader
 * 
 * @example
 * ```typescript
 * const praporQuests = await fetchQuestsByTrader('prapor-id');
 * ```
 */
export const fetchQuestsByTrader = async (traderId: string, forceRefresh = false): Promise<Quest[]> => {
  return defaultTarkovService.fetchQuestsByTrader(traderId, { forceRefresh });
};

/**
 * Fetch all hideout stations with their upgrade requirements
 * @param forceRefresh - Whether to bypass cache and fetch fresh data
 * @returns Promise resolving to array of hideout stations
 * 
 * @example
 * ```typescript
 * const stations = await fetchHideoutStations();
 * ```
 */
export const fetchHideoutStations = async (forceRefresh = false): Promise<HideoutStation[]> => {
  return defaultTarkovService.fetchHideoutStations({ forceRefresh });
};

/**
 * Fetch all items needed for hideout and quest completion
 * @param playerSettings - Player progress settings to filter completed content
 * @returns Promise resolving to array of items with usage information
 * 
 * @example
 * ```typescript
 * const allItems = await fetchAllItems({
 *   hideoutModuleLevels: { 'station1': 2, 'station2': 1 },
 *   completedQuestIds: ['quest1', 'quest2']
 * });
 * ```
 */
export const fetchAllItems = async (
  playerSettings?: {
    hideoutModuleLevels: Record<string, number>;
    completedQuestIds: string[];
  }
): Promise<Item[]> => {
  return defaultTarkovService.fetchAllItems(playerSettings);
};

/**
 * Filter quests by their availability status based on player progress
 * @param quests - Array of quests to filter
 * @param type - Type of filter to apply ('available', 'locked', 'completed')
 * @param playerSettings - Player progress and configuration
 * @returns Filtered array of quests
 * 
 * @example
 * ```typescript
 * const availableQuests = filterQuestsByType(
 *   allQuests,
 *   'available',
 *   { level: 15, faction: 'USEC', completedQuestIds: ['quest1'], ... }
 * );
 * ```
 */
export const filterQuestsByType = (
  quests: Quest[],
  type: QuestFilterType,
  playerSettings: PlayerSettings
): Quest[] => {
  return QuestHelpers.filterByType(quests, type, playerSettings);
};

/**
 * Filter hideout stations by their upgrade availability status
 * @param stations - Array of hideout stations to filter
 * @param type - Type of filter to apply ('available', 'locked', 'maxed')
 * @param playerSettings - Extended player settings with hideout and trader levels
 * @returns Filtered array of hideout stations
 * 
 * @example
 * ```typescript
 * const upgradeableStations = filterHideoutModulesByType(
 *   allStations,
 *   'available',
 *   { hideoutModuleLevels: { 'station1': 2 }, traderLevels: { 'trader1': 3 }, ... }
 * );
 * ```
 */
export const filterHideoutModulesByType = (
  stations: HideoutStation[],
  type: HideoutFilterType,
  playerSettings: PartialExtendedPlayerSettings
): HideoutStation[] => {
  return HideoutHelpers.filterByType(stations, type, normalizePlayerSettings(playerSettings));
};

/**
 * Calculate effective hideout module level including game edition bonuses
 * @param stationId - The hideout station's unique identifier
 * @param stationName - The hideout station's display name
 * @param playerSettings - Extended player settings with hideout levels and game edition
 * @returns Effective module level (base level + edition bonus)
 * 
 * @example
 * ```typescript
 * const effectiveLevel = getEffectiveHideoutLevel(
 *   'stash-id',
 *   'Stash',
 *   { hideoutModuleLevels: { 'stash-id': 2 }, gameEdition: 'Edge of Darkness', ... }
 * );
 * // Returns: 4 (Edge of Darkness starts with Stash level 4)
 * ```
 */
export const getEffectiveHideoutLevel = (
  stationId: string,
  stationName: string,
  playerSettings: PartialExtendedPlayerSettings
): number => {
  return HideoutHelpers.getEffectiveLevel(stationId, stationName, normalizePlayerSettings(playerSettings));
};

/**
 * Check if a hideout station can be upgraded to the next level
 * @param station - The hideout station to check
 * @param currentLevel - Current level of the station (actual, not effective)
 * @param playerSettings - Extended player settings
 * @returns True if the station can be upgraded
 * 
 * @example
 * ```typescript
 * const canUpgrade = canUpgradeHideoutStation(
 *   station,
 *   2,
 *   { hideoutModuleLevels: {}, traderLevels: { 'trader1': 3 }, ... }
 * );
 * ```
 */
export const canUpgradeHideoutStation = (
  station: HideoutStation,
  currentLevel: number,
  playerSettings: PartialExtendedPlayerSettings
): boolean => {
  return HideoutHelpers.canUpgradeToNextLevel(station, currentLevel, normalizePlayerSettings(playerSettings));
};

/**
 * Get missing requirements for upgrading a hideout station
 * @param station - The hideout station to check
 * @param currentLevel - Current level of the station
 * @param playerSettings - Extended player settings
 * @returns Array of missing requirements with details
 * 
 * @example
 * ```typescript
 * const missing = getMissingHideoutRequirements(station, 2, playerSettings);
 * // Returns: [{ type: 'trader', name: 'Therapist', required: 3, current: 2 }]
 * ```
 */
export const getMissingHideoutRequirements = (
  station: HideoutStation,
  currentLevel: number,
  playerSettings: PartialExtendedPlayerSettings
): { type: 'station' | 'trader'; name: string; required: number; current: number }[] => {
  return HideoutHelpers.getMissingRequirements(station, currentLevel, normalizePlayerSettings(playerSettings));
};


/**
 * Legacy function for filtering available quests
 * @deprecated Use filterQuestsByType(quests, 'available', playerSettings) instead
 * @param quests - Array of quests to filter
 * @param completedQuestIds - Array of completed quest IDs
 * @returns Filtered array of available quests using default settings
 * 
 * @example
 * ```typescript
 * // Deprecated usage
 * const available = filterAvailableQuests(quests, ['quest1', 'quest2']);
 * 
 * // Preferred usage
 * const available = filterQuestsByType(quests, 'available', {
 *   level: playerLevel,
 *   faction: playerFaction,
 *   completedQuestIds: ['quest1', 'quest2'],
 *   // ... other settings
 * });
 * ```
 */
export const filterAvailableQuests = (quests: Quest[], completedQuestIds: string[] = []): Quest[] => {
  return LegacyHelpers.filterAvailableQuests(quests, completedQuestIds);
};

// Legacy warning for users importing the old way
if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
  const hasShownWarning = (globalThis as any).__TARKOV_API_MIGRATION_WARNING_SHOWN;
  if (!hasShownWarning) {
    console.warn(
      '[DEPRECATION WARNING] Importing from tarkovApi.ts is deprecated. ' +
      'Consider migrating to the new modular structure:\n' +
      '• Import types from \'./tarkovTypes\'\n' +
      '• Import service functions from \'./tarkovService\'\n' +
      '• Import helper functions from \'./tarkovHelpers\'\n' +
      'See the migration guide for details.'
    );
    (globalThis as any).__TARKOV_API_MIGRATION_WARNING_SHOWN = true;
  }
}