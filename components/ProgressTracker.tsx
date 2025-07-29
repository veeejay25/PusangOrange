import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Dimensions,
} from "react-native";

// Comprehensive Type Definitions
interface FlexibleTrackerProps {
  // Core Configuration
  title?: string;
  subtitle?: string;

  // Visibility Options
  showProgressBar?: boolean;
  showToggleButton?: boolean;

  // Progress Options
  initialProgress?: number;
  maxProgress?: number;

  // State Management
  initialState?: boolean;

  // Styling
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  progressBarStyle?: ViewStyle;

  // Colors
  primaryColor?: string;
  secondaryColor?: string;

  // Custom Render Props
  LeftComponent?: React.ReactNode;
  RightComponent?: React.ReactNode;

  // Callbacks
  onStateChange?: (newState: boolean) => void;
  onProgressChange?: (progress: number) => void;
  onPress?: () => void;
}

const FlexibleTracker: React.FC<FlexibleTrackerProps> = ({
  // Default Props
  title = "Progress Tracker",
  subtitle = "",
  showProgressBar = true,
  showToggleButton = true,
  initialProgress = 0,
  maxProgress = 100,
  initialState = true,

  // Styling Defaults
  containerStyle = {},
  titleStyle = {},
  subtitleStyle = {},
  progressBarStyle = {},

  // Color Defaults
  primaryColor = "#4CAF50",
  secondaryColor = "#2196F3",

  // Custom Components
  LeftComponent,
  RightComponent,

  // Callback Handlers
  onStateChange,
  onProgressChange,
  onPress,
}) => {
  // State Management
  const [isActiveState, setIsActiveState] = useState(initialState);
  const [currentProgress, setCurrentProgress] = useState(initialProgress);

  // Animated Progress
  const progressAnimation = useRef(new Animated.Value(initialProgress)).current;

  // Progress Animation Logic
  useEffect(() => {
    // Only animate if progress bar is shown
    if (showProgressBar) {
      const animation = Animated.timing(progressAnimation, {
        toValue: maxProgress,
        duration: 4000,
        useNativeDriver: false,
      });

      animation.start(({ finished }) => {
        if (finished) {
          onProgressChange?.(maxProgress);
        }
      });

      progressAnimation.addListener(({ value }) => {
        const calculatedProgress = Math.round((value / maxProgress) * 100);
        setCurrentProgress(calculatedProgress);
        onProgressChange?.(calculatedProgress);
      });

      return () => {
        progressAnimation.removeAllListeners();
        animation.stop();
      };
    }
  }, [showProgressBar, maxProgress, onProgressChange, progressAnimation]);

  // State Toggle Handler
  const toggleState = () => {
    const newState = !isActiveState;
    setIsActiveState(newState);
    onStateChange?.(newState);
    onPress?.();
  };

  // Progress Width Interpolation
  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, maxProgress],
    outputRange: ["0%", "100%"],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.container,
        containerStyle,
        {
          backgroundColor: isActiveState
            ? `${primaryColor}10`
            : `${secondaryColor}10`,
        },
      ]}
    >
      {/* Header Section */}
      <View style={styles.headerContainer}>
        {/* Left Component or Default Text */}
        {LeftComponent || (
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.titleText,
                titleStyle,
                { color: isActiveState ? primaryColor : secondaryColor },
              ]}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[
                  styles.subtitleText,
                  subtitleStyle,
                  { color: isActiveState ? primaryColor : secondaryColor },
                ]}
              >
                {subtitle}
              </Text>
            )}
          </View>
        )}

        {/* Right Component or Toggle Button */}
        {RightComponent ||
          (showToggleButton && (
            <TouchableOpacity
              onPress={toggleState}
              style={[
                styles.toggleButton,
                {
                  backgroundColor: isActiveState
                    ? primaryColor
                    : secondaryColor,
                },
              ]}
            >
              <Text style={styles.toggleButtonText}>
                {isActiveState ? "Kappa" : "EFT"}
              </Text>
            </TouchableOpacity>
          ))}
      </View>

      {/* Conditional Progress Bar */}
      {showProgressBar && (
        <View style={[styles.progressContainer, progressBarStyle]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
                backgroundColor: isActiveState ? primaryColor : secondaryColor,
              },
            ]}
          />
        </View>
      )}

      {/* Progress Percentage */}
      {showProgressBar && (
        <Text
          style={[
            styles.progressText,
            { color: isActiveState ? primaryColor : secondaryColor },
          ]}
        >
          {currentProgress}%
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    width: Dimensions.get("window").width - 40,
    borderRadius: 12,
    padding: 16,
    alignSelf: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "600",
  },
  subtitleText: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleButtonText: {
    color: "white",
    fontWeight: "500",
  },
  progressContainer: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
  },
  progressText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default FlexibleTracker;
