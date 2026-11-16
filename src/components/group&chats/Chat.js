import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaUsers,
  FaRegSmile,
  FaPaperPlane,
  FaComments,
  FaPaperclip,
  FaUserShield,
} from "react-icons/fa";
import {
  MdArrowBack,
  MdRefresh,
  MdAdd,
  MdGroups,
  MdClose,
  MdKeyboardArrowDown,
  MdKeyboardArrowRight,
  MdReply,
  MdEdit,
  MdDelete,
  MdExitToApp,
} from "react-icons/md";
import useChat from "./UseChat";
import { nameOf, memberName, memberRole, formatTime, dayLabel } from "./ChatApi";
import { GROUP_STYLES, EMOJIS, Attachments } from "./ChatUi";

/*
  ADMIN PANEL  -  Route: <Route path="/chat" element={<AdminChat />} />
  Opened from the groups page with: navigate("/chat", { state: { chatId } })

  REST   : /api/chat/*          (see services/chatApi.js)
  Socket : /chat namespace      (live messages, typing, read receipts, member changes)

  FIT = height of the whole chat app. If your page has a top header,
  change it, e.g. "h-[calc(100dvh-64px)]".
*/
const FIT = "h-[80dvh]";
const QUICK = ["👋 Hello!", "Good morning ☀️", "Can we talk?"];
const GROUP_WINDOW_MS = 5 * 60 * 1000; // messages within 5 min by same sender are stacked
const MAX_FILES = 10;

const PALETTES = [
  "from-teal-500 to-emerald-500",
  "from-cyan-500 to-teal-600",
  "from-emerald-500 to-teal-700",
  "from-sky-500 to-cyan-600",
  "from-teal-600 to-cyan-500",
  "from-indigo-500 to-teal-500",
];
const paletteFor = (s = "") =>
  PALETTES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTES.length];

/* ---------- small avatar ---------- */
const Tile = ({ name, size = 36 }) => (
  <div
    className={`shrink-0 flex items-center justify-center text-white font-bold bg-gradient-to-br ${paletteFor(name)} rounded-md`}
    style={{ width: size, height: size, fontSize: size * 0.42 }}
  >
    {name?.charAt(0)?.toUpperCase() || "?"}
  </div>
);

/* ---------- sidebar pieces ---------- */
const Section = ({ title, open, onToggle, action, children }) => (
  <div className="mb-2">
    <div className="flex items-center justify-between px-3 py-1 group">
      <button onClick={onToggle} className="flex items-center gap-0.5 text-[13px] font-semibold text-teal-100/80 hover:text-white">
        {open ? <MdKeyboardArrowDown size={16} /> : <MdKeyboardArrowRight size={16} />}
        {title}
      </button>
      {action}
    </div>
    {open && <div className="px-1.5">{children}</div>}
  </div>
);

const SideRow = ({ active, onClick, children, strong }) => (
  <button
    onClick={onClick}
    className={`w-full text-left flex items-center gap-2 h-8 px-2 rounded-md text-[13px] transition-colors ${
      active
        ? "bg-emerald-500 text-white font-semibold"
        : `${strong ? "text-white font-semibold" : "text-teal-100/80"} hover:bg-white/10`
    }`}
  >
    {children}
  </button>
);

const Unread = ({ n }) =>
  n > 0 ? (
    <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-400 text-teal-950 text-[10px] font-extrabold flex items-center justify-center shrink-0">
      {n > 99 ? "99+" : n}
    </span>
  ) : null;

const replySnippet = (r) =>
  !r ? "" : r.isDeleted ? "Message deleted" : r.content || (r.messageType ? `📎 ${r.messageType}` : "");

