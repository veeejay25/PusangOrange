import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

// Comprehensive Type Definitions
interface FlexibleTrackerProps {
  // Content Configuration
  title?: string;
  subtitle?: string;

  // Component Visibility
  showTitle?: boolean;
  showSubtitle?: boolean;
  showProgressBar?: boolean;
  showToggleButton?: boolean;
  showProgressText?: boolean;

  // Progress Configuration
  initialProgress?: number;
  maxProgress?: number;
  animateProgress?: boolean;
  animationDuration?: number;

  // State Management
  initialState?: boolean;

  // Toggle Button Configuration
  activeButtonText?: string;
  inactiveButtonText?: string;

  // Complete Style Overrides
  containerStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  textContainerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  toggleButtonStyle?: ViewStyle;
  toggleButtonTextStyle?: TextStyle;
  progressContainerStyle?: ViewStyle;
  progressBarStyle?: ViewStyle;
  progressTextStyle?: TextStyle;

  // Color Configuration
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  progressBackgroundColor?: string;

  // Custom Components
  LeftComponent?: React.ReactNode;
  RightComponent?: React.ReactNode;
  CustomProgressBar?: React.ReactNode;

  // Callbacks
  onStateChange?: (newState: boolean) => void;
  onProgressChange?: (progress: number) => void;
  onPress?: () => void;
  onTogglePress?: () => void;
}

const FlexibleTracker: React.FC<FlexibleTrackerProps> = ({
  // Content defaults
  title = "Progress Tracker",
  subtitle = "",

  // Visibility defaults
  showTitle = true,
  showSubtitle = true,
  showProgressBar = true,
  showToggleButton = true,
  showProgressText = true,

  // Progress defaults
  initialProgress = 0,
  maxProgress = 100,
  animateProgress = true,
  animationDuration = 4000,

  // State defaults
  initialState = true,

  // Toggle button defaults
  activeButtonText = "Active",
  inactiveButtonText = "Inactive",

  // Style defaults (minimal base styles)
  containerStyle = {},
  headerStyle = {},
  textContainerStyle = {},
  titleStyle = {},
  subtitleStyle = {},
  toggleButtonStyle = {},
  toggleButtonTextStyle = {},
  progressContainerStyle = {},
  progressBarStyle = {},
  progressTextStyle = {},

  // Color defaults
  primaryColor = "#4CAF50",
  secondaryColor = "#2196F3",
  backgroundColor,
  progressBackgroundColor = "#E0E0E0",

  // Custom components
  LeftComponent,
  RightComponent,
  CustomProgressBar,

  // Callbacks
  onStateChange,
  onProgressChange,
  onPress,
  onTogglePress,
}) => {
  // State Management
  const [isActiveState, setIsActiveState] = useState(initialState);
  const [currentProgress, setCurrentProgress] = useState(initialProgress);

  // Animated Progress
  const progressAnimation = useRef(new Animated.Value(initialProgress)).current;

  // Progress Animation Logic
  useEffect(() => {
    if (showProgressBar && animateProgress) {
      // Reset animation value and animate to the target percentage
      progressAnimation.setValue(0);
      
      const animation = Animated.timing(progressAnimation, {
        toValue: maxProgress, // maxProgress is already a percentage (0-100)
        duration: animationDuration,
        useNativeDriver: false,
      });

      animation.start(({ finished }) => {
        if (finished) {
          onProgressChange?.(maxProgress);
        }
      });

      const listener = progressAnimation.addListener(({ value }) => {
        const calculatedProgress = Math.round(value);
        setCurrentProgress(calculatedProgress);
        onProgressChange?.(calculatedProgress);
      });

      return () => {
        progressAnimation.removeListener(listener);
        animation.stop();
      };
    } else {
      // If animation is disabled, directly set the progress
      setCurrentProgress(maxProgress);
      progressAnimation.setValue(maxProgress);
    }
  }, [
    showProgressBar,
    animateProgress,
    maxProgress,
    animationDuration,
    onProgressChange,
    progressAnimation,
  ]);

  // State Toggle Handler
  const handleToggle = () => {
    const newState = !isActiveState;
    setIsActiveState(newState);
    onStateChange?.(newState);
    onTogglePress?.();
  };

  // Progress Width Interpolation
  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 100], // Always interpolate from 0 to 100 since maxProgress is a percentage
    outputRange: ["0%", "100%"],
    extrapolate: 'clamp',
  });

  // Dynamic colors based on state
  const currentColor = isActiveState ? primaryColor : secondaryColor;
  const currentBackgroundColor = backgroundColor || `${currentColor}10`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.baseContainer,
        { backgroundColor: currentBackgroundColor },
        containerStyle,
      ]}
    >
      {/* Header Section */}
      {(showTitle ||
        showSubtitle ||
        showToggleButton ||
        LeftComponent ||
        RightComponent) && (
        <View style={[styles.baseHeader, headerStyle]}>
          {/* Left Side Content */}
          {LeftComponent || (
            <View style={[styles.baseTextContainer, textContainerStyle]}>
              {showTitle && (
                <Text
                  style={[
                    styles.baseTitle,
                    { color: currentColor },
                    titleStyle,
                  ]}
                >
                  {title}
                </Text>
              )}
              {showSubtitle && subtitle && (
                <Text
                  style={[
                    styles.baseSubtitle,
                    { color: currentColor },
                    subtitleStyle,
                  ]}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          )}

          {/* Right Side Content */}
          {RightComponent ||
            (showToggleButton && (
              <TouchableOpacity
                onPress={handleToggle}
                style={[
                  styles.baseToggleButton,
                  { backgroundColor: currentColor },
                  toggleButtonStyle,
                ]}
              >
                <Text
                  style={[styles.baseToggleButtonText, toggleButtonTextStyle]}
                >
                  {isActiveState ? activeButtonText : inactiveButtonText}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      )}

      {/* Progress Bar Section */}
      {showProgressBar &&
        (CustomProgressBar || (
          <View
            style={[
              styles.baseProgressContainer,
              { backgroundColor: progressBackgroundColor },
              progressContainerStyle,
            ]}
          >
            <Animated.View
              style={[
                styles.baseProgressBar,
                {
                  width: progressWidth,
                  backgroundColor: currentColor,
                },
                progressBarStyle,
              ]}
            />
          </View>
        ))}

      {/* Progress Text */}
      {showProgressBar && showProgressText && (
        <Text
          style={[
            styles.baseProgressText,
            { color: currentColor },
            progressTextStyle,
          ]}
        >
          {currentProgress}%
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Minimal base styles - can be completely overridden
const styles = StyleSheet.create({
  baseContainer: {
    padding: 16,
    borderRadius: 8,
  },
  baseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  baseTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  baseTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  baseSubtitle: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  baseToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  baseToggleButtonText: {
    color: "white",
    fontSize: 14,
  },
  baseProgressContainer: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  baseProgressBar: {
    height: "100%",
  },
  baseProgressText: {
    textAlign: "center",
    fontSize: 12,
  },
});

export default FlexibleTracker;
