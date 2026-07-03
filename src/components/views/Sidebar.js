// import React, { useState, useEffect } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import {
//   MdDashboard,
//   MdPeople,
//   MdFolder,
//   MdAssignment,
//   MdLock,
//   MdSchedule,
//   MdLogout,
//   MdExpandMore,
//   MdExpandLess,
//   MdAddCircleOutline,
//   MdListAlt,
//   MdClose,
//   MdDownload,
//   MdInsights,
//   MdSettings
// } from 'react-icons/md';

// const Sidebar = ({ isOpen, onLogout, isMobile, isTablet, onClose }) => {
//   const location = useLocation();
//   const [openMenus, setOpenMenus] = useState({});
//   const [hoveredItem, setHoveredItem] = useState(null);

//   // Restore open menus based on current path
//   useEffect(() => {
//     const paths = [
//       'staff', 'projects', 'assigned-works', 'attendance', 'invoice', 'payslip'
//     ];
//     paths.forEach(path => {
//       if (location.pathname.includes(path) && !openMenus[path]) {
//         setOpenMenus(prev => ({ ...prev, [path]: true }));
//       }
//     });
//   }, [location.pathname]);

//   const toggleSubmenu = (path) => {
//     setOpenMenus((prev) => ({
//       ...prev,
//       [path]: !prev[path],
//     }));
//   };

//   const handleLogout = () => {
//     sessionStorage.removeItem('adminDetails');
//     if (onLogout) onLogout();
//   };

//   const handleLinkClick = () => {
//     if (isMobile) {
//       onClose();
//     }
//   };

//   const menuItems = [
//     { 
//       path: '/dashboard', 
//       label: 'Dashboard', 
//       icon: <MdDashboard />,
//       description: 'Overview & analytics'
//     },
//     {
//       id: 'staff',
//       label: 'Staff Management',
//       icon: <MdPeople />,
//       description: 'Manage team members',
//       submenu: [
//         { path: '/add-staff', label: 'Add Staff', icon: <MdAddCircleOutline />, description: 'Create new profile' },
//         { path: '/staff', label: 'Staff Directory', icon: <MdListAlt />, description: 'View all members' },
//       ],
//     },
//     {
//       id: 'projects',
//       label: 'Projects',
//       icon: <MdFolder />,
//       description: 'Track progress',
//       submenu: [
//         { path: '/add-project', label: 'New Project', icon: <MdAddCircleOutline />, description: 'Create project' },
//         { path: '/projects', label: 'Project List', icon: <MdListAlt />, description: 'All projects' },
//       ],
//     },
//     {
//       id: 'assigned-works',
//       label: 'Work Allocation',
//       icon: <MdAssignment />,
//       description: 'Tasks & assignments',
//       submenu: [
//         { path: '/add-worksheet', label: 'New Worksheet', icon: <MdAddCircleOutline />, description: 'Assign work' },
//         { path: '/assigned-works', label: 'All Worksheets', icon: <MdListAlt />, description: 'View assignments' },
//       ],
//     },
    // {
    //   id: 'attendance',
    //   label: 'Attendance',
    //   icon: <MdSchedule />,
    //   description: 'Time tracking',
    //   submenu: [
    //     { path: '/add-attendance', label: 'Mark Attendance', icon: <MdAddCircleOutline />, description: 'Daily entry' },
    //     { path: '/attendance', label: 'Attendance Log', icon: <MdListAlt />, description: 'History' },
    //   ],
    // },
//     {
//       id: 'invoice',
//       label: 'Invoicing',
//       icon: <MdFolder />,
//       description: 'Billing & payments',
//       submenu: [
//         { path: '/create-invoice', label: 'Create Invoice', icon: <MdAddCircleOutline />, description: 'New invoice' },
//         { path: '/invoices', label: 'Invoice List', icon: <MdListAlt />, description: 'All invoices' },
//         { path: '/invoices1', label: 'Advanced Invoice', icon: <MdDownload />, description: 'Pro format' },
//       ],
//     },
//     {
//       id: 'payslip',
//       label: 'Payroll',
//       icon: <MdAssignment />,
//       description: 'Salary processing',
//       submenu: [
//         { path: '/create-payslip', label: 'Generate Payslip', icon: <MdAddCircleOutline />, description: 'Monthly payroll' },
//         { path: '/payslips', label: 'Payslip History', icon: <MdListAlt />, description: 'View all' },
//       ],
//     },
//   ];

//   const bottomMenuItems = [
//     { path: '/analytics', label: 'Analytics', icon: <MdInsights />, description: 'Reports & insights' },
//     { path: '/settings', label: 'Settings', icon: <MdSettings />, description: 'Preferences' },
//     { path: '/change-password', label: 'Security', icon: <MdLock />, description: 'Change password' },
//   ];

//   return (
//     <>
//       <style>{`
//         @keyframes slideIn {
//           from { transform: translateX(-100%); opacity: 0; }
//           to { transform: translateX(0); opacity: 1; }
//         }
        
