import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FolderPlus, X, CheckCircle, AlertCircle, Loader, UserPlus, UserMinus, Package, TrendingUp, Share2, Search, Image, Megaphone, Clock } from "lucide-react";

const API_URL = "https://pmsbackend.pixelmindsolutions.com/api/projects/create";
const CLIENTS_URL = "https://pmsbackend.pixelmindsolutions.com/api/clients/all";
const STAFF_URL = "https://pmsbackend.pixelmindsolutions.com/api/staff/options";
const MARKETING_PLANS_URL = "https://pmsbackend.pixelmindsolutions.com/api/digitalmarketing/plans";
const adminDetails = JSON.parse(sessionStorage.getItem("adminDetails"));
const AUTH_TOKEN = adminDetails?.token;

// Marketing Service Options (kept for reference/display only - not sent as-is to backend)
const MARKETING_SERVICES = [
  { id: "social_media", label: "Social Media Management" },
  { id: "seo", label: "SEO Optimization" },
  { id: "content", label: "Content Creation" },
  { id: "ppc", label: "Pay-Per-Click Advertising" },
  { id: "email", label: "Email Marketing" },
  { id: "analytics", label: "Analytics & Reporting" },
  { id: "social_ads", label: "Social Media Advertising" },
  { id: "influencer", label: "Influencer Marketing" },
  { id: "video", label: "Video Marketing" },
  { id: "reputation", label: "Online Reputation Management" },
];

// Development Phases with default days (will be overridden by calculated values)
const DEVELOPMENT_PHASES = [
  { id: "designing", label: "Design", defaultDays: 15 },
  { id: "frontend", label: "Frontend", defaultDays: 25 },
  { id: "backend", label: "Backend", defaultDays: 30 },
  { id: "testing", label: "Testing", defaultDays: 20 },
  { id: "deployment", label: "Deployment", defaultDays: 10 }
];

