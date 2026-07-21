import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from "chart.js";
import {
  MdGridView, MdTableRows, MdCalendarToday,
  MdArrowBack, MdPerson, MdRefresh,
} from "react-icons/md";
import {
  FaUserCheck, FaUserTimes, FaUmbrellaBeach, FaUsers,
} from "react-icons/fa";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend
);

/* ──────────────────────────────────────────── */
/*  CONFIG                                      */
/* ──────────────────────────────────────────── */
const STATS_API = "https://pmsbackend.pixelmindsolutions.com/api/attendance/stats";
const ATTENDANCE_API = "https://pmsbackend.pixelmindsolutions.com/api/attendance";
const STAFF_API = "https://pmsbackend.pixelmindsolutions.com/api/attendance/staff";

const loginDetails = JSON.parse(sessionStorage.getItem("loginDetails"));

const AUTH_TOKEN = loginDetails?.token;

const permission = loginDetails?.modulePermissions?.find(
  (item) => item.component === "attendance"
);

const access = permission?.items?.[0]?.permission || [];

const authHeaders = () => ({ Authorization: `Bearer ${AUTH_TOKEN}` });

/* ──────────────────────────────────────────── */
/*  HELPERS                                     */
/* ──────────────────────────────────────────── */
const getCurrentMonth = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    })
    : "—";

const DAYTYPE_LABEL = {
  fullDay: "Full Day",
  halfDay: "Half Day",
  holiday: "Holiday",
};

const STATUS_META = {
  present: {
    bg: "bg-emerald-50", text: "text-emerald-700",
    border: "border-emerald-200", dot: "bg-emerald-500", label: "Present",
  },
  absent: {
    bg: "bg-red-50", text: "text-red-700",
    border: "border-red-200", dot: "bg-red-500", label: "Absent",
  },
  leave: {
    bg: "bg-amber-50", text: "text-amber-700",
    border: "border-amber-200", dot: "bg-amber-500", label: "Leave",
  },
};
const getStatus = (s) =>
  STATUS_META[s?.toLowerCase()] || {
    bg: "bg-gray-50", text: "text-gray-600",
    border: "border-gray-200", dot: "bg-gray-400",
    label: s || "—",
  };

const C = {
  present: "#10b981",
  absent: "#ef4444",
  leave: "#f59e0b",
};

/* ──────────────────────────────────────────── */
/*  SHARED SUB-COMPONENTS                       */
/* ──────────────────────────────────────────── */

const StatCard = ({ icon, label, value, scheme }) => {
  const S = {
    teal: {
      bg: "bg-teal-50",
      border: "border-teal-100",
      iconBg: "bg-teal-100",
      icon: "text-teal-600",
      value: "text-teal-700",
    },
    emerald: {
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      iconBg: "bg-emerald-100",
      icon: "text-emerald-600",
      value: "text-emerald-700",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-100",
      iconBg: "bg-red-100",
      icon: "text-red-600",
      value: "text-red-700",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-100",
      iconBg: "bg-amber-100",
      icon: "text-amber-600",
      value: "text-amber-700",
    },
  }[scheme];

  return (
    <div
      className={`
        ${S.bg} ${S.border}
        border rounded-2xl
        p-4 sm:p-5
        flex items-center gap-3 sm:gap-4
        min-h-[92px]
        shadow-sm hover:shadow-lg
        transition-all duration-300
        hover:-translate-y-0.5
      `}
    >
      <div
        className={`
          ${S.iconBg} ${S.icon}
          w-12 h-12 sm:w-14 sm:h-14
          rounded-xl
          flex items-center justify-center
          shrink-0
          text-xl sm:text-2xl
        `}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <h3
          className={`
            text-2xl sm:text-3xl
            font-bold leading-none
            ${S.value}
          `}
        >
          {value ?? 0}
        </h3>

        <p className="mt-1 text-xs sm:text-sm text-gray-500 font-medium truncate">
          {label}
        </p>
      </div>
    </div>
  );
};

