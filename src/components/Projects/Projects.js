import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdEdit, MdDelete, MdVisibility, MdDownload, MdRefresh, MdAdd, MdGridView, MdTableRows } from 'react-icons/md';
import { FaMobileAlt, FaEnvelope, FaSearch, FaFilter, FaFolderOpen, FaCalendarAlt, FaRupeeSign } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const API_URL = 'https://pmsbackend.pixelmindsolutions.com/api/projects';

const loginDetails = JSON.parse(sessionStorage.getItem("loginDetails"));

const AUTH_TOKEN = loginDetails?.token;

const permission = loginDetails?.modulePermissions?.find(
  (item) => item.component === "projects"
);

const access = permission?.items?.[0]?.permission || [];

const headers = () => ({
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
});

/* ── helpers ── */
const statusColor = (s) => ({
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  'on hold': 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}[s?.toLowerCase()] || 'bg-gray-50 text-gray-600 border-gray-200');

const statusDot = (s) => ({
  active: 'bg-emerald-500',
  completed: 'bg-blue-500',
  'on hold': 'bg-amber-500',
  cancelled: 'bg-red-500',
}[s?.toLowerCase()] || 'bg-gray-400');

const categoryBadge = (c) => ({
  website: 'bg-teal-50 text-teal-700 border-teal-200',
  'mobile app': 'bg-purple-50 text-purple-700 border-purple-200',
  'digital market': 'bg-orange-50 text-orange-700 border-orange-200',
  'digital marketing': 'bg-orange-50 text-orange-700 border-orange-200',
  software: 'bg-blue-50 text-blue-700 border-blue-200',
}[c?.toLowerCase()] || 'bg-gray-50 text-gray-600 border-gray-200');

const categoryGradient = (c) => ({
  website: 'from-teal-500 to-teal-600',
  'mobile app': 'from-purple-500 to-purple-600',
  'digital market': 'from-orange-500 to-orange-600',
  'digital marketing': 'from-orange-500 to-orange-600',
  software: 'from-blue-500 to-blue-600',
}[c?.toLowerCase()] || 'from-gray-500 to-gray-600');

const categoryIcon = (c) => ({
  website: '🌐',
  'mobile app': '📱',
  'digital market': '📣',
  'digital marketing': '📣',
  software: '💻',
}[c?.toLowerCase()] || '📁');

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtCost = (n) => n != null && n !== '' ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

/* ── PROJECT CARD ── */
const ProjectCard = ({ p, idx, onView, onEdit, onDelete, onStatusChange }) => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
    <div className={`h-1.5 w-full bg-gradient-to-r ${categoryGradient(p.category)}`} />
    <div className="p-4 pb-3 flex items-start justify-between gap-2">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${categoryGradient(p.category)} flex items-center justify-center text-xl shrink-0 shadow-sm`}>
          {categoryIcon(p.category)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-800 text-sm leading-tight truncate">{p.projectName || 'Untitled'}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{p.client?.name || 'No Client'}</p>
        </div>
      </div>
      <select
        value={p.status || 'active'}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onStatusChange(p._id, e.target.value)}
        className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border cursor-pointer appearance-none text-center capitalize ${statusColor(p.status)}`}
        style={{ minWidth: 72 }}
      >
        <option value="active">Active</option>
        <option value="on hold">On Hold</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
    <div className="mx-4 h-px bg-gray-50" />
    <div className="p-4 grid grid-cols-2 gap-y-2.5 gap-x-3 flex-1">
      <div className="min-w-0">
        <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">ID</p>
        <p className="text-xs text-gray-700 font-semibold truncate font-mono">{p.projectId || '—'}</p>
      </div>
      <div className="min-w-0">
        <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Category</p>
        <p className="text-xs text-gray-700 font-semibold truncate">{p.category || '—'}</p>
      </div>
      <div className="min-w-0">
        <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Start</p>
        <p className="text-xs text-gray-700 font-semibold truncate">{fmtDate(p.projectStartDate)}</p>
      </div>
      <div className="min-w-0">
        <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Deadline</p>
        <p className="text-xs text-gray-700 font-semibold truncate">{fmtDate(p.deadline)}</p>
      </div>
      <div className="min-w-0">
        <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Cost</p>
        <p className="text-xs text-gray-700 font-semibold truncate">{fmtCost(p.projectCost)}</p>
      </div>
      <div className="min-w-0">
        <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Mobile</p>
        <p className="text-xs text-gray-700 font-semibold truncate">{p.client?.mobile || '—'}</p>
      </div>
    </div>
    {p.client?.email && (
      <div className="px-4 pb-2">
        <a href={`mailto:${p.client.email}`} className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 truncate">
          <FaEnvelope size={10} className="shrink-0" /> {p.client.email}
        </a>
      </div>
    )}
    <div className="mx-4 h-px bg-gray-50" />
    <div className="p-3 flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-xs text-gray-400">
        <span className={`w-1.5 h-1.5 rounded-full ${statusDot(p.status)}`} />
        {p.status || 'N/A'}
      </span>
      <div className="flex items-center gap-1">
        {(loginDetails?.role === "Admin" || access.includes("view")) && (
          <button onClick={() => onView(p._id)} title="View"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 bg-teal-50 hover:bg-teal-100 text-teal-600">
            <MdVisibility size={14} />
          </button>
        )}
        {(loginDetails?.role === "Admin" || access.includes("edit")) && (
          <button onClick={() => onEdit(p._id)} title="Edit"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 bg-blue-50 hover:bg-blue-100 text-blue-600">
            <MdEdit size={14} />
          </button>
        )}
        {(loginDetails?.role === "Admin" || access.includes("delete")) && (
          <button onClick={() => onDelete(p._id)} title="Delete"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 bg-red-50 hover:bg-red-100 text-red-500">
            <MdDelete size={14} />
          </button>
        )}
      </div>
    </div>
  </div>
);

/* ── MAIN COMPONENT ── */
const Projects = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteIds, setDeleteIds] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  /* ── FETCH ── */
  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/all`, {
        headers: headers()
      });
      const data = await response.json();

      if (data.success) {
        const projectsData = Array.isArray(data.data) ? data.data : [];
        setProjects(projectsData);
      } else {
        throw new Error(data.message || 'Failed to load projects');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  /* ── TOAST ── */
  const showToast = (type, message) => {
    setToastMsg({ type, message });
    setTimeout(() => setToastMsg(null), 3500);
  };

  /* ── DELETE (Single) ── */
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      const response = await fetch(`${API_URL}/delete`, {
        method: 'DELETE',
        headers: headers(),
        body: JSON.stringify({ projectIds: [id] }),
      });
      const data = await response.json();

      if (data.success) {
        setProjects(prev => prev.filter(p => p._id !== id));
        showToast('success', 'Project deleted successfully');
      } else {
        showToast('error', data.message || 'Delete failed');
      }
    } catch {
      showToast('error', 'Network error while deleting');
    }
  };

  /* ── BULK DELETE ── */
  const handleBulkDelete = async () => {
    if (deleteIds.length === 0) return;
    if (!window.confirm(`Delete ${deleteIds.length} selected project(s)?`)) return;

    try {
      const response = await fetch(`${API_URL}/delete`, {
        method: 'DELETE',
        headers: headers(),
        body: JSON.stringify({ projectIds: deleteIds }),
      });
      const data = await response.json();

      if (data.success) {
        setProjects(prev => prev.filter(p => !deleteIds.includes(p._id)));
        setDeleteIds([]);
        showToast('success', `${data.data?.deletedCount || deleteIds.length} project(s) deleted successfully`);
      } else {
        showToast('error', data.message || 'Bulk delete failed');
      }
    } catch {
      showToast('error', 'Network error while deleting');
    }
  };

  /* ── STATUS CHANGE ── */
  const handleStatusChange = async (id, newStatus) => {
    const prev = projects.find(p => p._id === id);
    if (!prev) return;

    setProjects(ps => ps.map(p => p._id === id ? { ...p, status: newStatus } : p));

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ ...prev, status: newStatus }),
      });
      const data = await response.json();

      if (!data.success) {
        setProjects(ps => ps.map(p => p._id === id ? prev : p));
        showToast('error', 'Status update failed');
      }
    } catch {
      setProjects(ps => ps.map(p => p._id === id ? prev : p));
      showToast('error', 'Network error');
    }
  };

  /* ── FILTER ── */
  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return projects.filter(p => {
      const searchMatch = !s ||
        p.projectName?.toLowerCase().includes(s) ||
        p.client?.name?.toLowerCase().includes(s) ||
        p.projectId?.toLowerCase().includes(s) ||
        p.client?.email?.toLowerCase().includes(s) ||
        p.category?.toLowerCase().includes(s);

      const categoryMatch = !categoryFilter || p.category === categoryFilter;
      const statusMatch = !statusFilter || p.status === statusFilter;

      return searchMatch && categoryMatch && statusMatch;
    });
  }, [search, categoryFilter, statusFilter, projects]);

  /* ── PAGINATION ── */
  const perPage = viewMode === 'card' ? itemsPerPage : itemsPerPage;
  const totalPages = Math.ceil(filtered.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const paginated = filtered.slice(startIndex, startIndex + perPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, statusFilter, itemsPerPage, viewMode]);

  /* ── STATS ── */
  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    onHold: projects.filter(p => p.status === 'on hold').length,
  }), [projects]);

  /* ── EXPORT ── */
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(p => ({
      'Project ID': p.projectId || 'N/A',
      'Project Name': p.projectName || 'N/A',
      'Client': p.client?.name || 'N/A',
      'Category': p.category || 'N/A',
      'Mobile': p.client?.mobile || 'N/A',
      'Email': p.client?.email || 'N/A',
      'Status': p.status || 'N/A',
      'Start Date': fmtDate(p.projectStartDate),
      'Deadline': fmtDate(p.deadline),
      'Cost': p.projectCost || 0,
      'Payment Milestones': p.paymentMilestone || 0,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Projects');
    XLSX.writeFile(wb, `Projects_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  /* ── SPINNER COMPONENT ── */
  const Spinner = () => (
    <div className="inline-block w-10 h-10 border-3 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/70">
      {/* ── TOAST ── */}
      {toastMsg && (
        <div className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl font-semibold text-sm max-w-[calc(100vw-2rem)] sm:max-w-sm animate-slideDown ${toastMsg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          <span>{toastMsg.type === 'success' ? '✓' : '✕'}</span>
          <span className="flex-1 text-xs sm:text-sm">{toastMsg.message}</span>
          <button onClick={() => setToastMsg(null)} className="opacity-80 hover:opacity-100 ml-1">✕</button>
        </div>
      )}

      <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 lg:py-8">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30 shrink-0">
              <FaFolderOpen className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight">
                Project Management
              </h1>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                {stats.total} projects · {stats.active} active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {/* Bulk Delete */}
            {/* {(loginDetails?.role === "Admin" || access.includes("delete")) && (
              <button onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-md">
                <MdDelete size={16} /> Delete ({deleteIds.length})
              </button>
            )} */}

            {/* View Toggle */}
            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
              <button onClick={() => setViewMode('card')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'card' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-500 hover:text-teal-600'
                  }`}>
                <MdGridView size={15} />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'table' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-500 hover:text-teal-600'
                  }`}>
                <MdTableRows size={15} />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
            {(loginDetails?.role === "Admin" || access.includes("export")) && (
              <button onClick={exportToExcel}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold text-xs sm:text-sm transition-all shadow-sm flex-1 sm:flex-none justify-center">
                <MdDownload size={16} /> Export
              </button>
            )}
            {(loginDetails?.role === "Admin" || access.includes("add")) && (
              <Link to="/add-project"
                className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-xl hover:scale-[1.02] transition-all text-xs sm:text-sm flex-1 sm:flex-none justify-center">
                <MdAdd size={17} /> Add Project
              </Link>
            )}
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4 mb-5 sm:mb-6">
          {[
            { label: 'Total', value: stats.total, icon: '📁', color: 'teal' },
            { label: 'Active', value: stats.active, icon: '🟢', color: 'emerald' },
            { label: 'Completed', value: stats.completed, icon: '✅', color: 'blue' },
            { label: 'On Hold', value: stats.onHold, icon: '⏸️', color: 'amber' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 sm:p-4 border border-teal-100/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{s.icon}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full hidden sm:inline ${s.color === 'teal' ? 'bg-teal-100 text-teal-700' :
                  s.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                    s.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'}`}>{s.label}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── FILTER BAR ── */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 sm:p-4 lg:p-5 mb-5 sm:mb-6 border border-teal-100/50 shadow-sm">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                <FaFilter className="text-teal-600" size={12} />
              </div>
              <span className="font-bold text-gray-800 text-sm">Filters</span>
              <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs font-bold">{filtered.length}</span>
            </div>
            <button onClick={fetchProjects}
              className="p-1.5 sm:p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all" title="Refresh">
              <MdRefresh size={17} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
              <input
                className="w-full h-10 pl-8 pr-3 rounded-xl text-sm placeholder:text-gray-400 text-gray-700 bg-white border border-teal-200/50 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="Search project, client, ID…"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select
              className="w-full h-10 px-3 rounded-xl text-sm text-gray-700 appearance-none cursor-pointer bg-white border border-teal-200/50 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              <option value="website">Website</option>
              <option value="mobile app">Mobile App</option>
              <option value="software">Software</option>
              <option value="digital marketing">Digital Marketing</option>
            </select>
            <select
              className="w-full h-10 px-3 rounded-xl text-sm text-gray-700 appearance-none cursor-pointer bg-white border border-teal-200/50 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="on hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="w-full h-10 px-3 rounded-xl text-sm text-gray-700 appearance-none cursor-pointer bg-white border border-teal-200/50 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
              {viewMode === 'card'
                ? [<option key={8} value={8}>8 / page</option>,
                <option key={12} value={12}>12 / page</option>,
                <option key={24} value={24}>24 / page</option>]
                : [<option key={10} value={10}>10 / page</option>,
                <option key={20} value={20}>20 / page</option>,
                <option key={50} value={50}>50 / page</option>]}
            </select>
          </div>
        </div>

        {/* ── LOADING ── */}
        {loading && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-14 flex flex-col items-center gap-4 border border-teal-100/50 shadow-sm">
            <Spinner />
            <p className="text-gray-500 text-sm font-medium">Loading projects…</p>
          </div>
        )}

        {/* ── ERROR ── */}
        {!loading && error && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-10 flex flex-col items-center gap-4 text-center border border-teal-100/50 shadow-sm">
            <p className="text-5xl">⚠️</p>
            <p className="font-bold text-gray-800">Failed to load projects</p>
            <p className="text-gray-400 text-sm max-w-xs">{error}</p>
            <button onClick={fetchProjects} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ════════════ CARD VIEW ════════════ */}
            {viewMode === 'card' && (
              <div className="animate-fadeIn">
                {paginated.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                    {paginated.map((p, idx) => (
                      <ProjectCard
                        key={p._id}
                        p={p}
                        idx={startIndex + idx}
                        onView={(id) => navigate(`/projects/${id}`)}
                        onEdit={(id) => navigate(`/edit-project/${id}`)}
                        onDelete={(id) => handleDelete(id)}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-14 flex flex-col items-center gap-3 border border-teal-100/50 shadow-sm">
                    <FaFolderOpen className="text-gray-200" size={48} />
                    <p className="text-gray-400 font-semibold text-sm">No projects found</p>
                    <Link to="/add-project"
                      className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition-colors">
                      Create First Project
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ════════════ TABLE VIEW ════════════ */}
            {viewMode === 'table' && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden border border-teal-100/50 shadow-sm animate-fadeIn">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px]">
                    <thead>
                      <tr className="bg-gradient-to-r from-teal-700 to-teal-600 text-white">
                        <th className="hidden sm:table-cell py-3 px-3 sm:px-4 text-left text-xs font-semibold whitespace-nowrap">ID</th>
                        <th className="py-3 px-3 sm:px-4 text-left text-xs font-semibold">Project</th>
                        <th className="hidden md:table-cell py-3 px-3 sm:px-4 text-left text-xs font-semibold whitespace-nowrap">Category</th>
                        <th className="hidden lg:table-cell py-3 px-3 sm:px-4 text-left text-xs font-semibold whitespace-nowrap">Contact</th>
                        <th className="py-3 px-3 sm:px-4 text-left text-xs font-semibold whitespace-nowrap">Status</th>
                        <th className="py-3 px-3 sm:px-4 text-left text-xs font-semibold whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.length > 0 ? paginated.map((p, idx) => (
                        <tr key={p._id} className="border-b border-gray-50 hover:bg-teal-50/50 transition-colors">
                          <td className="hidden sm:table-cell py-3 px-3 sm:px-4">
                            <span className="font-mono font-semibold text-gray-600 text-xs whitespace-nowrap">{p.projectId || '—'}</span>
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-[200px]">
                              {p.projectName || 'Untitled'}
                            </p>
                            <p className="text-xs text-gray-400 truncate max-w-[120px] sm:max-w-[180px]">
                              {p.client?.name || 'No Client'}
                            </p>
                          </td>
                          <td className="hidden md:table-cell py-3 px-3 sm:px-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap ${categoryBadge(p.category)}`}>
                              {p.category || 'N/A'}
                            </span>
                          </td>
                          <td className="hidden lg:table-cell py-3 px-3 sm:px-4">
                            <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <FaMobileAlt size={10} className="text-gray-400 shrink-0" />
                                <span className="truncate max-w-[90px]">{p.client?.mobile || '—'}</span>
                              </span>
                              <span className="flex items-center gap-1 truncate max-w-[130px]">
                                <FaEnvelope size={10} className="text-gray-400 shrink-0" />
                                <span className="truncate">{p.client?.email || '—'}</span>
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            <select value={p.status || 'active'} onChange={(e) => handleStatusChange(p._id, e.target.value)}
                              className={`border rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer appearance-none bg-transparent ${statusColor(p.status)}`}>
                              <option value="active">Active</option>
                              <option value="on hold">On Hold</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            <div className="flex items-center gap-1">
                              {(loginDetails?.role === "Admin" || access.includes("view")) && (
                                <button onClick={() => navigate(`/projects/${p._id}`)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 bg-teal-50 hover:bg-teal-100 text-teal-600" title="View">
                                  <MdVisibility size={15} />
                                </button>
                              )}
                              {(loginDetails?.role === "Admin" || access.includes("edit")) && (
                                <button onClick={() => navigate(`/edit-project/${p._id}`)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 bg-blue-50 hover:bg-blue-100 text-blue-600" title="Edit">
                                  <MdEdit size={15} />
                                </button>
                              )}
                              {(loginDetails?.role === "Admin" || access.includes("delete")) && (
                                <button onClick={() => handleDelete(p._id)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 bg-red-50 hover:bg-red-100 text-red-500" title="Delete">
                                  <MdDelete size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={7} className="py-14 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <FaFolderOpen className="text-gray-200" size={44} />
                              <p className="text-gray-400 font-semibold text-sm">No projects found</p>
                              <Link to="/add-project"
                                className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition-colors">
                                Create First Project
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── PAGINATION ── */}
            {totalPages > 1 && (
              <div className="mt-4 px-3 sm:px-5 py-3 sm:py-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5">
                  <p className="text-xs text-gray-500">
                    Showing <span className="font-bold text-teal-700">{startIndex + 1}</span>–
                    <span className="font-bold text-teal-700">{Math.min(startIndex + perPage, filtered.length)}</span>
                    {' '}of <span className="font-bold text-teal-700">{filtered.length}</span>
                  </p>
                  <div className="flex items-center gap-1 flex-wrap">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                      className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs border transition-all ${currentPage === 1 ? 'text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed'
                        : 'text-teal-700 border-teal-200 hover:bg-teal-50 bg-white'}`}>
                      ← Prev
                    </button>
                    {[...Array(totalPages)].map((_, i) => {
                      const pg = i + 1;
                      if (pg === 1 || pg === totalPages || (pg >= currentPage - 1 && pg <= currentPage + 1))
                        return (
                          <button key={pg} onClick={() => setCurrentPage(pg)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-bold text-xs transition-all ${currentPage === pg ? 'bg-teal-600 text-white shadow-md' : 'hover:bg-teal-50 text-gray-600 bg-white border border-gray-100'}`}>
                            {pg}
                          </button>
                        );
                      if (pg === currentPage - 2 || pg === currentPage + 2)
                        return <span key={pg} className="text-gray-400 text-xs px-1">…</span>;
                      return null;
                    })}
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                      className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs border transition-all ${currentPage === totalPages ? 'text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed'
                        : 'text-teal-700 border-teal-200 hover:bg-teal-50 bg-white'}`}>
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Projects;