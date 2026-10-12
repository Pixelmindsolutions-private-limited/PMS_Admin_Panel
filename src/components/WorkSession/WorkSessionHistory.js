import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Search, Filter, Download, RefreshCw, Eye,
  AlertCircle, Loader2, ChevronLeft, ChevronRight,
  Clock, Coffee, Activity, UserCheck, FileText,
  MapPin, PlayCircle, PauseCircle, StopCircle, Radio
} from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../../utils/Auth';
import * as XLSX from 'xlsx';
import SingleEmployeeLiveTrackerModal from './SingleEmployeeLiveTrackerModal';

const WorkSessionHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [liveTrackerEmpId, setLiveTrackerEmpId] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0]
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 12;

  // Employee list for filter dropdown
  const [employees, setEmployees] = useState([]);

  // Fetch employees for filter
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

  // Fetch sessions
  const fetchSessions = async () => {
    setRefreshing(true);
    try {
      let url = `${API_BASE_URL}/work-session/all-sessions?page=${currentPage}&limit=${itemsPerPage}`;
      
      if (employeeFilter) {
        url += `&employeeId=${employeeFilter}`;
      }
      if (dateRange.startDate && dateRange.endDate) {
        url += `&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      }
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.success) {
        let sessionList = data.data.sessions || [];
        
        // Enrich sessions with break breakdowns (lunch, tea, other)
        const enrichedSessions = sessionList.map(s => {
          let lunchMin = 0;
          let teaMin = 0;
          let otherMin = 0;

          if (Array.isArray(s.breaks)) {
            s.breaks.forEach(b => {
              const durMin = b.duration || (b.endTime ? (new Date(b.endTime) - new Date(b.startTime)) / 60000 : 0);
              const r = (b.reason || b.type || '').toLowerCase();
              if (r.includes('lunch')) lunchMin += durMin;
              else if (r.includes('tea')) teaMin += durMin;
              else otherMin += durMin;
            });
          }

          return {
            ...s,
            lunchDuration: Math.round(lunchMin),
            teaDuration: Math.round(teaMin),
            otherBreakDuration: Math.round(otherMin),
            delayMinutes: Math.round(s.totalIdleTime || 0)
          };
        });

        // Client search if needed
        let filtered = enrichedSessions;
        if (searchTerm) {
          filtered = enrichedSessions.filter(s => 
            s.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        setSessions(filtered);
        setTotalPages(data.data.pagination?.pages || 1);
        setTotalRecords(data.data.pagination?.total || filtered.length);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [currentPage, employeeFilter, statusFilter, dateRange]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchSessions();
  };

  const resetFilters = () => {
    setSearchTerm("");
    setEmployeeFilter("");
    setStatusFilter("");
    setDateRange({
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0]
    });
    setCurrentPage(1);
  };

  // Summary statistics for current view
  const summaryStats = useMemo(() => {
    const totalWorkMin = sessions.reduce((sum, s) => sum + (s.totalWorkDuration || 0), 0);
    const totalIdleMin = sessions.reduce((sum, s) => sum + (s.totalIdleTime || 0), 0);
    const totalLunchMin = sessions.reduce((sum, s) => sum + (s.lunchDuration || 0), 0);
    const totalTeaMin = sessions.reduce((sum, s) => sum + (s.teaDuration || 0), 0);
    const totalBreakMin = sessions.reduce((sum, s) => sum + (s.totalBreakDuration || 0), 0);

    return {
      totalWorkHours: (totalWorkMin / 60).toFixed(1),
      totalIdleHours: (totalIdleMin / 60).toFixed(1),
      totalLunchHours: (totalLunchMin / 60).toFixed(1),
      totalTeaHours: (totalTeaMin / 60).toFixed(1),
      totalBreakHours: (totalBreakMin / 60).toFixed(1)
    };
  }, [sessions]);

  const exportToExcel = () => {
    const exportData = sessions.map(session => ({
      "Employee ID": session.employeeId,
      "Employee Name": session.employeeName,
      "Date": new Date(session.date).toLocaleDateString(),
      "Start Time": session.startTime ? new Date(session.startTime).toLocaleTimeString() : "-",
      "End Time": session.endTime ? new Date(session.endTime).toLocaleTimeString() : "-",
      "Total Work (Hours)": ((session.totalWorkDuration || 0) / 60).toFixed(2),
      "Delay / Idle (Hours)": ((session.totalIdleTime || 0) / 60).toFixed(2),
      "Lunch Break (Mins)": session.lunchDuration || 0,
      "Tea Break (Mins)": session.teaDuration || 0,
      "Total Break (Hours)": ((session.totalBreakDuration || 0) / 60).toFixed(2),
      "Location": session.location || "Office",
      "Status": session.status
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Work Sessions");
    XLSX.writeFile(wb, `Work_Sessions_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return "0h 0m";
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", { 
      day: "2-digit", 
      month: "short", 
      year: "numeric" 
    });
  };

  const formatTime = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: true
    });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case "completed":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Completed</span>;
      case "working":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Working
          </span>
        );
      case "idle":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Idle
          </span>
        );
      case "on_break":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">On Break</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100/60 py-6 md:py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-teal-50 text-teal-800 border border-teal-200">
                ALL WORK SESSIONS
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                {totalRecords} records found
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-syne text-slate-900 mt-1">
              Work Session History & Logs
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Comprehensive tracking history of all employee workdays, lunch, tea, and delay time
            </p>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-emerald-300 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/60 font-bold transition-all text-xs cursor-pointer shadow-xs"
            >
              <Download size={14} />
              Export Excel
            </button>
            <button
              onClick={fetchSessions}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all text-xs cursor-pointer shadow-sm shadow-teal-600/20"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* SUMMARY STATS TILES */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-teal-100 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>TOTAL WORK TIME</span>
              <Clock size={16} className="text-teal-600" />
            </div>
            <div className="font-digital font-bold text-2xl text-[#113f36]">
              {summaryStats.totalWorkHours} hrs
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Effective work recorded</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>DELAY / IDLE TIME</span>
              <PauseCircle size={16} className="text-amber-600" />
            </div>
            <div className="font-digital font-bold text-2xl text-amber-800">
              {summaryStats.totalIdleHours} hrs
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Inactivity captured</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>LUNCH BREAKS</span>
              <span className="text-sm">🍱</span>
            </div>
            <div className="font-digital font-bold text-2xl text-orange-800">
              {summaryStats.totalLunchHours} hrs
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Lunch (1:00 - 1:45 PM)</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-teal-100 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>TEA BREAKS</span>
              <span className="text-sm">☕</span>
            </div>
            <div className="font-digital font-bold text-2xl text-teal-800">
              {summaryStats.totalTeaHours} hrs
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Tea (5:00 - 5:15 PM)</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>TOTAL BREAK TIME</span>
              <Coffee size={16} className="text-blue-600" />
            </div>
            <div className="font-digital font-bold text-2xl text-blue-800">
              {summaryStats.totalBreakHours} hrs
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">All breaks combined</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search employee or ID..."
                className="w-full pl-10 pr-3 h-11 border border-slate-200 rounded-2xl bg-slate-50 text-xs outline-none focus:bg-white focus:border-teal-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="h-11 px-3.5 border border-slate-200 rounded-2xl bg-slate-50 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
            >
              <option value="">All Employees ({employees.length})</option>
              {employees.map(emp => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.employeeName} ({emp.employeeId})
                </option>
              ))}
            </select>
            
            <select
              className="h-11 px-3.5 border border-slate-200 rounded-2xl bg-slate-50 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="working">Working</option>
              <option value="idle">Idle / Delay</option>
              <option value="on_break">On Break</option>
              <option value="completed">Completed</option>
            </select>
            
            <button
              onClick={resetFilters}
              className="h-11 px-4 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all text-xs font-bold cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-end gap-3 pt-2 border-t border-slate-100">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">From Date</label>
                <input
                  type="date"
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 text-xs"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">To Date</label>
                <input
                  type="date"
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 text-xs"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <button
              onClick={handleSearch}
              className="w-full sm:w-auto px-6 h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              Apply Filter Range
            </button>
          </div>
        </div>

        {/* SESSIONS TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50/90 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 text-left font-bold">#</th>
                  <th className="py-3.5 px-4 text-left font-bold">Employee</th>
                  <th className="py-3.5 px-4 text-left font-bold">Date</th>
                  <th className="py-3.5 px-4 text-left font-bold">Work Time</th>
                  <th className="py-3.5 px-4 text-left font-bold text-teal-800">Working Time</th>
                  <th className="py-3.5 px-4 text-left font-bold text-amber-800">Delay Time</th>
                  <th className="py-3.5 px-4 text-left font-bold">Lunch Break</th>
                  <th className="py-3.5 px-4 text-left font-bold">Tea Break</th>
                  <th className="py-3.5 px-4 text-left font-bold">Total Break</th>
                  <th className="py-3.5 px-4 text-left font-bold">Status</th>
                  <th className="py-3.5 px-4 text-center font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="p-12 text-center text-slate-400">
                      <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-sm">No work sessions found matching criteria</p>
                    </td>
                  </tr>
                ) : (
                  sessions.map((session, index) => (
                    <tr key={session._id} className="hover:bg-teal-50/20 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-400">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-bold text-slate-900">{session.employeeName}</div>
                          <div className="text-[11px] text-slate-400 font-medium">{session.employeeId}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{formatDate(session.date)}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium">
                          {formatTime(session.startTime)}
                          <span className="text-slate-400 mx-1">→</span>
                          {session.endTime ? formatTime(session.endTime) : <span className="text-emerald-600 font-bold">Active</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-teal-900 font-digital text-sm">
                        {formatDuration(session.totalWorkDuration)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-800 font-digital text-sm">
                        {formatDuration(session.totalIdleTime)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {session.lunchDuration > 0 ? (
                          <span className="bg-orange-50 text-orange-800 px-2 py-0.5 rounded font-mono-num font-bold text-[11px] border border-orange-200">
                            {session.lunchDuration}m
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {session.teaDuration > 0 ? (
                          <span className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded font-mono-num font-bold text-[11px] border border-teal-200">
                            {session.teaDuration}m
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {formatDuration(session.totalBreakDuration)}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(session.status)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Track Live Button */}
                          <button
                            onClick={() => setLiveTrackerEmpId(session.employeeId)}
                            title="Open Real-time Single Tracker"
                            className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Activity size={12} />
                            Track Live
                          </button>

                          {/* View details modal button */}
                          <button
                            onClick={() => {
                              setSelectedSession(session);
                              setShowModal(true);
                            }}
                            title="View Session Details & Logs"
                            className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
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
                  className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-all font-semibold"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-all font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* DETAILED SESSION MODAL */}
      {showModal && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl relative">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-syne font-bold text-lg text-slate-900">
                  {selectedSession.employeeName}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedSession.employeeId} • {formatDate(selectedSession.date)}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-teal-50/50 p-3 rounded-2xl border border-teal-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block mb-0.5">Working Duration</span>
                <div className="font-digital font-bold text-lg text-[#113f36]">
                  {formatDuration(selectedSession.totalWorkDuration)}
                </div>
              </div>
              <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-0.5">Delay / Idle Time</span>
                <div className="font-digital font-bold text-lg text-amber-800">
                  {formatDuration(selectedSession.totalIdleTime)}
                </div>
              </div>
            </div>

            {/* BREAK SUMMARY LOGS */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Recorded Breaks ({selectedSession.breaks?.length || 0})
              </h4>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {(!selectedSession.breaks || selectedSession.breaks.length === 0) ? (
                  <p className="text-xs text-slate-400 text-center py-2">No breaks taken during this session.</p>
                ) : (
                  selectedSession.breaks.map((brk, idx) => (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800 capitalize">
                          {brk.reason || brk.type} break
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {formatTime(brk.startTime)} → {brk.endTime ? formatTime(brk.endTime) : 'In Progress'}
                        </div>
                      </div>
                      <span className="font-mono-num font-bold text-teal-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
                        {Math.round(brk.duration || 0)} mins
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowModal(false);
                  setLiveTrackerEmpId(selectedSession.employeeId);
                }}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Activity size={14} />
                Open Live Tracker For {selectedSession.employeeName}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default WorkSessionHistory;