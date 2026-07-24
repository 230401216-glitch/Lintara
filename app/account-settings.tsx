import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../constants/api";
import { useAuth } from "../lib/context/AuthContext";

export default function AccountSettings() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = typeof params.mode === "string" ? params.mode : "help";

  const titleMap: Record<string, string> = {
    payment: "Metode Pembayaran",
    security: "Keamanan",
    help: "Pusat Bantuan",
    report: "Laporkan Masalah",
  };

  const contentMap: Record<string, string> = {
    payment: "Metode pembayaran akan segera tersedia. Untuk saat ini, Anda dapat menghubungi tim dukungan untuk bantuan transaksi.",
    security: "Akun keamanan utama kami akan dikelola melalui cvlintata@gmail.com untuk verifikasi dan bantuan akun.",
    help: "Tim dukungan kami siap membantu melalui email support@lintara.id atau akun resmi cvlintata@gmail.com.",
    report: "Laporkan kendala akun atau transaksi melalui support@lintara.id. Kami akan menindaklanjuti sesegera mungkin.",
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>{titleMap[mode] || "Pengaturan Akun"}</Text>

          {mode === "security" ? <SecurityPanel router={router} /> : <Text style={styles.body}>{contentMap[mode] || "Fitur ini sedang disiapkan."}</Text>}

          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SecurityPanel({ router }: any) {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!user?.token) return Alert.alert("Login Diperlukan", "Silakan masuk untuk mengganti password.");
    if (!currentPassword || !newPassword) return Alert.alert("Validasi", "Semua field wajib diisi");
    if (newPassword.length < 6) return Alert.alert("Validasi", "Password minimal 6 karakter");
    if (newPassword !== confirmPassword) return Alert.alert("Validasi", "Konfirmasi password tidak cocok");

    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/auth/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await resp.json();
      if (resp.ok && data.success) {
        Alert.alert("Sukses", "Password berhasil diperbarui");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        throw new Error(data.message || "Gagal memperbarui password");
      }
    } catch (err: any) {
      Alert.alert("Gagal", err?.message ?? "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Text style={{ marginBottom: 8, color: "#475569" }}>Ganti Password Akun</Text>

      <Text style={{ fontWeight: "700", marginTop: 8 }}>Password Saat Ini</Text>
      <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="Password saat ini" />

      <Text style={{ fontWeight: "700", marginTop: 8 }}>Password Baru</Text>
      <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Password baru" />

      <Text style={{ fontWeight: "700", marginTop: 8 }}>Konfirmasi Password Baru</Text>
      <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Konfirmasi password baru" />

      <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={handleChange} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Ganti Password</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { flexGrow: 1, padding: 24, justifyContent: "center" },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 24, elevation: 3 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A", marginBottom: 10 },
  body: { color: "#475569", lineHeight: 22 },
  button: { marginTop: 20, backgroundColor: "#2563EB", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
});
