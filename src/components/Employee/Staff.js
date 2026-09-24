import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUserTie,
  FaSearch,
  FaFilter,
  FaIdCard,
  FaFileAlt,
  FaUsersCog,
  FaUserCheck,
} from "react-icons/fa";
import {
  MdEdit,
  MdDelete,
  MdRemoveRedEye,
  MdEmail,
  MdPhone,
  MdCalendarToday,
  MdMoreVert,
  MdAdd,
  MdRefresh,
  MdTableRows,
  MdGridView,
} from "react-icons/md";
import { useLocation } from "react-router-dom";

const API_BASE_URL = "https://pmsbackend.pixelmindsolutions.com/api/staff" || "https://pmsbackend.pixelmindsolutions.com/api/staff";

const loginDetails = JSON.parse(sessionStorage.getItem("loginDetails"));

const AUTH_TOKEN = loginDetails?.token;

const permission = loginDetails?.modulePermissions?.find(
  (item) => item.component === "staffManagement"
);

const access = permission?.items?.[0]?.permission || [];

// Helper — case-insensitive admin check + safe permission lookup
const isAdmin = (loginDetails?.role || "").toLowerCase() === "admin";

const can = (action) =>
  isAdmin || (Array.isArray(access) && access.includes(action));

const Staff = () => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState("card");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { state } = useLocation();

  useEffect(() => {
    fetchStaff();
  }, [state?.refresh]);

  // Fetch staff from backend
  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/all`, {
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
        setStaffList(json.data);
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

  useEffect(() => {
    fetchStaff();
  }, []);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = staffList.length;
    const active = staffList.filter((s) => s.isActive).length;
    const inactive = total - active;
    const uniqueRoles = [...new Set(staffList.map((s) => s.role))].length;

    // Gender counts (case-insensitive, trims whitespace)
    const male = staffList.filter(
      (s) => (s.gender || "").trim().toLowerCase() === "male"
    ).length;
    const female = staffList.filter(
      (s) => (s.gender || "").trim().toLowerCase() === "female"
    ).length;

    return { total, active, inactive, uniqueRoles, male, female };
  }, [staffList]);

  // Filter staff based on search, role, and status
  const filtered = useMemo(() => {
    return staffList.filter((s) => {
      const matchSearch =
        s.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
        s.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.role?.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter ? s.role === roleFilter : true;
      const matchStatus =
        statusFilter === "" ? true
          : statusFilter === "active" ? s.isActive
            : !s.isActive;
      return matchSearch && matchRole && matchStatus;
    });
  }, [search, roleFilter, statusFilter, staffList]);

  const uniqueRoles = [...new Set(staffList.map((s) => s.role))];
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter, itemsPerPage]);

  // Delete staff by employeeId
  const handleDelete = async (employeeId, employeeName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${employeeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json"
        },
      });

      if (response.ok) {
        setStaffList((prev) => prev.filter((s) => s.employeeId !== employeeId));
        alert(`Employee ${employeeName} deleted successfully`);
      } else {
        const data = await response.json();
        alert(data.message || "Failed to delete employee.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Network error while deleting");
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Export function
  const handleExport = () => {
    if (filtered.length === 0) {
      alert("No data to export");
      return;
    }

    // Prepare data for export
    const exportData = filtered.map((staff) => ({
      "Employee ID": staff.employeeId || "",
      "Employee Name": staff.employeeName || "",
      "Email": staff.email || "",
      "Mobile": staff.mobile || "",
      "Role": staff.role || "",
      "Status": staff.isActive ? "Active" : "Inactive",
      "Joining Date": staff.joiningDate
        ? new Date(staff.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "",
    }));

    // Convert to CSV
    const headers = Object.keys(exportData[0]);
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(","));

    // Add data rows
    for (const row of exportData) {
      const values = headers.map(header => {
        const value = row[header] || "";
        // Escape commas and quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    }

    const csvString = csvRows.join("\n");

    // Create blob and download
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `staff_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/80">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; }

        .premium-card {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(20,184,166,0.18);
          box-shadow: 0 4px 24px -4px rgba(0,128,128,0.10), 0 1px 4px rgba(0,0,0,0.04);
        }
        .stat-card {
          background: rgba(255,255,255,0.95);
          border: 1px solid rgba(20,184,166,0.15);
          box-shadow: 0 2px 12px -2px rgba(0,128,128,0.08);
          transition: all 0.25s ease;
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px -4px rgba(0,128,128,0.15); }
        .table-row-hover { transition: background 0.15s ease; }
        .table-row-hover:hover td { background: rgba(240,253,250,0.9) !important; }
        .status-pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 9px; border-radius: 100px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase;
          white-space: nowrap;
        }
        .btn-act {
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 8px;
          transition: all 0.2s ease; cursor: pointer; border: none; flex-shrink: 0;
        }
        .btn-act:hover { transform: scale(1.1); }
        .s-input { outline: none !important; }
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        .spinner { width:40px; height:40px; border:3px solid #e0f2f1; border-top:3px solid #0d9488; border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp 0.3s ease forwards; }
        .modal-back { position:fixed;inset:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);z-index:50;display:flex;align-items:center;justify-content:center;padding:16px; }
        .scroll-x::-webkit-scrollbar { height:4px; }
        .scroll-x::-webkit-scrollbar-track { background:#f0fdf4; }
        .scroll-x::-webkit-scrollbar-thumb { background:#99f6e4; border-radius:4px; }

        @media(max-width:600px){ .h-sm{ display:none!important; } }
        @media(max-width:420px){ .h-xs{ display:none!important; } }
      `}</style>

      {/* DELETE MODAL */}
      {deleteConfirm && (
        <div className="modal-back">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl fade-up">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <MdDelete className="text-red-500" size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-800 text-center mb-1">Delete Employee?</h3>
            <p className="text-xs text-gray-500 text-center mb-5">
              Permanently remove <span className="font-semibold text-gray-700">{deleteConfirm.name}</span>?
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 text-sm">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.name)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 lg:py-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30 shrink-0">
              <FaUsersCog className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight leading-tight">
                Staff Management
              </h1>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full inline-block" />
                {stats.total} employees &middot; {stats.active} active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {can("export") && (
              <button
                onClick={handleExport}
                className="group flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02] transition-all text-sm w-full sm:w-auto"
              >
                <FaFileAlt
                  size={16}
                  className="group-hover:scale-110 transition-transform duration-300"
                />
                Export
              </button>
            )}

            {can("add") && (
              <Link
                to="/add-staff"
                className="group flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-xl hover:scale-[1.02] transition-all text-sm w-full sm:w-auto"
              >
                <MdAdd
                  size={18}
                  className="group-hover:rotate-90 transition-transform duration-300"
                />
                Add Employee
              </Link>
            )}
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-4 mb-5 sm:mb-6">
          {[
            { label: "Total Staff", value: stats.total, icon: "👥", badge: "bg-teal-100 text-teal-700", dot: "bg-teal-400", short: "Total" },
            { label: "Active", value: stats.active, icon: "✅", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400", short: "Active" },
            { label: "Inactive", value: stats.inactive, icon: "⏸️", badge: "bg-gray-100 text-gray-500", dot: "bg-gray-300", short: "Inactive" },
            { label: "Male Staff", value: stats.male, icon: "👨", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-400", short: "Male" },
            { label: "Female Staff", value: stats.female, icon: "👩", badge: "bg-pink-100 text-pink-700", dot: "bg-pink-400", short: "Female" },
            { label: "Unique Roles", value: stats.uniqueRoles, icon: "🏷️", badge: "bg-purple-100 text-purple-700", dot: "bg-purple-400", short: "Unique" },
          ].map((s, i) => (
            <div key={i} className="stat-card rounded-2xl p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg sm:text-2xl">{s.icon}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full hidden sm:inline ${s.badge}`}>
                  {s.short}
                </span>
              </div>
              <p className="text-xl sm:text-3xl font-bold text-gray-800 leading-none">{s.value}</p>
              <p className="text-xs text-gray-400 font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* FILTER BAR */}
        <div className="premium-card rounded-2xl p-3.5 sm:p-4 lg:p-5 mb-5 sm:mb-6">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                <FaFilter className="text-teal-600" size={12} />
              </div>
              <span className="font-bold text-gray-800 text-sm">Filters</span>
              <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs font-bold">
                {filtered.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-gray-100 rounded-xl p-0.5 flex">
                <button onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === "table" ? "bg-white shadow text-teal-700" : "text-gray-500"}`}>
                  <MdTableRows size={14} />
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button onClick={() => setViewMode("card")}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === "card" ? "bg-white shadow text-teal-700" : "text-gray-500"}`}>
                  <MdGridView size={14} />
                  <span className="hidden sm:inline">Cards</span>
                </button>
              </div>
              <button onClick={() => { setSearch(""); setRoleFilter(""); setStatusFilter(""); fetchStaff(); }}
                className="p-1.5 sm:p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all" title="Refresh">
                <MdRefresh size={17} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
              <input className="s-input w-full h-10 pl-8 pr-3 rounded-xl border-2 border-gray-100 bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all text-xs sm:text-sm text-gray-700 placeholder:text-gray-400"
                placeholder="Search name, ID, email…"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="relative">
              <FaUserTie className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={12} />
              <select className="s-input w-full h-10 pl-8 pr-7 rounded-xl border-2 border-gray-100 bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all text-xs sm:text-sm text-gray-700 appearance-none cursor-pointer"
                value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">All Roles</option>
                {uniqueRoles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
            </div>

            <div className="relative">
              <FaUserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={12} />
              <select className="s-input w-full h-10 pl-8 pr-7 rounded-xl border-2 border-gray-100 bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all text-xs sm:text-sm text-gray-700 appearance-none cursor-pointer"
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
            </div>

            <div className="relative">
              <FaFileAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={12} />
              <select className="s-input w-full h-10 pl-8 pr-7 rounded-xl border-2 border-gray-100 bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all text-xs sm:text-sm text-gray-700 appearance-none cursor-pointer"
                value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="premium-card rounded-2xl p-12 sm:p-16 flex flex-col items-center justify-center gap-4">
            <div className="spinner" />
            <p className="text-gray-500 font-medium text-sm">Loading staff data…</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="premium-card rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
              <MdRefresh className="text-red-400" size={28} />
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">Failed to load staff</p>
              <p className="text-gray-400 text-sm max-w-xs">{error}</p>
            </div>
            <button onClick={fetchStaff}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors text-sm">
              Retry
            </button>
          </div>
        )}

        {/* TABLE VIEW */}
        {!loading && !error && viewMode === "table" && (
          <div className="premium-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto scroll-x">
              <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 480 }}>
                <thead>
                  <tr className="bg-gradient-to-r from-teal-700 to-teal-600 text-white">
                    <th className="py-3 px-3 sm:px-4 text-left text-xs font-semibold w-8 sm:w-10">#</th>
                    <th className="h-xs py-3 px-3 sm:px-4 text-left text-xs font-semibold whitespace-nowrap">ID</th>
                    <th className="py-3 px-3 sm:px-4 text-left text-xs font-semibold">Employee</th>
                    <th className="h-sm py-3 px-3 sm:px-4 text-left text-xs font-semibold whitespace-nowrap">Role</th>
                    <th className="h-sm py-3 px-3 sm:px-4 text-left text-xs font-semibold whitespace-nowrap">Status</th>
                    <th className="py-3 px-3 sm:px-4 text-left text-xs font-semibold whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? paginated.map((staff, index) => (
                    <tr key={staff._id} className="table-row-hover border-b border-gray-50/80">
                      <td className="py-3 px-3 sm:px-4 text-xs text-gray-400 font-medium">{startIndex + index + 1}</td>
                      <td className="h-xs py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-1.5">
                          <FaIdCard className="text-teal-400 shrink-0" size={11} />
                          <span className="font-mono font-semibold text-gray-600 text-xs whitespace-nowrap">{staff.employeeId}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-2.5">
                          {staff.profileImage && !staff.profileImage.startsWith("/data/user") ? (
                            <img
                              src={staff.profileImage}
                              alt={staff.employeeName}
                              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-teal-100 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shrink-0 border-2 border-teal-50">
                              <span className="text-white font-semibold text-sm">
                                {staff.employeeName?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate" style={{ maxWidth: "clamp(80px,20vw,180px)" }}>
                              {staff.employeeName}
                            </p>
                            <p className="text-xs text-gray-400 truncate" style={{ maxWidth: "clamp(80px,18vw,180px)" }}>
                              {staff.email}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 sm:hidden flex-wrap">
                              <span className="text-xs text-teal-600 font-semibold truncate" style={{ maxWidth: 80 }}>{staff.role}</span>
                              <span className={`status-pill text-xs ${staff.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                <span className={`w-1 h-1 rounded-full ${staff.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                                {staff.isActive ? "Active" : "Off"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="h-sm py-3 px-3 sm:px-4">
                        <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-semibold border border-teal-100 whitespace-nowrap">
                          {staff.role}
                        </span>
                      </td>
                      <td className="h-sm py-3 px-3 sm:px-4">
                        <span className={`status-pill ${staff.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${staff.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                          {staff.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-1">
                          {can("view") && (
                            <button onClick={() => navigate(`/staff/${staff.employeeId}`)}
                              className="btn-act bg-teal-50 hover:bg-teal-100 text-teal-600" title="View">
                              <MdRemoveRedEye size={15} />
                            </button>
                          )}
                          {can("edit") && (
                            <button
                              onClick={() => navigate(`/staff/edit/${staff.employeeId}`)}
                              className="btn-act bg-blue-50 hover:bg-blue-100 text-blue-600"
                              title="Edit"
                            >
                              <MdEdit size={15} />
                            </button>
                          )}
                          {can("delete") && (
                            <button onClick={() => setDeleteConfirm({ id: staff.employeeId, name: staff.employeeName })}
                              className="btn-act bg-red-50 hover:bg-red-100 text-red-500" title="Delete">
                              <MdDelete size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-14 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <FaUsersCog className="text-gray-200" size={44} />
                          <p className="text-gray-400 font-semibold text-sm">No employees found</p>
                          <button onClick={() => navigate("/add-staff")}
                            className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition-colors">
                            Add First Employee
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <Pagination totalPages={totalPages} currentPage={currentPage} setCurrentPage={setCurrentPage}
                startIndex={startIndex} itemsPerPage={itemsPerPage} filteredLength={filtered.length} />
            )}
          </div>
        )}

        {/* CARD VIEW */}
        {!loading && !error && viewMode === "card" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {paginated.length > 0 ? paginated.map((staff, index) => (
                <div key={staff._id}
                  className="premium-card rounded-2xl p-4 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 fade-up flex flex-col"
                  style={{ animationDelay: `${index * 35}ms` }}>

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {staff.profileImage && !staff.profileImage.startsWith("/data/user") ? (
                        <img
                          src={staff.profileImage}
                          alt={staff.employeeName}
                          className="w-10 h-10 rounded-xl object-cover border-2 border-teal-100 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shrink-0 border-2 border-teal-50">
                          <span className="text-white font-bold text-lg">
                            {staff.employeeName?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-800 text-sm truncate">{staff.employeeName}</h3>
                        <p className="text-xs text-teal-600 font-semibold truncate">{staff.role}</p>
                      </div>
                    </div>
                    <span className={`status-pill shrink-0 ml-2 ${staff.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${staff.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                      {staff.isActive ? "On" : "Off"}
                    </span>
                  </div>

                  <div className="space-y-1.5 py-3 border-t border-b border-gray-100 flex-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FaIdCard className="text-gray-300 shrink-0" size={11} />
                      <span className="font-mono font-semibold text-gray-600 truncate">{staff.employeeId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MdEmail className="text-gray-300 shrink-0" size={13} />
                      <span className="truncate">{staff.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MdPhone className="text-gray-300 shrink-0" size={13} />
                      <span>{staff.mobile || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MdCalendarToday className="text-gray-300 shrink-0" size={11} />
                      <span>
                        {staff.joiningDate
                          ? new Date(staff.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons — always visible with icon + text */}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    {can("view") && (
                      <button
                        onClick={() => navigate(`/staff/${staff.employeeId}`)}
                        className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold transition-colors"
                        title="View"
                      >
                        <MdRemoveRedEye size={14} />
                        <span className="hidden sm:inline">View</span>
                      </button>
                    )}

                    {can("edit") && (
                      <button
                        onClick={() => navigate(`/staff/edit/${staff.employeeId}`)}
                        className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
                        title="Edit"
                      >
                        <MdEdit size={14} />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                    )}

                    {can("delete") && (
                      <button
                        onClick={() => setDeleteConfirm({ id: staff.employeeId, name: staff.employeeName })}
                        className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors"
                        title="Delete"
                      >
                        <MdDelete size={14} />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="col-span-full premium-card rounded-2xl py-14 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <FaUsersCog className="text-gray-200" size={48} />
                    <p className="text-gray-400 font-semibold text-sm">No employees found</p>
                    <button onClick={() => navigate("/add-staff")}
                      className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors">
                      Add Employee
                    </button>
                  </div>
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <div className="mt-4 premium-card rounded-2xl overflow-hidden">
                <Pagination totalPages={totalPages} currentPage={currentPage} setCurrentPage={setCurrentPage}
                  startIndex={startIndex} itemsPerPage={itemsPerPage} filteredLength={filtered.length} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* PAGINATION COMPONENT */
const Pagination = ({ totalPages, currentPage, setCurrentPage, startIndex, itemsPerPage, filteredLength }) => {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push({ type: "page", value: i });
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      pages.push({ type: "dot", value: i });
    }
  }
  return (
    <div className="px-3 sm:px-5 py-3 sm:py-4 border-t border-teal-50 bg-gradient-to-r from-white to-teal-50/30">
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5">
        <p className="text-xs text-gray-500">
          Showing{" "}
          <span className="font-bold text-teal-700">{startIndex + 1}</span>–<span className="font-bold text-teal-700">{Math.min(startIndex + itemsPerPage, filteredLength)}</span>
          {" "}of <span className="font-bold text-teal-700">{filteredLength}</span>
        </p>
        <div className="flex items-center gap-1 flex-wrap">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}
            className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-all border ${currentPage === 1 ? "text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed"
              : "text-teal-700 border-teal-200 hover:bg-teal-50 bg-white"}`}>
            ← Prev
          </button>
          {pages.map((p, i) =>
            p.type === "dot" ? (
              <span key={i} className="px-1 text-gray-400 text-xs">…</span>
            ) : (
              <button key={i} onClick={() => setCurrentPage(p.value)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-bold text-xs transition-all ${currentPage === p.value
                  ? "bg-teal-600 text-white shadow-md shadow-teal-500/30"
                  : "hover:bg-teal-50 text-gray-600 bg-white border border-gray-100"}`}>
                {p.value}
              </button>
            )
          )}
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}
            className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-all border ${currentPage === totalPages ? "text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed"
              : "text-teal-700 border-teal-200 hover:bg-teal-50 bg-white"}`}>
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

const ChevronDown = ({ size = 13, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default Staff;