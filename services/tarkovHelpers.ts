/**
 * @fileoverview Helper functions and utilities for Escape from Tarkov data manipulation
 * Provides game logic calculations, filtering, and data transformation utilities
 */

import type {
  Quest,
  HideoutStation,
  PlayerSettings,
  ExtendedPlayerSettings,
  QuestFilterType,
  HideoutFilterType,
  MissingRequirement,
  PlayerFaction,
  EditionBonuses,
  HideoutEditionBonuses,
  QuestFactionRequirements,
} from './tarkovTypes';

/**
 * Game edition bonuses for trader reputation
 * Each edition provides reputation bonuses that effectively increase trader levels
 */
export const GAME_EDITION_BONUSES: EditionBonuses = {
  'Standard': {},
  'Left Behind': {
    // Add specific trader bonuses for Left Behind edition if any
  },
  'Prepare for Escape': {
    // Add specific trader bonuses for Prepare for Escape edition if any
  },
  'Edge of Darkness': {
    // Edge of Darkness gets +0.20 reputation with all traders
    'Prapor': 0.20,
    'Therapist': 0.20,
    'Fence': 0.20,
    'Skier': 0.20,
    'Peacekeeper': 0.20,
    'Mechanic': 0.20,
    'Ragman': 0.20,
    'Jaeger': 0.20,
  },
} as const;

/**
 * Game edition hideout starting bonuses
 * Higher editions start with upgraded stash levels
 */
export const HIDEOUT_EDITION_BONUSES: HideoutEditionBonuses = {
  'Standard': {},
  'Left Behind': {
    // Stash level 2
    'Stash': 2,
  },
  'Prepare for Escape': {
    // Stash level 3
    'Stash': 3,
  },
  'Edge of Darkness': {
    // Stash level 4 (maximum)
    'Stash': 4,
  },
} as const;

/**
 * Hardcoded faction requirements for specific quests
 * Most quests don't have faction requirements in Tarkov
 */
export const QUEST_FACTION_REQUIREMENTS: QuestFactionRequirements = {
  // Add specific quest faction requirements here if needed
  // Example: 'The Punisher - Part 1': 'USEC',
} as const;

/**
 * Quest filtering and analysis utilities
 */
