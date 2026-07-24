import { COMPANY_NAME } from "@/constants/company";
import { fetchTravelCatalog, formatCurrency, getRouteById, getTravelById, travelData } from "@/data/travel";
import { useAuth } from "@/lib/context/AuthContext";
import type { BookingData } from "@/lib/services/bookingStore";
import { createBookingOnServer, getBookings, hydrateBookings } from "@/lib/services/bookingStore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

const TOTAL_SEATS = 20;
const PAYMENT_ACCOUNT = "901206247959";

export default function Pesan() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const params = useLocalSearchParams();

  const travelId = typeof params.travelId === "string" ? params.travelId : undefined;
  const routeId = typeof params.routeId === "string" ? params.routeId : undefined;
  const scheduleId = typeof params.scheduleId === "string" ? params.scheduleId : undefined;
  const scheduleDate = typeof params.scheduleDate === "string" ? params.scheduleDate : undefined;
  const scheduleTime = typeof params.scheduleTime === "string" ? params.scheduleTime : undefined;
  const vehicleTypeParam = typeof params.vehicleType === "string" ? params.vehicleType : undefined;
  const availableSeatsParam = typeof params.availableSeats === "string" ? params.availableSeats : undefined;
  const initialDate = typeof params.date === "string" && params.date ? new Date(params.date) : new Date();
  const [catalog, setCatalog] = useState(travelData);
  const travel = useMemo(() => getTravelById(travelId, catalog), [catalog, travelId]);
  const route = useMemo(() => getRouteById(travel, routeId), [travel, routeId]);
  const travelName = travel.name;
  const destination = route.to;

  const [nama, setNama] = useState(user?.name ?? "");
  const [hp, setHp] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [jumlahTiket, setJumlahTiket] = useState("1");
  const [date, setDate] = useState(Number.isNaN(initialDate.getTime()) ? new Date() : initialDate);
  const [showDate, setShowDate] = useState(false);
  const [busType, setBusType] = useState(vehicleTypeParam === "Non AC" ? "Non AC" : "AC");
  const [payment, setPayment] = useState("QR Transfer");
  const [pickupType, setPickupType] = useState("Lokasi");
  const [pickupLocation, setPickupLocation] = useState("");
  const [bookedSeats, setBookedSeats] = useState<number[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  const harga = route.price;
  const ticketCount = useMemo(() => {
    const parsed = Number(jumlahTiket);
    if (!Number.isFinite(parsed)) return 1;
    return Math.min(Math.max(Math.floor(parsed), 1), 6);
  }, [jumlahTiket]);
  const total = harga * ticketCount;
  const paymentMode = payment === "Cash" ? "Cash" : "QR Transfer";
  const paymentStatus = paymentMode === "Cash" ? "BELUM LUNAS" : "MENUNGGU VERIFIKASI";

  useEffect(() => {
    setNama(user?.name ?? "");
    setHp(user?.phone ?? "");
    setEmail(user?.email ?? "");
  }, [user?.name, user?.phone, user?.email]);

  useEffect(() => {
    const loadCatalog = async () => {
      const nextCatalog = await fetchTravelCatalog();
      setCatalog(nextCatalog);
    };

    void loadCatalog();
  }, []);

  const filterOutBookedSeats = useCallback((seats: number[], booked: number[]) => {
    return seats.filter((seat) => !booked.includes(seat));
  }, []);

  const isBookingMatchingCriteria = useCallback(
  (booking: BookingData) => {
    return (
      booking.travelName === travelName &&
      booking.routeId === route.id &&
      booking.destination === destination &&
      new Date(booking.date).toDateString() === date.toDateString() &&
      booking.bookingStatus !== "DIBATALKAN"
    );
  },
  [travelName, route.id, destination, date]
);

useEffect(() => {
  const loadBookedSeats = async () => {
    await hydrateBookings();

    const bookedSeatsList = getBookings()
      .filter(isBookingMatchingCriteria)
      .flatMap((booking: BookingData) => booking.seats);

    const uniqueBookedSeats = [...new Set(bookedSeatsList)];

    setBookedSeats(uniqueBookedSeats);

    setSelectedSeats((prevSeats) =>
      filterOutBookedSeats(prevSeats, uniqueBookedSeats)
    );
  };

  void loadBookedSeats();
}, [isBookingMatchingCriteria, filterOutBookedSeats]);

  const handleJumlahTiketChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    setJumlahTiket(numericValue);
    const ticketLimit = Number(numericValue || 1);
    setSelectedSeats((currentSeats) => currentSeats.slice(0, ticketLimit));
  };

  const toggleSeat = (seat: number) => {
    if (bookedSeats.includes(seat)) return;

    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter((selectedSeat) => selectedSeat !== seat));
      return;
    }

    if (selectedSeats.length >= ticketCount) {
      Alert.alert("Info", "Jumlah kursi sudah sesuai jumlah tiket");
      return;
    }

    setSelectedSeats([...selectedSeats, seat]);
  };

  const handlePesan = async () => {
    if (!isLoggedIn) {
      Alert.alert("Perlu Login", "Silakan masuk untuk memesan tiket.", [
        { text: "Masuk", onPress: () => router.push("/login") },
      ]);
      return;
    }

    if (!nama.trim() || !hp.trim() || !email.trim()) {
      Alert.alert("Lengkapi Data", "Isi nama, nomor HP, dan email sebelum melanjutkan.");
      return;
    }

    if (pickupType === "Lokasi" && !pickupLocation.trim()) {
      Alert.alert("Lengkapi Data", "Masukkan lokasi penjemputan");
      return;
    }

    if (selectedSeats.length !== ticketCount) {
      Alert.alert("Kursi Belum Sesuai", "Jumlah kursi harus sama dengan jumlah tiket");
      return;
    }

    try {
      const booking = await createBookingOnServer(
        {
          id: Date.now().toString(),
          travelId: travel.id,
          routeId: route.id,
          travelName,
          origin: route.from,
          destination,
          departureTime: route.departureTime,
          arrivalTime: route.arrivalTime,
          nama: nama.trim(),
          hp: hp.trim(),
          email: email.trim(),
          seats: [...selectedSeats].sort((a, b) => a - b),
          total,
          date: date.toISOString(),
          busType,
          pickupType,
          pickupLocation: pickupType === "Lokasi" ? pickupLocation.trim() : "Loket",
          paymentMethod: paymentMode,
          paymentStatus,
          bookingStatus: "MENUNGGU PERSETUJUAN MITRA",
          ticketCode: `LTR-${Math.floor(100000 + Math.random() * 900000)}`,
          scheduleId,
        },
        user?.token
      );

      Alert.alert("Pemesanan Berhasil", "Booking berhasil dibuat.", [
        {
          text: "Lanjut Bayar",
          onPress: () => {
            router.push({
              pathname: "/payment",
              params: {
                bookingId: booking.id,
                paymentMethod: booking.paymentMethod,
                total: String(booking.total),
              },
            });
          },
        },
        {
          text: "Lihat Pesanan",
          onPress: () => {
            router.push({
              pathname: "/pesanan",
              params: { bookingId: booking.id },
            });
          },
        },
      ]);
    } catch (error) {
      Alert.alert("Gagal Membuat Booking", error instanceof Error ? error.message : "Silakan coba lagi.");
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Pemesanan Tiket</Text>

      <TextInput
        style={styles.input}
        placeholder="Nama Lengkap"
        value={nama}
        onChangeText={setNama}
      />

      <TextInput
        style={styles.input}
        placeholder="Nomor HP"
        keyboardType="phone-pad"
        value={hp}
        onChangeText={setHp}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Travel</Text>
      <View style={styles.box}>
        <Text>{travelName}</Text>
      </View>

      <Text style={styles.label}>Tujuan</Text>
      <View style={styles.destinationBox}>
        <Text style={styles.destinationText}>
          {route.from} ke {route.to}
        </Text>
        <Text style={styles.destinationTime}>
          {scheduleTime || route.departureTime} • {scheduleDate ? new Date(scheduleDate).toLocaleDateString("id-ID") : date.toLocaleDateString("id-ID")}
        </Text>
        {availableSeatsParam ? (
          <Text style={styles.destinationTime}>Kursi tersedia: {availableSeatsParam}</Text>
        ) : null}
      </View>

      <Text style={styles.label}>Jumlah Tiket</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={jumlahTiket}
        onChangeText={handleJumlahTiketChange}
        onBlur={() => setJumlahTiket(String(ticketCount))}
      />

      <Text style={styles.label}>Tanggal Keberangkatan</Text>
      <TouchableOpacity style={styles.dateBox} onPress={() => setShowDate(true)}>
        <Text>{date.toLocaleDateString("id-ID")}</Text>
      </TouchableOpacity>

      {showDate && (
        <DateTimePicker
          value={date}
          mode="date"
          minimumDate={new Date()}
          onChange={(_, selectedDate) => {
            setShowDate(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      <Text style={styles.label}>AC / Non AC</Text>
      <View style={styles.row}>
        {["AC", "Non AC"].map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.option, busType === item && styles.active]}
            onPress={() => setBusType(item)}
          >
            <Text style={busType === item ? styles.activeOptionText : styles.optionText}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Penjemputan</Text>
      <View style={styles.row}>
        {["Lokasi", "Loket"].map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.option, pickupType === item && styles.active]}
            onPress={() => setPickupType(item)}
          >
            <Text style={pickupType === item ? styles.activeOptionText : styles.optionText}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {pickupType === "Lokasi" && (
        <TextInput
          style={styles.input}
          placeholder="Masukkan lokasi jemput"
          value={pickupLocation}
          onChangeText={setPickupLocation}
        />
      )}

      <Text style={styles.label}>Metode Pembayaran</Text>
      <View style={styles.row}>
        {["QR Transfer", "Cash"].map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.option, payment === item && styles.active]}
            onPress={() => setPayment(item)}
          >
            <Text style={payment === item ? styles.activeOptionText : styles.optionText}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {payment === "QR Transfer" && (
        <View style={styles.qrBox}>
          <Text style={styles.qrTitle}>Scan QR Pembayaran</Text>
          <View style={styles.qrContainer}>
            <QRCode
              value={JSON.stringify({
                travel: travelName,
                rute: `${route.from} ke ${route.to}`,
                berangkat: route.departureTime,
                rekening: PAYMENT_ACCOUNT,
                total,
              })}
              size={180}
            />
          </View>
          <Text style={styles.qrNumber}>Rekening: {PAYMENT_ACCOUNT}</Text>
          <Text style={styles.qrInfo}>Total Bayar {formatCurrency(total)}</Text>
        </View>
      )}

      {payment === "Transfer Bank" && (
        <View style={styles.paymentInfoCard}>
          <Text style={styles.paymentInfoTitle}>Transfer Bank</Text>
          <Text style={styles.paymentInfoText}>Bank BCA • 1234567890 • {COMPANY_NAME}</Text>
          <Text style={styles.paymentInfoText}>Konfirmasi pembayaran akan diproses maksimal 15 menit setelah bukti transfer diunggah.</Text>
        </View>
      )}

      {payment === "Cash" && (
        <View style={styles.paymentInfoCard}>
          <Text style={styles.paymentInfoTitle}>Bayar di Loket</Text>
          <Text style={styles.paymentInfoText}>Pembayaran dilakukan langsung saat penumpang datang ke loket resmi {COMPANY_NAME}.</Text>
        </View>
      )}

      {payment === "E-Wallet" && (
        <View style={styles.paymentInfoCard}>
          <Text style={styles.paymentInfoTitle}>E-Wallet</Text>
          <Text style={styles.paymentInfoText}>Dukungan GoPay, OVO, dan Dana. Silakan gunakan akun yang terdaftar.</Text>
        </View>
      )}

      <Text style={styles.label}>Pilih Kursi</Text>
      <View style={styles.legendRow}>
        <Text style={styles.legendText}>Abu-abu: terisi</Text>
        <Text style={styles.legendText}>Biru: dipilih</Text>
      </View>

      <View style={styles.seatGrid}>
        {Array.from({ length: TOTAL_SEATS }, (_, index) => {
          const seat = index + 1;
          const isBooked = bookedSeats.includes(seat);
          const isSelected = selectedSeats.includes(seat);

          return (
            <TouchableOpacity
              key={seat}
              disabled={isBooked}
              onPress={() => toggleSeat(seat)}
              style={[styles.seat, isBooked && styles.bookedSeat, isSelected && styles.selectedSeat]}
            >
              <Text style={styles.seatText}>{seat}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.summary}>
        <Text>Travel : {travelName}</Text>
        <Text>Rute : {route.from} ke {route.to}</Text>
        <Text>Jam : {route.departureTime} - {route.arrivalTime}</Text>
        <Text>Harga/Tiket : {formatCurrency(harga)}</Text>
        <Text>Jumlah Tiket : {ticketCount}</Text>
        <Text>Kursi : {selectedSeats.join(", ") || "-"}</Text>
        <Text style={styles.total}>Total : {formatCurrency(total)}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handlePesan}>
        <Text style={styles.buttonText}>Bayar & Pesan Tiket</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F8FAFC",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },
  label: {
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  box: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
  },
  destinationBox: {
    backgroundColor: "#DBEAFE",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2563EB",
  },
  destinationText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563EB",
  },
  destinationTime: {
    textAlign: "center",
    color: "#1E40AF",
    marginTop: 5,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  option: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  active: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  optionText: {
    color: "#000",
  },
  activeOptionText: {
    color: "#fff",
  },
  dateBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  qrBox: {
    backgroundColor: "#EFF6FF",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  qrTitle: {
    fontWeight: "bold",
    textAlign: "center",
  },
  qrContainer: {
    alignItems: "center",
    marginVertical: 15,
  },
  qrNumber: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
    color: "#2563EB",
  },
  qrInfo: {
    textAlign: "center",
    color: "#64748B",
  },
  paymentInfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  paymentInfoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  paymentInfoText: {
    color: "#475569",
    marginTop: 4,
  },
  legendRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 6,
  },
  legendText: {
    color: "#64748B",
    fontSize: 12,
  },
  seatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  seat: {
    width: 45,
    height: 45,
    margin: 5,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#475569",
  },
  bookedSeat: {
    backgroundColor: "#9CA3AF",
  },
  selectedSeat: {
    backgroundColor: "#2563EB",
  },
  seatText: {
    color: "#fff",
    fontWeight: "bold",
  },
  summary: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
  },
  total: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563EB",
  },
  button: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  bottomSpacer: {
    height: 30,
  },
});
