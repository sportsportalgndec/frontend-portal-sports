import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  Users, 
  Crown, 
  CheckCircle, 
  Activity, 
  Swimming, 
  Target, 
  Download, 
  Award, 
  BarChart3,
  RefreshCw,
  TrendingUp,
  Clock,
  AlertCircle,
  User,
  BarChart2
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

import API from "../services/api";

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(null);

  // New state for pending positions
  const [pendingPositions, setPendingPositions] = useState([]);
  const [pendingPositionsLoading, setPendingPositionsLoading] = useState(true);
  const [pendingPositionsError, setPendingPositionsError] = useState(null);
  
  // New state for pending approvals
  const [pendingTeams, setPendingTeams] = useState([]);
  const [pendingProfiles, setPendingProfiles] = useState([]);
  const [pendingApprovalsLoading, setPendingApprovalsLoading] = useState(true);
  const [pendingApprovalsError, setPendingApprovalsError] = useState(null);

  // Stats: session-wise and sport-level position counts
  const [positionStats, setPositionStats] = useState({ session: {}, levels: { international: {"1st":0,"2nd":0,"3rd":0}, national: {"1st":0,"2nd":0,"3rd":0}, state:{"1st":0,"2nd":0,"3rd":0}, ptu:{"1st":0,"2nd":0,"3rd":0} } });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

 // New states
const [sessions, setSessions] = useState([]);
const [selectedSession, setSelectedSession] = useState("");
const [students, setStudents] = useState([]);
const [studentsLoading, setStudentsLoading] = useState(true);





  useEffect(() => {
  const loadSessions = async () => {
    try {
      const res = await API.get("/admin/sessions");
      setSessions(res.data || []);
    } catch (err) {
      console.error("Failed to load sessions", err);
    }
  };
  loadSessions();
}, []);

useEffect(() => {
  const loadStudents = async () => {
    try {
      setStudentsLoading(true);
      const res = await API.get("/admin/students");
      setStudents(res.data || []);
    } catch (err) {
      console.error("Failed to fetch students", err);
    } finally {
      setStudentsLoading(false);
    }
  };
  loadStudents();
}, []);

