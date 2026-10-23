// ShowInvoices.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Download, Eye, Trash2, Edit } from "lucide-react";

const API_BASE_URL = "https://pmsbackend.pixelmindsolutions.com/api";

const loginDetails = JSON.parse(sessionStorage.getItem("loginDetails"));
const AUTH_TOKEN = loginDetails?.token;

const permission = loginDetails?.modulePermissions?.find(
  (item) => item.component === "invoice"
);
const access = permission?.items?.[0]?.permission || [];

const ShowInvoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

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

  const fetchInvoices = async (page = 1, limit = 10) => {
    setLoading(true);
    setError("");
    try {
      // Using the exact endpoint you requested
      const response = await axios.get(
        `${API_BASE_URL}/projects/getinvoices?page=${page}&limit=${limit}`
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
        headers: AUTH_TOKEN
          ? { Authorization: `Bearer ${AUTH_TOKEN}` }
          : {},
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
        headers: AUTH_TOKEN
          ? { Authorization: `Bearer ${AUTH_TOKEN}` }
          : {},
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
  const handleDelete = async (invoiceId) => {
    setDeleting(invoiceId);
    try {
      await axios.delete(`${API_BASE_URL}/manual-invoices/${invoiceId}`);
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

  if (loading) {
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
                Project Invoices
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Total: <span className="font-semibold text-slate-700">{pagination.totalInvoices}</span> invoices
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Page Size Selector */}
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
        </div>
      </div>

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