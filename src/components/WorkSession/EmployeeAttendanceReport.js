import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, AlertCircle,
  Clock, Calendar, IndianRupee, CheckCircle2
} from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../../utils/Auth';

const EmployeeSalaryReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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

  const [searchTerm, setSearchTerm] = useState('');

  // Fetch API data
  const fetchReport = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    // Validation
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

  // Handle Filter Changes
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
    setSearchTerm('');
    setTimeout(() => fetchReport(), 0);
  };

  // Formatting Helpers
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'Not Configured';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatHours = (hours) => {
    if (hours === null || hours === undefined) return '0.00';
    return Number(hours).toFixed(2);
  };

  // Summaries Calculation
  const summary = data.reduce(
    (acc, curr) => {
      acc.totalEmployees += 1;
      acc.totalWorkingDays += Number(curr.totalWorkingDays) || 0;
      acc.totalWorkingHours += Number(curr.totalWorkingHours) || 0;
      
      if (curr.totalSalary !== null && curr.totalSalary !== undefined) {
        acc.totalSalary += Number(curr.totalSalary) || 0;
      }
      return acc;
    },
    {
      totalEmployees: 0,
      totalWorkingDays: 0,
      totalWorkingHours: 0,
      totalSalary: 0,
    }
  );

  // Filter by local search term
  const filteredData = searchTerm
    ? data.filter(
        (item) =>
          item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : data;

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
              <span className="text-xs text-slate-400 font-semibold">{data.length} employees</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Work & Salary Report
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Period: {filters.startDate} to {filters.endDate}
            </p>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => fetchReport(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shadow-sm disabled:opacity-70"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh Data
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Total Employees" value={summary.totalEmployees} icon={<CheckCircle2 size={16} className="text-slate-600" />} />
          <StatCard title="Working Days" value={summary.totalWorkingDays} icon={<Calendar size={16} className="text-teal-600" />} color="teal" />
          <StatCard title="Working Hours" value={formatHours(summary.totalWorkingHours)} icon={<Clock size={16} className="text-blue-600" />} color="blue" />
          <StatCard title="Total Salary" value={formatCurrency(summary.totalSalary || null)} icon={<IndianRupee size={16} className="text-amber-600" />} color="amber" />
        </div>

        {/* FILTERS */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <form onSubmit={handleApplyFilters} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="relative lg:col-span-1">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Employee ID</label>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="employeeId"
                  placeholder="e.g. PMS0301"
                  className="w-full pl-10 pr-3 h-11 border border-slate-200 rounded-2xl bg-slate-50 text-xs outline-none focus:bg-white focus:border-teal-500"
                  value={filters.employeeId}
                  onChange={handleFilterChange}
                />
              </div>
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
                className="flex-1 h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors"
              >
                Apply Filters
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
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
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
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/90 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-4 px-4 font-bold">Emp ID</th>
                      <th className="py-4 px-4 font-bold">Employee Name</th>
                      <th className="py-4 px-4 font-bold text-center">Working Days</th>
                      <th className="py-4 px-4 font-bold text-center">Scheduled Days</th>
                      {/* Updated Header text to reflect both metrics */}
                      <th className="py-4 px-4 font-bold text-right">Total / Working Hours</th>
                      <th className="py-4 px-4 font-bold text-right text-slate-800">Total Salary</th>
                      <th className="py-4 px-4 font-bold text-right text-slate-800">Period Salary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-16 text-center text-slate-400">
                          <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          <p className="font-semibold text-sm">No records found for the selected period</p>
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((row) => (
                        <tr key={row.employeeId} className="hover:bg-teal-50/20 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-700">{row.employeeId}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{row.employeeName}</td>
                          <td className="py-3 px-4 text-center font-semibold text-teal-700 bg-teal-50/30">{row.totalWorkingDays}</td>
                          <td className="py-3 px-4 text-center text-slate-600">{row.totalScheduledWorkingDays}</td>
                          
                          {/* Updated Cell to show both values */}
                          <td className="py-3 px-4 text-right">
                            <div className="font-bold text-slate-800 text-sm">{formatHours(row.totalWorkingHours)} <span className="text-[10px] font-normal text-slate-500">hrs</span></div>
                            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                              Total: {formatHours(row.totalHours)} hrs
                            </div>
                          </td>
                          
                          <td className="py-3 px-4 text-right font-semibold text-slate-800">{formatCurrency(row.totalSalary)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-800">{formatCurrency(row.periodSalary)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
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
  };
  const textColors = {
    slate: 'text-slate-900',
    teal: 'text-teal-900',
    blue: 'text-blue-900',
    amber: 'text-amber-900',
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