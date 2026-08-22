import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  MapPin,
  PlusCircle,
  Search,
  Bookmark,
  Calendar,
  PieChart,
  User,
  ShieldAlert,
  LogOut,
  Bell,
  Menu,
  X,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Drawer } from '../components/common/Drawer';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotification();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Trips', path: '/my-trips', icon: MapPin },
    { name: 'Plan New Trip', path: '/create-trip', icon: PlusCircle, highlight: true },
    { name: 'Explore & Search', path: '/explore', icon: Search },
    { name: 'Community', path: '/community', icon: Globe },
    { name: 'Saved', path: '/saved', icon: Bookmark },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Profile & Settings', path: '/profile', icon: User },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ name: 'Admin Panel', path: '/admin', icon: ShieldAlert, highlight: false });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col md:flex-row">
      {/* ================= DESKTOP LEFT SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-borderLight shrink-0 min-h-screen sticky top-0 z-30">
        {/* Logo Header */}
        <div className="h-16 flex items-center px-6 border-b border-borderLight gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-teal flex items-center justify-center text-white shadow-sm">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-brand">GlobeTrotter</span>
            <span className="block text-[10px] uppercase tracking-wider font-bold text-teal-600 -mt-1">Smart Travel</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive: active }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? item.highlight
                        ? 'bg-brand text-white shadow-md shadow-brand/20'
                        : 'bg-brand-50 text-brand font-bold'
                      : item.highlight
                      ? 'text-brand hover:bg-brand-50'
                      : 'text-ink-secondary hover:text-ink-primary hover:bg-slate-50'
                  }`
                }
              >
                <Icon className={`w-4 h-4 ${isActive && !item.highlight ? 'text-brand' : ''}`} />
                <span>{item.name}</span>
                {item.highlight && !isActive && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                    NEW
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 border-t border-borderLight bg-slate-50/50">
          <div className="flex items-center gap-3">
            {user?.profile_photo ? (
              <img
                src={user.profile_photo}
                alt={user?.first_name}
                className="w-10 h-10 rounded-full object-cover border border-brand-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 text-slate-600 flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
                {user?.first_name ? user.first_name.charAt(0).toUpperCase() : <User className="w-5 h-5 text-slate-400" />}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-ink-primary truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[11px] text-ink-secondary truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-ink-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTAINER ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-surface border-b border-borderLight px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          {/* Mobile hamburger & brand */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg text-ink-secondary hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand text-white flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-brand">GlobeTrotter</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 ml-auto relative">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-xl text-ink-secondary hover:text-brand hover:bg-brand-50 transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface rounded-card border border-borderLight shadow-dropdown z-50 overflow-hidden">
                  <div className="p-3.5 border-b border-borderLight flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-ink-primary">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand text-white">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllRead()}
                        className="text-xs text-brand hover:underline font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-borderLight/60">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-ink-muted">No notifications yet.</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className={`p-3.5 text-xs transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-2.5 ${
                            !n.is_read ? 'bg-brand-50/40 font-medium' : ''
                          }`}
                        >
                          {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                          {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                          {n.type === 'info' && <Info className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-ink-primary mb-0.5">{n.title}</p>
                            <p className="text-ink-secondary text-[11px] leading-relaxed">{n.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Profile Link */}
            <div
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 cursor-pointer p-1 rounded-xl hover:bg-slate-100 transition-colors"
            >
              {user?.profile_photo ? (
                <img
                  src={user.profile_photo}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border border-borderLight"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 text-slate-600 flex items-center justify-center font-bold text-xs shadow-inner">
                  {user?.first_name ? user.first_name.charAt(0).toUpperCase() : <User className="w-4 h-4 text-slate-400" />}
                </div>
              )}
              <span className="hidden lg:block text-xs font-semibold text-ink-primary">
                {user?.first_name}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* ================= MOBILE DRAWER NAVIGATION ================= */}
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        position="left"
        width="md"
        title="GlobeTrotter Navigation"
      >
        <div className="space-y-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                    isActive ? 'bg-brand text-white' : 'text-ink-secondary hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          <div className="pt-4 mt-4 border-t border-borderLight">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