const AdminChat = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const {
    me, meId, loading, error, online, search, setSearch, groups, directs, unreadTotal,
    active, activeChat, members, memberMap, isGroup, canManage,
    messages, msgLoading, msgError, hasMore, loadingMore, sending, typingNames,
    init, selectItem, closeChat, isActive, reloadMessages, loadMore, send, retryMessage, dismissMessage,
    editMessage, removeMessage, leaveGroup, deleteGroup, removeMember, setMemberRole, notifyTyping,
  } = useChat({ initialChatId: state?.chatId || state?.groupId || null });

  const admin = me.type === "admin";

  const [open, setOpen] = useState({ groups: true, people: true });
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [picked, setPicked] = useState(null); // message whose toolbar is open (touch screens)
  const [showMembers, setShowMembers] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showJump, setShowJump] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const stickRef = useRef(true);

  const activeKey = active ? active.chatId || active.key : null;
  useEffect(() => {
    setText("");
    setFiles([]);
    setReplyTo(null);
    setEditing(null);
    setPicked(null);
    setShowMembers(false);
    setShowEmoji(false);
    setShowJump(false);
    stickRef.current = true;
  }, [activeKey]);

  const lastId = messages[messages.length - 1]?._id;
  const typers = Object.values(typingNames);
  const typingText =
    typers.length === 0
      ? ""
      : typers.length === 1
      ? `${typers[0].split(" ")[0]} is typing…`
      : `${typers.length} people are typing…`;

  useEffect(() => {
    if (stickRef.current) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lastId, typingText]);

  const onScroll = (e) => {
    const el = e.target;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    stickRef.current = near;
    setShowJump(!near);
  };

  const jumpDown = () => {
    stickRef.current = true;
    setShowJump(false);
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const openChat = (c) => {
    selectItem(c);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  /* ---------- composer ---------- */
  const resetHeight = () => {
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const submit = async (override) => {
    const value = (override ?? text).trim();

    if (editing) {
      if (!value) return;
      try {
        await editMessage(editing._id, value);
      } catch (e) {
        alert(e.message || "Could not edit the message.");
        return;
      }
      setEditing(null);
      setText("");
      resetHeight();
      return;
    }

    if (!value && !files.length) return;
    const reply = replyTo?._id || null;
    const attached = files;
    stickRef.current = true;
    setText("");
    setFiles([]);
    setReplyTo(null);
    setShowEmoji(false);
    resetHeight();
    await send({ text: value, files: attached, replyTo: reply });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape") {
      setEditing(null);
      setReplyTo(null);
    }
  };

  const onPickFiles = (e) => {
    const chosen = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...chosen].slice(0, MAX_FILES));
    e.target.value = "";
  };

  const startReply = (m) => {
    setReplyTo(m);
    setEditing(null);
    setPicked(null);
    inputRef.current?.focus();
  };
  const startEdit = (m) => {
    setEditing(m);
    setReplyTo(null);
    setFiles([]);
    setText(m.content || "");
    setPicked(null);
    inputRef.current?.focus();
  };
  const cancelEdit = () => {
    setEditing(null);
    setText("");
    resetHeight();
  };
  const onDelete = async (m) => {
    setPicked(null);
    if (!window.confirm("Delete this message?")) return;
    try {
      await removeMessage(m._id);
    } catch (e) {
      alert(e.message || "Could not delete the message.");
    }
  };

  /* ---------- group actions ---------- */
  const guard = async (fn, fallback) => {
    try {
      await fn();
    } catch (e) {
      alert(e.message || fallback);
    }
  };
  const doLeave = () =>
    window.confirm(`Leave ${active.name}?`) && guard(leaveGroup, "Could not leave the group.");
  const doDeleteGroup = () =>
    window.confirm(`Delete ${active.name} and all its messages?`) &&
    guard(deleteGroup, "Could not delete the group.");
  const doRemove = (m) =>
    window.confirm(`Remove ${memberName(m)} from the group?`) &&
    guard(() => removeMember(m.employeeId || m.user), "Could not remove the member.");
  const doRole = (m) =>
    guard(
      () => setMemberRole(m.employeeId || m.user, m.role === "admin" ? "member" : "admin"),
      "Could not change the role."
    );

  /* ---------- rows: day dividers + stacking ---------- */
  const items = useMemo(() => {
    const out = [];
    let lastDay = "";
    messages.forEach((m, i) => {
      const day = new Date(m.createdAt).toDateString();
      if (day !== lastDay) {
        out.push({ kind: "day", key: `d-${day}`, label: dayLabel(m.createdAt) });
        lastDay = day;
      }
      const prev = messages[i - 1];
      const stacked =
        prev &&
        !m.replyToMessage &&
        String(prev.sender) === String(m.sender) &&
        new Date(prev.createdAt).toDateString() === day &&
        new Date(m.createdAt) - new Date(prev.createdAt) < GROUP_WINDOW_MS;
      out.push({ kind: "msg", m, first: !stacked });
    });
    return out;
  }, [messages]);

  const lastMineId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (!m.pending && !m.failed && String(m.sender) === String(meId)) return m._id;
    }
    return null;
  }, [messages, meId]);

  const nameFor = (id) => (String(id) === String(meId) ? "You" : memberMap[String(id)]?.name || "Message");

  /* =====================================================================
     RENDER
     ===================================================================== */
  return (
    <div className={`gc-root ${FIT} w-full bg-white text-[13px] text-gray-800 overflow-hidden`}>
      <style>{GROUP_STYLES}</style>
      <style>{`
        @keyframes bounceDot { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-3px);opacity:1} }
        .dot { width:4px; height:4px; border-radius:9999px; background:#0d9488; display:inline-block; animation: bounceDot 1.2s infinite; }
        .dot:nth-child(2){ animation-delay:.15s } .dot:nth-child(3){ animation-delay:.3s }
        .side-scroll::-webkit-scrollbar{ width:6px } .side-scroll::-webkit-scrollbar-thumb{ background:rgba(255,255,255,.18); border-radius:4px }
        @media (prefers-reduced-motion: reduce){ .fade-up,.dot{ animation:none } }
      `}</style>

      {loading && (
        <div className="h-full flex flex-col items-center justify-center gap-3">
          <div className="spinner" />
          <p className="text-gray-500 font-medium">Loading chats…</p>
        </div>
      )}

      {!loading && error && (
        <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-6">
          <p className="font-bold text-gray-800">Failed to load chats</p>
          <p className="text-gray-400 max-w-xs">{error}</p>
          <button onClick={init} className="px-4 py-2 bg-teal-600 text-white rounded-md font-semibold hover:bg-teal-700">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="flex h-full">
          {/* ================= SIDEBAR ================= */}
          <aside className={`${active ? "hidden md:flex" : "flex"} w-full md:w-64 lg:w-72 shrink-0 flex-col bg-teal-900`}>
            <div className="h-12 shrink-0 px-3 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-white font-extrabold text-[15px] truncate">Messages</p>
                {unreadTotal > 0 && (
                  <span className="px-1.5 h-4 rounded-full bg-emerald-400 text-teal-950 text-[10px] font-extrabold flex items-center">
                    {unreadTotal > 99 ? "99+" : unreadTotal}
                  </span>
                )}
                <span
                  title={online ? "Live" : "Reconnecting…"}
                  className={`w-2 h-2 rounded-full shrink-0 ${online ? "bg-emerald-400" : "bg-amber-400"}`}
                />
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={() => navigate("/groups")} title="All groups"
                  className="w-7 h-7 rounded-md text-teal-100 hover:bg-white/10 flex items-center justify-center"><MdGroups size={18} /></button>
                {admin && (
                  <button onClick={() => navigate("/add-group")} title="Create group"
                    className="w-7 h-7 rounded-md text-teal-100 hover:bg-white/10 flex items-center justify-center"><MdAdd size={19} /></button>
                )}
                <button onClick={init} title="Refresh"
                  className="w-7 h-7 rounded-md text-teal-100 hover:bg-white/10 flex items-center justify-center"><MdRefresh size={17} /></button>
              </div>
            </div>

            <div className="px-3 py-2 shrink-0">
              <div className="relative">
                <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-teal-200/60" size={11} />
                <input
                  className="s-input w-full h-8 pl-7 pr-2 rounded-md bg-white/10 focus:bg-white/15 text-white placeholder:text-teal-200/60 text-base md:text-[13px]"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto side-scroll pt-1">
              <Section
                title="Groups"
                open={open.groups}
                onToggle={() => setOpen((o) => ({ ...o, groups: !o.groups }))}
                action={admin && (
                  <button onClick={() => navigate("/add-group")} title="Create group"
                    className="w-5 h-5 rounded text-teal-100/70 hover:text-white hover:bg-white/10 flex items-center justify-center"><MdAdd size={16} /></button>
                )}
              >
                {groups.length === 0 && <p className="px-2 py-1 text-teal-200/50 text-xs">No groups</p>}
                {groups.map((c) => (
                  <SideRow key={c.key} active={isActive(c)} onClick={() => openChat(c)} strong={c.unread > 0}>
                    <span className="w-4 text-center opacity-70">#</span>
                    <span className="truncate">{c.name}</span>
                    <Unread n={c.unread} />
                  </SideRow>
                ))}
              </Section>

              <Section title="Direct messages" open={open.people} onToggle={() => setOpen((o) => ({ ...o, people: !o.people }))}>
                {directs.length === 0 && <p className="px-2 py-1 text-teal-200/50 text-xs">No people</p>}
                {directs.map((c) => (
                  <SideRow key={c.key} active={isActive(c)} onClick={() => openChat(c)} strong={c.unread > 0}>
                    <Tile name={c.name} size={20} />
                    <span className="truncate">{c.name}</span>
                    <Unread n={c.unread} />
                  </SideRow>
                ))}
              </Section>
            </div>

            <div className="shrink-0 border-t border-white/10 bg-black/20 pb-[env(safe-area-inset-bottom)]">
              <div className="px-3 py-2 flex items-center gap-2">
                <Tile name={me.name} size={26} />
                <div className="min-w-0 leading-tight">
                  <p className="text-white text-xs font-semibold truncate">{me.name}</p>
                  <p className="text-teal-200/60 text-[11px] truncate capitalize">{me.role}</p>
                </div>
              </div>
            </div>
          </aside>

          {/* ================= CONVERSATION ================= */}
          <section className={`${active ? "flex" : "hidden md:flex"} flex-1 min-w-0 flex-col relative bg-white`}>
            {!active ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-2 bg-gray-50/60">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
                  <FaComments className="text-white" size={24} />
                </div>
                <h2 className="text-base font-extrabold text-gray-800 mt-2">Pick a conversation</h2>
                <p className="text-gray-500 max-w-xs">Choose a group or a teammate from the sidebar.</p>
              </div>
            ) : (
              <>
                {/* header */}
                <header className="h-12 shrink-0 flex items-center gap-2 px-2 sm:px-4 border-b border-gray-200 bg-white pt-[env(safe-area-inset-top)] box-content">
                  <button onClick={closeChat} title="Back"
                    className="md:hidden w-8 h-8 rounded-md text-gray-600 hover:bg-gray-100 flex items-center justify-center shrink-0"><MdArrowBack size={20} /></button>
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    {isGroup ? <span className="text-base font-bold text-gray-400">#</span> : <Tile name={active.name} size={26} />}
                    <h2 className="font-extrabold text-[15px] truncate">{active.name}</h2>
                    <span className="hidden sm:inline text-xs text-gray-400 truncate">{activeChat?.description || active.subtitle}</span>
                  </div>
                  {isGroup && (
                    <button onClick={() => setShowMembers((v) => !v)}
                      className={`h-8 px-2.5 rounded-md border flex items-center gap-1.5 text-xs font-semibold transition-colors ${showMembers ? "bg-teal-50 border-teal-300 text-teal-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      <FaUsers size={12} /> {members.length}
                    </button>
                  )}
                </header>

                {/* members panel */}
                {showMembers && isGroup && (
                  <div className="absolute top-12 right-0 bottom-0 w-full sm:w-72 bg-white border-l border-gray-200 shadow-xl z-30 flex flex-col fade-up mt-[env(safe-area-inset-top)]">
                    <div className="h-11 px-3 flex items-center justify-between border-b border-gray-100 shrink-0">
                      <p className="font-bold">Members ({members.length})</p>
                      <button onClick={() => setShowMembers(false)} className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center"><MdClose size={18} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto scroll-y p-2 space-y-0.5">
                      {members.map((m) => {
                        const isCreator = String(m.user) === String(activeChat?.createdBy);
                        const isMe = String(m.user) === String(meId);
                        return (
                          <div key={String(m.user)} className="group flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-gray-50">
                            <Tile name={memberName(m)} size={28} />
                            <div className="min-w-0 flex-1 leading-tight">
                              <p className="font-semibold truncate">
                                {memberName(m)}{isMe && <span className="text-gray-400 font-normal"> (you)</span>}
                              </p>
                              <p className="text-[11px] text-teal-600 truncate">
                                {memberRole(m)}{m.role === "admin" && " · Group admin"}
                              </p>
                            </div>
                            {canManage && !isMe && !isCreator && (
                              <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                                <button onClick={() => doRole(m)} title={m.role === "admin" ? "Remove group admin" : "Make group admin"}
                                  className={`w-6 h-6 rounded flex items-center justify-center hover:bg-teal-50 ${m.role === "admin" ? "text-teal-600" : "text-gray-400"}`}>
                                  <FaUserShield size={12} />
                                </button>
                                <button onClick={() => doRemove(m)} title="Remove from group"
                                  className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50">
                                  <MdClose size={15} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="shrink-0 border-t border-gray-100 p-2 space-y-1.5">
                      {canManage && (
                        <button onClick={() => navigate(`/edit-group/${active.chatId}`)}
                          className="w-full h-8 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center gap-1.5">
                          <MdEdit size={14} /> Edit group &amp; add members
                        </button>
                      )}
                      {/* <button onClick={doLeave}
                        className="w-full h-8 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold flex items-center justify-center gap-1.5">
                        <MdExitToApp size={14} /> Leave group
                      </button> */}
                      {canManage && (
                        <button onClick={doDeleteGroup}
                          className="w-full h-8 rounded-md bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center gap-1.5">
                          <MdDelete size={14} /> Delete group
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* messages */}
                <div onScroll={onScroll} className="flex-1 overflow-y-auto scroll-y py-3">
                  {hasMore && !msgLoading && (
                    <div className="flex justify-center pb-2">
                      <button onClick={loadMore} disabled={loadingMore}
                        className="px-3 py-1 rounded-full border border-gray-200 text-[11px] font-bold text-teal-700 hover:bg-teal-50 disabled:opacity-60">
                        {loadingMore ? "Loading…" : "Load earlier messages"}
                      </button>
                    </div>
                  )}

                  {msgLoading && <div className="flex justify-center py-10"><div className="spinner" /></div>}

                  {!msgLoading && msgError && (
                    <div className="text-center py-10">
                      <p className="text-red-500 font-semibold mb-2">{msgError}</p>
                      <button onClick={reloadMessages} className="px-3 py-1.5 bg-teal-600 text-white rounded-md text-xs font-semibold hover:bg-teal-700">Retry</button>
                    </div>
                  )}

                  {!msgLoading && !msgError && messages.length === 0 && (
                    <div className="px-5 py-8">
                      <Tile name={active.name} size={48} />
                      <h3 className="mt-3 text-lg font-extrabold">{isGroup ? `# ${active.name}` : active.name}</h3>
                      <p className="text-gray-500 mt-1">
                        {isGroup ? "This is the start of the group. Say something to the team." : "This is the start of your conversation."}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {QUICK.map((q) => (
                          <button key={q} onClick={() => submit(q)}
                            className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-teal-50 hover:border-teal-300 transition-colors">{q}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {items.map((it) => {
                    if (it.kind === "day") {
                      return (
                        <div key={it.key} className="flex items-center gap-3 px-4 sm:px-5 my-3">
                          <div className="flex-1 h-px bg-gray-200" />
                          <span className="px-3 py-0.5 rounded-full border border-gray-200 text-[11px] font-bold text-gray-600 bg-white">{it.label}</span>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                      );
                    }
                    const { m, first } = it;
                    const mine = String(m.sender) === String(meId);
                    const sender = nameOf(m.senderInfo);
                    const seenCount = (m.readBy || []).filter((x) => String(x) !== String(meId)).length;
                    const barOpen = picked === m._id;
                    return (
                      <div key={m._id}
                        onClick={() => setPicked((p) => (p === m._id ? null : m._id))}
                        className={`group relative flex gap-2.5 px-4 sm:px-5 hover:bg-gray-50 ${first ? "pt-2" : "pt-0"} pb-0.5 ${m.pending ? "opacity-60" : ""}`}>
                        <div className="w-9 shrink-0">
                          {first ? (
                            <Tile name={sender} size={36} />
                          ) : (
                            <span className="hidden group-hover:block text-[10px] text-gray-400 text-right leading-5 pt-0.5">{formatTime(m.createdAt)}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          {first && (
                            <p className="leading-tight">
                              <span className="font-extrabold text-[14px]">{mine ? "You" : sender}</span>
                              <span className="ml-2 text-[11px] text-gray-400">{formatTime(m.createdAt)}</span>
                            </p>
                          )}
                          {m.replyToMessage && (
                            <div className="my-0.5 pl-2 border-l-2 border-teal-300 text-[12px] text-gray-500 max-w-md">
                              <span className="font-semibold text-teal-700">{nameFor(m.replyToMessage.sender)}</span>
                              <p className="truncate">{replySnippet(m.replyToMessage)}</p>
                            </div>
                          )}
                          {m.content && (
                            <p className={`leading-snug whitespace-pre-wrap break-words ${m.messageType === "sticker" ? "text-4xl" : "text-[14px]"}`}>
                              {m.content}
                              {m.isEdited && <span className="ml-1.5 text-[10px] text-gray-400">(edited)</span>}
                            </p>
                          )}
                          <Attachments items={m.attachments} />
                          {m.failed && (
                            <p className="text-[11px] text-red-500 font-semibold">
                              Not sent{m.error ? ` — ${m.error}` : ""}{" "}
                              {!m.attachments?.length && (
                                <button onClick={(e) => { e.stopPropagation(); retryMessage(m); }} className="underline">Retry</button>
                              )}{" "}
                              <button onClick={(e) => { e.stopPropagation(); dismissMessage(m._id); }} className="underline">Dismiss</button>
                            </p>
                          )}
                          {mine && m._id === lastMineId && seenCount > 0 && (
                            <p className="text-[10px] text-teal-600 font-semibold">
                              {isGroup ? `Seen by ${seenCount}` : "Seen"}
                            </p>
                          )}
                        </div>

                        {!m.pending && !m.failed && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute right-3 -top-3 ${barOpen ? "flex" : "hidden group-hover:flex"} items-center bg-white border border-gray-200 rounded-md shadow-sm z-10`}
                          >
                            <button title="Reply" onClick={() => startReply(m)}
                              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-l-md"><MdReply size={15} /></button>
                            {mine && (
                              <button title="Edit" onClick={() => startEdit(m)}
                                className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-teal-700 hover:bg-teal-50"><MdEdit size={14} /></button>
                            )}
                            {(mine || canManage) && (
                              <button title="Delete" onClick={() => onDelete(m)}
                                className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-r-md"><MdDelete size={14} /></button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {showJump && (
                  <button onClick={jumpDown} title="Latest messages"
                    className="absolute right-4 bottom-32 w-8 h-8 rounded-full bg-white text-teal-700 shadow-lg border border-gray-200 flex items-center justify-center hover:scale-110 transition-transform z-20">
                    <MdKeyboardArrowDown size={22} />
                  </button>
                )}

                {/* composer */}
                <div className="shrink-0 px-3 sm:px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <div className="h-5 text-[11px] text-gray-400 flex items-center gap-1.5">
                    {typingText && (<><span className="dot" /><span className="dot" /><span className="dot" /><span>{typingText}</span></>)}
                  </div>

                  {showEmoji && (
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-0.5 p-1.5 mb-1.5 rounded-lg border border-gray-200 bg-white shadow-sm fade-up">
                      {EMOJIS.map((e) => (
                        <button key={e} onClick={() => { setText((t) => t + e); inputRef.current?.focus(); }}
                          className="h-8 rounded-md hover:bg-teal-50 text-lg">{e}</button>
                      ))}
                    </div>
                  )}

                  <div className="rounded-lg border border-gray-300 bg-white focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all">
                    {(replyTo || editing) && (
                      <div className="flex items-center gap-2 px-3 pt-2 text-[12px] text-gray-500">
                        <div className="min-w-0 flex-1 pl-2 border-l-2 border-teal-400">
                          <span className="font-semibold text-teal-700">
                            {editing ? "Editing message" : `Replying to ${nameFor(replyTo.sender)}`}
                          </span>
                          <p className="truncate">{(editing || replyTo).content || "📎 Attachment"}</p>
                        </div>
                        <button onClick={editing ? cancelEdit : () => setReplyTo(null)} title="Cancel"
                          className="w-6 h-6 rounded hover:bg-gray-100 flex items-center justify-center shrink-0"><MdClose size={15} /></button>
                      </div>
                    )}

                    {files.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 px-3 pt-2">
                        {files.map((f, i) => (
                          <span key={`${f.name}-${i}`} className="inline-flex items-center gap-1 max-w-[180px] pl-2 pr-1 py-0.5 rounded-full bg-teal-50 border border-teal-100 text-teal-800 text-[11px] font-semibold">
                            <span className="truncate">{f.name}</span>
                            <button onClick={() => setFiles((prev) => prev.filter((_, k) => k !== i))}
                              className="w-4 h-4 rounded-full hover:bg-teal-200 flex items-center justify-center shrink-0"><MdClose size={11} /></button>
                          </span>
                        ))}
                      </div>
                    )}

                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        if (!editing) notifyTyping();
                      }}
                      onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                      }}
                      onKeyDown={onKeyDown}
                      placeholder={`Message ${isGroup ? "#" : ""}${active.name}`}
                      className="s-input w-full px-3 pt-2.5 pb-1 bg-transparent resize-none max-h-[120px] text-base sm:text-[14px] placeholder:text-gray-400"
                    />
                    <div className="flex items-center justify-between px-1.5 pb-1.5">
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => setShowEmoji((v) => !v)} title="Emoji"
                          className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${showEmoji ? "bg-teal-100 text-teal-700" : "text-gray-400 hover:text-teal-600 hover:bg-gray-100"}`}>
                          <FaRegSmile size={16} />
                        </button>
                        {!editing && (
                          <>
                            <input ref={fileRef} type="file" multiple hidden onChange={onPickFiles} />
                            <button onClick={() => fileRef.current?.click()} title="Attach files"
                              className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-gray-100 transition-colors">
                              <FaPaperclip size={14} />
                            </button>
                          </>
                        )}
                      </div>
                      <button onClick={() => submit()} disabled={(!text.trim() && !files.length) || sending} title={editing ? "Save" : "Send"}
                        className="h-7 px-2.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 text-xs font-bold transition-colors disabled:opacity-40 disabled:hover:bg-teal-600">
                        <FaPaperPlane size={11} /> <span className="hidden sm:inline">{editing ? "Save" : "Send"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminChat;

// import React, { useState, useEffect, useMemo, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import {
//   FaSearch,
//   FaUsers,
//   FaRegSmile,
//   FaPaperPlane,
//   FaComments,
//   FaPaperclip,
//   FaUserShield,
// } from "react-icons/fa";
// import {
//   MdArrowBack,
//   MdRefresh,
//   MdAdd,
//   MdGroups,
//   MdClose,
//   MdKeyboardArrowDown,
//   MdKeyboardArrowRight,
//   MdReply,
//   MdEdit,
//   MdDelete,
//   MdExitToApp,
// } from "react-icons/md";
// import useChat from "./UseChat";
// import { nameOf, memberName, memberRole, formatTime, dayLabel } from "./ChatApi";
// import { GROUP_STYLES, EMOJIS, Attachments } from "./ChatUi";

// /*
//   ADMIN PANEL  -  Route: <Route path="/chat" element={<AdminChat />} />
//   Opened from the groups page with: navigate("/chat", { state: { chatId } })

//   REST   : /api/chat/*          (see services/chatApi.js)
//   Socket : /chat namespace      (live messages, typing, read receipts, member changes)

//   FIT = height of the whole chat app. If your page has a top header,
//   change it, e.g. "h-[calc(100dvh-64px)]".
// */
// const FIT = "h-[80dvh]";
// const QUICK = ["👋 Hello!", "Good morning ☀️", "Can we talk?"];
// const GROUP_WINDOW_MS = 5 * 60 * 1000; // messages within 5 min by same sender are stacked
// const MAX_FILES = 10;

// const PALETTES = [
//   "from-teal-500 to-emerald-500",
//   "from-cyan-500 to-teal-600",
//   "from-emerald-500 to-teal-700",
//   "from-sky-500 to-cyan-600",
//   "from-teal-600 to-cyan-500",
//   "from-indigo-500 to-teal-500",
// ];
// const paletteFor = (s = "") =>
//   PALETTES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTES.length];

// /* ---------- small avatar ---------- */
// const Tile = ({ name, profileImage, size = 36 }) => (
//   <div
//     className="shrink-0 flex items-center justify-center rounded-md overflow-hidden bg-gray-100"
//     style={{ width: size, height: size }}
//   >
//     {profileImage ? (
//       <img
//         src={profileImage}
//         alt={name || "Profile"}
//         className="w-full h-full object-cover"
//       />
//     ) : (
//       <div
//         className={`w-full h-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${paletteFor(name)}`}
//         style={{ fontSize: size * 0.42 }}
//       >
//         {name?.charAt(0)?.toUpperCase() || "?"}
//       </div>
//     )}
//   </div>
// );

// /* ---------- sidebar pieces ---------- */
// const Section = ({ title, open, onToggle, action, children }) => (
//   <div className="mb-2">
//     <div className="flex items-center justify-between px-3 py-1 group">
//       <button onClick={onToggle} className="flex items-center gap-0.5 text-[13px] font-semibold text-teal-100/80 hover:text-white">
//         {open ? <MdKeyboardArrowDown size={16} /> : <MdKeyboardArrowRight size={16} />}
//         {title}
//       </button>
//       {action}
//     </div>
//     {open && <div className="px-1.5">{children}</div>}
//   </div>
// );

// const SideRow = ({ active, onClick, children, strong }) => (
//   <button
//     onClick={onClick}
//     className={`w-full text-left flex items-center gap-2 h-8 px-2 rounded-md text-[13px] transition-colors ${
//       active
//         ? "bg-emerald-500 text-white font-semibold"
//         : `${strong ? "text-white font-semibold" : "text-teal-100/80"} hover:bg-white/10`
//     }`}
//   >
//     {children}
//   </button>
// );

// const Unread = ({ n }) =>
//   n > 0 ? (
//     <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-400 text-teal-950 text-[10px] font-extrabold flex items-center justify-center shrink-0">
//       {n > 99 ? "99+" : n}
//     </span>
//   ) : null;

// const replySnippet = (r) =>
//   !r ? "" : r.isDeleted ? "Message deleted" : r.content || (r.messageType ? `📎 ${r.messageType}` : "");

// const AdminChat = () => {
//   const navigate = useNavigate();
//   const { state } = useLocation();

//   const {
//     me, meId, loading, error, online, search, setSearch, groups, directs, unreadTotal,
//     active, activeChat, members, memberMap, isGroup, canManage,
//     messages, msgLoading, msgError, hasMore, loadingMore, sending, typingNames,
//     init, selectItem, closeChat, isActive, reloadMessages, loadMore, send, retryMessage, dismissMessage,
//     editMessage, removeMessage, leaveGroup, deleteGroup, removeMember, setMemberRole, notifyTyping,
//   } = useChat({ initialChatId: state?.chatId || state?.groupId || null });

//   const admin = me.type === "admin";

//   const [open, setOpen] = useState({ groups: true, people: true });
//   const [text, setText] = useState("");
//   const [files, setFiles] = useState([]);
//   const [replyTo, setReplyTo] = useState(null);
//   const [editing, setEditing] = useState(null);
//   const [picked, setPicked] = useState(null); // message whose toolbar is open (touch screens)
//   const [showMembers, setShowMembers] = useState(false);
//   const [showEmoji, setShowEmoji] = useState(false);
//   const [showJump, setShowJump] = useState(false);

//   const bottomRef = useRef(null);
//   const inputRef = useRef(null);
//   const fileRef = useRef(null);
//   const stickRef = useRef(true);

//   const activeKey = active ? active.chatId || active.key : null;
//   useEffect(() => {
//     setText("");
//     setFiles([]);
//     setReplyTo(null);
//     setEditing(null);
//     setPicked(null);
//     setShowMembers(false);
//     setShowEmoji(false);
//     setShowJump(false);
//     stickRef.current = true;
//   }, [activeKey]);

//   const lastId = messages[messages.length - 1]?._id;
//   const typers = Object.values(typingNames);
//   const typingText =
//     typers.length === 0
//       ? ""
//       : typers.length === 1
//       ? `${typers[0].split(" ")[0]} is typing…`
//       : `${typers.length} people are typing…`;

//   useEffect(() => {
//     if (stickRef.current) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
//   }, [lastId, typingText]);

//   const onScroll = (e) => {
//     const el = e.target;
//     const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
//     stickRef.current = near;
//     setShowJump(!near);
//   };

//   const jumpDown = () => {
//     stickRef.current = true;
//     setShowJump(false);
//     bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
//   };

//   const openChat = (c) => {
//     selectItem(c);
//     setTimeout(() => inputRef.current?.focus(), 80);
//   };

//   /* ---------- composer ---------- */
//   const resetHeight = () => {
//     if (inputRef.current) inputRef.current.style.height = "auto";
//   };

//   const submit = async (override) => {
//     const value = (override ?? text).trim();

//     if (editing) {
//       if (!value) return;
//       try {
//         await editMessage(editing._id, value);
//       } catch (e) {
//         alert(e.message || "Could not edit the message.");
//         return;
//       }
//       setEditing(null);
//       setText("");
//       resetHeight();
//       return;
//     }

//     if (!value && !files.length) return;
//     const reply = replyTo?._id || null;
//     const attached = files;
//     stickRef.current = true;
//     setText("");
//     setFiles([]);
//     setReplyTo(null);
//     setShowEmoji(false);
//     resetHeight();
//     await send({ text: value, files: attached, replyTo: reply });
//   };

//   const onKeyDown = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       submit();
//     }
//     if (e.key === "Escape") {
//       setEditing(null);
//       setReplyTo(null);
//     }
//   };

//   const onPickFiles = (e) => {
//     const chosen = Array.from(e.target.files || []);
//     setFiles((prev) => [...prev, ...chosen].slice(0, MAX_FILES));
//     e.target.value = "";
//   };

//   const startReply = (m) => {
//     setReplyTo(m);
//     setEditing(null);
//     setPicked(null);
//     inputRef.current?.focus();
//   };
//   const startEdit = (m) => {
//     setEditing(m);
//     setReplyTo(null);
//     setFiles([]);
//     setText(m.content || "");
//     setPicked(null);
//     inputRef.current?.focus();
//   };
//   const cancelEdit = () => {
//     setEditing(null);
//     setText("");
//     resetHeight();
//   };
//   const onDelete = async (m) => {
//     setPicked(null);
//     if (!window.confirm("Delete this message?")) return;
//     try {
//       await removeMessage(m._id);
//     } catch (e) {
//       alert(e.message || "Could not delete the message.");
//     }
//   };

//   /* ---------- group actions ---------- */
//   const guard = async (fn, fallback) => {
//     try {
//       await fn();
//     } catch (e) {
//       alert(e.message || fallback);
//     }
//   };
//   const doLeave = () =>
//     window.confirm(`Leave ${active.name}?`) && guard(leaveGroup, "Could not leave the group.");
//   const doDeleteGroup = () =>
//     window.confirm(`Delete ${active.name} and all its messages?`) &&
//     guard(deleteGroup, "Could not delete the group.");
//   const doRemove = (m) =>
//     window.confirm(`Remove ${memberName(m)} from the group?`) &&
//     guard(() => removeMember(m.employeeId || m.user), "Could not remove the member.");
//   const doRole = (m) =>
//     guard(
//       () => setMemberRole(m.employeeId || m.user, m.role === "admin" ? "member" : "admin"),
//       "Could not change the role."
//     );

//   /* ---------- rows: day dividers + stacking ---------- */
//   const items = useMemo(() => {
//     const out = [];
//     let lastDay = "";
//     messages.forEach((m, i) => {
//       const day = new Date(m.createdAt).toDateString();
//       if (day !== lastDay) {
//         out.push({ kind: "day", key: `d-${day}`, label: dayLabel(m.createdAt) });
//         lastDay = day;
//       }
//       const prev = messages[i - 1];
//       const stacked =
//         prev &&
//         !m.replyToMessage &&
//         String(prev.sender) === String(m.sender) &&
//         new Date(prev.createdAt).toDateString() === day &&
//         new Date(m.createdAt) - new Date(prev.createdAt) < GROUP_WINDOW_MS;
//       out.push({ kind: "msg", m, first: !stacked });
//     });
//     return out;
//   }, [messages]);

//   const lastMineId = useMemo(() => {
//     for (let i = messages.length - 1; i >= 0; i--) {
//       const m = messages[i];
//       if (!m.pending && !m.failed && String(m.sender) === String(meId)) return m._id;
//     }
//     return null;
//   }, [messages, meId]);

//   const nameFor = (id) => (String(id) === String(meId) ? "You" : memberMap[String(id)]?.name || "Message");

//   /* =====================================================================
//      RENDER
//      ===================================================================== */
//   return (
//     <div className={`gc-root ${FIT} w-full bg-white text-[13px] text-gray-800 overflow-hidden`}>
//       <style>{GROUP_STYLES}</style>
//       <style>{`
//         @keyframes bounceDot { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-3px);opacity:1} }
//         .dot { width:4px; height:4px; border-radius:9999px; background:#0d9488; display:inline-block; animation: bounceDot 1.2s infinite; }
//         .dot:nth-child(2){ animation-delay:.15s } .dot:nth-child(3){ animation-delay:.3s }
//         .side-scroll::-webkit-scrollbar{ width:6px } .side-scroll::-webkit-scrollbar-thumb{ background:rgba(255,255,255,.18); border-radius:4px }
//         @media (prefers-reduced-motion: reduce){ .fade-up,.dot{ animation:none } }
//       `}</style>

//       {loading && (
//         <div className="h-full flex flex-col items-center justify-center gap-3">
//           <div className="spinner" />
//           <p className="text-gray-500 font-medium">Loading chats…</p>
//         </div>
//       )}

//       {!loading && error && (
//         <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-6">
//           <p className="font-bold text-gray-800">Failed to load chats</p>
//           <p className="text-gray-400 max-w-xs">{error}</p>
//           <button onClick={init} className="px-4 py-2 bg-teal-600 text-white rounded-md font-semibold hover:bg-teal-700">Retry</button>
//         </div>
//       )}

//       {!loading && !error && (
//         <div className="flex h-full">
//           {/* ================= SIDEBAR ================= */}
//           <aside className={`${active ? "hidden md:flex" : "flex"} w-full md:w-64 lg:w-72 shrink-0 flex-col bg-teal-900`}>
//             <div className="h-12 shrink-0 px-3 flex items-center justify-between border-b border-white/10">
//               <div className="flex items-center gap-2 min-w-0">
//                 <p className="text-white font-extrabold text-[15px] truncate">Messages</p>
//                 {unreadTotal > 0 && (
//                   <span className="px-1.5 h-4 rounded-full bg-emerald-400 text-teal-950 text-[10px] font-extrabold flex items-center">
//                     {unreadTotal > 99 ? "99+" : unreadTotal}
//                   </span>
//                 )}
//                 <span
//                   title={online ? "Live" : "Reconnecting…"}
//                   className={`w-2 h-2 rounded-full shrink-0 ${online ? "bg-emerald-400" : "bg-amber-400"}`}
//                 />
//               </div>
//               <div className="flex items-center gap-0.5">
//                 <button onClick={() => navigate("/groups")} title="All groups"
//                   className="w-7 h-7 rounded-md text-teal-100 hover:bg-white/10 flex items-center justify-center"><MdGroups size={18} /></button>
//                 {admin && (
//                   <button onClick={() => navigate("/add-group")} title="Create group"
//                     className="w-7 h-7 rounded-md text-teal-100 hover:bg-white/10 flex items-center justify-center"><MdAdd size={19} /></button>
//                 )}
//                 <button onClick={init} title="Refresh"
//                   className="w-7 h-7 rounded-md text-teal-100 hover:bg-white/10 flex items-center justify-center"><MdRefresh size={17} /></button>
//               </div>
//             </div>

//             <div className="px-3 py-2 shrink-0">
//               <div className="relative">
//                 <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-teal-200/60" size={11} />
//                 <input
//                   className="s-input w-full h-8 pl-7 pr-2 rounded-md bg-white/10 focus:bg-white/15 text-white placeholder:text-teal-200/60 text-base md:text-[13px]"
//                   placeholder="Search"
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                 />
//               </div>
//             </div>

//             <div className="flex-1 overflow-y-auto side-scroll pt-1">
//               <Section
//                 title="Groups"
//                 open={open.groups}
//                 onToggle={() => setOpen((o) => ({ ...o, groups: !o.groups }))}
//                 action={admin && (
//                   <button onClick={() => navigate("/add-group")} title="Create group"
//                     className="w-5 h-5 rounded text-teal-100/70 hover:text-white hover:bg-white/10 flex items-center justify-center"><MdAdd size={16} /></button>
//                 )}
//               >
//                 {groups.length === 0 && <p className="px-2 py-1 text-teal-200/50 text-xs">No groups</p>}
//                 {groups.map((c) => (
//                   <SideRow key={c.key} active={isActive(c)} onClick={() => openChat(c)} strong={c.unread > 0}>
//                     <span className="w-4 text-center opacity-70">#</span>
//                     <span className="truncate">{c.name}</span>
//                     <Unread n={c.unread} />
//                   </SideRow>
//                 ))}
//               </Section>

//               <Section title="Direct messages" open={open.people} onToggle={() => setOpen((o) => ({ ...o, people: !o.people }))}>
//                 {directs.length === 0 && <p className="px-2 py-1 text-teal-200/50 text-xs">No people</p>}
//                 {directs.map((c) => (
//                   <SideRow key={c.key} active={isActive(c)} onClick={() => openChat(c)} strong={c.unread > 0}>
//                     <Tile name={c.name} profileImage={c.profileImage} size={20} />
//                     <span className="truncate">{c.name}</span>
//                     <Unread n={c.unread} />
//                   </SideRow>
//                 ))}
//               </Section>
//             </div>

//             <div className="shrink-0 border-t border-white/10 bg-black/20 pb-[env(safe-area-inset-bottom)]">
//               <div className="px-3 py-2 flex items-center gap-2">
//                 <Tile name={me.name} profileImage={me.profileImage} size={26} />
//                 <div className="min-w-0 leading-tight">
//                   <p className="text-white text-xs font-semibold truncate">{me.name}</p>
//                   <p className="text-teal-200/60 text-[11px] truncate capitalize">{me.role}</p>
//                 </div>
//               </div>
//             </div>
//           </aside>

//           {/* ================= CONVERSATION ================= */}
//           <section className={`${active ? "flex" : "hidden md:flex"} flex-1 min-w-0 flex-col relative bg-white`}>
//             {!active ? (
//               <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-2 bg-gray-50/60">
//                 <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
//                   <FaComments className="text-white" size={24} />
//                 </div>
//                 <h2 className="text-base font-extrabold text-gray-800 mt-2">Pick a conversation</h2>
//                 <p className="text-gray-500 max-w-xs">Choose a group or a teammate from the sidebar.</p>
//               </div>
//             ) : (
//               <>
//                 {/* header */}
//                 <header className="h-12 shrink-0 flex items-center gap-2 px-2 sm:px-4 border-b border-gray-200 bg-white pt-[env(safe-area-inset-top)] box-content">
//                   <button onClick={closeChat} title="Back"
//                     className="md:hidden w-8 h-8 rounded-md text-gray-600 hover:bg-gray-100 flex items-center justify-center shrink-0"><MdArrowBack size={20} /></button>
//                   <div className="min-w-0 flex-1 flex items-center gap-2">
//                     {isGroup ? <span className="text-base font-bold text-gray-400">#</span> : <Tile name={active.name} profileImage={active.profileImage} size={26} />}
//                     <h2 className="font-extrabold text-[15px] truncate">{active.name}</h2>
//                     <span className="hidden sm:inline text-xs text-gray-400 truncate">{activeChat?.description || active.subtitle}</span>
//                   </div>
//                   {isGroup && (
//                     <button onClick={() => setShowMembers((v) => !v)}
//                       className={`h-8 px-2.5 rounded-md border flex items-center gap-1.5 text-xs font-semibold transition-colors ${showMembers ? "bg-teal-50 border-teal-300 text-teal-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
//                       <FaUsers size={12} /> {members.length}
//                     </button>
//                   )}
//                 </header>

//                 {/* members panel */}
//                 {showMembers && isGroup && (
//                   <div className="absolute top-12 right-0 bottom-0 w-full sm:w-72 bg-white border-l border-gray-200 shadow-xl z-30 flex flex-col fade-up mt-[env(safe-area-inset-top)]">
//                     <div className="h-11 px-3 flex items-center justify-between border-b border-gray-100 shrink-0">
//                       <p className="font-bold">Members ({members.length})</p>
//                       <button onClick={() => setShowMembers(false)} className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center"><MdClose size={18} /></button>
//                     </div>
//                     <div className="flex-1 overflow-y-auto scroll-y p-2 space-y-0.5">
//                       {members.map((m) => {
//                         const isCreator = String(m.user) === String(activeChat?.createdBy);
//                         const isMe = String(m.user) === String(meId);
//                         return (
//                           <div key={String(m.user)} className="group flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-gray-50">
//                             <Tile name={memberName(m)} profileImage={m.profileImage} size={28} />
//                             <div className="min-w-0 flex-1 leading-tight">
//                               <p className="font-semibold truncate">
//                                 {memberName(m)}{isMe && <span className="text-gray-400 font-normal"> (you)</span>}
//                               </p>
//                               <p className="text-[11px] text-teal-600 truncate">
//                                 {memberRole(m)}{m.role === "admin" && " · Group admin"}
//                               </p>
//                             </div>
//                             {canManage && !isMe && !isCreator && (
//                               <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
//                                 <button onClick={() => doRole(m)} title={m.role === "admin" ? "Remove group admin" : "Make group admin"}
//                                   className={`w-6 h-6 rounded flex items-center justify-center hover:bg-teal-50 ${m.role === "admin" ? "text-teal-600" : "text-gray-400"}`}>
//                                   <FaUserShield size={12} />
//                                 </button>
//                                 <button onClick={() => doRemove(m)} title="Remove from group"
//                                   className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50">
//                                   <MdClose size={15} />
//                                 </button>
//                               </div>
//                             )}
//                           </div>
//                         );
//                       })}
//                     </div>
//                     <div className="shrink-0 border-t border-gray-100 p-2 space-y-1.5">
//                       {canManage && (
//                         <button onClick={() => navigate(`/edit-group/${active.chatId}`)}
//                           className="w-full h-8 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center gap-1.5">
//                           <MdEdit size={14} /> Edit group &amp; add members
//                         </button>
//                       )}
//                       {/* <button onClick={doLeave}
//                         className="w-full h-8 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold flex items-center justify-center gap-1.5">
//                         <MdExitToApp size={14} /> Leave group
//                       </button> */}
//                       {canManage && (
//                         <button onClick={doDeleteGroup}
//                           className="w-full h-8 rounded-md bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center gap-1.5">
//                           <MdDelete size={14} /> Delete group
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 )}

//                 {/* messages */}
//                 <div onScroll={onScroll} className="flex-1 overflow-y-auto scroll-y py-3">
//                   {hasMore && !msgLoading && (
//                     <div className="flex justify-center pb-2">
//                       <button onClick={loadMore} disabled={loadingMore}
//                         className="px-3 py-1 rounded-full border border-gray-200 text-[11px] font-bold text-teal-700 hover:bg-teal-50 disabled:opacity-60">
//                         {loadingMore ? "Loading…" : "Load earlier messages"}
//                       </button>
//                     </div>
//                   )}

//                   {msgLoading && <div className="flex justify-center py-10"><div className="spinner" /></div>}

//                   {!msgLoading && msgError && (
//                     <div className="text-center py-10">
//                       <p className="text-red-500 font-semibold mb-2">{msgError}</p>
//                       <button onClick={reloadMessages} className="px-3 py-1.5 bg-teal-600 text-white rounded-md text-xs font-semibold hover:bg-teal-700">Retry</button>
//                     </div>
//                   )}

//                   {!msgLoading && !msgError && messages.length === 0 && (
//                     <div className="px-5 py-8">
//                       <Tile name={active.name} profileImage={active.profileImage} size={48} />
//                       <h3 className="mt-3 text-lg font-extrabold">{isGroup ? `# ${active.name}` : active.name}</h3>
//                       <p className="text-gray-500 mt-1">
//                         {isGroup ? "This is the start of the group. Say something to the team." : "This is the start of your conversation."}
//                       </p>
//                       <div className="flex flex-wrap gap-2 mt-3">
//                         {QUICK.map((q) => (
//                           <button key={q} onClick={() => submit(q)}
//                             className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-teal-50 hover:border-teal-300 transition-colors">{q}</button>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {items.map((it) => {
//                     if (it.kind === "day") {
//                       return (
//                         <div key={it.key} className="flex items-center gap-3 px-4 sm:px-5 my-3">
//                           <div className="flex-1 h-px bg-gray-200" />
//                           <span className="px-3 py-0.5 rounded-full border border-gray-200 text-[11px] font-bold text-gray-600 bg-white">{it.label}</span>
//                           <div className="flex-1 h-px bg-gray-200" />
//                         </div>
//                       );
//                     }
//                     const { m, first } = it;
//                     const mine = String(m.sender) === String(meId);
//                     const sender = nameOf(m.senderInfo);
//                     const seenCount = (m.readBy || []).filter((x) => String(x) !== String(meId)).length;
//                     const barOpen = picked === m._id;
//                     return (
//                       <div key={m._id}
//                         onClick={() => setPicked((p) => (p === m._id ? null : m._id))}
//                         className={`group relative flex gap-2.5 px-4 sm:px-5 hover:bg-gray-50 ${first ? "pt-2" : "pt-0"} pb-0.5 ${m.pending ? "opacity-60" : ""}`}>
//                         <div className="w-9 shrink-0">
//                           {first ? (
//                             <Tile name={sender} profileImage={m.senderInfo?.profileImage} size={36} />
//                           ) : (
//                             <span className="hidden group-hover:block text-[10px] text-gray-400 text-right leading-5 pt-0.5">{formatTime(m.createdAt)}</span>
//                           )}
//                         </div>
//                         <div className="min-w-0 flex-1">
//                           {first && (
//                             <p className="leading-tight">
//                               <span className="font-extrabold text-[14px]">{mine ? "You" : sender}</span>
//                               <span className="ml-2 text-[11px] text-gray-400">{formatTime(m.createdAt)}</span>
//                             </p>
//                           )}
//                           {m.replyToMessage && (
//                             <div className="my-0.5 pl-2 border-l-2 border-teal-300 text-[12px] text-gray-500 max-w-md">
//                               <span className="font-semibold text-teal-700">{nameFor(m.replyToMessage.sender)}</span>
//                               <p className="truncate">{replySnippet(m.replyToMessage)}</p>
//                             </div>
//                           )}
//                           {m.content && (
//                             <p className={`leading-snug whitespace-pre-wrap break-words ${m.messageType === "sticker" ? "text-4xl" : "text-[14px]"}`}>
//                               {m.content}
//                               {m.isEdited && <span className="ml-1.5 text-[10px] text-gray-400">(edited)</span>}
//                             </p>
//                           )}
//                           <Attachments items={m.attachments} />
//                           {m.failed && (
//                             <p className="text-[11px] text-red-500 font-semibold">
//                               Not sent{m.error ? ` — ${m.error}` : ""}{" "}
//                               {!m.attachments?.length && (
//                                 <button onClick={(e) => { e.stopPropagation(); retryMessage(m); }} className="underline">Retry</button>
//                               )}{" "}
//                               <button onClick={(e) => { e.stopPropagation(); dismissMessage(m._id); }} className="underline">Dismiss</button>
//                             </p>
//                           )}
//                           {mine && m._id === lastMineId && seenCount > 0 && (
//                             <p className="text-[10px] text-teal-600 font-semibold">
//                               {isGroup ? `Seen by ${seenCount}` : "Seen"}
//                             </p>
//                           )}
//                         </div>

//                         {!m.pending && !m.failed && (
//                           <div
//                             onClick={(e) => e.stopPropagation()}
//                             className={`absolute right-3 -top-3 ${barOpen ? "flex" : "hidden group-hover:flex"} items-center bg-white border border-gray-200 rounded-md shadow-sm z-10`}
//                           >
//                             <button title="Reply" onClick={() => startReply(m)}
//                               className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-l-md"><MdReply size={15} /></button>
//                             {mine && (
//                               <button title="Edit" onClick={() => startEdit(m)}
//                                 className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-teal-700 hover:bg-teal-50"><MdEdit size={14} /></button>
//                             )}
//                             {(mine || canManage) && (
//                               <button title="Delete" onClick={() => onDelete(m)}
//                                 className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-r-md"><MdDelete size={14} /></button>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     );
//                   })}
//                   <div ref={bottomRef} />
//                 </div>

//                 {showJump && (
//                   <button onClick={jumpDown} title="Latest messages"
//                     className="absolute right-4 bottom-32 w-8 h-8 rounded-full bg-white text-teal-700 shadow-lg border border-gray-200 flex items-center justify-center hover:scale-110 transition-transform z-20">
//                     <MdKeyboardArrowDown size={22} />
//                   </button>
//                 )}

//                 {/* composer */}
//                 <div className="shrink-0 px-3 sm:px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
//                   <div className="h-5 text-[11px] text-gray-400 flex items-center gap-1.5">
//                     {typingText && (<><span className="dot" /><span className="dot" /><span className="dot" /><span>{typingText}</span></>)}
//                   </div>

//                   {showEmoji && (
//                     <div className="grid grid-cols-6 sm:grid-cols-12 gap-0.5 p-1.5 mb-1.5 rounded-lg border border-gray-200 bg-white shadow-sm fade-up">
//                       {EMOJIS.map((e) => (
//                         <button key={e} onClick={() => { setText((t) => t + e); inputRef.current?.focus(); }}
//                           className="h-8 rounded-md hover:bg-teal-50 text-lg">{e}</button>
//                       ))}
//                     </div>
//                   )}

//                   <div className="rounded-lg border border-gray-300 bg-white focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all">
//                     {(replyTo || editing) && (
//                       <div className="flex items-center gap-2 px-3 pt-2 text-[12px] text-gray-500">
//                         <div className="min-w-0 flex-1 pl-2 border-l-2 border-teal-400">
//                           <span className="font-semibold text-teal-700">
//                             {editing ? "Editing message" : `Replying to ${nameFor(replyTo.sender)}`}
//                           </span>
//                           <p className="truncate">{(editing || replyTo).content || "📎 Attachment"}</p>
//                         </div>
//                         <button onClick={editing ? cancelEdit : () => setReplyTo(null)} title="Cancel"
//                           className="w-6 h-6 rounded hover:bg-gray-100 flex items-center justify-center shrink-0"><MdClose size={15} /></button>
//                       </div>
//                     )}

//                     {files.length > 0 && (
//                       <div className="flex flex-wrap gap-1.5 px-3 pt-2">
//                         {files.map((f, i) => (
//                           <span key={`${f.name}-${i}`} className="inline-flex items-center gap-1 max-w-[180px] pl-2 pr-1 py-0.5 rounded-full bg-teal-50 border border-teal-100 text-teal-800 text-[11px] font-semibold">
//                             <span className="truncate">{f.name}</span>
//                             <button onClick={() => setFiles((prev) => prev.filter((_, k) => k !== i))}
//                               className="w-4 h-4 rounded-full hover:bg-teal-200 flex items-center justify-center shrink-0"><MdClose size={11} /></button>
//                           </span>
//                         ))}
//                       </div>
//                     )}

//                     <textarea
//                       ref={inputRef}
//                       rows={1}
//                       value={text}
//                       onChange={(e) => {
//                         setText(e.target.value);
//                         if (!editing) notifyTyping();
//                       }}
//                       onInput={(e) => {
//                         e.target.style.height = "auto";
//                         e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
//                       }}
//                       onKeyDown={onKeyDown}
//                       placeholder={`Message ${isGroup ? "#" : ""}${active.name}`}
//                       className="s-input w-full px-3 pt-2.5 pb-1 bg-transparent resize-none max-h-[120px] text-base sm:text-[14px] placeholder:text-gray-400"
//                     />
//                     <div className="flex items-center justify-between px-1.5 pb-1.5">
//                       <div className="flex items-center gap-0.5">
//                         <button onClick={() => setShowEmoji((v) => !v)} title="Emoji"
//                           className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${showEmoji ? "bg-teal-100 text-teal-700" : "text-gray-400 hover:text-teal-600 hover:bg-gray-100"}`}>
//                           <FaRegSmile size={16} />
//                         </button>
//                         {!editing && (
//                           <>
//                             <input ref={fileRef} type="file" multiple hidden onChange={onPickFiles} />
//                             <button onClick={() => fileRef.current?.click()} title="Attach files"
//                               className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-gray-100 transition-colors">
//                               <FaPaperclip size={14} />
//                             </button>
//                           </>
//                         )}
//                       </div>
//                       <button onClick={() => submit()} disabled={(!text.trim() && !files.length) || sending} title={editing ? "Save" : "Send"}
//                         className="h-7 px-2.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 text-xs font-bold transition-colors disabled:opacity-40 disabled:hover:bg-teal-600">
//                         <FaPaperPlane size={11} /> <span className="hidden sm:inline">{editing ? "Save" : "Send"}</span>
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </>
//             )}
//           </section>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AdminChat;