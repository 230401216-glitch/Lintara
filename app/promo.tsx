import { useRouter } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function Promo() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Promo Lintara</Text>
        <Text style={styles.subtitle}>
          Nikmati potongan harga perjalanan terbaik.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Diskon 30% untuk pengguna baru
        </Text>
        <Text style={styles.cardText}>
          Gunakan layanan Lintara sekarang dan dapatkan
          potongan harga langsung pada pembelian tiket pertama.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/")}
        >
          <Text style={styles.buttonText}>
            Kembali ke Beranda
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#64748B",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  cardText: {
    color: "#475569",
    marginBottom: 20,
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
