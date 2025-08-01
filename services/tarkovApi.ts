import { QuestCacheManager } from './questCache';

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
  // Check cache first unless force refresh is requested
  if (!forceRefresh) {
    const cachedTraders = QuestCacheManager.getCachedTraders();
    if (cachedTraders) {
      console.log('📦 Using cached traders');
      return cachedTraders;
    }
  }

  console.log('🌐 Fetching traders from API');
  
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
    
    // Cache the results
    await QuestCacheManager.cacheTraders(traders);
    
    return traders;
  } catch (error) {
    console.error('Error fetching traders:', error);
    
    // If API fails, try to return cached data as fallback
    const cachedTraders = QuestCacheManager.getCachedTraders();
    if (cachedTraders) {
      console.log('⚠️ API failed, using cached traders as fallback');
      return cachedTraders;
    }
    
    throw error;
  }
};

export const fetchQuestsByTrader = async (traderId: string, forceRefresh = false): Promise<Quest[]> => {
  // Check cache first unless force refresh is requested
  if (!forceRefresh) {
    const cachedQuests = QuestCacheManager.getCachedQuests(traderId);
    if (cachedQuests) {
      console.log(`📦 Using cached quests for trader ${traderId}`);
      return cachedQuests;
    }
  }

  console.log(`🌐 Fetching quests for trader ${traderId} from API`);
  
  const query = `
    query {
      tasks(lang: en) {
        id
        name
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
    
    // Cache the results
    await QuestCacheManager.cacheQuests(traderId, traderQuests);
    
    return traderQuests;
  } catch (error) {
    console.error('Error fetching quests:', error);
    
    // If API fails, try to return cached data as fallback
    const cachedQuests = QuestCacheManager.getCachedQuests(traderId);
    if (cachedQuests) {
      console.log(`⚠️ API failed, using cached quests for trader ${traderId} as fallback`);
      return cachedQuests;
    }
    
    throw error;
  }
};

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
      const hasTraderLevelRequirement = quest.traderLevelRequirements.every(requirement => {
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

// Keep the old function for backward compatibility
export const filterAvailableQuests = (quests: Quest[], completedQuestIds: string[] = []): Quest[] => {
  return filterQuestsByType(quests, 'available', {
    level: 1,
    faction: 'USEC',
    completedQuestIds
  });
};