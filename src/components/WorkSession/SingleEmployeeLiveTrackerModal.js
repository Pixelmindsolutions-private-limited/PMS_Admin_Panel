import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FiClock, FiMapPin, FiCoffee, FiUser, FiX, FiMinus, FiMaximize2,
  FiActivity, FiAlertCircle, FiCheckCircle, FiChevronDown, FiCalendar,
  FiRefreshCw, FiExternalLink, FiPause, FiPlay
} from 'react-icons/fi';
import { getAuthHeaders, API_BASE_URL } from '../../utils/Auth';

const SingleEmployeeLiveTrackerModal = ({
  employeeId,
  initialData = null,
  allEmployees = [],
  onClose,
  onSelectEmployee
}) => {
  const [currentEmpId, setCurrentEmpId] = useState(employeeId || initialData?.employeeId || '');
  const [sessionData, setSessionData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('tracker');

  // Dynamic live second counters
  const [liveWorkingSeconds, setLiveWorkingSeconds] = useState(0);
  const [liveDelaySeconds, setLiveDelaySeconds] = useState(0);
  const [liveLunchSeconds, setLiveLunchSeconds] = useState(0);
  const [liveTeaSeconds, setLiveTeaSeconds] = useState(0);
  const [liveOtherBreakSeconds, setLiveOtherBreakSeconds] = useState(0);

  // Refs
  const pollIntervalRef = useRef(null);
  const requestIdRef = useRef(0); // ✅ prevent stale responses
  const isMountedRef = useRef(true);

  // Sync currentEmpId prop changes
  useEffect(() => {
    if (employeeId && employeeId !== currentEmpId) {
      setCurrentEmpId(employeeId);
    }
  }, [employeeId]);

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ✅ Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // ✅ NEW: Fetch from /api/staff/tracking/:employeeId
  const fetchEmployeeData = async (empId, isPoll = false) => {
    if (!empId) return;

    const thisRequestId = ++requestIdRef.current;
    if (!isPoll) setRefreshing(true);

    try {
      const url = `${API_BASE_URL}/staff/employee-sessions/${empId}`;
      const res = await fetch(url, { headers: getAuthHeaders() });

      // ✅ Prevent stale response from overwriting newer selection
      if (thisRequestId !== requestIdRef.current) return;
      if (!isMountedRef.current) return;

      if (res.status === 401) throw new Error('Unauthorized. Please login again.');
      if (res.status === 404) {
        // No session found — reset to empty state
        setSessionData(null);
        setLiveWorkingSeconds(0);
        setLiveDelaySeconds(0);
        setError(null);
        return;
      }
      if (res.status === 500) throw new Error('Server error. Please try again.');

      const data = await res.json();

      if (data.success && data.data) {
        const fetched = data.data;

        // ✅ Parse formatted time strings "HH:MM:SS" → seconds
        const parseHMS = (str) => {
          if (!str || typeof str !== 'string') return null;
          const parts = str.split(':').map(n => parseInt(n, 10) || 0);
          if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
          if (parts.length === 2) return parts[0] * 60 + parts[1];
          return null;
        };

        let workSec = parseHMS(fetched.workingTimeFormatted);
        if (workSec === null) {
          workSec = Math.round((fetched.totalWorkDuration || 0) * 60);
        }

        let delaySec = parseHMS(fetched.delayTimeFormatted);
        if (delaySec === null) {
          delaySec = Math.round((fetched.totalIdleTime || 0) * 60);
        }

        setSessionData(fetched);
        setLiveWorkingSeconds(workSec);
        setLiveDelaySeconds(delaySec);
        setLiveLunchSeconds(Math.round((fetched.lunchDuration || 0) * 60));
        setLiveTeaSeconds(Math.round((fetched.teaDuration || 0) * 60));
        setLiveOtherBreakSeconds(Math.round((fetched.otherBreakDuration || 0) * 60));
        setError(null);
      } else {
        setSessionData(null);
        setLiveWorkingSeconds(0);
        setLiveDelaySeconds(0);
        setLiveLunchSeconds(0);
        setLiveTeaSeconds(0);
        setLiveOtherBreakSeconds(0);
      }
    } catch (err) {
      if (thisRequestId !== requestIdRef.current) return;
      if (!isMountedRef.current) return;
      console.error('Error fetching tracking data:', err);
      setError(err.message || 'Network error');
      setSessionData(null);
      setLiveWorkingSeconds(0);
      setLiveDelaySeconds(0);
    } finally {
      if (thisRequestId === requestIdRef.current && isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  // ✅ Initial load and polling — per employee
  useEffect(() => {
    if (!currentEmpId) return;

    // Reset for new employee immediately
    setSessionData(null);
    setLiveWorkingSeconds(0);
    setLiveDelaySeconds(0);
    setLiveLunchSeconds(0);
    setLiveTeaSeconds(0);
    setLiveOtherBreakSeconds(0);
    setError(null);
    setLoading(true);

    fetchEmployeeData(currentEmpId, false);

    // Auto-refresh every 10 seconds
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(() => {
      fetchEmployeeData(currentEmpId, true);
    }, 10000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [currentEmpId]);

  // Live second-by-second increment
  useEffect(() => {
    const status = String(sessionData?.status || '').toLowerCase();
    const activeBreak = sessionData?.activeBreak;
    const activeType = String(activeBreak?.type || activeBreak?.reason || '').toLowerCase();

    const isLunch = status === 'lunch_break' || ((status === 'on_break' || status === 'break') && activeType.includes('lunch')) || activeType.includes('lunch');
    const isTea = status === 'tea_break' || ((status === 'on_break' || status === 'break') && activeType.includes('tea')) || activeType.includes('tea');
    const isOnBreak = status === 'on_break' || status === 'lunch_break' || status === 'tea_break' || status === 'break' || Boolean(activeBreak);

    if (status !== 'working' && status !== 'idle' && !isOnBreak) return;

    const ticker = setInterval(() => {
      if (status === 'working') {
        setLiveWorkingSeconds(prev => prev + 1);
      } else if (status === 'idle') {
        setLiveDelaySeconds(prev => prev + 1);
      } else if (isOnBreak) {
        setLiveDelaySeconds(prev => prev + 1);
        if (isLunch) {
          setLiveLunchSeconds(prev => prev + 1);
        } else if (isTea) {
          setLiveTeaSeconds(prev => prev + 1);
        } else {
          setLiveOtherBreakSeconds(prev => prev + 1);
        }
      }
    }, 1000);

    return () => clearInterval(ticker);
  }, [sessionData?.status, sessionData?.activeBreak]);

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

  // ✅ Break metrics — now using API fields directly
  const breakMetrics = useMemo(() => {
    const activeBreak = sessionData?.activeBreak;
    const activeType = String(
      activeBreak?.type ||
      activeBreak?.reason ||
      ''
    ).toLowerCase();

    const status = String(sessionData?.status || '').toLowerCase();
    const isLunchActive = status === 'lunch_break' || ((status === 'on_break' || status === 'break') && activeType.includes('lunch')) || activeType.includes('lunch');
    const isTeaActive = status === 'tea_break' || ((status === 'on_break' || status === 'break') && activeType.includes('tea')) || activeType.includes('tea');
    const isOtherBreakActive = (status === 'on_break' || status === 'break' || Boolean(activeBreak)) && !isLunchActive && !isTeaActive;

    return {
      isLunchActive,
      isTeaActive,
      isOtherBreakActive,
      breakList: sessionData?.breaks || [],
    };
  }, [sessionData]);

  // Current employee info
  const employeeName = sessionData?.employeeName || sessionData?.name || 'Employee';
  const status = String(sessionData?.status || 'not_started').toLowerCase();
  const location = sessionData?.location || 'Office';

  const getStatusBadge = () => {
    switch (status) {
      case 'working':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Working
          </span>
        );
      case 'idle':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Idle
          </span>
        );
      case 'lunch_break':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Lunch Break
          </span>
        );
      case 'tea_break':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            Tea Break
          </span>
        );
      case 'on_break':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            {sessionData?.activeBreak?.type ? `On ${sessionData.activeBreak.type}` : 'On Break'}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Work Ended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            Not Started
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-[32px] border border-slate-200/90 shadow-2xl p-5 sm:p-6 w-full max-w-[460px] relative overflow-hidden transition-all duration-300 my-auto">

        {/* TOP BAR */}
        <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 flex items-center justify-center p-1.5 shadow-xs shrink-0">
              {sessionData?.profileImage ? (
                <img src={sessionData.profileImage} alt={employeeName} className="w-full h-full rounded-xl object-cover" />
              ) : (
                <img src="/logo2.png" alt="PMS" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-syne font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">
                Pixel Mind Solutions
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 truncate">
                {employeeName} <span className="text-slate-400 font-normal">({currentEmpId})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {getStatusBadge()}

            <button
              onClick={() => fetchEmployeeData(currentEmpId, false)}
              title="Refresh live data"
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all"
            >
              <FiRefreshCw size={12} className={refreshing ? 'animate-spin text-teal-600' : ''} />
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 flex items-center justify-center transition-all"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        </div>

        {/* EMPLOYEE SWITCHER */}
        {allEmployees.length > 0 && (
          <div className="mb-3">
            <div className="relative">
              <select
                value={currentEmpId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setCurrentEmpId(newId);
                  if (onSelectEmployee) onSelectEmployee(newId);
                }}
                className="w-full pl-3 pr-8 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 outline-none transition-all cursor-pointer appearance-none"
              >
                <option value={currentEmpId}>Currently Tracking: {employeeName} ({currentEmpId})</option>
                {allEmployees
                  .filter(e => String(e.employeeId).toLowerCase() !== String(currentEmpId).toLowerCase())
                  .map(emp => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      Switch to: {emp.employeeName} ({emp.employeeId}) — {emp.status || 'Active'}
                    </option>
                  ))}
              </select>
              <FiChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* DIGITAL CLOCK */}
        <div className="text-center py-3 px-4 mb-3 bg-gradient-to-b from-slate-50/80 to-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="font-digital font-extrabold text-3xl sm:text-4xl text-[#113f36] tracking-tight tabular-nums leading-none py-1">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>
          <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-1.5">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* LOCATION */}
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3.5 py-2 mb-3 shadow-xs">
          <div className="flex items-center gap-2">
            <FiMapPin className="text-teal-600 text-sm" />
            <span className="text-xs font-bold text-slate-700">Location:</span>
          </div>
          <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
            {location}
          </span>
        </div>

        {/* LIVE TIMERS */}
        <div className="grid grid-cols-2 gap-2.5 mb-3.5">
          <div className="bg-white border border-teal-200/80 rounded-2xl p-3 text-center shadow-xs relative overflow-hidden group hover:border-teal-400 transition-all">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-teal-700 flex items-center justify-center gap-1.5 mb-1">
              <span className={`w-2 h-2 rounded-full ${status === 'working' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              WORKING TIME
            </div>
            <div className="font-digital font-bold text-xl sm:text-2xl text-[#113f36] tabular-nums tracking-tight">
              {formatHMS(liveWorkingSeconds)}
            </div>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              {((liveWorkingSeconds / 3600) || 0).toFixed(2)} hrs total
            </span>
          </div>

          <div className={`bg-white border rounded-2xl p-3 text-center shadow-xs relative overflow-hidden transition-all ${
            status === 'idle' ? 'border-amber-400 ring-2 ring-amber-300/40 bg-amber-50/20' : 'border-slate-200'
          }`}>
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-center gap-1.5 mb-1">
              <span className={`w-2 h-2 rounded-full ${status === 'idle' ? 'bg-amber-500 animate-ping' : 'bg-slate-400'}`} />
              DELAY TIME
            </div>
            <div className={`font-digital font-bold text-xl sm:text-2xl tabular-nums tracking-tight ${
              status === 'idle' ? 'text-amber-800' : 'text-slate-800'
            }`}>
              {formatHMS(liveDelaySeconds)}
            </div>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              {((liveDelaySeconds / 3600) || 0).toFixed(2)} hrs idle
            </span>
          </div>
        </div>

        {/* BREAK SUMMARY */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 mb-3.5 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#92400e] mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FiCoffee size={13} className="text-amber-600" />
              BREAK SUMMARY
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              OFFICE SCHEDULE
            </span>
          </div>

          <div className="space-y-2">
            {/* LUNCH */}
            <div className="flex items-center justify-between bg-white border border-amber-200/90 rounded-xl px-3 py-2 shadow-xs hover:bg-amber-50/20 transition-all">
              <div className="flex items-center gap-2">
                <span className="text-base">🍱</span>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs leading-tight">Lunch (1:00 - 1:45 PM)</h4>
                  <p className="text-[10px] text-slate-400 font-medium">45 Mins standard</p>
                </div>
              </div>

              <div>
                {breakMetrics.isLunchActive ? (
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[11px] px-3 py-1 rounded-lg shadow-sm animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    Active: {formatMS(liveLunchSeconds)} 🍱
                  </span>
                ) : liveLunchSeconds > 0 ? (
                  <span className="font-mono-num font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-[11px]">
                    Taken: {formatMS(liveLunchSeconds)}
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-500 font-semibold text-[10px] px-2.5 py-1 rounded-lg border border-slate-200">
                    Not Taken
                  </span>
                )}
              </div>
            </div>

            {/* TEA */}
            <div className="flex items-center justify-between bg-white border border-teal-200/90 rounded-xl px-3 py-2 shadow-xs hover:bg-teal-50/20 transition-all">
              <div className="flex items-center gap-2">
                <span className="text-base">☕</span>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs leading-tight">Tea Break (5:00 - 5:15 PM)</h4>
                  <p className="text-[10px] text-slate-400 font-medium">15 Mins standard</p>
                </div>
              </div>

              <div>
                {breakMetrics.isTeaActive ? (
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-bold text-[11px] px-3 py-1 rounded-lg shadow-sm animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    Active: {formatMS(liveTeaSeconds)} ☕
                  </span>
                ) : liveTeaSeconds > 0 ? (
                  <span className="font-mono-num font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 text-[11px]">
                    Taken: {formatMS(liveTeaSeconds)}
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-500 font-semibold text-[10px] px-2.5 py-1 rounded-lg border border-slate-200">
                    Not Taken
                  </span>
                )}
              </div>
            </div>

            {/* OTHER */}
            {breakMetrics.otherSec > 0 && (
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-600 font-medium text-[11px]">
                  <span>💼</span> Other Breaks / Meetings:
                </div>
                <span className="font-mono-num font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                  {formatMS(breakMetrics.otherSec)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="border-t border-slate-100 pt-3">
          <div className="flex gap-2 mb-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('tracker')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'tracker'
                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Session Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'timeline'
                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Activity Logs ({sessionData?.activityLogCount ?? sessionData?.activityLogs?.length ?? 0})
            </button>
          </div>

          {activeTab === 'tracker' ? (
            <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Session Started At:</span>
                <span className="font-bold text-slate-800">
                  {sessionData?.startTime ? new Date(sessionData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Not started'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Last Active Ping:</span>
                <span className="font-semibold text-slate-700">
                  {sessionData?.lastActiveTime ? new Date(sessionData.lastActiveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Total Breaks Taken:</span>
                <span className="font-bold text-slate-800">
                  {sessionData?.totalBreakCount ?? breakMetrics.breakList.length} times ({formatMS((breakMetrics.lunchSec + breakMetrics.teaSec + breakMetrics.otherSec))})
                </span>
              </div>
              {sessionData?.endTime && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Session Ended At:</span>
                  <span className="font-bold text-purple-700">
                    {new Date(sessionData.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {(!sessionData?.activityLogs || sessionData.activityLogs.length === 0) ? (
                <p className="text-center text-slate-400 py-3 text-[11px]">No activity logs recorded yet today</p>
              ) : (
                sessionData.activityLogs.slice().reverse().map((log, idx) => (
                  <div key={idx} className="bg-slate-50 p-2 rounded-xl border border-slate-200/60 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-700 text-[11px] truncate">{log.details || log.type}</p>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">{log.type}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 shrink-0">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 text-teal-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            Live Real-time Synced
          </span>
          <span className="text-slate-400">
            Auto-refreshing (10s)
          </span>
        </div>

      </div>
    </div>
  );
};

export default SingleEmployeeLiveTrackerModal;