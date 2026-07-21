import React, { useState, useEffect } from "react";
import axios from "axios";
import { Users, Calendar, Clock } from "lucide-react";

const inputClass =
  "w-full h-11 rounded-xl border border-slate-300 bg-white/70 backdrop-blur-md px-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 shadow-sm disabled:bg-slate-100 disabled:cursor-not-allowed";

const AddAttendance = () => {
  const [attendance, setAttendance] = useState({
    staffId: "",
    date: "",
    status: "present",
    dayType: "fullDay",
    workedHours: "",
  });

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* ================= FETCH STAFF ================= */

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const loginDetails = JSON.parse(
          sessionStorage.getItem("loginDetails")
        );
        const AUTH_TOKEN = loginDetails?.token;

        if (!AUTH_TOKEN) {
          alert("Session expired. Please login again.");
          return;
        }

        const res = await axios.get(
          "https://pmsbackend.pixelmindsolutions.com/api/attendance/staff-options",
          {
            headers: {
              Authorization: `Bearer ${AUTH_TOKEN}`,
            },
          }
        );

        if (res.data.success) {
          setStaffList(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching staff:", error.response || error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  /* ================= HANDLERS ================= */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAttendance((prev) => ({ ...prev, [name]: value }));
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!attendance.staffId) {
      alert("Please select a staff member.");
      return;
    }

    const selectedStaff = staffList.find(
      (staff) => staff.employeeId === attendance.staffId
    );

    if (!selectedStaff) {
      alert("Invalid staff selected.");
      return;
    }

    const loginDetails = JSON.parse(
      sessionStorage.getItem("loginDetails")
    );
    const AUTH_TOKEN = loginDetails?.token;

    const payload = {
      staffId: selectedStaff.employeeId,
      name: selectedStaff.employeeName,
      date: attendance.date,
      status: attendance.status,
      dayType:
        attendance.status === "present"
          ? attendance.dayType
          : undefined,
      hoursWorked:
        attendance.status === "present" &&
          (attendance.dayType === "halfDay" ||
            attendance.dayType === "extraHours")
          ? attendance.workedHours
          : undefined,
    };

    try {
      setSubmitting(true);

      const res = await axios.post(
        "https://pmsbackend.pixelmindsolutions.com/api/attendance/",
        payload,
        {
          headers: {
            Authorization: `Bearer ${AUTH_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.success) {
        alert("Attendance submitted successfully!");

        setAttendance({
          staffId: "",
          date: "",
          status: "present",
          dayType: "fullDay",
          workedHours: "",
        });
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Failed to submit attendance."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* HEADER */}

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Add Attendance
          </h1>
          <p className="text-slate-500">
            Record daily staff attendance quickly and accurately.
          </p>
        </div>

        {/* CARD */}

        <form
          onSubmit={handleSubmit}
          className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-teal-200/40 
  shadow-[0_10px_40px_rgba(0,128,128,0.25),0_0_30px_rgba(20,184,166,0.15)]
  hover:shadow-[0_20px_60px_rgba(0,128,128,0.35),0_0_45px_rgba(20,184,166,0.25)]
  transition-all duration-500 space-y-6 relative overflow-hidden"
        >

          <div className="absolute inset-0 rounded-3xl pointer-events-none 
bg-gradient-to-r from-transparent via-teal-300/10 to-transparent 
animate-pulse"></div>
          {loading ? (
            <p className="text-slate-500">Loading staff...</p>
          ) : (
            <>
              {/* STAFF */}

              <Field label="Staff Member" icon={<Users size={16} />}>
                <select
                  name="staffId"
                  value={attendance.staffId}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">Select Staff</option>

                  {staffList.map((staff) => (
                    <option key={staff.employeeId} value={staff.employeeId}>
                      {staff.employeeName} — {staff.role}
                    </option>
                  ))}
                </select>
              </Field>

              {/* DATE */}

              <Field label="Date" icon={<Calendar size={16} />}>
                <input
                  type="date"
                  name="date"
                  value={attendance.date}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </Field>

              {/* STATUS */}

              <Field label="Status">
                <select
                  name="status"
                  value={attendance.status}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Leave</option>
                </select>
              </Field>

              {/* CONDITIONAL */}

              {attendance.status === "present" && (
                <div className="space-y-6">
                  <Field label="Day Type">
                    <select
                      name="dayType"
                      value={attendance.dayType}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="fullDay">Full Day</option>
                      <option value="halfDay">Half Day</option>
                      <option value="extraHours">
                        Extra Hours
                      </option>
                    </select>
                  </Field>

                  {(attendance.dayType === "halfDay" ||
                    attendance.dayType === "extraHours") && (
                      <Field
                        label={
                          attendance.dayType === "halfDay"
                            ? "Worked Hours (max 4)"
                            : "Extra Hours"
                        }
                        icon={<Clock size={16} />}
                      >
                        <input
                          type="number"
                          name="workedHours"
                          value={attendance.workedHours}
                          onChange={handleChange}
                          placeholder="Enter hours"
                          min="1"
                          max={
                            attendance.dayType === "halfDay"
                              ? "4"
                              : undefined
                          }
                          required
                          className={inputClass}
                        />
                      </Field>
                    )}
                </div>
              )}

              {/* BUTTON */}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold shadow-lg shadow-teal-500/30 transition hover:shadow-teal-500/50 hover:scale-[1.02] disabled:bg-slate-400"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Attendance"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

/* ================= FIELD ================= */

const Field = ({ label, icon, children }) => (
  <div>
    <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-slate-700">
      {icon}
      {label}
    </label>
    {children}
  </div>
);

export default AddAttendance;