import { API_ENDPOINTS } from "@/constants/api";
import { BookingData, fetchBookingsFromServer } from "@/lib/services/bookingStore";

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

export type MitraTravel = {
  id: string;
  name: string;
  companyName: string;
  status: string;
  nomorKendaraan?: string;
  jumlahKursi?: number;
  deskripsi?: string;
  foto?: string;
  tanggal?: string;
  jam_berangkat?: string;
};

export type MitraRoute = {
  id: string;
  travelId?: string;
  origin: string;
  destination: string;
  price: number;
  status: string;
  durasi?: string;
};

export type MitraSchedule = {
  id: string;
  routeId?: string;
  origin: string;
  destination: string;
  date: string;
  departureTime: string;
  arrivalTime?: string;
  totalSeats: number;
  status: string;
};

export type MitraDriver = {
  id: string;
  name: string;
  phone: string;
  platKendaraan?: string;
  status: string;
  catatan?: string;
};

export type MitraDashboardData = {
  travels: MitraTravel[];
  routes: MitraRoute[];
  schedules: MitraSchedule[];
  bookings: BookingData[];
  drivers: MitraDriver[];
};

export type CreateTravelPayload = {
  nama_travel: string;
  nomor_kendaraan: string;
  jumlah_kursi: number;
  deskripsi?: string;
  ac?: boolean;
  seat_layout?: string;
};

export type CreateRoutePayload = {
  travel_id: string;
  asal: string;
  tujuan: string;
  harga: number;
  durasi?: string;
  pt_id?: string | number;
};

export type CreateSchedulePayload = {
  route_id: string;
  tanggal: string;
  jam_berangkat: string;
  total_kursi: number;
  pt_id?: string | number;
};

export type UpdateTravelPayload = Partial<CreateTravelPayload> & { status?: string };
export type UpdateRoutePayload = Partial<CreateRoutePayload> & { status?: string };
export type UpdateSchedulePayload = Partial<CreateSchedulePayload> & { status?: string };

const normalizeStatus = (value?: string) => {
  if (!value) return "Aktif";
  const text = String(value).trim().toLowerCase();
  if (text === "aktif" || text === "active") return "Aktif";
  if (text === "nonaktif" || text === "inactive") return "Nonaktif";
  if (text === "selesai" || text === "finished") return "Selesai";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const getJson = async <T>(url: string): Promise<T[]> => {
  const response = await fetch(url);
  const data = (await response.json()) as ApiResponse<T[]>;

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Gagal memuat data mitra");
  }

  return Array.isArray(data.data) ? data.data : [];
};

const postJson = async <T>(url: string, payload: Record<string, any>, token?: string): Promise<T> => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Gagal menyimpan data mitra");
  }

  return data.data as T;
};

const putJson = async <T>(url: string, payload: Record<string, any>, token?: string): Promise<T> => {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Gagal memperbarui data mitra");
  }

  return data.data as T;
};

const withMitraFilter = (url: string, userId?: string | number, role?: string) => {
  if (!userId || String(role || "").toUpperCase() !== "MITRA") {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}ptId=${encodeURIComponent(String(userId))}`;
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const formatRoute = (origin?: string, destination?: string) =>
  `${origin || "-"} -> ${destination || "-"}`;

export const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const loadMitraDashboardData = async (
  token?: string,
  role?: string,
  userId?: string | number
): Promise<MitraDashboardData> => {
  const [travelRows, routeRows, scheduleRows, bookings, drivers] = await Promise.all([
    getJson<Record<string, any>>(withMitraFilter(API_ENDPOINTS.getTravels, userId, role)),
    getJson<Record<string, any>>(withMitraFilter(API_ENDPOINTS.getRoutes, userId, role)),
    getJson<Record<string, any>>(withMitraFilter(API_ENDPOINTS.getSchedules, userId, role)),
    token ? fetchBookingsFromServer(token, role) : Promise.resolve([]),
    getJson<Record<string, any>>(withMitraFilter(API_ENDPOINTS.getDrivers, userId, role)),
  ]);

  return {
    travels: travelRows.map((item) => ({
      id: String(item.id),
      name: item.nama ?? item.name ?? item.nama_travel ?? "Travel Lintara",
      companyName: item.nama_perusahaan ?? item.companyName ?? item.nama ?? "Mitra Lintara",
      status: normalizeStatus(item.status),
      nomorKendaraan: item.nomor_kendaraan ?? item.nomorKendaraan ?? "",
      jumlahKursi: Number(item.jumlah_kursi ?? item.jumlahKursi ?? 0),
      deskripsi: item.deskripsi ?? "",
      foto: item.foto ?? item.photo ?? "",
    })),
    routes: routeRows.map((item) => ({
      id: String(item.id),
      travelId: item.travel_id ? String(item.travel_id) : undefined,
      origin: item.asal ?? item.origin ?? "",
      destination: item.tujuan ?? item.destination ?? "",
      price: Number(item.harga ?? item.price ?? 0),
      status: normalizeStatus(item.status),
      durasi: item.durasi ?? item.duration ?? "",
    })),
    schedules: scheduleRows.map((item) => ({
      id: String(item.id),
      routeId: item.route_id ? String(item.route_id) : undefined,
      origin: item.asal ?? item.origin ?? "",
      destination: item.tujuan ?? item.destination ?? "",
      date: item.tanggal ?? item.date ?? "",
      departureTime: item.jam_berangkat ?? item.departureTime ?? "",
      arrivalTime: item.jam_sampai ?? item.arrivalTime,
      totalSeats: Number(item.total_kursi ?? item.totalSeats ?? 0),
      status: normalizeStatus(item.status),
    })),
    bookings,
    drivers: drivers.map((item) => ({
      id: String(item.id),
      name: item.nama_supir ?? item.name ?? "Supir",
      phone: item.nomor_hp ?? item.phone ?? "",
      platKendaraan: item.plat_kendaraan ?? item.platKendaraan ?? "",
      status: normalizeStatus(item.status),
      catatan: item.catatan ?? "",
    })),
  };
};

export const createMitraTravel = (payload: CreateTravelPayload, token?: string) =>
  postJson<{ id: number }>(API_ENDPOINTS.createTravel, payload, token);

export const updateMitraTravel = (id: string | number, payload: UpdateTravelPayload, token?: string) =>
  putJson<{ id: number }>(API_ENDPOINTS.updateTravel(String(id)), payload, token);

export const uploadMitraTravelPhoto = async (travelId: string, uri: string, token?: string) => {
  const filename = uri.split("/").pop() ?? `travel-photo-${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";
  const formData = new FormData();
  formData.append("foto", {
    uri,
    name: filename,
    type,
  } as any);

  const response = await fetch(API_ENDPOINTS.uploadTravelPhoto(travelId), {
    method: "PUT",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = (await response.json()) as ApiResponse<{ id: number; foto?: string }>;

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Gagal mengunggah foto armada");
  }

  return data.data;
};

export const createMitraRoute = (payload: CreateRoutePayload, token?: string) =>
  postJson<{ id: number }>(API_ENDPOINTS.createRoute, payload, token);

export const updateMitraRoute = (id: string | number, payload: UpdateRoutePayload, token?: string) =>
  putJson<{ id: number }>(API_ENDPOINTS.updateRoute(String(id)), payload, token);

export const createMitraSchedule = (payload: CreateSchedulePayload, token?: string) =>
  postJson<{ id: number }>(API_ENDPOINTS.createSchedule, payload, token);

export const updateMitraSchedule = (id: string | number, payload: UpdateSchedulePayload, token?: string) =>
  putJson<{ id: number }>(API_ENDPOINTS.updateSchedule(String(id)), payload, token);

export const loadMitraDrivers = async (token?: string, role?: string, userId?: string | number): Promise<MitraDriver[]> => {
  const rows = await getJson<Record<string, any>>(withMitraFilter(API_ENDPOINTS.getDrivers, userId, role));
  return rows.map((item) => ({
    id: String(item.id),
    name: item.nama_supir ?? item.name ?? "Supir",
    phone: item.nomor_hp ?? item.phone ?? "",
    platKendaraan: item.plat_kendaraan ?? item.platKendaraan ?? "",
    status: normalizeStatus(item.status),
    catatan: item.catatan ?? "",
  }));
};

export const createMitraDriver = (payload: Record<string, any>, token?: string) =>
  postJson<{ id: number }>(API_ENDPOINTS.createDriver, payload, token);

export const updateMitraDriver = (id: string | number, payload: Record<string, any>, token?: string) =>
  putJson<{ id: number }>(API_ENDPOINTS.updateDriver(String(id)), payload, token);
