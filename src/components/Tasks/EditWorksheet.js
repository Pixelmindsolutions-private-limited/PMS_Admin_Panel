// import React, { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { Plus, Trash2, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
// import { getAuthHeaders, API_BASE } from "../../utils/Auth";

// const EditWorksheet = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
  
//   const [formData, setFormData] = useState({ 
//     empId: "", 
//     employName: "", 
//     sheet: "frontend", 
//     projects: [] 
//   });
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [projectOptions, setProjectOptions] = useState([]);

//   // Fetch project options for dropdown
//   useEffect(() => {
//     const fetchProjectOptions = async () => {
//       try {
//         const res = await fetch(`${API_BASE}/worksheets/project-options`, { 
//           headers: getAuthHeaders() 
//         });
//         const data = await res.json();
//         if (data.success) {
//           setProjectOptions(data.data);
//         }
//       } catch (err) {
//         console.error("Fetch project options error:", err);
//       }
//     };
//     fetchProjectOptions();
//   }, []);

//   // Fetch worksheet data
//   useEffect(() => { 
//     fetchAssignment(); 
//   }, [id]);

//   const fetchAssignment = async () => {
//     try {
//       const res = await fetch(`${API_BASE}/worksheets/${id}`, { 
//         headers: getAuthHeaders() 
//       });
//       const data = await res.json();
      
//       if (data.success) {
//         // Format dates for input fields
//         const formatted = {
//           ...data.data,
//           projects: data.data.projects?.map((p) => ({
//             ...p,
//             startDate: p.startDate?.split("T")[0] || "",
//             endDate: p.endDate?.split("T")[0] || "",
//             hours: p.hours || "",
//           })) || [],
//         };
//         setFormData(formatted);
//       } else {
//         setError(data.message || "Failed to load worksheet");
//       }
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setError("Failed to load assignment");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleMainChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  
//   const handleProjectChange = (index, field, value) => {
//     const updated = [...formData.projects];
//     updated[index][field] = value;
//     setFormData((prev) => ({ ...prev, projects: updated }));
//   };

//   const addProject = () => {
//     setFormData((prev) => ({
//       ...prev,
//       projects: [...prev.projects, { 
//         projectName: "", 
//         startDate: "", 
//         endDate: "", 
//         comment: "", 
//         hours: "", 
//         shift: "morning" 
//       }],
//     }));
//   };

//   const removeProject = (index) => {
//     if (formData.projects.length === 1) return;
//     const updated = formData.projects.filter((_, i) => i !== index);
//     setFormData((prev) => ({ ...prev, projects: updated }));
//   };

//   // Validation
//   const validateForm = () => {
//     if (!formData.sheet) {
//       setError("Please select a sheet type");
//       return false;
//     }
    
//     for (const project of formData.projects) {
//       if (!project.projectName) {
//         setError("Please select a project name for all assignments");
//         return false;
//       }
//       if (!project.startDate) {
//         setError("Please enter start date for all projects");
//         return false;
//       }
//       if (!project.endDate) {
//         setError("Please enter end date for all projects");
//         return false;
//       }
//       if (!project.hours) {
//         setError("Please enter hours for all projects");
//         return false;
//       }
//       if (project.startDate && project.endDate && new Date(project.endDate) < new Date(project.startDate)) {
//         setError(`End date must be after start date for project: ${project.projectName}`);
//         return false;
//       }
//     }
    
//     return true;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!validateForm()) return;
    
//     setSubmitting(true);
//     setError("");
//     setSuccess("");

//     try {
//       // Prepare payload
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

//       console.log("📤 Updating worksheet:", payload);

//       const res = await fetch(`${API_BASE}/worksheets/${id}`, {
//         method: "PUT",
//         headers: getAuthHeaders(),
//         body: JSON.stringify(payload),
//       });
      
//       const data = await res.json();
      
//       if (data.success) {
//         setSuccess("✨ Worksheet updated successfully!");
//         setTimeout(() => navigate("/assigned-works"), 1500);
//       } else {
//         setError(data.message || data.errors?.join(", ") || "Update failed");
//       }
//     } catch (err) {
//       console.error("Update error:", err);
//       setError("Network error. Please try again.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center p-4">
//         <div className="text-center space-y-4 animate-pulse">
//           <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-100/60" />
//           <div className="h-4 w-48 mx-auto rounded bg-slate-200" />
//           <div className="h-3 w-64 mx-auto rounded bg-slate-100" />
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 py-6 md:py-10 px-4 md:px-6">
//       <div className="max-w-5xl mx-auto">
        
