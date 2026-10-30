// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { ClipboardPlus, Plus, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
// import { getAuthHeaders, API_BASE_URL } from "../../utils/Auth";

// const API = "https://pms-crm-backend.onrender.com/api" || "https://pms-crm-backend.onrender.com/api";


// const AddWorksheet = () => {
//   const navigate = useNavigate();
//   const [staffOptions, setStaffOptions] = useState([]);
//   const [projectOptions, setProjectOptions] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [fetchingOptions, setFetchingOptions] = useState(true);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
  
//   const [formData, setFormData] = useState({
//     empId: "",
//     employName: "",
//     sheet: "frontend",
//     projects: [{ projectName: "", startDate: "", endDate: "", comment: "", hours: "", shift: "morning" }],
//   });

//   /* ---------------- FETCH OPTIONS ---------------- */
//   // useEffect(() => {
//   //   const fetchOptions = async () => {
//   //     try {
//   //       const [staffRes, projectRes] = await Promise.all([
//   //         fetch(`${API}/staff/options`, { headers: getAuthHeaders() }),
//   //         fetch(`${API}/projects/options`, { headers: getAuthHeaders() }),
//   //       ]);

//   //       const staffData = await staffRes.json();
//   //       const projectData = await projectRes.json();

//   //       if (staffData.success) setStaffOptions(staffData.data);
//   //       if (projectData.success) setProjectOptions(projectData.data);
//   //     } catch (err) {
//   //       console.error("Fetch options error:", err);
//   //       setError("Failed to load dropdown data. Please check your connection.");
//   //     } finally {
//   //       setFetchingOptions(false);
//   //     }
//   //   };
//   //   fetchOptions();
//   // }, []);

//   useEffect(() => {
//     const fetchOptions = async () => {
//       try {
//         console.log("📡 Fetching staff options from:", `${API}/staff/options`);
//         console.log("📡 Fetching project options from:", `${API}/worksheets/project-options`);
        
//         const [staffRes, projectRes] = await Promise.all([
//           fetch(`${API}/staff/options`, { 
//             method: "GET",
//             headers: getAuthHeaders() 
//           }),
//           fetch(`${API}/worksheets/project-options`, { 
//             method: "GET",
//             headers: getAuthHeaders() 
//           }),
//         ]);

//         console.log("📡 Staff response status:", staffRes.status);
//         console.log("📡 Project response status:", projectRes.status);

//         const staffData = await staffRes.json();
//         const projectData = await projectRes.json();

//         console.log("📡 Staff data:", staffData);
//         console.log("📡 Project data:", projectData);

//         if (staffData.success) {
//           // Format staff data for dropdown
//           const formattedStaff = staffData.data.map(staff => ({
//             id: staff.employeeId,
//             staffId: staff.employeeId,
//             staffName: staff.employeeName
//           }));
//           setStaffOptions(formattedStaff);
//         }
        
//         if (projectData.success) {
//           setProjectOptions(projectData.data);
//         }
//       } catch (err) {
//         console.error("❌ Fetch options error:", err);
//         setError("Failed to load dropdown data. Please check your connection.");
//       } finally {
//         setFetchingOptions(false);
//       }
//     };
    
//     fetchOptions();
//   }, []);


//   /* ---------------- HANDLERS ---------------- */
//   const handleMainChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

//   const handleEmployeeSelect = (e) => {
//     const selectedId = e.target.value;
//     const selected = staffOptions.find((s) => String(s.id) === String(selectedId));
//     setFormData((prev) => ({
//       ...prev,
//       empId: selected?.staffId || "",
//       employName: selected?.staffName || "",
//     }));
//   };

//   const handleProjectChange = (i, field, value) => {
//     const updated = [...formData.projects];
//     updated[i][field] = value;
//     setFormData({ ...formData, projects: updated });
//   };

//   const addProject = () => {
//     setFormData({
//       ...formData,
//       projects: [...formData.projects, { projectName: "", startDate: "", endDate: "", comment: "", hours: "", shift: "morning" }],
//     });
//   };

//   const removeProject = (i) => {
//     if (formData.projects.length === 1) return;
//     setFormData({ ...formData, projects: formData.projects.filter((_, x) => x !== i) });
//   };

//   /* ---------------- VALIDATION ---------------- */
//   const validateForm = () => {
//     if (!formData.empId) {
//       setError("Please select an employee");
//       return false;
//     }
    
