import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { BottomNavigation } from "@/components/BottomNavigation";
import { Card } from "@/components/Card";
import { ScreenHeader } from "@/components/ScreenHeader";
import { fetchTravelCatalog, formatCurrency, searchTravels, Travel, TravelRoute } from "@/data/travel";

const getDurationLabel = (departureTime: string, arrivalTime: string) => {
  const parse = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const start = parse(departureTime);
  const end = parse(arrivalTime);
  const duration = end >= start ? end - start : end + 24 * 60 - start;
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  return `${hours} Jam${mins > 0 ? ` ${mins} Menit` : ""}`.trim();
};

const isRouteAvailableOnDate = (route: TravelRoute, date: string) => {
  if (!date) return true;
  if (!Array.isArray(route.availableDates) || route.availableDates.length === 0) {
    return true;
  }

  return route.availableDates.includes(date);
};

export function useSearchResults({
  from,
  to,
  date,
  keyword,
  ptId,
  vehicleType,
  catalog,
}: {
  from: string;
  to: string;
  date: string;
  keyword: string;
  ptId: string;
  vehicleType: string;
  catalog: Travel[];
}) {
  const results = useMemo(
    () =>
      searchTravels(from, to, keyword, catalog).filter(({ travel }) => {
        // Filter by mitraProfileId (PT yang dipilih)
        if (ptId && String(travel.mitraProfileId) !== ptId) {
          return false;
        }

        if (!vehicleType) {
          return true;
        }

        const normalizedVehicleType = vehicleType.trim().toLowerCase();
        const routeMatches = travel.routes.some((route) =>
          route.vehicleType?.toLowerCase().includes(normalizedVehicleType)
        );
        const travelMatches = travel.busTypes.some((type) =>
          type.toLowerCase().includes(normalizedVehicleType)
        );

        return routeMatches || travelMatches;
      }),
    [from, to, keyword, ptId, vehicleType, catalog]
  );

  return useMemo(
    () =>
      results.flatMap(({ travel, routes }) =>
        routes
          // Jika date kosong, tampilkan SEMUA routes (tidak ada filter tanggal)
          // Ini untuk case "Semua Jadwal PT" ketika user belum memilih tanggal
          .filter((route) => !date || isRouteAvailableOnDate(route, date))
          .map((route) => ({ travel, route }))
      ),
    [results, date]
  );
}

export function SearchResultsBody({
  from,
  to,
  date,
  vehicleType,
  ptId,
  routeItems,
}: {
  from: string;
  to: string;
  date: string;
  vehicleType: string;
  ptId: string;
  routeItems: Array<{ travel: Travel; route: TravelRoute }>;
}) {
  const router = useRouter();
  
  // Cek apakah ini view "semua jadwal PT" (hanya ada ptId, tanpa filter dari/tujuan)
  const isViewAllSchedules = ptId && !from && !to;

  return (
    <>
      <Card style={styles.summaryBox}>
        <View>
          <Text style={styles.sectionLabel}>
            {isViewAllSchedules ? "Semua Jadwal" : "Hasil Pencarian"}
          </Text>
          {!isViewAllSchedules ? (
            <>
              <View style={styles.routeSummary}>
                <Text style={styles.routeText}>{from || "Kota Asal"}</Text>
                <Ionicons name="arrow-forward" size={16} color="#1E40AF" style={styles.routeArrow} />
                <Text style={styles.routeText}>{to || "Kota Tujuan"}</Text>
              </View>
              <Text style={styles.dateText}>{date || "Tanggal tidak dipilih"}</Text>
            </>
          ) : (
            <Text style={styles.dateText}>Klik jadwal untuk melanjutkan pemesanan</Text>
          )}
        </View>

        {!isViewAllSchedules && (
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() =>
              router.push({
                pathname: "/search-form",
                params: { from, to, vehicleType, date, ptId },
              })
            }
          >
            <Text style={styles.outlineButtonText}>Ubah Pencarian</Text>
          </TouchableOpacity>
        )}
      </Card>

      {routeItems.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="search" size={38} color="#1E40AF" />
          <Text style={styles.emptyTitle}>Tidak ada hasil</Text>
          <Text style={styles.emptyText}>Coba sesuaikan kembali kota asal, tujuan, atau tanggal.</Text>
        </Card>
      ) : (
        routeItems.map(({ travel, route }) => {
          const vehicleLabel = route.vehicleType ?? travel.busTypes[0] ?? "Bus";
          const seatCount = route.availableSeats ?? 40;
          const duration = getDurationLabel(route.departureTime, route.arrivalTime);

          return (
            <Card key={`${travel.id}-${route.id}`} style={styles.resultCard}>
              <View style={styles.cardTopRow}>
                <Image source={travel.image} style={styles.thumbnail} />
                <View style={styles.cardHeaderRight}>
                  <Text style={styles.travelName}>{travel.companyName}</Text>
                  <Text style={styles.vehicleText}>{vehicleLabel} • {seatCount} Kursi</Text>
                </View>
                <View style={styles.radioOuter}>
                  <View style={styles.radioInner} />
                </View>
              </View>

              <View style={styles.scheduleRow}>
                <View style={styles.scheduleItem}>
                  <Text style={styles.scheduleTime}>{route.departureTime}</Text>
                  <Text style={styles.scheduleCity}>{route.from}</Text>
                </View>
                <View style={styles.scheduleDivider}>
                  <Text style={styles.scheduleDuration}>{duration}</Text>
                </View>
                <View style={styles.scheduleItem}>
                  <Text style={styles.scheduleTime}>{route.arrivalTime}</Text>
                  <Text style={styles.scheduleCity}>{route.to}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.priceText}>{formatCurrency(route.price)}</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() =>
                    router.push({ pathname: "/travel-detail", params: { travelId: travel.id, routeId: route.id, date } })
                  }
                >
                  <Text style={styles.selectButtonText}>Pilih</Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        })
      )}
    </>
  );
}

