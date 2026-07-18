

import React, { useState, useEffect, useRef } from 'react';
import { MdMenu, MdAccountCircle, MdLogout, MdClose, MdNotificationsNone, MdSearch } from 'react-icons/md';
import { useNavigate } from 'react-router';

const Header = ({ onToggleSidebar, onLogout, isMobile, isTablet, sidebarOpen }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef(null);

  const staffDetails = JSON.parse(sessionStorage.getItem("loginDetails"));

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

      <header className={`sticky top-0 px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-2 sm:py-2.5 md:py-3 flex justify-between items-center transition-all duration-400 ease-[cubic-bezier(0.2,0.9,0.4,1)] z-40 ${isScrolled
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
            <h2 onClick={() => navigate('/dashboard')} className={`mb-0 font-bold bg-gradient-to-r from-teal-700 to-teal-800 bg-clip-text text-transparent tracking-tight truncate ${isMobile ? 'text-base xs:text-lg' : 'text-xl sm:text-2xl'
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
                {staffDetails.name || "Admin"}
              </span>
              <div className="rounded-full flex items-center justify-center w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-rose-50 to-red-50 border-2 border-white shadow-md overflow-hidden">
                {staffDetails?.profileImage ? (
                  <img
                    src={staffDetails.profileImage}
                    alt={staffDetails?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-teal-700 font-bold text-xs sm:text-base uppercase">
                    {staffDetails?.name?.charAt(0) || "A"}
                  </span>
                )}
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