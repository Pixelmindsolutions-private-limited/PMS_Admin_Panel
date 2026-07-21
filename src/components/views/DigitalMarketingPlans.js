import React, { useState, useEffect } from 'react';
import {
    MdAdd,
    MdEdit,
    MdDelete,
    MdRefresh,
    MdClose,
    MdCheckCircle,
    MdWarning,
    MdArrowBack,
    MdPriceCheck,
    MdFeaturedPlayList,
    MdAccessTime,
    MdMoney,
    MdList,
    MdToggleOn,
    MdToggleOff,
    MdSearch,
    MdVisibility,
    MdInfo,
    MdCalendarToday,
    MdAttachMoney
} from 'react-icons/md';
import { FaClipboardList } from 'react-icons/fa';

const API_BASE_URL = "https://pmsbackend.pixelmindsolutions.com/api/digitalmarketing";

const adminDetails = JSON.parse(sessionStorage.getItem("adminDetails"));
const AUTH_TOKEN = adminDetails?.token;

const DigitalMarketingPlans = () => {
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [filteredPlans, setFilteredPlans] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [formData, setFormData] = useState({
        planName: '',
        durations: [
            { duration: '1 month', price: '' },
            { duration: '3 months', price: '' },
            { duration: '6 months', price: '' }
        ],
        features: ['']
    });

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [planToDelete, setPlanToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // View details modal state
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewPlan, setViewPlan] = useState(null);

    // Toast state
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    // Fetch all plans
    const fetchPlans = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/plans`, {
                headers: {
                    Authorization: `Bearer ${AUTH_TOKEN}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const json = await response.json();
            console.log("Plans response:", json);

            if (json.success && Array.isArray(json.data)) {
                setPlans(json.data);
                setFilteredPlans(json.data);
            } else {
                throw new Error(json.message || "Invalid response format");
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setError(err.message || "Failed to fetch plans");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    // Filter plans based on search
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredPlans(plans);
        } else {
            const term = searchTerm.toLowerCase().trim();
            const filtered = plans.filter(plan =>
                plan.planName?.toLowerCase().includes(term) ||
                plan.features?.some(feature => feature.toLowerCase().includes(term))
            );
            setFilteredPlans(filtered);
        }
    }, [searchTerm, plans]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle duration changes
    const handleDurationChange = (index, field, value) => {
        const updatedDurations = [...formData.durations];
        updatedDurations[index] = { ...updatedDurations[index], [field]: value };
        setFormData(prev => ({ ...prev, durations: updatedDurations }));
    };

    // Handle feature changes
    const handleFeatureChange = (index, value) => {
        const updatedFeatures = [...formData.features];
        updatedFeatures[index] = value;
        setFormData(prev => ({ ...prev, features: updatedFeatures }));
    };

    // Add new feature field
    const addFeatureField = () => {
        setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
    };

    // Remove feature field
    const removeFeatureField = (index) => {
        if (formData.features.length <= 1) return;
        const updatedFeatures = formData.features.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, features: updatedFeatures }));
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            planName: '',
            durations: [
                { duration: '1 month', price: '' },
                { duration: '3 months', price: '' },
                { duration: '6 months', price: '' }
            ],
            features: ['']
        });
        setSelectedPlan(null);
        setModalMode('create');
    };

    // Open create modal
    const handleCreate = () => {
        resetForm();
        setModalMode('create');
        setShowModal(true);
    };

    // Open edit modal
    const handleEdit = (plan) => {
        setSelectedPlan(plan);
        setFormData({
            planName: plan.planName,
            durations: plan.durations.map(d => ({ duration: d.duration, price: d.price })),
            features: plan.features
        });
        setModalMode('edit');
        setShowModal(true);
    };

    // Open view details modal
    const handleViewDetails = (plan) => {
        setViewPlan(plan);
        setShowViewModal(true);
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!formData.planName.trim()) {
                throw new Error('Plan name is required');
            }
            if (formData.features.some(f => !f.trim())) {
                throw new Error('All features must have content');
            }
            if (formData.durations.some(d => !d.price || d.price <= 0)) {
                throw new Error('All durations must have valid prices');
            }

            const url = modalMode === 'create'
                ? `${API_BASE_URL}/createplan`
                : `${API_BASE_URL}/plan/${selectedPlan._id}`;

            const method = modalMode === 'create' ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method: method,
                headers: {
                    Authorization: `Bearer ${AUTH_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setShowModal(false);
                setToastMessage(modalMode === 'create' ? 'Plan created successfully!' : 'Plan updated successfully!');
                setToastType('success');
                setShowToast(true);
                fetchPlans();
                resetForm();
                setTimeout(() => setShowToast(false), 3000);
            } else {
                throw new Error(data.message || 'Failed to save plan');
            }
        } catch (err) {
            console.error("Save error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!planToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/plan/${planToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${AUTH_TOKEN}`,
                    "Content-Type": "application/json",
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setShowDeleteModal(false);
                setPlanToDelete(null);
                setToastMessage('Plan deleted successfully!');
                setToastType('success');
                setShowToast(true);
                fetchPlans();
                setTimeout(() => setShowToast(false), 3000);
            } else {
                throw new Error(data.message || 'Failed to delete plan');
            }
        } catch (err) {
            console.error("Delete error:", err);
            setError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    // Toggle plan active status
    const togglePlanStatus = async (plan) => {
        try {
            const updatedPlan = { ...plan, isActive: !plan.isActive };
            const response = await fetch(`${API_BASE_URL}/plan/${plan._id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${AUTH_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    planName: plan.planName,
                    durations: plan.durations.map(d => ({ duration: d.duration, price: d.price })),
                    features: plan.features,
                    isActive: !plan.isActive
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                fetchPlans();
                setToastMessage(`Plan ${updatedPlan.isActive ? 'activated' : 'deactivated'} successfully!`);
                setToastType('success');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            } else {
                throw new Error(data.message || 'Failed to update plan status');
            }
        } catch (err) {
            console.error("Status toggle error:", err);
            setError(err.message);
        }
    };

    if (loading && plans.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/80 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading plans...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/80 py-3 sm:py-4 md:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
            {/* TOAST NOTIFICATION */}
            {showToast && (
                <div className={`fixed top-4 right-4 z-50 ${toastType === 'success' ? 'bg-gradient-to-r from-teal-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-rose-500'
                    } text-white px-4 sm:px-6 py-3 rounded-xl shadow-lg animate-fade-in-up flex items-center gap-2 max-w-[90vw] sm:max-w-md`}>
                    {toastType === 'success' ? <MdCheckCircle size={20} className="animate-pulse shrink-0" /> : <MdWarning size={20} className="shrink-0" />}
                    <span className="text-sm sm:text-base">{toastMessage}</span>
                </div>
            )}

            {/* CREATE/EDIT MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl max-h-[95vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                                {modalMode === 'create' ? 'Create New Plan' : 'Edit Plan'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                    setError(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                <MdClose size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Plan Name */}
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Plan Name *
                                </label>
                                <input
                                    type="text"
                                    name="planName"
                                    value={formData.planName}
                                    onChange={handleInputChange}
                                    placeholder="Enter plan name (e.g., Basic, Premium)"
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all outline-none text-gray-700 text-sm sm:text-base"
                                    required
                                />
                            </div>

                            {/* Durations */}
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Durations & Prices *
                                </label>
                                {formData.durations.map((duration, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-2">
                                        <input
                                            type="text"
                                            value={duration.duration}
                                            onChange={(e) => handleDurationChange(index, 'duration', e.target.value)}
                                            placeholder="e.g., 1 month"
                                            className="flex-1 px-3 sm:px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all outline-none text-gray-700 text-sm"
                                            required
                                        />
                                        <input
                                            type="number"
                                            value={duration.price}
                                            onChange={(e) => handleDurationChange(index, 'price', e.target.value)}
                                            placeholder="Price"
                                            className="w-full sm:w-32 px-3 sm:px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all outline-none text-gray-700 text-sm"
                                            required
                                            min="0"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Features */}
                            <div className="mb-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Features *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addFeatureField}
                                        className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 self-start sm:self-auto"
                                    >
                                        <MdAdd size={16} /> Add Feature
                                    </button>
                                </div>
                                {formData.features.map((feature, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={feature}
                                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                                            placeholder={`Feature ${index + 1}`}
                                            className="flex-1 px-3 sm:px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all outline-none text-gray-700 text-sm"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeFeatureField(index)}
                                            className="px-3 py-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                            disabled={formData.features.length <= 1}
                                        >
                                            <MdClose size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200">
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                        setError(null);
                                    }}
                                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors order-2 sm:order-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        modalMode === 'create' ? 'Create Plan' : 'Update Plan'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl mx-3 sm:mx-0">
                        <div className="flex items-start gap-3 sm:gap-4 mb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <MdWarning className="text-red-500" size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base sm:text-lg font-bold text-gray-800">Delete Plan</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Are you sure you want to delete <strong className="break-words">"{planToDelete?.planName}"</strong>?
                                    This action cannot be undone.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setPlanToDelete(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                            >
                                <MdClose size={24} />
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setPlanToDelete(null);
                                }}
                                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors order-2 sm:order-1"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <MdDelete size={18} />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW DETAILS MODAL */}
            {showViewModal && viewPlan && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto mx-3 sm:mx-0">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30 shrink-0">
                                    <FaClipboardList className="text-white" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">{viewPlan.planName}</h2>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${viewPlan.isActive
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-500"
                                            }`}>
                                            {viewPlan.isActive ? "Active" : "Inactive"}
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                            <MdAccessTime size={14} />
                                            {viewPlan.durations.length} Durations
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                            <MdFeaturedPlayList size={14} />
                                            {viewPlan.features.length} Features
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                                            <MdInfo size={14} />
                                            Created: {new Date(viewPlan.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setViewPlan(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 shrink-0"
                            >
                                <MdClose size={28} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Durations Section */}
                            <div className="bg-teal-50 rounded-2xl p-4 sm:p-5">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <MdAttachMoney className="text-teal-600" size={20} />
                                    Pricing & Durations
                                </h3>
                                <div className="space-y-2">
                                    {viewPlan.durations.map((duration, idx) => (
                                        <div key={idx} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                                                    <MdCalendarToday className="text-teal-600" size={16} />
                                                </div>
                                                <span className="font-medium text-gray-700">{duration.duration}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm text-gray-500">₹</span>
                                                <span className="text-lg font-bold text-teal-700">{duration.price.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-teal-200">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total Durations</span>
                                        <span className="font-semibold text-gray-700">{viewPlan.durations.length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Features Section */}
                            <div className="bg-blue-50 rounded-2xl p-4 sm:p-5">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <MdFeaturedPlayList className="text-blue-600" size={20} />
                                    Features List
                                </h3>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                    {viewPlan.features.map((feature, idx) => (
                                        <div key={idx} className="bg-white rounded-xl p-3 flex items-start gap-3 shadow-sm hover:shadow-md transition-all">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-blue-700 text-xs font-bold">{idx + 1}</span>
                                            </div>
                                            <span className="text-sm text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-blue-200">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total Features</span>
                                        <span className="font-semibold text-gray-700">{viewPlan.features.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end border-t border-gray-200 pt-4">
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    handleEdit(viewPlan);
                                }}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                <MdEdit size={18} />
                                Edit Plan
                            </button>
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setViewPlan(null);
                                }}
                                className="px-6 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-screen-2xl mx-auto">
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30 shrink-0">
                            <FaClipboardList className="text-white" size={18} />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent tracking-tight leading-tight">
                                Digital Marketing Plans
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full inline-block" />
                                <span>{filteredPlans.length} plans available</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-medium hover:shadow-lg transition-all text-xs sm:text-sm flex-1 sm:flex-none justify-center"
                        >
                            <MdAdd size={18} />
                            <span>Create Plan</span>
                        </button>
                        <button
                            onClick={fetchPlans}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/80 border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                        >
                            <MdRefresh size={16} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* SEARCH */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-5 md:mb-6 border border-teal-100/50 shadow-xl shadow-teal-500/5">
                    <div className="relative">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search plans by name or features..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all duration-200 text-sm text-gray-700 bg-white outline-none"
                        />
                    </div>
                </div>

                {/* PLANS GRID */}
                {error && (
                    <div className="mb-4 p-3 sm:p-4 bg-red-50 rounded-xl border border-red-200">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {filteredPlans.length === 0 ? (
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 sm:p-12 text-center border border-teal-100/50 shadow-xl shadow-teal-500/5">
                        <div className="text-gray-400">
                            <FaClipboardList size={48} className="mx-auto mb-3 opacity-50" />
                            <p className="text-lg font-medium text-gray-600">No plans found</p>
                            <p className="text-sm text-gray-400 mt-1">Create your first digital marketing plan</p>
                            <button
                                onClick={handleCreate}
                                className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-medium hover:shadow-lg transition-all"
                            >
                                Create Plan
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                        {filteredPlans.map((plan) => (
                            <div
                                key={plan._id}
                                className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-teal-100/50 shadow-xl shadow-teal-500/5 hover:shadow-xl hover:shadow-teal-500/10 transition-all"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base sm:text-lg font-bold text-gray-800 truncate">{plan.planName}</h3>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${plan.isActive
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-100 text-gray-500"
                                                }`}>
                                                {plan.isActive ? "Active" : "Inactive"}
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-purple-100 text-purple-700">
                                                {plan.durations.length} Durations
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-blue-100 text-blue-700">
                                                {plan.features.length} Features
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                        <button
                                            onClick={() => handleViewDetails(plan)}
                                            className="p-1 sm:p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                                            title="View Details"
                                        >
                                            <MdVisibility size={16} />
                                        </button>
                                        <button
                                            onClick={() => togglePlanStatus(plan)}
                                            className="p-1 sm:p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                            title={plan.isActive ? "Deactivate" : "Activate"}
                                        >
                                            {plan.isActive ?
                                                <MdToggleOn className="text-teal-600" size={20} /> :
                                                <MdToggleOff className="text-gray-400" size={20} />
                                            }
                                        </button>
                                        <button
                                            onClick={() => handleEdit(plan)}
                                            className="p-1 sm:p-1.5 rounded-lg hover:bg-teal-50 text-teal-600 transition-colors"
                                            title="Edit"
                                        >
                                            <MdEdit size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setPlanToDelete(plan);
                                                setShowDeleteModal(true);
                                            }}
                                            className="p-1 sm:p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                            title="Delete"
                                        >
                                            <MdDelete size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Durations */}
                                <div className="mb-3">
                                    <h4 className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1">
                                        <MdAccessTime size={12} /> Durations
                                    </h4>
                                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                                        {plan.durations.map((duration, idx) => (
                                            <div key={idx} className="bg-teal-50 rounded-lg p-1.5 sm:p-2 text-center">
                                                <p className="text-[10px] sm:text-xs text-gray-600 truncate">{duration.duration}</p>
                                                <p className="text-xs sm:text-sm font-bold text-teal-700">₹{duration.price.toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Features - Show only count and view button */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                            <MdFeaturedPlayList size={12} /> Features
                                        </h4>
                                        <button
                                            onClick={() => handleViewDetails(plan)}
                                            className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 transition-colors"
                                        >
                                            <MdVisibility size={14} />
                                            View All ({plan.features.length})
                                        </button>
                                    </div>
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                        {/* Show only first 3 features as preview */}
                                        {plan.features.slice(0, 3).map((feature, idx) => (
                                            <span key={idx} className="inline-block px-2 py-0.5 bg-gray-100 rounded-full text-[9px] sm:text-xs text-gray-600 truncate max-w-[120px]">
                                                {feature}
                                            </span>
                                        ))}
                                        {plan.features.length > 3 && (
                                            <span className="inline-block px-2 py-0.5 bg-teal-100 rounded-full text-[9px] sm:text-xs text-teal-700 font-medium">
                                                +{plan.features.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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

export default DigitalMarketingPlans;