import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  CalendarDays, ChevronRight, Clock, AlertTriangle,
  FolderKanban, Smartphone, Globe, Megaphone, Users,
  UserPlus, FilePlus, BookOpen, ClipboardList, Zap,
} from "lucide-react";
import { useNavigate } from "react-router";

/* ─── Static chart data ─── */
const trendData = [
  { month: "Oct", projects: 1, staff: 3 },
  { month: "Nov", projects: 2, staff: 4 },
  { month: "Dec", projects: 2, staff: 4 },
  { month: "Jan", projects: 3, staff: 5 },
  { month: "Feb", projects: 3, staff: 5 },
  { month: "Mar", projects: 3, staff: 5 },
];

const weekActivity = [
  { day: "Mon", active: 4, idle: 1 },
  { day: "Tue", active: 5, idle: 0 },
  { day: "Wed", active: 3, idle: 2 },
  { day: "Thu", active: 5, idle: 0 },
  { day: "Fri", active: 4, idle: 1 },
];

/* ─── Helpers ─── */
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });

const urgencyClasses = (days) => {
  if (days < 0) return "bg-red-50 text-red-600 border border-red-200";
  if (days <= 7) return "bg-amber-50 text-amber-600 border border-amber-200";
  return "bg-emerald-50 text-emerald-600 border border-emerald-200";
};

const statusClasses = {
  active: "bg-teal-50 text-teal-700 border border-teal-200",
  completed: "bg-sky-50 text-sky-700 border border-sky-200",
  "on hold": "bg-amber-50 text-amber-700 border border-amber-200",
};

const STAT_MAP = {
  Projects: { link: '/projects', icon: FolderKanban, num: "text-teal-600", icon_bg: "bg-teal-50", bar: "bg-teal-500", orb: "bg-teal-400" },
  Apps: { link: '/projects', icon: Smartphone, num: "text-emerald-600", icon_bg: "bg-emerald-50", bar: "bg-emerald-500", orb: "bg-emerald-400" },
  Websites: { link: '/projects', icon: Globe, num: "text-sky-600", icon_bg: "bg-sky-50", bar: "bg-sky-500", orb: "bg-sky-400" },
  Marketing: { link: '/projects', icon: Megaphone, num: "text-pink-600", icon_bg: "bg-pink-50", bar: "bg-pink-500", orb: "bg-pink-400" },
  Staff: { link: '/staff', icon: Users, num: "text-violet-600", icon_bg: "bg-violet-50", bar: "bg-violet-500", orb: "bg-violet-400" },
};

const PIE_COLORS = ["#0891b2", "#059669", "#e11d48", "#f59e0b"];

const QUICK_LINKS = [
  { label: "Create Staff", icon: UserPlus, gradient: "from-violet-500 to-violet-600", shadow: "shadow-violet-200", route: "/staff/create" },
  { label: "Create Project", icon: FilePlus, gradient: "from-teal-500 to-teal-600", shadow: "shadow-teal-200", route: "/projects/create" },
  { label: "Create Worksheet", icon: BookOpen, gradient: "from-sky-500 to-sky-600", shadow: "shadow-sky-200", route: "/worksheets/create" },
  { label: "Mark Attendance", icon: ClipboardList, gradient: "from-amber-500 to-orange-500", shadow: "shadow-amber-200", route: "/attendance/mark" },
];

/* ─── Animated counter ─── */
const Counter = ({ target }) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const tick = () =>
      setV((c) => {
        if (c >= target) return target;
        raf = requestAnimationFrame(tick);
        return c + Math.ceil((target - c) / 7);
      });
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return <>{v}</>;
};

/* ─── Chart tooltip ─── */
const ChartTip = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div className="bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  ) : null;

/* ─── Stat Card ─── */
const StatCard = ({ link, label, count }) => {

  const navigate = useNavigate();


  const m = STAT_MAP[label] || STAT_MAP.Projects;
  const Icon = m.icon;
  return (
    <div onClick={() => navigate(link)} className="bg-white rounded-2xl p-3 sm:p-4 relative overflow-hidden border border-slate-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-default">
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10 ${m.orb}`} />
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center ${m.icon_bg}`}>
          <Icon size={15} className={m.num} />
        </div>
        <span className={`text-xl sm:text-2xl font-extrabold leading-none ${m.num}`}>
          <Counter target={count} />
        </span>
      </div>
      <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
      <div className={`mt-2 sm:mt-3 h-0.5 w-6 sm:w-8 rounded-full ${m.bar}`} />
    </div>
  );
};

