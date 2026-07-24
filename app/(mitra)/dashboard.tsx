import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { APP_NAME } from "@/constants/company";
import { useAuth } from "@/lib/context/AuthContext";
import {
    formatCurrency,
    formatDate,
    formatRoute,
    loadMitraDashboardData,
    MitraDashboardData,
} from "@/lib/services/mitraData";
import DashboardCard from "../../components/mitra/DashboardCard";
import MenuCard from "../../components/mitra/MenuCard";
import StatCard from "../../components/mitra/StatCard";

const quickMenus = [
  { title: "Armada & Jadwal", subtitle: "Kelola armada, rute, tarif, dan jadwal", iconName: "bus-outline", color: "#1E3A8A", route: "/(mitra)/armada" },
  { title: "Supir", subtitle: "Kontak dari booking", iconName: "person-outline", color: "#2563EB", route: "/(mitra)/supir" },
  { title: "Booking", subtitle: "Pantau reservasi", iconName: "calendar-outline", color: "#8B5CF6", route: "/(mitra)/booking" },
  { title: "Scan QR", subtitle: "Cek tiket", iconName: "qr-code-outline", color: "#F59E0B", route: "/(mitra)/scan" },
];

const emptyData: MitraDashboardData = {
  travels: [],
  routes: [],
  schedules: [],
  bookings: [],
  drivers: [],
};

export default function MitraDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [timeFilter, setTimeFilter] = useState<"Hari" | "Minggu" | "Bulan">("Hari");
  const [data, setData] = useState<MitraDashboardData>(emptyData);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setError("");
      setData(await loadMitraDashboardData(user?.token, user?.role, user?.id));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Gagal memuat data mitra");
    }
  }, [user?.id, user?.role, user?.token]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const summaryStats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayBookings = data.bookings.filter((item) => String(item.date).startsWith(today));
    const passengers = data.bookings.reduce((total, item) => total + item.seats.length, 0);
    const revenue = data.bookings
      .filter((item) => item.paymentStatus === "LUNAS")
      .reduce((total, item) => total + item.total, 0);

    return [
      {
        label: "Booking Hari Ini",
        value: String(todayBookings.length),
        iconName: "ticket-outline",
        color: "#1E3A8A",
        subtitle: `${data.bookings.length} total booking`,
      },
      {
        label: "Penumpang",
        value: String(passengers),
        iconName: "people-outline",
        color: "#0EA5E9",
        subtitle: "Dari semua booking",
      },
      {
        label: "Perjalanan",
        value: String(data.schedules.length),
        iconName: "bus-outline",
        color: "#14B8A6",
        subtitle: `${data.routes.length} rute aktif`,
      },
      {
        label: "Pendapatan",
        value: formatCurrency(revenue),
        iconName: "cash-outline",
        color: "#F59E0B",
        subtitle: "Booking lunas",
      },
    ];
  }, [data]);

  const notifications = useMemo(
    () => [
      {
        id: "booking",
        title: "Booking menunggu",
        detail: `${data.bookings.filter((item) => item.bookingStatus.includes("MENUNGGU")).length} booking perlu dicek.`,
      },
      {
        id: "schedule",
        title: "Jadwal tersedia",
        detail: `${data.schedules.length} jadwal aktif dari database.`,
      },
    ],
    [data.bookings, data.schedules.length]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandWrap}>
            <View style={styles.logoWrap}>
              <Text style={styles.logoText}>LT</Text>
            </View>
            <View>
              <Text style={styles.brandName}>{APP_NAME}</Text>
              <Text style={styles.brandSubtitle}>Dashboard Mitra</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.8} onPress={refresh}>
            <Ionicons name="refresh" size={20} color="#1E3A8A" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Operasional Hari Ini</Text>
          <Text style={styles.heroTitle}>Pantau booking, penumpang, dan pendapatan secara cepat.</Text>
          <Text style={styles.heroSubtitle}>Data diambil dari API dan database Lintara.</Text>
        </View>

        <View style={styles.filterRow}>
          {(["Hari", "Minggu", "Bulan"] as const).map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filterChip, timeFilter === item && styles.filterChipActive]}
              onPress={() => setTimeFilter(item)}
            >
              <Text style={[styles.filterText, timeFilter === item && styles.filterTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsGrid}>
          {summaryStats.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </View>

        <DashboardCard title="Jadwal Hari Ini" subtitle="Perjalanan yang sedang berjalan dan akan berangkat">
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {data.schedules.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.scheduleItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.scheduleRoute}>{formatRoute(item.origin, item.destination)}</Text>
                <Text style={styles.scheduleMeta}>{formatDate(item.date)} - {item.departureTime} - {item.totalSeats} kursi</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
          ))}
          {!data.schedules.length && !error ? <Text style={styles.emptyText}>Belum ada jadwal dari database.</Text> : null}
        </DashboardCard>

        <DashboardCard title="Notifikasi" subtitle="Pemberitahuan penting untuk tim mitra">
          <FlatList
            scrollEnabled={false}
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.notificationItem}>
                <Ionicons name="alert-circle-outline" size={18} color="#F59E0B" />
                <View style={styles.notificationTextWrap}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationDetail}>{item.detail}</Text>
                </View>
              </View>
            )}
          />
        </DashboardCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Menu</Text>
          <Text style={styles.sectionSubtitle}>Akses fitur penting dengan cepat</Text>
        </View>

        {quickMenus.map((item) => (
          <MenuCard
            key={item.title}
            title={item.title}
            subtitle={item.subtitle}
            iconName={item.iconName}
            color={item.color}
            onPress={() => router.push(item.route)}
          />
        ))}
      </ScrollView>
    </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 18,
  },
  brandName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  brandSubtitle: {
    fontSize: 12,
    color: "#64748B",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  heroCard: {
    backgroundColor: "#1E3A8A",
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  heroEyebrow: {
    color: "#BFDBFE",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  heroSubtitle: {
    color: "#DBEAFE",
    fontSize: 13,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
  },
  filterChipActive: {
    backgroundColor: "#1E3A8A",
  },
  filterText: {
    color: "#475569",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  scheduleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  scheduleRoute: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  scheduleMeta: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
  },
  statusBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    color: "#1E3A8A",
    fontSize: 11,
    fontWeight: "700",
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  notificationTextWrap: {
    flex: 1,
    marginLeft: 8,
  },
  notificationTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  notificationDetail: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  emptyText: {
    color: "#64748B",
    fontSize: 13,
    paddingVertical: 8,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    paddingVertical: 8,
  },
});
