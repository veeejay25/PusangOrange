import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useState, useEffect } from "react";
import { StyleSheet, TextInput, TouchableOpacity, Modal, FlatList, Alert } from "react-native";
import { AppColors, Spacing } from '@/constants/Colors';
import { usePlayerSettings, PMCFaction, GameEdition } from "@/contexts/PlayerSettingsContext";
import { PersistentStorage } from "@/services/persistentStorage";

interface DropdownItem {
  label: string;
  value: string;
}

const PMC_FACTIONS: DropdownItem[] = [
  { label: 'USEC', value: 'USEC' },
  { label: 'BEAR', value: 'BEAR' },
];

const GAME_EDITIONS: DropdownItem[] = [
  { label: 'Standard Edition', value: 'Standard' },
  { label: 'Left Behind Edition', value: 'Left Behind' },
  { label: 'Prepare for Escape Edition', value: 'Prepare for Escape' },
  { label: 'Edge of Darkness Edition', value: 'Edge of Darkness' },
];

export default function Settings() {
  const { settings, updateLevel, updateFaction, updateGameEdition, updatePlayerName, resetProgress } = usePlayerSettings();
  const [levelInput, setLevelInput] = useState<string>(settings.level.toString());
  const [playerNameInput, setPlayerNameInput] = useState<string>(settings.playerName);
  const [factionModalVisible, setFactionModalVisible] = useState(false);
  const [editionModalVisible, setEditionModalVisible] = useState(false);

  // Update inputs when settings change (e.g., when loaded from storage)
  useEffect(() => {
    setLevelInput(settings.level.toString());
    setPlayerNameInput(settings.playerName);
  }, [settings.level, settings.playerName]);

  const handleLevelChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue === '' || (parseInt(numericValue) >= 1 && parseInt(numericValue) <= 79)) {
      setLevelInput(numericValue);
      if (numericValue !== '') {
        updateLevel(parseInt(numericValue));
      }
    }
  };

  const handlePlayerNameChange = (text: string) => {
    const trimmedText = text.slice(0, 30); // Limit to 30 characters
    setPlayerNameInput(trimmedText);
    updatePlayerName(trimmedText);
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all quest progress? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            resetProgress();
            Alert.alert('Progress Reset', 'Your quest progress has been reset.');
          }
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear API Data',
      'This will clear all cached API data (quests, traders, hideout). User settings will be preserved. The app will fetch fresh data from the API on next use.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear API Data', 
          style: 'default',
          onPress: async () => {
            await PersistentStorage.clearAllApiData();
            Alert.alert('API Data Cleared', 'All cached API data has been cleared. User settings preserved.');
          }
        },
      ]
    );
  };

  const renderDropdownItem = ({ item }: { item: DropdownItem }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => {
        if (factionModalVisible) {
          updateFaction(item.value as PMCFaction);
          setFactionModalVisible(false);
        } else if (editionModalVisible) {
          updateGameEdition(item.value as GameEdition);
          setEditionModalVisible(false);
        }
      }}
    >
      <ThemedText>{item.label}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "transparent", dark: "transparent" }}
      headerImage={<></>}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Settings</ThemedText>
      </ThemedView>

      <ThemedView style={styles.settingsContainer}>
        {/* Player Name */}
        <ThemedView style={styles.settingItem}>
          <ThemedText type="subtitle" style={styles.settingLabel}>
            Player Name
          </ThemedText>
          <TextInput
            style={styles.textInput}
            value={playerNameInput}
            onChangeText={handlePlayerNameChange}
            placeholder="Enter your player name"
            placeholderTextColor="#666"
            maxLength={30}
          />
        </ThemedView>

        {/* Player Level */}
        <ThemedView style={styles.settingItem}>
          <ThemedText type="subtitle" style={styles.settingLabel}>
            Player Level
          </ThemedText>
          <TextInput
            style={styles.textInput}
            value={levelInput}
            onChangeText={handleLevelChange}
            keyboardType="numeric"
            placeholder="Enter level (1-79)"
            placeholderTextColor="#666"
            maxLength={2}
          />
        </ThemedView>

        {/* PMC Faction */}
        <ThemedView style={styles.settingItem}>
          <ThemedText type="subtitle" style={styles.settingLabel}>
            PMC Faction
          </ThemedText>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setFactionModalVisible(true)}
          >
            <ThemedText style={styles.dropdownText}>{settings.faction}</ThemedText>
            <ThemedText style={styles.dropdownArrow}>▼</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Game Edition */}
        <ThemedView style={styles.settingItem}>
          <ThemedText type="subtitle" style={styles.settingLabel}>
            Game Edition
          </ThemedText>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setEditionModalVisible(true)}
          >
            <ThemedText style={styles.dropdownText}>{settings.gameEdition}</ThemedText>
            <ThemedText style={styles.dropdownArrow}>▼</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Reset Progress Button */}
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetProgress}
        >
          <ThemedText style={styles.resetButtonText}>Reset Quest Progress</ThemedText>
        </TouchableOpacity>

        {/* Clear API Data Button */}
        <TouchableOpacity
          style={styles.cacheButton}
          onPress={handleClearCache}
        >
          <ThemedText style={styles.cacheButtonText}>Clear API Data</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* PMC Faction Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={factionModalVisible}
        onRequestClose={() => setFactionModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFactionModalVisible(false)}
        >
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Select PMC Faction
            </ThemedText>
            <FlatList
              data={PMC_FACTIONS}
              renderItem={renderDropdownItem}
              keyExtractor={(item) => item.value}
            />
          </ThemedView>
        </TouchableOpacity>
      </Modal>

      {/* Game Edition Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editionModalVisible}
        onRequestClose={() => setEditionModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditionModalVisible(false)}
        >
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Select Game Edition
            </ThemedText>
            <FlatList
              data={GAME_EDITIONS}
              renderItem={renderDropdownItem}
              keyExtractor={(item) => item.value}
            />
          </ThemedView>
        </TouchableOpacity>
      </Modal>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.defaultGap,
    marginLeft: Spacing.titleContainerLeft,
  },
  settingsContainer: {
    marginHorizontal: Spacing.containerHorizontal,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  settingItem: {
    gap: Spacing.xs,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: AppColors.filterInactiveBorder,
    borderRadius: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    backgroundColor: AppColors.filterInactive,
    color: AppColors.textPrimary,
    marginBottom: -10,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.filterInactiveBorder,
    borderRadius: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: AppColors.filterInactive,
    marginBottom: -10,
  },
  dropdownText: {
    fontSize: 16,
    color: AppColors.textPrimary,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  resetButton: {
    backgroundColor: AppColors.error,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cacheButton: {
    backgroundColor: AppColors.info,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cacheButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: AppColors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    minWidth: 280,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  dropdownItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
});
