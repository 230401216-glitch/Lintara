import { normalizeRole, useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";

/**
 * Auto-login wrapper that checks authentication status on app startup
 * and handles navigation accordingly
 */
export const AutoLoginWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isReady, isLoggedIn, user, checkAuthStatus } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check auth status when app starts
    const initAuth = async () => {
      try {
        await checkAuthStatus();
      } catch (error) {
        console.error("Error during auto-login:", error);
      }
    };

    initAuth();
  }, [checkAuthStatus]);

  // Navigate to appropriate screen based on auth status
  useEffect(() => {
    if (!isReady) return; // Still loading

    if (isLoggedIn && user) {
      const role = normalizeRole(user.role);
      if (role === "admin") {
        router.replace("/(admin)/panel");
      } else if (role === "mitra") {
        router.replace("/(mitra)/dashboard");
      } else {
        router.replace("/(tabs)/home");
      }
    } else {
      router.replace("/login");
    }
  }, [isReady, isLoggedIn, user, router]);

  return <>{children}</>;
};
