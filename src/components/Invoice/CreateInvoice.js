// CreateInvoice.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import logo from '../../assets/logo1.png';
import { 
  Download, PlusCircle, Trash2, FileText, X
} from "lucide-react";

const inputClass =
  "w-full h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

const company = {
  logo: logo,
  name: "Pixelmindsolutions Pvt Ltd",
  mobile: "+91 9666317749",
  address: "kphb, Hyderabad, India",
  email: "info@pixelmindsolutions.com",
  website: "www.pixelmindsolutions.com",
};

const API_BASE_URL = "https://pmsbackend.pixelmindsolutions.com/api";

const CreateInvoice = () => {
  // Project State
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [fetchingProjects, setFetchingProjects] = useState(true);

  // Installment Form State
  const [installmentRows, setInstallmentRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [validationError, setValidationError] = useState("");

  // Generated invoice PDF preview state
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects/all`);
      const activeProjects = (response.data.data || []).filter(p => !p.isDeleted);
      setProjects(activeProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setFetchingProjects(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setPreviewInvoice(null);
    setPreviewLoading(false);
    setPreviewError("");
  };

  const downloadPreview = () => {
    if (!previewUrl || !previewInvoice) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `${previewInvoice.invoiceNumber || `invoice-${previewInvoice.id}`}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const fetchInvoicePreview = async (invoice) => {
    setPreviewInvoice(invoice);
    setPreviewUrl("");
    setPreviewError("");
    setPreviewLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/manual-invoices/${invoice.id}/download`,
        { responseType: "blob" }
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      setPreviewUrl(window.URL.createObjectURL(blob));
    } catch (error) {
      let detail = error.response?.data?.message;
      if (!detail && error.response?.data instanceof Blob) {
        try {
          const body = JSON.parse(await error.response.data.text());
          detail = body.message;
        } catch (_) { /* Use the general error below. */ }
      }
      setPreviewError(detail || "The invoice was created, but its PDF could not be generated. Please try again from the invoices page.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleProjectSelect = (e) => {
    const projectId = e.target.value;
    const project = projects.find((p) => p._id === projectId);
    setSelectedProject(project || null);
    setValidationError("");
    setMessage({ type: "", text: "" });
    setInstallmentRows([]);
  };

  // Project & Balance Calculations
  const projectCost = Number(selectedProject?.projectCost) || 0;
  const existingInstallments = selectedProject?.installments || [];
  const existingTotalPaid = existingInstallments
    .filter(inst => inst.status === 'paid')
    .reduce((sum, inst) => sum + Number(inst.value || 0), 0);
  const remainingBalance = Math.max(0, projectCost - existingTotalPaid);

  const totalNewPrincipal = installmentRows.reduce((sum, row) => {
    const val = Number(row.value) || 0;
    return sum + (row.type === "percentage" ? (projectCost * val) / 100 : val);
  }, 0);

  const allocatedBalance = remainingBalance - totalNewPrincipal;

  // Row Operations
  const addInstallmentRow = () => {
    setInstallmentRows(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        title: `Installment ${existingInstallments.length + prev.length + 1}`,
        type: "amount",
        value: "",
        sacCode: "",
        gstPercent: 0,
        sgstPercent: 0,
        dueDate: new Date().toISOString().split('T')[0],
        status: "pending",
        notes: "",
      }
    ]);
  };

  const removeInstallmentRow = (id) => {
    setInstallmentRows(prev => prev.filter(row => row.id !== id));
  };

  const handleRowChange = (id, field, value) => {
    setInstallmentRows(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
    setValidationError("");
  };

  const calculateRowValues = (row) => {
    const val = Number(row.value) || 0;
    const principal = row.type === "percentage" ? (projectCost * val) / 100 : val;
    const gst = (principal * (Number(row.gstPercent) || 0)) / 100;
    const sgst = (principal * (Number(row.sgstPercent) || 0)) / 100;
    const total = principal + gst + sgst;
    return { principal, gst, sgst, total };
  };

  // Save Installments & Create Invoices
  const handleSaveAllInvoices = async (e) => {
    e.preventDefault();
    setValidationError("");
    setMessage({ type: "", text: "" });

    if (!selectedProject) return setValidationError("Please select a project.");
    if (installmentRows.length === 0) return setValidationError("Please add at least one installment.");
    
    if (totalNewPrincipal > remainingBalance) {
      return setValidationError(`Total allocated principal (₹${totalNewPrincipal.toLocaleString()}) exceeds remaining balance (₹${remainingBalance.toLocaleString()}).`);
    }

    for (const row of installmentRows) {
      if (!row.value || Number(row.value) <= 0) {
        return setValidationError(`Please enter a valid amount for "${row.title}".`);
      }
    }

    setSaving(true);
    const savedInvoices = [];
    let hasSaveErrors = false;

    try {
      // STEP 1: Save Installments sequentially
      for (const row of installmentRows) {
        try {
          const payload = {
            title: row.title,
            type: row.type,
            value: Number(row.value),
            sacCode: row.sacCode || "",
            gstPercent: Number(row.gstPercent) || 0,
            sgstPercent: Number(row.sgstPercent) || 0,
            dueDate: row.dueDate,
            status: row.status,
            notes: row.notes,
          };
          
          const res = await axios.post(
            `${API_BASE_URL}/projects/${selectedProject.projectId}/installments`, 
            payload
          );
          
          const data = res.data?.data || res.data || {};
          const installment = data.installment || (Array.isArray(data.installments) ? data.installments[data.installments.length - 1] : null);
          const invoice = data.invoice || data.createdInvoice || installment?.invoice ||
            (typeof installment?.invoiceId === "object" ? installment.invoiceId : null);
          const invoiceId = invoice?._id || invoice?.id ||
            (typeof data.invoiceId === "object" ? data.invoiceId?._id : data.invoiceId) ||
            (typeof installment?.invoiceId === "object" ? installment.invoiceId?._id : installment?.invoiceId);
          const invoiceNumber = invoice?.invoiceNumber || data.invoiceNumber ||
            (typeof data.invoiceId === "object" ? data.invoiceId?.invoiceNumber : "");

          if (invoiceId) {
            savedInvoices.push({ id: String(invoiceId), invoiceNumber });
          } else {
            console.warn("Installment saved without an invoice ID in response:", res.data);
            hasSaveErrors = true;
          }
        } catch (err) {
          console.error(`Failed to save "${row.title}":`, err);
          hasSaveErrors = true;
        }
      }

      if (savedInvoices.length === 0) {
        throw new Error("All installments failed to save. Check backend logs.");
      }

      setMessage({
        type: "success",
        text: `Successfully created ${savedInvoices.length} invoice${savedInvoices.length === 1 ? "" : "s"}. ${hasSaveErrors ? "Some installments failed or returned no invoice ID." : ""}`
      });

      setInstallmentRows([]);
      await fetchInvoicePreview(savedInvoices[savedInvoices.length - 1]);

      // Refresh selected project data
      const updatedProjRes = await axios.get(`${API_BASE_URL}/projects/all`);
      const activeProjects = (updatedProjRes.data.data || []).filter(p => !p.isDeleted);
      setProjects(activeProjects);
      setSelectedProject(activeProjects.find(p => p._id === selectedProject._id) || null);
    } catch (error) {
      console.error("Save process error:", error);
      setMessage({ 
        type: "error", 
        text: error.response?.data?.message || error.message || "Failed to create invoices." 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={company.logo} alt="logo" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-slate-800">Invoice Management</h1>
              <p className="text-sm text-slate-500">Generate installments and bulk create invoices</p>
            </div>
          </div>
        </div>

        {/* MESSAGES */}
        {message.text && (
          <div className={`p-4 rounded-xl border ${message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {message.text}
          </div>
        )}

        {/* PROJECT SELECTION & DETAILS */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
          <label className="block text-sm font-semibold mb-2 text-slate-700">Select Project</label>
          <select
            onChange={handleProjectSelect}
            value={selectedProject?._id || ""}
            disabled={fetchingProjects}
            className={`${inputClass} font-semibold text-teal-900 cursor-pointer`}
          >
            <option value="" disabled>
              {fetchingProjects ? "Loading projects..." : "-- Select a Project --"}
            </option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.projectName} ({p.projectId}) - ₹{p.projectCost?.toLocaleString()}
              </option>
            ))}
          </select>

          {selectedProject && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="md:col-span-2">
                <p className="text-[10px] uppercase font-bold text-slate-400">Client Details</p>
                <p className="font-bold text-slate-800">{selectedProject.clientName || "N/A"}</p>
                <p className="text-xs text-slate-500">{selectedProject.mailId || "No email"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Project Cost</p>
                <p className="font-bold text-teal-700">₹{projectCost.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Paid</p>
                <p className="font-bold text-emerald-600">₹{existingTotalPaid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Remaining Balance</p>
                <p className="font-bold text-amber-600">₹{remainingBalance.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* INSTALLMENT FORM */}
        {selectedProject && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-teal-600" size={20} /> New Installments
              </h2>
              <button
                type="button"
                onClick={addInstallmentRow}
                className="px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded-xl text-sm font-bold transition flex items-center gap-1"
              >
                <PlusCircle size={16} /> Add Row
              </button>
            </div>

            {validationError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                {validationError}
              </div>
            )}

            {installmentRows.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No installments added yet. Click "Add Row" to start.
              </div>
            ) : (
              <div className="space-y-4">
                {installmentRows.map((row) => {
                  const { principal, gst, sgst, total } = calculateRowValues(row);
                  return (
                    <div key={row.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                      <button
                        onClick={() => removeInstallmentRow(row.id)}
                        className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                        title="Remove"
                      >
                        <Trash2 size={18} />
                      </button>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pr-8">
                        <div className="col-span-2 md:col-span-1">
                          <label className="block text-xs font-semibold mb-1">Title</label>
                          <input type="text" value={row.title} onChange={(e) => handleRowChange(row.id, 'title', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Type</label>
                          <select value={row.type} onChange={(e) => handleRowChange(row.id, 'type', e.target.value)} className={inputClass}>
                            <option value="amount">Amount (₹)</option>
                            <option value="percentage">Percentage (%)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">{row.type === "percentage" ? "Value (%)" : "Value (₹)"}</label>
                          <input type="number" value={row.value} onChange={(e) => handleRowChange(row.id, 'value', e.target.value)} className={inputClass} min="1" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Due Date</label>
                          <input type="date" value={row.dueDate} onChange={(e) => handleRowChange(row.id, 'dueDate', e.target.value)} className={inputClass} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-semibold mb-1">SAC Code</label>
                          <input
                            type="text"
                            value={row.sacCode || ""}
                            onChange={(e) => handleRowChange(row.id, "sacCode", e.target.value)}
                            className={inputClass}
                            placeholder="Enter SAC Code"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">GST %</label>
                          <input type="number" value={row.gstPercent} onChange={(e) => handleRowChange(row.id, 'gstPercent', e.target.value)} className={inputClass} min="0" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">SGST %</label>
                          <input type="number" value={row.sgstPercent} onChange={(e) => handleRowChange(row.id, 'sgstPercent', e.target.value)} className={inputClass} min="0" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Status</label>
                          <select value={row.status} onChange={(e) => handleRowChange(row.id, 'status', e.target.value)} className={inputClass}>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold mb-1">Notes</label>
                          <input type="text" value={row.notes} onChange={(e) => handleRowChange(row.id, 'notes', e.target.value)} className={inputClass} />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-6 text-sm bg-white p-3 rounded-lg border border-slate-200">
                        <div className="flex flex-col"><span className="text-[10px] text-slate-400 font-bold uppercase">Principal</span><span className="font-semibold">₹{principal.toLocaleString()}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] text-slate-400 font-bold uppercase">GST</span><span className="font-semibold">₹{gst.toLocaleString()}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] text-slate-400 font-bold uppercase">SGST</span><span className="font-semibold">₹{sgst.toLocaleString()}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] text-teal-600 font-bold uppercase">Total Amount</span><span className="font-bold text-teal-700">₹{total.toLocaleString()}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {installmentRows.length > 0 && (
              <div className="mt-6 border-t border-slate-200 pt-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm">
                  <p className="text-slate-500">Total New Principal: <span className="font-bold text-slate-800">₹{totalNewPrincipal.toLocaleString()}</span></p>
                  <p className="text-slate-500">Balance after this batch: <span className={`font-bold ${allocatedBalance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>₹{allocatedBalance.toLocaleString()}</span></p>
                </div>
                <button
                  onClick={handleSaveAllInvoices}
                  disabled={saving}
                  className="w-full md:w-auto px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? "Processing..." : "Save All & Generate Invoices"}
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Invoice PDF preview">
          <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-6">
              <div>
                <h2 className="font-bold text-slate-800">Invoice Preview</h2>
                <p className="text-sm text-slate-500">{previewInvoice.invoiceNumber || "Generated invoice"}</p>
              </div>
              <button type="button" onClick={closePreview} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close preview"><X size={20} /></button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-100 p-3">
              {previewLoading ? (
                <div className="text-center text-slate-600" role="status"><div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />Generating and loading invoice PDF…</div>
              ) : previewError ? (
                <div className="max-w-lg rounded-xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-700">{previewError}</div>
              ) : previewUrl ? (
                <iframe title="Generated invoice PDF" src={previewUrl} className="h-full w-full rounded-lg border-0 bg-white" />
              ) : null}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-4 py-3 sm:px-6">
              <button type="button" onClick={closePreview} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close Preview</button>
              <button type="button" onClick={downloadPreview} disabled={!previewUrl} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"><Download size={16} />Download PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateInvoice;