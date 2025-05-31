import { useStore } from './index';

export const handleTokenRefresh = async (error: any, retryRequest: () => Promise<any>) => {
  const store = useStore.getState();

  // If error is 401 and we haven't tried to refresh token yet
  if (error.response?.status === 401 && !error.config._retry && store.tokens?.refreshToken) {
    error.config._retry = true;

    try {
      // Try to refresh the token
      await store.refreshToken();
      
      // Retry the original request with new token
      const newToken = useStore.getState().tokens?.accessToken;
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return retryRequest();
    } catch (refreshError) {
      // If refresh fails, log the user out
      await store.logout();
      return Promise.reject(refreshError);
    }
  }

  return Promise.reject(error);
}; 