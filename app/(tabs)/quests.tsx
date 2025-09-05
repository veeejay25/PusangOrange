import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { usePlayerSettings } from "@/contexts/PlayerSettingsContext";
import {
  fetchQuestsByTrader,
  fetchTraders,
  filterQuestsByType,
  Quest,
  Trader,
} from "@/services/tarkovApi";
import { isKappaQuest } from "@/utils/progressCalculator";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { AppColors, Spacing } from "@/constants/Colors";

export default function Quests() {
  const { settings, addCompletedQuest, removeCompletedQuest } =
    usePlayerSettings();
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(false);
  const [allTraderQuests, setAllTraderQuests] = useState<Quest[]>([]);
  const [questFilter, setQuestFilter] = useState<
    "available" | "locked" | "completed"
  >("available");

  useEffect(() => {
    const loadTraders = async () => {
      try {
        setLoading(true);
        const traderData = await fetchTraders();
        setTraders(traderData);

        // Set Prapor as default selected trader
        const prapor = traderData.find(
          (trader) => trader.name.toLowerCase() === "prapor"
        );
        if (prapor) {
          setSelectedTrader(prapor);
          // Load Prapor's quests by default
          setQuestsLoading(true);
          try {
            const traderQuests = await fetchQuestsByTrader(prapor.id);
            setAllTraderQuests(traderQuests);

            const playerSettings = {
              level: settings.level,
              faction: settings.faction,
              playerName: settings.playerName,
              completedQuestIds: settings.completedQuestIds,
              traderLevels: settings.traderLevels,
              gameEdition: settings.gameEdition,
            };

            const filteredQuests = filterQuestsByType(
              traderQuests,
              "available",
              playerSettings
            );
            setQuests(filteredQuests);
          } catch (questErr) {
            setError(
              questErr instanceof Error
                ? questErr.message
                : "Failed to load default quests"
            );
          } finally {
            setQuestsLoading(false);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load traders");
      } finally {
        setLoading(false);
      }
    };

    loadTraders();
  }, [
    settings.completedQuestIds,
    settings.faction,
    settings.level,
    settings.traderLevels,
    settings.gameEdition,
    settings.playerName,
  ]);

  // Re-filter quests when settings change
  useEffect(() => {
    if (allTraderQuests.length > 0) {
      const playerSettings = {
        level: settings.level,
        faction: settings.faction,
        playerName: settings.playerName,
        completedQuestIds: settings.completedQuestIds,
        traderLevels: settings.traderLevels,
        gameEdition: settings.gameEdition,
      };

      const filteredQuests = filterQuestsByType(
        allTraderQuests,
        questFilter,
        playerSettings
      );
      setQuests(filteredQuests);
    }
  }, [
    settings.level,
    settings.faction,
    settings.completedQuestIds,
    settings.traderLevels,
    settings.gameEdition,
    settings.playerName,
    questFilter,
    allTraderQuests,
  ]);

  const handleTraderSelect = async (trader: Trader) => {
    setSelectedTrader(trader);
    setQuestsLoading(true);
    try {
      const traderQuests = await fetchQuestsByTrader(trader.id);
      setAllTraderQuests(traderQuests);

      const playerSettings = {
        level: settings.level,
        faction: settings.faction,
        playerName: settings.playerName,
        completedQuestIds: settings.completedQuestIds,
        traderLevels: settings.traderLevels,
        gameEdition: settings.gameEdition,
      };

      const filteredQuests = filterQuestsByType(
        traderQuests,
        questFilter,
        playerSettings
      );
      setQuests(filteredQuests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quests");
    } finally {
      setQuestsLoading(false);
    }
  };

  const handleFilterChange = (filter: "available" | "locked" | "completed") => {
    setQuestFilter(filter);

    const playerSettings = {
      level: settings.level,
      faction: settings.faction,
      playerName: settings.playerName,
      completedQuestIds: settings.completedQuestIds,
      traderLevels: settings.traderLevels,
      gameEdition: settings.gameEdition,
    };

    const filteredQuests = filterQuestsByType(
      allTraderQuests,
      filter,
      playerSettings
    );
    setQuests(filteredQuests);
  };

  const renderTrader = ({ item }: { item: Trader }) => (
    <TouchableOpacity
      style={[
        styles.traderStory,
        selectedTrader?.id === item.id && styles.selectedTrader,
      ]}
      onPress={() => handleTraderSelect(item)}
    >
      <View style={styles.traderImageContainer}>
        <Image
          source={{ uri: item.imageLink || "https://via.placeholder.com/80" }}
          style={styles.traderImage}
          contentFit="cover"
        />
      </View>
      <ThemedText style={styles.traderName} numberOfLines={1}>
        {item.name}
      </ThemedText>
    </TouchableOpacity>
  );

  const handleQuestCompletion = (questId: string, isCompleted: boolean) => {
    if (isCompleted) {
      addCompletedQuest(questId);
    } else {
      removeCompletedQuest(questId);
    }
  };

  const renderQuest = ({ item }: { item: Quest }) => {
    const isCompleted = settings.completedQuestIds.includes(item.id);

    return (
      <ThemedView style={styles.questItem}>
        <View style={styles.questHeader}>
          <ThemedText type="defaultSemiBold" style={styles.questTitle}>
            {item.name}
          </ThemedText>
          <View style={styles.questActions}>
            {isKappaQuest(item) && (
              <View style={styles.kappaBanner}>
                <ThemedText style={styles.kappaText}>KAPPA</ThemedText>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.completionButton,
                isCompleted && styles.completionButtonCompleted,
              ]}
              onPress={() => handleQuestCompletion(item.id, !isCompleted)}
            >
              <ThemedText
                style={[
                  styles.completionButtonText,
                  isCompleted && styles.completionButtonTextCompleted,
                ]}
              >
                {isCompleted ? "✓" : "○"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        <ThemedText style={styles.questExperience}>
          {item.experience} XP
        </ThemedText>
        {item.objectives.slice(0, 2).map((objective) => (
          <ThemedText key={objective.id} style={styles.questObjective}>
            • {objective.description}
          </ThemedText>
        ))}
        {item.objectives.length > 2 && (
          <ThemedText style={styles.moreObjectives}>
            +{item.objectives.length - 2} more objectives
          </ThemedText>
        )}
      </ThemedView>
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "transparent", dark: "transparent" }}
      headerImage={<></>}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Traders</ThemedText>
      </ThemedView>

      {loading ? (
        <ThemedView style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <ThemedText>Loading traders...</ThemedText>
        </ThemedView>
      ) : error ? (
        <ThemedView style={styles.centerContainer}>
          <ThemedText type="defaultSemiBold" style={styles.errorText}>
            Error: {error}
          </ThemedText>
        </ThemedView>
      ) : (
        <>
          <FlatList
            data={traders}
            renderItem={renderTrader}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.traderList}
            contentContainerStyle={styles.traderListContent}
          />

          {selectedTrader && (
            <ThemedView style={styles.questsSection}>
              <ThemedText type="subtitle" style={styles.questsTitle}>
                {selectedTrader.name} Quests
              </ThemedText>

              {/* Filter Buttons */}
              <ThemedView style={styles.filterButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    questFilter === "available" && styles.filterButtonActive,
                  ]}
                  onPress={() => handleFilterChange("available")}
                >
                  <ThemedText
                    style={[
                      styles.filterButtonText,
                      questFilter === "available" &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    Available
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    questFilter === "locked" && styles.filterButtonActive,
                  ]}
                  onPress={() => handleFilterChange("locked")}
                >
                  <ThemedText
                    style={[
                      styles.filterButtonText,
                      questFilter === "locked" && styles.filterButtonTextActive,
                    ]}
                  >
                    Locked
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    questFilter === "completed" && styles.filterButtonActive,
                  ]}
                  onPress={() => handleFilterChange("completed")}
                >
                  <ThemedText
                    style={[
                      styles.filterButtonText,
                      questFilter === "completed" &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    Completed
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>

              {questsLoading ? (
                <ThemedView style={styles.centerContainer}>
                  <ActivityIndicator size="large" />
                  <ThemedText>Loading quests...</ThemedText>
                </ThemedView>
              ) : quests.length > 0 ? (
                <FlatList
                  data={quests}
                  renderItem={renderQuest}
                  keyExtractor={(item) => item.id}
                  style={styles.questsList}
                  scrollEnabled={false}
                />
              ) : (
                <ThemedText style={styles.noQuestsText}>
                  No available quests for this trader
                </ThemedText>
              )}
            </ThemedView>
          )}
        </>
      )}
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
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: AppColors.error,
    textAlign: "center",
  },
  traderList: {
    marginHorizontal: Spacing.containerHorizontal,
  },
  traderListContent: {
    paddingHorizontal: 16,
  },
  traderItem: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: AppColors.filterInactive,
  },
  traderStory: {
    alignItems: "center",
    marginHorizontal: 1,
    width: 80,
  },
  traderImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    padding: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  traderImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  traderName: {
    fontSize: 12,
    textAlign: "center",
    maxWidth: 80,
  },
  selectedTrader: {
    backgroundColor: "rgba(161, 206, 220, 0.3)",
    borderRadius: 8,
  },
  questsSection: {
    paddingHorizontal: 16,
  },
  questsTitle: {
    marginBottom: 10,
    marginLeft: Spacing.containerHorizontal,
  },
  questsList: {
    flex: 1,
    marginHorizontal: Spacing.containerHorizontal,
  },
  questItem: {
    padding: 16,
    marginVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderWidth: 1,
    borderColor: AppColors.filterInactiveBorder,
  },
  questHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  questActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  questTitle: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  kappaBanner: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  kappaText: {
    color: "#333",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  questExperience: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
    marginBottom: 10,
  },
  questObjective: {
    fontSize: 13,
    marginVertical: 2,
    paddingLeft: 8,
  },
  moreObjectives: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
    paddingLeft: 8,
  },
  noQuestsText: {
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 20,
  },
  filterButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
    paddingHorizontal: 16,
    gap: 8,
    marginLeft: -45,
    marginRight: -45,
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
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "white",
  },
  completionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.filterInactive,
    borderWidth: 2,
    borderColor: AppColors.filterInactiveBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  completionButtonCompleted: {
    backgroundColor: AppColors.success,
    borderColor: AppColors.success,
  },
  completionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "rgba(0, 0, 0, 0.5)",
  },
  completionButtonTextCompleted: {
    color: "white",
  },
});
