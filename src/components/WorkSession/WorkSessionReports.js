import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Calendar, Download, RefreshCw, Filter,
  BarChart3, PieChart, Users, Clock, Coffee, Activity,
  AlertCircle, Loader2, ChevronLeft, ChevronRight, Eye,
  PauseCircle, PlayCircle, CheckCircle2
} from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../../utils/Auth';
import * as XLSX from 'xlsx';
import SingleEmployeeLiveTrackerModal from './SingleEmployeeLiveTrackerModal';

const WorkSessionReports = () => {
  const [reportData, setReportData] = useState([]);
  const [reportError, setReportError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'detailed'
  const [expandedEmployeeId, setExpandedEmployeeId] = useState(null);
  const [liveTrackerEmpId, setLiveTrackerEmpId] = useState(null);
  
  // Filters
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0]
  });
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [employees, setEmployees] = useState([]);

  // Pagination for summary table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch employees for dropdown filter
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/staff/all`, {
          headers: getAuthHeaders()
        });
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setEmployees(data.data);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch admin sessions and aggregate them into report rows.
  const fetchReport = async () => {
    setRefreshing(true);
    setReportError("");
    try {
      let url = `${API_BASE_URL}/work-session/all-sessions?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=500`;
      if (employeeFilter) {
        url += `&employeeId=${employeeFilter}`;
      }
      const response = await fetch(url, { headers: getAuthHeaders() });
      const allData = await response.json();

      if (!response.ok || !allData.success) {
        throw new Error(allData.message || "Failed to fetch work session reports");
      }
      if (!Array.isArray(allData.data?.sessions)) {
        throw new Error("Work session report response has an invalid format");
      }

      const sessions = allData.data.sessions;
      const map = {};

      sessions.forEach(s => {
        const id = s.employeeId;
        if (!map[id]) {
          map[id] = {
            employeeId: id,
            employeeName: s.employeeName || 'Unknown',
            totalSessions: 0,
            totalWorkMinutes: 0,
            totalBreakMinutes: 0,
            totalIdleMinutes: 0,
            lunchBreakMinutes: 0,
            teaBreakMinutes: 0,
            otherBreakMinutes: 0,
            days: []
          };
        }

        let lunchM = 0;
        let teaM = 0;
        let otherM = 0;

        if (Array.isArray(s.breaks)) {
          s.breaks.forEach(b => {
            const dur = b.duration || (b.endTime ? (new Date(b.endTime) - new Date(b.startTime)) / 60000 : 0);
            const r = (b.reason || b.type || '').toLowerCase();
            if (r.includes('lunch')) lunchM += dur;
            else if (r.includes('tea')) teaM += dur;
            else otherM += dur;
          });
        }

        const workMin = s.totalWorkDuration || 0;
        const breakMin = s.totalBreakDuration || 0;
        const idleMin = s.totalIdleTime || 0;

        map[id].totalSessions += 1;
        map[id].totalWorkMinutes += workMin;
        map[id].totalBreakMinutes += breakMin;
        map[id].totalIdleMinutes += idleMin;
        map[id].lunchBreakMinutes += lunchM;
        map[id].teaBreakMinutes += teaM;
        map[id].otherBreakMinutes += otherM;

        map[id].days.push({
          sessionId: s._id,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          status: s.status,
          workMinutes: Math.round(workMin),
          workHours: (workMin / 60).toFixed(2),
          delayMinutes: Math.round(idleMin),
          delayHours: (idleMin / 60).toFixed(2),
          lunchMinutes: Math.round(lunchM),
          teaMinutes: Math.round(teaM),
          totalBreakMinutes: Math.round(breakMin),
          totalBreakHours: (breakMin / 60).toFixed(2),
          productivity: (workMin + breakMin) > 0 ? Math.round((workMin / (workMin + breakMin)) * 100) : 0
        });
      });

      const fetchedReport = Object.values(map).map(emp => {
        const totalWorkHours = (emp.totalWorkMinutes / 60).toFixed(2);
        const totalBreakHours = (emp.totalBreakMinutes / 60).toFixed(2);
        const totalIdleHours = (emp.totalIdleMinutes / 60).toFixed(2);
        const lunchBreakHours = (emp.lunchBreakMinutes / 60).toFixed(2);
        const teaBreakHours = (emp.teaBreakMinutes / 60).toFixed(2);
        const totalMinutes = emp.totalWorkMinutes + emp.totalBreakMinutes;
        const productivity = totalMinutes > 0 ? Math.round((emp.totalWorkMinutes / totalMinutes) * 100) : 0;

        return {
          ...emp,
          totalWorkHours,
          totalBreakHours,
          totalIdleHours,
          lunchBreakHours,
          teaBreakHours,
          productivity
        };
      });

      setReportData(fetchedReport);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setReportError(error.message || "Failed to fetch work session reports");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dateRange, employeeFilter]);

  // Quick preset filters
  const setQuickRange = (days) => {
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(new Date().setDate(new Date().getDate() - days)).toISOString().split("T")[0];
    setDateRange({ startDate: start, endDate: end });
    setCurrentPage(1);
  };

  // High-level summary totals
  const summary = useMemo(() => {
    const totalEmployees = reportData.length;
    const totalWorkHours = reportData.reduce((sum, emp) => sum + (parseFloat(emp.totalWorkHours) || (emp.totalWorkMinutes || 0) / 60), 0);
    const totalBreakHours = reportData.reduce((sum, emp) => sum + (parseFloat(emp.totalBreakHours) || (emp.totalBreakMinutes || 0) / 60), 0);
    const totalIdleHours = reportData.reduce((sum, emp) => sum + (parseFloat(emp.totalIdleHours) || (emp.totalIdleMinutes || 0) / 60), 0);
    const totalLunchHours = reportData.reduce((sum, emp) => sum + (parseFloat(emp.lunchBreakHours) || (emp.lunchBreakMinutes || 0) / 60), 0);
    const totalTeaHours = reportData.reduce((sum, emp) => sum + (parseFloat(emp.teaBreakHours) || (emp.teaBreakMinutes || 0) / 60), 0);
    const totalDaysWorked = reportData.reduce((sum, emp) => sum + (emp.days?.length || emp.totalSessions || 0), 0);

    const avgProductivity = totalEmployees > 0
      ? Math.round(reportData.reduce((sum, emp) => sum + (emp.productivity || 0), 0) / totalEmployees)
      : 0;

    return {
      totalEmployees,
      totalWorkHours: totalWorkHours.toFixed(1),
      totalBreakHours: totalBreakHours.toFixed(1),
      totalIdleHours: totalIdleHours.toFixed(1),
      totalLunchHours: totalLunchHours.toFixed(1),
      totalTeaHours: totalTeaHours.toFixed(1),
      totalDaysWorked,
      avgProductivity
    };
  }, [reportData]);

  // Export comprehensive report to Excel
  const exportToExcel = () => {
    // 1. Employee-level sheet
    const summarySheetData = reportData.map(emp => ({
      "Employee ID": emp.employeeId,
      "Employee Name": emp.employeeName,
      "Days / Sessions": emp.days?.length || emp.totalSessions || 0,
      "Total Working (Hours)": emp.totalWorkHours,
      "Delay / Idle Time (Hours)": emp.totalIdleHours,
      "Lunch Break (Hours)": emp.lunchBreakHours,
      "Tea Break (Hours)": emp.teaBreakHours,
      "Total Break (Hours)": emp.totalBreakHours,
      "Productivity (%)": `${emp.productivity}%`
    }));

    // 2. Day-level detailed sheet
    const detailedSheetData = [];
    reportData.forEach(emp => {
      (emp.days || []).forEach(d => {
        detailedSheetData.push({
          "Employee ID": emp.employeeId,
          "Employee Name": emp.employeeName,
          "Date": d.date ? new Date(d.date).toLocaleDateString() : "-",
          "Start Time": d.startTime ? new Date(d.startTime).toLocaleTimeString() : "-",
          "End Time": d.endTime ? new Date(d.endTime).toLocaleTimeString() : "-",
          "Work Duration (Hours)": d.workHours,
          "Delay / Idle (Hours)": d.delayHours,
          "Lunch (Mins)": d.lunchMinutes,
          "Tea (Mins)": d.teaMinutes,
          "Total Break (Hours)": d.totalBreakHours,
          "Productivity (%)": `${d.productivity}%`
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(summarySheetData);
    XLSX.utils.book_append_sheet(wb, ws1, "Employee Summary");

    if (detailedSheetData.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(detailedSheetData);
      XLSX.utils.book_append_sheet(wb, ws2, "Day-by-Day Sessions");
    }

    XLSX.writeFile(wb, `PMS_Work_Session_Report_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`);
  };

  // Paginated items
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return reportData.slice(startIndex, startIndex + itemsPerPage);
  }, [reportData, currentPage]);

  const totalPages = Math.ceil(reportData.length / itemsPerPage) || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100/60 py-6 md:py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-teal-50 text-teal-800 border border-teal-200">
                SESSION REPORTS & ANALYTICS
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {dateRange.startDate} → {dateRange.endDate}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-syne text-slate-900 mt-1">
              Work Session Reports
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Comprehensive report of working hours, delay/idle time, lunch and tea breaks, and productivity
            </p>
          </div>

          {reportError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} />
              <span>{reportError}</span>
            </div>
          )}

          <div className="flex gap-2.5">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-emerald-300 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/60 font-bold transition-all text-xs cursor-pointer shadow-xs"
            >
              <Download size={14} />
              Export Full Report (.xlsx)
            </button>
            <button
              onClick={fetchReport}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all text-xs cursor-pointer shadow-sm shadow-teal-600/20"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* TOP SUMMARY KPI TILES */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-teal-100 shadow-xs">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
              EMPLOYEES
            </span>
            <div className="font-digital font-bold text-2xl text-slate-800">
              {summary.totalEmployees}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">{summary.totalDaysWorked} total sessions</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs">
            <span className="text-teal-700 text-[10px] font-bold uppercase tracking-wider block mb-1">
              WORKING TIME
            </span>
            <div className="font-digital font-bold text-2xl text-[#113f36]">
              {summary.totalWorkHours}h
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Total productive time</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs">
            <span className="text-amber-700 text-[10px] font-bold uppercase tracking-wider block mb-1">
              DELAY / IDLE
            </span>
            <div className="font-digital font-bold text-2xl text-amber-800">
              {summary.totalIdleHours}h
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Total inactivity</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-xs">
            <span className="text-orange-700 text-[10px] font-bold uppercase tracking-wider block mb-1">
              🍱 LUNCH BREAKS
            </span>
            <div className="font-digital font-bold text-2xl text-orange-800">
              {summary.totalLunchHours}h
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">1:00 - 1:45 PM standard</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-teal-100 shadow-xs">
            <span className="text-teal-700 text-[10px] font-bold uppercase tracking-wider block mb-1">
              ☕ TEA BREAKS
            </span>
            <div className="font-digital font-bold text-2xl text-teal-800">
              {summary.totalTeaHours}h
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">5:00 - 5:15 PM standard</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-xs">
            <span className="text-blue-700 text-[10px] font-bold uppercase tracking-wider block mb-1">
              PRODUCTIVITY
            </span>
            <div className="font-digital font-bold text-2xl text-blue-800">
              {summary.avgProductivity}%
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Average team score</p>
          </div>
        </div>

        {/* FILTERS & DATE PRESET BAR */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setQuickRange(0)}
                className="px-3 py-1.5 rounded-xl hover:bg-white transition-all cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setQuickRange(7)}
                className="px-3 py-1.5 rounded-xl hover:bg-white transition-all cursor-pointer"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => setQuickRange(30)}
                className="px-3 py-1.5 rounded-xl hover:bg-white transition-all cursor-pointer"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => setQuickRange(90)}
                className="px-3 py-1.5 rounded-xl hover:bg-white transition-all cursor-pointer"
              >
                Last 90 Days
              </button>
            </div>

            {/* Single Employee Filter */}
            <div className="min-w-[220px]">
              <select
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                value={employeeFilter}
                onChange={(e) => {
                  setEmployeeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Employees ({employees.length})</option>
                {employees.map(emp => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.employeeName} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Start Date</label>
              <input
                type="date"
                className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 text-xs"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">End Date</label>
              <input
                type="date"
                className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 text-xs"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* REPORT TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-syne font-bold text-sm text-slate-800">
              Employee Performance Breakdown ({reportData.length} Employees)
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              Calculated dynamically
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50/90 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 text-left font-bold">#</th>
                  <th className="py-3.5 px-4 text-left font-bold">Employee</th>
                  <th className="py-3.5 px-4 text-center font-bold">Days Worked</th>
                  <th className="py-3.5 px-4 text-left font-bold text-teal-800">Working Time (Hrs)</th>
                  <th className="py-3.5 px-4 text-left font-bold text-amber-800">Delay Time (Hrs)</th>
                  <th className="py-3.5 px-4 text-left font-bold">Lunch Break</th>
                  <th className="py-3.5 px-4 text-left font-bold">Tea Break</th>
                  <th className="py-3.5 px-4 text-left font-bold">Total Break</th>
                  <th className="py-3.5 px-left font-bold text-left">Productivity</th>
                  <th className="py-3.5 px-4 text-center font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="p-12 text-center text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-2" />
                      <p>Calculating session report data...</p>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="p-12 text-center text-slate-400">
                      <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-sm">No report records found for this period</p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((emp, index) => {
                    const isExpanded = expandedEmployeeId === emp.employeeId;

                    return (
                      <React.Fragment key={emp.employeeId}>
                        <tr className="hover:bg-teal-50/20 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-400">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <div>
                              <div className="font-bold text-slate-900">{emp.employeeName}</div>
                              <div className="text-[11px] text-slate-400 font-medium">{emp.employeeId}</div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                            {emp.days?.length || emp.totalSessions || 0}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-teal-900 font-digital text-sm">
                            {emp.totalWorkHours}h
                          </td>
                          <td className="py-3.5 px-4 font-bold text-amber-800 font-digital text-sm">
                            {emp.totalIdleHours}h
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-orange-800">
                            {emp.lunchBreakHours}h
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-teal-800">
                            {emp.teaBreakHours}h
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {emp.totalBreakHours}h
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    emp.productivity >= 80 ? 'bg-emerald-500' : emp.productivity >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${Math.min(100, emp.productivity)}%` }}
                                />
                              </div>
                              <span className="font-mono-num font-bold text-slate-800 text-[11px]">
                                {emp.productivity}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Open Live Tracker */}
                              <button
                                onClick={() => setLiveTrackerEmpId(emp.employeeId)}
                                title="Open Single Employee Live Tracker"
                                className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Activity size={12} />
                                Live
                              </button>

                              {/* Toggle day-by-day logs */}
                              {emp.days && emp.days.length > 0 && (
                                <button
                                  onClick={() => setExpandedEmployeeId(isExpanded ? null : emp.employeeId)}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-all cursor-pointer"
                                >
                                  {isExpanded ? 'Hide' : 'Logs'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* EXPANDED DAY-BY-DAY ROW */}
                        {isExpanded && emp.days && (
                          <tr className="bg-slate-50/80">
                            <td colSpan="10" className="p-4">
                              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                                <h4 className="font-syne font-bold text-xs text-slate-800 mb-3 flex items-center gap-1.5">
                                  <span>📅</span> Daily Session Logs for {emp.employeeName} ({emp.days.length} Days)
                                </h4>
                                <div className="max-h-60 overflow-y-auto">
                                  <table className="w-full text-[11px]">
                                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                      <tr>
                                        <th className="p-2 text-left">Date</th>
                                        <th className="p-2 text-left">Start Time</th>
                                        <th className="p-2 text-left">End Time</th>
                                        <th className="p-2 text-left">Working Time</th>
                                        <th className="p-2 text-left">Delay / Idle</th>
                                        <th className="p-2 text-left">Lunch</th>
                                        <th className="p-2 text-left">Tea</th>
                                        <th className="p-2 text-left">Total Break</th>
                                        <th className="p-2 text-left">Productivity</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {emp.days.map((d, dIdx) => (
                                        <tr key={dIdx} className="hover:bg-slate-50">
                                          <td className="p-2 font-medium text-slate-800">
                                            {d.date ? new Date(d.date).toLocaleDateString() : '-'}
                                          </td>
                                          <td className="p-2 text-slate-600">
                                            {d.startTime ? new Date(d.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                          </td>
                                          <td className="p-2 text-slate-600">
                                            {d.endTime ? new Date(d.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                                          </td>
                                          <td className="p-2 font-bold text-teal-900 font-digital">{d.workHours}h</td>
                                          <td className="p-2 font-bold text-amber-800 font-digital">{d.delayHours}h</td>
                                          <td className="p-2 font-semibold text-orange-800">{d.lunchMinutes}m</td>
                                          <td className="p-2 font-semibold text-teal-800">{d.teaMinutes}m</td>
                                          <td className="p-2 text-slate-700">{d.totalBreakHours}h</td>
                                          <td className="p-2 font-bold text-blue-700">{d.productivity}%</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-all font-semibold cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-all font-semibold cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* SINGLE EMPLOYEE LIVE TRACKER MODAL */}
      {liveTrackerEmpId && (
        <SingleEmployeeLiveTrackerModal
          employeeId={liveTrackerEmpId}
          allEmployees={employees}
          onClose={() => setLiveTrackerEmpId(null)}
          onSelectEmployee={(newEmpId) => setLiveTrackerEmpId(newEmpId)}
        />
      )}

    </div>
  );
};

export default WorkSessionReports;