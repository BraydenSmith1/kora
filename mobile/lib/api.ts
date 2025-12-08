import axios from 'axios';
import Constants from 'expo-constants';

const configApiUrl =
  Constants.expoConfig?.extra?.apiUrl ??
  Constants.executionEnvironment === 'storeClient'
    ? undefined
    : process.env.EXPO_PUBLIC_API_URL;

export const API_URL = configApiUrl || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.response.use(
  response => response,
  error => {
    if (__DEV__) {
      console.warn('[API] request failed', error?.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

export function setUserContext(userId?: string) {
  if (userId) {
    api.defaults.headers.common['x-user-id'] = userId;
  } else {
    delete api.defaults.headers.common['x-user-id'];
  }
}
