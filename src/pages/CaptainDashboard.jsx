// REFACTORED: CaptainDashboard UI + Dark/Light theme (Admin Dashboard style) — backend and API calls preserved
import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import API from '../services/api';
import { branches as sharedBranches, years as sharedYears } from '../lib/options';
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { color } from 'framer-motion';



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


  if (loading) {return (    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-orange-500 border-dashed rounded-full animate-spin"></div>
    </div>);}

  const sessionExpired = activeSession && !activeSession.isActive;

return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8">
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-700 to-indigo-800 dark:from-orange-700 dark:via-orange-800 dark:to-indigo-900 text-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-100 to-indigo-100 bg-clip-text text-transparent">
              Captain Dashboard
            </h1>
            <p className="text-orange-200 dark:text-orange-300 mt-1 text-sm md:text-base">Manage your team and track progress</p>
          </div>
          
          <div className="flex items-center space-x-4 self-end">
            <div className="hidden md:block h-10 w-px bg-white/30"></div>
            <button
              onClick={toggleTheme}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center border border-white/20 hover:border-white/30 shadow-lg hover:shadow-xl hover:scale-105"
              title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              {isDark ? 'Light' : 'Dark'}
            </button>
            <button
              onClick={handleLogout} /* PRESERVE: existing logout handler */
              disabled={isLoggingOut}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center border border-white/20 hover:border-white/30 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {err && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">{err}</p>
              </div>
            </div>
          </div>
        )}

        {/* Session Select */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Session</label>
          <div className="relative">
            <select
              value={selectedSession}
              onChange={e => setSelectedSession(e.target.value)} /* PRESERVE: existing session change handler */
              className="block w-full pl-4 pr-10 py-3 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-400 sm:text-sm rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none transition-all shadow-sm"
            >
              <option value="">-- Select Session --</option>
              {sessions.map(s => (
                <option key={s._id} value={s._id}>
                  {s.session} {s.isActive ? '(Active)' : '(Expired)'}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700 dark:text-gray-300">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {sessionExpired && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-500 dark:text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">This session has expired. You can only view your submitted data.</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-8">
          <nav className="flex items-center justify-center">
            <ol className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
              <li className={`flex items-center ${step === 'profile' ? 'text-orange-700 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                <span className={`flex items-center justify-center w-8 h-8 border-2 rounded-full ${step === 'profile' ? 'border-orange-700 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-bold' : 'border-gray-300 dark:border-gray-600'}`}>
                  1
                </span>
                <span className="ml-2 text-sm font-medium hidden sm:block">Profile</span>
              </li>
              
              <li className="flex items-center">
                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </li>
              
              <li className={`flex items-center ${step === 'team' ? 'text-orange-700 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                <span className={`flex items-center justify-center w-8 h-8 border-2 rounded-full ${step === 'team' ? 'border-orange-700 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-bold' : 'border-gray-300 dark:border-gray-600'}`}>
                  2
                </span>
                <span className="ml-2 text-sm font-medium hidden sm:block">Team</span>
              </li>
              
              <li className="flex items-center">
                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </li>
              
              <li className={`flex items-center ${step === 'done' ? 'text-orange-700 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                <span className={`flex items-center justify-center w-8 h-8 border-2 rounded-full ${step === 'done' ? 'border-orange-700 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-bold' : 'border-gray-300 dark:border-gray-600'}`}>
                  3
                </span>
                <span className="ml-2 text-sm font-medium hidden sm:block">Review</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Captain Profile */}
        {step === 'profile' && captainInfo && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-indigo-50 dark:from-orange-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Complete Your Profile</h3>
            </div>
            
            <form onSubmit={handleCaptainSubmit} className="p-6 space-y-6"> {/* PRESERVE: existing form submit handler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                  <input value={captainInfo.name} disabled className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none text-gray-700 dark:text-gray-300" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
                  <input value={captainInfo.branch} disabled className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none text-gray-700 dark:text-gray-300" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URN</label>
                  <input value={captainInfo.urn} disabled className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none text-gray-700 dark:text-gray-300" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year</label>
                  <input value={captainInfo.year} disabled className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none text-gray-700 dark:text-gray-300" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sport</label>
                  <input value={captainInfo.sport} disabled className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none text-gray-700 dark:text-gray-300" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Team Size</label>
                  <input value={captainInfo.teamMemberCount} disabled className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none text-gray-700 dark:text-gray-300" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input value={captainInfo.email} disabled className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none text-gray-700 dark:text-gray-300" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone <span className="text-red-500 dark:text-red-400">*</span></label>
                  <input
                    name="phone"
                    placeholder="Enter your phone number"
                    defaultValue={captainInfo.phone || ''}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    disabled={sessionExpired}
                    required
                  />
                </div>
              </div>
              
              {captainInfo?.position && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="text-orange-800 dark:text-orange-300 font-medium flex items-center">
                    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Position: {captainInfo.position === 1 ? "🥇 1st" 
                      : captainInfo.position === 2 ? "🥈 2nd" 
                      : captainInfo.position === 3 ? "🥉 3rd" 
                      : captainInfo.position}
                  </p>
                </div>
              )}
              
              {!sessionExpired && (
                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={savingProfile} /* PRESERVE: existing save profile handler */
                    className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-orange-600 to-indigo-600 hover:from-orange-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    aria-busy={savingProfile}
                  >
                    {savingProfile ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Save Profile
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Add Team Members */}
        {step === 'team' && captainInfo && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-indigo-50 dark:from-orange-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Team Members</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {teamInfo.members.length} of {captainInfo.teamMemberCount} members added
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

              {!sessionExpired && teamInfo.members.length < captainInfo.teamMemberCount && (
                <div className="border border-dashed border-orange-300 dark:border-orange-600 rounded-xl p-5 bg-orange-50 dark:bg-orange-900/20">
                  <form onSubmit={handleAddMember} className="space-y-4"> {/* PRESERVE: existing add member handler */}
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">
                      Add Member {teamInfo.members.length + 1} of {captainInfo.teamMemberCount}
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
                        disabled={addingMember} /* PRESERVE: existing add member handler */
                        className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-orange-600 to-indigo-600 hover:from-orange-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                        aria-busy={addingMember}
                      >
                        {addingMember ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding...
                          </>
                        ) : (
                          <>
                            <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Member
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Done Page */}
        {step === 'done' && teamInfo && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-indigo-50 dark:from-orange-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Team Submission Complete</h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-xl border border-orange-200 dark:border-orange-800">
                  <h4 className="font-medium text-orange-800 dark:text-orange-300 mb-3 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Sport Information
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Sport:</span> {captainInfo.sport}</p>
                  <p className="mt-2 font-bold text-orange-700 dark:text-orange-400 flex items-center">
                    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Final Position: {captainInfo.position === 1 ? "🥇 1st" 
                      : captainInfo.position === 2 ? "🥈 2nd" 
                      : captainInfo.position === 3 ? "🥉 3rd" 
                      : captainInfo.position}
                  </p>
                </div>
                
                <div className={`p-5 rounded-xl border ${
                  teamInfo.status === 'approved' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                  teamInfo.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                  'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                }`}>
                  <h4 className={`font-medium mb-3 flex items-center ${
                    teamInfo.status === 'approved' ? 'text-green-800 dark:text-green-300' :
                    teamInfo.status === 'rejected' ? 'text-red-800 dark:text-red-300' :
                    'text-yellow-800 dark:text-yellow-300'
                  }`}>
                    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Submission Status
                  </h4>
                  <p className={
                    teamInfo.status === 'approved' ? 'text-green-700 dark:text-green-300 font-bold text-lg' :
                    teamInfo.status === 'rejected' ? 'text-red-700 dark:text-red-300 font-bold text-lg' :
                    'text-yellow-700 dark:text-yellow-300 font-bold text-lg'
                  }>
                    {teamInfo.status ? teamInfo.status.toUpperCase() : 'PENDING'}
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {teamInfo.status === 'approved'
                      ? 'Your team has been approved. Congratulations!'
                      : teamInfo.status === 'rejected'
                        ? 'Your team was rejected. Please contact admin.'
                        : 'All team members added. Waiting for approval.'}
                  </p>
                </div>
              </div>

              {/* Members Table */}
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
                              : m.position }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {sessionExpired && (
                <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-500 dark:text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">This session has expired. No further changes can be made.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Certificates */}
              {captainInfo.certificateAvailable ? (
                <div className="mb-6">
                  <button
                    onClick={generateCertificatesPDF} /* PRESERVE: existing certificates generation handler */
                    className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
                  >
                    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download Certificates (Captain + Team)
                  </button>
                  
                  {/* Hidden Certificates Preview */}
                  <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                    {[captainInfo, ...teamInfo.members].map((stu, i) => {
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
                <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-600 dark:text-gray-400 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Certificates will be available after you got position
                  </p>
                </div>
              )}

              {/* History Section */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <svg className="h-6 w-6 mr-2 text-orange-600 dark:text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Captain History
                </h3>
                
                {loadingHistory && (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  </div>
                )}
                
                {history && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Sports History */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-yellow-500 dark:text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Sports History
                      </h4>
                      {history.sportsHistory?.length > 0 ? (
                        <ul className="space-y-2">
                          {history.sportsHistory.map((s, i) => (
                            <li key={i} className="flex items-start">
                              <svg className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
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
                        <svg className="h-5 w-5 mr-2 text-orange-500 dark:text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Captain Records
                      </h4>
                      {history.captainRecords?.length > 0 ? (
                        <div className="space-y-3">
                          {history.captainRecords.map((c, i) => (
                            <div key={i} className="border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                              <p className="font-medium text-gray-700 dark:text-gray-300">{c.sport}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Session: {c.session?.session}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Team Size: {c.teamMemberCount || 0}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Position: {c.position || "N/A"}</p>
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
                        <svg className="h-5 w-5 mr-2 text-green-500 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
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
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
}

export default CaptainDashboard;
