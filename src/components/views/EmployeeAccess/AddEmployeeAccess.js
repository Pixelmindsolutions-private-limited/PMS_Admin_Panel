import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdSearch,
  MdRefresh,
  MdPersonAdd,
  MdCheckCircle,
  MdCancel,
  MdEmail,
  MdPhone,
  MdPerson,
  MdSettings,
  MdDashboard,
  MdPeople,
  MdFolder,
  MdAssignment,
  MdSchedule,
  MdTimelapse,
  MdPayment,
  MdReceipt,
  MdNotifications,
  MdBarChart,
  MdKeyboardArrowDown,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdArrowBack,
  MdLock
} from 'react-icons/md';
import { FaUserTie, FaFilter, FaFileAlt, FaUsersCog } from 'react-icons/fa';

const API_BASE_URL = "https://pmsbackend.pixelmindsolutions.com/api/admin-staff";

const adminDetails = JSON.parse(sessionStorage.getItem("adminDetails"));
const AUTH_TOKEN = adminDetails?.token;

const AddEmployeeAccess = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAccessModal, setShowAccessModal] = useState(false);
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
    // { id: 'payments', label: 'Payments', icon: <MdPayment /> },
    // { id: 'reminders', label: 'Reminders', icon: <MdNotifications /> },
    // { id: 'reports', label: 'Reports', icon: <MdBarChart /> },
    // { id: 'settings', label: 'Settings', icon: <MdSettings /> },
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
        // Filter out staff who already have access
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

  // Filter staff
  const filteredStaff = staffList.filter((staff) => {
    const matchSearch =
      staff.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      staff.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      staff.email?.toLowerCase().includes(search.toLowerCase()) ||
      staff.role?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // Handle assign permissions
  const handleAssignPermissions = async () => {
    if (!selectedEmployee) return;

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
          setShowAccessModal(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50/80">
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
        .stat-card {
          background: rgba(255,255,255,0.95);
          border: 1px solid rgba(59,130,246,0.15);
          box-shadow: 0 2px 12px -2px rgba(59,130,246,0.08);
          transition: all 0.25s ease;
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px -4px rgba(59,130,246,0.15); }
        .table-row-hover { transition: background 0.15s ease; }
        .table-row-hover:hover td { background: rgba(239,246,255,0.9) !important; }
        .status-pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 9px; border-radius: 100px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase;
          white-space: nowrap;
        }
        .btn-act {
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 8px;
          transition: all 0.2s ease; cursor: pointer; border: none; flex-shrink: 0;
        }
        .btn-act:hover { transform: scale(1.1); }
        .s-input { outline: none !important; }
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        .spinner { width:40px; height:40px; border:3px solid #e0f2f1; border-top:3px solid #3b82f6; border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp 0.3s ease forwards; }
        .modal-back { position:fixed;inset:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);z-index:50;display:flex;align-items:center;justify-content:center;padding:16px; }
        .scroll-x::-webkit-scrollbar { height:4px; }
        .scroll-x::-webkit-scrollbar-track { background:#f0fdf4; }
        .scroll-x::-webkit-scrollbar-thumb { background:#99f6e4; border-radius:4px; }

        .module-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 8px;
        }

        @media(max-width:600px){ .h-sm{ display:none!important; } }
        @media(max-width:420px){ .h-xs{ display:none!important; } }
        @media(max-width:640px) {
          .module-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }
        }
      `}</style>

      {/* SUCCESS TOAST */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg fade-up flex items-center gap-2">
          <MdCheckCircle size={20} />
          {successMessage}
        </div>
      )}

      {/* ACCESS MODAL */}
      {showAccessModal && selectedEmployee && (
        <div className="modal-back" onClick={() => setShowAccessModal(false)}>
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto fade-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FaUserTie className="text-blue-600" size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Assign Permissions</h2>
                  <p className="text-sm text-gray-500">
                    {selectedEmployee.employeeName} ({selectedEmployee.employeeId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAccessModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MdCancel size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Module Permissions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <MdDashboard size={18} className="text-blue-500" />
                  Module Permissions
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
              <div className="border-t border-gray-200 pt-4">
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
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {projectsList.map((project) => {
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
                              {project.projectId} • {project.category}
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
                    })}
                  </div>
                )}
              </div>

              {/* Additional Options */}
              <div className="border-t border-gray-200 pt-4">
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
              <div className="flex gap-3 pt-3 border-t border-gray-200">
                <button
                  onClick={() => setShowAccessModal(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors text-sm"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignPermissions}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold hover:shadow-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Assigning...
                    </div>
                  ) : (
                    "Assign Permissions"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 lg:py-8">

        {/* HEADER WITH BACK BUTTON */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/employee-access')}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
              title="Back to Access List"
            >
              <MdArrowBack size={20} />
            </button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              <FaUsersCog className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight leading-tight">
                Grant Employee Access
              </h1>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />
                Assign permissions to employees without access
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500 bg-white/80 px-4 py-2 rounded-xl border border-gray-200">
            Available: <span className="font-bold text-blue-600">{staffList.length}</span> employees
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4 mb-5 sm:mb-6">
          {[
            { label: "Available Staff", value: staffList.length, icon: "👥", badge: "bg-blue-100 text-blue-700" },
            { label: "With Access", value: staffList.filter(s => s.adminEmail).length, icon: "🔓", badge: "bg-green-100 text-green-700" },
            { label: "Without Access", value: staffList.filter(s => !s.adminEmail).length, icon: "🔒", badge: "bg-gray-100 text-gray-700" },
          ].map((s, i) => (
            <div key={i} className="stat-card rounded-2xl p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg sm:text-2xl">{s.icon}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full hidden sm:inline ${s.badge}`}>
                  {s.label.split(" ")[0]}
                </span>
              </div>
              <p className="text-xl sm:text-3xl font-bold text-gray-800 leading-none">{s.value}</p>
              <p className="text-xs text-gray-400 font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* FILTER BAR */}
        <div className="premium-card rounded-2xl p-3.5 sm:p-4 lg:p-5 mb-5 sm:mb-6">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <FaFilter className="text-blue-600" size={12} />
              </div>
              <span className="font-bold text-gray-800 text-sm">Filters</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                {filteredStaff.length}
              </span>
            </div>
            <button
              onClick={() => { setSearch(""); fetchStaffList(); }}
              className="p-1.5 sm:p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
              title="Refresh"
            >
              <MdRefresh size={17} />
            </button>
          </div>

          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
            <input
              className="s-input w-full h-10 pl-8 pr-3 rounded-xl border-2 border-gray-100 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-xs sm:text-sm text-gray-700 placeholder:text-gray-400"
              placeholder="Search employees by name, ID, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="premium-card rounded-2xl p-12 sm:p-16 flex flex-col items-center justify-center gap-4">
            <div className="spinner" />
            <p className="text-gray-500 font-medium text-sm">Loading employee data…</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="premium-card rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
              <MdRefresh className="text-red-400" size={28} />
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">Failed to load employees</p>
              <p className="text-gray-400 text-sm max-w-xs">{error}</p>
            </div>
            <button onClick={fetchStaffList}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm">
              Retry
            </button>
          </div>
        )}

        {/* EMPLOYEE LIST - CARD VIEW */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredStaff.length > 0 ? filteredStaff.map((staff, index) => (
              <div
                key={staff._id}
                className="premium-card rounded-2xl p-4 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 fade-up flex flex-col"
                style={{ animationDelay: `${index * 35}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {staff.profileImage ? (
                      <img
                        src={staff.profileImage}
                        alt={staff.employeeName}
                        className="w-10 h-10 rounded-xl object-cover border-2 border-blue-100 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0 border-2 border-blue-50">
                        <span className="text-white font-bold text-lg">
                          {staff.employeeName?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-800 text-sm truncate">{staff.employeeName}</h3>
                      <p className="text-xs text-blue-600 font-semibold truncate">{staff.role || "Staff"}</p>
                    </div>
                  </div>
                  <span className="status-pill shrink-0 ml-2 bg-gray-100 text-gray-500">
                    <MdLock size={10} />
                    No Access
                  </span>
                </div>

                <div className="space-y-1.5 py-3 border-t border-b border-gray-100 flex-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MdEmail className="text-gray-300 shrink-0" size={13} />
                    <span className="truncate">{staff.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MdPhone className="text-gray-300 shrink-0" size={13} />
                    <span>{staff.mobile || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MdPerson className="text-gray-300 shrink-0" size={13} />
                    <span>ID: {staff.employeeId}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedEmployee(staff);
                    setShowAccessModal(true);
                  }}
                  className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2"
                >
                  <MdPersonAdd size={16} />
                  Grant Access
                </button>
              </div>
            )) : (
              <div className="col-span-full premium-card rounded-2xl py-14 text-center">
                <div className="flex flex-col items-center gap-3">
                  <MdPerson className="text-gray-200" size={48} />
                  <p className="text-gray-400 font-semibold text-sm">
                    {search ? "No employees match your search" : "All employees already have access"}
                  </p>
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddEmployeeAccess;