import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { UserPlus, X, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { API_BASE } from "../../utils/Auth";

const API_URL = `${API_BASE}/clients`;
const adminDetails = JSON.parse(sessionStorage.getItem("adminDetails"));
const AUTH_TOKEN = adminDetails?.token;

const REQUIREMENT_OPTIONS = [
  "Static Website",
  "Digital Marketing",
  "Web Application",
  "Maintenance",
  "Other",
];

const AddClient = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    requirement: [],
    mobile: "",
    email: "",
    address: "",
    lead: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ---------- validation ----------
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "name":
        if (!value.trim()) {
          error = "Client name is required";
        } else if (value.trim().length < 2) {
          error = "Client name must be at least 2 characters";
        } else if (!/^[a-zA-Z\s\-\.]+$/.test(value.trim())) {
          error = "Client name can only contain letters, spaces, hyphens, and dots";
        }
        break;

      case "mobile":
        if (!value.trim()) {
          error = "Mobile number is required";
        } else {
          const mobileRegex = /^\+?[0-9]{10,15}$/;
          if (!mobileRegex.test(value.trim())) {
            error = "Mobile number must be 10-15 digits (e.g., +1987654321 or 9876543210)";
          }
        }
        break;

      case "email":
        if (!value.trim()) {
          error = "Email address is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address";
        }
        break;

      case "address":
        if (!value.trim()) {
          error = "Address is required";
        }
        break;

      case "lead":
        if (!value.trim()) {
          error = "Lead source is required";
        }
        break;

      default:
        break;
    }

    return error;
  };

  const validateForm = () => {
    const newErrors = {};
    newErrors.name = validateField("name", formData.name);
    newErrors.mobile = validateField("mobile", formData.mobile);
    newErrors.email = validateField("email", formData.email);
    newErrors.address = validateField("address", formData.address);
    newErrors.lead = validateField("lead", formData.lead);
    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "mobile") {
      const formattedValue = value.replace(/[^+\d]/g, "").slice(0, 16);
      setFormData({ ...formData, [name]: formattedValue });
      if (touched[name]) {
        const error = validateField(name, formattedValue);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
      return;
    }

    setFormData({ ...formData, [name]: value });
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  // ---------- requirement checkbox toggle ----------
  const handleRequirementToggle = (option) => {
    setFormData((prev) => {
      const already = prev.requirement.includes(option);
      return {
        ...prev,
        requirement: already
          ? prev.requirement.filter((r) => r !== option)
          : [...prev.requirement, option],
      };
    });
  };

  // ---------- submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const allFields = ["name", "mobile", "email", "address", "lead"];
    const touchedFields = {};
    allFields.forEach((field) => {
      touchedFields[field] = true;
    });
    setTouched(touchedFields);

    if (!validateForm()) {
      const errorMessages = Object.values(errors).filter((e) => e);
      if (errorMessages.length > 0) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: errorMessages[0],
          confirmButtonColor: "#0d9488",
        });
      }
      const firstErrorField = Object.keys(errors).find((key) => errors[key]);
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        }
      }
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        requirement: formData.requirement,
        mobile: formData.mobile.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        lead: formData.lead.trim(),
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success !== false) {
        const clientName = data.data?.name || formData.name;
        Swal.fire({
          icon: "success",
          title: "Client Created!",
          text: `Client "${clientName}" has been created successfully.`,
          confirmButtonColor: "#0d9488",
          timer: 2000,
          timerProgressBar: true,
        }).then(() => {
          navigate("/allclients");
        });
      } else {
        let errorMsg = "Failed to create client.";
        if (data.errors && Array.isArray(data.errors)) {
          errorMsg = data.errors.join(", ");
        } else if (data.message) {
          errorMsg = data.message;
        } else if (data.error) {
          errorMsg = data.error;
        }
        Swal.fire({
          icon: "error",
          title: "Creation Failed",
          text: errorMsg,
          confirmButtonColor: "#0d9488",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: "Unable to connect to the server. Please check your connection and try again.",
        confirmButtonColor: "#0d9488",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/90 via-white to-teal-100/70">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { font-family:'Inter',-apple-system,sans-serif; box-sizing:border-box; }

        .glass-card {
          background:rgba(255,255,255,0.93);
          backdrop-filter:blur(20px);
          -webkit-backdrop-filter:blur(20px);
          border:1px solid rgba(64,224,208,0.22);
          box-shadow:0 12px 40px -8px rgba(0,128,128,0.18);
        }

        .f-inp {
          width:100%; background:#fff;
          border:1.5px solid rgba(0,128,128,0.15);
          transition:border-color .22s, box-shadow .22s;
        }
        .f-inp:focus { border-color:#0d9488; box-shadow:0 0 0 3px rgba(13,148,136,0.11); outline:none; }
        .f-inp-error { border-color:#ef4444; }
        .f-inp-error:focus { border-color:#ef4444; box-shadow:0 0 0 3px rgba(239,68,68,0.11); }

        @keyframes slideDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        .toast-in { animation:slideDown .3s ease forwards; }
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        .spin { animation:spin .8s linear infinite; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp .35s ease forwards; }

        .s-div {
          display:flex; align-items:center; gap:10px;
          margin-bottom:1rem;
        }
        .s-div::before, .s-div::after {
          content:''; flex:1; height:1px;
          background:linear-gradient(to right,transparent,rgba(20,184,166,.3),transparent);
        }

        .helper-text {
          font-size: 0.7rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .req-card {
          display:flex; align-items:center; gap:10px;
          padding:12px 14px;
          border-radius:14px;
          border:1.5px solid rgba(0,128,128,0.15);
          background:#fff;
          cursor:pointer;
          transition:border-color .2s, background .2s, box-shadow .2s;
          user-select:none;
        }
        .req-card:hover { border-color:#5eead4; background:#f0fdfa; }
        .req-card.checked {
          border-color:#0d9488;
          background:linear-gradient(180deg,#f0fdfa 0%,#ccfbf1 100%);
          box-shadow:0 0 0 3px rgba(13,148,136,0.08);
        }
        .req-box {
          width:20px; height:20px;
          border-radius:6px;
          border:2px solid #cbd5e1;
          display:flex; align-items:center; justify-content:center;
          transition:all .15s ease;
          flex-shrink:0;
          background:#fff;
        }
        .req-card.checked .req-box {
          border-color:#0d9488;
          background:#0d9488;
        }
        .req-label {
          font-size:0.875rem;
          font-weight:500;
          color:#334155;
        }
        .req-card.checked .req-label { color:#0f766e; font-weight:600; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div
          className={`toast-in fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl font-semibold text-sm max-w-sm ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle size={17} className="shrink-0" />
          ) : (
            <AlertCircle size={17} className="shrink-0" />
          )}
          <span className="flex-1 text-xs sm:text-sm">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="opacity-80 hover:opacity-100 ml-1 shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <UserPlus className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight">
                Add Client
              </h1>
              <p className="text-sm text-gray-500">
                Register new client with complete details
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/allclients")}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-teal-300 text-gray-600 font-semibold text-sm hover:shadow-md transition-all w-full sm:w-auto"
          >
            ← Back
          </button>
        </div>

        {/* Main Card */}
        <div className="glass-card rounded-3xl p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="s-div">
              <span className="text-xs font-bold text-teal-600 tracking-widest uppercase whitespace-nowrap">
                👤 Client Details
              </span>
            </div>

            <div className="space-y-4">
              <FInp
                name="name"
                label="Client Name"
                placeholder="Enter client name"
                value={formData.name}
                onChange={handleChange}
                onBlur={() => handleBlur("name")}
                required
                error={touched.name && errors.name}
              />

              {/* ---------- REQUIREMENTS ---------- */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Requirements
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {REQUIREMENT_OPTIONS.map((option) => {
                    const checked = formData.requirement.includes(option);
                    return (
                      <label
                        key={option}
                        className={`req-card ${checked ? "checked" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => handleRequirementToggle(option)}
                        />
                        <span className="req-box">
                          {checked && (
                            <svg
                              viewBox="0 0 24 24"
                              width="12"
                              height="12"
                              fill="none"
                              stroke="white"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <span className="req-label">{option}</span>
                      </label>
                    );
                  })}
                </div>
                {formData.requirement.length === 0 && (
                  <p className="helper-text mt-2">
                    No requirement selected yet — you can pick one or more.
                  </p>
                )}
              </div>

              <div>
                <FInp
                  name="mobile"
                  label="Mobile Number"
                  placeholder="e.g., +1987654321 or 9876543210"
                  value={formData.mobile}
                  onChange={handleChange}
                  onBlur={() => handleBlur("mobile")}
                  type="tel"
                  maxLength={16}
                  required
                  error={touched.mobile && errors.mobile}
                />
                <p className="helper-text">
                  Enter 10-15 digits (with or without + prefix for country code)
                </p>
              </div>

              <FInp
                name="email"
                label="Email Address"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur("email")}
                type="email"
                required
                error={touched.email && errors.email}
              />

              <FInp
                name="address"
                label="Address"
                placeholder="Enter complete address"
                value={formData.address}
                onChange={handleChange}
                onBlur={() => handleBlur("address")}
                required
                error={touched.address && errors.address}
              />

              <FInp
                name="lead"
                label="Lead Source"
                placeholder="e.g., Website, Referral, Social Media, SEO Campaign"
                value={formData.lead}
                onChange={handleChange}
                onBlur={() => handleBlur("lead")}
                required
                error={touched.lead && errors.lead}
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate("/allclients")}
                className="flex-1 sm:flex-none sm:w-32 py-3 rounded-xl border-2 border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader size={17} className="spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <UserPlus size={17} />
                    Add Client
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const FInp = ({ label, className = "", error, ...props }) => (
  <div>
    {label && (
      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
        {label}
      </label>
    )}
    <input
      {...props}
      className={`w-full h-11 px-4 rounded-xl text-sm text-gray-700 bg-white border-2 ${
        error
          ? "border-red-400 focus:border-red-500"
          : "border-teal-200/50 focus:border-teal-500"
      } focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all ${className}`}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export default AddClient;