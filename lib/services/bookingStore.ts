import { API_ENDPOINTS } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "lintara.bookings.v1";

export type BookingData = {
  id: string;
  travelId?: string;
  routeId?: string;
  travelName: string;
  origin?: string;
  destination: string;
  departureTime?: string;
  arrivalTime?: string;
  nama: string;
  hp: string;
  email?: string;
  seats: number[];
  total: number;
  date: string;
  busType: string;
  pickupType: string;
  pickupLocation: string;
  paymentMethod: string;
  paymentStatus: string;
  bookingStatus: string;
  ticketCode: string;
};

let bookingsCache: BookingData[] = [];

const mapBookingStatus = (value?: string) => {
  switch ((value || "").toLowerCase()) {
    case "confirmed":
    case "approved":
    case "disetujui":
      return "DISETUJUI MITRA";
    case "pending":
    case "menunggu":
      return "MENUNGGU PERSETUJUAN MITRA";
    case "cancelled":
    case "dibatalkan":
      return "DIBATALKAN";
    default:
      return value || "MENUNGGU PERSETUJUAN MITRA";
  }
};

const mapPaymentStatus = (value?: string, paymentMethod?: string) => {
  switch ((value || "").toLowerCase()) {
    case "paid":
    case "lunas":
      return "LUNAS";
    case "pending":
    case "menunggu":
      return paymentMethod === "Cash" ? "BELUM LUNAS" : "MENUNGGU VERIFIKASI";
    case "cancelled":
    case "dibatalkan":
      return "DIBATALKAN";
    default:
      return value || "BELUM LUNAS";
  }
};

const normalizeBookingData = (booking: Record<string, any>): BookingData => ({
  id: String(booking.id),
  travelId: booking.travel_id ?? booking.travelId,
  routeId: booking.route_id ?? booking.routeId,
  travelName:
    booking.travel_name ??
    booking.travelName ??
    (booking.asal && booking.tujuan ? `${booking.asal} - ${booking.tujuan}` : "Travel Lintara"),
  origin: booking.asal ?? booking.origin,
  destination: booking.tujuan ?? booking.destination ?? "",
  departureTime: booking.jam_berangkat ?? booking.departureTime,
  arrivalTime: booking.jam_sampai ?? booking.arrivalTime,
  nama: booking.nama_penumpang ?? booking.nama ?? "",
  hp: booking.no_hp_penumpang ?? booking.hp ?? "",
  email: booking.email ?? "",
  seats: Array.isArray(booking.seats)
    ? booking.seats.map(Number)
    : [],
  total: Number(booking.total_harga ?? booking.total ?? 0),
  date: booking.tanggal ?? booking.date ?? booking.created_at ?? new Date().toISOString(),
  busType: booking.tipe_bus ?? booking.busType ?? "AC",
  pickupType: booking.pickup_type ?? booking.pickupType ?? "Lokasi",
  pickupLocation: booking.lokasi_jemput ?? booking.pickupLocation ?? "",
  paymentMethod: booking.metode_pembayaran === "cash" ? "Cash" : "QR Transfer",
  paymentStatus: mapPaymentStatus(booking.status_pembayaran ?? booking.payment_status, booking.metode_pembayaran === "cash" ? "Cash" : "QR Transfer"),
  bookingStatus: mapBookingStatus(booking.status_booking ?? booking.booking_status),
  ticketCode: booking.kode_tiket ?? booking.ticketCode ?? booking.kode_booking ?? "",
});

const getAuthHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const loadBookings = async (): Promise<BookingData[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      bookingsCache = [];
      return bookingsCache;
    }

    const parsed = JSON.parse(raw) as BookingData[];
    bookingsCache = Array.isArray(parsed) ? parsed : [];
    return bookingsCache;
  } catch (error) {
    console.warn("Gagal memuat booking:", error);
    bookingsCache = [];
    return bookingsCache;
  }
};

const saveBookings = async (nextBookings: BookingData[]) => {
  bookingsCache = nextBookings;

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextBookings));
  } catch (error) {
    console.warn("Gagal menyimpan booking:", error);
  }
};

export const hydrateBookings = async (token?: string, role?: string) => {
  if (token) {
    try {
      return await fetchBookingsFromServer(token, role);
    } catch (error) {
      console.warn("Gagal sinkronisasi booking dari server, memakai cache lokal:", error);
    }
  }

  await loadBookings();
  return bookingsCache;
};

export const fetchBookingsFromServer = async (token?: string, role?: string): Promise<BookingData[]> => {
  if (!token) {
    await loadBookings();
    return bookingsCache;
  }

  const endpoint = role && ["MITRA", "ADMIN"].includes(role.toUpperCase()) ? API_ENDPOINTS.getAllBookings : API_ENDPOINTS.getBookings;

  const response = await fetch(endpoint, {
    headers: getAuthHeaders(token),
  });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Gagal memuat booking dari server");
  }

  const nextBookings = (Array.isArray(data.data) ? data.data : []).map((booking: Record<string, any>) => normalizeBookingData(booking));
  await saveBookings(nextBookings);
  return nextBookings;
};

export const getBookings = (): BookingData[] => bookingsCache;

export const getBookingById = (bookingId: string): BookingData | undefined =>
  bookingsCache.find((booking) => booking.id === bookingId);

export const addBooking = (booking: BookingData): BookingData => {
  const nextBookings = [...bookingsCache, booking];
  void saveBookings(nextBookings);
  return booking;
};

export const createBookingOnServer = async (payload: Record<string, any>, token?: string): Promise<BookingData> => {
  const scheduleDate = payload.date ? new Date(payload.date).toISOString().split("T")[0] : "";
  const scheduleQuery = new URLSearchParams();

  if (payload.routeId) {
    scheduleQuery.set("routeId", payload.routeId);
  }

  if (scheduleDate) {
    scheduleQuery.set("date", scheduleDate);
  }

  const queryString = scheduleQuery.toString();
  const schedulesUrl = queryString ? `${API_ENDPOINTS.getSchedules}?${queryString}` : API_ENDPOINTS.getSchedules;

  const scheduleResponse = await fetch(schedulesUrl, {
    headers: getAuthHeaders(token),
  });
  
  if (!scheduleResponse.ok) {
    throw new Error("Gagal mengambil data jadwal");
  }
  
  const scheduleData = await scheduleResponse.json();
  
  if (!scheduleData.success) {
    throw new Error(scheduleData.message || "Jadwal tidak tersedia");
  }

  const schedules = Array.isArray(scheduleData.data) ? scheduleData.data : [];
  const scheduleId = payload.scheduleId || schedules[0]?.id;

  if (!scheduleId) {
    throw new Error("Tidak ada jadwal tersedia saat ini");
  }

  const requestBody = {
    schedule_id: scheduleId,
    seats: payload.seats,
    nama_penumpang: payload.nama,
    no_hp_penumpang: payload.hp,
    lokasi_jemput: payload.pickupLocation,
    metode_pembayaran: payload.paymentMethod === "Cash" ? "cash" : "qris",
    tipe_bus: payload.busType,
  };

  const response = await fetch(API_ENDPOINTS.createBooking, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    throw new Error("Gagal mengirim data booking");
  }
  
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || "Gagal membuat booking");
  }

  if (!data.data?.booking_id) {
    throw new Error("Respon server tidak valid");
  }

  const bookingId = String(data.data.booking_id);
  const booking: BookingData = {
    id: bookingId,
    travelId: payload.travelId,
    routeId: payload.routeId,
    travelName: payload.travelName,
    origin: payload.origin,
    destination: payload.destination,
    departureTime: payload.departureTime,
    arrivalTime: payload.arrivalTime,
    nama: payload.nama,
    hp: payload.hp,
    email: payload.email,
    seats: payload.seats,
    total: Number(payload.total || 0),
    date: payload.date,
    busType: payload.busType,
    pickupType: payload.pickupType,
    pickupLocation: payload.pickupLocation,
    paymentMethod: payload.paymentMethod,
    paymentStatus: payload.paymentStatus,
    bookingStatus: payload.bookingStatus,
    ticketCode: payload.ticketCode || data.data?.kode_booking || "",
  };

  const nextBookings = [...bookingsCache.filter((item) => item.id !== booking.id), booking];
  await saveBookings(nextBookings);
  return booking;
};

export const cancelBooking = async (bookingId: string, token?: string): Promise<boolean> => {
  let serverSuccess = false;
  
  if (token) {
    try {
      const response = await fetch(API_ENDPOINTS.cancelBooking(bookingId), {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        serverSuccess = true;
      }
    } catch (error) {
      console.warn("Gagal membatalkan booking di server:", error);
    }
  }

  const nextBookings = bookingsCache.map((booking) =>
    booking.id === bookingId ? { ...booking, bookingStatus: "DIBATALKAN", paymentStatus: "DIBATALKAN" } : booking
  );

  await saveBookings(nextBookings);
  return serverSuccess || !token;
};

export const updateBooking = (
  bookingId: string,
  updates: Partial<BookingData>
) => {
  const nextBookings = bookingsCache.map((booking) =>
    booking.id === bookingId ? { ...booking, ...updates } : booking
  );

  void saveBookings(nextBookings);
};

export const confirmBookingPayment = async (bookingId: string, token?: string, paymentMethod = "qris"): Promise<boolean> => {
  let serverSuccess = false;
  
  if (token) {
    try {
      const response = await fetch(API_ENDPOINTS.processPayment, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ booking_id: bookingId, payment_method: paymentMethod === "Cash" ? "cash" : "qris" }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        serverSuccess = true;
      }
    } catch (error) {
      console.warn("Gagal mengonfirmasi pembayaran di server:", error);
    }
  }

  const nextBookings = bookingsCache.map((booking) =>
    booking.id === bookingId
      ? {
          ...booking,
          bookingStatus: "DISETUJUI MITRA",
          paymentStatus: "LUNAS",
        }
      : booking
  );

  await saveBookings(nextBookings);
  return serverSuccess || !token;
};

export const clearBookingsCache = async () => {
  bookingsCache = [];
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Gagal menghapus booking cache:", error);
  }
};
