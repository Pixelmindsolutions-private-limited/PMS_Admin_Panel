import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Droplet,
  Lock,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
  ChevronDown,
  File,
  Shield,
  Trash2,
  Eye,
  Download
} from "lucide-react";

const API_URL = "https://pmsbackend.pixelmindsolutions.com/api/staff";

const adminDetails = JSON.parse(sessionStorage.getItem("adminDetails"));
const AUTH_TOKEN = adminDetails?.token;

const DEFAULT_ROLES = [
  "Admin",
  "Manager",
  "HR",
  "Flutter Developer",
  "Node Developer",
  "React Developer",
  "UI/UX Designer",
  "Testing",
  "Full-Stack Developer",
  "Graphic Designer",
  "SEO Person",
  "Video Editor",
];
const DEFAULT_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"];

const EditStaff = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);

  const [profilePreview, setProfilePreview] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState(null);
  const [idCardImage, setIdCardImage] = useState(null);

  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [bloodGroups, setBloodGroups] = useState(DEFAULT_BLOOD_GROUPS);
  const [genders, setGenders] = useState(["Male", "Female"]);

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [showDocuments, setShowDocuments] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [documentTypes, setDocumentTypes] = useState({
    experienceLetters: [],
    relievingLetters: [],
    payslips: [],
    form16: [],
    offerLetters: [],
    aadharCard: [],
    panCard: [],
    tenth: [],
    graduation: [],
  });

  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    mobile: "",
    email: "",
    role: "",
    joiningDate: "",
    gender: "",
    bloodGroup: "",
    password: "",
    isActive: true,
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India"
    },
    emergencyContact: {
      name: "",
      relation: "",
      mobile: ""
    }
  });

  const [showAddress, setShowAddress] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchMetadata = async () => {
    try {
      const response = await fetch(`${API_URL}/metadata`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      });
      const data = await response.json();

      if (response.ok && data.success) {
        if (data.roles && data.roles.length > 0) setRoles(data.roles);
        if (data.bloodGroups && data.bloodGroups.length > 0) setBloodGroups(data.bloodGroups);
        if (data.genders && data.genders.length > 0) setGenders(data.genders);
      }
    } catch (error) {
      console.error("Metadata fetch error:", error);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.message || "Failed to load staff");

      const s = data.data;
      setCurrentEmployeeId(s.employeeId);

      setFormData({
        employeeId: s.employeeId || "",
        employeeName: s.employeeName || "",
        mobile: s.mobile || "",
        email: s.email || "",
        role: s.role || "",
        joiningDate: s.joiningDate?.split("T")[0] || "",
        gender: s.gender || "",
        bloodGroup: s.bloodGroup || "",
        password: "",
        isActive: s.isActive ?? true,
        address: s.address || { street: "", city: "", state: "", pincode: "", country: "India" },
        emergencyContact: s.emergencyContact || { name: "", relation: "", mobile: "" }
      });

      if (s.profileImage && !s.profileImage.startsWith("/data/user")) setProfilePreview(s.profileImage);
      if (s.idCardImage && !s.idCardImage.startsWith("/data/user")) setIdCardPreview(s.idCardImage);

      // Fetch documents for this employee
      await fetchDocuments(s.employeeId);

    } catch (err) {
      showToast("error", err.message || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (employeeId) => {
    try {
      const res = await fetch(`${API_URL}/documents/employee/${employeeId}`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      });
      const data = await res.json();

      if (data.success) {
        setDocuments(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  };

  useEffect(() => {
    fetchMetadata();
    if (id) {
      fetchStaff();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((p) => ({
        ...p,
        [parent]: {
          ...p[parent],
          [child]: value
        }
      }));
    } else {
      setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    }
  };

  const handleImageChange = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (!file) return;
    setFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingDocs(true);

    try {
      const formDataToSend = new FormData();
      files.forEach(file => {
        formDataToSend.append('documents', file);
      });

      const response = await fetch(`${API_URL}/documents/upload/${currentEmployeeId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast("success", `${files.length} document(s) uploaded successfully`);
        await fetchDocuments(currentEmployeeId);
        setNewDocuments([]);
      } else {
        showToast("error", data.message || "Failed to upload documents");
      }
    } catch (error) {
      console.error("Upload error:", error);
      showToast("error", "Failed to upload documents");
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(`${API_URL}/documents/${documentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast("success", "Document deleted successfully");
        await fetchDocuments(currentEmployeeId);
      } else {
        showToast("error", data.message || "Failed to delete document");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showToast("error", "Failed to delete document");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();

      formDataToSend.append('employeeId', formData.employeeId.trim());
      formDataToSend.append('employeeName', formData.employeeName.trim());
      formDataToSend.append('role', formData.role);
      formDataToSend.append('mobile', formData.mobile.trim());
      formDataToSend.append('email', formData.email.trim());
      formDataToSend.append('joiningDate', formData.joiningDate);
      formDataToSend.append('gender', formData.gender || '');
      formDataToSend.append('bloodGroup', formData.bloodGroup || 'Unknown');
      formDataToSend.append('isActive', formData.isActive);

      if (formData.password && formData.password.trim()) {
        formDataToSend.append('password', formData.password);
      }

      // Add address as JSON string
      const hasAddress = formData.address.street || formData.address.city ||
        formData.address.state || formData.address.pincode;
      if (hasAddress) {
        formDataToSend.append('address', JSON.stringify(formData.address));
      }

      // Add emergency contact as JSON string
      const hasEmergency = formData.emergencyContact.name ||
        formData.emergencyContact.relation ||
        formData.emergencyContact.mobile;
      if (hasEmergency) {
        formDataToSend.append('emergencyContact', JSON.stringify(formData.emergencyContact));
      }

      if (profileImage) {
        formDataToSend.append('profileImage', profileImage);
      }
      if (idCardImage) {
        formDataToSend.append('idCardImage', idCardImage);
      }

      const updateUrl = `${API_URL}/${currentEmployeeId}`;

      const response = await fetch(updateUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();
      console.log("📡 Update response:", data);

      if (response.ok && data.success !== false) {
        showToast("success", "Staff updated successfully!");
        setProfileImage(null);
        setIdCardImage(null);
        setTimeout(() => {
          navigate("/staff", { state: { refresh: Date.now() } });
        }, 1800);
      } else {
        const errMsg = data.errors
          ? data.errors.join(", ")
          : data.message || "Update failed. Please try again.";
        showToast("error", errMsg);
      }
    } catch (error) {
      console.error("Submit error:", error);
      showToast("error", "Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div style={{ width: 44, height: 44, border: "3px solid #e0f2f1", borderTop: "3px solid #0d9488", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
          <p className="text-gray-500 font-medium text-sm">Loading staff data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/80">
      <style>{`
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        .toast-in { animation:slideDown .3s ease forwards; }
        .spin-i { animation:spin .8s linear infinite; }
        .toggle-track { position:relative; display:inline-flex; align-items:center; width:44px; height:24px; border-radius:100px; transition:background .25s; cursor:pointer; flex-shrink:0; }
        .toggle-thumb { position:absolute; top:2px; left:2px; width:20px; height:20px; border-radius:50%; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,.18); transition:transform .25s; }
        .inp { width:100%; background:#fff; border:1.5px solid rgba(0,128,128,0.15); transition:border-color .22s, box-shadow .22s; }
        .inp:focus { border-color:#0d9488; box-shadow:0 0 0 3px rgba(13,148,136,0.11); outline:none; }
        .img-zone { border:2px dashed rgba(0,128,128,0.22); background:linear-gradient(135deg,rgba(240,253,250,.55),rgba(255,255,255,.4)); transition:all .25s; }
        .img-zone:hover { border-color:#0d9488; background:rgba(20,184,166,0.06); transform:translateY(-1px); }
        .doc-card { background:rgba(255,255,255,0.95); border:1px solid rgba(20,184,166,0.18); transition:all .25s; }
        .doc-card:hover { border-color:rgba(20,184,166,0.45); box-shadow:0 4px 12px rgba(0,128,128,0.1); transform:translateY(-2px); }
      `}</style>

      {toast && (
        <div className={`toast-in fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl font-semibold text-sm max-w-[calc(100vw-2rem)] sm:max-w-sm ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}>
          {toast.type === "success" ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
          <span className="flex-1 text-xs sm:text-sm">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-80 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="w-full max-w-5xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-10">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-7">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/staff")}
              className="w-9 h-9 rounded-xl bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-500 hover:text-teal-600 transition-all"
            >
              <ArrowLeft size={17} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
                Edit Staff Member
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Update employee profile, details & documents</p>
            </div>
          </div>
          <span className={`self-start sm:self-auto px-3 py-1.5 rounded-full text-xs font-bold ${formData.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
            }`}>
            {formData.isActive ? "● Active" : "○ Inactive"}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

          {/* Photos Section */}
          <div className="bg-white/95 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-teal-100 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-teal-500 to-emerald-600" />
              <span className="text-xs font-bold text-teal-600 tracking-widest uppercase">📸 Photos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Profile Photo
                </p>
                <div className="flex flex-col xs:flex-row items-center gap-3">
                  <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden border-2 border-teal-100 flex items-center justify-center">
                    {profilePreview
                      ? <img src={profilePreview} className="w-full h-full object-cover" alt="profile" />
                      : <User className="text-gray-300" size={28} />}
                  </div>
                  <div className="flex-1 text-center">
                    <label className="cursor-pointer inline-block">
                      <div className="img-zone rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-teal-700 font-semibold text-xs">
                        <Upload size={14} />
                        {profilePreview ? "Change Photo" : "Upload Photo"}
                      </div>
                      <input type="file" className="hidden" accept="image/*"
                        onChange={(e) => handleImageChange(e, setProfileImage, setProfilePreview)} />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> ID Card Image
                </p>
                <div className="flex flex-col xs:flex-row items-center gap-3">
                  <div className="w-28 h-20 rounded-xl bg-gray-100 overflow-hidden border-2 border-teal-100 flex items-center justify-center">
                    {idCardPreview
                      ? <img src={idCardPreview} className="w-full h-full object-cover" alt="id card" />
                      : <CreditCard className="text-gray-300" size={24} />}
                  </div>
                  <div className="flex-1 text-center">
                    <label className="cursor-pointer inline-block">
                      <div className="img-zone rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-teal-700 font-semibold text-xs">
                        <Upload size={14} />
                        {idCardPreview ? "Change ID Card" : "Upload ID Card"}
                      </div>
                      <input type="file" className="hidden" accept="image/*"
                        onChange={(e) => handleImageChange(e, setIdCardImage, setIdCardPreview)} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white/95 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-teal-100 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-teal-500 to-emerald-600" />
              <span className="text-xs font-bold text-teal-600 tracking-widest uppercase">👤 Personal Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <InputField icon={<User size={14} />} label="Employee ID" name="employeeId" value={formData.employeeId} onChange={handleChange} disabled required />
              <InputField icon={<User size={14} />} label="Employee Name" name="employeeName" value={formData.employeeName} onChange={handleChange} required />
              <InputField
                icon={<Phone size={14} />}
                label="Mobile"
                name="mobile"
                value={formData.mobile}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  handleChange({
                    target: {
                      name: "mobile",
                      value,
                    },
                  });
                }}
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]{10}"
                placeholder="Enter 10-digit mobile number"
                required
              />

              <InputField
                icon={<Mail size={14} />}
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  handleChange({
                    target: {
                      name: "email",
                      value: e.target.value.trim(),
                    },
                  });
                }}
                placeholder="example@gmail.com"
                required
              />
              <SelectField icon={<Briefcase size={14} />} label="Role" name="role" value={formData.role} onChange={handleChange} options={roles} required />
              <InputField icon={<Calendar size={14} />} label="Joining Date" name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} />
              <SelectField icon={<User size={14} />} label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={genders} />
              <SelectField icon={<Droplet size={14} />} label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} options={bloodGroups} />
              <InputField icon={<Lock size={14} />} label="New Password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Leave blank to keep current" />
            </div>
          </div>

          {/* Address Section */}
          <div className="bg-white/95 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-teal-100 shadow-md">
            <button
              type="button"
              onClick={() => setShowAddress(!showAddress)}
              className="flex items-center gap-2 text-teal-600 font-semibold mb-3 hover:text-teal-700"
            >
              <ChevronDown className={`transform transition-transform ${showAddress ? 'rotate-180' : ''}`} size={16} />
              {showAddress ? 'Hide' : 'Show'} Address Details
            </button>

            {showAddress && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-2">
                <InputField label="Street" name="address.street" value={formData.address.street} onChange={handleChange} placeholder="Street address" />
                <InputField label="City" name="address.city" value={formData.address.city} onChange={handleChange} placeholder="City" />
                <InputField label="State" name="address.state" value={formData.address.state} onChange={handleChange} placeholder="State" />
                <InputField label="Pincode" name="address.pincode" value={formData.address.pincode} onChange={handleChange} placeholder="Pincode" />
                <InputField label="Country" name="address.country" value={formData.address.country} onChange={handleChange} placeholder="Country" />
              </div>
            )}
          </div>

          {/* Emergency Contact Section */}
          <div className="bg-white/95 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-teal-100 shadow-md">
            <button
              type="button"
              onClick={() => setShowEmergency(!showEmergency)}
              className="flex items-center gap-2 text-teal-600 font-semibold mb-3 hover:text-teal-700"
            >
              <ChevronDown className={`transform transition-transform ${showEmergency ? 'rotate-180' : ''}`} size={16} />
              {showEmergency ? 'Hide' : 'Show'} Emergency Contact
            </button>

            {showEmergency && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-2">
                <InputField label="Contact Name" name="emergencyContact.name" value={formData.emergencyContact.name} onChange={handleChange} placeholder="Emergency contact name" />
                <InputField label="Relation" name="emergencyContact.relation" value={formData.emergencyContact.relation} onChange={handleChange} placeholder="Relation" />
                <InputField
                  label="Mobile"
                  name="emergencyContact.mobile"
                  value={formData.emergencyContact.mobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);

                    setFormData((prev) => ({
                      ...prev,
                      emergencyContact: {
                        ...prev.emergencyContact,
                        mobile: value,
                      },
                    }));
                  }}
                  placeholder="Emergency mobile number"
                  maxLength={10}
                />
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div className="bg-white/95 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-teal-100 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center">
                  <Shield className="text-teal-600" size={15} />
                </div>
                <h2 className="text-sm font-bold text-gray-800">Employee Documents</h2>
              </div>
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-xs font-semibold hover:bg-teal-100 transition-all">
                  <Upload size={12} />
                  Upload Documents
                </div>
                <input type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleDocumentUpload} />
              </label>
            </div>

            {uploadingDocs && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader size={20} className="animate-spin text-teal-600" />
                <span className="text-sm text-gray-500">Uploading documents...</span>
              </div>
            )}

            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <File size={40} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No documents uploaded yet</p>
                <p className="text-xs mt-1">Click "Upload Documents" to add files</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {documents.map((doc) => (
                  <div key={doc._id} className="doc-card rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <File size={16} className="text-teal-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-700 truncate">{doc.fileName}</p>
                        <p className="text-xs text-gray-400">
                          {formatFileSize(doc.fileSize)} • {formatDate(doc.uploadedAt)}
                        </p>
                        {doc.description && <p className="text-xs text-gray-500 mt-1">{doc.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-teal-500 hover:bg-teal-50 transition-all" title="View">
                        <Eye size={14} />
                      </a>
                      <a href={doc.filePath} download className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-all" title="Download">
                        <Download size={14} />
                      </a>
                      <button onClick={() => handleDeleteDocument(doc._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Toggle */}
          <div className="bg-white/95 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-teal-100 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <label className="cursor-pointer shrink-0">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="sr-only" />
                <div className="toggle-track" style={{ background: formData.isActive ? "#0d9488" : "#d1d5db" }}>
                  <div className="toggle-thumb" style={{ transform: formData.isActive ? "translateX(20px)" : "translateX(0)" }} />
                </div>
              </label>
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-sm">
                  {formData.isActive ? "Active Employee" : "Inactive Employee"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formData.isActive
                    ? "Employee can log in and appears in active reports"
                    : "Employee is deactivated and hidden from active lists"}
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate("/staff")}
              className="flex-1 sm:flex-none sm:w-36 py-3 rounded-xl border-2 border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-teal-500/25 hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-60"
            >
              {submitting ? <><Loader size={17} className="spin-i" />Updating…</> : "Update Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InputField = ({ icon, label, className = "", ...props }) => (
  <div>
    {label && <label className="text-xs font-semibold text-gray-700 mb-1 block">{label}</label>}
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
      <input {...props} className={`inp h-10 ${icon ? "pl-9" : "pl-3.5"} pr-3.5 rounded-lg text-sm text-gray-700 ${className}`} />
    </div>
  </div>
);

const SelectField = ({ icon, label, options, className = "", ...props }) => (
  <div>
    {label && <label className="text-xs font-semibold text-gray-700 mb-1 block">{label}</label>}
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
      <select {...props} className={`inp h-10 ${icon ? "pl-9" : "pl-3.5"} pr-8 rounded-lg text-sm text-gray-700 appearance-none cursor-pointer ${className}`}>
        <option value="">Select {label}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
    </div>
  </div>
);

export default EditStaff;