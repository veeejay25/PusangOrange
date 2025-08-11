import { PersistentStorage } from './persistentStorage';

const TARKOV_API_URL = 'https://api.tarkov.dev/graphql';

export interface Trader {
  id: string;
  name: string;
  imageLink?: string;
}

export interface TraderResponse {
  traders: Trader[];
}

export interface ItemUsage {
  stationName?: string;
  stationLevel?: number;
  questName?: string;
  traderName?: string;
  quantity: number;
}

export interface Item {
  id: string;
  name: string;
  iconLink?: string;
  totalQuantity: number;
  foundInRaid: boolean;
  source: 'hideout' | 'quest' | 'mixed';
  usages: ItemUsage[];
}

export interface Quest {
  id: string;
  name: string;
  normalizedName?: string;
  kappaRequired?: boolean;
  trader: {
    id: string;
    name: string;
  };
  taskRequirements: {
    task: {
      id: string;
      name: string;
    };
  }[];
  objectives: {
    id: string;
    description: string;
    type: string;
    maps?: {
      id: string;
      name: string;
    }[];
  }[];
  experience: number;
  traderLevelRequirements: {
    trader: {
      id: string;
      name: string;
    };
    level: number;
  }[];
  minPlayerLevel?: number;
  factionName?: string;
}

export interface QuestsResponse {
  tasks: Quest[];
}

