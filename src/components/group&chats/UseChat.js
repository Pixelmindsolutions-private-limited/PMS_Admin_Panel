// src/services/useChat.js   (SAME FILE in the Admin panel and the Staff panel)
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  chatApi,
  connectChatSocket,
  getCurrentUser,
  roleOf,
  memberName,
  memberRole,
} from "./ChatApi";

const PAGE_SIZE = 40;
const byRecent = (a, b) =>
  new Date(b.last?.createdAt || 0) - new Date(a.last?.createdAt || 0);

const otherMember = (chat, meId) =>
  (chat.members || []).find((m) => String(m.user) !== String(meId));

// API chat view -> sidebar item
const chatToItem = (c, meId) => {
  const base = {
    chatId: c._id,
    key: c._id,
    unread: c.unreadCount || 0,
    last: c.lastMessage || null,
  };
  if (c.type === "group") {
    return {
      ...base,
      type: "group",
      name: c.title || c.name || "Group",
      subtitle: `${(c.members || []).length} members`,
    };
  }
  const o = otherMember(c, meId);
  return {
    ...base,
    type: "direct",
    employeeId: o?.employeeId || null,
    name: c.title || "Chat",
    subtitle: roleOf(c.otherUser) || (o?.accountType === "admin" ? "Admin" : ""),
  };
};

