// WorkSessionLive.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users, UserCheck, Coffee, Clock, TrendingUp, Calendar,
  Search, Filter, RefreshCw, Eye, ChevronRight,
  Activity, PieChart, BarChart3, AlertCircle, Loader2,
  PlayCircle, PauseCircle, StopCircle, Coffee as CoffeeIcon,
  MapPin, Radio, LayoutGrid, User, ArrowUpRight
} from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../../utils/Auth';
import SingleEmployeeLiveTrackerModal from './SingleEmployeeLiveTrackerModal';

const WorkSessionLive = () => {
  const { employeeId: paramEmployeeId } = useParams();
  const navigate = useNavigate();

  const [activeEmployees, setActiveEmployees] = useState([]);
  const [allStaffList, setAllStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(10); // in seconds
  const [selectedTrackerEmployee, setSelectedTrackerEmployee] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock ticker for live header time
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch all staff for employee search / tracker selection
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/staff/all`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setAllStaffList(data.data);
        }
      } catch (err) {
        console.error('Error fetching staff list:', err);
      }
    };
    fetchStaff();
  }, []);

  // Fetch active sessions from server
  const fetchActiveEmployees = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      // Fetch active employees
      const res = await fetch(`${API_BASE_URL}/work-session/active-employees`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();

      let employees = [];
      if (data.success && Array.isArray(data.data)) {
        employees = data.data;
      }

      // Also fetch all-sessions for today to include any employees who already completed work today
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const allSessRes = await fetch(`${API_BASE_URL}/work-session/all-sessions?limit=50&startDate=${todayStr}&endDate=${todayStr}`, {
          headers: getAuthHeaders()
        });
        const allSessData = await allSessRes.json();
        if (allSessData.success && Array.isArray(allSessData.data?.sessions)) {
          const sessionsToday = allSessData.data.sessions;
          
          // Merge completed or existing sessions if not in active list
          sessionsToday.forEach(sess => {
            const exists = employees.find(e => String(e.employeeId).toLowerCase() === String(sess.employeeId).toLowerCase());
            if (!exists) {
              employees.push({
                ...sess,
                sessionId: sess._id,
                currentWorkDuration: sess.totalWorkDuration || 0,
                currentWorkHours: ((sess.totalWorkDuration || 0) / 60).toFixed(2),
                delaySeconds: Math.round((sess.totalIdleTime || 0) * 60),
                workingSeconds: Math.round((sess.totalWorkDuration || 0) * 60)
              });
            }
          });
        }
      } catch (_) {}

      // Calculate break breakdown (lunch, tea, delay) on each employee
      const enriched = employees.map(emp => {
        let lunchSec = emp.lunchTakenSec ?? (emp.lunchDuration ? emp.lunchDuration * 60 : 0);
        let teaSec = emp.teaTakenSec ?? (emp.teaDuration ? emp.teaDuration * 60 : 0);
        let otherSec = emp.otherBreakSec ?? 0;

        if (!emp.lunchTakenSec && !emp.teaTakenSec && Array.isArray(emp.breaks)) {
          emp.breaks.forEach(b => {
            const durSec = b.duration
              ? b.duration * 60
              : (b.startTime
                ? Math.max(0, Math.floor(((b.endTime ? new Date(b.endTime) : new Date()) - new Date(b.startTime)) / 1000))
                : 0);
            const r = String(b.reason || b.type || '').toLowerCase();
            if (r.includes('lunch')) lunchSec += durSec;
            else if (r.includes('tea') || r.includes('refresh')) teaSec += durSec;
            else otherSec += durSec;
          });
        }

        const workMin = emp.currentWorkDuration ?? emp.totalWorkDuration ?? 0;
        const workSec = emp.workingSeconds ?? Math.round(workMin * 60);
        const idleMin = emp.totalIdleTime ?? 0;
        const delaySec = emp.delaySeconds ?? Math.round(idleMin * 60);

        return {
          ...emp,
          workingSeconds: workSec,
          delaySeconds: delaySec,
          lunchTakenSec: Math.round(lunchSec),
          teaTakenSec: Math.round(teaSec),
          otherBreakSec: Math.round(otherSec),
          location: emp.location || 'Office'
        };
      });

      setActiveEmployees(enriched);

      // If URL param exists, open that employee's tracker modal
      if (paramEmployeeId) {
        const found = enriched.find(e => String(e.employeeId).toLowerCase() === String(paramEmployeeId).toLowerCase())
          || { employeeId: paramEmployeeId };
        setSelectedTrackerEmployee(found);
      }

    } catch (error) {
      console.error('Error fetching active employees:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch and auto-refresh interval
  useEffect(() => {
    fetchActiveEmployees(false);
    const interval = setInterval(() => {
      fetchActiveEmployees(true);
    }, (autoRefreshInterval || 10) * 1000);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, paramEmployeeId]);

  // Live second increment for working, idle, lunch, tea & other breaks
  useEffect(() => {
    const ticker = setInterval(() => {
      setActiveEmployees(prevList =>
        prevList.map(emp => {
          const status = String(emp.status || '').toLowerCase();
          const activeType = String(
            emp.activeBreak?.type ||
            emp.activeBreak?.reason ||
            emp.breakInfo?.breakType ||
            ''
          ).toLowerCase();

          const isLunch = status === 'lunch_break' || ((status === 'on_break' || status === 'break') && activeType.includes('lunch')) || activeType.includes('lunch');
          const isTea = status === 'tea_break' || ((status === 'on_break' || status === 'break') && activeType.includes('tea')) || activeType.includes('tea');
          const isOnBreak = status === 'on_break' || status === 'lunch_break' || status === 'tea_break' || status === 'break';

          if (status === 'working') {
            return {
              ...emp,
              workingSeconds: (emp.workingSeconds || 0) + 1,
              currentWorkDuration: ((emp.workingSeconds || 0) + 1) / 60
            };
          } else if (status === 'idle') {
            return {
              ...emp,
              delaySeconds: (emp.delaySeconds || 0) + 1
            };
          } else if (isOnBreak) {
            return {
              ...emp,
              delaySeconds: (emp.delaySeconds || 0) + 1,
              lunchTakenSec: isLunch ? (emp.lunchTakenSec || 0) + 1 : (emp.lunchTakenSec || 0),
              teaTakenSec: isTea ? (emp.teaTakenSec || 0) + 1 : (emp.teaTakenSec || 0),
              otherBreakSec: (!isLunch && !isTea) ? (emp.otherBreakSec || 0) + 1 : (emp.otherBreakSec || 0)
            };
          }
          return emp;
        })
      );
    }, 1000);

    return () => clearInterval(ticker);
  }, []);

  // Format helpers
  const formatHMS = (totalSeconds) => {
    const s = Math.max(0, Math.floor(totalSeconds || 0));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formatMS = (totalSeconds) => {
    const s = Math.max(0, Math.floor(totalSeconds || 0));
    const minutes = Math.floor(s / 60);
    const seconds = s % 60;
    return `${minutes}m ${seconds}s`;
  };

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return activeEmployees.filter(emp => {
      const matchesSearch =
        emp.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [activeEmployees, searchTerm, statusFilter]);

  // Stats KPI counts
  const stats = useMemo(() => {
    const working = activeEmployees.filter(e => e.status === 'working').length;
    const idle = activeEmployees.filter(e => e.status === 'idle').length;
    const onBreak = activeEmployees.filter(e => ['on_break', 'lunch_break', 'tea_break'].includes(e.status)).length;
    const completed = activeEmployees.filter(e => e.status === 'completed').length;
    return {
      total: activeEmployees.length,
      working,
      idle,
      onBreak,
      completed
    };
  }, [activeEmployees]);

  const getStatusBadge = (status, breakInfo) => {
    switch (status) {
      case 'working':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Working
          </span>
        );
      case 'idle':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Idle / Delay
          </span>
        );
      case 'lunch_break':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Lunch Break
          </span>
        );
      case 'tea_break':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            Tea Break
          </span>
        );
      case 'on_break':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            {breakInfo?.breakType ? `On ${breakInfo.breakType}` : 'On Break'}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Work Ended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            Inactive
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100/60 py-6 md:py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-teal-50 text-teal-800 border border-teal-200 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                LIVE WORK SESSION TRACKING
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-syne text-slate-900 mt-1">
              Live Employee Tracking
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Real-time monitoring of working hours, delay/idle time, lunch and tea breaks
            </p>
          </div>

          {/* Quick Header Actions: Refresh & Single Employee Tracker Select */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Direct Employee Select to open live tracker */}
            <div className="relative min-w-[220px]">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const emp = activeEmployees.find(x => x.employeeId === e.target.value)
                      || allStaffList.find(x => x.employeeId === e.target.value)
                      || { employeeId: e.target.value };
                    setSelectedTrackerEmployee(emp);
                  }
                }}
                defaultValue=""
                className="w-full pl-3 pr-8 py-2.5 text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-teal-200 text-teal-900 rounded-2xl outline-none cursor-pointer transition-all shadow-xs"
              >
                <option value="" disabled>🎯 Track Single Employee Live...</option>
                {allStaffList.map(st => {
                  const isActive = activeEmployees.some(a => a.employeeId === st.employeeId);
                  return (
                    <option key={st.employeeId} value={st.employeeId}>
                      {isActive ? '🟢' : '⚪'} {st.employeeName} ({st.employeeId})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Auto refresh dropdown */}
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="py-2.5 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl outline-none cursor-pointer"
            >
              <option value={5}>Sync 5s</option>
              <option value={10}>Sync 10s</option>
              <option value={30}>Sync 30s</option>
            </select>

            {/* Manual refresh button */}
            <button
              onClick={() => fetchActiveEmployees(false)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatCard
            title="Total Sessions"
            value={stats.total}
            subtitle="Today's punch logs"
            icon={<Users size={18} className="text-teal-600" />}
            bgColor="bg-teal-50"
            borderColor="border-teal-100"
          />
          <StatCard
            title="Working Now"
            value={stats.working}
            subtitle="Active on keyboard/mouse"
            icon={<PlayCircle size={18} className="text-emerald-600" />}
            bgColor="bg-emerald-50"
            borderColor="border-emerald-100"
            pulseColor="bg-emerald-500"
          />
          <StatCard
            title="Idle / Delay"
            value={stats.idle}
            subtitle="Inactivity detected"
            icon={<PauseCircle size={18} className="text-amber-600" />}
            bgColor="bg-amber-50"
            borderColor="border-amber-100"
            pulseColor="bg-amber-500"
          />
          <StatCard
            title="On Break"
            value={stats.onBreak}
            subtitle="Lunch / Tea / Other"
            icon={<Coffee size={18} className="text-blue-600" />}
            bgColor="bg-blue-50"
            borderColor="border-blue-100"
          />
          <StatCard
            title="Work Ended"
            value={stats.completed}
            subtitle="Shift finished today"
            icon={<StopCircle size={18} className="text-slate-600" />}
            bgColor="bg-slate-100"
            borderColor="border-slate-200"
          />
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee by name, ID, or designation..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Filter size={14} className="text-slate-400" />
            <select
              className="py-2.5 px-3.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses ({activeEmployees.length})</option>
              <option value="working">Working Only ({stats.working})</option>
              <option value="idle">Idle / Delay Only ({stats.idle})</option>
              <option value="on_break">On Break Only ({stats.onBreak})</option>
              <option value="completed">Work Completed ({stats.completed})</option>
            </select>
          </div>
        </div>

        {/* EMPLOYEES GRID */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 border border-slate-200 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto mb-3" />
            <p className="text-slate-600 font-semibold text-sm">Connecting to live tracking server...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 border border-slate-200 text-center shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Users size={32} />
            </div>
            <h3 className="font-syne font-bold text-slate-800 text-base">No active employees found</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search query or filter options.'
                : 'No employees have punched in or started work sessions today yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredEmployees.map((emp) => {
              const isWorking = emp.status === 'working';
              const isIdle = emp.status === 'idle';
              const activeType = String(
                emp.activeBreak?.type ||
                emp.activeBreak?.reason ||
                emp.breakInfo?.breakType ||
                ''
              ).toLowerCase();
              const isLunchActive = emp.status === 'lunch_break' || ((emp.status === 'on_break' || emp.status === 'break') && activeType.includes('lunch')) || activeType.includes('lunch');
              const isTeaActive = emp.status === 'tea_break' || ((emp.status === 'on_break' || emp.status === 'break') && activeType.includes('tea')) || activeType.includes('tea');
              const isOnBreak = emp.status === 'on_break' || emp.status === 'lunch_break' || emp.status === 'tea_break' || emp.status === 'break';

              return (
                <div
                  key={emp.employeeId}
                  className={`bg-white rounded-3xl border p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                    isWorking
                      ? 'border-emerald-200 hover:border-emerald-400'
                      : isIdle
                      ? 'border-amber-200 hover:border-amber-400 bg-amber-50/10'
                      : isOnBreak
                      ? 'border-blue-200 hover:border-blue-400'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header: Avatar, Name, Status */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {emp.profileImage ? (
                          <img
                            src={emp.profileImage}
                            alt={emp.employeeName}
                            className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0 font-syne">
                            {emp.employeeName?.charAt(0) || 'E'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-syne font-bold text-slate-900 text-sm truncate leading-snug">
                            {emp.employeeName}
                          </h3>
                          <p className="text-[11px] text-slate-400 font-semibold truncate">
                            {emp.employeeId} • <span className="text-slate-500">{emp.role || 'Staff'}</span>
                          </p>
                        </div>
                      </div>

                      {getStatusBadge(emp.status, emp.breakInfo)}
                    </div>

                    {/* LOCATION & START TIME ROW */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50/80 rounded-xl px-3 py-1.5 mb-3 border border-slate-100">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <MapPin size={12} className="text-teal-600" />
                        {emp.location || 'Office'}
                      </span>
                      <span>
                        Started: <strong className="text-slate-800">{emp.startTime ? new Date(emp.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</strong>
                      </span>
                    </div>

                    {/* DUAL COUNTER BOXES: WORKING TIME & DELAY TIME (ORBITRON STYLE) */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {/* Working Time */}
                      <div className="bg-gradient-to-b from-teal-50/50 to-white border border-teal-200 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block mb-0.5">
                          Working Time
                        </span>
                        <div className="font-digital font-bold text-lg text-[#113f36] tabular-nums">
                          {formatHMS(emp.workingSeconds)}
                        </div>
                      </div>

                      {/* Delay / Idle Time */}
                      <div className={`border rounded-xl p-2.5 text-center ${
                        isIdle ? 'bg-amber-50 border-amber-300' : 'bg-slate-50/50 border-slate-200'
                      }`}>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                          Delay Time
                        </span>
                        <div className={`font-digital font-bold text-lg tabular-nums ${isIdle ? 'text-amber-800' : 'text-slate-700'}`}>
                          {formatHMS(emp.delaySeconds)}
                        </div>
                      </div>
                    </div>

                    {/* BREAK SUMMARY PREVIEW (LUNCH & TEA BREAKS) */}
                    <div className="bg-slate-50/60 rounded-xl p-2.5 border border-slate-100 space-y-1.5 text-xs mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 flex items-center gap-1 text-[11px]">
                          <span>🍱</span> Lunch Break:
                        </span>
                        {isLunchActive ? (
                          <span className="font-mono-num font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[10px] border border-amber-300 animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                            Active: {formatMS(emp.lunchTakenSec)}
                          </span>
                        ) : emp.lunchTakenSec > 0 ? (
                          <span className="font-mono-num font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                            Taken: {formatMS(emp.lunchTakenSec)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Standard (45m)</span>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 flex items-center gap-1 text-[11px]">
                          <span>☕</span> Tea Break:
                        </span>
                        {isTeaActive ? (
                          <span className="font-mono-num font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded text-[10px] border border-teal-300 animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-ping" />
                            Active: {formatMS(emp.teaTakenSec)}
                          </span>
                        ) : emp.teaTakenSec > 0 ? (
                          <span className="font-mono-num font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-[10px] border border-teal-200">
                            Taken: {formatMS(emp.teaTakenSec)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Standard (15m)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM ACTION BUTTON: OPEN FULL SINGLE TRACKER */}
                  <button
                    onClick={() => setSelectedTrackerEmployee(emp)}
                    className="w-full mt-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    <Activity size={14} />
                    Track Single Employee Live 🚀
                  </button>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* SINGLE EMPLOYEE LIVE TRACKER MODAL (REPLICATES CLIENT DESKTOP WIDGET) */}
      {selectedTrackerEmployee && (
        <SingleEmployeeLiveTrackerModal
          employeeId={selectedTrackerEmployee.employeeId}
          initialData={selectedTrackerEmployee}
          allEmployees={allStaffList}
          onClose={() => {
            setSelectedTrackerEmployee(null);
            if (paramEmployeeId) navigate('/work-session-live');
          }}
          onSelectEmployee={(newEmpId) => {
            const found = activeEmployees.find(e => e.employeeId === newEmpId)
              || allStaffList.find(e => e.employeeId === newEmpId)
              || { employeeId: newEmpId };
            setSelectedTrackerEmployee(found);
          }}
        />
      )}
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon, bgColor, borderColor, pulseColor }) => (
  <div className={`bg-white rounded-3xl p-4 border ${borderColor} shadow-xs relative overflow-hidden`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
      <div className={`p-2 rounded-2xl ${bgColor} flex items-center justify-center`}>
        {icon}
      </div>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl sm:text-3xl font-extrabold font-syne text-slate-900">{value}</span>
      {pulseColor && <span className={`w-2 h-2 rounded-full ${pulseColor} animate-pulse`} />}
    </div>
    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{subtitle}</p>
  </div>
);

export default WorkSessionLive;