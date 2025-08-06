import { useState, useEffect } from 'react';
import { usePlayerSettings } from '@/contexts/PlayerSettingsContext';
import { fetchTraders, fetchHideoutStations, fetchKappaRequiredQuests, Quest, HideoutStation } from '@/services/tarkovApi';
import { calculateQuestProgress, calculateHideoutProgress, setKappaQuests, QuestProgress, HideoutProgress } from '@/utils/progressCalculator';

interface ProgressData {
  questProgress: QuestProgress;
  kappaProgress: QuestProgress;
  hideoutProgress: HideoutProgress;
  isLoading: boolean;
  error: string | null;
}

export const useProgressData = () => {
  const { settings } = usePlayerSettings();
  const [progressData, setProgressData] = useState<ProgressData>({
    questProgress: { completed: 0, total: 0, percentage: 0 },
    kappaProgress: { completed: 0, total: 0, percentage: 0 },
    hideoutProgress: { completed: 0, total: 0, percentage: 0 },
    isLoading: true,
    error: null,
  });

  const [allQuests, setAllQuests] = useState<Quest[]>([]);
  const [allStations, setAllStations] = useState<HideoutStation[]>([]);

  useEffect(() => {
    const loadProgressData = async () => {
      try {
        setProgressData(prev => ({ ...prev, isLoading: true, error: null }));

        // Fetch all data in parallel
        const [, stations] = await Promise.all([
          fetchTraders(),
          fetchHideoutStations(),
          fetchKappaRequiredQuests()
        ]);
        
        // Fetch all quests once to avoid duplicates
        // We already have all tasks from the kappa quest call - let's reuse that
        const allTasksResponse = await fetch('https://api.tarkov.dev/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
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
            `
          })
        });
        
        const allTasksResult = await allTasksResponse.json();
        const allQuestsFlat = allTasksResult.data?.tasks || [];
        
        // Filter kappa quests from all quests using kappaRequired field
        const kappaQuestsFromAll = allQuestsFlat.filter((q: Quest) => q.kappaRequired === true);
        
        // Set the kappa quests cache for use in progress calculations
        setKappaQuests(kappaQuestsFromAll);
        
        setAllQuests(allQuestsFlat);
        setAllStations(stations);

        // Calculate progress
        const questProgress = calculateQuestProgress(allQuestsFlat, settings, false);
        const kappaProgress = calculateQuestProgress(allQuestsFlat, settings, true);
        const hideoutProgress = calculateHideoutProgress(stations, settings);

        setProgressData({
          questProgress,
          kappaProgress,
          hideoutProgress,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error loading progress data:', error);
        setProgressData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load progress data',
        }));
      }
    };

    loadProgressData();
  }, [settings.completedQuestIds, settings.hideoutModuleLevels, settings.level, settings.faction, settings.traderLevels, settings.gameEdition]);

  // Recalculate progress when settings change without refetching data
  useEffect(() => {
    if (allQuests.length > 0 && allStations.length > 0 && !progressData.isLoading) {
      const questProgress = calculateQuestProgress(allQuests, settings, false);
      const kappaProgress = calculateQuestProgress(allQuests, settings, true);
      const hideoutProgress = calculateHideoutProgress(allStations, settings);

      setProgressData(prev => ({
        ...prev,
        questProgress,
        kappaProgress,
        hideoutProgress,
      }));
    }
  }, [settings.completedQuestIds, settings.hideoutModuleLevels, settings.level, settings.faction, settings.traderLevels, settings.gameEdition, allQuests, allStations, progressData.isLoading]);

  return progressData;
};