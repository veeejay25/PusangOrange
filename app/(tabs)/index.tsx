import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, ActivityIndicator } from "react-native";
import FlexibleTracker from "../../components/ProgressTracker";
import { useProgressData } from "@/hooks/useProgressData";

export default function Profile() {
  const { questProgress, kappaProgress, hideoutProgress, isLoading, error } = useProgressData();
  const [isKappaMode, setIsKappaMode] = useState(false);

  const handleEftToggle = () => {
    setIsKappaMode(!isKappaMode);
  };

  const currentQuestProgress = isKappaMode ? kappaProgress : questProgress;

  if (isLoading) {
    return (
      <ParallaxScrollView
        headerBackgroundColor={{ light: "transparent", dark: "transparent" }}
        headerImage={<></>}
      >
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff5733" />
          <ThemedText style={styles.loadingText}>Loading progress data...</ThemedText>
        </ThemedView>
      </ParallaxScrollView>
    );
  }

  if (error) {
    return (
      <ParallaxScrollView
        headerBackgroundColor={{ light: "transparent", dark: "transparent" }}
        headerImage={<></>}
      >
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
        </ThemedView>
      </ParallaxScrollView>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "transparent", dark: "transparent" }}
      headerImage={<></>}
    >
      {/* Profile Picture */}
      <ThemedView style={styles.profilePicContainer}>
        <Image
          source={require("@/assets/images/react-logo.png")}
          style={styles.profilePic}
        />
      </ThemedView>

      {/* Username */}
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Pusang Orange</ThemedText>
      </ThemedView>

      {/* Trackers Section */}
      <ThemedView style={styles.trackersContainer}>
        {/* Escape from Tarkov Tracker */}
        <FlexibleTracker
          title={isKappaMode ? "Kappa Progress" : "Quest Progress"}
          subtitle={`${currentQuestProgress.completed}/${currentQuestProgress.total} quests completed`}
          showSubtitle={true}
          showProgressBar={true}
          showToggleButton={true}
          showProgressText={true}
          activeButtonText="Kappa"
          inactiveButtonText="EFT"
          maxProgress={currentQuestProgress.percentage}
          animateProgress={true}
          animationDuration={2000}
          initialState={isKappaMode}
          containerStyle={styles.eftTrackerContainer}
          headerStyle={styles.compactHeader}
          titleStyle={styles.trackerTitle}
          subtitleStyle={styles.trackerSubtitle}
          progressContainerStyle={styles.progressContainer}
          toggleButtonStyle={styles.toggleButton}
          primaryColor="#ff5733"
          secondaryColor="#ff8a5f"
          backgroundColor="#4c4c4c"
          onTogglePress={handleEftToggle}
        />

        {/* Hideout Progress Tracker */}
        <FlexibleTracker
          title="Hideout Progress"
          subtitle={`${hideoutProgress.completed}/${hideoutProgress.total} levels completed`}
          showSubtitle={true}
          showProgressBar={true}
          showToggleButton={false}
          showProgressText={true}
          maxProgress={hideoutProgress.percentage}
          animateProgress={true}
          animationDuration={2500}
          containerStyle={styles.hideoutTrackerContainer}
          headerStyle={styles.compactHeader}
          titleStyle={styles.trackerTitle}
          subtitleStyle={styles.trackerSubtitle}
          progressContainerStyle={styles.progressContainer}
          primaryColor="#ff5733"
          backgroundColor="#2a2a2a"
        />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  // Profile Section
  profilePicContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  profilePic: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#ccc",
    borderWidth: 3,
    borderColor: "#fff",
  },
  titleContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 30,
  },

  // Trackers Section
  trackersContainer: {
    gap: 10,
    marginTop: 50,
  },
  eftTrackerContainer: {
    backgroundColor: "#ebebeb",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#c2c2c2",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  hideoutTrackerContainer: {
    backgroundColor: "#ebebeb",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#c2c2c2",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },

  // Shared Tracker Styles
  compactHeader: {
    marginBottom: 8,
  },
  trackerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
  },
  trackerSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  progressContainer: {
    height: 12,
    borderRadius: 6,
    backgroundColor: "#444",
    marginVertical: 8,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ff5733",
    textAlign: "center",
  },
});
