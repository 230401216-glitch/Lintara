import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface DriverCardProps {
  name: string;
  status: string;
  vehicle: string;
}

export default function DriverCard({ name, status, vehicle }: DriverCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.meta}>Armada: {vehicle}</Text>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 10 },
  name: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  meta: { fontSize: 12, color: "#64748B", marginTop: 4 },
  status: { fontSize: 12, fontWeight: "700", color: "#1E3A8A", marginTop: 6 },
});
