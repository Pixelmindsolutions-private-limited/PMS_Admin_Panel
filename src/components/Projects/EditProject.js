import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { Loader, UserPlus, X } from "lucide-react";

const API_URL = "http://15.135.216.211:5000/api/projects";
const STAFF_URL = "http://15.135.216.211:5000/api/staff/options";
const adminDetails = JSON.parse(sessionStorage.getItem("adminDetails"));
const AUTH_TOKEN = adminDetails?.token;

const DEVELOPMENT_PHASES = [
  { id: "designing", label: "Design" },
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend" },
  { id: "testing", label: "Testing" },
  { id: "deployment", label: "Deployment" },
];

const MARKETING_PHASE = { id: "marketing", label: "Marketing" };

// Every key the API expects
const ALL_PHASES = [...DEVELOPMENT_PHASES, MARKETING_PHASE];

const isMarketingCategory = (c) => ["digital marketing", "digital market"].includes(String(c || "").toLowerCase());

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);

  const [formData, setFormData] = useState({
    projectName: "",
    projectCost: "",
    gstPercent: "",
    projectStartDate: "",
    projectEndDate: "",
    deadline: "",
    paymentMilestone: "",
    category: "software",
  });

  const [workDivision, setWorkDivision] = useState({});
  const [teamAssignment, setTeamAssignment] = useState({});
  const [errors, setErrors] = useState({});

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    fetchStaff();
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchStaff = async () => {
    try {
      const response = await fetch(STAFF_URL, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      });
      const data = await response.json();
      if (data.success) setStaff(data.data || []);
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setStaffLoading(false);
    }
  };

  // Make sure every phase key exists (marketing included)
  const normalizeDivision = (wd = {}) => {
    const out = {};
    ALL_PHASES.forEach((p) => { out[p.id] = Number(wd?.[p.id]) || 0; });
    return out;
  };
  const normalizeTeam = (ta = {}) => {
    const out = {};
    ALL_PHASES.forEach((p) => { out[p.id] = Array.isArray(ta?.[p.id]) ? ta[p.id] : []; });
    return out;
  };

  const fetchProject = async () => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      });
      const data = await response.json();

      if (data.success) {
        const project = data.data;
        const formatDate = (date) => (date ? new Date(date).toISOString().split("T")[0] : "");

        setFormData({
          projectName: project.projectName || "",
          projectCost: project.projectCost != null ? String(project.projectCost) : "",
          gstPercent: project.gstPercent != null ? String(project.gstPercent) : "",
          projectStartDate: formatDate(project.projectStartDate),
          projectEndDate: formatDate(project.projectEndDate),
          deadline: formatDate(project.deadline),
          paymentMilestone: project.paymentMilestone != null ? String(project.paymentMilestone) : "",
          category: project.category || "software",
        });

        setWorkDivision(normalizeDivision(project.workDivision));
        setTeamAssignment(normalizeTeam(project.teamAssignment));
      } else {
        showToast("error", data.message || "Failed to load project");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      showToast("error", "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleWorkDivisionChange = (phaseId, value) => {
    const numValue = parseInt(value) || 0;
    setWorkDivision((prev) => ({
      ...prev,
      [phaseId]: Math.min(100, Math.max(0, numValue)),
    }));
  };

  const getAvailableStaffForPhase = (phaseId) => {
    const assignedIds = (teamAssignment[phaseId] || []).map((s) => s.employeeId);
    return staff.filter((s) => !assignedIds.includes(s.employeeId));
  };

  const addTeamMember = (phaseId, employeeId) => {
    if (!employeeId) return;
    const employee = staff.find((s) => s.employeeId === employeeId);
    if (!employee) return;

    const currentMembers = teamAssignment[phaseId] || [];
    if (!currentMembers.find((m) => m.employeeId === employee.employeeId)) {
      setTeamAssignment((prev) => ({
        ...prev,
        [phaseId]: [
          ...currentMembers,
          { employeeId: employee.employeeId, name: employee.employeeName, role: phaseId },
        ],
      }));
    }
  };

  const removeTeamMember = (phaseId, employeeId) => {
    setTeamAssignment((prev) => ({
      ...prev,
      [phaseId]: (prev[phaseId] || []).filter((m) => m.employeeId !== employeeId),
    }));
  };

  // Phases shown depend on category
  const isMarketing = isMarketingCategory(formData.category);
  const visiblePhases = isMarketing ? [MARKETING_PHASE] : DEVELOPMENT_PHASES;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.projectName.trim()) newErrors.projectName = "Project name is required";

    if (formData.gstPercent === "" || isNaN(Number(formData.gstPercent)) || Number(formData.gstPercent) < 0 || Number(formData.gstPercent) > 100) {
      newErrors.gstPercent = "GST % must be between 0 and 100";
    }

    visiblePhases.forEach((phase) => {
      if (!teamAssignment[phase.id] || teamAssignment[phase.id].length === 0) {
        newErrors[`${phase.id}_members`] = `At least one team member is required for ${phase.label}`;
      }
    });

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: Object.values(errs)[0],
        confirmButtonColor: "#0d9488",
      });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        projectName: formData.projectName.trim(),
        projectCost: Number(formData.projectCost),
        gstPercent: Number(formData.gstPercent),
        projectStartDate: formData.projectStartDate,
        projectEndDate: formData.projectEndDate,
        deadline: formData.deadline,
        paymentMilestone: Number(formData.paymentMilestone),
        category: formData.category,
        workDivision: normalizeDivision(workDivision),
        teamAssignment: normalizeTeam(teamAssignment),
      };

      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success !== false) {
        showToast("success", "Project updated successfully!");
        setTimeout(() => navigate("/projects"), 1800);
      } else {
        const errorMsg = data.errors ? data.errors.join(", ") : data.message || "Update failed";
        showToast("error", errorMsg);
      }
    } catch (error) {
      console.error("Submit error:", error);
      showToast("error", "Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-11 h-11 border-3 border-gray-200 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium text-sm">Loading project…</p>
        </div>
      </div>
    );
  }

  const totalWorkDivision = visiblePhases.reduce((sum, p) => sum + (workDivision[p.id] || 0), 0);

  // GST preview
  const costNum = Number(formData.projectCost) || 0;
  const gstNum = Number(formData.gstPercent) || 0;
  const gstAmount = (costNum * gstNum) / 100;

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl font-semibold text-sm text-white ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/projects")}
              className="w-10 h-10 rounded-xl bg-white shadow border border-gray-100 flex items-center justify-center text-gray-500 hover:text-teal-600 hover:border-teal-200 transition-all"
            >
              ←
            </button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">Edit Project</h1>
              <p className="text-sm text-slate-400">Update project details &amp; team</p>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-teal-200/30 shadow-xl p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Project Details */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-teal-300/30"></div>
                <span className="text-xs font-bold text-teal-600 tracking-widest uppercase whitespace-nowrap">📋 Project Details</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-teal-300/30"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  name="projectName"
                  label="Project Name"
                  placeholder="Enter project name"
                  value={formData.projectName}
                  onChange={handleChange}
                  error={errors.projectName}
                  required
                />
                <InputField
                  name="category"
                  label="Category"
                  type="select"
                  value={formData.category}
                  onChange={handleChange}
                  options={[
                    { value: "website", label: "Website" },
                    { value: "mobile app", label: "Mobile App" },
                    { value: "software", label: "Software" },
                    { value: "digital marketing", label: "Digital Marketing" },
                  ]}
                />
                <InputField name="projectStartDate" label="Start Date" type="date" value={formData.projectStartDate} onChange={handleChange} />
                <InputField name="projectEndDate" label="End Date" type="date" value={formData.projectEndDate} onChange={handleChange} />
                <InputField name="deadline" label="Deadline" type="date" value={formData.deadline} onChange={handleChange} />
                <InputField
                  name="projectCost"
                  label="Project Cost (₹)"
                  type="number"
                  placeholder="0"
                  value={formData.projectCost}
                  onChange={handleChange}
                />
                <InputField
                  name="gstPercent"
                  label="GST (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="e.g. 9"
                  value={formData.gstPercent}
                  onChange={handleChange}
                  error={errors.gstPercent}
                />
                <InputField
                  name="paymentMilestone"
                  label="Payment Milestones"
                  type="number"
                  placeholder="0"
                  value={formData.paymentMilestone}
                  onChange={handleChange}
                />
              </div>

              {costNum > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                  <div>
                    <p className="text-[11px] text-gray-500 font-semibold uppercase">Cost</p>
                    <p className="text-sm font-bold text-gray-800">₹{costNum.toLocaleString("en-IN")}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 font-semibold uppercase">GST ({gstNum}%)</p>
                    <p className="text-sm font-bold text-gray-800">₹{gstAmount.toLocaleString("en-IN")}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 font-semibold uppercase">Total</p>
                    <p className="text-sm font-bold text-teal-700">₹{(costNum + gstAmount).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Work Division */}
            <div className="bg-white/60 rounded-2xl border border-teal-200/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-teal-300/30"></div>
                <span className="text-xs font-bold text-teal-600 tracking-widest uppercase whitespace-nowrap">📊 Work Division</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-teal-300/30"></div>
              </div>

              <div className={`grid gap-3 ${isMarketing ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-5"}`}>
                {visiblePhases.map((phase) => (
                  <div key={phase.id}>
                    <label className="text-xs font-medium text-gray-600 block mb-1 capitalize">{phase.label}</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={workDivision[phase.id] || 0}
                      onChange={(e) => handleWorkDivisionChange(phase.id, e.target.value)}
                      className="w-full h-10 px-3 rounded-lg text-sm text-gray-700 bg-white border-2 border-teal-200/50 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
                    />
                  </div>
                ))}
              </div>
              <div className={`mt-2 text-sm font-medium ${totalWorkDivision === 100 ? "text-green-600" : "text-red-500"}`}>
                Total: {totalWorkDivision}% {totalWorkDivision !== 100 && "(must equal 100%)"}
              </div>
              {errors.workDivision && <p className="text-xs text-red-500 mt-1">{errors.workDivision}</p>}
            </div>

            {/* Team Assignment */}
            <div className="bg-white/60 rounded-2xl border border-teal-200/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-teal-300/30"></div>
                <span className="text-xs font-bold text-teal-600 tracking-widest uppercase whitespace-nowrap">👥 Team Assignment</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-teal-300/30"></div>
              </div>

              {visiblePhases.map((phase) => {
                const availableStaff = getAvailableStaffForPhase(phase.id);
                return (
                  <div key={phase.id} className="mb-4 last:mb-0 p-4 bg-white rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-bold text-gray-700 capitalize">{phase.label} Team</h5>
                      <span className="text-xs text-gray-500">{(teamAssignment[phase.id] || []).length} members</span>
                    </div>

                    {/* Selecting a staff member adds them immediately */}
                    <div className="flex gap-2 mb-3">
                      <select
                        value=""
                        onChange={(e) => addTeamMember(phase.id, e.target.value)}
                        className="flex-1 h-9 px-3 rounded-lg text-sm text-gray-700 bg-white border-2 border-teal-200/50 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
                        disabled={staffLoading || availableStaff.length === 0}
                      >
                        <option value="">
                          {staffLoading
                            ? "Loading staff..."
                            : availableStaff.length === 0
                            ? "No staff available"
                            : "Select staff to add..."}
                        </option>
                        {availableStaff.map((s) => (
                          <option key={s.employeeId} value={s.employeeId}>
                            {s.employeeName} ({s.role})
                          </option>
                        ))}
                      </select>
                      <span className="flex items-center gap-1 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg text-xs font-semibold">
                        <UserPlus size={14} />
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(teamAssignment[phase.id] || []).length === 0 ? (
                        <span className="text-xs text-gray-400 italic">No members assigned</span>
                      ) : (
                        (teamAssignment[phase.id] || []).map((member) => (
                          <span
                            key={member.employeeId}
                            className="flex items-center gap-1.5 bg-teal-100 text-teal-700 px-3 py-1.5 rounded-full text-xs font-semibold"
                          >
                            {member.name}
                            <button
                              type="button"
                              onClick={() => removeTeamMember(phase.id, member.employeeId)}
                              className="hover:text-red-500 transition-colors ml-1"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    {errors[`${phase.id}_members`] && (
                      <p className="text-xs text-red-500 mt-2">{errors[`${phase.id}_members`]}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate("/projects")}
                className="flex-1 sm:flex-none sm:w-32 py-3 rounded-xl border-2 border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? <><Loader size={17} className="animate-spin" /> Updating…</> : "Update Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, error, type = "text", options = [], className = "", ...props }) => {
  const base = `w-full h-11 px-4 rounded-xl text-sm text-gray-700 bg-white border-2 ${
    error ? "border-red-400 focus:border-red-500" : "border-teal-200/50 focus:border-teal-500"
  } focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all ${className}`;

  return (
    <div>
      {label && <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{label}</label>}
      {type === "select" ? (
        <select {...props} className={base}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input type={type} {...props} className={base} />
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default EditProject;