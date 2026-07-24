import { useAuth } from "@/lib/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_ENDPOINTS } from "../../constants/api";

export default function RegisterMitra() {
  const router = useRouter();
  const { user } = useAuth();
  const [nama, setNama] = useState(user?.name || "");
  const [namaPerusahaan, setNamaPerusahaan] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [alamat, setAlamat] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async () => {
    setFormError("");

    if (!nama || !namaPerusahaan || !phone) {
      setFormError("Nama, nama perusahaan, dan nomor HP wajib diisi.");
      return;
    }

    if (!user?.token) {
      setFormError("Login diperlukan sebelum mengajukan sebagai mitra.");
      setSubmitting(false);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(API_ENDPOINTS.applyMitra, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          nama,
          email,
          no_hp: phone,
          nama_perusahaan: namaPerusahaan,
          alamat,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setFormError(data.message || "Gagal mengirim pengajuan mitra.");
        return;
      }

      Alert.alert("Berhasil", data.message || "Pengajuan mitra berhasil dikirim. Status Anda saat ini: Menunggu Verifikasi Admin.");
      router.replace("/(tabs)/profile");
    } catch {
      setFormError("Tidak dapat terhubung ke server. Coba lagi nanti.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.logoBadge}>
            <Ionicons name="business-outline" size={28} color="#fff" />
          </View>
          <Text style={styles.title}>Daftar Mitra</Text>
          <Text style={styles.subtitle}>
            Bergabunglah sebagai mitra Lintara dan mulai kelola perjalanan Anda.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Informasi Mitra</Text>

          <TextInput
            style={styles.input}
            placeholder="Nama pemilik"
            value={nama}
            onChangeText={setNama}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Nama perusahaan"
            value={namaPerusahaan}
            onChangeText={setNamaPerusahaan}
            autoCapitalize="words"
          />
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            placeholder="Email"
            value={email}
            editable={false}
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
          <TextInput
            style={styles.input}
            placeholder="Alamat perusahaan"
            value={alamat}
            onChangeText={setAlamat}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            hitSlop={8}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Daftar sebagai Mitra</Text>}
          </Pressable>

          <View style={styles.bottomTextRow}>
            <Text>Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => router.push("/login")} disabled={submitting}>
              <Text style={styles.linkText}>Masuk ke akun</Text>
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
  headerCard: { width: "100%", alignItems: "center", marginBottom: 20, paddingVertical: 8 },
  logoBadge: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#0F172A" },
  subtitle: { textAlign: "center", marginTop: 8, color: "#475569", marginBottom: 8, lineHeight: 20 },
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
  formTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  inputDisabled: {
    backgroundColor: "#F3F4F6",
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
  passwordInput: { flex: 1, padding: 14 },
  passwordToggle: { padding: 8, borderRadius: 999 },
  actionButton: { backgroundColor: "#1E3A8A", padding: 16, borderRadius: 14, alignItems: "center", marginBottom: 12 },
  actionButtonPressed: { backgroundColor: "#163A8A" },
  actionButtonText: { color: "#fff", fontWeight: "700" },
  errorText: { color: "#DC2626", marginTop: 10, textAlign: "center" },
  bottomTextRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", flexWrap: "wrap", marginTop: 8 },
  linkText: { color: "#2563EB", fontWeight: "700" },
  buttonDisabled: { opacity: 0.6 },
});
