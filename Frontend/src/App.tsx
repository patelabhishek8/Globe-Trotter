import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastContainer } from './components/common/Toast';
import { AppLayout } from './layouts/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyTripsPage } from './pages/MyTripsPage';
import { CreateTripPage } from './pages/CreateTripPage';
import { ItineraryBuilderPage } from './pages/ItineraryBuilderPage';
import { ItineraryViewBudgetPage } from './pages/ItineraryViewBudgetPage';
import { CityActivitySearchPage } from './pages/CityActivitySearchPage';
import { CalendarTimelinePage } from './pages/CalendarTimelinePage';
import { CommunityPage } from './pages/CommunityPage';
import { PublicSharedTripPage } from './pages/PublicSharedTripPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { SavedPage } from './pages/SavedPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

// Protected Route Guard
const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Admin Route Guard
const AdminRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ToastContainer />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/shared-trip/:token" element={<PublicSharedTripPage />} />

            {/* Protected App Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/my-trips" element={<MyTripsPage />} />
                <Route path="/create-trip" element={<CreateTripPage />} />
                <Route path="/builder/:id" element={<ItineraryBuilderPage />} />
                <Route path="/itinerary/:id/budget" element={<ItineraryViewBudgetPage />} />
                <Route path="/explore" element={<CityActivitySearchPage />} />
                <Route path="/calendar" element={<CalendarTimelinePage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/saved" element={<SavedPage />} />
                <Route path="/profile" element={<UserProfilePage />} />

                {/* Admin Only Route */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminDashboardPage />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
export default App;
