// src/pages/LoginPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { Eye, EyeOff } from "lucide-react";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const passwordRef = useRef(null);
  const navigate = useNavigate();

  // Detect Safari browser
  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    setIsSafari(isSafari);
    
    // For Safari, always show password by default to avoid rendering issues
    if (isSafari) {
      setShowPassword(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post(
        "/auth/login",
        { email, password },
        { withCredentials: true }
      );
      const { user } = res.data;

      if (Array.isArray(user.roles) && user.roles.length > 1) {
        setRoles(user.roles);
        setErr("Please select a role to continue");
      } else {
        redirectUser(user.activeRole);
      }
    } catch (error) {
      setErr(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      setErr("Please select a role");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post(
        "/auth/set-role",
        { role: selectedRole },
        { withCredentials: true }
      );
      const newRole = res.data.activeRole;
      redirectUser(newRole);
    } catch (error) {
      setErr(error.response?.data?.message || "Failed to set role");
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (role) => {
    setTimeout(() => {
      if (role === "admin") navigate("/admin");
      else if (role === "teacher") navigate("/teacher");
      else if (role === "student") navigate("/student");
      else if (role === "captain") navigate("/captain");
      else navigate("/");
    }, 200);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    if (isSafari) {
      // For Safari, we'll keep it simple - always show password text
      // but allow toggling the eye icon for visual consistency
      setShowPassword(!showPassword);
    } else {
      // Standard behavior for other browsers
      setShowPassword(!showPassword);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center relative"
      style={{
        backgroundImage: `url('https://sports.gndec.ac.in/sites/default/files/5.jpg')`,
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>

      <form
        onSubmit={handleLogin}
        className="relative w-full max-w-sm p-8 rounded-2xl border border-white/20 shadow-xl backdrop-blur-md bg-white/30"
      >
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6 drop-shadow-md">
          Welcome To GNDEC SPORTS PORTAL 👋
        </h2>

        {err && (
          <p className="text-red-600 mb-4 text-center font-medium bg-red-100/60 p-2 rounded">
            {err}
          </p>
        )}

        {!roles.length ? (
          <>
            {/* Email */}
            <div className="mb-4">
              <label className="block text-gray-800 text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white/70 placeholder-gray-700"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label className="block text-gray-800 text-sm font-medium mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  // For Safari, always use "text" type to avoid rendering issues
                  type={isSafari ? "text" : (showPassword ? "text" : "password")}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg pr-12 bg-white/70 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ height: "48px", boxSizing: "border-box" }}
                />

                {/* Eye Icon - Show different behavior for Safari */}
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600 hover:text-gray-800"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {isSafari ? (
                    // For Safari, show a different icon to indicate special behavior
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                      <text x="6" y="18" fontSize="8" fill="currentColor">Safari</text>
                    </svg>
                  ) : showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </div>
              </div>
              
              {/* Safari info message */}
              {isSafari && (
                <p className="text-xs text-gray-700 mt-2 bg-white/70 p-2 rounded">
                  <strong>Safari Mode:</strong> Password is always visible to avoid browser rendering issues.
                </p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white py-3 rounded-lg font-semibold shadow-md transition transform hover:scale-[1.02] ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              }`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </>
        ) : (
          <>
            {/* Role Selection */}
            <label className="block text-gray-800 text-sm font-medium mb-2">
              Select Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full p-3 mb-6 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none bg-white/70"
            >
              <option value="">-- Choose Role --</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={loading}
              onClick={handleRoleSelection}
              className={`w-full text-white py-3 rounded-lg font-semibold shadow-md transition transform hover:scale-[1.02] ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              }`}
            >
              {loading ? "Please wait..." : "Continue"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default LoginPage;
