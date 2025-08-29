/**
 * @fileoverview Type validation and safety utilities for Tarkov API data
 * Eliminates optional chaining by providing robust validation and type guards
 */

import type {
  Trader,
  Quest,
  HideoutStation,
  Item,
  PlayerSettings,
  ExtendedPlayerSettings,
  QuestObjective,
  HideoutStationLevel,
} from './tarkovTypes';

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  valid: boolean;
  data: T | null;
  errors: string[];
  warnings: string[];
}

/**
 * Type guards for runtime type checking
 */
export const TypeGuards = {
  /**
   * Check if object is a valid Trader
   */
  isTrader(obj: unknown): obj is Trader {
    if (!obj || typeof obj !== 'object') return false;
    const trader = obj as any;
    return (
      typeof trader.id === 'string' && trader.id.length > 0 &&
      typeof trader.name === 'string' && trader.name.length > 0 &&
      (trader.imageLink === undefined || typeof trader.imageLink === 'string')
    );
  },

  /**
   * Check if object is a valid Quest
   */
  isQuest(obj: unknown): obj is Quest {
    if (!obj || typeof obj !== 'object') return false;
    const quest = obj as any;
    
    return (
      typeof quest.id === 'string' && quest.id.length > 0 &&
      typeof quest.name === 'string' && quest.name.length > 0 &&
      typeof quest.experience === 'number' &&
      this.isTrader(quest.trader) &&
      Array.isArray(quest.taskRequirements) &&
      Array.isArray(quest.objectives) &&
      quest.objectives.every((obj: unknown) => this.isQuestObjective(obj)) &&
      Array.isArray(quest.traderLevelRequirements)
    );
  },

  /**
   * Check if object is a valid QuestObjective
   */
  isQuestObjective(obj: unknown): obj is QuestObjective {
    if (!obj || typeof obj !== 'object') return false;
    const objective = obj as any;
    
    return (
      typeof objective.id === 'string' && objective.id.length > 0 &&
      typeof objective.description === 'string' && objective.description.length > 0 &&
      typeof objective.type === 'string' && objective.type.length > 0 &&
      (objective.maps === undefined || Array.isArray(objective.maps))
    );
  },

  /**
   * Check if object is a valid HideoutStation
   */
  isHideoutStation(obj: unknown): obj is HideoutStation {
    if (!obj || typeof obj !== 'object') return false;
    const station = obj as any;
    
    return (
      typeof station.id === 'string' && station.id.length > 0 &&
      typeof station.name === 'string' && station.name.length > 0 &&
      Array.isArray(station.levels) &&
      station.levels.every((level: unknown) => this.isHideoutStationLevel(level))
    );
  },

  /**
   * Check if object is a valid HideoutStationLevel
   */
  isHideoutStationLevel(obj: unknown): obj is HideoutStationLevel {
    if (!obj || typeof obj !== 'object') return false;
    const level = obj as any;
    
    return (
      typeof level.level === 'number' && level.level >= 0 &&
      typeof level.constructionTime === 'number' && level.constructionTime >= 0 &&
      Array.isArray(level.itemRequirements) &&
      Array.isArray(level.stationLevelRequirements) &&
      Array.isArray(level.traderRequirements)
    );
  },

  /**
   * Check if object is a valid PlayerSettings
   */
  isPlayerSettings(obj: unknown): obj is PlayerSettings {
    if (!obj || typeof obj !== 'object') return false;
    const settings = obj as any;
    
    return (
      typeof settings.level === 'number' && settings.level > 0 && settings.level <= 100 &&
      (settings.faction === 'USEC' || settings.faction === 'BEAR') &&
      typeof settings.playerName === 'string' && settings.playerName.length > 0 &&
      Array.isArray(settings.completedQuestIds) &&
      typeof settings.traderLevels === 'object' &&
      ['Standard', 'Left Behind', 'Prepare for Escape', 'Edge of Darkness'].includes(settings.gameEdition)
    );
  },

  /**
   * Check if object is a valid ExtendedPlayerSettings
   */
  isExtendedPlayerSettings(obj: unknown): obj is ExtendedPlayerSettings {
    if (!this.isPlayerSettings(obj)) return false;
    const extended = obj as any;
    return typeof extended.hideoutModuleLevels === 'object';
  },
} as const;

/**
 * Data validation utilities
 */
