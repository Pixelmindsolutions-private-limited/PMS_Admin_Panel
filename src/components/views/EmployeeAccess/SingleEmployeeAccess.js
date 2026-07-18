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
    MdVisibility,
    MdCreate,
    MdDelete,
    MdAddCircleOutline,
    MdInfo,
    MdImportExport,
    MdDownload,
} from 'react-icons/md';

const API_BASE_URL = "https://pmsbackend.pixelmindsolutions.com/api/admin-staff";

const adminDetails = JSON.parse(sessionStorage.getItem("adminDetails"));
const AUTH_TOKEN = adminDetails?.token;

// Menu items for module permissions with detailed items
const menuItems = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: <MdDashboard />,
    items: [
      { name: 'Dashboard Page', permission: ['view'] }
    ]
  },
  {
    id: 'staffManagement',
    label: 'Staff Management',
    icon: <MdPeople />,
    items: [
      { name: 'All Staff', permission: ['view', 'edit', 'delete', 'export'] },
    ]
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: <MdFolder />,
    items: [
      { name: 'All Clients', permission: ['view', 'edit', 'delete', 'export'] }
    ]
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: <MdFolder />,
    items: [
      { name: 'All Projects', permission: ['view', 'edit', 'delete', 'export'] }
    ]
  },
  {
    id: 'installments',
    label: 'Installments',
    icon: <MdFolder />,
    items: [
      { name: 'All Installments', permission: ['view', 'edit', 'delete', 'export'] }
    ]
  },
  {
    id: 'assignedWorks',
    label: 'Work Allocation',
    icon: <MdAssignment />,
    items: [
      { name: 'All Worksheets', permission: ['view', 'edit', 'delete', 'export'] }
    ]
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: <MdSchedule />,
    items: [
      { name: 'Attendance', permission: ['view', 'edit', 'delete', 'export'] }
    ]
  },
  {
    id: 'invoice',
    label: 'Invoicing',
    icon: <MdFolder />,
    items: [
      { name: 'Invoices', permission: ['view', 'edit', 'delete', 'export'] }
    ]
  }
];

// Permission options for each item
const PERMISSION_OPTIONS = ['view', 'create', 'edit', 'delete', 'manage', 'full'];

// Get icon for permission type
const getPermissionIcon = (permission) => {
    switch(permission) {
        case 'view': return <MdVisibility size={14} />;
        case 'create': return <MdAddCircleOutline size={14} />;
        case 'edit': return <MdCreate size={14} />;
        case 'delete': return <MdDelete size={14} />;
        case 'export': return <MdDownload size={14} />;
        default: return null;
    }
};

// Get color for permission type
const getPermissionColor = (permission) => {
    switch(permission) {
        case 'view': return 'text-blue-500 bg-blue-50 border-blue-200';
        case 'create': return 'text-green-500 bg-green-50 border-green-200';
        case 'edit': return 'text-amber-500 bg-amber-50 border-amber-200';
        case 'delete': return 'text-red-500 bg-red-50 border-red-200';
        case 'export': return 'text-purple-500 bg-purple-50 border-purple-200';
        default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
};

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
        modulePermissions: [],
        allowedProjects: [],
        isAllProjectsAllowed: false,
        isReadOnly: false,
        isLoginAllowed: true,
    });
    const [projectsList, setProjectsList] = useState([]);

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
            console.log("Employee details:", json.data);
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
            console.log("Access details response:", json);
            
            if (json.success) {
                setAccessDetails(json.data);

                // Process modulePermissions - convert from array to array with items
                let modulePermissions = json.data.modulePermissions || [];
                
                // If modulePermissions is an object, convert to array
                if (!Array.isArray(modulePermissions)) {
                    modulePermissions = Object.keys(modulePermissions).map(key => ({
                        component: key,
                        items: menuItems.find(m => m.id === key)?.items.map(item => ({
                            name: item.name,
                            permission: modulePermissions[key] ? ['view'] : []
                        })) || []
                    }));
                }

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
                    modulePermissions: modulePermissions,
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

    // Toggle individual permission for an item
    const toggleItemPermission = (moduleId, itemName, permission) => {
        if (!isEditing) return;
        
        setPermissions((prev) => {
            const existingModule = prev.modulePermissions.find(
                p => p.component === moduleId
            );
            
            let updatedModulePermissions;
            
            if (existingModule) {
                const updatedItems = existingModule.items.map(item => {
                    if (item.name === itemName) {
                        const currentPermissions = item.permission || [];
                        if (currentPermissions.includes(permission)) {
                            return { ...item, permission: currentPermissions.filter(p => p !== permission) };
                        } else {
                            return { ...item, permission: [...currentPermissions, permission] };
                        }
                    }
                    return item;
                });
                
                updatedModulePermissions = prev.modulePermissions.map(p =>
                    p.component === moduleId ? { ...p, items: updatedItems } : p
                );
            } else {
                const menuItem = menuItems.find(m => m.id === moduleId);
                const items = menuItem.items.map(item => ({
                    name: item.name,
                    permission: item.name === itemName ? [permission] : []
                }));
                updatedModulePermissions = [...prev.modulePermissions, { component: moduleId, items }];
            }
            
            return { ...prev, modulePermissions: updatedModulePermissions };
        });
    };

    // Toggle all permissions for an item
    const toggleAllPermissionsForItem = (moduleId, itemName) => {
        if (!isEditing) return;
        
        setPermissions((prev) => {
            const existingModule = prev.modulePermissions.find(
                p => p.component === moduleId
            );
            
            let updatedModulePermissions;
            const menuItem = menuItems.find(m => m.id === moduleId);
            const itemConfig = menuItem?.items.find(i => i.name === itemName);
            
            if (existingModule) {
                const updatedItems = existingModule.items.map(item => {
                    if (item.name === itemName) {
                        const allPermissions = itemConfig?.permission || [];
                        const currentPermissions = item.permission || [];
                        const allSelected = allPermissions.every(p => currentPermissions.includes(p));
                        
                        return { 
                            ...item, 
                            permission: allSelected ? [] : [...allPermissions] 
                        };
                    }
                    return item;
                });
                
                updatedModulePermissions = prev.modulePermissions.map(p =>
                    p.component === moduleId ? { ...p, items: updatedItems } : p
                );
            } else {
                const items = menuItem.items.map(item => ({
                    name: item.name,
                    permission: item.name === itemName ? [...(itemConfig?.permission || [])] : []
                }));
                updatedModulePermissions = [...prev.modulePermissions, { component: moduleId, items }];
            }
            
            return { ...prev, modulePermissions: updatedModulePermissions };
        });
    };

    // Check if a specific permission is enabled
    const isPermissionEnabled = (moduleId, itemName, permission) => {
        const module = permissions.modulePermissions.find(p => p.component === moduleId);
        if (!module) return false;
        const item = module.items.find(i => i.name === itemName);
        return item?.permission?.includes(permission) || false;
    };

    // Check if item has any permissions
    const hasAnyPermission = (moduleId, itemName) => {
        const module = permissions.modulePermissions.find(p => p.component === moduleId);
        if (!module) return false;
        const item = module.items.find(i => i.name === itemName);
        return item?.permission?.length > 0;
    };

    // Check if item has all available permissions
    const hasAllPermissions = (moduleId, itemName) => {
        const module = permissions.modulePermissions.find(p => p.component === moduleId);
        if (!module) return false;
        const item = module.items.find(i => i.name === itemName);
        const menuItem = menuItems.find(m => m.id === moduleId);
        const itemConfig = menuItem?.items.find(i => i.name === itemName);
        if (!item || !itemConfig) return false;
        return itemConfig.permission.every(p => item.permission.includes(p));
    };

    // Toggle entire module
    const toggleModule = (moduleId) => {
        if (!isEditing) return;
        
        setPermissions((prev) => {
            const existingModule = prev.modulePermissions.find(
                p => p.component === moduleId
            );
            
            let updatedModulePermissions;
            const menuItem = menuItems.find(m => m.id === moduleId);
            
            if (existingModule) {
                let allFullyEnabled = true;
                menuItem.items.forEach(itemConfig => {
                    const item = existingModule.items.find(i => i.name === itemConfig.name);
                    if (!item || !itemConfig.permission.every(p => item.permission.includes(p))) {
                        allFullyEnabled = false;
                    }
                });
                
                const newItems = menuItem.items.map(itemConfig => ({
                    name: itemConfig.name,
                    permission: allFullyEnabled ? [] : [...itemConfig.permission]
                }));
                
                updatedModulePermissions = prev.modulePermissions.map(p =>
                    p.component === moduleId ? { ...p, items: newItems } : p
                );
            } else {
                const items = menuItem.items.map(item => ({
                    name: item.name,
                    permission: [...item.permission]
                }));
                updatedModulePermissions = [...prev.modulePermissions, { component: moduleId, items }];
            }
            
            return { ...prev, modulePermissions: updatedModulePermissions };
        });
    };

    // Check if module is fully enabled
    const isModuleFullyEnabled = (moduleId) => {
        const module = permissions.modulePermissions.find(p => p.component === moduleId);
        if (!module) return false;
        const menuItem = menuItems.find(m => m.id === moduleId);
        return menuItem.items.every(itemConfig => {
            const item = module.items.find(i => i.name === itemConfig.name);
            return item && itemConfig.permission.every(p => item.permission.includes(p));
        });
    };

    // Check if module has any enabled items
    const isModulePartiallyEnabled = (moduleId) => {
        const module = permissions.modulePermissions.find(p => p.component === moduleId);
        if (!module) return false;
        return module.items.some(item => item.permission.length > 0) && !isModuleFullyEnabled(moduleId);
    };

    // Get permission label
    const getPermissionLabel = (permission) => {
        return permission.charAt(0).toUpperCase() + permission.slice(1);
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

    // Save permissions - Updated payload to match API structure
    const handleSavePermissions = async () => {
        if (!employee) return;

        setSaving(true);

        // Build the payload matching the API structure
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
            console.log("Update response:", data);
            
            if (response.ok) {
                setSuccessMessage("✅ Permissions updated successfully!");
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    setIsEditing(false);
                    fetchEmployeeAccess();
                }, 3000);
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
    const getEnabledModulesCount = (modulePermissions) => {
        if (!modulePermissions || !Array.isArray(modulePermissions)) return 0;
        return modulePermissions.filter(module => 
            module.items && module.items.some(item => item.permission && item.permission.length > 0)
        ).length;
    };

    // Get total permissions count
    const getTotalPermissionsCount = (modulePermissions) => {
        if (!modulePermissions || !Array.isArray(modulePermissions)) return 0;
        let count = 0;
        modulePermissions.forEach(module => {
            if (module.items) {
                module.items.forEach(item => {
                    if (item.permission) {
                        count += item.permission.length;
                    }
                });
            }
        });
        return count;
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
            <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/80 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading employee details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/80 flex items-center justify-center p-4">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center border border-teal-100/50 shadow-xl shadow-teal-500/5">
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
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold hover:shadow-lg transition-all text-sm"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/80 py-4 sm:py-6 lg:py-8">
            {/* SUCCESS TOAST */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg animate-fade-in-up flex items-center gap-2">
                    <MdCheckCircle size={20} className="animate-pulse" />
                    {successMessage}
                </div>
            )}

            <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleGoBack}
                            className="p-2 rounded-xl bg-white hover:bg-gray-50 text-gray-600 transition-all shadow-sm border border-gray-200"
                            title="Back to Employee List"
                        >
                            <MdArrowBack size={20} />
                        </button>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30 shrink-0">
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
                            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent tracking-tight leading-tight">
                                {employee?.employeeName || "Employee Details"}
                            </h1>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full inline-block" />
                                {employee?.employeeId} • {employee?.role || "Staff"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing && accessDetails && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold hover:shadow-lg transition-all text-sm"
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
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5">
                            <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-teal-100/50 shadow-xl shadow-teal-500/5">
                                <div className="flex items-center gap-2">
                                    <MdEmail className="text-teal-500" size={18} />
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-sm font-medium text-gray-700 truncate">{employee?.email || "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-teal-100/50 shadow-xl shadow-teal-500/5">
                                <div className="flex items-center gap-2">
                                    <MdPhone className="text-teal-500" size={18} />
                                    <div>
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <p className="text-sm font-medium text-gray-700">{employee?.mobile || "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-teal-100/50 shadow-xl shadow-teal-500/5">
                                <div className="flex items-center gap-2">
                                    <MdWork className="text-teal-500" size={18} />
                                    <div>
                                        <p className="text-xs text-gray-500">Role</p>
                                        <p className="text-sm font-medium text-gray-700">{employee?.role || "Staff"}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-teal-100/50 shadow-xl shadow-teal-500/5">
                                <div className="flex items-center gap-2">
                                    <MdLock className="text-teal-500" size={18} />
                                    <div>
                                        <p className="text-xs text-gray-500">Access</p>
                                        <p className="text-sm font-medium text-gray-700">
                                            {permissions.isLoginAllowed !== false ? "Enabled" : "Disabled"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Access Status */}
                        <div className="flex flex-wrap items-center gap-3 mb-5 p-4 bg-teal-50/50 rounded-xl border border-teal-100">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                permissions.isLoginAllowed !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}>
                                {permissions.isLoginAllowed !== false ? "✓ Login Allowed" : "✗ Login Restricted"}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                permissions.isReadOnly ? "bg-orange-100 text-orange-700" : "bg-teal-100 text-teal-700"
                            }`}>
                                {permissions.isReadOnly ? "🔒 Read Only" : "🔓 Full Access"}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                permissions.isAllProjectsAllowed ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                            }`}>
                                {permissions.isAllProjectsAllowed ? "🌐 All Projects" : "📁 Selected Projects"}
                            </span>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                                📊 {getEnabledModulesCount(permissions.modulePermissions)} Modules Active
                            </span>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                🎯 {getTotalPermissionsCount(permissions.modulePermissions)} Permissions
                            </span>
                        </div>

                        {/* Edit Mode Notice */}
                        {isEditing && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                                <p className="font-medium text-amber-800">✏️ Edit Mode Active</p>
                                <p className="text-xs text-amber-700 mt-1">Click on individual permissions or modules to toggle, then click Save Changes.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Module Permissions */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 sm:p-5 border border-teal-100/50 shadow-xl shadow-teal-500/5">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <MdDashboard size={18} className="text-teal-500" />
                                    Module Permissions
                                    {!isEditing && (
                                        <span className="text-xs text-gray-400 ml-2 font-normal">(View Only)</span>
                                    )}
                                </h3>
                                
                                {isEditing ? (
                                    // Edit mode with detailed permissions
                                    <div className="space-y-3">
                                        {menuItems.map((menuItem) => {
                                            const isActive = permissions.modulePermissions.some(
                                                p => p.component === menuItem.id
                                            );
                                            const isFullyEnabled = isModuleFullyEnabled(menuItem.id);
                                            const isPartial = isModulePartiallyEnabled(menuItem.id);
                                            
                                            return (
                                                <div
                                                    key={menuItem.id}
                                                    className={`border-2 rounded-lg p-3 transition-all duration-200 ${
                                                        isActive 
                                                            ? 'border-teal-400 bg-gradient-to-br from-teal-50/80 to-emerald-50/80' 
                                                            : 'border-gray-200 hover:border-teal-200'
                                                    }`}
                                                >
                                                    <div
                                                        className="flex items-center justify-between cursor-pointer"
                                                        onClick={() => toggleModule(menuItem.id)}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className={`${isActive ? 'text-teal-600' : 'text-gray-500'}`}>
                                                                {menuItem.icon}
                                                            </span>
                                                            <span className={`text-sm font-medium ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>
                                                                {menuItem.label}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {isActive && (
                                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                                                    isFullyEnabled 
                                                                        ? 'bg-teal-100 text-teal-700' 
                                                                        : isPartial
                                                                        ? 'bg-amber-100 text-amber-700'
                                                                        : 'bg-gray-100 text-gray-500'
                                                                }`}>
                                                                    {isFullyEnabled ? 'All' : isPartial ? 'Partial' : 'None'}
                                                                </span>
                                                            )}
                                                            {isActive ? (
                                                                <MdCheckBox className="text-teal-500" size={18} />
                                                            ) : (
                                                                <MdCheckBoxOutlineBlank className="text-gray-300" size={18} />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 space-y-1.5">
                                                        {menuItem.items.map((item) => {
                                                            const hasPerm = hasAnyPermission(menuItem.id, item.name);
                                                            const allPerms = hasAllPermissions(menuItem.id, item.name);
                                                            const availablePermissions = item.permission || [];
                                                            
                                                            return (
                                                                <div
                                                                    key={item.name}
                                                                    className={`border rounded-lg p-2 transition-all duration-200 ${
                                                                        hasPerm 
                                                                            ? 'border-teal-200 bg-white/60' 
                                                                            : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <div 
                                                                            className="flex items-center gap-2 cursor-pointer flex-1"
                                                                            onClick={() => toggleAllPermissionsForItem(menuItem.id, item.name)}
                                                                        >
                                                                            <span className={`text-xs font-medium ${hasPerm ? 'text-gray-800' : 'text-gray-500'}`}>
                                                                                {item.name}
                                                                            </span>
                                                                            {hasPerm && (
                                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                                                                    allPerms 
                                                                                        ? 'bg-teal-100 text-teal-700' 
                                                                                        : 'bg-amber-100 text-amber-700'
                                                                                }`}>
                                                                                    {allPerms ? 'All' : `${item.permission.length}/${availablePermissions.length}`}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <button
                                                                            onClick={() => toggleAllPermissionsForItem(menuItem.id, item.name)}
                                                                            className="text-[10px] text-teal-600 hover:text-teal-700 font-medium px-2 py-0.5 rounded hover:bg-teal-50 transition-colors"
                                                                        >
                                                                            {allPerms ? 'Deselect All' : 'Select All'}
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {availablePermissions.map((permission) => {
                                                                            const isEnabled = isPermissionEnabled(menuItem.id, item.name, permission);
                                                                            return (
                                                                                <button
                                                                                    key={permission}
                                                                                    onClick={() => toggleItemPermission(menuItem.id, item.name, permission)}
                                                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-all duration-200 ${
                                                                                        isEnabled
                                                                                            ? `${getPermissionColor(permission)} shadow-sm`
                                                                                            : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                                                                                    }`}
                                                                                >
                                                                                    {getPermissionIcon(permission)}
                                                                                    {getPermissionLabel(permission)}
                                                                                    {isEnabled && (
                                                                                        <MdCheckCircle size={10} className="text-current opacity-70" />
                                                                                    )}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    // View mode - compact
                                    <div className="module-grid">
                                        {menuItems.map((item) => {
                                            const hasPermission = permissions.modulePermissions.some(
                                                p => p.component === item.id && p.items.some(i => i.permission && i.permission.length > 0)
                                            );
                                            
                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                                                        hasPermission
                                                            ? "border-teal-300 bg-teal-50/50"
                                                            : "border-gray-200"
                                                    }`}
                                                >
                                                    <div className="text-teal-500 shrink-0">{item.icon}</div>
                                                    <span className="text-xs font-medium text-gray-700 flex-1">{item.label}</span>
                                                    {hasPermission ? (
                                                        <MdCheckBox className="text-teal-500" size={16} />
                                                    ) : (
                                                        <MdCheckBoxOutlineBlank className="text-gray-300" size={16} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Project Access */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 sm:p-5 border border-teal-100/50 shadow-xl shadow-teal-500/5">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <MdFolder size={18} className="text-teal-500" />
                                        Project Access
                                        {!isEditing && (
                                            <span className="text-xs text-gray-400 ml-2 font-normal">(View Only)</span>
                                        )}
                                    </h3>
                                    {isEditing && (
                                        <button
                                            onClick={toggleAllProjects}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                                permissions.isAllProjectsAllowed
                                                    ? "bg-teal-500 text-white"
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
                                                        className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                                                            isEditing ? "border-teal-300 bg-teal-50" : "border-gray-200 bg-gray-50"
                                                        }`}
                                                    >
                                                        <button
                                                            onClick={() => toggleProjectSelection(projectId)}
                                                            className="shrink-0"
                                                            disabled={!isEditing}
                                                        >
                                                            <MdCheckBox className="text-teal-500" size={18} />
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
                                                                className="text-[10px] border rounded-lg px-1.5 py-0.5 bg-white focus:border-teal-400 focus:ring-1 focus:ring-teal-200 outline-none"
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
                        <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 sm:p-5 mt-5 border border-teal-100/50 shadow-xl shadow-teal-500/5">
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
                                        className="w-4 h-4 text-teal-500 rounded border-gray-300 focus:ring-teal-500 disabled:opacity-50"
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
                                        className="w-4 h-4 text-teal-500 rounded border-gray-300 focus:ring-teal-500 disabled:opacity-50"
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
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold hover:shadow-lg hover:shadow-teal-500/30 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="bg-white/80 backdrop-blur-xl rounded-xl p-12 text-center border border-teal-100/50 shadow-xl shadow-teal-500/5">
                        <p className="text-gray-500">No access data available for this employee</p>
                    </div>
                )}
            </div>

            {/* Custom Animations */}
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease forwards;
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
            `}</style>
        </div>
    );
};

export default SingleEmployeeAccess;