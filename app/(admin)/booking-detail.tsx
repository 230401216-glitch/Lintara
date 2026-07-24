import { API_BASE } from "@/constants/api";
import { useAuth } from "@/lib/context/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Booking = {
  id: number;
  booking_code?: string;
  travel_name?: string;
  tanggal?: string;
  jam_berangkat?: string;
  asal?: string;
  tujuan?: string;
  total_harga?: number;
  payment_status?: string;
  status_booking?: string;
  seats?: string[];
};

const authHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export default function AdminBookingDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const bookingId = String(params.id ?? "");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadBooking = useCallback(async () => {
    if (!user?.token || !bookingId) return;
    try {
      setLoading(true);
      const bookingUrl = `${API_BASE}/api/bookings/${bookingId}`;
      const res = await fetch(bookingUrl, { headers: authHeaders(user.token) });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || "Gagal memuat booking");
      setBooking(json.data ?? null);
    } catch (err) {
      Alert.alert("Gagal", err instanceof Error ? err.message : "Gagal memuat booking");
    } finally {
      setLoading(false);
    }
  }, [bookingId, user?.token]);

  useEffect(() => { void loadBooking(); }, [loadBooking]);

  const doAction = async (action: "cancel" | "refund" | "markCompleted") => {
    if (!user?.token || !bookingId) return;
    try {
      setActionLoading(true);
      let endpoint = "";
      let method: "PUT" | "POST" = "PUT";
      const bookingUrl = `${API_BASE}/api/bookings/${bookingId}`;
      if (action === "cancel") endpoint = bookingUrl;
      if (action === "refund") endpoint = `${bookingUrl}/refund`;
      if (action === "markCompleted") endpoint = `${bookingUrl}/complete`;

      const res = await fetch(endpoint, { method, headers: authHeaders(user.token) });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || "Gagal melakukan aksi");
      Alert.alert("Berhasil", (action === "cancel" && "Booking dibatalkan") || (action === "refund" && "Refund diproses") || "Status diperbarui");
      void loadBooking();
    } catch (err) {
      Alert.alert("Gagal", err instanceof Error ? err.message : "Gagal melakukan aksi");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Kembali</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator style={styles.loader} color="#1E3A8A" />
        ) : booking ? (
          <View style={styles.card}>
            <Text style={styles.title}>{booking.booking_code}</Text>
            <Text style={styles.meta}>{booking.travel_name}</Text>
            <Text style={styles.meta}>{booking.asal} → {booking.tujuan}</Text>
            <Text style={styles.meta}>{booking.tanggal} | {booking.jam_berangkat}</Text>
            <Text style={styles.total}>Rp {Number(booking.total_harga || 0).toLocaleString("id-ID")}</Text>

            <View style={styles.section}>
              <Text style={styles.label}>Status Pembayaran</Text>
              <Text style={styles.value}>{booking.payment_status || "-"}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Status Booking</Text>
              <Text style={styles.value}>{booking.status_booking || "-"}</Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.primaryButton} onPress={() => void doAction("cancel")} disabled={actionLoading}>
                <Text style={styles.primaryButtonText}>Batalkan</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => void doAction("refund")} disabled={actionLoading}>
                <Text style={styles.secondaryButtonText}>Refund</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tertiaryButton} onPress={() => void doAction("markCompleted")} disabled={actionLoading}>
                <Text style={styles.tertiaryButtonText}>Tandai Selesai</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>Booking tidak ditemukan.</Text>
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
  total: { fontSize: 16, fontWeight: "800", color: "#0F172A", marginTop: 8 },
  section: { marginTop: 12 },
  label: { color: "#64748B", fontSize: 12 },
  value: { fontWeight: "700", color: "#0F172A", marginTop: 4 },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  primaryButton: { flex: 1, backgroundColor: "#DC2626", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800" },
  secondaryButton: { flex: 1, backgroundColor: "#F59E0B", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  secondaryButtonText: { color: "#FFFFFF", fontWeight: "800" },
  tertiaryButton: { flex: 1, backgroundColor: "#16A34A", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tertiaryButtonText: { color: "#FFFFFF", fontWeight: "800" },
  emptyText: { color: "#64748B", textAlign: "center", marginTop: 20 },
});
