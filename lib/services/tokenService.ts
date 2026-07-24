import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules, Platform } from "react-native";

const TOKEN_KEY = "lintara_jwt_token";
const USER_KEY = "lintara_user_data";

export interface User {
  id: number;
  nama: string;
  email: string;
  no_hp: string;
  role: "user" | "mitra" | "admin";
  status: "aktif" | "nonaktif";
  foto?: string;
}

export interface TokenData {
  token: string;
  user: User;
  expiresAt?: number;
}

type SecureStoreLike = {
  isAvailableAsync?: () => Promise<boolean>;
  getItemAsync?: (key: string, options?: Record<string, unknown>) => Promise<string | null>;
  setItemAsync?: (key: string, value: string, options?: Record<string, unknown>) => Promise<void>;
  deleteItemAsync?: (key: string, options?: Record<string, unknown>) => Promise<void>;
};

let secureStoreModule: SecureStoreLike | null | undefined;

async function getSecureStore(): Promise<SecureStoreLike | null> {
  if (secureStoreModule !== undefined) {
    return secureStoreModule;
  }

  if (Platform.OS === "web") {
    secureStoreModule = null;
    return null;
  }

  try {
    const nativeSecureStore = (NativeModules as Record<string, unknown> | undefined)?.ExpoSecureStore as
      | SecureStoreLike
      | undefined;

    if (
      nativeSecureStore &&
      typeof nativeSecureStore.getItemAsync === "function" &&
      typeof nativeSecureStore.setItemAsync === "function" &&
      typeof nativeSecureStore.deleteItemAsync === "function"
    ) {
      secureStoreModule = nativeSecureStore;
      return nativeSecureStore;
    }
  } catch (error) {
    console.warn("Expo SecureStore native module is not available:", error);
  }

  try {
    const imported = await import("expo-secure-store");
    const secureStore = (imported as any)?.default ?? imported;

    if (
      secureStore &&
      typeof secureStore.isAvailableAsync === "function" &&
      (await secureStore.isAvailableAsync())
    ) {
      secureStoreModule = secureStore;
      return secureStore;
    }
  } catch (error) {
    // Intentionally ignore and fall back to AsyncStorage when SecureStore is unavailable.
  }

  secureStoreModule = null;
  return null;
}

/**
 * Save JWT token securely and persist user metadata locally.
 */
export async function saveToken(tokenData: TokenData): Promise<void> {
  try {
    const secureStore = await getSecureStore();
    if (secureStore?.setItemAsync) {
      await secureStore.setItemAsync(TOKEN_KEY, tokenData.token);
    } else {
      await AsyncStorage.setItem(TOKEN_KEY, tokenData.token);
    }

    await AsyncStorage.setItem(USER_KEY, JSON.stringify(tokenData.user));
  } catch (error) {
    console.error("Error saving token:", error);
    throw error;
  }
}

/**
 * Retrieve JWT token from secure storage.
 * If a legacy token is found in AsyncStorage, migrate it to SecureStore.
 */
export async function getToken(): Promise<string | null> {
  try {
    let token: string | null = null;
    const secureStore = await getSecureStore();

    if (secureStore?.getItemAsync) {
      token = await secureStore.getItemAsync(TOKEN_KEY);
    }

    if (!token) {
      token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token && secureStore?.setItemAsync) {
        try {
          await secureStore.setItemAsync(TOKEN_KEY, token);
          await AsyncStorage.removeItem(TOKEN_KEY);
        } catch (migrationError) {
          console.warn("Error migrating legacy auth token to SecureStore:", migrationError);
        }
      }
    }

    return token;
  } catch (error) {
    console.error("Error retrieving token:", error);
    return null;
  }
}

/**
 * Retrieve user data from AsyncStorage.
 */
export async function getUser(): Promise<User | null> {
  try {
    const userData = await AsyncStorage.getItem(USER_KEY);
    if (userData) {
      return JSON.parse(userData) as User;
    }
    return null;
  } catch (error) {
    console.error("Error retrieving user:", error);
    return null;
  }
}

/**
 * Clear secure token and local user metadata.
 */
export async function clearToken(): Promise<void> {
  try {
    const secureStore = await getSecureStore();
    if (secureStore?.deleteItemAsync) {
      await secureStore.deleteItemAsync(TOKEN_KEY);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }

    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error("Error clearing token:", error);
    throw error;
  }
}

/**
 * Check whether a JWT token exists in secure storage.
 */
export async function hasValidToken(): Promise<boolean> {
  const token = await getToken();
  return token !== null && token !== "";
}
