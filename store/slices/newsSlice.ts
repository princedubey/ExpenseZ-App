import { NewsSlice, StoreSlice } from '../types';

export const createNewsSlice: StoreSlice<NewsSlice> = (set, get) => ({
  news: [],
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  },

  setNews: (news: any[]) => {
    set({ news });
  },

  fetchNews: async (params?: { 
    page?: number,
    limit?: number,
    category?: string
  }) => {
    set({ loading: true, error: null });
    try {
      const apikey = process.env.EXPO_PUBLIC_NEWSDATA_API_KEY || 'pub_c55a68e5732a4efcb77cd3124f78e117';
      const response = await fetch(
        `https://newsdata.io/api/1/market?apikey=${apikey}&country=in&language=en`
      );
      
      const rawData = await response.json();

      if (rawData.status !== 'success') {
        throw new Error(rawData.message || 'Failed to fetch news from provider');
      }

      const mappedData = (rawData.results || []).map((item: any) => ({
        url: item.link || '',
        image: item.image_url || null,
        title: item.title || '',
        description: item.description || '',
        source: item.source_id || 'Market News',
        published_at: item.pubDate || new Date().toISOString(),
      }));

      set({ 
        news: mappedData,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          total: mappedData.length,
          limit: mappedData.length
        },
        loading: false 
      });
    } catch (error: any) {
      console.error('Failed to fetch news:', error);
      set({ 
        error: error?.message || 'Failed to fetch news',
        loading: false 
      });
      throw error;
    }
  },
});