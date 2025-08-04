import { Quest, HideoutStation } from '@/services/tarkovApi';
import { PlayerSettings } from '@/contexts/PlayerSettingsContext';

// Global storage for API-fetched kappa quests
let cachedKappaQuests: Quest[] = [];

/**
 * Set the kappa quests cache with API-fetched data
 * @param kappaQuests - Array of kappa-required quests from API
 */
export const setKappaQuests = (kappaQuests: Quest[]): void => {
  cachedKappaQuests = kappaQuests;
};

/**
 * Get the cached kappa quests
 */
export const getCachedKappaQuests = (): Quest[] => {
  return cachedKappaQuests;
};

// Main quest line - all non-side quests that contribute to overall progress
const MAIN_QUEST_LINE_TRADERS = [
  'Prapor',
  'Therapist', 
  'Fence',
  'Skier',
  'Peacekeeper',
  'Mechanic',
  'Ragman',
  'Jaeger'
];

export interface QuestProgress {
  completed: number;
  total: number;
  percentage: number;
}

export interface HideoutProgress {
  completed: number;
  total: number;
  percentage: number;
}

/**
 * Calculate quest progress based on completed quests
 * @param allQuests - All available quests
 * @param playerSettings - Player's current settings including completed quests
 * @param isKappaMode - Whether to calculate progress for Kappa quests only
 */
export const calculateQuestProgress = (
  allQuests: Quest[], 
  playerSettings: PlayerSettings,
  isKappaMode: boolean = false
): QuestProgress => {
  if (isKappaMode) {
    // Use cached kappa quests from API if available
    let kappaQuests = cachedKappaQuests;
    
    // If cached kappa quests is empty, try to filter from allQuests using kappaRequired field
    if (kappaQuests.length === 0) {
      kappaQuests = allQuests.filter(quest => quest.kappaRequired === true);
    }
    
    const completedKappaQuests = kappaQuests.filter(quest => 
      playerSettings.completedQuestIds.includes(quest.id)
    );
    
    return {
      completed: completedKappaQuests.length,
      total: kappaQuests.length,
      percentage: kappaQuests.length > 0 ? Math.round((completedKappaQuests.length / kappaQuests.length) * 100) : 0
    };
  }
  
  // Calculate progress for all main quest line quests
  const mainQuests = allQuests.filter(quest => 
    MAIN_QUEST_LINE_TRADERS.includes(quest.trader.name)
  );
  
  const completedMainQuests = mainQuests.filter(quest => 
    playerSettings.completedQuestIds.includes(quest.id)
  );
  
  return {
    completed: completedMainQuests.length,
    total: mainQuests.length,
    percentage: mainQuests.length > 0 ? Math.round((completedMainQuests.length / mainQuests.length) * 100) : 0
  };
};

/**
 * Calculate hideout progress based on module levels
 * @param allStations - All hideout stations
 * @param playerSettings - Player's current settings including hideout module levels
 */
export const calculateHideoutProgress = (
  allStations: HideoutStation[], 
  playerSettings: PlayerSettings
): HideoutProgress => {
  let totalLevels = 0;
  let completedLevels = 0;
  
  allStations.forEach(station => {
    const maxLevel = station.levels.length;
    const currentLevel = playerSettings.hideoutModuleLevels[station.id] || 0;
    
    totalLevels += maxLevel;
    completedLevels += currentLevel;
  });
  
  return {
    completed: completedLevels,
    total: totalLevels,
    percentage: totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0
  };
};

/**
 * Get all quest IDs from multiple traders
 * @param questsByTrader - Object mapping trader IDs to their quests
 */
export const getAllQuestsFromTraders = (questsByTrader: Record<string, Quest[]>): Quest[] => {
  return Object.values(questsByTrader).flat();
};

/**
 * Check if a quest is part of the Kappa requirements
 * @param quest - The quest object to check
 */
export const isKappaQuest = (quest: Quest): boolean => {
  // First check if the kappaRequired field is available from the API
  if (quest.kappaRequired !== undefined) {
    return quest.kappaRequired === true;
  }
  
  // Use cached kappa quests from API if available
  if (cachedKappaQuests.length > 0) {
    return cachedKappaQuests.some(kappaQuest => kappaQuest.id === quest.id);
  }
  
  // Conservative fallback - only check for very specific quest names
  const specificKappaQuests = [
    'The Collector'
  ];
  
  return specificKappaQuests.includes(quest.name);
};

/**
 * Get all Kappa quests from a list of quests
 * @param allQuests - All available quests
 */
export const getKappaQuests = (allQuests: Quest[]): Quest[] => {
  return allQuests.filter(quest => isKappaQuest(quest));
};

/**
 * Calculate experience gained from completed quests
 * @param allQuests - All available quests
 * @param completedQuestIds - IDs of completed quests
 */
export const calculateQuestExperience = (
  allQuests: Quest[], 
  completedQuestIds: string[]
): number => {
  return allQuests
    .filter(quest => completedQuestIds.includes(quest.id))
    .reduce((total, quest) => total + quest.experience, 0);
};