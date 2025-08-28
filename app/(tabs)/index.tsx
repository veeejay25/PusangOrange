import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, ActivityIndicator } from "react-native";
import { AppColors, Spacing } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import FlexibleTracker from "../../components/ProgressTracker";
import { useProgressData } from "@/hooks/useProgressData";
import { usePlayerSettings } from "@/contexts/PlayerSettingsContext";

export default function Profile() {
  const { questProgress, kappaProgress, hideoutProgress, isLoading, error } = useProgressData();
  const { settings } = usePlayerSettings();
  const [isKappaMode, setIsKappaMode] = useState(false);
  
  // Theme colors
  const cardBackground = useThemeColor({}, 'cardBackground');
  const textPrimary = useThemeColor({}, 'textPrimary');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const shadowColor = useThemeColor({}, 'shadowColor');

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
          <ActivityIndicator size="large" color={AppColors.primary} />
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
        <ThemedText type="title">{settings.playerName}</ThemedText>
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
          containerStyle={[styles.eftTrackerContainer, { backgroundColor: cardBackground, shadowColor }]}
          headerStyle={styles.compactHeader}
          titleStyle={[styles.trackerTitle, { color: textPrimary }]}
          subtitleStyle={[styles.trackerSubtitle, { color: textSecondary }]}
          progressContainerStyle={styles.progressContainer}
          toggleButtonStyle={styles.toggleButton}
          primaryColor="#ff5733"
          secondaryColor="#ff8a5f"
          backgroundColor={cardBackground}
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
          containerStyle={[styles.hideoutTrackerContainer, { backgroundColor: cardBackground, shadowColor }]}
          headerStyle={styles.compactHeader}
          titleStyle={[styles.trackerTitle, { color: textPrimary }]}
          subtitleStyle={[styles.trackerSubtitle, { color: textSecondary }]}
          progressContainerStyle={styles.progressContainer}
          primaryColor="#ff5733"
          backgroundColor={cardBackground}
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
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.defaultGap,
    marginLeft: Spacing.titleContainerLeft,
    marginBottom: Spacing.xl,
  },

  // Trackers Section
  trackersContainer: {
    gap: 10,
    marginTop: 50,
  },
  eftTrackerContainer: {
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  hideoutTrackerContainer: {
    borderRadius: 12,
    padding: 16,
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
  },
  trackerSubtitle: {
    fontSize: 14,
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
    color: AppColors.error,
    textAlign: "center",
  },
});
