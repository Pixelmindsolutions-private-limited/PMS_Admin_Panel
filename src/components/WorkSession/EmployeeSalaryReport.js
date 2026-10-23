import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, RefreshCw, AlertCircle, Clock, Calendar,
  IndianRupee, CheckCircle2, Users, ChevronLeft, ChevronRight, Eye, X
} from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../../utils/Auth';

const EmployeeSalaryReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Dropdown Employees State
  const [employees, setEmployees] = useState([]);

  // Modal State
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Default to current month (1st to today)
  const getTodayIST = () => {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    return ist.toISOString().split('T')[0];
  };
  const getFirstDayOfMonth = () => {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    return `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, '0')}-01`;
  };

  const [filters, setFilters] = useState({
    employeeId: '',
    startDate: getFirstDayOfMonth(),
    endDate: getTodayIST(),
  });

  // Fetch employees for the dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/staff/all?limit=1000`, {
          headers: getAuthHeaders(),
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setEmployees(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch employees for dropdown:', err);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch Salary Report
  const fetchReport = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    if (!filters.startDate || !filters.endDate) {
      setError('Start Date and End Date are required.');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (new Date(filters.startDate) > new Date(filters.endDate)) {
      setError('Start Date cannot be after End Date.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (filters.employeeId) params.append('employeeId', filters.employeeId);
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);

      const res = await fetch(`${API_BASE_URL}/staff/work-salary-report?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to fetch salary report');
      }

      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setData(result.data);
        setCurrentPage(1);
      } else {
        throw new Error(result.message || 'Invalid data format received');
      }
    } catch (err) {
      console.error('Salary Report Error:', err);
      setError(err.message || 'Network error occurred');
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const handleResetFilters = () => {
    setFilters({
      employeeId: '',
      startDate: getFirstDayOfMonth(),
      endDate: getTodayIST(),
    });
    setTimeout(() => fetchReport(), 0);
  };

  const handleViewDetails = (row) => {
    setSelectedEmp(row);
    setShowDetailsModal(true);
  };

  // Formatting Helpers
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatHours = (hours) => {
    if (hours === null || hours === undefined) return '-';
    return Number(hours).toFixed(2);
  };

  // Summary Calculations
  const summary = useMemo(() => {
    return data.reduce(
      (acc, curr) => {
        acc.totalEmployees += 1;
        acc.totalWorkingDays += Number(curr.totalWorkingDays) || 0;
        acc.totalScheduledDays += Number(curr.totalScheduledWorkingDays) || 0;
        acc.totalWorkingHours += Number(curr.totalWorkingHours) || 0;
        acc.totalElapsedHours += Number(curr.totalHours) || 0;

        if (curr.totalSalary !== null && curr.totalSalary !== undefined) {
          acc.totalMonthlySalary += Number(curr.totalSalary) || 0;
        }
        if (curr.payableSalary !== null && curr.payableSalary !== undefined) {
          acc.totalPayableSalary += Number(curr.payableSalary) || 0;
        } else if (curr.periodSalary !== null && curr.periodSalary !== undefined) {
          acc.totalPayableSalary += Number(curr.periodSalary) || 0;
        }
        if (curr.salaryDeduction !== null && curr.salaryDeduction !== undefined) {
          acc.totalSalaryDeduction += Number(curr.salaryDeduction) || 0;
        }

        return acc;
      },
      {
        totalEmployees: 0,
        totalWorkingDays: 0,
        totalScheduledDays: 0,
        totalWorkingHours: 0,
        totalElapsedHours: 0,
        totalMonthlySalary: 0,
        totalPayableSalary: 0,
        totalSalaryDeduction: 0,
      }
    );
  }, [data]);

  // Pagination Logic
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100/60 py-6 md:py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-teal-50 text-teal-800 border border-teal-200">
                FINANCE & PAYROLL
              </span>
              <span className="text-xs text-slate-400 font-semibold">{data.length} records found</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Employee Work & Salary Report
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Period: {filters.startDate} to {filters.endDate}
            </p>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => fetchReport(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shadow-sm disabled:opacity-70 transition-colors"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh Data
            </button>
          </div>
        </div>

        {/* DASHBOARD SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard title="Total Employees" value={summary.totalEmployees} icon={<Users size={16} className="text-slate-600" />} />
          <StatCard title="Total Monthly Salary" value={formatCurrency(summary.totalMonthlySalary)} icon={<IndianRupee size={16} className="text-indigo-600" />} color="indigo" />
          <StatCard title="Working Days" value={summary.totalWorkingDays} icon={<CheckCircle2 size={16} className="text-emerald-600" />} color="emerald" />
          <StatCard title="Scheduled Days" value={summary.totalScheduledDays} icon={<Calendar size={16} className="text-slate-600" />} />
          <StatCard title="Working Hours" value={formatHours(summary.totalWorkingHours)} icon={<Clock size={16} className="text-teal-600" />} color="teal" />
          <StatCard title="Elapsed Hours" value={formatHours(summary.totalElapsedHours)} icon={<Clock size={16} className="text-slate-500" />} />
          <StatCard title="Total Payable Salary" value={formatCurrency(summary.totalPayableSalary)} icon={<IndianRupee size={16} className="text-emerald-600" />} color="emerald" />
          <StatCard title="Total Deduction" value={formatCurrency(summary.totalSalaryDeduction)} icon={<IndianRupee size={16} className="text-red-600" />} color="red" />
        </div>

        {/* FILTERS */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <form onSubmit={handleApplyFilters} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="lg:col-span-1">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Employee</label>
              <select
                name="employeeId"
                className="w-full h-11 px-3 border border-slate-200 rounded-2xl bg-slate-50 text-xs font-semibold text-slate-700 outline-none focus:border-teal-500 cursor-pointer"
                value={filters.employeeId}
                onChange={handleFilterChange}
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.employeeName} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">From Date</label>
              <input
                type="date"
                name="startDate"
                required
                className="w-full h-11 px-3 border border-slate-200 rounded-2xl bg-slate-50 text-xs outline-none focus:border-teal-500"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">To Date</label>
              <input
                type="date"
                name="endDate"
                required
                className="w-full h-11 px-3 border border-slate-200 rounded-2xl bg-slate-50 text-xs outline-none focus:border-teal-500"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>

            <div className="flex gap-2 lg:col-span-2">
              <button
                type="submit"
                className="flex-1 h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Search size={14} /> Search
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 h-11 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          {loading ? (
            <div className="p-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-teal-500" />
              <p className="text-sm font-semibold">Generating Salary Report...</p>
            </div>
          ) : error ? (
            <div className="p-16 text-center text-red-500">
              <AlertCircle className="w-10 h-10 mx-auto mb-3" />
              <p className="font-bold text-sm">{error}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="bg-slate-50/90 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-4 px-4 font-bold">Emp ID</th>
                      <th className="py-4 px-4 font-bold">Employee Name</th>
                      <th className="py-4 px-4 font-bold text-right text-indigo-700">Monthly Salary</th>
                      <th className="py-4 px-4 font-bold text-center">Working Days</th>
                      <th className="py-4 px-4 font-bold text-center">Scheduled Days</th>
                      <th className="py-4 px-4 font-bold text-right text-teal-700">Working Hours</th>
                      <th className="py-4 px-4 font-bold text-right text-slate-600">Elapsed Hours</th>
                      <th className="py-4 px-4 font-bold text-right text-emerald-700">Payable Salary</th>
                      <th className="py-4 px-4 font-bold text-right text-red-600">Deduction</th>
                      <th className="py-4 px-4 font-bold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="p-16 text-center text-slate-400">
                          <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          <p className="font-semibold text-sm">No employee records found for the selected period</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((row) => (
                        <tr key={row.employeeId} className="hover:bg-teal-50/20 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-700">{row.employeeId}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{row.employeeName}</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-800">{formatCurrency(row.totalSalary)}</td>
                          <td className="py-3 px-4 text-center font-semibold text-teal-700 bg-teal-50/30">{row.totalWorkingDays}</td>
                          <td className="py-3 px-4 text-center text-slate-600">{row.totalScheduledWorkingDays}</td>
                          <td className="py-3 px-4 text-right font-bold text-teal-800">{formatHours(row.totalWorkingHours)}</td>
                          <td className="py-3 px-4 text-right font-medium text-slate-500">{formatHours(row.totalHours)}</td>
                          <td className="py-3 px-4 text-right font-extrabold text-emerald-700">{formatCurrency(row.payableSalary ?? row.periodSalary)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-red-600">{formatCurrency(row.salaryDeduction)}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleViewDetails(row)}
                              className="p-1.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Eye size={14} /> View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
                  <div>
                    Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
                    <strong>{Math.min(currentPage * itemsPerPage, data.length)}</strong> of{" "}
                    <strong>{data.length}</strong> records
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <span className="font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* DAILY DETAILS MODAL */}
      {showDetailsModal && selectedEmp && (
        <DailyDetailsModal
          employee={selectedEmp}
          dateRange={filters}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
};

// ==========================================
// MODAL COMPONENT: Daily Work Details
// ==========================================
const DailyDetailsModal = ({ employee, dateRange, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append('employeeId', employee.employeeId);
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);

        // URL requested: /api/staff/work-salary-report/daily-details
        const res = await fetch(`${API_BASE_URL}/staff/work-salary-report/daily-details?${params.toString()}`, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to fetch daily details');
        }

        const result = await res.json();
        if (result.success) {
          setDetails(result);
        } else {
          throw new Error(result.message || 'Invalid data format received');
        }
      } catch (err) {
        console.error('Daily Details Error:', err);
        setError(err.message || 'Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [employee.employeeId, dateRange]);

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return timeStr;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present':
      case 'Full Day':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Present</span>;
      case 'Absent':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">Absent</span>;
      case 'Partial Day':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Partial Day</span>;
      case 'In Progress':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">In Progress</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">{status || 'Unknown'}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <Calendar className="text-teal-600" size={20} /> Daily Work Details
            </h3>
            <p className="text-xs text-slate-600 font-medium mt-1">
              {employee.employeeName} ({employee.employeeId})
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md border border-slate-300">
                {dateRange.startDate} to {dateRange.endDate}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center font-bold transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-slate-50/30">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-teal-500 mb-3" />
              <p className="text-sm font-bold text-slate-600">Fetching daily records...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center flex flex-col items-center justify-center text-red-500 bg-red-50/50 rounded-2xl border border-red-100 p-6">
              <AlertCircle className="w-10 h-10 mb-2 text-red-400" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          ) : details ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3 font-bold">Date</th>
                      <th className="py-3 px-3 font-bold">Status</th>
                      <th className="py-3 px-3 font-bold">Check In</th>
                      <th className="py-3 px-3 font-bold">Check Out</th>
                      <th className="py-3 px-3 font-bold text-right">Working Hours</th>
                      <th className="py-3 px-3 font-bold text-right">Elapsed Hours</th>
                      <th className="py-3 px-3 font-bold text-right">Daily Salary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!details.data || details.data.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-10 text-center text-slate-400 font-semibold">
                          No daily records found for this period.
                        </td>
                      </tr>
                    ) : (
                      details.data.map((day, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-800">
                            {new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-3">
                            {getStatusBadge(day.attendanceStatus || day.status)}
                          </td>
                          <td className="py-3 px-3 text-slate-600">{formatTime(day.checkIn)}</td>
                          <td className="py-3 px-3 text-slate-600">{formatTime(day.checkOut)}</td>
                          <td className="py-3 px-3 text-right font-medium text-teal-700">
                            {day.totalWorkingHours != null ? Number(day.totalWorkingHours).toFixed(2) : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-500">
                            {day.totalElapsedHours != null ? Number(day.totalElapsedHours).toFixed(2) : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-700">
                            {day.dailySalary != null ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(day.dailySalary) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Subcomponents
const StatCard = ({ title, value, icon, color = 'slate' }) => {
  const borderColors = {
    slate: 'border-slate-200',
    teal: 'border-teal-200',
    blue: 'border-blue-200',
    amber: 'border-amber-200',
    emerald: 'border-emerald-200',
    indigo: 'border-indigo-200',
    red: 'border-red-200',
  };
  const textColors = {
    slate: 'text-slate-900',
    teal: 'text-teal-900',
    blue: 'text-blue-900',
    amber: 'text-amber-900',
    emerald: 'text-emerald-900',
    indigo: 'text-indigo-900',
    red: 'text-red-900',
  };
  
  return (
    <div className={`bg-white rounded-2xl p-4 border ${borderColors[color]} shadow-xs flex flex-col justify-between`}>
      <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
        <span className="uppercase tracking-wider text-[10px]">{title}</span>
        {icon}
      </div>
      <div className={`font-extrabold text-xl ${textColors[color]}`}>{value}</div>
    </div>
  );
};

export default EmployeeSalaryReport;