import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PMCFaction = 'USEC' | 'BEAR';
export type GameEdition = 'Standard' | 'Left Behind' | 'Prepare for Escape' | 'Edge of Darkness';

export interface PlayerSettings {
  level: number;
  faction: PMCFaction;
  gameEdition: GameEdition;
  completedQuestIds: string[];
  hideoutModuleLevels: Record<string, number>; // module id -> current level
  traderLevels: Record<string, number>; // trader id -> current level
}

interface PlayerSettingsContextType {
  settings: PlayerSettings;
  updateLevel: (level: number) => void;
  updateFaction: (faction: PMCFaction) => void;
  updateGameEdition: (edition: GameEdition) => void;
  addCompletedQuest: (questId: string) => void;
  removeCompletedQuest: (questId: string) => void;
  updateHideoutModuleLevel: (moduleId: string, level: number) => void;
  updateTraderLevel: (traderId: string, level: number) => void;
  resetProgress: () => void;
}

const PlayerSettingsContext = createContext<PlayerSettingsContextType | undefined>(undefined);

export const usePlayerSettings = () => {
  const context = useContext(PlayerSettingsContext);
  if (context === undefined) {
    throw new Error('usePlayerSettings must be used within a PlayerSettingsProvider');
  }
  return context;
};

interface PlayerSettingsProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = '@player_settings';

export const PlayerSettingsProvider: React.FC<PlayerSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<PlayerSettings>({
    level: 1,
    faction: 'USEC',
    gameEdition: 'Standard',
    completedQuestIds: [],
    hideoutModuleLevels: {},
    traderLevels: {},
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from storage on startup
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          // Migrate old settings to new format
          const migratedSettings: PlayerSettings = {
            level: parsedSettings.level || 1,
            faction: parsedSettings.faction || 'USEC',
            gameEdition: parsedSettings.gameEdition || 'Standard',
            completedQuestIds: parsedSettings.completedQuestIds || [],
            hideoutModuleLevels: parsedSettings.hideoutModuleLevels || {},
            traderLevels: parsedSettings.traderLevels || {},
          };
          setSettings(migratedSettings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Save settings to storage whenever they change
  useEffect(() => {
    if (isLoaded) {
      const saveSettings = async () => {
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
          console.error('Error saving settings:', error);
        }
      };

      saveSettings();
    }
  }, [settings, isLoaded]);

  const updateLevel = (level: number) => {
    setSettings(prev => ({ ...prev, level }));
  };

  const updateFaction = (faction: PMCFaction) => {
    setSettings(prev => ({ ...prev, faction }));
  };

  const updateGameEdition = (gameEdition: GameEdition) => {
    setSettings(prev => ({ ...prev, gameEdition }));
  };

  const addCompletedQuest = (questId: string) => {
    setSettings(prev => ({
      ...prev,
      completedQuestIds: [...prev.completedQuestIds, questId]
    }));
  };

  const removeCompletedQuest = (questId: string) => {
    setSettings(prev => ({
      ...prev,
      completedQuestIds: prev.completedQuestIds.filter(id => id !== questId)
    }));
  };

  const updateHideoutModuleLevel = (moduleId: string, level: number) => {
    setSettings(prev => ({
      ...prev,
      hideoutModuleLevels: {
        ...prev.hideoutModuleLevels,
        [moduleId]: level
      }
    }));
  };

  const updateTraderLevel = (traderId: string, level: number) => {
    setSettings(prev => ({
      ...prev,
      traderLevels: {
        ...prev.traderLevels,
        [traderId]: level
      }
    }));
  };

  const resetProgress = () => {
    setSettings(prev => ({
      ...prev,
      completedQuestIds: [],
      hideoutModuleLevels: {},
      traderLevels: {}
    }));
  };

  return (
    <PlayerSettingsContext.Provider
      value={{
        settings,
        updateLevel,
        updateFaction,
        updateGameEdition,
        addCompletedQuest,
        removeCompletedQuest,
        updateHideoutModuleLevel,
        updateTraderLevel,
        resetProgress,
      }}
    >
      {children}
    </PlayerSettingsContext.Provider>
  );
};