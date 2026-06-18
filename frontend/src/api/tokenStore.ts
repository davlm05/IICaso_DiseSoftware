import * as SecureStore from "expo-secure-store";

/**
 * Token storage over expo-secure-store (README §1.3 / §2.5: tokens live in the
 * device keychain/keystore, never AsyncStorage). Backs the axios interceptors.
 */

const ACCESS_KEY = "smartcart.accessToken";
const REFRESH_KEY = "smartcart.refreshToken";

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}