const AddProject = () => {
  const navigate = useNavigate();

  const [projectType, setProjectType] = useState("software");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);

  // Digital Marketing State
  const [marketingPlans, setMarketingPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedDurationId, setSelectedDurationId] = useState("");
  const [marketingWorkDays, setMarketingWorkDays] = useState("");

  const [formData, setFormData] = useState({
    clientId: "",
    projectName: "",
    projectStartDate: "",
    projectEndDate: "",
    deadline: "",
    projectCost: "",
    paymentMilestone: "",
    status: "active",
    category: "software",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Work Division in Days
  const [workDivision, setWorkDivision] = useState(() => {
    const division = {};
    DEVELOPMENT_PHASES.forEach(phase => {
      division[phase.id] = phase.defaultDays;
    });
    return division;
  });

  // Team Assignment
  const [teamAssignment, setTeamAssignment] = useState(() => {
    const assignment = {};
    DEVELOPMENT_PHASES.forEach(phase => {
      assignment[phase.id] = [];
    });
    return assignment;
  });

  // Marketing team
  const [marketingTeam, setMarketingTeam] = useState({
    marketing: {
      members: [],
      selectedEmployee: ""
    }
  });

  const [detailErrors, setDetailErrors] = useState({});

  // Fetch clients, staff, and marketing plans
  useEffect(() => {
    fetchClients();
    fetchStaff();
    fetchMarketingPlans();
  }, []);

  // Calculate total days when dates change
  useEffect(() => {
    if (formData.projectStartDate && formData.deadline) {
      const totalDays = calculateTotalDays();
      if (totalDays > 0) {
        // Distribute days proportionally based on default weights
        const totalDefaultDays = DEVELOPMENT_PHASES.reduce((sum, phase) => sum + phase.defaultDays, 0);
        const newDivision = {};
        DEVELOPMENT_PHASES.forEach(phase => {
          const proportion = phase.defaultDays / totalDefaultDays;
          newDivision[phase.id] = Math.round(totalDays * proportion);
        });

        // Adjust to ensure sum equals totalDays
        const sum = Object.values(newDivision).reduce((a, b) => a + b, 0);
        if (sum !== totalDays) {
          const diff = totalDays - sum;
          newDivision[DEVELOPMENT_PHASES[0].id] += diff;
        }

        setWorkDivision(newDivision);

        // Default the marketing work days to the same total (editable by the user)
        setMarketingWorkDays(prev => (prev === "" ? totalDays.toString() : prev));
      }
    }
  }, [formData.projectStartDate, formData.deadline]);

  const fetchClients = async () => {
    try {
      const response = await fetch(CLIENTS_URL, {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success && data.data) {
        setClients(data.data);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setClientsLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await fetch(STAFF_URL, {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success && data.data) {
        setStaff(data.data);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setStaffLoading(false);
    }
  };

  const fetchMarketingPlans = async () => {
    try {
      const response = await fetch(MARKETING_PLANS_URL, {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success && data.data) {
        setMarketingPlans(data.data.filter(plan => plan.isActive !== false));
      }
    } catch (error) {
      console.error("Error fetching marketing plans:", error);
    } finally {
      setPlansLoading(false);
    }
  };

  // Validation functions
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "clientId":
        if (!value) error = "Please select a client";
        break;
      case "projectName":
        if (!value.trim()) error = "Project name is required";
        else if (value.trim().length < 3) error = "Project name must be at least 3 characters";
        break;
      case "projectStartDate":
        if (!value) error = "Start date is required";
        break;
      case "projectEndDate":
        if (!value) error = "End date is required";
        else if (formData.projectStartDate && new Date(value) < new Date(formData.projectStartDate)) {
          error = "End date cannot be before start date";
        }
        break;
      case "deadline":
        if (!value) error = "Deadline is required";
        else if (formData.projectStartDate && new Date(value) < new Date(formData.projectStartDate)) {
          error = "Deadline cannot be before start date";
        } else if (formData.projectEndDate && new Date(value) > new Date(formData.projectEndDate)) {
          error = "Deadline cannot be after end date";
        }
        break;
      case "projectCost":
        if (!value) error = "Project cost is required";
        else if (Number(value) < 0) error = "Project cost cannot be negative";
        break;
      case "paymentMilestone":
        if (!value) error = "Payment milestones are required";
        else if (Number(value) < 0 || !Number.isInteger(Number(value))) {
          error = "Payment milestones must be a positive integer";
        }
        break;
      default:
        break;
    }

    return error;
  };

  const validateForm = () => {
    const newErrors = {};
    const fields = ['clientId', 'projectName', 'projectStartDate', 'projectEndDate', 'deadline', 'projectCost', 'paymentMilestone'];
    fields.forEach(field => {
      newErrors[field] = validateField(field, formData[field]);
    });

    setErrors(newErrors);
    const hasErrors = Object.values(newErrors).some(error => error);
    return !hasErrors;
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleClientSelect = (e) => {
    const clientId = e.target.value;
    setFormData({ ...formData, clientId });
    const client = clients.find(c => c._id === clientId);
    setSelectedClient(client);
    if (touched.clientId) {
      const error = validateField("clientId", clientId);
      setErrors(prev => ({ ...prev, clientId: error }));
    }
  };

  // Calculate total days between start date and deadline
  const calculateTotalDays = () => {
    if (formData.projectStartDate && formData.deadline) {
      const start = new Date(formData.projectStartDate);
      const end = new Date(formData.deadline);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  // Handle work division change (in days)
  const handleWorkDivisionChange = (phaseId, value) => {
    const numValue = parseInt(value) || 0;
    const totalDays = calculateTotalDays();

    // Calculate current sum of other phases
    const currentSum = Object.entries(workDivision)
      .filter(([id]) => id !== phaseId)
      .reduce((sum, [_, val]) => sum + val, 0);

    // Allow values up to remaining days
    const maxAllowed = totalDays - currentSum;
    const finalValue = Math.min(maxAllowed, Math.max(0, numValue));

    setWorkDivision(prev => ({
      ...prev,
      [phaseId]: finalValue
    }));
  };

  // Get available staff for phase
  const getAvailableStaffForPhase = (phaseId) => {
    const assigned = teamAssignment[phaseId] || [];
    const assignedIds = assigned.map(s => s.employeeId);

    // Filter staff by role (you can customize this mapping)
    return staff.filter(s => !assignedIds.includes(s.employeeId));
  };

  // Add team member to phase
  const addTeamMember = (phaseId, employeeId) => {
    if (!employeeId) return;
    const employee = staff.find(s => s.employeeId === employeeId);
    if (!employee) return;

    const currentMembers = teamAssignment[phaseId] || [];
    if (!currentMembers.find(m => m.employeeId === employee.employeeId)) {
      setTeamAssignment(prev => ({
        ...prev,
        [phaseId]: [...currentMembers, {
          employeeId: employee.employeeId,
          name: employee.employeeName,
          role: phaseId
        }]
      }));
    }
  };

  // Remove team member from phase
  const removeTeamMember = (phaseId, employeeId) => {
    setTeamAssignment(prev => ({
      ...prev,
      [phaseId]: prev[phaseId].filter(m => m.employeeId !== employeeId)
    }));
  };

  // Derived: currently selected plan and duration objects
  const selectedPlanObj = marketingPlans.find(p => p._id === selectedPlanId) || null;
  const selectedDurationObj = selectedPlanObj?.durations.find(d => d._id === selectedDurationId) || null;

  // Select a marketing plan (resets duration since durations differ per plan)
  const handlePlanSelect = (planId) => {
    setSelectedPlanId(planId);
    setSelectedDurationId("");
    setFormData(prev => ({ ...prev, projectCost: "" }));
  };

  // Select a duration within the chosen plan (sets project cost from plan price)
  const handleDurationSelect = (durationId) => {
    setSelectedDurationId(durationId);
    const plan = marketingPlans.find(p => p._id === selectedPlanId);
    const duration = plan?.durations.find(d => d._id === durationId);
    if (duration) {
      setFormData(prev => ({ ...prev, projectCost: duration.price.toString() }));
    }
    if (touched.projectCost) {
      setErrors(prev => ({ ...prev, projectCost: "" }));
    }
  };

  // Marketing team management
  const addMarketingTeamMember = () => {
    const team = marketingTeam.marketing;
    if (!team.selectedEmployee) return;

    const employee = staff.find(s => s.employeeId === team.selectedEmployee);
    if (!employee) return;

    if (!team.members.find(m => m.employeeId === employee.employeeId)) {
      setMarketingTeam(prev => ({
        ...prev,
        marketing: {
          ...prev.marketing,
          members: [...prev.marketing.members, {
            employeeId: employee.employeeId,
            name: employee.employeeName,
            role: "marketing"
          }],
          selectedEmployee: ""
        }
      }));
    }
  };

  const removeMarketingTeamMember = (employeeId) => {
    setMarketingTeam(prev => ({
      ...prev,
      marketing: {
        ...prev.marketing,
        members: prev.marketing.members.filter(m => m.employeeId !== employeeId)
      }
    }));
  };

  const handleMarketingEmployeeSelect = (employeeId) => {
    setMarketingTeam(prev => ({
      ...prev,
      marketing: {
        ...prev.marketing,
        selectedEmployee: employeeId
      }
    }));
  };

  const getAvailableMarketingStaff = () => {
    const assignedIds = marketingTeam.marketing.members.map(m => m.employeeId);
    return staff.filter(s => !assignedIds.includes(s.employeeId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allFields = ['clientId', 'projectName', 'projectStartDate', 'projectEndDate', 'deadline', 'projectCost', 'paymentMilestone'];
    const touchedFields = {};
    allFields.forEach(field => { touchedFields[field] = true; });
    setTouched(touchedFields);

    if (!validateForm()) {
      const errorMessages = Object.values(errors).filter(e => e);
      if (errorMessages.length > 0) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: errorMessages[0],
          confirmButtonColor: '#0d9488',
        });
      }
      return;
    }

    // Validate team assignment for software projects
    if (projectType === "software" || projectType === "website" || projectType === "app") {
      let hasMissingTeam = false;
      DEVELOPMENT_PHASES.forEach(phase => {
        if (teamAssignment[phase.id].length === 0) {
          hasMissingTeam = true;
        }
      });
      if (hasMissingTeam) {
        Swal.fire({
          icon: 'error',
          title: 'Team Required',
          text: 'Please assign at least one team member to each phase.',
          confirmButtonColor: '#0d9488',
        });
        return;
      }
    }

    // Validate plan/duration/team for digital marketing projects
    if (projectType === "digital_marketing") {
      if (!selectedPlanId || !selectedDurationId) {
        Swal.fire({
          icon: 'error',
          title: 'Plan Required',
          text: 'Please select a marketing plan and duration.',
          confirmButtonColor: '#0d9488',
        });
        return;
      }
      if (!marketingWorkDays || Number(marketingWorkDays) <= 0) {
        Swal.fire({
          icon: 'error',
          title: 'Work Days Required',
          text: 'Please enter the marketing work days.',
          confirmButtonColor: '#0d9488',
        });
        return;
      }
      if (marketingTeam.marketing.members.length === 0) {
        Swal.fire({
          icon: 'error',
          title: 'Team Required',
          text: 'Please assign at least one marketing team member.',
          confirmButtonColor: '#0d9488',
        });
        return;
      }
    }

    setLoading(true);

    try {
      // Build the payload matching the backend API structure
      const payload = {
        clientId: formData.clientId,
        projectName: formData.projectName.trim(),
        projectCost: Number(formData.projectCost),
        projectStartDate: formData.projectStartDate,
        projectEndDate: formData.projectEndDate,
        deadline: formData.deadline,
        paymentMilestone: Number(formData.paymentMilestone),
        category: projectType === "digital_marketing" ? "digital marketing" : projectType,
      };

      // Add workDivision and teamAssignment for software/website/app projects
      if (projectType === "software" || projectType === "website" || projectType === "app") {
        // Ensure workDivision values sum to total days
        const totalDays = calculateTotalDays();
        const totalWorkDays = Object.values(workDivision).reduce((sum, val) => sum + val, 0);

        if (totalDays === 0) {
          Swal.fire({
            icon: 'error',
            title: 'Invalid Timeline',
            text: 'Please set a valid start date and deadline.',
            confirmButtonColor: '#0d9488',
          });
          setLoading(false);
          return;
        }

        if (totalWorkDays !== totalDays) {
          Swal.fire({
            icon: 'error',
            title: 'Work Division Error',
            text: `Total days (${totalWorkDays}) must equal the project duration (${totalDays} days).`,
            confirmButtonColor: '#0d9488',
          });
          setLoading(false);
          return;
        }

        payload.workDivision = workDivision;
        payload.teamAssignment = teamAssignment;
      }

      // Add digital marketing details matching /api/digitalmarketing/plans contract
      if (projectType === "digital_marketing") {
        payload.digitalMarketing = {
          planId: selectedPlanObj._id,
          duration: selectedDurationObj.duration,
        };
        payload.workDivision = {
          marketing: Number(marketingWorkDays),
        };
        payload.teamAssignment = {
          marketing: marketingTeam.marketing.members,
        };
      }

      // Log the payload for debugging
      console.log("Sending payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${AUTH_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success !== false) {
        Swal.fire({
          icon: 'success',
          title: 'Project Created!',
          text: `Project "${data.data?.projectName || formData.projectName}" has been created successfully.`,
          confirmButtonColor: '#0d9488',
          timer: 2000,
          timerProgressBar: true,
        }).then(() => {
          navigate("/projects");
        });
      } else {
        const msg = data.errors ? data.errors.join(", ") : data.message || "Failed to create project.";
        Swal.fire({
          icon: 'error',
          title: 'Creation Failed',
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

  const typeButtons = [
    { value: "website", label: "Website" },
    { value: "app", label: "App" },
    { value: "software", label: "Software" },
    { value: "digital_marketing", label: "Digital Marketing" },
  ];

  const duration = calculateTotalDays();
  const totalWorkDays = Object.values(workDivision).reduce((sum, val) => sum + val, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/90 via-white to-teal-100/70">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <FolderPlus className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight">Create Project</h1>
              <p className="text-sm text-gray-500">Launch projects with complete team management</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/projects")}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-teal-300 text-gray-600 font-semibold text-sm hover:shadow-md transition-all w-full sm:w-auto"
          >
            ← Back
          </button>
        </div>

        {/* Main Form */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-teal-200/30 shadow-xl p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Client Selection */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-teal-300/30"></div>
                <span className="text-xs font-bold text-teal-600 tracking-widest uppercase whitespace-nowrap">👤 Client Selection</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-teal-300/30"></div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Select Client</label>
                  <select
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleClientSelect}
                    onBlur={() => handleBlur("clientId")}
                    className={`w-full h-11 px-4 rounded-xl text-sm text-gray-700 bg-white border-2 ${
                      errors.clientId && touched.clientId ? 'border-red-400 focus:border-red-500' : 'border-teal-200/50 focus:border-teal-500'
                    } focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all`}
                    disabled={clientsLoading}
                  >
                    <option value="">{clientsLoading ? "Loading clients..." : "Select a client"}</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.name} - {client.mobile}
                      </option>
                    ))}
                  </select>
                  {touched.clientId && errors.clientId && (
                    <p className="text-xs text-red-500 mt-1">{errors.clientId}</p>
                  )}
                </div>

                {/* Client Details */}
                {selectedClient && (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div><span className="font-semibold text-gray-600">Name:</span> <span className="ml-2 text-gray-800">{selectedClient.name}</span></div>
                      <div><span className="font-semibold text-gray-600">Mobile:</span> <span className="ml-2 text-gray-800">{selectedClient.mobile}</span></div>
                      <div><span className="font-semibold text-gray-600">Email:</span> <span className="ml-2 text-gray-800">{selectedClient.email}</span></div>
                      <div><span className="font-semibold text-gray-600">Lead:</span> <span className="ml-2 text-gray-800">{selectedClient.lead}</span></div>
                      <div className="col-span-1 sm:col-span-2">
                        <span className="font-semibold text-gray-600">Address:</span> <span className="ml-2 text-gray-800">{selectedClient.address}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Project Details */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-teal-300/30"></div>
                <span className="text-xs font-bold text-teal-600 tracking-widest uppercase whitespace-nowrap">📋 Project Details</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-teal-300/30"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  name="projectName"
                  label="Project Name"
                  placeholder="Enter project name"
                  value={formData.projectName}
                  onChange={handleChange}
                  onBlur={() => handleBlur("projectName")}
                  error={touched.projectName && errors.projectName}
                  required
                />
                <InputField
                  name="projectStartDate"
                  label="Start Date"
                  type="date"
                  value={formData.projectStartDate}
                  onChange={handleChange}
                  onBlur={() => handleBlur("projectStartDate")}
                  error={touched.projectStartDate && errors.projectStartDate}
                  required
                />
                <InputField
                  name="projectEndDate"
                  label="End Date"
                  type="date"
                  value={formData.projectEndDate}
                  onChange={handleChange}
                  onBlur={() => handleBlur("projectEndDate")}
                  error={touched.projectEndDate && errors.projectEndDate}
                  required
                />
                <InputField
                  name="deadline"
                  label="Deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleChange}
                  onBlur={() => handleBlur("deadline")}
                  error={touched.deadline && errors.deadline}
                  required
                />
                <InputField
                  name="projectCost"
                  label="Project Cost (₹)"
                  type="number"
                  placeholder="0"
                  value={formData.projectCost}
                  onChange={handleChange}
                  onBlur={() => handleBlur("projectCost")}
                  error={touched.projectCost && errors.projectCost}
                  required
                  readOnly={projectType === "digital_marketing" && !!selectedDurationObj}
                />
                <InputField
                  name="paymentMilestone"
                  label="Payment Milestones"
                  type="number"
                  placeholder="0"
                  value={formData.paymentMilestone}
                  onChange={handleChange}
                  onBlur={() => handleBlur("paymentMilestone")}
                  error={touched.paymentMilestone && errors.paymentMilestone}
                  required
                />
              </div>

              {/* Duration Display */}
              {duration > 0 && (
                <div className="mt-4 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        <Clock size={16} className="inline mr-2 text-teal-600" />
                        Project Timeline
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        From {formData.projectStartDate} to {formData.deadline}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-teal-700">{duration}</span>
                      <span className="text-xs text-gray-500 ml-1">days</span>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Project Type */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-teal-300/30"></div>
                <span className="text-xs font-bold text-teal-600 tracking-widest uppercase whitespace-nowrap">🏷️ Project Type</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-teal-300/30"></div>
              </div>

              <div className="flex flex-wrap gap-2">
                {typeButtons.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setProjectType(t.value)}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      projectType === t.value
                        ? "bg-teal-600 text-white shadow-lg shadow-teal-500/30"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Software/Website/App Development */}
            {(projectType === "software" || projectType === "website" || projectType === "app") && (
              <div className="bg-white/60 rounded-2xl border border-teal-200/30 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-teal-300/30"></div>
                  <span className="text-xs font-bold text-teal-600 tracking-widest uppercase whitespace-nowrap">⚙️ Development Phases</span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-teal-300/30"></div>
                </div>

                {/* Work Division in Days */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Work Division (Days)</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {DEVELOPMENT_PHASES.map((phase) => (
                      <div key={phase.id}>
                        <label className="text-xs font-medium text-gray-600 block mb-1 capitalize">{phase.label}</label>
                        <input
                          type="number"
                          min="0"
                          value={workDivision[phase.id]}
                          onChange={(e) => handleWorkDivisionChange(phase.id, e.target.value)}
                          className="w-full h-10 px-3 rounded-lg text-sm text-gray-700 bg-white border-2 border-teal-200/50 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <span className={`text-sm font-medium ${totalWorkDays === duration ? 'text-green-600' : 'text-red-500'}`}>
                      Total: {totalWorkDays} days
                    </span>
                    <span className={`text-sm font-medium ${totalWorkDays === duration ? 'text-green-600' : 'text-red-500'}`}>
                      {totalWorkDays === duration ? '✓ Balanced' : `Needs ${duration - totalWorkDays} more days`}
                    </span>
                  </div>
                  {duration === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Please set start date and deadline to calculate days
                    </p>
                  )}
                </div>

                {/* Team Assignment */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Team Assignment</h4>
                  {DEVELOPMENT_PHASES.map((phase) => {
                    const availableStaff = getAvailableStaffForPhase(phase.id);
                    return (
                      <div key={phase.id} className="mb-4 last:mb-0 p-4 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-bold text-gray-700 capitalize">{phase.label} Team</h5>
                          <span className="text-xs text-gray-500">{teamAssignment[phase.id].length} members</span>
                        </div>

                        <div className="flex gap-2 mb-3">
                          <select
                            value=""
                            onChange={(e) => addTeamMember(phase.id, e.target.value)}
                            className="flex-1 h-9 px-3 rounded-lg text-sm text-gray-700 bg-white border-2 border-teal-200/50 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
                            disabled={staffLoading || availableStaff.length === 0}
                          >
                            <option value="">{staffLoading ? "Loading staff..." : availableStaff.length === 0 ? "No staff available" : "Select staff..."}</option>
                            {availableStaff.map((s) => (
                              <option key={s.employeeId} value={s.employeeId}>
                                {s.employeeName} ({s.role})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const select = document.querySelector(`[data-phase="${phase.id}"]`);
                              if (select && select.value) {
                                addTeamMember(phase.id, select.value);
                                select.value = "";
                              }
                            }}
                            className="flex items-center gap-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            <UserPlus size={14} /> Add
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {teamAssignment[phase.id].length === 0 ? (
                            <span className="text-xs text-gray-400 italic">No members assigned</span>
                          ) : (
                            teamAssignment[phase.id].map((member) => (
                              <span
                                key={member.employeeId}
                                className="flex items-center gap-1.5 bg-teal-100 text-teal-700 px-3 py-1.5 rounded-full text-xs font-semibold"
                              >
                                {member.name}
                                <button
                                  type="button"
                                  onClick={() => removeTeamMember(phase.id, member.employeeId)}
                                  className="hover:text-red-500 transition-colors ml-1"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Digital Marketing */}
            {projectType === "digital_marketing" && (
              <div className="space-y-6">
                {/* Marketing Plans (from API) */}
                <div className="bg-white/60 rounded-2xl border border-teal-200/30 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-teal-300/30"></div>
                    <span className="text-xs font-bold text-teal-600 tracking-widest uppercase whitespace-nowrap">📦 Marketing Plan</span>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-teal-300/30"></div>
                  </div>

                  {plansLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-6 justify-center">
                      <Loader size={16} className="animate-spin" /> Loading plans...
                    </div>
                  ) : marketingPlans.length === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-6">No marketing plans available.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {marketingPlans.map((plan) => (
                        <div
                          key={plan._id}
                          onClick={() => handlePlanSelect(plan._id)}
                          className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
                            selectedPlanId === plan._id
                              ? 'border-teal-500 bg-teal-50 shadow-lg shadow-teal-500/10'
                              : 'border-gray-200 hover:border-teal-300 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                              <Megaphone size={15} className="text-teal-600" />
                              {plan.planName}
                            </h4>
                            {selectedPlanId === plan._id && (
                              <CheckCircle size={20} className="text-teal-600" />
                            )}
                          </div>

                          {/* Duration options with price */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {plan.durations.map((d) => (
                              <button
                                key={d._id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (selectedPlanId !== plan._id) handlePlanSelect(plan._id);
                                  handleDurationSelect(d._id);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                  selectedPlanId === plan._id && selectedDurationId === d._id
                                    ? 'bg-teal-600 text-white border-teal-600'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
                                }`}
                              >
                                {d.duration} · ₹{d.price.toLocaleString()}
                              </button>
                            ))}
                          </div>

                          <ul className="mt-3 space-y-1">
                            {plan.features.slice(0, 4).map((feature, idx) => (
                              <li key={idx} className="text-xs text-gray-600 flex items-start gap-1.5">
                                <CheckCircle size={12} className="text-teal-500 mt-0.5 shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                            {plan.features.length > 4 && (
                              <li className="text-xs text-teal-600 font-semibold">+{plan.features.length - 4} more</li>
                            )}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedPlanObj && selectedDurationObj && (
                    <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-xl text-sm text-gray-700">
                      Selected: <span className="font-semibold">{selectedPlanObj.planName}</span> — {selectedDurationObj.duration} at{" "}
                      <span className="font-semibold">₹{selectedDurationObj.price.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Marketing Work Days */}
                <div className="bg-white/60 rounded-2xl border border-teal-200/30 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-teal-300/30"></div>
                    <span className="text-xs font-bold text-teal-600 tracking-widest uppercase whitespace-nowrap">📊 Work Division</span>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-teal-300/30"></div>
                  </div>
                  <InputField
                    label="Marketing Work Days"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={marketingWorkDays}
                    onChange={(e) => setMarketingWorkDays(e.target.value)}
                  />
                </div>

                {/* Marketing Team */}
                <div className="bg-white/60 rounded-2xl border border-teal-200/30 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-teal-300/30"></div>
                    <span className="text-xs font-bold text-teal-600 tracking-widest uppercase whitespace-nowrap">👥 Marketing Team</span>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-teal-300/30"></div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-gray-200">
                    <div className="flex gap-2 mb-3">
                      <select
                        value={marketingTeam.marketing.selectedEmployee}
                        onChange={(e) => handleMarketingEmployeeSelect(e.target.value)}
                        className="flex-1 h-9 px-3 rounded-lg text-sm text-gray-700 bg-white border-2 border-teal-200/50 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
                        disabled={staffLoading || getAvailableMarketingStaff().length === 0}
                      >
                        <option value="">{staffLoading ? "Loading staff..." : getAvailableMarketingStaff().length === 0 ? "No staff available" : "Select staff..."}</option>
                        {getAvailableMarketingStaff().map((s) => (
                          <option key={s.employeeId} value={s.employeeId}>
                            {s.employeeName} ({s.role})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={addMarketingTeamMember}
                        className="flex items-center gap-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        <UserPlus size={14} /> Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {marketingTeam.marketing.members.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">No members assigned</span>
                      ) : (
                        marketingTeam.marketing.members.map((member) => (
                          <span
                            key={member.employeeId}
                            className="flex items-center gap-1.5 bg-teal-100 text-teal-700 px-3 py-1.5 rounded-full text-xs font-semibold"
                          >
                            {member.name}
                            <button
                              type="button"
                              onClick={() => removeMarketingTeamMember(member.employeeId)}
                              className="hover:text-red-500 transition-colors ml-1"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate("/projects")}
                className="flex-1 sm:flex-none sm:w-32 py-3 rounded-xl border-2 border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader size={17} className="animate-spin" />Creating…</>
                ) : (
                  <><FolderPlus size={17} />Create Project</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, error, className = "", ...props }) => (
  <div>
    {label && <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{label}</label>}
    <input
      {...props}
      className={`w-full h-11 px-4 rounded-xl text-sm text-gray-700 bg-white border-2 ${
        error ? 'border-red-400 focus:border-red-500' : 'border-teal-200/50 focus:border-teal-500'
      } focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all ${className}`}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export default AddProject;