import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MdDashboard,
  MdPeople,
  MdFolder,
  MdAssignment,
  MdSchedule,
  MdLogout,
  MdExpandMore,
  MdExpandLess,
  MdAddCircleOutline,
  MdListAlt,
  MdClose,
  MdDownload,
  MdInsights,
  MdSettings,
  MdTimelapse,
  MdAccessTime,
  MdTimer,
  MdTrendingUp,
  MdPersonAdd,
} from 'react-icons/md';

/* ------------------------------------------------------------------ */
/*  Access helpers                                                     */
/* ------------------------------------------------------------------ */

// Maps a sidebar menu item's internal id to the "component" key used
// inside modulePermissions on the staff record.
const COMPONENT_KEY_MAP = {
  dashboard: 'dashboard',
  staff: 'staffManagement',
  clients: 'clients',
  projects: 'projects',
  installments: 'installments',
  'assigned-works': 'assignedWorks',
  attendance: 'attendance',
  'work-session': 'workSession',
  invoice: 'invoice',
  payslip: 'payslip',
  'employee-access': 'employeeAccess',
  settings: 'settings',
};

const getLoggedInUser = () => {
  try {
    // Staff (and, in some flows, admin) sessions are stored under 'loginDetails'.
    const loginDetails = sessionStorage.getItem('loginDetails');
    if (loginDetails) return JSON.parse(loginDetails);

    // Fallback for admin sessions stored under a separate key.
    const adminDetails = sessionStorage.getItem('adminDetails');
    if (adminDetails) return JSON.parse(adminDetails);
  } catch (err) {
    console.error('Failed to parse logged-in user from session storage:', err);
  }
  return null;
};

const isAdminRole = (role) => {
  if (!role) return false;
  return role.toString().trim().toLowerCase() === 'admin';
};

// A module is considered accessible if it exists in modulePermissions
// and at least one of its items has a non-empty permission array.
const hasModuleAccess = (modulePermissions, componentKey) => {
  if (!componentKey || !Array.isArray(modulePermissions)) return false;
  const module = modulePermissions.find((m) => m.component === componentKey);
  if (!module || !Array.isArray(module.items)) return false;
  return module.items.some(
    (item) => Array.isArray(item.permission) && item.permission.length > 0
  );
};

/* ------------------------------------------------------------------ */
/*  Menu definitions                                                   */
/*  Every submenu entry carries an `access` tag:                       */
/*    'view'   -> visible to staff (read-level links)                  */
/*    'manage' -> create/add links, admin-only                         */
/* ------------------------------------------------------------------ */