export default function SearchResults() {
  const params = useLocalSearchParams();
  const [catalog, setCatalog] = useState<Travel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const from = typeof params.from === "string" ? params.from : "";
  const to = typeof params.to === "string" ? params.to : "";
  const date = typeof params.date === "string" ? params.date : "";
  const vehicleType = typeof params.vehicleType === "string" ? params.vehicleType : "";
  const keyword = typeof params.keyword === "string" ? params.keyword : "";
  const ptId = typeof params.ptId === "string" ? params.ptId : "";

  const routeItems = useSearchResults({ from, to, date, keyword, ptId, vehicleType, catalog });

  // Fetch data dari backend dengan filter yang sesuai
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setIsLoading(true);
        // Pass filter parameters ke backend untuk hasil yang akurat
        const nextCatalog = await fetchTravelCatalog({
          ptId: ptId || undefined,
          from: from || undefined,
          to: to || undefined,
          date: date || undefined,
        });
        setCatalog(nextCatalog);
      } catch (error) {
        console.error("Error loading travel catalog:", error);
        // Fallback ke empty array jika fetch gagal (bukan hardcode data)
        setCatalog([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadCatalog();
  }, [ptId, from, to, date]);

  return (
    <View style={styles.page}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Lintara"
          subtitle="Hasil pencarian perjalanan Anda."
        />

        <SearchResultsBody
          from={from}
          to={to}
          date={date}
          vehicleType={vehicleType}
          ptId={ptId}
          routeItems={routeItems}
        />
      </ScrollView>

      <BottomNavigation active="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
    paddingBottom: 90,
  },
  summaryBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  routeSummary: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  routeText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  routeArrow: {
    marginHorizontal: 8,
  },
  dateText: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 13,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#1E40AF",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 120,
  },
  outlineButtonText: {
    color: "#1E40AF",
    fontWeight: "700",
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptyText: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginRight: 14,
  },
  cardHeaderRight: {
    flex: 1,
  },
  travelName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  vehicleText: {
    marginTop: 6,
    color: "#64748B",
    fontSize: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  scheduleItem: {
    flex: 1,
    alignItems: "flex-start",
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  scheduleCity: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
  },
  scheduleDivider: {
    flex: 1,
    alignItems: "center",
  },
  scheduleDuration: {
    color: "#64748B",
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceText: {
    color: "#1E40AF",
    fontSize: 18,
    fontWeight: "800",
  },
  selectButton: {
    backgroundColor: "#1E40AF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  selectButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
});
