import { useState, useEffect, useRef } from "react"; 
import { motion } from "framer-motion"; 
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"; 
import { Button } from "../components/ui/button"; 
import { Input } from "../components/ui/input"; 
import { Select } from "../components/ui/select"; 
import { Download, FileSpreadsheet, FileText, Crown, Users, RefreshCw, AlertCircle, Filter, Calendar, Trophy } from "lucide-react"; 
import * as XLSX from "xlsx"; 
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, } from "docx"; 
import { saveAs } from "file-saver"; 
import API from "../services/api"; 

const CaptainExport = () => { 
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(null); 
  const [sessions, setSessions] = useState([]); 
  const [sports, setSports] = useState([]); 
  const [positions, setPositions] = useState(["1st", "2nd", "3rd", "Participant"]); 
  const [captains, setCaptains] = useState([]); 
  const [filteredCaptains, setFilteredCaptains] = useState([]); 
  const [filterName, setFilterName] = useState(""); 
  const [filterYear, setFilterYear] = useState(""); 
  const [selectedCaptains, setSelectedCaptains] = useState({}); 
  const selectAllRef = useRef(null); 

  // selected filters 
  const [selectedSession, setSelectedSession] = useState(""); 
  const [selectedSport, setSelectedSport] = useState(""); 
  const [selectedPosition, setSelectedPosition] = useState(""); 

  // fetch filters data (sessions, sports) 
  useEffect(() => { 
    const fetchFilters = async () => { 
      try { 
        setError(null); 
        const res = await API.get("/admin/captain-filters"); 
        setSessions(res.data.sessions); 
        setSports(res.data.sports); 
        setPositions(res.data.positions); 
      } catch (err) { 
        console.error("Error fetching captain filters:", err); 
        setError("Failed to load filter options"); 
      } 
    }; 
    fetchFilters(); 
  }, []); 

  // Fetch captains list
  useEffect(() => {
    const loadCaptains = async () => {
      try {
        const res = await API.get("/admin/captains");
        setCaptains(res.data || []);
      } catch (err) {
        console.error("Error fetching captains:", err);
      }
    };
    loadCaptains();
  }, []);

  // Apply client-side filters for list view
  useEffect(() => {
    const list = (captains || []).filter((c) => {
      const sessionId = (c?.session?._id || c?.session || "").toString();
      const matchesSession = !selectedSession || sessionId === selectedSession;
      const matchesSport = !selectedSport || (c?.sport || "") === selectedSport;
      const matchesPosition = !selectedPosition || (c?.position || "") === selectedPosition;
      const matchesName = !filterName || (c?.name || "").toLowerCase().includes(filterName.toLowerCase());
      const matchesYear = !filterYear || String(c?.year || "").toLowerCase().includes(String(filterYear).toLowerCase());
      return matchesSession && matchesSport && matchesPosition && matchesName && matchesYear;
    });
    setFilteredCaptains(list);
  }, [captains, selectedSession, selectedSport, selectedPosition, filterName, filterYear]);

  // Update Select All state (checked/indeterminate)
  useEffect(() => {
    if (!selectAllRef.current) return;
    const total = filteredCaptains.length;
    const selectedCount = filteredCaptains.filter((c) => selectedCaptains[c._id]).length;
    if (selectedCount === 0) {
      selectAllRef.current.checked = false;
      selectAllRef.current.indeterminate = false;
    } else if (selectedCount === total) {
      selectAllRef.current.checked = true;
      selectAllRef.current.indeterminate = false;
    } else {
      selectAllRef.current.checked = false;
      selectAllRef.current.indeterminate = true;
    }
  }, [filteredCaptains, selectedCaptains]);

  const handleCheckboxChange = (id) => {
    setSelectedCaptains((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    const updated = { ...selectedCaptains };
    filteredCaptains.forEach((c) => {
      updated[c._id] = isChecked;
    });
    setSelectedCaptains(updated);
  };

  const getSelectedCaptains = () => filteredCaptains.filter((c) => selectedCaptains[c._id]);

  const cleanEmail = (email) => {
    if (!email) return email;
    return email.replace(/^cp/i, "");
  };

  const fetchData = async () => { 
    const payload = { 
      session: selectedSession, 
      sport: selectedSport, 
      position: selectedPosition, 
    }; 
    const res = await API.post("/admin/export-captains", payload); 
    return res.data; 
  }; 

  // ✅ Export as Excel 
  const exportExcel = async () => { 
    try { 
      setLoading(true); 
      setError(null); 
      const data = getSelectedCaptains(); 
      let rows = []; 
      data.forEach((captain) => { 
        rows.push({ 
          Type: "Captain", 
          Name: captain.name, 
          URN: captain.urn, 
          Branch: captain.branch, 
          Year: captain.year, 
          Sport: captain.sport, 
          Phone: captain.phone, 
          Email: cleanEmail(captain.email), 
          Session: captain.session?.session || captain.sessionId || captain.session?._id || "-", 
        }); 
        captain.teamMembers?.forEach((m, idx) => { 
          rows.push({ 
            Type: `Member ${idx + 1}`, 
            Name: m.name, 
            URN: m.urn, 
            Branch: m.branch, 
            Year: m.year, 
            Phone: m.phone, 
            Email: m.email, 
          }); 
        }); 
        rows.push({}); // gap row 
      }); 
      const ws = XLSX.utils.json_to_sheet(rows); 
      const wb = XLSX.utils.book_new(); 
      XLSX.utils.book_append_sheet(wb, ws, "Captains"); 
      XLSX.writeFile(wb, "captains_with_team.xlsx"); 
    } catch (err) { 
      console.error("Error exporting Excel:", err); 
      setError("Failed to export Excel file"); 
    } finally { 
      setLoading(false); 
    } 
  }; 

  // ✅ Export as Word (DOCX) 
  const exportWord = async () => { 
    try { 
      setLoading(true); 
      setError(null); 
      const data = getSelectedCaptains(); 
      const sections = data.map((captain) => { 
        // Table header 
        const rows = [ 
          new TableRow({ 
            children: [ 
              new TableCell({ children: [new Paragraph("Name")] }), 
              new TableCell({ children: [new Paragraph("URN")] }), 
              new TableCell({ children: [new Paragraph("Branch-Year")] }), 
              new TableCell({ children: [new Paragraph("Phone")] }), 
              new TableCell({ children: [new Paragraph("Email")] }), 
            ], 
          }), 
        ]; 

        // Team members rows 
        captain.teamMembers?.forEach((m) => { 
          rows.push( 
            new TableRow({ 
              children: [ 
                new TableCell({ children: [new Paragraph(m.name || "-")] }), 
                new TableCell({ children: [new Paragraph(m.urn || "-")] }), 
                new TableCell({ children: [new Paragraph(`${m.branch || "-"} - ${m.year || "-"}`)] }), 
                new TableCell({ children: [new Paragraph(m.phone || "-")] }), 
                new TableCell({ children: [new Paragraph(m.email || "-")] }), 
              ], 
            }) 
          ); 
        }); 

        return { 
          children: [ 
            new Paragraph({ 
              children: [ 
                new TextRun({ 
                  text: `Captain: ${captain.name} (${captain.urn})`, 
                  bold: true, 
                  size: 28, 
                }), 
              ], 
            }), 
            new Paragraph(`Branch-Year: ${captain.branch} - ${captain.year}`), 
            new Paragraph(`Sport: ${captain.sport}`), 
            new Paragraph(`Phone: ${captain.phone} | Email: ${cleanEmail(captain.email)}`), 
            new Paragraph(`Session: ${captain.session?.session || captain.sessionId || captain.session?._id || "-"}`), 
            new Paragraph({ text: "Team Members:", bold: true }), 
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }), 
            new Paragraph({ text: "", spacing: { after: 400 } }), // gap before next captain 
          ], 
        }; 
      }); 

      const doc = new Document({ sections }); 
      const blob = await Packer.toBlob(doc); 
      saveAs(blob, "captains_with_team.docx"); 
    } catch (err) { 
      console.error("Error exporting Word:", err); 
      setError("Failed to export Word file"); 
    } finally { 
      setLoading(false); 
    } 
  }; 

  if (error) { 
    return ( 
      <div className="p-6"> 
        <div className="flex items-center justify-center min-h-[400px]"> 
          <div className="text-center"> 
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" /> 
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Data</h3> 
            <p className="text-muted-foreground mb-4">{error}</p> 
            <Button onClick={() => window.location.reload()} variant="outline"> 
              <RefreshCw className="w-4 h-4 mr-2" /> Try Again 
            </Button> 
          </div> 
        </div> 
      </div> 
    ); 
  } 

  return ( 
    <div className="space-y-6"> 
      {/* Header */} 
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} > 
        <div> 
          <h1 className="text-3xl font-bold text-foreground">Captain Export</h1> 
          <p className="text-muted-foreground mt-1">Export captain and team member data in Excel or Word format</p> 
        </div> 
      </motion.div> 

      {/* Filters */} 
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} > 
        <Card> 
          <CardHeader> 
            <CardTitle className="flex items-center gap-2"> 
              <Filter className="w-5 h-5 text-primary" /> Export Filters 
            </CardTitle> 
          </CardHeader> 
          <CardContent> 
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4"> 
              <div className="space-y-2"> 
                <label className="text-sm font-medium text-foreground flex items-center gap-2"> 
                  <Calendar className="w-4 h-4" /> Session 
                </label> 
                <Select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} > 
                  <option value="">All Sessions</option> 
                  {sessions.map((s, idx) => ( 
                    <option key={idx} value={s._id}> 
                      {s.session} 
                    </option> 
                  ))} 
                </Select> 
              </div> 
              <div className="space-y-2"> 
                <label className="text-sm font-medium text-foreground flex items-center gap-2"> 
                  <Trophy className="w-4 h-4" /> Sport 
                </label> 
                <Select value={selectedSport} onChange={(e) => setSelectedSport(e.target.value)} > 
                  <option value="">All Sports</option> 
                  {sports.map((sp, idx) => ( 
                    <option key={idx} value={sp}> 
                      {sp} 
                    </option> 
                  ))} 
                </Select> 
              </div> 
              <div className="space-y-2"> 
                <label className="text-sm font-medium text-foreground flex items-center gap-2"> 
                  <Crown className="w-4 h-4" /> Position 
                </label> 
                <Select value={selectedPosition} onChange={(e) => setSelectedPosition(e.target.value)} > 
                  <option value="">All Positions</option> 
                  {positions.map((p, idx) => ( 
                    <option key={idx} value={p}> 
                      {p} 
                    </option> 
                  ))} 
                </Select> 
              </div> 
              <div className="space-y-2"> 
                <label className="text-sm font-medium text-foreground">Search by Name</label> 
                <Input type="text" value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="e.g., abc" /> 
              </div> 
              <div className="space-y-2"> 
                <label className="text-sm font-medium text-foreground">Search by Year</label> 
                <Input type="text" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} placeholder="e.g., 3" /> 
              </div> 
            </div> 
          </CardContent> 
        </Card> 
      </motion.div> 

      {/* Export Buttons */} 
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} > 
        <Card> 
          <CardHeader> 
            <CardTitle className="flex items-center gap-2"> 
              <Download className="w-5 h-5 text-primary" /> Export Options 
            </CardTitle> 
          </CardHeader> 
          <CardContent> 
            {/* Captains List (filtered) */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">Captains ({filteredCaptains.length})</span>
                <label className="flex items-center gap-2 ml-auto cursor-pointer">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm font-medium text-foreground">Select All</span>
                </label>
              </div>
              {filteredCaptains.length === 0 ? (
  <div className="text-sm text-muted-foreground">No captains match the selected filters.</div>
) : (
  <div className="space-y-3 max-h-[320px] overflow-y-auto">
    {filteredCaptains.map((c, i) => (
      <div
        key={(c._id || i) + "-cap"}
        className="border border-border rounded p-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* ✅ Checkbox for individual captain */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!selectedCaptains[c._id]}
              onChange={() => handleCheckboxChange(c._id)}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
            />
            <span className="font-semibold text-foreground">{c.name}</span>
          </label>

          <div className="text-sm text-muted-foreground">{c.urn}</div>
        </div>

        <div className="mt-1 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
          <div>Sport: {c.sport || "-"}</div>
          <div>Position: {c.position || "-"}</div>
          <div>Session: {c.session?.session || c.session?.name || "-"}</div>
          <div>Email: {cleanEmail(c.email) || "-"}</div>
        </div>

        {Array.isArray(c.teamMembers) && c.teamMembers.length > 0 && (
          <div className="mt-2">
            <div className="text-xs font-medium text-foreground mb-1">
              Team Members ({c.teamMembers.length})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {c.teamMembers.map((m, idx) => (
                <div key={idx} className="text-xs text-muted-foreground">
                  {m.name} · {m.urn} · {m.branch} · {m.year}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ))}
  </div>
)}

            </div>
            <div className="flex flex-col sm:flex-row gap-4"> 
              <Button onClick={exportExcel} disabled={loading || getSelectedCaptains().length === 0} className="flex items-center gap-2 flex-1" variant="outline" > 
                {loading ? ( 
                  <> 
                    <RefreshCw className="w-4 h-4 animate-spin" /> Exporting... 
                  </> 
                ) : ( 
                  <> 
                    <FileSpreadsheet className="w-4 h-4" /> Export Excel ({getSelectedCaptains().length}) 
                  </> 
                )} 
              </Button> 
              <Button onClick={exportWord} disabled={loading || getSelectedCaptains().length === 0} className="flex items-center gap-2 flex-1" variant="outline" > 
                {loading ? ( 
                  <> 
                    <RefreshCw className="w-4 h-4 animate-spin" /> Exporting... 
                  </> 
                ) : ( 
                  <> 
                    <FileText className="w-4 h-4" /> Export Word ({getSelectedCaptains().length}) 
                  </> 
                )} 
              </Button> 
            </div> 
            <div className="mt-4 p-4 bg-muted rounded-lg"> 
              <div className="flex items-center gap-2 mb-2"> 
                <Users className="w-4 h-4 text-primary" /> 
                <span className="font-medium text-foreground">Export includes:</span> 
              </div> 
              <ul className="text-sm text-muted-foreground space-y-1"> 
                <li>• Captain information (name, URN, branch, year, sport, contact details)</li> 
                <li>• Team member details for each captain</li> 
                <li>• Session information</li> 
                <li>• Position assignments</li> 
              </ul> 
            </div> 
          </CardContent> 
        </Card> 
      </motion.div> 
    </div> 
  ); 
}; 

export default CaptainExport;
