/**
 * @fileoverview TypeScript type definitions for Escape from Tarkov API data
 * Provides strict typing for all Tarkov-related data structures
 */

/**
 * Supported player factions in Escape from Tarkov
 */
export type PlayerFaction = 'USEC' | 'BEAR';

/**
 * Available game editions with their bonuses
 */
export type GameEdition = 'Standard' | 'Left Behind' | 'Prepare for Escape' | 'Edge of Darkness';

/**
 * Item sources that determine where items are needed
 */
export type ItemSource = 'hideout' | 'quest' | 'mixed';

/**
 * Quest filtering types for different quest states
 */
export type QuestFilterType = 'available' | 'locked' | 'completed';

/**
 * Hideout module filtering types for different upgrade states
 */
export type HideoutFilterType = 'available' | 'locked' | 'maxed';

/**
 * Trader information from the API
 */
export interface Trader {
  /** Unique identifier for the trader */
  readonly id: string;
  /** Display name of the trader */
  readonly name: string;
  /** Optional image URL for the trader's portrait */
  readonly imageLink?: string;
}

/**
 * API response wrapper for trader queries
 */
export interface TraderResponse {
  /** Array of all traders */
  readonly traders: readonly Trader[];
}

/**
 * Represents how and where an item is used
 */
export interface ItemUsage {
  /** Hideout station name if used for hideout construction */
  readonly stationName?: string;
  /** Required station level for hideout construction */
  readonly stationLevel?: number;
  /** Quest name if used for quest completion */
  readonly questName?: string;
  /** Trader name if the quest belongs to a specific trader */
  readonly traderName?: string;
  /** Quantity required for this specific usage */
  readonly quantity: number;
}

/**
 * Item information with aggregated usage data
 */
export interface Item {
  /** Unique identifier for the item */
  readonly id: string;
  /** Display name of the item */
  readonly name: string;
  /** Optional image URL for the item's icon */
  readonly iconLink?: string;
  /** Total quantity needed across all usages */
  readonly totalQuantity: number;
  /** Whether the item must be found in raid */
  readonly foundInRaid: boolean;
  /** Where this item is primarily used */
  readonly source: ItemSource;
  /** All specific usages of this item */
  readonly usages: readonly ItemUsage[];
}

/**
 * Map information for quest objectives
 */
export interface QuestMap {
  /** Unique identifier for the map */
  readonly id: string;
  /** Display name of the map */
  readonly name: string;
}

/**
 * Quest objective information
 */
export interface QuestObjective {
  /** Unique identifier for the objective */
  readonly id: string;
  /** Description of what needs to be accomplished */
  readonly description: string;
  /** Type of objective (e.g., 'findInRaid', 'giveItem', 'elimination') */
  readonly type: string;
  /** Maps where this objective can be completed (if applicable) */
  readonly maps?: readonly QuestMap[];
}

/**
 * Nested trader information within quest requirements
 */
export interface QuestTrader {
  /** Unique identifier for the trader */
  readonly id: string;
  /** Display name of the trader */
  readonly name: string;
}

/**
 * Task requirement information for quest prerequisites
 */
export interface TaskRequirement {
  /** The prerequisite task information */
  readonly task: {
    readonly id: string;
    readonly name: string;
  };
}

/**
 * Trader level requirement for quest availability
 */
export interface TraderLevelRequirement {
  /** The trader that must be leveled */
  readonly trader: QuestTrader;
  /** Required loyalty level with the trader */
  readonly level: number;
}

/**
 * Complete quest information from the API
 */
export interface Quest {
  /** Unique identifier for the quest */
  readonly id: string;
  /** Display name of the quest */
  readonly name: string;
  /** URL-friendly name version */
  readonly normalizedName?: string;
  /** Whether this quest is required for Kappa container */
  readonly kappaRequired?: boolean;
  /** Trader who provides this quest */
  readonly trader: QuestTrader;
  /** Other quests that must be completed first */
  readonly taskRequirements: readonly TaskRequirement[];
  /** List of objectives to complete */
  readonly objectives: readonly QuestObjective[];
  /** Experience points awarded for completion */
  readonly experience: number;
  /** Trader loyalty level requirements */
  readonly traderLevelRequirements: readonly TraderLevelRequirement[];
  /** Minimum player level required */
  readonly minPlayerLevel?: number;
  /** Faction requirement (if any) */
  readonly factionName?: string;
}

/**
 * API response wrapper for quest queries
 */
export interface QuestsResponse {
  /** Array of quest tasks */
  readonly tasks: readonly Quest[];
}

/**
 * Item requirement for hideout station upgrades
 */
export interface HideoutItemRequirement {
  /** The required item information */
  readonly item: {
    readonly id: string;
    readonly name: string;
    readonly iconLink?: string;
  };
  /** Quantity needed */
  readonly count: number;
}

