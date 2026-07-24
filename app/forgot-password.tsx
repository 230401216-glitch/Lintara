import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_ENDPOINTS } from "../constants/api";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      Alert.alert("Peringatan", "Email wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(API_ENDPOINTS.forgotPassword, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await response.json();
      Alert.alert("Informasi", data.message || "Instruksi reset password telah dikirim jika email terdaftar.");
    } catch {
      Alert.alert("Gagal", "Tidak dapat mengirim permintaan reset password saat ini.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Lupa Password</Text>
          <Text style={styles.subtitle}>Masukkan alamat email akun Anda untuk menerima instruksi reset password.</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Kirim Instruksi</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Kembali ke Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { flexGrow: 1, justifyContent: "center", padding: 24 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 24, elevation: 3 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A", marginBottom: 8 },
  subtitle: { color: "#475569", lineHeight: 20, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 12 },
  button: { marginTop: 4, backgroundColor: "#2563EB", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
  secondaryButton: { marginTop: 10, paddingVertical: 12, alignItems: "center" },
  secondaryButtonText: { color: "#2563EB", fontWeight: "700" },
});
