// CreateInvoice.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import logo from '../../assets/logo1.png';
import { 
  Download, PlusCircle, Trash2, Eye, FileText, 
  Search, ChevronLeft, ChevronRight, CheckCircle, Clock
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

  // Invoice List State
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch Projects & Invoices on Mount
  useEffect(() => {
    fetchProjects();
    fetchInvoices();
  }, []);

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

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/invoices`);
      if (res.data.success) {
        setInvoices(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoadingInvoices(false);
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
    const savedInstallmentIds = [];
    let hasSaveErrors = false;

    try {
      // STEP 1: Save Installments sequentially
      for (const row of installmentRows) {
        try {
          const payload = {
            title: row.title,
            type: row.type,
            value: Number(row.value),
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
          
          // Extract ID intelligently from response
          let newInstId = null;
          if (res.data.data?.installments) {
            const insts = res.data.data.installments;
            newInstId = insts[insts.length - 1]._id;
          } else if (res.data.data?.installment?._id) {
             newInstId = res.data.data.installment._id;
          } else if (res.data.data?._id) {
             newInstId = res.data.data._id;
          } else if (res.data.installmentId) {
             newInstId = res.data.installmentId;
          }

          if (newInstId) {
            savedInstallmentIds.push(newInstId);
          } else {
            console.warn("Could not extract ID from:", res.data);
            hasSaveErrors = true;
          }
        } catch (err) {
          console.error(`Failed to save "${row.title}":`, err);
          hasSaveErrors = true;
        }
      }

      if (savedInstallmentIds.length === 0) {
        throw new Error("All installments failed to save. Check backend logs.");
      }

      setMessage({
        type: "success",
        text: `Successfully saved ${savedInstallmentIds.length} installments. ${hasSaveErrors ? 'Some installments failed to save.' : ''}`
      });

      setInstallmentRows([]);
      fetchProjects();

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

  // Invoice Table Handlers
  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/invoices/${invoiceId}/status`, { status: newStatus });
      setInvoices(prev => prev.map(inv => inv._id === invoiceId ? { ...inv, status: newStatus } : inv));
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  // Filter & Pagination Logic
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      (inv.invoiceNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.installmentTitle || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.projectId?.projectName || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
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

        {/* EXISTING INVOICES TABLE */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-lg font-bold text-slate-800">Generated Invoices</h2>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search invoices..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-300 text-sm focus:border-teal-500 outline-none"
                />
              </div>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-300 text-sm focus:border-teal-500 outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="generated">Generated</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
          
          {loadingInvoices ? (
            <div className="text-center py-8 text-slate-500">Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No invoices found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="p-3 font-semibold">Invoice No</th>
                    <th className="p-3 font-semibold">Project</th>
                    <th className="p-3 font-semibold">Installment</th>
                    <th className="p-3 font-semibold text-right">Principal</th>
                    <th className="p-3 font-semibold text-right">Tax</th>
                    <th className="p-3 font-semibold text-right">Total</th>
                    <th className="p-3 font-semibold">Due Date</th>
                    <th className="p-3 font-semibold text-center">Status</th>
                    <th className="p-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-teal-600">{inv.invoiceNumber}</td>
                      <td className="p-3 text-slate-700">
                        <div className="font-semibold">{inv.projectId?.projectName || "N/A"}</div>
                        <div className="text-[10px] text-slate-400">{inv.projectId?.projectId}</div>
                      </td>
                      <td className="p-3 text-slate-700">{inv.installmentTitle}</td>
                      <td className="p-3 text-right font-semibold">₹{inv.amount?.toLocaleString()}</td>
                      <td className="p-3 text-right text-slate-500">₹{inv.tax?.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-slate-800">₹{inv.totalAmount?.toLocaleString()}</td>
                      <td className="p-3 text-slate-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="p-3 text-center">
                        <select
                          value={inv.status}
                          onChange={(e) => handleStatusChange(inv._id, e.target.value)}
                          className={`text-xs font-bold rounded-full px-3 py-1 border outline-none appearance-none cursor-pointer ${
                            inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            inv.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="generated">Generated</option>
                          <option value="sent">Sent</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </td>
                      <td className="p-3 text-center">
                        {inv.invoicePdfURL ? (
                          <a href={inv.invoicePdfURL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-800 font-semibold">
                            <Eye size={16} /> View
                          </a>
                        ) : (
                          <span className="text-slate-400">No PDF</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-4">
              <span className="text-sm text-slate-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-3 py-1 border border-slate-300 rounded-lg disabled:opacity-50 text-sm font-medium hover:bg-slate-50"
                >
                  Prev
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1 border border-slate-300 rounded-lg disabled:opacity-50 text-sm font-medium hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;