//     if (formData.projects.some((p) => !p.projectName || !p.startDate || !p.endDate || !p.hours)) {
//       setError("Please fill all required project fields (Project Name, Start Date, End Date, Hours)");
//       return false;
//     }
    
//     // Validate dates
//     for (const project of formData.projects) {
//       if (project.startDate && project.endDate && new Date(project.endDate) < new Date(project.startDate)) {
//         setError(`End date must be after start date for project: ${project.projectName}`);
//         return false;
//       }
//     }
    
//     return true;
//   };

//   /* ---------------- SUBMIT ---------------- */
//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!validateForm()) return;
    
//     setLoading(true);
//     setError("");
//     setSuccess("");
    
//     try {
//       // Prepare payload exactly as backend expects
//       const payload = {
//         empId: formData.empId,
//         employName: formData.employName,
//         sheet: formData.sheet,
//         projects: formData.projects.map(project => ({
//           projectName: project.projectName,
//           startDate: project.startDate,
//           endDate: project.endDate,
//           hours: parseInt(project.hours, 10),
//           shift: project.shift,
//           comment: project.comment || ""
//         }))
//       };
      
//       console.log("📤 Sending payload:", payload);
      
//       const response = await fetch(`${API}/worksheets/`, {
//         method: "POST",
//         headers: getAuthHeaders(),
//         body: JSON.stringify(payload),
//       });
      
//       const data = await response.json();
//       console.log("📥 Response:", data);
      
//       if (data.success) {
//         setSuccess("✨ Worksheet created successfully!");
//         setTimeout(() => navigate("/assigned-works"), 1500);
//       } else {
//         setError(data.message || data.errors?.join(", ") || "Failed to create worksheet");
//       }
//     } catch (err) {
//       console.error("Submit error:", err);
//       setError("Network error. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ---------------- LOADING STATE ---------------- */
//   if (fetchingOptions) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex items-center justify-center p-4">
//         <div className="text-center space-y-4 animate-pulse">
//           <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-100/60" />
//           <div className="h-4 w-48 mx-auto rounded bg-slate-200" />
//           <div className="h-3 w-64 mx-auto rounded bg-slate-100" />
//         </div>
//       </div>
//     );
//   }

//   /* ================================================= */
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 py-6 md:py-10 px-4 md:px-6">
//       <div className="max-w-5xl mx-auto">
        
//         {/* HEADER - Premium Glass Effect */}
//         <div className="mb-8 md:mb-10">
//           <div className="flex items-center gap-4 p-4 md:p-6 bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-lg shadow-teal-500/5">
//             <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25">
//               <ClipboardPlus className="text-white" size={24} />
//             </div>
//             <div className="flex-1 min-w-0">
//               <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
//                 Create Worksheet
//               </h1>
//               <p className="text-slate-500 text-sm md:text-base mt-1">
//                 Assign employees to projects with precision
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* ALERTS - Animated */}
//         {error && (
//           <div className="mb-6 p-4 rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 flex items-start gap-3 animate-in slide-in-from-top-2">
//             <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
//             <span className="text-sm">{error}</span>
//           </div>
//         )}
//         {success && (
//           <div className="mb-6 p-4 rounded-2xl bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/60 text-emerald-700 flex items-start gap-3 animate-in slide-in-from-top-2">
//             <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
//             <span className="text-sm">{success}</span>
//           </div>
//         )}

//         {/* FORM CARD */}
//         <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl shadow-slate-200/50 p-5 md:p-8 space-y-8 md:space-y-10">
          
//           {/* EMPLOYEE SECTION */}
//           <section className="space-y-5">
//             <h2 className="text-lg md:text-xl font-semibold text-slate-800 flex items-center gap-2">
//               <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-teal-500 to-emerald-600" />
//               Employee Information
//             </h2>
            
//             <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
//               {/* Employee Select */}
//               <div className="space-y-2">
//                 <label className="block text-sm font-semibold text-slate-700">Select Employee</label>
//                 <select
//                   value={formData.empId ? staffOptions.find(s => s.staffId === formData.empId)?.id : ""}
//                   onChange={handleEmployeeSelect}
//                   required
//                   disabled={loading}
//                   className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300"
//                 >
//                   <option value="">Choose an employee</option>
//                   {staffOptions.map((staff, index) => (
//                     <option key={staff.id || staff.staffId || index} value={staff.id}>
//                       {staff.staffId} — {staff.staffName}
//                     </option>
//                   ))}
//                 </select>
//               </div>
              
//               {/* Auto-filled Name */}
//               <div className="space-y-2">
//                 <label className="block text-sm font-semibold text-slate-700">Employee Name</label>
//                 <input
//                   value={formData.employName}
//                   readOnly
//                   className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-slate-50/80 text-slate-600 cursor-not-allowed"
//                   placeholder="Select employee to auto-fill"
//                 />
//               </div>
//             </div>
            
//             {/* Sheet Type */}
//             <div className="space-y-2">
//               <label className="block text-sm font-semibold text-slate-700">Sheet Type</label>
//               <select
//                 name="sheet"
//                 value={formData.sheet}
//                 onChange={handleMainChange}
//                 disabled={loading}
//                 className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50 hover:border-slate-300"
//               >
//                 <option value="frontend">Frontend Development</option>
//                 <option value="backend">Backend Development</option>
//                 <option value="testing">QA & Testing</option>
//                 <option value="design">UI/UX Design</option>
//                 <option value="Full Stack">Full Stack Development</option>
//                 <option value="Digital Marketing">Digital Marketing</option>
//               </select>
//             </div>
//           </section>

//           {/* PROJECTS SECTION */}
//           <section className="space-y-5">
//             <div className="flex items-center justify-between">
//               <h2 className="text-lg md:text-xl font-semibold text-slate-800 flex items-center gap-2">
//                 <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-teal-500 to-emerald-600" />
//                 Project Assignments
//               </h2>
//               <button
//                 type="button"
//                 onClick={addProject}
//                 disabled={loading}
//                 className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border-2 border-dashed border-teal-300 text-teal-700 hover:bg-teal-50/60 hover:border-teal-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <Plus size={16} />
//                 <span className="hidden sm:inline">Add Project</span>
//               </button>
//             </div>

//             <div className="space-y-4">
//               {formData.projects.map((project, i) => (
//                 <div
//                   key={i}
//                   className="group relative p-4 md:p-6 rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50/50 to-white/30 hover:border-teal-200/60 transition-all duration-300"
//                 >
//                   {/* Remove Button */}
//                   {formData.projects.length > 1 && (
//                     <button
//                       type="button"
//                       onClick={() => removeProject(i)}
//                       disabled={loading}
//                       className="absolute top-3 right-3 p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50 opacity-0 group-hover:opacity-100"
//                       title="Remove project"
//                     >
//                       <Trash2 size={16} />
//                     </button>
//                   )}
                  
//                   {/* Project Header */}
//                   <div className="mb-4 pb-3 border-b border-slate-100">
//                     <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
//                       Project #{i + 1}
//                     </span>
//                   </div>

//                   <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {/* Project Name */}
//                     <div className="sm:col-span-2 lg:col-span-1 space-y-2">
//                       <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Project</label>
//                       <select
//                         value={project.projectName}
//                         onChange={(e) => handleProjectChange(i, "projectName", e.target.value)}
//                         required
//                         disabled={loading}
//                         className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50 text-sm"
//                       >
//                         <option value="">Select project</option>
//                         {projectOptions.map((p, index) => (
//                           <option key={p.id || p.projectName || index} value={p.projectName}>
//                             {p.projectName}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     {/* Shift */}
//                     <div className="space-y-2">
//                       <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Shift</label>
//                       <select
//                         value={project.shift}
//                         onChange={(e) => handleProjectChange(i, "shift", e.target.value)}
//                         disabled={loading}
//                         className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50 text-sm"
//                       >
//                         <option value="morning">Morning</option>
//                         <option value="afternoon">Afternoon</option>
//                         <option value="fullday">Full Day</option>
//                       </select>
//                     </div>

//                     {/* Dates & Hours */}
//                     <div className="space-y-2">
//                       <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Start Date</label>
//                       <input 
//                         type="date" 
//                         value={project.startDate} 
//                         onChange={(e) => handleProjectChange(i, "startDate", e.target.value)} 
//                         required 
//                         disabled={loading} 
//                         className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50 text-sm" 
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">End Date</label>
//                       <input 
//                         type="date" 
//                         value={project.endDate} 
//                         onChange={(e) => handleProjectChange(i, "endDate", e.target.value)} 
//                         required 
//                         disabled={loading} 
//                         className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50 text-sm" 
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Hours</label>
//                       <input 
//                         type="number" 
//                         min="1" 
//                         value={project.hours} 
//                         onChange={(e) => handleProjectChange(i, "hours", e.target.value)} 
//                         required 
//                         disabled={loading} 
//                         placeholder="e.g., 40"
//                         className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50 text-sm" 
//                       />
//                     </div>
//                   </div>

