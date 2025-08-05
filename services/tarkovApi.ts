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
  completedQuestIds: string[];
}

// Hardcoded quest level requirements since API doesn't provide them
const QUEST_LEVEL_REQUIREMENTS: Record<string, number> = {
  'The Punisher - Part 6': 21,  // Grenadier quest
  'Grenadier': 21,
  'The Punisher - Part 5': 19,
  'The Punisher - Part 4': 18,
  'The Punisher - Part 3': 16,
  'Tarkov Shooter - Part 8': 35,
  'Tarkov Shooter - Part 7': 33,
  'Tarkov Shooter - Part 6': 30,
  'Kappa': 62,
  'Collector': 60,
  'Perfect Mediator': 46,
  'The Guide': 40,
};

// Hardcoded faction requirements
const QUEST_FACTION_REQUIREMENTS: Record<string, 'USEC' | 'BEAR'> = {
  // Most quests don't have faction requirements in Tarkov
  // Add specific ones if needed
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
      const hasTraderLevelRequirement = quest.traderLevelRequirements.every(() => {
        // For now, assume player meets trader level requirements
        // This would need actual trader level data from player settings
        return true;
      });
      
      // Check player level requirement using hardcoded mapping
      const requiredLevel = QUEST_LEVEL_REQUIREMENTS[quest.name];
      const meetsLevelRequirement = !requiredLevel || level >= requiredLevel;
      
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
      
      // Check level/faction requirements using hardcoded mapping
      const requiredLevel = QUEST_LEVEL_REQUIREMENTS[quest.name];
      const meetsLevelRequirement = !requiredLevel || level >= requiredLevel;
      
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
    completedQuestIds
  });
};

export const filterHideoutModulesByType = (
  stations: HideoutStation[], 
  type: 'available' | 'locked' | 'maxed',
  playerSettings: {
    level: number;
    hideoutModuleLevels: Record<string, number>;
    traderLevels: Record<string, number>;
  }
): HideoutStation[] => {
  const { hideoutModuleLevels, traderLevels } = playerSettings;

  return stations.filter(station => {
    const currentModuleLevel = hideoutModuleLevels[station.id] || 0;
    const maxLevel = station.levels.length;
    
    if (type === 'maxed') {
      return currentModuleLevel >= maxLevel;
    }
    
    if (type === 'available') {
      // Module is maxed, so not available for upgrade
      if (currentModuleLevel >= maxLevel) return false;
      
      // Get the next level requirements (currentLevel + 1)
      const nextLevel = currentModuleLevel + 1;
      const nextLevelData = station.levels.find(l => l.level === nextLevel);
      
      if (!nextLevelData) return false;
      
      // Check station level requirements
      const hasStationRequirements = nextLevelData.stationLevelRequirements.every(req => {
        const requiredStationLevel = hideoutModuleLevels[req.station.id] || 0;
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
      if (currentModuleLevel >= maxLevel) return false;
      
      // Get the next level requirements
      const nextLevel = currentModuleLevel + 1;
      const nextLevelData = station.levels.find(l => l.level === nextLevel);
      
      if (!nextLevelData) return true; // No next level data means locked
      
      // Check if any requirements are not met
      const hasStationRequirements = nextLevelData.stationLevelRequirements.every(req => {
        const requiredStationLevel = hideoutModuleLevels[req.station.id] || 0;
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