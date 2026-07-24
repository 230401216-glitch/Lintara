import { useAuth } from "@/lib/context/AuthContext";
import {
    BookingData,
    cancelBooking,
    confirmBookingPayment,
    getBookings,
    hydrateBookings
} from "@/lib/services/bookingStore";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function PesananScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = typeof params.bookingId === "string" ? params.bookingId : "";
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const { user } = useAuth();

  const selectedBooking = bookingId ? bookings.find((item) => item.id === bookingId) ?? null : null;
  const isMitra = user?.role === "mitra";

  const refresh = useCallback(async () => {
    await hydrateBookings(user?.token, user?.role);
    setBookings(getBookings());
  }, [user?.role, user?.token]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const handleCancel = (id: string) => {
    Alert.alert("Batalkan Pesanan", "Anda yakin ingin membatalkan pesanan ini?", [
      { text: "Tidak", style: "cancel" },
      {
        text: "Batalkan",
        style: "destructive",
        onPress: async () => {
          await cancelBooking(id, user?.token);
          void refresh();
        },
      },
    ]);
  };

  const handleConfirmPayment = (id: string) => {
    if (!isMitra) {
      Alert.alert("Akses Ditolak", "Hanya akun mitra yang dapat mengonfirmasi pembayaran.");
      return;
    }

    Alert.alert("Konfirmasi Pembayaran", "Tandai pesanan ini sebagai lunas?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Konfirmasi",
        onPress: async () => {
          await confirmBookingPayment(id, user?.token);
          void refresh();
        },
      },
    ]);
  };

  if (selectedBooking) {
    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.setParams({ bookingId: "" })}>
          <Text style={styles.backButtonText}>Kembali ke daftar</Text>
        </TouchableOpacity>
        <BookingDetail booking={selectedBooking} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Pesanan Saya</Text>

      {bookings.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Belum ada pesanan</Text>
          <Text style={styles.emptyText}>
            Cari travel, pilih tujuan, lalu buat booking untuk melihat tiket di sini.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/")}>
            <Text style={styles.primaryButtonText}>Cari Travel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        bookings.map((booking) => (
          <View key={booking.id} style={styles.card}>
            <Text style={styles.cardTitle}>{booking.travelName}</Text>
            <Text>Nama : {booking.nama}</Text>
            <Text>Rute : {booking.origin ?? "-"} ke {booking.destination}</Text>
            <Text>Jam : {booking.departureTime ?? "-"} - {booking.arrivalTime ?? "-"}</Text>
            <Text>Tanggal : {formatDate(booking.date)}</Text>
            <Text>Kursi : {booking.seats.join(", ")}</Text>
            <Text>Status Booking : {booking.bookingStatus}</Text>
            <Text>Status Pembayaran : {booking.paymentStatus}</Text>
            <Text style={styles.total}>Rp {booking.total.toLocaleString("id-ID")}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={() => router.setParams({ bookingId: booking.id })}
              >
                <Text style={styles.primaryButtonText}>Detail</Text>
              </TouchableOpacity>

              {booking.paymentStatus !== "LUNAS" && booking.bookingStatus !== "DIBATALKAN" ? (
                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={() =>
                    router.push({
                      pathname: "/payment",
                      params: {
                        bookingId: booking.id,
                        paymentMethod: booking.paymentMethod,
                        total: String(booking.total),
                      },
                    })
                  }
                >
                  <Text style={styles.secondaryActionText}>Bayar</Text>
                </TouchableOpacity>
              ) : null}

              {booking.bookingStatus === "MENUNGGU PERSETUJUAN MITRA" ? (
                <TouchableOpacity
                  style={styles.dangerAction}
                  onPress={() => handleCancel(booking.id)}
                >
                  <Text style={styles.dangerActionText}>Batal</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {booking.paymentStatus !== "LUNAS" && booking.bookingStatus !== "DIBATALKAN" && isMitra ? (
              <TouchableOpacity
                style={styles.paymentButton}
                onPress={() => handleConfirmPayment(booking.id)}
              >
                <Text style={styles.paymentButtonText}>Konfirmasi Pembayaran</Text>
              </TouchableOpacity>
            ) : null}

            {!isMitra && booking.paymentStatus !== "LUNAS" && booking.bookingStatus !== "DIBATALKAN" ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Hanya akun mitra yang dapat mengonfirmasi pembayaran.
                </Text>
              </View>
            ) : null}
          </View>
        ))
      )}

      <TouchableOpacity style={styles.refreshButton} onPress={() => void refresh()}>
        <Text style={styles.refreshButtonText}>Muat Ulang</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function BookingDetail({ booking }: Readonly<{ booking: BookingData }>) {
  const showTicket =
    booking.bookingStatus === "DISETUJUI MITRA" && booking.paymentStatus === "LUNAS";

  return (
    <>
      <Text style={styles.title}>Detail Pesanan</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{booking.travelName}</Text>
        <Text>Nama : {booking.nama}</Text>
        <Text>Nomor HP : {booking.hp}</Text>
        <Text>Rute : {booking.origin ?? "-"} ke {booking.destination}</Text>
        <Text>Jam : {booking.departureTime ?? "-"} - {booking.arrivalTime ?? "-"}</Text>
        <Text>Tanggal : {formatDate(booking.date)}</Text>
        <Text>Jenis Bus : {booking.busType}</Text>
        <Text>Penjemputan : {booking.pickupLocation}</Text>
        <Text>Kursi : {booking.seats.join(", ")}</Text>
        <Text>Status Booking : {booking.bookingStatus}</Text>
        <Text>Status Pembayaran : {booking.paymentStatus}</Text>
        <Text style={styles.total}>Total : Rp {booking.total.toLocaleString("id-ID")}</Text>

        {showTicket ? (
          <View style={styles.ticketBox}>
            <QRCode
              value={JSON.stringify({
                tiket: booking.ticketCode,
                nama: booking.nama,
                rute: `${booking.origin ?? "-"} ke ${booking.destination}`,
                travel: booking.travelName,
                jam: booking.departureTime,
                tanggal: booking.date,
                seats: booking.seats,
                total: booking.total,
              })}
              size={160}
            />
            <Text style={styles.ticketCode}>{booking.ticketCode}</Text>
          </View>
        ) : (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Tiket QR akan muncul setelah mitra menyetujui booking dan pembayaran ditandai lunas.
            </Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    elevation: 3,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  total: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: "#2563EB",
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 10,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: "#E0F2FE",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryActionText: {
    color: "#0369A1",
    fontWeight: "bold",
  },
  dangerAction: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#EF4444",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  dangerActionText: {
    color: "#EF4444",
    fontWeight: "bold",
  },
  paymentButton: {
    marginTop: 10,
    backgroundColor: "#16A34A",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  paymentButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 14,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  refreshButton: {
    padding: 14,
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
  },
  refreshButtonText: {
    color: "#111827",
    fontWeight: "bold",
  },
  emptyCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 14,
    elevation: 2,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyText: {
    color: "#64748B",
    marginTop: 8,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: "#2563EB",
    fontWeight: "bold",
  },
  ticketBox: {
    marginTop: 20,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
  },
  ticketCode: {
    marginTop: 12,
    fontWeight: "bold",
    color: "#1D4ED8",
  },
  infoBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  infoText: {
    color: "#78350F",
  },
});
