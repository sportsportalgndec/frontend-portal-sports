import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import {
  Target,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Trophy,
  User,
  GraduationCap,
  Search,
  Filter,
  CheckSquare,
  Square,
  Calendar,
} from "lucide-react";
import API from "../services/api";

const positionsList = ["1st", "2nd", "3rd", "Participated"];

const AdminAssignPosition = () => {
  const [students, setStudents] = useState([]);
  const [positionData, setPositionData] = useState({});
  const [sportFilter, setSportFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [bulkPosition, setBulkPosition] = useState("");
  const [bulkSport, setBulkSport] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");

  const fetchSessions = async () => {
    try {
      const res = await API.get("/session", { withCredentials: true });
      const sessionData = res.data || [];
      setSessions(sessionData);
      
      // Set default session to active session
      const activeSession = sessionData.find(s => s.isActive);
      if (activeSession) {
        setSelectedSession(activeSession._id);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  // ✅ Fetch only pending students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);
  
        const res = await API.get("/admin/students");
  
        const filteredStudents = res.data
          .map((student) => {
            // ✅ Approved sportsDetails
            const approvedSports = (student.sportsDetails || []).filter(
              (sport) => sport.status === "approved"
            );
  
            // ✅ Pending positions
            const pendingPositions = (student.positions || []).filter(
              (pos) => pos.position === "pending"
            );
  
            // ✅ Sirf wahi students rakho jinke dono me data ho
            if (approvedSports.length > 0 && pendingPositions.length > 0) {
              return {
                ...student,
                sportsDetails: approvedSports,
                positions: pendingPositions,
              };
            }
            return null;
          })
          .filter(Boolean);
  
        setStudents(filteredStudents);
      } catch (err) {
        console.error("Error fetching students", err);
        setError("Failed to fetch students");
      } finally {
        setLoading(false);
      }
    };
  
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, []);
  
  

  const handlePositionChange = (studentId, sportName, value) => {
    setPositionData((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [sportName]: value,
      },
    }));
  };

  const handleAssign = async (studentId, sportName) => {
    const position = positionData[studentId]?.[sportName];
    if (!position) {
      alert("⚠ Please select a position first!");
      return;
    }

    try {
      await API.put(`/admin/students/${studentId}/assign-sport-position`, {
        sportName,
        position,
      });
      setMessage(`✅ ${sportName} position assigned successfully!`);

      // Reset select
      setPositionData((prev) => ({
        ...prev,
        [studentId]: { ...prev[studentId], [sportName]: "" },
      }));

      // Update students list (remove pending if assigned)
      setStudents((prev) =>
        prev
          .map((student) => {
            if (student._id === studentId) {
              const newPositions = student.positions.filter(
                (p) => p.sport !== sportName
              );
              return { ...student, positions: newPositions };
            }
            return student;
          })
          .filter((student) => student.positions.length > 0)
      );
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to assign position");
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkPosition || !bulkSport || selectedStudents.size === 0) {
      setMessage("⚠ Please select students, sport, and position");
      return;
    }

    try {
      const assignments = [];
      for (const studentId of selectedStudents) {
        const student = students.find((s) => s._id === studentId);
        if (student) {
          const isPending = student.positions?.some(
            (p) => p.sport === bulkSport && p.position === "pending"
          );
          if (isPending) {
            assignments.push(
              API.put(`/admin/students/${studentId}/assign-sport-position`, {
                sportName: bulkSport,
                position: bulkPosition,
              })
            );
          }
        }
      }

      await Promise.all(assignments);
      setMessage(
        `✅ Position ${bulkPosition} for ${bulkSport} assigned to ${assignments.length} students!`
      );

      // Update students locally
      setStudents((prev) =>
        prev
          .map((student) => {
            if (
              selectedStudents.has(student._id) &&
              student.positions.some(
                (p) => p.sport === bulkSport && p.position === "pending"
              )
            ) {
              const newPositions = student.positions.filter(
                (p) => p.sport !== bulkSport
              );
              return { ...student, positions: newPositions };
            }
            return student;
          })
          .filter((student) => student.positions.length > 0)
      );

      setSelectedStudents(new Set());
      setBulkPosition("");
      setBulkSport("");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to assign positions to some students");
    }
  };

  const toggleStudentSelection = (studentId) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) newSelection.delete(studentId);
    else newSelection.add(studentId);
    setSelectedStudents(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s._id)));
    }
  };

  const filteredStudents = students.filter((student) => {
    // Session filter
    const sessionMatch = !selectedSession || student.session?._id === selectedSession;
    
    const matchesSport = sportFilter
      ? student.positions.some((p) =>
          p.sport.toLowerCase().includes(sportFilter.toLowerCase())
        )
      : true;
  
    const matchesName = nameFilter
      ? student.name?.toLowerCase().includes(nameFilter.toLowerCase())
      : true;
  
    const matchesBulkSport = bulkSport
      ? student.positions.some(p => p.sport === bulkSport && p.position === "pending")
      : true;
  
    return sessionMatch && matchesSport && matchesName && matchesBulkSport;
  });
  

  // ✅ Real-time available pending sports
  const availablePendingSports = [
    ...new Set(
      students.flatMap((student) =>
        (student.positions || [])
          .filter((pos) => pos.position === "pending")
          .map((pos) => pos.sport)
      )
    ),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Assign Sport Positions
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage pending position assignments for students
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.includes("✅")
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
        >
          {message.includes("✅") ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{message}</span>
        </motion.div>
      )}

      {/* Session Selector */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Filter by Session</h3>
            </div>
            <Select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full"
            >
              <option value="">All Sessions</option>
              {sessions.map((session) => (
                <option key={session._id} value={session._id}>
                  {session.session} {session.isActive ? "(Active)" : ""}
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters and Bulk */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-4">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter by Sport
            </label>
            <Input
              type="text"
              placeholder="e.g. Basketball, Football..."
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Search className="w-4 h-4" /> Filter by Name
            </label>
            <Input
              type="text"
              placeholder="Search student name..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" /> Bulk Assign Position
            </label>
            <div className="space-y-2">
              <Select
                value={bulkSport}
                onChange={(e) => setBulkSport(e.target.value)}
              >
                <option value="">Select Sport</option>
                {availablePendingSports.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <Select
                value={bulkPosition}
                onChange={(e) => setBulkPosition(e.target.value)}
              >
                <option value="">Select Position</option>
                {positionsList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
              <Button
                onClick={handleBulkAssign}
                disabled={
                  !bulkPosition || !bulkSport || selectedStudents.size === 0
                }
                className="w-full"
              >
                Assign to Selected
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {selectedStudents.size === filteredStudents.length ? (
                  <CheckSquare className="w-5 h-5 text-primary" />
                ) : (
                  <Square className="w-5 h-5 text-muted-foreground" />
                )}
                <span className="font-semibold text-foreground">
                  {selectedStudents.size} selected
                </span>
              </div>
              <Button
                onClick={toggleSelectAll}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {selectedStudents.size === filteredStudents.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Student Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Pending Students
              </h3>
              <p className="text-muted-foreground">
                All position assignments are complete!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student, index) => {
              const pendingSports = (student.positions || [])
                .filter((p) => p.position === "pending")
                .map((p) => p.sport);

              return (
                <motion.div
                  key={student._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border rounded-lg overflow-hidden ${
                    pendingSports.length === 0
                      ? "border-green-200"
                      : "border-yellow-200"
                  } ${
                    selectedStudents.has(student._id) ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <Card className="h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student._id)}
                            onChange={() => toggleStudentSelection(student._id)}
                            className="h-5 w-5 text-primary rounded"
                          />
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border">
                            <img
                              src={
                                student.photo ||
                                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                              }
                              alt={student.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            pendingSports.length === 0
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          }`}
                        >
                          {pendingSports.length === 0
                            ? "All Assigned"
                            : `${pendingSports.length} Pending`}
                        </span>
                      </div>

                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {student.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <GraduationCap className="w-4 h-4" />
                          <span>URN: {student.urn || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span>
                            {student.branch || "-"} • Year {student.year || "-"}
                          </span>
                        </div>
                      </div>

                      {pendingSports.length > 0 ? (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-foreground">
                            Pending Assignments:
                          </h4>
                          {pendingSports.map((sport, idx) => {
                            const currentSelection =
                              positionData[student._id]?.[sport] || "";

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between bg-muted p-3 rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <Trophy className="w-4 h-4 text-primary" />
                                  <span className="font-medium text-foreground">
                                    {sport}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={currentSelection}
                                    onChange={(e) =>
                                      handlePositionChange(
                                        student._id,
                                        sport,
                                        e.target.value
                                      )
                                    }
                                    className="w-28"
                                  >
                                    <option value="">Position</option>
                                    {positionsList.map((p) => (
                                      <option key={p} value={p}>
                                        {p}
                                      </option>
                                    ))}
                                  </Select>
                                  <Button
                                    onClick={() =>
                                      handleAssign(student._id, sport)
                                    }
                                    size="sm"
                                    disabled={!currentSelection}
                                  >
                                    Assign
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                          <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                            All positions assigned ✓
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminAssignPosition;
