import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Share2, 
  BookOpen, 
  Globe, 
  Calendar, 
  Clock, 
  Maximize2, 
  Type, 
  ChevronRight,
  ExternalLink
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';

// Dynamic import or fallback for WebView depending on platform
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (e) {
    console.warn('WebView failed to load:', e);
  }
}

const { width } = Dimensions.get('window');

export default function NewsDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isDark } = useTheme();
  
  // Retrieve passed news params
  const params = useLocalSearchParams();
  const { title, description, image, url, source, published_at } = params as {
    title: string;
    description: string;
    image?: string;
    url: string;
    source: string;
    published_at: string;
  };

  // State
  const [activeTab, setActiveTab] = useState<'reader' | 'web'>('reader');
  const [fontSize, setFontSize] = useState<number>(16); // Dynamic reader font size
  const [webLoading, setWebLoading] = useState(true);

  // Format publication date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Handle article share
  const handleShare = async () => {
    try {
      await Share.share({
        title: title || 'Finance News',
        message: `${title}\n\nRead more on ${source || 'ExpenseZ'}:\n${url}`,
        url: url,
      });
    } catch (error) {
      console.error('Error sharing article:', error);
    }
  };

  // Increase/Decrease reader font size
  const adjustFontSize = (action: 'increase' | 'decrease') => {
    if (action === 'increase' && fontSize < 24) {
      setFontSize(prev => prev + 2);
    } else if (action === 'decrease' && fontSize > 12) {
      setFontSize(prev => prev - 2);
    }
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.light.background }]} 
      edges={['top', 'bottom']}
    >
      {/* Floating Sticky Header */}
      <View style={[styles.navbar, { borderBottomColor: colors.light.border }]}>
        <TouchableOpacity 
          style={[styles.navButton, { backgroundColor: isDark ? colors.gray[100] : 'rgba(0,0,0,0.05)' }]} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={isDark ? colors.light.text : colors.gray[800]} />
        </TouchableOpacity>
        
        {/* Toggle Mode Switcher */}
        <View style={[styles.tabContainer, { backgroundColor: isDark ? colors.gray[100] : colors.gray[200] }]}>
          <TouchableOpacity
            style={[
              styles.tab, 
              activeTab === 'reader' && [styles.activeTab, { backgroundColor: colors.primary[600] }]
            ]}
            onPress={() => setActiveTab('reader')}
          >
            <BookOpen size={14} color={activeTab === 'reader' ? '#ffffff' : (isDark ? colors.gray[400] : colors.gray[600])} />
            <Text style={[styles.tabText, activeTab === 'reader' && styles.activeTabText]}>Reader</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab, 
              activeTab === 'web' && [styles.activeTab, { backgroundColor: colors.primary[600] }]
            ]}
            onPress={() => setActiveTab('web')}
          >
            <Globe size={14} color={activeTab === 'web' ? '#ffffff' : (isDark ? colors.gray[400] : colors.gray[600])} />
            <Text style={[styles.tabText, activeTab === 'web' && styles.activeTabText]}>Full Web</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.navButton, { backgroundColor: isDark ? colors.gray[100] : 'rgba(0,0,0,0.05)' }]} 
          onPress={handleShare}
        >
          <Share2 size={20} color={isDark ? colors.light.text : colors.gray[800]} />
        </TouchableOpacity>
      </View>

      {/* READER VIEW */}
      {activeTab === 'reader' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Cover Hero Image */}
          <View style={styles.imageContainer}>
            {image ? (
              <Image source={{ uri: image }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={[styles.placeholderImage, { backgroundColor: colors.primary[100] }]}>
                <BookOpen size={64} color={colors.primary[600]} />
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={styles.gradientOverlay}
            />
            {/* Overlay Category Tag */}
            <View style={styles.tagWrapper}>
              <View style={[styles.sourceTag, { backgroundColor: colors.primary[600] }]}>
                <Text style={styles.sourceTagText}>{source || 'Finance'}</Text>
              </View>
            </View>
          </View>

          {/* Article Meta Panel */}
          <View style={styles.metaPanel}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Calendar size={14} color={colors.gray[500]} />
                <Text style={[styles.metaText, { color: colors.gray[600] }]}>{formatDate(published_at)}</Text>
              </View>
            </View>

            <Text style={[styles.articleTitle, { color: isDark ? '#ffffff' : colors.light.text }]}>
              {title}
            </Text>

            {/* Premium Divider */}
            <View style={[styles.divider, { backgroundColor: colors.light.border }]} />

            {/* Typography Size Bar */}
            <View style={[styles.typographyBar, { backgroundColor: colors.gray[100] }]}>
              <View style={styles.typographyLabel}>
                <Type size={16} color={colors.gray[500]} />
                <Text style={[styles.typographyText, { color: colors.gray[600] }]}>Adjust Text Size</Text>
              </View>
              <View style={styles.fontControls}>
                <TouchableOpacity 
                  style={[styles.fontButton, { backgroundColor: isDark ? colors.gray[200] : '#ffffff', borderColor: isDark ? colors.gray[300] : '#D1D5DB' }]} 
                  onPress={() => adjustFontSize('decrease')}
                >
                  <Text style={[styles.fontButtonText, { color: isDark ? '#ffffff' : '#000000' }]}>A-</Text>
                </TouchableOpacity>
                <Text style={[styles.currentFontSize, { color: isDark ? '#ffffff' : colors.light.text }]}>{fontSize}px</Text>
                <TouchableOpacity 
                  style={[styles.fontButton, { backgroundColor: isDark ? colors.gray[200] : '#ffffff', borderColor: isDark ? colors.gray[300] : '#D1D5DB' }]} 
                  onPress={() => adjustFontSize('increase')}
                >
                  <Text style={[styles.fontButtonText, { color: isDark ? '#ffffff' : '#000000' }]}>A+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Main Summary Content */}
            <Text style={[styles.articleBody, { fontSize, color: isDark ? colors.gray[800] : colors.gray[800], lineHeight: fontSize * 1.6 }]}>
              {description || "No full summary is available for this article. Please tap 'Full Web' at the top to read the original article."}
            </Text>

            {/* View Full Web callout */}
            <TouchableOpacity 
              style={[styles.webCallout, { backgroundColor: colors.primary[50] + '22', borderColor: colors.primary[300] }]}
              onPress={() => setActiveTab('web')}
            >
              <View style={styles.calloutContent}>
                <Text style={[styles.calloutTitle, { color: colors.primary[600] }]}>Read the original article</Text>
                <Text style={[styles.calloutSubtitle, { color: colors.gray[500] }]}>Load the full webpage inside the app</Text>
              </View>
              <ChevronRight size={20} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* WEB ARTICLE WEBVIEW VIEW */
        <View style={styles.webContainer}>
          {Platform.OS === 'web' ? (
            <View style={styles.webFallback}>
              <Globe size={48} color={colors.primary[600]} style={{ marginBottom: Metrics.md }} />
              <Text style={[styles.fallbackTitle, { color: isDark ? '#ffffff' : colors.light.text }]}>
                External Web Article
              </Text>
              <Text style={[styles.fallbackDesc, { color: colors.gray[500] }]}>
                Browsers restrict loading third-party websites in inline frames (CORS/X-Frame-Options).
              </Text>
              <TouchableOpacity 
                style={[styles.externalButton, { backgroundColor: colors.primary[600] }]}
                onPress={() => Platform.OS === 'web' && window.open(url, '_blank')}
              >
                <Text style={styles.externalButtonText}>Open in New Tab</Text>
                <ExternalLink size={16} color="#ffffff" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {WebView ? (
                <WebView
                  source={{ uri: url }}
                  style={{ flex: 1 }}
                  onLoadStart={() => setWebLoading(true)}
                  onLoadEnd={() => setWebLoading(false)}
                />
              ) : (
                <View style={styles.webFallback}>
                  <Text style={{ color: colors.light.text }}>WebView component could not be loaded</Text>
                </View>
              )}
              {webLoading && (
                <View style={styles.webSpinner}>
                  <ActivityIndicator size="large" color={colors.primary[600]} />
                </View>
              )}
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Metrics.md,
    paddingVertical: Metrics.sm,
    borderBottomWidth: 1,
  },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: Metrics.borderRadius.md,
    padding: 3,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Metrics.md,
    paddingVertical: 6,
    borderRadius: Metrics.borderRadius.sm - 2,
    gap: 6,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.sm,
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#ffffff',
  },
  scrollContent: {
    paddingBottom: Metrics.xxl,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  tagWrapper: {
    position: 'absolute',
    bottom: Metrics.md,
    left: Metrics.md,
  },
  sourceTag: {
    paddingHorizontal: Metrics.md,
    paddingVertical: 4,
    borderRadius: Metrics.borderRadius.sm,
  },
  sourceTagText: {
    color: '#ffffff',
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.sm - 2,
    textTransform: 'uppercase',
  },
  metaPanel: {
    paddingHorizontal: Metrics.lg,
    paddingTop: Metrics.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Metrics.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Metrics.xs,
  },
  metaText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
  },
  articleTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.xl + 2,
    lineHeight: Metrics.fontSizes.xl + 8,
    marginBottom: Metrics.lg,
  },
  divider: {
    height: 1,
    marginBottom: Metrics.lg,
  },
  typographyBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Metrics.md,
    borderRadius: Metrics.borderRadius.md,
    marginBottom: Metrics.lg,
  },
  typographyLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Metrics.sm,
  },
  typographyText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Metrics.md,
  },
  fontButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Metrics.borderRadius.sm - 2,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  fontButtonText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.sm,
  },
  currentFontSize: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.sm,
  },
  articleBody: {
    fontFamily: Typography.fontFamily.regular,
    marginBottom: Metrics.xl,
  },
  webCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Metrics.lg,
    borderRadius: Metrics.borderRadius.lg,
    borderWidth: 1,
    marginTop: Metrics.md,
  },
  calloutContent: {
    flex: 1,
  },
  calloutTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.md,
    marginBottom: 2,
  },
  calloutSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
  },
  webContainer: {
    flex: 1,
    position: 'relative',
  },
  webSpinner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Metrics.xl * 2,
    textAlign: 'center',
  },
  fallbackTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.lg + 2,
    marginBottom: Metrics.sm,
  },
  fallbackDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.md,
    textAlign: 'center',
    marginBottom: Metrics.xl,
    lineHeight: 20,
  },
  externalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Metrics.md,
    paddingHorizontal: Metrics.xl,
    borderRadius: Metrics.borderRadius.lg,
  },
  externalButtonText: {
    color: '#ffffff',
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.md,
  },
});