// Filter + aggregate by selected session
const genderData = React.useMemo(() => {
  if (!selectedSession) return [];
  const filtered = students.filter(st => st.session?._id === selectedSession);

  let male = 0, female = 0;
  filtered.forEach(st => {
    if (st.gender?.toLowerCase() === "male") male++;
    if (st.gender?.toLowerCase() === "female") female++;
  });

  return [{ name: "Students", Male: male, Female: female }];
}, [students, selectedSession]);

  
  
  

  useEffect(() => {
    // Loader simulate (jab API lagoge toh yaha loading control karna)
    const timer = setTimeout(() => setLoading(false), 1500);
    
    // Fetch recent activities
    fetchRecentActivities();
    
    // Fetch pending positions
    fetchPendingPositions();
    
    // Fetch pending approvals
    fetchPendingApprovals();
    fetchPositionStats();
    
    return () => clearTimeout(timer);
  }, []);

  const fetchRecentActivities = async () => {
    try {
      setActivitiesLoading(true);
      setActivitiesError(null);
      console.log('Fetching recent activities...');
      const response = await API.get('/recent-activities?limit=20');
      console.log('Recent activities response:', response.data);
      if (response.data.success) {
        setRecentActivities(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      setActivitiesError('Failed to load recent activities');
    } finally {
      setActivitiesLoading(false);
    }
  };

  const classifyLevel = (sport) => {
    if (!sport) return 'ptu';
    const s = String(sport);
    if (/international/i.test(s)) return 'international';
    if (/national|inter\s*university/i.test(s)) return 'national';
    if (/state|inter\s*college|ptu|university/i.test(s)) return 'ptu';
  };

  const fetchPositionStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const res = await API.get('/admin/students');
      const students = res.data || [];
      const sessionMap = {};
      const levels = { international: {"1st":0,"2nd":0,"3rd":0}, national: {"1st":0,"2nd":0,"3rd":0},ptu:{"1st":0,"2nd":0,"3rd":0} };

      students.filter(st => st.status?.personal === "approved").forEach(st => {
        const sessionName = st.session?.session || 'Unknown';
        if (!sessionMap[sessionName]) sessionMap[sessionName] = {"1st":0,"2nd":0,"3rd":0, participated:0};
        (st.positions || []).forEach(pos => {
          const p = (pos?.position || '').toLowerCase();
          const norm = p.includes('1')? '1st' : p.includes('2')? '2nd' : p.includes('3')? '3rd' : p.includes('particip')? 'participated' : '';
          if (!norm) return;
          sessionMap[sessionName][norm] = (sessionMap[sessionName][norm] || 0) + 1;
          const lvl = classifyLevel(pos?.sport || '');
          if (norm !== 'participated' && levels[lvl] && levels[lvl][norm] !== undefined) {
            levels[lvl][norm] += 1;
          }
        });
      });

      setPositionStats({ session: sessionMap, levels });
    } catch (e) {
      setStatsError('Failed to load position stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchPendingPositions = async () => {
    try {
      setPendingPositionsLoading(true);
      setPendingPositionsError(null);
      
      // Fetch both students and captains
      const [studentsResponse, captainsResponse] = await Promise.all([
        API.get('/admin/students'),
        API.get('/admin/captains')
      ]);

      const students = studentsResponse.data || [];
      const captains = captainsResponse.data || [];

      // 🔹 Filter students with pending positions
      const pendingStudents = students.filter(st => st.status?.personal === "approved").filter(student => {
        // null/undefined/empty array => pending
        if (!student.positions || !Array.isArray(student.positions) || student.positions.length === 0) return true;
  
        // check if any pos = null/empty/pending
        return student.positions.some(pos =>
          !pos || !pos.position || pos.position === "pending" || pos.position === ""
        );
      });

      // 🔹 Filter captains with pending positions
      const pendingCaptains = captains.filter(captain => captain.teamStatus === "approved").filter(captain =>
        !captain.position || captain.position === "pending" || captain.position === ""
      );

      // 🔹 Merge and format the results
      const mergedPending = [
        ...pendingStudents.map(student => ({
          id: student._id,
          name: student.name,
          urn: student.urn,
          type: 'student',
          sport: (student.positions && Array.isArray(student.positions) && student.positions.length > 0)
            ? (student.positions.find(pos =>
                pos && (!pos.position || pos.position === "pending" || pos.position === "")
              )?.sport || 'N/A')
            : 'N/A',
          position: 'pending',
          branch: student.branch,
          year: student.year
        })),
        ...pendingCaptains.map(captain => ({
          id: captain._id,
          name: captain.name,
          urn: captain.urn,
          type: 'captain',
          sport: captain.sport || 'N/A',
          position: captain.position || 'pending',
          branch: captain.branch,
          year: captain.year
        }))
      ];

      setPendingPositions(mergedPending);
    } catch (error) {
      console.error('Error fetching pending positions:', error);
      setPendingPositionsError('Failed to load pending positions');
    } finally {
      setPendingPositionsLoading(false);
    }
  };
 
  const fetchPendingApprovals = async () => {
    try {
      setPendingApprovalsLoading(true);
      setPendingApprovalsError(null);
      
      // Fetch both pending teams and pending profiles
      const [teamsResponse, profilesResponse] = await Promise.all([
        API.get('/admin/pending-teams'),
        API.get('/admin/pending-profiles')
      ]);

      const teams = teamsResponse.data || [];
      const profiles = profilesResponse.data || [];

      setPendingTeams(teams);
      setPendingProfiles(profiles);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      setPendingApprovalsError('Failed to load pending approvals');
    } finally {
      setPendingApprovalsLoading(false);
    }
  };

  // Convert action enum to readable text and get icon
  const formatAction = (action) => {
    const actionMap = {
      'CREATE_STUDENT': { text: 'Created Student', icon: '👤' },
      'CREATE_CAPTAIN': { text: 'Created Captain', icon: '👑' },
      'ASSIGN_POSITION_STUDENT': { text: 'Assigned Position to Student', icon: '🎯' },
      'ASSIGN_POSITION_CAPTAIN_TEAM': { text: 'Assigned Team Position', icon: '🏆' },
      'APPROVE_CAPTAIN': { text: 'Approved Captain', icon: '✅' },
      'APPROVE_STUDENT': { text: 'Approved Student', icon: '✅' },
      'MARK_ATTENDANCE_GYM': { text: 'Marked Gym Attendance', icon: '💪' },
      'MARK_ATTENDANCE_SWIMMING': { text: 'Marked Swimming Attendance', icon: '🏊' },
      'EDIT_CAPTAIN': { text: 'Edited Captain', icon: '✏️' },
      'DELETE_CAPTAIN': { text: 'Deleted Captain', icon: '🗑️' },
      'EDIT_TEAM_MEMBER': { text: 'Edited Team Member', icon: '✏️' },
      'DELETE_TEAM_MEMBER': { text: 'Deleted Team Member', icon: '🗑️' },
      'EDIT_STUDENT': { text: 'Edited Student', icon: '✏️' },
      'DELETE_STUDENT': { text: 'Deleted Student', icon: '🗑️' },
      'SEND_CERTIFICATE': { text: 'Sent Certificate', icon: '🏅' },
      'SESSION_CREATED': { text: 'Created Session', icon: '📅' },
      'SESSION_DELETED': { text: 'Deleted Session', icon: '🗑️' },
      'SESSION_ACTIVATED': { text: 'Activated Session', icon: '🚀' },
      'OTHER': { text: 'Other Action', icon: '⚡' }
    };
    return actionMap[action] || { text: action, icon: '⚡' };
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

if (loading) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-orange-500 border-dashed rounded-full animate-spin"></div>
    </div>
  );
}


return (
  <div className="space-y-6 p-4 md:p-6">
    {/* Welcome Section */}
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      <h1 className="text-3xl font-bold text-foreground">Welcome Admin 👋</h1>
      <p className="text-muted-foreground mt-2">
        Manage your sports administration system
      </p>
    </motion.div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {/* Pending Positions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="h-full"
      >
        <Card className="hover:shadow-lg transition-shadow h-full flex flex-col min-h-[350px]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Pending Positions</span>
              </div>
              <Button
                onClick={fetchPendingPositions}
                disabled={pendingPositionsLoading}
                variant="ghost"
                size="icon"
                className="h-7 w-7"
              >
                <RefreshCw
                  className={`w-3 h-3 ${
                    pendingPositionsLoading ? "animate-spin" : ""
                  }`}
                />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-4 pt-0">
            {pendingPositionsLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-10 h-10 border-4 border-orange-500 border-dashed rounded-full animate-spin"></div>
              </div>
            ) : pendingPositionsError ? (
              <div className="text-center py-6 flex flex-col items-center justify-center h-48">
                <AlertCircle className="w-7 h-7 text-destructive mx-auto mb-2" />
                <p className="text-destructive text-sm mb-3">
                  {pendingPositionsError}
                </p>
                <Button onClick={fetchPendingPositions} variant="outline" size="sm">
                  Retry
                </Button>
              </div>
            ) : pendingPositions.length > 0 ? (
              <div className="space-y-3 h-full overflow-y-auto max-h-[280px] pr-2">
                {pendingPositions.map((item, index) => (
                  <motion.div
                    key={item.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {item.type === "student" ? (
                          <Users className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Crown className="w-3.5 h-3.5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {item.name}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1">
                          URN: {item.urn} • {item.branch}, {item.year}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Sport: {item.sport} • Position: {item.position}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 flex flex-col items-center justify-center h-48">
                <Target className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No pending positions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pending Approvals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="h-full"
      >
        <Card className="hover:shadow-lg transition-shadow h-full flex flex-col min-h-[350px]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Pending Approvals</span>
              </div>
              <Button
                onClick={fetchPendingApprovals}
                disabled={pendingApprovalsLoading}
                variant="ghost"
                size="icon"
                className="h-7 w-7"
              >
                <RefreshCw
                  className={`w-3 h-3 ${
                    pendingApprovalsLoading ? "animate-spin" : ""
                  }`}
                />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-4 pt-0">
            {pendingApprovalsLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-10 h-10 border-4 border-orange-500 border-dashed rounded-full animate-spin"></div>
              </div>
            ) : pendingApprovalsError ? (
              <div className="text-center py-6 flex flex-col items-center justify-center h-48">
                <AlertCircle className="w-7 h-7 text-destructive mx-auto mb-2" />
                <p className="text-destructive text-sm mb-3">{pendingApprovalsError}</p>
                <Button
                  onClick={fetchPendingApprovals}
                  variant="outline"
                  size="sm"
                >
                  Retry
                </Button>
              </div>
            ) : pendingTeams.length > 0 || pendingProfiles.length > 0 ? (
              <div className="space-y-3 h-full overflow-y-auto max-h-[280px] pr-2">
                {pendingTeams.map((team, index) => (
                  <motion.div
                    key={team._id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary"
                  >
                    <div className="flex items-start gap-2">
                      <Users className="w-3.5 h-3.5 text-primary mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          Captain: {team.members[0]?.name}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1">
                          Sport: {team.members[0]?.sport}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {pendingProfiles.map((profile, index) => (
                  <motion.div
                    key={profile._id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary"
                  >
                    <div className="flex items-start gap-2">
                      <User className="w-3.5 h-3.5 text-primary mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {profile.name}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1">
                          Branch: {profile.branch} • Year: {profile.year}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 flex flex-col items-center justify-center h-48">
                <CheckCircle className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No pending approvals</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Position Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="h-full"
      >
        <Card className="hover:shadow-lg transition-shadow h-full flex flex-col min-h-[350px]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Positions Overview</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchPositionStats} disabled={statsLoading}>
                <RefreshCw className={`w-3 h-3 ${statsLoading ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-4 pt-0">
            {statsLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-10 h-10 border-4 border-orange-500 border-dashed rounded-full animate-spin"></div>
              </div>
            ) : statsError ? (
              <div className="text-center py-6 flex flex-col items-center justify-center h-48">
                <AlertCircle className="w-7 h-7 text-destructive mx-auto mb-2" />
                <p className="text-destructive text-sm">{statsError}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 h-full overflow-y-auto max-h-[280px] pr-2">
                {/* Session-wise */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-2">Session-wise</h4>
                  <div className="space-y-2">
                    {Object.entries(positionStats.session).map(([sess, counts]) => (
                      <div key={sess} className="flex items-center justify-between bg-muted/50 p-2 rounded-md text-xs">
                        <span className="font-medium text-foreground truncate">{sess}</span>
                        <div className="text-muted-foreground flex items-center gap-2">
                          <span>1st: <span className="text-foreground font-semibold">{counts['1st']||0}</span></span>
                          <span>2nd: <span className="text-foreground font-semibold">{counts['2nd']||0}</span></span>
                          <span>3rd: <span className="text-foreground font-semibold">{counts['3rd']||0}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Sport level */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-2">By Level</h4>
                  <div className="space-y-2">
                    {['ptu','national','international'].map(level => (
                      <div key={level} className="flex items-center justify-between bg-muted/50 p-2 rounded-md text-xs">
                        <span className="font-medium capitalize text-foreground">{level}</span>
                        <div className="text-muted-foreground flex items-center gap-2">
                          <span>1st: <span className="text-foreground font-semibold">{positionStats.levels[level]?.['1st']||0}</span></span>
                          <span>2nd: <span className="text-foreground font-semibold">{positionStats.levels[level]?.['2nd']||0}</span></span>
                          <span>3rd: <span className="text-foreground font-semibold">{positionStats.levels[level]?.['3rd']||0}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="h-full"
      >
        <Card className="hover:shadow-lg transition-shadow h-full flex flex-col min-h-[350px]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Recent Activities</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-4 pt-0">
            {recentActivities.length > 0 ? (
              <ul className="space-y-3 h-full overflow-y-auto max-h-[280px] pr-2">
                {recentActivities.map((activity, index) => (
                  <motion.li
                    key={activity._id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 bg-muted/50 rounded-lg text-sm"
                  >
                    <p className="text-foreground">
                      <span className="font-medium">{activity.adminName}</span>{" "}
                      {activity.action}{" "}
                      <span className="font-medium">
                        {activity.targetModel}
                      </span>
                      {activity.description && (
                        <> – {activity.description}</>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center flex items-center justify-center h-48">
                No recent activities
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>

    {/* Performance Analytics */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="h-full"
    >
      <Card className="hover:shadow-lg transition-shadow h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Performance Analytics</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 max-w-xs">
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">-- Select Session --</option>
              {sessions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.session}
                </option>
              ))}
            </select>
          </div>

          {studentsLoading ? (
            <div className="flex items-center justify-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
              />
            </div>
          ) : !selectedSession ? (
            <p className="text-muted-foreground text-center flex items-center justify-center h-64">
              Please select a session
            </p>
          ) : genderData.length > 0 ? (
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genderData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Male" fill="#3b82f6" />
                  <Bar dataKey="Female" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center flex items-center justify-center h-64">
              No student data available for this session
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  </div>
);
}

export default AdminDashboard;
