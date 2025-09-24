// REFACTORED: CaptainDashboard UI + Dark/Light theme (Admin Dashboard style) — backend and API calls preserved
import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import API from '../services/api';
import { branches as sharedBranches, years as sharedYears } from '../lib/options';
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { motion } from 'framer-motion';
import { 
  User, 
  Users, 
  CheckCircle, 
  Award, 
  Download, 
  Crown,
  Phone,
  Mail,
  Calendar,
  Target,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  AlertCircle,
  RefreshCw
} from 'lucide-react';



function CaptainDashboard() {
  const { theme, toggleTheme, isDark } = useTheme();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [captainInfo, setCaptainInfo] = useState(null);
  const [teamInfo, setTeamInfo] = useState(null);
  const [step, setStep] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [history, setHistory] = useState(null);
  const [addingMember, setAddingMember] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const certRefs = useRef([]);
  
  // Navigation state
  const [activeSection, setActiveSection] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [captainName, setCaptainName] = useState('');

  const fetchSessions = async () => {
    try {
      const res = await API.get('/session');
      const data = res.data || [];
      setSessions(data);
      const active = data.find(s => s.isActive);
      if (active) {
        setSelectedSession(active._id);
        setActiveSession(active);
      }
    } catch {
      setErr('Failed to load sessions.');
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
const fetchCaptainInfo = async (sessionId) => {
  try {
    const res = await API.get(`/captain/profile?sessionId=${sessionId}`);
    const captainData = res.data?.data || null;

    // Set captain name for personalized greeting
    setCaptainName(captainData?.name || 'Captain');

    // yahan se direct captain ka URN nikalega
    if (captainData?.urn && selectedSession) {
      fetchCaptainHistory(captainData.urn,selectedSession);
    }

    return captainData;
  } catch {
    setErr('Failed to load captain info.');
    return null;
  }
};

const fetchCaptainHistory = async (urn,sessionId) => {
  try {
    setLoadingHistory(true);
    const res = await API.get(`/captain/history/${urn}/${sessionId}`);
    setHistory(res.data);
  } catch (err) {
    console.error("Error fetching captain history:", err);
  } finally {
    setLoadingHistory(false);
  }
};



  // 🔹 Call when component mounts
  const fetchTeamInfo = async (sessionId) => {
    try {
      const res = await API.get(`/captain/my-team?sessionId=${sessionId}`);
      return res.data || null;
    } catch {
      setErr('Failed to load team info.');
      return null;
    }
  };

  const decideStep = (captain, team) => {
    if (!captain?.phone) {
      setStep('profile');
    } else if (!team?.teamExists || (team.members?.length < captain.teamMemberCount)) {
      setStep('team');
    } else {
      setStep('done');
    }
  };

  useEffect(() => {
    (async () => {
      await fetchSessions();
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (selectedSession) {
        setLoading(true);
        const sessionObj = sessions.find(s => s._id === selectedSession);
        setActiveSession(sessionObj || null);
        const captain = await fetchCaptainInfo(selectedSession);
        const team = await fetchTeamInfo(selectedSession);
        setCaptainInfo(captain);
        setTeamInfo(team);
        decideStep(captain, team);
        setLoading(false);
      }
    })();
  }, [selectedSession, sessions]);

  const handleCaptainSubmit = async (e) => {
    e.preventDefault();
    if (!activeSession?.isActive) return;
    try {
      setErr('');
      setSavingProfile(true);
      await API.post('/captain/profile', {
        phone: e.target.phone.value,
        sessionId: selectedSession,
      });
      setActiveSection('team');
      const captain = await fetchCaptainInfo(selectedSession);
      setCaptainInfo(captain);
      decideStep(captain, teamInfo);
    } catch (err) {
      setErr(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!activeSession?.isActive) return;
    setErr('');
    try {
      setAddingMember(true);
      const form = e.target;
      const member = {
        name: form.name.value,
        branch: form.branch.value,
        urn: form.urn.value,
        // Use the selected year from the form
        year: Number(form.year.value),
        email: form.email.value,
        phone: form.phone.value,
        sport: captainInfo.sport,
      };

      await API.post('/captain/my-team/member', {
        sessionId: selectedSession,
        member: member
      });

      const updatedTeam = await fetchTeamInfo(selectedSession);
      setTeamInfo(updatedTeam);
      form.reset();

      if (updatedTeam.members.length >= captainInfo.teamMemberCount) {
        setActiveSection('approval');
        setStep('done');
      }
    } catch (err) {
      setErr(err.response?.data?.message || 'Failed to add team member.');
    } finally {
      setAddingMember(false);
    }
  };
const generateCertificatesPDF = async () => {
  if (!captainInfo || !teamInfo) return;

  const pdf = new jsPDF("landscape", "px", "a4");
  const allMembers = [captainInfo, ...teamInfo.members];

  for (let i = 0; i < allMembers.length; i++) {
    const stu = allMembers[i];
    const input = certRefs.current[i];
    if (!input) continue;

    // Decide template based on position
    const template =
      stu.position?.toLowerCase() === "participated"
        ? "Certificates2.png"
        : "Certificates.png";

    // Force background change before taking screenshot
    input.style.backgroundImage = `url('/${template}')`;
     await new Promise(resolve => setTimeout(resolve, 100));

    // Take screenshot
    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });
    const imgData = canvas.toDataURL("image/png");

    // PDF page size
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Image size
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Maintain aspect ratio
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const finalWidth = imgWidth * ratio;
    const finalHeight = imgHeight * ratio;

    // Center the image
    const x = (pdfWidth - finalWidth) / 2;
    const y = (pdfHeight - finalHeight) / 2;

    if (i !== 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);
  }

  pdf.save("Team_Certificates.pdf");
};


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-orange-500 border-dashed rounded-full animate-spin"></div>
      </div>
    );
  }

  const sessionExpired = activeSession && !activeSession.isActive;
  const teamComplete = (teamInfo?.members?.length || 0) >= (captainInfo?.teamMemberCount || Infinity);

  // Navigation items
  const navigationItems = [
    { id: 'profile', label: 'Complete Profile', icon: User, description: 'Complete your profile information' },
    { id: 'team', label: 'Team Members', icon: Users, description: 'Manage your team members' },
    { id: 'approval', label: 'Team Approval', icon: CheckCircle, description: 'Submit team for approval' },
    { id: 'status', label: 'Approval Status & Position Stats', icon: BarChart3, description: 'View approval status and statistics' },
    { id: 'certificate', label: 'Certificate', icon: Award, description: 'View and download certificates' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-700 to-indigo-800 dark:from-orange-700 dark:via-orange-800 dark:to-indigo-900 text-white shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-white hover:bg-white/10 transition-colors"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="ml-4 lg:ml-0">
                <h1 className="text-xl font-bold">Captain Dashboard</h1>
                <p className="text-orange-200 text-sm">Manage your team and track progress</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Session Selector */}
              <div className="hidden sm:block">
                <select
                  value={selectedSession}
                  onChange={e => setSelectedSession(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <option value="">-- Select Session --</option>
                  {sessions.map(s => (
                    <option key={s._id} value={s._id} className="text-gray-900">
                      {s.session} {s.isActive ? '(Active)' : '(Expired)'}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700 lg:hidden">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Navigation</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="mt-8 px-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeSection === item.id
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-r-2 border-orange-500'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Personalized Greeting */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Hello, {captainName} 👋
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Welcome to your captain dashboard
              </p>
            </motion.div>

            {/* Error Display */}
            {err && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 rounded-lg"
              >
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">{err}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Session Expired Warning */}
            {sessionExpired && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 rounded-lg"
              >
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                      This session has expired. You can only view your submitted data.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Content Sections */}
            <div className="space-y-6">

              {/* Complete Profile Section */}
              {activeSection === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-orange-50 to-indigo-50 dark:from-orange-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                      <User className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
                      Complete Your Profile
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Please complete your profile information to proceed
                    </p>
                  </div>
                  
                  {captainInfo && (
                    <form onSubmit={handleCaptainSubmit} className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                          <input 
                            value={captainInfo.name} 
                            disabled 
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none text-gray-700 dark:text-gray-300" 
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
                          <input 
                            value={captainInfo.branch} 
                            disabled 
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none text-gray-700 dark:text-gray-300" 
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URN</label>
                          <input 
                            value={captainInfo.urn} 
                            disabled 
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none text-gray-700 dark:text-gray-300" 
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year</label>
                          <input 
                            value={captainInfo.year} 
                            disabled 
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none text-gray-700 dark:text-gray-300" 
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sport</label>
                          <input 
                            value={captainInfo.sport} 
                            disabled 
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none text-gray-700 dark:text-gray-300" 
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Team Size</label>
                          <input 
                            value={captainInfo.teamMemberCount} 
                            disabled 
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none text-gray-700 dark:text-gray-300" 
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                          <input 
                            value={captainInfo.email} 
                            disabled 
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none text-gray-700 dark:text-gray-300" 
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Phone <span className="text-red-500 dark:text-red-400">*</span>
                          </label>
                          <input
                            name="phone"
                            placeholder="Enter your phone number"
                            defaultValue={captainInfo.phone || ''}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            disabled={sessionExpired || teamComplete}
                            required
                          />
                        </div>
                      </div>
                      
                      {captainInfo?.position && (
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <p className="text-orange-800 dark:text-orange-300 font-medium flex items-center">
                            <Award className="h-5 w-5 mr-2" />
                            Position: {captainInfo.position === 1 ? "🥇 1st" 
                              : captainInfo.position === 2 ? "🥈 2nd" 
                              : captainInfo.position === 3 ? "🥉 3rd" 
                              : captainInfo.position}
                          </p>
                        </div>
                      )}
                      
                      {!sessionExpired && !teamComplete && (
                        <div className="pt-4">
                          <button 
                            type="submit"
                            disabled={savingProfile}
                            className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-orange-600 to-indigo-600 hover:from-orange-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {savingProfile ? (
                              <>
                                <RefreshCw className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Save Profile
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </form>
                  )}
                </motion.div>
              )}

              {/* Team Members Section */}
              {activeSection === 'team' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-orange-50 to-indigo-50 dark:from-orange-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
                      Team Members
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {teamInfo?.members?.length || 0} of {captainInfo?.teamMemberCount || 0} members added
                    </p>
                  </div>
                  
                  <div className="p-6">
                    {teamInfo?.members?.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Added Members</h4>
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Branch</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">URN</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Year</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {teamInfo.members.map((m, i) => (
                                <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{i + 1}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{m.name}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{m.branch}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{m.urn}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{m.year}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{m.email}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{m.phone}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {!sessionExpired && teamInfo?.members?.length < captainInfo?.teamMemberCount && (
                      <div className="border border-dashed border-orange-300 dark:border-orange-600 rounded-xl p-5 bg-orange-50 dark:bg-orange-900/20">
                        <form onSubmit={handleAddMember} className="space-y-4">
                          <h4 className="font-medium text-gray-700 dark:text-gray-300">
                            Add Member {teamInfo?.members?.length + 1 || 1} of {captainInfo?.teamMemberCount || 0}
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                              <input name="name" placeholder="Enter full name" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
                              <select name="branch" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required>
                                <option value="">Select Branch</option>
                                {sharedBranches.map(b => (
                                  <option key={b} value={b}>{b}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URN</label>
                              <input name="urn" placeholder="Enter URN" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year</label>
                              <select name="year" defaultValue={captainInfo?.year} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required>
                                <option value="">Select Year</option>
                                {sharedYears.map(y => (
                                  <option key={y} value={y}>{`D${y}`}</option>
                                ))}
                              </select>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Auto-filled to captain's year (D{captainInfo?.year}) - you can change if different</p>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                              <input name="email" placeholder="Enter email" type="email" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                              <input name="phone" placeholder="Enter phone" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
                            </div>
                          </div>
                          
                          <div className="pt-2">
                            <button 
                              type="submit"
                              disabled={addingMember}
                              className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-orange-600 to-indigo-600 hover:from-orange-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {addingMember ? (
                                <>
                                  <RefreshCw className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <Users className="h-5 w-5 mr-2" />
                                  Add Member
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Team Approval Section */}
              {activeSection === 'approval' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-orange-50 to-indigo-50 dark:from-orange-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
                      Team Approval
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Submit your team for approval once all members are added
                    </p>
                  </div>
                  
                  <div className="p-6">
                    {teamInfo?.members?.length >= captainInfo?.teamMemberCount ? (
                      <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 text-green-500 dark:text-green-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Team Complete!
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          All {captainInfo?.teamMemberCount} team members have been added.
                        </p>
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <p className="text-green-800 dark:text-green-300 font-medium">
                              {/* Determine status */}
        {(() => {
          const status = teamInfo?.status?.toLowerCase() || 'pending';
          const statusColor =
            status === 'approved'
              ? 'text-green-800 dark:text-green-300'
              : 'text-orange-800 dark:text-orange-300';
          const statusText =
            status === 'approved' ? '✅ Team is approved' : '✅ Team is gone for approval';
          return (
            <p className={`${statusColor} font-medium`}>
              {statusText}
            </p>
          );
        })()}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-16 h-16 text-orange-500 dark:text-orange-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Team Incomplete
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          You need to add {captainInfo?.teamMemberCount - (teamInfo?.members?.length || 0)} more members before submitting for approval.
                        </p>
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                          <p className="text-orange-800 dark:text-orange-300 font-medium">
                            ⚠️ Complete your team first
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Approval Status & Position Stats Section */}
              {activeSection === 'status' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-orange-50 to-indigo-50 dark:from-orange-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
                      Approval Status & Position Stats
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      View your team's approval status and position statistics
                    </p>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-xl border border-orange-200 dark:border-orange-800">
                        <h4 className="font-medium text-orange-800 dark:text-orange-300 mb-3 flex items-center">
                          <Target className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
                          Sport Information
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Sport:</span> {captainInfo?.sport || 'N/A'}
                        </p>
                        {captainInfo?.position && (
                          <p className="mt-2 font-bold text-orange-700 dark:text-orange-400 flex items-center">
                            <Award className="h-5 w-5 mr-2" />
                            Final Position: {captainInfo.position === 1 ? "🥇 1st" 
                              : captainInfo.position === 2 ? "🥈 2nd" 
                              : captainInfo.position === 3 ? "🥉 3rd" 
                              : captainInfo.position}
                          </p>
                        )}
                      </div>
                      
                      <div className={`p-5 rounded-xl border ${
                        teamInfo?.status === 'approved' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                        teamInfo?.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                        'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      }`}>
                        <h4 className={`font-medium mb-3 flex items-center ${
                          teamInfo?.status === 'approved' ? 'text-green-800 dark:text-green-300' :
                          teamInfo?.status === 'rejected' ? 'text-red-800 dark:text-red-300' :
                          'text-yellow-800 dark:text-yellow-300'
                        }`}>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Submission Status
                        </h4>
                        <p className={
                          teamInfo?.status === 'approved' ? 'text-green-700 dark:text-green-300 font-bold text-lg' :
                          teamInfo?.status === 'rejected' ? 'text-red-700 dark:text-red-300 font-bold text-lg' :
                          'text-yellow-700 dark:text-yellow-300 font-bold text-lg'
                        }>
                          {teamInfo?.status ? teamInfo.status.toUpperCase() : 'PENDING'}
                        </p>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {teamInfo?.status === 'approved'
                            ? 'Your team has been approved. Congratulations!'
                            : teamInfo?.status === 'rejected'
                              ? 'Your team was rejected. Please contact admin.'
                              : 'All team members added. Waiting for approval.'}
                        </p>
                      </div>
                    </div>

                    {/* Team Members Table */}
                    {teamInfo?.members?.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Team Members</h4>
                        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Branch</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">URN</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Year</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Position</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {teamInfo.members.map((m, i) => (
                                <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{i + 1}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{m.name}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{m.branch}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{m.urn}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{m.year}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{m.email}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{m.phone}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">
                                    {m.position === 1 ? "🥇 1st" 
                                      : m.position === 2 ? "🥈 2nd" 
                                      : m.position === 3 ? "🥉 3rd" 
                                      : m.position || 'pending'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Captain History */}
                    {history && (
                      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                          <Calendar className="h-6 w-6 mr-2 text-orange-600 dark:text-orange-400" />
                          Captain History
                        </h3>
                        
                        {loadingHistory && (
                          <div className="flex justify-center items-center py-8">
                            <RefreshCw className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></RefreshCw>
                          </div>
                        )}
                        
                        {history && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Sports History */}
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
                              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                <Target className="h-5 w-5 mr-2 text-yellow-500 dark:text-yellow-400" />
                                Sports History
                              </h4>
                              {history.sportsHistory?.length > 0 ? (
                                <ul className="space-y-2">
                                  {history.sportsHistory.map((s, i) => (
                                    <li key={i} className="flex items-start">
                                      <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                                      <span className='text-gray-700 dark:text-gray-300'>{s}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-gray-500 dark:text-gray-400 italic">No sports history found.</p>
                              )}
                            </div>

                            {/* Captain Records */}
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
                              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                <Crown className="h-5 w-5 mr-2 text-orange-500 dark:text-orange-400" />
                                Captain Records
                              </h4>
                              {history.captainRecords?.length > 0 ? (
                                <div className="space-y-3">
                                  {history.captainRecords.map((c, i) => (
                                    <div key={i} className="border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                                      <p className="font-medium text-gray-700 dark:text-gray-300">{c.sport}</p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">Session: {c.session?.session}</p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">Team Size: {c.teamMemberCount || 0}</p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">Position: {c.position || "pending"}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 dark:text-gray-400 italic">No captain records found.</p>
                              )}
                            </div>

                            {/* Member Records */}
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
                              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                <Users className="h-5 w-5 mr-2 text-green-500 dark:text-green-400" />
                                Team Records
                              </h4>
                              {history.memberRecords?.length > 0 ? (
                                <div className="space-y-3">
                                  {history.memberRecords.map((m, i) => (
                                    <div key={i} className="border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                                      <p className="font-medium text-gray-700 dark:text-gray-300">Session: {m.sessionId?.session}</p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">Members: {m.members?.length || 0}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 dark:text-gray-400 italic">No member records found.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Certificate Section */}
              {activeSection === 'certificate' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-orange-50 to-indigo-50 dark:from-orange-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                      <Award className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
                      Certificate
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      View and download certificates for your team
                    </p>
                  </div>
                  
                  <div className="p-6">
                    {captainInfo?.certificateAvailable ? (
                      <div className="text-center py-8">
                        <Award className="w-16 h-16 text-orange-500 dark:text-orange-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Certificates Available!
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Your team certificates are ready for download.
                        </p>
                        <button
                          onClick={generateCertificatesPDF}
                          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
                        >
                          <Download className="h-5 w-5 mr-2" />
                          Download Certificates (Captain + Team)
                        </button>
                        
                        {/* Hidden Certificates Preview */}
                        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                          {[captainInfo, ...(teamInfo?.members || [])].map((stu, i) => {
                            const captainPosition = captainInfo?.position?.toLowerCase();
                            const template = captainPosition === "participated" ? "Certificates2.png" : "Certificates.png";
                            
                            const styles = template === "Certificates2.png"
                              ? {
                                name: { top: "330px", left: "0", fontSize: "32px", textAlign: "center",fontWeight: "bold" , color:"black",width:"100%" },
                                urn: { top: "398px", left: "600px", fontSize: "24px",color:"black" },
                                branch: { top: "396px", left: "240px", fontSize: "24px",color:"black" },
                                sport: { top: "448px", left: "320px", fontSize: "20px",color:"black" },
                                session: { top: "450px", left: "591px", fontSize: "20px",color:"black" },
                              }
                              : {
                                name: { top: "330px", left: "0px", textAlign: "center",width:"1000px", fontSize: "32px", fontWeight: "bold" , color:"black"},
                                urn: { top: "398px", left: "640px", fontSize: "24px" , color:"black"},
                                branch: { top: "395px", left: "225px", fontSize: "24px" , color:"black"},
                                sport: { top: "455px", left: "435px", fontSize: "20px" , color:"black"},
                                session: { top: "455px", left: "710px", fontSize: "20px" , color:"black"},
                                position: { top: "455px", right: "750px", fontSize: "20px", color:"black" },
                              };

                            return (
                              <div
                                key={i}
                                ref={(el) => (certRefs.current[i] = el)}
                                style={{
                                  width: "1000px",
                                  height: "700px",
                                  backgroundImage: `url('/${template}')`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  position: "relative",
                                  marginBottom: "20px",
                                }}
                              >
                                <div style={{ position: "absolute", ...styles.name }}>{stu.name}</div>
                                <div style={{ position: "absolute", ...styles.urn }}>{stu.urn}</div>
                                <div style={{ position: "absolute", ...styles.branch }}>{stu.branch}</div>
                                <div style={{ position: "absolute", ...styles.sport }}>{stu.sport}</div>
                                <div style={{ position: "absolute", ...styles.session }}>{activeSession?.session}</div>
                                <div style={{ position: "absolute", ...styles.position }}>{captainInfo?.position}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Certificates Not Available
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Certificates will be available after you get a position.
                        </p>
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                          <p className="text-gray-600 dark:text-gray-400 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
                            Certificates will be available after you got position
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaptainDashboard;
