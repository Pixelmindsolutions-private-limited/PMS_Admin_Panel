import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  MdEmail,
  MdPhone,
  MdWork,
  MdCalendarToday,
  MdBloodtype,
  MdPerson,
  MdEdit,
  MdArrowBack,
  MdDownload,
} from "react-icons/md";
import { FaUserTie, FaIdCard, FaFileAlt, FaPrint } from "react-icons/fa";

const API_URL = "https://pmsbackend.pixelmindsolutions.com/api/staff";

const adminDetails = JSON.parse(sessionStorage.getItem("adminDetails"));
const AUTH_TOKEN = adminDetails?.token;

const StaffDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStaffDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchStaffDetails = async () => {
    try {
      setLoading(true);
      console.log("📡 Fetching staff details for ID:", id);

      const response = await fetch(`${API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("📡 Staff response:", data);

      if (response.ok && data.success) {
        setStaff(data.data);
        if (data.data.employeeId) {
          fetchStaffDocuments(data.data.employeeId);
        }
      } else {
        setError(data.message || "Failed to load staff details");
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffDocuments = async (employeeId) => {
    try {
      setLoadingDocs(true);
      console.log("📡 Fetching documents for employee:", employeeId);

      const response = await fetch(`${API_URL}/documents/employee/${employeeId}`, {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("📡 Documents response:", data);

      if (response.ok && data.success) {
        setDocuments(data.data || []);
        console.log(`✅ Loaded ${data.data?.length || 0} documents`);
      } else {
        console.warn("No documents found or error fetching:", data.message);
        setDocuments([]);
      }
    } catch (err) {
      console.error("❌ Error fetching documents:", err);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "Not specified";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "Unknown";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType === "pdf") return "📄";
    if (fileType === "jpg" || fileType === "jpeg" || fileType === "png")
      return "🖼️";
    if (fileType === "doc" || fileType === "docx") return "📝";
    return "📎";
  };

  const getDocumentType = (description) => {
    if (!description) return "Document";
    const typeMap = {
      graduation: "Graduation Certificate",
      tenth: "10th Certificate",
      panCard: "PAN Card",
      aadharCard: "Aadhar Card",
      offerLetters: "Offer Letter",
      form16: "Form 16",
      payslips: "Payslip",
      relievingLetters: "Relieving Letter",
      experienceLetters: "Experience Letter",
    };
    const key = description.replace("Document type: ", "");
    return typeMap[key] || key;
  };

  const handleDownload = async (url, fileName) => {
    const response = await fetch(url);
    const blob = await response.blob();

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName || "document";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(blobUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="flex flex-col items-center gap-3">
          <div
            style={{
              width: 44,
              height: 44,
              border: "3px solid #ccfafa",
              borderTop: "3px solid #0d9488",
              borderRadius: "50%",
              animation: "spin .8s linear infinite",
            }}
          />
          <p className="text-gray-500 text-sm font-medium">
            Loading staff details…
          </p>
          <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center bg-white rounded-2xl shadow p-8 max-w-sm w-full">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <MdPerson className="text-red-400 text-2xl" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">
            Staff Not Found
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {error || "No staff data available"}
          </p>
          <button
            onClick={() => navigate("/staff")}
            className="px-5 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors"
          >
            Back to Staff
          </button>
        </div>
      </div>
    );
  }

  const profileImageUrl = staff.profileImage || null;
  const idCardImageUrl =
    staff.idCardImage && !staff.idCardImage.startsWith("/data/user")
      ? staff.idCardImage
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; }
            .print-break { page-break-inside: avoid; }
          }
          @keyframes fadeUp {
            from { opacity:0; transform:translateY(12px); }
            to { opacity:1; transform:translateY(0); }
          }
          .fade-up { animation: fadeUp .35s ease forwards; }
        `}
      </style>

      <div className="max-w-6xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Top Bar */}
        <div className="no-print mb-5 sm:mb-6 flex items-center justify-between gap-3 flex-wrap fade-up">
          <button
            onClick={() => navigate("/staff")}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-teal-700 transition-colors px-3 py-2 rounded-xl hover:bg-teal-50"
          >
            <MdArrowBack className="text-base" />
            <span>Back to Staff</span>
          </button>

          <div className="flex items-center gap-2.5">
            {/* <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-semibold bg-white border border-gray-200 text-gray-600 rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <FaPrint className="text-xs sm:text-sm" />
              <span className="hidden sm:inline">Print</span>
            </button> */}
            <Link
              to={`/staff/edit/${staff.employeeId}`}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-semibold bg-teal-600 text-white rounded-xl shadow-sm hover:bg-teal-700 transition-colors"
            >
              <MdEdit className="text-base" />
              <span className="hidden sm:inline">Edit Staff</span>
            </Link>
          </div>
        </div>

        {/* Profile Banner */}
        <div className="fade-up rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg mb-5 sm:mb-6 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 print-break">
          <div className="relative px-4 sm:px-6 md:px-8 py-6 sm:py-8 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -bottom-12 -left-8 w-40 sm:w-52 h-40 sm:h-52 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-white">
              {/* Avatar */}
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={staff.employeeName}
                  className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-white rounded-2xl object-cover border-4 border-white/30 shadow-xl shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl bg-white/15 border-4 border-white/20 flex items-center justify-center shrink-0">
                  <FaUserTie className="text-4xl sm:text-5xl text-white/70" />
                </div>
              )}

              {/* Info */}
              <div className="text-center sm:text-left min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                  {staff.employeeName}
                </h1>

                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2.5">
                  <span className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                    <MdWork className="text-sm" /> {staff.role}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${staff.isActive
                      ? "bg-emerald-400/25 text-emerald-100"
                      : "bg-red-400/25 text-red-100"
                      }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${staff.isActive ? "bg-emerald-300" : "bg-red-300"
                        }`}
                    />
                    {staff.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="text-sm text-white/70 mt-2 font-medium">
                  Staff ID:{" "}
                  <span className="text-white font-bold">
                    {staff.employeeId}
                  </span>
                </p>

                {/* Quick contact pills */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  {staff.email && (
                    <a
                      href={`mailto:${staff.email}`}
                      className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 no-underline px-3 py-1.5 rounded-full text-white text-xs font-medium transition-colors truncate max-w-[220px]"
                    >
                      <MdEmail className="shrink-0" /> {staff.email}
                    </a>
                  )}
                  {staff.mobile && (
                    <a
                      href={`tel:${staff.mobile}`}
                      className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 no-underline px-3 py-1.5 rounded-full text-white text-xs font-medium transition-colors"
                    >
                      <MdPhone className="shrink-0" /> {staff.mobile}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 fade-up">
          {/* Left col: spans 2 on lg */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            {/* Personal Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 print-break">
              <SectionTitle>Personal Information</SectionTitle>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                <InfoCard
                  icon={<FaIdCard className="text-teal-600" />}
                  label="Employee ID"
                  value={staff.employeeId}
                />
                <InfoCard
                  icon={<MdWork className="text-indigo-500" />}
                  label="Role"
                  value={staff.role}
                />
                <InfoCard
                  icon={<MdPerson className="text-pink-500" />}
                  label="Gender"
                  value={staff.gender || "Not specified"}
                />
                <InfoCard
                  icon={<MdBloodtype className="text-red-500" />}
                  label="Blood Group"
                  value={staff.bloodGroup || "Not specified"}
                />
                <InfoCard
                  icon={<MdCalendarToday className="text-purple-500" />}
                  label="Joining Date"
                  value={formatDate(staff.joiningDate)}
                />
                <InfoCard
                  icon={
                    <MdPerson
                      className={
                        staff.isActive ? "text-emerald-500" : "text-red-400"
                      }
                    />
                  }
                  label="Status"
                  value={staff.isActive ? "Active" : "Inactive"}
                  valueClass={
                    staff.isActive ? "text-emerald-600" : "text-red-500"
                  }
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 print-break">
              <SectionTitle>Contact Information</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <ContactCard
                  icon={<MdEmail className="text-teal-600" />}
                  label="Email Address"
                  value={staff.email}
                  href={`mailto:${staff.email}`}
                  linkClass="text-teal-600 hover:text-teal-700"
                />
                <ContactCard
                  icon={<MdPhone className="text-blue-600" />}
                  label="Mobile Number"
                  value={staff.mobile}
                  href={`tel:${staff.mobile}`}
                  linkClass="text-blue-600 hover:text-blue-700"
                />
              </div>
            </div>

            {/* Address Section */}
            {(staff.address?.street ||
              staff.address?.city ||
              staff.address?.state) && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 print-break">
                  <SectionTitle>Address</SectionTitle>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-700">
                      {staff.address.street && (
                        <>
                          {staff.address.street}
                          <br />
                        </>
                      )}
                      {staff.address.city && staff.address.city}
                      {staff.address.city && staff.address.state && ", "}
                      {staff.address.state && staff.address.state}
                      {staff.address.pincode && (
                        <>
                          <br />
                          PIN: {staff.address.pincode}
                        </>
                      )}
                      {staff.address.country && (
                        <>
                          <br />
                          {staff.address.country}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}

            {/* Emergency Contact Section */}
            {(staff.emergencyContact?.name ||
              staff.emergencyContact?.relation ||
              staff.emergencyContact?.mobile) && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 print-break">
                  <SectionTitle>Emergency Contact</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {staff.emergencyContact.name && (
                      <InfoCard
                        icon={<MdPerson className="text-orange-500" />}
                        label="Name"
                        value={staff.emergencyContact.name}
                      />
                    )}
                    {staff.emergencyContact.relation && (
                      <InfoCard
                        icon={<MdWork className="text-purple-500" />}
                        label="Relation"
                        value={staff.emergencyContact.relation}
                      />
                    )}
                    {staff.emergencyContact.mobile && (
                      <ContactCard
                        icon={<MdPhone className="text-blue-600" />}
                        label="Mobile"
                        value={staff.emergencyContact.mobile}
                        href={`tel:${staff.emergencyContact.mobile}`}
                        linkClass="text-blue-600 hover:text-blue-700"
                      />
                    )}
                  </div>
                </div>
              )}

            {/* ID Card image */}
            {idCardImageUrl && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 print-break">
                <SectionTitle>ID Card</SectionTitle>
                <div className="flex justify-center sm:justify-start">
                  <img
                    src={idCardImageUrl}
                    alt="ID Card"
                    className="rounded-xl max-h-52 sm:max-h-64 object-cover shadow-md w-full sm:w-auto"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right col */}
          <div className="space-y-4 sm:space-y-5">
            {/* Documents Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 print-break">
              <SectionTitle>
                <FaFileAlt className="text-teal-600" />
                Documents
              </SectionTitle>

              {loadingDocs ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-gray-200 border-t-teal-600 rounded-full animate-spin" />
                </div>
              ) : documents.length > 0 ? (
                <div className="space-y-2.5 max-h-96 overflow-y-auto">
                  {documents.map((doc, index) => (
                    <a
                      key={doc.documentId || index}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 sm:p-3.5 border border-gray-100 rounded-xl hover:border-teal-200 hover:bg-teal-50 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center shrink-0 transition-colors">
                          <span className="text-lg">
                            {getFileIcon(doc.fileType)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-700 truncate">
                            {getDocumentType(doc.description) || doc.documentName || doc.fileName}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">
                              {doc.fileType?.toUpperCase() || "Unknown"}
                            </span>
                            {doc.fileSize && (
                              <span className="text-xs text-gray-400">
                                • {formatFileSize(doc.fileSize)}
                              </span>
                            )}
                            {doc.uploadedAt && (
                              <span className="text-xs text-gray-400">
                                • {new Date(doc.uploadedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {doc.description && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <MdDownload
                        onClick={() =>
                          handleDownload(
                            doc.filePath,
                            doc.fileName || doc.documentName || "document"
                          )
                        }
                        className="text-gray-400 group-hover:text-teal-600 shrink-0 ml-2 transition-colors text-lg" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                    <FaFileAlt className="text-gray-300 text-xl" />
                  </div>
                  <p className="text-sm text-gray-400">No documents uploaded</p>
                </div>
              )}
            </div>

            {/* Quick Stats card */}
            <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-4 sm:p-6 text-white shadow-lg print-break">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-200 mb-4">
                Quick Stats
              </p>
              <div className="space-y-3">
                <StatRow
                  label="Member Since"
                  value={formatDate(staff.createdAt)}
                />
                <StatRow
                  label="Last Updated"
                  value={formatDate(staff.updatedAt)}
                />
                {staff.lastActive && (
                  <StatRow
                    label="Last Active"
                    value={formatDate(staff.lastActive)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Reusable sub-components */

const SectionTitle = ({ children }) => (
  <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 pb-2.5 border-b border-gray-100 flex items-center gap-2">
    {children}
  </h2>
);

const InfoCard = ({ icon, label, value, valueClass = "text-gray-800" }) => (
  <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 text-base">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
      <p className={`text-sm font-semibold truncate ${valueClass}`}>
        {value || "Not specified"}
      </p>
    </div>
  </div>
);

const ContactCard = ({ icon, label, value, href, linkClass }) => (
  <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 text-base">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
      {value ? (
        <a
          href={href}
          className={`text-sm font-semibold truncate block hover:underline transition-colors ${linkClass}`}
        >
          {value}
        </a>
      ) : (
        <p className="text-sm text-gray-400">Not provided</p>
      )}
    </div>
  </div>
);

const StatRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="text-xs text-teal-200 shrink-0">{label}</span>
    <span className="text-xs font-semibold text-right leading-snug">
      {value}
    </span>
  </div>
);

export default StaffDetails;