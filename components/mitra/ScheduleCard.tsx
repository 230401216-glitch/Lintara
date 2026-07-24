import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ScheduleCardProps {
  route: string;
  time: string;
  vehicle: string;
  status: string;
}

export default function ScheduleCard({ route, time, vehicle, status }: ScheduleCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.route}>{route}</Text>
      <Text style={styles.meta}>{time} • {vehicle}</Text>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 10 },
  route: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  meta: { fontSize: 12, color: "#64748B", marginTop: 4 },
  status: { fontSize: 12, fontWeight: "700", color: "#1E3A8A", marginTop: 6 },
});
