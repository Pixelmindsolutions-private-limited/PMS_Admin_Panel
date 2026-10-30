import React, { useEffect, useState } from 'react';
import { FaProjectDiagram, FaMobileAlt, FaGlobe, FaBullhorn, FaUsers } from 'react-icons/fa';

const WelcomeCard = () => {
  const [counts, setCounts] = useState({
    totalProjects: 0,
    apps: 0,
    websites: 0,
    marketing: 0,
    staff: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const countsRes = await fetch('https://pms-crm-backend.onrender.com/api/counts');
        const countsData = await countsRes.json();

        const staffRes = await fetch('https://pms-crm-backend.onrender.com/api/get_all_staffs');
        const staffData = await staffRes.json();

        if (countsData.success && staffData.success) {
          setCounts({
            totalProjects: countsData.totalProjects || 0,
            apps: countsData.categoryCounts?.['mobile app'] || 0,
            websites: countsData.categoryCounts?.['website'] || 0,
            marketing: countsData.categoryCounts?.['digital market'] || 0,
            staff: staffData.count || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const stats = [
    { number: counts.totalProjects, label: 'Projects', icon: <FaProjectDiagram className="text-3xl" />, color: 'bg-blue-500' },
    { number: counts.apps, label: 'Apps', icon: <FaMobileAlt className="text-3xl" />, color: 'bg-green-500' },
    { number: counts.websites, label: 'Websites', icon: <FaGlobe className="text-3xl" />, color: 'bg-yellow-500' },
    { number: counts.marketing, label: 'Marketing', icon: <FaBullhorn className="text-3xl" />, color: 'bg-red-500' },
    { number: counts.staff, label: 'Staff', icon: <FaUsers className="text-3xl" />, color: 'bg-purple-500' },
  ];

  return (
    <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl shadow-xl overflow-hidden text-white max-w-full mx-auto">
      <div className="p-4 sm:p-6 md:p-8 text-center">
        <h4 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 sm:mb-5">Welcome Back!</h4>

        {/* Avatar */}
        <div className="flex justify-center mb-4 sm:mb-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-white flex items-center justify-center shadow-lg">
            <span className="text-3xl sm:text-4xl md:text-5xl">👤</span>
          </div>
        </div>

        <h5 className="text-lg sm:text-xl md:text-2xl font-medium mb-5 sm:mb-7">Ganapathi Varma</h5>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          {loading ? (
            <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-5 text-center py-4">
              <div className="inline-block h-5 w-5 sm:h-6 sm:w-6 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
            </div>
          ) : (
            stats.map((stat, index) => (
              <div
                key={index}
                className={`flex flex-col items-center justify-center p-3 rounded-xl ${stat.color} transition-transform duration-300 hover:scale-105 shadow-md`}
              >
                <div className="mb-1 text-white">{stat.icon}</div>
                <div className="text-xl sm:text-2xl md:text-2xl font-bold">{stat.number}</div>
                <div className="text-xs sm:text-sm md:text-base mt-1 opacity-90">{stat.label}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;