const ALL_MENU_ITEMS = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: <MdDashboard />,
    description: 'Overview & analytics',
    moduleKey: 'dashboard',
  },
  {
    id: 'staff',
    label: 'Staff Management',
    icon: <MdPeople />,
    description: 'Manage team members',
    moduleKey: 'staff',
    submenu: [
      { path: '/add-staff', label: 'Add Staff', icon: <MdAddCircleOutline />, description: 'Create new profile', access: 'manage' },
      { path: '/staff', label: 'Staff Directory', icon: <MdListAlt />, description: 'View all members', access: 'view' },
    ],
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: <MdFolder />,
    description: 'Leads',
    moduleKey: 'clients',
    submenu: [
      { path: '/add-client', label: 'New Lead', icon: <MdAddCircleOutline />, description: 'Create Lead', access: 'manage' },
      { path: '/allclients', label: 'Lead List', icon: <MdListAlt />, description: 'All Leads', access: 'view' },
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: <MdFolder />,
    description: 'Track progress',
    moduleKey: 'projects',
    submenu: [
      { path: '/add-project', label: 'New Project', icon: <MdAddCircleOutline />, description: 'Create project', access: 'manage' },
      { path: '/projects', label: 'Project List', icon: <MdListAlt />, description: 'All projects', access: 'view' },
    ],
  },
  {
    id: 'installments',
    label: 'Installments',
    icon: <MdFolder />,
    description: 'Leads',
    moduleKey: 'installments',
    submenu: [
      { path: '/add-installment', label: 'Installments', icon: <MdAddCircleOutline />, description: 'Create Lead', access: 'view' },
    ],
  },
  {
    id: 'assigned-works',
    label: 'Work Allocation',
    icon: <MdAssignment />,
    description: 'Tasks & assignments',
    moduleKey: 'assigned-works',
    submenu: [
      { path: '/add-worksheet', label: 'New Worksheet', icon: <MdAddCircleOutline />, description: 'Assign work', access: 'manage' },
      { path: '/assigned-works', label: 'All Worksheets', icon: <MdListAlt />, description: 'View assignments', access: 'view' },
    ],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: <MdSchedule />,
    description: 'Time tracking',
    moduleKey: 'attendance',
    submenu: [
      { path: '/add-attendance', label: 'Mark Attendance', icon: <MdAddCircleOutline />, description: 'Daily entry', access: 'manage' },
      { path: '/attendance', label: 'Attendance Log', icon: <MdListAlt />, description: 'History', access: 'view' },
    ],
  },
  {
    id: 'work-session',
    label: 'Work Session',
    icon: <MdTimelapse />,
    description: 'Time tracking & activity',
    moduleKey: 'work-session',
    submenu: [
      { path: '/work-session-live', label: 'Live Tracking', icon: <MdAccessTime />, description: 'Real-time status', access: 'view' },
      { path: '/work-session-history', label: 'Session History', icon: <MdTimer />, description: 'View records', access: 'view' },
      { path: '/work-session-reports', label: 'Work Reports', icon: <MdTrendingUp />, description: 'Analytics', access: 'view' },
    ],
  },
  {
    id: 'invoice',
    label: 'Invoicing',
    icon: <MdFolder />,
    description: 'Billing & payments',
    moduleKey: 'invoice',
    submenu: [
      { path: '/create-invoice', label: 'Create Invoice', icon: <MdAddCircleOutline />, description: 'New invoice', access: 'manage' },
      { path: '/invoices', label: 'Invoice List', icon: <MdListAlt />, description: 'All invoices', access: 'view' },
      // { path: '/invoices1', label: 'Advanced Invoice', icon: <MdDownload />, description: 'Pro format', access: 'view' },
    ],
  },
  {
    id: 'payslip',
    label: 'Payroll',
    icon: <MdAssignment />,
    description: 'Salary processing',
    moduleKey: 'payslip',
    submenu: [
      { path: '/create-payslip', label: 'Generate Payslip', icon: <MdAddCircleOutline />, description: 'Monthly payroll', access: 'manage' },
      { path: '/payslips', label: 'Payslip History', icon: <MdListAlt />, description: 'View all', access: 'view' },
    ],
  },
];

