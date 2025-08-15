import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { AppColors, Spacing } from '@/constants/Colors';

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { HideoutModuleCard } from "@/components/HideoutModuleCard";
import { usePlayerSettings } from "@/contexts/PlayerSettingsContext";
import { fetchHideoutStations, filterHideoutModulesByType, HideoutStation, getEffectiveHideoutLevel, canUpgradeHideoutStation, getMissingHideoutRequirements } from "@/services/tarkovApi";


export default function HideoutScreen() {
  const { settings, updateHideoutModuleLevel } = usePlayerSettings();
  const [allStations, setAllStations] = useState<HideoutStation[]>([]);
  const [filteredStations, setFilteredStations] = useState<HideoutStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleFilter, setModuleFilter] = useState<'available' | 'locked' | 'maxed'>('available');

  const handleLevelChange = (stationId: string, newLevel: number) => {
    updateHideoutModuleLevel(stationId, newLevel);
  };

  useEffect(() => {
    const loadHideoutStations = async () => {
      try {
        setLoading(true);
        const data = await fetchHideoutStations();
        setAllStations(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load hideout stations:', err);
        setError('Failed to load hideout modules. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadHideoutStations();
  }, []);

  // Filter stations when settings or filter changes
  useEffect(() => {
    if (allStations.length > 0 && settings) {
      const playerSettings = {
        level: settings.level || 1,
        hideoutModuleLevels: settings.hideoutModuleLevels || {},
        traderLevels: settings.traderLevels || {},
        gameEdition: settings.gameEdition || 'Standard'
      };
      
      const filtered = filterHideoutModulesByType(allStations, moduleFilter, playerSettings);
      setFilteredStations(filtered);
    }
  }, [allStations, moduleFilter, settings]);

  const renderContent = () => {
    if (loading) {
      return (
        <ThemedView style={styles.centerContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <ThemedText style={styles.loadingText}>Loading hideout modules...</ThemedText>
        </ThemedView>
      );
    }

    if (error) {
      return (
        <ThemedView style={styles.centerContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color="#ff5733" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      );
    }

    if (allStations.length === 0) {
      return (
        <ThemedView style={styles.centerContainer}>
          <IconSymbol name="house" size={48} color="#666" />
          <ThemedText style={styles.emptyText}>No hideout modules found.</ThemedText>
        </ThemedView>
      );
    }

    return (
      <>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Hideout</ThemedText>
        </ThemedView>

        {/* Filter Buttons */}
        <ThemedView style={styles.filterButtonsContainer}>
          <TouchableOpacity
            style={[styles.filterButton, moduleFilter === 'available' && styles.filterButtonActive]}
            onPress={() => setModuleFilter('available')}
          >
            <ThemedText style={[styles.filterButtonText, moduleFilter === 'available' && styles.filterButtonTextActive]}>
              Available
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, moduleFilter === 'locked' && styles.filterButtonActive]}
            onPress={() => setModuleFilter('locked')}
          >
            <ThemedText style={[styles.filterButtonText, moduleFilter === 'locked' && styles.filterButtonTextActive]}>
              Locked
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, moduleFilter === 'maxed' && styles.filterButtonActive]}
            onPress={() => setModuleFilter('maxed')}
          >
            <ThemedText style={[styles.filterButtonText, moduleFilter === 'maxed' && styles.filterButtonTextActive]}>
              Maxed
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedText style={styles.subtitle}>
          {filteredStations.length} of {allStations.length} modules
        </ThemedText>

        {filteredStations.length > 0 ? (
          <View style={styles.moduleGrid}>
            {filteredStations.reduce((rows, station, index) => {
              if (index % 2 === 0) {
                rows.push(filteredStations.slice(index, index + 2));
              }
              return rows;
            }, [] as HideoutStation[][]).map((row, rowIndex) => (
              <View key={rowIndex} style={styles.moduleRow}>
                {row.map((station) => {
                  const currentLevel = settings?.hideoutModuleLevels?.[station.id] || 0;
                  const effectiveLevel = getEffectiveHideoutLevel(station.id, station.name, settings as any);
                  const displayLevel = Math.max(currentLevel, effectiveLevel);
                  const hasEditionBonus = effectiveLevel > currentLevel;
                  
                  const playerSettings = {
                    level: settings.level || 1,
                    hideoutModuleLevels: settings.hideoutModuleLevels || {},
                    traderLevels: settings.traderLevels || {},
                    gameEdition: settings.gameEdition || 'Standard'
                  };
                  
                  const canUpgrade = canUpgradeHideoutStation(station, currentLevel, playerSettings);
                  const canDowngrade = currentLevel > 0;
                  const missingRequirements = getMissingHideoutRequirements(station, currentLevel, playerSettings);
                  
                  return (
                    <HideoutModuleCard 
                      key={station.id} 
                      station={station}
                      currentLevel={currentLevel}
                      maxLevel={station.levels.length}
                      displayLevel={displayLevel}
                      hasEditionBonus={hasEditionBonus}
                      canUpgrade={canUpgrade}
                      canDowngrade={canDowngrade}
                      missingRequirements={missingRequirements}
                      onLevelChange={handleLevelChange}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          <ThemedView style={styles.centerContainer}>
            <ThemedText style={styles.emptyText}>
              No {moduleFilter} modules found.
            </ThemedText>
          </ThemedView>
        )}
      </>
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "transparent", dark: "transparent" }}
      headerImage={<></>}
    >
      {renderContent()}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.defaultGap,
    marginLeft: Spacing.titleContainerLeft,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  errorText: {
    fontSize: 16,
    color: AppColors.error,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  moduleGrid: {
    flex: 1,
    marginHorizontal: Spacing.containerHorizontal,
    paddingHorizontal: 16,
  },
  moduleRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',  
  },
  filterButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    gap: 8,
    marginHorizontal: Spacing.containerHorizontal
  },
  filterButton: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: AppColors.filterInactive,
    borderWidth: 1,
    borderColor: AppColors.filterInactiveBorder,
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: AppColors.success,
    borderColor: AppColors.success,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
});
