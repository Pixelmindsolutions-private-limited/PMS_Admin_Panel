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
    MdArrowBack, MdPerson, MdRefresh, MdEdit, MdDelete,
    MdDownload,
} from "react-icons/md";
import {
    FaUserCheck, FaUserTimes, FaUmbrellaBeach, FaUsers,
} from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

ChartJS.register(
    CategoryScale, LinearScale, BarElement,
    ArcElement, Title, Tooltip, Legend
);

/* ──────────────────────────────────────────── */
/*  CONFIG                                      */
/* ──────────────────────────────────────────── */
const EMPLOYEE_COMPLETE_API = "https://pmsbackend.pixelmindsolutions.com/api/attendance/employee";
const ATTENDANCE_API = "https://pmsbackend.pixelmindsolutions.com/api/attendance";

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

const EmptyState = () => (
    <div className="py-16 flex flex-col items-center gap-3">
        <MdCalendarToday className="text-gray-200 text-5xl" />
        <p className="text-gray-400 font-semibold text-sm">No records for selected month</p>
    </div>
);

const Spinner = () => (
    <div className="py-14 flex justify-center">
        <div className="att-spin" />
    </div>
);

const AttTable = ({ records, showName, onEdit, onDelete }) => (
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
                    {(onEdit || onDelete) && (
                        <th className="py-3 px-3 sm:px-4 text-left text-xs font-semibold whitespace-nowrap">
                            Actions
                        </th>
                    )}
                </tr>
            </thead>
            <tbody>
                {records.map((rec, i) => {
                    const st = getStatus(rec.status);
                    return (
                        <tr
                            key={rec._id || i}
                            className="border-b border-gray-50 transition-colors hover:bg-teal-50/60"
                        >
                            <td className="py-3 px-3 sm:px-4 text-xs text-gray-400">{i + 1}</td>
                            <td className="py-3 px-3 sm:px-4">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold">
                                    {rec.staffId || rec.employeeId}
                                </span>
                            </td>
                            {showName && (
                                <td className="py-3 px-3 sm:px-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                                            <MdPerson className="text-teal-600 text-sm" />
                                        </div>
                                        <span className="font-semibold text-gray-800 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[160px]">
                                            {rec.name || rec.employeeName}
                                        </span>
                                    </div>
                                </td>
                            )}
                            <td className="py-3 px-3 sm:px-4 text-xs text-gray-600 whitespace-nowrap">
                                {rec.dateFormatted || fmtDate(rec.date)}
                            </td>
                            <td className="py-3 px-3 sm:px-4">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                                    {st.label}
                                </span>
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-xs text-gray-500 hidden sm:table-cell">
                                {rec.dayType ? DAYTYPE_LABEL[rec.dayType] || rec.dayType : "—"}
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-xs text-gray-500 hidden sm:table-cell">
                                {rec.hoursWorked != null ? `${rec.hoursWorked}h` : "—"}
                            </td>
                            {(onEdit || onDelete) && (
                                <td className="py-3 px-3 sm:px-4">
                                    <div className="flex items-center gap-2">
                                        {onEdit && (
                                            <>
                                                {(loginDetails?.role === "Admin" || access.includes("edit")) && (
                                                    <button
                                                        onClick={() => onEdit(rec)}
                                                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <MdEdit size={16} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {onDelete && (
                                            <>
                                                {(loginDetails?.role === "Admin" || access.includes("delete")) && (
                                                    <button
                                                        onClick={() => onDelete(rec)}
                                                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <MdDelete size={16} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            )}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

const AttCard = ({ rec, onEdit, onDelete }) => {
    const st = getStatus(rec.status);
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                        <MdPerson className="text-teal-600 text-lg" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-gray-800 text-sm truncate">{rec.name || rec.employeeName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{rec.dateFormatted || fmtDate(rec.date)}</p>
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
                        {rec.dayType ? DAYTYPE_LABEL[rec.dayType] || rec.dayType : "—"}
                    </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2.5">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Hours</p>
                    <p className="text-xs font-semibold text-gray-700 mt-0.5">
                        {rec.hoursWorked != null ? `${rec.hoursWorked}h` : "—"}
                    </p>
                </div>
            </div>
            {(onEdit || onDelete) && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
                    {onEdit && (
                        <>
                            {(loginDetails?.role === "Admin" || access.includes("edit")) && (
                                <button
                                    onClick={() => onEdit(rec)}
                                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-semibold"
                                >
                                    Edit
                                </button>
                            )}
                        </>
                    )}
                    {onDelete && (
                        <>
                            {(loginDetails?.role === "Admin" || access.includes("delete")) && (
                                <button
                                    onClick={() => onDelete(rec)}
                                    className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs font-semibold"
                                >
                                    Delete
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

/* ──────────────────────────────────────────── */
/*  MAIN SINGLE STAFF ATTENDANCE COMPONENT     */
/* ──────────────────────────────────────────── */
const SingleStaffAttendance = () => {
    const { staffId } = useParams();
    const navigate = useNavigate();

    /* ── state ── */
    const [employeeData, setEmployeeData] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterMonth, setFilterMonth] = useState(getCurrentMonth());
    const [viewMode, setViewMode] = useState("table");
    const [editModal, setEditModal] = useState(null);
    const [editData, setEditData] = useState({ status: '', dayType: '', hoursWorked: '' });
    const [exportLoading, setExportLoading] = useState(false);

    /* ── API Calls ── */
    const fetchEmployeeData = async (year, month, day) => {
        setLoading(true);
        try {
            let url = `${EMPLOYEE_COMPLETE_API}/${staffId}/complete`;
            const params = new URLSearchParams();
            if (year) params.append('year', year);
            if (month) params.append('month', month);
            if (day) params.append('day', day);
            if (params.toString()) url += `?${params.toString()}`;

            const res = await axios.get(url, { headers: authHeaders() });
            if (res.data.success) {
                setEmployeeData(res.data.data);
                setRecords(res.data.data.dailyRecords || []);
                return res.data.data;
            }
            return null;
        } catch (e) {
            console.error("Employee fetch error:", e);
            return null;
        }
        finally { setLoading(false); }
    };

    const updateAttendance = async (id, data) => {
        try {
            const res = await axios.put(
                `${ATTENDANCE_API}/${id}`,
                data,
                { headers: { ...authHeaders(), 'Content-Type': 'application/json' } }
            );
            if (res.data.success) {
                await fetchEmployeeData();
                return true;
            }
            return false;
        } catch (e) {
            console.error("Update error:", e);
            return false;
        }
    };

    const deleteAttendance = async (id) => {
        try {
            const res = await axios.delete(
                `${ATTENDANCE_API}/${id}`,
                { headers: authHeaders() }
            );
            if (res.data.success) {
                await fetchEmployeeData();
                return true;
            }
            return false;
        } catch (e) {
            console.error("Delete error:", e);
            return false;
        }
    };

    useEffect(() => {
        if (staffId) {
            fetchEmployeeData();
        }
    }, [staffId]);

    const filteredRecords = useMemo(() => {
        if (!filterMonth) return records;
        return records.filter((r) => {
            const dateStr = r.date?.slice(0, 7) || r.dateFormatted?.slice(0, 7);
            return dateStr === filterMonth;
        });
    }, [records, filterMonth]);

    const empSummary = useMemo(() => ({
        present: filteredRecords.filter((r) => r.status?.toLowerCase() === "present").length,
        absent: filteredRecords.filter((r) => r.status?.toLowerCase() === "absent").length,
        leave: filteredRecords.filter((r) => r.status?.toLowerCase() === "leave").length,
        hours: filteredRecords.reduce((s, r) => s + (r.hoursWorked || 0), 0),
    }), [filteredRecords]);

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

    const openEditModal = (rec) => {
        setEditModal(rec);
        setEditData({
            status: rec.status || '',
            dayType: rec.dayType || '',
            hoursWorked: rec.hoursWorked || ''
        });
    };

    const closeEditModal = () => {
        setEditModal(null);
        setEditData({ status: '', dayType: '', hoursWorked: '' });
    };

    const handleUpdate = async () => {
        const success = await updateAttendance(editModal._id, editData);
        if (success) {
            closeEditModal();
            alert('Attendance updated successfully!');
        } else {
            alert('Failed to update attendance');
        }
    };

    const handleDelete = async (rec) => {
        if (window.confirm(`Are you sure you want to delete this attendance record on ${rec.dateFormatted || fmtDate(rec.date)}?`)) {
            const success = await deleteAttendance(rec._id);
            if (success) {
                alert('Attendance deleted successfully!');
            } else {
                alert('Failed to delete attendance');
            }
        }
    };

    const handleBack = () => {
        navigate('/attendance');
    };

    /* ── Export Functions ── */
    const exportToExcel = () => {
        setExportLoading(true);
        try {
            const exportData = filteredRecords.map((rec, index) => ({
                'S.No': index + 1,
                'Employee ID': rec.staffId || rec.employeeId || '—',
                'Employee Name': employeeData?.employee?.employeeName || '—',
                'Date': rec.dateFormatted || fmtDate(rec.date),
                'Status': getStatus(rec.status).label,
                'Day Type': rec.dayType ? DAYTYPE_LABEL[rec.dayType] || rec.dayType : '—',
                'Hours Worked': rec.hoursWorked != null ? `${rec.hoursWorked}h` : '—'
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Attendance");

            // Auto-size columns
            const colWidths = [
                { wch: 6 },  // S.No
                { wch: 15 }, // Employee ID
                { wch: 20 }, // Employee Name
                { wch: 15 }, // Date
                { wch: 12 }, // Status
                { wch: 12 }, // Day Type
                { wch: 12 }  // Hours Worked
            ];
            ws['!cols'] = colWidths;

            XLSX.writeFile(wb, `Attendance_${employeeData?.employee?.employeeName || 'Employee'}_${filterMonth}.xlsx`);
            alert('Excel file downloaded successfully!');
        } catch (error) {
            console.error('Export to Excel error:', error);
            alert('Failed to export to Excel');
        } finally {
            setExportLoading(false);
        }
    };



    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="att-spin" />
                    <p className="text-gray-500 text-sm font-medium">Loading employee data…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <style>{CSS}</style>
            <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-5">

                {/* header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 fade-up">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={handleBack}
                            className="w-9 h-9 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-teal-600 hover:border-teal-200 transition-all shrink-0"
                        >
                            <MdArrowBack />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight truncate">
                                {employeeData?.employee?.employeeName || "Employee"}
                            </h1>
                            <p className="text-xs text-gray-400 mt-0.5">Individual attendance report</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <MonthPicker value={filterMonth} onChange={setFilterMonth} />

                        {/* Export Buttons */}
                        <div className="flex items-center gap-1">
                            {(loginDetails?.role === "Admin" || access.includes("export")) && (
                                <button
                                    onClick={exportToExcel}
                                    disabled={exportLoading || filteredRecords.length === 0}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filteredRecords.length === 0
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                        }`}
                                    title="Export to Excel"
                                >
                                    <MdDownload size={16} />
                                    Excel
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Employee Info */}
                {employeeData?.employee && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 fade-up">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-gray-400 font-semibold">Employee ID</p>
                                <p className="text-sm font-bold text-gray-800 mt-1">{employeeData.employee.employeeId}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold">Role</p>
                                <p className="text-sm font-bold text-gray-800 mt-1">{employeeData.employee.role || "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold">Department</p>
                                <p className="text-sm font-bold text-gray-800 mt-1">{employeeData.employee.department || "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold">Designation</p>
                                <p className="text-sm font-bold text-gray-800 mt-1">{employeeData.employee.designation || "—"}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* stat cards */}
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 fade-up">
                    <StatCard icon={<FaUsers />} label="Total Records" value={filteredRecords.length} scheme="teal" />
                    <StatCard icon={<FaUserCheck />} label="Present" value={empSummary.present} scheme="emerald" />
                    <StatCard icon={<FaUserTimes />} label="Absent" value={empSummary.absent} scheme="red" />
                    <StatCard icon={<FaUmbrellaBeach />} label="Leave" value={empSummary.leave} scheme="amber" />
                </div>

                {/* charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 fade-up">
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
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <p className="font-bold text-gray-800 text-sm">{filteredRecords.length} Records</p>
                            <p className="text-xs text-gray-400 mt-0.5">Filtered by {filterMonth || "all months"}</p>
                        </div>
                        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                    </div>

                    {loading ? <Spinner /> : filteredRecords.length === 0 ? <EmptyState /> : (
                        viewMode === "card" ? (
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredRecords.map((r) => (
                                    <AttCard
                                        key={r._id}
                                        rec={r}
                                        onEdit={openEditModal}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        ) : (
                            <AttTable
                                records={filteredRecords}
                                showName={false}
                                onEdit={openEditModal}
                                onDelete={handleDelete}
                            />
                        )
                    )}
                </div>

                {/* Edit Modal */}
                {editModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Attendance</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={editData.status}
                                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    >
                                        <option value="present">Present</option>
                                        <option value="absent">Absent</option>
                                        <option value="leave">Leave</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Day Type</label>
                                    <select
                                        value={editData.dayType}
                                        onChange={(e) => setEditData({ ...editData, dayType: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    >
                                        <option value="fullDay">Full Day</option>
                                        <option value="halfDay">Half Day</option>
                                        <option value="holiday">Holiday</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hours Worked</label>
                                    <input
                                        type="number"
                                        value={editData.hoursWorked}
                                        onChange={(e) => setEditData({ ...editData, hoursWorked: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        min="0"
                                        max="24"
                                        step="0.5"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                                <button
                                    onClick={closeEditModal}
                                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors order-2 sm:order-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors order-1 sm:order-2"
                                >
                                    Update
                                </button>
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

export default SingleStaffAttendance;