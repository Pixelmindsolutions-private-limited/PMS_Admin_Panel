import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdArrowBack,
  MdCheckCircle,
  MdRefresh,
  MdPerson,
  MdSearch,
  MdVisibility,
} from 'react-icons/md';
import { FaUsersCog } from 'react-icons/fa';

const API_BASE_URL = "https://pmsbackend.pixelmindsolutions.com/api/admin-staff";

const adminDetails = JSON.parse(sessionStorage.getItem("adminDetails"));
const AUTH_TOKEN = adminDetails?.token;

const EmployeeAccessList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch all employees
  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL, {
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
        const adminEmployees = json.data.filter(
          (staff) => staff.isAdminPanelAccess === true
        );

        setEmployees(adminEmployees);
        setFilteredEmployees(adminEmployees);
      } else {
        throw new Error(json.message || "Invalid response format");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filter employees based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = employees.filter(emp =>
        emp.employeeName?.toLowerCase().includes(term) ||
        emp.employeeId?.toLowerCase().includes(term) ||
        emp.email?.toLowerCase().includes(term) ||
        emp.mobile?.includes(term)
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);

  // Handle employee click - navigate to employee details
  const handleEmployeeClick = (employee) => {
    navigate(`/employee-access/${employee._id}`);
  };

  // Handle retry
  const handleRetry = () => {
    fetchEmployees();
  };

  // Handle back
  const handleGoBack = () => {
    navigate('/dashboard');
  };

  // Get enabled modules count
  const getEnabledModulesCount = (modules) => {
    return Object.values(modules || {}).filter(Boolean).length;
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
          <p className="text-gray-500 font-medium">Loading employees...</p>
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
        .employee-card {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .employee-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px -8px rgba(59,130,246,0.15);
        }
        .search-input {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(59,130,246,0.15);
          transition: all 0.2s ease;
        }
        .search-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
          outline: none;
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
              title="Back to Dashboard"
            >
              <MdArrowBack size={20} />
            </button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              <FaUsersCog className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight leading-tight">
                Employee Access Management
              </h1>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />
                {filteredEmployees.length} employees found
              </p>
            </div>
          </div>
          <button
            onClick={fetchEmployees}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            <MdRefresh size={16} />
            Refresh
          </button>
        </div>

        {/* SEARCH */}
        <div className="premium-card rounded-2xl p-4 sm:p-6 mb-5 sm:mb-6">
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, ID, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input w-full pl-10 pr-4 py-3 rounded-xl text-sm text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* EMPLOYEE LIST */}
        {filteredEmployees.length === 0 ? (
          <div className="premium-card rounded-2xl p-12 text-center">
            <div className="text-gray-400">
              <MdPerson size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium text-gray-600">No employees found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredEmployees.map((employee) => {
              const moduleCount = getEnabledModulesCount(employee.modulePermissions);
              const hasAccess = employee.isAdminPanelAccess || false;

              return (
                <div
                  key={employee._id}
                  onClick={() => handleEmployeeClick(employee)}
                  className="employee-card premium-card rounded-2xl p-4 sm:p-5 hover:border-blue-300"
                >
                  <div className="flex items-start gap-3">
                    {employee.profileImage ? (
                      <img
                        src={employee.profileImage}
                        alt={employee.employeeName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-100 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-blue-50 shrink-0">
                        <span className="text-white font-bold text-lg">
                          {employee.employeeName?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 text-sm truncate">
                        {employee.employeeName}
                      </h3>
                      <p className="text-xs text-gray-500">{employee.employeeId}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`status-pill ${employee.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {employee.isActive ? "Active" : "Inactive"}
                        </span>
                        {hasAccess && (
                          <span className="status-pill bg-blue-100 text-blue-700">
                            Access
                          </span>
                        )}
                        {moduleCount > 0 && (
                          <span className="status-pill bg-purple-100 text-purple-700">
                            {moduleCount} Modules
                          </span>
                        )}
                      </div>
                    </div>
                    <MdVisibility className="text-gray-300 shrink-0 mt-1" size={18} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAccessList;