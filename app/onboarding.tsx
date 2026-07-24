import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ONBOARDING_KEY = "lintara.onboarding.completed.v1";

export default function OnboardingScreen() {
  const router = useRouter();

  const handleContinue = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>LT</Text>
        </View>
        <Text style={styles.title}>Pesan Travel Tanpa Ribet</Text>
        <Text style={styles.subtitle}>
          Temukan travel antar kota, pilih kursi, bayar, dan dapatkan tiket digital dalam hitungan menit.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Mulai Sekarang</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { flex: 1, justifyContent: "center", padding: 24, alignItems: "center" },
  logoWrap: { width: 96, height: 96, borderRadius: 30, backgroundColor: "#1E3A8A", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  logoText: { color: "#FFFFFF", fontSize: 34, fontWeight: "800" },
  title: { fontSize: 26, fontWeight: "800", color: "#0F172A", textAlign: "center" },
  subtitle: { marginTop: 10, textAlign: "center", color: "#64748B", lineHeight: 22 },
  button: { marginTop: 24, backgroundColor: "#1E3A8A", paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
