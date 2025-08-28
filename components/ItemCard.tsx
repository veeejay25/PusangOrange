import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppColors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Item } from '@/services/tarkovApi';

export interface ItemCardProps {
  item: Item;
  onPress: () => void;
}

const screenWidth = Dimensions.get('window').width;
const itemCardWidth = (screenWidth - 50) / 2;

export const ItemCard = React.memo(function ItemCard({ item, onPress }: ItemCardProps) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const textPrimary = useThemeColor({}, 'textPrimary');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textTertiary = useThemeColor({}, 'textTertiary');
  const textMuted = useThemeColor({}, 'textMuted');
  const shadowColor = useThemeColor({}, 'shadowColor');
  const getSourceColor = () => {
    switch (item.source) {
      case 'hideout': return styles.hideoutTag;
      case 'quest': return styles.questTag;
      case 'mixed': return styles.mixedTag;
      default: return styles.hideoutTag;
    }
  };

  const getSourceText = () => {
    switch (item.source) {
      case 'hideout': return 'Hideout';
      case 'quest': return 'Quest';
      case 'mixed': return 'Mixed';
      default: return 'Unknown';
    }
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <ThemedView style={[styles.itemCard, { backgroundColor: cardBackground, shadowColor }]}>
        <View style={styles.itemImageContainer}>
          {item.iconLink ? (
            <Image
              source={{ uri: item.iconLink }}
              style={styles.itemImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <IconSymbol name="cube.box" size={24} color="#666" />
            </View>
          )}
        </View>
        
        <View style={styles.itemInfo}>
          <ThemedText type="defaultSemiBold" style={[styles.itemName, { color: textPrimary }]} numberOfLines={2}>
            {item.name}
          </ThemedText>
          
          <ThemedText style={[styles.itemQuantity, { color: textSecondary }]}>
            Total: {item.totalQuantity}
          </ThemedText>
          
          <View style={styles.itemTags}>
            <View style={[styles.tag, getSourceColor()]}>
              <ThemedText style={[styles.tagText, { color: 'white' }]}>
                {getSourceText()}
              </ThemedText>
            </View>
            {item.foundInRaid && (
              <View style={[styles.tag, styles.firTag]}>
                <ThemedText style={[styles.tagText, { color: 'white' }]}>FIR</ThemedText>
              </View>
            )}
          </View>
          
          <ThemedText style={[styles.itemSource, { color: textTertiary }]}>
            {item.usages.length} usage{item.usages.length !== 1 ? 's' : ''}
          </ThemedText>
          
          <ThemedText style={[styles.tapHint, { color: textMuted }]}>
            Tap for details
          </ThemedText>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  itemCard: {
    width: itemCardWidth,
    height: 200,
    borderRadius: 8,
    padding: 12,
    marginBottom: 7,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImageContainer: {
    width: 40,
    height: 40,
    alignSelf: 'center',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: 4,
    justifyContent: 'space-around',
    paddingVertical: 2,
  },
  itemName: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    fontWeight: '600',
    maxHeight: 28,
  },
  itemQuantity: {
    fontSize: 10,
    textAlign: 'center',
  },
  itemTags: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginVertical: 3,
    flexWrap: 'wrap',
    minHeight: 20,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hideoutTag: {
    backgroundColor: '#2196F3',
  },
  questTag: {
    backgroundColor: '#FF9800',
  },
  mixedTag: {
    backgroundColor: '#9C27B0',
  },
  firTag: {
    backgroundColor: AppColors.success,
  },
  tagText: {
    fontSize: 8,
    fontWeight: '600',
  },
  itemSource: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
  tapHint: {
    fontSize: 8,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 2,
  },
});