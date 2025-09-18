import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "../components/ui/modal";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  Search,
  Filter,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckSquare,
  Square,
  Eye,
  Calendar,
  User,
  GraduationCap,
  MapPin,
  Trophy
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  Document,
  Packer,
  Paragraph,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  TextRun,
  HeadingLevel,
  ImageRun,
  AlignmentType,
  TableRow,
  TableBorders,
  WidthType,
  TableCell,
  BorderStyle,
  TabStopType
} from "docx";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import API from "../services/api";

// 🔹 Helper functions
const fetchImageBuffer = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image from ${url}`);
    const blob = await response.blob();
    return await blob.arrayBuffer();
  } catch (err) {
    console.error("Image fetch error:", err);
    return null;
  }
};
const fetchImagesBuffer = fetchImageBuffer;

// 🔹 Export functions (Excel & Word)
const exportToExcel = async (students) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Students");

  // Column widths
  worksheet.columns = [
    { width: 8 },
    { width: 20 },
    { width: 20 },
    { width: 15 },
    { width: 20 },
    { width: 25 },
    { width: 10 },
    { width: 10 },
    { width: 22 },
    { width: 18 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 15 },
    { width: 20 },
    { width: 30 },
    { width: 20 },
    { width: 15 },
    { width: 10 },
  ];

  // Merge header cells
  worksheet.mergeCells("G2:H2");
  worksheet.mergeCells("I2:I3");
  worksheet.mergeCells("J2:K2");
  worksheet.mergeCells("L2:M2");
  worksheet.mergeCells("N2:N3");
  worksheet.mergeCells("O2:O3");
  worksheet.mergeCells("P2:P3");
  worksheet.mergeCells("Q2:Q3");
  worksheet.mergeCells("R2:R3");
  worksheet.mergeCells("S2:S3");
  ["A", "B", "C", "D", "E", "F"].forEach((col) =>
    worksheet.mergeCells(`${col}2:${col}3`)
  );

  // Row 2 headers
  worksheet.getCell("A2").value = "Sr. No";
  worksheet.getCell("B2").value = "Name";
  worksheet.getCell("C2").value = "Father's Name";
  worksheet.getCell("D2").value = "Date of Birth";
  worksheet.getCell("E2").value = "University Reg. No";
  worksheet.getCell("F2").value = "Present Branch/Year";
  worksheet.getCell("G2").value = "Year of Passing";
  worksheet.getCell("I2").value = "Date of First Admission";
  worksheet.getCell("J2").value = "Last Examination";
  worksheet.getCell("L2").value = "No of years of";
  worksheet.getCell("N2").value =
    "No of participation in Inter Varsity Tournament";
  worksheet.getCell("O2").value = "Signature of Student";
  worksheet.getCell("P2").value = "Home Address with Phone No";
  worksheet.getCell("Q2").value = "Passport Size Photograph";
  worksheet.getCell("R2").value = "Activity";
  worksheet.getCell("S2").value = "Position";

  // Row 3 subheaders
  worksheet.getCell("G3").value = "Matric";
  worksheet.getCell("H3").value = "+2";
  worksheet.getCell("J3").value = "Name";
  worksheet.getCell("K3").value = "Year";
  worksheet.getCell("L3").value = "Graduate";
  worksheet.getCell("M3").value = "PG";

  // Style headers
  [2, 3].forEach((rowNum) => {
    const row = worksheet.getRow(rowNum);
    row.height = 35;
    row.eachCell((cell) => {
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      cell.font = { bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Data rows
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const activity = s.sports?.join(", ") || "";
    const position = s.events?.map((e) => e.position).join(", ") || "";

    const row = worksheet.addRow([
      i + 1,
      s.name || "",
      s.fatherName || "",
      s.dob || "",
      s.universityRegNo || "",
      s.branchYear || "",
      s.matricYear || "",
      s.plusTwoYear || "",
      s.firstAdmissionYear || "",
      s.lastExam || "",
      s.lastExamYear || "",
      s.interCollegeGraduateCourse || "",
      s.interCollegePgCourse || "",
      s.yearsOfParticipation || "",
      "",
      s.addressWithPhone || "",
      "",
      activity,
      position,
    ]);

    row.height = 90;

    if (s.signatureUrl) {
      try {
        const buffer = await fetchImagesBuffer(s.signatureUrl);
        const imageId = workbook.addImage({ buffer, extension: "png" });
        worksheet.addImage(imageId, {
          tl: { col: 14, row: i + 3.3 },
          ext: { width: 100, height: 40 },
        });
      } catch {}
    }

    if (s.passportPhotoUrl) {
      try {
        const buffer = await fetchImagesBuffer(s.passportPhotoUrl);
        const imageId = workbook.addImage({ buffer, extension: "png" });
        worksheet.addImage(imageId, {
          tl: { col: 16, row: i + 3.1 },
          ext: { width: 70, height: 80 },
        });
      } catch {}
    }
  }

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), "students.xlsx");
};

// 🔹 Word export helpers
const safeText = (val) => (!val ? "" : val.toString());
const formatDate = (val) => {
  if (!val) return "";
  if (/^\d{4}$/.test(val)) return val;
  if (/^\d{4}-\d{2}$/.test(val)) {
    const [y, m] = val.split("-");
    const monthNames = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];
    return `${monthNames[parseInt(m)-1]} ${y}`;
  }
  return val.toString();
};

const exportToWord = async (students) => {
  const tableRows = [];

  // Header
  tableRows.push(
    new DocxTableRow({
      children: [
        ...["Sr. No","Name","Father’s Name","DOB","Reg No","Branch/Year"]
          .map(t => new DocxTableCell({
            rowSpan: 2,
            children: [ new Paragraph({ children: [ new TextRun({ text: t, bold:true }) ] }) ]
          })),
        new DocxTableCell({
          columnSpan: 2,
          children: [ new Paragraph({ children: [ new TextRun({ text: "Year of Passing", bold:true }) ] }) ]
        }),
        new DocxTableCell({
          rowSpan: 2,
          children: [ new Paragraph({ children: [ new TextRun({ text: "First Admission", bold:true }) ] }) ]
        }),
        new DocxTableCell({
          columnSpan: 2,
          children: [ new Paragraph({ children: [ new TextRun({ text: "Last Exam", bold:true }) ] }) ]
        }),
        new DocxTableCell({
          columnSpan: 3,
          children: [ new Paragraph({ children: [ new TextRun({ text: "Years of Participation", bold:true }) ] }) ]
        }),
        ...["Signature","Address","Passport","Activity","Position"]
          .map(t => new DocxTableCell({
            rowSpan: 2,
            children: [ new Paragraph({ children: [ new TextRun({ text: t, bold:true }) ] }) ]
          }))
      ]
    })
  );
  tableRows.push(
    new DocxTableRow({
      children: ["Matric","+2","Name","Year","Graduate","PG","Inter-Varsity"]
        .map(t => new DocxTableCell({
          children: [ new Paragraph({ children: [ new TextRun({ text: t, bold:true }) ] }) ]
        }))
    })
  );

  for (const [i,s] of students.entries()) {
    const signatureImage = s.signatureUrl ? await fetchImageBuffer(s.signatureUrl) : null;
    const passportImage = s.passportPhotoUrl ? await fetchImageBuffer(s.passportPhotoUrl) : null;
    const activity = safeText(s.sports?.join(", "));
    const position = s.events?.map(e=>`${safeText(e.activity)} : ${safeText(e.position)}`).join(", ") || "";

    const cells = [
      (i+1).toString(),
      safeText(s.name),
      safeText(s.fatherName),
      safeText(s.dob),
      safeText(s.universityRegNo),
      safeText(s.branchYear),
      safeText(s.matricYear),
      safeText(s.plusTwoYear),
      formatDate(s.firstAdmissionYear),
      safeText(s.lastExam),
      safeText(s.lastExamYear),
      safeText(s.interCollegeGraduateCourse),
      safeText(s.interCollegePgCourse),
      safeText(s.yearsOfParticipation),
      signatureImage ? new ImageRun({ data:signatureImage, transformation:{ width:60, height:30 } }) : "",
      safeText(s.addressWithPhone),
      passportImage ? new ImageRun({ data:passportImage, transformation:{ width:60, height:60 } }) : "",
      activity,
      position
    ];

    tableRows.push(
      new DocxTableRow({
        children: cells.map(val =>
          new DocxTableCell({
            children:[ new Paragraph({ children:[ val instanceof ImageRun ? val : new TextRun(val) ] }) ]
          })
        )
      })
    );
  }

const doc = new Document({
  sections: [
    {
      properties: { page: { size: { orientation: "landscape" } } },
      children: [
        // ====== UNIVERSITY HEADER ======
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "I.K. GUJRAL PUNJAB TECHNICAL UNIVERSITY", bold: true, size: 28 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Department of Physical Education & Sports", bold: true, size: 24 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Eligibility Proforma for University Tournaments", bold: true, size: 22 }),
          ],
          spacing: { after: 200 },
        }),

new Paragraph({
  tabStops: [
    { type: TabStopType.LEFT, position: 500 },
    { type: TabStopType.CENTER, position: 5000 },   // Tournament center me
    { type: TabStopType.CENTER, position: 7500 },   // Year bhi center ke paas
    { type: TabStopType.RIGHT, position: 8100 },   // Manager bilkul right me
  ],
  children: [
    // Left side → College
    new TextRun({ text: "College: ", bold: false }),
    new TextRun({ text: students[0]?.college || "Guru Nanak Dev Engineering College", bold: true }),

    // Category
    new TextRun({ text: "\tCategory: ", bold: false }),
    new TextRun({ text: students[0]?.category || "Men", bold: true, italics: true }),

    // Tournament (center-left)
    new TextRun({
      text:
        "\tPTU Inter-college " +
        (students[0]?.tournament || "________") +
        " Tournament",
      bold: true,
    }),

    // Year (center-right)
    new TextRun({
      text: "\tYear: " + (students[0]?.year || "2024-25"),
      bold: true,
    }),

    // Manager (right aligned)
    new TextRun({ text: "\tManager: ", bold: false }),
    new TextRun({ text: students[0]?.manager || "Dr. Gunjan Bhardawaj", bold: true }),
  ],
  spacing: { after: 300 },
}),



        // ====== MAIN STUDENT TABLE ======
        new DocxTable({ rows: tableRows }),

        ],
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, "students.docx");
};

// 🔹 PDF export function
const loadImage = (url, maxWidth = 150, maxHeight = 200) =>
  new Promise((resolve) => {
    if (!url) return resolve(null);

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // resize ratio maintain
      const scale = Math.min(maxWidth / width, maxHeight / height, 1);
      width *= scale;
      height *= scale;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL("image/jpeg", 0.7)); // compressed JPG
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

// 🔹 Main Export
const exportToPDF = async (students, category, sport, year, manager,pdfCollege) => {
  const batchSize = 50; // students per PDF
  const totalBatches = Math.ceil(students.length / batchSize);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batchStudents = students.slice(
      batchIndex * batchSize,
      (batchIndex + 1) * batchSize
    );

    const doc = new jsPDF("landscape", "pt", "a4");
    doc.setFont("times", "normal");

    // 🔹 Header
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text(
      "I.K. GUJRAL PUNJAB TECHNICAL UNIVERSITY",
      doc.internal.pageSize.width / 2,
      30,
      { align: "center" }
    );

    doc.setFontSize(11);
    doc.text(
      "Department of Physical Education & Sports",
      doc.internal.pageSize.width / 2,
      50,
      { align: "center" }
    );

    doc.text(
      "Eligibility Proforma for University Tournaments",
      doc.internal.pageSize.width / 2,
      70,
      { align: "center" }
    );

    // 🔹 College Info Row
    doc.setFontSize(10);
    let y = 90;
    let x = 40;

const collegeText = `College: ${pdfCollege}    `;
doc.text(collegeText, x, y);
x += doc.getTextWidth(collegeText);


    const addField = (label, value) => {
      doc.setFont("times", "normal");
      doc.text(label, x, y);
      let lw = doc.getTextWidth(label);
      doc.setFont("times", "bold");
      doc.text(value, x + lw, y);
      let vw = doc.getTextWidth(value);
      doc.line(x + lw, y + 2, x + lw + vw, y + 2);
      x += lw + vw + 20;
    };

    addField("Category: ", category);
    addField("PTU Inter-college ", `${sport} Tournament`);
    addField("Year: ", year);
    addField("Manager: ", manager);

    // 🔹 Table headers
    const head = [
      [
        "Sr. No",
        "Name",
        "Father's Name",
        "Date of Birth",
        "University Reg No",
        "Branch/Year",
        { content: "Year of Passing", colSpan: 2 },
        "First Admission",
        { content: "Last Exam", colSpan: 2 },
        { content: "Participation (Inter College)", colSpan: 2 },
        "Inter Varsity Years",
        "Signature",
        "Home Address",
        "Passport Photo",
      ],
      [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "Matric 7(a)",
        "+2 7(b)",
        "8",
        "Name 9(a)",
        "Year 9(b)",
        "Graduate 10(a)",
        "PG 10(b)",
        "11",
        "12",
        "13",
        "14",
      ],
    ];

    // 🔹 Student rows
    const body = await Promise.all(
      batchStudents.map(async (s, index) => {
        const photo = await loadImage(s.passportPhotoUrl);
        const signature = await loadImage(s.signatureUrl);

      // helper function -> undefined/null to "", baaki values same rahengi
    const safeVal = (val) => (val === undefined || val === null ? "" : val);

    return [
      index + 1,
      safeVal(s.name),
      safeVal(s.fatherName),
      safeVal(s.dob),
      safeVal(s.universityRegNo),
      safeVal(s.branchYear),
      safeVal(s.matricYear),
      safeVal(s.plusTwoYear),
      safeVal(s.firstAdmissionYear),
      safeVal(s.lastExam),
      safeVal(s.lastExamYear),
      safeVal(s.interCollegeGraduateCourse),
      safeVal(s.interCollegePgCourse),
      safeVal(s.yearsOfParticipation),
      { content: signature ? "" : "", styles: { minCellHeight: 40 } },
      safeVal(s.addressWithPhone),
      { content: photo ? "" : "", styles: { minCellHeight: 50 } },
    ];
  })
);

    autoTable(doc, {
      head,
      body,
      startY: 120,
      theme: "grid",
      styles: {
        font: "times",
        fontSize: 9,
        halign: "center",
        valign: "middle",
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
      },
      headStyles: {
        font: "times",
        fontSize: 8,
        textColor: 0,
        fillColor: [255, 255, 255],
      },
      tableWidth: "auto",
        columnStyles: {
    11: { cellWidth: 50 },  
  },
didDrawCell: (data) => {
  // Sirf body ke liye run kare
  if (data.section === "body") {
    // Signature column (14th index)
    if (data.column.index === 14) {
      const sig = batchStudents[data.row.index]?.signatureUrl;
      if (sig) {
        const imgWidth = 40;
        const imgHeight = 20;
        const x = data.cell.x + (data.cell.width - imgWidth) / 2;
        const y = data.cell.y + (data.cell.height - imgHeight) / 2;
        doc.addImage(sig, "JPEG", x, y, imgWidth, imgHeight);
      }
    }

    // Passport photo column (16th index)
    if (data.column.index === 16) {
      const photo = batchStudents[data.row.index]?.passportPhotoUrl;
      if (photo) {
        const imgWidth = 35;
        const imgHeight = 45;
        const x = data.cell.x + (data.cell.width - imgWidth) / 2;
        const y = data.cell.y + (data.cell.height - imgHeight) / 2;
        doc.addImage(photo, "JPEG", x, y, imgWidth, imgHeight);
      }
    }
  }
}
,
    });

// 🔹 Footer (certifications + signatures)
const pageHeight = doc.internal.pageSize.height;
const pageWidth = doc.internal.pageSize.width;
let certY = pageHeight - 110; // upar thoda jagah
doc.setFont("times", "normal");
doc.setFontSize(10);

// Teen columns ki width
const colWidth = pageWidth / 3 - 40;
const col1X = 40;
const col2X = col1X + colWidth + 20;
const col3X = col2X + colWidth + 20;

const certs = [
  "Certified that particulars given above have been verified and checked.",
  "Certified that the players are not employed anywhere on full time basis.",
  "Certified that the eligibility of the students listed herein has been verified and they are eligible.",
];

// Wrap text aur draw karo
certs.forEach((c, i) => {
  const x = [col1X, col2X, col3X][i];
  const lines = doc.splitTextToSize(c, colWidth);
  doc.text(lines, x, certY);
});

// 🔹 Signatures line
let signY = pageHeight - 50;
doc.setFont("times", "normal");
doc.text("Date: ___________", col1X, signY);

doc.text("Signature of DPE/Lecturer Physical Edu.", col2X, signY);

doc.setFont("times", "bold");
doc.text("PRINCIPAL", col3X, signY);
doc.setFont("times", "normal");
doc.text("(Seal of College)", col3X, signY + 15);


    // Save per batch
    doc.save(`Eligibility_Form_Part${batchIndex + 1}.pdf`);
  }
};

// 🔹 Main Component
const StudentExport = () => {
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterURN, setFilterURN] = useState("");
  const [selectedStudents, setSelectedStudents] = useState({});
  const [filterActivity, setFilterActivity] = useState("");
  const selectAllRef = useRef(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔹 PDF customization inputs
  const [pdfCategory, setPdfCategory] = useState('Men');
  const [pdfSport, setPdfSport] = useState('Badminton');
  const [pdfYear, setPdfYear] = useState('2024-25');
  const [pdfManager, setPdfManager] = useState('Dr. Gunjan Bhardwaj');
  const [pdfCollege, setPdfCollege] = useState('Guru Nanak Dev Engg. College Ludhiana');


  // 🔹 Preview state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(null); // 'excel' | 'word' | 'pdf' | null

  // Load sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setError(null);
        const res = await API.get(`/admin/sessions`);
        setSessions(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load sessions");
      } finally {
        setLoading(false);
      }
    };
    loadSessions();
  }, []);

  // Load all students for selected session
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedSession) return;
      try {
        setError(null);
        const res = await API.get(`/admin/export?session=${selectedSession}`);
        setStudents(res.data);
        const obj = {};
        res.data.forEach((s) => {
          obj[s.universityRegNo] = false;
        });
        setSelectedStudents(obj);
      } catch (err) {
        console.error(err);
        setError("Failed to load students");
      }
    };
    loadStudents();
  }, [selectedSession]);

  const handleCheckboxChange = (urn) => {
    setSelectedStudents((prev) => ({
      ...prev,
      [urn]: !prev[urn],
    }));
  };

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    const newSelection = { ...selectedStudents };
    
    // Get filtered students (same logic as in the component)
    const visibleStudents = students.filter((s) => {
      const activityText = s.sports?.join(", ").toLowerCase() || "";
      return (
        (!filterName || s.name.toLowerCase().includes(filterName.toLowerCase())) &&
        (!filterURN || s.universityRegNo.toLowerCase().includes(filterURN.toLowerCase())) &&
        (!filterActivity || activityText.includes(filterActivity.toLowerCase()))
      );
    });
    
    // Update selection for all visible students
    visibleStudents.forEach((student) => {
      newSelection[student.universityRegNo] = isChecked;
    });
    
    setSelectedStudents(newSelection);
  };

  // update select all state
  useEffect(() => {
    if (!selectAllRef.current) return;
    const visibleStudents = students.filter((s) => {
      const activityText = s.sports?.join(", ").toLowerCase() || "";
      return (
        (!filterName || s.name.toLowerCase().includes(filterName.toLowerCase())) &&
        (!filterURN || s.universityRegNo.toLowerCase().includes(filterURN.toLowerCase())) &&
        (!filterActivity || activityText.includes(filterActivity.toLowerCase()))
      );
    });
    const total = visibleStudents.length;
    const selectedCount = visibleStudents.filter((s) => selectedStudents[s.universityRegNo]).length;
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
  }, [students, filterName, filterURN, filterActivity, selectedStudents]);

  const filteredStudents = students.filter((s) => {
    const activityText = s.sports?.join(", ").toLowerCase() || "";
    return (
      (!filterName || s.name.toLowerCase().includes(filterName.toLowerCase())) &&
      (!filterURN || s.universityRegNo.toLowerCase().includes(filterURN.toLowerCase())) &&
      (!filterActivity || activityText.includes(filterActivity.toLowerCase()))
    );
  });

  const getSelectedStudents = () => {
    return filteredStudents.filter((student) => selectedStudents[student.universityRegNo]);
  };

  const openPreview = (mode) => {
    if (getSelectedStudents().length === 0) return;
    setPreviewMode(mode);
    setIsPreviewOpen(true);
  };

  const handleConfirmExport = async () => {
    const data = getSelectedStudents();
    if (previewMode === "excel") {
      await exportToExcel(data);
    } else if (previewMode === "word") {
      await exportToWord(data);
    } else if (previewMode === "pdf") {
      await exportToPDF(data, pdfCategory, pdfSport, pdfYear, pdfManager,pdfCollege);
    }
    setIsPreviewOpen(false);
    setPreviewMode(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg text-muted-foreground">Loading export data...</span>
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
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Data</h3>
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
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate("/admin")} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Export Students</h1>
            <p className="text-muted-foreground mt-1">Export student data in Excel or Word format</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Session
                </label>
                <Select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                >
                  <option value="">-- Select Session --</option>
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.session}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search by Name
                </label>
                <Input
                  type="text"
                  placeholder="Search by name..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Search by URN
                </label>
                <Input
                  type="text"
                  placeholder="Search by URN..."
                  value={filterURN}
                  onChange={(e) => setFilterURN(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Search by Activity
                </label>
                <Input
                  type="text"
                  placeholder="Search by activity..."
                  value={filterActivity}
                  onChange={(e) => setFilterActivity(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
            
      {/* Students List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Students ({filteredStudents.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm font-medium text-foreground">Select All</span>
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Students Found</h3>
                <p className="text-muted-foreground">No students available for the selected session and filters.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {filteredStudents.map((stu, index) => (
                  <motion.div
                    key={stu.universityRegNo}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors ${
                      selectedStudents[stu.universityRegNo] ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <input
                          type="checkbox"
                          checked={!!selectedStudents[stu.universityRegNo]}
                          onChange={() => handleCheckboxChange(stu.universityRegNo)}
                          className="w-4 h-4 text-primary"
                        />
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{stu.name}</h3>
                          <p className="text-sm text-muted-foreground">Father: {stu.fatherName}</p>
                          <p className="text-sm text-muted-foreground">DOB: {stu.dob}</p>
                          <p className="text-sm text-muted-foreground">Gender: {stu.gender}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">URN: {stu.universityRegNo}</p>
                          <p className="text-sm text-muted-foreground">Branch/Year: {stu.branchYear}</p>
                          <p className="text-sm text-muted-foreground">First Admission: {stu.firstAdmissionYear}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Matric: {stu.matricYear}</p>
                          <p className="text-sm text-muted-foreground">+2: {stu.plusTwoYear}</p>
                          <p className="text-sm text-muted-foreground">Last Exam: {stu.lastExam} ({stu.lastExamYear})</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Graduate Years: {stu.interCollegeGraduateCourse}</p>
                          <p className="text-sm text-muted-foreground">PG Years: {stu.interCollegePgCourse}</p>
                          <p className="text-sm text-muted-foreground">Inter Varsity: {stu.yearsOfParticipation}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Address: {stu.addressWithPhone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Activity: {stu.sports?.join(", ")}</p>
                          <p className="text-sm text-muted-foreground">
                            Position: {stu.events?.map((e) => `${e.activity}: ${e.position}`).join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Export Buttons */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Export Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => openPreview("excel")}
                disabled={getSelectedStudents().length === 0}
                className="flex items-center gap-2 flex-1"
                variant="outline"
              >
                <Eye className="w-4 h-4" />
                Preview Excel ({getSelectedStudents().length})
              </Button>
              <Button
                onClick={() => openPreview("word")}
                disabled={getSelectedStudents().length === 0}
                className="flex items-center gap-2 flex-1"
                variant="outline"
              >
                <Eye className="w-4 h-4" />
                Preview Word ({getSelectedStudents().length})
              </Button>
              <Button
                onClick={() => openPreview("pdf")}
                disabled={getSelectedStudents().length === 0}
                className="flex items-center gap-2 flex-1"
                variant="outline"
              >
                <Eye className="w-4 h-4" />
                Preview PDF ({getSelectedStudents().length})
              </Button>
            </div>

            {/* PDF Customization Inputs */}
            <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="font-medium text-foreground">PDF Customization (for Eligibility PDF)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Category:</label>
                  <Select
                    value={pdfCategory}
                    onChange={(e) => setPdfCategory(e.target.value)}
                    className="bg-background text-foreground border-border"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Sport:</label>
                  <Input
                    type="text"
                    value={pdfSport}
                    onChange={(e) => setPdfSport(e.target.value)}
                    placeholder="e.g., Badminton"
                    className="bg-background text-foreground border-border placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Year:</label>
                  <Input
                    type="text"
                    value={pdfYear}
                    onChange={(e) => setPdfYear(e.target.value)}
                    placeholder="e.g., 2024-25"
                    className="bg-background text-foreground border-border placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
  <label className="text-sm font-medium text-foreground">College:</label>
  <Select
    value={pdfCollege}
    onChange={(e) => setPdfCollege(e.target.value)}
    className="bg-background text-foreground border-border"
  >
    <option value="Guru Nanak Dev Engg. College, Ludhiana">
      Guru Nanak Dev Engg. College, Ludhiana
    </option>
    <option value="GNDEC School of Architecture, Ludhiana">
      GNDEC School of Architecture, Ludhiana
    </option>
  </Select>
</div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Manager:</label>
                  <Select
                    value={pdfManager}
                    onChange={(e) => setPdfManager(e.target.value)}
                    className="bg-background text-foreground border-border"
                  >
                    <option value="Dr. Gunjan Bhardwaj">Dr. Gunjan Bhardwaj</option>
                    <option value="Prof. Suminder Singh">Prof. Suminder Singh</option>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">Export includes:</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Complete student information (personal, academic, contact details)</li>
                <li>• Sports activities and position assignments</li>
                <li>• Academic history and examination records</li>
                <li>• Student signatures and passport photos (if available)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={() => { setIsPreviewOpen(false); setPreviewMode(null); }}>
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            {previewMode === "excel" ? "Preview for Excel Export" : 
             previewMode === "word" ? "Preview for Word Export" : 
             "Preview for PDF Export"}
          </ModalTitle>
        </ModalHeader>
        <ModalContent>
            <div className="p-4 overflow-auto space-y-4">
              {previewMode === "word" && (
                <>
                  <div className="text-2xl font-bold">Student List</div>
                  <div className="text-sm font-semibold">Session: {getSelectedStudents().length>0 && getSelectedStudents()[0].session ? getSelectedStudents()[0].session : "N/A"}</div>
                </>
              )}

              {previewMode === "excel" && (
                <div className="w-full overflow-auto">
                 {/* 🔹 Custom Header Start */}
    <div className="mb-4">
      {/* Top Center Block */}
      <div className="text-center">
        <h2 className="font-bold text-lg uppercase">
          I.K. GUJRAL PUNJAB TECHNICAL UNIVERSITY
        </h2>
        <p className="font-semibold">Department of Physical Education &amp; Sports</p>
        <p className="font-semibold underline">
          Eligibility Proforma for University Tournaments
        </p>
      </div>

      {/* Second Row with Left / Center / Right */}
      <div className="grid grid-cols-3 text-sm mt-2 items-center">
        {/* Left */}
        <div className="text-left">
          College:{" "}
          <span className="font-bold">
            Guru Nanak Dev Engg. College Ludhiana
          </span>
        </div>

        {/* Center */}
        <div className="text-center">
          PTU Inter-college{" "}
          <span className="font-bold underline">Badminton</span> Tournament
          <br />
          Year: <span className="font-bold underline">2024-25</span>
        </div>

        {/* Right */}
        <div className="text-right">
          Manager:{" "}
          <span className="font-bold underline">Dr. Gunjan Bhardwaj</span>
        </div>
      </div>

      {/* Third Row with Category + Session */}
      <div className="flex flex-col items-center mt-1 text-sm">
        <div>
          Category: <span className="font-bold ml-1">Men</span>
        </div>
        <div>
          Session:{" "}
          <span className="font-bold ml-1">
            {getSelectedStudents().length > 0 && getSelectedStudents()[0].session
              ? getSelectedStudents()[0].session
              : "N/A"}
          </span>
        </div>
      </div>
    </div>
    {/* 🔹 Custom Header End */}

                  <table className="min-w-full border-collapse">
                    <thead>
                      {/* Session header row (A1:S1) */}
                      <tr>
                        <th colSpan={19} className="border p-2 text-center font-bold">Session: {getSelectedStudents().length>0 && getSelectedStudents()[0].session ? getSelectedStudents()[0].session : "N/A"}</th>
                      </tr>
                      {/* Row 2 headers with merges like Excel */}
                      <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                        <th className="border p-2" rowSpan={2}>Sr. No</th>
                        <th className="border p-2" rowSpan={2}>Name</th>
                        <th className="border p-2" rowSpan={2}>Father's Name</th>
                        <th className="border p-2" rowSpan={2}>Date of Birth</th>
                        <th className="border p-2" rowSpan={2}>University Reg. No</th>
                        <th className="border p-2" rowSpan={2}>Present Branch/Year</th>
                        <th className="border p-2" colSpan={2}>Year of Passing</th>
                        <th className="border p-2" rowSpan={2}>Date of First Admission</th>
                        <th className="border p-2" colSpan={2}>Last Examination</th>
                        <th className="border p-2" colSpan={2}>No of years of</th>
                        <th className="border p-2" rowSpan={2}>No of participation in Inter Varsity Tournament</th>
                        <th className="border p-2" rowSpan={2}>Signature of Student</th>
                        <th className="border p-2" rowSpan={2}>Home Address with Phone No</th>
                        <th className="border p-2" rowSpan={2}>Passport Size Photograph</th>
                        <th className="border p-2" rowSpan={2}>Activity</th>
                        <th className="border p-2" rowSpan={2}>Position</th>
                      </tr>
                      {/* Row 3 subheaders */}
                      <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                        <th className="border p-2">Matric</th>
                        <th className="border p-2">+2</th>
                        <th className="border p-2">Name</th>
                        <th className="border p-2">Year</th>
                        <th className="border p-2">Graduate</th>
                        <th className="border p-2">PG</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {getSelectedStudents().length === 0 ? (
                        <tr>
                          <td colSpan={19} className="text-center p-4 text-gray-500">No rows selected</td>
                        </tr>
                      ) : (
                        getSelectedStudents().map((s, idx) => (
                          <tr key={s.universityRegNo} className="hover:bg-orange-50 dark:hover:bg-orange-900/20 transition">
                            <td className="border p-2 text-center">{idx+1}</td>
                            <td className="border p-2">{s.name || ""}</td>
                            <td className="border p-2">{s.fatherName || ""}</td>
                            <td className="border p-2">{s.dob || ""}</td>
                            <td className="border p-2">{s.universityRegNo || ""}</td>
                            <td className="border p-2">{s.branchYear || ""}</td>
                            <td className="border p-2">{s.matricYear || ""}</td>
                            <td className="border p-2">{s.plusTwoYear || ""}</td>
                            <td className="border p-2">{s.firstAdmissionYear || ""}</td>
                            <td className="border p-2">{s.lastExam || ""}</td>
                            <td className="border p-2">{s.lastExamYear || ""}</td>
                            <td className="border p-2">{s.interCollegeGraduateCourse || ""}</td>
                            <td className="border p-2">{s.interCollegePgCourse || ""}</td>
                            <td className="border p-2">{s.yearsOfParticipation || ""}</td>
                            <td className="border p-2 text-center">
                              {s.signatureUrl ? <img src={s.signatureUrl} alt="signature" className="inline-block" style={{ width: 100, height: 40, objectFit: 'contain' }} /> : ""}
                            </td>
                            <td className="border p-2">{s.addressWithPhone || ""}</td>
                            <td className="border p-2 text-center">
                              {s.passportPhotoUrl ? <img src={s.passportPhotoUrl} alt="passport" className="inline-block" style={{ width: 70, height: 80, objectFit: 'cover' }} /> : ""}
                            </td>
                            <td className="border p-2">{s.sports?.join(", ") || ""}</td>
                            <td className="border p-2">{s.events?.map(e=>e.position).join(", ") || ""}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {previewMode === "pdf" && (
                <div className="w-full overflow-auto">
                  {/* 🔹 Custom Header Section (PDF style) */}
                  <div className="mb-4">
                    {/* Top Center */}
                    <div className="text-center">
                      <h2 className="font-bold text-lg uppercase">
                        I.K. GUJRAL PUNJAB TECHNICAL UNIVERSITY
                      </h2>
                      <p className="font-semibold">Department of Physical Education &amp; Sports</p>
                      <p className="font-semibold">Eligibility Proforma for University Tournaments</p>
                    </div>

                    {/* Second Row with College / Tournament / Manager */}
                    <div className="grid grid-cols-3 text-sm mt-2 items-center">
                      <div className="text-left">
                        College:{" "}
                        <span className="font-bold">
                          Guru Nanak Dev Engg. College Ludhiana
                        </span>
                      </div>
                      <div className="text-center">
                        PTU Inter-college{" "}
                        <span className="font-bold underline">{pdfSport}</span> Tournament
                        <br />
                        Year: <span className="font-bold underline">{pdfYear}</span>
                      </div>
                      <div className="text-right">
                        Manager:{" "}
                        <span className="font-bold underline">{pdfManager}</span>
                      </div>
                    </div>

                    {/* Category Row */}
                    <div className="flex justify-center mt-1 text-sm">
                      Category: <span className="font-bold ml-1">{pdfCategory}</span>
                    </div>
                  </div>

                  <table className="min-w-full border-collapse">
                    <thead>
                      {/* First header row matching PDF export */}
                      <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                        <th className="border p-2" rowSpan={2}>Sr. No</th>
                        <th className="border p-2" rowSpan={2}>Name</th>
                        <th className="border p-2" rowSpan={2}>Father's Name</th>
                        <th className="border p-2" rowSpan={2}>Date of Birth</th>
                        <th className="border p-2" rowSpan={2}>University Registration No</th>
                        <th className="border p-2" rowSpan={2}>Present Branch/Year</th>
                        <th className="border p-2" colSpan={2}>Year of Passing</th>
                        <th className="border p-2" rowSpan={2}>Date of First Admission</th>
                        <th className="border p-2" colSpan={2}>Last Examination</th>
                        <th className="border p-2" colSpan={2}>No of years of Participation (Inter College)</th>
                        <th className="border p-2" rowSpan={2}>No of years of participation in Inter Varsity Tournament</th>
                        <th className="border p-2" rowSpan={2}>Signature of the Student</th>
                        <th className="border p-2" rowSpan={2}>Home Address with Phone No</th>
                        <th className="border p-2" rowSpan={2}>Passport Size Photograph</th>
                      </tr>
                      {/* Second header row */}
                      <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                        <th className="border p-2">Matric</th>
                        <th className="border p-2">+2 Exam</th>
                        <th className="border p-2">Name</th>
                        <th className="border p-2">Year</th>
                        <th className="border p-2">Graduate</th>
                        <th className="border p-2">PG</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {getSelectedStudents().length === 0 ? (
                        <tr>
                          <td colSpan={17} className="text-center p-4 text-gray-500">No rows selected</td>
                        </tr>
                      ) : (
                        getSelectedStudents().map((s, idx) => (
                          <tr key={s.universityRegNo} className="hover:bg-orange-50 dark:hover:bg-orange-900/20 transition">
                            <td className="border p-2 text-center">{idx+1}</td>
                            <td className="border p-2">{s.name || ""}</td>
                            <td className="border p-2">{s.fatherName || ""}</td>
                            <td className="border p-2">{s.dob || ""}</td>
                            <td className="border p-2">{s.universityRegNo || ""}</td>
                            <td className="border p-2">{s.branchYear || ""}</td>
                            <td className="border p-2">{s.matricYear || ""}</td>
                            <td className="border p-2">{s.plusTwoYear || ""}</td>
                            <td className="border p-2">{s.firstAdmissionYear || ""}</td>
                            <td className="border p-2">{s.lastExam || ""}</td>
                            <td className="border p-2">{s.lastExamYear || ""}</td>
                            <td className="border p-2">{s.interCollegeGraduateCourse || ""}</td>
                            <td className="border p-2">{s.interCollegePgCourse || ""}</td>
                            <td className="border p-2">{s.yearsOfParticipation || ""}</td>
                            <td className="border p-2 text-center">
                              {s.signatureUrl ? <img src={s.signatureUrl} alt="signature" className="inline-block" style={{ width: 100, height: 40, objectFit: 'contain' }} /> : ""}
                            </td>
                            <td className="border p-2">{s.addressWithPhone || ""}</td>
                            <td className="border p-2 text-center">
                              {s.passportPhotoUrl ? <img src={s.passportPhotoUrl} alt="passport" className="inline-block" style={{ width: 70, height: 80, objectFit: 'cover' }} /> : ""}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Footer certifications */}
                  <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p>Certified that particulars given above have been verified and checked</p>
                    </div>
                    <div>
                      <p>Certified that the players are not employed anywhere on full time basis.</p>
                    </div>
                    <div>
                      <p>Certified that the eligibility of the students listed herein has been verified and they are eligible.</p>
                    </div>
                  </div>

                  {/* Footer signatures */}
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>Date: ___________</div>
                    <div>Signature of DPE/Lecturer Physical Edu.</div>
                    <div>
                      <div className="font-bold">PRINCIPAL</div>
                      <div className="italic">(Seal of College)</div>
                    </div>
                  </div>
                </div>
              )}

              {previewMode === "word" && (
                <div className="w-full overflow-auto">
                 {/* 🔹 Custom Header Section (Word style) */}
    <div className="mb-4">
      {/* Top Center */}
      <div className="text-center">
        <h2 className="font-bold text-lg uppercase">
          I.K. GUJRAL PUNJAB TECHNICAL UNIVERSITY
        </h2>
        <p className="font-semibold">Department of Physical Education &amp; Sports</p>
        <p className="font-semibold">Eligibility Proforma for University Tournaments</p>
      </div>

      {/* Second Row with College / Tournament / Manager */}
      <div className="grid grid-cols-3 text-sm mt-2 items-center">
        <div className="text-left">
          College:{" "}
          <span className="font-bold">
            Guru Nanak Dev Engg. College Ludhiana
          </span>
        </div>
        <div className="text-center">
          PTU Inter-college{" "}
          <span className="font-bold underline">Badminton</span> Tournament
          <br />
          Year: <span className="font-bold underline">2024-25</span>
        </div>
        <div className="text-right">
          Manager:{" "}
          <span className="font-bold underline">Dr. Gunjan Bhardwaj</span>
        </div>
      </div>

      {/* Category Row */}
      <div className="flex justify-center mt-1 text-sm">
        Category: <span className="font-bold ml-1">Men</span>
      </div>
    </div>

                  <table className="min-w-full border-collapse">
                    <thead>
                      {/* First header row matching Word export */}
                      <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                        <th className="border p-2" rowSpan={2}>Sr. No</th>
                        <th className="border p-2" rowSpan={2}>Name</th>
                        <th className="border p-2" rowSpan={2}>Father’s Name</th>
                        <th className="border p-2" rowSpan={2}>DOB</th>
                        <th className="border p-2" rowSpan={2}>Reg No</th>
                        <th className="border p-2" rowSpan={2}>Branch/Year</th>
                        <th className="border p-2" colSpan={2}>Year of Passing</th>
                        <th className="border p-2" rowSpan={2}>First Admission</th>
                        <th className="border p-2" colSpan={2}>Last Exam</th>
                        <th className="border p-2" colSpan={3}>Years of Participation</th>
                        <th className="border p-2" rowSpan={2}>Signature</th>
                        <th className="border p-2" rowSpan={2}>Address</th>
                        <th className="border p-2" rowSpan={2}>Passport</th>
                        <th className="border p-2" rowSpan={2}>Activity</th>
                        <th className="border p-2" rowSpan={2}>Position</th>
                      </tr>
                      {/* Second header row */}
                      <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                        <th className="border p-2">Matric</th>
                        <th className="border p-2">+2</th>
                        <th className="border p-2">Name</th>
                        <th className="border p-2">Year</th>
                        <th className="border p-2">Graduate</th>
                        <th className="border p-2">PG</th>
                        <th className="border p-2">Inter-Varsity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {getSelectedStudents().length === 0 ? (
                        <tr>
                          <td colSpan={19} className="text-center p-4 text-gray-500">No rows selected</td>
                        </tr>
                      ) : (
                        getSelectedStudents().map((s, idx) => (
                          <tr key={s.universityRegNo} className="hover:bg-orange-50 dark:hover:bg-orange-900/20 transition">
                            <td className="border p-2 text-center">{idx+1}</td>
                            <td className="border p-2">{s.name || ""}</td>
                            <td className="border p-2">{s.fatherName || ""}</td>
                            <td className="border p-2">{s.dob || ""}</td>
                            <td className="border p-2">{s.universityRegNo || ""}</td>
                            <td className="border p-2">{s.branchYear || ""}</td>
                            <td className="border p-2">{s.matricYear || ""}</td>
                            <td className="border p-2">{s.plusTwoYear || ""}</td>
                            <td className="border p-2">{formatDate(s.firstAdmissionYear) || ""}</td>
                            <td className="border p-2">{s.lastExam || ""}</td>
                            <td className="border p-2">{s.lastExamYear || ""}</td>
                            <td className="border p-2">{s.interCollegeGraduateCourse || ""}</td>
                            <td className="border p-2">{s.interCollegePgCourse || ""}</td>
                            <td className="border p-2">{s.yearsOfParticipation || ""}</td>
                            <td className="border p-2 text-center">
                              {s.signatureUrl ? <img src={s.signatureUrl} alt="signature" className="inline-block" style={{ width: 60, height: 30, objectFit: 'contain' }} /> : ""}
                            </td>
                            <td className="border p-2">{s.addressWithPhone || ""}</td>
                            <td className="border p-2 text-center">
                              {s.passportPhotoUrl ? <img src={s.passportPhotoUrl} alt="passport" className="inline-block" style={{ width: 60, height: 60, objectFit: 'cover' }} /> : ""}
                            </td>
                            <td className="border p-2">{s.sports?.join(", ") || ""}</td>
                            <td className="border p-2">{s.events?.map(e=>`${e.activity} : ${e.position}`).join(", ") || ""}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
        </ModalContent>
        <ModalFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {getSelectedStudents().length} row(s) selected
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setIsPreviewOpen(false); setPreviewMode(null); }}
              >
                Close
              </Button>
              <Button
                onClick={handleConfirmExport}
                className="flex items-center gap-2"
              >
                {previewMode === "excel" ? (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    Export to Excel
                  </>
                ) : previewMode === "word" ? (
                  <>
                    <FileText className="w-4 h-4" />
                    Export to Word
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Export to PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default StudentExport;