export default function useChat({ initialChatId = null } = {}) {
  const me = useMemo(() => getCurrentUser(), []);
  const [meId, setMeId] = useState(me.id);
  const meIdRef = useRef(me.id);
  meIdRef.current = meId;

  const [chats, setChats] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [online, setOnline] = useState(false);
  const [search, setSearch] = useState("");

  const [active, setActive] = useState(null); // sidebar item
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingNames, setTypingNames] = useState({});

  const activeRef = useRef(null);
  activeRef.current = active;
  const chatsRef = useRef([]);
  chatsRef.current = chats;
  const socketRef = useRef(null);
  const justCreated = useRef(null);
  const typingTimers = useRef({});
  const typingRef = useRef({ on: false, timer: null });

  /* ---------------- chats list ---------------- */
  const refreshChats = useCallback(async () => {
    const j = await chatApi.chats();
    const list = Array.isArray(j.data) ? j.data : [];
    setChats(list);
    return list;
  }, []);

  const refreshChat = useCallback(async (id) => {
    try {
      const j = await chatApi.getChat(id);
      setChats((prev) =>
        prev.some((c) => c._id === id) ? prev.map((c) => (c._id === id ? j.data : c)) : [j.data, ...prev]
      );
    } catch (e) {
      /* no longer a member */
    }
  }, []);

  const init = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await refreshChats();
      if (initialChatId) {
        const found = list.find((c) => c._id === initialChatId);
        if (found) setActive(chatToItem(found, meIdRef.current));
      }
    } catch (err) {
      console.error("Chat load error:", err);
      setError(err.message || "Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, [initialChatId, refreshChats]);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // people you can start a chat with (server-side search, debounced)
  useEffect(() => {
    const t = setTimeout(
      async () => {
        try {
          const j = await chatApi.users(search.trim());
          setPeople(Array.isArray(j.data) ? j.data : []);
        } catch (e) {
          /* keep previous list */
        }
      },
      search ? 300 : 0
    );
    return () => clearTimeout(t);
  }, [search]);

  /* ---------------- sidebar data ---------------- */
  const { groups, directs, unreadTotal } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const g = chats
      .filter((c) => c.type === "group")
      .map((c) => chatToItem(c, meId))
      .filter((i) => !q || i.name.toLowerCase().includes(q))
      .sort(byRecent);

    const existing = chats.filter((c) => c.type === "direct").map((c) => chatToItem(c, meId));
    const known = new Set(existing.map((d) => d.employeeId).filter(Boolean));
    const existingShown = existing
      .filter((d) => !q || d.name.toLowerCase().includes(q) || (d.subtitle || "").toLowerCase().includes(q))
      .sort(byRecent);
    const fresh = people
      .filter((u) => !known.has(u.employeeId))
      .map((u) => ({
        type: "direct",
        chatId: null,
        key: `new:${u.employeeId}`,
        employeeId: u.employeeId,
        name: u.employeeName,
        subtitle: u.role,
        unread: 0,
        last: null,
      }));

    return {
      groups: g,
      directs: [...existingShown, ...fresh],
      unreadTotal: chats.reduce((n, c) => n + (c.unreadCount || 0), 0),
    };
  }, [chats, people, search, meId]);

  const activeChat = useMemo(
    () => (active?.chatId ? chats.find((c) => c._id === active.chatId) || null : null),
    [chats, active]
  );
  const isGroup = active?.type === "group";
  const canManage = isGroup && activeChat?.myRole === "admin";
  const members = activeChat?.members;
  const memberMap = useMemo(() => {
    const map = {};
    (members || []).forEach((m) => {
      map[String(m.user)] = { name: memberName(m), role: memberRole(m) };
    });
    return map;
  }, [members]);

  const isActive = useCallback(
    (c) =>
      !!active &&
      ((c.chatId && c.chatId === active.chatId) ||
        (!c.chatId && !active.chatId && c.type === "direct" && c.employeeId === active.employeeId)),
    [active]
  );

  /* ---------------- typing ---------------- */
  const stopTyping = useCallback(() => {
    const t = typingRef.current;
    clearTimeout(t.timer);
    if (t.on) {
      t.on = false;
      const id = activeRef.current?.chatId;
      if (id) socketRef.current?.emit("chat:typing", { chatId: id, isTyping: false });
    }
  }, []);

  const notifyTyping = useCallback(() => {
    const id = activeRef.current?.chatId;
    if (!id) return;
    const t = typingRef.current;
    if (!t.on) {
      t.on = true;
      socketRef.current?.emit("chat:typing", { chatId: id, isTyping: true });
    }
    clearTimeout(t.timer);
    t.timer = setTimeout(stopTyping, 2000);
  }, [stopTyping]);

  /* ---------------- messages ---------------- */
  const loadMessages = useCallback(async (chatId) => {
    setMsgLoading(true);
    setMsgError("");
    try {
      const j = await chatApi.messages(chatId, 1, PAGE_SIZE);
      if (activeRef.current?.chatId !== chatId) return;
      setMessages(Array.isArray(j.data) ? j.data : []);
      setHasMore(!!j.hasMore);
      setPage(1);
      setChats((prev) => prev.map((c) => (c._id === chatId ? { ...c, unreadCount: 0 } : c)));
      chatApi.markRead(chatId).catch(() => {});
    } catch (e) {
      if (activeRef.current?.chatId === chatId) setMsgError(e.message || "Failed to load messages");
    } finally {
      if (activeRef.current?.chatId === chatId) setMsgLoading(false);
    }
  }, []);

  const activeKey = active ? active.chatId || active.key : null;
  useEffect(() => {
    const cid = activeRef.current?.chatId || null;
    // first message of a brand-new direct chat: messages are already on screen
    if (cid && justCreated.current === cid) {
      justCreated.current = null;
      return;
    }
    setMessages([]);
    setHasMore(false);
    setPage(1);
    setMsgError("");
    setMsgLoading(false);
    setTypingNames({});
    if (cid) loadMessages(cid);
  }, [activeKey, loadMessages]);

  const reloadMessages = useCallback(() => {
    const cid = activeRef.current?.chatId;
    if (cid) loadMessages(cid);
  }, [loadMessages]);

  const loadMore = useCallback(async () => {
    const cid = activeRef.current?.chatId;
    if (!cid || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const j = await chatApi.messages(cid, next, PAGE_SIZE);
      if (activeRef.current?.chatId !== cid) return;
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m._id));
        return [...(j.data || []).filter((m) => !ids.has(m._id)), ...prev];
      });
      setPage(next);
      setHasMore(!!j.hasMore);
    } catch (e) {
      /* ignore, user can press again */
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore]);

  /* ---------------- actions ---------------- */
  const selectItem = useCallback(
    (item) => {
      stopTyping();
      setActive(item);
    },
    [stopTyping]
  );

  const closeChat = useCallback(() => {
    stopTyping();
    setActive(null);
  }, [stopTyping]);

  const send = useCallback(
    async ({ text, files = [], replyTo = null }) => {
      const cur = activeRef.current;
      if (!cur) return false;
      const content = (text || "").trim();
      if (!content && !files.length) return false;
      stopTyping();

      const tmpId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setMessages((prev) => [
        ...prev,
        {
          _id: tmpId,
          chat: cur.chatId,
          sender: meIdRef.current,
          senderType: me.type,
          senderInfo: { displayName: me.name },
          content,
          attachments: files.map((f) => ({
            url: "",
            fileName: f.name,
            mimeType: f.type,
            size: f.size,
            kind: f.type.startsWith("image/") ? "image" : "file",
          })),
          replyTo,
          readBy: [],
          createdAt: new Date().toISOString(),
          pending: true,
        },
      ]);
      setSending(true);

      try {
        const res = cur.chatId
          ? await chatApi.sendMessage(cur.chatId, { content, replyTo, files })
          : await chatApi.sendDirect({ employeeId: cur.employeeId, content, replyTo, files });
        const real = res.data;
        const chatId = String(real.chat);

        if (!cur.chatId) {
          // chat was created by this first message
          justCreated.current = chatId;
          setActive((a) =>
            a && !a.chatId && a.employeeId === cur.employeeId ? { ...a, chatId, key: chatId } : a
          );
          await refreshChats().catch(() => {});
        } else {
          setChats((prev) =>
            prev.map((c) => (c._id === chatId ? { ...c, lastMessage: real, unreadCount: 0 } : c))
          );
        }

        setMessages((prev) => {
          const rest = prev.filter((m) => m._id !== tmpId);
          return rest.some((m) => m._id === real._id) ? rest : [...rest, real];
        });
        return true;
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === tmpId ? { ...m, pending: false, failed: true, error: err.message } : m
          )
        );
        return false;
      } finally {
        setSending(false);
      }
    },
    [me, refreshChats, stopTyping]
  );

  const dismissMessage = useCallback(
    (id) => setMessages((prev) => prev.filter((m) => m._id !== id)),
    []
  );

  const retryMessage = useCallback(
    (m) => {
      dismissMessage(m._id);
      send({ text: m.content, replyTo: m.replyTo || null });
    },
    [dismissMessage, send]
  );

  const editMessage = useCallback(async (messageId, content) => {
    const cid = activeRef.current?.chatId;
    const res = await chatApi.editMessage(cid, messageId, content);
    setMessages((prev) => prev.map((m) => (m._id === messageId ? res.data : m)));
    setChats((prev) =>
      prev.map((c) => (c.lastMessage?._id === messageId ? { ...c, lastMessage: res.data } : c))
    );
  }, []);

  const removeMessage = useCallback(async (messageId) => {
    const cid = activeRef.current?.chatId;
    await chatApi.deleteMessage(cid, messageId);
    setMessages((prev) => prev.filter((m) => m._id !== messageId));
  }, []);

  const leaveGroup = useCallback(async () => {
    const cid = activeRef.current?.chatId;
    await chatApi.leave(cid);
    setChats((prev) => prev.filter((c) => c._id !== cid));
    setActive(null);
  }, []);

  const deleteGroup = useCallback(async () => {
    const cid = activeRef.current?.chatId;
    await chatApi.deleteChat(cid);
    setChats((prev) => prev.filter((c) => c._id !== cid));
    setActive(null);
  }, []);

  const removeMember = useCallback(
    async (userRef) => {
      const cid = activeRef.current?.chatId;
      await chatApi.removeMember(cid, userRef);
      await refreshChat(cid);
    },
    [refreshChat]
  );

  const setMemberRole = useCallback(
    async (userRef, role) => {
      const cid = activeRef.current?.chatId;
      await chatApi.setRole(cid, userRef, role);
      await refreshChat(cid);
    },
    [refreshChat]
  );

  /* ---------------- socket.io (live updates) ---------------- */
  useEffect(() => {
    const socket = connectChatSocket();
    socketRef.current = socket;
    let firstConnect = true;

    const dropTyping = (uid) => {
      clearTimeout(typingTimers.current[uid]);
      setTypingNames((p) => {
        if (!(uid in p)) return p;
        const n = { ...p };
        delete n[uid];
        return n;
      });
    };

    const removeChat = (chatId) => {
      setChats((prev) => prev.filter((c) => c._id !== chatId));
      if (activeRef.current?.chatId === chatId) setActive(null);
    };

    socket.on("connect", () => {
      setOnline(true);
      if (!firstConnect) {
        // reconnected: catch up on anything missed
        chatApi.chats().then((j) => setChats(j.data || [])).catch(() => {});
        const cid = activeRef.current?.chatId;
        if (cid) {
          chatApi
            .messages(cid, 1, PAGE_SIZE)
            .then((j) => {
              if (activeRef.current?.chatId !== cid) return;
              setMessages((prev) => [...(j.data || []), ...prev.filter((m) => m.pending || m.failed)]);
            })
            .catch(() => {});
        }
      }
      firstConnect = false;
    });
    socket.on("disconnect", () => setOnline(false));
    socket.on("connect_error", () => setOnline(false));

    socket.on("chat:ready", ({ userId }) => {
      if (userId) setMeId(String(userId));
    });

    socket.on("chat:new", (view) => {
      if (!view?._id) return;
      setChats((prev) =>
        prev.some((c) => c._id === view._id)
          ? prev.map((c) => (c._id === view._id ? view : c))
          : [view, ...prev]
      );
    });

    socket.on("chat:message", (msg) => {
      const chatId = String(msg.chat);
      const mine = String(msg.sender) === String(meIdRef.current);
      const open = activeRef.current?.chatId === chatId;
      if (!mine) dropTyping(String(msg.sender));

      if (!chatsRef.current.some((c) => c._id === chatId)) {
        refreshChat(chatId);
      } else {
        setChats((prev) =>
          prev.map((c) =>
            c._id === chatId
              ? {
                  ...c,
                  lastMessage: msg,
                  unreadCount: open ? 0 : mine ? c.unreadCount || 0 : (c.unreadCount || 0) + 1,
                }
              : c
          )
        );
      }

      if (open) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          let next = prev;
          if (mine) {
            const i = prev.findIndex((m) => m.pending && m.content === msg.content);
            if (i > -1) next = prev.filter((_, k) => k !== i);
          }
          return [...next, msg];
        });
        if (!mine) chatApi.markRead(chatId).catch(() => {});
      }
    });

    socket.on("chat:message-edited", (msg) => {
      if (!msg?._id) return;
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)));
      setChats((prev) =>
        prev.map((c) => (c.lastMessage?._id === msg._id ? { ...c, lastMessage: msg } : c))
      );
    });

    socket.on("chat:message-deleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      setChats((prev) =>
        prev.map((c) =>
          c.lastMessage?._id === messageId
            ? { ...c, lastMessage: { ...c.lastMessage, isDeleted: true, content: "", attachments: [] } }
            : c
        )
      );
    });

    socket.on("chat:updated", ({ chatId, name, description }) => {
      setChats((prev) =>
        prev.map((c) => (c._id === chatId ? { ...c, name, title: name, description } : c))
      );
      setActive((a) => (a?.chatId === chatId ? { ...a, name } : a));
    });

    ["chat:members-added", "chat:member-removed", "chat:member-role"].forEach((ev) =>
      socket.on(ev, ({ chatId }) => refreshChat(chatId))
    );

    socket.on("chat:removed", ({ chatId }) => removeChat(chatId));
    socket.on("chat:deleted", ({ chatId }) => removeChat(chatId));

    socket.on("chat:read", ({ chatId, userId }) => {
      if (activeRef.current?.chatId !== chatId) return;
      setMessages((prev) =>
        prev.map((m) =>
          (m.readBy || []).map(String).includes(String(userId))
            ? m
            : { ...m, readBy: [...(m.readBy || []), userId] }
        )
      );
    });

    socket.on("chat:typing", ({ chatId, userId, name, isTyping }) => {
      const uid = String(userId);
      if (uid === String(meIdRef.current)) return;
      if (activeRef.current?.chatId !== String(chatId)) return;
      clearTimeout(typingTimers.current[uid]);
      if (isTyping) {
        setTypingNames((p) => ({ ...p, [uid]: name || "Someone" }));
        typingTimers.current[uid] = setTimeout(() => dropTyping(uid), 4000);
      } else {
        dropTyping(uid);
      }
    });

    return () => {
      Object.values(typingTimers.current).forEach(clearTimeout);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [refreshChat]);

  return {
    me,
    meId,
    loading,
    error,
    online,
    search,
    setSearch,
    groups,
    directs,
    unreadTotal,
    active,
    activeChat,
    members: members || [],
    memberMap,
    isGroup,
    canManage,
    messages,
    msgLoading,
    msgError,
    hasMore,
    loadingMore,
    sending,
    typingNames,
    init,
    refreshChats,
    selectItem,
    closeChat,
    isActive,
    reloadMessages,
    loadMore,
    send,
    retryMessage,
    dismissMessage,
    editMessage,
    removeMessage,
    leaveGroup,
    deleteGroup,
    removeMember,
    setMemberRole,
    notifyTyping,
    stopTyping,
  };
}