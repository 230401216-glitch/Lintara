import { API_ENDPOINTS } from "@/constants/api";

export type TravelImageKey = "als" | "jaya" | "putra" | "mandiri" | "rapi";

export type TravelRoute = {
  id: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  vehicleType?: string;
  availableSeats?: number;
  availableDates?: string[];
  availableTimes?: string[];
  ptName?: string;
};

export type Travel = {
  id: string;
  mitraProfileId?: string | number; // ID dari mitra_profiles (COALESCE(pt_id, mitra_id))
  name: string;
  companyName: string;
  rating: string;
  reviews: string;
  imageKey: TravelImageKey;
  image: number;
  busTypes: string[];
  facilities: string[];
  routes: TravelRoute[];
};

export const travelImages: Record<TravelImageKey, number> = {
  als: require("../assets/image1/als.png"),
  jaya: require("../assets/image1/jaya.png"),
  putra: require("../assets/image1/putra.png"),
  mandiri: require("../assets/image1/mandiri.png"),
  rapi: require("../assets/image1/rapi.png"),
};

const staticTravelData: Travel[] = [
  {
    id: "als",
    name: "ALS",
    companyName: "ALS",
    rating: "4.9",
    reviews: "2103",
    imageKey: "als",
    image: travelImages.als,
    busTypes: ["Executive", "AC"],
    facilities: ["AC", "Seat 2-2", "Bagasi", "USB"],
    routes: [
      { id: "als-medan", from: "Pekanbaru", to: "Medan", departureTime: "08:00", arrivalTime: "17:30", price: 280000 },
      { id: "als-padang", from: "Pekanbaru", to: "Padang", departureTime: "09:30", arrivalTime: "15:00", price: 210000 },
    ],
  },
  {
    id: "jaya",
    name: "Sinar Jaya",
    companyName: "Sinar Jaya",
    rating: "4.7",
    reviews: "987",
    imageKey: "jaya",
    image: travelImages.jaya,
    busTypes: ["Executive", "AC"],
    facilities: ["AC", "Reclining Seat", "WiFi", "Bagasi"],
    routes: [
      { id: "jaya-bandung", from: "Jakarta", to: "Bandung", departureTime: "07:00", arrivalTime: "10:30", price: 120000 },
      { id: "jaya-medan", from: "Pekanbaru", to: "Medan", departureTime: "11:00", arrivalTime: "20:00", price: 220000 },
    ],
  },
  {
    id: "putra",
    name: "Putra Pelangi",
    companyName: "Putra Pelangi",
    rating: "4.8",
    reviews: "1245",
    imageKey: "putra",
    image: travelImages.putra,
    busTypes: ["Executive", "AC"],
    facilities: ["AC", "Seat 2-2", "WiFi", "Makan"],
    routes: [
      { id: "putra-medan", from: "Pekanbaru", to: "Medan", departureTime: "10:00", arrivalTime: "18:30", price: 250000 },
      { id: "putra-padang", from: "Pekanbaru", to: "Padang", departureTime: "14:00", arrivalTime: "20:00", price: 180000 },
    ],
  },
  {
    id: "mandiri",
    name: "Mandiri",
    companyName: "Mandiri",
    rating: "4.8",
    reviews: "846",
    imageKey: "mandiri",
    image: travelImages.mandiri,
    busTypes: ["AC", "Non AC"],
    facilities: ["AC", "Bagasi", "Air Mineral", "Audio"],
    routes: [
      { id: "mandiri-padang", from: "Pekanbaru", to: "Padang", departureTime: "08:30", arrivalTime: "14:30", price: 230000 },
      { id: "mandiri-medan", from: "Pekanbaru", to: "Medan", departureTime: "19:00", arrivalTime: "05:00", price: 260000 },
    ],
  },
  {
    id: "rapi",
    name: "RAPI",
    companyName: "RAPI",
    rating: "4.6",
    reviews: "756",
    imageKey: "rapi",
    image: travelImages.rapi,
    busTypes: ["AC", "Non AC"],
    facilities: ["AC", "Seat 2-2", "Bagasi", "Musik"],
    routes: [
      { id: "rapi-padang", from: "Pekanbaru", to: "Padang", departureTime: "06:30", arrivalTime: "12:30", price: 200000 },
      { id: "rapi-bandung", from: "Jakarta", to: "Bandung", departureTime: "16:00", arrivalTime: "19:30", price: 135000 },
    ],
  },
];

export const travelData: Travel[] = staticTravelData;

const getImageForIndex = (index: number): TravelImageKey => {
  const imageKeys: TravelImageKey[] = ["als", "jaya", "putra", "mandiri", "rapi"];
  return imageKeys[index % imageKeys.length];
};

const normalizeDateValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (raw.includes("T")) return raw.split("T")[0];
  return raw;
};

const buildCatalogFromServer = (
  travelRows: Record<string, any>[],
  routeRows: Record<string, any>[],
  scheduleRows: Record<string, any>[]
): Travel[] => {
  const routesByTravel = new Map<string, Record<string, any>[]>();
  routeRows.forEach((route) => {
    const travelId = String(route.travel_id ?? "");
    if (!travelId) return;
    const existing = routesByTravel.get(travelId) ?? [];
    existing.push(route);
    routesByTravel.set(travelId, existing);
  });

  const schedulesByRoute = new Map<string, Record<string, any>[]>();
  scheduleRows.forEach((schedule) => {
    const routeId = String(schedule.route_id ?? "");
    if (!routeId) return;
    const existing = schedulesByRoute.get(routeId) ?? [];
    existing.push(schedule);
    schedulesByRoute.set(routeId, existing);
  });

  return travelRows.map((travel, index) => {
    const travelRoutes = (routesByTravel.get(String(travel.id)) ?? []).map((route) => {
      const routeSchedules = schedulesByRoute.get(String(route.id)) ?? [];
      const firstSchedule = routeSchedules[0] ?? {};
      const availableDates = Array.from(
        new Set(
          routeSchedules
            .map((schedule) => normalizeDateValue(schedule.tanggal ?? schedule.date))
            .filter(Boolean)
        )
      ).sort();
      const availableTimes = Array.from(
        new Set(
          routeSchedules
            .map((schedule) => String(schedule.jam_berangkat ?? schedule.departureTime ?? "").trim())
            .filter(Boolean)
        )
      ).sort();
      const vehicleType = String(
        travel.jenis_kendaraan ??
          travel.vehicle_type ??
          travel.vehicleType ??
          travel.jenis ??
          travel.type ??
          travel.nama_travel ??
          "Travel"
      );
      const availableSeats = Number(
        firstSchedule.total_kursi ??
          firstSchedule.availableSeats ??
          route.total_kursi ??
          route.availableSeats ??
          0
      );
      return {
        id: String(route.id),
        from: route.asal ?? route.origin ?? "Kota Asal",
        to: route.tujuan ?? route.destination ?? "Kota Tujuan",
        departureTime: firstSchedule.jam_berangkat ?? firstSchedule.departureTime ?? "08:00",
        arrivalTime: firstSchedule.jam_sampai ?? firstSchedule.arrivalTime ?? "12:00",
        price: Number(route.harga ?? route.price ?? 0),
        vehicleType: vehicleType || "Travel",
        availableSeats: Number.isFinite(availableSeats) && availableSeats > 0 ? availableSeats : undefined,
        availableDates,
        availableTimes,
        ptName: travel.nama_perusahaan ?? travel.companyName ?? travel.nama ?? travel.name ?? "PT",
      } satisfies TravelRoute;
    });

    // Extract mitraProfileId dari travel (pt_id atau mitra_id dari database)
    const mitraProfileId = travel.pt_id ?? travel.mitra_id ?? travel.id;

    const imageKey = getImageForIndex(index);
    return {
      id: String(travel.id),
      mitraProfileId: String(mitraProfileId),
      name: travel.nama_travel ?? travel.nama ?? travel.name ?? `Travel ${index + 1}`,
      companyName:
        travel.nama_perusahaan ?? travel.nama ?? travel.name ?? `Travel ${index + 1}`,
      rating: "4.8",
      reviews: `${600 + index * 120}`,
      imageKey,
      image: travelImages[imageKey],
      busTypes: travel.ac ? ["Executive", "AC"] : ["Reguler"],
      facilities: travel.ac ? ["AC", "Bagasi", "WiFi"] : ["Bagasi", "Kursi"],
      routes: travelRoutes.length > 0
        ? travelRoutes
        : [
            {
              id: `${travel.id}-default`,
              from: "Pekanbaru",
              to: "Medan",
              departureTime: "08:00",
              arrivalTime: "17:30",
              price: Number(travel.harga ?? 0),
            },
          ],
    } satisfies Travel;
  });
};

export const fetchTravelCatalog = async (options?: {
  ptId?: string;
  from?: string;
  to?: string;
  date?: string;
}): Promise<Travel[]> => {
  try {
    // Build query parameters for filtering
    const queryParams = new URLSearchParams();
    if (options?.ptId) {
      queryParams.append("ptId", options.ptId);
    }

    const travelUrl = `${API_ENDPOINTS.getTravels}?${queryParams.toString()}`;
    const routeUrl = `${API_ENDPOINTS.getRoutes}?${queryParams.toString()}`;
    
    const scheduleParams = new URLSearchParams(queryParams);
    if (options?.date) {
      scheduleParams.append("date", options.date);
    }
    const scheduleUrl = `${API_ENDPOINTS.getSchedules}?${scheduleParams.toString()}`;

    const [travelResponse, routeResponse, scheduleResponse] = await Promise.all([
      fetch(travelUrl),
      fetch(routeUrl),
      fetch(scheduleUrl),
    ]);

    const [travelPayload, routePayload, schedulePayload] = await Promise.all([
      travelResponse.json(),
      routeResponse.json(),
      scheduleResponse.json(),
    ]);

    const travelRows = Array.isArray(travelPayload?.data) ? travelPayload.data : [];
    const routeRows = Array.isArray(routePayload?.data) ? routePayload.data : [];
    const scheduleRows = Array.isArray(schedulePayload?.data) ? schedulePayload.data : [];

    const catalog = buildCatalogFromServer(travelRows, routeRows, scheduleRows);
    return catalog.length > 0 ? catalog : travelData;
  } catch (error) {
    console.error("Error fetching travel catalog:", error);
    return travelData;
  }
};

export const formatCurrency = (value: number) =>
  `Rp ${value.toLocaleString("id-ID")}`;

export const getTravelById = (travelId?: string, catalog: Travel[] = travelData) =>
  catalog.find((travel) => travel.id === travelId) ?? catalog[0] ?? travelData[0];

export const getRouteById = (travel: Travel, routeId?: string) =>
  travel.routes.find((route) => route.id === routeId) ?? travel.routes[0];

export const searchTravels = (from: string, to: string, keyword = "", catalog: Travel[] = travelData) => {
  const normalizedFrom = from.trim().toLowerCase();
  const normalizedTo = to.trim().toLowerCase();
  const normalizedKeyword = keyword.trim().toLowerCase();

  return catalog
    .map((travel) => ({
      travel,
      routes: travel.routes.filter((route) => {
        const matchesRoute =
          (!normalizedFrom || route.from.toLowerCase().includes(normalizedFrom)) &&
          (!normalizedTo || route.to.toLowerCase().includes(normalizedTo));
        const matchesKeyword =
          !normalizedKeyword ||
          travel.companyName.toLowerCase().includes(normalizedKeyword) ||
          travel.name.toLowerCase().includes(normalizedKeyword) ||
          route.ptName?.toLowerCase().includes(normalizedKeyword) ||
          route.from.toLowerCase().includes(normalizedKeyword) ||
          route.to.toLowerCase().includes(normalizedKeyword);

        return matchesRoute && matchesKeyword;
      }),
    }))
    .filter((item) => item.routes.length > 0);
};
