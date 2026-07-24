import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "./apiClient";

export interface DriverWorkSession {
  startTime: number;
  durationMinutes: number;
  status: "active" | "paused";
  lastResetTime?: number;
}

export interface ArrivalNotification {
  bookingId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  ticketCode: string;
  passengerPhone: string;
  passengerName: string;
  timestamp: number;
}

const WORK_SESSION_KEY = "driver_work_session";

/**
 * Mulai tracking jam kerja supir
 */
export async function startWorkSession(): Promise<void> {
  const session: DriverWorkSession = {
    startTime: Date.now(),
    durationMinutes: 0,
    status: "active",
  };
  await AsyncStorage.setItem(WORK_SESSION_KEY, JSON.stringify(session));
}

/**
 * Dapatkan durasi jam kerja saat ini (dalam menit)
 */
export async function getCurrentWorkDuration(): Promise<number> {
  try {
    const sessionStr = await AsyncStorage.getItem(WORK_SESSION_KEY);
    if (!sessionStr) return 0;

    const session: DriverWorkSession = JSON.parse(sessionStr);
    const elapsedMs = Date.now() - session.startTime;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    return elapsedMinutes;
  } catch {
    return 0;
  }
}

/**
 * Format jam kerja untuk tampilan (format: HH:MM)
 */
export function formatWorkDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Reset jam kerja supir (saat sampai tujuan)
 */
export async function resetWorkSession(): Promise<void> {
  await AsyncStorage.removeItem(WORK_SESSION_KEY);
  // Start new session immediately
  await startWorkSession();
}

/**
 * Hentikan jam kerja supir (end of shift)
 */
export async function endWorkSession(): Promise<DriverWorkSession | null> {
  try {
    const sessionStr = await AsyncStorage.getItem(WORK_SESSION_KEY);
    if (!sessionStr) return null;

    const session: DriverWorkSession = JSON.parse(sessionStr);
    const elapsedMs = Date.now() - session.startTime;
    const totalMinutes = Math.floor(elapsedMs / 60000);

    const endedSession: DriverWorkSession = {
      ...session,
      status: "paused",
      durationMinutes: totalMinutes,
      lastResetTime: Date.now(),
    };

    await AsyncStorage.removeItem(WORK_SESSION_KEY);
    return endedSession;
  } catch {
    return null;
  }
}

/**
 * Kirim notifikasi ke penumpang bahwa supir sudah sampai
 * Notifikasi akan masuk ke aplikasi Lintara penumpang
 */
export async function notifyPassengerArrival(
  bookingId: string,
  driverId: string,
  driverName: string,
  driverPhone: string,
  ticketCode: string,
  passengerPhone: string,
  passengerName: string,
  token?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const notification: ArrivalNotification = {
      bookingId,
      driverId,
      driverName,
      driverPhone,
      ticketCode,
      passengerPhone,
      passengerName,
      timestamp: Date.now(),
    };

    // Kirim notifikasi ke backend
    const response = await apiRequest(
      "/api/notifications/driver-arrival",
      {
        method: "POST",
        body: JSON.stringify(notification),
      }
    );

    if (response.success) {
      return {
        success: true,
        message: "Notifikasi penumpang terkirim",
      };
    } else {
      return {
        success: false,
        message: response.message || "Gagal mengirim notifikasi",
      };
    }
  } catch (error) {
    console.error("Error notifying passenger:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengirim notifikasi",
    };
  }
}

/**
 * Tandai kedatangan supir di loket/terminal
 */
export async function markDriverArrival(
  bookingId: string,
  driverId: string,
  token?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiRequest(
      "/api/bookings/mark-arrival",
      {
        method: "PUT",
        body: JSON.stringify({
          bookingId,
          driverId,
          arrivalTime: new Date().toISOString(),
        }),
      }
    );

    // Reset work hours saat sampai
    await resetWorkSession();

    if (response.success) {
      return {
        success: true,
        message: "Kedatangan tercatat. Jam kerja direset.",
      };
    } else {
      return {
        success: false,
        message: response.message || "Gagal mencatat kedatangan",
      };
    }
  } catch (error) {
    console.error("Error marking arrival:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mencatat kedatangan",
    };
  }
}

/**
 * Dapatkan riwayat notifikasi untuk penumpang
 */
export async function getPassengerNotifications(
  passengerPhone: string,
  token?: string
): Promise<ArrivalNotification[]> {
  try {
    const response = await apiRequest(
      `/api/notifications/passenger/${encodeURIComponent(passengerPhone)}`,
      {
        method: "GET",
      }
    );

    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}
