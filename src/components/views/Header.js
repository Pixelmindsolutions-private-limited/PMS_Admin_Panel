// import React, { useState, useEffect, useRef } from 'react';
// import { MdMenu, MdAccountCircle, MdLogout, MdClose, MdNotificationsNone, MdSearch } from 'react-icons/md';

// const Header = ({ onToggleSidebar, onLogout, isMobile, isTablet, sidebarOpen }) => {
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [isScrolled, setIsScrolled] = useState(false);
//   const dropdownRef = useRef(null);

//   // Detect scroll for glass effect
//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 20);
//     };
//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   const handleLogout = () => {
//     sessionStorage.removeItem('adminDetails');
//     if (onLogout) onLogout();
//   };

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setShowDropdown(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   return (
//     <>
//       <style>{`
//         @keyframes slideDown {
//           from { opacity: 0; transform: translateY(-20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
        
//         .header-glass {
//           background: ${isScrolled ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.95)'};
//           backdrop-filter: blur(20px);
//           -webkit-backdrop-filter: blur(20px);
//           border-bottom: 1px solid ${isScrolled ? 'rgba(64, 224, 208, 0.2)' : 'rgba(255, 255, 255, 0.3)'};
//           box-shadow: ${isScrolled ? '0 8px 32px rgba(0, 139, 139, 0.08)' : '0 2px 12px rgba(0, 0, 0, 0.02)'};
//           transition: all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1);
//         }
        
//         .menu-button {
//           background: rgba(0, 151, 136, 0.08);
//           border: 1px solid rgba(0, 151, 136, 0.2);
//           border-radius: 14px;
//           width: 44px;
//           height: 44px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           color: #009788;
//           transition: all 0.3s ease;
//           box-shadow: 0 4px 12px rgba(0, 151, 136, 0.12);
//         }
        
//         .menu-button:hover {
//           background: rgba(0, 151, 136, 0.12);
//           border-color: rgba(0, 151, 136, 0.4);
//           transform: scale(1.05);
//           box-shadow: 0 8px 20px rgba(0, 151, 136, 0.2);
//         }
        
//         .profile-badge {
//           background: linear-gradient(145deg, #009788, #007a6e);
//           border-radius: 18px;
//           padding: 6px 6px 6px 16px;
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           box-shadow: 0 8px 20px rgba(0, 151, 136, 0.25);
//           transition: all 0.3s ease;
//           cursor: pointer;
//           border: 1px solid rgba(255, 255, 255, 0.3);
//         }
        
//         .profile-badge:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 12px 28px rgba(0, 151, 136, 0.35);
//         }
        
//         .dropdown-menu-premium {
//           background: rgba(255, 255, 255, 0.9);
//           backdrop-filter: blur(20px);
//           -webkit-backdrop-filter: blur(20px);
//           border: 1px solid rgba(255, 255, 255, 0.5);
//           border-radius: 20px;
//           box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
//           animation: slideDown 0.3s cubic-bezier(0.2, 0.9, 0.4, 1);
//           overflow: hidden;
//           padding: 8px;
//           min-width: 220px;
//         }
        
//         .dropdown-item {
//           padding: 12px 16px;
//           border-radius: 14px;
//           transition: all 0.2s ease;
//           color: #1a2e35;
//           font-weight: 500;
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           border: none;
//           background: transparent;
//           width: 100%;
//         }
        
//         .dropdown-item:hover {
//           background: rgba(0, 151, 136, 0.08);
//           color: #009788;
//         }
        
//         .notification-badge {
//           position: relative;
//           margin-right: 8px;
//         }
        
//         .notification-dot {
//           position: absolute;
//           top: -2px;
//           right: -2px;
//           width: 10px;
//           height: 10px;
//           background: #ff4d6d;
//           border-radius: 50%;
//           border: 2px solid white;
//         }
//       `}</style>

//       <header className="header-glass sticky-top px-3 px-md-4 px-lg-5 py-2 py-md-3 d-flex justify-content-between align-items-center ultra-transition">
//         <div className="d-flex align-items-center gap-2 gap-md-3">
//           {/* Premium Menu Toggle Button */}
//           <button
//             className="menu-button ultra-transition"
//             onClick={onToggleSidebar}
//             aria-label="Toggle menu"
//           >
//             {sidebarOpen && !isMobile ? <MdClose size={22} /> : <MdMenu size={22} />}
//           </button>
          
//           {/* Dynamic Branding */}
//           <div className="d-flex flex-column">
//             <h2 className="mb-0 fw-bold" style={{ 
//               background: 'linear-gradient(135deg, #009788 0%, #00635a 100%)',
//               WebkitBackgroundClip: 'text',
//               WebkitTextFillColor: 'transparent',
//               backgroundClip: 'text',
//               fontSize: isMobile ? '18px' : '24px',
//               letterSpacing: '-0.5px'
//             }}>
//               {isMobile ? 'Dashboard' : 'PixelmindSolutions'}
//             </h2>
//             <span className="d-none d-md-block text-muted" style={{ fontSize: '11px', letterSpacing: '1px', marginTop: '-4px' }}>
//               ADMIN PORTAL
//             </span>
//           </div>
//         </div>

//         <div className="d-flex align-items-center gap-2 gap-md-3">
//           {/* Search - hidden on mobile */}
//           <div className="d-none d-md-flex align-items-center position-relative">
//             <MdSearch className="position-absolute" style={{ left: '16px', color: '#009788', opacity: 0.6 }} size={18} />
//             <input 
//               type="text" 
//               placeholder="Quick search..." 
//               style={{
//                 background: 'rgba(0, 151, 136, 0.04)',
//                 border: '1px solid rgba(0, 151, 136, 0.1)',
//                 borderRadius: '40px',
//                 padding: '10px 16px 10px 48px',
//                 fontSize: '14px',
//                 width: '200px',
//                 transition: 'all 0.3s',
//                 outline: 'none'
//               }}
//               className="ultra-transition"
//               onFocus={(e) => e.target.style.background = 'white'}
//               onBlur={(e) => e.target.style.background = 'rgba(0, 151, 136, 0.04)'}
//             />
//           </div>
          
//           {/* Notifications */}
//           <div className="notification-badge">
//             <div style={{
//               width: '40px',
//               height: '40px',
//               borderRadius: '12px',
//               background: 'rgba(255, 255, 255, 0.8)',
//               border: '1px solid rgba(0, 151, 136, 0.15)',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               color: '#009788',
//               cursor: 'pointer',
//               transition: 'all 0.3s'
//             }}
//             className="ultra-transition"
//             onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 151, 136, 0.08)'}
//             onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'}
//             >
//               <MdNotificationsNone size={20} />
//               <span className="notification-dot"></span>
//             </div>
//           </div>

//           {/* Premium Profile Badge */}
//           <div ref={dropdownRef} className="position-relative">
//             <div 
//               className="profile-badge"
//               onClick={() => setShowDropdown(!showDropdown)}
//             >
//               <span className="d-none d-md-block text-white fw-semibold" style={{ fontSize: '14px' }}>
//                 Alexander
//               </span>
//               <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
//                 style={{ 
//                   width: '36px', 
//                   height: '36px', 
//                   background: 'linear-gradient(145deg, #ffe6e6, #ffd6d6)',
//                   color: '#009788',
//                   border: '2px solid white',
//                   boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
//                   fontSize: '16px'
//                 }}
//               >
//                 A
//               </div>
//             </div>

//             {/* Premium Dropdown */}
//             {showDropdown && (
//               <div 
//                 className="dropdown-menu-premium position-absolute"
//                 style={{
//                   top: 'calc(100% + 12px)',
//                   right: '0',
//                   zIndex: 1100,
//                 }}
//               >
//                 <div className="px-3 py-2 border-bottom" style={{ borderColor: 'rgba(0,0,0,0.05) !important' }}>
//                   <div className="fw-bold" style={{ color: '#009788' }}>Alexander Pierce</div>
//                   <small className="text-muted">admin@pixelmind.com</small>
//                 </div>
                
//                 <button
//                   className="dropdown-item"
//                   onClick={handleLogout}
//                   style={{ marginTop: '4px' }}
//                 >
//                   <MdLogout size={18} color="#ff6b6b" />
//                   <span style={{ color: '#ff6b6b', fontWeight: '600' }}>Secure Logout</span>
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </header>
//     </>
//   );
// };

// export default Header;

import React, { useState, useEffect, useRef } from 'react';
import { MdMenu, MdAccountCircle, MdLogout, MdClose, MdNotificationsNone, MdSearch } from 'react-icons/md';
import { useNavigate } from 'react-router';

const Header = ({ onToggleSidebar, onLogout, isMobile, isTablet, sidebarOpen }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef(null);

  const navigate = useNavigate(); 
  // Detect scroll for glass effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('adminDetails');
    if (onLogout) onLogout();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideDownHeader {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `
      }} />

      <header className={`sticky top-0 px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-2 sm:py-2.5 md:py-3 flex justify-between items-center transition-all duration-400 ease-[cubic-bezier(0.2,0.9,0.4,1)] z-40 ${
        isScrolled 
          ? 'bg-white/85 backdrop-blur-xl border-b border-teal-400/20 shadow-md shadow-teal-900/10' 
          : 'bg-white/95 backdrop-blur-xl border-b border-white/30 shadow-sm'
      }`}>
        <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 min-w-0">
          {/* Premium Menu Toggle Button */}
          <button
            className="bg-teal-700/10 border border-teal-700/20 rounded-xl w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 flex items-center justify-center text-teal-700 transition-all duration-300 hover:bg-teal-700/20 hover:border-teal-700/40 hover:scale-105 shadow-md shadow-teal-700/20 shrink-0"
            onClick={onToggleSidebar}
            aria-label="Toggle menu"
          >
            {sidebarOpen && !isMobile ? <MdClose size={18} className="xs:text-[20px] sm:text-[22px]" /> : <MdMenu size={18} className="xs:text-[20px] sm:text-[22px]" />}
          </button>
          
          {/* Dynamic Branding */}
          <div className="flex flex-col min-w-0">
            <h2 onClick={()=>navigate('/dashboard')} className={`mb-0 font-bold bg-gradient-to-r from-teal-700 to-teal-800 bg-clip-text text-transparent tracking-tight truncate ${
              isMobile ? 'text-base xs:text-lg' : 'text-xl sm:text-2xl'
            }`}>
              {isMobile ? 'Dashboard' : 'PixelmindSolutions'}
            </h2>
            <span className="hidden md:block text-gray-500 text-[10px] sm:text-[11px] tracking-wider -mt-0.5">
              ADMIN PORTAL
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3">
          {/* Search - hidden on mobile */}
          {/* <div className="hidden sm:flex items-center relative">
            <MdSearch className="absolute left-3 sm:left-4 text-teal-700/60" size={16} />
            <input 
              type="text" 
              placeholder="Quick search..." 
              className="bg-teal-700/5 border border-teal-700/10 rounded-full py-2 px-3 sm:px-4 pl-8 sm:pl-12 text-xs sm:text-sm w-32 sm:w-40 md:w-52 transition-all duration-300 outline-none focus:bg-white placeholder:text-gray-400"
            />
          </div> */}
          
          {/* Notifications */}
          <div className="relative mr-1 sm:mr-2">
            <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 border border-teal-700/15 flex items-center justify-center text-teal-700 cursor-pointer transition-all duration-300 hover:bg-teal-700/10">
              <MdNotificationsNone size={16} className="xs:text-[18px] sm:text-[20px]" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
          </div>

          {/* Premium Profile Badge */}
          <div ref={dropdownRef} className="relative">
            <div 
              className="bg-gradient-to-br from-teal-700 to-teal-800 rounded-xl sm:rounded-2xl py-1 px-1.5 sm:px-2 pl-2 sm:pl-3 md:pl-4 flex items-center gap-2 sm:gap-3 shadow-lg shadow-teal-700/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-700/35 cursor-pointer border border-white/30"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <span className="hidden sm:block text-white font-semibold text-xs sm:text-sm truncate max-w-[60px] md:max-w-[100px]">
                Alexander
              </span>
              <div className="rounded-full flex items-center justify-center text-teal-700 font-bold w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-rose-50 to-red-50 border-2 border-white shadow-md text-xs sm:text-base">
                A
              </div>
            </div>

            {/* Premium Dropdown */}
            {showDropdown && (
              <div 
                className="absolute top-[calc(100%+8px)] sm:top-[calc(100%+12px)] right-0 z-[1100] bg-white/90 backdrop-blur-xl border border-white/50 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden p-1.5 sm:p-2 min-w-[180px] sm:min-w-[220px] animate-[slideDownHeader_0.3s_cubic-bezier(0.2,0.9,0.4,1)]"
              >
                <div className="px-2 sm:px-3 py-2 border-b border-gray-100">
                  <div className="font-bold text-teal-700 text-xs sm:text-sm truncate">Alexander Pierce</div>
                  <small className="text-gray-500 text-[10px] sm:text-xs truncate block">admin@pixelmind.com</small>
                </div>
                
                <button
                  className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 text-gray-700 font-medium hover:bg-teal-700/10 hover:text-teal-700 mt-1 text-xs sm:text-sm"
                  onClick={handleLogout}
                >
                  <MdLogout size={16} className="sm:text-[18px] text-red-400" />
                  <span className="text-red-500 font-semibold">Secure Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;