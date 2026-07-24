import { useAuth } from "@/lib/context/AuthContext";
import { useGoogleAuth } from "@/lib/services/googleAuth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_ENDPOINTS } from "../constants/api";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { isConfigured, loading, message, signInWithGoogle } = useGoogleAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleGoogleLogin = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      const role = (result.role || "user").toLowerCase();
      if (role === "admin") {
        router.replace("/(admin)/dashboard");
      } else if (role === "mitra") {
        router.replace("/(mitra)/dashboard");
      } else {
        router.replace("/(tabs)");
      }
    }
  };

  const handleForgotPassword = () => {
    router.push("/forgot-password");
  };

  const handleLocalLogin = async () => {
    setFormError("");
    if (!email || !password) {
      setFormError("Email dan password harus diisi.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(API_ENDPOINTS.login, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setFormError(data.message || "Email atau password tidak valid.");
        return;
      }

      if (!data.token) {
        setFormError("Token autentikasi tidak diterima. Coba lagi.");
        return;
      }

      login({
        id: data.user.id,
        name: data.user.nama,
        email: data.user.email,
        phone: data.user.no_hp,
        approved: data.user.status === "aktif",
        photo: data.user.foto,
        provider: "email",
        token: data.token,
        role: data.user.role,
      });

      // Redirect based on user role
      const role = (data.user.role || "").toLowerCase();
      if (role === "admin") {
        router.replace("/(admin)/dashboard");
      } else if (role === "mitra") {
        router.replace("/(mitra)/dashboard");
      } else {
        router.replace("/(tabs)");
      }
    } catch {
      setFormError("Tidak dapat terhubung ke server. Coba lagi nanti.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View style={styles.logoBadge}>
            <Image source={require("../assets/images/Lintara.png")} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.title}>Masuk ke Lintara</Text>
          <Text style={styles.subtitle}>
            Masuk dengan akun Google atau email/password untuk melanjutkan perjalanan Anda.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Akun Lintara</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <View style={styles.passwordWrap}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.passwordToggle}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
              submitting && styles.buttonDisabled,
            ]}
            onPress={handleLocalLogin}
            disabled={submitting}
            hitSlop={8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Masuk dengan Email</Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>ATAU</Text>
            <View style={styles.divider} />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.googleButton,
              pressed && styles.googleButtonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleGoogleLogin}
            disabled={loading}
            hitSlop={8}
          >
            <Ionicons name="logo-google" size={20} color="#0F172A" />
            <Text style={styles.googleButtonText}>
              {loading ? "Memverifikasi..." : "Masuk dengan Google"}
            </Text>
          </Pressable>

          <Text style={styles.securityText}>
            {message ||
              (isConfigured
                ? "Login Google tersedia. Jika belum, daftarkan di Google Cloud Console."
                : "Google belum aktif. Isi Client ID di file .env, lalu restart Expo.")}
          </Text>

          <View style={styles.bottomTextColumn}>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.linkText}>Lupa password?</Text>
            </TouchableOpacity>
            <View style={styles.bottomTextRow}>
              <Text>Belum punya akun? </Text>
              <TouchableOpacity onPress={() => router.push("/register")} disabled={loading || submitting}>
                <Text style={styles.linkText}>Daftar sekarang</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  headerCard: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 12,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E6EEF8",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    textAlign: "center",
    marginTop: 8,
    color: "#475569",
    marginBottom: 8,
    lineHeight: 20,
  },
  form: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  googleButtonPressed: {
    backgroundColor: "#F1F5F9",
    borderColor: "#94A3B8",
  },
  googleButtonText: {
    color: "#0F172A",
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
  },
  passwordToggle: {
    padding: 8,
    borderRadius: 999,
  },
  actionButton: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  actionButtonPressed: {
    backgroundColor: "#1D4ED8",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  errorText: {
    color: "#DC2626",
    marginTop: 10,
    textAlign: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  securityText: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 14,
    textAlign: "center",
  },
  bottomTextColumn: {
    marginTop: 16,
    gap: 8,
    alignItems: "center",
  },
  bottomTextRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },
  linkText: {
    color: "#2563EB",
    fontWeight: "700",
  },
});
