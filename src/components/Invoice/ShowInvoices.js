// ShowInvoices.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Download, Eye, Trash2, Pencil, X } from "lucide-react";

const API_BASE_URL = "http://15.135.216.211:5000/api";
// Host used for uploaded files such as payment proofs (/uploads/...)
const FILE_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

const loginDetails = JSON.parse(sessionStorage.getItem("loginDetails"));
const AUTH_TOKEN = loginDetails?.token;

const authHeaders = () =>
  AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {};

const permission = loginDetails?.modulePermissions?.find(
  (item) => item.component === "invoice"
);
const access = permission?.items?.[0]?.permission || [];

const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
];

const inputClass =
  "w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";
const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";

const paymentStatusClass = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "approved":
      return "bg-green-100 text-green-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const ShowInvoices = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("invoices");

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  // Payment requests
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState("");
  const [paymentDetail, setPaymentDetail] = useState(null);
  const [paymentDetailLoading, setPaymentDetailLoading] = useState(false);
  const [editPayment, setEditPayment] = useState(null);
  const [editPaymentForm, setEditPaymentForm] = useState({
    paidAmount: "",
    note: "",
    paymentMode: "cash",
    transactionId: "",
    paymentDate: "",
    proof: null,
  });
  const [editPaymentSaving, setEditPaymentSaving] = useState(false);
  const [editPaymentError, setEditPaymentError] = useState("");

  // Pagination states
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalInvoices: 0,
    limit: 10,
  });
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchInvoices(pagination.currentPage, pageSize);
  }, [pagination.currentPage, pageSize]);

  useEffect(() => {
    if (activeTab === "payments") fetchPayments();
  }, [activeTab]);

  const fetchInvoices = async (page = 1, limit = 10) => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${API_BASE_URL}/projects/getinvoices?page=${page}&limit=${limit}`,
        { headers: authHeaders() }
      );

      if (response.data.success) {
        setInvoices(response.data.data);
        setPagination({
          currentPage: response.data.pagination?.page || page,
          totalPages: response.data.pagination?.pages || 1,
          totalInvoices: response.data.pagination?.total || response.data.total || 0,
          limit: response.data.pagination?.limit || limit,
        });
      } else {
        setError("Failed to fetch invoices");
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError("Failed to fetch invoices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── PAYMENT REQUESTS ── */
  const fetchPayments = async () => {
    setPaymentsLoading(true);
    setPaymentsError("");
    try {
      const response = await axios.get(`${API_BASE_URL}/payment-requests`, {
        headers: authHeaders(),
      });
      if (response.data.success) {
        setPayments(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        setPaymentsError("Failed to fetch payment requests");
      }
    } catch (err) {
      console.error("Error fetching payment requests:", err);
      setPaymentsError(
        err.response?.data?.message ||
          "Failed to fetch payment requests. Please try again."
      );
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleViewPayment = async (payment) => {
    // Show what we already have, then refresh from GET /payment-requests/:id
    setPaymentDetail(payment);
    setPaymentDetailLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/payment-requests/${payment._id}`,
        { headers: authHeaders() }
      );
      if (response.data.success && response.data.data) {
        setPaymentDetail(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching payment request:", err);
    } finally {
      setPaymentDetailLoading(false);
    }
  };

  const openEditPayment = (payment) => {
    setEditPaymentError("");
    setEditPayment(payment);
    setEditPaymentForm({
      paidAmount: String(payment.paidAmount ?? ""),
      note: payment.reason || "",
      paymentMode: payment.paymentMode || "cash",
      transactionId: payment.transactionId || "",
      paymentDate: payment.paymentDate
        ? new Date(payment.paymentDate).toISOString().split("T")[0]
        : "",
      proof: null,
    });
  };

  const closeEditPayment = () => {
    setEditPayment(null);
    setEditPaymentError("");
    setEditPaymentSaving(false);
  };

  const submitEditPayment = async (e) => {
    e.preventDefault();
    if (!editPayment) return;

    if (!editPaymentForm.paidAmount || Number(editPaymentForm.paidAmount) <= 0) {
      setEditPaymentError("Enter a valid paid amount.");
      return;
    }

    setEditPaymentSaving(true);
    setEditPaymentError("");

    try {
      const formData = new FormData();
      formData.append("paidAmount", editPaymentForm.paidAmount);
      formData.append("note", editPaymentForm.note);
      formData.append("paymentMode", editPaymentForm.paymentMode);
      formData.append("transactionId", editPaymentForm.transactionId);
      formData.append("paymentDate", editPaymentForm.paymentDate);
      if (editPaymentForm.proof) formData.append("proof", editPaymentForm.proof);

      // No Content-Type header: the browser sets the multipart boundary
      const response = await axios.patch(
        `${API_BASE_URL}/payment-requests/${editPayment._id}`,
        formData,
        { headers: authHeaders() }
      );

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Update failed");
      }

      closeEditPayment();
      alert("Payment updated successfully!");
      fetchPayments();
      // Invoice amounts may have changed with the payment
      fetchInvoices(pagination.currentPage, pageSize);
    } catch (err) {
      console.error("Error updating payment request:", err);
      setEditPaymentError(
        err.response?.data?.message || err.message || "Failed to update payment."
      );
      setEditPaymentSaving(false);
    }
  };

  const handleDownload = async (invoice) => {
    if (!invoice._id) {
      alert("Invoice ID not found.");
      return;
    }

    setDownloading(invoice._id);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/manual-invoices/${invoice._id}/download`,
        {
          responseType: "blob",
          headers: authHeaders(),
        }
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = invoice.invoiceNumber
        ? `${invoice.invoiceNumber}.pdf`
        : `invoice-${invoice._id}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Invoice download failed:", error);
      alert("Invoice download failed. Please check the API route and server logs.");
    } finally {
      setDownloading(null);
    }
  };

  const handleViewPdf = async (invoice) => {
    if (!invoice?._id) {
      alert("Invoice ID not found.");
      return;
    }

    try {
      setDownloading(invoice._id);

      const response = await axios.get(
        `${API_BASE_URL}/manual-invoices/${invoice._id}/download`,
        {
          responseType: "blob",
          headers: authHeaders(),
        }
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      setPdfUrl((previousUrl) => {
        if (previousUrl) {
          window.URL.revokeObjectURL(previousUrl);
        }

        return url;
      });

      setShowPdfModal(true);
    } catch (error) {
      console.error("Invoice preview failed:", error);
      alert("Unable to preview invoice. Please check the backend logs.");
    } finally {
      setDownloading(null);
    }
  };

  // Open an invoice PDF straight from a payment request row
  const handleViewPaymentInvoice = (payment) => {
    if (!payment?.invoiceId) {
      alert("No invoice has been generated for this payment.");
      return;
    }
    handleViewPdf({ _id: String(payment.invoiceId), invoiceNumber: payment.invoiceNumber });
  };

  const handleDelete = async (invoiceId) => {
    setDeleting(invoiceId);
    try {
      await axios.delete(`${API_BASE_URL}/manual-invoices/${invoiceId}`, {
        headers: authHeaders(),
      });
      alert("Invoice deleted successfully!");
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
      fetchInvoices(pagination.currentPage, pageSize);
    } catch (err) {
      console.error("Error deleting invoice:", err);
      alert("Failed to delete invoice. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (invoiceId) => {
    navigate(`/edit-invoice/${invoiceId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "-";
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const getPageNumbers = () => {
    const { currentPage, totalPages } = pagination;
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (loading && activeTab === "invoices" && invoices.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-10 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          <p className="mt-3 text-slate-600 font-medium">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-5 md:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">
                {activeTab === "invoices" ? "Project Invoices" : "Payment Requests"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Total:{" "}
                <span className="font-semibold text-slate-700">
                  {activeTab === "invoices" ? pagination.totalInvoices : payments.length}
                </span>{" "}
                {activeTab === "invoices" ? "invoices" : "payments"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Page Size Selector */}
              {activeTab === "invoices" && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600">Show:</label>
                  <select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              )}

              {/* Create Invoice Button */}
              {(loginDetails?.role === "Admin" || access.includes("add")) && (
                <button
                  onClick={() => navigate('/create-invoice')}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Invoice
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-5 border-b border-slate-200">
            {[
              { id: "invoices", label: "Invoices" },
              { id: "payments", label: "Payment Requests" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ${
                  activeTab === tab.id
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═════════════ INVOICES TAB ═════════════ */}
          {activeTab === "invoices" && (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 sm:p-4 rounded-xl mb-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {invoices.length === 0 ? (
                <div className="text-center py-8 sm:py-12 md:py-16">
                  <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-slate-500 text-lg">No invoices found</p>
                </div>
              ) : (
                <>
                  {/* Table - Desktop View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                          <th className="p-3 text-left font-semibold">Invoice No</th>
                          <th className="p-3 text-left font-semibold">Installment</th>
                          <th className="p-3 text-left font-semibold">Date</th>
                          <th className="p-3 text-right font-semibold">Amount</th>
                          <th className="p-3 text-center font-semibold">Status</th>
                          <th className="p-3 text-center font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv, index) => (
                          <tr
                            key={inv._id}
                            className={`border-b border-slate-100 hover:bg-slate-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                          >
                            <td className="p-3 font-semibold text-teal-600">
                              {inv.invoiceNumber || "N/A"}
                            </td>
                            <td className="p-3 font-medium text-slate-800">
                              {inv.installmentTitle || "N/A"}
                            </td>
                            <td className="p-3 text-slate-600">
                              {formatDate(inv.paymentDate || inv.createdAt)}
                            </td>
                            <td className="p-3 text-right font-semibold text-slate-800">
                              {formatCurrency(inv.totalAmount)}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                                  inv.status === "sent"
                                    ? "bg-blue-100 text-blue-700"
                                    : inv.status === "paid"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {inv.status}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-2">
                                {/* View Button */}
                                <button
                                  onClick={() => handleViewPdf(inv)}
                                  disabled={!inv.invoicePdfURL}
                                  className={`p-1.5 rounded-lg transition ${
                                    inv.invoicePdfURL
                                      ? "text-blue-600 hover:bg-blue-50"
                                      : "text-gray-400 cursor-not-allowed"
                                  }`}
                                  title="View PDF"
                                >
                                  <Eye size={18} />
                                </button>

                                {/* Download Button (Requested) */}
                                <button
                                  onClick={() => handleDownload(inv)}
                                  disabled={downloading === inv._id}
                                  className={`p-1.5 rounded-lg transition ${
                                    downloading === inv._id
                                      ? "text-gray-400 cursor-not-allowed"
                                      : inv.invoicePdfURL
                                      ? "text-teal-600 hover:bg-teal-50"
                                      : "text-gray-400 cursor-not-allowed"
                                  }`}
                                  title="Download PDF"
                                >
                                  {downloading === inv._id ? (
                                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></span>
                                  ) : (
                                    <Download size={18} />
                                  )}
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => {
                                    setInvoiceToDelete(inv._id);
                                    setShowDeleteModal(true);
                                  }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Delete Invoice"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Cards - Mobile View */}
                  <div className="md:hidden space-y-4">
                    {invoices.map((inv) => (
                      <div key={inv._id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-teal-600 text-sm">
                              {inv.invoiceNumber}
                            </p>
                            <p className="font-medium text-slate-800 mt-1">
                              {inv.installmentTitle}
                            </p>
                          </div>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                              inv.status === "sent" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                            }`}>
                            {inv.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <p className="text-slate-500">Date</p>
                            <p className="font-medium text-slate-700">{formatDate(inv.paymentDate || inv.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Amount</p>
                            <p className="font-bold text-slate-800">{formatCurrency(inv.totalAmount)}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownload(inv)}
                            disabled={downloading === inv._id}
                            className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition disabled:bg-gray-300 flex items-center justify-center gap-1"
                          >
                            <Download size={16} /> {downloading === inv._id ? 'Wait...' : 'Download'}
                          </button>
                          <button
                            onClick={() => {
                              setInvoiceToDelete(inv._id);
                              setShowDeleteModal(true);
                            }}
                            className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-200">
                      <div className="text-sm text-slate-500 order-2 sm:order-1">
                        Showing {(pagination.currentPage - 1) * pageSize + 1} to{' '}
                        {Math.min(pagination.currentPage * pageSize, pagination.totalInvoices)} of{' '}
                        {pagination.totalInvoices} entries
                      </div>

                      <div className="flex items-center gap-1 order-1 sm:order-2 flex-wrap justify-center">
                        <button
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={pagination.currentPage === 1}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                            pagination.currentPage === 1
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          Prev
                        </button>

                        {getPageNumbers().map((page, index) => (
                          <button
                            key={index}
                            onClick={() => typeof page === 'number' && handlePageChange(page)}
                            className={`min-w-[2.2rem] h-9 rounded-lg text-sm font-medium transition ${
                              page === pagination.currentPage
                                ? "bg-teal-600 text-white"
                                : page === '...'
                                ? "bg-transparent text-slate-500 cursor-default"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            }`}
                            disabled={page === '...'}
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={pagination.currentPage === pagination.totalPages}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                            pagination.currentPage === pagination.totalPages
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ═════════════ PAYMENT REQUESTS TAB ═════════════ */}
          {activeTab === "payments" && (
            <>
              {paymentsError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 sm:p-4 rounded-xl mb-4 text-sm">
                  {paymentsError}
                </div>
              )}

              {paymentsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                  <p className="mt-3 text-slate-600 font-medium">Loading payment requests...</p>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 text-lg">No payment requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[950px] text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                        <th className="p-3 text-left font-semibold">Invoice No</th>
                        <th className="p-3 text-left font-semibold">Project / Client</th>
                        <th className="p-3 text-left font-semibold">Installment</th>
                        <th className="p-3 text-right font-semibold">Paid</th>
                        <th className="p-3 text-right font-semibold">Shortfall</th>
                        <th className="p-3 text-left font-semibold">Mode</th>
                        <th className="p-3 text-left font-semibold">Date</th>
                        <th className="p-3 text-center font-semibold">Status</th>
                        <th className="p-3 text-center font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p, index) => (
                        <tr
                          key={p._id}
                          className={`border-b border-slate-100 hover:bg-slate-50 transition ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                        >
                          <td className="p-3 font-semibold text-teal-600">
                            {p.invoiceNumber || "—"}
                          </td>
                          <td className="p-3">
                            <p className="font-medium text-slate-800">
                              {p.projectId?.projectName || "N/A"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {p.projectId?.projectId} · {p.clientId?.name || p.projectId?.clientName || "—"}
                            </p>
                          </td>
                          <td className="p-3 text-slate-700">
                            {p.installmentTitle || "N/A"}
                            <p className="text-xs text-slate-400">
                              Expected {formatCurrency(p.installmentExpectedAmount)}
                            </p>
                          </td>
                          <td className="p-3 text-right font-semibold text-slate-800">
                            {formatCurrency(p.paidAmount)}
                          </td>
                          <td className="p-3 text-right">
                            {p.isPartial ? (
                              <span className="font-semibold text-amber-600">
                                {formatCurrency(p.shortfall)}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="p-3 capitalize text-slate-600">
                            {(p.paymentMode || "—").replace("_", " ")}
                          </td>
                          <td className="p-3 text-slate-600">{formatDate(p.paymentDate)}</td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${paymentStatusClass(p.status)}`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewPayment(p)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="View Details"
                              >
                                <Eye size={18} />
                              </button>
                              {p.invoiceId && (
                                <button
                                  onClick={() => handleViewPaymentInvoice(p)}
                                  disabled={downloading === String(p.invoiceId)}
                                  className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition disabled:opacity-50"
                                  title="View Invoice PDF"
                                >
                                  <Download size={18} />
                                </button>
                              )}
                              {(loginDetails?.role === "Admin" || access.includes("edit")) && (
                                <button
                                  onClick={() => openEditPayment(p)}
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                  title="Edit Payment"
                                >
                                  <Pencil size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Payment details modal */}
      {paymentDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">
                Payment Details
                {paymentDetailLoading && (
                  <span className="ml-2 text-xs font-normal text-slate-400">refreshing…</span>
                )}
              </h3>
              <button
                onClick={() => setPaymentDetail(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-2 gap-4 text-sm">
              {[
                ["Invoice No", paymentDetail.invoiceNumber || "—"],
                ["Status", paymentDetail.status],
                ["Project", paymentDetail.projectId?.projectName],
                ["Project ID", paymentDetail.projectId?.projectId],
                ["Client", paymentDetail.clientId?.name || paymentDetail.projectId?.clientName],
                ["Client Mobile", paymentDetail.clientId?.mobile || paymentDetail.projectId?.mobileNumber],
                ["Installment", paymentDetail.installmentTitle],
                ["Expected Amount", formatCurrency(paymentDetail.installmentExpectedAmount)],
                ["Paid Amount", formatCurrency(paymentDetail.paidAmount)],
                ["Shortfall", paymentDetail.isPartial ? formatCurrency(paymentDetail.shortfall) : "—"],
                ["Payment Mode", (paymentDetail.paymentMode || "—").replace("_", " ")],
                ["Transaction ID", paymentDetail.transactionId || "—"],
                ["Payment Date", formatDate(paymentDetail.paymentDate)],
                ["Project Total Paid", formatCurrency(paymentDetail.projectId?.totalPaid)],
                ["Project Remaining", formatCurrency(paymentDetail.projectId?.remainingAmount)],
                ["Reviewed By", paymentDetail.reviewedBy?.name || paymentDetail.reviewedBy?.email || "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[11px] font-bold uppercase text-slate-400">{label}</p>
                  <p className="font-semibold text-slate-800 break-words">
                    {value || "—"}
                  </p>
                </div>
              ))}

              <div className="col-span-2">
                <p className="text-[11px] font-bold uppercase text-slate-400">Note</p>
                <p className="text-slate-700">{paymentDetail.reason || "—"}</p>
              </div>

              {paymentDetail.adminRemark && (
                <div className="col-span-2">
                  <p className="text-[11px] font-bold uppercase text-slate-400">Admin Remark</p>
                  <p className="text-slate-700">{paymentDetail.adminRemark}</p>
                </div>
              )}

              {paymentDetail.proofImageUrl && (
                <div className="col-span-2">
                  <p className="text-[11px] font-bold uppercase text-slate-400 mb-2">Payment Proof</p>
                  <a
                    href={`${FILE_BASE_URL}${paymentDetail.proofImageUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={`${FILE_BASE_URL}${paymentDetail.proofImageUrl}`}
                      alt="Payment proof"
                      className="max-h-64 rounded-lg border border-slate-200 object-contain"
                    />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit payment modal */}
      {editPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Edit Payment{editPayment.invoiceNumber ? ` — ${editPayment.invoiceNumber}` : ""}
              </h3>
              <button
                onClick={closeEditPayment}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={18} className="text-slate-600" />
              </button>
            </div>

            <form onSubmit={submitEditPayment} className="space-y-4">
              {editPaymentError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">
                  {editPaymentError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Paid Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    value={editPaymentForm.paidAmount}
                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, paidAmount: e.target.value })}
                    disabled={editPaymentSaving}
                  />
                </div>
                <div>
                  <label className={labelClass}>Payment Mode</label>
                  <select
                    className={inputClass}
                    value={editPaymentForm.paymentMode}
                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, paymentMode: e.target.value })}
                    disabled={editPaymentSaving}
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
                    value={editPaymentForm.transactionId}
                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, transactionId: e.target.value })}
                    disabled={editPaymentSaving}
                  />
                </div>
                <div>
                  <label className={labelClass}>Payment Date</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={editPaymentForm.paymentDate}
                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, paymentDate: e.target.value })}
                    disabled={editPaymentSaving}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Note</label>
                <textarea
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  value={editPaymentForm.note}
                  onChange={(e) => setEditPaymentForm({ ...editPaymentForm, note: e.target.value })}
                  disabled={editPaymentSaving}
                />
              </div>

              <div>
                <label className={labelClass}>Replace Payment Proof (optional)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) =>
                    setEditPaymentForm({ ...editPaymentForm, proof: e.target.files?.[0] || null })
                  }
                  disabled={editPaymentSaving}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100"
                />
                {editPayment.proofImageUrl && !editPaymentForm.proof && (
                  <p className="mt-1 text-xs text-slate-500">
                    Current proof is kept unless you choose a new file.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditPayment}
                  disabled={editPaymentSaving}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editPaymentSaving}
                  className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition font-medium disabled:opacity-60"
                >
                  {editPaymentSaving ? "Saving..." : "Update Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF View Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Invoice PDF</h3>
              <button
                onClick={() => {
                  setShowPdfModal(false);
                  setPdfUrl("");
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-4 bg-slate-50">
              <iframe
                src={pdfUrl}
                className="w-full h-[70vh] rounded-lg"
                title="Invoice PDF"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Invoice</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete this invoice? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setInvoiceToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (invoiceToDelete) {
                      handleDelete(invoiceToDelete);
                    }
                  }}
                  disabled={deleting === invoiceToDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition font-medium disabled:opacity-70"
                >
                  {deleting === invoiceToDelete ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowInvoices;