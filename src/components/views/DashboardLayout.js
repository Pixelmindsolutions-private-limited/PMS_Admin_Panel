
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
      setSidebarOpen(width >= 768);
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
    <div className="h-screen w-full overflow-hidden bg-gray-50">
      <div className="flex h-full w-full overflow-hidden">

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
          className={`flex min-w-0 flex-1 flex-col h-full overflow-hidden transition-[margin] duration-300 ${
            !isMobile && sidebarOpen
              ? "lg:ml-[280px] md:ml-[280px]"
              : "ml-0"
          }`}
          onClick={handleContentClick}
        >
          {/* Fixed Header */}
          <div className="shrink-0">
            <Header
              onToggleSidebar={toggleSidebar}
              onLogout={onLogout}
              isMobile={isMobile}
              isTablet={isTablet}
              sidebarOpen={sidebarOpen}
            />
          </div>

          {/* Scrollable Outlet */}
          <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6">
            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 shadow-lg border border-gray-100 min-h-full">
              <Outlet />
            </div>
          </main>

          {/* Fixed Footer */}
          <footer className="shrink-0 py-3 text-center text-xs text-teal-700/60">
            © 2025 PixelmindSolutions · Enterprise Dashboard
          </footer>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
