import { Image } from 'expo-image';
import React, { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppColors, Spacing } from '@/constants/Colors';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { usePlayerSettings } from '@/contexts/PlayerSettingsContext';
import { fetchAllItems, Item } from '@/services/tarkovApi';

interface ItemCardProps {
  item: Item;
  onPress: () => void;
}

const ItemCard = React.memo(function ItemCard({ item, onPress }: ItemCardProps) {
  const getSourceColor = useMemo(() => {
    switch (item.source) {
      case 'hideout': return styles.hideoutTag;
      case 'quest': return styles.questTag;
      case 'mixed': return styles.mixedTag;
      default: return styles.hideoutTag;
    }
  }, [item.source]);

  const getSourceText = useMemo(() => {
    switch (item.source) {
      case 'hideout': return 'Hideout';
      case 'quest': return 'Quest';
      case 'mixed': return 'Mixed';
      default: return 'Unknown';
    }
  }, [item.source]);

  return (
    <TouchableOpacity onPress={onPress}>
      <ThemedView style={styles.itemCard}>
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
          <ThemedText type="defaultSemiBold" style={styles.itemName} numberOfLines={2}>
            {item.name}
          </ThemedText>
          <ThemedText style={styles.itemQuantity}>
            Total: {item.totalQuantity}
          </ThemedText>
          <View style={styles.itemTags}>
            <View style={[styles.tag, getSourceColor]}>
              <ThemedText style={[styles.tagText, { color: 'white' }]}>
                {getSourceText}
              </ThemedText>
            </View>
            {item.foundInRaid && (
              <View style={[styles.tag, styles.firTag]}>
                <ThemedText style={[styles.tagText, { color: 'white' }]}>FIR</ThemedText>
              </View>
            )}
          </View>
          <ThemedText style={styles.itemSource}>
            {item.usages.length} usage{item.usages.length !== 1 ? 's' : ''}
          </ThemedText>
          <ThemedText style={styles.tapHint}>
            Tap for details
          </ThemedText>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
});

interface ItemDetailModalProps {
  item: Item | null;
  visible: boolean;
  onClose: () => void;
}

function ItemDetailModal({ item, visible, onClose }: ItemDetailModalProps) {
  if (!item) return null;

  const hideoutUsages = item.usages.filter(usage => usage.stationName);
  const questUsages = item.usages.filter(usage => usage.questName);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <ThemedText type="title" style={styles.modalTitle}>
            {item.name}
          </ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.itemDetailsHeader}>
            {item.iconLink ? (
              <Image
                source={{ uri: item.iconLink }}
                style={styles.modalItemImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.modalPlaceholderImage}>
                <IconSymbol name="cube.box" size={48} color="#666" />
              </View>
            )}
            <View style={styles.itemMetadata}>
              <ThemedText style={styles.totalQuantityText}>
                Total Needed: {item.totalQuantity}
              </ThemedText>
              {item.foundInRaid && (
                <View style={[styles.tag, styles.firTag, styles.detailTag]}>
                  <ThemedText style={[styles.tagText, { color: 'white' }]}>Found in Raid Required</ThemedText>
                </View>
              )}
            </View>
          </View>

          {hideoutUsages.length > 0 && (
            <View style={styles.usageSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Hideout Requirements
              </ThemedText>
              {hideoutUsages
                .sort((a, b) => (a.stationLevel || 0) - (b.stationLevel || 0))
                .map((usage, index) => (
                  <ThemedView key={index} style={styles.usageItem}>
                    <ThemedText type="defaultSemiBold" style={styles.usageTitle}>
                      {usage.stationName} - Level {usage.stationLevel}
                    </ThemedText>
                    <ThemedText style={styles.usageQuantity}>
                      Quantity needed: {usage.quantity}
                    </ThemedText>
                  </ThemedView>
                ))}
            </View>
          )}

          {questUsages.length > 0 && (
            <View style={styles.usageSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Quest Requirements
              </ThemedText>
              {questUsages.map((usage, index) => (
                <ThemedView key={index} style={styles.usageItem}>
                  <ThemedText type="defaultSemiBold" style={styles.usageTitle}>
                    {usage.questName}
                  </ThemedText>
                  <ThemedText style={styles.usageTrader}>
                    Trader: {usage.traderName}
                  </ThemedText>
                  <ThemedText style={styles.usageQuantity}>
                    Quantity needed: {usage.quantity}
                  </ThemedText>
                </ThemedView>
              ))}
            </View>
          )}
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

export default function ItemsScreen() {
  const { settings } = usePlayerSettings();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemFilter, setItemFilter] = useState<'hideout' | 'quest'>('hideout');
  const [firFilter, setFirFilter] = useState<'all' | 'fir' | 'non-fir'>('all');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        const allItems = await fetchAllItems({
          hideoutModuleLevels: settings.hideoutModuleLevels,
          completedQuestIds: settings.completedQuestIds
        });
        setItems(allItems);
        setError(null);
      } catch (err) {
        console.error('Failed to load items:', err);
        setError('Failed to load items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [settings.hideoutModuleLevels, settings.completedQuestIds]);

  // Pre-filter items by source for better performance
  const hideoutItems = useMemo(() => 
    items.filter(item => item.source === 'hideout' || item.source === 'mixed'), 
    [items]
  );
  
  const questItems = useMemo(() => 
    items.filter(item => item.source === 'quest'), 
    [items]
  );
  
  // Get the base filtered items quickly
  const baseFilteredItems = useMemo(() => {
    return itemFilter === 'hideout' ? hideoutItems : questItems;
  }, [itemFilter, hideoutItems, questItems]);
  
  // Apply FIR filter only when needed
  const filteredItems = useMemo(() => {
    if (firFilter === 'all') return baseFilteredItems;
    
    return baseFilteredItems.filter(item => 
      firFilter === 'fir' ? item.foundInRaid : !item.foundInRaid
    );
  }, [baseFilteredItems, firFilter]);
  
  // Memoized item press handler to prevent recreation on every render
  const handleItemPress = useCallback((item: Item) => {
    setSelectedItem(item);
    setModalVisible(true);
  }, []);
  
  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setSelectedItem(null);
  }, []);
  
  // Optimized filter handlers with non-blocking updates
  const handleItemFilterChange = useCallback((filter: 'hideout' | 'quest') => {
    if (filter === itemFilter) return; // Prevent unnecessary updates
    
    setIsFiltering(true);
    startTransition(() => {
      setItemFilter(filter);
      setIsFiltering(false);
    });
  }, [itemFilter]);
  
  const handleFirFilterChange = useCallback((filter: 'all' | 'fir' | 'non-fir') => {
    if (filter === firFilter) return; // Prevent unnecessary updates
    
    setIsFiltering(true);
    startTransition(() => {
      setFirFilter(filter);
      setIsFiltering(false);
    });
  }, [firFilter]);

  const renderContent = () => {
    if (loading) {
      return (
        <ThemedView style={styles.centerContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <ThemedText style={styles.loadingText}>Loading items...</ThemedText>
        </ThemedView>
      );
    }

    if (error) {
      return (
        <ThemedView style={styles.centerContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color="#ff5733" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      );
    }

    return (
      <>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Items</ThemedText>
        </ThemedView>

        {/* Filter Buttons */}
        <ThemedView style={styles.filterContainer}>
          <ThemedView style={styles.filterButtonsContainer}>
            <TouchableOpacity
              style={[styles.filterButton, itemFilter === 'hideout' && styles.filterButtonActive]}
              onPress={() => handleItemFilterChange('hideout')}
            >
              <ThemedText style={[styles.filterButtonText, itemFilter === 'hideout' && styles.filterButtonTextActive]}>
                Hideout
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, itemFilter === 'quest' && styles.filterButtonActive]}
              onPress={() => handleItemFilterChange('quest')}
            >
              <ThemedText style={[styles.filterButtonText, itemFilter === 'quest' && styles.filterButtonTextActive]}>
                Quest
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          <ThemedView style={styles.filterButtonsContainer}>
            <TouchableOpacity
              style={[styles.filterButton, firFilter === 'all' && styles.filterButtonActive]}
              onPress={() => handleFirFilterChange('all')}
            >
              <ThemedText style={[styles.filterButtonText, firFilter === 'all' && styles.filterButtonTextActive]}>
                All Items
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, firFilter === 'fir' && styles.filterButtonActive]}
              onPress={() => handleFirFilterChange('fir')}
            >
              <ThemedText style={[styles.filterButtonText, firFilter === 'fir' && styles.filterButtonTextActive]}>
                FIR Only
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, firFilter === 'non-fir' && styles.filterButtonActive]}
              onPress={() => handleFirFilterChange('non-fir')}
            >
              <ThemedText style={[styles.filterButtonText, firFilter === 'non-fir' && styles.filterButtonTextActive]}>
                Non-FIR
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        <ThemedText style={styles.subtitle}>
          {filteredItems.length} of {items.length} items
        </ThemedText>

        {isFiltering ? (
          <ThemedView style={styles.filteringContainer}>
            <ActivityIndicator size="small" color={AppColors.success} />
            <ThemedText style={styles.filteringText}>Updating filters...</ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            data={filteredItems}
            renderItem={({ item }) => (
              <ItemCard 
                item={item} 
                onPress={() => handleItemPress(item)}
              />
            )}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.itemRow}
            style={styles.itemList}
            contentContainerStyle={styles.itemListContent}
            removeClippedSubviews={true}
            maxToRenderPerBatch={8}
            updateCellsBatchingPeriod={100}
            initialNumToRender={16}
            windowSize={5}
            ListEmptyComponent={() => (
              <ThemedView style={styles.centerContainer}>
                <ThemedText style={styles.emptyText}>
                  No items found with current filters.
                </ThemedText>
              </ThemedView>
            )}
            scrollEnabled={false}
          />
        )}
        
        <ItemDetailModal
          item={selectedItem}
          visible={modalVisible}
          onClose={handleModalClose}
        />
      </>
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "transparent", dark: "transparent" }}
      headerImage={<></>}
    >
      {renderContent()}
    </ParallaxScrollView>
  );
}

