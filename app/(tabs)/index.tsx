import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet } from "react-native";
import FlexibleTracker from "../../components/ProgressTracker";

export default function Profile() {
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
          title="Escape from Tarkov"
          showSubtitle={false}
          showProgressBar={true}
          showToggleButton={true}
          activeButtonText="Kappa"
          inactiveButtonText="EFT"
          containerStyle={styles.eftTrackerContainer}
          headerStyle={styles.compactHeader}
          titleStyle={styles.trackerTitle}
          progressContainerStyle={styles.progressContainer}
          toggleButtonStyle={styles.toggleButton}
          primaryColor="#ff5733"
          secondaryColor="#ff8a5f"
          backgroundColor="#4c4c4c"
          onTogglePress={() => console.log("EFT/Kappa toggled")}
        />

        {/* Hideout Progress Tracker */}
        <FlexibleTracker
          title="Hideout Progress"
          showSubtitle={false}
          showProgressBar={true}
          showToggleButton={false}
          containerStyle={styles.hideoutTrackerContainer}
          headerStyle={styles.compactHeader}
          titleStyle={styles.trackerTitle}
          progressContainerStyle={styles.progressContainer}
          primaryColor="#ff5733"
          backgroundColor="#2a2a2a"
          maxProgress={75} // Example: 75% complete
          animationDuration={2500}
          onProgressChange={(progress) => {
            if (progress === 75) {
              console.log("Hideout progress complete!");
            }
          }}
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
});
