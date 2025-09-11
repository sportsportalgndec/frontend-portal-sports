// frontend/src/pages/CaptainsAndTeams.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from "../components/ui/modal";
import { Crown, Users, Edit, Trash2, Eye, RefreshCw } from "lucide-react";

function CaptainsAndTeams({ nameFilter = "", urnFilter = "", sportFilter = "" }) {
  const [captains, setCaptains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCaptain, setSelectedCaptain] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editingMemberIndex, setEditingMemberIndex] = useState(null);
  const [memberForm, setMemberForm] = useState({
    name: "",
    branch: "",
    year: "",
    urn: "",
    email: "",
    phone: "",
    sport: "",
    position: "",
  });

  useEffect(() => {
    const fetchCaptains = async () => {
      try {
        const res = await fetch("/api/admin/captains");
        const data = await res.json();

        if (Array.isArray(data)) {
          setCaptains(data);
        } else {
          setError("Unexpected response format");
        }
      } catch (err) {
        setError("Failed to fetch captains");
      } finally {
        setLoading(false);
      }
    };

    fetchCaptains();
  }, []);

  const handleDeleteCaptain = async (id) => {
    if (!window.confirm("Are you sure you want to delete this captain?")) return;
    try {
      await fetch(`/api/admin/captains/${id}`, { method: "DELETE" });
      setCaptains(captains.filter((c) => c._id !== id));
      setSelectedCaptain(null);
    } catch (err) {
      alert("Error deleting captain");
    }
  };

  const handleDeleteMember = async (captainId, sessionId, memberIndex) => {
    if (!window.confirm("Delete this team member?")) return;
    try {
      await fetch(`/api/admin/captains/${captainId}/${sessionId}/members/${memberIndex}`, {
        method: "DELETE",
      });
      setSelectedCaptain({
        ...selectedCaptain,
        teamMembers: selectedCaptain.teamMembers.filter(
          (_, i) => i !== memberIndex
        ),
      });
    } catch (err) {
      alert("Error deleting team member");
    }
  };

  // --- MEMBER EDIT ---
  const startEditingMember = (member, index) => {
    setEditingMemberIndex(index);
    setMemberForm(member);
  };

  const handleMemberChange = (e) => {
    setMemberForm({ ...memberForm, [e.target.name]: e.target.value });
  };

  const handleMemberSubmit = async () => {
    try {
      const res = await fetch(
        `/api/admin/${selectedCaptain.captainId}/${selectedCaptain.sessionId}/members/${editingMemberIndex}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(memberForm),

        }
      );

      if (!res.ok) throw new Error("Failed to update member");

      const updatedData = await res.json();

      // update state
          setSelectedCaptain({
      ...selectedCaptain,
      teamMembers: updatedData.teamMembers,
    });
    
      setEditingMemberIndex(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // --- CAPTAIN EDIT ---
  const startEditing = (captain) => {
    setIsEditing(true);
    setEditForm({
      name: captain.name || "",
      branch: captain.branch || "",
      year: captain.year || "",
      urn: captain.urn || "",
      sport: captain.sport || "",
      email: captain.email || "",
      phone: captain.phone || "",
      position: captain.position || "",
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

const handleEditSubmit = async () => {
  try {
    // agar captain ne koi position select ki hai, toh usi ko members ko bhi assign karo
    const updatedData = {
      ...editForm,
      teamMembers: selectedCaptain.teamMembers.map((m) => ({
        ...m,
        position: editForm.position || m.position, // captain ki position members ko bhi
      })),
    };

    const res = await fetch(`/api/admin/captains/${selectedCaptain._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });

    if (!res.ok) throw new Error("Failed to update captain");

    const updatedCaptain = await res.json();

    setCaptains(
      captains.map((c) => (c._id === updatedCaptain._id ? updatedCaptain : c))
    );
    setSelectedCaptain(updatedCaptain);
    setIsEditing(false);
  } catch (err) {
    alert(err.message);
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

  if (error) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Captains & Teams</h1>
          <p className="text-muted-foreground mt-2">Manage team captains and their members</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {captains.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Crown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Captains Found</h3>
            <p className="text-muted-foreground">No team captains have been created yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {captains
            .filter(c => nameFilter ? (c.name||"").toLowerCase().includes(nameFilter.toLowerCase()) : true)
            .filter(c => urnFilter ? (c.urn||"").toLowerCase().includes(urnFilter.toLowerCase()) : true)
            .filter(c => sportFilter ? (c.sport||"").toLowerCase().includes(sportFilter.toLowerCase()) : true)
            .map((captain, index) => (
            <motion.div
              key={captain._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-primary" />
                    {captain?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Branch:</span> {captain?.branch}</p>
                    <p><span className="font-medium">Year:</span> {captain?.year}</p>
                    <p><span className="font-medium">URN:</span> {captain?.urn}</p>
                    <p><span className="font-medium">Sport:</span> {captain?.sport}</p>
                    <p><span className="font-medium">Position:</span> 
                      <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                        captain?.position ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {captain?.position || "Not Assigned"}
                      </span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      onClick={() => {
                        setSelectedCaptain(captain);
                        setIsEditing(false);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={!!selectedCaptain}
        onClose={() => {
          setSelectedCaptain(null);
          setEditingMemberIndex(null);
          setIsEditing(false);
        }}
      >
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Captain Details
          </ModalTitle>
        </ModalHeader>

        <ModalContent>
          {/* Show captain details */}
          {!isEditing && editingMemberIndex === null ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-foreground">{selectedCaptain?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Branch</label>
                  <p className="text-foreground">{selectedCaptain?.branch}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Year</label>
                  <p className="text-foreground">{selectedCaptain?.year}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">URN</label>
                  <p className="text-foreground">{selectedCaptain?.urn}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sport</label>
                  <p className="text-foreground">{selectedCaptain?.sport}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Position</label>
                  <p className="text-foreground">{selectedCaptain?.position || "Not Assigned"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-foreground">{selectedCaptain?.email || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-foreground">{selectedCaptain?.phone || "N/A"}</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members
                </h4>
                {selectedCaptain?.teamMembers && selectedCaptain?.teamMembers?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCaptain.teamMembers.map((member, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="font-medium">{member?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {member?.branch}, {member?.year} • URN: {member?.urn}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Email: {member?.email} • Phone: {member?.phone}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Position: {member?.position || selectedCaptain?.position || "N/A"}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => startEditingMember(member, index)}
                                variant="outline"
                                size="sm"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() =>
                                  handleDeleteMember(
                                    selectedCaptain.captainId,
                                    selectedCaptain.sessionId,
                                    index
                                  )
                                }
                                variant="destructive"
                                size="sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No team members added yet.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : null}

          {/* Member Editing Form */}
          {editingMemberIndex !== null && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">Edit Team Member</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(memberForm).map((field) => (
                  <div key={field} className="space-y-2">
                    <label className="text-sm font-medium text-foreground capitalize">
                      {field}
                    </label>
                    {field === "position" ? (
                      <Input
                        type="text"
                        name={field}
                        value={selectedCaptain.position || ""}
                        disabled
                        className="bg-muted"
                      />
                    ) : (
                      <Input
                        type="text"
                        name={field}
                        value={memberForm[field]}
                        onChange={handleMemberChange}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Captain Editing Form */}
          {isEditing && editingMemberIndex === null && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">Edit Captain</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(editForm).map((field) => (
                  <div key={field} className="space-y-2">
                    <label className="text-sm font-medium text-foreground capitalize">
                      {field}
                    </label>
                    {field === "position" ? (
                      <Select
                        name="position"
                        value={editForm.position || ""}
                        onChange={handleEditChange}
                      >
                        <option value="">Select Position</option>
                        <option value="1st">1st</option>
                        <option value="2nd">2nd</option>
                        <option value="3rd">3rd</option>
                        <option value="Participated">Participated</option>
                      </Select>
                    ) : (
                      <Input
                        type="text"
                        name={field}
                        value={editForm[field]}
                        onChange={handleEditChange}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </ModalContent>

        <ModalFooter>
          {!isEditing && editingMemberIndex === null ? (
            <div className="flex justify-between w-full">
              <Button
                onClick={() => handleDeleteCaptain(selectedCaptain._id)}
                variant="destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Captain
              </Button>
              <Button
                onClick={() => startEditing(selectedCaptain)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Captain
              </Button>
            </div>
          ) : editingMemberIndex !== null ? (
            <div className="flex justify-end gap-2 w-full">
              <Button
                onClick={() => setEditingMemberIndex(null)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMemberSubmit}
              >
                Save Changes
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2 w-full">
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSubmit}
              >
                Save Changes
              </Button>
            </div>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );


}

export default CaptainsAndTeams;
