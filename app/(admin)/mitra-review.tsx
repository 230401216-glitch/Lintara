import { API_ENDPOINTS } from "@/constants/api";
import { useAuth } from "@/lib/context/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Mitra = {
  id: number;
  nama?: string;
  email?: string;
  no_hp?: string;
  nama_perusahaan?: string;
  status?: string;
  status_verifikasi?: string;
  official_document_url?: string | null;
  document_status?: string | null;
};

const authHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export default function MitraReview() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const userId = String(params.id ?? "");

  const [mitra, setMitra] = useState<Mitra | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasDocument, setHasDocument] = useState(false);
  const [notes, setNotes] = useState("");

  const loadMitra = useCallback(async () => {
    if (!user?.token || !userId) return;
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.getUser(userId), { headers: authHeaders(user.token) });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || "Gagal memuat profil mitra");
      setMitra(json.data ?? null);
      setHasDocument(Boolean(json.data?.official_document_url));
    } catch (err) {
      Alert.alert("Gagal", err instanceof Error ? err.message : "Gagal memuat profil mitra");
    } finally {
      setLoading(false);
    }
  }, [user?.token, userId]);

  useEffect(() => { void loadMitra(); }, [loadMitra]);

  const submitDocumentCheck = async () => {
    if (!user?.token || !mitra) return;
    try {
      setSubmitting(true);
      const endpoint = hasDocument ? API_ENDPOINTS.approveMitraDocument(String(mitra.id)) : API_ENDPOINTS.rejectMitraDocument(String(mitra.id));
      const res = await fetch(endpoint, { method: "PUT", headers: authHeaders(user.token) });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || "Gagal memperbarui status dokumen");
      Alert.alert("Berhasil", hasDocument ? "Dokumen ditandai sebagai ada dan disetujui." : "Dokumen ditandai tidak ada dan ditolak.");
      void loadMitra();
    } catch (err) {
      Alert.alert("Gagal", err instanceof Error ? err.message : "Gagal memperbarui status dokumen");
    } finally {
      setSubmitting(false);
    }
  };

  const approveAccount = async () => {
    if (!user?.token || !mitra) return;
    try {
      setSubmitting(true);
      const res = await fetch(API_ENDPOINTS.approveMitra(String(mitra.id)), { method: "PUT", headers: authHeaders(user.token) });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || "Gagal mengonfirmasi akun mitra");
      Alert.alert("Berhasil", "Akun mitra dikonfirmasi.");
      router.back();
    } catch (err) {
      Alert.alert("Gagal", err instanceof Error ? err.message : "Gagal mengonfirmasi akun mitra");
    } finally {
      setSubmitting(false);
    }
  };

  const rejectAccount = async () => {
    if (!user?.token || !mitra) return;
    try {
      setSubmitting(true);
      const res = await fetch(API_ENDPOINTS.rejectMitra(String(mitra.id)), { method: "PUT", headers: authHeaders(user.token) });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || "Gagal menolak akun mitra");
      Alert.alert("Berhasil", "Akun mitra ditolak.");
      router.back();
    } catch (err) {
      Alert.alert("Gagal", err instanceof Error ? err.message : "Gagal menolak akun mitra");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Kembali</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator color="#1E3A8A" style={styles.loader} />
        ) : mitra ? (
          <View style={styles.card}>
            <Text style={styles.title}>{mitra.nama}</Text>
            <Text style={styles.meta}>{mitra.nama_perusahaan}</Text>
            <Text style={styles.meta}>{mitra.email} • {mitra.no_hp}</Text>

            <Text style={styles.sectionLabel}>Dokumen Resmi</Text>
            {mitra.official_document_url ? (
              <Image source={{ uri: mitra.official_document_url }} style={styles.docImage} />
            ) : (
              <Text style={styles.emptyText}>Belum ada dokumen diunggah.</Text>
            )}

            <View style={styles.formRow}>
              <TouchableOpacity onPress={() => setHasDocument((v) => !v)} style={[styles.checkbox, hasDocument && styles.checkboxChecked]}>
                <Text style={styles.checkboxText}>{hasDocument ? "✓" : ""}</Text>
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>Dokumen resmi tersedia</Text>
            </View>

            <Text style={styles.sectionLabel}>Catatan (opsional)</Text>
            <TextInput value={notes} onChangeText={setNotes} placeholder="Catatan untuk mitra" style={styles.input} multiline />

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.primaryButton} onPress={submitDocumentCheck} disabled={submitting}>
                <Text style={styles.primaryButtonText}>Simpan Dokumen</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.approveButton} onPress={approveAccount} disabled={submitting}>
                <Text style={styles.approveText}>Konfirmasi Akun</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectButton} onPress={rejectAccount} disabled={submitting}>
                <Text style={styles.rejectText}>Tolak Akun</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>Mitra tidak ditemukan.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20 },
  backButton: { marginBottom: 12 },
  backText: { color: "#1E3A8A", fontWeight: "700" },
  loader: { marginTop: 20 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  title: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginBottom: 6 },
  meta: { color: "#64748B", marginBottom: 4 },
  sectionLabel: { marginTop: 12, color: "#475569", fontWeight: "700" },
  docImage: { width: "100%", height: 220, marginTop: 8, borderRadius: 10 },
  emptyText: { color: "#64748B", marginTop: 8 },
  formRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  checkbox: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center", marginRight: 8 },
  checkboxChecked: { backgroundColor: "#16A34A" },
  checkboxText: { color: "#FFFFFF", fontWeight: "800" },
  checkboxLabel: { color: "#475569", fontWeight: "700" },
  input: { backgroundColor: "#F8FAFC", borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: "#E2E8F0" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  primaryButton: { flex: 1, backgroundColor: "#2563EB", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800" },
  approveButton: { flex: 1, backgroundColor: "#16A34A", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  approveText: { color: "#FFFFFF", fontWeight: "800" },
  rejectButton: { flex: 1, backgroundColor: "#FEE2E2", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  rejectText: { color: "#DC2626", fontWeight: "800" },
});
