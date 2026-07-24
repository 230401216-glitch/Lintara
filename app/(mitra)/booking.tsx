import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // NOSONAR: S1874 - SafeAreaView from safe-area-context is not deprecated

import { useAuth } from "@/lib/context/AuthContext";
import {
  BookingData,
  confirmBookingPayment,
  getBookings,
  hydrateBookings,
} from "@/lib/services/bookingStore";
import DashboardCard from "../../components/mitra/DashboardCard";

export default function BookingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingData[]>(getBookings());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      await hydrateBookings(user?.token, user?.role);
      setBookings(getBookings());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Gagal memuat booking");
    } finally {
      setLoading(false);
    }
  }, [user?.role, user?.token]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const handleConfirm = async (booking: BookingData) => {
    try {
      setProcessingId(booking.id);
      setError("");
      await confirmBookingPayment(booking.id, user?.token, booking.paymentMethod);
      setBookings(getBookings());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Gagal mengonfirmasi booking");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#1E3A8A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Booking</Text>
            <Text style={styles.subtitle}>Pantau semua reservasi penumpang</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={refresh} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Refresh Booking</Text>}
        </TouchableOpacity>

        <DashboardCard title="Daftar Booking" subtitle="Data booking terbaru">
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {bookings.map((item) => (
            <View key={item.id} style={styles.rowCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.ticketCode || item.id} - {item.nama}</Text>
                <Text style={styles.rowMeta}>{item.origin ?? "-"}{" -> "}{item.destination} - Kursi {item.seats.join(", ") || "-"}</Text>
                <Text style={styles.rowMeta}>{item.hp} - {item.paymentStatus}</Text>
                {item.bookingStatus.includes("MENUNGGU") ? (
                  <TouchableOpacity style={styles.inlineButton} onPress={() => handleConfirm(item)} disabled={processingId === item.id}>
                    {processingId === item.id ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.inlineButtonText}>Konfirmasi</Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.bookingStatus}</Text>
              </View>
            </View>
          ))}
          {!loading && !error && bookings.length === 0 ? <Text style={styles.emptyText}>Belum ada booking untuk mitra ini.</Text> : null}
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
  rowCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  rowTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  rowMeta: { fontSize: 12, color: "#64748B", marginTop: 2 },
  statusBadge: { backgroundColor: "#DBEAFE", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, maxWidth: 120 },
  statusText: { fontSize: 11, fontWeight: "700", color: "#1E3A8A", textAlign: "center" },
  inlineButton: { marginTop: 8, backgroundColor: "#1E3A8A", alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, minWidth: 92, alignItems: "center" },
  inlineButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  emptyText: { color: "#64748B", fontSize: 13, paddingVertical: 8 },
  errorText: { color: "#DC2626", fontSize: 13, paddingVertical: 8 },
});
