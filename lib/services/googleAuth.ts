import { API_ENDPOINTS } from "@/constants/api";
import { ResponseType, makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

const extra =
  ((Constants.expoConfig?.extra as Record<string, string> | undefined) ||
    ((Constants.manifest as any)?.extra as Record<string, string> | undefined) ||
    {}) as Record<string, string>;

const GOOGLE_CLIENT_IDS = {
  webClientId:
    extra.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,

  androidClientId:
    extra.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,

  iosClientId:
    extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
};

const EXPO_GO_GOOGLE_MESSAGE =
  "Login Google tidak bisa dijalankan di Expo Go. Gunakan Development Build.";

const hasGoogleClientId = Boolean(
  GOOGLE_CLIENT_IDS.androidClientId ||
  GOOGLE_CLIENT_IDS.iosClientId ||
  GOOGLE_CLIENT_IDS.webClientId
);

const isExpoGo = Constants.appOwnership === "expo";

export function useGoogleAuth() {
  const { googleLogin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  console.log("=== GOOGLE CONFIG ===");
  console.log("Web Client:", GOOGLE_CLIENT_IDS.webClientId);
  console.log("Android Client:", GOOGLE_CLIENT_IDS.androidClientId);
  console.log("iOS Client:", GOOGLE_CLIENT_IDS.iosClientId);

  const [request, response, promptAsync] = Google.useAuthRequest(
  {
    androidClientId: GOOGLE_CLIENT_IDS.androidClientId,
    iosClientId: GOOGLE_CLIENT_IDS.iosClientId,
    webClientId: GOOGLE_CLIENT_IDS.webClientId,
    responseType: ResponseType.Code,
    // Use PKCE (default) and request code which will be exchanged for tokens.
    // Explicit redirectUri ensures we use our app scheme in native builds.
    redirectUri:
      extra.EXPO_PUBLIC_GOOGLE_REDIRECT_URI ||
      makeRedirectUri({ scheme: (extra.EXPO_PUBLIC_GOOGLE_REDIRECT_URI || "lintara").split(":")[0] }),
    extraParams: {
      prompt: "select_account",
      access_type: "offline",
    },
    scopes: [
    "openid",
    "profile",
    "email",
  ],
});

  useEffect(() => {
    if (request) {
      console.log("Auth request URL:", request.url);
      console.log("Generated Redirect URI:", request.redirectUri);
    }
  }, [request]);

  const isReady = useMemo(
    () => Boolean(request || response) && !loading,
    [loading, request, response]
  );

  const signInWithGoogle = useCallback(async () => {
    setMessage("");

    if (isExpoGo) {
      Alert.alert("Gunakan Development Build", EXPO_GO_GOOGLE_MESSAGE);
      return { success: false };
    }

    if (!hasGoogleClientId) {
      Alert.alert(
        "Google belum dikonfigurasi",
        "Isi Client ID pada file .env terlebih dahulu."
      );
      return { success: false };
    }

    if (!request) {
      Alert.alert(
        "Google",
        "Google Sign-In masih dipersiapkan. Silakan coba lagi."
      );
      return { success: false };
    }

    setLoading(true);

  try {
  const result = await promptAsync();

  console.log("=== GOOGLE RESULT ===");
  console.log(JSON.stringify(result, null, 2));
  console.log("CLICK GOOGLE");
  console.log("SELESAI promptAsync");
  
  if (result.type !== "success") {
    Alert.alert("Login dibatalkan");
    return { success: false };
  }

  const successResult = result;

  const idToken =
    result.authentication?.idToken ??
    result.params?.id_token ??
    null;

  const accessToken =
    result.authentication?.accessToken ??
    result.params?.access_token ??
    null;
  
  console.log("ID TOKEN :", idToken);
  console.log("ACCESS TOKEN :", accessToken);
  console.log("appOwnership =", Constants.appOwnership);
  console.log("executionEnvironment =", Constants.executionEnvironment);
  if (!idToken && !accessToken) {
    Alert.alert("Token Google tidak ditemukan");
    return { success: false };
  }

      const res = await fetch(API_ENDPOINTS.googleLogin, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
          accessToken,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        Alert.alert(
          "Google Sign In",
          data.message || "Verifikasi akun gagal."
        );
        return { success: false };
      }

      googleLogin({
        ...data.user,
        token: data.token,
      });

      return {
        success: true,
        role: data.user.role,
      };
    } catch (e) {
      console.log(e);

      Alert.alert(
        "Login gagal",
        "Pastikan backend berjalan dan internet tersedia."
      );

      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [googleLogin, promptAsync, request]);

  return {
    loading,
    isReady,
    signInWithGoogle,
    isConfigured: hasGoogleClientId,
    message,
  };
}