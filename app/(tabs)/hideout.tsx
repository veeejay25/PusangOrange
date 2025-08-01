import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, StyleSheet, View } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { fetchHideoutStations, HideoutStation } from "@/services/tarkovApi";

interface HideoutModuleCardProps {
  station: HideoutStation;
}

function HideoutModuleCard({ station }: HideoutModuleCardProps) {
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
          {station.levels.length} levels available
        </ThemedText>
        {station.levels[0] && (
          <ThemedText style={styles.moduleRequirements}>
            Level 1: {station.levels[0].itemRequirements.length} items required
          </ThemedText>
        )}
      </View>
    </ThemedView>
  );
}

export default function HideoutScreen() {
  const [stations, setStations] = useState<HideoutStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHideoutStations = async () => {
      try {
        setLoading(true);
        const data = await fetchHideoutStations();
        setStations(data);
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

    if (stations.length === 0) {
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
          <ThemedText style={styles.subtitle}>
            {stations.length} modules available
          </ThemedText>
        </ThemedView>

        <View style={styles.moduleGrid}>
          {stations.map((station) => (
            <HideoutModuleCard key={station.id} station={station} />
          ))}
        </View>
      </>
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="house"
          style={styles.headerImage}
        />
      }
    >
      {renderContent()}
    </ParallaxScrollView>
  );
}

const screenWidth = Dimensions.get('window').width;
const moduleCardWidth = (screenWidth - 50) / 2; // Account for padding and gap

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
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
});