export const QuestHelpers = {
  /**
   * Filter quests by their availability status based on player progress
   * @param quests - Array of quests to filter
   * @param filterType - Type of filter to apply
   * @param playerSettings - Player progress and configuration
   * @returns Filtered array of quests
   * 
   * @example
   * ```typescript
   * const availableQuests = QuestHelpers.filterByType(
   *   allQuests,
   *   'available',
   *   { level: 15, faction: 'USEC', completedQuestIds: ['quest1', 'quest2'], ... }
   * );
   * ```
   */
  filterByType(
    quests: readonly Quest[],
    filterType: QuestFilterType,
    playerSettings: PlayerSettings
  ): Quest[] {
    const { level, faction, completedQuestIds } = playerSettings;
    
    return quests.filter(quest => {
      const isCompleted = completedQuestIds.includes(quest.id);
      
      if (filterType === 'completed') {
        return isCompleted;
      }
      
      if (filterType === 'available') {
        if (isCompleted) return false;
        
        // Check all availability requirements
        return (
          this.hasPrerequisiteQuests(quest, completedQuestIds) &&
          this.meetsTraderLevelRequirements(quest, playerSettings) &&
          this.meetsPlayerLevelRequirement(quest, level) &&
          this.meetsFactionRequirement(quest, faction)
        );
      }
      
      if (filterType === 'locked') {
        if (isCompleted) return false;
        
        // Quest is locked if any requirement is not met
        return !(
          this.hasPrerequisiteQuests(quest, completedQuestIds) &&
          this.meetsTraderLevelRequirements(quest, playerSettings) &&
          this.meetsPlayerLevelRequirement(quest, level) &&
          this.meetsFactionRequirement(quest, faction)
        );
      }
      
      return false;
    });
  },

  /**
   * Check if player has completed all prerequisite quests
   * @param quest - Quest to check
   * @param completedQuestIds - Array of completed quest IDs
   * @returns True if all prerequisites are met
   */
  hasPrerequisiteQuests(quest: Quest, completedQuestIds: readonly string[]): boolean {
    return quest.taskRequirements.every(requirement =>
      completedQuestIds.includes(requirement.task.id)
    );
  },

  /**
   * Check if player meets trader level requirements for the quest
   * @param quest - Quest to check
   * @param playerSettings - Player settings with trader levels
   * @returns True if trader level requirements are met
   */
  meetsTraderLevelRequirements(quest: Quest, playerSettings: PlayerSettings): boolean {
    return quest.traderLevelRequirements.every(requirement => {
      const effectiveTraderLevel = TraderHelpers.getEffectiveLevel(
        requirement.trader.id,
        requirement.trader.name,
        playerSettings
      );
      return effectiveTraderLevel >= requirement.level;
    });
  },

  /**
   * Check if player meets the minimum level requirement
   * @param quest - Quest to check
   * @param playerLevel - Current player level
   * @returns True if level requirement is met
   */
  meetsPlayerLevelRequirement(quest: Quest, playerLevel: number): boolean {
    return !quest.minPlayerLevel || playerLevel >= quest.minPlayerLevel;
  },

  /**
   * Check if player's faction meets quest requirements
   * @param quest - Quest to check
   * @param playerFaction - Player's chosen faction
   * @returns True if faction requirement is met
   */
  meetsFactionRequirement(quest: Quest, playerFaction: PlayerFaction): boolean {
    const requiredFaction = QUEST_FACTION_REQUIREMENTS[quest.name];
    return !requiredFaction || playerFaction === requiredFaction;
  },

  /**
   * Get missing requirements for a locked quest
   * @param quest - Quest to analyze
   * @param playerSettings - Player progress and configuration
   * @returns Array of missing requirements with details
   */
  getMissingRequirements(
    quest: Quest,
    playerSettings: PlayerSettings
  ): {
    type: 'quest' | 'trader' | 'level' | 'faction';
    description: string;
    current?: number | string;
    required?: number | string;
  }[] {
    const missing: {
      type: 'quest' | 'trader' | 'level' | 'faction';
      description: string;
      current?: number | string;
      required?: number | string;
    }[] = [];

    // Check prerequisite quests
    quest.taskRequirements.forEach(requirement => {
      if (!playerSettings.completedQuestIds.includes(requirement.task.id)) {
        missing.push({
          type: 'quest',
          description: `Complete "${requirement.task.name}"`,
        });
      }
    });

    // Check trader level requirements
    quest.traderLevelRequirements.forEach(requirement => {
      const effectiveLevel = TraderHelpers.getEffectiveLevel(
        requirement.trader.id,
        requirement.trader.name,
        playerSettings
      );
      if (effectiveLevel < requirement.level) {
        missing.push({
          type: 'trader',
          description: `${requirement.trader.name} level ${requirement.level}`,
          current: effectiveLevel,
          required: requirement.level,
        });
      }
    });

    // Check player level requirement
    if (quest.minPlayerLevel && playerSettings.level < quest.minPlayerLevel) {
      missing.push({
        type: 'level',
        description: `Player level ${quest.minPlayerLevel}`,
        current: playerSettings.level,
        required: quest.minPlayerLevel,
      });
    }

    // Check faction requirement
    const requiredFaction = QUEST_FACTION_REQUIREMENTS[quest.name];
    if (requiredFaction && playerSettings.faction !== requiredFaction) {
      missing.push({
        type: 'faction',
        description: `${requiredFaction} faction required`,
        current: playerSettings.faction,
        required: requiredFaction,
      });
    }

    return missing;
  },
} as const;

/**
 * Trader-related helper functions
 */
export const TraderHelpers = {
  /**
   * Calculate effective trader level including game edition bonuses
   * @param traderId - The trader's unique identifier
   * @param traderName - The trader's display name
   * @param playerSettings - Player settings including trader levels and game edition
   * @returns Effective trader level (base level + edition bonuses)
   * 
   * @example
   * ```typescript
   * const effectiveLevel = TraderHelpers.getEffectiveLevel(
   *   'prapor-id',
   *   'Prapor',
   *   { traderLevels: { 'prapor-id': 2 }, gameEdition: 'Edge of Darkness', ... }
   * );
   * // Returns: 3 (base level 2 + edition bonus)
   * ```
   */
  getEffectiveLevel(
    traderId: string,
    traderName: string,
    playerSettings: PlayerSettings
  ): number {
    const baseLevel = playerSettings.traderLevels?.[traderId] || 1;
    const editionBonus = GAME_EDITION_BONUSES[playerSettings.gameEdition]?.[traderName] || 0;
    
    // Convert reputation bonus to level equivalence
    // In Tarkov, each trader level typically requires ~0.20-0.30 reputation increase
    const bonusLevels = Math.floor(editionBonus / 0.20);
    
    return baseLevel + bonusLevels;
  },
} as const;