//         @keyframes glowPulse {
//           0%, 100% { box-shadow: 0 0 0 0 rgba(64, 224, 208, 0.4); }
//           50% { box-shadow: 0 0 0 8px rgba(64, 224, 208, 0); }
//         }
        
//         .sidebar-premium {
//           background: linear-gradient(165deg, #0b2f2f 0%, #063737 30%, #004d4d 100%);
//           box-shadow: 20px 0 40px rgba(0, 77, 77, 0.25);
//           border-right: 1px solid rgba(255, 255, 255, 0.08);
//           animation: slideIn 0.5s cubic-bezier(0.2, 0.9, 0.4, 1);
//         }
        
//         .menu-header-premium {
//           background: rgba(255, 255, 255, 0.03);
//           border-bottom: 1px solid rgba(64, 224, 208, 0.2);
//           backdrop-filter: blur(10px);
//         }
        
//         .menu-item-ultra {
//           transition: all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1);
//           border-radius: 16px;
//           margin: 6px 12px;
//           padding: 12px 16px;
//           color: rgba(255, 255, 255, 0.85);
//           position: relative;
//           overflow: hidden;
//         }
        
//         .menu-item-ultra::before {
//           content: '';
//           position: absolute;
//           left: 0;
//           top: 0;
//           width: 4px;
//           height: 100%;
//           background: linear-gradient(180deg, #40E0D0, #00CED1);
//           transform: scaleY(0);
//           transition: transform 0.3s ease;
//           transform-origin: top;
//           border-radius: 0 4px 4px 0;
//         }
        
//         .menu-item-ultra:hover::before {
//           transform: scaleY(1);
//         }
        
//         .menu-item-ultra:hover {
//           background: rgba(255, 255, 255, 0.06);
//           color: white;
//           padding-left: 20px;
//         }
        
//         .menu-item-active {
//           background: linear-gradient(90deg, rgba(64, 224, 208, 0.2), rgba(64, 224, 208, 0.05));
//           color: white !important;
//           border-left: 4px solid #40E0D0;
//           border-radius: 16px 0 0 16px;
//         }
        
//         .menu-item-active .icon-wrapper {
//           background: rgba(64, 224, 208, 0.3);
//           color: #40E0D0;
//         }
        
//         .icon-wrapper {
//           width: 38px;
//           height: 38px;
//           border-radius: 12px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           transition: all 0.3s ease;
//           background: rgba(255, 255, 255, 0.05);
//           color: rgba(255, 255, 255, 0.9);
//           font-size: 18px;
//         }
        
//         .submenu-container {
//           margin-left: 20px;
//           padding-left: 16px;
//           border-left: 1px solid rgba(64, 224, 208, 0.3);
//           position: relative;
//         }
        
//         .submenu-item {
//           display: flex;
//           align-items: center;
//           padding: 10px 16px;
//           margin: 4px 0;
//           color: rgba(255, 255, 255, 0.75);
//           border-radius: 14px;
//           transition: all 0.3s ease;
//           font-size: 13px;
//           position: relative;
//         }
        
//         .submenu-item:hover {
//           background: rgba(64, 224, 208, 0.15);
//           color: white;
//           padding-left: 22px;
//         }
        
//         .submenu-item-active {
//           background: rgba(64, 224, 208, 0.2);
//           color: white;
//           border-left: 3px solid #40E0D0;
//           border-radius: 14px 0 0 14px;
//         }
        
//         .logout-btn-premium {
//           background: rgba(255, 77, 109, 0.08);
//           border: 1px solid rgba(255, 77, 109, 0.2);
//           border-radius: 16px;
//           margin: 12px;
//           padding: 14px 18px;
//           transition: all 0.4s ease;
//         }
        
//         .logout-btn-premium:hover {
//           background: rgba(255, 77, 109, 0.15);
//           border-color: rgba(255, 77, 109, 0.4);
//           transform: translateY(-2px);
//         }
        
//         .badge-premium {
//           background: rgba(64, 224, 208, 0.25);
//           padding: 2px 10px;
//           border-radius: 100px;
//           font-size: 10px;
//           font-weight: 600;
//           letter-spacing: 0.5px;
//           color: #40E0D0;
//           border: 1px solid rgba(64, 224, 208, 0.4);
//         }
//       `}</style>

//       <div style={{
//         width: isMobile ? '300px' : (isTablet ? '280px' : '280px'),
//         position: 'fixed',
//         height: '100vh',
//         left: isOpen ? '0' : (isMobile ? '-300px' : '-280px'),
//         transition: 'left 0.4s cubic-bezier(0.2, 0.9, 0.4, 1)',
//         zIndex: 1100,
//         display: 'flex',
//         flexDirection: 'column',
//       }} className="sidebar-premium">
        
