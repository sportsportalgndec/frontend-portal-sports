import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLoading } from "../contexts/LoadingContext";
import API from "../services/api";

const SidebarLink = ({ to, children, icon: Icon, onClick }) => {
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading();

  const handleNavigation = () => {
    startLoading('Navigating...');
    setTimeout(() => {
      navigate(to);
      stopLoading();
      if (onClick) onClick();
    }, 300); // Small delay to show loading
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <button
        onClick={handleNavigation}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        {Icon && <Icon className="h-5 w-5" />}
        <span className="font-medium">{children}</span>
      </button>
    </motion.div>
  );
};

function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Call backend logout API to clear server-side session
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear client-side storage
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.clear();
      } catch (err) {
        console.error('Error clearing storage:', err);
      }
      // Clear browser history and navigate to login with replace
      window.history.replaceState(null, '', '/');
      window.location.replace("/");
    }
  };

  const links = [
    { to: "/admin", label: "🏠 Home" },
    { to: "/admin/create-student", label: "Student" },
    // { to: "/admin/create-teacher", label: "Create Teacher" },
    { to: "/admin/create-captain", label: "Create Captain" },
    { to: "/admin/session", label: "Manage Sessions" },
    { to: "/admin/approvals", label: "Approve Teams" },
    // { to: "/admin/captains", label: "Captains & Teams" },
    { to: "/admin/gym-attendance", label: "Gym-Attendance" },
    { to: "/admin/swimming-attendance", label: "Swimming-Attendance" },
    { to: "/admin/assign-position", label: "Assign Positions" },
    { to: "/admin/assign-team-position", label: "Team Position" },
    { to: "/admin/export", label: "Export Students" },
    { to: "/admin/export-captains", label: "Export Captains" },
    { to: "/admin/issue-cert", label: "Certificates" },
    { to: "/admin/score", label: "Score Matrix" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-md border text-gray-600 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <div className="font-semibold text-gray-800 dark:text-gray-100">
            Admin
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            className="px-3 py-1 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {isDark ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm z-40 overflow-y-auto transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="text-xl font-bold text-orange-600">Admin Panel</div>
          {/* Close button (mobile only) */}
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ✕
          </button>
          {/* Desktop theme toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="hidden lg:inline-flex px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Toggle theme"
          >
            {isDark ? "🌙" : "☀️"}
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {links.map((link) => (
            <SidebarLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)} // auto close on mobile
            >
              {link.label}
            </SidebarLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full px-3 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoggingOut ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Logging out...
              </>
            ) : (
              'Logout'
            )}
          </button>
        </div>
        <div className="h-6" />
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        <main className="w-full">
          <div className="px-4 py-4 lg:px-6 lg:py-6 text-gray-900 dark:text-gray-100">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