/**
 * Hideout station helper functions
 */
export const HideoutHelpers = {
  /**
   * Calculate effective hideout module level including game edition bonuses
   * @param stationId - The hideout station's unique identifier
   * @param stationName - The hideout station's display name
   * @param playerSettings - Extended player settings with hideout levels
   * @returns Effective module level (base level + edition bonus)
   */
  getEffectiveLevel(
    stationId: string,
    stationName: string,
    playerSettings: ExtendedPlayerSettings
  ): number {
    const baseLevel = playerSettings.hideoutModuleLevels[stationId] || 0;
    const editionBonus = HIDEOUT_EDITION_BONUSES[playerSettings.gameEdition]?.[stationName] || 0;
    
    // Return the maximum of base level and edition bonus
    // Edition bonuses provide starting levels, not additional levels
    return Math.max(baseLevel, editionBonus);
  },

  /**
   * Filter hideout stations by their upgrade availability status
   * @param stations - Array of hideout stations to filter
   * @param filterType - Type of filter to apply
   * @param playerSettings - Extended player settings with hideout and trader levels
   * @returns Filtered array of hideout stations
   */
  filterByType(
    stations: readonly HideoutStation[],
    filterType: HideoutFilterType,
    playerSettings: ExtendedPlayerSettings
  ): HideoutStation[] {
    return stations.filter(station => {
      const actualModuleLevel = playerSettings.hideoutModuleLevels[station.id] || 0;
      const effectiveLevel = this.getEffectiveLevel(station.id, station.name, playerSettings);
      const displayLevel = Math.max(actualModuleLevel, effectiveLevel);
      const maxLevel = station.levels.length;
      
      if (filterType === 'maxed') {
        return displayLevel >= maxLevel;
      }
      
      if (filterType === 'available') {
        // Module is maxed, so not available for upgrade
        if (displayLevel >= maxLevel) return false;
        
        return this.canUpgradeToNextLevel(station, actualModuleLevel, playerSettings);
      }
      
      if (filterType === 'locked') {
        // Module is maxed, so not locked
        if (displayLevel >= maxLevel) return false;
        
        return !this.canUpgradeToNextLevel(station, actualModuleLevel, playerSettings);
      }
      
      return false;
    });
  },

  /**
   * Check if a hideout station can be upgraded to the next level
   * @param station - The hideout station to check
   * @param currentLevel - Current level of the station (actual, not effective)
   * @param playerSettings - Extended player settings
   * @returns True if the station can be upgraded
   */
  canUpgradeToNextLevel(
    station: HideoutStation,
    currentLevel: number,
    playerSettings: ExtendedPlayerSettings
  ): boolean {
    const nextLevel = currentLevel + 1;
    const nextLevelData = station.levels.find(l => l.level === nextLevel);
    
    if (!nextLevelData) return false;
    
    // Check station level requirements
    const hasStationRequirements = nextLevelData.stationLevelRequirements.every(req => {
      const requiredStationLevel = this.getEffectiveLevel(req.station.id, req.station.name, playerSettings);
      return requiredStationLevel >= req.level;
    });
    
    // Check trader level requirements
    const hasTraderRequirements = nextLevelData.traderRequirements.every(req => {
      const currentTraderLevel = playerSettings.traderLevels?.[req.trader.id] || 1;
      return currentTraderLevel >= req.level;
    });
    
    return hasStationRequirements && hasTraderRequirements;
  },

  /**
   * Get missing requirements for upgrading a hideout station
   * @param station - The hideout station to check
   * @param currentLevel - Current level of the station
   * @param playerSettings - Extended player settings
   * @returns Array of missing requirements
   */
  getMissingRequirements(
    station: HideoutStation,
    currentLevel: number,
    playerSettings: ExtendedPlayerSettings
  ): MissingRequirement[] {
    const nextLevel = currentLevel + 1;
    const nextLevelData = station.levels.find(l => l.level === nextLevel);
    
    if (!nextLevelData) return [];
    
    const missingRequirements: MissingRequirement[] = [];
    
    // Check missing station requirements
    nextLevelData.stationLevelRequirements.forEach(req => {
      const requiredStationLevel = this.getEffectiveLevel(req.station.id, req.station.name, playerSettings);
      if (requiredStationLevel < req.level) {
        missingRequirements.push({
          type: 'station',
          name: req.station.name,
          required: req.level,
          current: requiredStationLevel,
        });
      }
    });
    
    // Check missing trader requirements
    nextLevelData.traderRequirements.forEach(req => {
      const currentTraderLevel = playerSettings.traderLevels?.[req.trader.id] || 1;
      if (currentTraderLevel < req.level) {
        missingRequirements.push({
          type: 'trader',
          name: req.trader.name,
          required: req.level,
          current: currentTraderLevel,
        });
      }
    });
    
    return missingRequirements;
  },

  /**
   * Get the maximum possible level for a station (including edition bonuses)
   * @param station - The hideout station to check
   * @returns Maximum level for this station
   */
  getMaxLevel(station: HideoutStation): number {
    return station.levels.length;
  },

  /**
   * Calculate total construction time for upgrading to a specific level
   * @param station - The hideout station
   * @param fromLevel - Starting level (0-based)
   * @param toLevel - Target level
   * @returns Total construction time in seconds
   */
  calculateConstructionTime(station: HideoutStation, fromLevel: number, toLevel: number): number {
    let totalTime = 0;
    
    for (let level = fromLevel + 1; level <= toLevel; level++) {
      const levelData = station.levels.find(l => l.level === level);
      if (levelData) {
        totalTime += levelData.constructionTime;
      }
    }
    
    return totalTime;
  },
} as const;