//         {/* Premium Header with Close */}
//         <div className="menu-header-premium d-flex align-items-center justify-content-between p-4">
//           <div className="d-flex align-items-center gap-3">
//             <div style={{
//               width: '44px',
//               height: '44px',
//               background: 'linear-gradient(135deg, #40E0D0, #00CED1)',
//               borderRadius: '16px',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               boxShadow: '0 8px 20px rgba(64, 224, 208, 0.3)'
//             }}>
//               <span className="fw-bold text-white" style={{ fontSize: '22px' }}>P</span>
//             </div>
//             <div>
//               <h5 className="mb-0 fw-bold text-white" style={{ letterSpacing: '0.5px' }}>Pixelmind</h5>
//               <span className="badge-premium">v3.0 · ULTRA</span>
//             </div>
//           </div>
//           {isMobile && (
//             <button
//               onClick={onClose}
//               style={{
//                 background: 'rgba(255,255,255,0.1)',
//                 border: 'none',
//                 width: '40px',
//                 height: '40px',
//                 borderRadius: '14px',
//                 color: 'white',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center'
//               }}
//               className="ultra-transition"
//             >
//               <MdClose size={22} />
//             </button>
//           )}
//         </div>

//         {/* Scrollable Menu Area */}
//         <div className="flex-grow-1 overflow-auto py-3" style={{
//           scrollbarWidth: 'thin',
//           scrollbarColor: 'rgba(64,224,208,0.3) transparent'
//         }}>
//           {menuItems.map((item, index) => (
//             <div key={item.id || item.path} style={{ animation: `slideIn 0.3s ease ${index * 0.05}s backwards` }}>
//               {item.submenu ? (
//                 <>
//                   <div
//                     className="menu-item-ultra d-flex align-items-center justify-content-between"
//                     onClick={() => toggleSubmenu(item.id)}
//                     style={{ cursor: 'pointer' }}
//                   >
//                     <div className="d-flex align-items-center gap-3">
//                       <div className="icon-wrapper">
//                         {item.icon}
//                       </div>
//                       <div className="d-flex flex-column">
//                         <span className="fw-semibold" style={{ fontSize: '14px' }}>{item.label}</span>
//                         <span style={{ fontSize: '11px', opacity: 0.6 }}>{item.description}</span>
//                       </div>
//                     </div>
//                     <span style={{ 
//                       transform: openMenus[item.id] ? 'rotate(180deg)' : 'rotate(0deg)',
//                       transition: 'transform 0.4s',
//                       opacity: 0.7
//                     }}>
//                       {openMenus[item.id] ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
//                     </span>
//                   </div>

//                   {openMenus[item.id] && (
//                     <div className="submenu-container mt-1 mb-2">
//                       {item.submenu.map((subItem, subIndex) => (
//                         <Link
//                           key={subItem.path}
//                           to={subItem.path}
//                           className={`submenu-item text-decoration-none ${location.pathname === subItem.path ? 'submenu-item-active' : ''}`}
//                           onClick={handleLinkClick}
//                           style={{ animation: `slideIn 0.2s ease ${subIndex * 0.03}s backwards` }}
//                         >
//                           <span style={{ marginRight: '14px', fontSize: '16px', opacity: 0.9 }}>
//                             {subItem.icon}
//                           </span>
//                           <div className="d-flex flex-column">
//                             <span style={{ fontSize: '13px', fontWeight: '500' }}>{subItem.label}</span>
//                             <span style={{ fontSize: '10px', opacity: 0.6 }}>{subItem.description}</span>
//                           </div>
//                         </Link>
//                       ))}
//                     </div>
//                   )}
//                 </>
//               ) : (
//                 <Link
//                   to={item.path}
//                   className={`menu-item-ultra text-decoration-none d-flex align-items-center gap-3 ${location.pathname === item.path ? 'menu-item-active' : ''}`}
//                   onClick={handleLinkClick}
//                 >
//                   <div className="icon-wrapper">
//                     {item.icon}
//                   </div>
//                   <div className="d-flex flex-column">
//                     <span className="fw-semibold" style={{ fontSize: '14px' }}>{item.label}</span>
//                     {item.description && (
//                       <span style={{ fontSize: '11px', opacity: 0.6 }}>{item.description}</span>
//                     )}
//                   </div>
//                 </Link>
//               )}
//             </div>
//           ))}

//           {/* Divider */}
//           <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '20px 16px' }} />

//           {/* Bottom Menu Items */}
//           {bottomMenuItems.map((item) => (
//             <Link
//               key={item.path}
//               to={item.path}
//               className="menu-item-ultra text-decoration-none d-flex align-items-center gap-3"
//               onClick={handleLinkClick}
//             >
//               <div className="icon-wrapper">
//                 {item.icon}
//               </div>
//               <div className="d-flex flex-column">
//                 <span className="fw-semibold" style={{ fontSize: '14px' }}>{item.label}</span>
//                 <span style={{ fontSize: '11px', opacity: 0.6 }}>{item.description}</span>
//               </div>
//             </Link>
//           ))}

//           {/* Ultra Premium Logout */}
//           <div
//             className="logout-btn-premium d-flex align-items-center gap-3"
//             onClick={handleLogout}
//             style={{ cursor: 'pointer' }}
//           >
//             <div className="icon-wrapper" style={{ background: 'rgba(255,77,109,0.1)', color: '#ff8a8a' }}>
//               <MdLogout size={20} />
//             </div>
//             <div className="d-flex flex-column">
//               <span className="fw-bold" style={{ color: '#ffb3b3', fontSize: '14px' }}>Logout</span>
//               <span style={{ fontSize: '11px', opacity: 0.6, color: 'rgba(255,179,179,0.7)' }}>End session</span>
//             </div>
//           </div>
//         </div>

//         {/* Premium Footer */}
//         <div className="p-3 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
//           <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
//             SYSTEM · SECURE
//           </span>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Sidebar;



// import React, { useState, useEffect } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import {
//   MdDashboard,
//   MdPeople,
//   MdFolder,
//   MdAssignment,
//   MdLock,
//   MdSchedule,
//   MdLogout,
//   MdExpandMore,
//   MdExpandLess,
//   MdAddCircleOutline,
//   MdListAlt,
//   MdClose,
//   MdDownload,
//   MdInsights,
//   MdSettings,
//   MdTimelapse,
//   MdAccessTime,
//   MdTimer,
//   MdTrendingUp
// } from 'react-icons/md';

// const Sidebar = ({ isOpen, onLogout, isMobile, isTablet, onClose }) => {
//   const location = useLocation();
//   const [openMenus, setOpenMenus] = useState({});
//   const [hoveredItem, setHoveredItem] = useState(null);

//   // Restore open menus based on current path
//   useEffect(() => {
//     const paths = [
//       'staff', 'projects', 'assigned-works', 'work-session', 'invoice', 'payslip'
//     ];
//     paths.forEach(path => {
//       if (location.pathname.includes(path) && !openMenus[path]) {
//         setOpenMenus(prev => ({ ...prev, [path]: true }));
//       }
//     });
//   }, [location.pathname]);

//   const toggleSubmenu = (path) => {
//     setOpenMenus((prev) => ({
//       ...prev,
//       [path]: !prev[path],
//     }));
//   };

//   const handleLogout = () => {
//     sessionStorage.removeItem('adminDetails');
//     if (onLogout) onLogout();
//   };

//   const handleLinkClick = () => {
//     if (isMobile) {
//       onClose();
//     }
//   };

//   const menuItems = [
//     { 
//       path: '/dashboard', 
//       label: 'Dashboard', 
//       icon: <MdDashboard />,
//       description: 'Overview & analytics'
//     },
//     {
//       id: 'staff',
//       label: 'Staff Management',
//       icon: <MdPeople />,
//       description: 'Manage team members',
//       submenu: [
//         { path: '/add-staff', label: 'Add Staff', icon: <MdAddCircleOutline />, description: 'Create new profile' },
//         { path: '/staff', label: 'Staff Directory', icon: <MdListAlt />, description: 'View all members' },
//       ],
//     },
//     {
//       id: 'projects',
//       label: 'Projects',
//       icon: <MdFolder />,
//       description: 'Track progress',
//       submenu: [
//         { path: '/add-project', label: 'New Project', icon: <MdAddCircleOutline />, description: 'Create project' },
//         { path: '/projects', label: 'Project List', icon: <MdListAlt />, description: 'All projects' },
//       ],
//     },
//     {
//       id: 'assigned-works',
//       label: 'Work Allocation',
//       icon: <MdAssignment />,
//       description: 'Tasks & assignments',
//       submenu: [
//         { path: '/add-worksheet', label: 'New Worksheet', icon: <MdAddCircleOutline />, description: 'Assign work' },
//         { path: '/assigned-works', label: 'All Worksheets', icon: <MdListAlt />, description: 'View assignments' },
//       ],
//     },
//     {
//       id: 'attendance',
//       label: 'Attendance',
//       icon: <MdSchedule />,
//       description: 'Time tracking',
//       submenu: [
//         { path: '/add-attendance', label: 'Mark Attendance', icon: <MdAddCircleOutline />, description: 'Daily entry' },
//         { path: '/attendance', label: 'Attendance Log', icon: <MdListAlt />, description: 'History' },
//       ],
//     },
//     {
//       id: 'work-session',
//       label: 'Work Session',
//       icon: <MdTimelapse />,
//       description: 'Time tracking & activity',
//       submenu: [
//         { path: '/work-session-live', label: 'Live Tracking', icon: <MdAccessTime />, description: 'Real-time status' },
//         { path: '/work-session-history', label: 'Session History', icon: <MdTimer />, description: 'View records' },
//         { path: '/work-session-reports', label: 'Work Reports', icon: <MdTrendingUp />, description: 'Analytics' },
//       ],
//     },
//     {
//       id: 'invoice',
//       label: 'Invoicing',
//       icon: <MdFolder />,
//       description: 'Billing & payments',
//       submenu: [
//         { path: '/create-invoice', label: 'Create Invoice', icon: <MdAddCircleOutline />, description: 'New invoice' },
//         { path: '/invoices', label: 'Invoice List', icon: <MdListAlt />, description: 'All invoices' },
//         { path: '/invoices1', label: 'Advanced Invoice', icon: <MdDownload />, description: 'Pro format' },
//       ],
//     },
//     {
//       id: 'payslip',
//       label: 'Payroll',
//       icon: <MdAssignment />,
//       description: 'Salary processing',
//       submenu: [
//         { path: '/create-payslip', label: 'Generate Payslip', icon: <MdAddCircleOutline />, description: 'Monthly payroll' },
//         { path: '/payslips', label: 'Payslip History', icon: <MdListAlt />, description: 'View all' },
//       ],
//     },
//   ];

//   const bottomMenuItems = [
//     { path: '/analytics', label: 'Analytics', icon: <MdInsights />, description: 'Reports & insights' },
//     { path: '/settings', label: 'Settings', icon: <MdSettings />, description: 'Preferences' },
//     { path: '/change-password', label: 'Security', icon: <MdLock />, description: 'Change password' },
//   ];

//   return (
//     <>
//       <style>{`
//         @keyframes slideIn {
//           from { transform: translateX(-100%); opacity: 0; }
//           to { transform: translateX(0); opacity: 1; }
//         }
        
//         @keyframes glowPulse {
//           0%, 100% { box-shadow: 0 0 0 0 rgba(64, 224, 208, 0.4); }
//           50% { box-shadow: 0 0 0 8px rgba(64, 224, 208, 0); }
//         }
        
//         .sidebar-premium {
//           background: linear-gradient(165deg, #0b2f2f 0%, #063737 30%, #004d4d 100%);
//           box-shadow: 20px 0 40px rgba(0, 77, 77, 0.25);
//           border-right: 1px solid rgba(255, 255, 255, 0.08);
//           animation: slideIn 0.5s cubic-bezier(0.2, 0.9, 0.4, 1);
//         }
        
//         .menu-header-premium {
//           background: rgba(255, 255, 255, 0.03);
//           border-bottom: 1px solid rgba(64, 224, 208, 0.2);
//           backdrop-filter: blur(10px);
//         }
        
//         .menu-item-ultra {
//           transition: all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1);
//           border-radius: 16px;
//           margin: 6px 12px;
//           padding: 12px 16px;
//           color: rgba(255, 255, 255, 0.85);
//           position: relative;
//           overflow: hidden;
//         }
        
//         .menu-item-ultra::before {
//           content: '';
//           position: absolute;
//           left: 0;
//           top: 0;
//           width: 4px;
//           height: 100%;
//           background: linear-gradient(180deg, #40E0D0, #00CED1);
//           transform: scaleY(0);
//           transition: transform 0.3s ease;
//           transform-origin: top;
//           border-radius: 0 4px 4px 0;
//         }
        
//         .menu-item-ultra:hover::before {
//           transform: scaleY(1);
//         }
        
//         .menu-item-ultra:hover {
//           background: rgba(255, 255, 255, 0.06);
//           color: white;
//           padding-left: 20px;
//         }
        
//         .menu-item-active {
//           background: linear-gradient(90deg, rgba(64, 224, 208, 0.2), rgba(64, 224, 208, 0.05));
//           color: white !important;
//           border-left: 4px solid #40E0D0;
//           border-radius: 16px 0 0 16px;
//         }
        
//         .menu-item-active .icon-wrapper {
//           background: rgba(64, 224, 208, 0.3);
//           color: #40E0D0;
//         }
        
//         .icon-wrapper {
//           width: 38px;
//           height: 38px;
//           border-radius: 12px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           transition: all 0.3s ease;
//           background: rgba(255, 255, 255, 0.05);
//           color: rgba(255, 255, 255, 0.9);
//           font-size: 18px;
//         }
        
//         .submenu-container {
//           margin-left: 20px;
//           padding-left: 16px;
//           border-left: 1px solid rgba(64, 224, 208, 0.3);
//           position: relative;
//         }
        
//         .submenu-item {
//           display: flex;
//           align-items: center;
//           padding: 10px 16px;
//           margin: 4px 0;
//           color: rgba(255, 255, 255, 0.75);
//           border-radius: 14px;
//           transition: all 0.3s ease;
//           font-size: 13px;
//           position: relative;
//         }
        
//         .submenu-item:hover {
//           background: rgba(64, 224, 208, 0.15);
//           color: white;
//           padding-left: 22px;
//         }
        
//         .submenu-item-active {
//           background: rgba(64, 224, 208, 0.2);
//           color: white;
//           border-left: 3px solid #40E0D0;
//           border-radius: 14px 0 0 14px;
//         }
        
//         .logout-btn-premium {
//           background: rgba(255, 77, 109, 0.08);
//           border: 1px solid rgba(255, 77, 109, 0.2);
//           border-radius: 16px;
//           margin: 12px;
//           padding: 14px 18px;
//           transition: all 0.4s ease;
//         }
        
//         .logout-btn-premium:hover {
//           background: rgba(255, 77, 109, 0.15);
//           border-color: rgba(255, 77, 109, 0.4);
//           transform: translateY(-2px);
//         }
        
//         .badge-premium {
//           background: rgba(64, 224, 208, 0.25);
//           padding: 2px 10px;
//           border-radius: 100px;
//           font-size: 10px;
//           font-weight: 600;
//           letter-spacing: 0.5px;
//           color: #40E0D0;
//           border: 1px solid rgba(64, 224, 208, 0.4);
//         }
//       `}</style>

//       <div style={{
//         width: isMobile ? '300px' : (isTablet ? '280px' : '280px'),
//         position: 'fixed',
//         height: '100vh',
//         left: isOpen ? '0' : (isMobile ? '-300px' : '-280px'),
//         transition: 'left 0.4s cubic-bezier(0.2, 0.9, 0.4, 1)',
//         zIndex: 1100,
//         display: 'flex',
//         flexDirection: 'column',
//       }} className="sidebar-premium">
        
//         {/* Premium Header with Close */}
//         <div className="menu-header-premium d-flex align-items-center justify-content-between p-4">
//           <div className="d-flex align-items-center gap-3">
//             <div style={{
//               width: '44px',
//               height: '44px',
//               background: 'linear-gradient(135deg, #40E0D0, #00CED1)',
//               borderRadius: '16px',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               boxShadow: '0 8px 20px rgba(64, 224, 208, 0.3)'
//             }}>
//               <span className="fw-bold text-white" style={{ fontSize: '22px' }}>P</span>
//             </div>
//             <div>
//               <h5 className="mb-0 fw-bold text-white" style={{ letterSpacing: '0.5px' }}>Pixelmind</h5>
//               <span className="badge-premium">v3.0 · ULTRA</span>
//             </div>
//           </div>
//           {isMobile && (
//             <button
//               onClick={onClose}
//               style={{
//                 background: 'rgba(255,255,255,0.1)',
//                 border: 'none',
//                 width: '40px',
//                 height: '40px',
//                 borderRadius: '14px',
//                 color: 'white',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center'
//               }}
//               className="ultra-transition"
//             >
//               <MdClose size={22} />
//             </button>
//           )}
//         </div>

//         {/* Scrollable Menu Area */}
//         <div className="flex-grow-1 overflow-auto py-3" style={{
//           scrollbarWidth: 'thin',
//           scrollbarColor: 'rgba(64,224,208,0.3) transparent'
//         }}>
//           {menuItems.map((item, index) => (
//             <div key={item.id || item.path} style={{ animation: `slideIn 0.3s ease ${index * 0.05}s backwards` }}>
//               {item.submenu ? (
//                 <>
//                   <div
//                     className="menu-item-ultra d-flex align-items-center justify-content-between"
//                     onClick={() => toggleSubmenu(item.id)}
//                     style={{ cursor: 'pointer' }}
//                   >
//                     <div className="d-flex align-items-center gap-3">
//                       <div className="icon-wrapper">
//                         {item.icon}
//                       </div>
//                       <div className="d-flex flex-column">
//                         <span className="fw-semibold" style={{ fontSize: '14px' }}>{item.label}</span>
//                         <span style={{ fontSize: '11px', opacity: 0.6 }}>{item.description}</span>
//                       </div>
//                     </div>
//                     <span style={{ 
//                       transform: openMenus[item.id] ? 'rotate(180deg)' : 'rotate(0deg)',
//                       transition: 'transform 0.4s',
//                       opacity: 0.7
//                     }}>
//                       {openMenus[item.id] ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
//                     </span>
//                   </div>

//                   {openMenus[item.id] && (
//                     <div className="submenu-container mt-1 mb-2">
//                       {item.submenu.map((subItem, subIndex) => (
//                         <Link
//                           key={subItem.path}
//                           to={subItem.path}
//                           className={`submenu-item text-decoration-none ${location.pathname === subItem.path ? 'submenu-item-active' : ''}`}
//                           onClick={handleLinkClick}
//                           style={{ animation: `slideIn 0.2s ease ${subIndex * 0.03}s backwards` }}
//                         >
//                           <span style={{ marginRight: '14px', fontSize: '16px', opacity: 0.9 }}>
//                             {subItem.icon}
//                           </span>
//                           <div className="d-flex flex-column">
//                             <span style={{ fontSize: '13px', fontWeight: '500' }}>{subItem.label}</span>
//                             <span style={{ fontSize: '10px', opacity: 0.6 }}>{subItem.description}</span>
//                           </div>
//                         </Link>
//                       ))}
//                     </div>
//                   )}
//                 </>
//               ) : (
//                 <Link
//                   to={item.path}
//                   className={`menu-item-ultra text-decoration-none d-flex align-items-center gap-3 ${location.pathname === item.path ? 'menu-item-active' : ''}`}
//                   onClick={handleLinkClick}
//                 >
//                   <div className="icon-wrapper">
//                     {item.icon}
//                   </div>
//                   <div className="d-flex flex-column">
//                     <span className="fw-semibold" style={{ fontSize: '14px' }}>{item.label}</span>
//                     {item.description && (
//                       <span style={{ fontSize: '11px', opacity: 0.6 }}>{item.description}</span>
//                     )}
//                   </div>
//                 </Link>
//               )}
//             </div>
//           ))}

//           {/* Divider */}
//           <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '20px 16px' }} />

//           {/* Bottom Menu Items */}
//           {bottomMenuItems.map((item) => (
//             <Link
//               key={item.path}
//               to={item.path}
//               className="menu-item-ultra text-decoration-none d-flex align-items-center gap-3"
//               onClick={handleLinkClick}
//             >
//               <div className="icon-wrapper">
//                 {item.icon}
//               </div>
//               <div className="d-flex flex-column">
//                 <span className="fw-semibold" style={{ fontSize: '14px' }}>{item.label}</span>
//                 <span style={{ fontSize: '11px', opacity: 0.6 }}>{item.description}</span>
//               </div>
//             </Link>
//           ))}

//           {/* Ultra Premium Logout */}
//           <div
//             className="logout-btn-premium d-flex align-items-center gap-3"
//             onClick={handleLogout}
//             style={{ cursor: 'pointer' }}
//           >
//             <div className="icon-wrapper" style={{ background: 'rgba(255,77,109,0.1)', color: '#ff8a8a' }}>
//               <MdLogout size={20} />
//             </div>
//             <div className="d-flex flex-column">
//               <span className="fw-bold" style={{ color: '#ffb3b3', fontSize: '14px' }}>Logout</span>
//               <span style={{ fontSize: '11px', opacity: 0.6, color: 'rgba(255,179,179,0.7)' }}>End session</span>
//             </div>
//           </div>
//         </div>

//         {/* Premium Footer */}
//         <div className="p-3 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
//           <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
//             SYSTEM · SECURE
//           </span>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Sidebar;


import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MdDashboard,
  MdPeople,
  MdFolder,
  MdAssignment,
  MdLock,
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
  MdTrendingUp
} from 'react-icons/md';

