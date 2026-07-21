import React, { useState, useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const DashboardLayout = ({ isLoggedIn, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;

      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);

      if (width < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleContentClick = () => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onLogout={onLogout}
          isMobile={isMobile}
          isTablet={isTablet}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Overlay */}
        {(isMobile || isTablet) && sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div
          className={`flex flex-col flex-1 min-h-screen transition-[margin] duration-300 ${!isMobile && sidebarOpen ? "lg:ml-[280px] md:ml-[280px]" : "ml-0"
            }`}
          onClick={handleContentClick}
        >
          <Header
            onToggleSidebar={toggleSidebar}
            onLogout={onLogout}
            isMobile={isMobile}
            isTablet={isTablet}
            sidebarOpen={sidebarOpen}
          />

          <main className="flex-1 overflow-auto p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6">
            {/* IMPORTANT: Removed backdrop-blur-xl */}
            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 shadow-lg border border-gray-100 min-h-full">
              <Outlet />
            </div>
          </main>

          <footer className="py-3 text-center text-xs text-teal-700/60">
            © 2025 PixelmindSolutions · Enterprise Dashboard
          </footer>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;