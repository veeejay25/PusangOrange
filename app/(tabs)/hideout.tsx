import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { usePlayerSettings } from "@/contexts/PlayerSettingsContext";
import { fetchHideoutStations, filterHideoutModulesByType, HideoutStation } from "@/services/tarkovApi";

interface HideoutModuleCardProps {
  station: HideoutStation;
  currentLevel: number;
  maxLevel: number;
}

function HideoutModuleCard({ station, currentLevel, maxLevel }: HideoutModuleCardProps) {
  const nextLevel = currentLevel + 1;
  const nextLevelData = station.levels.find(l => l.level === nextLevel);
  
  return (
    <ThemedView style={styles.moduleCard}>
      <View style={styles.moduleImageContainer}>
        {station.imageLink ? (
          <Image
            source={{ uri: station.imageLink }}
            style={styles.moduleImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <IconSymbol name="house" size={40} color="#666" />
          </View>
        )}
      </View>
      <View style={styles.moduleInfo}>
        <ThemedText type="defaultSemiBold" style={styles.moduleName}>
          {station.name}
        </ThemedText>
        <ThemedText style={styles.moduleDetails}>
          Level {currentLevel}/{maxLevel}
        </ThemedText>
        {nextLevelData && currentLevel < maxLevel ? (
          <ThemedText style={styles.moduleRequirements}>
            Next: {nextLevelData.itemRequirements.length} items
          </ThemedText>
        ) : currentLevel >= maxLevel ? (
          <ThemedText style={[styles.moduleRequirements, { color: '#4CAF50' }]}>
            Maxed
          </ThemedText>
        ) : (
          <ThemedText style={styles.moduleRequirements}>
            Locked
          </ThemedText>
        )}
      </View>
    </ThemedView>
  );
}

export default function HideoutScreen() {
  const { settings } = usePlayerSettings();
  const [allStations, setAllStations] = useState<HideoutStation[]>([]);
  const [filteredStations, setFilteredStations] = useState<HideoutStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleFilter, setModuleFilter] = useState<'available' | 'locked' | 'maxed'>('available');

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
        traderLevels: settings.traderLevels || {}
      };
      
      const filtered = filterHideoutModulesByType(allStations, moduleFilter, playerSettings);
      setFilteredStations(filtered);
    }
  }, [allStations, moduleFilter, settings]);

  const renderContent = () => {
    if (loading) {
      return (
        <ThemedView style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#ff5733" />
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
          <ThemedText type="title">Hideout Modules</ThemedText>
        </ThemedView>
        <ThemedText style={styles.subtitle}>
          {filteredStations.length} of {allStations.length} modules
        </ThemedText>

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

        <View style={styles.moduleGrid}>
          {filteredStations.length > 0 ? (
            filteredStations.map((station) => (
              <HideoutModuleCard 
                key={station.id} 
                station={station} 
                currentLevel={settings?.hideoutModuleLevels?.[station.id] || 0}
                maxLevel={station.levels.length}
              />
            ))
          ) : (
            <ThemedView style={styles.centerContainer}>
              <ThemedText style={styles.emptyText}>
                No {moduleFilter} modules found.
              </ThemedText>
            </ThemedView>
          )}
        </View>
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

const screenWidth = Dimensions.get('window').width;
const moduleCardWidth = (screenWidth - 50) / 2; // Account for padding and gap

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 20,
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
    color: '#ff5733',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginLeft: -30,
    marginRight: -30 // Adjust for card width
  },
  moduleCard: {
    width: moduleCardWidth,
    height: moduleCardWidth,
    backgroundColor: '#ebebeb',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    shadowColor: '#c2c2c2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  moduleImageContainer: {
    width: 90,
    height: 90,
    alignSelf: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  moduleImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ebebeb',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleInfo: {
    gap: 2,
    flex: 1,
    justifyContent: 'center',
  },
  moduleName: {
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  moduleDetails: {
    fontSize: 10,
    color: '#666',
    lineHeight: 14,
    textAlign: 'center',
  },
  moduleRequirements: {
    fontSize: 9,
    color: '#888',
    lineHeight: 12,
    textAlign: 'center',
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
});
