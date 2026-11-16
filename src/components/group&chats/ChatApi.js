// src/services/chatApi.js   (SAME FILE in the Admin panel and the Staff panel)
import { io } from "socket.io-client";

/* =====================================================================
   CONFIG  - change these two for staging / production
   ===================================================================== */
export const API_ROOT = "http://localhost:5000/api";
export const SOCKET_ROOT = "http://localhost:5000"; // socket namespace is /chat

/* =====================================================================
   AUTH  (token comes from sessionStorage "loginDetails")
   ===================================================================== */
export const getLoginDetails = () => {
  try {
    return JSON.parse(sessionStorage.getItem("loginDetails") || "null");
  } catch (e) {
    return null;
  }
};
// export const getAuthToken = () => getLoginDetails()?.token || "";
export const getAuthToken = () => "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhZTA0ZDc5MTdhYTFjYWJjNzU2OGZmYiIsImFkbWluSWQiOiI2YWUwNGQ3OTE3YWExY2FiYzc1NjhmZmIiLCJlbWFpbCI6InZpamF5LnBpeGVsbWluZHNvbHV0aW9uc0BnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJ0eXBlIjoiYWRtaW4iLCJpYXQiOjE3OTQ4MDY2NTUsImV4cCI6MTc5NTQxMTQ1NX0.B70fuXCglLrj3V_j1ljdMyNcdcBDDG0jJL7Ar5JfxFQ";

const decodeJwt = (token) => {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(payload)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
};

/* { id (Mongo _id), type: "admin" | "staff", employeeId, name, role } */
export const getCurrentUser = () => {
  const d = getLoginDetails();
  const p = decodeJwt(getAuthToken()) || {};
  const type = p.type || (String(d?.role || "").toLowerCase() === "admin" ? "admin" : "staff");
  return {
    id: String(p.id || p.adminId || d?.id || d?.user?._id || ""),
    type,
    employeeId: p.employeeId || d?.employeeId || d?.user?.employeeId || "",
    name:
      d?.employeeName || d?.user?.employeeName || d?.name || d?.user?.name || d?.email || p.email || "Me",
    role: p.role || d?.role || "",
  };
};
export const isAdmin = () => getCurrentUser().type === "admin";

/* =====================================================================
   HTTP
   ===================================================================== */
export const apiFetch = async (path, options = {}) => {
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
  const res = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      // multipart: let the browser set the boundary
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });

  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    json = null;
  }
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || `HTTP error! status: ${res.status}`);
  }
  return json;
};

const qs = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.append(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};
const json = (body) => JSON.stringify(body);

// JSON when there are no files, multipart/form-data (field "files") when there are
const messageBody = ({ content, replyTo, files, extra = {} }) => {
  if (files && files.length) {
    const fd = new FormData();
    Object.entries(extra).forEach(([k, v]) => v != null && fd.append(k, v));
    if (content) fd.append("content", content);
    if (replyTo) fd.append("replyTo", replyTo);
    files.forEach((f) => fd.append("files", f));
    return fd;
  }
  return json({ ...extra, content, ...(replyTo ? { replyTo } : {}) });
};

export const chatApi = {
  // lists
  users: (search = "") => apiFetch(`/chat/users${qs({ search })}`),
  chats: (type) => apiFetch(`/chat${qs({ type })}`),
  groups: () => apiFetch("/chat/groups"),
  directs: () => apiFetch("/chat/direct"),
  unreadCount: () => apiFetch("/chat/unread-count"),

  // single chat
  getChat: (id) => apiFetch(`/chat/${id}`),
  deleteChat: (id) => apiFetch(`/chat/${id}`, { method: "DELETE" }),
  updateChat: (id, body) => apiFetch(`/chat/${id}`, { method: "PATCH", body: json(body) }),

  // direct
  createDirect: (employeeId) =>
    apiFetch("/chat/direct", { method: "POST", body: json({ employeeId }) }),
  sendDirect: ({ employeeId, content, replyTo, files }) =>
    apiFetch("/chat/direct/send", {
      method: "POST",
      body: messageBody({ content, replyTo, files, extra: { employeeId } }),
    }),

  // groups (admin creates; group admins manage)
  createGroup: (body) => apiFetch("/chat/group", { method: "POST", body: json(body) }),
  members: (id) => apiFetch(`/chat/${id}/members`),
  addMembers: (id, employeeIds) =>
    apiFetch(`/chat/${id}/members`, { method: "POST", body: json({ employeeIds }) }),
  removeMember: (id, ref) =>
    apiFetch(`/chat/${id}/members/${encodeURIComponent(ref)}`, { method: "DELETE" }),
  setRole: (id, ref, role) =>
    apiFetch(`/chat/${id}/members/${encodeURIComponent(ref)}/role`, {
      method: "PATCH",
      body: json({ role }),
    }),
  leave: (id) => apiFetch(`/chat/${id}/leave`, { method: "POST" }),

  // messages
  messages: (id, page = 1, limit = 40) =>
    apiFetch(`/chat/${id}/messages${qs({ page, limit })}`),
  sendMessage: (id, { content, replyTo, files }) =>
    apiFetch(`/chat/${id}/message`, {
      method: "POST",
      body: messageBody({ content, replyTo, files }),
    }),
  markRead: (id) => apiFetch(`/chat/${id}/read`, { method: "PATCH" }),
  editMessage: (id, messageId, content) =>
    apiFetch(`/chat/${id}/messages/${messageId}`, { method: "PATCH", body: json({ content }) }),
  deleteMessage: (id, messageId) =>
    apiFetch(`/chat/${id}/messages/${messageId}`, { method: "DELETE" }),
};

/* =====================================================================
   SOCKET.IO  (namespace /chat, token in handshake)
   ===================================================================== */
export const connectChatSocket = () =>
  io(`${SOCKET_ROOT}/chat`, {
    auth: { token: getAuthToken() },
    transports: ["websocket", "polling"],
    reconnection: true,
  });

/* =====================================================================
   DISPLAY HELPERS
   ===================================================================== */
export const nameOf = (u) => u?.displayName || u?.employeeName || u?.name || u?.email || "User";
export const roleOf = (u) => u?.role || u?.designation || "";

// chat member = { user, accountType, employeeId, role, userInfo }
export const memberName = (m) => nameOf(m?.userInfo || m);
export const memberRole = (m) =>
  roleOf(m?.userInfo) || (m?.accountType === "admin" ? "Admin" : "");

export const formatTime = (date) =>
  date ? new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";

export const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

export const dayLabel = (d) => {
  const date = new Date(d);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === y.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
};

export const formatSize = (bytes) => {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};