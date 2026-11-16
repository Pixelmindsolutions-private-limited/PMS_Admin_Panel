// src/services/chatUi.jsx   (SAME FILE in the Admin panel and the Staff panel)
import React from "react";
import { FaUsers, FaFileAlt } from "react-icons/fa";
import { formatSize } from "./ChatApi";

export const EMOJIS = ["😀", "😂", "😍", "👍", "🙏", "🔥", "🎉", "✅", "💡", "👏", "😅", "❤️"];

/* ---------- SHARED STYLES (same look as Staff page) ---------- */
export const GROUP_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  .gc-root, .gc-root * { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; }

  .premium-card {
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(20,184,166,0.18);
    box-shadow: 0 4px 24px -4px rgba(0,128,128,0.10), 0 1px 4px rgba(0,0,0,0.04);
  }
  .stat-card {
    background: rgba(255,255,255,0.95);
    border: 1px solid rgba(20,184,166,0.15);
    box-shadow: 0 2px 12px -2px rgba(0,128,128,0.08);
    transition: all 0.25s ease;
  }
  .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px -4px rgba(0,128,128,0.15); }
  .s-input { outline: none !important; }
  @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  .spinner { width:40px; height:40px; border:3px solid #e0f2f1; border-top:3px solid #0d9488; border-radius:50%; animation:spin 0.8s linear infinite; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .fade-up { animation:fadeUp 0.3s ease forwards; }
  .modal-back { position:fixed;inset:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);z-index:50;display:flex;align-items:center;justify-content:center;padding:16px; }
  .scroll-y::-webkit-scrollbar { width:5px; }
  .scroll-y::-webkit-scrollbar-track { background:transparent; }
  .scroll-y::-webkit-scrollbar-thumb { background:#99f6e4; border-radius:4px; }
  .chat-bg {
    background-color: #f0fdfa;
    background-image: radial-gradient(rgba(20,184,166,0.10) 1px, transparent 1px);
    background-size: 18px 18px;
  }
`;

/* ---------- AVATAR ---------- */
export const Avatar = ({ name = "", size = 40, group = false, className = "" }) => {
  const style = { width: size, height: size, minWidth: size };
  if (group) {
    return (
      <div
        style={style}
        className={`rounded-xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shrink-0 border-2 border-teal-50 shadow-sm shadow-teal-500/20 ${className}`}
      >
        <FaUsers className="text-white" size={Math.round(size * 0.42)} />
      </div>
    );
  }
  return (
    <div
      style={style}
      className={`rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shrink-0 border-2 border-teal-50 ${className}`}
    >
      <span className="text-white font-bold" style={{ fontSize: Math.round(size * 0.42) }}>
        {name?.charAt(0)?.toUpperCase() || "?"}
      </span>
    </div>
  );
};

/* ---------- MESSAGE ATTACHMENTS (image / video / audio / file) ---------- */
export const Attachments = ({ items = [] }) => {
  if (!items.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {items.map((a, i) => {
        const kind = a.kind || "file";
        if (kind === "image" && a.url) {
          return (
            <a key={i} href={a.url} target="_blank" rel="noreferrer">
              <img
                src={a.url}
                alt={a.fileName || "image"}
                className="max-h-48 max-w-[260px] rounded-lg border border-gray-200 object-cover"
              />
            </a>
          );
        }
        if (kind === "video" && a.url) {
          return (
            <video key={i} src={a.url} controls className="max-h-56 max-w-[300px] rounded-lg border border-gray-200" />
          );
        }
        if (kind === "audio" && a.url) {
          return <audio key={i} src={a.url} controls className="max-w-[260px]" />;
        }
        return (
          <a
            key={i}
            href={a.url || undefined}
            target="_blank"
            rel="noreferrer"
            download={a.fileName || true}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-teal-50 hover:border-teal-200 transition-colors max-w-[280px]"
          >
            <FaFileAlt className="text-teal-600 shrink-0" size={16} />
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-gray-700 truncate">{a.fileName || "File"}</span>
              <span className="block text-[10px] text-gray-400">{formatSize(a.size)}</span>
            </span>
          </a>
        );
      })}
    </div>
  );
};