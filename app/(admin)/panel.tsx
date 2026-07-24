import { API_ENDPOINTS } from "@/constants/api";
import { useAuth } from "@/lib/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminPanel() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetch(API_ENDPOINTS.getAdminReports, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` } });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || "Gagal memuat laporan");
      setReportData(json.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Panel Admin — Lintara</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/(admin)/dashboard")}>
              <Ionicons name="grid-outline" size={20} color="#1E3A8A" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => { logout(); router.replace('/login'); }}>
              <Ionicons name="log-out-outline" size={20} color="#1E3A8A" />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? <ActivityIndicator color="#1E3A8A" style={{ marginVertical: 12 }} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.card} onPress={() => router.push("/(admin)/users")}>
            <Text style={styles.cardTitle}>Pengguna</Text>
            <Text style={styles.cardValue}>{reportData?.totalUsers ?? "-"}</Text>
            <Text style={styles.cardMeta}>Kelola pengguna, nonaktifkan, eksport</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push("/(admin)/mitra") }>
            <Text style={styles.cardTitle}>Mitra</Text>
            <Text style={styles.cardValue}>{reportData?.totalMitras ?? "-"}</Text>
            <Text style={styles.cardMeta}>Tinjau pendaftaran, verifikasi dokumen</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.card} onPress={() => router.push("/(admin)/bookings") }>
            <Text style={styles.cardTitle}>Booking</Text>
            <Text style={styles.cardValue}>{reportData?.totalBookings ?? "-"}</Text>
            <Text style={styles.cardMeta}>Kelola pembatalan, refund, timeline</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push("/(admin)/reports") }>
            <Text style={styles.cardTitle}>Laporan</Text>
            <Text style={styles.cardValue}>{reportData?.totalRevenue ? `Rp ${Number(reportData.totalRevenue).toLocaleString('id-ID')}` : "-"}</Text>
            <Text style={styles.cardMeta}>Ringkasan & export CSV</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.card} onPress={() => router.push("/(admin)/documents") }>
            <Text style={styles.cardTitle}>Dokumen</Text>
            <Text style={styles.cardValue}>{reportData?.submittedDocuments ?? "-"}</Text>
            <Text style={styles.cardMeta}>Dokumen mitra, surat perjanjian</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push("/(admin)/settings") }>
            <Text style={styles.cardTitle}>Pengaturan</Text>
            <Text style={styles.cardValue}>-</Text>
            <Text style={styles.cardMeta}>Konfigurasi sistem & notifikasi</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 18 }}>
          <Text style={styles.sectionTitle}>Tindakan Cepat</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/(admin)/mitra?filter=pending") }>
              <Text style={styles.actionText}>Tinjau Mitra Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/(admin)/reports") }>
              <Text style={styles.actionText}>Export Laporan</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginLeft: 8 },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTitle: { color: '#0F172A', fontWeight: '800', fontSize: 14 },
  cardValue: { fontSize: 18, fontWeight: '800', marginTop: 6, color: '#1E3A8A' },
  cardMeta: { color: '#64748B', marginTop: 6, fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionButton: { backgroundColor: '#2563EB', padding: 12, borderRadius: 10, alignItems: 'center', flex: 1 },
  actionText: { color: '#FFFFFF', fontWeight: '800' },
  errorText: { color: '#DC2626', marginBottom: 8 },
});
