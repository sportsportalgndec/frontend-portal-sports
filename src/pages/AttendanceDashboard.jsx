import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "../components/ui/modal";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Users,
  Clock,
  RefreshCw,
  AlertCircle,
  UserPlus,
  CalendarDays,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import API from "../services/api";

// Separate Heading Component
const AttendanceHeading = ({ defaultSport }) => (
  <div>
    <h1 className="text-3xl font-bold text-foreground">{defaultSport} Attendance</h1>
    <p className="text-muted-foreground mt-1">Manage attendance for {defaultSport} students</p>
  </div>
);

const AttendanceDashboard = ({ defaultSport }) => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [attendanceCounts, setAttendanceCounts] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [showForm, setShowForm] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState({
    name: "",
    branch: "",
    urn: "",
    crn: "",
    year: "",
    sport: defaultSport || "Gym",
    email: "",
    phone: ""
  });
  const [dateOffset, setDateOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [urnFilter, setUrnFilter] = useState("");

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");

  const courses = [
    "B.Tech.(Civil Engineering)",
    "B.Tech.(Computer Science and Engineering)",
    "B.Tech.(Electrical Engineering)",
    "B.Tech.(Electronics and Communication Engineering)",
    "B.Tech.(Information Technology)",
    "B.Tech.(Mechanical Engineering)",
    "B.Tech.(Robotics and Artificial Intelligence)",
    "M.Tech.(Electronics and Communication Engineering)",
    "M.Tech.(Environmental Science and Engineering)",
    "M.Tech.(Computer Science and Information Technology)",
    "M.Tech.(Power Engineering)",
    "M.Tech.(Production Engineering)",
    "M.Tech.(Structural Engineering)",
    "M.Tech.(Computer Science and Engineering)",
    "MBA (Masters in Business Administration)",
    "MCA (Masters in Computer Application)",
    "BCA (Bachelor of Computer Applications)",
    "BBA (Bachelor of Business Administration)",
    "B.Voc.(Interior Design)",
    "B.Com.(Entrepreneurship)"
  ];
  const years = [1, 2, 3, 4, 5];


  useEffect(() => { loadSessions(); loadStudents(); }, []);
  useEffect(() => { if (selectedSession) loadAttendance(date, selectedSession); }, [date, selectedSession]);
  useEffect(() => { calculateAttendanceCounts(); }, [attendance, selectedSession]);

  const normalizeDate = (d) => new Date(d).toISOString().split("T")[0];

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get("/session");
      setSessions(res.data);
      if (res.data.length > 0) {
        const active = res.data.find((s) => s.isActive) || res.data[0];
        setSelectedSession(active._id);
      }
    } catch (err) { 
      console.error("Failed to fetch sessions", err);
      setError("Failed to load sessions");
    } finally { setLoading(false); }
  };

  const loadStudents = async () => {
    try {
      const res = await API.get("/gym-swimming");
      const filtered = res.data.filter(s => s.sport === (defaultSport || "Gym"));
      setStudents(filtered);
    } catch (err) { 
      console.error("Failed to fetch students", err);
      setError("Failed to load students");
    }
  };

  const loadAttendance = async (selectedDate, sessionId) => {
    try {
      const res = await API.get(`/attendance/${selectedDate}?sessionId=${sessionId}`);
      const records = {};
      res.data.forEach((r) => {
        const studentId = r.student?._id || r.studentId || r._id;
        if (studentId) {
          records[`${studentId}_${sessionId}`] = {
            status: r.status,
            sessionId: r.session?._id || r.session,
            date: normalizeDate(r.date),
          };
        }
      });
      setAttendance(records);
    } catch (err) { console.error("Failed to fetch attendance", err); }
  };

  const calculateAttendanceCounts = () => {
    const counts = {};
    Object.entries(attendance).forEach(([key, record]) => {
      if (record.sessionId === selectedSession && record.status === "Present") {
        const studentId = key.split('_')[0];
        counts[studentId] = (counts[studentId] || 0) + 1;
      }
    });
    setAttendanceCounts(counts);
  };

  // Validate email
  const isValidEmail = (email) => {
    if (!email) return true; // optional field
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSaveStudent = async () => {
    if (!isValidEmail(form.email)) {
      return alert("Please enter a valid email address");
    }
    try {
      setSubmitLoading(true);
      const studentData = { ...form, session: selectedSession };
      if (editStudent) {
        await API.put(`/gym-swimming/${editStudent._id}`, studentData);
      } else {
        await API.post("/gym-swimming/add", studentData);
      }
      setShowForm(false);
      setForm({ name: "", branch: "", urn: "", crn: "", year: "", sport: defaultSport || "Gym", email: "", phone: "" });
      setEditStudent(null);
      loadStudents();
      loadAttendance(date, selectedSession);
    } catch (err) { 
      console.error("Failed to save student", err);
      setError("Failed to save student");
    } finally { setSubmitLoading(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      await API.delete(`/gym-swimming/${id}`);
      loadStudents();
    }
  };

  const handleAttendance = async (studentId, status, forDate) => {
    try {
      const res = await API.post("/attendance/mark", { studentId, status, sessionId: selectedSession, markedBy: "ADMIN_ID", date: forDate });
      const record = res.data.record;
      const key = `${studentId}_${selectedSession}`;
      setAttendance({ ...attendance, [key]: { status: record.status, sessionId: record.session, date: normalizeDate(record.date) } });
      calculateAttendanceCounts();
    } catch (err) { console.error("Failed to mark attendance", err); }
  };

  // 10-day block from current date
  const getDateBlock = () => {
    const days = [];
    let current = new Date();
    current.setDate(current.getDate() + dateOffset * 10);
    for (let i = 0; i < 10; i++) {
      days.push(normalizeDate(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  if (loading) return <div className="p-6 flex items-center justify-center min-h-[400px]"><RefreshCw className="w-6 h-6 animate-spin text-primary" /><span className="ml-2">Loading attendance data...</span></div>;
  if (error) return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Data</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => { loadSessions(); loadStudents(); }} variant="outline"><RefreshCw className="w-4 h-4 mr-2" />Try Again</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-center justify-between">
  <AttendanceHeading defaultSport={defaultSport || "Gym"} />
  <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
    <Plus className="w-4 h-4" />Add Student
  </Button>
</motion.div>


      {/* Session Selector + Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="text-sm font-medium text-foreground flex items-center gap-2"><Calendar className="w-4 h-4" />Select Session:</label>
            <Select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}>
              {sessions.map(s => <option key={s._id} value={s._id}>{s.session} {s.isActive ? "(Active)" : ""}</option>)}
            </Select>
            <div className="space-y-1"><label className="text-sm font-medium text-foreground">Filter by Name</label><Input value={nameFilter} onChange={(e)=>setNameFilter(e.target.value)} placeholder="e.g. John" /></div>
            <div className="space-y-1"><label className="text-sm font-medium text-foreground">Filter by URN</label><Input value={urnFilter} onChange={(e)=>setUrnFilter(e.target.value)} placeholder="e.g. 21XXXX" /></div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Date Navigation */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="w-5 h-5 text-primary" />Date Navigation</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Button onClick={() => setDateOffset(dateOffset - 1)} variant="outline" size="sm" className="flex items-center gap-2"><ChevronLeft className="w-4 h-4" />Prev 10 days</Button>
              {getDateBlock().map(d => <Button key={d} onClick={() => setDate(d)} variant={date===d?"default":"outline"} size="sm">{d}</Button>)}
              <Button onClick={() => setDateOffset(dateOffset + 1)} variant="outline" size="sm" className="flex items-center gap-2">Next 10 days<ChevronRight className="w-4 h-4" /></Button>
              <div className="ml-4"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" /></div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-lg font-semibold text-foreground">Showing attendance for: <span className="text-primary">{date}</span></span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

       {/* Students List */} 
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} > 
        <Card> 
          <CardHeader> 
            <CardTitle className="flex items-center gap-2"> 
              <Users className="w-5 h-5 text-primary" /> Students ({students.length}) 
            </CardTitle> 
          </CardHeader> 
          <CardContent> 
            {students.length === 0 ? ( 
              <div className="text-center py-12"> 
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" /> 
                <h3 className="text-lg font-semibold text-foreground mb-2">No Students Found</h3> 
                <p className="text-muted-foreground">No students available for {defaultSport || "Gym"}.</p> 
              </div> 
            ) : ( 
              <div className="space-y-4"> 
                {students 
                  .filter(st => (nameFilter? (st.name||"").toLowerCase().includes(nameFilter.toLowerCase()):true)) 
                  .filter(st => (urnFilter? (st.urn||"").toLowerCase().includes(urnFilter.toLowerCase()):true)) 
                  .map((st, index) => { 
                    const att = attendance[`${st._id}_${selectedSession}`]; 
                    const isPresent = att?.status === "Present" && att?.date === date; 
                    const isAbsent = att?.status === "Absent" && att?.date === date; 
                    return ( 
                      <motion.div key={st._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors" > 
                        <div className="flex items-center justify-between"> 
                          <div className="flex items-center gap-4"> 
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"> 
                              <Users className="w-5 h-5 text-primary" /> 
                            </div> 
                            <div> 
                              <h3 className="font-semibold text-foreground">{st.name}</h3> 
                              <div className="flex items-center gap-4 text-sm text-muted-foreground"> 
                                <span>URN: {st.urn}</span> <span>CRN: {st.crn}</span> <span>Branch: {st.branch}</span> <span>Year: {st.year}</span> 
                              </div> 
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1"> 
                                <span>Sport: {st.sport}</span> {st.email && <span>Email: {st.email}</span>} {st.phone && <span>Phone: {st.phone}</span>} 
                              </div> 
                            </div> 
                          </div> 
                          <div className="flex items-center gap-4"> 
                            {/* Attendance Status */} 
                            <div className="text-center"> 
                              {isPresent ? ( 
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400"> 
                                  <CheckCircle className="w-5 h-5" /> 
                                  <span className="font-medium">Present</span> 
                                </div> 
                              ) : isAbsent ? ( 
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400"> 
                                  <XCircle className="w-5 h-5" /> 
                                  <span className="font-medium">Absent</span> 
                                </div> 
                              ) : ( 
                                <div className="flex items-center gap-2 text-muted-foreground"> 
                                  <Clock className="w-5 h-5" /> 
                                  <span className="font-medium">Not Marked</span> 
                                </div> 
                              )} 
                            </div> 
                            {/* Attendance Actions */} 
                            <div className="flex gap-2"> 
                              <Button onClick={() => handleAttendance(st._id, "Present", date)} variant="outline" size="sm" className="flex items-center gap-2" > 
                                <CheckCircle className="w-4 h-4" /> Present 
                              </Button> 
                              <Button onClick={() => handleAttendance(st._id, "Absent", date)} variant="outline" size="sm" className="flex items-center gap-2" > 
                                <XCircle className="w-4 h-4" /> Absent 
                              </Button> 
                            </div> 
                            {/* Student Actions */} 
                            <div className="flex gap-2"> 
                              <Button onClick={() => { setEditStudent(st); setForm(st); setShowForm(true); }} variant="outline" size="sm" className="flex items-center gap-2" > 
                                <Edit className="w-4 h-4" /> Edit 
                              </Button> 
                              <Button onClick={() => handleDelete(st._id)} variant="destructive" size="sm" className="flex items-center gap-2" > 
                                <Trash2 className="w-4 h-4" /> Delete 
                              </Button> 
                            </div> 
                          </div> 
                        </div> 
                      </motion.div> 
                    ); 
                  })} 
              </div> 
            )} 
          </CardContent> 
        </Card> 
      </motion.div> 

      {/* Add Student Modal */} 
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditStudent(null); }}> 
        <ModalHeader> 
          <ModalTitle className="flex items-center gap-2"> 
            <UserPlus className="w-5 h-5 text-primary" /> {editStudent ? "Edit Student" : "Add Student"} 
          </ModalTitle> 
        </ModalHeader> 
        <ModalContent> 
          <div className="mb-4 p-3 bg-muted rounded-lg"> 
            <p className="text-sm text-muted-foreground"> Session: <strong className="text-foreground">{sessions.find(s => s._id === selectedSession)?.session}</strong> </p> 
          </div> 
          <form onSubmit={(e) => { e.preventDefault(); handleSaveStudent(); }} className="space-y-4"> 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
              <div className="space-y-2"> 
                <label className="text-sm font-medium text-foreground">Full Name</label> 
                <Input name="name" placeholder="Enter full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /> 
              </div> 
               <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Course</label>
                <Select
                  value={form.course}
                  onChange={(e) => setForm({ ...form, course: e.target.value })}
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map(course => <option key={course} value={course}>{course}</option>)}
                </Select>
              </div> 
            </div> 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
              <div className="space-y-2"> 
                <label className="text-sm font-medium text-foreground">URN</label> 
                <Input name="urn" placeholder="Enter URN" value={form.urn} onChange={(e) => setForm({ ...form, urn: e.target.value })} required /> 
              </div> 
              <div className="space-y-2"> 
                <label className="text-sm font-medium text-foreground">CRN</label> 
                <Input name="crn" placeholder="Enter CRN" value={form.crn} onChange={(e) => setForm({ ...form, crn: e.target.value })} required /> 
              </div> 
            </div> 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
               <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Year</label>
                <Select
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                  required
                >
                  <option value="">Select Year</option>
                  {years.map(year => <option key={year} value={year}>{`D${year}`}</option>)}
                </Select>
              </div> 
              <div className="space-y-2"> 
                <label className="text-sm font-medium text-foreground">Sport</label> 
                <Select name="sport" value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })} > 
                  <option value={defaultSport || "Gym"}>{defaultSport || "Gym"}</option> 
                </Select> 
              </div> 
            </div> 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
              <div className="space-y-2"> 
                <label className="text-sm font-medium text-foreground">Email (Optional)</label> 
                <Input name="email" type="email" placeholder="Enter email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /> 
              </div> 
              <div className="space-y-2"> 
                <label className="text-sm font-medium text-foreground">Phone (Optional)</label> 
                <Input name="phone" type="tel" placeholder="Enter phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /> 
              </div> 
            </div> 
          </form> 
        </ModalContent> 
        <ModalFooter> 
          <Button variant="outline" onClick={() => { setShowForm(false); setEditStudent(null); }} > Cancel </Button> 
          <Button onClick={handleSaveStudent} disabled={submitLoading} className="flex items-center gap-2" > 
            {submitLoading ? ( <> <RefreshCw className="w-4 h-4 animate-spin" /> {editStudent ? "Updating..." : "Adding..."} </> ) : ( <> <UserPlus className="w-4 h-4" /> {editStudent ? "Update Student" : "Add Student"} </> )} 
          </Button> 
        </ModalFooter> 
      </Modal>
    </div>
  );
};

export default AttendanceDashboard;
