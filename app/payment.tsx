import { COMPANY_NAME } from "@/constants/company";
import { formatCurrency } from "@/data/travel";
import { useAuth } from "@/lib/context/AuthContext";
import { confirmBookingPayment, getBookingById, hydrateBookings } from "@/lib/services/bookingStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

const PAYMENT_ACCOUNT = "901206247959";

export default function PaymentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const bookingId = typeof params.bookingId === "string" ? params.bookingId : "";
  const initialMethod = typeof params.paymentMethod === "string" ? params.paymentMethod : "QRIS";
  const totalValue = typeof params.total === "string" ? Number(params.total) : 0;
  const [booking, setBooking] = useState(() => getBookingById(bookingId));
  const [selectedMethod, setSelectedMethod] = useState(initialMethod);

  useEffect(() => {
    const loadBooking = async () => {
      if (bookingId && user?.token) {
        await hydrateBookings(user.token, user.role);
        setBooking(getBookingById(bookingId));
      }
    };

    void loadBooking();
  }, [bookingId, user?.token, user?.role]);

  const amount = useMemo(() => Number(booking?.total ?? totalValue ?? 0), [booking, totalValue]);

  const handleConfirm = async () => {
    if (!booking) {
      Alert.alert("Data Tidak Ditemukan", "Booking tidak ditemukan.");
      return;
    }

    const success = await confirmBookingPayment(booking.id, user?.token, selectedMethod);
    if (!success) {
      Alert.alert("Gagal", "Tidak dapat mengonfirmasi pembayaran saat ini.");
      return;
    }

    Alert.alert("Pembayaran Dikonfirmasi", "Tiket digital Anda siap ditampilkan.");
    router.replace({ pathname: "/ticket", params: { bookingId: booking.id } });
  };

  const renderPaymentDetails = () => {
    if (selectedMethod === "Transfer Bank") {
      return (
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Transfer Bank</Text>
          <Text style={styles.infoText}>Bank BCA</Text>
          <Text style={styles.infoText}>No. Rekening: 1234567890</Text>
          <Text style={styles.infoText}>Atas nama: {COMPANY_NAME}</Text>
          <Text style={styles.infoText}>Konfirmasi otomatis dalam 15 menit.</Text>
        </View>
      );
    }

    if (selectedMethod === "Tunai") {
      return (
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Bayar di Loket</Text>
          <Text style={styles.infoText}>Bayar langsung saat datang ke loket {COMPANY_NAME}.</Text>
          <Text style={styles.infoText}>Petugas akan memproses booking Anda setelah pembayaran diterima.</Text>
        </View>
      );
    }

    return (
      <View style={styles.qrCard}>
        <Text style={styles.cardTitle}>QRIS Pembayaran</Text>
        <View style={styles.qrBox}>
          <QRCode value={JSON.stringify({ bookingId: booking?.id, amount, method: selectedMethod })} size={200} />
        </View>
        <Text style={styles.infoText}>Rekening tujuan: {PAYMENT_ACCOUNT}</Text>
        <Text style={styles.infoText}>Total: {formatCurrency(amount)}</Text>
      </View>
    );
  };

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.title}>Memuat pembayaran...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Pembayaran</Text>
        <Text style={styles.subtitle}>Pilih metode pembayaran yang Anda inginkan.</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Booking</Text>
          <Text style={styles.summaryValue}>{booking.travelName}</Text>
          <Text style={styles.summaryText}>{booking.origin} → {booking.destination}</Text>
          <Text style={styles.summaryText}>Kursi: {booking.seats.join(", ")}</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(amount)}</Text>
        </View>

        <View style={styles.optionRow}>
          {["QRIS", "Transfer Bank", "Tunai"].map((method) => (
            <TouchableOpacity key={method} style={[styles.optionChip, selectedMethod === method && styles.optionChipActive]} onPress={() => setSelectedMethod(method)}>
              <Text style={[styles.optionText, selectedMethod === method && styles.optionTextActive]}>{method}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderPaymentDetails()}

        <View style={styles.helperCard}>
          <Text style={styles.helperTitle}>Status Pelanggan</Text>
          <Text style={styles.helperText}>Halo {user?.name ?? booking.nama}, pembayaran Anda akan diproses setelah dikonfirmasi.</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleConfirm}>
          <Text style={styles.primaryButtonText}>Konfirmasi & Lanjut ke Tiket</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  subtitle: { color: "#64748B", marginTop: 6, marginBottom: 16 },
  summaryCard: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 14 },
  summaryLabel: { fontSize: 12, color: "#64748B", textTransform: "uppercase", fontWeight: "700" },
  summaryValue: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 4 },
  summaryText: { color: "#475569", marginTop: 4 },
  summaryAmount: { marginTop: 10, fontSize: 20, fontWeight: "800", color: "#1E3A8A" },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  optionChip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: "#CBD5E1", backgroundColor: "#FFFFFF" },
  optionChipActive: { backgroundColor: "#1E40AF", borderColor: "#1E40AF" },
  optionText: { color: "#0F172A", fontWeight: "700" },
  optionTextActive: { color: "#FFFFFF" },
  infoCard: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 14 },
  qrCard: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 14, alignItems: "center" },
  qrBox: { marginVertical: 12 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", marginBottom: 8 },
  infoText: { color: "#475569", marginTop: 4 },
  helperCard: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE", borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 14 },
  helperTitle: { fontSize: 14, fontWeight: "800", color: "#1E3A8A" },
  helperText: { color: "#334155", marginTop: 4 },
  primaryButton: { backgroundColor: "#1E3A8A", paddingVertical: 14, borderRadius: 14, alignItems: "center", marginTop: 6 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
});
