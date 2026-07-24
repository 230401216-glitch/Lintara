import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MitraDocuments() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Dokumen Resmi</Text>
        <Text style={styles.subtitle}>Status dan riwayat dokumen yang diunggah</Text>

        <View style={styles.card}>
          <Image source={{ uri: "https://via.placeholder.com/300x180.png?text=Dokumen" }} style={styles.image} />
          <Text style={styles.cardMeta}>Status: SUBMITTED</Text>
          <View style={{ marginTop: 12 }}>
            <TouchableOpacity style={styles.primaryButton}><Text style={styles.primaryButtonText}>Unduh</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  subtitle: { color: "#64748B", marginBottom: 12 },
  card: { backgroundColor: "#FFFFFF", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  image: { width: "100%", height: 180, borderRadius: 10, marginBottom: 8 },
  cardMeta: { color: "#64748B" },
  primaryButton: { marginTop: 8, backgroundColor: "#2563EB", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800" },
});
