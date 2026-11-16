import React, { useState, useEffect } from 'react';
import {
  Search, Download, RefreshCw, Eye,
  AlertCircle, Clock, Coffee, Activity, PauseCircle,
  ClipboardList, Check, X
} from 'lucide-react';
import { getAuthHeaders, API_BASE_URL } from '../../utils/Auth';
import * as XLSX from 'xlsx';
import SingleEmployeeLiveTrackerModal from './SingleEmployeeLiveTrackerModal';

// =====================================================================
// DELAY HELPERS
// A "delay" is one idle_start -> idle_end pair in a session's activityLogs.
// Start/end come from the log timestamps, the length is derived from them
// (idle_end.duration is only whole minutes, so it hides short delays).
// =====================================================================
const IST_TZ = 'Asia/Kolkata';

const DELAY_REQUEST_TYPE_LABELS = {
  idle_delay: 'Idle / Away',
  meeting: 'Meeting',
  issue: 'Issue',
  technical_issue: 'Technical Issue',
  client_call: 'Client Call',
  other: 'Other',
};

const DELAY_STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
};

const formatClock = (ms) =>
  new Date(ms).toLocaleTimeString('en-US', {
    timeZone: IST_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const formatDelayDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        timeZone: IST_TZ,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';

const formatDelayDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        timeZone: IST_TZ,
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '-';

const formatDelayDuration = (seconds) => {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  if (s < 60) return `${s} sec${s === 1 ? '' : 's'}`;
  const m = Math.round(s / 60);
  return `${m} min${m === 1 ? '' : 's'}`;
};

// "10:22 AM-12:14 PM - 112 mins"
const formatDelayLabel = (startMs, endMs, seconds) =>
  `${formatClock(startMs)}-${formatClock(endMs)} - ${formatDelayDuration(seconds)}`;

// Pairs idle_start / idle_end logs into delay periods.
// - repeated idle_start logs with the same timestamp are one delay
// - an idle_start with no idle_end yet is the current (ongoing) delay
const extractDelayPeriods = (session) => {
  const logs = Array.isArray(session?.activityLogs) ? session.activityLogs : [];
  const periods = [];
  let open = null;

  for (const log of logs) {
    if (!log || (log.type !== 'idle_start' && log.type !== 'idle_end')) continue;
    const ts = new Date(log.timestamp).getTime();
    if (!Number.isFinite(ts)) continue;

    if (log.type === 'idle_start') {
      if (open) continue; // duplicate start while already idle
      const prev = periods[periods.length - 1];
      open =
        prev && prev.startMs === ts
          ? { startMs: ts, base: prev } // same delay logged again
          : { startMs: ts, base: null };
      continue;
    }

    // idle_end
    if (!open || ts <= open.startMs) continue;
    if (open.base) {
      open.base.endMs = Math.max(open.base.endMs, ts);
      open.base.durationSeconds = Math.round(
        (open.base.endMs - open.base.startMs) / 1000
      );
    } else {
      periods.push({
        startMs: open.startMs,
        endMs: ts,
        durationSeconds: Math.round((ts - open.startMs) / 1000),
        ongoing: false,
      });
    }
    open = null;
  }

  if (open && !open.base) {
    periods.push({ startMs: open.startMs, endMs: null, durationSeconds: 0, ongoing: true });
  }
  return periods.sort((a, b) => a.startMs - b.startMs);
};

const STATUS_PRIORITY = { approved: 3, pending: 2, rejected: 1 };

// The existing request (if any) that overlaps a delay period.
const findRequestForPeriod = (requests, sessionId, period) => {
  if (period.ongoing) return null;
  let best = null;
  for (const r of requests || []) {
    if (String(r.sessionId) !== String(sessionId)) continue;
    const rs = new Date(r.startTime).getTime();
    const re = new Date(r.endTime).getTime();
    if (rs < period.endMs && re > period.startMs) {
      if (!best || (STATUS_PRIORITY[r.status] || 0) > (STATUS_PRIORITY[best.status] || 0)) {
        best = r;
      }
    }
  }
  return best;
};

// Fetch helper for /work-session/delay-request/*
const delayFetch = async (path, { method = 'GET', body } = {}) => {
  const res = await fetch(`${API_BASE_URL}/work-session/delay-request${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.payload = data;
    throw err;
  }
  return data;
};

const DelayStatusBadge = ({ status }) => (
  <span
    className={`px-2 py-0.5 rounded-full border text-[10px] font-bold capitalize whitespace-nowrap ${
      DELAY_STATUS_STYLES[status] || 'bg-slate-50 text-slate-600 border-slate-200'
    }`}
  >
    {status}
  </span>
);

// =====================================================================
// DELAY REQUESTS PANEL (review one / review many)
// =====================================================================
const DelayRequestsPanel = ({
  employees,
  initialSessionId,
  initialEmployeeId,
  title,
  onClose,
  onChanged,
}) => {
  const [status, setStatus] = useState(initialSessionId ? 'all' : 'pending');
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || '');
  const [sessionId, setSessionId] = useState(initialSessionId || '');
  const [page, setPage] = useState(1);

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);

  const [comments, setComments] = useState({});
  const [selected, setSelected] = useState([]);
  const [bulkComment, setBulkComment] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const limit = 20;

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const filters = new URLSearchParams();
      if (employeeId) filters.set('employeeId', employeeId);
      if (sessionId) filters.set('sessionId', sessionId);

      const listParams = new URLSearchParams(filters);
      listParams.set('page', page);
      listParams.set('limit', limit);
      if (status !== 'all') listParams.set('status', status);

      const summaryParams = new URLSearchParams(filters);
      summaryParams.set('limit', 1);

      const [listRes, summaryRes] = await Promise.all([
        delayFetch(`?${listParams.toString()}`),
        status === 'all'
          ? Promise.resolve(null)
          : delayFetch(`?${summaryParams.toString()}`),
      ]);

      setRecords(Array.isArray(listRes.data) ? listRes.data : []);
      setPagination(listRes.pagination || { total: 0, page: 1, pages: 1 });
      setSummary((summaryRes || listRes).summary || null);
      setSelected([]);
    } catch (err) {
      setRecords([]);
      setError(err.message || 'Failed to load delay requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status, employeeId, sessionId, page]);

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const pendingOnPage = records
    .filter((r) => r.status === 'pending')
    .map((r) => r._id);

  const allPendingSelected =
    pendingOnPage.length > 0 &&
    pendingOnPage.every((id) => selected.includes(id));

  const toggleSelected = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleSelectAll = () =>
    setSelected(allPendingSelected ? [] : pendingOnPage);

  const reviewOne = async (id, action) => {
    setBusyId(id);
    setNotice(null);

    try {
      const data = await delayFetch(`/${id}/review`, {
        method: 'PATCH',
        body: { action, adminComment: (comments[id] || '').trim() },
      });

      setNotice({
        type: 'success',
        text: data.message || `Request ${action}d`,
      });

      await load();
      onChanged && onChanged();
    } catch (err) {
      setNotice({
        type: 'error',
        text: err.message || `Unable to ${action} request`,
      });

      await load();
    } finally {
      setBusyId(null);
    }
  };

  const reviewSelected = async (action) => {
    if (!selected.length) return;

    setBulkBusy(true);
    setNotice(null);

    try {
      const data = await delayFetch('/review-many', {
        method: 'PATCH',
        body: {
          ids: selected,
          action,
          adminComment: bulkComment.trim(),
        },
      });

      const failed = (data.results || []).filter((r) => !r.success);

      setNotice({
        type: failed.length ? 'error' : 'success',
        text: failed.length
          ? `${data.message}. Failed: ${failed
              .map((f) => f.message)
              .join(', ')}`
          : data.message,
      });

      setBulkComment('');
      await load();
      onChanged && onChanged();
    } catch (err) {
      setNotice({
        type: 'error',
        text: err.message || `Unable to ${action} requests`,
      });

      await load();
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[96dvh] sm:max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-3 sm:p-5 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
              Delay Requests
            </h3>

            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
              {title ||
                'Approve to move the delay from idle to work time. Reject to keep it as delay.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Summary + Filters */}
        <div className="p-3 sm:p-5 space-y-3 border-b border-slate-100 shrink-0">
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div
                className={`rounded-xl sm:rounded-2xl border px-3 py-2 ${DELAY_STATUS_STYLES.pending}`}
              >
                <div className="text-lg font-extrabold leading-none">
                  {summary.pending || 0}
                </div>
                <div className="text-[11px] font-bold mt-1">
                  Pending - {formatDelayDuration(summary.pendingSeconds)}
                </div>
              </div>

              <div
                className={`rounded-xl sm:rounded-2xl border px-3 py-2 ${DELAY_STATUS_STYLES.approved}`}
              >
                <div className="text-lg font-extrabold leading-none">
                  {summary.approved || 0}
                </div>
                <div className="text-[11px] font-bold mt-1">
                  Approved - {formatDelayDuration(summary.creditedSeconds)} credited
                </div>
              </div>

              <div
                className={`rounded-xl sm:rounded-2xl border px-3 py-2 ${DELAY_STATUS_STYLES.rejected}`}
              >
                <div className="text-lg font-extrabold leading-none">
                  {summary.rejected || 0}
                </div>
                <div className="text-[11px] font-bold mt-1">
                  Rejected - {formatDelayDuration(summary.rejectedSeconds)}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer outline-none focus:border-teal-500"
              value={status}
              onChange={(e) => changeFilter(setStatus)(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All statuses</option>
            </select>

            <select
              className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer min-w-0 outline-none focus:border-teal-500"
              value={employeeId}
              onChange={(e) => changeFilter(setEmployeeId)(e.target.value)}
            >
              <option value="">All employees</option>
              {employees.map((emp) => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.employeeName} ({emp.employeeId})
                </option>
              ))}
            </select>

            {sessionId && (
              <button
                onClick={() => changeFilter(setSessionId)('')}
                className="h-10 px-3 rounded-xl border border-teal-200 bg-teal-50 text-teal-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer sm:col-span-2"
                title="Show requests from every session"
              >
                One session only <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto overscroll-contain p-3 sm:p-5 space-y-3 flex-1 min-h-0">
          {notice && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-start justify-between gap-2 ${
                notice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <span className="break-words min-w-0">{notice.text}</span>

              <button
                onClick={() => setNotice(null)}
                className="font-bold shrink-0 leading-none"
              >
                ×
              </button>
            </div>
          )}

          {pendingOnPage.length > 0 && (
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer py-1">
              <input
                type="checkbox"
                className="accent-teal-600 shrink-0"
                checked={allPendingSelected}
                onChange={toggleSelectAll}
              />
              <span>
                Select all pending on this page ({pendingOnPage.length})
              </span>
            </label>
          )}

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
              <p className="text-sm font-semibold">
                Loading delay requests...
              </p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-500">
              <AlertCircle className="w-9 h-9 mx-auto mb-2" />
              <p className="font-semibold text-sm">{error}</p>
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ClipboardList className="w-9 h-9 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-sm">
                No delay requests found
              </p>
            </div>
          ) : (
            records.map((r) => {
              const startMs = new Date(r.startTime).getTime();
              const endMs = new Date(r.endTime).getTime();
              const isPending = r.status === 'pending';
              const busy = busyId === r._id;

              return (
                <div
                  key={r._id}
                  className="rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-4 space-y-3 hover:border-teal-200 transition-colors"
                >
                  {/* Employee + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {isPending && (
                        <input
                          type="checkbox"
                          className="accent-teal-600 mt-1 shrink-0"
                          checked={selected.includes(r._id)}
                          onChange={() => toggleSelected(r._id)}
                        />
                      )}

                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 break-words">
                          {r.employeeName || r.employeeId}{' '}
                          <span className="text-[11px] text-slate-400 font-medium break-all">
                            ({r.employeeId})
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          {formatDelayDate(r.startTime)}
                          {r.requestLabel ? ` - ${r.requestLabel}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <DelayStatusBadge status={r.status} />
                    </div>
                  </div>

                  {/* Request Information */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-xs font-bold tabular-nums break-words">
                      {formatDelayLabel(startMs, endMs, r.durationSeconds)}
                    </span>

                    <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-semibold break-words">
                      {DELAY_REQUEST_TYPE_LABELS[r.requestType] || r.requestType}
                    </span>

                    {r.location && (
                      <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-semibold break-words">
                        {r.location}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 break-words leading-relaxed">
                    {r.reason}
                  </p>

                  {/* Reviewed Information */}
                  {!isPending && (
                    <div className="text-[11px] text-slate-500 space-y-1 border-t border-slate-100 pt-2 break-words">
                      {r.status === 'approved' && (
                        <div className="font-semibold text-emerald-700">
                          {formatDelayDuration(r.creditedSeconds)} moved from idle to work time
                        </div>
                      )}

                      <div>
                        Reviewed by {r.reviewedBy || 'admin'} on{' '}
                        {formatDelayDateTime(r.reviewedAt)}
                      </div>

                      {r.adminComment ? (
                        <div>Comment: {r.adminComment}</div>
                      ) : null}
                    </div>
                  )}

                  {/* Individual Review Actions */}
                  {isPending && (
                    <div className="grid grid-cols-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Comment (optional)"
                        className="col-span-2 sm:col-span-1 w-full min-w-0 h-10 sm:h-9 px-3 border border-slate-200 rounded-xl bg-slate-50 text-xs outline-none focus:bg-white focus:border-teal-500"
                        value={comments[r._id] || ''}
                        onChange={(e) =>
                          setComments((prev) => ({
                            ...prev,
                            [r._id]: e.target.value,
                          }))
                        }
                      />

                      <button
                        disabled={busy || bulkBusy}
                        onClick={() => reviewOne(r._id, 'approve')}
                        className="h-10 sm:h-9 px-3 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                      >
                        <Check size={14} /> Approve
                      </button>

                      <button
                        disabled={busy || bulkBusy}
                        onClick={() => reviewOne(r._id, 'reject')}
                        className="h-10 sm:h-9 px-3 sm:px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bulk Actions */}
        {selected.length > 0 && (
          <div className="px-3 sm:px-5 py-3 border-t border-slate-100 bg-teal-50/60 flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
            <span className="text-xs font-extrabold text-teal-900 whitespace-nowrap">
              {selected.length} selected
            </span>

            <input
              type="text"
              placeholder="Comment for all selected (optional)"
              className="w-full sm:flex-1 min-w-0 h-10 sm:h-9 px-3 border border-teal-200 rounded-xl bg-white text-xs outline-none focus:border-teal-500"
              value={bulkComment}
              onChange={(e) => setBulkComment(e.target.value)}
            />

            <div className="grid grid-cols-2 sm:flex gap-2">
              <button
                disabled={bulkBusy}
                onClick={() => reviewSelected('approve')}
                className="h-10 sm:h-9 px-3 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                <Check size={14} /> Approve selected
              </button>

              <button
                disabled={bulkBusy}
                onClick={() => reviewSelected('reject')}
                className="h-10 sm:h-9 px-3 sm:px-4 rounded-xl bg-white hover:bg-red-50 text-red-700 border border-red-200 font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                <X size={14} /> Reject selected
              </button>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-3 sm:px-5 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500 shrink-0">
            <div className="text-center sm:text-left">
              Page {page} of {pagination.pages} - {pagination.total} requests
            </div>

            <div className="grid grid-cols-2 sm:flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-2 sm:py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-semibold"
              >
                Previous
              </button>

              <button
                disabled={page >= pagination.pages}
                onClick={() =>
                  setPage((p) => Math.min(pagination.pages, p + 1))
                }
                className="px-3 py-2 sm:py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const WorkSessionHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [enrichedSessions, setEnrichedSessions] = useState([]); // ✅ with tracking data
  const [statistics, setStatistics] = useState({
    totalSessions: 0,
    totalWorkHours: '0.00',
    totalIdleHours: '0.00',
    totalBreakHours: '0.00',
    totalLunchHours: '0.00',
    totalTeaHours: '0.00',
    workingCount: 0,
    idleCount: 0,
    onBreakCount: 0,
    completedCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [selectedSession, setSelectedSession] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [liveTrackerEmpId, setLiveTrackerEmpId] = useState(null);

  // ===== Delay requests =====
  const [delayPanel, setDelayPanel] = useState(null); // { sessionId, employeeId, title } | null
  const [pendingDelayCount, setPendingDelayCount] = useState(0);
  const [delayRefreshKey, setDelayRefreshKey] = useState(0);
  const [modalDelayRequests, setModalDelayRequests] = useState([]);
  const [modalLogs, setModalLogs] = useState(null);
  const [modalDelayLoading, setModalDelayLoading] = useState(false);

  const getTodayIST = () => {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    return ist.toISOString().split('T')[0];
  };
  const today = getTodayIST();

  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: today,
    endDate: today,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 12;

  const [employees, setEmployees] = useState([]);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/staff/all?limit=1000`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setEmployees(data.data);
        }
      } catch (err) {
        console.error('Error fetching employees:', err);
      }
    };
    fetchEmployees();
  }, []);

  // ✅ Format helpers
  const formatDuration = (m) => {
    if (!m || m === 0) return '0h 0m';
    const h = Math.floor(m / 60);
    const min = Math.floor(m % 60);
    return `${h}h ${min}m`;
  };

  // ✅ Parse "HH:MM:SS" → minutes
  const parseHMS = (str) => {
    if (!str || typeof str !== 'string') return null;
    const parts = str.split(':').map(n => parseInt(n, 10) || 0);
    if (parts.length === 3) {
      return parts[0] * 60 + parts[1] + parts[2] / 60;
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return null;
  };

  // ✅ Fetch sessions (base info)
  const fetchSessions = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);
      if (employeeFilter) params.append('employeeId', employeeFilter);
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      if (statusFilter) params.append('status', statusFilter);

      const url = `${API_BASE_URL}/staff/all-sessions?${params.toString()}`;
      const res = await fetch(url, { headers: getAuthHeaders() });

      if (res.status === 401) throw new Error('Unauthorized. Please login again.');
      if (res.status === 500) throw new Error('Server error. Please try again later.');

      const data = await res.json();

      if (data.success) {
        const list = data.data.sessions || [];
        setSessions(list);
        setTotalPages(data.data.pagination?.pages || 1);
        setTotalRecords(data.data.pagination?.total || list.length);

        // ✅ Fetch tracking data for each unique employee (parallel)
        await enrichWithTracking(list);

        // Stats
        if (data.data.statistics) {
          setStatistics(prev => ({
            ...prev,
            totalSessions: data.data.statistics.totalSessions || list.length,
            totalWorkHours: data.data.statistics.totalWorkHours || '0.00',
            totalIdleHours: data.data.statistics.totalIdleHours || '0.00',
            workingCount: data.data.statistics.workingCount || 0,
            idleCount: data.data.statistics.idleCount || 0,
            onBreakCount: data.data.statistics.onBreakCount || 0,
            completedCount: data.data.statistics.completedCount || 0,
          }));
        }
      } else {
        setSessions([]);
        setEnrichedSessions([]);
        setError(data.message || 'Failed to load sessions');
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err.message || 'Network error');
      setSessions([]);
      setEnrichedSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ Enrich each session with tracking data
  const enrichWithTracking = async (list) => {
    try {
      // Only today's sessions can use the employee's live tracking data.
      const todayIST = getTodayIST();
      const todaySessions = list.filter(s => {
        if (!s.date) return false;
        const sessionDateIST = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(s.date));
        return sessionDateIST === todayIST;
      });
      const uniqueEmpIds = [...new Set(todaySessions.map(s => s.employeeId))];

      // Parallel fetch from /api/staff/tracking/:employeeId
      const trackingResults = await Promise.all(
        uniqueEmpIds.map(async (empId) => {
          try {
            const res = await fetch(`${API_BASE_URL}/staff/employee-sessions/${empId}`, {
              headers: getAuthHeaders(),
            });
            if (!res.ok) return { empId, data: null };
            const json = await res.json();
            return { empId, data: json.success ? json.data : null };
          } catch {
            return { empId, data: null };
          }
        })
      );

      // Map empId → tracking data
      const trackingMap = {};
      trackingResults.forEach(({ empId, data }) => {
        if (data) trackingMap[empId] = data;
      });

      // Enrich each session
      const enriched = list.map(s => {
        const sessionDateIST = s.date
          ? new Intl.DateTimeFormat('en-CA', {
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }).format(new Date(s.date))
          : null;
        if (sessionDateIST !== todayIST) return s;

        const t = trackingMap[s.employeeId];
        if (!t) return s;

        // ✅ Parse formatted durations to minutes
        let workingMin = parseHMS(t.workingTimeFormatted);
        if (workingMin === null) workingMin = t.totalWorkDuration || 0;

        let delayMin = parseHMS(t.delayTimeFormatted);
        if (delayMin === null) delayMin = t.totalIdleTime || 0;

        return {
          ...s,
          // ✅ Correct working time (matches popup)
          totalWorkDuration: workingMin,
          // ✅ Correct idle/delay (matches popup)
          totalIdleTime: delayMin,
          // ✅ Break durations from tracking API
          lunchDuration: t.lunchDuration || 0,
          teaDuration: t.teaDuration || 0,
          otherBreakDuration: t.otherBreakDuration || 0,
          totalBreakDuration: t.totalBreakDuration || 0,
          totalBreakCount: t.totalBreakCount || 0,
          // ✅ Status from tracking (live)
          status: t.status || s.status,
          // Keep original breaks for modal
          breaks: t.breaks || s.breaks || [],
          activityLogs: t.activityLogs || s.activityLogs || [],
        };
      });

      setEnrichedSessions(enriched);

      // ✅ Recompute statistics from enriched data
      const sum = (arr, key) => arr.reduce((a, s) => a + (s[key] || 0), 0);

      setStatistics(prev => ({
        ...prev,
        totalWorkHours: (sum(enriched, 'totalWorkDuration') / 60).toFixed(2),
        totalIdleHours: (sum(enriched, 'totalIdleTime') / 60).toFixed(2),
        totalLunchHours: (sum(enriched, 'lunchDuration') / 60).toFixed(2),
        totalTeaHours: (sum(enriched, 'teaDuration') / 60).toFixed(2),
        totalBreakHours: (sum(enriched, 'totalBreakDuration') / 60).toFixed(2),
        workingCount: enriched.filter(s => s.status === 'working').length,
        idleCount: enriched.filter(s => s.status === 'idle').length,
        onBreakCount: enriched.filter(s => ['on_break', 'lunch_break', 'tea_break'].includes(s.status)).length,
        completedCount: enriched.filter(s => s.status === 'completed').length,
      }));
    } catch (err) {
      console.error('Error enriching with tracking:', err);
      setEnrichedSessions(list);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [currentPage, employeeFilter, statusFilter, dateRange]);

  // ===== Pending delay request count (badge on the header button) =====
  const fetchPendingDelayCount = async () => {
    try {
      const data = await delayFetch('?status=pending&limit=1');
      setPendingDelayCount(data.summary?.pending ?? data.pagination?.total ?? 0);
    } catch (err) {
      // the badge is optional; keep the last known value
      console.error('Error fetching pending delay requests:', err);
    }
  };

  useEffect(() => {
    fetchPendingDelayCount();
    const interval = setInterval(fetchPendingDelayCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const openDelayPanel = ({ sessionId = '', employeeId = '', title = '' } = {}) => {
    setDelayPanel({ sessionId, employeeId, title });
  };

  // Called after an approve / reject: totals on the sessions changed too.
  const handleDelayChanged = () => {
    fetchPendingDelayCount();
    fetchSessions();
    setDelayRefreshKey(k => k + 1);
  };

  // Delay requests + idle logs of the session open in the detail modal
  useEffect(() => {
    if (!showModal || !selectedSession?._id) return;
    let cancelled = false;

    setModalDelayRequests([]);
    setModalLogs(null);
    setModalDelayLoading(true);

    (async () => {
      try {
        const reqRes = await delayFetch(`/session/${selectedSession._id}`);
        if (!cancelled) setModalDelayRequests(Array.isArray(reqRes.data) ? reqRes.data : []);
      } catch {
        if (!cancelled) setModalDelayRequests([]);
      }

      // The list endpoint may not include activityLogs for older sessions.
      const baseLogs = Array.isArray(selectedSession.activityLogs) ? selectedSession.activityLogs : [];
      const hasIdleLogs = baseLogs.some(l => l?.type === 'idle_start' || l?.type === 'idle_end');
      if (!hasIdleLogs) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/work-session/all-sessions/${selectedSession.employeeId}`,
            { headers: getAuthHeaders() }
          );
          if (res.ok) {
            const json = await res.json();
            const found = (json?.data?.sessions || []).find(
              x => String(x._id) === String(selectedSession._id)
            );
            if (found && !cancelled) setModalLogs(found.activityLogs || []);
          }
        } catch {
          // keep the periods empty when logs cannot be loaded
        }
      }
      if (!cancelled) setModalDelayLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [showModal, selectedSession?._id, delayRefreshKey]);

  // Live second-by-second increment for active work sessions
  useEffect(() => {
    const ticker = setInterval(() => {
      setEnrichedSessions(prevList => {
        if (!prevList || prevList.length === 0) return prevList;
        let changed = false;
        const nextList = prevList.map(session => {
          const sessionDateIST = session.date
            ? new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              }).format(new Date(session.date))
            : null;
          if (sessionDateIST !== getTodayIST() || session.status === 'completed' || session.endTime) return session;

          const status = String(session.status || '').toLowerCase();
          const isLunch = status === 'lunch_break';
          const isTea = status === 'tea_break';
          const isOnBreak = status === 'on_break' || isLunch || isTea;

          if (status === 'working') {
            changed = true;
            return {
              ...session,
              totalWorkDuration: (session.totalWorkDuration || 0) + (1 / 60)
            };
          } else if (status === 'idle') {
            changed = true;
            return {
              ...session,
              totalIdleTime: (session.totalIdleTime || 0) + (1 / 60)
            };
          } else if (isOnBreak) {
            changed = true;
            return {
              ...session,
              totalIdleTime: (session.totalIdleTime || 0) + (1 / 60),
              totalBreakDuration: (session.totalBreakDuration || 0) + (1 / 60),
              lunchDuration: isLunch ? (session.lunchDuration || 0) + (1 / 60) : session.lunchDuration,
              teaDuration: isTea ? (session.teaDuration || 0) + (1 / 60) : session.teaDuration
            };
          }
          return session;
        });

        return changed ? nextList : prevList;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, []);

  // Refresh live work, idle, and break durations every 30 seconds.
  useEffect(() => {
    let cancelled = false;
    const refreshWorkDurations = async () => {
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);
      if (employeeFilter) params.append('employeeId', employeeFilter);
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      if (statusFilter) params.append('status', statusFilter);

      try {
        const res = await fetch(`${API_BASE_URL}/staff/all-sessions?${params.toString()}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data.success || !Array.isArray(data.data?.sessions)) return;

        setSessions(data.data.sessions);
        await enrichWithTracking(data.data.sessions);
      } catch (err) {
        console.error('Error refreshing work durations:', err);
      }
    };

    const interval = setInterval(refreshWorkDurations, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentPage, employeeFilter, statusFilter, dateRange]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchSessions();
  };

  const handleRefresh = () => {
    fetchSessions();
    fetchPendingDelayCount();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setEmployeeFilter('');
    setStatusFilter('');
    setDateRange({ startDate: today, endDate: today });
    setCurrentPage(1);
  };

  // Filter by search
  const filteredSessions = searchTerm
    ? enrichedSessions.filter(
        s =>
          s.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : enrichedSessions;

  const exportToExcel = () => {
    const exportData = filteredSessions.map(s => ({
      'Employee ID': s.employeeId,
      'Employee Name': s.employeeName,
      Date: new Date(s.date).toLocaleDateString(),
      'Start Time': s.startTime ? new Date(s.startTime).toLocaleTimeString() : '-',
      'End Time': s.endTime ? new Date(s.endTime).toLocaleTimeString() : '-',
      'Total Work (Hours)': ((s.totalWorkDuration || 0) / 60).toFixed(2),
      'Delay / Idle (Hours)': ((s.totalIdleTime || 0) / 60).toFixed(2),
      'Lunch Break (Mins)': s.lunchDuration || 0,
      'Tea Break (Mins)': s.teaDuration || 0,
      'Total Break (Hours)': ((s.totalBreakDuration || 0) / 60).toFixed(2),
      Status: s.status,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Work Sessions');
    XLSX.writeFile(wb, `Work_Sessions_${today}.xlsx`);
  };

  const formatDate = d =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  const formatTime = d =>
    d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-';

  const getStatusBadge = status => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Completed</span>;
      case 'working':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Working
          </span>
        );
      case 'idle':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Idle
          </span>
        );
      case 'lunch_break':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Lunch Break
          </span>
        );
      case 'tea_break':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            Tea Break
          </span>
        );
      case 'on_break':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            On Break
          </span>
        );
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{status}</span>;
    }
  };

  // Delay periods (idle_start -> idle_end) of the session in the detail modal
  const modalPeriods = selectedSession
    ? extractDelayPeriods({ activityLogs: modalLogs || selectedSession.activityLogs })
    : [];

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
              <span className="text-xs text-slate-400 font-semibold">{totalRecords} records found</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Work Session History & Logs
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Comprehensive tracking of workdays, lunch, tea, and delay time
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => openDelayPanel()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-amber-300 bg-amber-50/60 text-amber-800 hover:bg-amber-100/70 font-bold text-xs cursor-pointer shadow-xs"
            >
              <ClipboardList size={14} /> Delay Requests
              {pendingDelayCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                  {pendingDelayCount}
                </span>
              )}
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-emerald-300 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/60 font-bold text-xs cursor-pointer shadow-xs"
            >
              <Download size={14} /> Export Excel
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shadow-sm"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard title="TOTAL WORK TIME" value={`${statistics.totalWorkHours} hrs`}
            icon={<Clock size={16} className="text-teal-600" />} subtitle="Effective work recorded" />
          <StatCard title="DELAY / IDLE TIME" value={`${statistics.totalIdleHours} hrs`}
            icon={<PauseCircle size={16} className="text-amber-600" />} subtitle={`${statistics.idleCount} idle sessions`} color="amber" />
          <StatCard title="LUNCH BREAKS" value={`${statistics.totalLunchHours} hrs`}
            icon={<span>🍱</span>} subtitle="Lunch (1:00 - 1:45 PM)" color="orange" />
          <StatCard title="TEA BREAKS" value={`${statistics.totalTeaHours} hrs`}
            icon={<span>☕</span>} subtitle="Tea (5:00 - 5:15 PM)" color="teal" />
          <StatCard title="TOTAL BREAK TIME" value={`${statistics.totalBreakHours} hrs`}
            icon={<Coffee size={16} className="text-blue-600" />} subtitle="All breaks combined" color="blue" />
        </div>

        {/* STATUS COUNTS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MiniStat label="Working" value={statistics.workingCount} color="emerald" />
          <MiniStat label="Idle" value={statistics.idleCount} color="amber" />
          <MiniStat label="On Break" value={statistics.onBreakCount} color="blue" />
          <MiniStat label="Completed" value={statistics.completedCount} color="slate" />
        </div>

        {/* FILTERS */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search employee or ID..."
                className="w-full pl-10 pr-3 h-11 border border-slate-200 rounded-2xl bg-slate-50 text-xs outline-none focus:bg-white focus:border-teal-500"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <select className="h-11 px-3.5 border border-slate-200 rounded-2xl bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
              value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}>
              <option value="">All Employees ({employees.length})</option>
              {employees.map(emp => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.employeeName} ({emp.employeeId})
                </option>
              ))}
            </select>

            <select className="h-11 px-3.5 border border-slate-200 rounded-2xl bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="working">Working</option>
              <option value="idle">Idle / Delay</option>
              <option value="on_break">On Break</option>
              <option value="completed">Completed</option>
            </select>

            <button onClick={resetFilters}
              className="h-11 px-4 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer">
              Clear Filters
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-3 pt-2 border-t border-slate-100">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">From Date</label>
                <input type="date" className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 text-xs"
                  value={dateRange.startDate} onChange={e => setDateRange(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">To Date</label>
                <input type="date" className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 text-xs"
                  value={dateRange.endDate} onChange={e => setDateRange(p => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>

            <button onClick={handleSearch}
              className="w-full sm:w-auto px-6 h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer">
              Apply Filter Range
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
              <p className="text-sm font-semibold">Loading sessions...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500">
              <AlertCircle className="w-10 h-10 mx-auto mb-2" />
              <p className="font-semibold text-sm">{error}</p>
            </div>
          ) : (
            <>
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
                    {filteredSessions.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="p-12 text-center text-slate-400">
                          <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          <p className="font-semibold text-sm">No work sessions found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredSessions.map((s, i) => (
                        <tr key={s._id} className="hover:bg-teal-50/20 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-400">
                            {(currentPage - 1) * itemsPerPage + i + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{s.employeeName}</div>
                            <div className="text-[11px] text-slate-400 font-medium">{s.employeeId}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">{formatDate(s.date)}</td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {formatTime(s.startTime)}
                            <span className="text-slate-400 mx-1">→</span>
                            {s.endTime ? formatTime(s.endTime) : <span className="text-emerald-600 font-bold">Active</span>}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-teal-900 text-sm">
                            {formatDuration(s.totalWorkDuration)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-amber-800 text-sm">
                            {formatDuration(s.totalIdleTime)}
                          </td>
                          <td className="py-3.5 px-4">
                            {s.status === 'lunch_break' ? (
                              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-[11px] border border-amber-300 animate-pulse inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                                {Math.round(s.lunchDuration || 0)}m
                              </span>
                            ) : s.lunchDuration > 0 ? (
                              <span className="bg-orange-50 text-orange-800 px-2 py-0.5 rounded font-bold text-[11px] border border-orange-200">
                                {Math.round(s.lunchDuration)}m
                              </span>
                            ) : (
                              <span className="text-slate-400 font-semibold">0h 0m</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {s.status === 'tea_break' ? (
                              <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold text-[11px] border border-teal-300 animate-pulse inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-ping" />
                                {Math.round(s.teaDuration || 0)}m
                              </span>
                            ) : s.teaDuration > 0 ? (
                              <span className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded font-bold text-[11px] border border-teal-200">
                                {Math.round(s.teaDuration)}m
                              </span>
                            ) : (
                              <span className="text-slate-400 font-semibold">0h 0m</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {formatDuration(s.totalBreakDuration)}
                          </td>
                          <td className="py-3.5 px-4">{getStatusBadge(s.status)}</td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setLiveTrackerEmpId(s.employeeId)}
                                className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <Activity size={12} /> Track Live
                              </button>
                              <button
                                onClick={() =>
                                  openDelayPanel({
                                    sessionId: s._id,
                                    employeeId: s.employeeId,
                                    title: `${s.employeeName} - ${formatDate(s.date)}`,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <ClipboardList size={12} /> Delays
                              </button>
                              <button
                                onClick={() => { setSelectedSession(s); setShowModal(true); }}
                                className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
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

              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <div>Showing page {currentPage} of {totalPages}</div>
                  <div className="flex gap-2">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-semibold">
                      Previous
                    </button>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-semibold">
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{selectedSession.employeeName}</h3>
                <p className="text-xs text-slate-500">
                  {selectedSession.employeeId} • {formatDate(selectedSession.date)}
                </p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-teal-50/50 p-3 rounded-2xl border border-teal-100">
                <span className="text-[10px] font-bold uppercase text-teal-700 block mb-0.5">Working Duration</span>
                <div className="font-bold text-lg text-[#113f36]">{formatDuration(selectedSession.totalWorkDuration)}</div>
              </div>
              <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100">
                <span className="text-[10px] font-bold uppercase text-amber-700 block mb-0.5">Delay / Idle</span>
                <div className="font-bold text-lg text-amber-800">{formatDuration(selectedSession.totalIdleTime)}</div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">
                Recorded Breaks ({selectedSession.breaks?.length || 0})
              </h4>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {!selectedSession.breaks || selectedSession.breaks.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">No breaks taken.</p>
                ) : (
                  selectedSession.breaks.map((brk, idx) => (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800 capitalize">{brk.reason || brk.type} break</span>
                        <div className="text-[10px] text-slate-400">
                          {formatTime(brk.startTime)} → {brk.endTime ? formatTime(brk.endTime) : 'In Progress'}
                        </div>
                      </div>
                      <span className="font-bold text-teal-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {Math.round(brk.duration || 0)} mins
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* DELAY PERIODS (idle_start -> idle_end) */}
            <details className="mb-4 group" open>
              <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-bold text-slate-700 uppercase mb-2">
                <span>
                  Delay Periods ({modalPeriods.length})
                  {modalDelayRequests.length > 0 && (
                    <span className="ml-2 normal-case font-semibold text-slate-400">
                      {modalDelayRequests.length} request{modalDelayRequests.length === 1 ? '' : 's'}
                    </span>
                  )}
                </span>
                <span className="text-slate-400 transition-transform group-open:rotate-180">▾</span>
              </summary>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {modalDelayLoading && modalPeriods.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">Loading delays...</p>
                ) : modalPeriods.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">No delay periods recorded.</p>
                ) : (
                  modalPeriods.map((p) => {
                    const req = findRequestForPeriod(modalDelayRequests, selectedSession._id, p);
                    return (
                      <div
                        key={p.startMs}
                        className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex justify-between items-center gap-2"
                      >
                        <span className="font-bold text-slate-800 tabular-nums">
                          {p.ongoing
                            ? `${formatClock(p.startMs)}-now - ongoing`
                            : formatDelayLabel(p.startMs, p.endMs, p.durationSeconds)}
                        </span>
                        {req ? (
                          <DelayStatusBadge status={req.status} />
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">
                            No request
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <button
                onClick={() => {
                  setShowModal(false);
                  openDelayPanel({
                    sessionId: selectedSession._id,
                    employeeId: selectedSession.employeeId,
                    title: `${selectedSession.employeeName} - ${formatDate(selectedSession.date)}`,
                  });
                }}
                className="mt-2 w-full py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ClipboardList size={13} /> Review delay requests
              </button>
            </details>

            <button
              onClick={() => { setShowModal(false); setLiveTrackerEmpId(selectedSession.employeeId); }}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Activity size={14} /> Open Live Tracker
            </button>
          </div>
        </div>
      )}

      {liveTrackerEmpId && (
        <SingleEmployeeLiveTrackerModal
          employeeId={liveTrackerEmpId}
          allEmployees={employees}
          onClose={() => setLiveTrackerEmpId(null)}
          onSelectEmployee={id => setLiveTrackerEmpId(id)}
        />
      )}

      {/* DELAY REQUESTS PANEL */}
      {delayPanel && (
        <DelayRequestsPanel
          key={`${delayPanel.sessionId}-${delayPanel.employeeId}`}
          employees={employees}
          initialSessionId={delayPanel.sessionId}
          initialEmployeeId={delayPanel.employeeId}
          title={delayPanel.title}
          onClose={() => setDelayPanel(null)}
          onChanged={handleDelayChanged}
        />
      )}
    </div>
  );
};

// Reusable cards
const StatCard = ({ title, value, icon, subtitle, color = 'teal' }) => {
  const borderColors = { teal: 'border-teal-100', amber: 'border-amber-100', orange: 'border-orange-100', blue: 'border-blue-100' };
  const textColors = { teal: 'text-[#113f36]', amber: 'text-amber-800', orange: 'text-orange-800', blue: 'text-blue-800' };
  return (
    <div className={`bg-white rounded-2xl p-4 border ${borderColors[color]} shadow-xs`}>
      <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
        <span>{title}</span>{icon}
      </div>
      <div className={`font-bold text-2xl ${textColors[color]}`}>{value}</div>
      <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
    </div>
  );
};

const MiniStat = ({ label, value, color = 'slate' }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  };
  return (
    <div className={`rounded-2xl border px-4 py-3 flex items-center justify-between ${colors[color]}`}>
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      <span className="text-xl font-extrabold">{value}</span>
    </div>
  );
};

export default WorkSessionHistory;