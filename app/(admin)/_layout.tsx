import { normalizeRole, useAuth } from "@/lib/context/AuthContext";
import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";

export default function AdminLayout() {
  const router = useRouter();
  const { isReady, user } = useAuth();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const role = normalizeRole(user?.role);
    if (role !== "admin") {
      router.replace("/login");
    }
  }, [isReady, user?.role, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
