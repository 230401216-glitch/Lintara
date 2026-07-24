import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // NOSONAR: S1874 - SafeAreaView from safe-area-context is not deprecated

import { useAuth } from "@/lib/context/AuthContext";
import { createMitraRoute, formatCurrency, formatRoute, loadMitraDashboardData, MitraRoute, MitraTravel, updateMitraRoute } from "@/lib/services/mitraData";
import DashboardCard from "../../components/mitra/DashboardCard";

export default function HargaScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [routes, setRoutes] = useState<MitraRoute[]>([]);
  const [travels, setTravels] = useState<MitraTravel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ travel_id: "", asal: "", tujuan: "", harga: "", durasi: "" });

  const resetForm = useCallback(() => {
    setForm({ travel_id: "", asal: "", tujuan: "", harga: "", durasi: "" });
    setEditingId(null);
    setShowForm(false);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await loadMitraDashboardData(user?.token, user?.role, user?.id);
      setRoutes(data.routes);
      setTravels(data.travels);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Gagal memuat harga");
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role, user?.token]);

  const handleEdit = (route: MitraRoute) => {
    setEditingId(route.id);
    setShowForm(true);
    setForm({
      travel_id: route.travelId || "",
      asal: route.origin,
      tujuan: route.destination,
      harga: String(route.price),
      durasi: route.durasi || "",
    });
  };

  const handleSubmit = async () => {
    if (!form.travel_id || !form.asal.trim() || !form.tujuan.trim() || !form.harga.trim()) {
      Alert.alert("Lengkapi Data", "Travel, asal, tujuan, dan harga harus diisi.");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await updateMitraRoute(
          editingId,
          {
            travel_id: form.travel_id,
            asal: form.asal.trim(),
            tujuan: form.tujuan.trim(),
            harga: Number(form.harga),
            durasi: form.durasi.trim(),
          },
          user?.token
        );
      } else {
        await createMitraRoute(
          {
            travel_id: form.travel_id,
            asal: form.asal.trim(),
            tujuan: form.tujuan.trim(),
            harga: Number(form.harga),
            durasi: form.durasi.trim(),
          },
          user?.token
        );
      }
      await refresh();
      resetForm();
      Alert.alert("Berhasil", editingId ? "Tarif berhasil diperbarui." : "Tarif berhasil ditambahkan.");
    } catch (nextError) {
      Alert.alert("Gagal", nextError instanceof Error ? nextError.message : "Gagal menyimpan tarif.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#1E3A8A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Harga Tiket</Text>
            <Text style={styles.subtitle}>Kelola tarif perjalanan mitra</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            setShowForm((value) => !value);
            if (showForm) {
              resetForm();
            }
          }}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>{showForm ? "Tutup Form" : "+ Tambah Tarif"}</Text>
        </TouchableOpacity>

        {showForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Pilih Armada</Text>
            <View style={styles.choiceRow}>
              {travels.map((travel) => (
                <TouchableOpacity
                  key={travel.id}
                  style={[styles.choiceChip, form.travel_id === travel.id && styles.choiceChipActive]}
                  onPress={() => setForm((current) => ({ ...current, travel_id: travel.id }))}
                >
                  <Text style={[styles.choiceText, form.travel_id === travel.id && styles.choiceTextActive]}>{travel.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Asal" value={form.asal} onChangeText={(value) => setForm((current) => ({ ...current, asal: value }))} />
            <TextInput style={styles.input} placeholder="Tujuan" value={form.tujuan} onChangeText={(value) => setForm((current) => ({ ...current, tujuan: value }))} />
            <TextInput style={styles.input} placeholder="Harga" value={form.harga} onChangeText={(value) => setForm((current) => ({ ...current, harga: value.replace(/\D/g, "") }))} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Durasi" value={form.durasi} onChangeText={(value) => setForm((current) => ({ ...current, durasi: value }))} />
            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{editingId ? "Perbarui Tarif" : "Simpan Tarif"}</Text>}
            </TouchableOpacity>
          </View>
        ) : null}

        <DashboardCard title="Daftar Tarif" subtitle="Harga aktif saat ini">
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {routes.map((item) => (
            <View key={item.id} style={styles.rowCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{formatRoute(item.origin, item.destination)}</Text>
                <Text style={styles.rowMeta}>{formatCurrency(item.price)}</Text>
                <Text style={styles.rowMeta}>Durasi: {item.durasi || "-"} • Status: {item.status}</Text>
              </View>
              <TouchableOpacity style={styles.inlineButton} onPress={() => handleEdit(item)}>
                <Text style={styles.inlineButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          ))}
          {!loading && !error && routes.length === 0 ? <Text style={styles.emptyText}>Belum ada tarif di database.</Text> : null}
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
  formCard: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 14 },
  formLabel: { fontSize: 13, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  choiceChip: { backgroundColor: "#F1F5F9", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },
  choiceChipActive: { backgroundColor: "#1E3A8A" },
  choiceText: { color: "#334155", fontSize: 12, fontWeight: "600" },
  choiceTextActive: { color: "#FFFFFF" },
  input: { borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 12, padding: 12, marginBottom: 10, backgroundColor: "#FFFFFF" },
  saveButton: { backgroundColor: "#1E3A8A", padding: 14, borderRadius: 12, alignItems: "center" },
  rowCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  rowTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  rowMeta: { fontSize: 12, color: "#64748B", marginTop: 2 },
  inlineButton: { backgroundColor: "#DBEAFE", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  inlineButtonText: { color: "#1E3A8A", fontWeight: "700", fontSize: 12 },
  emptyText: { color: "#64748B", fontSize: 13, paddingVertical: 8 },
  errorText: { color: "#DC2626", fontSize: 13, paddingVertical: 8 },
});