//                   {/* Comment */}
//                   <div className="mt-4 space-y-2">
//                     <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Comment (Optional)</label>
//                     <textarea
//                       rows={2}
//                       value={project.comment}
//                       onChange={(e) => handleProjectChange(i, "comment", e.target.value)}
//                       disabled={loading}
//                       placeholder="Add notes about this assignment..."
//                       className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50 text-sm resize-none"
//                     />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </section>

//           {/* ACTION BUTTONS */}
//           <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
//             <button
//               type="button"
//               onClick={() => navigate("/assigned-works")}
//               disabled={loading}
//               className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={loading || fetchingOptions}
//               className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="animate-spin" size={18} />
//                   Creating...
//                 </>
//               ) : (
//                 "Create Worksheet"
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default AddWorksheet;



import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardPlus, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, User, Briefcase } from "lucide-react";
import { getAuthHeaders } from "../../utils/Auth";

const API = "https://pms-crm-backend.onrender.com/api";

const AddWorksheet = () => {
  const navigate = useNavigate();
  const [staffOptions, setStaffOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    empId: "",
    employName: "",
    sheet: "frontend",
    projects: [{ 
      projectName: "", 
      startDate: "", 
      endDate: "", 
      comment: "", 
      hours: "", 
      shift: "morning",
      tasks: []
    }],
  });

  // Fetch options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [staffRes, projectRes] = await Promise.all([
          fetch(`${API}/staff/options`, { headers: getAuthHeaders() }),
          fetch(`${API}/worksheets/project-options`, { headers: getAuthHeaders() }),
        ]);

        const staffData = await staffRes.json();
        const projectData = await projectRes.json();

        if (staffData.success) {
          const formattedStaff = staffData.data.map(staff => ({
            id: staff.employeeId,
            staffId: staff.employeeId,
            staffName: staff.employeeName
          }));
          setStaffOptions(formattedStaff);
        }
        
        if (projectData.success) {
          setProjectOptions(projectData.data);
        }
      } catch (err) {
        console.error("Fetch options error:", err);
        setError("Failed to load dropdown data");
      } finally {
        setFetchingOptions(false);
      }
    };
    
    fetchOptions();
  }, []);

  // Handle main form changes
  const handleMainChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Handle employee selection
  const handleEmployeeSelect = (e) => {
    const selectedId = e.target.value;
    const selected = staffOptions.find((s) => String(s.id) === String(selectedId));
    setFormData((prev) => ({
      ...prev,
      empId: selected?.staffId || "",
      employName: selected?.staffName || "",
    }));
  };

  // Handle project field changes
  const handleProjectChange = (i, field, value) => {
    const updated = [...formData.projects];
    updated[i][field] = value;
    setFormData({ ...formData, projects: updated });
  };

  // Handle task field changes
  const handleTaskChange = (projectIndex, taskIndex, field, value) => {
    const updated = [...formData.projects];
    updated[projectIndex].tasks[taskIndex][field] = value;
    setFormData({ ...formData, projects: updated });
  };

  // Add new project
  const addProject = () => {
    setFormData({
      ...formData,
      projects: [...formData.projects, { 
        projectName: "", 
        startDate: "", 
        endDate: "", 
        comment: "", 
        hours: "", 
        shift: "morning",
        tasks: [] 
      }],
    });
  };

  // Remove project
  const removeProject = (i) => {
    if (formData.projects.length === 1) return;
    setFormData({ ...formData, projects: formData.projects.filter((_, x) => x !== i) });
  };

  // Add task to project
  const addTaskToProject = (projectIndex) => {
    const updated = [...formData.projects];
    updated[projectIndex].tasks.push({
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
      estimatedHours: 4,
      status: "pending"
    });
    setFormData({ ...formData, projects: updated });
  };

  // Remove task from project
  const removeTask = (projectIndex, taskIndex) => {
    const updated = [...formData.projects];
    updated[projectIndex].tasks = updated[projectIndex].tasks.filter((_, x) => x !== taskIndex);
    setFormData({ ...formData, projects: updated });
  };

  // Validate form
  const validateForm = () => {
    if (!formData.empId) {
      setError("Please select an employee");
      return false;
    }
    
    if (formData.projects.some((p) => !p.projectName || !p.startDate || !p.endDate || !p.hours)) {
      setError("Please fill all required project fields");
      return false;
    }
    
    for (const project of formData.projects) {
      if (project.startDate && project.endDate && new Date(project.endDate) < new Date(project.startDate)) {
        setError(`End date must be after start date for project: ${project.projectName}`);
        return false;
      }
      
      for (const task of project.tasks) {
        if (task.title && task.dueDate && project.endDate && new Date(task.dueDate) > new Date(project.endDate)) {
          setError(`Task "${task.title}" due date exceeds project end date`);
          return false;
        }
      }
    }
    
    return true;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const payload = {
        empId: formData.empId,
        employName: formData.employName,
        sheet: formData.sheet,
        projects: formData.projects.map(project => ({
          projectName: project.projectName,
          startDate: project.startDate,
          endDate: project.endDate,
          hours: parseInt(project.hours, 10),
          shift: project.shift,
          comment: project.comment || "",
          tasks: project.tasks
            .filter(task => task.title.trim())
            .map(task => ({
              title: task.title,
              description: task.description || "",
              priority: task.priority,
              dueDate: task.dueDate,
              estimatedHours: parseInt(task.estimatedHours, 10) || 0,
              status: "pending"
            }))
        }))
      };
      
      const response = await fetch(`${API}/worksheets/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess("✨ Worksheet created successfully!");
        setTimeout(() => navigate("/assigned-works"), 1500);
      } else {
        setError(data.message || "Failed to create worksheet");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Priority badge style
  const getPriorityStyle = (priority) => {
    const styles = {
      low: "bg-green-100 text-green-700 border-green-200",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
      high: "bg-red-100 text-red-700 border-red-200"
    };
    return styles[priority] || styles.medium;
  };

  if (fetchingOptions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 animate-pulse">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-100/60" />
          <div className="h-4 w-48 mx-auto rounded bg-slate-200" />
          <div className="h-3 w-64 mx-auto rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8 md:mb-10">
          <div className="flex items-center gap-4 p-4 md:p-6 bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-lg shadow-teal-500/5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25">
              <ClipboardPlus className="text-white" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Create Worksheet
              </h1>
              <p className="text-slate-500 text-sm md:text-base mt-1">
                Assign projects and tasks to employees
              </p>
            </div>
          </div>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/60 text-emerald-700 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* FORM CARD */}
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl shadow-slate-200/50 p-3 md:p-3 space-y-8 md:space-y-10">
          
          {/* EMPLOYEE SECTION */}
          <section className="space-y-5">
            <h2 className="text-lg md:text-xl font-semibold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-teal-500 to-emerald-600" />
              Employee Information
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User size={14} /> Select Employee
                </label>
                <select
                  value={formData.empId ? staffOptions.find(s => s.staffId === formData.empId)?.id : ""}
                  onChange={handleEmployeeSelect}
                  required
                  disabled={loading}
                  className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50"
                >
                  <option value="">Choose an employee</option>
                  {staffOptions.map((staff, index) => (
                    <option key={staff.id || staff.staffId || index} value={staff.id}>
                      {staff.staffId} — {staff.staffName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Employee Name</label>
                <input
                  value={formData.employName}
                  readOnly
                  className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-slate-50/80 text-slate-600 cursor-not-allowed"
                  placeholder="Select employee to auto-fill"
                />
              </div>
            </div>
            
            {/* Sheet Type */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Briefcase size={14} /> Sheet Type
              </label>
              <select
                name="sheet"
                value={formData.sheet}
                onChange={handleMainChange}
                disabled={loading}
                className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
              >
                <option value="frontend">Frontend Development</option>
                <option value="backend">Backend Development</option>
                <option value="testing">QA & Testing</option>
                <option value="design">UI/UX Design</option>
                <option value="Full Stack">Full Stack Development</option>
                <option value="Digital Marketing">Digital Marketing</option>
              </select>
            </div>
          </section>

          {/* PROJECTS SECTION */}
          <section className="space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
              <h2 className="text-lg md:text-xl font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-teal-500 to-emerald-600" />
                Projects & Tasks
              </h2>
              <button
                type="button"
                onClick={addProject}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border-2 border-dashed border-teal-300 text-teal-700 hover:bg-teal-50/60 transition-all"
              >
                <Plus size={16} /> Add Project
              </button>
            </div>

            <div className="space-y-6">
              {formData.projects.map((project, i) => (
                <div
                  key={i}
                  className="relative p-4 md:p-6 rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50/50 to-white/30 hover:border-teal-200/60 transition-all"
                >
                  {/* Remove Project Button */}
                  {formData.projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProject(i)}
                      disabled={loading}
                      className="absolute top-3 right-3 p-2 rounded-xl text-red-500 hover:bg-red-50 transition-all z-10"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  
                  {/* Project Header */}
                  <div className="mb-4 pb-3 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Project #{i + 1}
                    </span>
                  </div>

                  {/* Project Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-1 space-y-2">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Project Name *</label>
                      <select
                        value={project.projectName}
                        onChange={(e) => handleProjectChange(i, "projectName", e.target.value)}
                        required
                        disabled={loading}
                        className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm"
                      >
                        <option value="">Select project</option>
                        {projectOptions.map((p, index) => (
                          <option key={p.id || p.projectName || index} value={p.projectName}>
                            {p.projectName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Shift</label>
                      <select
                        value={project.shift}
                        onChange={(e) => handleProjectChange(i, "shift", e.target.value)}
                        className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm"
                      >
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="fullday">Full Day</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Start Date *</label>
                      <input 
                        type="date" 
                        value={project.startDate} 
                        onChange={(e) => handleProjectChange(i, "startDate", e.target.value)} 
                        required 
                        className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">End Date *</label>
                      <input 
                        type="date" 
                        value={project.endDate} 
                        onChange={(e) => handleProjectChange(i, "endDate", e.target.value)} 
                        required 
                        className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Hours/Day *</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={project.hours} 
                        onChange={(e) => handleProjectChange(i, "hours", e.target.value)} 
                        required 
                        placeholder="8"
                        className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm" 
                      />
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="mt-4 space-y-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Comment (Optional)</label>
                    <textarea
                      rows={2}
                      value={project.comment}
                      onChange={(e) => handleProjectChange(i, "comment", e.target.value)}
                      placeholder="Add notes about this assignment..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm resize-none"
                    />
                  </div>

                  {/* TASKS SECTION - Always Visible */}
                  <div className="mt-6 pt-4 border-t border-teal-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                      <h3 className="text-sm font-semibold text-teal-800 flex items-center gap-2">
                        <CheckCircle2 size={14} />
                        Tasks for {project.projectName || "this project"}
                      </h3>
                      <button
                        type="button"
                        onClick={() => addTaskToProject(i)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition-all"
                      >
                        <Plus size={12} /> Add Task
                      </button>
                    </div>

                    <div className="space-y-3">
                      {project.tasks.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 bg-slate-50/50 rounded-xl">
                          <CheckCircle2 size={32} className="mx-auto mb-2 opacity-40" />
                          <p className="text-sm">No tasks added yet</p>
                          <p className="text-xs mt-1">Click "Add Task" to assign tasks for this project</p>
                        </div>
                      ) : (
                        project.tasks.map((task, taskIndex) => (
                          <div key={taskIndex} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col lg:flex-row justify-between items-start gap-3">
                              {/* Task Fields - Responsive Grid */}
                              <div className="flex-1 w-full">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <input
                                    type="text"
                                    placeholder="Task title *"
                                    value={task.title}
                                    onChange={(e) => handleTaskChange(i, taskIndex, "title", e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-400 outline-none"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Description"
                                    value={task.description}
                                    onChange={(e) => handleTaskChange(i, taskIndex, "description", e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-400 outline-none"
                                  />
                                </div>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                                  <select
                                    value={task.priority}
                                    onChange={(e) => handleTaskChange(i, taskIndex, "priority", e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm font-semibold outline-none ${getPriorityStyle(task.priority)}`}
                                  >
                                    <option value="low">Low Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="high">High Priority</option>
                                  </select>
                                  <input
                                    type="date"
                                    value={task.dueDate}
                                    onChange={(e) => handleTaskChange(i, taskIndex, "dueDate", e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-400 outline-none"
                                    placeholder="Due Date"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Est. Hours"
                                    value={task.estimatedHours}
                                    onChange={(e) => handleTaskChange(i, taskIndex, "estimatedHours", e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-400 outline-none"
                                  />
                                </div>
                              </div>
                              
                              {/* Remove Task Button */}
                              <button
                                type="button"
                                onClick={() => removeTask(i, taskIndex)}
                                className="flex items-center justify-center p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 transition-all self-start lg:self-center"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate("/assigned-works")}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || fetchingOptions}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Creating...
                </>
              ) : (
                "Create Worksheet"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorksheet;