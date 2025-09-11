import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const EligibilityPDF = () => {
  // 🔹 Demo Students
  const students = [
    {
      sr: 1,
      name: 'Vansh Singh',
      father: 'Rajesh Singh',
      dob: '11/10/2004',
      urn: '2203907',
      branch: 'B.Tech 3rd Year',
      matric: '2020',
      plusTwo: '2022',
      admission: '2022',
      lastExam: 'B.Tech 4th Sem',
      lastExamYear: '2024',
      graduate: '1',
      pg: '-',
      interVarsity: '1',
      address: 'Rakkar Colony, Una (H.P) 8278807782',
    },
    {
      sr: 2,
      name: 'Aman Mittal',
      father: 'Rakesh Kumar Mittal',
      dob: '20/08/2000',
      urn: '2204094',
      branch: 'M.Tech (Structure) 4th Sem',
      matric: '2022',
      plusTwo: '2024',
      admission: 'Sept 2022',
      lastExam: 'M.Tech 3rd Sem',
      lastExamYear: '2024',
      graduate: '3',
      pg: '2',
      interVarsity: '2',
      address: 'Sukhdev Nagar, Ludhiana 9417606973',
    },
  ];

  // 🔹 User defined states
  const [category, setCategory] = useState('Men');
  const [sport, setSport] = useState('Badminton');
  const [year, setYear] = useState('2024-25');
  const [manager, setManager] = useState('Dr. Gunjan Bhardwaj');

  const exportPDF = () => {
    const doc = new jsPDF('landscape', 'pt', 'a4');
    doc.setFont('times', 'normal');

    // 🔹 Header
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text(
      'I.K. GUJRAL PUNJAB TECHNICAL UNIVERSITY',
      doc.internal.pageSize.width / 2,
      30,
      { align: 'center' }
    );

    doc.setFontSize(11);
    doc.text(
      'Department of Physical Education & Sports',
      doc.internal.pageSize.width / 2,
      50,
      { align: 'center' }
    );

    doc.text(
      'Eligibility Proforma for University Tournaments',
      doc.internal.pageSize.width / 2,
      70,
      { align: 'center' }
    );

    // 🔹 College Info Row (labels normal, values bold + underline)
    doc.setFontSize(10);
    let y = 90;
    let x = 40;

    // College (fixed, normal)
    doc.setFont('times', 'normal');
    const collegeText = 'College: Guru Nanak Dev Engg. College Ludhiana    ';
    doc.text(collegeText, x, y);
    x += doc.getTextWidth(collegeText);

    // Category
    const catLabel = 'Category: ';
    const catValue = category;
    doc.setFont('times', 'normal');
    doc.text(catLabel, x, y);
    let labelWidth = doc.getTextWidth(catLabel);
    doc.setFont('times', 'bold');
    doc.text(catValue, x + labelWidth, y);
    let valueWidth = doc.getTextWidth(catValue);
    doc.line(x + labelWidth, y + 2, x + labelWidth + valueWidth, y + 2);
    x += labelWidth + valueWidth + 20;

    // Sport
    const sportLabel = 'PTU Inter-college ';
    const sportValue = `${sport} Tournament`;
    doc.setFont('times', 'normal');
    doc.text(sportLabel, x, y);
    labelWidth = doc.getTextWidth(sportLabel);
    doc.setFont('times', 'bold');
    doc.text(sportValue, x + labelWidth, y);
    valueWidth = doc.getTextWidth(sportValue);
    doc.line(x + labelWidth, y + 2, x + labelWidth + valueWidth, y + 2);
    x += labelWidth + valueWidth + 20;

    // Year
    const yearLabel = 'Year: ';
    const yearValue = year;
    doc.setFont('times', 'normal');
    doc.text(yearLabel, x, y);
    labelWidth = doc.getTextWidth(yearLabel);
    doc.setFont('times', 'bold');
    doc.text(yearValue, x + labelWidth, y);
    valueWidth = doc.getTextWidth(yearValue);
    doc.line(x + labelWidth, y + 2, x + labelWidth + valueWidth, y + 2);
    x += labelWidth + valueWidth + 20;

    // Manager
    const mgrLabel = 'Manager: ';
    const mgrValue = manager;
    doc.setFont('times', 'normal');
    doc.text(mgrLabel, x, y);
    labelWidth = doc.getTextWidth(mgrLabel);
    doc.setFont('times', 'bold');
    doc.text(mgrValue, x + labelWidth, y);
    valueWidth = doc.getTextWidth(mgrValue);
    doc.line(x + labelWidth, y + 2, x + labelWidth + valueWidth, y + 2);

    // 🔹 Table headers
    const head = [
      [
        'Sr. No',
        'Name',
        'Father’s Name',
        'Date of Birth',
        'University Registration No',
        'Present Branch/Year',
        { content: 'Year of Passing', colSpan: 2 },
        'Date of First Admission',
        { content: 'Last Examination', colSpan: 2 },
        {
          content: 'No of years of Participation\n(Inter College)',
          colSpan: 2,
        },
        'No of years of participation\nin Inter Varsity Tournament',
        'Signature of the Student',
        'Home Address\nwith Phone No',
        'Passport Size\nPhotograph',
      ],
      [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        'Matric\n7(a)',
        '+2 Exam\n7(b)',
        '8',
        'Name\n9(a)',
        'Year\n9(b)',
        'Graduate\n10(a)',
        'PG\n10(b)',
        '11',
        '12',
        '13',
        '14',
      ],
    ];

    // 🔹 Student rows
    const body = students.map((s) => [
      s.sr,
      s.name,
      s.father,
      s.dob,
      s.urn,
      s.branch,
      s.matric,
      s.plusTwo,
      s.admission,
      s.lastExam,
      s.lastExamYear,
      s.graduate,
      s.pg,
      s.interVarsity,
      '',
      s.address,
      '',
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 120,
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 9,
        halign: 'center',
        valign: 'middle',
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        
      },
      headStyles: {
        font: 'times',
        fontSize: 8,
        textColor: 0,
        fillColor: [255, 255, 255], // white header background
      },
      tableWidth: "auto",
     
    });
    

    // 🔹 Footer (certifications with wrapping in 3 columns)
    const pageHeight = doc.internal.pageSize.height;
    let certY = pageHeight - 120;

    doc.setFont('times', 'normal');
    doc.setFontSize(10);

    const colWidth = doc.internal.pageSize.width / 3 - 40;
    const col1X = 40;
    const col2X = col1X + colWidth + 20;
    const col3X = col2X + colWidth + 20;

    const cert1 =
      'Certified that particulars given above have been verified and checked';
    const cert2 =
      'Certified that the players are not employed anywhere on full time basis.';
    const cert3 =
      'Certified that the eligibility of the students listed herein has been verified and they are eligible.';

    const cert1Lines = doc.splitTextToSize(cert1, colWidth);
    const cert2Lines = doc.splitTextToSize(cert2, colWidth);
    const cert3Lines = doc.splitTextToSize(cert3, colWidth);

    doc.text(cert1Lines, col1X, certY);
    doc.text(cert2Lines, col2X, certY);
    doc.text(cert3Lines, col3X, certY);

    // 🔹 Footer (signatures)
    let signY = pageHeight - 60;
    doc.text('Date: ___________', col1X, signY);
    doc.text('Signature of DPE/Lecturer Physical Edu.', col2X, signY);
    doc.setFont('times', 'bold');
    doc.text('PRINCIPAL', col3X, signY);
    doc.setFont('times', 'normal');
    doc.text('(Seal of College)', col3X, signY + 15);

    doc.save('Eligibility_Form.pdf');
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">Eligibility Proforma PDF Export</h2>

      {/* 🔹 User Inputs */}
      <div className="space-y-2">
        <label>Category:</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option>Men</option>
          <option>Women</option>
        </select>
      </div>

      <div className="space-y-2">
        <label>Sport:</label>
        <input
          type="text"
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          className="border px-2 py-1 rounded"
        />
      </div>

      <div className="space-y-2">
        <label>Year:</label>
        <input
          type="text"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border px-2 py-1 rounded"
        />
      </div>

      <div className="space-y-2">
        <label>Manager:</label>
        <select
          value={manager}
          onChange={(e) => setManager(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option>Dr. Gunjan Bhardwaj</option>
          <option>Prof. Suminder Singh</option>
        </select>
      </div>

      {/* 🔹 Export Button */}
      <button
        onClick={exportPDF}
        className="px-4 py-2 bg-orange-600 text-white rounded-lg"
      >
        Export PDF
      </button>
    </div>
  );
};

export default EligibilityPDF;