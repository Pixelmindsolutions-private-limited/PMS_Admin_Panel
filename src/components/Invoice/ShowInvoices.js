// ShowInvoices.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
  const [selectedInvoice, setSelectedInvoice] = useState(null);
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
      const response = await axios.get(
        `${API_BASE_URL}/manual-invoices?page=${page}&limit=${limit}`
      );
      if (response.data.success) {
        setInvoices(response.data.data);
        setPagination({
          currentPage: response.data.pagination.page || page,
          totalPages: response.data.pagination.pages || 1,
          totalInvoices: response.data.pagination.total || 0,
          limit: response.data.pagination.limit || limit,
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

  const handleDownload = async (invoiceId) => {
    setDownloading(invoiceId);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/manual-invoices/${invoiceId}/download`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = `invoice-${invoiceId}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading invoice:", err);
      alert("Failed to download invoice. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const handleViewPdf = async (invoiceId) => {
    try {
      setSelectedInvoice(invoiceId);
      const response = await axios.get(
        `${API_BASE_URL}/manual-invoices/${invoiceId}/download`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setPdfUrl(url);
      setShowPdfModal(true);
    } catch (err) {
      console.error("Error viewing PDF:", err);
      alert("Failed to load PDF. Please try again.");
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

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/manual-invoices`, {
        params: {
          limit: 1000, // Get all invoices for export
        }
      });

      if (response.data.success) {
        const data = response.data.data;
        // Convert to CSV
        const headers = ['Invoice ID', 'Client Name', 'Mobile', 'Date', 'Total Amount', 'Status'];
        const rows = data.map(inv => [
          `INV${String(inv._id).slice(-6).toUpperCase()}`,
          inv.clientName,
          inv.clientMobile,
          formatDate(inv.date),
          formatCurrency(inv.totalAmount || inv.subtotal),
          inv.status || 'Unpaid'
        ]);

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Error exporting invoices:", err);
      alert("Failed to export invoices. Please try again.");
    }
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
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
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
                Invoices
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

              {/* Export Button */}
              {(loginDetails?.role === "Admin" || access.includes("export")) && (
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </button>
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
              <p className="text-sm text-slate-400 mt-1">Create your first invoice now</p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition"
              >
                Create Invoice
              </button>
            </div>
          ) : (
            <>
              {/* Table - Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <th className="p-3 text-left font-semibold">Invoice</th>
                      <th className="p-3 text-left font-semibold">Client</th>
                      <th className="p-3 text-left font-semibold">Mobile</th>
                      <th className="p-3 text-left font-semibold">Date</th>
                      <th className="p-3 text-right font-semibold">Amount</th>
                      <th className="p-3 text-center font-semibold">PDF</th>
                      <th className="p-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv, index) => (
                      <tr
                        key={inv._id}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                          }`}
                      >
                        <td className="p-3 font-semibold text-teal-600">
                          INV{String(inv._id).slice(-6).toUpperCase()}
                        </td>
                        <td className="p-3 font-medium text-slate-800">
                          {inv.clientName}
                        </td>
                        <td className="p-3 text-slate-600">
                          {inv.clientMobile}
                        </td>
                        <td className="p-3 text-slate-600">
                          {formatDate(inv.date)}
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-800">
                          {formatCurrency(inv.totalAmount || inv.subtotal)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${inv.invoicePdfURL
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                              }`}
                          >
                            {inv.invoicePdfURL ? "PDF" : "No PDF"}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            {/* View Button */}
                            {(loginDetails?.role === "Admin" || access.includes("view")) && (
                              <button
                                onClick={() => handleViewPdf(inv._id)}
                                title="View PDF"
                                disabled={!inv.invoicePdfURL}
                                className={`p-1.5 rounded-lg transition ${inv.invoicePdfURL
                                  ? "text-blue-600 hover:bg-blue-50"
                                  : "text-gray-400 cursor-not-allowed"
                                  }`}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            )}

                            {/* Download Button */}
                            {(loginDetails?.role === "Admin" || access.includes("download")) && (
                              <button
                                onClick={() => handleDownload(inv._id)}
                                disabled={downloading === inv._id || !inv.invoicePdfURL}
                                className={`p-1.5 rounded-lg transition ${downloading === inv._id
                                  ? "text-gray-400 cursor-not-allowed"
                                  : inv.invoicePdfURL
                                    ? "text-teal-600 hover:bg-teal-50"
                                    : "text-gray-400 cursor-not-allowed"
                                  }`}
                                title="Download PDF"
                              >
                                {downloading === inv._id ? (
                                  <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></span>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                )}
                              </button>
                            )}

                            {/* Edit Button */}
                            {(loginDetails?.role === "Admin" || access.includes("edit")) && (
                              <button
                                onClick={() => handleEdit(inv._id)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="Edit Invoice"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}

                            {/* Delete Button */}
                            {(loginDetails?.role === "Admin" || access.includes("delete")) && (
                              <button
                                onClick={() => {
                                  setInvoiceToDelete(inv._id);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete Invoice"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards - Mobile/Tablet View */}
              <div className="md:hidden space-y-4">
                {invoices.map((inv) => (
                  <div
                    key={inv._id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-teal-600 text-sm">
                          INV{String(inv._id).slice(-6).toUpperCase()}
                        </p>
                        <p className="font-medium text-slate-800 mt-1">
                          {inv.clientName}
                        </p>
                      </div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${inv.status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                          }`}
                      >
                        {inv.status || "Unpaid"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <p className="text-slate-500">Mobile</p>
                        <p className="font-medium text-slate-700">{inv.clientMobile}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Date</p>
                        <p className="font-medium text-slate-700">{formatDate(inv.date)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-500">Amount</p>
                        <p className="font-bold text-lg text-slate-800">
                          {formatCurrency(inv.totalAmount || inv.subtotal)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewPdf(inv._id)}
                        disabled={!inv.invoicePdfURL}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(inv._id)}
                        disabled={downloading === inv._id || !inv.invoicePdfURL}
                        className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {downloading === inv._id ? '...' : 'Download'}
                      </button>
                      <button
                        onClick={() => handleEdit(inv._id)}
                        className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setInvoiceToDelete(inv._id);
                          setShowDeleteModal(true);
                        }}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
                      >
                        Delete
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
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${pagination.currentPage === 1
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                    >
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">‹</span>
                    </button>

                    {getPageNumbers().map((page, index) => (
                      <button
                        key={index}
                        onClick={() => typeof page === 'number' && handlePageChange(page)}
                        className={`min-w-[2.2rem] h-9 rounded-lg text-sm font-medium transition ${page === pagination.currentPage
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
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${pagination.currentPage === pagination.totalPages
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                    >
                      <span className="hidden sm:inline">Next</span>
                      <span className="sm:hidden">›</span>
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Invoice PDF</h3>
              <button
                onClick={() => {
                  setShowPdfModal(false);
                  setPdfUrl("");
                  setSelectedInvoice(null);
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
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = pdfUrl;
                  link.download = `invoice-${selectedInvoice}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition"
              >
                Download PDF
              </button>
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