const screenWidth = Dimensions.get('window').width;
const itemCardWidth = (screenWidth - 50) / 2;

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.defaultGap,
    marginLeft: Spacing.titleContainerLeft,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  errorText: {
    fontSize: 16,
    color: AppColors.error,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  filterContainer: {
    marginHorizontal: Spacing.containerHorizontal
  },
  filterButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
    paddingHorizontal: 16,
    gap: 8,
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
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginHorizontal: Spacing.containerHorizontal
  },
  itemCard: {
    width: itemCardWidth,
    height: 200, // Further increased height for all content
    backgroundColor: AppColors.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 7,
    shadowColor: AppColors.shadowLight,
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
    color: AppColors.textPrimary,
    lineHeight: 14,
    textAlign: 'center',
    fontWeight: '600',
    maxHeight: 28, // Limit to 2 lines
  },
  itemQuantity: {
    fontSize: 10,
    color: AppColors.textSecondary,
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
  firTag: {
    backgroundColor: AppColors.success,
  },
  tagText: {
    fontSize: 8,
    fontWeight: '600',
  },
  itemSource: {
    fontSize: 9,
    color: AppColors.textTertiary,
    textAlign: 'center',
    lineHeight: 12,
  },
  mixedTag: {
    backgroundColor: '#9C27B0',
  },
  tapHint: {
    fontSize: 8,
    color: AppColors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  itemDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
  },
  modalItemImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 16,
  },
  modalPlaceholderImage: {
    width: 64,
    height: 64,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginRight: 16,
  },
  itemMetadata: {
    flex: 1,
  },
  totalQuantityText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailTag: {
    alignSelf: 'flex-start',
  },
  usageSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  usageItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  usageTitle: {
    marginBottom: 4,
  },
  usageTrader: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  usageQuantity: {
    fontSize: 13,
    color: AppColors.success,
    fontWeight: '500',
  },
  itemList: {
    flex: 1,
    marginHorizontal: Spacing.containerHorizontal,
  },
  itemListContent: {
    paddingHorizontal: 16,
  },
  itemRow: {
    flex: 1,
    justifyContent: 'space-around',
  },
  filteringContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  filteringText: {
    fontSize: 14,
    color: AppColors.success,
  },
});
