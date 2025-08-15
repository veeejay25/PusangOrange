import { Image } from "expo-image";
import { Alert, Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import { AppColors } from '@/constants/Colors';

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { HideoutStation } from "@/services/tarkovApi";

export interface HideoutModuleCardProps {
  station: HideoutStation;
  currentLevel: number;
  maxLevel: number;
  displayLevel: number;
  hasEditionBonus: boolean;
  canUpgrade: boolean;
  canDowngrade: boolean;
  missingRequirements: {
    name: string;
    required: number;
    current: number;
  }[];
  onLevelChange: (stationId: string, newLevel: number) => void;
}

const screenWidth = Dimensions.get('window').width;
const moduleCardWidth = (screenWidth - 50) / 2;

export function HideoutModuleCard({
  station,
  currentLevel,
  maxLevel,
  displayLevel,
  hasEditionBonus,
  canUpgrade,
  canDowngrade,
  missingRequirements,
  onLevelChange
}: HideoutModuleCardProps) {
  const nextLevel = displayLevel + 1;
  const nextLevelData = station.levels.find(l => l.level === nextLevel);

  const handleUpgrade = () => {
    if (canUpgrade) {
      onLevelChange(station.id, currentLevel + 1);
    }
  };

  const handleDowngrade = () => {
    if (canDowngrade) {
      Alert.alert(
        'Downgrade Module',
        `Are you sure you want to downgrade ${station.name} from level ${currentLevel} to level ${currentLevel - 1}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Downgrade', 
            style: 'destructive',
            onPress: () => onLevelChange(station.id, currentLevel - 1)
          },
        ]
      );
    }
  };

  const renderRequirements = () => {
    if (displayLevel >= maxLevel) {
      return (
        <ThemedText style={[styles.moduleRequirements, { color: '#4CAF50' }]}>
          Maxed
        </ThemedText>
      );
    }
    
    if (missingRequirements.length > 0) {
      return (
        <View>
          <ThemedText style={[styles.moduleRequirements, { color: '#f44336' }]}>
            Needs:
          </ThemedText>
          {missingRequirements.slice(0, 2).map((req, index) => (
            <ThemedText key={index} style={[styles.moduleRequirements, { color: '#f44336', fontSize: 8 }]}>
              {req.name} Lv.{req.required} ({req.current}/{req.required})
            </ThemedText>
          ))}
        </View>
      );
    }
    
    if (nextLevelData && displayLevel < maxLevel) {
      return (
        <ThemedText style={styles.moduleRequirements}>
          Next: {nextLevelData.itemRequirements.length} items
        </ThemedText>
      );
    }
    
    return (
      <ThemedText style={styles.moduleRequirements}>
        Locked
      </ThemedText>
    );
  };

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
          Level {displayLevel}/{maxLevel}
          {hasEditionBonus && (
            <ThemedText style={styles.editionBonus}> (Edition Bonus)</ThemedText>
          )}
        </ThemedText>
        
        {renderRequirements()}
        
        <View style={styles.moduleControls}>
          <TouchableOpacity
            style={[
              styles.controlButton, 
              styles.downgradeButton, 
              !canDowngrade && styles.controlButtonDisabled
            ]}
            onPress={handleDowngrade}
            disabled={!canDowngrade}
          >
            <IconSymbol name="minus" size={14} color={canDowngrade ? "white" : "#ccc"} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.controlButton, 
              styles.upgradeButton, 
              !canUpgrade && styles.controlButtonDisabled
            ]}
            onPress={handleUpgrade}
            disabled={!canUpgrade}
          >
            <IconSymbol name="plus" size={14} color={canUpgrade ? "white" : "#ccc"} />
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  moduleCard: {
    width: moduleCardWidth,
    height: 200,
    backgroundColor: AppColors.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 7,
    shadowColor: AppColors.shadowLight,
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
    backgroundColor: AppColors.cardBackground,
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
    color: AppColors.textPrimary,
    lineHeight: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  moduleDetails: {
    fontSize: 10,
    color: AppColors.textSecondary,
    lineHeight: 14,
    textAlign: 'center',
  },
  moduleRequirements: {
    fontSize: 9,
    color: AppColors.textTertiary,
    lineHeight: 12,
    textAlign: 'center',
  },
  editionBonus: {
    fontSize: 9,
    color: '#4CAF50',
    fontWeight: '600',
  },
  moduleControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  upgradeButton: {
    backgroundColor: AppColors.success,
  },
  downgradeButton: {
    backgroundColor: '#f44336',
  },
  controlButtonDisabled: {
    backgroundColor: '#e0e0e0',
    shadowOpacity: 0,
    elevation: 0,
  },
});