import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginMitra() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("/login");
    }, 150);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Login Mitra</Text>
        <Text style={styles.subtitle}>Halaman login mitra telah digabung ke halaman login utama.</Text>
        <Text style={styles.helper}>Anda akan diarahkan otomatis ke halaman masuk Lintara.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", padding: 24 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center", elevation: 3 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A", marginBottom: 8 },
  subtitle: { textAlign: "center", color: "#475569", marginBottom: 8 },
  helper: { textAlign: "center", color: "#64748B" },
});
