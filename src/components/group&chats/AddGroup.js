import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaUsers, FaSearch, FaUserTie, FaCheck, FaTimes } from "react-icons/fa";
import { MdArrowBack, MdRefresh } from "react-icons/md";
import { chatApi, memberName, memberRole } from "./ChatApi";
import { GROUP_STYLES, Avatar } from "./ChatUi";

/*
  ADMIN PANEL
  Routes:
    <Route path="/add-group" element={<AddGroup />} />
    <Route path="/edit-group/:id" element={<AddGroup />} />

  Create : POST   /api/chat/group              { name, description, employeeIds }
  Edit   : GET    /api/chat/:id                (name, description, members)
           PATCH  /api/chat/:id                { name, description }
           POST   /api/chat/:id/members        { employeeIds }      (newly selected)
           DELETE /api/chat/:id/members/:emp   (deselected)
  Staff  : GET    /api/chat/users?search=
*/

const ChevronDown = ({ size = 13, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const AddGroup = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [staffOptions, setStaffOptions] = useState([]); // current search result
  const [staffMap, setStaffMap] = useState({}); // employeeId -> staff (every staff ever seen)
  const [selected, setSelected] = useState([]); // employeeId[]
  const [originalIds, setOriginalIds] = useState([]); // members when the edit page opened
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const remember = (list) =>
    setStaffMap((prev) => {
      const next = { ...prev };
      list.forEach((s) => {
        next[s.employeeId] = s;
      });
      return next;
    });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const sJson = await chatApi.users("");
      const list = Array.isArray(sJson.data) ? sJson.data : [];
      setStaffOptions(list);
      remember(list);

      if (isEdit) {
        const g = await chatApi.getChat(id);
        const group = g.data;
        if (group?.type !== "group") throw new Error("This chat is not a group");
        setGroupName(group.name || group.title || "");
        setDescription(group.description || "");

        const staffMembers = (group.members || []).filter(
          (m) => m.accountType === "staff" && m.employeeId
        );
        const ids = staffMembers.map((m) => m.employeeId);
        setOriginalIds(ids);
        setSelected(ids);
        remember(
          staffMembers.map((m) => ({
            employeeId: m.employeeId,
            employeeName: memberName(m),
            role: memberRole(m),
          }))
        );
      }
    } catch (err) {
      console.error("Load error:", err);
      setError(err.message || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // server-side search (debounced); the first run is covered by loadData
  const firstSearch = useRef(true);
  useEffect(() => {
    if (firstSearch.current) {
      firstSearch.current = false;
      return;
    }
    const t = setTimeout(async () => {
      try {
        const j = await chatApi.users(search.trim());
        const list = Array.isArray(j.data) ? j.data : [];
        setStaffOptions(list);
        remember(list);
      } catch (e) {
        /* keep the previous list */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const uniqueRoles = useMemo(
    () => [...new Set(Object.values(staffMap).map((s) => s.role))].filter(Boolean),
    [staffMap]
  );

  const filtered = useMemo(
    () => staffOptions.filter((s) => (roleFilter ? s.role === roleFilter : true)),
    [staffOptions, roleFilter]
  );

  const selectedStaff = useMemo(
    () =>
      selected.map((eid) => staffMap[eid] || { employeeId: eid, employeeName: eid, role: "" }),
    [staffMap, selected]
  );

  const toggle = (employeeId) =>
    setSelected((prev) =>
      prev.includes(employeeId) ? prev.filter((x) => x !== employeeId) : [...prev, employeeId]
    );

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((s) => selected.includes(s.employeeId));

  const toggleAllFiltered = () => {
    const ids = filtered.map((s) => s.employeeId);
    if (allFilteredSelected) {
      setSelected((prev) => prev.filter((x) => !ids.includes(x)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!groupName.trim()) {
      setFormError("Enter a group name.");
      return;
    }
    if (selected.length === 0) {
      setFormError("Select at least one staff member.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await chatApi.updateChat(id, { name: groupName.trim(), description: description.trim() });
        const added = selected.filter((x) => !originalIds.includes(x));
        const removed = originalIds.filter((x) => !selected.includes(x));
        if (added.length) await chatApi.addMembers(id, added);
        for (const emp of removed) await chatApi.removeMember(id, emp);
      } else {
        await chatApi.createGroup({
          name: groupName.trim(),
          description: description.trim(),
          employeeIds: selected,
        });
      }
      navigate("/groups", { state: { refresh: Date.now() } });
    } catch (err) {
      console.error("Save group error:", err);
      setFormError(err.message || "Could not save the group.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gc-root min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/80">
      <style>{GROUP_STYLES}</style>

      <div className="w-full max-w-screen-xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white border border-teal-100 text-teal-700 hover:bg-teal-50 flex items-center justify-center transition-all shrink-0"
              title="Back"
            >
              <MdArrowBack size={20} />
            </button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30 shrink-0">
              <FaUsers className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight leading-tight">
                {isEdit ? "Edit Group" : "Create Group"}
              </h1>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full inline-block" />
                {selected.length} staff selected
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="premium-card rounded-2xl p-12 sm:p-16 flex flex-col items-center justify-center gap-4">
            <div className="spinner" />
            <p className="text-gray-500 font-medium text-sm">Loading staff…</p>
          </div>
        )}

        {!loading && error && (
          <div className="premium-card rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
              <MdRefresh className="text-red-400" size={28} />
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">Failed to load staff</p>
              <p className="text-gray-400 text-sm max-w-xs">{error}</p>
            </div>
            <button onClick={loadData}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors text-sm">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* LEFT: name + description + selected summary + submit */}
            <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-5 lg:order-1">
              <div className="premium-card rounded-2xl p-4 sm:p-5">
                <label className="block text-sm font-bold text-gray-800 mb-2">Group name</label>
                <input
                  className="s-input w-full h-11 px-3.5 rounded-xl border-2 border-gray-100 bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all text-sm text-gray-700 placeholder:text-gray-400"
                  placeholder="e.g. Flutter Team"
                  value={groupName}
                  maxLength={60}
                  onChange={(e) => setGroupName(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1.5 text-right">{groupName.length}/60</p>

                <label className="block text-sm font-bold text-gray-800 mt-3 mb-2">
                  Description <span className="text-gray-400 font-medium">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  className="s-input w-full px-3.5 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all text-sm text-gray-700 placeholder:text-gray-400 resize-none"
                  placeholder="What is this group for?"
                  value={description}
                  maxLength={200}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/200</p>
              </div>

              <div className="premium-card rounded-2xl p-4 sm:p-5 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-800 text-sm">Selected members</span>
                  <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs font-bold">
                    {selected.length}
                  </span>
                </div>

                {selectedStaff.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">
                    No one selected yet. Pick staff from the list.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto scroll-y pr-1">
                    {selectedStaff.map((s) => (
                      <span
                        key={s.employeeId}
                        className="inline-flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-800 text-xs font-semibold fade-up"
                      >
                        <span className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center text-[10px] font-bold">
                          {s.employeeName?.charAt(0).toUpperCase()}
                        </span>
                        <span className="max-w-[110px] truncate">{s.employeeName}</span>
                        <button
                          onClick={() => toggle(s.employeeId)}
                          className="w-4 h-4 rounded-full hover:bg-teal-200 flex items-center justify-center"
                          title="Remove"
                        >
                          <FaTimes size={8} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {formError && (
                <div className="rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold px-4 py-3 fade-up">
                  {formError}
                </div>
              )}

              <div className="flex gap-2.5">
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 text-sm bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-xl hover:scale-[1.01] transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving…" : isEdit ? "Save changes" : "Create group"}
                </button>
              </div>
            </div>

            {/* RIGHT: staff picker */}
            <div className="lg:col-span-2 premium-card rounded-2xl p-4 sm:p-5 lg:order-2">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                    <FaUserTie className="text-teal-600" size={12} />
                  </div>
                  <span className="font-bold text-gray-800 text-sm">Select staff</span>
                  <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs font-bold">
                    {filtered.length}
                  </span>
                </div>
                <button
                  onClick={toggleAllFiltered}
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 transition-colors"
                >
                  {allFilteredSelected ? "Clear shown" : "Select all shown"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                  <input
                    className="s-input w-full h-10 pl-8 pr-3 rounded-xl border-2 border-gray-100 bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all text-xs sm:text-sm text-gray-700 placeholder:text-gray-400"
                    placeholder="Search name or ID…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <FaUserTie className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={12} />
                  <select
                    className="s-input w-full h-10 pl-8 pr-7 rounded-xl border-2 border-gray-100 bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all text-xs sm:text-sm text-gray-700 appearance-none cursor-pointer"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">All Roles</option>
                    {uniqueRoles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto scroll-y pr-1">
                {filtered.length === 0 && (
                  <p className="col-span-full text-center text-sm text-gray-400 font-semibold py-10">
                    No staff found
                  </p>
                )}
                {filtered.map((s) => {
                  const on = selected.includes(s.employeeId);
                  return (
                    <button
                      key={s.employeeId}
                      onClick={() => toggle(s.employeeId)}
                      className={`text-left flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        on
                          ? "border-teal-400 bg-teal-50/80 shadow-sm shadow-teal-500/10"
                          : "border-gray-100 bg-white hover:border-teal-200 hover:bg-teal-50/40"
                      }`}
                    >
                      <Avatar name={s.employeeName} size={38} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800 text-sm truncate">{s.employeeName}</p>
                        <p className="text-xs text-teal-600 font-semibold truncate">{s.role}</p>
                        <p className="text-[11px] font-mono text-gray-400">{s.employeeId}</p>
                      </div>
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          on ? "bg-teal-600 text-white" : "border-2 border-gray-200 text-transparent"
                        }`}
                      >
                        <FaCheck size={10} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddGroup;