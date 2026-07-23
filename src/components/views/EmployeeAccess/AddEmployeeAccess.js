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
  MdAddCircleOutline,
  MdListAlt,
  MdAccessTime,
  MdTimer,
  MdTrendingUp,
  MdDownload,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdCreate,
  MdEmail,
  MdLock,
  MdPerson,
  MdInfo,
  Md1kPlus,
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
      { name: 'All Staff', permission: ['add', 'view', 'edit', 'delete', 'export'] },
    ]
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: <MdFolder />,
    items: [
      { name: 'All Clients', permission: ['add', 'view', 'edit', 'delete', 'export'] }
    ]
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: <MdFolder />,
    items: [
      { name: 'All Projects', permission: ['add', 'view', 'edit', 'delete', 'export'] }
    ]
  },
  {
    id: 'installments',
    label: 'Installments',
    icon: <MdFolder />,
    items: [
      { name: 'All Installments', permission: ['add', 'view', 'edit', 'delete', 'export'] }
    ]
  },
  {
    id: 'assignedWorks',
    label: 'Work Allocation',
    icon: <MdAssignment />,
    items: [
      { name: 'All Worksheets', permission: ['add', 'view', 'edit', 'delete', 'export'] }
    ]
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: <MdSchedule />,
    items: [
      { name: 'Attendance', permission: ['add', 'view', 'edit', 'delete', 'export'] }
    ]
  },
  {
    id: 'invoice',
    label: 'Invoicing',
    icon: <MdFolder />,
    items: [
      { name: 'Invoices', permission: ['add', 'view', 'edit', 'delete', 'export', 'download'] }
    ]
  }
];

// Permission options for each item
const PERMISSION_OPTIONS = ['add', 'view', 'create', 'edit', 'delete'];

// Get icon for permission type
const getPermissionIcon = (permission) => {
  switch (permission) {
    case 'add': return <Md1kPlus size={14} />;
    case 'view': return <MdVisibility size={14} />;
    case 'create': return <MdAddCircleOutline size={14} />;
    case 'edit': return <MdEdit size={14} />;
    case 'delete': return <MdDelete size={14} />;
    case 'export': return <MdDownload size={14} />;
    case 'download': return <MdDownload size={14} />;
    default: return null;
  }
};

