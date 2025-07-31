import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { fetchQuestsByTrader, fetchTraders, filterAvailableQuests, Quest, Trader } from "@/services/tarkovApi";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";

export default function Quests() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(false);
  const [completedQuestIds] = useState<string[]>([]);

  useEffect(() => {
    const loadTraders = async () => {
      try {
        setLoading(true);
        const traderData = await fetchTraders();
        setTraders(traderData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load traders');
      } finally {
        setLoading(false);
      }
    };

    loadTraders();
  }, []);

  const handleTraderSelect = async (trader: Trader) => {
    setSelectedTrader(trader);
    setQuestsLoading(true);
    try {
      const traderQuests = await fetchQuestsByTrader(trader.id);
      const availableQuests = filterAvailableQuests(traderQuests, completedQuestIds);
      setQuests(availableQuests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quests');
    } finally {
      setQuestsLoading(false);
    }
  };

  const renderTrader = ({ item }: { item: Trader }) => (
    <TouchableOpacity 
      style={[styles.traderStory, selectedTrader?.id === item.id && styles.selectedTrader]}
      onPress={() => handleTraderSelect(item)}
    >
      <View style={styles.traderImageContainer}>
        <Image
          source={{ uri: item.imageLink || 'https://via.placeholder.com/80' }}
          style={styles.traderImage}
          contentFit="cover"
        />
      </View>
      <ThemedText style={styles.traderName} numberOfLines={1}>
        {item.name}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderQuest = ({ item }: { item: Quest }) => (
    <ThemedView style={styles.questItem}>
      <ThemedText type="defaultSemiBold" style={styles.questTitle}>
        {item.name}
      </ThemedText>
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
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
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
    color: "red",
    textAlign: "center",
  },
  traderList: {
    marginVertical: 10,
    marginHorizontal: -30,
  },
  traderListContent: {
    paddingHorizontal: 16,
  },
  traderItem: {
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
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
    marginTop: 4,
    maxWidth: 80,
  },
  selectedTrader: {
    backgroundColor: "rgba(161, 206, 220, 0.3)",
    borderRadius: 8,
  },
  questsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  questsTitle: {
    marginBottom: 16,
  },
  questsList: {
    flex: 1,
    marginHorizontal: -30,
  },
  questItem: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  questTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  questExperience: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
    marginBottom: 8,
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
  }
});
