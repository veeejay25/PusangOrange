import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Image } from "expo-image";
import { StyleSheet } from "react-native";
import FlexibleTracker from "../../components/ProgressTracker";

export default function Profile() {
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
      <FlexibleTracker
        title="Escape from Tarkov Progress"
        showProgressBar={true}
        showToggleButton={true}
        containerStyle={{
          backgroundColor: "#F0F0F0",

          borderWidth: 1,

          borderColor: "#4CAF50",
        }}
        progressBarStyle={{
          height: 12,

          borderRadius: 6,
        }}
        primaryColor="#4CAF50"
        onPress={() => console.log("Tracker pressed")}
      />
      <FlexibleTracker
        title="Hideout Progress"
        showProgressBar={true}
        showToggleButton={false}
        containerStyle={{
          backgroundColor: "#F0F0F0",

          borderWidth: 1,

          borderColor: "#4CAF50",
        }}
        progressBarStyle={{
          height: 12,

          borderRadius: 6,
        }}
        primaryColor="#4CAF50"
        onPress={() => console.log("Tracker pressed")}
      />
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
