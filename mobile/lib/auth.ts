import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

import { API_URL, api, setUserContext } from './api';

const USER_ID_KEY = 'kora:userId';
const REGION_ID_KEY = 'kora:regionId';

export type Credentials = {
  userId: string;
  regionId: string;
};

async function saveItem(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    if (__DEV__) {
      console.warn(`[auth] Failed to persist ${key}`, error);
    }
  }
}

async function deleteItem(key: string) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    if (__DEV__) {
      console.warn(`[auth] Failed to delete ${key}`, error);
    }
  }
}

export async function loadCredentials(): Promise<Credentials | null> {
  try {
    const [userId, regionId] = await Promise.all([
      SecureStore.getItemAsync(USER_ID_KEY),
      SecureStore.getItemAsync(REGION_ID_KEY),
    ]);

    if (userId && regionId) {
      setUserContext(userId);
      return { userId, regionId };
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[auth] Failed to load credentials', error);
    }
  }

  return null;
}

export async function storeCredentials({ userId, regionId }: Credentials) {
  setUserContext(userId);
  await Promise.all([
    saveItem(USER_ID_KEY, userId),
    saveItem(REGION_ID_KEY, regionId),
  ]);
}

export async function clearCredentials() {
  setUserContext(undefined);
  await Promise.all([deleteItem(USER_ID_KEY), deleteItem(REGION_ID_KEY)]);
}

type DevLoginPayload = {
  email: string;
  name: string;
  regionId: string;
};

export async function devLogin(payload: DevLoginPayload) {
  const { data } = await axios.post(`${API_URL}/auth/dev-login`, payload);

  const credentials: Credentials = {
    userId: data.user.id,
    regionId: data.user.regionId || payload.regionId,
  };

  await storeCredentials(credentials);
  return credentials;
}

export async function refreshSession() {
  const credentials = await loadCredentials();
  if (!credentials) return null;

  try {
    const { data } = await api.get('/me');
    return data as { user: any; wallet: any };
  } catch (error) {
    await clearCredentials();
    throw error;
  }
}
