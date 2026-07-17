import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdCheckCircle,
  MdCancel,
  MdArrowBack,
  MdDashboard,
  MdPeople,
  MdFolder,
  MdAssignment,
  MdSchedule,
  MdTimelapse,
  MdPayment,
  MdNotifications,
  MdBarChart,
  MdSettings,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdPersonAdd,
} from 'react-icons/md';
import { FaUserTie, FaUsersCog } from 'react-icons/fa';

const API_BASE_URL = "https://pmsbackend.pixelmindsolutions.com/api/admin-staff";

const adminDetails = JSON.parse(sessionStorage.getItem("adminDetails"));
const AUTH_TOKEN = adminDetails?.token;

const AddEmployeeAccess = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [permissions, setPermissions] = useState({
    modulePermissions: {
      dashboard: false,
      staffManagement: false,
      projects: false,
      clients: false,
      payments: false,
      invoices: false,
      reminders: false,
      reports: false,
      settings: false,
      attendance: false,
      installments: false,
      worksheets: false,
      workSession: false,
      payslip: false,
    },
    allowedProjects: [],
    isAllProjectsAllowed: false,
    isReadOnly: false,
  });

  // Menu items for module permissions
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <MdDashboard /> },
    { id: 'staffManagement', label: 'Staff Management', icon: <MdPeople /> },
    { id: 'clients', label: 'Clients', icon: <MdFolder /> },
    { id: 'projects', label: 'Projects', icon: <MdFolder /> },
    { id: 'installments', label: 'Installments', icon: <MdFolder /> },
    { id: 'worksheets', label: 'Work Allocation', icon: <MdAssignment /> },
    { id: 'attendance', label: 'Attendance', icon: <MdSchedule /> },
    { id: 'workSession', label: 'Work Session', icon: <MdTimelapse /> },
    { id: 'invoices', label: 'Invoicing', icon: <MdFolder /> },
    { id: 'payslip', label: 'Payroll', icon: <MdAssignment /> },
    { id: 'payments', label: 'Payments', icon: <MdPayment /> },
    { id: 'reminders', label: 'Reminders', icon: <MdNotifications /> },
    { id: 'reports', label: 'Reports', icon: <MdBarChart /> },
    { id: 'settings', label: 'Settings', icon: <MdSettings /> },
  ];

  // Fetch staff list
  const fetchStaffList = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/available-staff`, {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      if (json.success && Array.isArray(json.data)) {
        const availableStaff = json.data.filter(s => !s.adminEmail);
        setStaffList(availableStaff);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch staff data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects list
  const fetchProjectsList = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projectslist`, {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      if (json.success && Array.isArray(json.data)) {
        setProjectsList(json.data);
      }
    } catch (err) {
      console.error("Fetch projects error:", err);
    }
  };

  useEffect(() => {
    fetchStaffList();
    fetchProjectsList();
  }, []);

  // Handle assign permissions
  const handleAssignPermissions = async () => {
    if (!selectedEmployee) {
      alert("Please select an employee");
      return;
    }

    setSubmitting(true);
    const payload = {
      employeeId: selectedEmployee.employeeId,
      adminEmail: adminDetails?.email || "admin@company.com",
      adminPanelPassword: adminDetails?.password || "Admin@123",
      modulePermissions: permissions.modulePermissions,
      allowedProjects: permissions.allowedProjects,
      isAllProjectsAllowed: permissions.isAllProjectsAllowed,
      isReadOnly: permissions.isReadOnly,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/assign-permissions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(`✅ Permissions assigned to ${selectedEmployee.employeeName} successfully!`);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setSelectedEmployee(null);
          resetPermissions();
          fetchStaffList();
        }, 2000);
      } else {
        alert(data.message || "Failed to assign permissions");
      }
    } catch (error) {
      console.error("Assign permissions error:", error);
      alert("Network error while assigning permissions");
    } finally {
      setSubmitting(false);
    }
  };

  // Reset permissions
  const resetPermissions = () => {
    setPermissions({
      modulePermissions: {
        dashboard: false,
        staffManagement: false,
        projects: false,
        clients: false,
        payments: false,
        invoices: false,
        reminders: false,
        reports: false,
        settings: false,
        attendance: false,
        installments: false,
        worksheets: false,
        workSession: false,
        payslip: false,
      },
      allowedProjects: [],
      isAllProjectsAllowed: false,
      isReadOnly: false,
    });
  };

  // Toggle module permission
  const toggleModulePermission = (moduleId) => {
    setPermissions((prev) => ({
      ...prev,
      modulePermissions: {
        ...prev.modulePermissions,
        [moduleId]: !prev.modulePermissions[moduleId],
      },
    }));
  };

  // Toggle project selection
  const toggleProjectSelection = (projectId) => {
    setPermissions((prev) => {
      const isSelected = prev.allowedProjects.some((p) => p.projectId === projectId);
      let updatedProjects;
      
      if (isSelected) {
        updatedProjects = prev.allowedProjects.filter((p) => p.projectId !== projectId);
      } else {
        updatedProjects = [
          ...prev.allowedProjects,
          { projectId, accessLevel: "view" },
        ];
      }
      
      return { ...prev, allowedProjects: updatedProjects };
    });
  };

  // Update project access level
  const updateProjectAccessLevel = (projectId, accessLevel) => {
    setPermissions((prev) => ({
      ...prev,
      allowedProjects: prev.allowedProjects.map((p) =>
        p.projectId === projectId ? { ...p, accessLevel } : p
      ),
    }));
  };

  // Toggle all projects
  const toggleAllProjects = () => {
    setPermissions((prev) => ({
      ...prev,
      isAllProjectsAllowed: !prev.isAllProjectsAllowed,
      allowedProjects: !prev.isAllProjectsAllowed ? [] : prev.allowedProjects,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50/80 py-4 sm:py-6 lg:py-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; }

        .premium-card {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(59,130,246,0.18);
          box-shadow: 0 4px 24px -4px rgba(59,130,246,0.10), 0 1px 4px rgba(0,0,0,0.04);
        }
        .module-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 8px;
        }
        @media(max-width:640px) {
          .module-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }
        }
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        .spinner { width:40px; height:40px; border:3px solid #e0f2f1; border-top:3px solid #3b82f6; border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp 0.3s ease forwards; }
        .select-custom {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
        }
      `}</style>

      {/* SUCCESS TOAST */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg fade-up flex items-center gap-2">
          <MdCheckCircle size={20} />
          {successMessage}
        </div>
      )}

      <div className="w-full max-w-4xl mx-auto px-3 sm:px-5 md:px-6">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/employee-access')}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
            title="Back to Access List"
          >
            <MdArrowBack size={20} />
          </button>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
            <FaUsersCog className="text-white" size={18} />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight leading-tight">
              Grant Employee Access
            </h1>
            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />
              Assign permissions to employees
            </p>
          </div>
        </div>

        {/* MAIN FORM */}
        <div className="premium-card rounded-2xl p-4 sm:p-6 md:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-3">{error}</p>
              <button
                onClick={fetchStaffList}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Employee Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Employee <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedEmployee?._id || ""}
                  onChange={(e) => {
                    const employee = staffList.find(s => s._id === e.target.value);
                    setSelectedEmployee(employee || null);
                  }}
                  className="select-custom w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-sm text-gray-700 bg-white outline-none"
                >
                  <option value="">Select an employee...</option>
                  {staffList.length > 0 ? (
                    staffList.map((staff) => (
                      <option key={staff._id} value={staff._id}>
                        {staff.employeeName} ({staff.employeeId}) - {staff.role || "Staff"}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No available employees</option>
                  )}
                </select>
                {selectedEmployee && (
                  <div className="mt-2 flex items-center gap-3 text-sm text-gray-600 bg-blue-50 p-2 rounded-lg">
                    <span className="font-medium">Selected:</span>
                    <span>{selectedEmployee.employeeName}</span>
                    <span className="text-gray-400">•</span>
                    <span>{selectedEmployee.email}</span>
                  </div>
                )}
              </div>

              {/* Module Permissions */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <MdDashboard size={18} className="text-blue-500" />
                  Module Permissions
                  <span className="text-xs text-gray-400 font-normal ml-2">
                    (Click to toggle)
                  </span>
                </h3>
                <div className="module-grid">
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => toggleModulePermission(item.id)}
                    >
                      <div className="text-blue-500 shrink-0">{item.icon}</div>
                      <span className="text-xs font-medium text-gray-700 flex-1">{item.label}</span>
                      {permissions.modulePermissions[item.id] ? (
                        <MdCheckBox className="text-blue-500" size={18} />
                      ) : (
                        <MdCheckBoxOutlineBlank className="text-gray-300" size={18} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Access */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MdFolder size={18} className="text-blue-500" />
                    Project Access
                  </h3>
                  <button
                    onClick={toggleAllProjects}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      permissions.isAllProjectsAllowed
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {permissions.isAllProjectsAllowed ? "All Projects" : "Select Projects"}
                  </button>
                </div>

                {!permissions.isAllProjectsAllowed && (
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-3">
                    {projectsList.length > 0 ? (
                      projectsList.map((project) => {
                        const isSelected = permissions.allowedProjects.some(
                          (p) => p.projectId === project._id
                        );
                        const selectedProject = permissions.allowedProjects.find(
                          (p) => p.projectId === project._id
                        );

                        return (
                          <div
                            key={project._id}
                            className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                              isSelected
                                ? "border-blue-300 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <button
                              onClick={() => toggleProjectSelection(project._id)}
                              className="shrink-0"
                            >
                              {isSelected ? (
                                <MdCheckBox className="text-blue-500" size={20} />
                              ) : (
                                <MdCheckBoxOutlineBlank className="text-gray-300" size={20} />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate">
                                {project.projectName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {project.projectId} • {project.category || "N/A"}
                              </p>
                            </div>
                            {isSelected && (
                              <select
                                value={selectedProject?.accessLevel || "view"}
                                onChange={(e) =>
                                  updateProjectAccessLevel(project._id, e.target.value)
                                }
                                className="text-xs border rounded-lg px-2 py-1 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
                              >
                                <option value="view">View</option>
                                <option value="edit">Edit</option>
                                <option value="manage">Manage</option>
                                <option value="full">Full</option>
                              </select>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center text-gray-400 text-sm py-4">
                        No projects available
                      </p>
                    )}
                  </div>
                )}

                {permissions.isAllProjectsAllowed && (
                  <div className="text-center py-6 bg-blue-50 rounded-xl border-2 border-blue-200 border-dashed">
                    <p className="text-sm font-medium text-blue-600">
                      ✅ All projects will be accessible
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Click "Select Projects" to choose specific projects
                    </p>
                  </div>
                )}
              </div>

              {/* Additional Options */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Additional Settings</h3>
                <div className="flex items-center gap-6 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.isReadOnly}
                      onChange={(e) =>
                        setPermissions((prev) => ({
                          ...prev,
                          isReadOnly: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Read Only Mode</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedEmployee(null);
                    resetPermissions();
                  }}
                  className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors text-sm"
                  disabled={submitting}
                >
                  Clear
                </button>
                <button
                  onClick={handleAssignPermissions}
                  disabled={submitting || !selectedEmployee}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold hover:shadow-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Assigning...
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <MdPersonAdd size={16} />
                      Grant Access
                    </span>
                  )}
                </button>
              </div>

              {/* Employee Count */}
              <div className="text-center text-xs text-gray-400 pt-2">
                {staffList.length} employees available for access
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeAccess;