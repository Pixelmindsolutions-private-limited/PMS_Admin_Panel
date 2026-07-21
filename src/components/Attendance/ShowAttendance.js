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
  MdPerson, MdRefresh, MdEdit, MdDelete,
} from "react-icons/md";
import {
  FaUserCheck, FaUserTimes, FaUmbrellaBeach, FaUsers,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend
);

/* ──────────────────────────────────────────── */
/*  CONFIG                                      */
/* ──────────────────────────────────────────── */
const STATS_API = "https://pmsbackend.pixelmindsolutions.com/api/attendance/stats";

const loginDetails = JSON.parse(sessionStorage.getItem("loginDetails"));

const AUTH_TOKEN = loginDetails?.token;

const permission = loginDetails?.modulePermissions?.find(
  (item) => item.component === "clients"
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
        <h3 className={`text-2xl sm:text-3xl font-bold leading-none ${S.value}`}>
          {value ?? 0}
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-gray-500 font-medium truncate">
          {label}
        </p>
      </div>
    </div>
  );
};

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

const Spinner = () => (
  <div className="py-14 flex justify-center">
    <div className="att-spin" />
  </div>
);

/* ──────────────────────────────────────────── */
/*  MAIN ALL STAFF ATTENDANCE COMPONENT         */
/* ──────────────────────────────────────────── */
const AllStaffAttendance = () => {
  /* ── state ── */
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(getCurrentMonth());

  const navigate = useNavigate();

  /* ── API Calls ── */
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await axios.get(STATS_API, { headers: authHeaders() });
      if (res.data.success) setStats(res.data.data);
    } catch (e) { console.error("Stats error:", e); }
    finally { setStatsLoading(false); }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onStaffSelect = (s) => {
    navigate(`/attendance/${s.staffId}`);
  };

  const overall = stats?.overall || {};
  const byStaff = stats?.byStaff || [];

  const staffBarData = {
    labels: byStaff.map((s) => s.name?.trim() || "Unknown"),
    datasets: [
      {
        label: "Present",
        data: byStaff.map((s) => s.present || 0),
        backgroundColor: C.present,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: "Absent",
        data: byStaff.map((s) => s.absent || 0),
        backgroundColor: C.absent,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: "Leave",
        data: byStaff.map((s) => s.leave || 0),
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

  const barOpts = (stacked = false) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 16,
          font: { size: 11 },
          usePointStyle: true,
          pointStyleWidth: 8
        },
      },
    },
    scales: {
      x: {
        stacked,
        grid: { display: false },
        ticks: { font: { size: 10 } }
      },
      y: {
        stacked,
        grid: { color: "#f1f5f9" },
        ticks: { stepSize: 1, font: { size: 10 } }
      },
    },
  });

  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 14,
          font: { size: 11 },
          usePointStyle: true,
          pointStyleWidth: 8
        },
      },
    },
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="att-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading attendance…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{CSS}</style>
      <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-5">

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
              onClick={() => { fetchStats(); }}
              className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl shadow-sm text-gray-500 hover:text-teal-600 hover:border-teal-200 transition-all"
              title="Refresh"
            >
              <MdRefresh className="text-lg" />
            </button>
          </div>
        </div>

        {/* ── Overall Stat Cards ── */}
        {!statsLoading && (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 fade-up">
            <StatCard icon={<FaUsers />} label="Total Staff" value={overall.totalStaff || 0} scheme="teal" />
            <StatCard icon={<FaUserCheck />} label="Present" value={overall.present || 0} scheme="emerald" />
            <StatCard icon={<FaUserTimes />} label="Absent" value={overall.absent || 0} scheme="red" />
            <StatCard icon={<FaUmbrellaBeach />} label="Leave" value={overall.leave || 0} scheme="amber" />
          </div>
        )}

        {/* ── Charts ── */}
        {!statsLoading && byStaff.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 fade-up">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <p className="font-bold text-gray-800 text-sm mb-1">Staff Attendance Breakdown</p>
              <p className="text-xs text-gray-400 mb-4">Per-employee present / absent / leave</p>
              <div style={{ height: 250 }}>
                <Bar data={staffBarData} options={barOpts(false)} />
              </div>
            </div>
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

        {/* ── Staff Summary Table ── */}
        {!statsLoading && byStaff.length > 0 && (
          <div className="fade-up">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Staff Summary
              </p>
              <span className="text-xs text-gray-400">
                Total: {byStaff.length} staff members
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-teal-700 to-teal-600 text-white">
                      <th className="py-3 px-4 text-left text-xs font-semibold">#</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold">Employee ID</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold">Name</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold">Present</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold">Absent</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold">Leave</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold">Total</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold">Hours</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byStaff.map((s, index) => (
                      <tr
                        key={s.staffId || s._id}
                        className="border-b border-gray-50 hover:bg-teal-50/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-xs text-gray-400">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold">
                            {s.staffId || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                              <MdPerson className="text-teal-600 text-sm" />
                            </div>
                            <span className="font-semibold text-gray-800 text-sm">
                              {s.name || "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {s.present || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {s.absent || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {s.leave || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                            {s.total || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                            {s.totalHours || 0}h
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => onStaffSelect(s)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors text-xs font-semibold"
                          >
                            View
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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

export default AllStaffAttendance;