import React, { useState, useEffect } from "react";
import axios from "axios";
import logo from "../../assets/logo1.png";
import { PlusCircle, Trash2, FileText, X, Pencil, Wallet } from "lucide-react";

const inputClass =
  "w-full h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";

const company = {
  logo,
  name: "Pixelmindsolutions Pvt Ltd",
  mobile: "+91 9666317749",
  address: "kphb, Hyderabad, India",
  email: "info@pixelmindsolutions.com",
  website: "www.pixelmindsolutions.com",
};

// Set REACT_APP_API_BASE_URL in your environment for deployment.
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://15.135.216.211:5000/api";

// Bearer token for all API calls (loginDetails for staff/admin, adminDetails fallback)
const getAuthConfig = (extra = {}) => {
  let details = null;
  try {
    details =
      JSON.parse(sessionStorage.getItem("loginDetails") || "null") ||
      JSON.parse(sessionStorage.getItem("loginDetails") || "null");
  } catch {
    details = null;
  }

  return {
    ...extra,
    headers: {
      ...(details?.token ? { Authorization: `Bearer ${details.token}` } : {}),
      ...(extra.headers || {}),
    },
  };
};

const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
];

const todayISO = () => new Date().toISOString().split("T")[0];

const getProjectList = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.projects)) return body.data.projects;
  if (Array.isArray(body?.projects)) return body.projects;
  return [];
};

