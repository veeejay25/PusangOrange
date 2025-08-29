/**
 * @fileoverview Barrel exports for Tarkov API modules
 * Provides optimized imports and prevents circular dependencies
 */

// =============================================================================
// TYPE-ONLY EXPORTS (for better tree shaking)
// =============================================================================

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
  EditionBonuses,
  HideoutEditionBonuses,
  QuestFactionRequirements,
} from './tarkovTypes';

export type {
  // Cache types
  CacheStats,
  AdvancedCacheConfig,
} from './tarkovCache';

export type {
  // Validation types
  ValidationResult,
} from './tarkovValidation';

// =============================================================================
// SERVICE EXPORTS (core functionality)
// =============================================================================

// Repository pattern (recommended for new code)
export {
  TarkovRepository,
  MockTarkovRepository,
  defaultTarkovRepository,
} from './tarkovRepository';

// Core service
export {
  TarkovService,
  defaultTarkovService,
} from './tarkovService';

// Storage utilities
export {
  PersistentStorage,
} from './persistentStorage';

export {
  QuestCacheManager,
} from './questCache';

export {
  UserCache,
} from './cacheStorage';

// =============================================================================
// UTILITY EXPORTS (helpers and tools)
// =============================================================================

// Business logic helpers
export {
  QuestHelpers,
  HideoutHelpers,
  TraderHelpers,
  DataHelpers,
  LegacyHelpers,
} from './tarkovHelpers';

// Validation and type safety
export {
  TypeGuards,
  DataValidation,
  SafeAccess,
  DataNormalization,
  Assertions,
} from './tarkovValidation';

// Error handling
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

// =============================================================================
// PERFORMANCE EXPORTS (caching and resilience)
// =============================================================================

// Caching
export {
  TarkovCache,
  globalCache,
  CacheKeys,
  hashPlayerSettings,
} from './tarkovCache';

// Resilience and reliability
export {
  CircuitBreaker,
  RetryStrategy,
  ResilienceManager,
  globalResilienceManager,
  withResilience,
  HealthCheck,
} from './tarkovResilience';

// =============================================================================
// DEVELOPMENT EXPORTS (queries and testing)
// =============================================================================

// GraphQL queries (for advanced usage)
export {
  FRAGMENTS,
  QUERIES,
  QueryBuilder,
  QueryUtils,
} from './tarkovQueries';

// Testing utilities (conditional export for non-production)
export {
  MockDataGenerators,
  TestScenarios,
  MockApiResponses,
  TestUtils,
  IntegrationTestHelpers,
} from './tarkovTesting';

// =============================================================================
// LEGACY/COMPATIBILITY EXPORTS
// =============================================================================

// Backward compatibility layer (use for existing code)
// Only export the functions, not the types (to avoid duplicate exports)
export {
  fetchTraders,
  fetchKappaRequiredQuests,
  fetchQuestsByTrader,
  fetchHideoutStations,
  fetchAllItems,
  filterQuestsByType,
  filterHideoutModulesByType,
  getEffectiveHideoutLevel,
  canUpgradeHideoutStation,
  getMissingHideoutRequirements,
  filterAvailableQuests,
} from './tarkovApi';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

export {
  GAME_EDITION_BONUSES,
  HIDEOUT_EDITION_BONUSES,
  QUEST_FACTION_REQUIREMENTS,
} from './tarkovHelpers';

// =============================================================================
// RECOMMENDED IMPORT PATTERNS
// =============================================================================

/**
 * RECOMMENDED IMPORTS FOR DIFFERENT USE CASES:
 * 
 * 1. NEW COMPONENTS (use repository pattern):
 * ```typescript
 * import { defaultTarkovRepository, type Trader, type Quest } from '@/services';
 * ```
 * 
 * 2. EXISTING COMPONENTS (backward compatibility):
 * ```typescript
 * import { fetchTraders, fetchQuests, type Trader } from '@/services/tarkovApi';
 * ```
 * 
 * 3. BUSINESS LOGIC (use helpers):
 * ```typescript
 * import { QuestHelpers, HideoutHelpers, type PlayerSettings } from '@/services';
 * ```
 * 
 * 4. ERROR HANDLING:
 * ```typescript
 * import { ErrorUtils, NetworkError, type TarkovApiError } from '@/services';
 * ```
 * 
 * 5. TESTING:
 * ```typescript
 * import { MockDataGenerators, TestScenarios, MockTarkovRepository } from '@/services';
 * ```
 * 
 * 6. VALIDATION:
 * ```typescript
 * import { TypeGuards, DataValidation, SafeAccess } from '@/services';
 * ```
 */