export const DataValidation = {
  /**
   * Validate and sanitize trader data
   */
  validateTrader(data: unknown): ValidationResult<Trader> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!TypeGuards.isTrader(data)) {
      errors.push('Invalid trader structure');
      return { valid: false, data: null, errors, warnings };
    }

    const trader = data;

    // Additional validation
    if (trader.id.length < 3) {
      warnings.push('Trader ID is unusually short');
    }

    if (!trader.imageLink) {
      warnings.push('Trader image link is missing');
    } else if (!trader.imageLink.startsWith('http')) {
      warnings.push('Trader image link appears to be invalid URL');
    }

    return {
      valid: true,
      data: trader,
      errors,
      warnings,
    };
  },

  /**
   * Validate and sanitize quest data
   */
  validateQuest(data: unknown): ValidationResult<Quest> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!TypeGuards.isQuest(data)) {
      errors.push('Invalid quest structure');
      return { valid: false, data: null, errors, warnings };
    }

    const quest = data;

    // Validate quest relationships
    if (quest.taskRequirements.some(req => req.task.id === quest.id)) {
      errors.push('Quest has circular dependency (references itself)');
    }

    if (quest.experience < 0) {
      errors.push('Quest experience cannot be negative');
    }

    if (quest.objectives.length === 0) {
      warnings.push('Quest has no objectives');
    }

    // Validate level requirements
    if (quest.minPlayerLevel && (quest.minPlayerLevel < 1 || quest.minPlayerLevel > 100)) {
      errors.push('Invalid minimum player level requirement');
    }

    return {
      valid: errors.length === 0,
      data: quest,
      errors,
      warnings,
    };
  },

  /**
   * Validate hideout station data
   */
  validateHideoutStation(data: unknown): ValidationResult<HideoutStation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!TypeGuards.isHideoutStation(data)) {
      errors.push('Invalid hideout station structure');
      return { valid: false, data: null, errors, warnings };
    }

    const station = data;

    // Validate level progression
    const levels = [...station.levels].sort((a, b) => a.level - b.level);
    for (let i = 0; i < levels.length - 1; i++) {
      if (levels[i].level + 1 !== levels[i + 1].level) {
        warnings.push(`Missing level ${levels[i].level + 1} in station progression`);
      }
    }

    // Check for invalid level numbers
    if (levels.some(level => level.level < 1)) {
      errors.push('Station levels must be positive numbers');
    }

    return {
      valid: errors.length === 0,
      data: station,
      errors,
      warnings,
    };
  },

  /**
   * Validate player settings with comprehensive checks
   */
  validatePlayerSettings(data: unknown): ValidationResult<PlayerSettings> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!TypeGuards.isPlayerSettings(data)) {
      errors.push('Invalid player settings structure');
      return { valid: false, data: null, errors, warnings };
    }

    const settings = data;

    // Validate trader levels
    Object.entries(settings.traderLevels).forEach(([traderId, level]) => {
      if (typeof level !== 'number' || level < 1 || level > 4) {
        errors.push(`Invalid trader level for ${traderId}: ${level}`);
      }
    });

    // Validate quest IDs format
    if (settings.completedQuestIds.some(id => typeof id !== 'string' || id.length === 0)) {
      errors.push('Completed quest IDs must be non-empty strings');
    }

    // Check for reasonable player name
    if (settings.playerName.length > 50) {
      warnings.push('Player name is unusually long');
    }

    return {
      valid: errors.length === 0,
      data: settings,
      errors,
      warnings,
    };
  },
} as const;

/**
 * Safe data access utilities that replace optional chaining
 */
export const SafeAccess = {
  /**
   * Safely get trader name with fallback
   */
  getTraderName(trader: unknown, fallback = 'Unknown Trader'): string {
    return TypeGuards.isTrader(trader) ? trader.name : fallback;
  },

  /**
   * Safely get quest experience with validation
   */
  getQuestExperience(quest: unknown, fallback = 0): number {
    if (!TypeGuards.isQuest(quest)) return fallback;
    return quest.experience >= 0 ? quest.experience : fallback;
  },

  /**
   * Safely get hideout station level count
   */
  getStationMaxLevel(station: unknown): number {
    if (!TypeGuards.isHideoutStation(station)) return 0;
    return Math.max(...station.levels.map(level => level.level));
  },

  /**
   * Safely get trader level from player settings
   */
  getTraderLevel(settings: unknown, traderId: string, fallback = 1): number {
    if (!TypeGuards.isPlayerSettings(settings)) return fallback;
    const level = settings.traderLevels[traderId];
    return typeof level === 'number' && level >= 1 && level <= 4 ? level : fallback;
  },

  /**
   * Safely check if quest is completed
   */
  isQuestCompleted(settings: unknown, questId: string): boolean {
    if (!TypeGuards.isPlayerSettings(settings)) return false;
    return settings.completedQuestIds.includes(questId);
  },

  /**
   * Safely get hideout module level
   */
  getHideoutModuleLevel(settings: unknown, stationId: string, fallback = 0): number {
    if (!TypeGuards.isExtendedPlayerSettings(settings)) return fallback;
    const level = settings.hideoutModuleLevels[stationId];
    return typeof level === 'number' && level >= 0 ? level : fallback;
  },
} as const;