const formatCurrency = (value) =>
  `₹${(Number(value) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const CreateInvoice = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [fetchingProjects, setFetchingProjects] = useState(true);

  const [installmentRows, setInstallmentRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [validationError, setValidationError] = useState("");

  // Installment actions: edit / delete / record payment
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    value: "",
    dueDate: "",
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    paidAmount: "",
    paymentMode: "cash",
    transactionId: "",
    paymentDate: todayISO(),
    note: "",
    proof: null,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setFetchingProjects(true);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/projects/all`,
        getAuthConfig()
      );
      const activeProjects = getProjectList(response.data).filter(
        (project) => !project.isDeleted && !project.deletedAt
      );

      setProjects(activeProjects);
      return activeProjects;
    } catch (error) {
      console.error("Failed to load projects:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Could not load projects. Check the API connection and browser console.",
      });
      return [];
    } finally {
      setFetchingProjects(false);
    }
  };

  // Reload projects and keep the current project selected
  const refreshSelectedProject = async () => {
    const currentId = selectedProject?._id;
    const refreshedProjects = await fetchProjects();
    const refreshed = refreshedProjects.find(
      (project) => String(project._id) === String(currentId)
    );
    setSelectedProject(refreshed || null);
  };

  const closeActionModals = () => {
    setEditTarget(null);
    setDeleteTarget(null);
    setPaymentTarget(null);
    setModalError("");
    setActionLoading(false);
  };

  /* ── EDIT INSTALLMENT (PUT) ── */
  const openEditInstallment = (installment) => {
    setModalError("");
    setEditTarget(installment);
    setEditForm({
      title: installment.title || "",
      value: String(installment.value ?? ""),
      dueDate: installment.dueDate
        ? new Date(installment.dueDate).toISOString().split("T")[0]
        : "",
    });
  };

  const submitEditInstallment = async (event) => {
    event.preventDefault();
    if (!editTarget || !selectedProject) return;

    if (!editForm.title.trim()) return setModalError("Title is required.");
    if (!editForm.value || Number(editForm.value) <= 0)
      return setModalError("Enter a valid amount.");

    setActionLoading(true);
    setModalError("");

    try {
      await axios.put(
        `${API_BASE_URL}/projects/${selectedProject._id}/installments/${editTarget._id}`,
        {
          title: editForm.title.trim(),
          value: Number(editForm.value),
          dueDate: editForm.dueDate || null,
        },
        getAuthConfig({ headers: { "Content-Type": "application/json" } })
      );

      closeActionModals();
      setMessage({ type: "success", text: "Installment updated successfully." });
      await refreshSelectedProject();
    } catch (error) {
      console.error("Update installment failed:", error);
      setModalError(
        error.response?.data?.message || "Failed to update installment."
      );
      setActionLoading(false);
    }
  };

  /* ── DELETE INSTALLMENT (DELETE) ── */
  const confirmDeleteInstallment = async () => {
    if (!deleteTarget || !selectedProject) return;

    setActionLoading(true);
    setModalError("");

    try {
      await axios.delete(
        `${API_BASE_URL}/projects/${selectedProject._id}/installments/${deleteTarget._id}`,
        getAuthConfig({ headers: { "Content-Type": "application/json" } })
      );

      closeActionModals();
      setMessage({ type: "success", text: "Installment deleted successfully." });
      await refreshSelectedProject();
    } catch (error) {
      console.error("Delete installment failed:", error);
      setModalError(
        error.response?.data?.message || "Failed to delete installment."
      );
      setActionLoading(false);
    }
  };

  /* ── RECORD PAYMENT (POST /payment-requests, multipart) ── */
  const openRecordPayment = (installment) => {
    setModalError("");
    setPaymentTarget(installment);
    setPaymentForm({
      paidAmount: String(installment.totalAmount ?? installment.value ?? ""),
      paymentMode: "cash",
      transactionId: "",
      paymentDate: todayISO(),
      note: "",
      proof: null,
    });
  };

  const submitRecordPayment = async (event) => {
    event.preventDefault();
    if (!paymentTarget || !selectedProject) return;

    if (!paymentForm.paidAmount || Number(paymentForm.paidAmount) <= 0)
      return setModalError("Enter a valid paid amount.");
    if (!paymentForm.paymentDate)
      return setModalError("Payment date is required.");

    setActionLoading(true);
    setModalError("");

    try {
      const formData = new FormData();
      formData.append("projectId", selectedProject._id);
      formData.append("installmentId", paymentTarget._id);
      formData.append("paidAmount", paymentForm.paidAmount);
      formData.append("note", paymentForm.note);
      formData.append("paymentMode", paymentForm.paymentMode);
      formData.append("transactionId", paymentForm.transactionId);
      formData.append("paymentDate", paymentForm.paymentDate);
      if (paymentForm.proof) formData.append("proof", paymentForm.proof);

      // No Content-Type here: the browser sets the multipart boundary
      const response = await axios.post(
        `${API_BASE_URL}/payment-requests`,
        formData,
        getAuthConfig()
      );

      const data = response.data?.data || response.data || {};
      const invoiceNumber =
        data.invoiceNumber || data.invoice?.invoiceNumber || "";

      closeActionModals();
      setMessage({
        type: "success",
        text: `Payment recorded${invoiceNumber ? ` (Invoice ${invoiceNumber})` : ""}.`,
      });
      await refreshSelectedProject();
    } catch (error) {
      console.error("Record payment failed:", error);
      setModalError(
        error.response?.data?.message || "Failed to record payment."
      );
      setActionLoading(false);
    }
  };

  const handleProjectSelect = (event) => {
    const selectedId = event.target.value;
    const project = projects.find(
      (item) => String(item._id) === String(selectedId)
    );

    setSelectedProject(project || null);
    setValidationError("");
    setMessage({ type: "", text: "" });
    setInstallmentRows([]);
  };

  const projectCost = Number(selectedProject?.projectCost) || 0;
  const existingInstallments = Array.isArray(selectedProject?.installments)
    ? selectedProject.installments
    : [];

  const existingTotalPaid = existingInstallments
    .filter((installment) => installment.status === "paid")
    .reduce(
      (sum, installment) =>
        sum +
        Number(installment.totalAmount ?? installment.value ?? 0),
      0
    );

  const remainingBalance = Math.max(0, projectCost - existingTotalPaid);

  // Amount of a row (fixed amount, or percentage of the project cost)
  const calculateRowAmount = (row) => {
    const value = Number(row.value) || 0;
    return row.type === "percentage" ? (projectCost * value) / 100 : value;
  };

  const totalAllocated = installmentRows.reduce(
    (sum, row) => sum + calculateRowAmount(row),
    0
  );

  const allocatedBalance = remainingBalance - totalAllocated;

  // Each installment can use only the balance not already allocated to other rows.
  const getMaxAmountForRow = (rowId) => {
    const allocatedByOtherRows = installmentRows
      .filter((row) => row.id !== rowId)
      .reduce((sum, row) => sum + calculateRowAmount(row), 0);

    return Math.max(0, remainingBalance - allocatedByOtherRows);
  };

  const getMaxInputValueForRow = (row) => {
    const maxAmount = getMaxAmountForRow(row.id);

    if (row.type === "percentage") {
      return projectCost > 0 ? (maxAmount / projectCost) * 100 : 0;
    }

    return maxAmount;
  };

  const addInstallmentRow = () => {
    setInstallmentRows((previous) => [
      ...previous,
      {
        id: `${Date.now()}-${previous.length}`,
        title: `Installment ${
          existingInstallments.length + previous.length + 1
        }`,
        type: "amount",
        value: "",
        dueDate: new Date().toISOString().split("T")[0],
        status: "pending",
        notes: "",
      },
    ]);
    setValidationError("");
  };

  const removeInstallmentRow = (id) => {
    setInstallmentRows((previous) =>
      previous.filter((row) => row.id !== id)
    );
    setValidationError("");
  };

  const handleRowChange = (id, field, value) => {
    setInstallmentRows((previous) =>
      previous.map((row) => {
        if (row.id !== id) return row;

        // Clamp entered amount/percentage to the currently available balance.
        if (field === "value" && value !== "") {
          const otherRowsAmount = previous
            .filter((otherRow) => otherRow.id !== id)
            .reduce(
              (sum, otherRow) => sum + calculateRowAmount(otherRow),
              0
            );
          const maxAmount = Math.max(0, remainingBalance - otherRowsAmount);
          const maxValue =
            row.type === "percentage"
              ? projectCost > 0
                ? (maxAmount / projectCost) * 100
                : 0
              : maxAmount;
          const numericValue = Number(value);

          if (Number.isFinite(numericValue) && numericValue > maxValue) {
            value = String(Number(maxValue.toFixed(2)));
          }
        }

        return { ...row, [field]: value };
      })
    );
    setValidationError("");
  };

  const handleSaveAllInvoices = async (event) => {
    event.preventDefault();
    setValidationError("");
    setMessage({ type: "", text: "" });

    if (!selectedProject) {
      setValidationError("Please select a project.");
      return;
    }

    if (installmentRows.length === 0) {
      setValidationError("Please add at least one installment.");
      return;
    }

    if (totalAllocated > remainingBalance) {
      setValidationError(
        `Total allocated amount (${formatCurrency(
          totalAllocated
        )}) exceeds the remaining balance (${formatCurrency(
          remainingBalance
        )}).`
      );
      return;
    }

    for (const row of installmentRows) {
      if (!row.title.trim()) {
        setValidationError("Please enter a title for every installment.");
        return;
      }

      if (!row.value || Number(row.value) <= 0) {
        setValidationError(
          `Please enter a valid amount for "${row.title}".`
        );
        return;
      }

      if (
        row.type === "percentage" &&
        (Number(row.value) > 100 || Number(row.value) <= 0)
      ) {
        setValidationError(
          `Percentage for "${row.title}" must be between 0 and 100.`
        );
        return;
      }
    }

    setSaving(true);
    const savedInvoices = [];
    let failedCount = 0;

    try {
      for (const row of installmentRows) {
        try {
          const payload = {
            title: row.title.trim(),
            type: row.type,
            value: Number(row.value),
            dueDate: row.dueDate || null,
            status: row.status,
            notes: row.notes || "",
          };

          // Endpoint uses the project's Mongo _id
          const response = await axios.post(
            `${API_BASE_URL}/projects/${selectedProject._id}/installments`,
            payload,
            getAuthConfig({ headers: { "Content-Type": "application/json" } })
          );

          const data = response.data?.data || response.data || {};
          const installment =
            data.installment ||
            (Array.isArray(data.installments)
              ? data.installments[data.installments.length - 1]
              : null);

          const invoice =
            data.invoice ||
            data.createdInvoice ||
            installment?.invoice ||
            (typeof installment?.invoiceId === "object"
              ? installment.invoiceId
              : null);

          const invoiceId =
            invoice?._id ||
            invoice?.id ||
            (typeof data.invoiceId === "object"
              ? data.invoiceId?._id
              : data.invoiceId) ||
            (typeof installment?.invoiceId === "object"
              ? installment.invoiceId?._id
              : installment?.invoiceId);

          const invoiceNumber =
            invoice?.invoiceNumber ||
            data.invoiceNumber ||
            (typeof data.invoiceId === "object"
              ? data.invoiceId?.invoiceNumber
              : "");

          if (invoiceId) {
            savedInvoices.push({
              id: String(invoiceId),
              invoiceNumber: invoiceNumber || "",
            });
          } else {
            console.warn(
              "Installment saved without an invoice ID in response:",
              response.data
            );
            failedCount += 1;
          }
        } catch (error) {
          console.error(`Failed to save "${row.title}":`, error);
          failedCount += 1;
        }
      }

      if (savedInvoices.length === 0) {
        throw new Error(
          "No invoices were created. Check the backend logs and API response."
        );
      }

      setInstallmentRows([]);
      setMessage({
        type: "success",
        text: `Created ${savedInvoices.length} invoice${
          savedInvoices.length === 1 ? "" : "s"
        }. ${
          failedCount
            ? `${failedCount} installment(s) failed or returned no invoice ID.`
            : ""
        }`,
      });

      // Refresh project data using the same response parsing as initial load.
      const refreshedProjects = await fetchProjects();
      const refreshedProject = refreshedProjects.find(
        (project) => String(project._id) === String(selectedProject._id)
      );

      setSelectedProject(refreshedProject || null);
    } catch (error) {
      console.error("Save process error:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Failed to create invoices.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <img
              src={company.logo}
              alt={`${company.name} logo`}
              className="h-12 w-12 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                Invoice Management
              </h1>
              <p className="text-sm text-slate-500">
                Generate installments and create invoices
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message.text && (
          <div
            className={`rounded-xl border p-4 ${
              message.type === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
            role="status"
          >
            {message.text}
          </div>
        )}

        {/* Project selection and details */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Select Project
          </label>

          <select
            onChange={handleProjectSelect}
            value={selectedProject?._id || ""}
            disabled={fetchingProjects}
            className={`${inputClass} cursor-pointer font-semibold text-teal-900`}
          >
            <option value="" disabled>
              {fetchingProjects
                ? "Loading projects..."
                : "-- Select a Project --"}
            </option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.projectName} ({project.projectId}) -{" "}
                {formatCurrency(project.projectCost)}
              </option>
            ))}
          </select>

          {selectedProject && (
            <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-5">
              <div className="md:col-span-2">
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Client Details
                </p>
                <p className="font-bold text-slate-800">
                  {selectedProject.client?.name || "N/A"}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedProject.client?.email || "No email"}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedProject.client?.mobile || "No phone"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Project Cost
                </p>
                <p className="font-bold text-teal-700">
                  {formatCurrency(projectCost)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Total Paid
                </p>
                <p className="font-bold text-emerald-600">
                  {formatCurrency(existingTotalPaid)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Remaining Balance
                </p>
                <p className="font-bold text-amber-600">
                  {formatCurrency(remainingBalance)}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Installment history */}
        {selectedProject && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Installment History
                </h2>
                <p className="text-sm text-slate-500">
                  Previously created installments for this project
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">
                  {existingInstallments.length} installments
                </span>

                <button
                  type="button"
                  onClick={addInstallmentRow}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <PlusCircle size={16} />
                  Add Installment
                </button>
              </div>
            </div>

            {existingInstallments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">
                No installment history found for this project.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th className="px-3 py-3">Installment</th>
                      <th className="px-3 py-3">Invoice No.</th>
                      <th className="px-3 py-3">Amount</th>
                      <th className="px-3 py-3">Due Date</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingInstallments.map((installment, index) => (
                      <tr
                        key={installment._id || index}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-3 py-4 font-medium text-slate-800">
                          {installment.title || `Installment ${index + 1}`}
                        </td>
                        <td className="px-3 py-4 text-slate-600">
                          {installment.invoiceNumber ||
                            installment.invoiceId?.invoiceNumber ||
                            "—"}
                        </td>
                        <td className="px-3 py-4 font-semibold text-slate-800">
                          {formatCurrency(
                            installment.totalAmount ?? installment.value
                          )}
                        </td>
                        <td className="px-3 py-4 text-slate-600">
                          {installment.dueDate
                            ? new Date(
                                installment.dueDate
                              ).toLocaleDateString("en-IN")
                            : "—"}
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              installment.status === "paid"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {installment.status || "pending"}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center justify-center gap-1">
                            {installment.status !== "paid" && (
                              <button
                                type="button"
                                onClick={() => openRecordPayment(installment)}
                                className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                                title="Record Payment"
                              >
                                <Wallet size={17} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditInstallment(installment)}
                              className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                              title="Edit Installment"
                            >
                              <Pencil size={17} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setModalError("");
                                setDeleteTarget(installment);
                              }}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              title="Delete Installment"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* New installment form */}
        {selectedProject && installmentRows.length > 0 && (
          <form
            onSubmit={handleSaveAllInvoices}
            className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                New Installments
              </h2>
              <p className="text-sm text-slate-500">
                Enter installment details and generate invoices.
              </p>
            </div>

            {validationError && (
              <div
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                role="alert"
              >
                {validationError}
              </div>
            )}

            <div className="space-y-5">
              {installmentRows.map((row, index) => {
                const rowAmount = calculateRowAmount(row);

                return (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800">
                        Installment {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeInstallmentRow(row.id)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label className={labelClass}>Installment Title</label>
                        <input
                          className={inputClass}
                          value={row.title}
                          onChange={(event) =>
                            handleRowChange(
                              row.id,
                              "title",
                              event.target.value
                            )
                          }
                          placeholder="e.g. Advance Payment"
                          disabled={saving}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Value Type</label>
                        <select
                          className={inputClass}
                          value={row.type}
                          onChange={(event) =>
                            handleRowChange(
                              row.id,
                              "type",
                              event.target.value
                            )
                          }
                          disabled={saving}
                        >
                          <option value="amount">Fixed Amount (₹)</option>
                          <option value="percentage">Percentage (%)</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>
                          {row.type === "percentage"
                            ? "Percentage (%)"
                            : "Amount (₹)"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={getMaxInputValueForRow(row)}
                          step="0.01"
                          className={inputClass}
                          value={row.value}
                          onChange={(event) =>
                            handleRowChange(
                              row.id,
                              "value",
                              event.target.value
                            )
                          }
                          placeholder="Enter value"
                          disabled={saving || remainingBalance <= 0}
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          Maximum available:{" "}
                          {row.type === "percentage"
                            ? `${getMaxInputValueForRow(row).toFixed(2)}% (${formatCurrency(
                                getMaxAmountForRow(row.id)
                              )})`
                            : formatCurrency(getMaxInputValueForRow(row))}
                        </p>
                      </div>

                      <div>
                        <label className={labelClass}>Due Date</label>
                        <input
                          type="date"
                          className={inputClass}
                          value={row.dueDate}
                          onChange={(event) =>
                            handleRowChange(
                              row.id,
                              "dueDate",
                              event.target.value
                            )
                          }
                          disabled={saving}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Status</label>
                        <select
                          className={inputClass}
                          value={row.status}
                          onChange={(event) =>
                            handleRowChange(
                              row.id,
                              "status",
                              event.target.value
                            )
                          }
                          disabled={saving}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 lg:col-span-4">
                        <label className={labelClass}>Notes</label>
                        <textarea
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                          rows={2}
                          value={row.notes}
                          onChange={(event) =>
                            handleRowChange(
                              row.id,
                              "notes",
                              event.target.value
                            )
                          }
                          placeholder="Optional notes"
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs text-slate-500">Invoice Amount</p>
                      <p className="font-bold text-teal-700">
                        {formatCurrency(rowAmount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals and submit */}
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-xs text-slate-500">Total Amount</p>
                <p className="font-bold text-teal-700">
                  {formatCurrency(totalAllocated)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Balance After Allocation</p>
                <p
                  className={`font-bold ${
                    allocatedBalance < 0
                      ? "text-red-600"
                      : "text-emerald-700"
                  }`}
                >
                  {formatCurrency(allocatedBalance)}
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setInstallmentRows([])}
                disabled={saving}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || installmentRows.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileText size={17} />
                {saving ? "Saving..." : "Save All & Generate Invoices"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Edit installment modal */}
      {editTarget && (
        <ModalShell title="Edit Installment" onClose={closeActionModals}>
          <form onSubmit={submitEditInstallment} className="space-y-4">
            {modalError && <ModalError text={modalError} />}
            <div>
              <label className={labelClass}>Title</label>
              <input
                className={inputClass}
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                disabled={actionLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={editForm.value}
                  onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                  disabled={actionLoading}
                />
              </div>
              <div>
                <label className={labelClass}>Due Date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  disabled={actionLoading}
                />
              </div>
            </div>
            <ModalActions
              loading={actionLoading}
              onCancel={closeActionModals}
              submitLabel="Update Installment"
              loadingLabel="Updating..."
            />
          </form>
        </ModalShell>
      )}

      {/* Delete installment modal */}
      {deleteTarget && (
        <ModalShell title="Delete Installment" onClose={closeActionModals}>
          <div className="space-y-4">
            {modalError && <ModalError text={modalError} />}
            <p className="text-sm text-slate-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-800">
                {deleteTarget.title || "this installment"}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeActionModals}
                disabled={actionLoading}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteInstallment}
                disabled={actionLoading}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Record payment modal */}
      {paymentTarget && (
        <ModalShell
          title={`Record Payment — ${paymentTarget.title || "Installment"}`}
          onClose={closeActionModals}
        >
          <form onSubmit={submitRecordPayment} className="space-y-4">
            {modalError && <ModalError text={modalError} />}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Paid Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={paymentForm.paidAmount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paidAmount: e.target.value })}
                  disabled={actionLoading}
                />
              </div>
              <div>
                <label className={labelClass}>Payment Mode</label>
                <select
                  className={inputClass}
                  value={paymentForm.paymentMode}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                  disabled={actionLoading}
                >
                  {PAYMENT_MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Transaction ID</label>
                <input
                  className={inputClass}
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                  placeholder="e.g. CASH-2026-11-01"
                  disabled={actionLoading}
                />
              </div>
              <div>
                <label className={labelClass}>Payment Date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  disabled={actionLoading}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Note</label>
              <textarea
                rows={2}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                value={paymentForm.note}
                onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                placeholder="e.g. Client paid cash at office"
                disabled={actionLoading}
              />
            </div>
            <div>
              <label className={labelClass}>Payment Proof (optional)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, proof: e.target.files?.[0] || null })
                }
                disabled={actionLoading}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100"
              />
            </div>
            <ModalActions
              loading={actionLoading}
              onCancel={closeActionModals}
              submitLabel="Record Payment"
              loadingLabel="Saving..."
            />
          </form>
        </ModalShell>
      )}

    </div>
  );
};

const ModalShell = ({ title, onClose, children }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
    role="dialog"
    aria-modal="true"
    aria-label={title}
  >
    <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const ModalError = ({ text }) => (
  <div
    className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
    role="alert"
  >
    {text}
  </div>
);

const ModalActions = ({ loading, onCancel, submitLabel, loadingLabel }) => (
  <div className="flex gap-3 pt-2">
    <button
      type="button"
      onClick={onCancel}
      disabled={loading}
      className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={loading}
      className="flex-1 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
    >
      {loading ? loadingLabel : submitLabel}
    </button>
  </div>
);

export default CreateInvoice;