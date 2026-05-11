import { Platform } from 'react-native';

const DEFAULT_WEB_API_BASE_URL = 'http://localhost:9999/api';
const DEFAULT_MOBILE_API_BASE_URL = 'http://10.0.2.2:9999/api';

const trimTrailingSlash = (value: string) => value.replace(/\/$/, '');

export const getApiBaseUrl = () => {
  const envBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim();

  if (envBaseUrl) {
    return trimTrailingSlash(envBaseUrl);
  }

  return Platform.OS === 'web' ? DEFAULT_WEB_API_BASE_URL : DEFAULT_MOBILE_API_BASE_URL;
};
