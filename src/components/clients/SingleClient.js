import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MdEdit, MdArrowBack, MdDownload, MdPhone, MdEmail, MdLocationOn, MdPerson, MdCancel, MdCheckCircle } from 'react-icons/md';
import { FaUsers, FaCalendarAlt, FaTag } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const API_URL = 'https://pmsbackend.pixelmindsolutions.com/api/clients';
const adminDetails = JSON.parse(sessionStorage.getItem('adminDetails'));
const AUTH_TOKEN = adminDetails?.token;

const SingleClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      });
      const data = await response.json();

      if (data.success) {
        const clientData = data.data ? { ...data.data, leadStatus: normalizeLeadStatus(data.data.leadStatus || data.data.status || data.data.lead) } : data.data;
        setClient(clientData);
      } else {
        setError(data.message || 'Failed to load client details');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const normalizeLeadStatus = (value) => {
    const raw = value === undefined || value === null ? '' : String(value).trim();
    if (!raw) return 'Running';

    const normalized = raw.toLowerCase();
    if (['converted', 'conversion', 'converted lead', 'won', 'closed won'].includes(normalized)) {
      return 'Converted';
    }
    if (['cancelled', 'canceled', 'cancel', 'rejected', 'lost', 'closed lost'].includes(normalized)) {
      return 'Cancelled';
    }
    return 'Running';
  };

  const showToast = (type, message) => {
    setToastMsg({ type, message });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Update lead status (Converted / Cancelled)
  const handleStatusUpdate = async (status) => {
    if (!client) return;

    const nextStatus = ['Running', 'Converted', 'Cancelled'].includes(status)
      ? status
      : normalizeLeadStatus(status);

    setStatusUpdating(true);
    try {
      const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadStatus: nextStatus,
          status: nextStatus,
          lead: nextStatus,
        }),
      });
      const data = await response.json();

      if (data.success) {
        const updatedStatus = normalizeLeadStatus(data.data?.leadStatus || data.data?.status || data.data?.lead || nextStatus);
        setClient(prev => ({ ...prev, leadStatus: updatedStatus }));
        showToast('success', `Client marked as ${updatedStatus}`);
      } else {
        showToast('error', data.message || data.error || 'Failed to update status');
      }
    } catch (err) {
      showToast('error', 'Network error while updating status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportToExcel = () => {
    if (!client) return;
    const ws = XLSX.utils.json_to_sheet([{
      'Name': client.name,
      'Mobile': client.mobile,
      'Email': client.email,
      'Address': client.address,
      'Lead Source': client.lead,
      'Created': formatDate(client.createdAt),
      'Updated': formatDate(client.updatedAt),
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Client');
    XLSX.writeFile(wb, `client_${client.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
        <div className="flex flex-col items-center gap-3">
          <div style={{ width: 44, height: 44, border: '3px solid #e0f2f1', borderTop: '3px solid #0d9488', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
          <p className="text-gray-500 text-sm font-medium">Loading client details…</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">⚠️</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Client Not Found</h2>
          <p className="text-gray-500 text-sm mb-5">{error || 'This client does not exist.'}</p>
          <button onClick={() => navigate('/clients')}
            className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors">
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { font-family:'Inter',-apple-system,sans-serif; box-sizing:border-box; }
        .info-card { transition:background .15s; }
        .info-card:hover { background:rgba(240,253,250,0.7); }
        @keyframes slideDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        .toast-in { animation:slideDown .3s ease forwards; }
        @media print {
          .no-print { display:none!important; }
          body { background:white!important; }
        }
      `}</style>

      {/* Toast */}
      {toastMsg && (
        <div className={`toast-in fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl font-semibold text-sm max-w-sm no-print ${toastMsg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          <span>{toastMsg.type === 'success' ? '✓' : '!'}</span>
          <span className="flex-1 text-sm">{toastMsg.message}</span>
          <button onClick={() => setToastMsg(null)} className="opacity-80 hover:opacity-100 ml-1">✕</button>
        </div>
      )}

      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Top Nav */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 no-print">
          <button onClick={() => navigate('/clients')}
            className="flex items-center gap-2 text-gray-600 hover:text-teal-700 font-medium text-sm transition-colors self-start">
            <MdArrowBack size={18} /> Back to Clients
          </button>
        </div>

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-600 rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="p-6 md:p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold shadow-lg">
                    {client.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold truncate">{client.name}</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-sm text-white/80">
                        <FaTag size={12} /> {client.lead || 'No lead source'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                  {client.mobile && (
                    <div className="flex items-center gap-2 text-white/90 text-sm bg-white/10 rounded-lg px-3 py-2">
                      <MdPhone size={16} />
                      <a href={`tel:${client.mobile}`} className="hover:text-white transition-colors">
                        {client.mobile}
                      </a>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-white/90 text-sm bg-white/10 rounded-lg px-3 py-2">
                      <MdEmail size={16} />
                      <a href={`mailto:${client.email}`} className="hover:text-white transition-colors truncate">
                        {client.email}
                      </a>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2 text-white/90 text-sm bg-white/10 rounded-lg px-3 py-2 col-span-1 sm:col-span-2 lg:col-span-1">
                      <MdLocationOn size={16} />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info (Left - 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                <MdPerson className="inline mr-2 text-teal-600" /> Client Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem label="Full Name" value={client.name} icon="👤" />
                <InfoItem label="Mobile Number" value={client.mobile} icon="📱" />
                <InfoItem label="Email Address" value={client.email} icon="📧" />
                <InfoItem label="Lead Source" value={client.lead} icon="🎯" />
                <InfoItem label="Address" value={client.address} icon="📍" className="sm:col-span-2" />
              </div>
            </div>
          </div>

          {/* Sidebar (Right - 1 column) */}
          <div className="space-y-6">
            {/* Timestamps Card with Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                <FaCalendarAlt className="inline mr-2 text-teal-600" /> Timestamps
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <InfoItem label="Created At" value={formatDate(client.createdAt)} icon="🕐" />
                <InfoItem label="Last Updated" value={formatDate(client.updatedAt)} icon="🔄" />
                <InfoItem label="Client ID" value={client._id} icon="🆔" />
              </div>

              {/* Lead Actions inside Timestamps card */}
              {/* Lead Actions inside Timestamps card */}
              <div className="mt-6 pt-4 border-t border-gray-100">

                {client.leadStatus && (
                  <p className="text-xs text-gray-500 mb-3 text-center">
                    Current status: <span className="font-semibold text-gray-700">{client.leadStatus}</span>
                  </p>
                )}
                <div className="flex items-center justify-center gap-3">

                  <button
                    onClick={() => handleStatusUpdate('Cancelled')}
                    disabled={statusUpdating}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <MdCancel size={16} /> Cancel
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('Converted')}
                    disabled={statusUpdating}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <MdCheckCircle size={16} /> Convert
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value, icon, className = "" }) => (
  <div className={`p-3 rounded-xl bg-gray-50 ${className}`}>
    <p className="text-xs text-gray-500 font-medium mb-1">{icon} {label}</p>
    <p className="text-sm font-semibold text-gray-800 break-words">{value || '—'}</p>
  </div>
);

export default SingleClient;