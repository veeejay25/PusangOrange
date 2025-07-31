import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, Modal, FlatList, Alert } from "react-native";

type PMCFaction = 'USEC' | 'BEAR';
type GameEdition = 'Standard' | 'Left Behind' | 'Prepare for Escape' | 'Edge of Darkness';

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
  const [playerLevel, setPlayerLevel] = useState<string>('1');
  const [pmcFaction, setPmcFaction] = useState<PMCFaction>('USEC');
  const [gameEdition, setGameEdition] = useState<GameEdition>('Standard');
  const [factionModalVisible, setFactionModalVisible] = useState(false);
  const [editionModalVisible, setEditionModalVisible] = useState(false);

  const handleLevelChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue === '' || (parseInt(numericValue) >= 1 && parseInt(numericValue) <= 79)) {
      setPlayerLevel(numericValue);
    }
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
            Alert.alert('Progress Reset', 'Your quest progress has been reset.');
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
          setPmcFaction(item.value as PMCFaction);
          setFactionModalVisible(false);
        } else if (editionModalVisible) {
          setGameEdition(item.value as GameEdition);
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
        {/* Player Level */}
        <ThemedView style={styles.settingItem}>
          <ThemedText type="subtitle" style={styles.settingLabel}>
            Player Level
          </ThemedText>
          <TextInput
            style={styles.levelInput}
            value={playerLevel}
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
            <ThemedText style={styles.dropdownText}>{pmcFaction}</ThemedText>
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
            <ThemedText style={styles.dropdownText}>{gameEdition}</ThemedText>
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
    gap: 8,
    marginBottom: 24,
  },
  settingsContainer: {
    paddingHorizontal: 16,
    gap: 20,
  },
  settingItem: {
    gap: 8,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  levelInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  resetButton: {
    backgroundColor: '#ff4444',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    marginBottom: 16,
    textAlign: 'center',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
});
