import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { AlertCircle, Send, FileBadge2 } from "lucide-react";

const CaptainListCert = () => {
  const [captains, setCaptains] = useState([]);
  const navigate = useNavigate();

  const fetchCaptains = async () => {
    try {
      const res = await API.get("/admin/again/captains");
      setCaptains(res.data);
    } catch (err) {
      console.error("Error fetching captains", err);
    }
  };

  useEffect(() => {
    fetchCaptains();
  }, []);

  // ✅ Send Certificates
  const sendToCaptain = async (captainId) => {
    try {
      await API.post(`/admin/certificates/send/${captainId}`);
      // Optimistic update
      setCaptains((prev) =>
        prev.map((cap) =>
          cap._id === captainId ? { ...cap, certificateAvailable: true } : cap
        )
      );
      alert("Certificates sent!");
    } catch (err) {
      console.error("Error sending certificates", err);
      alert("Error sending certificates");
    }
  };

  // Filter lists based on certificateAvailable
  const pending = captains.filter((c) => !c.certificateAvailable);
  const sent = captains.filter((c) => c.certificateAvailable);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Captains with Position</h1>
          <p className="text-muted-foreground mt-1">Issue or send certificates to captains</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="mb-2">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border rounded-lg">
                <thead className="bg-muted">
                  <tr>
                    <th className="border px-4 py-2 text-left">Captain ID</th>
                    <th className="border px-4 py-2 text-left">Name</th>
                    <th className="border px-4 py-2 text-left">Position</th>
                    <th className="border px-4 py-2 text-left">Session</th>
                    <th className="border px-4 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-4 text-muted-foreground">
                        No Pending Certificates
                      </td>
                    </tr>
                  ) : (
                    pending.map((cap) => (
                      <tr key={cap._id} className="hover:bg-muted/50">
                        <td className="border px-4 py-2">{cap.captainId}</td>
                        <td className="border px-4 py-2">{cap.name}</td>
                        <td className="border px-4 py-2">{cap.position}</td>
                        <td className="border px-4 py-2">{cap.session ? cap.session.name : "—"}</td>
                        <td className="border px-4 py-2">
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => navigate(`/admin/certificates/${cap._id}`)}>
                              <FileBadge2 className="w-4 h-4 mr-2" /> Issue
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => sendToCaptain(cap._id)}>
                              <Send className="w-4 h-4 mr-2" /> Send
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

   
    </div>
  );
};

export default CaptainListCert;
