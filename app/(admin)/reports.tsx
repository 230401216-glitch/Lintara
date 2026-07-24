import { API_ENDPOINTS } from "@/constants/api";
import { useAuth } from "@/lib/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ReportData = {
  totalUsers: number;
  totalMitras: number;
  totalBookings: number;
  totalRevenue: number;
  pendingMitras: number;
  verifiedMitras: number;
  rejectedMitras: number;
  submittedDocuments: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  latestUsers: Array<{
    id: number;
    nama: string;
    email: string;
    no_hp: string;
    role: string;
    status: string;
    nama_perusahaan?: string;
    status_verifikasi?: string;
    document_status?: string;
  }>;
  submittedDocumentMitras: Array<{
    id: number;
    nama: string;
    email: string;
    no_hp: string;
    role: string;
    status: string;
    nama_perusahaan?: string;
    status_verifikasi?: string;
    document_status?: string;
  }>;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

const authHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export default function AdminReports() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [documentActionLoading, setDocumentActionLoading] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDocumentAction = async (userId: number, action: "approve" | "reject") => {
    if (!user?.token) return;

    try {
      setDocumentActionLoading((prev) => ({ ...prev, [userId]: true }));
      const endpoint =
        action === "approve"
          ? API_ENDPOINTS.approveMitraDocument(String(userId))
          : API_ENDPOINTS.rejectMitraDocument(String(userId));

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: authHeaders(user.token),
      });
      const data = (await response.json()) as ApiResponse<null>;

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Gagal memperbarui status dokumen.");
      }

      Alert.alert("Berhasil", action === "approve" ? "Dokumen mitra disetujui." : "Dokumen mitra ditolak.");
      await loadReports();
    } catch (nextError) {
      Alert.alert("Gagal", nextError instanceof Error ? nextError.message : "Gagal memperbarui status dokumen.");
    } finally {
      setDocumentActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const loadReports = useCallback(async () => {
    if (!user?.token) {
      setReportData(null);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_ENDPOINTS.getAdminReports, {
        headers: authHeaders(user.token),
      });
      const data = (await response.json()) as ApiResponse<ReportData>;

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Gagal memuat laporan admin");
      }

      setReportData(data.data ?? null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Gagal memuat laporan admin");
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useFocusEffect(
    useCallback(() => {
      void loadReports();
    }, [loadReports])
  );

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Laporan Admin</Text>
            <Text style={styles.subtitle}>Ringkasan pengguna, mitra, booking, dan dokumen.</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#1E3A8A" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#1E3A8A" />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? <ActivityIndicator color="#1E3A8A" style={styles.loader} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {reportData ? (
          <>
            <View style={styles.gridRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total User</Text>
                <Text style={styles.statValue}>{reportData.totalUsers}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Mitra</Text>
                <Text style={styles.statValue}>{reportData.totalMitras}</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Booking</Text>
                <Text style={styles.statValue}>{reportData.totalBookings}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Pendapatan</Text>
                <Text style={styles.statValue}>Rp {Number(reportData.totalRevenue || 0).toLocaleString("id-ID")}</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Mitra Pending</Text>
                <Text style={styles.statValue}>{reportData.pendingMitras}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Mitra Verified</Text>
                <Text style={styles.statValue}>{reportData.verifiedMitras}</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Dokumen Dikirim</Text>
                <Text style={styles.statValue}>{reportData.submittedDocuments}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Dokumen Disetujui</Text>
                <Text style={styles.statValue}>{reportData.approvedDocuments}</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.statCardWide}>
                <Text style={styles.statLabel}>Dokumen Ditolak</Text>
                <Text style={styles.statValue}>{reportData.rejectedDocuments}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Pengguna Terbaru</Text>
            {reportData.latestUsers.map((userItem) => (
              <View key={userItem.id} style={styles.userCard}>
                <View>
                  <Text style={styles.userName}>{userItem.nama}</Text>
                  <Text style={styles.userMeta}>{userItem.email}</Text>
                </View>
                <View style={styles.userStatusRow}>
                  <Text style={styles.userTag}>{userItem.role?.toUpperCase() || "USER"}</Text>
                  <Text style={styles.userTagSmall}>{userItem.status || "-"}</Text>
                </View>
                {userItem.role?.toLowerCase() === "mitra" ? (
                  <Text style={styles.userMeta}>
                    {userItem.nama_perusahaan ?? "Mitra"} • Doc {userItem.document_status ?? "-"}
                  </Text>
                ) : null}
              </View>
            ))}

            <Text style={styles.sectionTitle}>Dokumen Mitra Diajukan</Text>
            {reportData.submittedDocumentMitras.length > 0 ? (
              reportData.submittedDocumentMitras.map((mitraItem) => (
                <View key={mitraItem.id} style={styles.userCard}>
                  <View>
                    <Text style={styles.userName}>{mitraItem.nama}</Text>
                    <Text style={styles.userMeta}>{mitraItem.email}</Text>
                  </View>
                  <View style={styles.userStatusRow}>
                    <Text style={styles.userTag}>{mitraItem.role?.toUpperCase() || "MITRA"}</Text>
                    <Text style={styles.userTagSmall}>{mitraItem.document_status?.toUpperCase() || "-"}</Text>
                  </View>
                  <Text style={styles.userMeta}>{mitraItem.nama_perusahaan ?? "Mitra"}</Text>
                  <View style={styles.actionRow}> 
                    <TouchableOpacity
                      style={styles.actionButtonSmall}
                      onPress={() => void handleDocumentAction(mitraItem.id, "approve")}
                      disabled={Boolean(documentActionLoading[mitraItem.id])}
                    >
                      <Text style={styles.actionButtonTextSmall}>Setujui</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButtonSmall, styles.rejectButton]}
                      onPress={() => void handleDocumentAction(mitraItem.id, "reject")}
                      disabled={Boolean(documentActionLoading[mitraItem.id])}
                    >
                      <Text style={styles.actionButtonTextSmall}>Tolak</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Tidak ada dokumen mitra yang perlu ditinjau saat ini.</Text>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 36 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerActions: { flexDirection: "row", gap: 8 },
  headerButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  subtitle: { color: "#64748B", marginTop: 4, maxWidth: "72%" },
  loader: { marginVertical: 12 },
  errorText: { color: "#DC2626", marginBottom: 12, textAlign: "center" },
  gridRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  statCardWide: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  statLabel: { color: "#64748B", fontSize: 12, marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", marginVertical: 16 },
  userCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  userName: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  userMeta: { color: "#64748B", fontSize: 12, marginTop: 4 },
  userStatusRow: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  userTag: { color: "#1E3A8A", fontSize: 11, fontWeight: "700", backgroundColor: "#DBEAFE", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  userTagSmall: { color: "#475569", fontSize: 11, fontWeight: "700", backgroundColor: "#E2E8F0", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  actionButtonSmall: { flex: 1, backgroundColor: "#2563EB", borderRadius: 12, paddingVertical: 10, alignItems: "center", justifyContent: "center", marginRight: 8 },
  rejectButton: { backgroundColor: "#DC2626" },
  actionButtonTextSmall: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  emptyText: { color: "#64748B", fontSize: 13, marginTop: 8, textAlign: "center" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
});
