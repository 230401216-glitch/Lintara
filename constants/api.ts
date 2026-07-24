const normalizeApiBaseUrl = (url?: string) => {
  const fallbackUrl = "http://192.168.1.181:5000";
  return (url || fallbackUrl).replace(/\/+$/, "");
};

export const API_BASE_URL = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);

export const API_ENDPOINTS: any = {
  // Auth

  
  register: `${API_BASE_URL}/api/auth/register`,
  login: `${API_BASE_URL}/api/auth/login`,
  googleLogin: `${API_BASE_URL}/api/auth/google`,
  applyMitra: `${API_BASE_URL}/api/auth/apply-mitra`,
  forgotPassword: `${API_BASE_URL}/api/auth/forgot-password`,
  getPendingMitras: `${API_BASE_URL}/api/auth/mitra/pending`,
  approveMitra: (userId: string) => `${API_BASE_URL}/api/auth/mitra/${userId}/approve`,
  rejectMitra: (userId: string) => `${API_BASE_URL}/api/auth/mitra/${userId}/reject`,
  getAdminReports: `${API_BASE_URL}/api/auth/reports`,
  getMitraProfile: `${API_BASE_URL}/api/auth/mitra/me`,
  uploadMitraDocument: `${API_BASE_URL}/api/auth/mitra/document`,
  uploadMyPhoto: `${API_BASE_URL}/api/auth/me/photo`,
  changeMyPassword: `${API_BASE_URL}/api/auth/me/password`,
  approveMitraDocument: (userId: string) => `${API_BASE_URL}/api/auth/mitra/${userId}/document/approve`,
  rejectMitraDocument: (userId: string) => `${API_BASE_URL}/api/auth/mitra/${userId}/document/reject`,

  // Travels
  getTravels: `${API_BASE_URL}/api/travels`,
  createTravel: `${API_BASE_URL}/api/travels`,
  getTravelById: (id: string) => `${API_BASE_URL}/api/travels/${id}`,
  updateTravel: (id: string) => `${API_BASE_URL}/api/travels/${id}`,
  uploadTravelPhoto: (id: string) => `${API_BASE_URL}/api/travels/${id}/photo`,
  getRoutes: `${API_BASE_URL}/api/travels/routes`,
  createRoute: `${API_BASE_URL}/api/travels/routes`,
  updateRoute: (id: string) => `${API_BASE_URL}/api/travels/routes/${id}`,
  getSchedules: `${API_BASE_URL}/api/travels/schedules`,
  createSchedule: `${API_BASE_URL}/api/travels/schedules`,
  updateSchedule: (id: string) => `${API_BASE_URL}/api/travels/schedules/${id}`,
  getAvailableSeats: (scheduleId: string) =>
    `${API_BASE_URL}/api/travels/schedules/${scheduleId}/seats`,

  // Bookings
  createBooking: `${API_BASE_URL}/api/bookings`,
  getBookings: `${API_BASE_URL}/api/bookings`,
  getAllBookings: `${API_BASE_URL}/api/bookings/all`,
  getBookingById: (bookingId: string) =>
    `${API_BASE_URL}/api/bookings/${bookingId}`,
  // alias kept for backward compatibility
  getBooking: (bookingId: string) => `${API_BASE_URL}/api/bookings/${bookingId}`,
  cancelBooking: (bookingId: string) =>
    `${API_BASE_URL}/api/bookings/${bookingId}`,
  // optional admin actions (may be no-ops if backend doesn't implement)
  refundBooking: (bookingId: string) => `${API_BASE_URL}/api/bookings/${bookingId}/refund`,
  completeBooking: (bookingId: string) => `${API_BASE_URL}/api/bookings/${bookingId}/complete`,
  scanTicket: `${API_BASE_URL}/api/bookings/tickets/scan`,

  // Drivers / Supir
  getDrivers: `${API_BASE_URL}/api/drivers`,
  createDriver: `${API_BASE_URL}/api/drivers`,
  updateDriver: (id: string) => `${API_BASE_URL}/api/drivers/${id}`,

  // Users (admin)
  getUsers: `${API_BASE_URL}/api/auth/users`,
  getUser: (id: string) => `${API_BASE_URL}/api/auth/users/${id}`,
  updateUser: (id: string) => `${API_BASE_URL}/api/auth/users/${id}`,
  deleteUser: (id: string) => `${API_BASE_URL}/api/auth/users/${id}`,

  // Payments
  processPayment: `${API_BASE_URL}/api/payments/process`,
  getPaymentStatus: (bookingId: string) =>
    `${API_BASE_URL}/api/payments/${bookingId}`,
};

// Debug helper - log current API configuration
export const DEBUG_API = () => {
  console.log("🔧 API Configuration Debug:");
  console.log(`API_BASE_URL: ${API_BASE_URL}`);
  console.log(`Register endpoint: ${API_ENDPOINTS.register}`);
};

export const API_BASE = API_BASE_URL;