// Bottom items are admin-only (there's no corresponding modulePermissions
// entry for these on staff records).
const BOTTOM_MENU_ITEMS = [
  {
    id: 'employee-access',
    label: 'Employee-Access',
    icon: <MdInsights />,
    description: 'Page Permissions',
    moduleKey: 'employee-access',
    submenu: [
      { path: '/add-employee-access', label: 'Add Employee Access', icon: <MdPersonAdd />, description: 'Add permissions', access: 'manage' },
      { path: '/employee-access', label: 'Employee Access', icon: <MdListAlt />, description: 'Manage permissions', access: 'view' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <MdSettings />,
    description: 'Preferences',
    moduleKey: 'settings',
    submenu: [
      { path: '/marketing-plans', label: 'Digital Marketing', icon: <MdSettings />, description: 'Package Management', access: 'view' },
      { path: 'company-info', label: 'Company Info', icon: <MdFolder />, description: 'company details', access: 'view' },
      { path: '/settings/notifications', label: 'Notifications', icon: <MdListAlt />, description: 'Alert preferences', access: 'view' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Sidebar = ({ isOpen, onLogout, isMobile, isTablet, onClose }) => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});
  const [currentUser] = useState(getLoggedInUser);

  const admin = isAdminRole(currentUser?.role);
  const modulePermissions = currentUser?.modulePermissions || [];

  // Build the visible menu (top + bottom) based on role/permissions.
  const { visibleMenuItems, visibleBottomItems } = useMemo(() => {
    // Admin sees everything, unmodified.
    if (admin) {
      return { visibleMenuItems: ALL_MENU_ITEMS, visibleBottomItems: BOTTOM_MENU_ITEMS };
    }
    

    const filterForStaff = (items) =>
      items.reduce((acc, item) => {
        const componentKey = COMPONENT_KEY_MAP[item.moduleKey];
        const allowed = hasModuleAccess(modulePermissions, componentKey);
        if (!allowed) return acc;

        if (!item.submenu) {
          acc.push(item);
          return acc;
        }

        const submenu = item.submenu.filter((sub) => sub.access === 'view');
        if (submenu.length === 0) return acc;

        acc.push({ ...item, submenu });
        return acc;
      }, []);

    return {
      visibleMenuItems: filterForStaff(ALL_MENU_ITEMS),
      // Staff never see the admin-only bottom section.
      visibleBottomItems: [],
    };
  }, [admin, modulePermissions]);

  const navigate = useNavigate();

  // Restore open menus based on current path
  useEffect(() => {
    const paths = [
      'staff', 'projects', 'assigned-works', 'work-session', 'invoice', 'payslip',
      'analytics', 'settings', 'security', 'clients', 'installments', 'attendance', 'employee-access',
    ];
    paths.forEach((path) => {
      if (location.pathname.includes(path) && !openMenus[path]) {
        setOpenMenus((prev) => ({ ...prev, [path]: true }));
      }
    });
  }, [location.pathname]);

  const toggleSubmenu = (path) => {
    setOpenMenus((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const handleLogout = () => {
    const loginDetails = JSON.parse(
      sessionStorage.getItem("loginDetails") || "{}"
    );

    const role = loginDetails.role;

    sessionStorage.removeItem("loginDetails");

    if (onLogout) onLogout();

    if (role === "Staff") {
      navigate("./staff-login");
    } else {
      navigate("/");
    }
  };

  const handleLinkClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  const renderMenuItem = (item, index, animationName) => (
    <div key={item.id || item.path} style={{ animation: `${animationName} 0.3s ease ${index * 0.05}s backwards` }}>
      {item.submenu ? (
        <>
          <div
            className="group flex items-center justify-between cursor-pointer rounded-xl sm:rounded-2xl mx-2 sm:mx-3 my-1 px-3 sm:px-4 py-2.5 sm:py-3 text-white/85 transition-all duration-400 ease-[cubic-bezier(0.2,0.9,0.4,1)] hover:bg-white/6 hover:text-white hover:pl-4 sm:hover:pl-5 relative overflow-hidden before:absolute before:left-0 before:top-0 before:w-0.5 sm:before:w-1 before:h-full before:bg-gradient-to-b before:from-teal-400 before:to-cyan-400 before:scale-y-0 before:transition-transform before:duration-300 hover:before:scale-y-100"
            onClick={() => toggleSubmenu(item.id)}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-[38px] md:h-[38px] rounded-xl flex items-center justify-center transition-all duration-300 bg-white/5 text-white/90 group-hover:bg-teal-400/30 group-hover:text-teal-300 text-base sm:text-lg shrink-0">
                {item.icon}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs sm:text-sm truncate">{item.label}</span>
                <span className="text-[8px] sm:text-[10px] opacity-60 truncate">{item.description}</span>
              </div>
            </div>
            <span className={`transition-transform duration-400 opacity-70 shrink-0 ml-1 ${openMenus[item.id] ? 'rotate-180' : 'rotate-0'}`}>
              {openMenus[item.id] ? <MdExpandLess size={16} className="sm:text-[18px] md:text-[20px]" /> : <MdExpandMore size={16} className="sm:text-[18px] md:text-[20px]" />}
            </span>
          </div>

          {openMenus[item.id] && (
            <div className="ml-4 sm:ml-5 pl-3 sm:pl-4 border-l border-teal-400 relative mt-1 mb-2">
              {item.submenu.map((subItem, subIndex) => (
                <Link
                  key={subItem.path}
                  to={subItem.path}
                  className={`flex items-center px-3 sm:px-4 py-2 sm:py-2.5 my-0.5 sm:my-1 text-white/75 rounded-xl transition-all duration-300 text-[11px] sm:text-[13px] relative hover:bg-teal-400/15 hover:text-white hover:pl-4 sm:hover:pl-[22px] ${location.pathname === subItem.path
                      ? 'bg-teal-400/20 text-white border-l-2 sm:border-l-3 border-teal-400 rounded-l-xl'
                      : ''
                    }`}
                  onClick={handleLinkClick}
                  style={{ animation: `slideInSubmenu 0.2s ease ${subIndex * 0.03}s backwards` }}
                >
                  <span className="mr-2 sm:mr-3.5 text-sm sm:text-base opacity-90 shrink-0">
                    {subItem.icon}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] sm:text-[13px] font-medium truncate">{subItem.label}</span>
                    <span className="text-[8px] sm:text-[10px] opacity-60 truncate">{subItem.description}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : (
        <Link
          to={item.path}
          className={`group flex items-center gap-2 sm:gap-3 no-underline rounded-xl sm:rounded-2xl mx-2 sm:mx-3 my-1 px-3 sm:px-4 py-2.5 sm:py-3 text-white/85 transition-all duration-400 ease-[cubic-bezier(0.2,0.9,0.4,1)] hover:bg-white/6 hover:text-white hover:pl-4 sm:hover:pl-5 relative overflow-hidden before:absolute before:left-0 before:top-0 before:w-0.5 sm:before:w-1 before:h-full before:bg-gradient-to-b before:from-teal-400 before:to-cyan-400 before:scale-y-0 before:transition-transform before:duration-300 hover:before:scale-y-100 ${location.pathname === item.path
              ? 'bg-gradient-to-r from-teal-400/20 to-teal-400/5 text-white border-l-2 sm:border-l-4 border-teal-400 rounded-l-xl'
              : ''
            }`}
          onClick={handleLinkClick}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-[38px] md:h-[38px] rounded-xl flex items-center justify-center transition-all duration-300 bg-white/5 text-white/90 group-hover:bg-teal-400/30 group-hover:text-teal-300 text-base sm:text-lg shrink-0">
            {item.icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-xs sm:text-sm truncate">{item.label}</span>
            {item.description && (
              <span className="text-[9px] sm:text-xs opacity-60 truncate">{item.description}</span>
            )}
          </div>
        </Link>
      )}
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideInSidebar {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideInSubmenu {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideInBottomSubmenu {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .sidebar-scroll::-webkit-scrollbar {
            width: 4px;
          }
          .sidebar-scroll::-webkit-scrollbar-track {
            background: rgba(20, 184, 166, 0.05);
          }
          .sidebar-scroll::-webkit-scrollbar-thumb {
            background: rgba(20, 184, 166, 0.3);
            border-radius: 10px;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(20, 184, 166, 0.6);
          }
        `
      }} />

      <div
        className={`fixed h-screen flex flex-col transition-all duration-400 ease-[cubic-bezier(0.2,0.9,0.4,1)] z-[1100] bg-gradient-to-br from-teal-900 via-teal-800 to-teal-900 shadow-[20px_0_40px_rgba(0,77,77,0.25)] border-r border-white/10 animate-[slideInSidebar_0.5s_cubic-bezier(0.2,0.9,0.4,1)] ${isMobile ? 'w-[280px] sm:w-[300px]' : 'w-[260px] sm:w-[270px] md:w-[280px]'
          } ${isOpen ? 'left-0' : isMobile ? '-left-[280px] sm:-left-[300px]' : '-left-[260px] sm:-left-[270px] md:-left-[280px]'}`}
      >
        {/* Premium Header with Close */}
        <div className="bg-white/5 border-b border-teal-400/20 backdrop-blur-sm flex items-center justify-between p-3 sm:p-4 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 bg-light rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-teal-400/30 shrink-0">
              <img src="/logo2.png" alt="Logo" className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
            </div>
            <div className="min-w-0">
              <h5 className="mb-0 font-bold text-white tracking-wide text-sm sm:text-base truncate">Pixelmindsolutions</h5>
              <span className="bg-teal-400/25 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-semibold tracking-wide text-teal-300 border border-teal-400/40 inline-block">
                CRM
              </span>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="bg-white/10 border-none w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl text-white flex items-center justify-center transition-all duration-300 hover:bg-white/20 shrink-0"
            >
              <MdClose size={18} className="sm:text-[20px] md:text-[22px]" />
            </button>
          )}
        </div>

        {/* Scrollable Menu Area */}
        <div className="flex-grow overflow-y-auto overflow-x-hidden py-2 sm:py-3 sidebar-scroll">
          {visibleMenuItems.map((item, index) => renderMenuItem(item, index, 'slideInSidebar'))}

          {visibleBottomItems.length > 0 && (
            <>
              {/* Divider */}
              <div className="h-px bg-white/10 my-3 sm:my-5 mx-3 sm:mx-4" />

              {/* Bottom Menu Items with Submenu (admin only) */}
              {visibleBottomItems.map((item, index) => renderMenuItem(item, index, 'slideInBottomSubmenu'))}
            </>
          )}

          {/* Ultra Premium Logout */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer rounded-xl sm:rounded-2xl mx-2 sm:mx-3 my-1.5 p-2.5 sm:p-3.5 transition-all duration-400 hover:-translate-y-0.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 hover:border-red-500/40"
            onClick={handleLogout}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-[38px] md:h-[38px] rounded-xl flex items-center justify-center bg-red-500/10 text-red-400 text-base sm:text-lg shrink-0">
              <MdLogout size={18} className="sm:text-[20px]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-red-300 text-xs sm:text-sm truncate">Logout</span>
              <span className="text-[9px] sm:text-xs opacity-60 text-red-300/70 truncate">End session</span>
            </div>
          </div>
        </div>

        {/* Premium Footer */}
        <div className="p-2 sm:p-3 text-center border-t border-white/5 shrink-0">
          <span className="text-white/40 text-[8px] sm:text-[10px] md:text-xs">
            PMS · CRM
          </span>
        </div>
      </div>
    </>
  );
};

export default Sidebar;