export const fetchTraders = async (forceRefresh = false): Promise<Trader[]> => {
  // Check persistent storage first unless force refresh is requested
  if (!forceRefresh) {
    const persistentTraders = await PersistentStorage.getTraders();
    if (persistentTraders) {
      return persistentTraders;
    }
  }
  
  const query = `
    query {
      traders(lang: en) {
        id
        name
        imageLink
      }
    }
  `;

  try {
    const response = await fetch(TARKOV_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const traders = result.data?.traders || [];
    
    // Store in persistent storage
    await PersistentStorage.storeTraders(traders);
    
    return traders;
  } catch (error) {
    console.error('Error fetching traders:', error);
    
    // If API fails, try to return persistent data as fallback
    const persistentTraders = await PersistentStorage.getTraders();
    if (persistentTraders) {
      return persistentTraders;
    }
    
    throw error;
  }
};

export const fetchKappaRequiredQuests = async (forceRefresh = false): Promise<Quest[]> => {
  // Check persistent storage first unless force refresh is requested
  if (!forceRefresh) {
    const persistentKappaQuests = await PersistentStorage.getKappaQuests();
    if (persistentKappaQuests) {
      return persistentKappaQuests;
    }
  }

  
  const query = `
    query {
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
    const response = await fetch(TARKOV_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const allTasks = result.data?.tasks || [];
    
    // Filter to only include kappa-required quests
    const kappaQuests = allTasks.filter((task: Quest) => task.kappaRequired === true);
    
    // Store in persistent storage
    await PersistentStorage.storeKappaQuests(kappaQuests);
    
    return kappaQuests;
  } catch (error) {
    console.error('Error fetching kappa quests:', error);
    
    // If API fails, try to return persistent data as fallback
    const persistentKappaQuests = await PersistentStorage.getKappaQuests();
    if (persistentKappaQuests) {
      return persistentKappaQuests;
    }
    
    throw error;
  }
};

export const fetchQuestsByTrader = async (traderId: string, forceRefresh = false): Promise<Quest[]> => {
  // Check persistent storage first unless force refresh is requested
  if (!forceRefresh) {
    const persistentQuests = await PersistentStorage.getQuests();
    if (persistentQuests) {
      // Filter quests by trader from persistent storage
      const traderQuests = persistentQuests.filter(quest => quest.trader.id === traderId);
      return traderQuests;
    }
  }
  
  const query = `
    query {
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
    const response = await fetch(TARKOV_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const allTasks = result.data?.tasks || [];
    
    
    // Filter tasks by trader
    const traderQuests = allTasks.filter((task: Quest) => task.trader.id === traderId);
    
    // Store all tasks in persistent storage for future use
    await PersistentStorage.storeQuests(allTasks);
    
    return traderQuests;
  } catch (error) {
    console.error('Error fetching quests:', error);
    
    // If API fails, try to return persistent data as fallback
    const persistentQuests = await PersistentStorage.getQuests();
    if (persistentQuests) {
      const traderQuests = persistentQuests.filter(quest => quest.trader.id === traderId);
      return traderQuests;
    }
    
    throw error;
  }
};

export interface HideoutStation {
  id: string;
  name: string;
  imageLink?: string;
  levels: {
    level: number;
    constructionTime: number;
    description?: string;
    itemRequirements: {
      item: {
        id: string;
        name: string;
        iconLink?: string;
      };
      count: number;
    }[];
    stationLevelRequirements: {
      station: {
        id: string;
        name: string;
      };
      level: number;
    }[];
    traderRequirements: {
      trader: {
        id: string;
        name: string;
      };
      level: number;
    }[];
  }[];
}

export interface HideoutStationsResponse {
  hideoutStations: HideoutStation[];
}

export interface PlayerSettings {
  level: number;
  faction: 'USEC' | 'BEAR';
  playerName: string;
  completedQuestIds: string[];
  traderLevels: Record<string, number>;
  gameEdition: 'Standard' | 'Left Behind' | 'Prepare for Escape' | 'Edge of Darkness';
}

// Note: Player level requirements are now fetched from API via quest.minPlayerLevel field

// Hardcoded faction requirements
const QUEST_FACTION_REQUIREMENTS: Record<string, 'USEC' | 'BEAR'> = {
  // Most quests don't have faction requirements in Tarkov
  // Add specific ones if needed
};

// Game edition reputation bonuses
const GAME_EDITION_BONUSES: Record<string, Record<string, number>> = {
  'Standard': {},
  'Left Behind': {
    // Add specific trader bonuses for Left Behind edition
  },
  'Prepare for Escape': {
    // Add specific trader bonuses for Prepare for Escape edition  
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
    'Jaeger': 0.20
  }
};

// Game edition hideout bonuses (starting module levels)
const HIDEOUT_EDITION_BONUSES: Record<string, Record<string, number>> = {
  'Standard': {},
  'Left Behind': {
    // Stash level 2
    'Stash': 2
  },
  'Prepare for Escape': {
    // Stash level 3
    'Stash': 3
  },
  'Edge of Darkness': {
    // Stash level 4 (maximum)
    'Stash': 4
  }
};

/**
 * Get effective trader level including game edition bonuses
 * @param traderId - The trader ID 
 * @param traderName - The trader name
 * @param playerSettings - Player settings including trader levels and game edition
 * @returns The effective trader level (base level + bonuses)
 */
const getEffectiveTraderLevel = (
  traderId: string, 
  traderName: string, 
  playerSettings: PlayerSettings
): number => {
  const baseLevel = playerSettings.traderLevels[traderId] || 1;
  const editionBonus = GAME_EDITION_BONUSES[playerSettings.gameEdition]?.[traderName] || 0;
  
  // Convert reputation bonus to level equivalence (rough approximation)
  // In Tarkov, each trader level typically requires ~0.20-0.30 reputation increase
  const bonusLevels = Math.floor(editionBonus / 0.20);
  
  return baseLevel + bonusLevels;
};

/**
 * Get effective hideout module level including game edition bonuses
 * @param stationId - The hideout station ID
 * @param stationName - The hideout station name  
 * @param playerSettings - Player settings including hideout module levels and game edition
 * @returns The effective module level (base level + edition bonus)
 */
export const getEffectiveHideoutLevel = (
  stationId: string,
  stationName: string,
  playerSettings: PlayerSettings & { hideoutModuleLevels: Record<string, number> }
): number => {
  // Get level by ID (which is how hideoutModuleLevels is indexed)
  const baseLevel = playerSettings.hideoutModuleLevels[stationId] || 0;
  
  // For edition bonuses, we use the station name
  const editionBonus = HIDEOUT_EDITION_BONUSES[playerSettings.gameEdition]?.[stationName] || 0;
  
  // Return the maximum of base level and edition bonus
  // This ensures that edition bonuses provide starting levels, not additional levels
  return Math.max(baseLevel, editionBonus);
};

/**
 * Check if a hideout station can be upgraded to the next level
 * @param station - The hideout station to check
 * @param currentLevel - The current level of the station
 * @param playerSettings - Player settings including hideout module levels, trader levels, and game edition
 * @returns True if the station can be upgraded, false otherwise
 */
export const canUpgradeHideoutStation = (
  station: HideoutStation,
  currentLevel: number,
  playerSettings: {
    level: number;
    hideoutModuleLevels: Record<string, number>;
    traderLevels: Record<string, number>;
    gameEdition: string;
  }
): boolean => {
  const maxLevel = station.levels.length;
  const effectiveLevel = getEffectiveHideoutLevel(station.id, station.name, playerSettings as any);
  const displayLevel = Math.max(currentLevel, effectiveLevel);
  
  // Can't upgrade if already at max level
  if (displayLevel >= maxLevel) return false;
  
  // Get the next level requirements
  const nextLevel = displayLevel + 1;
  const nextLevelData = station.levels.find(l => l.level === nextLevel);
  
  if (!nextLevelData) return false;
  
  // Check station level requirements
  const hasStationRequirements = nextLevelData.stationLevelRequirements.every(req => {
    const requiredStationLevel = getEffectiveHideoutLevel(req.station.id, req.station.name, playerSettings as any);
    return requiredStationLevel >= req.level;
  });
  
  // Check trader level requirements
  const hasTraderRequirements = nextLevelData.traderRequirements.every(req => {
    const currentTraderLevel = playerSettings.traderLevels[req.trader.id] || 1;
    return currentTraderLevel >= req.level;
  });
  
  return hasStationRequirements && hasTraderRequirements;
};

/**
 * Get missing requirements for upgrading a hideout station
 * @param station - The hideout station to check
 * @param currentLevel - The current level of the station
 * @param playerSettings - Player settings including hideout module levels, trader levels, and game edition
 * @returns Array of missing requirements
 */
export const getMissingHideoutRequirements = (
  station: HideoutStation,
  currentLevel: number,
  playerSettings: {
    level: number;
    hideoutModuleLevels: Record<string, number>;
    traderLevels: Record<string, number>;
    gameEdition: string;
  }
): { type: 'station' | 'trader'; name: string; required: number; current: number }[] => {
  const maxLevel = station.levels.length;
  const effectiveLevel = getEffectiveHideoutLevel(station.id, station.name, playerSettings as any);
  const displayLevel = Math.max(currentLevel, effectiveLevel);
  
  // Already at max level or can upgrade
  if (displayLevel >= maxLevel) return [];
  
  const nextLevel = displayLevel + 1;
  const nextLevelData = station.levels.find(l => l.level === nextLevel);
  
  if (!nextLevelData) return [];
  
  const missingRequirements: { type: 'station' | 'trader'; name: string; required: number; current: number }[] = [];
  
  // Check missing station requirements
  nextLevelData.stationLevelRequirements.forEach(req => {
    const requiredStationLevel = getEffectiveHideoutLevel(req.station.id, req.station.name, playerSettings as any);
    if (requiredStationLevel < req.level) {
      missingRequirements.push({
        type: 'station',
        name: req.station.name,
        required: req.level,
        current: requiredStationLevel
      });
    }
  });
  
  // Check missing trader requirements
  nextLevelData.traderRequirements.forEach(req => {
    const currentTraderLevel = playerSettings.traderLevels[req.trader.id] || 1;
    if (currentTraderLevel < req.level) {
      missingRequirements.push({
        type: 'trader',
        name: req.trader.name,
        required: req.level,
        current: currentTraderLevel
      });
    }
  });
  
  return missingRequirements;
};

export const filterQuestsByType = (
  quests: Quest[], 
  type: 'available' | 'locked' | 'completed',
  playerSettings: PlayerSettings
): Quest[] => {
  const { level, faction, completedQuestIds } = playerSettings;
  
  
  return quests.filter(quest => {
    const isCompleted = completedQuestIds.includes(quest.id);
    
    if (type === 'completed') {
      return isCompleted;
    }
    
    if (type === 'available') {
      if (isCompleted) return false;
      
      // Check prerequisite quests
      const hasQuestPrerequisites = quest.taskRequirements.every(requirement => 
        completedQuestIds.includes(requirement.task.id)
      );
      
      // Check trader level requirements
      const hasTraderLevelRequirement = quest.traderLevelRequirements.every(requirement => {
        const effectiveTraderLevel = getEffectiveTraderLevel(
          requirement.trader.id, 
          requirement.trader.name, 
          playerSettings
        );
        return effectiveTraderLevel >= requirement.level;
      });
      
      // Check player level requirement from API data
      const meetsLevelRequirement = !quest.minPlayerLevel || level >= quest.minPlayerLevel;
      
      // Check faction requirement using hardcoded mapping
      const requiredFaction = QUEST_FACTION_REQUIREMENTS[quest.name];
      const meetsFactionRequirement = !requiredFaction || faction === requiredFaction;
      
      
      return hasQuestPrerequisites && hasTraderLevelRequirement && 
             meetsLevelRequirement && meetsFactionRequirement;
    }
    
    if (type === 'locked') {
      if (isCompleted) return false;
      
      // Quest is locked if any requirement is not met
      const hasQuestPrerequisites = quest.taskRequirements.every(requirement => 
        completedQuestIds.includes(requirement.task.id)
      );
      
      // Check level/faction requirements from API data
      const meetsLevelRequirement = !quest.minPlayerLevel || level >= quest.minPlayerLevel;
      
      const requiredFaction = QUEST_FACTION_REQUIREMENTS[quest.name];
      const meetsFactionRequirement = !requiredFaction || faction === requiredFaction;
      
      return !hasQuestPrerequisites || !meetsLevelRequirement || !meetsFactionRequirement;
    }
    
    return false;
  });
};

export const fetchHideoutStations = async (forceRefresh = false): Promise<HideoutStation[]> => {
  // Check persistent storage first unless force refresh is requested
  if (!forceRefresh) {
    const persistentStations = await PersistentStorage.getHideoutStations();
    if (persistentStations) {
      return persistentStations;
    }
  }
  
  const query = `
    query {
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
    const response = await fetch(TARKOV_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const stations = result.data?.hideoutStations || [];
    
    // Store in persistent storage
    await PersistentStorage.storeHideoutStations(stations);
    
    return stations;
  } catch (error) {
    console.error('Error fetching hideout stations:', error);
    
    // If API fails, try to return persistent data as fallback
    const persistentStations = await PersistentStorage.getHideoutStations();
    if (persistentStations) {
      return persistentStations;
    }
    
    throw error;
  }
};


// Keep the old function for backward compatibility
export const filterAvailableQuests = (quests: Quest[], completedQuestIds: string[] = []): Quest[] => {
  return filterQuestsByType(quests, 'available', {
    level: 1,
    faction: 'USEC',
    playerName: 'Player',
    completedQuestIds,
    traderLevels: {},
    gameEdition: 'Standard'
  });
};

export const fetchAllItems = async (playerSettings?: {
  hideoutModuleLevels: Record<string, number>;
  completedQuestIds: string[];
}): Promise<Item[]> => {
  try {
    const [hideoutStations, traders] = await Promise.all([
      fetchHideoutStations(),
      fetchTraders()
    ]);
    
    // Use a map to combine items by their actual item ID
    const itemMap = new Map<string, Item>();
    
    // Get hideout items from station requirements
    hideoutStations.forEach((station: HideoutStation) => {
      station.levels.forEach(level => {
        // Skip this level if player already has it or higher
        const currentStationLevel = playerSettings?.hideoutModuleLevels[station.id] || 0;
        if (currentStationLevel >= level.level) {
          return; // Skip this level as it's already completed
        }
        
        level.itemRequirements.forEach(itemReq => {
          const itemId = itemReq.item.id;
          const usage: ItemUsage = {
            stationName: station.name,
            stationLevel: level.level,
            quantity: itemReq.count
          };
          
          if (itemMap.has(itemId)) {
            const existingItem = itemMap.get(itemId)!;
            existingItem.totalQuantity += itemReq.count;
            existingItem.usages.push(usage);
            // Update source to mixed if it was previously quest-only
            if (existingItem.source === 'quest') {
              existingItem.source = 'mixed';
            }
          } else {
            itemMap.set(itemId, {
              id: itemId,
              name: itemReq.item.name,
              iconLink: itemReq.item.iconLink,
              totalQuantity: itemReq.count,
              foundInRaid: false,
              source: 'hideout',
              usages: [usage]
            });
          }
        });
      });
    });
    
    // Get quest items from all traders
    const questPromises = traders.map(async (trader: Trader) => {
      try {
        const quests = await fetchQuestsByTrader(trader.id);
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
          return; // Skip this quest as it's already completed
        }
        
        // Check if quest has item-related objectives
        quest.objectives.forEach(objective => {
          if (objective.type === 'findInRaid' || 
              objective.type === 'giveItem' ||
              objective.description.toLowerCase().includes('find') ||
              objective.description.toLowerCase().includes('hand over') ||
              objective.description.toLowerCase().includes('turn in')) {
            
            // For quest items, use a generated ID since we don't have actual item IDs
            const questItemId = `quest-${quest.id}-${objective.id}`;
            let itemName = objective.description;
            const foundInRaid = objective.type === 'findInRaid' || 
                               objective.description.toLowerCase().includes('found in raid');
            
            const usage: ItemUsage = {
              questName: quest.name,
              traderName: trader.name,
              quantity: 1
            };
            
            // For quest items, we'll create separate entries since they don't have consistent item IDs
            itemMap.set(questItemId, {
              id: questItemId,
              name: itemName.length > 50 ? `${itemName.substring(0, 47)}...` : itemName,
              totalQuantity: 1,
              foundInRaid,
              source: 'quest',
              usages: [usage]
            });
          }
        });
      });
    });
    
    return Array.from(itemMap.values());
  } catch (error) {
    console.error('Error fetching all items:', error);
    throw error;
  }
};

export const filterHideoutModulesByType = (
  stations: HideoutStation[], 
  type: 'available' | 'locked' | 'maxed',
  playerSettings: {
    level: number;
    hideoutModuleLevels: Record<string, number>;
    traderLevels: Record<string, number>;
    gameEdition: string;
  }
): HideoutStation[] => {
  const { traderLevels, hideoutModuleLevels } = playerSettings;

  return stations.filter(station => {
    // Use actual player level, not effective level for filtering logic
    const actualModuleLevel = hideoutModuleLevels[station.id] || 0;
    const effectiveLevel = getEffectiveHideoutLevel(station.id, station.name, playerSettings as any);
    const displayLevel = Math.max(actualModuleLevel, effectiveLevel);
    const maxLevel = station.levels.length;
    
    if (type === 'maxed') {
      return displayLevel >= maxLevel;
    }
    
    if (type === 'available') {
      // Module is maxed, so not available for upgrade
      if (displayLevel >= maxLevel) return false;
      
      // For available, check if we can upgrade from the actual level (not display level)
      // This ensures that edition bonuses don't make things "available" when they shouldn't be
      const nextLevel = actualModuleLevel + 1;
      const nextLevelData = station.levels.find(l => l.level === nextLevel);
      
      if (!nextLevelData) return false;
      
      // Check station level requirements
      const hasStationRequirements = nextLevelData.stationLevelRequirements.every(req => {
        const requiredStationLevel = getEffectiveHideoutLevel(req.station.id, req.station.name, playerSettings as any);
        return requiredStationLevel >= req.level;
      });
      
      // Check trader level requirements
      const hasTraderRequirements = nextLevelData.traderRequirements.every(req => {
        const currentTraderLevel = traderLevels[req.trader.id] || 1;
        return currentTraderLevel >= req.level;
      });
      
      return hasStationRequirements && hasTraderRequirements;
    }
    
    if (type === 'locked') {
      // Module is maxed, so not locked
      if (displayLevel >= maxLevel) return false;
      
      // Check if the next level from actual level is locked
      const nextLevel = actualModuleLevel + 1;
      const nextLevelData = station.levels.find(l => l.level === nextLevel);
      
      if (!nextLevelData) return true; // No next level data means locked
      
      // Check if any requirements are not met
      const hasStationRequirements = nextLevelData.stationLevelRequirements.every(req => {
        const requiredStationLevel = getEffectiveHideoutLevel(req.station.id, req.station.name, playerSettings as any);
        return requiredStationLevel >= req.level;
      });
      
      const hasTraderRequirements = nextLevelData.traderRequirements.every(req => {
        const currentTraderLevel = traderLevels[req.trader.id] || 1;
        return currentTraderLevel >= req.level;
      });
      
      return !hasStationRequirements || !hasTraderRequirements;
    }
    
    return false;
  });
};