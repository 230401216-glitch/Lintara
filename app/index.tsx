import { normalizeRole, useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  const router = useRouter();
  const { isReady, user, checkAuthStatus } = useAuth();
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const authValid = await checkAuthStatus();

      await new Promise((resolve) => setTimeout(resolve, 900));

      const normalizedRole = normalizeRole(user?.role);

      if (normalizedRole === "admin") {
        router.replace("/(admin)/dashboard");
      } else if (normalizedRole === "mitra") {
        router.replace("/(mitra)/dashboard");
      } else if (normalizedRole === "user") {
        router.replace("/(tabs)");
      } else if (user && authValid) {
        router.replace("/(tabs)");
      } else if (user) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }

      setIsBooting(false);
    };

    void bootstrap();
  }, [router, user, user?.role, checkAuthStatus]);

  return (
    <View style={styles.container}>
      <View style={styles.brandCard}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>LT</Text>
        </View>
        <Text style={styles.title}>Lintara</Text>
        <Text style={styles.subtitle}>Pesan tiket travel antar kota dengan cepat, aman, dan tanpa ribet.</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoBadge}>Realtime booking</Text>
          <Text style={styles.infoBadge}>Pembayaran aman</Text>
        </View>
      </View>
      {isBooting ? <ActivityIndicator color="#1E3A8A" style={{ marginTop: 24 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  brandCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 30,
    backgroundColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
    color: "#64748B",
    fontSize: 14,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  infoBadge: {
    backgroundColor: "#EFF6FF",
    color: "#1E3A8A",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "700",
  },
});
