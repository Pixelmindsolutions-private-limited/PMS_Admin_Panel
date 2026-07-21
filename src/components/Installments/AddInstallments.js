import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FolderPlus, X, CheckCircle, AlertCircle, Loader,
  Calendar, DollarSign, Clock, Plus, Trash2,
  Edit, Save, RefreshCw, Eye, ChevronDown, ChevronUp,
  Bell, Users, Mail, Phone, Send, MessageSquare, Check
} from "lucide-react";

const API_URL = "https://pmsbackend.pixelmindsolutions.com/api/projects/all";
const INSTALLMENT_URL = "https://pmsbackend.pixelmindsolutions.com/api/projects";
const UPCOMING_INSTALLMENTS_URL = "https://pmsbackend.pixelmindsolutions.com/api/projects/upcominginstallments";
const SEND_REMINDER_URL = "https://pmsbackend.pixelmindsolutions.com/api/projects/sendremainder";
const loginDetails = JSON.parse(sessionStorage.getItem("loginDetails"));

const AUTH_TOKEN = loginDetails?.token;

const permission = loginDetails?.modulePermissions?.find(
  (item) => item.component === "installments"
);

const access = permission?.items?.[0]?.permission || [];

const AddInstallment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [installments, setInstallments] = useState([]);
  const [showInstallmentForm, setShowInstallmentForm] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState(null);
  const [showUpcomingModal, setShowUpcomingModal] = useState(false);
  const [upcomingData, setUpcomingData] = useState(null);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [selectedReminderInstallment, setSelectedReminderInstallment] = useState(null);
  const [sendingAllReminders, setSendingAllReminders] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [selectedPaidInstallment, setSelectedPaidInstallment] = useState(null);

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

  // Fetch upcoming installments
  const fetchUpcomingInstallments = async () => {
    try {
      setUpcomingLoading(true);
      const response = await fetch(UPCOMING_INSTALLMENTS_URL, {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setUpcomingData(data.data);
        setShowUpcomingModal(true);
      } else {
        throw new Error(data.message || 'Failed to fetch upcoming installments');
      }
    } catch (error) {
      console.error("Error fetching upcoming installments:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to fetch upcoming installments. Please try again.',
        confirmButtonColor: '#0d9488',
      });
    } finally {
      setUpcomingLoading(false);
    }
  };

  // Mark installment as paid
  const markAsPaid = async (installment) => {
    if (!installment || !selectedProject) return;

    // Check if already paid
    if (installment.status === 'paid') {
      Swal.fire({
        icon: 'info',
        title: 'Already Paid',
        text: 'This installment has already been marked as paid.',
        confirmButtonColor: '#0d9488',
      });
      return;
    }

    // Confirm with user
    const result = await Swal.fire({
      title: 'Mark as Paid?',
      html: `
        <div class="text-left">
          <p class="mb-2">Mark this installment as paid:</p>
          <p class="font-semibold text-gray-800">${installment.title}</p>
          <p class="text-sm text-gray-600">Amount: <span class="font-semibold">${installment.type === 'percentage' ? `${installment.value}%` : `₹${installment.value?.toLocaleString()}`}</span></p>
          <p class="text-sm text-gray-600">Due Date: <span class="font-semibold">${installment.dueDate ? new Date(installment.dueDate).toLocaleDateString() : 'N/A'}</span></p>
          <p class="text-sm text-gray-600 mt-2">Current Status: <span class="font-semibold text-yellow-600">${installment.status?.toUpperCase() || 'PENDING'}</span></p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Mark as Paid',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setMarkingPaid(true);
      setSelectedPaidInstallment(installment);

      const response = await fetch(
        `${INSTALLMENT_URL}/${selectedProject._id}/installments/${installment._id}/mark-paid`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Marked as Paid!',
          text: `Installment "${installment.title}" has been marked as paid successfully.`,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });

        // Refresh project data
        await refreshProjectData();

        // Also refresh upcoming installments if modal is open
        if (showUpcomingModal) {
          await fetchUpcomingInstallments();
        }
      } else {
        throw new Error(data.message || 'Failed to mark installment as paid');
      }
    } catch (error) {
      console.error("Error marking as paid:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to mark installment as paid. Please try again.',
        confirmButtonColor: '#0d9488',
      });
    } finally {
      setMarkingPaid(false);
      setSelectedPaidInstallment(null);
    }
  };

  // Send reminder for all upcoming installments
  const sendAllReminders = async () => {
    if (!upcomingData || !upcomingData.installments || upcomingData.installments.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Installments',
        text: 'There are no upcoming installments to send reminders for.',
        confirmButtonColor: '#0d9488',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Send All Reminders?',
      html: `
        <div class="text-left">
          <p class="mb-2">Send payment reminders to all ${upcomingData.installments.length} clients with upcoming installments:</p>
          <div class="max-h-40 overflow-y-auto bg-gray-50 p-2 rounded">
            ${upcomingData.installments.map((inst, i) => `
              <div class="text-sm py-1 border-b border-gray-200 last:border-0">
                <span class="font-semibold">${inst.clientName}</span> - ${inst.installmentTitle} (${inst.amount})
              </div>
            `).join('')}
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d9488',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Send All',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setSendingAllReminders(true);

      let successCount = 0;
      let failCount = 0;

      // Send reminders one by one
      for (const installment of upcomingData.installments) {
        try {
          const payload = {
            projectId: installment.projectId,
            installmentId: installment.installmentId,
            clientEmail: installment.clientEmail,
            clientName: installment.clientName,
            installmentTitle: installment.installmentTitle,
            amount: installment.amount,
            dueDate: installment.dueDate
          };

          const response = await fetch(SEND_REMINDER_URL, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${AUTH_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
          console.error(`Error sending reminder to ${installment.clientName}:`, error);
        }
      }

      // Show summary
      if (successCount > 0) {
        Swal.fire({
          icon: successCount === upcomingData.installments.length ? 'success' : 'warning',
          title: 'Reminders Sent',
          html: `
            <div class="text-left">
              <p class="mb-1">✅ Successfully sent: <span class="font-semibold text-green-600">${successCount}</span></p>
              <p>❌ Failed to send: <span class="font-semibold text-red-600">${failCount}</span></p>
            </div>
          `,
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to Send Reminders',
          text: 'Unable to send reminders. Please try again later.',
          confirmButtonColor: '#0d9488',
        });
      }

      // Refresh upcoming installments data
      await fetchUpcomingInstallments();
    } catch (error) {
      console.error("Error sending all reminders:", error);
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Unable to connect to the server. Please check your connection and try again.',
        confirmButtonColor: '#0d9488',
      });
    } finally {
      setSendingAllReminders(false);
    }
  };

  // Send reminder for specific installment
  const sendReminder = async (installment) => {
    setSelectedReminderInstallment(installment);

    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Send Reminder?',
      html: `
        <div class="text-left">
          <p class="mb-2">Send payment reminder to:</p>
          <p class="font-semibold text-gray-800">${installment.clientName}</p>
          <p class="text-sm text-gray-600">${installment.clientEmail}</p>
          <p class="text-sm text-gray-600 mt-2">Installment: <span class="font-semibold">${installment.installmentTitle}</span></p>
          <p class="text-sm text-gray-600">Amount: <span class="font-semibold">${installment.amount}</span></p>
          <p class="text-sm text-gray-600">Due Date: <span class="font-semibold">${new Date(installment.dueDate).toLocaleDateString()}</span></p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d9488',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Send Reminder',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      setSelectedReminderInstallment(null);
      return;
    }

    try {
      setSendingReminder(true);

      const payload = {
        projectId: installment.projectId,
        installmentId: installment.installmentId,
        clientEmail: installment.clientEmail,
        clientName: installment.clientName,
        installmentTitle: installment.installmentTitle,
        amount: installment.amount,
        dueDate: installment.dueDate
      };

      const response = await fetch(SEND_REMINDER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Reminder Sent!',
          text: `Reminder sent to ${installment.clientName} successfully.`,
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });

        // Refresh upcoming installments data
        await fetchUpcomingInstallments();
      } else {
        // Handle error - the API returned 500, so we'll show a user-friendly message
        Swal.fire({
          icon: 'warning',
          title: 'Unable to Send Reminder',
          text: 'The reminder service is currently unavailable. Please try again later or contact support.',
          confirmButtonColor: '#0d9488',
          confirmButtonText: 'OK'
        });
        console.error('Reminder API Error:', data);
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Unable to connect to the server. Please check your connection and try again.',
        confirmButtonColor: '#0d9488',
      });
    } finally {
      setSendingReminder(false);
      setSelectedReminderInstallment(null);
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

  // Check if due date is today or overdue
  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/90 via-white to-teal-100/70">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30 flex-shrink-0">
              <DollarSign className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight">Manage Installments</h1>
              <p className="text-xs sm:text-sm text-gray-500">Add and manage project payment installments</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {(loginDetails?.role === "Admin" || access.includes("view")) && (
              <button
                onClick={fetchUpcomingInstallments}
                disabled={upcomingLoading}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl flex-1 sm:flex-none disabled:opacity-60"
              >
                {upcomingLoading ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Bell size={14} />
                )}
                <span className="hidden xs:inline">Upcoming</span> Installments
              </button>
            )}
            {(loginDetails?.role === "Admin" || access.includes("export")) && (
              <button
                onClick={sendAllReminders}
                disabled={sendingAllReminders || !upcomingData || upcomingData.installments?.length === 0}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-teal-500/30 transition-all hover:shadow-xl flex-1 sm:flex-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sendingAllReminders ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Send Reminder
              </button>
            )}
            <button
              onClick={() => navigate("/projects")}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white border border-gray-200 hover:border-teal-300 text-gray-600 font-semibold text-xs sm:text-sm hover:shadow-md transition-all flex-1 sm:flex-none"
            >
              ← <span className="hidden xs:inline">Back</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-teal-200/30 shadow-xl p-4 sm:p-6 lg:p-8">

          {/* Project Selection */}
          <div className="mb-4 sm:mb-6">
            <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 block">Select Project</label>
            <select
              value={selectedProject?._id || ""}
              onChange={(e) => handleProjectSelect(e.target.value)}
              className="w-full h-10 sm:h-11 px-3 sm:px-4 rounded-xl text-xs sm:text-sm text-gray-700 bg-white border-2 border-teal-200/50 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
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
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div>
                  <span className="font-semibold text-gray-600">Project Name:</span>
                  <span className="ml-2 text-gray-800 break-words">{selectedProject.projectName}</span>
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
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${getStatusBadge(selectedProject.status)}`}>
                    {selectedProject.status?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Category:</span>
                  <span className="ml-2 text-gray-800 capitalize">{selectedProject.category}</span>
                </div>
                <div className="col-span-1 xs:col-span-2">
                  <span className="font-semibold text-gray-600">Client:</span>
                  <span className="ml-2 text-gray-800 break-words">{selectedProject.client?.name} ({selectedProject.client?.email})</span>
                </div>
              </div>
            </div>
          )}

          {/* Installments Section */}
          {selectedProject && (
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-1 h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-teal-300/30"></div>
                  <span className="text-[10px] sm:text-xs font-bold text-teal-600 tracking-widest uppercase whitespace-nowrap">💰 Installments</span>
                  <div className="flex-1 h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-teal-300/30"></div>
                </div>
                {(loginDetails?.role === "Admin" || access.includes("add")) && (
                  <div className="flex gap-1 sm:gap-2 ml-2">
                    {installments.length < (selectedProject.paymentMilestone || 0) && (
                      <button
                        onClick={() => {
                          setShowInstallmentForm(!showInstallmentForm);
                          setEditingInstallment(null);
                          resetForm();
                        }}
                        className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] sm:text-xs font-semibold transition-colors"
                      >
                        <Plus size={12} /> <span className="hidden xs:inline">Add</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Show remaining slots info */}
              {selectedProject && (
                <div className="mb-3 sm:mb-4 flex flex-wrap items-center justify-between gap-1 text-[10px] sm:text-xs">
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
                <div className="bg-white rounded-xl border border-teal-200 p-3 sm:p-4 mb-3 sm:mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-700 text-sm sm:text-base">
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
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                      <div>
                        <label className="text-[10px] sm:text-xs font-semibold text-gray-600 block mb-1">Title</label>
                        <input
                          type="text"
                          name="title"
                          value={installmentForm.title}
                          onChange={handleInputChange}
                          placeholder="e.g., Initial Payment"
                          className="w-full h-9 sm:h-10 px-2 sm:px-3 rounded-lg text-xs sm:text-sm text-gray-700 bg-white border-2 border-teal-200/50 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] sm:text-xs font-semibold text-gray-600 block mb-1">Type</label>
                        <select
                          name="type"
                          value={installmentForm.type}
                          onChange={handleInputChange}
                          className="w-full h-9 sm:h-10 px-2 sm:px-3 rounded-lg text-xs sm:text-sm text-gray-700 bg-white border-2 border-teal-200/50 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
                        >
                          <option value="amount">Amount (₹)</option>
                          <option value="percentage">Percentage (%)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] sm:text-xs font-semibold text-gray-600 block mb-1">
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
                          className="w-full h-9 sm:h-10 px-2 sm:px-3 rounded-lg text-xs sm:text-sm text-gray-700 bg-white border-2 border-teal-200/50 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] sm:text-xs font-semibold text-gray-600 block mb-1">Due Date</label>
                        <input
                          type="date"
                          name="dueDate"
                          value={installmentForm.dueDate}
                          onChange={handleInputChange}
                          className="w-full h-9 sm:h-10 px-2 sm:px-3 rounded-lg text-xs sm:text-sm text-gray-700 bg-white border-2 border-teal-200/50 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowInstallmentForm(false);
                          setEditingInstallment(null);
                          resetForm();
                        }}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border-2 border-gray-200 text-gray-600 text-xs sm:text-sm font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors disabled:opacity-60"
                      >
                        {loading ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                        {editingInstallment ? 'Update' : 'Save'} Installment
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Installments List */}
              {installments.length === 0 ? (
                <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <DollarSign size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-xs sm:text-sm">No installments added yet</p>
                  <p className="text-gray-400 text-[10px] sm:text-xs mt-1">
                    Add installments manually or use "Auto Generate" to create from milestones
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {installments.map((installment, index) => (
                    <div key={installment._id || index} className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 xs:gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            {/* Left Side */}
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-[10px] sm:text-xs flex-shrink-0">
                                {index + 1}
                              </div>

                              <div className="min-w-0 flex-1">
                                <h5 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                                  {installment.title}
                                </h5>

                                <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs">
                                  <span className="text-gray-500">
                                    {installment.type === "percentage"
                                      ? `${installment.value}%`
                                      : `₹${installment.value?.toLocaleString()}`}
                                  </span>

                                  <span className="text-gray-300 hidden xs:inline">|</span>

                                  <span className="text-gray-500">
                                    Due:{" "}
                                    {installment.dueDate
                                      ? new Date(installment.dueDate).toLocaleDateString()
                                      : "N/A"}
                                  </span>

                                  {isDueTomorrow(installment.dueDate) &&
                                    installment.status !== "paid" && (
                                      <span className="px-1.5 sm:px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[8px] sm:text-[10px] font-semibold">
                                        Due Tomorrow
                                      </span>
                                    )}

                                  {isOverdue(installment.dueDate) &&
                                    installment.status !== "paid" && (
                                      <span className="px-1.5 sm:px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[8px] sm:text-[10px] font-semibold animate-pulse">
                                        Overdue
                                      </span>
                                    )}
                                </div>
                              </div>
                            </div>

                            {/* Right Side */}
                            {installment.status !== "paid" && (
                              <>
                                {(loginDetails?.role === "Admin" || access.includes("edit")) && (
                                  <button
                                    onClick={() => markAsPaid(installment)}
                                    disabled={
                                      markingPaid &&
                                      selectedPaidInstallment?._id === installment._id
                                    }
                                    className="shrink-0 flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[8px] sm:text-[10px] font-semibold transition-colors disabled:opacity-60"
                                    title="Mark as Paid"
                                  >
                                    {markingPaid &&
                                      selectedPaidInstallment?._id === installment._id ? (
                                      <Loader size={12} className="animate-spin" />
                                    ) : (
                                      <Check size={12} />
                                    )}

                                    <span className="hidden sm:inline">Mark Paid</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 flex-wrap">
                          <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-semibold ${getStatusBadge(installment.status)}`}>
                            {installment.status?.toUpperCase() || 'PENDING'}
                          </span>

                          {/* Edit Button */}
                          {(loginDetails?.role === "Admin" || access.includes("edit")) && (
                            <button
                              onClick={() => handleEditInstallment(installment)}
                              className="p-1 sm:p-1.5 text-gray-400 hover:text-teal-600 transition-colors rounded-lg hover:bg-teal-50"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                          )}

                          {/* Delete Button */}
                          {(loginDetails?.role === "Admin" || access.includes("delete")) && (
                            <button
                              onClick={() => handleDeleteInstallment(installment._id)}
                              className="p-1 sm:p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}


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

      {/* Upcoming Installments Modal */}
      {showUpcomingModal && upcomingData && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 bg-gradient-to-r from-orange-50 to-red-50">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
                  <Bell className="text-white" size={18} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-800">Upcoming Installments</h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {upcomingData.total} installment{upcomingData.total > 1 ? 's' : ''} due on {upcomingData.dueDate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUpcomingModal(false)}
                className="p-1.5 sm:p-2 hover:bg-white/50 rounded-xl transition-colors self-end sm:self-center"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)]">
              {upcomingData.installments && upcomingData.installments.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {upcomingData.installments.map((installment, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl p-3 sm:p-5 hover:shadow-lg transition-all hover:border-orange-200">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-[10px] sm:text-xs flex-shrink-0">
                              {index + 1}
                            </div>
                            <h3 className="text-sm sm:text-lg font-semibold text-gray-800 truncate">{installment.installmentTitle}</h3>
                          </div>

                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-3">
                            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm min-w-0">
                              <FolderPlus size={12} className="text-gray-400 flex-shrink-0" />
                              <span className="text-gray-600 truncate">Project:</span>
                              <span className="font-medium text-gray-800 truncate">{installment.projectName}</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm">
                              <span className="text-gray-600">ID:</span>
                              <span className="font-medium text-gray-800 truncate">{installment.projectId}</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm min-w-0">
                              <Users size={12} className="text-gray-400 flex-shrink-0" />
                              <span className="text-gray-600 truncate">Client:</span>
                              <span className="font-medium text-gray-800 truncate">{installment.clientName}</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm min-w-0">
                              <Mail size={12} className="text-gray-400 flex-shrink-0" />
                              <span className="text-gray-600 truncate hidden xs:inline">Email:</span>
                              <span className="font-medium text-gray-800 truncate">{installment.clientEmail}</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm min-w-0">
                              <Phone size={12} className="text-gray-400 flex-shrink-0" />
                              <span className="text-gray-600 truncate hidden xs:inline">Mobile:</span>
                              <span className="font-medium text-gray-800 truncate">{installment.clientMobile}</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm">
                              <DollarSign size={12} className="text-gray-400 flex-shrink-0" />
                              <span className="text-gray-600">Amount:</span>
                              <span className="font-medium text-gray-800">{installment.amount}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 md:gap-2 flex-wrap">
                          <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-xs font-semibold ${getStatusBadge(installment.status)}`}>
                            {installment.status?.toUpperCase() || 'PENDING'}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500">
                            <Calendar size={12} />
                            <span>Due: {new Date(installment.dueDate).toLocaleDateString()}</span>
                          </div>
                          {isDueTomorrow(installment.dueDate) && (
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-orange-100 text-orange-700 rounded-full text-[8px] sm:text-xs font-semibold animate-pulse">
                              ⚡ Due Tomorrow
                            </span>
                          )}
                          <div className="flex flex-col xs:flex-row gap-1 w-full md:w-auto">
                            {installment.status !== 'paid' && (
                              <button
                                onClick={() => markAsPaid(installment)}
                                disabled={markingPaid && selectedPaidInstallment?.installmentId === installment.installmentId}
                                className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[8px] sm:text-[10px] font-semibold transition-colors disabled:opacity-60 w-full md:w-auto justify-center"
                              >
                                {markingPaid && selectedPaidInstallment?.installmentId === installment.installmentId ? (
                                  <Loader size={12} className="animate-spin" />
                                ) : (
                                  <Check size={12} />
                                )}
                                <span>Mark Paid</span>
                              </button>
                            )}
                            <button
                              onClick={() => sendReminder(installment)}
                              disabled={sendingReminder && selectedReminderInstallment?.installmentId === installment.installmentId}
                              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg text-[8px] sm:text-[10px] font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed w-full md:w-auto justify-center"
                            >
                              {sendingReminder && selectedReminderInstallment?.installmentId === installment.installmentId ? (
                                <Loader size={12} className="animate-spin" />
                              ) : (
                                <Send size={12} />
                              )}
                              <span>Send Reminder</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={28} className="text-green-500" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-700">No Upcoming Installments</h3>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">All installments are up to date!</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex flex-col xs:flex-row justify-end gap-2">
              <button
                onClick={() => setShowUpcomingModal(false)}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold text-xs sm:text-sm transition-colors w-full xs:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        @media (max-width: 400px) {
          .xs\\:inline {
            display: inline !important;
          }
        }
        /* Ensure modal is above everything */
        .fixed {
          z-index: 9999 !important;
        }
      `}</style>
    </div>
  );
};

export default AddInstallment;