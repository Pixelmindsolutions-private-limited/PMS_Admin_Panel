import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, ChevronDown, ChevronUp, Plus, Download, Search, Loader2, AlertCircle, CheckCircle2, Clock, Flag } from "lucide-react";
import * as XLSX from "xlsx";
import { getAuthHeaders } from "../../utils/Auth";
import { FaTasks } from "react-icons/fa";

const API_BASE = "https://pmsbackend.pixelmindsolutions.com/api";

const loginDetails = JSON.parse(sessionStorage.getItem("loginDetails"));

const AUTH_TOKEN = loginDetails?.token;

const permission = loginDetails?.modulePermissions?.find(
  (item) => item.component === "assignedWorks"
);

const access = permission?.items?.[0]?.permission || [];

const AssignedWorks = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sheetFilter, setSheetFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");

  // Server-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 10;

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDates, setExportDates] = useState({ startDate: "", endDate: "" });
  const modalRef = useRef(null);

  // Format date helper
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  // Priority badge style
  const getPriorityStyle = (priority) => {
    const styles = {
      low: "bg-green-100 text-green-700 border-green-200",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
      high: "bg-red-100 text-red-700 border-red-200"
    };
    return styles[priority] || styles.medium;
  };

  // Status badge style
  const getStatusStyle = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      "in-progress": "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-green-100 text-green-700 border-green-200",
      overdue: "bg-red-100 text-red-700 border-red-200"
    };
    return styles[status] || styles.pending;
  };

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    fetchAssignments(currentPage);
  }, [currentPage, searchTerm, sheetFilter, projectFilter]);

  const fetchAssignments = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(sheetFilter && { sheet: sheetFilter }),
        ...(projectFilter && { project: projectFilter }),
      });

      const res = await fetch(`${API_BASE}/worksheets?${params}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();

      if (data.success) {
        setAssignments(data.data);
        setTotalPages(data.pagination.pages);
        setTotalRecords(data.pagination.total);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this worksheet?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/worksheets/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (data.success) {
        fetchAssignments(currentPage);
      } else {
        alert(data.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Delete failed");
    }
    setDeletingId(null);
  };

  /* ---------------- EXPAND ---------------- */
  const toggleExpand = (id) => {
    const updated = new Set(expandedRows);
    updated.has(id) ? updated.delete(id) : updated.add(id);
    setExpandedRows(updated);
  };

  const toggleProjectExpand = (projectId) => {
    const updated = new Set(expandedProjects);
    updated.has(projectId) ? updated.delete(projectId) : updated.add(projectId);
    setExpandedProjects(updated);
  };

  /* ---------------- EXPORT ---------------- */
  const handleExport = async () => {
    if (!exportDates.startDate || !exportDates.endDate) {
      alert("Select both start and end dates");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/worksheets/export`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          startDate: exportDates.startDate,
          endDate: exportDates.endDate
        }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.message || "Failed to fetch data for export");
        return;
      }

      if (data.count === 0) {
        alert("No records found in the selected date range");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(data.data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Assignments");
      XLSX.writeFile(wb, `AssignedWorks_${exportDates.startDate}_to_${exportDates.endDate}.xlsx`);
      setShowExportModal(false);
      setExportDates({ startDate: "", endDate: "" });
    } catch (err) {
      console.error("Export error:", err);
      alert("Export failed");
    }
  };

  /* ---------------- LOADING ---------------- */
  if (loading && assignments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center p-4">
        <div className="text-center space-y-4 animate-pulse">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-100/60" />
          <div className="h-4 w-48 mx-auto rounded bg-slate-200" />
          <div className="h-3 w-64 mx-auto rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shrink-0">
                <FaTasks size={20} />
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent leading-tight">
                  Assigned Works
                </h1>

                <p className="flex flex-wrap items-center gap-2 text-slate-500 mt-1 text-sm md:text-base">
                  <span>Manage employee project assignments and tasks</span>

                  {totalRecords > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                      {totalRecords} total
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {(loginDetails?.role === "Admin" || access.includes("export")) && (
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50/60 font-semibold transition-all text-sm"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
            {(loginDetails?.role === "Admin" || access.includes("add")) && (
              <Link
                to="/add-worksheet"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all text-sm"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Add Worksheet</span>
              </Link>
            )}
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-4 md:p-6 shadow-lg shadow-slate-200/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search size={16} className="absolute top-3.5 left-3 text-slate-400" />
              <input
                placeholder="Search employee..."
                className="w-full pl-9 pr-3 h-11 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <select
              className="h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm"
              value={sheetFilter}
              onChange={(e) => { setSheetFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Sheets</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="testing">Testing</option>
              <option value="design">Design</option>
              <option value="Full Stack">Full Stack</option>
              <option value="Digital Marketing">Digital Marketing</option>
            </select>
            <select
              className="h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm"
              value={projectFilter}
              onChange={(e) => { setProjectFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Projects</option>
              {[...new Set(assignments.flatMap(a => a.projects?.map(p => p.projectName) || []))].map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
            {(searchTerm || sheetFilter || projectFilter) && (
              <button
                onClick={() => { setSearchTerm(""); setSheetFilter(""); setProjectFilter(""); setCurrentPage(1); }}
                className="h-11 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-sm font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-lg shadow-slate-200/30 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 text-slate-600">
                <tr>
                  <th className="p-4 text-left font-semibold">#</th>
                  <th className="p-4 text-left font-semibold">Employee</th>
                  <th className="p-4 text-center font-semibold">Sheet</th>
                  <th className="p-4 text-center font-semibold">Projects & Tasks</th>
                  <th className="p-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <AlertCircle className="w-10 h-10 text-slate-300" />
                        <p>No assignments found matching your filters.</p>
                        <button onClick={() => { setSearchTerm(""); setSheetFilter(""); setProjectFilter(""); }} className="text-teal-600 hover:text-teal-700 font-medium text-sm">Clear filters</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  assignments.map((a, i) => {
                    const hasTasks = a.projects?.some(p => p.tasks && p.tasks.length > 0);
                    return (
                      <React.Fragment key={a._id}>
                        <tr className="border-t border-slate-100/60 hover:bg-slate-50/40 transition-colors">
                          <td className="p-4 font-medium text-slate-600">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                          <td className="p-4">
                            <div className="font-semibold text-slate-800">{a.employName}</div>
                            <div className="text-xs text-slate-400 mt-0.5">ID: {typeof a.empId === "string" ? a.empId.slice(-6).toUpperCase() : a.empId}</div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex px-3 py-1 text-xs rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 font-semibold border border-teal-100">
                              {a.sheet}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={() => toggleExpand(a._id)} className="inline-flex items-center gap-1 text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                              {a.projects?.length || 0} Project{(a.projects?.length || 0) !== 1 ? "s" : ""}
                              {(loginDetails?.role === "Admin" || access.includes("view")) && (
                                <>
                                  {hasTasks && <span className="text-xs bg-teal-100 px-1.5 py-0.5 rounded-full ml-1">with tasks</span>}
                                  {expandedRows.has(a._id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </>
                              )}
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end gap-3">
                              {(loginDetails?.role === "Admin" || access.includes("edit")) && (
                                <Link to={`/edit-worksheet/${a._id}`} className="p-2 rounded-xl text-teal-600 hover:bg-teal-50 hover:scale-105 transition-all">
                                  <Pencil size={18} />
                                </Link>
                              )}
                              {(loginDetails?.role === "Admin" || access.includes("delete")) && (
                                <button onClick={() => handleDelete(a._id)} disabled={deletingId === a._id} className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:scale-105 transition-all disabled:opacity-50">
                                  {deletingId === a._id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Projects and Tasks */}
                        {expandedRows.has(a._id) && (
                          <tr className="bg-gradient-to-br from-slate-50/60 to-white/30">
                            <td colSpan="5" className="p-6">
                              <div className="space-y-6">
                                {a.projects?.map((p, idx) => {
                                  const projectId = `${a._id}-${idx}`;
                                  const hasProjectTasks = p.tasks && p.tasks.length > 0;
                                  const isProjectExpanded = expandedProjects.has(projectId);

                                  return (
                                    <div key={p._id || idx} className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                      {/* Project Header */}
                                      <div
                                        className="p-4 cursor-pointer hover:bg-slate-50/60 transition-colors flex justify-between items-center"
                                        onClick={() => toggleProjectExpand(projectId)}
                                      >
                                        <div>
                                          <h4 className="font-semibold text-slate-800 text-lg">{p.projectName}</h4>
                                          <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(p.startDate)} → {formatDate(p.endDate)}</span>
                                            <span className="flex items-center gap-1"><Flag size={12} /> {p.hours} hours/day</span>
                                            <span className="capitalize">Shift: {p.shift}</span>
                                          </div>
                                          {p.comment && <p className="text-xs mt-2 text-slate-600 italic">"{p.comment}"</p>}
                                        </div>
                                        <div className="flex items-center gap-3">
                                          {hasProjectTasks && (
                                            <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
                                              {p.tasks.length} Task{p.tasks.length !== 1 ? "s" : ""}
                                            </span>
                                          )}
                                          {isProjectExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                        </div>
                                      </div>

                                      {/* Tasks Section */}
                                      {isProjectExpanded && (
                                        <div className="border-t border-slate-100 p-4 bg-slate-50/30">
                                          {!hasProjectTasks ? (
                                            <div className="text-center py-6 text-slate-400">
                                              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                              <p className="text-sm">No tasks assigned for this project</p>
                                            </div>
                                          ) : (
                                            <div className="space-y-3">
                                              <h5 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <CheckCircle2 size={14} className="text-teal-500" />
                                                Tasks
                                              </h5>
                                              <div className="space-y-2">
                                                {p.tasks.map((task, taskIdx) => (
                                                  <div key={task._id || taskIdx} className="bg-white rounded-xl p-3 border border-slate-100 hover:shadow-sm transition-shadow">
                                                    <div className="flex items-start justify-between">
                                                      <div className="flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                          <span className="font-medium text-slate-800 text-sm">{task.title}</span>
                                                          <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityStyle(task.priority)}`}>
                                                            {task.priority}
                                                          </span>
                                                          <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusStyle(task.status)}`}>
                                                            {task.status?.replace("-", " ")}
                                                          </span>
                                                        </div>
                                                        {task.description && (
                                                          <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                                                        )}
                                                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                                                          {task.dueDate && <span className="flex items-center gap-1"><Clock size={10} /> Due: {formatDate(task.dueDate)}</span>}
                                                          <span className="flex items-center gap-1">Est: {task.estimatedHours || 0}h</span>
                                                          <span className="flex items-center gap-1">Act: {task.actualHours || 0}h</span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
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

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-100/60">
            {assignments.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p className="text-sm">No assignments found</p>
              </div>
            ) : (
              assignments.map((a) => (
                <div key={a._id} className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">{a.employName}</div>
                      <div className="text-xs text-slate-400 mt-0.5">ID: {typeof a.empId === "string" ? a.empId.slice(-6).toUpperCase() : a.empId}</div>
                    </div>
                    <span className="px-2.5 py-1 text-xs rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 font-semibold border border-teal-100">
                      {a.sheet}
                    </span>
                  </div>

                  <button onClick={() => toggleExpand(a._id)} className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50/60 hover:bg-slate-100/60 transition-colors">
                    <span className="text-sm font-medium text-slate-700">{a.projects?.length || 0} Project{(a.projects?.length || 0) !== 1 ? "s" : ""}</span>
                    {expandedRows.has(a._id) ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </button>

                  {expandedRows.has(a._id) && (
                    <div className="space-y-3 pt-2">
                      {a.projects?.map((p, idx) => {
                        const projectId = `${a._id}-${idx}`;
                        const hasTasks = p.tasks && p.tasks.length > 0;
                        return (
                          <div key={p._id || idx} className="rounded-xl bg-white border border-slate-200/60 overflow-hidden">
                            <div
                              className="p-3 cursor-pointer hover:bg-slate-50 transition-colors flex justify-between items-center"
                              onClick={() => toggleProjectExpand(projectId)}
                            >
                              <div>
                                <div className="font-medium text-slate-800">{p.projectName}</div>
                                <div className="text-xs text-slate-500 mt-1">
                                  <span>{formatDate(p.startDate)} → {formatDate(p.endDate)}</span>
                                </div>
                              </div>
                              {hasTasks && (
                                <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                                  {p.tasks.length}
                                </span>
                              )}
                            </div>

                            {expandedProjects.has(projectId) && (
                              <div className="border-t border-slate-100 p-3 space-y-2">
                                {!hasTasks ? (
                                  <div className="text-center py-3 text-slate-400 text-xs">
                                    No tasks assigned
                                  </div>
                                ) : (
                                  p.tasks.map((task, taskIdx) => (
                                    <div key={task._id || taskIdx} className="bg-slate-50 rounded-lg p-2 text-xs">
                                      <div className="font-medium text-slate-700">{task.title}</div>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${getPriorityStyle(task.priority)}`}>
                                          {task.priority}
                                        </span>
                                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${getStatusStyle(task.status)}`}>
                                          {task.status?.replace("-", " ")}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <Link to={`/edit-worksheet/${a._id}`} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-teal-600 hover:bg-teal-50 text-sm font-medium transition-colors">
                      <Pencil size={14} /> Edit
                    </Link>
                    <button onClick={() => handleDelete(a._id)} disabled={deletingId === a._id} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 text-sm font-medium transition-colors disabled:opacity-50">
                      {deletingId === a._id ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />} Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 md:p-6 border-t border-slate-100/60">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium">‹ Prev</button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (pageNum > totalPages) return null;
                return (
                  <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-10 h-10 rounded-xl border transition-all text-sm font-medium ${currentPage === pageNum ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-transparent shadow-lg shadow-teal-500/25" : "border-slate-200 hover:bg-slate-50"}`}>
                    {pageNum}
                  </button>
                );
              })}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium">Next ›</button>
            </div>
          )}
        </div>
      </div>

      {/* EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowExportModal(false)}>
          <div ref={modalRef} className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md space-y-5 shadow-2xl shadow-black/20 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                <Download className="text-white" size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Export Data</h2>
            </div>
            <p className="text-sm text-slate-500">Select a date range to export worksheet assignments.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Start Date</label>
                <input
                  type="date"
                  className="w-full h-12 px-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  value={exportDates.startDate}
                  onChange={(e) => setExportDates({ ...exportDates, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">End Date</label>
                <input
                  type="date"
                  className="w-full h-12 px-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  value={exportDates.endDate}
                  onChange={(e) => setExportDates({ ...exportDates, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowExportModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={handleExport} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-500/25 transition-all">Download</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedWorks;