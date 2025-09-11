import React, { useEffect, useState, useRef } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import API from "../services/api";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { AlertCircle, Download, Send, ArrowLeftRight } from "lucide-react";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";

// 🎯 Layout configs for different templates
const layoutConfig = {
  default: {
    name: { top: "330px", left: "0px", textAlign: "center",width:"1000px", fontSize: "32px", fontWeight: "bold" },
    urn: { top: "398px", left: "640px", fontSize: "24px" },
    branch: { top: "395px", left: "225px", fontSize: "24px" },
    sport: { top: "455px", left: "435px", fontSize: "20px" },
    session: { top: "455px", left: "710px", fontSize: "20px" },
    position: { top: "455px", right: "750px", fontSize: "20px" },
                          },
  participation: {
    name: { top: "330px", left: "0", fontSize: "32px", textAlign: "center" },
    urn: { top: "398px", left: "600px", fontSize: "24px" },
    branch: { top: "396px", left: "240px", fontSize: "24px" },
    sport: { top: "448px", left: "320px", fontSize: "20px" },
    session: { top: "450px", left: "591px", fontSize: "20px" },
  },
};

// Certificate Card
const CertificateCard = React.forwardRef(({ student, captainPosition }, ref) => {
  // ✅ normalize data (captain vs member)
  const data =
    student.recipientType === "captain"
      ? {
          name: student.captainId?.name,
          urn: student.captainId?.urn,
          branch: student.captainId?.branch,
          year: student.captainId?.year || "",
        }
      : {
          name: student.memberInfo?.name,
          urn: student.memberInfo?.urn,
          branch: student.memberInfo?.branch,
          year: student.memberInfo?.year,
        };

  // ✅ Template select logic → sirf captainPosition use hoga
  const isParticipation = captainPosition?.toLowerCase() === "participated";

  const templateBg = isParticipation ? "/Certificates2.png" : "/Certificates.png";
  const layout = isParticipation ? layoutConfig.participation : layoutConfig.default;

  const baseStyle = {
    position: "absolute",
    color: "#000",
    fontWeight: "bold",
  };

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: "1000px",
        height: "700px",
        backgroundImage: `url(${templateBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        margin: "0 auto",
      }}
    >
      {/* Name */}
      <div style={{ ...baseStyle, ...layout.name, width: "100%" }}>
        {data.name}
      </div>

      {/* URN */}
      <div style={{ ...baseStyle, ...layout.urn, fontWeight: "normal" }}>
        {data.urn}
      </div>

      {/* Branch */}
      <div style={{ ...baseStyle, ...layout.branch, fontWeight: "normal" }}>
        D{data.year} {data.branch}
      </div>

      {/* Position */}
      <div style={{ ...baseStyle, ...layout.position, fontWeight: "normal" }}>
        {captainPosition}
      </div>

      {/* Sport */}
      <div style={{ ...baseStyle, ...layout.sport, fontWeight: "normal" }}>
        {student.sport}
      </div>

      {/* Session */}
      <div style={{ ...baseStyle, ...layout.session, fontWeight: "normal" }}>
        {student.session?.session || ""}
      </div>
    </div>
  );
});

const Certificate = () => {
  const [students, setStudents] = useState([]);
  const [selectedCaptain, setSelectedCaptain] = useState(null);
  const [captainPosition, setCaptainPosition] = useState(""); // ✅ new state
  const certRefs = useRef([]);
  const { captainId } = useParams();
  const navigate=useNavigate();

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await API.get(`/admin/certificates/${captainId}`);
        console.log("Certificates API Response:", res.data);

        if (res.data && res.data.length > 0) {
          // ✅ captain ka position nikaal lo
          const captain = res.data.find((s) => s.recipientType === "captain");
          setCaptainPosition(captain?.position || "");

          setStudents(res.data);
          certRefs.current = res.data.map(() => React.createRef());
          setSelectedCaptain({ captainId });
        }
      } catch (err) {
        console.error("Error fetching certificates", err);
      }
    };
    fetchCertificates();
  }, [captainId]);

  const generateAllPDFs = async () => {
    if (students.length === 0) return;
    const pdf = new jsPDF("landscape", "px", "a4");

    for (let i = 0; i < students.length; i++) {
      const input = certRefs.current[i].current;
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();

      if (i !== 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, width, height);
    }

    pdf.save("Certificates.pdf");
  };

  const sendToCaptain = async (captainId) => {
    try {
      await API.post(`/admin/certificates/send/${captainId}`);
      alert("Certificates sent!");
    } catch (err) {
      console.error(err);
      alert("Error sending certificates");
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Certificate Management</h1>
          <p className="text-muted-foreground mt-1">Preview and export certificates for the selected captain</p>
        </div>
      </motion.div>

      {selectedCaptain && students.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Certificate Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <Swiper
                  spaceBetween={50}
                  slidesPerView={1}
                  navigation={true}
                  modules={[Navigation]}
                  style={{ width: "1050px", margin: "auto" }}
                >
                  {students.map((stu, index) => (
                    <SwiperSlide key={index}>
                      <CertificateCard
                        ref={certRefs.current[index]}
                        student={stu}
                        captainPosition={captainPosition}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <Button onClick={generateAllPDFs} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download All
                </Button>
                <Button onClick={() => {sendToCaptain(captainId);navigate('/admin/issue-cert');}} variant="outline" className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Send to Captain
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    setSelectedCaptain(null);
                    setStudents([]);
                    navigate('/admin/issue-cert')
                  }}
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Back to List
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <AlertCircle className="w-5 h-5" />
              <span>No certificates found for this captain.</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Certificate;
