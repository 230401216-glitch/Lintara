import { normalizeRole, useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function MitraIndex() {
  const router = useRouter();
  const { isReady, user } = useAuth();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const role = normalizeRole(user?.role);
    if (role === "mitra") {
      router.replace("/(mitra)/dashboard");
    } else {
      router.replace("/mitra/login");
    }
  }, [isReady, router, user?.role]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color="#1E3A8A" />
    </View>
  );
}
