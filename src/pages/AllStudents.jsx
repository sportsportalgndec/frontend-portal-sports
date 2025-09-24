import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  Users, 
  Eye, 
  RefreshCw,
  AlertCircle,
  Search,
  Trophy
} from "lucide-react";
import API from "../services/api";

// Reusable table component
const StudentTable = ({ students }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left p-4 font-medium text-foreground">Name</th>
          <th className="text-left p-4 font-medium text-foreground">URN</th>
          <th className="text-left p-4 font-medium text-foreground">CRN</th>
          <th className="text-left p-4 font-medium text-foreground">Branch</th>
          <th className="text-left p-4 font-medium text-foreground">Year</th>
          <th className="text-left p-4 font-medium text-foreground">Actions</th>
        </tr>
      </thead>
      <tbody>
        {students.map((student, index) => (
          <motion.tr
            key={student._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border-b border-border hover:bg-muted/50 transition-colors"
          >
            <td className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-foreground">{student.name}</span>
              </div>
            </td>
            <td className="p-4 text-muted-foreground">{student.urn}</td>
            <td className="p-4 text-muted-foreground">{student.crn}</td>
            <td className="p-4">
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                {student.branch}
              </span>
            </td>
            <td className="p-4 text-muted-foreground">{student.year}</td>
            <td className="p-4">
              <Link to={`/admin/student/${student._id}`}>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  View / Edit
                </Button>
              </Link>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AllStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get("/admin/students", { withCredentials: true });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.urn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.branch?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingStudents = filteredStudents.filter(student =>
    student.status?.personal === "pending"
  );

  const approvedStudents = filteredStudents.filter(student =>
    student.status?.personal === "approved"
  );

  // Compute achievements
  const achievement = students.reduce((acc, s) => {
    (s.positions || []).forEach(pos => {
      const p = String(pos?.position || '').toLowerCase();
      if (p.includes('particip')) acc.participated += 1;
      else if (p.includes('1')) acc.first += 1;
      else if (p.includes('2')) acc.second += 1;
      else if (p.includes('3')) acc.third += 1;
    });
    return acc;
  }, { participated: 0, first: 0, second: 0, third: 0 });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-orange-500 border-dashed rounded-full animate-spin"></div></div>;
  if (error) return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6 text-center">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchStudents} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Students</h1>
          <p className="text-muted-foreground mt-1">Manage and view all student records</p>
        </div>
        <Button onClick={fetchStudents} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </motion.div>

      {/* Search & Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{students.length}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Student Achievements</p>
                <p className="text-base font-semibold text-foreground">Participated • 1st</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg text-center">
                <div className="text-xl font-bold text-foreground">{achievement.participated}</div>
                <div className="text-xs text-muted-foreground">Participated</div>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <div className="text-xl font-bold text-foreground">{achievement.first}</div>
                <div className="text-xs text-muted-foreground">1st</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Student Achievements</p>
                <p className="text-base font-semibold text-foreground">2nd • 3rd</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg text-center">
                <div className="text-xl font-bold text-foreground">{achievement.second}</div>
                <div className="text-xs text-muted-foreground">2nd</div>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <div className="text-xl font-bold text-foreground">{achievement.third}</div>
                <div className="text-xs text-muted-foreground">3rd</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search Bar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardContent className="p-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search students by name, URN, or branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Pending Students */}
      <h2 className="text-xl font-semibold mt-6 mb-2">Pending Students</h2>
      {pendingStudents.length === 0 ? <p className="text-muted-foreground">No pending students</p> : <StudentTable students={pendingStudents} />}

      {/* Approved Students */}
      <h2 className="text-xl font-semibold mt-6 mb-2">Approved Students</h2>
      {approvedStudents.length === 0 ? <p className="text-muted-foreground">No approved students</p> : <StudentTable students={approvedStudents} />}
    </div>
  );
};

export default AllStudents;
