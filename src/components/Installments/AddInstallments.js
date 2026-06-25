import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { 
  FolderPlus, X, CheckCircle, AlertCircle, Loader, 
  Calendar, DollarSign, Clock, Plus, Trash2, 
  Edit, Save, RefreshCw, Eye, ChevronDown, ChevronUp
} from "lucide-react";

const API_URL = "https://pmsbackend.pixelmindsolutions.com/api/projects/all";
const INSTALLMENT_URL = "https://pmsbackend.pixelmindsolutions.com/api/projects";
const adminDetails = JSON.parse(sessionStorage.getItem("adminDetails"));
const AUTH_TOKEN = adminDetails?.token;

const AddInstallment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [installments, setInstallments] = useState([]);
  const [showInstallmentForm, setShowInstallmentForm] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState(null);
  
  // Installment form state
  const [installmentForm, setInstallmentForm] = useState({
    title: "",
    type: "amount",
    value: "",
    dueDate: "",
  });

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success && data.data) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch projects. Please try again.',
        confirmButtonColor: '#0d9488',
      });
    } finally {
      setProjectsLoading(false);
    }
  };

  // Function to refresh project data and update installments
  const refreshProjectData = async () => {
    if (!selectedProject) return;
    
    try {
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success && data.data) {
        setProjects(data.data);
        // Update selected project with fresh data
        const updatedProject = data.data.find(p => p._id === selectedProject._id);
        if (updatedProject) {
          setSelectedProject(updatedProject);
          setInstallments(updatedProject.installments || []);
        }
      }
    } catch (error) {
      console.error("Error refreshing project data:", error);
    }
  };

  const handleProjectSelect = (projectId) => {
    const project = projects.find(p => p._id === projectId);
    setSelectedProject(project);
    if (project) {
      setInstallments(project.installments || []);
    }
    setShowInstallmentForm(false);
    setEditingInstallment(null);
    resetForm();
  };

  const resetForm = () => {
    setInstallmentForm({
      title: "",
      type: "amount",
      value: "",
      dueDate: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInstallmentForm(prev => ({ ...prev, [name]: value }));
  };

  // Check if adding more installments would exceed milestones
  const canAddMoreInstallments = () => {
    if (!selectedProject) return false;
    const currentInstallmentCount = installments.length;
    const maxInstallments = selectedProject.paymentMilestone || 0;
    return currentInstallmentCount < maxInstallments;
  };

  // Get remaining installment slots
  const getRemainingSlots = () => {
    if (!selectedProject) return 0;
    const currentInstallmentCount = installments.length;
    const maxInstallments = selectedProject.paymentMilestone || 0;
    return Math.max(0, maxInstallments - currentInstallmentCount);
  };

  const handleEditInstallment = (installment) => {
    setEditingInstallment(installment);
    setInstallmentForm({
      title: installment.title,
      type: installment.type,
      value: installment.value,
      dueDate: installment.dueDate ? installment.dueDate.split('T')[0] : '',
    });
    setShowInstallmentForm(true);
  };

  const handleDeleteInstallment = async (installmentId) => {
    const result = await Swal.fire({
      title: 'Delete Installment?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#0d9488',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const response = await fetch(
          `${INSTALLMENT_URL}/${selectedProject._id}/installments/${installmentId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${AUTH_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Installment has been deleted.',
            timer: 1500,
            showConfirmButton: false,
          });
          
          // Refresh project data
          await refreshProjectData();
        } else {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete installment');
        }
      } catch (error) {
        console.error("Delete error:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to delete installment.',
          confirmButtonColor: '#0d9488',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmitInstallment = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!installmentForm.title.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter an installment title.',
        confirmButtonColor: '#0d9488',
      });
      return;
    }

    if (!installmentForm.value || Number(installmentForm.value) <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter a valid value.',
        confirmButtonColor: '#0d9488',
      });
      return;
    }

    if (!installmentForm.dueDate) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please select a due date.',
        confirmButtonColor: '#0d9488',
      });
      return;
    }

    // Validate percentage type
    if (installmentForm.type === 'percentage' && Number(installmentForm.value) > 100) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Percentage value cannot exceed 100%.',
        confirmButtonColor: '#0d9488',
      });
      return;
    }

    // Check if adding new installment would exceed milestones
    if (!editingInstallment && !canAddMoreInstallments()) {
      Swal.fire({
        icon: 'error',
        title: 'Limit Reached',
        text: `This project already has ${installments.length} installments. Maximum allowed is ${selectedProject.paymentMilestone} based on payment milestones.`,
        confirmButtonColor: '#0d9488',
      });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: installmentForm.title.trim(),
        type: installmentForm.type,
        value: Number(installmentForm.value),
        dueDate: installmentForm.dueDate,
      };

      // Check if we're editing or creating
      const url = editingInstallment
        ? `${INSTALLMENT_URL}/${selectedProject._id}/installments/${editingInstallment._id}`
        : `${INSTALLMENT_URL}/${selectedProject._id}/installments`;

      const method = editingInstallment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: editingInstallment ? 'Installment Updated!' : 'Installment Added!',
          text: `Installment "${payload.title}" has been ${editingInstallment ? 'updated' : 'added'} successfully.`,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });

        // Refresh project data
        await refreshProjectData();

        setShowInstallmentForm(false);
        setEditingInstallment(null);
        resetForm();
      } else {
        const msg = data.errors ? data.errors.join(", ") : data.message || "Failed to add installment.";
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: msg,
          confirmButtonColor: '#0d9488',
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Unable to connect to the server. Please check your connection and try again.',
        confirmButtonColor: '#0d9488',
      });
    } finally {
      setLoading(false);
    }
  };

 

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Check if due date is tomorrow
  const isDueTomorrow = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/90 via-white to-teal-100/70">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <DollarSign className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight">Manage Installments</h1>
              <p className="text-sm text-gray-500">Add and manage project payment installments</p>
            </div>
          </div>
          <button 
            onClick={() => navigate("/projects")}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-teal-300 text-gray-600 font-semibold text-sm hover:shadow-md transition-all w-full sm:w-auto"
          >
            ← Back to Projects
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-teal-200/30 shadow-xl p-6 lg:p-8">
          
          {/* Project Selection */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Select Project</label>
            <select
              value={selectedProject?._id || ""}
              onChange={(e) => handleProjectSelect(e.target.value)}
              className="w-full h-11 px-4 rounded-xl text-sm text-gray-700 bg-white border-2 border-teal-200/50 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
              disabled={projectsLoading}
            >
              <option value="">{projectsLoading ? "Loading projects..." : "Select a project"}</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.projectId} - {project.projectName}
                </option>
              ))}
            </select>
          </div>

          {/* Project Details */}
          {selectedProject && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-semibold text-gray-600">Project Name:</span>
                  <span className="ml-2 text-gray-800">{selectedProject.projectName}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Project ID:</span>
                  <span className="ml-2 text-gray-800">{selectedProject.projectId}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Cost:</span>
                  <span className="ml-2 text-gray-800">₹{selectedProject.projectCost?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Milestones:</span>
                  <span className="ml-2 text-gray-800">{selectedProject.paymentMilestone}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Status:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(selectedProject.status)}`}>
                    {selectedProject.status?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Category:</span>
                  <span className="ml-2 text-gray-800 capitalize">{selectedProject.category}</span>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <span className="font-semibold text-gray-600">Client:</span>
                  <span className="ml-2 text-gray-800">{selectedProject.client?.name} ({selectedProject.client?.email})</span>
                </div>
              </div>
            </div>
          )}

          {/* Installments Section */}
          {selectedProject && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px w-12 bg-gradient-to-r from-transparent to-teal-300/30"></div>
                  <span className="text-xs font-bold text-teal-600 tracking-widest uppercase whitespace-nowrap">💰 Installments</span>
                  <div className="flex-1 h-px w-12 bg-gradient-to-l from-transparent to-teal-300/30"></div>
                </div>
                <div className="flex gap-2">
                  {installments.length < (selectedProject.paymentMilestone || 0) && (
                    <button
                      onClick={() => {
                        setShowInstallmentForm(!showInstallmentForm);
                        setEditingInstallment(null);
                        resetForm();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Plus size={14} /> Add Installment
                    </button>
                  )}
                </div>
              </div>

              {/* Show remaining slots info */}
              {selectedProject && (
                <div className="mb-4 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {installments.length} of {selectedProject.paymentMilestone} installments added
                  </span>
                  {getRemainingSlots() > 0 && (
                    <span className="text-teal-600 font-semibold">
                      {getRemainingSlots()} slots remaining
                    </span>
                  )}
                  {getRemainingSlots() === 0 && installments.length > 0 && (
                    <span className="text-red-500 font-semibold">
                      Milestone limit reached
                    </span>
                  )}
                </div>
              )}

              {/* Installment Form */}
              {showInstallmentForm && (
                <div className="bg-white rounded-xl border border-teal-200 p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-700">
                      {editingInstallment ? 'Edit Installment' : 'Add New Installment'}
                    </h4>
                    <button
                      onClick={() => {
                        setShowInstallmentForm(false);
                        setEditingInstallment(null);
                        resetForm();
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <form onSubmit={handleSubmitInstallment} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Title</label>
                        <input
                          type="text"
                          name="title"
                          value={installmentForm.title}
                          onChange={handleInputChange}
                          placeholder="e.g., Initial Payment"
                          className="w-full h-10 px-3 rounded-lg text-sm text-gray-700 bg-white border-2 border-teal-200/50 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Type</label>
                        <select
                          name="type"
                          value={installmentForm.type}
                          onChange={handleInputChange}
                          className="w-full h-10 px-3 rounded-lg text-sm text-gray-700 bg-white border-2 border-teal-200/50 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
                        >
                          <option value="amount">Amount (₹)</option>
                          <option value="percentage">Percentage (%)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">
                          {installmentForm.type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'}
                        </label>
                        <input
                          type="number"
                          name="value"
                          value={installmentForm.value}
                          onChange={handleInputChange}
                          placeholder={installmentForm.type === 'percentage' ? 'e.g., 25' : 'e.g., 15000'}
                          min="0"
                          max={installmentForm.type === 'percentage' ? '100' : ''}
                          className="w-full h-10 px-3 rounded-lg text-sm text-gray-700 bg-white border-2 border-teal-200/50 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Due Date</label>
                        <input
                          type="date"
                          name="dueDate"
                          value={installmentForm.dueDate}
                          onChange={handleInputChange}
                          className="w-full h-10 px-3 rounded-lg text-sm text-gray-700 bg-white border-2 border-teal-200/50 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowInstallmentForm(false);
                          setEditingInstallment(null);
                          resetForm();
                        }}
                        className="px-4 py-2 rounded-lg border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                      >
                        {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                        {editingInstallment ? 'Update' : 'Save'} Installment
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Installments List */}
              {installments.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <DollarSign size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">No installments added yet</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Add installments manually or use "Auto Generate" to create from milestones
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {installments.map((installment, index) => (
                    <div key={installment._id || index} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-xs">
                              {index + 1}
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-800">{installment.title}</h5>
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-gray-500">
                                  {installment.type === 'percentage' ? `${installment.value}%` : `₹${installment.value?.toLocaleString()}`}
                                </span>
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-500">
                                  Due: {installment.dueDate ? new Date(installment.dueDate).toLocaleDateString() : 'N/A'}
                                </span>
                                {isDueTomorrow(installment.dueDate) && (
                                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                                    Due Tomorrow
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(installment.status)}`}>
                            {installment.status?.toUpperCase() || 'PENDING'}
                          </span>
                          <button
                            onClick={() => handleEditInstallment(installment)}
                            className="p-1.5 text-gray-400 hover:text-teal-600 transition-colors rounded-lg hover:bg-teal-50"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteInstallment(installment._id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddInstallment;