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
}

export interface QuestsResponse {
  tasks: Quest[];
}

export const fetchTraders = async (): Promise<Trader[]> => {
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

    return result.data?.traders || [];
  } catch (error) {
    console.error('Error fetching traders:', error);
    throw error;
  }
};

export const fetchQuestsByTrader = async (traderId: string): Promise<Quest[]> => {
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
    return allTasks.filter((task: Quest) => task.trader.id === traderId);
  } catch (error) {
    console.error('Error fetching quests:', error);
    throw error;
  }
};

export const filterAvailableQuests = (quests: Quest[], completedQuestIds: string[] = []): Quest[] => {
  const availableQuests: Quest[] = [];
  
  for (const quest of quests) {
    // Skip if quest is already completed
    if (completedQuestIds.includes(quest.id)) {
      continue;
    }
    
    // Check if all prerequisite quests are completed
    const hasAllPrerequisites = quest.taskRequirements.every(requirement => {
      return completedQuestIds.includes(requirement.task.id);
    });
    
    // If no prerequisites or all prerequisites are met, quest is available
    if (quest.taskRequirements.length === 0 || hasAllPrerequisites) {
      availableQuests.push(quest);
    }
  }
  
  return availableQuests;
};