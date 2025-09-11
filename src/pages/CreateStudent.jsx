// pages/CreateStudent.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '../components/ui/modal';
import { 
  UserPlus, 
  Eye, 
  EyeOff, 
  Users, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import API from '../services/api';
import AllStudents from './AllStudents';

export default function Students() {
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0); // to refresh AllStudents

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    rollNumber: '',
    course: '',
    year: '',
    sessionId: '',
    sports: [],
    role: 'student',
  });

  const [sessions, setSessions] = useState([]);

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

  // Load active session on mount
  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
    API.get('/session/active')
      .then(res => {
        if (res.data?._id) {
          setSessions([res.data]);
          setForm(f => ({ ...f, sessionId: res.data._id }));
        }
      })
      .catch(() => setMessage('⚠ No active session found.'));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'rollNumber' && !/^\d*$/.test(value)) return;
    setForm({ ...form, [name]: value });
  };

  // Email validation function
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Email validation
    if (!validateEmail(form.email)) {
      setMessage('⚠ Invalid email address');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await API.post('/admin/create-user', form);
      setMessage(res.data.message);

      // Trigger reload of student list
      setReloadTrigger(prev => prev + 1);

      setTimeout(() => {
        setShowModal(false);
        setSubmitLoading(false);
        setMessage('');
        // Reset form
        setForm({
          name: '',
          email: '',
          password: '',
          rollNumber: '',
          course: '',
          year: '',
          sessionId: form.sessionId,
          sports: [],
          role: 'student',
        });
      }, 1200);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating student');
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-orange-500 border-dashed rounded-full animate-spin"></div>
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
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Student Management</h1>
            <p className="text-muted-foreground mt-1">Create and manage student accounts</p>
          </div>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Create Student
        </Button>
      </motion.div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setMessage('');
        }}
        className="max-w-2xl"
      >
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Create New Student
          </ModalTitle>
        </ModalHeader>

        <ModalContent>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${
                message.includes('Error') || message.includes('⚠') 
                  ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                  : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              }`}
            >
              {message.includes('Error') || message.includes('⚠') ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{message}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <Input
                  name="name"
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <Input
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">URN (Roll Number)</label>
                <Input
                  name="rollNumber"
                  placeholder="Enter URN"
                  value={form.rollNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <label className="text-sm font-medium text-foreground">Session</label>
                <Select
                  value={form.sessionId}
                  onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
                  required
                >
                  <option value="">Select Session</option>
                  {sessions.map(session => <option key={session._id} value={session._id}>{session.session}</option>)}
                </Select>
              </div>
            </div>
          </form>
        </ModalContent>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={() => { setShowModal(false); setMessage(''); }}>Cancel</Button>
          <Button type="submit" disabled={submitLoading} onClick={handleSubmit} className="flex items-center gap-2">
            {submitLoading ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Student
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Student Management Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Student Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AllStudents reloadTrigger={reloadTrigger} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
