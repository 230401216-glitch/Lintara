import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_ENDPOINTS } from "../constants/api";

export default function LoginAdmin() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

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
        headers: { "Content-Type": "application/json" },
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

      if ((data.user.role || "").toLowerCase() !== "admin") {
        setFormError("Akun ini bukan admin. Gunakan halaman login yang sesuai.");
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

      router.replace("/(admin)/dashboard");
    } catch (err) {
      setFormError("Tidak dapat terhubung ke server. Coba lagi nanti.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/747/747376.png" }} style={styles.logo} />
        <Text style={styles.title}>Admin Login</Text>
        <Text style={styles.subtitle}>Gunakan kredensial Admin Anda untuk mengakses panel admin.</Text>

        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          <Pressable style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed, submitting && styles.buttonDisabled]} onPress={handleLocalLogin} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Masuk sebagai Admin</Text>}
          </Pressable>

          <View style={styles.bottomText}>
            <Text>Kembali ke </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={styles.linkText}>halaman utama login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 24, alignItems: "center" },
  logo: { width: 100, height: 100, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "bold", color: "#1E3A8A" },
  subtitle: { textAlign: "center", marginTop: 8, color: "#475569", marginBottom: 24 },
  form: { width: "100%", backgroundColor: "#fff", borderRadius: 16, padding: 20, elevation: 3 },
  input: { borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 14, padding: 14, marginBottom: 12, backgroundColor: "#fff" },
  actionButton: { backgroundColor: "#1E3A8A", padding: 16, borderRadius: 14, alignItems: "center", marginBottom: 12 },
  actionButtonPressed: { backgroundColor: "#163A8A" },
  actionButtonText: { color: "#fff", fontWeight: "700" },
  errorText: { color: "#DC2626", marginTop: 10, textAlign: "center" },
  bottomText: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  linkText: { color: "#2563EB", fontWeight: "700" },
  buttonDisabled: { opacity: 0.6 },
});