/* view mode toggle */
const ViewToggle = ({ viewMode, setViewMode }) => (
  <div className="flex items-center bg-gray-100 rounded-xl p-1 shrink-0">
    {[
      ["table", <MdTableRows size={15} />, "Table"],
      ["card", <MdGridView size={15} />, "Cards"],
    ].map(([mode, icon, lbl]) => (
      <button
        key={mode}
        onClick={() => setViewMode(mode)}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === mode
          ? "bg-white text-teal-700 shadow-sm"
          : "text-gray-500 hover:text-teal-600"
          }`}
      >
        {icon}
        <span className="hidden xs:inline">{lbl}</span>
      </button>
    ))}
  </div>
);

/* month picker */
const MonthPicker = ({ value, onChange }) => (
  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
    <MdCalendarToday className="text-teal-600 shrink-0 text-base" />
    <input
      type="month"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm text-gray-700 outline-none bg-transparent cursor-pointer w-[130px]"
    />
  </div>
);

/* empty state */
const EmptyState = () => (
  <div className="py-16 flex flex-col items-center gap-3">
    <MdCalendarToday className="text-gray-200 text-5xl" />
    <p className="text-gray-400 font-semibold text-sm">No records for selected month</p>
  </div>
);

/* spinner */
const Spinner = () => (
  <div className="py-14 flex justify-center">
    <div className="att-spin" />
  </div>
);

/* attendance table */
const AttTable = ({ records, showName, onRowClick }) => (
  <div className="overflow-x-auto att-scroll">
    <table className="w-full" style={{ minWidth: 480 }}>
      <thead>
        <tr className="bg-gradient-to-r from-teal-700 to-teal-600 text-white">
          <th className="py-3 px-3 sm:px-4 text-left text-xs font-semibold w-8">#</th>
          <th className="py-3 px-3 sm:px-4 text-left text-xs font-semibold w-8">EmployeeId</th>
          {showName && (
            <th className="py-3 px-3 sm:px-4 text-left text-xs font-semibold whitespace-nowrap">
              Employee
            </th>
          )}
          <th className="py-3 px-3 sm:px-4 text-left text-xs font-semibold whitespace-nowrap">Date</th>
          <th className="py-3 px-3 sm:px-4 text-left text-xs font-semibold">Status</th>
          <th className="py-3 px-3 sm:px-4 text-left text-xs font-semibold hidden sm:table-cell whitespace-nowrap">
            Day Type
          </th>
          <th className="py-3 px-3 sm:px-4 text-left text-xs font-semibold hidden sm:table-cell">
            Hours
          </th>
        </tr>
      </thead>
      <tbody>
        {records.map((rec, i) => {
          const st = getStatus(rec.status);
          return (
            <tr
              key={rec._id || i}
              onClick={() => onRowClick?.(rec)}
              className={`border-b border-gray-50 transition-colors ${onRowClick
                ? "cursor-pointer hover:bg-teal-50/60"
                : "hover:bg-gray-50/50"
                }`}
            >
              <td className="py-3 px-3 sm:px-4 text-xs text-gray-400">{i + 1}</td>
              <td className="py-3 px-3 sm:px-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold">
                  {rec.staffId}
                </span>
              </td>
              {showName && (
                <td className="py-3 px-3 sm:px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                      <MdPerson className="text-teal-600 text-sm" />
                    </div>
                    <span className="font-semibold text-gray-800 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[160px]">
                      {rec.name}
                    </span>
                  </div>
                </td>
              )}
              <td className="py-3 px-3 sm:px-4 text-xs text-gray-600 whitespace-nowrap">
                {fmtDate(rec.date)}
              </td>
              <td className="py-3 px-3 sm:px-4">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                  {st.label}
                </span>
              </td>
              <td className="py-3 px-3 sm:px-4 text-xs text-gray-500 hidden sm:table-cell">
                {DAYTYPE_LABEL[rec.dayType] || rec.dayType || "—"}
              </td>
              <td className="py-3 px-3 sm:px-4 text-xs text-gray-500 hidden sm:table-cell">
                {rec.hoursWorked != null ? `${rec.hoursWorked}h` : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

/* attendance card */
const AttCard = ({ rec }) => {
  const st = getStatus(rec.status);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
            <MdPerson className="text-teal-600 text-lg" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-800 text-sm truncate">{rec.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{fmtDate(rec.date)}</p>
          </div>
        </div>
        <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
          {st.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Day Type</p>
          <p className="text-xs font-semibold text-gray-700 mt-0.5">
            {DAYTYPE_LABEL[rec.dayType] || rec.dayType || "—"}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Hours</p>
          <p className="text-xs font-semibold text-gray-700 mt-0.5">
            {rec.hoursWorked != null ? `${rec.hoursWorked}h` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────── */
/*  MAIN COMPONENT                              */
/* ──────────────────────────────────────────── */
const ShowAttendance = () => {
  /* ── state ── */
  const [stats, setStats] = useState(null);   // from /stats
  const [records, setRecords] = useState([]);     // from /attendance
  const [statsLoading, setStatsLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(true);

  const [filterMonth, setFilterMonth] = useState(getCurrentMonth());
  const [viewMode, setViewMode] = useState("table");

  /* employee detail */
  const [selEmp, setSelEmp] = useState(null); // { _id, name }
  const [empRecs, setEmpRecs] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empViewMode, setEmpViewMode] = useState("table");

  /* ── FETCH STATS (for cards + charts) ── */
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await axios.get(STATS_API, { headers: authHeaders() });
      if (res.data.success) setStats(res.data.data);
    } catch (e) { console.error("Stats error:", e); }
    finally { setStatsLoading(false); }
  };

  /* ── FETCH ATTENDANCE (for table + cards) ── */
  const fetchRecords = async () => {
    setRecLoading(true);
    try {
      const res = await axios.get(ATTENDANCE_API, { headers: authHeaders() });
      if (res.data.success) setRecords(res.data.data || []);
    } catch (e) { console.error("Attendance error:", e); }
    finally { setRecLoading(false); }
  };

  useEffect(() => {
    fetchStats();
    fetchRecords();
  }, []);

  /* ── filter attendance records by month ── */
  const filteredRecords = useMemo(() => {
    if (!filterMonth) return records;
    return records.filter((r) => r.date?.slice(0, 7) === filterMonth);
  }, [records, filterMonth]);

  /* ── employee detail fetch ── */
  const openEmployee = async (staff) => {
    setSelEmp(staff);
    setEmpLoading(true);
    try {
      const res = await axios.get(`${STAFF_API}/${staff._id}`, { headers: authHeaders() });
      if (res.data.success) setEmpRecs(res.data.data || []);
    } catch (e) { console.error("Emp fetch error:", e); }
    finally { setEmpLoading(false); }
  };

  const filteredEmpRecs = useMemo(() => {
    if (!filterMonth) return empRecs;
    return empRecs.filter((r) => r.date?.slice(0, 7) === filterMonth);
  }, [empRecs, filterMonth]);

  /* ── derived stats for employee detail ── */
  const empSummary = useMemo(() => ({
    present: filteredEmpRecs.filter((r) => r.status?.toLowerCase() === "present").length,
    absent: filteredEmpRecs.filter((r) => r.status?.toLowerCase() === "absent").length,
    leave: filteredEmpRecs.filter((r) => r.status?.toLowerCase() === "leave").length,
    hours: filteredEmpRecs.reduce((s, r) => s + (r.hoursWorked || 0), 0),
  }), [filteredEmpRecs]);

  /* ── chart data ── */
  const overall = stats?.overall || {};
  const byStaff = stats?.byStaff || [];

  const staffBarData = {
    labels: byStaff.map((s) => s.name.trim()),
    datasets: [
      {
        label: "Present",
        data: byStaff.map((s) => s.present),
        backgroundColor: C.present,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: "Absent",
        data: byStaff.map((s) => s.absent),
        backgroundColor: C.absent,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: "Leave",
        data: byStaff.map((s) => s.leave),
        backgroundColor: C.leave,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const overallDoughnut = {
    labels: ["Present", "Absent", "Leave"],
    datasets: [{
      data: [overall.present || 0, overall.absent || 0, overall.leave || 0],
      backgroundColor: [C.present, C.absent, C.leave],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  /* employee bar */
  const empBarData = {
    labels: ["Present", "Absent", "Leave"],
    datasets: [{
      label: "Days",
      data: [empSummary.present, empSummary.absent, empSummary.leave],
      backgroundColor: [C.present, C.absent, C.leave],
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const empDoughnut = {
    labels: ["Present", "Absent", "Leave"],
    datasets: [{
      data: [empSummary.present, empSummary.absent, empSummary.leave],
      backgroundColor: [C.present, C.absent, C.leave],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const barOpts = (stacked = false) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { padding: 16, font: { size: 11 }, usePointStyle: true, pointStyleWidth: 8 },
      },
    },
    scales: {
      x: { stacked, grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { stacked, grid: { color: "#f1f5f9" }, ticks: { stepSize: 1, font: { size: 10 } } },
    },
  });

  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { padding: 14, font: { size: 11 }, usePointStyle: true, pointStyleWidth: 8 },
      },
    },
  };

  /* ── full-page loading ── */
  if (statsLoading && recLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <style>{CSS}</style>
        <div className="flex flex-col items-center gap-3">
          <div className="att-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading attendance…</p>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════
     EMPLOYEE DETAIL VIEW
  ════════════════════════════════════════════════ */
  if (selEmp) {
    return (
      <div className="min-h-screen bg-slate-50">
        <style>{CSS}</style>
        <div className="max-w-6xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-5">

          {/* header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 fade-up">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => { setSelEmp(null); setEmpRecs([]); }}
                className="w-9 h-9 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-teal-600 hover:border-teal-200 transition-all shrink-0"
              >
                <MdArrowBack />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight truncate">
                  {selEmp.name}
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">Individual attendance report</p>
              </div>
            </div>
            <MonthPicker value={filterMonth} onChange={setFilterMonth} />
          </div>

          {/* stat cards — derived from filtered emp records */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 fade-up">
            <StatCard icon={<FaUsers />} label="Total Records" value={filteredEmpRecs.length} scheme="teal" />
            <StatCard icon={<FaUserCheck />} label="Present" value={empSummary.present} scheme="emerald" />
            <StatCard icon={<FaUserTimes />} label="Absent" value={empSummary.absent} scheme="red" />
            <StatCard icon={<FaUmbrellaBeach />} label="Leave" value={empSummary.leave} scheme="amber" />
          </div>

          {/* charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 fade-up">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <p className="font-bold text-gray-800 text-sm mb-1">Attendance Breakdown</p>
              <p className="text-xs text-gray-400 mb-4">{empSummary.hours}h total worked</p>
              <div style={{ height: 230 }}>
                <Bar data={empBarData} options={barOpts(false)} />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col">
              <p className="font-bold text-gray-800 text-sm mb-4">Distribution</p>
              <div className="flex-1 flex items-center justify-center" style={{ minHeight: 210 }}>
                <div style={{ height: 210, width: "100%", maxWidth: 220 }}>
                  <Doughnut data={empDoughnut} options={doughnutOpts} />
                </div>
              </div>
            </div>
          </div>

          {/* records panel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden fade-up">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-50 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-bold text-gray-800 text-sm">{filteredEmpRecs.length} Records</p>
                <p className="text-xs text-gray-400 mt-0.5">Filtered by {filterMonth || "all months"}</p>
              </div>
              <ViewToggle viewMode={empViewMode} setViewMode={setEmpViewMode} />
            </div>

            {empLoading ? <Spinner /> : filteredEmpRecs.length === 0 ? <EmptyState /> : (
              empViewMode === "card" ? (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEmpRecs.map((r) => <AttCard key={r._id} rec={r} />)}
                </div>
              ) : (
                <AttTable records={filteredEmpRecs} showName={false} />
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════
     MAIN DASHBOARD
  ════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-slate-50">
      <style>{CSS}</style>
      <div className="max-w-6xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-5">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 fade-up">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight">
              Attendance Dashboard
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Monitor employee attendance effortlessly
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <MonthPicker value={filterMonth} onChange={setFilterMonth} />
            <button
              onClick={() => { fetchStats(); fetchRecords(); }}
              className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl shadow-sm text-gray-500 hover:text-teal-600 hover:border-teal-200 transition-all"
              title="Refresh"
            >
              <MdRefresh className="text-lg" />
            </button>
          </div>
        </div>

        {/* ════ SECTION 1 — STATS API (/attendance/stats) ════ */}

        {/* ── Overall Stat Cards ── */}
        {!statsLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 fade-up">
            <StatCard icon={<FaUsers />} label="Total Records" value={overall.total} scheme="teal" />
            <StatCard icon={<FaUserCheck />} label="Present" value={overall.present} scheme="emerald" />
            <StatCard icon={<FaUserTimes />} label="Absent" value={overall.absent} scheme="red" />
            <StatCard icon={<FaUmbrellaBeach />} label="Leave" value={overall.leave} scheme="amber" />
          </div>
        )}

        {/* ── Charts (from stats API) ── */}
        {!statsLoading && byStaff.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-up">

            {/* Bar — staff breakdown */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <p className="font-bold text-gray-800 text-sm mb-1">Staff Attendance Breakdown</p>
              <p className="text-xs text-gray-400 mb-4">Per-employee present / absent / leave</p>
              <div style={{ height: 250 }}>
                <Bar data={staffBarData} options={barOpts(false)} />
              </div>
            </div>

            {/* Doughnut — overall split */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col">
              <p className="font-bold text-gray-800 text-sm mb-1">Overall Split</p>
              <p className="text-xs text-gray-400 mb-4">All staff combined</p>
              <div className="flex-1 flex items-center justify-center" style={{ minHeight: 210 }}>
                <div style={{ height: 210, width: "100%", maxWidth: 210 }}>
                  <Doughnut data={overallDoughnut} options={doughnutOpts} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Staff Summary Cards (from stats API — byStaff) ── */}
        {!statsLoading && byStaff.length > 0 && (
          <div className="fade-up">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Staff Summary
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {byStaff.map((s) => (
                <button
                  key={s._id}
                  onClick={() => openEmployee(s)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm
                    hover:shadow-md hover:border-teal-200 hover:-translate-y-0.5
                    transition-all p-4 text-left w-full group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0 group-hover:bg-teal-200 transition-colors">
                      <MdPerson className="text-teal-600 text-xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-800 text-sm truncate">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.total} record{s.total !== 1 ? "s" : ""}</p>
                    </div>
                    {(loginDetails?.role === "Admin" || access.includes("view")) && (
                      <span className="text-xs text-teal-500 group-hover:text-teal-700 font-semibold whitespace-nowrap">
                        View →
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: s.present, l: "Present", c: "bg-emerald-50 text-emerald-700" },
                      { v: s.absent, l: "Absent", c: "bg-red-50    text-red-700" },
                      { v: s.leave, l: "Leave", c: "bg-amber-50  text-amber-700" },
                    ].map(({ v, l, c }) => (
                      <div key={l} className={`rounded-xl px-2 py-2 text-center ${c}`}>
                        <p className="text-base font-bold leading-tight">{v}</p>
                        <p className="text-[9px] font-semibold opacity-70 mt-0.5">{l}</p>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ════ SECTION 2 — ATTENDANCE API (/attendance) — Table & Cards ════ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden fade-up">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-50 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-bold text-gray-800 text-sm">Attendance Records</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {filteredRecords.length} entries · {filterMonth || "all months"}
              </p>
            </div>
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>

          {recLoading ? (
            <Spinner />
          ) : filteredRecords.length === 0 ? (
            <EmptyState />
          ) : viewMode === "card" ? (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRecords.map((r) => <AttCard key={r._id} rec={r} />)}
            </div>
          ) : (
            <AttTable
              records={filteredRecords}
              showName
              onRowClick={(rec) =>
                openEmployee({ _id: rec.staffId, name: rec.name })
              }
            />
          )}
        </div>

      </div>
    </div>
  );
};

/* ── global CSS ── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  *, *::before, *::after { font-family:'Inter',-apple-system,sans-serif; box-sizing:border-box; }
  @keyframes spin  { 0%{transform:rotate(0deg)}   100%{transform:rotate(360deg)} }
  @keyframes fadeUp{ from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .fade-up { animation: fadeUp .35s ease forwards; }
  .att-spin {
    width:42px; height:42px;
    border:3px solid #e0f2f1;
    border-top:3px solid #0d9488;
    border-radius:50%;
    animation:spin .8s linear infinite;
  }
  .att-scroll::-webkit-scrollbar { height:4px; }
  .att-scroll::-webkit-scrollbar-thumb { background:#99f6e4; border-radius:4px; }
  @media(max-width:400px){ .xs\\:inline{ display:inline!important } }
`;

export default ShowAttendance;