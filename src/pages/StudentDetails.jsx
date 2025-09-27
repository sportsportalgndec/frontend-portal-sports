import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { 
  User, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Plus, 
  Camera, 
  FileText,
  GraduationCap,
  Calendar,
  Phone,
  MapPin,
  UserCheck,
  Trophy,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import API from "../services/api";
import { sportsList } from "../lib/options";

const StudentDetails = ({  }) => {
  const params = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Sports helpers
  const SPORT_LEVEL_PREFIXES = [
    "Inter-University Level",
    "State Level",
    "International Level",
    "National Level",
    "PTU Intercollege"
  ];

  const POSITION_OPTIONS = ["pending", "participated", "1st", "2nd", "3rd"]; // keep enum order friendly

  const parseSport = (value) => {
    if (!value || typeof value !== "string") return { level: "", name: "" };
    const prefix = SPORT_LEVEL_PREFIXES.find((p) => value.startsWith(p + " "));
    if (prefix) return { level: prefix, name: value.slice(prefix.length + 1) };
    return { level: "", name: value };
  };

  const composeSport = ({ level, name }) => {
    const cleanName = (name || "").trim();
    const cleanLevel = (level || "").trim();
    if (!cleanName) return "";
    return cleanLevel ? `${cleanLevel} ${cleanName}` : cleanName;
  };

  const id =  params.id; // ✅ agar prop mila to use kar, warna URL param se le

  const fetchDetails = async () => {
    if (!id) return; // ✅ guard
    try {
      setLoading(true);
      setError(null);
      const res = await API.get(`/admin/student/${id}`, { withCredentials: true });
      setStudent(res.data);

      setForm({
        ...res.data,
        photo: res.data.photo || "",
        signaturePhoto: res.data.signaturePhoto || "",
      });
    } catch (err) {
      console.error(err);
      setError("Failed to fetch student details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);




  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      await API.delete(`/admin/student/${id}`, { withCredentials: true });
      alert("Deleted successfully");
      navigate("/admin/students");
    } catch (err) {
      console.error(err);
      alert("Failed to delete student");
    }
  };
const handleUpdate = async () => {
  try {
    setUpdateLoading(true);
    const formData = new FormData();

    // ✅ Append all normal fields (except file fields)
    for (const key in form) {
      if (
        form[key] !== undefined &&
        form[key] !== null &&
        key !== "photo" &&
        key !== "signaturePhoto" &&
        key !== "positions"&& // ⚡ positions ko handle alag se
        key !== "sportsDetails"
      ) {
        if (key === "userId" && typeof form[key] === "object" && form[key]._id) {
          formData.append("userId", form[key]._id);
        } else if (key === "session" && typeof form[key] === "object" && form[key]._id) {
          formData.append("session", form[key]._id);
        }else if (key === "status" && typeof form[key] === "object") {
  // 🟢 Bas direct nested field bhejna
  formData.append("statusPersonal", form[key].personal || "none");
}
 else {
          formData.append(key, form[key]);
        }
      }
    }

    // ✅ Handle positions array properly
    if (form.positions && Array.isArray(form.positions)) {
      formData.append("positions", JSON.stringify(form.positions));
    }
    if (form.sportsDetails && Array.isArray(form.sportsDetails)) {
      const uniqueSportsDetails = [...new Map(form.sportsDetails.map(s => [s.sport, s])).values()];
      formData.append("sportsDetails", JSON.stringify(uniqueSportsDetails));
    }
    // ✅ Append file fields separately
    if (form.photo instanceof File) {
      formData.append("photo", form.photo);
    }
    if (form.signaturePhoto instanceof File) {
      formData.append("signaturePhoto", form.signaturePhoto);
    }

    const res = await API.put(`/admin/student/${id}`, formData, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });

    setStudent(res.data);
    setEditing(false);
    alert("Student updated successfully");
  } catch (err) {
    console.error(err);
    alert("Failed to update student");
  } finally {
    setUpdateLoading(false);
  }
};




  if (loading) {
    return (
     <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-orange-500 border-dashed rounded-full animate-spin"></div>
    </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchDetails} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!student) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <User className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No student details found</p>
        </CardContent>
      </Card>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-4"
      >
        <Button
          onClick={() => navigate('/admin/create-student')}
          variant="outline"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Students
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Details</h1>
          <p className="text-muted-foreground mt-1">View and edit student information</p>
        </div>
      </motion.div>

      {!editing ? (
        /* View Mode */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  {student.name}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setEditing(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Photos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {student.photo && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Photo</label>
                    <div className="w-32 h-32 border border-border rounded-lg overflow-hidden">
                      <img 
                        src={student.photo} 
                        alt="student" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                )}
                {student.signaturePhoto && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Signature</label>
                    <div className="w-32 h-32 border border-border rounded-lg overflow-hidden">
                      <img 
                        src={student.signaturePhoto} 
                        alt="signature" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-foreground">{student.userId?.email || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">URN</label>
                    <p className="text-foreground">{student.urn || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">CRN</label>
                    <p className="text-foreground">{student.crn || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Branch</label>
                    <p className="text-foreground">{student.branch || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Year</label>
                    <p className="text-foreground">{student.year || "N/A"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                    <p className="text-foreground">{student.dob ? new Date(student.dob).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Gender</label>
                    <p className="text-foreground">{student.gender || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contact</label>
                    <p className="text-foreground">{student.contact || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <p className="text-foreground">{student.address || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Father Name</label>
                    <p className="text-foreground">{student.fatherName || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Matric Passing Year</label>
                    <p className="text-foreground">{student.yearOfPassingMatric || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">+2 Passing Year</label>
                    <p className="text-foreground">{student.yearOfPassingPlusTwo || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">First Admission Date</label>
                    <p className="text-foreground">{student.firstAdmissionDate || "N/A"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Exam Name</label>
                    <p className="text-foreground">{student.lastExamName || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Exam Year</label>
                    <p className="text-foreground">{student.lastExamYear || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Years of Participation</label>
                    <p className="text-foreground">{student.yearsOfParticipation || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Inter College Graduate Course</label>
                    <p className="text-foreground">{student.interCollegeGraduateCourse}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Inter College PG Course</label>
                    <p className="text-foreground">{student.interCollegePgCourse}</p>
                  </div>
                </div>
              </div>

              {/* Sports and Positions */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sports</label>
                  <p className="text-foreground">{student.sports?.join(", ") || "N/A"}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Positions</label>
                  {student.positions?.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {student.positions.map((pos) => (
                        <div key={pos._id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          <Trophy className="w-4 h-4 text-primary" />
                          <span className="font-medium">{pos.sport}</span>
                          <span className="text-muted-foreground">—</span>
                          <span>{pos.position}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No positions assigned</p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Personal Status</label>
                  <p className="text-foreground">{student.status?.personal || "N/A"}</p>
                </div>
                <div>
  <label className="text-sm font-medium text-muted-foreground">Sports Status</label>
  {student.sportsDetails && student.sportsDetails.length > 0 ? (
    <ul className="list-disc ml-5 space-y-1">
      {student.sportsDetails.map((detail) => (
        <li key={detail._id} className="text-foreground">
          {detail.sport} —{" "}
          <span
            className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium
              ${
                detail.status === "approved"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : detail.status === "pending"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              }`}
          >
            {detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}
          </span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-foreground">N/A</p>
  )}
</div>

              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        /* Edit Mode */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Edit Student
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Name</label>
                  <Input
                    name="name"
                    value={form.name || ""}
                    onChange={handleChange}
                    placeholder="Enter name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">URN</label>
                  <Input
                    name="urn"
                    value={form.urn || ""}
                    onChange={handleChange}
                    placeholder="Enter URN"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">CRN</label>
                  <Input
                    name="crn"
                    value={form.crn || ""}
                    onChange={handleChange}
                    placeholder="Enter CRN"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Branch</label>
                  <Input
                    name="branch"
                    value={form.branch || ""}
                    onChange={handleChange}
                    placeholder="Enter branch"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Year</label>
                  <Input
                    name="year"
                    type="number"
                    value={form.year || ""}
                    onChange={handleChange}
                    placeholder="Enter year"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <Input
                    name="password"
                    type="password"
                    value={form.password || ""}
                    onChange={handleChange}
                    placeholder="Enter password"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Date of Birth</label>
                  <Input
                    name="dob"
                    type="date"
                    value={form.dob ? form.dob.substring(0, 10) : ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Gender</label>
                  <Input
                    name="gender"
                    value={form.gender || ""}
                    onChange={handleChange}
                    placeholder="Enter gender"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Contact</label>
                  <Input
                    name="contact"
                    value={form.contact || ""}
                    onChange={handleChange}
                    placeholder="Enter contact"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Address</label>
                  <Input
                    name="address"
                    value={form.address || ""}
                    onChange={handleChange}
                    placeholder="Enter address"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Father Name</label>
                  <Input
                    name="fatherName"
                    value={form.fatherName || ""}
                    onChange={handleChange}
                    placeholder="Enter father name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Matric Passing Year</label>
                  <Input
                    name="yearOfPassingMatric"
                    type="number"
                    value={form.yearOfPassingMatric || ""}
                    onChange={handleChange}
                    placeholder="Enter matric year"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">+2 Passing Year</label>
                  <Input
                    name="yearOfPassingPlusTwo"
                    type="number"
                    value={form.yearOfPassingPlusTwo || ""}
                    onChange={handleChange}
                    placeholder="Enter +2 year"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">First Admission Date</label>
                  <Input
                    name="firstAdmissionDate"
                    type="month"
                    value={form.firstAdmissionDate || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Last Exam Name</label>
                  <Input
                    name="lastExamName"
                    value={form.lastExamName || ""}
                    onChange={handleChange}
                    placeholder="Enter last exam name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Last Exam Year</label>
                  <Input
                    name="lastExamYear"
                    type="number"
                    value={form.lastExamYear || ""}
                    onChange={handleChange}
                    placeholder="Enter last exam year"
                  />
                </div>
                <div className="space-y-2">
  <label className="text-sm font-medium text-foreground">Years of Participation</label>
  <select
    name="yearsOfParticipation"
    value={form.yearsOfParticipation || ""}
    onChange={handleChange}
    className="w-full px-4 py-3 border  rounded-lg
               bg-white dark:bg-black text-gray-900 dark:text-white
               focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
               transition-colors"
  >
    <option value="">Select years</option>
    {[...Array(11)].map((_, i) => (
      <option
        key={i}
        value={i}
        className="bg-white dark:bg-black text-gray-900 dark:text-white"
      >
        {i} {i === 1 ? "year" : "years"}
      </option>
    ))}
  </select>
</div>

<div className="space-y-2">
  <label className="text-sm font-medium text-foreground">Inter College Graduate Course</label>
  <select
    name="interCollegeGraduateCourse"
    value={form.interCollegeGraduateCourse}
    onChange={handleChange}
    className="w-full px-4 py-3 border  rounded-lg
               bg-white dark:bg-black text-gray-900 dark:text-white
               focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
               transition-colors"
  >
    <option value="">Select years</option>
    {[...Array(11)].map((_, i) => (
      <option
        key={i}
        value={i}
        className="bg-white dark:bg-black text-gray-900 dark:text-white"
      >
        {i} {i === 1 ? "year" : "years"}
      </option>
    ))}
  </select>
</div>

<div className="space-y-2">
  <label className="text-sm font-medium text-foreground">Inter College PG Course</label>
  <select
    name="interCollegePgCourse"
    value={form.interCollegePgCourse}
    onChange={handleChange}
    className="w-full px-4 py-3 border rounded-lg
               bg-white dark:bg-black text-gray-900 dark:text-white
               focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
               transition-colors"
  >
    <option value="">Select years</option>
    {[...Array(11)].map((_, i) => (
      <option
        key={i}
        value={i}
        className="bg-white dark:bg-black text-gray-900 dark:text-white"
      >
        {i} {i === 1 ? "year" : "years"}
      </option>
    ))}
  </select>
</div>


                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Sports</label>
                  <div className="space-y-2">
                    {(form.sports || []).map((s, idx) => {
                      const parsed = parseSport(s);
                      return (
                        <div key={idx} className="flex gap-2 items-center">
                          <Select
                            value={parsed.level}
                            onChange={(e) => {
                              const next = [...(form.sports || [])];
                              next[idx] = composeSport({ level: e.target.value, name: parsed.name });
                              setForm({ ...form, sports: next.filter(Boolean) });
                            }}
                            className="w-56"
                          >
                            <option value="">Select Level (optional)</option>
                            {SPORT_LEVEL_PREFIXES.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </Select>
                          <Select
                            value={parsed.name}
                            onChange={(e) => {
                              const next = [...(form.sports || [])];
                              next[idx] = composeSport({ level: parsed.level, name: e.target.value });
                              setForm({ ...form, sports: next });
                            }}
                            className="flex-1"
                          >
                            <option value="">Select sport</option>
                            {sportsList.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </Select>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              const next = (form.sports || []).filter((_, i) => i !== idx);
                              setForm({ ...form, sports: next });
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => setForm({ ...form, sports: [...(form.sports || []), ""] })}
                    >
                      <Plus className="w-4 h-4" />
                      Add Sport
                    </Button>
                  </div>
                </div>

              </div>

              {/* Positions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Positions</h3>
                {form.positions?.map((pos, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Select
                      value={pos.sport || ""}
                      onChange={(e) => {
                        const newPositions = [...form.positions];
                        newPositions[idx].sport = e.target.value;
                        setForm({ ...form, positions: newPositions });
                      }}
                      className="flex-1"
                    >
                      <option value="">Select sport</option>
                      {(form.sports || []).filter(Boolean).map((s, i) => (
                        <option key={`${s}-${i}`} value={s}>{s}</option>
                      ))}
                    </Select>
                    <Select
                      value={pos.position || "pending"}
                      onChange={(e) => {
                        const newPositions = [...form.positions];
                        newPositions[idx].position = e.target.value;
                        setForm({ ...form, positions: newPositions });
                      }}
                      className="w-40"
                    >
                      {POSITION_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </Select>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        const newPositions = form.positions.filter((_, i) => i !== idx);
                        setForm({ ...form, positions: newPositions });
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setForm({
                      ...form,
                      positions: [...(form.positions || []), { sport: "", position: "" }],
                    })
                  }
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Position
                </Button>
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Photo</label>
                  <Input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={(e) => setForm({ ...form, photo: e.target.files[0] })}
                  />
                  {form.photo && typeof form.photo === "string" && (
                    <div className="w-20 h-20 border border-border rounded-lg overflow-hidden">
                      <img src={form.photo} alt="photo" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Signature</label>
                  <Input
                    type="file"
                    name="signaturePhoto"
                    accept="image/*"
                    onChange={(e) => setForm({ ...form, signaturePhoto: e.target.files[0] })}
                  />
                  {form.signaturePhoto && typeof form.signaturePhoto === "string" && (
                    <div className="w-20 h-20 border border-border rounded-lg overflow-hidden">
                      <img src={form.signaturePhoto} alt="signature" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleUpdate}
                  disabled={updateLoading}
                  className="flex items-center gap-2"
                >
                  {updateLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setEditing(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );

};

export default StudentDetails;
