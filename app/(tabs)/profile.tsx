import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Image } from "expo-image";
import { StyleSheet, Switch } from "react-native";
import { useState } from "react";

export default function Profile() {
  const [toggleValue, setToggleValue] = useState(false);
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.profilePicContainer}>
        <Image
          source={require("@/assets/images/react-logo.png")}
          style={styles.profilePic}
        />
      </ThemedView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Pusang Orange</ThemedText>
      </ThemedView>
      {/* Progress Bar Section */}
      <ThemedView style={styles.progressSection}>
        <ThemedText type="subtitle" style={styles.progressTitle}>
          Escape from Tarkov Progress:
        </ThemedText>
        <ThemedView style={styles.progressBarBackground}>
          <ThemedView style={styles.progressBarFill} />
        </ThemedView>
        {/* Toggle Button Section - moved inside progressSection to avoid gap */}
        <ThemedView style={styles.toggleSection}>
          <ThemedText style={styles.toggleLabel}>Kappa</ThemedText>
          <Switch value={toggleValue} onValueChange={setToggleValue} />
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginBottom: 100,
  },
  profilePicContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 0,
  },
  profilePic: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#ccc",
    borderWidth: 2,
    borderColor: "#fff",
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  progressSection: {
    marginHorizontal: 32,
    marginBottom: 16,
  },
  progressTitle: {
    marginBottom: 8,
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "left",
  },
  progressBarBackground: {
    height: 12,
    width: "100%",
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    width: "60%", // Example progress
    backgroundColor: "#4caf50",
    borderRadius: 8,
  },
  toggleSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 0,
    gap: 8,
    width: "100%",
  },
  toggleLabel: {
    fontSize: 16,
    marginRight: 8,
  },
});
