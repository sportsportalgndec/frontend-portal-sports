import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { 
  Target, 
  Crown, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Trophy,
  User,
  GraduationCap,
  Search,
  Filter
} from "lucide-react";
import API from "../services/api";

const AssignPosition = () => {
  const [captains, setCaptains] = useState([]);
  const [positionData, setPositionData] = useState({});
  const [message, setMessage] = useState("");
  const [sportFilter, setSportFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch captains on mount
  useEffect(() => {
    const fetchCaptains = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await API.get("/admin/captains");
        
        // Use a consistent ID field (prefer _id if available)
        const uniqueCaptains = Array.from(
          new Map(
            res.data.map(c => [
              c.captainId || c._id,
              { 
                ...c, 
                // Use a consistent ID field
                id: c.captainId || c._id,
                assignedPosition: c.position  || "" 
              },
            ])
          ).values()
        );

        setCaptains(uniqueCaptains);
      } catch (err) {
        console.error("Error fetching captains:", err);
        setError("Failed to fetch captains");
      } finally {
        setLoading(false);
      }
    };
    fetchCaptains();
  }, []);

  const handlePositionChange = (captainId, value) => {
    setPositionData((prev) => ({
      ...prev,
      [captainId]: value,
    }));
  };

  const handleAssign = async (captainId) => {
    const position = positionData[captainId];
    if (!position) {
      alert("⚠ Please select a position first!");
      return;
    }

    try {
      const res = await API.put("/admin/assign-position", {
        captainId,
        position,
      });
      setMessage(res.data.message);

      // Reset local select
      setPositionData((prev) => ({
        ...prev,
        [captainId]: "",
      }));

      // Update local state to mark as assigned
      setCaptains((prev) =>
        prev.map((c) =>
          (c.captainId === captainId || c._id === captainId)
            ? { ...c, assignedPosition: position }
            : c
        )
      );
    } catch (err) {
      setMessage(err.response?.data?.message || "Error assigning position");
    }
  };

  // Filter captains by sport without re-deduplicating
  const filteredCaptains = captains
    // hide captains already assigned a position
    .filter(c => c.assignedPosition=== "pending")
    .filter(c =>
      sportFilter
        ? c.sport && c.sport.toLowerCase().includes(sportFilter.toLowerCase())
        : true
    );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg text-muted-foreground">Loading captains...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Captains</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
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
          <h1 className="text-3xl font-bold text-foreground">Assign Team Positions</h1>
          <p className="text-muted-foreground mt-1">Assign positions to team captains</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </motion.div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300 font-medium">{message}</span>
          </div>
        </motion.div>
      )}

      {/* Filter */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-4">
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter by Sport
            </label>
            <Input
              type="text"
              placeholder="Filter by sport..."
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Captain Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {filteredCaptains.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Crown className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Captains Found</h3>
              <p className="text-muted-foreground">No captains available for position assignment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCaptains.map((c, index) => {
              const captainId = c.captainId || c._id;
              const isAssigned =  c.assignedPosition !== "pending";

              return (
                <motion.div
                  key={captainId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`h-full ${isAssigned ? "opacity-70" : ""}`}>
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Crown className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">{c.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              URN: {c.urn || "-"} • Sport: {c.sport || "-"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Branch: {c.branch || "-"} • Year: {c.year || "-"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {isAssigned ? (
                        <div className="mt-4 text-center py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                          <span className="text-green-700 dark:text-green-300 font-medium">
                            Assigned: {c.assignedPosition}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 mt-4">
                          <Select
                            value={positionData[captainId] || ""}
                            onChange={(e) => handlePositionChange(captainId, e.target.value)}
                          >
                            <option value="">Select Position</option>
                            <option value="1st">1st</option>
                            <option value="2nd">2nd</option>
                            <option value="3rd">3rd</option>
                            <option value="participated">Participated</option>
                          </Select>
                          <Button
                            onClick={() => handleAssign(captainId)}
                            disabled={!positionData[captainId]}
                            className="flex items-center gap-2"
                          >
                            <Trophy className="w-4 h-4" />
                            Assign Position
                          </Button>
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

export default AssignPosition;