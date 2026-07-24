import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_ENDPOINTS } from "@/constants/api";
import { useAuth } from "@/lib/context/AuthContext";
import {
  BookingData,
  getBookings,
  hydrateBookings,
} from "@/lib/services/bookingStore";
import {
  markDriverArrival,
  notifyPassengerArrival,
} from "@/lib/services/driverService";

// ==================== CONSTANT MESSAGE ====================
const MESSAGE = {
  EMPTY_CODE: "Masukkan kode tiket terlebih dahulu.",
  SYNC_FAILED: "Data booking belum bisa disinkronkan dari server.",
  VERIFY_FAILED: "Tiket tidak dapat diverifikasi.",
  VERIFY_SUCCESS: "Tiket berhasil diverifikasi.",
  SERVER_FAILED: "Server belum bisa memverifikasi tiket. Mencoba cache lokal.",
  FOUND: "Tiket ditemukan.",
  NOT_FOUND: "Tiket tidak ditemukan di data booking mitra.",
};

export default function ScanScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [code, setCode] = useState("");
  const [result, setResult] = useState<BookingData | null>(null);
  const [message, setMessage] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [markingArrival, setMarkingArrival] = useState(false);

  const refresh = useCallback(async () => {
    try {
      await hydrateBookings(user?.token, user?.role);
    } catch {
      setMessage(MESSAGE.SYNC_FAILED);
    }
  }, [user?.token, user?.role]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const verifyTicket = async () => {
    const normalizedCode = code.trim().toLowerCase();

    if (!normalizedCode) {
      setResult(null);
      setMessage(MESSAGE.EMPTY_CODE);
      return;
    }

    if (user?.token) {
      try {
        setVerifying(true);

        const response = await fetch(API_ENDPOINTS.scanTicket, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            code: code.trim(),
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setResult(null);
          setMessage(data.message || MESSAGE.VERIFY_FAILED);
          return;
        }

        setResult({
          id: String(data.data.booking_id),
          travelName: data.data.nama_travel,
          origin: data.data.asal,
          destination: data.data.tujuan,
          nama: data.data.nama_penumpang,
          hp: data.data.no_hp_penumpang,
          seats: [],
          total: 0,
          date: data.data.tanggal,
          busType: "-",
          pickupType: "-",
          pickupLocation: "-",
          paymentMethod: "-",
          paymentStatus: "LUNAS",
          bookingStatus: "DISETUJUI MITRA",
          ticketCode: data.data.kode_tiket,
        });

        setMessage(MESSAGE.VERIFY_SUCCESS);
        return;
      } catch {
        setMessage(MESSAGE.SERVER_FAILED);
      } finally {
        setVerifying(false);
      }
    }

    const booking = getBookings().find((item) =>
      [item.ticketCode, item.id].some(
        (value) =>
          String(value || "").trim().toLowerCase() === normalizedCode
      )
    );

    setResult(booking ?? null);
    setMessage(booking ? MESSAGE.FOUND : MESSAGE.NOT_FOUND);
  };

  const handleMarkArrival = async () => {
    if (!result || !user) {
      Alert.alert("Error", "Data tiket tidak lengkap");
      return;
    }

    try {
      setMarkingArrival(true);

      // Tandai kedatangan di database dan reset jam kerja
      const arrivalResult = await markDriverArrival(result.id, String(user.id), user.token);

      if (!arrivalResult.success) {
        Alert.alert("Gagal", arrivalResult.message);
        return;
      }

      // Kirim notifikasi ke penumpang
      const notificationResult = await notifyPassengerArrival(
        result.id,
        String(user.id),
        user.name || "Supir",
        user.phone || "N/A",
        result.ticketCode,
        result.hp || "N/A",
        result.nama,
        user.token
      );

      // Reset form
      setCode("");
      setResult(null);
      setMessage("");

      // Show success alert
      Alert.alert(
        "✓ Sampai di Tujuan",
        `Penumpang ${result.nama} telah diberitahu.\n\nJam kerja Anda direset otomatis.\n${notificationResult.message}`,
        [{ text: "OK", onPress: () => {} }]
      );
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Gagal mencatat kedatangan");
    } finally {
      setMarkingArrival(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color="#1E3A8A" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Scan QR</Text>
            <Text style={styles.subtitle}>
              Verifikasi tiket penumpang dari kode booking
            </Text>
          </View>
        </View>

        <View style={styles.scannerCard}>
          <View style={styles.scannerFrame}>
            <Ionicons name="qr-code-outline" size={72} color="#1E3A8A" />
          </View>

          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="Masukkan kode tiket atau ID booking"
            autoCapitalize="characters"
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => void verifyTicket()}
            disabled={verifying}
          >
            <Text style={styles.primaryButtonText}>
              {verifying ? "Memverifikasi..." : "Verifikasi Tiket"}
            </Text>
          </TouchableOpacity>

          {message ? (
            <Text style={result ? styles.successText : styles.errorText}>
              {message}
            </Text>
          ) : null}
        </View>

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>{result.nama}</Text>

            <Text style={styles.resultMeta}>
              {result.origin ?? "-"} → {result.destination}
            </Text>

            <Text style={styles.resultMeta}>
              Kursi {result.seats.join(", ") || "-"}
            </Text>

            <Text style={styles.resultMeta}>
              {result.bookingStatus} - {result.paymentStatus}
            </Text>

            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 12 }]}
              onPress={() => void handleMarkArrival()}
              disabled={markingArrival}
            >
              <Text style={styles.primaryButtonText}>
                {markingArrival ? "Menandai sampai..." : "Tandai Sudah Sampai"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    color: "#64748B",
    marginTop: 2,
  },
  scannerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  scannerFrame: {
    width: 220,
    height: 220,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#1E3A8A",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#1E3A8A",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  resultCard: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  resultMeta: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  successText: {
    color: "#047857",
    marginTop: 12,
    fontWeight: "700",
  },
  errorText: {
    color: "#DC2626",
    marginTop: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});