//         {/* HEADER */}
//         <div className="mb-8 flex items-center justify-between">
//           <div>
//             <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
//               Edit Worksheet
//             </h1>
//             <p className="text-slate-500 mt-1 text-sm md:text-base">Update employee project assignments</p>
//           </div>
//           <button onClick={() => navigate("/assigned-works")} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium">
//             <ArrowLeft size={18} /> <span className="hidden sm:inline">Back</span>
//           </button>
//         </div>

//         {/* FORM CARD */}
//         <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl shadow-slate-200/50 p-5 md:p-8 space-y-8">
          
//           {/* ALERTS */}
//           {error && (
//             <div className="p-4 rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 flex items-start gap-3">
//               <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
//               <span className="text-sm">{error}</span>
//             </div>
//           )}
//           {success && (
//             <div className="p-4 rounded-2xl bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/60 text-emerald-700 flex items-start gap-3">
//               <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
//               <span className="text-sm">{success}</span>
//             </div>
//           )}

//           {/* EMPLOYEE (Read-only) */}
//           <section className="space-y-5">
//             <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
//               <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-teal-500 to-emerald-600" />
//               Employee Information
//             </h2>
//             <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
//               <div className="space-y-2">
//                 <label className="block text-sm font-semibold text-slate-700">Employee ID</label>
//                 <input 
//                   value={formData.empId} 
//                   readOnly 
//                   className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-slate-50/80 text-slate-600 cursor-not-allowed" 
//                 />
//               </div>
//               <div className="space-y-2">
//                 <label className="block text-sm font-semibold text-slate-700">Employee Name</label>
//                 <input 
//                   value={formData.employName} 
//                   readOnly 
//                   className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-slate-50/80 text-slate-600 cursor-not-allowed" 
//                 />
//               </div>
//             </div>
//           </section>

//           {/* SHEET TYPE */}
//           <div className="space-y-2">
//             <label className="block text-sm font-semibold text-slate-700">Sheet Type</label>
//             <select 
//               name="sheet" 
//               value={formData.sheet} 
//               onChange={handleMainChange} 
//               disabled={submitting} 
//               className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50"
//             >
//               <option value="frontend">Frontend Development</option>
//               <option value="backend">Backend Development</option>
//               <option value="testing">QA & Testing</option>
//               <option value="design">UI/UX Design</option>
//               <option value="Full Stack">Full Stack Development</option>
//               <option value="Digital Marketing">Digital Marketing</option>
//             </select>
//           </div>

//           {/* PROJECTS */}
//           <section className="space-y-5">
//             <div className="flex items-center justify-between">
//               <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
//                 <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-teal-500 to-emerald-600" />
//                 Project Assignments
//               </h2>
//               <button 
//                 type="button" 
//                 onClick={addProject} 
//                 disabled={submitting} 
//                 className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border-2 border-dashed border-teal-300 text-teal-700 hover:bg-teal-50/60 transition-all disabled:opacity-50"
//               >
//                 <Plus size={16} /> Add Project
//               </button>
//             </div>

//             <div className="space-y-4">
//               {formData.projects?.map((project, index) => (
//                 <div 
//                   key={index} 
//                   className="group relative p-4 md:p-6 rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50/50 to-white/30"
//                 >
//                   {formData.projects.length > 1 && (
//                     <button 
//                       type="button" 
//                       onClick={() => removeProject(index)} 
//                       disabled={submitting} 
//                       className="absolute top-3 right-3 p-2 rounded-xl text-red-500 hover:bg-red-50 transition-all disabled:opacity-50 opacity-0 group-hover:opacity-100"
//                     >
//                       <Trash2 size={16} />
//                     </button>
//                   )}
                  
//                   <div className="mb-4 pb-3 border-b border-slate-100">
//                     <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
//                       Project #{index + 1}
//                     </span>
//                   </div>