/**
 * Data normalization utilities
 * Convert potentially unsafe data into safe, validated structures
 */
export const DataNormalization = {
  /**
   * Normalize API response data
   */
  normalizeApiResponse<T>(
    data: unknown,
    validator: (data: unknown) => ValidationResult<T>
  ): { items: T[]; errors: string[]; warnings: string[] } {
    const items: T[] = [];
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    if (!Array.isArray(data)) {
      allErrors.push('Expected array but received ' + typeof data);
      return { items, errors: allErrors, warnings: allWarnings };
    }

    data.forEach((item, index) => {
      const result = validator(item);
      if (result.valid && result.data) {
        items.push(result.data);
      } else {
        allErrors.push(`Item ${index}: ${result.errors.join(', ')}`);
      }
      allWarnings.push(...result.warnings);
    });

    return { items, errors: allErrors, warnings: allWarnings };
  },

  /**
   * Create safe player settings with defaults
   */
  createSafePlayerSettings(partial: Partial<PlayerSettings>): PlayerSettings {
    return {
      level: Math.max(1, Math.min(100, partial.level || 1)),
      faction: partial.faction === 'BEAR' ? 'BEAR' : 'USEC',
      playerName: typeof partial.playerName === 'string' && partial.playerName.length > 0 
        ? partial.playerName.substring(0, 50) 
        : 'Player',
      completedQuestIds: Array.isArray(partial.completedQuestIds) 
        ? partial.completedQuestIds.filter(id => typeof id === 'string' && id.length > 0)
        : [],
      traderLevels: this.sanitizeTraderLevels(partial.traderLevels || {}),
      gameEdition: ['Standard', 'Left Behind', 'Prepare for Escape', 'Edge of Darkness']
        .includes(partial.gameEdition as string) 
        ? partial.gameEdition as any 
        : 'Standard',
    };
  },

  /**
   * Create safe extended player settings
   */
  createSafeExtendedPlayerSettings(partial: Partial<ExtendedPlayerSettings>): ExtendedPlayerSettings {
    const base = this.createSafePlayerSettings(partial);
    return {
      ...base,
      hideoutModuleLevels: this.sanitizeHideoutLevels(partial.hideoutModuleLevels || {}),
    };
  },

  /**
   * Sanitize trader levels object
   */
  sanitizeTraderLevels(levels: Record<string, unknown>): Record<string, number> {
    const sanitized: Record<string, number> = {};
    
    Object.entries(levels).forEach(([traderId, level]) => {
      if (typeof traderId === 'string' && traderId.length > 0 &&
          typeof level === 'number' && level >= 1 && level <= 4) {
        sanitized[traderId] = level;
      }
    });
    
    return sanitized;
  },

  /**
   * Sanitize hideout levels object
   */
  sanitizeHideoutLevels(levels: Record<string, unknown>): Record<string, number> {
    const sanitized: Record<string, number> = {};
    
    Object.entries(levels).forEach(([stationId, level]) => {
      if (typeof stationId === 'string' && stationId.length > 0 &&
          typeof level === 'number' && level >= 0 && level <= 50) { // Max reasonable station level
        sanitized[stationId] = level;
      }
    });
    
    return sanitized;
  },
} as const;

/**
 * Runtime assertion utilities
 * For development and debugging - remove in production builds
 */
export const Assertions = {
  /**
   * Assert that value is defined and not null
   */
  assertDefined<T>(value: T | null | undefined, message?: string): asserts value is T {
    if (value == null) {
      throw new Error(message || 'Expected value to be defined');
    }
  },

  /**
   * Assert that value is a valid trader
   */
  assertTrader(value: unknown, message?: string): asserts value is Trader {
    if (!TypeGuards.isTrader(value)) {
      throw new Error(message || 'Expected valid Trader object');
    }
  },

  /**
   * Assert that value is a valid quest
   */
  assertQuest(value: unknown, message?: string): asserts value is Quest {
    if (!TypeGuards.isQuest(value)) {
      throw new Error(message || 'Expected valid Quest object');
    }
  },

  /**
   * Assert that array contains only valid items of type T
   */
  assertValidArray<T>(
    array: unknown[],
    validator: (item: unknown) => item is T,
    message?: string
  ): asserts array is T[] {
    if (!array.every(validator)) {
      throw new Error(message || 'Array contains invalid items');
    }
  },
} as const;