/**
 * General utility functions for data manipulation
 */
export const DataHelpers = {
  /**
   * Create a deep clone of an object (for immutable operations)
   * @param obj - Object to clone
   * @returns Deep cloned object
   */
  deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }
    
    const cloned = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    
    return cloned;
  },

  /**
   * Sort quests by various criteria
   * @param quests - Array of quests to sort
   * @param criteria - Sort criteria
   * @param direction - Sort direction
   * @returns Sorted array of quests
   */
  sortQuests(
    quests: readonly Quest[],
    criteria: 'name' | 'trader' | 'experience' | 'level',
    direction: 'asc' | 'desc' = 'asc'
  ): Quest[] {
    const sorted = [...quests].sort((a, b) => {
      let comparison = 0;
      
      switch (criteria) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'trader':
          comparison = a.trader.name.localeCompare(b.trader.name);
          break;
        case 'experience':
          comparison = a.experience - b.experience;
          break;
        case 'level':
          comparison = (a.minPlayerLevel || 0) - (b.minPlayerLevel || 0);
          break;
      }
      
      return direction === 'desc' ? -comparison : comparison;
    });
    
    return sorted;
  },

  /**
   * Group quests by trader
   * @param quests - Array of quests to group
   * @returns Object with trader names as keys and quest arrays as values
   */
  groupQuestsByTrader(quests: readonly Quest[]): Record<string, Quest[]> {
    return quests.reduce((groups, quest) => {
      const traderName = quest.trader.name;
      if (!groups[traderName]) {
        groups[traderName] = [];
      }
      groups[traderName].push(quest);
      return groups;
    }, {} as Record<string, Quest[]>);
  },

  /**
   * Search quests by name or description
   * @param quests - Array of quests to search
   * @param searchTerm - Search term (case-insensitive)
   * @returns Filtered array of matching quests
   */
  searchQuests(quests: readonly Quest[], searchTerm: string): Quest[] {
    if (!searchTerm.trim()) return [...quests];
    
    const term = searchTerm.toLowerCase();
    return quests.filter(quest =>
      quest.name.toLowerCase().includes(term) ||
      quest.objectives.some(obj => obj.description.toLowerCase().includes(term))
    );
  },

  /**
   * Format time duration to human-readable string
   * @param seconds - Duration in seconds
   * @returns Formatted duration string
   */
  formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  },
} as const;

/**
 * Backward compatibility helpers
 * @deprecated Use the new helper functions instead
 */
export const LegacyHelpers = {
  /**
   * Legacy function for filtering available quests
   * @deprecated Use QuestHelpers.filterByType(quests, 'available', playerSettings) instead
   */
  filterAvailableQuests(quests: Quest[], completedQuestIds: string[] = []): Quest[] {
    return QuestHelpers.filterByType(quests, 'available', {
      level: 1,
      faction: 'USEC',
      playerName: 'Player',
      completedQuestIds,
      traderLevels: {},
      gameEdition: 'Standard',
    });
  },
} as const;