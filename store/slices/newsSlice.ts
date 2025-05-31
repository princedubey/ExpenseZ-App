import { NewsSlice, StoreSlice } from '../types';
import api from '../api';

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
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.category) queryParams.append('category', params.category);

      // Add MediaStack API key and other required parameters
      queryParams.append('access_key', process.env.EXPO_PUBLIC_MEDIASTACK_API_KEY || '');
      queryParams.append('countries', 'in'); // India news
      queryParams.append('languages', 'en'); // English language

      const response = await api.get(`http://api.mediastack.com/v1/news?${queryParams.toString()}`);
      const { data, pagination } = response.data;
      
      set((state) => ({ 
        news: params?.page && params.page > 1 ? [...state.news, ...data] : data,
        pagination: {
          currentPage: pagination.page,
          totalPages: Math.ceil(pagination.total / pagination.limit),
          total: pagination.total,
          limit: pagination.limit
        },
        loading: false 
      }));
    } catch (error: any) {
      set({ 
        error: error?.response?.data?.message || 'Failed to fetch news',
        loading: false 
      });
      throw error;
    }
  },
}); 