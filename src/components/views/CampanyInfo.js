import React, { useState, useEffect } from 'react';
import {
  MdEdit,
  MdDelete,
  MdRefresh,
  MdClose,
  MdCheckCircle,
  MdWarning,
  MdSave,
  MdCancel,
  MdBusiness,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdLanguage,
  MdPerson,
  MdBadge,
  MdImage,
  MdCloudUpload,
  MdDeleteForever
} from 'react-icons/md';
import { FaBuilding, FaUserTie } from 'react-icons/fa';

const CompanyInfo = () => {
  const [loading, setLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [error, setError] = useState(null);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    mobile: '',
    address: '',
    website: '',
    owner: '',
    role: '',
    logo: null
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  
  // Delete logo state
  const [showDeleteLogoModal, setShowDeleteLogoModal] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Fetch company info from localStorage
  const fetchCompanyInfo = () => {
    setLoading(true);
    setError(null);
    try {
      // Get company info from localStorage
      const storedData = localStorage.getItem('companyInfo');
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log("Company info from localStorage:", parsedData);
        
        setCompanyInfo(parsedData);
        setFormData({
          companyName: parsedData.companyName || '',
          email: parsedData.email || '',
          mobile: parsedData.mobile || '',
          address: parsedData.address || '',
          website: parsedData.website || '',
          owner: parsedData.owner || '',
          role: parsedData.role || '',
          logo: parsedData.logo || null
        });
        setLogoPreview(parsedData.logo || null);
      } else {
        // Set default company info if not exists
        const defaultData = {
          companyName: 'Pixel Mind Solutions',
          email: 'info@pixelmind.com',
          mobile: '+91 9876543210',
          address: '123, Business Park, Mumbai, India',
          website: 'https://pixelmindsolutions.com',
          owner: 'Admin',
          role: 'CEO',
          logo: null
        };
        localStorage.setItem('companyInfo', JSON.stringify(defaultData));
        setCompanyInfo(defaultData);
        setFormData(defaultData);
        setLogoPreview(null);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch company info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showToastMessage('Logo size should be less than 2MB', 'error');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        showToastMessage('Please upload an image file', 'error');
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove logo
  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logo: null }));
  };

  // Handle update company info
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!formData.companyName.trim()) {
        throw new Error('Company name is required');
      }
      if (!formData.email.trim()) {
        throw new Error('Email is required');
      }
      if (!formData.mobile.trim()) {
        throw new Error('Mobile number is required');
      }

      // Prepare data to save
      const dataToSave = {
        companyName: formData.companyName,
        email: formData.email,
        mobile: formData.mobile,
        address: formData.address || '',
        website: formData.website || '',
        owner: formData.owner || '',
        role: formData.role || '',
        logo: logoPreview || formData.logo || null,
        updatedAt: new Date().toISOString()
      };

      // Save to localStorage
      localStorage.setItem('companyInfo', JSON.stringify(dataToSave));
      
      // Update state
      setCompanyInfo(dataToSave);
      setIsEditing(false);
      
      setToastMessage('Company info updated successfully!');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete logo
  const handleDeleteLogo = async () => {
    setIsDeletingLogo(true);
    try {
      // Update company info without logo
      const updatedData = {
        ...companyInfo,
        logo: null
      };
      
      // Save to localStorage
      localStorage.setItem('companyInfo', JSON.stringify(updatedData));
      
      // Update state
      setCompanyInfo(updatedData);
      setLogoPreview(null);
      setFormData(prev => ({ ...prev, logo: null }));
      
      setShowDeleteLogoModal(false);
      setToastMessage('Logo deleted successfully!');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
    } catch (err) {
      console.error("Delete logo error:", err);
      setError(err.message);
    } finally {
      setIsDeletingLogo(false);
    }
  };

  // Show toast notification
  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
    // Reset form data to original
    if (companyInfo) {
      setFormData({
        companyName: companyInfo.companyName || '',
        email: companyInfo.email || '',
        mobile: companyInfo.mobile || '',
        address: companyInfo.address || '',
        website: companyInfo.website || '',
        owner: companyInfo.owner || '',
        role: companyInfo.role || '',
        logo: companyInfo.logo || null
      });
      setLogoPreview(companyInfo.logo || null);
      setLogoFile(null);
    }
  };

  if (loading && !companyInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/80 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading company info...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/80 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
      {/* TOAST NOTIFICATION */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 ${
          toastType === 'success' ? 'bg-gradient-to-r from-teal-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-rose-500'
        } text-white px-4 sm:px-6 py-3 rounded-xl shadow-lg animate-fade-in-up flex items-center gap-2 max-w-[90vw] sm:max-w-md`}>
          {toastType === 'success' ? <MdCheckCircle size={20} className="animate-pulse shrink-0" /> : <MdWarning size={20} className="shrink-0" />}
          <span className="text-sm sm:text-base">{toastMessage}</span>
        </div>
      )}

      {/* DELETE LOGO CONFIRMATION MODAL */}
      {showDeleteLogoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl mx-3 sm:mx-0">
            <div className="flex items-start gap-3 sm:gap-4 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <MdWarning className="text-red-500" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-gray-800">Delete Logo</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete the company logo? This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteLogoModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              >
                <MdClose size={24} />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => setShowDeleteLogoModal(false)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors order-2 sm:order-1"
                disabled={isDeletingLogo}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLogo}
                disabled={isDeletingLogo}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
              >
                {isDeletingLogo ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <MdDeleteForever size={18} />
                    Delete Logo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30 shrink-0">
              <FaBuilding className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent tracking-tight">
                Company Information
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full inline-block" />
                Manage company details
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-medium hover:shadow-lg transition-all text-sm"
              >
                <MdEdit size={18} />
                Edit Info
              </button>
            ) : (
              <button
                onClick={fetchCompanyInfo}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                <MdRefresh size={16} />
                Refresh
              </button>
            )}
          </div>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-xl border border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* COMPANY INFO CARD */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-teal-100/50 shadow-xl shadow-teal-500/5 overflow-hidden">
          {isEditing ? (
            // EDIT MODE
            <form onSubmit={handleUpdate} className="p-4 sm:p-6 md:p-8">
              {/* Logo Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company Logo
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative">
                    {logoPreview ? (
                      <div className="relative group">
                        <img
                          src={logoPreview}
                          alt="Company Logo"
                          className="w-24 h-24 rounded-xl object-cover border-2 border-teal-200"
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <MdClose size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <MdImage className="text-gray-400" size={32} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors border border-teal-200 max-w-fit">
                        <MdCloudUpload size={20} />
                        <span className="text-sm font-medium">Upload Logo</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Max size: 2MB, Format: JPG, PNG, SVG</p>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <div className="relative">
                    <MdBusiness className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all outline-none text-gray-700"
                      placeholder="Enter company name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all outline-none text-gray-700"
                      placeholder="Enter email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mobile *
                  </label>
                  <div className="relative">
                    <MdPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all outline-none text-gray-700"
                      placeholder="Enter mobile number"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Website
                  </label>
                  <div className="relative">
                    <MdLanguage className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all outline-none text-gray-700"
                      placeholder="Enter website URL"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MdLocationOn className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all outline-none text-gray-700 resize-none"
                      placeholder="Enter company address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Owner
                  </label>
                  <div className="relative">
                    <FaUserTie className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="owner"
                      value={formData.owner}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all outline-none text-gray-700"
                      placeholder="Enter owner name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role
                  </label>
                  <div className="relative">
                    <MdBadge className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all outline-none text-gray-700"
                      placeholder="Enter role (e.g., CEO, Director)"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <MdCancel size={18} />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <MdSave size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            // VIEW MODE
            <div className="p-4 sm:p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6 pb-6 border-b border-gray-200">
                {/* Logo Display */}
                <div className="relative group">
                  {companyInfo?.logo ? (
                    <img
                      src={companyInfo.logo}
                      alt="Company Logo"
                      className="w-28 h-28 rounded-xl object-cover border-2 border-teal-200 shadow-lg"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-xl bg-gradient-to-br from-teal-100 to-teal-50 border-2 border-teal-200 flex items-center justify-center">
                      <FaBuilding className="text-teal-400" size={40} />
                    </div>
                  )}
                  {companyInfo?.logo && (
                    <button
                      onClick={() => setShowDeleteLogoModal(true)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Logo"
                    >
                      <MdDelete size={16} />
                    </button>
                  )}
                </div>

                {/* Company Name & Status */}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    {companyInfo?.companyName || 'N/A'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Active
                    </span>
                    {companyInfo?.role && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                        <MdBadge size={14} />
                        {companyInfo.role}
                      </span>
                    )}
                    {companyInfo?.updatedAt && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                        Updated: {new Date(companyInfo.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <MdEmail size={16} />
                    <span>Email</span>
                  </div>
                  <p className="text-gray-800 font-medium">{companyInfo?.email || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <MdPhone size={16} />
                    <span>Mobile</span>
                  </div>
                  <p className="text-gray-800 font-medium">{companyInfo?.mobile || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <MdLanguage size={16} />
                    <span>Website</span>
                  </div>
                  <p className="text-gray-800 font-medium">
                    {companyInfo?.website ? (
                      <a href={companyInfo.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                        {companyInfo.website}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <FaUserTie size={16} />
                    <span>Owner</span>
                  </div>
                  <p className="text-gray-800 font-medium">{companyInfo?.owner || 'N/A'}</p>
                </div>

                <div className="md:col-span-2 bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <MdLocationOn size={16} />
                    <span>Address</span>
                  </div>
                  <p className="text-gray-800 font-medium">{companyInfo?.address || 'N/A'}</p>
                </div>
              </div>

              {/* Edit Button at Bottom */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <MdEdit size={18} />
                  Edit Company Info
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease forwards;
        }
      `}</style>
    </div>
  );
};

export default CompanyInfo;