import { useAuth } from "@/lib/context/AuthContext";
import { useGoogleAuth } from "@/lib/services/googleAuth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_ENDPOINTS } from "../constants/api";

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const { isConfigured, loading, message, signInWithGoogle } = useGoogleAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleGoogleRegister = async () => {
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

  const handleLocalRegister = async () => {
    setFormError("");

    if (!name || !email || !phone || !password || !confirmPassword) {
      setFormError("Semua kolom harus diisi.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Password dan konfirmasi password tidak cocok.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(API_ENDPOINTS.register, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama: name,
          email,
          no_hp: phone,
          password,
          role: "user",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setFormError(data.message || "Gagal membuat akun. Coba lagi.");
        return;
      }

      if (!data.token) {
        setFormError("Token autentikasi tidak diterima. Coba lagi.");
        return;
      }

      // Regular user registration — proceed to app
      register({
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

      router.replace("/(tabs)");
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
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={styles.title}>Buat Akun Baru</Text>
          <Text style={styles.subtitle}>
            Daftar sebagai pengguna biasa untuk mulai menikmati layanan Lintara.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Daftar Pengguna</Text>

          <TextInput
            style={styles.input}
            placeholder="Nama lengkap"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Nomor HP"
            value={phone}
            onChangeText={setPhone}
            autoCapitalize="none"
            keyboardType="phone-pad"
          />
          {/* Mitra/company field removed from public registration */}
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
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
          <View style={styles.passwordWrap}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Konfirmasi password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              style={styles.passwordToggle}
            >
              <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
              submitting && styles.buttonDisabled,
            ]}
            onPress={handleLocalRegister}
            disabled={submitting}
            hitSlop={8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Daftar dengan Email</Text>
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
            onPress={handleGoogleRegister}
            disabled={loading}
            hitSlop={8}
          >
            <Ionicons name="logo-google" size={20} color="#0F172A" />
            <Text style={styles.googleButtonText}>
              {loading ? "Memverifikasi..." : "Daftar dengan Google"}
            </Text>
          </Pressable>

          <Text style={styles.securityText}>{message}</Text>

          <View style={styles.bottomTextColumn}>
            <View style={styles.bottomTextRow}>
              <Text>Sudah punya akun? </Text>
              <TouchableOpacity
                onPress={() => router.push("/login")}
                disabled={loading || submitting}
              >
                <Text style={styles.linkText}>Masuk sekarang</Text>
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
    paddingVertical: 8,
  },
  logoBadge: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
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
  roleSelector: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  roleButtonActive: {
    backgroundColor: "#1E3A8A",
    borderColor: "#1E3A8A",
  },
  roleButtonPressed: {
    opacity: 0.9,
  },
  roleButtonText: {
    color: "#334155",
    fontWeight: "700",
  },
  roleButtonTextActive: {
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.6,
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