/* ─── Card wrappers ─── */
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardHead = ({ children }) => (
  <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-50 flex-wrap gap-2">
    {children}
  </div>
);

/* ══════════════════════════════ MAIN ══════════════════════════════ */
const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loginDetails = (() => {
    try { return JSON.parse(sessionStorage.getItem("loginDetails") || "{}"); }
    catch { return {}; }
  })();

  const token = loginDetails?.token || "";
  const adminName = loginDetails?.name || "Super Admin";
  const adminId = loginDetails?.id || "";

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setError(null);
        const res = await axios.get("https://pmsbackend.pixelmindsolutions.com/api/dashboard", {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (res.data?.success) setData(res.data.data);
        else throw new Error("API returned success: false");
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError(err.message);
        setData({
          stats: [
            { link: '/projects', label: "Projects", count: 3, color: "#009788" },
            { link: '/projects', label: "Apps", count: 1, color: "#4CAF50" },
            { link: '/projects', label: "Websites", count: 2, color: "#FFC107" },
            { link: '/projects', label: "Marketing", count: 0, color: "#E91E63" },
            { link: '/staff', label: "Staff", count: 5, color: "#9C27B0" },
          ],
          projects: [
            { _id: "69afe130e0956f30b3068434", projectId: "pms111", projectName: "pms mobil apps 111", clientName: "vijay", status: "active", deadlineDate: "2026-06-10T00:00:00.000Z", daysRemaining: 84 },
            { _id: "69aaa1218d189942ba465b3c", projectId: "pms", projectName: "pms mobil apps", clientName: "vebdrj", status: "active", deadlineDate: "2026-03-06T00:00:00.000Z", daysRemaining: -12 },
            { _id: "69a97ea6b50875a648fdddbb", projectId: "001", projectName: "Jjj", clientName: "hhh", status: "active", deadlineDate: "2026-03-20T00:00:00.000Z", daysRemaining: 2 },
          ],
          deadlines: [
            { id: "69a97ea6b50875a648fdddbb", projectId: "001", name: "Jjj", clientName: "hhh", deadline: "2026-03-20T00:00:00.000Z", daysRemaining: 2 },
          ],
          counts: { totalProjects: 3, apps: 1, websites: 2, marketing: 0, staff: 5, upcomingDeadlines: 1 },
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [token]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-[3px] border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Loading dashboard…</p>
      </div>
    </div>
  );

  const { stats, projects, deadlines, counts } = data;
  const pieData = stats.filter((s) => s.label !== "Staff" && s.label !== "Projects");
  const maxPie = Math.max(...pieData.map((p) => p.count), 1);

  return (
    <div className="bg-slate-50 min-h-screen w-full">

      {/* ═══ HEADER ═══ */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-500 px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-teal-200 text-[10px] sm:text-xs uppercase tracking-widest font-semibold mb-0.5">
              {loginDetails.role} Panel
            </p>
            <h1 className="text-white text-xl sm:text-2xl lg:text-3xl font-extrabold leading-tight">
              Welcome back, {adminName} 👋
            </h1>
            <p className="text-teal-200 text-[10px] sm:text-xs mt-0.5 font-mono opacity-70 truncate">
              ID: {adminId}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {error && (
              <div className="hidden sm:flex bg-amber-400/20 border border-amber-300/40 rounded-xl px-3 py-2 items-center gap-2 text-amber-100 text-xs">
                <AlertTriangle size={12} /> Using cached data
              </div>
            )}
            {/* <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-2.5 sm:px-3 py-2 flex items-center gap-1.5 text-white text-[10px] sm:text-xs whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] flex-shrink-0" />
              <span className="hidden sm:inline">All systems operational</span>
              <span className="sm:hidden">Online</span>
            </div> */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white font-extrabold text-sm sm:text-base flex-shrink-0">
              {adminName.charAt(0)}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      <div className="max-w-screen-xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {stats.map((s) => <StatCard key={s.label} link={s.link} label={s.label} count={s.count} />)}
        </div>

        {/* ── CHARTS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <Card>
            <CardHead>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800">Growth Trend</p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Projects & staff over 6 months</p>
              </div>
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-semibold">↑ Active</span>
            </CardHead>
            <div className="p-3 sm:p-4">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gProj" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gStaff" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="projects" name="Projects" stroke="#0d9488" strokeWidth={2.5} fill="url(#gProj)" dot={{ fill: "#0d9488", r: 3, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="staff" name="Staff" stroke="#7c3aed" strokeWidth={2} fill="url(#gStaff)" dot={{ fill: "#7c3aed", r: 3, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHead>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800">Staff Activity</p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Active vs idle this week</p>
              </div>
            </CardHead>
            <div className="p-3 sm:p-4">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weekActivity} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="active" name="Active" fill="#0d9488" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="idle" name="Idle" fill="#e2e8f0" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* ══════════════════════════════════════════════════
            3-COLUMN ROW
            Col 1 → Project Types + Quick Stats  (stacked)
            Col 2 → Latest Projects
            Col 3 → Deadlines
        ══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-2 gap-3 sm:gap-4 items-start">

          {/* ── COL 1: Project Types + Quick Stats ── */}
          <div className="flex flex-col gap-3 sm:gap-4">

            {/* Project Types */}
            <Card className="p-4 sm:p-5">
              <p className="text-xs sm:text-sm font-bold text-slate-800 mb-4">Project Types</p>
              <div className="flex justify-center mb-4">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="count" stroke="none">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5">
                {pieData.map((c, i) => (
                  <div key={c.label} className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-slate-500 w-20 shrink-0">{c.label}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          background: PIE_COLORS[i % PIE_COLORS.length],
                          width: `${(c.count / maxPie) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-800 w-4 text-right shrink-0">{c.count}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="p-4 sm:p-5">
              <p className="text-xs sm:text-sm font-bold text-slate-800 mb-3">Quick Stats</p>
              {[
                { label: "Total Projects", val: counts.totalProjects, cls: "text-teal-600", bg: "bg-teal-50" },
                { label: "Upcoming Deadlines", val: counts.upcomingDeadlines, cls: "text-amber-500", bg: "bg-amber-50" },
                { label: "Staff Members", val: counts.staff, cls: "text-violet-600", bg: "bg-violet-50" },
                { label: "Marketing", val: counts.marketing, cls: "text-pink-600", bg: "bg-pink-50" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0 gap-2">
                  <span className="text-xs text-slate-500">{item.label}</span>
                  <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded-lg ${item.cls} ${item.bg}`}>
                    {item.val}
                  </span>
                </div>
              ))}
            </Card>
          </div>

          {/* ── COL 2: Latest Projects ── */}
          <Card className="flex flex-col min-w-0">
            <CardHead>
              <p className="text-xs sm:text-sm font-bold text-slate-800">📋 Latest Projects</p>
              <button className="bg-gradient-to-br from-teal-600 to-teal-700 hover:opacity-90 transition text-white text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl whitespace-nowrap">
                + New Project
              </button>
            </CardHead>

            {/* Mobile: card list */}
            <div className="block sm:hidden divide-y divide-slate-50">
              {projects.map((p) => {
                const uCls = urgencyClasses(p.daysRemaining);
                const sCls = statusClasses[p.status] || statusClasses.active;
                return (
                  <div key={p._id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 text-sm capitalize truncate">{p.projectName}</p>
                        <p className="text-[11px] text-teal-600 font-mono font-bold mt-0.5">{p.projectId}</p>
                      </div>
                      <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${sCls}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="capitalize">{p.clientName}</span>
                        <span className="text-slate-300">·</span>
                        <span>{fmtDate(p.deadlineDate)}</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${uCls}`}>
                        {p.daysRemaining < 0
                          ? <><AlertTriangle size={8} />{Math.abs(p.daysRemaining)}d overdue</>
                          : `${p.daysRemaining}d left`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    {["#", "ID", "Project", "Client", "Deadline", "Days", "Status"].map((h) => (
                      <th key={h} className="px-3 py-3 text-[10px] text-slate-400 uppercase tracking-wider font-semibold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p, i) => {
                    const uCls = urgencyClasses(p.daysRemaining);
                    const sCls = statusClasses[p.status] || statusClasses.active;
                    return (
                      <tr key={p._id} className="border-t border-slate-50 hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-3 text-slate-300 font-semibold text-xs">{i + 1}</td>
                        <td className="px-3 py-3 text-teal-600 font-bold text-[11px] font-mono">{p.projectId}</td>
                        <td className="px-3 py-3 font-semibold text-slate-800 text-xs capitalize">
                          <span className="block max-w-[120px] truncate">{p.projectName}</span>
                        </td>
                        <td className="px-3 py-3 text-slate-500 text-xs capitalize whitespace-nowrap">{p.clientName}</td>
                        <td className="px-3 py-3 text-slate-500 text-[11px] whitespace-nowrap">{fmtDate(p.deadlineDate)}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${uCls}`}>
                            {p.daysRemaining < 0
                              ? <><AlertTriangle size={8} />{Math.abs(p.daysRemaining)}d</>
                              : `${p.daysRemaining}d`}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${sCls}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-4 sm:px-5 py-3 border-t border-slate-50 flex justify-end mt-auto">
              <button className="text-teal-600 text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                View all <ChevronRight size={13} />
              </button>
            </div>
          </Card>

          {/* ── COL 3: Deadlines ── */}
          <Card className="flex flex-col md:col-span-2 xl:col-span-1">
            <CardHead>
              <p className="text-xs sm:text-sm font-bold text-slate-800">⏰ Deadlines</p>
              <Clock size={14} className="text-amber-400" />
            </CardHead>

            <div className="p-4 sm:p-5 flex-1">
              {deadlines.length === 0 ? (
                <div className="text-center text-slate-300 py-8">
                  <CalendarDays size={32} className="mx-auto mb-2" />
                  <p className="text-xs">No upcoming deadlines</p>
                </div>
              ) : (
                <div>
                  {deadlines.map((d) => {
                    const uCls = urgencyClasses(d.daysRemaining);
                    return (
                      <div key={d.id} className="flex justify-between items-start gap-3 py-3 border-b border-slate-50 last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 truncate capitalize">{d.name}</p>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 capitalize">
                            {d.clientName} · {fmtDate(d.deadline)}
                          </p>
                        </div>
                        <span className={`shrink-0 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 whitespace-nowrap ${uCls}`}>
                          {d.daysRemaining < 0
                            ? <><AlertTriangle size={8} />{Math.abs(d.daysRemaining)}d late</>
                            : `${d.daysRemaining}d`}
                        </span>
                      </div>
                    );
                  })}
                  <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    <p className="text-[11px] font-semibold text-emerald-600">
                      {counts.upcomingDeadlines} deadline{counts.upcomingDeadlines !== 1 ? "s" : ""} this week
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 sm:px-5 py-3 border-t border-slate-50 flex justify-end">
              <button className="text-teal-600 text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                View all <ChevronRight size={13} />
              </button>
            </div>
          </Card>
        </div>

        {/* ── QUICK LINKS (full width at bottom) ── */}
        <Card>
          <CardHead>
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-teal-600" />
              <p className="text-xs sm:text-sm font-bold text-slate-800">Quick Links</p>
            </div>
          </CardHead>
          <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_LINKS.map(({ label, icon: Icon, gradient, shadow, route }) => (
              <button
                key={label}
                onClick={() => (window.location.href = route)}
                className={`flex flex-col items-center justify-center gap-3 py-5 sm:py-6 px-3 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-md ${shadow} hover:scale-[1.03] hover:shadow-xl active:scale-95 transition-all duration-200 w-full`}
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Icon size={22} className="text-white" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-center leading-tight tracking-wide">{label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-300 tracking-widest uppercase pb-2">
          Admin Dashboard · {new Date().getFullYear()}
        </p>

      </div>
    </div>
  );
};

export default Dashboard;