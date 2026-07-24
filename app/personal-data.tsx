import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_BASE_URL } from "../constants/api";

export default function PersonalData() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [namaPerusahaan, setNamaPerusahaan] = useState("");
  const [alamat, setAlamat] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await response.json();

        if (response.ok && data.success) {
          const profile = data.data || {};
          setNama(profile.nama || user.name || "");
          setEmail(profile.email || user.email || "");
          setPhone(profile.no_hp || user.phone || "");
          // remove company/address from personal data for privacy
        }
      } catch {
        Alert.alert("Peringatan", "Gagal memuat data profil dari server.");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [user?.email, user?.name, user?.phone, user?.token]);

  const handleSave = async () => {
    if (!user?.token) {
      Alert.alert("Login Diperlukan", "Silakan masuk terlebih dahulu.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ nama, no_hp: phone }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Gagal menyimpan profil");
      }

      login({
        id: user.id,
        name: nama,
        email: user.email,
        phone,
        approved: user.approved,
        photo: user.photo,
        provider: user.provider,
        token: user.token,
        role: user.role,
      });

      Alert.alert("Berhasil", "Profil berhasil diperbarui.");
    } catch (error) {
      Alert.alert("Gagal", error instanceof Error ? error.message : "Tidak dapat menyimpan profil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Data Pribadi</Text>
        <Text style={styles.subtitle}>Kelola informasi akun Anda sesuai data yang tersimpan di server.</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#2563EB" />
          <Text style={styles.loadingText}>Memuat profil...</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Nama</Text>
          <TextInput style={styles.input} value={nama} onChangeText={setNama} placeholder="Nama lengkap" />

          <Text style={styles.cardLabel}>Email</Text>
          <TextInput style={[styles.input, styles.inputDisabled]} value={email} editable={false} />

          <Text style={styles.cardLabel}>Telepon</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Nomor HP" keyboardType="phone-pad" />

          {/* Perusahaan dan alamat disembunyikan pada halaman data pribadi */}

          <View style={styles.mitraBox}>
            <Text style={styles.mitraTitle}>Daftar Menjadi Mitra</Text>
            <Text style={styles.mitraSubtitle}>
              Ajukan diri sebagai partner Lintara dan tunggu verifikasi admin.
            </Text>
            <Text style={styles.mitraStatus}>
              Status saat ini: {user?.mitraStatus === "pending" ? "Menunggu Verifikasi Admin" : user?.role === "mitra" ? "Sudah aktif sebagai mitra" : "Belum mengajukan"}
            </Text>
            <TouchableOpacity style={styles.mitraButton} onPress={() => router.push("/mitra/register")}>
              <Text style={styles.mitraButtonText}>Buka Formulir Mitra</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Simpan Perubahan</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#64748B",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    elevation: 4,
  },
  cardLabel: {
    fontWeight: "bold",
    marginTop: 12,
  },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  inputDisabled: {
    backgroundColor: "#F3F4F6",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  mitraBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  mitraTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  mitraSubtitle: {
    marginTop: 6,
    color: "#475569",
    lineHeight: 20,
  },
  mitraStatus: {
    marginTop: 8,
    fontWeight: "600",
    color: "#0F172A",
  },
  mitraButton: {
    marginTop: 12,
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  mitraButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  secondaryButtonText: {
    color: "#334155",
    fontWeight: "bold",
  },
  loadingBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#64748B",
  },
});
