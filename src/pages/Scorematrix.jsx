import { useEffect, useState } from "react";
import API from "../services/api";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select } from "../components/ui/select";
import { AlertCircle, BarChart, Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, TextRun } from 'docx';
import { saveAs } from 'file-saver';

export default function StudentsTable() {
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const exportExcel = () => {
    const rows = students.map((s, i) => ({
      Index: i+1,
      Name: s.name,
      URN: s.urn,
      Branch: s.branch,
      Year: s.year,
      Sports: Array.isArray(s.sports) ? s.sports.join(', ') : '',
      Positions: Array.isArray(s.positions) ? s.positions.map(p => (typeof p === 'string'? p : `${p.sport} (${p.position||'pending'})`)).join(', ') : '',
      Score: getScore(s)
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ScoreMatrix');
    XLSX.writeFile(wb, 'score_matrix.xlsx');
  };

  const exportWord = async () => {
    const header = new DocxTableRow({
      children: ['#','Name','URN','Branch','Year','Sports','Positions','Score'].map(t => new DocxTableCell({ children:[ new Paragraph({ children:[ new TextRun({ text: t, bold: true }) ] }) ] }))
    });
    const body = students.map((s, i) => new DocxTableRow({
      children: [
        i+1+'', s.name||'', s.urn||'', s.branch||'', s.year||'',
        Array.isArray(s.sports)? s.sports.join(', '):'',
        Array.isArray(s.positions)? s.positions.map(p => (typeof p==='string'? p : `${p.sport} (${p.position||'pending'})`)).join(', '):'',
        String(getScore(s))
      ].map(val => new DocxTableCell({ children:[ new Paragraph(String(val)) ] }))
    }));

    const table = new DocxTable({ rows: [header, ...body] });
    const doc = new Document({ sections: [{ children: [ new Paragraph({ children:[ new TextRun({ text: 'Score Matrix', bold: true, size: 28 }) ] }), table ] }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'score_matrix.docx');
  };

  // Selected sessions
  const [selectedSession1, setSelectedSession1] = useState("");
  const [selectedSession2, setSelectedSession2] = useState("");

  // 🔹 Fetch all sessions from backend
  useEffect(() => {
    API.get("/session")
      .then((res) => {
        if (!res.data) return;
        setSessions(res.data);
      })
      .catch((err) => {
        console.error("Error fetching sessions:", err);
        setError("Failed to load sessions");
      })
      .finally(() => setLoading(false));
  }, []);

  // 🔹 Fetch students when either session changes
  useEffect(() => {
    if (!selectedSession1 && !selectedSession2) return;

    const fetchStudents = async () => {
      try {
        setError(null);
        const promises = [];
        if (selectedSession1)
          promises.push(
            API.get("/admin/students-unique", { params: { sessionId: selectedSession1 } })
          );
        if (selectedSession2)
          promises.push(
            API.get("/admin/students-unique", { params: { sessionId: selectedSession2 } })
          );

        const results = await Promise.all(promises);

        // Merge students by URN to avoid duplicates and merge sports/positions
        const merged = {};
        results.forEach((res) => {
          (res.data || []).forEach((s) => {
            if (!merged[s.urn]) {
              merged[s.urn] = { ...s };
              // Ensure arrays
              merged[s.urn].sports = Array.isArray(s.sports) ? [...s.sports] : s.sports ? [s.sports] : [];
              merged[s.urn].positions = Array.isArray(s.positions)
                ? [...s.positions]
                : s.positions
                ? [s.positions]
                : [];
            } else {
              // Merge sports & positions
              if (Array.isArray(s.sports)) merged[s.urn].sports.push(...s.sports);
              else if (s.sports) merged[s.urn].sports.push(s.sports);

              if (Array.isArray(s.positions)) merged[s.urn].positions.push(...s.positions);
              else if (s.positions) merged[s.urn].positions.push(s.positions);

              // Optional: remove duplicates
              merged[s.urn].sports = [...new Set(merged[s.urn].sports)];
              merged[s.urn].positions = [...new Set(merged[s.urn].positions)];
            }
          });
        });

        setStudents(Object.values(merged));
      } catch (err) {
        console.error("Error fetching students:", err);
        setError("Failed to load students");
      }
    };

    fetchStudents();
  }, [selectedSession1, selectedSession2]);

  // 🔹 Score Calculation
  const getScore = (student) => {
  let total = 0;
  const multipliers = {
    international: { "1st": 60, "2nd": 58, "3rd": 56, participated: 55 },
    national: { "1st": 55, "2nd": 53, "3rd": 51, participated: 50 },
    state: { "1st": 50, "2nd": 48, "3rd": 46, participated: 45 },
    institute: { "1st": 45, "2nd": 43, "3rd": 41, participated: 15 },
  };

  const sportsArr = Array.isArray(student.sports) ? student.sports : [];
  const posArr = Array.isArray(student.positions) ? student.positions : [];

  for (let i = 0; i < sportsArr.length; i++) {
    const sport = sportsArr[i];
    const posValue = posArr[i];

    // 🔹 Handle both string or object
    let rawPos = "";
    if (typeof posValue === "string") rawPos = posValue.toLowerCase();
    else if (posValue && typeof posValue === "object") rawPos = (posValue.position || "").toLowerCase();

    let position = "";
    if (["participation", "participated"].includes(rawPos)) position = "participated";
    else if (rawPos.includes("1")) position = "1st";
    else if (rawPos.includes("2")) position = "2nd";
    else if (rawPos.includes("3")) position = "3rd";
    else if (rawPos === "pending") position = "pending";

    let level = "institute";
    if (typeof sport === "string") {
      if (/international/i.test(sport)) level = "international";
      else if (/national|inter\s*university/i.test(sport)) level = "national";
      else if (/state|inter\s*college|ptu|university/i.test(sport)) level = "state";
    }

    if (position === "pending") {
      const hasValidPos = posArr.some((p) => {
        if (typeof p === "string") return p && !/pending/i.test(p) && !/^\s*$/.test(p);
        else if (p && typeof p === "object") return p.position && !/pending/i.test(p.position) && !/^\s*$/.test(p.position);
        return false;
      });
      if (!hasValidPos) continue;
      position = "participated"; // fallback
    }

    total += multipliers[level][position] || 0;
  }

  if (student.isCaptain) total += 15;
  if (sportsArr.some((s) => typeof s === "string" && /gym|swimming|shooting/i.test(s))) total += 30;

  return total;
};

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[300px] text-muted-foreground">Loading score matrix...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <BarChart className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Students (Merged Sessions)</h1>
        </div>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Compare Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 mb-2 flex-wrap">
            {[1, 2].map((num) => (
              <div key={num}>
                <label className="block text-sm font-medium text-foreground mb-1">Session {num}</label>
                <Select
                  value={num === 1 ? selectedSession1 : selectedSession2}
                  onChange={(e) =>
                    num === 1 ? setSelectedSession1(e.target.value) : setSelectedSession2(e.target.value)
                  }
                >
                  <option value="">Select Session</option>
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {new Date(s.startDate).toLocaleString("default", { month: "short" })}–
                      {new Date(s.endDate).toLocaleString("default", { month: "short" })} {new Date(s.endDate).getFullYear()}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Students</span>
            <div className="flex items-center gap-2">
              <button onClick={exportExcel} className="inline-flex items-center gap-2 text-sm px-3 py-1 border rounded-md hover:bg-muted">
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button onClick={exportWord} className="inline-flex items-center gap-2 text-sm px-3 py-1 border rounded-md hover:bg-muted">
                <FileText className="w-4 h-4" /> Word
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border rounded-lg">
              <thead className="bg-muted">
                <tr>
                  <th className="border px-2 py-1 text-left">#</th>
                  <th className="border px-2 py-1 text-left">Name</th>
                  <th className="border px-2 py-1 text-left">URN</th>
                  <th className="border px-2 py-1 text-left">Branch</th>
                  <th className="border px-2 py-1 text-left">Year</th>
                  <th className="border px-2 py-1 text-left">Sports</th>
                  <th className="border px-2 py-1 text-left">Positions</th>
                  <th className="border px-2 py-1 text-left">Score</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.urn} className="hover:bg-muted/50">
                    <td className="border px-2 py-1">{i + 1}</td>
                    <td className="border px-2 py-1">{s.name}</td>
                    <td className="border px-2 py-1">{s.urn}</td>
                    <td className="border px-2 py-1">{s.branch}</td>
                    <td className="border px-2 py-1">{s.year}</td>
                    <td className="border px-2 py-1">{Array.isArray(s.sports) ? s.sports.join(", ") : ""}</td>
                    <td className="border px-2 py-1">
                      {Array.isArray(s.positions)
                        ? s.positions
                            .map((p) => (typeof p === "string" ? p : `${p.sport} (${p.position || "pending"})`))
                            .join(", ")
                        : ""}
                    </td>
                    <td className="border px-2 py-1">{getScore(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
