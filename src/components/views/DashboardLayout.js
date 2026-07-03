// import React, { useState, useEffect } from "react";
// import { Outlet, Navigate } from "react-router-dom";
// import Sidebar from "./Sidebar";
// import Header from "./Header";

// const DashboardLayout = ({ isLoggedIn, onLogout }) => {
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [isMobile, setIsMobile] = useState(false);
//   const [isTablet, setIsTablet] = useState(false);

//   // Premium device detection with breakpoints
//   useEffect(() => {
//     const checkDevice = () => {
//       const width = window.innerWidth;
//       setIsMobile(width < 768);
//       setIsTablet(width >= 768 && width < 1024);
//       // Auto sidebar behavior: closed on mobile, open on tablet/desktop
//       if (width < 768) {
//         setSidebarOpen(false);
//       } else if (width >= 768 && width < 1024) {
//         setSidebarOpen(true); // Tablet: keep open but compact
//       } else {
//         setSidebarOpen(true); // Desktop: fully open
//       }
//     };

//     checkDevice();
//     window.addEventListener('resize', checkDevice);
//     return () => window.removeEventListener('resize', checkDevice);
//   }, []);

//   const toggleSidebar = () => {
//     setSidebarOpen((prev) => !prev);
//   };

//   // Elegant close on content click for mobile
//   const handleContentClick = () => {
//     if (isMobile && sidebarOpen) {
//       setSidebarOpen(false);
//     }
//   };

//   if (!isLoggedIn) {
//     return <Navigate to="/" replace />;
//   }

//   // Dynamic margin based on device and sidebar state
//   const getContentMargin = () => {
//     if (isMobile) return "0";
//     if (isTablet) return sidebarOpen ? "280px" : "0";
//     return sidebarOpen ? "280px" : "0";
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="relative flex min-h-screen bg-gray-50">
//         {/* Sidebar - Ultra Premium */}
//         <Sidebar 
//           isOpen={sidebarOpen} 
//           onLogout={onLogout}
//           isMobile={isMobile}
//           isTablet={isTablet}
//           onClose={() => setSidebarOpen(false)}
//         />

//         {/* Elegant Overlay for Mobile/Tablet */}
//         {!isMobile && sidebarOpen && isTablet && (
//           <div 
//             className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[900] transition-opacity duration-400"
//             onClick={() => setSidebarOpen(false)}
//           />
//         )}

//         {isMobile && sidebarOpen && (
//           <div 
//             className="fixed inset-0 bg-black/30 backdrop-blur-md z-[999] animate-in fade-in duration-300"
//             onClick={() => setSidebarOpen(false)}
//           />
//         )}

//         {/* Main Content Area */}
//         <div
//           className="flex-grow flex flex-col transition-all duration-400 ease-[cubic-bezier(0.2,0.9,0.4,1)] relative w-full min-h-screen bg-gray-50"
//           style={{ marginLeft: getContentMargin() }}
//           onClick={handleContentClick}
//         >
//           {/* Premium Header with Glass Effect */}
//           <Header 
//             onToggleSidebar={toggleSidebar} 
//             onLogout={onLogout}
//             isMobile={isMobile}
//             isTablet={isTablet}
//             sidebarOpen={sidebarOpen}
//           />

//           {/* Outlet with Premium Card Effect */}
//           <main className="flex-grow overflow-x-hidden p-3 md:p-4 lg:p-5">
//             <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl p-3 md:p-4 lg:p-5 transition-all duration-400 ease-[cubic-bezier(0.2,0.9,0.4,1)] min-h-full shadow-lg border border-white/30">
//               <Outlet />
//             </div>
//           </main>
          
//           {/* Subtle Footer */}
//           <div className="text-center py-3 text-teal-700/60 text-xs tracking-wide">
//             <span>© 2025 PixelmindSolutions · Enterprise Dashboard</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DashboardLayout;

import React, { useState, useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const DashboardLayout = ({ isLoggedIn, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Premium device detection with breakpoints
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      // Auto sidebar behavior: closed on mobile, open on tablet/desktop
      if (width < 768) {
        setSidebarOpen(false);
      } else if (width >= 768 && width < 1024) {
        setSidebarOpen(true); // Tablet: keep open but compact
      } else {
        setSidebarOpen(true); // Desktop: fully open
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  // Elegant close on content click for mobile
  const handleContentClick = () => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  // Dynamic margin based on device and sidebar state
  const getContentMargin = () => {
    if (isMobile) return "0";
    if (isTablet) return sidebarOpen ? "280px" : "0";
    return sidebarOpen ? "280px" : "0";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative flex min-h-screen bg-gray-50">
        {/* Sidebar - Ultra Premium */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onLogout={onLogout}
          isMobile={isMobile}
          isTablet={isTablet}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Elegant Overlay for Mobile/Tablet */}
        {!isMobile && sidebarOpen && isTablet && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[900] transition-opacity duration-400"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-md z-[999] animate-in fade-in duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div
          className="flex-grow flex flex-col transition-all duration-400 ease-[cubic-bezier(0.2,0.9,0.4,1)] relative w-full min-h-screen bg-gray-50"
          style={{ marginLeft: getContentMargin() }}
          onClick={handleContentClick}
        >
          {/* Premium Header with Glass Effect */}
          <Header 
            onToggleSidebar={toggleSidebar} 
            onLogout={onLogout}
            isMobile={isMobile}
            isTablet={isTablet}
            sidebarOpen={sidebarOpen}
          />

          {/* Outlet with Premium Card Effect */}
          <main className="flex-grow overflow-x-hidden p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 2xl:p-8">
            <div className="bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 2xl:p-8 transition-all duration-400 ease-[cubic-bezier(0.2,0.9,0.4,1)] min-h-full shadow-lg border border-white/30">
              <Outlet />
            </div>
          </main>
          
          {/* Subtle Footer */}
          <div className="text-center py-2 sm:py-3 text-teal-700/60 text-[10px] sm:text-xs tracking-wide">
            <span>© 2025 PixelmindSolutions · Enterprise Dashboard</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;