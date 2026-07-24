import { COMPANY_NAME } from "@/constants/company";
import { formatCurrency } from "@/data/travel";
import { useAuth } from "@/lib/context/AuthContext";
import { getBookingById, hydrateBookings } from "@/lib/services/bookingStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TicketScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const bookingId = typeof params.bookingId === "string" ? params.bookingId : "";
  const [booking, setBooking] = useState(() => getBookingById(bookingId));
  const [viewMode, setViewMode] = useState<"digital" | "document">("digital");
  const [isCounter, setIsCounter] = useState(false);

  useEffect(() => {
    const loadBooking = async () => {
      await hydrateBookings(user?.token, user?.role);
      const loadedBooking = getBookingById(bookingId);
      setBooking(loadedBooking);
      
      // Check if ticket is from counter/terminal (based on payment method or source)
      if (loadedBooking?.paymentMethod === "counter" || (loadedBooking as any)?.source === "loket") {
        setIsCounter(true);
      }
    };

    void loadBooking();
  }, [bookingId, user?.role, user?.token]);

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.title}>Tiket tidak ditemukan</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerControls}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#1E3A8A" />
          </TouchableOpacity>
          
          <View style={styles.viewModeToggle}>
            <TouchableOpacity 
              style={[styles.toggleButton, viewMode === "digital" && styles.toggleButtonActive]}
              onPress={() => setViewMode("digital")}
            >
              <Ionicons name="phone-portrait" size={16} color={viewMode === "digital" ? "#FFFFFF" : "#64748B"} />
              <Text style={[styles.toggleText, viewMode === "digital" && styles.toggleTextActive]}>Digital</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, viewMode === "document" && styles.toggleButtonActive]}
              onPress={() => setViewMode("document")}
            >
              <Ionicons name="document-text" size={16} color={viewMode === "document" ? "#FFFFFF" : "#64748B"} />
              <Text style={[styles.toggleText, viewMode === "document" && styles.toggleTextActive]}>Dokumen</Text>
            </TouchableOpacity>
          </View>
        </View>

        {viewMode === "digital" ? (
          <>
            <Text style={styles.title}>Tiket Digital</Text>
            <Text style={styles.subtitle}>Tiket Anda telah siap digunakan.</Text>

            <View style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketBrand}>{COMPANY_NAME}</Text>
                <Text style={styles.ticketStatus}>{booking.paymentStatus}</Text>
              </View>

              <Text style={styles.ticketName}>{booking.nama}</Text>
              <Text style={styles.ticketMeta}>Kode Booking: {booking.ticketCode}</Text>
              <Text style={styles.ticketMeta}>Travel: {booking.travelName}</Text>
              <Text style={styles.ticketMeta}>Rute: {booking.origin} ke {booking.destination}</Text>
              <Text style={styles.ticketMeta}>Tanggal: {new Date(booking.date).toLocaleDateString("id-ID")}</Text>
              <Text style={styles.ticketMeta}>Kursi: {booking.seats.join(", ")}</Text>
              <Text style={styles.ticketMeta}>Jenis Armada: {booking.busType}</Text>
              <Text style={styles.ticketMeta}>Total: {formatCurrency(booking.total)}</Text>

              <View style={styles.qrWrap}>
                <QRCode value={JSON.stringify({ code: booking.ticketCode, name: booking.nama })} size={180} />
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.documentTitle}>DOKUMEN TIKET PERJALANAN</Text>
            {isCounter && <Text style={styles.counterBadge}>Tiket Loket/Terminal</Text>}

            <View style={styles.documentCard}>
              <View style={styles.documentHeader}>
                <Text style={styles.documentCompanyName}>{COMPANY_NAME}</Text>
                <Text style={styles.documentCode}>#{booking.ticketCode}</Text>
              </View>

              <View style={styles.documentLine} />

              <View style={styles.documentSection}>
                <Text style={styles.documentSectionLabel}>PENUMPANG</Text>
                <Text style={styles.documentValue}>{booking.nama}</Text>
              </View>

              <View style={styles.documentSection}>
                <Text style={styles.documentSectionLabel}>RUTE PERJALANAN</Text>
                <View style={styles.routeBox}>
                  <View style={styles.routePoint}>
                    <Text style={styles.routeLabel}>BERANGKAT</Text>
                    <Text style={styles.routeCity}>{booking.origin}</Text>
                  </View>
                  <View style={styles.routeArrow}>
                    <Ionicons name="arrow-forward" size={24} color="#1E3A8A" />
                  </View>
                  <View style={styles.routePoint}>
                    <Text style={styles.routeLabel}>TUJUAN</Text>
                    <Text style={styles.routeCity}>{booking.destination}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.documentSection}>
                <Text style={styles.documentSectionLabel}>DETAIL PERJALANAN</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tanggal Keberangkatan:</Text>
                  <Text style={styles.detailValue}>{new Date(booking.date).toLocaleDateString("id-ID")}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nama Armada:</Text>
                  <Text style={styles.detailValue}>{booking.travelName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tipe Armada:</Text>
                  <Text style={styles.detailValue}>{booking.busType}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nomor Kursi:</Text>
                  <Text style={styles.detailValue}>{booking.seats.join(", ")}</Text>
                </View>
              </View>

              <View style={styles.documentSection}>
                <Text style={styles.documentSectionLabel}>PEMBAYARAN</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Tarif:</Text>
                  <Text style={styles.priceValue}>{formatCurrency(booking.total)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[styles.detailValue, { color: "#16A34A", fontWeight: "700" }]}>{booking.paymentStatus}</Text>
                </View>
              </View>

              <View style={styles.documentLine} />

              <View style={styles.qrDocumentWrap}>
                <Text style={styles.qrLabel}>Scan Barcode Tiket</Text>
                <QRCode value={JSON.stringify({ code: booking.ticketCode, name: booking.nama })} size={140} />
                <Text style={styles.qrCode}>{booking.ticketCode}</Text>
              </View>

              <View style={styles.documentFooter}>
                <Text style={styles.footerText}>Tunjukkan dokumen ini saat memasuki terminal</Text>
                <Text style={styles.footerText}>atau saat check-in di mitra.</Text>
              </View>
            </View>
          </>
        )}

        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.primaryButtonText}>Kembali ke Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 32 },
  
  // Header Controls
  headerControls: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 16,
    justifyContent: "space-between",
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: "#FFFFFF", 
    alignItems: "center", 
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  viewModeToggle: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: "#1E3A8A",
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },

  // Digital View
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  subtitle: { color: "#64748B", marginTop: 6, marginBottom: 16 },
  ticketCard: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 18, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 16 },
  ticketHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ticketBrand: { fontSize: 18, fontWeight: "800", color: "#1E3A8A" },
  ticketStatus: { color: "#16A34A", fontWeight: "700" },
  ticketName: { fontSize: 20, fontWeight: "800", color: "#0F172A", marginTop: 12 },
  ticketMeta: { color: "#475569", marginTop: 6 },
  qrWrap: { marginTop: 18, alignItems: "center" },

  // Document View
  documentTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  counterBadge: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 12,
  },
  documentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#000000",
    marginBottom: 16,
  },
  documentHeader: {
    alignItems: "center",
    marginBottom: 8,
  },
  documentCompanyName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  documentCode: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 4,
  },
  documentLine: {
    height: 2,
    backgroundColor: "#000000",
    marginVertical: 12,
  },
  documentSection: {
    marginBottom: 12,
  },
  documentSectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#000000",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  documentValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  routeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  routePoint: {
    flex: 1,
    alignItems: "center",
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
  },
  routeCity: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  routeArrow: {
    marginHorizontal: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
    textAlign: "right",
    flex: 1,
    marginLeft: 8,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E3A8A",
    textAlign: "right",
    flex: 1,
    marginLeft: 8,
  },
  qrDocumentWrap: {
    alignItems: "center",
    marginVertical: 12,
  },
  qrLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
  },
  qrCode: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 8,
    letterSpacing: 2,
  },
  documentFooter: {
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  footerText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },

  // Buttons
  primaryButton: { backgroundColor: "#1E3A8A", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
});
