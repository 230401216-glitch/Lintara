import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/lib/context/AuthContext";
import { createMitraDriver, loadMitraDashboardData, MitraDriver, updateMitraDriver } from "@/lib/services/mitraData";
import DashboardCard from "../../components/mitra/DashboardCard";

export default function SupirScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<MitraDriver[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    platKendaraan: "",
    status: "Aktif",
    catatan: "",
  });

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await loadMitraDashboardData(user?.token, user?.role, user?.id);
      setDrivers(data.drivers || []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Gagal memuat data supir");
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role, user?.token]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      phone: "",
      platKendaraan: "",
      status: "Aktif",
      catatan: "",
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert("Data belum lengkap", "Nama supir wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await updateMitraDriver(
          editingId,
          {
            nama_supir: form.name.trim(),
            nomor_hp: form.phone.trim(),
            plat_kendaraan: form.platKendaraan.trim(),
            status: form.status,
            catatan: form.catatan.trim(),
          },
          user?.token
        );
      } else {
        await createMitraDriver(
          {
            nama_supir: form.name.trim(),
            nomor_hp: form.phone.trim(),
            plat_kendaraan: form.platKendaraan.trim(),
            status: form.status,
            catatan: form.catatan.trim(),
          },
          user?.token
        );
      }
      await refresh();
      resetForm();
    } catch (nextError) {
      Alert.alert("Gagal menyimpan", nextError instanceof Error ? nextError.message : "Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (driver: MitraDriver) => {
    setEditingId(driver.id);
    setForm({
      name: driver.name,
      phone: driver.phone,
      platKendaraan: driver.platKendaraan || "",
      status: driver.status,
      catatan: driver.catatan || "",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#1E3A8A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Supir</Text>
            <Text style={styles.subtitle}>Kelola data supir yang tersimpan di database</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => void refresh()} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Refresh Data</Text>}
        </TouchableOpacity>

        <DashboardCard title={editingId ? "Edit Supir" : "Tambah Supir"} subtitle="Data disimpan langsung ke tabel supir di backend">
          <TextInput
            value={form.name}
            onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
            style={styles.input}
            placeholder="Nama supir"
          />
          <TextInput
            value={form.phone}
            onChangeText={(value) => setForm((current) => ({ ...current, phone: value }))}
            style={styles.input}
            placeholder="Nomor HP"
            keyboardType="phone-pad"
          />
          <TextInput
            value={form.platKendaraan}
            onChangeText={(value) => setForm((current) => ({ ...current, platKendaraan: value }))}
            style={styles.input}
            placeholder="Plat kendaraan"
          />
          <TextInput
            value={form.status}
            onChangeText={(value) => setForm((current) => ({ ...current, status: value }))}
            style={styles.input}
            placeholder="Status"
          />
          <TextInput
            value={form.catatan}
            onChangeText={(value) => setForm((current) => ({ ...current, catatan: value }))}
            style={[styles.input, styles.textarea]}
            placeholder="Catatan"
            multiline
          />

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={resetForm}>
              <Text style={styles.secondaryButtonText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButtonCompact} onPress={() => void handleSave()} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Simpan</Text>}
            </TouchableOpacity>
          </View>
        </DashboardCard>

        <DashboardCard title="Daftar Supir" subtitle="Klik item untuk mengedit data">
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {drivers.map((driver) => (
            <TouchableOpacity key={driver.id} style={styles.rowCard} onPress={() => startEdit(driver)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{driver.name}</Text>
                <Text style={styles.rowMeta}>{driver.phone || "-"}</Text>
                <Text style={styles.rowMeta}>{driver.platKendaraan || "Belum ada plat"}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{driver.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {!loading && !error && drivers.length === 0 ? <Text style={styles.emptyText}>Belum ada supir tersimpan.</Text> : null}
        </DashboardCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 36 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backButton: { marginRight: 12, width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  subtitle: { color: "#64748B", marginTop: 2 },
  primaryButton: { backgroundColor: "#1E3A8A", padding: 14, borderRadius: 14, alignItems: "center", marginBottom: 14 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700" },
  primaryButtonCompact: { backgroundColor: "#1E3A8A", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: "center", flex: 1, marginLeft: 8 },
  secondaryButton: { backgroundColor: "#E2E8F0", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: "center", flex: 1, marginRight: 8 },
  secondaryButtonText: { color: "#0F172A", fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, color: "#0F172A" },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  formActions: { flexDirection: "row", marginTop: 4 },
  rowCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  rowTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  rowMeta: { fontSize: 12, color: "#64748B", marginTop: 2 },
  statusBadge: { backgroundColor: "#DBEAFE", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, maxWidth: 120 },
  statusText: { fontSize: 11, fontWeight: "700", color: "#1E3A8A" },
  emptyText: { color: "#64748B", fontSize: 13, paddingVertical: 8 },
  errorText: { color: "#DC2626", fontSize: 13, paddingVertical: 8 },
});