//                   <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {/* Project Name */}
//                     <div className="sm:col-span-2 lg:col-span-1 space-y-2">
//                       <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Project Name</label>
//                       <select
//                         value={project.projectName}
//                         onChange={(e) => handleProjectChange(index, "projectName", e.target.value)}
//                         required
//                         disabled={submitting}
//                         className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50 text-sm"
//                       >
//                         <option value="">Select project</option>
//                         {projectOptions.map((p) => (
//                           <option key={p.id} value={p.projectName}>
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
//                         onChange={(e) => handleProjectChange(index, "shift", e.target.value)} 
//                         disabled={submitting} 
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
//                         onChange={(e) => handleProjectChange(index, "startDate", e.target.value)} 
//                         required 
//                         disabled={submitting} 
//                         className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50 text-sm" 
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">End Date</label>
//                       <input 
//                         type="date" 
//                         value={project.endDate} 
//                         onChange={(e) => handleProjectChange(index, "endDate", e.target.value)} 
//                         required 
//                         disabled={submitting} 
//                         className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50 text-sm" 
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Hours</label>
//                       <input 
//                         type="number" 
//                         min="1" 
//                         value={project.hours} 
//                         onChange={(e) => handleProjectChange(index, "hours", e.target.value)} 
//                         required 
//                         disabled={submitting} 
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
//                       onChange={(e) => handleProjectChange(index, "comment", e.target.value)} 
//                       disabled={submitting} 
//                       placeholder="Add notes about this assignment..."
//                       className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50 text-sm resize-none" 
//                     />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </section>

//           {/* BUTTONS */}
//           <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
//             <button 
//               type="button" 
//               onClick={() => navigate("/assigned-works")} 
//               disabled={submitting} 
//               className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
//             >
//               Cancel
//             </button>
//             <button 
//               type="submit" 
//               disabled={submitting} 
//               className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
//             >
//               {submitting ? <><Loader2 className="animate-spin" size={18} /> Updating...</> : "Update Worksheet"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default EditWorksheet;


import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, ArrowLeft, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { getAuthHeaders } from "../../utils/Auth";

const API_BASE = "https://pms-crm-backend.onrender.com/api";

