// Smart Solar Microgrid Trading System - Application Routing Entrypoint
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/layouts/AppLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { ReservationsPage } from "@/pages/reservations/ReservationsPage";
import { CreateReservationPage } from "@/pages/reservations/CreateReservationPage";
import { PendingPage } from "@/pages/reservations/PendingPage";
import { HistoryPage } from "@/pages/reservations/HistoryPage";
import { UserManagementPage } from "@/pages/users/UserManagementPage";
import { ProsumerManagementPage } from "@/pages/prosumers/ProsumerManagementPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Enterprise Portal Routes */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="prosumers" element={<ProsumerManagementPage />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route
            path="reservations/create"
            element={<CreateReservationPage />}
          />
          <Route path="reservations/pending" element={<PendingPage />} />
          <Route path="reservations/history" element={<HistoryPage />} />
        </Route>

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
