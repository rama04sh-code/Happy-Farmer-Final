import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import Layout from "./components/Layout.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Farms from "./pages/Farms.jsx";
import FarmDetail from "./pages/FarmDetail.jsx";
import Crops from "./pages/Crops.jsx";
import CropDetail from "./pages/CropDetail.jsx";
import Notifications from "./pages/Notifications.jsx";
import Settings from "./pages/Settings.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070C09] flex items-center justify-center font-['Cairo',sans-serif]" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-emerald-400">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={user ? <Navigate to="/farms" replace /> : <Landing />} />

      {/* Auth Pages */}
      <Route path="/login" element={user ? <Navigate to="/farms" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/farms" replace /> : <Register />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/farms" replace /> : <ForgotPassword />} />

      {/* Protected App Pages */}
      <Route
        path="/farms"
        element={
          <Protected>
            <Farms />
          </Protected>
        }
      />
      <Route
        path="/farms/:id"
        element={
          <Protected>
            <FarmDetail />
          </Protected>
        }
      />
      <Route
        path="/farms/:id/notifications"
        element={
          <Protected>
            <Notifications />
          </Protected>
        }
      />
      <Route
        path="/crops"
        element={
          <Protected>
            <Crops />
          </Protected>
        }
      />
      <Route
        path="/crops/:id"
        element={
          <Protected>
            <CropDetail />
          </Protected>
        }
      />
      <Route
        path="/schedule"
        element={
          <Protected>
            <Crops />
          </Protected>
        }
      />
      <Route
        path="/diagnose"
        element={
          <Protected>
            <Crops />
          </Protected>
        }
      />
      <Route
        path="/settings"
        element={
          <Protected>
            <Settings />
          </Protected>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