const EditWorksheet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ 
    empId: "", 
    employName: "", 
    sheet: "frontend", 
    projects: [] 
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [projectOptions, setProjectOptions] = useState([]);
  const [expandedTasks, setExpandedTasks] = useState({});

  // Fetch project options for dropdown
  useEffect(() => {
    const fetchProjectOptions = async () => {
      try {
        const res = await fetch(`${API_BASE}/worksheets/project-options`, { 
          headers: getAuthHeaders() 
        });
        const data = await res.json();
        if (data.success) {
          setProjectOptions(data.data);
        }
      } catch (err) {
        console.error("Fetch project options error:", err);
      }
    };
    fetchProjectOptions();
  }, []);

  // Fetch worksheet data
  useEffect(() => { 
    fetchAssignment(); 
  }, [id]);

  const fetchAssignment = async () => {
    try {
      const res = await fetch(`${API_BASE}/worksheets/${id}`, { 
        headers: getAuthHeaders() 
      });
      const data = await res.json();
      
      if (data.success) {
        const formatted = {
          ...data.data,
          projects: data.data.projects?.map((p) => ({
            ...p,
            startDate: p.startDate?.split("T")[0] || "",
            endDate: p.endDate?.split("T")[0] || "",
            hours: p.hours || "",
            tasks: p.tasks || []
          })) || [],
        };
        setFormData(formatted);
      } else {
        setError(data.message || "Failed to load worksheet");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleMainChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  
  const handleProjectChange = (index, field, value) => {
    const updated = [...formData.projects];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, projects: updated }));
  };

  // Task handlers
  const handleTaskChange = (projectIndex, taskIndex, field, value) => {
    const updated = [...formData.projects];
    updated[projectIndex].tasks[taskIndex][field] = value;
    setFormData((prev) => ({ ...prev, projects: updated }));
  };

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
    setFormData((prev) => ({ ...prev, projects: updated }));
    setExpandedTasks(prev => ({ ...prev, [`${projectIndex}`]: true }));
  };

  const removeTask = (projectIndex, taskIndex) => {
    const updated = [...formData.projects];
    updated[projectIndex].tasks = updated[projectIndex].tasks.filter((_, x) => x !== taskIndex);
    setFormData((prev) => ({ ...prev, projects: updated }));
  };

  const toggleTaskSection = (projectIndex) => {
    setExpandedTasks(prev => ({
      ...prev,
      [projectIndex]: !prev[projectIndex]
    }));
  };

  const addProject = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [...prev.projects, { 
        projectName: "", 
        startDate: "", 
        endDate: "", 
        comment: "", 
        hours: "", 
        shift: "morning",
        tasks: []
      }],
    }));
  };

  const removeProject = (index) => {
    if (formData.projects.length === 1) return;
    const updated = formData.projects.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, projects: updated }));
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

  // Validation
  const validateForm = () => {
    if (!formData.sheet) {
      setError("Please select a sheet type");
      return false;
    }
    
    for (const project of formData.projects) {
      if (!project.projectName) {
        setError("Please select a project name for all assignments");
        return false;
      }
      if (!project.startDate) {
        setError("Please enter start date for all projects");
        return false;
      }
      if (!project.endDate) {
        setError("Please enter end date for all projects");
        return false;
      }
      if (!project.hours) {
        setError("Please enter hours for all projects");
        return false;
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
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
              status: task.status || "pending"
            }))
        }))
      };

      console.log("📤 Updating worksheet with tasks:", payload);

      const res = await fetch(`${API_BASE}/worksheets/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess("✨ Worksheet updated successfully!");
        setTimeout(() => navigate("/assigned-works"), 1500);
      } else {
        setError(data.message || data.errors?.join(", ") || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center p-4">
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Edit Worksheet
            </h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">Update employee project assignments and tasks</p>
          </div>
          <button onClick={() => navigate("/assigned-works")} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium">
            <ArrowLeft size={18} /> <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        {/* FORM CARD */}
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl shadow-slate-200/50 p-3 md:p-3 space-y-8">
          
          {/* ALERTS */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {success && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/60 text-emerald-700 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* EMPLOYEE (Read-only) */}
          <section className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-teal-500 to-emerald-600" />
              Employee Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Employee ID</label>
                <input 
                  value={formData.empId} 
                  readOnly 
                  className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-slate-50/80 text-slate-600 cursor-not-allowed" 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Employee Name</label>
                <input 
                  value={formData.employName} 
                  readOnly 
                  className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-slate-50/80 text-slate-600 cursor-not-allowed" 
                />
              </div>
            </div>
          </section>

          {/* SHEET TYPE */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Sheet Type</label>
            <select 
              name="sheet" 
              value={formData.sheet} 
              onChange={handleMainChange} 
              disabled={submitting} 
              className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50"
            >
              <option value="frontend">Frontend Development</option>
              <option value="backend">Backend Development</option>
              <option value="testing">QA & Testing</option>
              <option value="design">UI/UX Design</option>
              <option value="Full Stack">Full Stack Development</option>
              <option value="Digital Marketing">Digital Marketing</option>
            </select>
          </div>

          {/* PROJECTS */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-teal-500 to-emerald-600" />
                Project Assignments
              </h2>
              <button 
                type="button" 
                onClick={addProject} 
                disabled={submitting} 
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border-2 border-dashed border-teal-300 text-teal-700 hover:bg-teal-50/60 transition-all disabled:opacity-50"
              >
                <Plus size={16} /> Add Project
              </button>
            </div>

            <div className="space-y-4">
              {formData.projects?.map((project, projectIndex) => (
                <div 
                  key={projectIndex} 
                  className="relative p-4 md:p-6 rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50/50 to-white/30"
                >
                  {formData.projects.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeProject(projectIndex)} 
                      disabled={submitting} 
                      className="absolute top-3 right-3 p-2 rounded-xl text-red-500 hover:bg-red-50 transition-all disabled:opacity-50 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  
                  <div className="mb-4 pb-3 border-b border-slate-100 flex justify-between items-center cursor-pointer" onClick={() => toggleTaskSection(projectIndex)}>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Project #{projectIndex + 1}
                    </span>
                    <button type="button" className="p-1 rounded-lg hover:bg-slate-100">
                      {expandedTasks[projectIndex] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>

                  {/* Project Details */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 lg:col-span-1 space-y-2">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Project Name</label>
                      <select
                        value={project.projectName}
                        onChange={(e) => handleProjectChange(projectIndex, "projectName", e.target.value)}
                        required
                        disabled={submitting}
                        className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50 text-sm"
                      >
                        <option value="">Select project</option>
                        {projectOptions.map((p) => (
                          <option key={p.id} value={p.projectName}>
                            {p.projectName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Shift</label>
                      <select 
                        value={project.shift} 
                        onChange={(e) => handleProjectChange(projectIndex, "shift", e.target.value)} 
                        disabled={submitting} 
                        className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50 text-sm"
                      >
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="fullday">Full Day</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Start Date</label>
                      <input 
                        type="date" 
                        value={project.startDate} 
                        onChange={(e) => handleProjectChange(projectIndex, "startDate", e.target.value)} 
                        required 
                        disabled={submitting} 
                        className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50 text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">End Date</label>
                      <input 
                        type="date" 
                        value={project.endDate} 
                        onChange={(e) => handleProjectChange(projectIndex, "endDate", e.target.value)} 
                        required 
                        disabled={submitting} 
                        className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50 text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Hours</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={project.hours} 
                        onChange={(e) => handleProjectChange(projectIndex, "hours", e.target.value)} 
                        required 
                        disabled={submitting} 
                        placeholder="e.g., 40"
                        className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50 text-sm" 
                      />
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="mt-4 space-y-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Comment (Optional)</label>
                    <textarea 
                      rows={2} 
                      value={project.comment} 
                      onChange={(e) => handleProjectChange(projectIndex, "comment", e.target.value)} 
                      disabled={submitting} 
                      placeholder="Add notes about this assignment..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50 text-sm resize-none" 
                    />
                  </div>

                  {/* TASKS SECTION */}
                  {expandedTasks[projectIndex] && (
                    <div className="mt-6 pt-4 border-t border-teal-100">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                        <h3 className="text-sm font-semibold text-teal-800 flex items-center gap-2">
                          <CheckCircle2 size={14} />
                          Tasks for {project.projectName || "this project"}
                        </h3>
                        <button
                          type="button"
                          onClick={() => addTaskToProject(projectIndex)}
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
                            <div key={taskIndex} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                              <div className="flex flex-col lg:flex-row justify-between items-start gap-3">
                                <div className="flex-1 w-full">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                      type="text"
                                      placeholder="Task title *"
                                      value={task.title}
                                      onChange={(e) => handleTaskChange(projectIndex, taskIndex, "title", e.target.value)}
                                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-400 outline-none"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Description"
                                      value={task.description}
                                      onChange={(e) => handleTaskChange(projectIndex, taskIndex, "description", e.target.value)}
                                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-400 outline-none"
                                    />
                                  </div>
                                  
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                                    <select
                                      value={task.priority}
                                      onChange={(e) => handleTaskChange(projectIndex, taskIndex, "priority", e.target.value)}
                                      className={`w-full px-3 py-2 border rounded-lg text-sm font-semibold outline-none ${getPriorityStyle(task.priority)}`}
                                    >
                                      <option value="low">Low Priority</option>
                                      <option value="medium">Medium Priority</option>
                                      <option value="high">High Priority</option>
                                    </select>
                                    <input
                                      type="date"
                                      value={task.dueDate}
                                      onChange={(e) => handleTaskChange(projectIndex, taskIndex, "dueDate", e.target.value)}
                                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-400 outline-none"
                                      placeholder="Due Date"
                                    />
                                    <input
                                      type="number"
                                      placeholder="Est. Hours"
                                      value={task.estimatedHours}
                                      onChange={(e) => handleTaskChange(projectIndex, taskIndex, "estimatedHours", e.target.value)}
                                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-400 outline-none"
                                    />
                                  </div>
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={() => removeTask(projectIndex, taskIndex)}
                                  className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* BUTTONS */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => navigate("/assigned-works")} 
              disabled={submitting} 
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting} 
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 className="animate-spin" size={18} /> Updating...</> : "Update Worksheet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWorksheet;