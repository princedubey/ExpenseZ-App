import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColors } from '@/constants/Colors';
import Metrics from '@/constants/Metrics';
import Typography from '@/constants/Typography';
import { useStore } from '@/store';
import { useToast } from '@/contexts/ToastContext';
import { Link } from 'lucide-react-native';

export default function NewsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { showToast } = useToast();

  // Get store selectors
  const news = useStore((state) => state.news);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const pagination = useStore((state) => state.pagination);
  const fetchNews = useStore((state) => state.fetchNews);
  const setNews = useStore((state) => state.setNews);

  // Load news
  const loadNews = useCallback(async (page = 1) => {
    try {
      // Reset news when refreshing
      if (page === 1) {
        setNews([]);
      }

      await fetchNews({
        page,
        limit: 10
      });
    } catch (error: any) {
      showToast(error?.message || 'Failed to load news', 'error');
    }
  }, [fetchNews, showToast, setNews]);

  // Initial load
  useEffect(() => {
    loadNews();
  }, [loadNews]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadNews(1);
    }, [loadNews])
  );

  // Handle refresh
  const handleRefresh = () => {
    loadNews(1);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (pagination.currentPage < pagination.totalPages) {
      loadNews(pagination.currentPage + 1);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.light.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.light.text }]}>Latest News</Text>
      </View>

      <FlatList
        data={news}
        keyExtractor={(item) => item.url}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.newsCard, { backgroundColor: colors.light.card }]}
            onPress={() => {
              // Open news URL in browser
              Linking.openURL(item.url);
            }}
          >
            {item.image && (
              <Image
                source={{ uri: item.image }}
                style={styles.newsImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.newsContent}>
              <Text style={[styles.newsTitle, { color: colors.light.text }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.newsDescription, { color: colors.gray[600] }]} numberOfLines={3}>
                {item.description}
              </Text>
              <View style={styles.newsFooter}>
                <Text style={[styles.newsSource, { color: colors.primary[600] }]}>
                  {item.source}
                </Text>
                <Text style={[styles.newsDate, { color: colors.gray[500] }]}>
                  {formatDate(item.published_at)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} colors={[colors.primary[600]]} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.gray[500] }]}>
              {error || 'No news available'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Metrics.lg,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.xl,
  },
  listContent: {
    padding: Metrics.md,
  },
  newsCard: {
    marginBottom: Metrics.md,
    borderRadius: Metrics.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB', // Light gray border for light theme
  },
  newsImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: Metrics.borderRadius.lg,
    borderTopRightRadius: Metrics.borderRadius.lg,
  },
  newsContent: {
    padding: Metrics.md,
    borderWidth: 1,
    borderColor: '#E5E7EB', // Light gray border for light theme
    borderTopWidth: 0,
  },
  newsTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.lg,
    marginBottom: Metrics.sm,
  },
  newsDescription: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.md,
    marginBottom: Metrics.md,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsSource: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
  },
  newsDate: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Metrics.xl,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.md,
    textAlign: 'center',
  },
}); 