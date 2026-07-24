import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface BookingCardProps {
  code: string;
  passenger: string;
  route: string;
  status: string;
}

export default function BookingCard({ code, passenger, route, status }: BookingCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.code}>{code}</Text>
      <Text style={styles.passenger}>{passenger}</Text>
      <Text style={styles.route}>{route}</Text>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 10 },
  code: { fontSize: 13, fontWeight: "700", color: "#1E3A8A" },
  passenger: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginTop: 4 },
  route: { fontSize: 12, color: "#64748B", marginTop: 3 },
  status: { fontSize: 12, fontWeight: "700", color: "#0EA5E9", marginTop: 6 },
});
