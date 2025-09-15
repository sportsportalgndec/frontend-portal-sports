// REFACTORED: StudentProfileform UI only — backend and API calls preserved
import { useEffect, useState } from "react";
import { branches as sharedBranches, years as sharedYears, sportsList as sharedSports } from "../lib/options";
import { useTheme } from "../contexts/ThemeContext";
import API from "../services/api";

const StudentProfileForm = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedSessionIsActive, setSelectedSessionIsActive] = useState(false);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [formData, setFormData] = useState({
    dob: "",
    gender: "",
    contact: "",
    address: "",
    sports: [],
    crn: "",
    photo: "",
    fatherName: "",
    yearOfPassingMatric: "",
    yearOfPassingPlusTwo: "",
    firstAdmissionDate: "",
    lastExamName: "",
    lastExamYear: "",
    yearsOfParticipation: "",
    signaturePhoto: "",
    interCollegeGraduateCourse: "",
    interCollegePgCourse: "",
    branch:"",
    year:"",
    name:"",
  });

  const [adminSports, setAdminSports] = useState([]);
  const [newSport, setNewSport] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingForApproval, setSubmittingForApproval] = useState(false);
  const [sportsSubmitting, setSportsSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [err, setErr] = useState("");
  const [hasShownCloneMessage, setHasShownCloneMessage] = useState(false);

  // Navigation state
  const [activeSection, setActiveSection] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studentName, setStudentName] = useState("");

  // Image validation and preview states
  const [photoPreview, setPhotoPreview] = useState("");
  const [signaturePreview, setSignaturePreview] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [signatureError, setSignatureError] = useState("");

  // New state variables for the three sports categories
  const [ptuIntercollegeSport, setPtuIntercollegeSport] = useState("");
  const [nationalLevelSport, setNationalLevelSport] = useState("");
  const [internationalLevelSport, setInternationalLevelSport] = useState("");
  // Additional sports inputs
  const [stateLevelSport, setStateLevelSport] = useState("");
  const [interUniversityLevelSport, setInterUniversityLevelSport] = useState("");

  // Image validation function
  const validateImage = (file) => {
    const maxSize = 2 * 1024 * 1024; // 2MB
    const maxDimensions = 2048; // 2048x2048px
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Please select a valid image file (JPEG, PNG, or WebP)' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 2MB' };
    }
    
    return { valid: true };
  };

  // Image dimension validation function
  const validateImageDimensions = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width > 2048 || img.height > 2048) {
          resolve({ valid: false, error: 'Image dimensions must be 2048x2048 pixels or smaller' });
        } else {
          resolve({ valid: true });
        }
      };
      img.onerror = () => {
        resolve({ valid: false, error: 'Invalid image file' });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // fetch sessions
  const fetchSessions = async () => {
    try {
      const res = await API.get("/student/my-sessions", {
        withCredentials: true,
      });
      const sessionList = res.data || [];
      setSessions(sessionList);
      if (sessionList.length > 0) {
        const activeSession = sessionList.find((s) => s.isActive);
        if (activeSession) {
          setSelectedSession(activeSession._id);
          setSelectedSessionIsActive(true);
        } else {
          setSelectedSession(sessionList[0]._id);
          setSelectedSessionIsActive(sessionList[0].isActive);
        }
      }
    } catch {
      setErr("Failed to load sessions.");
    }
  };
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
  const fetchHistory = async (urn, sessionId) => {
    setLoadingHistory(true);
    try {
      const res = await API.get(`/student/history/${urn}/${sessionId}`, { withCredentials: true });
      setHistory(res.data);
    } catch {
      setHistory(null);
    } finally {
      setLoadingHistory(false);
    }
  };
  
  // fetch profile (removed clone message logic from here)
  const fetchProfile = async (sessionId) => {
    if (!sessionId) return;
    setLoading(true);
    setErr("");
    try {
      const res = await API.get(`/student/profile?sessionId=${sessionId}`, {
        withCredentials: true,
      });
      const data = res.data;
      setProfile(data);
      // Set student name for personalized greeting
      setStudentName(data?.student?.name || data?.student?.fullName || "Student");
      if (data?.urn) {
        fetchHistory(data.urn, data.sessionId);
      }
      const adminSportList = data?.sports || [];
      setAdminSports(adminSportList);

      setFormData({
        dob: data?.dob ? data.dob.slice(0, 10) : "",
        gender: data?.gender || "",
        contact: data?.contact || "",
        address: data?.address || "",
        crn: data?.crn || "",
        photo: data?.photo || "",
        fatherName: data?.fatherName || "",
        yearOfPassingMatric: data?.yearOfPassingMatric || "",
        yearOfPassingPlusTwo: data?.yearOfPassingPlusTwo || "",
        firstAdmissionDate: data?.firstAdmissionDate || "",
        lastExamName: data?.lastExamName || "",
        lastExamYear: data?.lastExamYear || "",
        yearsOfParticipation: data?.yearsOfParticipation || "",
        signaturePhoto: data?.signaturePhoto || "",
        sports: Array.from(new Set([...(data?.studentSports || [])])),
        interCollegeGraduateCourse: data?.interCollegeGraduateCourse || 0,
        interCollegePgCourse: data?.interCollegePgCourse || 0,
        branch:data?.branch || '',
        year:data?.year,
        name:data?.name   
      });
      
      const sessionInfo = sessions.find((s) => s._id === sessionId);
      setSelectedSessionIsActive(sessionInfo?.isActive || false);
    } catch {
      setErr("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };
// Branch to semester mapping
const branchSemesters = {
  "B.Tech.(Civil Engineering)": 8,
  "B.Tech.(Computer Science and Engineering)": 8,
  "B.Tech.(Electrical Engineering)": 8,
  "B.Tech.(Electronics and Communication Engineering)": 8,
  "B.Tech.(Information Technology)": 8,
  "B.Tech.(Mechanical Engineering)": 8,
  "B.Tech.(Robotics and Artificial Intelligence)": 8,

  "M.Tech.(Electronics and Communication Engineering)": 4,
  "M.Tech.(Environmental Science and Engineering)": 4,
  "M.Tech.(Computer Science and Information Technology)": 4,
  "M.Tech.(Power Engineering)": 4,
  "M.Tech.(Production Engineering)": 4,
  "M.Tech.(Structural Engineering)": 4,
  "M.Tech.(Computer Science and Engineering)": 4,

  "MBA (Masters in Business Administration)": 4,
  "MCA (Masters in Computer Application)": 4,

  "BCA (Bachelor of Computer Applications)": 6,
  "BBA (Bachelor of Business Administration)": 6,
  "B.Com.(Entrepreneurship)": 6,
  "B.Voc Interior Design": 6,
  "B.Voc.(Interior Design)": 6
};

  // input change
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // upload handler (separate inputs for photo & signature) - PRESERVE: existing API call
  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side validation
    const validation = validateImage(file);
    if (!validation.valid) {
      if (type === "photo") {
        setPhotoError(validation.error);
        setPhotoPreview("");
      } else {
        setSignatureError(validation.error);
        setSignaturePreview("");
      }
      return;
    }

    // Validate image dimensions
    const dimensionValidation = await validateImageDimensions(file);
    if (!dimensionValidation.valid) {
      if (type === "photo") {
        setPhotoError(dimensionValidation.error);
        setPhotoPreview("");
      } else {
        setSignatureError(dimensionValidation.error);
        setSignaturePreview("");
      }
      return;
    }

    // Clear previous errors
    if (type === "photo") {
      setPhotoError("");
      setUploadingPhoto(true);
    } else {
      setSignatureError("");
      setUploadingSignature(true);
    }
    setErr("");

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === "photo") {
        setPhotoPreview(e.target.result);
      } else {
        setSignaturePreview(e.target.result);
      }
    };
    reader.readAsDataURL(file);

    try {
      const data = new FormData();
      data.append(type, file);

      const res = await API.post(`/student/upload-photo`, data, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = type === "photo" ? res.data?.photoUrl : res.data?.signatureUrl;
      if (url) {
        setFormData((prev) => ({ ...prev, [type]: url }));
        alert(`✅ ${type} uploaded successfully`);
      }
    } catch {
      setErr("❌ Upload error");
    } finally {
      if (type === "photo") setUploadingPhoto(false);
      if (type === "signaturePhoto") setUploadingSignature(false);
    }
  };

  // save personal
  const handleSavePersonal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErr("");
    try {
      await API.put(
        "/student/profile",
        {
          sessionId: selectedSession,
          ...formData,
        },
        { withCredentials: true }
      );

      alert("✅ Personal details saved successfully.");
      fetchProfile(selectedSession);
    } catch {
      setErr("❌ Failed to save personal details.");
    } finally {
      setSubmitting(false);
    }
  };

  // submit for approval
  const handleSubmitPersonalForApproval = async () => {
    setSubmittingForApproval(true);
    setErr("");
    try {
      await API.post(
        "/student/submit-profile",
        {
          sessionId: selectedSession,
          ...formData,
        },
        { withCredentials: true }
      );
      setProfile((prev) => ({
        ...prev,
        status: { ...prev?.status, personal: "pending" }
      }));
      alert("✅ Personal details submitted for approval.");
      fetchProfile(selectedSession);
    } catch {
      setErr("❌ Failed to submit personal details for approval.");
    } finally {
      setSubmittingForApproval(false);
    }
  };

  // Fixed sport handlers - properly manage the sports array
  const handleAddPtuIntercollegeSport = () => {
    if (!ptuIntercollegeSport.trim()) return;
    const prefixed = `PTU Intercollege ${ptuIntercollegeSport.trim()}`;
    if (!formData.sports.includes(prefixed)) {
      setFormData((prev) => ({ 
        ...prev, 
        sports: [...prev.sports, prefixed] 
      }));
    }
    setPtuIntercollegeSport("");
  };

  const handleAddNationalLevelSport = () => {
    if (!nationalLevelSport.trim()) return;
    const prefixed = `National Level ${nationalLevelSport.trim()}`;
    if (!formData.sports.includes(prefixed)) {
      setFormData((prev) => ({ 
        ...prev, 
        sports: [...prev.sports, prefixed] 
      }));
    }
    setNationalLevelSport("");
  };

  const handleAddInternationalLevelSport = () => {
    if (!internationalLevelSport.trim()) return;
    const prefixed = `International Level ${internationalLevelSport.trim()}`;
    if (!formData.sports.includes(prefixed)) {
      setFormData((prev) => ({ 
        ...prev, 
        sports: [...prev.sports, prefixed] 
      }));
    }
    setInternationalLevelSport("");
  };

  // State Level Sports
  const handleAddStateLevelSport = () => {
    if (!stateLevelSport.trim()) return;
    const prefixed = `State Level ${stateLevelSport.trim()}`;
    if (!formData.sports.includes(prefixed)) {
      setFormData((prev) => ({
        ...prev,
        sports: [...prev.sports, prefixed]
      }));
    }
    setStateLevelSport("");
  };

  // Inter-University Level Sports
  const handleAddInterUniversityLevelSport = () => {
    if (!interUniversityLevelSport.trim()) return;
    const prefixed = `Inter-University Level ${interUniversityLevelSport.trim()}`;
    if (!formData.sports.includes(prefixed)) {
      setFormData((prev) => ({
        ...prev,
        sports: [...prev.sports, prefixed]
      }));
    }
    setInterUniversityLevelSport("");
  };

  // remove sport
  const handleRemoveSport = (sport) => {
    if (adminSports.includes(sport)) return;
    setFormData((prev) => ({
      ...prev,
      sports: prev.sports.filter((s) => s !== sport),
    }));
  };

  // submit sports
  const handleSubmitSports = async () => {
    if (!formData.sports.length) return;
    setSportsSubmitting(true);
    setErr("");
    try {
      await API.post(
        "/student/submit-profile",
        {
          sessionId: selectedSession,
          sports: formData.sports,
        },
        { withCredentials: true }
      );

      alert("✅ Sports submitted for approval.");
      fetchProfile(selectedSession);
      setProfile((prev) => ({
        ...prev,
        status: { ...prev.status, sports: "pending" },
      }));
    } catch {
      setErr("❌ Failed to submit sports.");
    } finally {
      setSportsSubmitting(false);
    }
  };

  // save sports data - PRESERVE: existing API call
  const handleSaveSports = async () => {
    if (!formData.sports.length) return;
    setSportsSubmitting(true);
    setErr("");
    try {
      await API.put(
        "/student/profile",
        {
          sessionId: selectedSession,
          sports: formData.sports,
        },
        { withCredentials: true }
      );

      alert("✅ Sports saved successfully.");
      fetchProfile(selectedSession);
    } catch {
      setErr("❌ Failed to save sports.");
    } finally {
      setSportsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Reset clone message flag when session changes
  useEffect(() => {
    setHasShownCloneMessage(false);
  }, [selectedSession]);

  // Fetch profile when session changes
  useEffect(() => {
    if (selectedSession) {
      fetchProfile(selectedSession);
    }
  }, [selectedSession]);

  // Handle clone message after profile is loaded
  useEffect(() => {
    const personalStatus = profile?.status?.personal?.toLowerCase?.();
    const shouldShow = profile?.student?.isCloned && personalStatus === "none";
    console.log("DEBUG clone check:", { personalStatus, isCloned: profile?.isCloned, hasShownCloneMessage });
    if (shouldShow && !hasShownCloneMessage) {
      alert("This profile has been cloned from your last approved session. Please review and update if needed.");
      setHasShownCloneMessage(true);
    }
  }, [profile, hasShownCloneMessage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-orange-500 border-dashed rounded-full animate-spin"></div>
      </div>
    );
  }

  // ---- Personal states ----
  const personalPending = profile?.status?.personal === "pending";
  const personalApproved = profile?.status?.personal === "approved";

  // ---- Sports states ----
  const sportsPending = profile?.status?.sports === "pending";
  const sportsApproved = profile?.status?.sports === "approved";

  // ---- Disable conditions ----
  const readOnlyPersonal = !selectedSessionIsActive || personalPending || personalApproved;
  const disableSports = !personalApproved || sportsPending || sportsApproved;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Student Dashboard</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            >
              {isDark ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Student Panel</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Personalized Greeting */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Hello, {formData.name||"Student"}  👋</p>
          </div>

          {/* Session Selection */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Session
            </label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">-- Select Session --</option>
              {sessions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.session} {s.isActive ? "(Active)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Items */}
          <nav className="mt-6">
            <div className="px-3 space-y-1">
              <button
                onClick={() => { setActiveSection('session'); setSidebarOpen(false); }}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeSection === 'session'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Session
              </button>

              <button
                onClick={() => { setActiveSection('profile'); }}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeSection === 'profile'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>

              <button
                onClick={() => { setActiveSection('add-sports'); }}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeSection === 'add-sports'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Add Sports
              </button>

              <button
                onClick={() => { setActiveSection('sports-history'); }}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeSection === 'sports-history'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Sports History
              </button>
            </div>
          </nav>

          {/* Theme Toggle and Logout Buttons */}
          <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            >
              {isDark ? (
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
            </div>

            {/* Error Messages */}
            {err && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="ml-3 text-sm text-red-700 dark:text-red-300">{err}</p>
                </div>
              </div>
            )}

            {/* Session Section */}
            {activeSection === 'session' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Session Status</h2>
                </div>
                <div className="p-6">
                  {/* Status Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Personal Details</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          personalApproved ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          personalPending ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {personalApproved ? 'Approved' : personalPending ? 'Pending' : 'Not Submitted'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Sports Details</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          sportsApproved ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          sportsPending ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {sportsApproved ? 'Approved' : sportsPending ? 'Pending' : 'Not Submitted'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Messages */}
                  {!selectedSessionIsActive && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="ml-3 text-sm text-red-700 dark:text-red-300">
                          This session has expired. You cannot update details.
                        </p>
                      </div>
                    </div>
                  )}

                  {personalApproved && (
                    <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="ml-3 text-sm text-green-700 dark:text-green-300">
                          Personal details approved
                        </p>
                      </div>
                    </div>
                  )}

                  {personalPending && !personalApproved && (
                    <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <p className="ml-3 text-sm text-yellow-700 dark:text-yellow-300">
                          Personal details pending approval
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Profile Section */}
            {activeSection === 'profile' && profile && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Details</h2>
                </div>
                
                <div className="p-6">
                  {!personalApproved ? (
                    <form className="space-y-6">
                      {/* Basic Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            CRN
                          </label>
                          <input
                            name="crn"
                            placeholder="Enter CRN"
                            value={formData.crn}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                            disabled={!selectedSessionIsActive || personalPending || profile?.isCloned}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Date of Birth
                          </label>
                          <input
                            name="dob"
                            type="date"
                            value={formData.dob}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                            disabled={!selectedSessionIsActive || personalPending || profile?.isCloned}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Gender
                          </label>
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                            disabled={!selectedSessionIsActive || personalPending || profile?.isCloned}
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Father's Name
                          </label>
                          <input
                            name="fatherName"
                            placeholder="Enter Father's Name"
                            value={formData.fatherName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                            disabled={!selectedSessionIsActive || personalPending || profile?.isCloned}
                          />
                        </div>
                      </div>

                      {/* Academic Information */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                          Academic Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Matric Year
                            </label>
<select
  name="yearOfPassingMatric"
  value={formData.yearOfPassingMatric}
  onChange={handleChange}
  disabled={!selectedSessionIsActive || personalPending || profile?.isCloned}
  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
             focus:ring-2 focus:ring-orange-500 focus:border-transparent 
             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
             disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed 
             transition-colors"
>
  <option value="">Select Year</option>
  {Array.from({ length: 20 }, (_, i) => {
    const year = new Date().getFullYear() - i; // current year se pichhle 50 years
    return (
      <option key={year} value={year}>
        {year}
      </option>
    );
  })}
</select>

                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              +2 Year
                            </label>
<select
  name="yearOfPassingPlusTwo"
  value={formData.yearOfPassingPlusTwo}
  onChange={handleChange}
  disabled={!selectedSessionIsActive || personalPending || profile?.isCloned}
  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
             focus:ring-2 focus:ring-orange-500 focus:border-transparent 
             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
             disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed 
             transition-colors"
>
  <option value="">Select Year</option>
  {Array.from({ length: 20 }, (_, i) => {
    const year = new Date().getFullYear() - i; // Current year se peeche 50 saal
    return (
      <option key={year} value={year}>
        {year}
      </option>
    );
  })}
</select>

                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              First Admission Date
                            </label>
                            <input
                              name="firstAdmissionDate"
                              type="month"
                              value={formData.firstAdmissionDate}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                              disabled={!selectedSessionIsActive || personalPending || profile?.isCloned}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Last Exam Name
                            </label>
<select
  name="lastExamName"
  value={formData.lastExamName}
  onChange={handleChange}
  disabled={!selectedSessionIsActive || personalPending}
  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
             focus:ring-2 focus:ring-orange-500 focus:border-transparent 
             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
             disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed 
             transition-colors"
>
  <option value="">Select Semester</option>
  {(() => {
    const totalSemesters = branchSemesters[formData.branch] || 0;

    return Array.from({ length: totalSemesters }, (_, i) => {
      const semesterNumber = i + 1;
      const suffix =
        semesterNumber === 1
          ? "st"
          : semesterNumber === 2
          ? "nd"
          : semesterNumber === 3
          ? "rd"
          : "th";

      return (
        <option key={semesterNumber} value={`${semesterNumber} Semester`}>
          {semesterNumber}
          {suffix} Semester
        </option>
      );
    });
  })()}
</select>

                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Last Exam Year
                            </label>
<select
  name="lastExamYear"
  value={formData.lastExamYear}
  onChange={handleChange}
  disabled={!selectedSessionIsActive || personalPending}
  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
             focus:ring-2 focus:ring-orange-500 focus:border-transparent 
             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
             disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed 
             transition-colors"
>
  <option value="">Select Year</option>
  {Array.from({ length: 20 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return (
      <option key={year} value={year}>
        {year}
      </option>
    );
  })}
</select>

                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Years of Participation
                            </label>
                           <select
  name="yearsOfParticipation"
  value={formData.yearsOfParticipation}
  onChange={handleChange}
  disabled={!selectedSessionIsActive || personalPending}
  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
             focus:ring-2 focus:ring-orange-500 focus:border-transparent 
             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
             disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed 
             transition-colors"
>
  <option value="">Select years</option>
  {[...Array(10)].map((_, i) => (
    <option key={i + 1} value={i + 1}>
      {i + 1}
    </option>
  ))}
</select>

                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                          Contact Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Contact Number
                            </label>
                            <input
                              name="contact"
                              placeholder="Enter contact number"
                              value={formData.contact}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                              disabled={!selectedSessionIsActive || personalPending || profile?.isCloned}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Address
                            </label>
                            <textarea
                              name="address"
                              placeholder="Enter your address"
                              value={formData.address}
                              onChange={handleChange}
                              rows={3}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors resize-none"
                              disabled={!selectedSessionIsActive || personalPending}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Course Information */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                          Course Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Inter-College Graduate Course Count
                            </label>
<select
  name="interCollegeGraduateCourse"
  value={formData.interCollegeGraduateCourse}
  onChange={handleChange}
  disabled={!selectedSessionIsActive || personalPending || profile?.isCloned}
  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
             focus:ring-2 focus:ring-orange-500 focus:border-transparent 
             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
             disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed 
             transition-colors"
>
  <option value="">Select Number</option>
  {[...Array(10)].map((_, i) => (
    <option key={i + 1} value={i + 1}>
      {i + 1}
    </option>
  ))}
</select>

                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Inter-College PG Course Count
                            </label>
<select
  name="interCollegePgCourse"
  value={formData.interCollegePgCourse}
  onChange={handleChange}
  disabled={!selectedSessionIsActive || personalPending || profile?.isCloned}
  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
             focus:ring-2 focus:ring-orange-500 focus:border-transparent 
             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
             disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed 
             transition-colors"
>
  <option value="">Select Number</option>
  {[...Array(10)].map((_, i) => (
    <option key={i + 1} value={i + 1}>
      {i + 1}
    </option>
  ))}
</select>

                          </div>
                        </div>
                      </div>

                      {/* File Uploads with Enhanced Validation */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                          File Uploads
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Upload Photo
                            </label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                              <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => handleUpload(e, "photo")}
                                    disabled={!selectedSessionIsActive || personalPending || uploadingPhoto || profile?.isCloned}
                                    className="sr-only"
                                    id="photo-upload"
                                  />
                                  <label htmlFor="photo-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <span>{uploadingPhoto ? "Uploading..." : (formData.photo ? "Re-upload photo" : "Upload a photo")}</span>
                                  </label>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">JPEG, PNG, WebP up to 2MB, max 2048x2048px</p>
                                {photoError && (
                                  <p className="text-xs text-red-500 dark:text-red-400">{photoError}</p>
                                )}
                              </div>
                            </div>
                            {(formData.photo || photoPreview) && (
                              <div className="mt-4">
                                <img
                                  src={photoPreview || formData.photo}
                                  alt="Preview"
                                  className="w-32 h-32 object-cover rounded-lg mx-auto border border-gray-200 dark:border-gray-700"
                                />
                                <p className="text-xs text-center text-green-600 dark:text-green-400 mt-2">
                                  {formData.photo ? "Photo uploaded" : "Preview"}
                                </p>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Upload Signature
                            </label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                              <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                  <input
                                    name="signaturePhoto"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => handleUpload(e, "signaturePhoto")}
                                    disabled={!selectedSessionIsActive || personalPending || uploadingSignature || profile?.isCloned}
                                    className="sr-only"
                                    id="signature-upload"
                                  />
                                  <label htmlFor="signature-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <span>{uploadingSignature ? "Uploading..." : (formData.signaturePhoto ? "Re-upload signature" : "Upload signature")}</span>
                                  </label>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">JPEG, PNG, WebP up to 2MB, max 2048x2048px</p>
                                {signatureError && (
                                  <p className="text-xs text-red-500 dark:text-red-400">{signatureError}</p>
                                )}
                              </div>
                            </div>
                            {(formData.signaturePhoto || signaturePreview) && (
                              <div className="mt-4">
                                <img
                                  src={signaturePreview || formData.signaturePhoto}
                                  alt="Signature"
                                  className="w-32 h-16 object-contain mx-auto border border-gray-200 dark:border-gray-700 rounded-lg"
                                />
                                <p className="text-xs text-center text-green-600 dark:text-green-400 mt-2">
                                  {formData.signaturePhoto ? "Signature uploaded" : "Preview"}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={handleSavePersonal}
                          disabled={!selectedSessionIsActive || personalPending || submitting}
                          className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg"
                        >
                          {submitting ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              Save Profile
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitPersonalForApproval}
                          disabled={
                            !selectedSessionIsActive || personalPending || personalApproved || submittingForApproval
                          }
                          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg"
                        >
                          {submittingForApproval ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Submitting...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Submit for Approval
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    // Approved Profile Display
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Profile Approved</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                            <span className="text-gray-900 dark:text-gray-100">{formData.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Branch:</span>
                            <span className="text-gray-900 dark:text-gray-100">{formData.branch}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">CRN:</span>
                            <span className="text-gray-900 dark:text-gray-100">{formData.crn}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Father's Name:</span>
                            <span className="text-gray-900 dark:text-gray-100">{formData.fatherName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">DOB:</span>
                            <span className="text-gray-900 dark:text-gray-100">{formData.dob}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Gender:</span>
                            <span className="text-gray-900 dark:text-gray-100">{formData.gender}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Contact:</span>
                            <span className="text-gray-900 dark:text-gray-100">{formData.contact}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Address:</span>
                            <span className="text-gray-900 dark:text-gray-100">{formData.address}</span>
                          </div>
                              <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Year:</span>
                            <span className="text-gray-900 dark:text-gray-100">{formData.year}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Photo:</span>
                            <img src={formData.photo} alt="Photo" className="w-16 h-16 object-cover" />
                          </div>
                        </div>
                        <div className="space-y-3">

                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Year of Passing plus two:</span>
                            <span className="text-gray-900 dark:text-gray-100">{formData.yearOfPassingPlusTwo}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Year of Passing:</span>
                            <span className="text-gray-900 dark:text-gray-100">{formData.yearOfPassingMatric}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Inter College Graduate Course:</span>
                            <span className="text-gray-900 dark:text-gray-100">{formData.interCollegeGraduateCourse}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Inter College PG Course:</span>
                            <span className="text-gray-900 dark:text-gray-100">{formData.interCollegePgCourse}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">First Admission Date:</span>
                            <span className="text-gray-900 dark:text-gray-100">{formData.firstAdmissionDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Last Exam Name:</span>
                            <span className="text-gray-900 dark:text-gray-100">{formData.lastExamName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Last Exam Year:</span>
                            <span className="text-gray-900 dark:text-gray-100">{formData.lastExamYear}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Years of Participation:</span>
                            <span className="text-gray-900 dark:text-gray-100">{formData.yearsOfParticipation}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Signature Photo:</span>
                            <img src={formData.signaturePhoto} alt="Signature Photo" className="w-16 h-16 object-cover" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Add Sports Section */}
            {activeSection === 'add-sports' && profile && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Sports</h2>
                </div>
                
                <div className="p-6">
                  {!personalApproved && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                      <div className="flex">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="ml-3 text-sm text-yellow-700 dark:text-yellow-300">
                          Sports can be added only after personal details are approved.
                        </p>
                      </div>
                    </div>
                  )}

                  {sportsApproved && (
                    <div className="mb-6">
                      <div className="flex items-center mb-4">
                        <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h4 className="text-lg font-semibold text-green-800 dark:text-green-200">Sports Approved</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.sports.map((sport, idx) => (
                          <span
                            key={idx}
                            className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 rounded-full text-sm font-medium border border-green-200 dark:border-green-800"
                          >
                            {sport}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {personalApproved && !sportsApproved && (
                    <>
                      {sportsPending && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                          <div className="flex">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <p className="ml-3 text-sm text-yellow-700 dark:text-yellow-300">
                              Sports pending admin approval…
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Current Sports */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Current Sports</h4>
                        <div className="flex flex-wrap gap-2">
                          {[
                            ...adminSports,
                            ...formData.sports.filter((s) => !adminSports.includes(s)),
                          ].map((sport, idx) => (
                            <span
                              key={idx}
                              className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full flex items-center space-x-2 text-sm font-medium"
                            >
                              <span>{sport}</span>
                              {!adminSports.includes(sport) && !sportsPending && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSport(sport)}
                                  className="text-red-500 hover:text-red-700"
                                  disabled={!selectedSessionIsActive}
                                >
                                  ✕
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Sports Categories */}
                      <div className="space-y-4">
                        {/* PTU Intercollege Sports */}
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
                          <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            PTU Intercollege Sports
                          </h4>
                          <div className="flex space-x-2">
                            <select
                              value={ptuIntercollegeSport}
                              onChange={(e) => setPtuIntercollegeSport(e.target.value)}
                              disabled={!selectedSessionIsActive || sportsPending}
                              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                            >
                              <option value="">Select sport</option>
                              {sharedSports.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={handleAddPtuIntercollegeSport}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                              disabled={!selectedSessionIsActive || sportsPending}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* National Level Sports */}
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                          <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 11.955 0 0112 2.944a11.955 11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            National Level Sports
                          </h4>
                          <div className="flex space-x-2">
                            <select
                              value={nationalLevelSport}
                              onChange={(e) => setNationalLevelSport(e.target.value)}
                              disabled={!selectedSessionIsActive || sportsPending}
                              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                            >
                              <option value="">Select sport</option>
                              {sharedSports.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={handleAddNationalLevelSport}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                              disabled={!selectedSessionIsActive || sportsPending}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* State Level Sports */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3v7h6v-7c0-1.657-1.343-3-3-3zm0-5a3 3 0 013 3v1H9V6a3 3 0 013-3z" />
                            </svg>
                            State Level Sports
                          </h4>
                          <div className="flex space-x-2">
                            <select
                              value={stateLevelSport}
                              onChange={(e) => setStateLevelSport(e.target.value)}
                              disabled={!selectedSessionIsActive || sportsPending}
                              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                            >
                              <option value="">Select sport</option>
                              {sharedSports.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={handleAddStateLevelSport}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                              disabled={!selectedSessionIsActive || sportsPending}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Inter-University Level Sports */}
                        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 p-4 rounded-lg">
                          <h4 className="font-semibold text-teal-800 dark:text-teal-300 mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c2.28 0 4.27 1.279 5.332 3.171A6.002 6.002 0 0112 20a6.002 6.002 0 01-5.332-8.829C7.73 9.279 9.72 8 12 8z" />
                            </svg>
                            Inter-University Level Sports
                          </h4>
                          <div className="flex space-x-2">
                            <select
                              value={interUniversityLevelSport}
                              onChange={(e) => setInterUniversityLevelSport(e.target.value)}
                              disabled={!selectedSessionIsActive || sportsPending}
                              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                            >
                              <option value="">Select sport</option>
                              {sharedSports.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={handleAddInterUniversityLevelSport}
                              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                              disabled={!selectedSessionIsActive || sportsPending}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* International Level Sports */}
                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 rounded-lg">
                          <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            International Level Sports
                          </h4>
                          <div className="flex space-x-2">
                            <select
                              value={internationalLevelSport}
                              onChange={(e) => setInternationalLevelSport(e.target.value)}
                              disabled={!selectedSessionIsActive || sportsPending}
                              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                            >
                              <option value="">Select sport</option>
                              {sharedSports.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={handleAddInternationalLevelSport}
                              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                              disabled={!selectedSessionIsActive || sportsPending}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {formData.sports.length > 0 && (
                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                          <button
                            type="button"
                            onClick={handleSaveSports}
                            disabled={!selectedSessionIsActive || sportsPending || sportsSubmitting}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg"
                          >
                            {sportsSubmitting ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Save Sports
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleSubmitSports}
                            disabled={!selectedSessionIsActive || sportsPending || sportsSubmitting}
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg"
                          >
                            {sportsSubmitting ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Submitting...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Submit for Approval
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Sports History Section */}
            {activeSection === 'sports-history' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sports History</h2>
                </div>
                
                <div className="p-6">
                  {loadingHistory ? (
                    <div className="flex justify-center items-center py-8">
                      <svg className="animate-spin h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : history ? (
                    <div className="space-y-6">
                      {/* Sports History */}
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-5 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Sports History
                        </h4>
                        {history.sportsHistory?.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {history.sportsHistory.map((sport, i) => (
                              <div key={i} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                                <span className="text-gray-700 dark:text-gray-300">{sport}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 italic">No sports history found.</p>
                        )}
                      </div>

                      {/* Captain History */}
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-5 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                          <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          Captain History
                        </h4>
                        {history.captainRecords?.length > 0 ? (
                          <div className="space-y-4">
                            {history.captainRecords.map((c, i) => (
                              <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-medium text-gray-800 dark:text-gray-200">{c.sport}</span>
                                  <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-bold px-2 py-1 rounded-full">
                                    Captain
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  <p>Session: {c.session?.session}</p>
                                  <p>Team Members: {c.teamMembers?.length || 0}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 italic">No captain records found.</p>
                        )}
                      </div>

                      {/* Member History */}
                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-5 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                          <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          Team Member History
                        </h4>
                        {history.memberRecords?.length > 0 ? (
                          <div className="space-y-4">
                            {history.memberRecords.map((m, i) => (
                              <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-medium text-gray-800 dark:text-gray-200">
                                    {m.members.find(mem => mem.urn === history.student?.urn)?.sport || "N/A"}
                                  </span>
                                  <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-bold px-2 py-1 rounded-full">
                                    Member
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  <p>Session: {m.sessionId?.session}</p>
                                  <p>Captain ID: {m.captainId}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 italic">No member records found.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No History Found</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No sports history available for this session.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileForm;
                  