const Sidebar = ({ isOpen, onLogout, isMobile, isTablet, onClose }) => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});

  // Restore open menus based on current path
  useEffect(() => {
    const paths = [
      'staff', 'projects', 'assigned-works', 'work-session', 'invoice', 'payslip'
    ];
    paths.forEach(path => {
      if (location.pathname.includes(path) && !openMenus[path]) {
        setOpenMenus(prev => ({ ...prev, [path]: true }));
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
    sessionStorage.removeItem('adminDetails');
    if (onLogout) onLogout();
  };

  const handleLinkClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  const menuItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: <MdDashboard />,
      description: 'Overview & analytics'
    },
    {
      id: 'staff',
      label: 'Staff Management',
      icon: <MdPeople />,
      description: 'Manage team members',
      submenu: [
        { path: '/add-staff', label: 'Add Staff', icon: <MdAddCircleOutline />, description: 'Create new profile' },
        { path: '/staff', label: 'Staff Directory', icon: <MdListAlt />, description: 'View all members' },
      ],
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: <MdFolder />,
      description: 'Leads',
      submenu: [
        { path: '/add-client', label: 'New Lead', icon: <MdAddCircleOutline />, description: 'Create Lead' },
        { path: '/allclients', label: 'Lead List', icon: <MdListAlt />, description: 'All Leads' },
      ],
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: <MdFolder />,
      description: 'Track progress',
      submenu: [
        { path: '/add-project', label: 'New Project', icon: <MdAddCircleOutline />, description: 'Create project' },
        { path: '/projects', label: 'Project List', icon: <MdListAlt />, description: 'All projects' },
      ],
    },
    {
      id: 'installments',
      label: 'Installments',
      icon: <MdFolder />,
      description: 'Leads',
      submenu: [
        { path: '/add-installment', label: 'Installments', icon: <MdAddCircleOutline />, description: 'Create Lead' },
        // { path: '/allRemainders', label: 'Remainder', icon: <MdListAlt />, description: 'All Remainders' },
      ],
    },
    {
      id: 'assigned-works',
      label: 'Work Allocation',
      icon: <MdAssignment />,
      description: 'Tasks & assignments',
      submenu: [
        { path: '/add-worksheet', label: 'New Worksheet', icon: <MdAddCircleOutline />, description: 'Assign work' },
        { path: '/assigned-works', label: 'All Worksheets', icon: <MdListAlt />, description: 'View assignments' },
      ],
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: <MdSchedule />,
      description: 'Time tracking',
      submenu: [
        { path: '/add-attendance', label: 'Mark Attendance', icon: <MdAddCircleOutline />, description: 'Daily entry' },
        { path: '/attendance', label: 'Attendance Log', icon: <MdListAlt />, description: 'History' },
      ],
    },
    {
      id: 'work-session',
      label: 'Work Session',
      icon: <MdTimelapse />,
      description: 'Time tracking & activity',
      submenu: [
        { path: '/work-session-live', label: 'Live Tracking', icon: <MdAccessTime />, description: 'Real-time status' },
        { path: '/work-session-history', label: 'Session History', icon: <MdTimer />, description: 'View records' },
        { path: '/work-session-reports', label: 'Work Reports', icon: <MdTrendingUp />, description: 'Analytics' },
      ],
    },
    {
      id: 'invoice',
      label: 'Invoicing',
      icon: <MdFolder />,
      description: 'Billing & payments',
      submenu: [
        { path: '/create-invoice', label: 'Create Invoice', icon: <MdAddCircleOutline />, description: 'New invoice' },
        { path: '/invoices', label: 'Invoice List', icon: <MdListAlt />, description: 'All invoices' },
        { path: '/invoices1', label: 'Advanced Invoice', icon: <MdDownload />, description: 'Pro format' },
      ],
    },
    {
      id: 'payslip',
      label: 'Payroll',
      icon: <MdAssignment />,
      description: 'Salary processing',
      submenu: [
        { path: '/create-payslip', label: 'Generate Payslip', icon: <MdAddCircleOutline />, description: 'Monthly payroll' },
        { path: '/payslips', label: 'Payslip History', icon: <MdListAlt />, description: 'View all' },
      ],
    },
  ];

  const bottomMenuItems = [
    { path: '/analytics', label: 'Analytics', icon: <MdInsights />, description: 'Reports & insights' },
    { path: '/settings', label: 'Settings', icon: <MdSettings />, description: 'Preferences' },
    { path: '/change-password', label: 'Security', icon: <MdLock />, description: 'Change password' },
  ];

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
        className={`fixed h-screen flex flex-col transition-all duration-400 ease-[cubic-bezier(0.2,0.9,0.4,1)] z-[1100] bg-gradient-to-br from-teal-900 via-teal-800 to-teal-900 shadow-[20px_0_40px_rgba(0,77,77,0.25)] border-r border-white/10 animate-[slideInSidebar_0.5s_cubic-bezier(0.2,0.9,0.4,1)] ${
          isMobile ? 'w-[280px] sm:w-[300px]' : 'w-[260px] sm:w-[270px] md:w-[280px]'
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
          {menuItems.map((item, index) => (
            <div key={item.id || item.path} style={{ animation: `slideInSidebar 0.3s ease ${index * 0.05}s backwards` }}>
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
                          className={`flex items-center px-3 sm:px-4 py-2 sm:py-2.5 my-0.5 sm:my-1 text-white/75 rounded-xl transition-all duration-300 text-[11px] sm:text-[13px] relative hover:bg-teal-400/15 hover:text-white hover:pl-4 sm:hover:pl-[22px] ${
                            location.pathname === subItem.path 
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
                  className={`group flex items-center gap-2 sm:gap-3 no-underline rounded-xl sm:rounded-2xl mx-2 sm:mx-3 my-1 px-3 sm:px-4 py-2.5 sm:py-3 text-white/85 transition-all duration-400 ease-[cubic-bezier(0.2,0.9,0.4,1)] hover:bg-white/6 hover:text-white hover:pl-4 sm:hover:pl-5 relative overflow-hidden before:absolute before:left-0 before:top-0 before:w-0.5 sm:before:w-1 before:h-full before:bg-gradient-to-b before:from-teal-400 before:to-cyan-400 before:scale-y-0 before:transition-transform before:duration-300 hover:before:scale-y-100 ${
                    location.pathname === item.path 
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
          ))}

          {/* Divider */}
          <div className="h-px bg-white/10 my-3 sm:my-5 mx-3 sm:mx-4" />

          {/* Bottom Menu Items */}
          {bottomMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="group flex items-center gap-2 sm:gap-3 no-underline rounded-xl sm:rounded-2xl mx-2 sm:mx-3 my-1 px-3 sm:px-4 py-2.5 sm:py-3 text-white/85 transition-all duration-400 ease-[cubic-bezier(0.2,0.9,0.4,1)] hover:bg-white/6 hover:text-white hover:pl-4 sm:hover:pl-5 relative overflow-hidden before:absolute before:left-0 before:top-0 before:w-0.5 sm:before:w-1 before:h-full before:bg-gradient-to-b before:from-teal-400 before:to-cyan-400 before:scale-y-0 before:transition-transform before:duration-300 hover:before:scale-y-100"
              onClick={handleLinkClick}
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-[38px] md:h-[38px] rounded-xl flex items-center justify-center transition-all duration-300 bg-white/5 text-white/90 group-hover:bg-teal-400/30 group-hover:text-teal-300 text-base sm:text-lg shrink-0">
                {item.icon}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs sm:text-sm truncate">{item.label}</span>
                <span className="text-[9px] sm:text-xs opacity-60 truncate">{item.description}</span>
              </div>
            </Link>
          ))}

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