import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaUsers, FaSearch, FaFilter } from "react-icons/fa";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdRefresh,
  MdChat,
  MdRemoveRedEye,
  MdCalendarToday,
  MdClose,
} from "react-icons/md";
import { chatApi, isAdmin, formatDate, memberName, memberRole } from "./ChatApi";
import { GROUP_STYLES, Avatar } from "./ChatUi";

/*
  ADMIN PANEL  -  Route: <Route path="/groups" element={<AllGroupList />} />

  GET    /api/chat/groups   -> { success, data: [{ _id, name, title, description, createdAt,
                                  myRole, unreadCount, members: [{ user, employeeId, role, accountType, userInfo }] }] }
  DELETE /api/chat/:id      (group admin only)
*/

const AllGroupList = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const admin = isAdmin();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewGroup, setViewGroup] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await chatApi.groups();
      if (!Array.isArray(json.data)) throw new Error("Invalid response format");
      setGroups(json.data);
    } catch (err) {
      console.error("Fetch groups error:", err);
      setError(err.message || "Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.refresh]);

  const groupName = (g) => g.title || g.name || "Group";

  const stats = useMemo(() => {
    const total = groups.length;
    const uniqueMembers = new Set(
      groups.flatMap((g) => (g.members || []).map((m) => String(m.user)))
    ).size;
    const largest = groups.reduce((max, g) => Math.max(max, g.members?.length || 0), 0);
    return { total, uniqueMembers, largest };
  }, [groups]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return groups.filter(
      (g) =>
        groupName(g).toLowerCase().includes(q) ||
        (g.members || []).some((m) => memberName(m).toLowerCase().includes(q))
    );
  }, [groups, search]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await chatApi.deleteChat(deleteConfirm.id);
      setGroups((prev) => prev.filter((g) => g._id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      alert(err.message || "Failed to delete group.");
    } finally {
      setDeleting(false);
    }
  };

  const openChat = (g) => navigate("/chat", { state: { chatId: g._id } });

  return (
    <div className="gc-root min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/80">
      <style>{GROUP_STYLES}</style>

      {/* DELETE MODAL */}
      {deleteConfirm && (
        <div className="modal-back">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl fade-up">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <MdDelete className="text-red-500" size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-800 text-center mb-1">Delete group?</h3>
            <p className="text-xs text-gray-500 text-center mb-5">
              <span className="font-semibold text-gray-700">{deleteConfirm.name}</span> and its
              messages will be removed.
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 text-sm">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm disabled:opacity-60">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEMBERS MODAL */}
      {viewGroup && (
        <div className="modal-back" onClick={() => setViewGroup(null)}>
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl fade-up flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-teal-50">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar group size={42} />
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-800 truncate">{groupName(viewGroup)}</h3>
                  <p className="text-xs text-gray-500">{viewGroup.members?.length || 0} members</p>
                </div>
              </div>
              <button onClick={() => setViewGroup(null)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center shrink-0">
                <MdClose size={18} />
              </button>
            </div>
            <div className="overflow-y-auto scroll-y p-3 sm:p-4 space-y-2">
              {(viewGroup.members || []).map((m) => (
                <div key={String(m.user)} className="flex items-center gap-3 p-2.5 rounded-xl bg-teal-50/50 border border-teal-50">
                  <Avatar name={memberName(m)} size={36} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{memberName(m)}</p>
                    <p className="text-xs text-teal-600 font-semibold truncate">{memberRole(m)}</p>
                  </div>
                  <div className="ml-auto text-right shrink-0">
                    {m.role === "admin" && (
                      <span className="block text-[10px] font-bold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded-full mb-0.5">
                        Group admin
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-gray-400">{m.employeeId || "Admin"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 lg:py-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30 shrink-0">
              <FaUsers className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight leading-tight">
                Groups
              </h1>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full inline-block" />
                {stats.total} groups &middot; {stats.uniqueMembers} people
              </p>
            </div>
          </div>
          {admin && (
            <Link
              to="/add-group"
              className="group flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-xl hover:scale-[1.02] transition-all text-sm w-full sm:w-auto"
            >
              <MdAdd size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              Create group
            </Link>
          )}
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4 mb-5 sm:mb-6">
          {[
            { label: "Total Groups", value: stats.total, icon: "💬", badge: "bg-teal-100 text-teal-700", short: "Groups" },
            { label: "People in Groups", value: stats.uniqueMembers, icon: "👥", badge: "bg-blue-100 text-blue-700", short: "People" },
            { label: "Largest Group", value: stats.largest, icon: "🏆", badge: "bg-purple-100 text-purple-700", short: "Largest" },
          ].map((s, i) => (
            <div key={i} className="stat-card rounded-2xl p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg sm:text-2xl">{s.icon}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full hidden sm:inline ${s.badge}`}>
                  {s.short}
                </span>
              </div>
              <p className="text-xl sm:text-3xl font-bold text-gray-800 leading-none">{s.value}</p>
              <p className="text-xs text-gray-400 font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* FILTER BAR */}
        <div className="premium-card rounded-2xl p-3.5 sm:p-4 lg:p-5 mb-5 sm:mb-6">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                <FaFilter className="text-teal-600" size={12} />
              </div>
              <span className="font-bold text-gray-800 text-sm">Search</span>
              <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs font-bold">
                {filtered.length}
              </span>
            </div>
            <button onClick={() => { setSearch(""); fetchGroups(); }}
              className="p-1.5 sm:p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all" title="Refresh">
              <MdRefresh size={17} />
            </button>
          </div>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
            <input
              className="s-input w-full h-10 pl-8 pr-3 rounded-xl border-2 border-gray-100 bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all text-xs sm:text-sm text-gray-700 placeholder:text-gray-400"
              placeholder="Search by group or member name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="premium-card rounded-2xl p-12 sm:p-16 flex flex-col items-center justify-center gap-4">
            <div className="spinner" />
            <p className="text-gray-500 font-medium text-sm">Loading groups…</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="premium-card rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
              <MdRefresh className="text-red-400" size={28} />
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">Failed to load groups</p>
              <p className="text-gray-400 text-sm max-w-xs">{error}</p>
            </div>
            <button onClick={fetchGroups}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors text-sm">
              Retry
            </button>
          </div>
        )}

        {/* GROUP CARDS */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filtered.length > 0 ? (
              filtered.map((g, index) => {
                const members = g.members || [];
                const preview = members.slice(0, 4);
                const extra = members.length - preview.length;
                const canManage = g.myRole === "admin";
                return (
                  <div
                    key={g._id}
                    className="premium-card rounded-2xl p-4 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 fade-up flex flex-col"
                    style={{ animationDelay: `${index * 35}ms` }}
                  >
                    <div className="flex items-center gap-2.5 mb-3 min-w-0">
                      <Avatar group size={44} />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-800 text-sm truncate">{groupName(g)}</h3>
                        <p className="text-xs text-teal-600 font-semibold">{members.length} members</p>
                      </div>
                      {g.unreadCount > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {g.unreadCount > 99 ? "99+" : g.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="py-3 border-t border-b border-gray-100 flex-1 space-y-2.5">
                      {g.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">{g.description}</p>
                      )}
                      <div className="flex items-center">
                        {preview.map((m, i) => (
                          <div key={String(m.user)} className="-ml-2 first:ml-0 ring-2 ring-white rounded-full" style={{ zIndex: 10 - i }}>
                            <span
                              className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center text-xs font-bold"
                              title={memberName(m)}
                            >
                              {memberName(m).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        ))}
                        {extra > 0 && (
                          <span className="-ml-2 w-8 h-8 rounded-full bg-teal-50 text-teal-700 ring-2 ring-white flex items-center justify-center text-[11px] font-bold">
                            +{extra}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MdCalendarToday className="text-gray-300 shrink-0" size={11} />
                        <span>Created {formatDate(g.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => openChat(g)}
                        className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold transition-colors"
                        title="Open chat"
                      >
                        <MdChat size={14} />
                        <span className="hidden sm:inline">Chat</span>
                      </button>
                      <button
                        onClick={() => setViewGroup(g)}
                        className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
                        title="View members"
                      >
                        <MdRemoveRedEye size={14} />
                        <span className="hidden sm:inline">Members</span>
                      </button>
                      {canManage && (
                        <>
                          <button
                            onClick={() => navigate(`/edit-group/${g._id}`)}
                            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors shrink-0"
                            title="Edit"
                          >
                            <MdEdit size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: g._id, name: groupName(g) })}
                            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors shrink-0"
                            title="Delete"
                          >
                            <MdDelete size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full premium-card rounded-2xl py-14 text-center">
                <div className="flex flex-col items-center gap-3">
                  <FaUsers className="text-gray-200" size={48} />
                  <p className="text-gray-400 font-semibold text-sm">No groups found</p>
                  {admin && (
                    <button onClick={() => navigate("/add-group")}
                      className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors">
                      Create the first group
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllGroupList;