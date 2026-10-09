import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MdEdit,
  MdDelete,
  MdVisibility,
  MdDownload,
  MdRefresh,
  MdAdd,
} from "react-icons/md";
import {
  FaSearch,
  FaFilter,
  FaUsers,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";
import * as XLSX from "xlsx";

const API_URL = "https://pmsbackend.pixelmindsolutions.com/api/clients/all";
const DELETE_URL = "https://pmsbackend.pixelmindsolutions.com/api/clients";

const loginDetails = JSON.parse(sessionStorage.getItem("loginDetails"));

const AUTH_TOKEN = loginDetails?.token;

const permission = loginDetails?.modulePermissions?.find(
  (item) => item.component === "clients",
);

const access = permission?.items?.[0]?.permission || [];

const headers = () => ({
  Authorization: `Bearer ${AUTH_TOKEN}`,
  "Content-Type": "application/json",
});

const LEAD_BADGE_STYLES = {
  socialmedia: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "social media": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "mobile application": "bg-sky-50 text-sky-700 border border-sky-200",
  referral: "bg-amber-50 text-amber-700 border border-amber-200",
  "web development": "bg-violet-50 text-violet-700 border border-violet-200",
  "digital marketing": "bg-pink-50 text-pink-700 border border-pink-200",
  "erp solutions": "bg-blue-50 text-blue-700 border border-blue-200",
  "app development": "bg-teal-50 text-teal-700 border border-teal-200",
};

const FALLBACK_BADGE_STYLES = [
  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "bg-sky-50 text-sky-700 border border-sky-200",
  "bg-amber-50 text-amber-700 border border-amber-200",
  "bg-violet-50 text-violet-700 border border-violet-200",
  "bg-pink-50 text-pink-700 border border-pink-200",
  "bg-blue-50 text-blue-700 border border-blue-200",
  "bg-teal-50 text-teal-700 border border-teal-200",
  "bg-orange-50 text-orange-700 border border-orange-200",
  "bg-rose-50 text-rose-700 border border-rose-200",
  "bg-indigo-50 text-indigo-700 border border-indigo-200",
];

const getLeadBadgeClass = (leadRaw) => {
  if (!leadRaw) return "bg-gray-50 text-gray-600 border border-gray-200";
  const key = leadRaw.toString().split("(")[0].trim().toLowerCase();
  if (LEAD_BADGE_STYLES[key]) return LEAD_BADGE_STYLES[key];

  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_BADGE_STYLES[hash % FALLBACK_BADGE_STYLES.length];
};

const normalizeLeadStatus = (value) => {
  const raw = value === undefined || value === null ? "" : String(value).trim();
  if (!raw) return "Running";

  const normalized = raw.toLowerCase();
  if (
    ["converted", "conversion", "converted lead", "won", "closed won"].includes(
      normalized,
    )
  ) {
    return "Converted";
  }
  if (
    [
      "cancelled",
      "canceled",
      "cancel",
      "rejected",
      "lost",
      "closed lost",
    ].includes(normalized)
  ) {
    return "Cancelled";
  }
  return "Running";
};

const AllClients = () => {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL, {
        headers: headers(),
      });
      const data = await response.json();

      if (data.success) {
        setClients(Array.isArray(data.data) ? data.data : []);
      } else {
        throw new Error(data.message || "Failed to load clients");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const showToast = (type, message) => {
    setToastMsg({ type, message });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${DELETE_URL}/${id}/delete`, {
        method: "DELETE",
        headers: headers(),
      });
      const data = await response.json();

      if (data.success) {
        setClients((prev) => prev.filter((c) => c._id !== id));
        showToast("success", "Client deleted successfully");
      } else {
        showToast("error", data.message || "Delete failed");
      }
    } catch {
      showToast("error", "Network error while deleting");
    } finally {
      setDeleteId(null);
    }
  };

  const leadStats = useMemo(() => {
    const running = clients.filter(
      (c) =>
        normalizeLeadStatus(c.leadStatus || c.status || c.lead) === "Running",
    ).length;
    const converted = clients.filter(
      (c) =>
        normalizeLeadStatus(c.leadStatus || c.status || c.lead) === "Converted",
    ).length;
    const cancelled = clients.filter(
      (c) =>
        normalizeLeadStatus(c.leadStatus || c.status || c.lead) === "Cancelled",
    ).length;

    return { running, converted, cancelled };
  }, [clients]);

  // helper: safe requirement → array of strings
  const toReqArray = (req) => {
    if (Array.isArray(req)) return req.filter(Boolean);
    if (typeof req === "string" && req.trim()) {
      return req
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  };

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return clients.filter((c) => {
      const reqText = toReqArray(c.requirement).join(" ").toLowerCase();
      const match =
        c.name?.toLowerCase().includes(s) ||
        c.mobile?.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s) ||
        c.lead?.toLowerCase().includes(s) ||
        reqText.includes(s);
      return match;
    });
  }, [search, clients]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((c) => ({
        Name: c.name,
        Mobile: c.mobile,
        Email: c.email,
        Address: c.address,
        "Lead Source": c.lead,
        Requirements: toReqArray(c.requirement).join(", "),
        Created: new Date(c.createdAt).toLocaleDateString(),
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    XLSX.writeFile(
      wb,
      `Clients_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/70">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { font-family:'Inter',-apple-system,sans-serif; box-sizing:border-box; }
        .card { background:rgba(255,255,255,0.93); border:1px solid rgba(20,184,166,0.15); box-shadow:0 4px 20px -4px rgba(0,128,128,0.10); }
        .stat-card { background:#fff; border:1px solid rgba(20,184,166,0.15); box-shadow:0 2px 10px rgba(0,128,128,0.07); transition:all .25s ease; }
        .stat-card:hover { transform:translateY(-2px); box-shadow:0 8px 22px rgba(0,128,128,0.13); }
        .client-card { transition:all .3s ease; }
        .client-card:hover { transform:translateY(-4px); box-shadow:0 12px 30px rgba(0,128,128,0.12); }
        .s-inp { background:#fff; border:1.5px solid rgba(0,128,128,0.14); transition:border-color .2s, box-shadow .2s; width:100%; }
        .s-inp:focus { border-color:#0d9488; box-shadow:0 0 0 3px rgba(13,148,136,0.1); outline:none; }
        @keyframes slideDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        .toast-in { animation:slideDown .3s ease forwards; }
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        .spinner { width:40px;height:40px;border:3px solid #e0f2f1;border-top:3px solid #0d9488;border-radius:50%;animation:spin .8s linear infinite; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp .3s ease forwards; }
        .modal-back { position:fixed;inset:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);z-index:50;display:flex;align-items:center;justify-content:center;padding:16px; }
        .scroll-x::-webkit-scrollbar { height:4px; }
        .scroll-x::-webkit-scrollbar-thumb { background:#99f6e4; border-radius:4px; }
      `}</style>

      {toastMsg && (
        <div
          className={`toast-in fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl font-semibold text-sm max-w-sm ${toastMsg.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}
        >
          <span>{toastMsg.type === "success" ? "✓" : "!"}</span>
          <span className="flex-1 text-sm">{toastMsg.message}</span>
          <button
            onClick={() => setToastMsg(null)}
            className="opacity-80 hover:opacity-100 ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {deleteId && (
        <div className="modal-back">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <MdDelete className="text-red-500" size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-800 text-center mb-1">
              Delete Client?
            </h3>
            <p className="text-xs text-gray-500 text-center mb-5">
              This action cannot be undone.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <FaUsers className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight">
                Clients
              </h1>
              <p className="text-sm text-gray-500">
                {clients.length} clients registered
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {(loginDetails?.role === "Admin" || access.includes("export")) && (
              <button
                onClick={exportToExcel}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold text-sm transition-all shadow-sm"
              >
                <MdDownload size={16} /> Export
              </button>
            )}
            {(loginDetails?.role === "Admin" || access.includes("add")) && (
              <Link
                to="/add-client"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-xl hover:scale-[1.02] transition-all text-sm"
              >
                <MdAdd size={18} /> Add Client
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            {
              label: "Running",
              value: leadStats.running,
              icon: "🔄",
              color: "amber",
            },
            {
              label: "Converted",
              value: leadStats.converted,
              icon: "✅",
              color: "green",
            },
            {
              label: "Cancelled",
              value: leadStats.cancelled,
              icon: "❌",
              color: "red",
            },
          ].map((s, i) => (
            <div key={i} className="stat-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{s.icon}</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    s.color === "amber"
                      ? "bg-amber-100 text-amber-700"
                      : s.color === "green"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-800">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="card rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                <FaFilter className="text-teal-600" size={12} />
              </div>
              <span className="font-bold text-gray-800 text-sm">Search</span>
              <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs font-bold">
                {filtered.length}
              </span>
            </div>
            <button
              onClick={fetchClients}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
              title="Refresh"
            >
              <MdRefresh size={18} />
            </button>
          </div>

          {/* ── Search + Page size ─────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search group — width constrained */}
            <div className="flex items-center gap-2 w-full sm:w-80">
              {/* Icon box */}
              <div className="w-9 h-9 shrink-0 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
                <FaSearch className="text-teal-600" size={12} />
              </div>

              {/* Input — override s-inp width:100% with !w-auto */}
              <input
                className="s-inp !w-full h-9 px-3 rounded-lg text-sm placeholder:text-gray-400 text-gray-700 min-w-0"
                placeholder="Search by name, mobile, email, lead…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Page size select — fixed width */}
            <select
              className="s-inp !w-full sm:!w-32 h-9 px-3 rounded-lg text-sm text-gray-700 appearance-none cursor-pointer shrink-0"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="card rounded-2xl p-14 flex flex-col items-center gap-4">
            <div className="spinner" />
            <p className="text-gray-500 text-sm font-medium">
              Loading clients…
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="card rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
            <p className="text-5xl">⚠️</p>
            <p className="font-bold text-gray-800">Failed to load clients</p>
            <p className="text-gray-400 text-sm max-w-xs">{error}</p>
            <button
              onClick={fetchClients}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="fade-up">
            {paginated.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginated.map((client) => {
                  const reqList = toReqArray(client.requirement);
                  return (
                    <div
                      key={client._id}
                      className="client-card bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
                    >
                      <div className="p-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-teal-500/20 mb-2.5">
                          {client.name?.charAt(0).toUpperCase() || "?"}
                        </div>

                        <h3 className="font-bold text-gray-800 text-base truncate">
                          {client.name}
                        </h3>

                        <div className="mt-2 space-y-1">
                          {client.mobile && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FaPhone size={12} className="text-teal-500" />
                              <span className="truncate">{client.mobile}</span>
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FaEnvelope size={12} className="text-teal-500" />
                              <span className="truncate">{client.email}</span>
                            </div>
                          )}
                          {client.address && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FaMapMarkerAlt
                                size={12}
                                className="text-teal-500"
                              />
                              <span className="truncate">{client.address}</span>
                            </div>
                          )}
                        </div>

                        {client.lead && (
                          <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getLeadBadgeClass(client.lead)}`}
                            >
                              {client.lead}
                            </span>
                          </div>
                        )}

                        {/* Requirements badges */}
                        {reqList.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {reqList.slice(0, 3).map((r, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-100 rounded-full px-2 py-0.5"
                              >
                                ⚡ {r}
                              </span>
                            ))}
                            {reqList.length > 3 && (
                              <span className="inline-flex items-center text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 rounded-full px-2 py-0.5">
                                +{reqList.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-stretch gap-2 px-4 pb-4">
                        <button
                          onClick={() => navigate(`/client/${client._id}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-xs transition-all"
                        >
                          <MdVisibility size={14} /> View
                        </button>
                        <button
                          onClick={() => navigate(`/edit-client/${client._id}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-all"
                        >
                          <MdEdit size={14} /> Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(client._id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs transition-all"
                        >
                          <MdDelete size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card rounded-2xl p-14 flex flex-col items-center gap-3">
                <FaUsers className="text-gray-200" size={48} />
                <p className="text-gray-400 font-semibold text-sm">
                  No clients found
                </p>
                <Link
                  to="/add-client"
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition-colors"
                >
                  Add First Client
                </Link>
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-4 px-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <p className="text-xs text-gray-500">
                    Showing{" "}
                    <span className="font-bold text-teal-700">
                      {startIndex + 1}
                    </span>
                    –
                    <span className="font-bold text-teal-700">
                      {Math.min(startIndex + itemsPerPage, filtered.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-teal-700">
                      {filtered.length}
                    </span>
                  </p>
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs border transition-all ${
                        currentPage === 1
                          ? "text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed"
                          : "text-teal-700 border-teal-200 hover:bg-teal-50 bg-white"
                      }`}
                    >
                      ← Prev
                    </button>
                    {[...Array(totalPages)].map((_, i) => {
                      const pg = i + 1;
                      if (
                        pg === 1 ||
                        pg === totalPages ||
                        (pg >= currentPage - 1 && pg <= currentPage + 1)
                      )
                        return (
                          <button
                            key={pg}
                            onClick={() => setCurrentPage(pg)}
                            className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${currentPage === pg ? "bg-teal-600 text-white shadow-md" : "hover:bg-teal-50 text-gray-600 bg-white border border-gray-100"}`}
                          >
                            {pg}
                          </button>
                        );
                      if (pg === currentPage - 2 || pg === currentPage + 2)
                        return (
                          <span key={pg} className="text-gray-400 text-xs px-1">
                            …
                          </span>
                        );
                      return null;
                    })}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs border transition-all ${
                        currentPage === totalPages
                          ? "text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed"
                          : "text-teal-700 border-teal-200 hover:bg-teal-50 bg-white"
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllClients;
