import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  CheckCircle, 
  XCircle, 
  Users, 
  UserCheck, 
  AlertCircle,
  RefreshCw,
  Clock,
  Trophy,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap
} from "lucide-react";
import API from "../services/api";

const AdminApprovalDashboard = () => {
  const [pendingTeams, setPendingTeams] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [captains, setCaptains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔹 Fetch all pending data at once
  const fetchAllData = async () => {
    try {
      setError("");
      setLoading(true);

      const [teamsRes, studentsRes, captainsRes] = await Promise.all([
        API.get("/admin/pending-teams", { withCredentials: true }),
        API.get("/admin/pending-profiles", { withCredentials: true }),
        API.get("/api/admin/captains", { withCredentials: true }),
      ]);

      setPendingTeams(teamsRes.data || []);
      setPendingStudents(studentsRes.data || []);
      setCaptains(captainsRes.data || []);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load pending approvals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ✅ Update student status
  const updateStudentStatus = async (studentId, type, status) => {
    try {
      if (status === "approved") {
        await API.put(
          `/admin/student/${studentId}/approve?type=${type}`,
          {},
          { withCredentials: true }
        );
      } else {
        await API.delete(
          `/admin/student/${studentId}/reject?type=${type}`,
          { withCredentials: true }
        );
      }

      setPendingStudents((prev) =>
        prev.filter(
          (s) =>
            !(
              s._id === studentId &&
              ((type === "personal" && s.pendingPersonal) ||
                (type === "sports" && s.pendingSports))
            )
        )
      );
      alert(`✅ Student ${type} ${status} successfully!`);
    } catch (err) {
      console.error(`Error updating student ${type}`, err);
      alert(`❌ Failed to ${status} student ${type}.`);
    }
  };

  // ✅ Update team status
  const updateTeamStatus = async (teamId, status) => {
    try {
      await API.put(
        `/admin/team/${teamId}/status`,
        { status },
        { withCredentials: true }
      );
      setPendingTeams((prev) => prev.filter((team) => team._id !== teamId));
      alert(`✅ Team ${status} successfully!`);
    } catch (err) {
      console.error("Error updating team status", err);
      alert(`❌ Failed to ${status} team.`);
    }
  };

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
          <h1 className="text-3xl font-bold text-foreground">Pending Approvals</h1>
          <p className="text-muted-foreground mt-1">Review and approve student profiles and teams</p>
        </div>
        <Button onClick={fetchAllData} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2"
        >
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </motion.div>
      )}

      {/* Pending Students */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Pending Student Profiles ({pendingStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingStudents.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Pending Profiles</h3>
                <p className="text-muted-foreground">All student profiles have been reviewed</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingStudents.map((student, index) => (
                  <motion.div
                    key={student._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-border rounded-lg p-6 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex gap-6">
                      {/* Photos */}
                      <div className="flex-shrink-0 space-y-3">
                        {student.photo && (
                          <div className="w-24 h-24 border border-border rounded-lg overflow-hidden">
                            <img
                              src={student.photo}
                              alt={student.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {student.signaturePhoto && (
                          <div className="w-24 h-12 border border-border rounded-lg overflow-hidden">
                            <img
                              src={student.signaturePhoto}
                              alt="Signature"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                      </div>

                      {/* Student Info */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">{student.name || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{student.email || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">URN: {student.urn || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">CRN: {student.crn || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{student.branch || "N/A"} • Year {student.year || "N/A"}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">DOB: {student.dob || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Gender: {student.gender || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{student.phone || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{student.address || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Father: {student.fatherName || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 space-y-3">
                        <div className="space-y-2">
                          {student.pendingPersonal && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateStudentStatus(student._id, "personal", "approved")}
                                className="flex items-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve Personal
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateStudentStatus(student._id, "personal", "rejected")}
                                className="flex items-center gap-2"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject Personal
                              </Button>
                            </div>
                          )}
                          {student.pendingSports && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateStudentStatus(student._id, "sports", "approved")}
                                className="flex items-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve Sports
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateStudentStatus(student._id, "sports", "rejected")}
                                className="flex items-center gap-2"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject Sports
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {/* Status Indicators */}
                        <div className="space-y-1">
                          {student.pendingPersonal && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Personal Pending
                            </span>
                          )}
                          {student.pendingSports && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs rounded-full flex items-center gap-1">
                              <Trophy className="w-3 h-3" />
                              Sports Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-foreground">Academic Info:</span>
                          <p className="text-muted-foreground">Matric: {student.yearOfPassingMatric || "N/A"}</p>
                          <p className="text-muted-foreground">+2: {student.yearOfPassingPlusTwo || "N/A"}</p>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Participation:</span>
                          <p className="text-muted-foreground">Years: {student.yearsOfParticipation || 0}</p>
                          <p className="text-muted-foreground">Admission: {student.firstAdmissionDate || "N/A"}</p>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Sports:</span>
                          <p className="text-muted-foreground">
                            {student.sports?.length > 0 ? student.sports.join(", ") : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pending Teams */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Pending Teams ({pendingTeams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTeams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Pending Teams</h3>
                <p className="text-muted-foreground">All teams have been reviewed</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingTeams.map((team, index) => {
                  const captain = captains.find((c) => c.captainId === team.captainId);

                  return (
                    <motion.div
                      key={team._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-border rounded-lg p-6 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <Trophy className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-foreground">
                                {captain?.teamName || "Unnamed Team"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Sport: {captain?.sport || "N/A"} • Captain: {captain?.name || "Unknown"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs rounded-full">
                              Status: {team.status?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateTeamStatus(team._id, "approved")}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateTeamStatus(team._id, "rejected")}
                            className="flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      </div>

                      {team.members?.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left p-3 font-medium text-foreground">#</th>
                                <th className="text-left p-3 font-medium text-foreground">Name</th>
                                <th className="text-left p-3 font-medium text-foreground">URN</th>
                                <th className="text-left p-3 font-medium text-foreground">Branch</th>
                                <th className="text-left p-3 font-medium text-foreground">Year</th>
                              </tr>
                            </thead>
                            <tbody>
                              {team.members.map((member, i) => (
                                <tr key={i} className="border-b border-border hover:bg-muted/50 transition-colors">
                                  <td className="p-3 text-muted-foreground">{i + 1}</td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                                        <User className="w-3 h-3 text-primary" />
                                      </div>
                                      <span className="font-medium text-foreground">{member.name}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-muted-foreground">{member.urn}</td>
                                  <td className="p-3">
                                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                      {member.branch}
                                    </span>
                                  </td>
                                  <td className="p-3 text-muted-foreground">{member.year}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No members listed</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>



    </div>
  );
};

export default AdminApprovalDashboard;
