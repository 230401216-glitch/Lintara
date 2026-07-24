import { API_ENDPOINTS } from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { SearchBar } from "@/components/SearchBar";
import { fetchTravelCatalog, formatCurrency, getTravelById, travelData } from "@/data/travel";
import { useAuth } from "@/lib/context/AuthContext";

const formatDisplayDate = (value: string) => {
  if (!value) return "Pilih tanggal";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function ArmadaDetail() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const params = useLocalSearchParams();

  // ==========================================
  // FUNGSI & LOGIC (100% AMAN / TIDAK BERUBAH)
  // ==========================================
  const travelId = typeof params.travelId === "string" ? params.travelId : undefined;
  const routeId = typeof params.routeId === "string" ? params.routeId : undefined;
  const partnerName = typeof params.partnerName === "string" ? params.partnerName : undefined;
  const partnerKey = typeof params.partnerKey === "string" ? params.partnerKey : undefined;
  const date = typeof params.date === "string" ? params.date : new Date().toISOString().slice(0, 10);
  const [catalog, setCatalog] = useState(travelData);
  const [scheduleOptions, setScheduleOptions] = useState<Array<Record<string, any>>>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [reviewDraft, setReviewDraft] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewList, setReviewList] = useState([
    {
      id: 1,
      author: "Ayu",
      rating: 5,
      text: "Armada bersih, sopir ramah, dan perjalanan sangat nyaman.",
      meta: "Sangat nyaman",
    },
    {
      id: 2,
      author: "Rifki",
      rating: 4,
      text: "Fasilitas lengkap dan jadwal sesuai dengan yang dijanjikan.",
      meta: "Cukup puas",
    },
  ]);

  useEffect(() => {
    const loadCatalog = async () => {
      const nextCatalog = await fetchTravelCatalog();
      setCatalog(nextCatalog);
    };

    void loadCatalog();
  }, []);

  const matchingTravels = useMemo(() => {
    const normalizedPartner = (partnerName || partnerKey || "").toLowerCase().trim();
    if (!normalizedPartner) {
      return [getTravelById(travelId, catalog)];
    }

    const matched = catalog.filter((candidate) => {
      const candidateName = `${candidate.companyName || ""} ${candidate.name || ""}`.toLowerCase();
      return candidateName.includes(normalizedPartner);
    });

    return matched.length > 0 ? matched : [getTravelById(travelId, catalog)];
  }, [catalog, partnerName, partnerKey, travelId]);

  const travel = useMemo(() => matchingTravels[0] ?? getTravelById(travelId, catalog), [matchingTravels, travelId, catalog]);
  const routeOptions = useMemo(() => {
    const merged: Array<Record<string, any>> = [];
    const seen = new Set<string>();

    matchingTravels.forEach((travelEntry) => {
      (travelEntry?.routes ?? []).forEach((route: Record<string, any>) => {
        const routeKey = `${travelEntry.id}-${route.id}`;
        if (seen.has(routeKey)) return;
        seen.add(routeKey);
        merged.push({
          ...route,
          sourceTravelId: travelEntry.id,
          routeKey,
        });
      });
    });

    return merged;
  }, [matchingTravels]);
  const [selectedRouteKey, setSelectedRouteKey] = useState("");
  const selectedRoute = useMemo(
    () => routeOptions.find((route) => route.routeKey === selectedRouteKey) ?? routeOptions[0] ?? null,
    [routeOptions, selectedRouteKey]
  );
  const selectedSchedule = useMemo(
    () => scheduleOptions.find((item) => String(item.id) === selectedScheduleId) ?? null,
    [scheduleOptions, selectedScheduleId]
  );

  useEffect(() => {
    if (routeOptions.length > 0 && !selectedRouteKey) {
      const initialMatch = routeOptions.find((route) => route.id === routeId) ?? routeOptions[0];
      if (initialMatch) {
        setSelectedRouteKey(initialMatch.routeKey);
      }
    }
  }, [routeOptions, routeId, selectedRouteKey]);

  useEffect(() => {
    let isActive = true;

    const loadSchedules = async () => {
      if (!selectedRoute?.id) {
        setScheduleOptions([]);
        setSelectedScheduleId("");
        return;
      }

      try {
        const response = await fetch(`${API_ENDPOINTS.getSchedules}?routeId=${selectedRoute.id}&date=${date}`);
        const payload = await response.json();
        const nextSchedules = Array.isArray(payload?.data) ? payload.data : [];

        if (!isActive) return;

        setScheduleOptions(nextSchedules);
        const fallbackSchedule = nextSchedules.find((item: Record<string, any>) => String(item.id) === selectedScheduleId) ?? nextSchedules[0];
        setSelectedScheduleId(fallbackSchedule ? String(fallbackSchedule.id) : "");
      } catch {
        if (isActive) {
          setScheduleOptions([]);
          setSelectedScheduleId("");
        }
      }
    };

    void loadSchedules();

    return () => {
      isActive = false;
    };
  }, [date, selectedRoute?.id]);

  const handlePesan = () => {
    if (!isLoggedIn) {
      Alert.alert("Perlu Login", "Silakan masuk untuk memesan tiket.", [
        { text: "Masuk", onPress: () => router.push("/login") },
        { text: "Batal", style: "cancel" },
      ]);
      return;
    }

    router.push({
      pathname: "/pesan",
      params: {
        travelId: selectedRoute?.sourceTravelId || travel.id,
        routeId: selectedRoute.id,
        date,
        scheduleId: selectedSchedule ? String(selectedSchedule.id) : "",
        scheduleDate: selectedSchedule?.tanggal ? String(selectedSchedule.tanggal) : date,
        scheduleTime: selectedSchedule?.jam_berangkat ? String(selectedSchedule.jam_berangkat) : selectedRoute.departureTime,
        vehicleType: selectedRoute.vehicleType || travel.busTypes[0] || "AC",
        availableSeats: selectedSchedule?.total_kursi ? String(selectedSchedule.total_kursi) : "",
        ptName: travel.companyName || travel.name,
      },
    });
  };

  const handleSubmitReview = () => {
    if (!isLoggedIn) {
      Alert.alert("Perlu Login", "Silakan masuk untuk memberi ulasan.", [
        { text: "Masuk", onPress: () => router.push("/login") },
        { text: "Batal", style: "cancel" },
      ]);
      return;
    }

    const trimmedComment = reviewDraft.trim();
    if (!trimmedComment) {
      Alert.alert("Perlu komentar", "Tulis sedikit ulasan sebelum mengirim.");
      return;
    }

    setReviewList((prev) => [
      {
        id: Date.now(),
        author: user?.name ?? "Pengguna",
        rating: reviewRating,
        text: trimmedComment,
        meta: "Baru saja dikirim",
      },
      ...prev,
    ]);

    setReviewDraft("");
    setReviewRating(5);
    Alert.alert("Terima kasih", "Ulasan Anda telah ditambahkan.");
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ScreenHeader
          title="Lintara"
          subtitle="Cari dan pesan travel antarkota dengan cepat."
        />

        <View style={styles.searchWrapper}>
          <SearchBar label="Cari travel atau tujuan" onPress={() => {}} />
        </View>

        {/* Hero Card Modern - Gambar Menyesuaikan HP */}
        <View style={styles.heroCard}>
          <Image source={travel.image} style={styles.bigLogo} />
          <View style={styles.heroBottomCopy}>
            <View style={styles.badgeContainer}>
              <Text style={styles.badge}>{travel.busTypes.join(" / ")}</Text>
            </View>
            <Text style={styles.travelName}>{travel.name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingText}>
                {travel.rating} <Text style={styles.reviewCount}>({Number(travel.reviews).toLocaleString("id-ID")} ulasan)</Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Fasilitas */}
          <Text style={styles.sectionTitle}>Fasilitas Terkini</Text>
          <View style={styles.facilityGrid}>
            {travel.facilities.map((facility) => (
              <View key={facility} style={styles.facility}>
                <Ionicons name={facility === "WiFi" ? "wifi" : "checkmark-circle-outline"} size={16} color="#2563EB" />
                <Text style={styles.facilityText}>{facility}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoHeaderRow}>
              <View>
                <Text style={styles.infoLabel}>PT Travel</Text>
                <Text style={styles.infoValue}>{travel.companyName}</Text>
              </View>
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>{travel.busTypes.join(" / ")}</Text>
              </View>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoItemLabel}>Tujuan</Text>
                <Text style={styles.infoItemValue}>{selectedRoute?.from} → {selectedRoute?.to}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoItemLabel}>Tanggal</Text>
                <Text style={styles.infoItemValue}>{formatDisplayDate(date)}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Pilih Armada & Tujuan</Text>
          {routeOptions.map((route) => {
            const active = route.id === selectedRoute?.id;

            return (
              <TouchableOpacity
                key={route.routeKey}
                style={[styles.routeCard, active && styles.routeCardActive]}
                onPress={() => {
                  setSelectedRouteKey(route.routeKey);
                  setSelectedScheduleId("");
                }}
                activeOpacity={0.85}
              >
                <View style={styles.routeTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.routeTitle, active && styles.routeTitleActive]}>
                      {route.from} → {route.to}
                    </Text>
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                      <Text style={styles.routeMeta}>
                        {route.departureTime} - {route.arrivalTime}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.radioCircle, active && styles.radioActive]}>
                    {active ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                  </View>
                </View>
                <View style={styles.routeFooterRow}>
                  <Text style={styles.routeMeta}>Kursi {route.availableSeats ?? 20} tersedia</Text>
                  <Text style={[styles.priceText, active && styles.priceTextActive]}>{formatCurrency(route.price)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <Text style={styles.sectionTitle}>Pilih Jadwal Keberangkatan</Text>
          {scheduleOptions.length === 0 ? (
            <View style={styles.routeCard}>
              <Text style={styles.routeMeta}>Jadwal belum tersedia untuk rute ini pada tanggal yang dipilih.</Text>
            </View>
          ) : (
            scheduleOptions.map((schedule) => {
              const active = String(schedule.id) === selectedScheduleId;
              return (
                <TouchableOpacity
                  key={schedule.id}
                  style={[styles.routeCard, active && styles.routeCardActive]}
                  onPress={() => setSelectedScheduleId(String(schedule.id))}
                  activeOpacity={0.85}
                >
                  <View style={styles.routeTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.routeTitle, active && styles.routeTitleActive]}>
                        {schedule.tanggal} • {schedule.jam_berangkat}
                      </Text>
                      <Text style={styles.routeMeta}>
                        {schedule.total_kursi ?? schedule.availableSeats ?? 0} kursi tersedia • {selectedRoute?.vehicleType || travel.busTypes[0] || "Travel"}
                      </Text>
                    </View>
                    <View style={[styles.radioCircle, active && styles.radioActive]}>
                      {active ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Ringkasan Pilihan (Tanda panah kustom '→' sudah dihapus di bawah) */}
          <View style={styles.selectedBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="git-commit-outline" size={16} color="#1E40AF" style={{ marginRight: 6 }} />
              <Text style={styles.selectedLabel}>Rute & Waktu Dipilih</Text>
            </View>
            <Text style={styles.selectedValue}>
              {selectedRoute?.from} ke {selectedRoute?.to} • {selectedSchedule?.jam_berangkat || selectedRoute?.departureTime}
            </Text>
            <Text style={styles.selectedHint}>Tanggal keberangkatan: {formatDisplayDate(date)}</Text>
          </View>

          <View style={styles.reviewSection}>
            <View style={styles.reviewHeaderRow}>
              <Text style={styles.sectionTitle}>Penilaian & Ulasan</Text>
              <View style={styles.reviewSummary}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.reviewSummaryText}>{travel.rating}</Text>
              </View>
            </View>

            <View style={styles.reviewFormCard}>
              <Text style={styles.reviewCardTitle}>Berikan ulasan untuk armada ini</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <TouchableOpacity key={value} onPress={() => setReviewRating(value)}>
                    <Ionicons
                      name={value <= reviewRating ? "star" : "star-outline"}
                      size={24}
                      color="#F59E0B"
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.reviewInput}
                value={reviewDraft}
                onChangeText={setReviewDraft}
                placeholder="Tulis komentar Anda tentang armada ini..."
                multiline
                numberOfLines={4}
              />
              <TouchableOpacity style={styles.submitReviewButton} onPress={handleSubmitReview}>
                <Text style={styles.submitReviewButtonText}>Kirim Ulasan</Text>
              </TouchableOpacity>
            </View>

            {reviewList.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <Text style={styles.reviewCardTitle}>{review.text}</Text>
                <View style={styles.reviewMetaRow}>
                  <Text style={styles.reviewAuthor}>{review.author} • {review.rating}/5</Text>
                  <Text style={styles.reviewMeta}>{review.meta}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Total Pembayaran</Text>
          <Text style={styles.footerPrice}>{formatCurrency(selectedRoute.price)}</Text>
        </View>
        <TouchableOpacity style={styles.orderButton} activeOpacity={0.85} onPress={handlePesan}>
          <Text style={styles.orderText}>Pesan Sekarang</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  searchWrapper: {
    marginHorizontal: 20,
    marginTop: -28,
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  bigLogo: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    backgroundColor: "#F1F5F9",
  },
  heroBottomCopy: {
    padding: 20,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  badge: {
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 11,
    textTransform: "uppercase",
  },
  travelName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  ratingText: {
    marginLeft: 6,
    fontWeight: "600",
    color: "#0F172A",
    fontSize: 14,
  },
  reviewCount: {
    color: "#64748B",
    fontWeight: "400",
  },
  content: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  facilityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 28,
  },
  facility: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  facilityText: {
    marginLeft: 6,
    color: "#334155",
    fontWeight: "500",
    fontSize: 13,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  infoHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  infoBadge: {
    backgroundColor: "#EFF6FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  infoBadgeText: {
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 11,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  infoItem: {
    flex: 1,
    minWidth: 140,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoItemLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  infoItemValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 4,
  },
  routeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  routeCardActive: {
    borderColor: "#2563EB",
    backgroundColor: "#F0F6FF",
  },
  routeTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  routeTitleActive: {
    color: "#2563EB",
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  routeMeta: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "500",
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  radioActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  routeFooterRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  priceTextActive: {
    color: "#2563EB",
  },
  selectedBox: {
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  reviewSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  reviewFormCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  starsRow: {
    flexDirection: "row",
    marginBottom: 10,
    gap: 6,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 90,
    textAlignVertical: "top",
    color: "#0F172A",
    marginBottom: 10,
  },
  submitReviewButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  submitReviewButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  reviewHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  reviewSummary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  reviewSummaryText: {
    marginLeft: 4,
    fontWeight: "700",
    color: "#C2410C",
  },
  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  reviewCardTitle: {
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  reviewCardText: {
    color: "#475569",
    lineHeight: 20,
  },
  reviewMetaRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewAuthor: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  reviewMeta: {
    fontSize: 12,
    color: "#64748B",
  },
  selectedLabel: {
    fontSize: 12,
    color: "#1E40AF",
    fontWeight: "600",
  },
  selectedValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1D4ED8",
    marginTop: 2,
  },
  selectedHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#475569",
  },
  footer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  footerLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
  },
  footerPrice: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 20,
    marginTop: 2,
  },
  orderButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  orderText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});