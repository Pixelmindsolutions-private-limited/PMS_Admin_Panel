import React, { useEffect, useState } from 'react';

const ProjectNav = () => {
    const [projects, setProjects] = useState([]);
    const [activeCategory, setActiveCategory] = useState('mobile app');
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    const categories = ['mobile app', 'website', 'digital market'];

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch('https://pms-crm-backend.onrender.com/api/projects');
                const data = await res.json();
                if (data.success) {
                    setProjects(data.data);
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const handleProjectClick = async (projectId) => {
        setModalLoading(true);
        try {
            const res = await fetch(`https://pms-crm-backend.onrender.com/api/project/${projectId}`);
            const data = await res.json();
            if (data.success) {
                setSelectedProject(data.data);
            }
        } catch (error) {
            console.error('Error fetching project details:', error);
        } finally {
            setModalLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedProject(null);
    };

    // Filter by category AND exclude completed projects
    const filteredProjects = projects.filter(
        (p) => p.selectcategory === activeCategory && p.status !== 'completed'
    );

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-teal-600 to-teal-700 mb-4">
                        Our Projects
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Explore our latest work across different categories. Click on a tab to filter projects.
                    </p>
                </div>

                {/* Category Navigation */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${activeCategory === cat
                                ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-lg shadow-purple-500/20'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-gray-400 mb-4 text-5xl">📁</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No projects found</h3>
                        <p className="text-gray-500">There are no projects in the "{activeCategory}" category yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project) => (
                            <div
                                key={project._id}
                                onClick={() => handleProjectClick(project._id)}
                                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1 cursor-pointer"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                                            {project.projectname}
                                        </h3>
                                        <span className="inline-block px-2 py-1 text-xs font-medium bg-teal-100 text-teal-700 rounded-full">
                                            {activeCategory}
                                        </span>
                                    </div>
                                    {project.description && (
                                        <p className="mt-3 text-gray-600 text-sm line-clamp-2">
                                            {project.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modern Gradient Modal */}
            {selectedProject && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={closeModal}
                >
                    <div
                        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 z-10 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {modalLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedProject.projectname}</h2>
                                <p className="text-sm text-purple-600 font-medium mb-6">
                                    {selectedProject.selectcategory.charAt(0).toUpperCase() + selectedProject.selectcategory.slice(1)}
                                </p>

                                <div className="space-y-3">
                                    <DetailRow label="Client Name" value={selectedProject.clientname} />
                                    <DetailRow label="Email" value={selectedProject.email} />
                                    <DetailRow label="Mobile" value={selectedProject.mobilenumber} />
                                    <DetailRow label="Start Date" value={formatDate(selectedProject.startDate)} />
                                    <DetailRow label="End Date" value={formatDate(selectedProject.endDate)} />
                                    <DetailRow label="Total Price" value={`₹${selectedProject.totalprice?.toLocaleString() || '0'}`} />
                                    <DetailRow label="Advance Paid" value={`₹${selectedProject.advance?.toLocaleString() || '0'}`} />
                                    <DetailRow label="Balance Payment" value={`₹${selectedProject.balancepayment?.toLocaleString() || '0'}`} />
                                    <DetailRow label="Second Payment" value={`₹${selectedProject.secondpayment?.toLocaleString() || '0'}`} />
                                    <DetailRow label="Status" value={
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedProject.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {selectedProject.status?.charAt(0).toUpperCase() + selectedProject.status?.slice(1) || '—'}
                                        </span>
                                    } />
                                    <DetailRow label="Payment Status" value={
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedProject.paymentStatus === 'paid'
                                                ? 'bg-blue-100 text-blue-800'
                                                : selectedProject.paymentStatus === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                            {selectedProject.paymentStatus?.charAt(0).toUpperCase() + selectedProject.paymentStatus?.slice(1) || '—'}
                                        </span>
                                    } />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailRow = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 py-2 border-b border-gray-100 last:border-0">
        <span className="font-medium text-gray-700 min-w-[140px]">{label}:</span>
        <span className="text-gray-900 font-medium break-words text-right sm:text-left">{value || '—'}</span>
    </div>
);

export default ProjectNav;