/**
 * Station-to-station dependency for hideout upgrades
 */
export interface HideoutStationRequirement {
  /** The required station */
  readonly station: {
    readonly id: string;
    readonly name: string;
  };
  /** Required level of the station */
  readonly level: number;
}

/**
 * Trader level requirement for hideout upgrades
 */
export interface HideoutTraderRequirement {
  /** The trader that must be leveled */
  readonly trader: {
    readonly id: string;
    readonly name: string;
  };
  /** Required loyalty level */
  readonly level: number;
}

/**
 * Individual level information for a hideout station
 */
export interface HideoutStationLevel {
  /** The level number */
  readonly level: number;
  /** Time required to construct this level (in seconds) */
  readonly constructionTime: number;
  /** Optional description of what this level provides */
  readonly description?: string;
  /** Items required for construction */
  readonly itemRequirements: readonly HideoutItemRequirement[];
  /** Other station levels required */
  readonly stationLevelRequirements: readonly HideoutStationRequirement[];
  /** Trader levels required */
  readonly traderRequirements: readonly HideoutTraderRequirement[];
}

/**
 * Complete hideout station information
 */
export interface HideoutStation {
  /** Unique identifier for the station */
  readonly id: string;
  /** Display name of the station */
  readonly name: string;
  /** Optional image URL for the station */
  readonly imageLink?: string;
  /** All available levels for this station */
  readonly levels: readonly HideoutStationLevel[];
}

/**
 * API response wrapper for hideout station queries
 */
export interface HideoutStationsResponse {
  /** Array of all hideout stations */
  readonly hideoutStations: readonly HideoutStation[];
}

/**
 * Player configuration and progress data
 */
export interface PlayerSettings {
  /** Current player level */
  readonly level: number;
  /** Chosen faction */
  readonly faction: PlayerFaction;
  /** Player's in-game name */
  readonly playerName: string;
  /** Array of completed quest IDs */
  readonly completedQuestIds: readonly string[];
  /** Current trader loyalty levels (traderId -> level) */
  readonly traderLevels: Readonly<Record<string, number>>;
  /** Purchased game edition */
  readonly gameEdition: GameEdition;
}

/**
 * Extended player settings including hideout progress
 */
export interface ExtendedPlayerSettings extends PlayerSettings {
  /** Current hideout module levels (stationId -> level) */
  readonly hideoutModuleLevels: Readonly<Record<string, number>>;
}

/**
 * Partial extended player settings for flexible usage
 */
export interface PartialExtendedPlayerSettings {
  /** Player level */
  readonly level?: number;
  /** Chosen faction */
  readonly faction?: PlayerFaction;
  /** Player's in-game name */
  readonly playerName?: string;
  /** Array of completed quest IDs */
  readonly completedQuestIds?: readonly string[];
  /** Current trader loyalty levels (traderId -> level) */
  readonly traderLevels?: Readonly<Record<string, number>>;
  /** Purchased game edition */
  readonly gameEdition?: GameEdition;
  /** Current hideout module levels (stationId -> level) */
  readonly hideoutModuleLevels?: Readonly<Record<string, number>>;
}

/**
 * Missing requirement information for upgrades
 */
export interface MissingRequirement {
  /** Type of requirement that's missing */
  readonly type: 'station' | 'trader';
  /** Name of the station or trader */
  readonly name: string;
  /** Required level */
  readonly required: number;
  /** Current level */
  readonly current: number;
}

/**
 * GraphQL error structure from API responses
 */
export interface GraphQLError {
  /** Error message */
  readonly message: string;
  /** Array of error locations in the query */
  readonly locations?: readonly {
    readonly line: number;
    readonly column: number;
  }[];
  /** Error path */
  readonly path?: readonly (string | number)[];
  /** Additional error extensions */
  readonly extensions?: Readonly<Record<string, unknown>>;
}

/**
 * Standard GraphQL response structure
 */
export interface GraphQLResponse<T = unknown> {
  /** Response data */
  readonly data?: T;
  /** Array of errors (if any) */
  readonly errors?: readonly GraphQLError[];
}

/**
 * Configuration for API caching behavior
 */
export interface CacheConfig {
  /** Whether to force refresh from API */
  readonly forceRefresh?: boolean;
  /** TTL for cached data in milliseconds */
  readonly ttl?: number;
}

/**
 * Game edition bonuses for trader reputation
 */
export type EditionBonuses = Readonly<Record<GameEdition, Readonly<Record<string, number>>>>;

/**
 * Game edition bonuses for hideout starting levels
 */
export type HideoutEditionBonuses = Readonly<Record<GameEdition, Readonly<Record<string, number>>>>;

/**
 * Quest faction requirements mapping
 */
export type QuestFactionRequirements = Readonly<Record<string, PlayerFaction>>;