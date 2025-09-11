import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle, 
  ArrowLeft, 
  RefreshCw,
  AlertCircle,
  Clock,
  CalendarDays
} from 'lucide-react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

function AdminSessionManager() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [startMonth, setStartMonth] = useState('Jan');
  const [endMonth, setEndMonth] = useState('July');
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true); // page loader
  const [submitLoading, setSubmitLoading] = useState(false);
  const [err, setErr] = useState('');

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'June',
    'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
  ];
  const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setErr('');
      const res = await API.get('/session');
      setSessions(res.data);
    } catch (error) {
      setErr('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (e) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      setErr('');
      await API.post('/session/create', { startMonth, endMonth, year: Number(year) });
      setStartMonth('Jan'); 
      setEndMonth('July'); 
      setYear(new Date().getFullYear());
      fetchSessions();
    } catch (error) {
      setErr('Creation failed. Are you logged in as admin?');
    } finally {
      setSubmitLoading(false);
    }
  };

  const setActive = async (id) => {
    try { 
      await API.put(`/session/set-active/${id}`); 
      fetchSessions(); 
    } catch (error) {
      setErr('Failed to set active');
    }
  };

  const deleteSession = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    try { 
      await API.delete(`/session/${id}`); 
      fetchSessions(); 
    } catch (error) {
      setErr('Failed to delete session');
    }
  };

  useEffect(() => { fetchSessions(); }, []);

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
        <div className="flex items-center gap-4">
          
          <div>
            <h1 className="text-3xl font-bold text-foreground">Session Management</h1>
            <p className="text-muted-foreground mt-1">Create and manage academic sessions</p>
          </div>
        </div>
        <Button onClick={fetchSessions} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Create Session Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Create New Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            {err && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg mb-6 bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2"
              >
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">{err}</span>
              </motion.div>
            )}

            <form onSubmit={createSession} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Start Month</label>
                  <Select
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                    required
                  >
                    {months.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">End Month</label>
                  <Select
                    value={endMonth}
                    onChange={(e) => setEndMonth(e.target.value)}
                    required
                  >
                    {months.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Year</label>
                  <Select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Preview: <strong className="text-foreground">{startMonth}–{endMonth} {year}</strong>
                </p>
              </div>

              <Button
                type="submit"
                disabled={submitLoading}
                className="w-full flex items-center gap-2"
              >
                {submitLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Session
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Existing Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Existing Sessions ({sessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Sessions Found</h3>
                <p className="text-muted-foreground">Create your first session to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session, index) => (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <CalendarDays className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{session.session}</h3>
                            {session.isActive && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(session.startDate).toLocaleDateString()} - {new Date(session.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!session.isActive && (
                          <Button
                            onClick={() => setActive(session._id)}
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Set Active
                          </Button>
                        )}
                        <Button
                          onClick={() => deleteSession(session._id)}
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default AdminSessionManager;
