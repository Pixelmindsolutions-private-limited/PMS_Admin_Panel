import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  User,
  Phone,
  Mail,
  Briefcase,
  Calendar,
  Droplet,
  Lock,
  File,
  X,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Shield,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";

const API_BASE_URL = "https://pmsbackend.pixelmindsolutions.com/api/staff";

const adminDetails = JSON.parse(sessionStorage.getItem("adminDetails"));
const AUTH_TOKEN = adminDetails?.token;

const AddStaff = () => {
  const navigate = useNavigate();

  // ─── NEW: Step state ───────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    role: "",
    mobile: "",
    email: "",
    joiningDate: "",
    gender: "",
    bloodGroup: "",
    password: "",
    confirmPassword: "",
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

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [profilePreview, setProfilePreview] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [idCardImage, setIdCardImage] = useState(null);

  const [documents, setDocuments] = useState({
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

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showAddress, setShowAddress] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

  // Data from backend - no fallbacks
  const [roles, setRoles] = useState([]);
  const [bloodGroups, setBloodGroups] = useState([]);
  const [genders, setGenders] = useState(["Male", "Female"]);
  const [loadingData, setLoadingData] = useState(true);
  const [apiError, setApiError] = useState(false);

  // Validation functions
  const validateField = (name, value, formDataSnapshot = formData) => {
    let error = "";

    switch (name) {
      case "employeeId":
        if (!value.trim()) {
          error = "Employee ID is required";
        } else if (value.trim().length < 3) {
          error = "Employee ID must be at least 3 characters";
        }
        break;

      case "employeeName":
        if (!value.trim()) {
          error = "Employee name is required";
        } else if (value.trim().length < 2) {
          error = "Name must be at least 2 characters";
        } else if (!/^[a-zA-Z\s\-\.]+$/.test(value.trim())) {
          error = "Name can only contain letters, spaces, hyphens, and dots";
        }
        break;

      case "role":
        if (!value) {
          error = "Role is required";
        }
        break;

      case "mobile":
        if (!value) {
          error = "Mobile number is required";
        } else if (!/^[0-9]{10}$/.test(value)) {
          error = "Mobile number must be exactly 10 digits";
        }
        break;

      case "email":
        if (!value.trim()) {
          error = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address";
        }
        break;

      case "joiningDate":
        if (!value) {
          error = "Joining date is required";
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selectedDate > today) {
            error = "Joining date cannot be in the future";
          }
        }
        break;

      case "gender":
        if (!value) {
          error = "Gender is required";
        } else if (!genders.includes(value)) {
          error = "Invalid gender selected";
        }
        break;

      case "password":
        if (!value) {
          error = "Password is required";
        } else if (value.length < 6) {
          error = "Password must be at least 6 characters";
        } else if (!/(?=.*[A-Z])/.test(value)) {
          error = "Password must contain at least one uppercase letter";
        } else if (!/(?=.*[a-z])/.test(value)) {
          error = "Password must contain at least one lowercase letter";
        } else if (!/(?=.*[0-9])/.test(value)) {
          error = "Password must contain at least one number";
        }
        // Check confirm password if it exists
        if (formDataSnapshot.confirmPassword && value !== formDataSnapshot.confirmPassword) {
          setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
        } else if (formDataSnapshot.confirmPassword) {
          setErrors(prev => ({ ...prev, confirmPassword: "" }));
        }
        break;

      case "confirmPassword":
        if (!value) {
          error = "Please confirm your password";
        } else if (value !== formDataSnapshot.password) {
          error = "Passwords do not match";
        }
        break;

      case "address.street":
        if (showAddress && value && value.length > 100) {
          error = "Street address cannot exceed 100 characters";
        }
        break;

      case "address.city":
        if (showAddress && value && !/^[a-zA-Z\s\-]+$/.test(value)) {
          error = "City name can only contain letters";
        }
        break;

      case "address.pincode":
        if (showAddress && value && !/^[0-9]{6}$/.test(value)) {
          error = "Pincode must be exactly 6 digits";
        }
        break;

      case "emergencyContact.mobile":
        if (showEmergency && value && !/^[0-9]{10}$/.test(value)) {
          error = "Emergency contact number must be exactly 10 digits";
        }
        break;

      case "emergencyContact.name":
        if (showEmergency && value && value.length < 2) {
          error = "Emergency contact name must be at least 2 characters";
        }
        break;

      default:
        break;
    }

    return error;
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    newErrors.employeeId = validateField("employeeId", formData.employeeId);
    newErrors.employeeName = validateField("employeeName", formData.employeeName);
    newErrors.role = validateField("role", formData.role);
    newErrors.mobile = validateField("mobile", formData.mobile);
    newErrors.email = validateField("email", formData.email);
    newErrors.joiningDate = validateField("joiningDate", formData.joiningDate);
    newErrors.gender = validateField("gender", formData.gender);
    newErrors.password = validateField("password", formData.password);
    newErrors.confirmPassword = validateField("confirmPassword", formData.confirmPassword);

    // Optional fields validation if they have values
    if (formData.bloodGroup && !bloodGroups.includes(formData.bloodGroup)) {
      newErrors.bloodGroup = "Invalid blood group selected";
    }

    if (showAddress) {
      if (formData.address.pincode && !/^[0-9]{6}$/.test(formData.address.pincode)) {
        newErrors["address.pincode"] = "Pincode must be exactly 6 digits";
      }
    }

    if (showEmergency) {
      if (formData.emergencyContact.mobile && !/^[0-9]{10}$/.test(formData.emergencyContact.mobile)) {
        newErrors["emergencyContact.mobile"] = "Emergency contact number must be exactly 10 digits";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).filter(key => newErrors[key]).length === 0;
  };

  // ─── NEW: Step-2 (Employee Details) validation only ────────────
  // Reuses the exact same validation logic — just scoped to the
  // employee-details fields for the "Next" button on Step 2.
  const validateEmployeeDetails = () => {
    const newErrors = {};

    newErrors.employeeId = validateField("employeeId", formData.employeeId);
    newErrors.employeeName = validateField("employeeName", formData.employeeName);
    newErrors.role = validateField("role", formData.role);
    newErrors.mobile = validateField("mobile", formData.mobile);
    newErrors.email = validateField("email", formData.email);
    newErrors.joiningDate = validateField("joiningDate", formData.joiningDate);
    newErrors.gender = validateField("gender", formData.gender);
    newErrors.password = validateField("password", formData.password);
    newErrors.confirmPassword = validateField("confirmPassword", formData.confirmPassword);

    if (formData.bloodGroup && !bloodGroups.includes(formData.bloodGroup)) {
      newErrors.bloodGroup = "Invalid blood group selected";
    }

    if (showAddress) {
      if (formData.address.pincode && !/^[0-9]{6}$/.test(formData.address.pincode)) {
        newErrors["address.pincode"] = "Pincode must be exactly 6 digits";
      }
    }

    if (showEmergency) {
      if (formData.emergencyContact.mobile && !/^[0-9]{10}$/.test(formData.emergencyContact.mobile)) {
        newErrors["emergencyContact.mobile"] = "Emergency contact number must be exactly 10 digits";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).filter(key => newErrors[key]).length === 0;
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name,
      name.includes('.') ?
        name.split('.').reduce((obj, key) => obj?.[key], formData) :
        formData[name]
    );
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Fetch roles and blood groups from backend
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/metadata`);
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.roles && data.bloodGroups) {
          setRoles(data.roles);
          setBloodGroups(data.bloodGroups);
          if (data.genders && data.genders.length) {
            setGenders(data.genders);
          }
          setApiError(false);
        } else {
          throw new Error("Invalid data format");
        }
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        setApiError(true);
        Swal.fire({
          icon: 'error',
          title: 'Failed to Load Data',
          text: 'Unable to fetch roles and blood groups from the server. Please refresh the page.',
          confirmButtonColor: '#0d9488',
        });
      } finally {
        setLoadingData(false);
      }
    };

    fetchDropdownData();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));

      // Validate on change
      if (touched[name]) {
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
      }
    } else {
      setFormData({ ...formData, [name]: value });

      // Validate on change
      if (touched[name]) {
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
      }
    }
  };

  const handleImageUpload = (e, setter, previewSetter) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size and type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid File Type',
        text: 'Please upload only JPEG, JPG, or PNG images.',
        confirmButtonColor: '#0d9488',
      });
      return;
    }

    if (file.size > maxSize) {
      Swal.fire({
        icon: 'warning',
        title: 'File Too Large',
        text: 'Image size should not exceed 5MB.',
        confirmButtonColor: '#0d9488',
      });
      return;
    }

    setter(file);
    const reader = new FileReader();
    reader.onload = () => previewSetter(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDocs = (e, key) => {
    const files = Array.from(e.target.files);
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    const largeFiles = files.filter(file => file.size > maxSize);

    if (invalidFiles.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid File Type',
        text: 'Please upload only PDF, JPEG, or PNG files.',
        confirmButtonColor: '#0d9488',
      });
      return;
    }

    if (largeFiles.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'File Too Large',
        text: 'Each file should not exceed 5MB.',
        confirmButtonColor: '#0d9488',
      });
      return;
    }

    setDocuments((prev) => ({ ...prev, [key]: [...prev[key], ...files] }));
  };

  const removeDoc = (key, index) =>
    setDocuments((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));

  // ─── NEW: Step 1 → Step 2 handler ──────────────────────────────
  const handleNextFromPhotos = () => {
    if (!profileImage || !idCardImage) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Photos',
        text: 'Please upload both the Profile Photo and the ID Card Image before proceeding.',
        confirmButtonColor: '#0d9488',
      });
      return;
    }
    setCurrentStep(2);
  };

  // ─── NEW: Step 2 → Step 3 handler ──────────────────────────────
  const handleNextFromDetails = () => {
    // Mark all Step-2 fields as touched so errors display
    const step2Fields = [
      'employeeId', 'employeeName', 'role', 'mobile', 'email',
      'joiningDate', 'gender', 'password', 'confirmPassword'
    ];
    const touchedFields = { ...touched };
    step2Fields.forEach(field => { touchedFields[field] = true; });
    setTouched(touchedFields);

    if (!validateEmployeeDetails()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors).find(key => errors[key]);
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }

      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please check all required fields and fix the errors before proceeding.',
        confirmButtonColor: '#0d9488',
      });
      return;
    }

    setCurrentStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allFields = [
      'employeeId', 'employeeName', 'role', 'mobile', 'email', 'joiningDate', 'gender', 'password', 'confirmPassword'
    ];
    const touchedFields = {};
    allFields.forEach(field => { touchedFields[field] = true; });
    setTouched(touchedFields);

    // Validate form
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors).find(key => errors[key]);
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }

      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please check all required fields and fix the errors before submitting.',
        confirmButtonColor: '#0d9488',
      });
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Add text fields
      formDataToSend.append('employeeId', formData.employeeId.trim());
      formDataToSend.append('employeeName', formData.employeeName.trim());
      formDataToSend.append('role', formData.role);
      formDataToSend.append('mobile', formData.mobile.trim());
      formDataToSend.append('email', formData.email.trim());
      formDataToSend.append('joiningDate', formData.joiningDate || new Date().toISOString());
      formDataToSend.append('gender', formData.gender || '');
      formDataToSend.append('bloodGroup', formData.bloodGroup || 'Unknown');
      formDataToSend.append('password', formData.password);

      // Add address as JSON string if any field has value
      const hasAddress = formData.address.street || formData.address.city ||
        formData.address.state || formData.address.pincode;
      if (hasAddress) {
        formDataToSend.append('address', JSON.stringify(formData.address));
      }

      // Add emergency contact as JSON string if any field has value
      const hasEmergency = formData.emergencyContact.name ||
        formData.emergencyContact.relation ||
        formData.emergencyContact.mobile;
      if (hasEmergency) {
        formDataToSend.append('emergencyContact', JSON.stringify(formData.emergencyContact));
      }

      // Add files
      if (profileImage) {
        formDataToSend.append('profileImage', profileImage);
      }
      if (idCardImage) {
        formDataToSend.append('idCardImage', idCardImage);
      }

      // Add documents
      let docCounter = 0;
      for (const [docType, files] of Object.entries(documents)) {
        files.forEach((file) => {
          formDataToSend.append('documents', file);
          formDataToSend.append(`documentType_${docCounter}`, docType);
          docCounter++;
        });
      }

      const response = await fetch(`${API_BASE_URL}/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: formDataToSend,
      });

      const json = await response.json();

      if (response.ok && json.success !== false) {
        Swal.fire({
          icon: 'success',
          title: 'Employee Added Successfully!',
          text: `Employee ${json.data.employeeId || formData.employeeId} has been added to the system.`,
          confirmButtonColor: '#0d9488',
          timer: 2000,
          timerProgressBar: true,
        }).then(() => {
          navigate("/staff");
        });
      } else {
        const errMsg = json.errors
          ? json.errors.join(", ")
          : json.message || json.error || "Failed to add employee. Please try again.";

        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: errMsg,
          confirmButtonColor: '#0d9488',
        });
      }
    } catch (error) {
      console.error('Submit error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Unable to connect to the server. Please check your internet connection and try again.',
        confirmButtonColor: '#0d9488',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50/90 via-white to-teal-100/80">
        <div className="text-center">
          <Loader size={40} className="animate-spin mx-auto mb-4 text-teal-600" />
          <p className="text-gray-600 font-medium">Loading roles and blood groups...</p>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50/90 via-white to-teal-100/80">
        <div className="text-center bg-red-50 p-8 rounded-xl max-w-md shadow-lg">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600 mb-4">Unable to fetch roles and blood groups from the server.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/90 via-white to-teal-100/80">
      {toast && (
        <div className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 rounded-2xl shadow-2xl font-semibold text-sm max-w-[calc(100vw-2rem)] sm:max-w-sm transition-all duration-300 animate-in slide-in-from-top-2 ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}>
          {toast.type === "success"
            ? <CheckCircle size={18} className="flex-shrink-0" />
            : <AlertCircle size={18} className="flex-shrink-0" />}
          <span className="flex-1 text-xs sm:text-sm leading-snug">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-80 hover:opacity-100 flex-shrink-0 ml-1 transition-opacity">
            <X size={15} />
          </button>
        </div>
      )}

      <div className="w-full max-w-5xl mx-auto px-3 rounded-lg sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-8 animate-in fade-in duration-500">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30 flex-shrink-0">
              <User className="text-white" size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight truncate">
                Add New Employee
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Create profile with secure document storage
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/staff")}
            className="group flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-white shadow-md hover:shadow-lg border border-teal-100 hover:border-teal-300 transition-all hover:scale-[1.02] text-sm font-semibold text-teal-700 w-full sm:w-auto flex-shrink-0"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Staff
          </button>
        </div>

        {/* ─── NEW: Step indicator ────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 ${
                    currentStep === step
                      ? "bg-gradient-to-br from-teal-600 to-teal-500 text-white shadow-lg shadow-teal-500/30 scale-110"
                      : currentStep > step
                      ? "bg-teal-100 text-teal-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {currentStep > step ? <CheckCircle size={14} /> : step}
                </div>
                <span
                  className={`text-xs sm:text-sm font-semibold hidden sm:inline ${
                    currentStep === step
                      ? "text-teal-700"
                      : currentStep > step
                      ? "text-teal-600"
                      : "text-gray-400"
                  }`}
                >
                  {step === 1 ? "Photos" : step === 2 ? "Details" : "Documents"}
                </span>
              </div>
              {step < 3 && (
                <div
                  className={`h-0.5 w-6 sm:w-12 rounded-full transition-colors duration-300 ${
                    currentStep > step ? "bg-teal-400" : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white/93 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border border-teal-200/30 animate-in fade-in duration-500 delay-100">
          {/* ═══════════════════════════════════════════════════════
              STEP 1 — PHOTOS
              ═══════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal-300/50 to-transparent"></div>
                <span className="text-xs font-bold text-teal-600 tracking-widest uppercase whitespace-nowrap">
                  Photos
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal-300/50 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <ImageUpload
                  title="Profile Photo"
                  preview={profilePreview}
                  icon={<User size={30} className="text-teal-400" />}
                  onChange={(e) => handleImageUpload(e, setProfileImage, setProfilePreview)}
                />
                <ImageUpload
                  title="ID Card Image"
                  preview={idPreview}
                  icon={<CreditCard size={30} className="text-teal-400" />}
                  onChange={(e) => handleImageUpload(e, setIdCardImage, setIdPreview)}
                />
              </div>

              {/* Cancel + Next buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/staff")}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 px-6 rounded-xl bg-white border-2 border-teal-200 text-teal-700 font-bold text-sm sm:text-base hover:border-teal-400 hover:bg-teal-50/50 transition-all duration-300"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleNextFromPhotos}
                  className="flex-1 flex items-center justify-center gap-2.5 py-3.5 sm:py-4 px-6 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/35 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                >
                  Next
                  <ArrowRight size={18} />
                </button>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 2 — EMPLOYEE DETAILS
              ═══════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal-300/50 to-transparent"></div>
                <span className="text-xs font-bold text-teal-600 tracking-widest uppercase whitespace-nowrap">
                  Employee Details
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal-300/50 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
                <FInput
                  label="Employee ID"
                  icon={<User size={14} />}
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  onBlur={() => handleBlur("employeeId")}
                  placeholder="e.g. EMP001"
                  required
                  error={touched.employeeId && errors.employeeId}
                />
                <FInput
                  label="Employee Name"
                  icon={<User size={14} />}
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleChange}
                  onBlur={() => handleBlur("employeeName")}
                  placeholder="e.g. John Doe"
                  required
                  error={touched.employeeName && errors.employeeName}
                />
                <FSelect
                  label="Role"
                  icon={<Briefcase size={14} />}
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  onBlur={() => handleBlur("role")}
                  options={roles}
                  required
                  error={touched.role && errors.role}
                />
                <FInput
                  label="Mobile"
                  icon={<Phone size={14} />}
                  name="mobile"
                  value={formData.mobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setFormData((prev) => ({
                      ...prev,
                      mobile: value,
                    }));
                    if (touched.mobile) {
                      const error = validateField("mobile", value);
                      setErrors(prev => ({ ...prev, mobile: error }));
                    }
                  }}
                  onBlur={() => handleBlur("mobile")}
                  placeholder="10-digit number"
                  maxLength={10}
                  required
                  error={touched.mobile && errors.mobile}
                />
                <FInput
                  label="Email"
                  icon={<Mail size={14} />}
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur("email")}
                  type="email"
                  placeholder="john@example.com"
                  required
                  error={touched.email && errors.email}
                />
                <FInput
                  label="Joining Date"
                  icon={<Calendar size={14} />}
                  name="joiningDate"
                  value={formData.joiningDate}
                  onChange={handleChange}
                  onBlur={() => handleBlur("joiningDate")}
                  type="date"
                  required
                  error={touched.joiningDate && errors.joiningDate}
                />
                <FSelect
                  label="Gender"
                  icon={<User size={14} />}
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  onBlur={() => handleBlur("gender")}
                  options={genders}
                  required
                  error={touched.gender && errors.gender}
                />
                <FSelect
                  label="Blood Group"
                  icon={<Droplet size={14} />}
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  options={bloodGroups}
                />
                <FInput
                  label="Password"
                  icon={<Lock size={14} />}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur("password")}
                  type="password"
                  placeholder="Min 6 chars with uppercase, lowercase & number"
                  required
                  error={touched.password && errors.password}
                />
                <FInput
                  label="Confirm Password"
                  icon={<Lock size={14} />}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur("confirmPassword")}
                  type="password"
                  placeholder="Re-enter password"
                  required
                  error={touched.confirmPassword && errors.confirmPassword}
                />
              </div>

              {/* Address Section */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setShowAddress(!showAddress)}
                  className="flex items-center gap-2 text-teal-600 font-semibold mb-3 hover:text-teal-700 transition-colors"
                >
                  <ChevronDown className={`transform transition-transform duration-200 ${showAddress ? 'rotate-180' : ''}`} size={16} />
                  {showAddress ? 'Hide' : 'Show'} Address Details
                </button>

                {showAddress && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 p-4 bg-gray-50 rounded-xl animate-in fade-in duration-200">
                    <FInput
                      label="Street"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleChange}
                      onBlur={() => handleBlur("address.street")}
                      placeholder="Street address"
                      error={touched["address.street"] && errors["address.street"]}
                    />
                    <FInput
                      label="City"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      onBlur={() => handleBlur("address.city")}
                      placeholder="City"
                      error={touched["address.city"] && errors["address.city"]}
                    />
                    <FInput
                      label="State"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      placeholder="State"
                    />
                    <FInput
                      label="Pincode"
                      name="address.pincode"
                      value={formData.address.pincode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address, pincode: value }
                        }));
                        if (touched["address.pincode"]) {
                          const error = validateField("address.pincode", value);
                          setErrors(prev => ({ ...prev, "address.pincode": error }));
                        }
                      }}
                      onBlur={() => handleBlur("address.pincode")}
                      placeholder="Pincode"
                      error={touched["address.pincode"] && errors["address.pincode"]}
                    />
                    <FInput
                      label="Country"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleChange}
                      placeholder="Country"
                    />
                  </div>
                )}
              </div>

              {/* Emergency Contact Section */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setShowEmergency(!showEmergency)}
                  className="flex items-center gap-2 text-teal-600 font-semibold mb-3 hover:text-teal-700 transition-colors"
                >
                  <ChevronDown className={`transform transition-transform duration-200 ${showEmergency ? 'rotate-180' : ''}`} size={16} />
                  {showEmergency ? 'Hide' : 'Show'} Emergency Contact
                </button>

                {showEmergency && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 p-4 bg-gray-50 rounded-xl animate-in fade-in duration-200">
                    <FInput
                      label="Contact Name"
                      name="emergencyContact.name"
                      value={formData.emergencyContact.name}
                      onChange={handleChange}
                      onBlur={() => handleBlur("emergencyContact.name")}
                      placeholder="Emergency contact name"
                      error={touched["emergencyContact.name"] && errors["emergencyContact.name"]}
                    />
                    <FInput
                      label="Relation"
                      name="emergencyContact.relation"
                      value={formData.emergencyContact.relation}
                      onChange={handleChange}
                      placeholder="Relation"
                    />
                    <FInput
                      label="Mobile"
                      name="emergencyContact.mobile"
                      value={formData.emergencyContact.mobile}
                      onChange={(e) => {
                        const mobile = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                        setFormData((prev) => ({
                          ...prev,
                          emergencyContact: {
                            ...prev.emergencyContact,
                            mobile,
                          },
                        }));
                        if (touched["emergencyContact.mobile"]) {
                          const error = validateField("emergencyContact.mobile", mobile);
                          setErrors(prev => ({ ...prev, "emergencyContact.mobile": error }));
                        }
                      }}
                      onBlur={() => handleBlur("emergencyContact.mobile")}
                      placeholder="Emergency mobile number"
                      maxLength={10}
                      error={touched["emergencyContact.mobile"] && errors["emergencyContact.mobile"]}
                    />
                  </div>
                )}
              </div>

              {/* Step 2 navigation */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 px-6 rounded-xl bg-white border-2 border-teal-200 text-teal-700 font-bold text-sm sm:text-base hover:border-teal-400 hover:bg-teal-50/50 transition-all duration-300"
                >
                  <ArrowLeft size={18} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextFromDetails}
                  className="flex-1 flex items-center justify-center gap-2.5 py-3.5 sm:py-4 px-6 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/35 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                >
                  Next
                  <ArrowRight size={18} />
                </button>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 3 — DOCUMENTS
              ═══════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal-300/50 to-transparent"></div>
                <span className="text-xs font-bold text-teal-600 tracking-widest uppercase whitespace-nowrap">
                  Documents
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal-300/50 to-transparent"></div>
              </div>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="text-teal-600" size={15} />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-gray-800">Employee Documents</h2>
                <span className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-3 py-0.5 rounded-full text-xs font-bold tracking-wide hidden sm:inline-block">
                  Secure Vault
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {Object.keys(documents).map((key) => (
                  <DocUpload
                    key={key}
                    title={formatTitle(key)}
                    files={documents[key]}
                    onChange={(e) => handleDocs(e, key)}
                    remove={(i) => removeDoc(key, i)}
                  />
                ))}
              </div>

              {/* Step 3 navigation */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 px-6 rounded-xl bg-white border-2 border-teal-200 text-teal-700 font-bold text-sm sm:text-base hover:border-teal-400 hover:bg-teal-50/50 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={18} />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2.5 py-3.5 sm:py-4 px-6 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/35 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <><Loader size={18} className="animate-spin" />Adding Employee…</>
                  ) : (
                    <><User size={18} />Add Employee to Directory</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-components
const ImageUpload = ({ title, preview, onChange, icon }) => (
  <div>
    <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block flex-shrink-0" />
      {title}
    </p>
    <label className="cursor-pointer block">
      <div className={`relative h-40 sm:h-48 lg:h-52 rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-white/55 to-teal-50/35 border-2 border-dashed transition-all duration-300 hover:border-teal-400 hover:bg-teal-50/10 hover:-translate-y-0.5 ${preview ? "border-solid border-teal-400" : "border-teal-200/60"
        }`}>
        {preview ? (
          <>
            <img src={preview} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            <span className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-semibold text-teal-700">
              ✓ Uploaded
            </span>
          </>
        ) : (
          <div className="text-center px-4 py-6">
            <div className="flex justify-center mb-2">{icon}</div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Click to upload</p>
            <p className="text-xs text-gray-400 mt-0.5">PNG, JPG up to 5MB</p>
          </div>
        )}
      </div>
      <input type="file" className="hidden" accept="image/*" onChange={onChange} />
    </label>
  </div>
);

const DocUpload = ({ title, files, onChange, remove }) => (
  <div className="bg-white/88 rounded-xl p-3.5 sm:p-4 border border-teal-200/30 shadow-sm transition-all duration-300 hover:border-teal-400/50 hover:shadow-md hover:-translate-y-0.5">
    <div className="flex items-center justify-between mb-2.5 gap-2">
      <span className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 truncate">
        <File size={13} className="text-teal-500 flex-shrink-0" />
        <span className="truncate">{title}</span>
      </span>
      {files.length > 0 && (
        <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0">
          {files.length}
        </span>
      )}
    </div>
    <label className="cursor-pointer block">
      <div className="border-2 border-dashed border-teal-200/60 rounded-lg h-16 sm:h-20 flex flex-col items-center justify-center gap-1 hover:border-teal-400 hover:bg-teal-50/50 transition-all duration-300">
        <File className="text-teal-300" size={18} />
        <span className="text-xs text-gray-400 font-medium">Upload Files</span>
      </div>
      <input multiple type="file" className="hidden" onChange={onChange} />
    </label>
    {files.length > 0 && (
      <div className="mt-2.5 space-y-1.5 max-h-24 overflow-y-auto">
        {files.map((file, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-50 px-2.5 py-1.5 rounded-lg gap-2">
            <span className="text-xs truncate text-gray-600 font-medium flex-1">{file.name}</span>
            <button type="button" onClick={() => remove(i)} className="flex-shrink-0 transition-transform hover:scale-110">
              <X size={13} className="text-red-400 hover:text-red-600 transition-colors" />
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

const FInput = ({ label, icon, className = "", error, ...props }) => (
  <div>
    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5 block">{label}</label>
    <div className="relative">
      {icon && (
        <span className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={`w-full bg-white border-2 rounded-lg sm:rounded-xl text-sm text-gray-700 placeholder:text-gray-400 transition-all duration-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none h-10 sm:h-11 ${icon ? "pl-9 sm:pl-10" : "pl-3.5"
          } pr-3.5 ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-teal-200/30"
          } ${className}`}
      />
    </div>
    {error && (
      <p className="text-xs text-red-500 mt-1">{error}</p>
    )}
  </div>
);

const FSelect = ({ label, icon, options, className = "", error, ...props }) => (
  <div>
    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5 block">{label}</label>
    <div className="relative">
      {icon && (
        <span className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
          {icon}
        </span>
      )}
      <select
        {...props}
        className={`w-full bg-white border-2 rounded-lg sm:rounded-xl text-sm text-gray-700 appearance-none cursor-pointer transition-all duration-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none h-10 sm:h-11 ${icon ? "pl-9 sm:pl-10" : "pl-3.5"
          } pr-8 ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-teal-200/30"
          } ${className}`}
      >
        <option value="">Select {label}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
    </div>
    {error && (
      <p className="text-xs text-red-500 mt-1">{error}</p>
    )}
  </div>
);

const formatTitle = (key) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

export default AddStaff;