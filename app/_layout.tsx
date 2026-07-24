import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/lib/context/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "../hooks/use-color-scheme";


export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    ...MaterialIcons.font,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider
        value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
      >
        <ErrorBoundary>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>

              <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="(mitra)"
                options={{
                  headerShown: false,
                  title: "",
                }}
              />

              <Stack.Screen
                name="(admin)"
                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="modal"
                options={{
                  presentation: "modal",
                  headerShown: false,
                  title: "",
                }}
              />

            </Stack>
          </AuthProvider>
        </ErrorBoundary>

        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
