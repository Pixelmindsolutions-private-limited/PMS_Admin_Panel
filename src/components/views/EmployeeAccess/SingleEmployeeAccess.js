import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MdArrowBack,
    MdEdit,
    MdSave,
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
    MdSettings,
    MdLock,
    MdLockOpen,
    MdCheckBox,
    MdCheckBoxOutlineBlank,
    MdEmail,
    MdPhone,
    MdWork,
    MdRefresh,
    MdCheckCircle,
} from 'react-icons/md';

const API_BASE_URL = "https://pmsbackend.pixelmindsolutions.com/api/admin-staff";

const adminDetails = JSON.parse(sessionStorage.getItem("adminDetails"));
const AUTH_TOKEN = adminDetails?.token;

const SingleEmployeeAccess = () => {
    const navigate = useNavigate();
    const { staffId } = useParams();

    const [loading, setLoading] = useState(true);
    const [employee, setEmployee] = useState(null);
    const [error, setError] = useState(null);
    const [accessDetails, setAccessDetails] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [permissions, setPermissions] = useState({
        modulePermissions: {},
        allowedProjects: [],
        isAllProjectsAllowed: false,
        isReadOnly: false,
        isLoginAllowed: true,
    });
    const [projectsList, setProjectsList] = useState([]);

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

    // Fetch employee details
    const fetchEmployeeDetails = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/me?staffId=${staffId}`, {
                headers: {
                    Authorization: `Bearer ${AUTH_TOKEN}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const json = await response.json();
            console.log("EMployee: ", json.data)
            if (json.success && json.data) {
                setEmployee(json.data);
            } else {
                throw new Error(json.message || "Failed to fetch employee details");
            }
        } catch (err) {
            console.error("Fetch employee error:", err);
            setError(err.message || "Failed to fetch employee details");
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

    // Fetch employee access details
    const fetchEmployeeAccess = async () => {
        setLoading(true);
        setError(null);
        try {
            const url = `${API_BASE_URL}/${staffId}/access`;
            console.log('Fetching access details for staffId:', staffId);

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${AUTH_TOKEN}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Staff member not found');
                } else if (response.status === 500) {
                    throw new Error('Server error. Please try again later.');
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }

            const json = await response.json();
            if (json.success) {
                setAccessDetails(json.data);

                // Process allowedProjects to handle both string and object projectIds
                const processedProjects = json.data.allowedProjects?.map(proj => {
                    if (proj.projectId && typeof proj.projectId === 'object' && proj.projectId._id) {
                        return {
                            ...proj,
                            projectId: proj.projectId._id,
                            projectData: proj.projectId
                        };
                    }
                    return proj;
                }) || [];

                setPermissions({
                    modulePermissions: json.data.modulePermissions || {},
                    allowedProjects: processedProjects,
                    isAllProjectsAllowed: json.data.isAllProjectsAllowed || false,
                    isReadOnly: json.data.isReadOnly || false,
                    isLoginAllowed: json.data.isLoginAllowed !== undefined ? json.data.isLoginAllowed : true,
                });
                setIsEditing(false);
            } else {
                throw new Error(json.message || "Invalid response format");
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setError(err.message || "Failed to fetch staff access data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (staffId) {
            fetchEmployeeDetails();
            fetchEmployeeAccess();
            fetchProjectsList();
        }
    }, [staffId]);

    // Toggle module permission
    const toggleModulePermission = (moduleId) => {
        if (!isEditing) return;
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
        if (!isEditing) return;
        setPermissions((prev) => {
            const isSelected = prev.allowedProjects.some((p) => p.projectId === projectId);
            let updatedProjects;

            if (isSelected) {
                updatedProjects = prev.allowedProjects.filter((p) => p.projectId !== projectId);
            } else {
                updatedProjects = [
                    ...prev.allowedProjects,
                    { projectId: projectId, accessLevel: "view" },
                ];
            }

            return { ...prev, allowedProjects: updatedProjects };
        });
    };

    // Update project access level
    const updateProjectAccessLevel = (projectId, accessLevel) => {
        if (!isEditing) return;
        setPermissions((prev) => ({
            ...prev,
            allowedProjects: prev.allowedProjects.map((p) =>
                p.projectId === projectId ? { ...p, accessLevel } : p
            ),
        }));
    };

    // Toggle all projects
    const toggleAllProjects = () => {
        if (!isEditing) return;
        setPermissions((prev) => ({
            ...prev,
            isAllProjectsAllowed: !prev.isAllProjectsAllowed,
            allowedProjects: !prev.isAllProjectsAllowed ? [] : prev.allowedProjects,
        }));
    };

    // Save permissions
    const handleSavePermissions = async () => {
        if (!employee) return;

        setSaving(true);

        // Build the payload
        const payload = {
            employeeId: employee.employeeId,
            adminEmail: adminDetails?.email || employee.adminEmail || "admin@company.com",
            adminPanelPassword: adminDetails?.password || "Admin@123",
            modulePermissions: permissions.modulePermissions,
            allowedProjects: permissions.allowedProjects.map(p => ({
                projectId: p.projectId,
                accessLevel: p.accessLevel
            })),
            isAllProjectsAllowed: permissions.isAllProjectsAllowed,
            isReadOnly: permissions.isReadOnly,
            isLoginAllowed: permissions.isLoginAllowed,
        };

        console.log('Saving permissions with payload:', payload);

        try {
            const response = await fetch(`${API_BASE_URL}/update-permissions`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${AUTH_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (response.ok) {
                setSuccessMessage("✅ Permissions updated successfully!");
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    setIsEditing(false);
                    fetchEmployeeAccess();
                }, 2000);
            } else {
                alert(data.message || "Failed to update permissions");
            }
        } catch (error) {
            console.error("Update permissions error:", error);
            alert("Network error while updating permissions");
        } finally {
            setSaving(false);
        }
    };

    // Get access level color
    const getAccessLevelColor = (level) => {
        switch (level) {
            case "full": return "text-green-600 bg-green-100";
            case "edit": return "text-blue-600 bg-blue-100";
            case "manage": return "text-purple-600 bg-purple-100";
            case "view": return "text-gray-600 bg-gray-100";
            default: return "text-gray-600 bg-gray-100";
        }
    };

    // Get access level label
    const getAccessLevelLabel = (level) => {
        return level.charAt(0).toUpperCase() + level.slice(1);
    };

    // Get project name
    const getProjectName = (projectId) => {
        if (typeof projectId === 'object' && projectId !== null) {
            return projectId.projectName || projectId._id || "Unknown Project";
        }
        const project = projectsList.find(p => p._id === projectId);
        return project ? project.projectName : projectId;
    };

    // Get project ID string
    const getProjectIdStr = (projectId) => {
        if (typeof projectId === 'object' && projectId !== null) {
            return projectId.projectId || projectId._id || "N/A";
        }
        const project = projectsList.find(p => p._id === projectId);
        return project ? project.projectId : projectId;
    };

    // Get project category
    const getProjectCategory = (projectId) => {
        if (typeof projectId === 'object' && projectId !== null) {
            return projectId.category || "N/A";
        }
        const project = projectsList.find(p => p._id === projectId);
        return project ? project.category : "N/A";
    };

    // Count enabled modules
    const getEnabledModulesCount = (modules) => {
        return Object.values(modules || {}).filter(Boolean).length;
    };

    // Handle back navigation
    const handleGoBack = () => {
        navigate('/employee-access');
    };

    // Handle retry
    const handleRetry = () => {
        fetchEmployeeAccess();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50/80 flex items-center justify-center">
                <style>{`
          @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
          .spinner { width:40px; height:40px; border:3px solid #e0f2f1; border-top:3px solid #3b82f6; border-radius:50%; animation:spin 0.8s linear infinite; }
        `}</style>
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Loading employee details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50/80 flex items-center justify-center p-4">
                <style>{`
          .premium-card {
            background: rgba(255,255,255,0.92);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(59,130,246,0.18);
            box-shadow: 0 4px 24px -4px rgba(59,130,246,0.10), 0 1px 4px rgba(0,0,0,0.04);
          }
        `}</style>
                <div className="premium-card rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <MdRefresh className="text-red-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Failed to Load Data</h3>
                    <p className="text-gray-500 text-sm mb-2">{error}</p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleGoBack}
                            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors text-sm"
                        >
                            Go Back
                        </button>
                        <button
                            onClick={handleRetry}
                            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-sm"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
        .status-pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 9px; border-radius: 100px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase;
          white-space: nowrap;
        }
        .module-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 8px;
        }
        @media(max-width:640px) {
          .module-grid {
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          }
        }
        @media(max-width:480px) {
          .module-grid {
            grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          }
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp 0.3s ease forwards; }
      `}</style>

            {/* SUCCESS TOAST */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg fade-up flex items-center gap-2">
                    <MdCheckCircle size={20} />
                    {successMessage}
                </div>
            )}

            <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleGoBack}
                            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
                            title="Back to Employee List"
                        >
                            <MdArrowBack size={20} />
                        </button>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                            {employee?.profileImage ? (
                                <img
                                    src={employee.profileImage}
                                    alt={employee.employeeName}
                                    className="w-full h-full rounded-2xl object-cover"
                                />
                            ) : (
                                <span className="text-white font-bold text-xl">
                                    {employee?.employeeName?.charAt(0).toUpperCase() || "?"}
                                </span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight leading-tight">
                                {employee?.employeeName || "Employee Details"}
                            </h1>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />
                                {employee?.employeeId} • {employee?.role || "Staff"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing && accessDetails && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-sm"
                            >
                                <MdEdit size={16} />
                                Edit Permissions
                            </button>
                        )}
                        <button
                            onClick={fetchEmployeeAccess}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors text-sm"
                        >
                            <MdRefresh size={16} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* EMPLOYEE DETAILS */}
                {accessDetails ? (
                    <>
                        {/* Employee Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                            <div className="premium-card rounded-xl p-4">
                                <div className="flex items-center gap-2">
                                    <MdEmail className="text-blue-500" size={18} />
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-sm font-medium text-gray-700">{employee?.email || "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="premium-card rounded-xl p-4">
                                <div className="flex items-center gap-2">
                                    <MdPhone className="text-blue-500" size={18} />
                                    <div>
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <p className="text-sm font-medium text-gray-700">{employee?.mobile || "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="premium-card rounded-xl p-4">
                                <div className="flex items-center gap-2">
                                    <MdWork className="text-blue-500" size={18} />
                                    <div>
                                        <p className="text-xs text-gray-500">Role</p>
                                        <p className="text-sm font-medium text-gray-700">{employee?.role || "Staff"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Access Status */}
                        <div className="flex flex-wrap items-center gap-3 mb-5 p-4 bg-blue-50/50 rounded-xl">
                            <span className={`status-pill ${accessDetails.isLoginAllowed !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {accessDetails.isLoginAllowed !== false ? "✓ Login Allowed" : "✗ Login Restricted"}
                            </span>
                            <span className={`status-pill ${accessDetails.isReadOnly ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                                {accessDetails.isReadOnly ? "🔒 Read Only" : "🔓 Full Access"}
                            </span>
                            <span className={`status-pill ${accessDetails.isAllProjectsAllowed ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                                {accessDetails.isAllProjectsAllowed ? "🌐 All Projects" : "📁 Selected Projects"}
                            </span>
                            <span className="status-pill bg-indigo-100 text-indigo-700">
                                📊 {getEnabledModulesCount(accessDetails.modulePermissions)} Modules Active
                            </span>
                        </div>

                        {/* Edit Mode Notice */}
                        {isEditing && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                                <p className="font-medium text-yellow-800">✏️ Edit Mode Active</p>
                                <p className="text-xs text-yellow-700 mt-1">Click on modules or projects to toggle permissions, then click Save Changes.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Module Permissions */}
                            <div className="premium-card rounded-xl p-4 sm:p-5">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <MdDashboard size={18} className="text-blue-500" />
                                    Module Permissions
                                    {!isEditing && (
                                        <span className="text-xs text-gray-400 ml-2 font-normal">(View Only)</span>
                                    )}
                                </h3>
                                <div className="module-grid">
                                    {menuItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${isEditing ? "cursor-pointer hover:bg-blue-50" : "cursor-default"
                                                } ${permissions.modulePermissions[item.id]
                                                    ? "border-blue-300 bg-blue-50/50"
                                                    : "border-gray-200"
                                                }`}
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
                            <div className="premium-card rounded-xl p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <MdFolder size={18} className="text-blue-500" />
                                        Project Access
                                        {!isEditing && (
                                            <span className="text-xs text-gray-400 ml-2 font-normal">(View Only)</span>
                                        )}
                                    </h3>
                                    {isEditing && (
                                        <button
                                            onClick={toggleAllProjects}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${permissions.isAllProjectsAllowed
                                                    ? "bg-blue-500 text-white"
                                                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                                }`}
                                        >
                                            {permissions.isAllProjectsAllowed ? "All Projects" : "Select Projects"}
                                        </button>
                                    )}
                                </div>

                                {permissions.isAllProjectsAllowed ? (
                                    <div className="text-center py-8 text-gray-500 bg-white/50 rounded-lg">
                                        <p className="text-sm font-medium">✅ All Projects Access</p>
                                        <p className="text-xs mt-1">Employee has access to all projects</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                        {permissions.allowedProjects && permissions.allowedProjects.length > 0 ? (
                                            permissions.allowedProjects.map((proj) => {
                                                const projectId = proj.projectId;
                                                const projectName = getProjectName(projectId);
                                                const projectIdStr = getProjectIdStr(projectId);
                                                const category = getProjectCategory(projectId);
                                                const accessLevel = proj.accessLevel || "view";

                                                return (
                                                    <div
                                                        key={projectId}
                                                        className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${isEditing ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50"
                                                            }`}
                                                    >
                                                        <button
                                                            onClick={() => toggleProjectSelection(projectId)}
                                                            className="shrink-0"
                                                            disabled={!isEditing}
                                                        >
                                                            <MdCheckBox className="text-blue-500" size={18} />
                                                        </button>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium text-gray-700 truncate">
                                                                {projectName}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400">
                                                                {projectIdStr} • {category}
                                                            </p>
                                                        </div>
                                                        {isEditing && (
                                                            <select
                                                                value={accessLevel}
                                                                onChange={(e) =>
                                                                    updateProjectAccessLevel(projectId, e.target.value)
                                                                }
                                                                className="text-[10px] border rounded-lg px-1.5 py-0.5 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
                                                            >
                                                                <option value="view">View</option>
                                                                <option value="edit">Edit</option>
                                                                <option value="manage">Manage</option>
                                                                <option value="full">Full</option>
                                                            </select>
                                                        )}
                                                        {!isEditing && (
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${getAccessLevelColor(accessLevel)}`}>
                                                                {getAccessLevelLabel(accessLevel)}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-8 text-gray-400 bg-white/50 rounded-lg">
                                                <p className="text-sm">No projects assigned</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Project Summary */}
                                {!permissions.isAllProjectsAllowed && permissions.allowedProjects.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-xs text-gray-500">
                                            <span className="font-semibold">{permissions.allowedProjects.length}</span> projects selected
                                        </p>
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {permissions.allowedProjects.map((p) => {
                                                const name = getProjectName(p.projectId);
                                                return (
                                                    <span
                                                        key={p.projectId}
                                                        className={`text-[10px] px-2 py-0.5 rounded-full ${getAccessLevelColor(p.accessLevel)}`}
                                                    >
                                                        {name.length > 15 ? name.substring(0, 15) + '...' : name} • {getAccessLevelLabel(p.accessLevel)}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Additional Settings */}
                        <div className="premium-card rounded-xl p-4 sm:p-5 mt-5">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Additional Settings</h3>
                            <div className="flex flex-wrap items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={permissions.isReadOnly}
                                        onChange={(e) =>
                                            isEditing && setPermissions((prev) => ({
                                                ...prev,
                                                isReadOnly: e.target.checked,
                                            }))
                                        }
                                        disabled={!isEditing}
                                        className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                                    />
                                    <span className="text-sm text-gray-600">Read Only Mode</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={permissions.isLoginAllowed !== false}
                                        onChange={(e) =>
                                            isEditing && setPermissions((prev) => ({
                                                ...prev,
                                                isLoginAllowed: e.target.checked,
                                            }))
                                        }
                                        disabled={!isEditing}
                                        className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                                    />
                                    <span className="text-sm text-gray-600">Allow Login Access</span>
                                </label>
                            </div>
                        </div>

                        {/* Edit Actions */}
                        {isEditing && (
                            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-5 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        fetchEmployeeAccess();
                                    }}
                                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePermissions}
                                    disabled={saving}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold hover:shadow-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <MdSave size={16} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Last Updated */}
                        <div className="mt-4 text-center text-[10px] text-gray-400">
                            Last updated: {accessDetails?.updatedAt ? new Date(accessDetails.updatedAt).toLocaleString() : "N/A"}
                        </div>
                    </>
                ) : (
                    <div className="premium-card rounded-xl p-12 text-center">
                        <p className="text-gray-500">No access data available for this employee</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SingleEmployeeAccess;