// Get color for permission type
const getPermissionColor = (permission) => {
  switch (permission) {
    case 'add': return 'text-yellow-500 bg-yellow-50 border-yellow-200';
    case 'view': return 'text-blue-500 bg-blue-50 border-blue-200';
    case 'create': return 'text-green-500 bg-green-50 border-green-200';
    case 'edit': return 'text-amber-500 bg-amber-50 border-amber-200';
    case 'delete': return 'text-red-500 bg-red-50 border-red-200';
    case 'export': return 'text-purple-500 bg-purple-50 border-purple-200';
    case 'download': return 'text-green-500 bg-green-50 border-green-200';
    default: return 'text-gray-500 bg-gray-50 border-gray-200';
  }
};

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

  // Employee login credentials (these will be sent as adminEmail and adminPanelPassword in the API)
  const [employeeCredentials, setEmployeeCredentials] = useState({
    email: '',        // This will be sent as adminEmail in the API
    password: '',     // This will be sent as adminPanelPassword in the API
    confirmPassword: ''
  });

  const [showCredentials, setShowCredentials] = useState(false);
  const [permissions, setPermissions] = useState({
    modulePermissions: [],
    allowedProjects: [],
    isAllProjectsAllowed: false,
    isReadOnly: false,
  });

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

    // Validate employee credentials
    if (!employeeCredentials.email) {
      alert("Please enter employee email for login");
      return;
    }
    if (!employeeCredentials.password) {
      alert("Please create a password for the employee");
      return;
    }
    if (employeeCredentials.password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }
    if (employeeCredentials.password !== employeeCredentials.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setSubmitting(true);

    // Build module permissions in the required format
    const modulePermissions = menuItems.map(menuItem => {
      const modulePerm = permissions.modulePermissions.find(
        p => p.component === menuItem.id
      );

      return {
        component: menuItem.id,
        items: menuItem.items.map(item => ({
          name: item.name,
          permission: modulePerm?.items?.find(i => i.name === item.name)?.permission || []
        }))
      };
    });

    // IMPORTANT: 
    // adminEmail = Employee's email for login
    // adminPanelPassword = Employee's password for login
    // These are the credentials the employee will use to access the system
    const payload = {
      employeeId: selectedEmployee.employeeId,
      adminEmail: employeeCredentials.email,        // Employee login email
      adminPanelPassword: employeeCredentials.password, // Employee login password
      modulePermissions: modulePermissions,
      allowedProjects: permissions.allowedProjects,
      isAllProjectsAllowed: permissions.isAllProjectsAllowed,
      isReadOnly: permissions.isReadOnly,
      adminId: adminDetails?.adminId || adminDetails?._id || "65f7e8a9b1c2d3e4f5a6b7d0",
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
        setShowCredentials(true);
        setTimeout(() => {
          setShowSuccess(false);
          setSelectedEmployee(null);
          resetPermissions();
          setEmployeeCredentials({ email: '', password: '', confirmPassword: '' });
          setShowCredentials(false);
          fetchStaffList();
        }, 6000);
        navigate('/employee-access');
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
      modulePermissions: [],
      allowedProjects: [],
      isAllProjectsAllowed: false,
      isReadOnly: false,
    });
  };

  // Toggle individual permission for an item
  const toggleItemPermission = (moduleId, itemName, permission) => {
    setPermissions((prev) => {
      const existingModule = prev.modulePermissions.find(
        p => p.component === moduleId
      );

      let updatedModulePermissions;

      if (existingModule) {
        // Find the item and toggle the specific permission
        const updatedItems = existingModule.items.map(item => {
          if (item.name === itemName) {
            const currentPermissions = item.permission || [];
            // Check if permission is already present
            if (currentPermissions.includes(permission)) {
              // Remove the permission
              return { ...item, permission: currentPermissions.filter(p => p !== permission) };
            } else {
              // Add the permission
              return { ...item, permission: [...currentPermissions, permission] };
            }
          }
          return item;
        });

        updatedModulePermissions = prev.modulePermissions.map(p =>
          p.component === moduleId ? { ...p, items: updatedItems } : p
        );
      } else {
        // Create new module with this permission
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

  // Toggle all permissions for an item (select/deselect all)
  const toggleAllPermissionsForItem = (moduleId, itemName) => {
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
            // If all permissions are selected, deselect all, otherwise select all
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
        // Create new module with all permissions for this item
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

  // Toggle entire module (enable/disable all items)
  const toggleModule = (moduleId) => {
    setPermissions((prev) => {
      const existingModule = prev.modulePermissions.find(
        p => p.component === moduleId
      );

      let updatedModulePermissions;
      const menuItem = menuItems.find(m => m.id === moduleId);

      if (existingModule) {
        // Check if all items have all their permissions
        let allFullyEnabled = true;
        menuItem.items.forEach(itemConfig => {
          const item = existingModule.items.find(i => i.name === itemConfig.name);
          if (!item || !itemConfig.permission.every(p => item.permission.includes(p))) {
            allFullyEnabled = false;
          }
        });

        // If all fully enabled, disable all; otherwise enable all with all permissions
        const newItems = menuItem.items.map(itemConfig => ({
          name: itemConfig.name,
          permission: allFullyEnabled ? [] : [...itemConfig.permission]
        }));

        updatedModulePermissions = prev.modulePermissions.map(p =>
          p.component === moduleId ? { ...p, items: newItems } : p
        );
      } else {
        // Add new module with all items and all permissions
        const items = menuItem.items.map(item => ({
          name: item.name,
          permission: [...item.permission]
        }));
        updatedModulePermissions = [...prev.modulePermissions, { component: moduleId, items }];
      }

      return { ...prev, modulePermissions: updatedModulePermissions };
    });
  };

  // Check if module is fully enabled (all items have all permissions)
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

  // Get permission display label
  const getPermissionLabel = (permission) => {
    return permission.charAt(0).toUpperCase() + permission.slice(1);
  };

  // Handle employee selection
  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    if (employee) {
      // Auto-populate email with employee email for login
      setEmployeeCredentials(prev => ({
        ...prev,
        email: employee.email || ''
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/80 py-4 sm:py-6 lg:py-8">
      {/* SUCCESS TOAST */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg animate-fade-in-up flex flex-col gap-2 max-w-md">
          <div className="flex items-center gap-2">
            <MdCheckCircle size={24} className="animate-pulse" />
            <span className="font-medium">{successMessage}</span>
          </div>
          {showCredentials && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mt-1 border border-white/30">
              <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                <MdInfo size={14} />
                🔑 Employee Login Credentials
              </p>
              <div className="flex items-center gap-2 text-xs">
                <MdEmail size={14} />
                <span className="font-mono">Email: {employeeCredentials.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <MdLock size={14} />
                <span className="font-mono">Password: {employeeCredentials.password}</span>
              </div>
              <p className="text-[10px] opacity-80 mt-1 border-t border-white/20 pt-1">
                ⚠️ Employee will use these credentials to login
              </p>
            </div>
          )}
        </div>
      )}

      <div className="w-full max-w-6xl mx-auto px-3 sm:px-5 md:px-6">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/employee-access')}
            className="p-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-600 transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200"
            title="Back to Access List"
          >
            <MdArrowBack size={20} />
          </button>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30 shrink-0">
            <MdPersonAdd className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent tracking-tight leading-tight">
              Grant Employee Access
            </h1>
            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full inline-block animate-pulse" />
              Assign permissions and create employee login credentials
            </p>
          </div>
        </div>

        {/* MAIN FORM */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/5 border border-teal-100/50 p-4 sm:p-6 md:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-teal-600 font-medium">Loading employees...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <MdCancel size={32} className="text-red-500" />
              </div>
              <p className="text-red-500 mb-3 font-medium">{error}</p>
              <button
                onClick={fetchStaffList}
                className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
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
                    handleEmployeeSelect(employee || null);
                  }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all duration-200 text-sm text-gray-700 bg-white outline-none appearance-none bg-no-repeat bg-right-4"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 12px center',
                    paddingRight: '36px'
                  }}
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
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600 bg-gradient-to-r from-teal-50 to-emerald-50 p-3 rounded-xl border border-teal-100">
                    <MdPerson className="text-teal-600" size={16} />
                    <span className="font-medium text-teal-700">Selected:</span>
                    <span className="font-semibold text-gray-800">{selectedEmployee.employeeName}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">{selectedEmployee.email}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-xs bg-teal-100 text-teal-700 px-2.5 py-0.5 rounded-full font-medium">ID: {selectedEmployee.employeeId}</span>
                  </div>
                )}
              </div>

              {/* Employee Login Credentials Section */}
              <div className="border-t border-teal-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MdLock size={18} className="text-teal-500" />
                    Employee Login Credentials <span className="text-red-500 text-xs">*</span>
                  </h3>
                  <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full flex items-center gap-1">
                    <MdInfo size={14} />
                    These credentials will be used by employee to login
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <MdInfo className="text-blue-500 mt-0.5 shrink-0" size={16} />
                  <p className="text-xs text-blue-700">
                    <strong>Note:</strong> The email and password you set here will be the employee's login credentials
                    for accessing the system. These will be sent as <code className="bg-blue-100 px-1 py-0.5 rounded">adminEmail</code> and
                    <code className="bg-blue-100 px-1 py-0.5 rounded">adminPanelPassword</code> in the API request.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Employee Login Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MdEmail className="text-gray-400" size={18} />
                      </div>
                      <input
                        type="email"
                        value={employeeCredentials.email}
                        onChange={(e) => setEmployeeCredentials(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter employee login email"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all duration-200 text-sm text-gray-700 bg-white outline-none"
                        required
                      />
                    </div>
                    {selectedEmployee && !employeeCredentials.email && (
                      <p className="text-xs text-amber-600 mt-1">
                        💡 Auto-filled from employee profile
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">
                      This will be the employee's username for login
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Employee Login Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MdLock className="text-gray-400" size={18} />
                      </div>
                      <input
                        type="password"
                        value={employeeCredentials.password}
                        onChange={(e) => setEmployeeCredentials(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Create password (min 6 chars)"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all duration-200 text-sm text-gray-700 bg-white outline-none"
                        required
                        minLength="6"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Minimum 6 characters for security
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MdLock className="text-gray-400" size={18} />
                      </div>
                      <input
                        type="password"
                        value={employeeCredentials.confirmPassword}
                        onChange={(e) => setEmployeeCredentials(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm password"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border-2 transition-all duration-200 text-sm text-gray-700 bg-white outline-none ${employeeCredentials.confirmPassword && employeeCredentials.password !== employeeCredentials.confirmPassword
                            ? 'border-red-400 focus:ring-red-100'
                            : employeeCredentials.confirmPassword && employeeCredentials.password === employeeCredentials.confirmPassword
                              ? 'border-green-400 focus:ring-green-100'
                              : 'border-gray-200 focus:border-teal-400 focus:ring-teal-100'
                          }`}
                        required
                      />
                      {employeeCredentials.confirmPassword && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          {employeeCredentials.password === employeeCredentials.confirmPassword ? (
                            <MdCheckCircle className="text-green-500" size={18} />
                          ) : (
                            <MdCancel className="text-red-500" size={18} />
                          )}
                        </div>
                      )}
                    </div>
                    {employeeCredentials.confirmPassword && employeeCredentials.password !== employeeCredentials.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">❌ Passwords do not match</p>
                    )}
                    {employeeCredentials.confirmPassword && employeeCredentials.password === employeeCredentials.confirmPassword && (
                      <p className="text-xs text-green-500 mt-1">✅ Passwords match</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Module Permissions - Updated with selectable permissions */}
              <div className="border-t border-teal-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MdDashboard size={18} className="text-teal-500" />
                    Module Permissions
                  </h3>
                  <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                    Click module to toggle all
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {menuItems.map((menuItem) => {
                    const isActive = permissions.modulePermissions.some(
                      p => p.component === menuItem.id
                    );
                    const isFullyEnabled = isModuleFullyEnabled(menuItem.id);
                    const isPartial = isModulePartiallyEnabled(menuItem.id);

                    return (
                      <div
                        key={menuItem.id}
                        className={`border-2 rounded-xl p-4 transition-all duration-200 ${isActive
                            ? 'border-teal-400 bg-gradient-to-br from-teal-50/80 to-emerald-50/80 shadow-sm shadow-teal-100'
                            : 'border-gray-200 hover:border-teal-200 hover:bg-gray-50'
                          }`}
                      >
                        <div
                          className="flex items-center justify-between cursor-pointer mb-3"
                          onClick={() => toggleModule(menuItem.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`${isActive ? 'text-teal-600' : 'text-gray-500'}`}>
                              {menuItem.icon}
                            </span>
                            <span className={`text-sm font-semibold ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>
                              {menuItem.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isActive && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isFullyEnabled
                                  ? 'bg-teal-100 text-teal-700'
                                  : isPartial
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}>
                                {isFullyEnabled ? 'All' : isPartial ? 'Partial' : 'None'}
                              </span>
                            )}
                            {isActive ? (
                              <MdCheckBox className="text-teal-500" size={20} />
                            ) : (
                              <MdCheckBoxOutlineBlank className="text-gray-300" size={20} />
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {menuItem.items.map((item) => {
                            const hasPerm = hasAnyPermission(menuItem.id, item.name);
                            const allPerms = hasAllPermissions(menuItem.id, item.name);
                            const availablePermissions = item.permission || [];

                            return (
                              <div
                                key={item.name}
                                className={`border rounded-lg p-2.5 transition-all duration-200 ${hasPerm
                                    ? 'border-teal-200 bg-white/60'
                                    : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100'
                                  }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <div
                                    className="flex items-center gap-2 cursor-pointer flex-1"
                                    onClick={() => toggleAllPermissionsForItem(menuItem.id, item.name)}
                                  >
                                    <span className={`text-xs font-medium ${hasPerm ? 'text-gray-800' : 'text-gray-500'}`}>
                                      {item.name}
                                    </span>
                                    {hasPerm && (
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${allPerms
                                          ? 'bg-teal-100 text-teal-700'
                                          : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {allPerms ? 'All' : `${item.permission.length}/${availablePermissions.length}`}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => toggleAllPermissionsForItem(menuItem.id, item.name)}
                                    className="text-xs text-teal-600 hover:text-teal-700 font-medium px-2 py-0.5 rounded hover:bg-teal-50 transition-colors"
                                  >
                                    {allPerms ? 'Deselect All' : 'Select All'}
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {availablePermissions.map((permission) => {
                                    const isEnabled = isPermissionEnabled(menuItem.id, item.name, permission);
                                    return (
                                      <button
                                        key={permission}
                                        onClick={() => toggleItemPermission(menuItem.id, item.name, permission)}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-200 ${isEnabled
                                            ? `${getPermissionColor(permission)} shadow-sm`
                                            : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                                          }`}
                                      >
                                        {getPermissionIcon(permission)}
                                        {getPermissionLabel(permission)}
                                        {isEnabled && (
                                          <MdCheckCircle size={12} className="text-current opacity-70" />
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
              </div>

              {/* Project Access */}
              <div className="border-t border-teal-100 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MdFolder size={18} className="text-teal-500" />
                    Project Access
                  </h3>
                  <button
                    onClick={toggleAllProjects}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${permissions.isAllProjectsAllowed
                        ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md shadow-teal-500/30"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {permissions.isAllProjectsAllowed ? "All Projects ✓" : "Select Projects"}
                  </button>
                </div>

                {!permissions.isAllProjectsAllowed && (
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-3 bg-gray-50/50">
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
                            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 ${isSelected
                                ? "border-teal-300 bg-gradient-to-r from-teal-50 to-emerald-50 shadow-sm"
                                : "border-gray-200 bg-white hover:border-teal-200 hover:bg-gray-50"
                              }`}
                          >
                            <button
                              onClick={() => toggleProjectSelection(project._id)}
                              className="shrink-0"
                            >
                              {isSelected ? (
                                <MdCheckBox className="text-teal-500" size={20} />
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
                                className="text-xs border rounded-lg px-2.5 py-1 bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
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
                      <div className="text-center py-8">
                        <MdFolder size={32} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">No projects available</p>
                      </div>
                    )}
                  </div>
                )}

                {permissions.isAllProjectsAllowed && (
                  <div className="text-center py-8 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border-2 border-teal-200 border-dashed">
                    <MdCheckCircle size={32} className="text-teal-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-teal-600">
                      ✅ All projects will be accessible
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Click "Select Projects" to choose specific projects
                    </p>
                  </div>
                )}
              </div>

              {/* Additional Options */}
              <div className="border-t border-teal-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Additional Settings</h3>
                <div className="flex items-center gap-6 flex-wrap">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={permissions.isReadOnly}
                      onChange={(e) =>
                        setPermissions((prev) => ({
                          ...prev,
                          isReadOnly: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 focus:ring-2 transition-all"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                      Read Only Mode
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-teal-100">
                <button
                  onClick={() => {
                    setSelectedEmployee(null);
                    resetPermissions();
                    setEmployeeCredentials({ email: '', password: '', confirmPassword: '' });
                  }}
                  className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-sm"
                  disabled={submitting}
                >
                  Clear All
                </button>
                <button
                  onClick={handleAssignPermissions}
                  disabled={submitting || !selectedEmployee || !employeeCredentials.email || !employeeCredentials.password || employeeCredentials.password !== employeeCredentials.confirmPassword}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold hover:shadow-lg hover:shadow-teal-500/30 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Assigning...
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <MdPersonAdd size={16} />
                      Grant Access & Create Login
                    </span>
                  )}
                </button>
              </div>

              {/* Employee Count */}
              <div className="text-center text-xs text-gray-400 pt-2">
                <span className="bg-gray-50 px-3 py-1 rounded-full">
                  {staffList.length} employees available for access
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease forwards;
        }
        
        /* Scrollbar styling */
        .max-h-60::-webkit-scrollbar {
          width: 6px;
        }
        .max-h-60::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .max-h-60::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        .max-h-60::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};

export default AddEmployeeAccess;