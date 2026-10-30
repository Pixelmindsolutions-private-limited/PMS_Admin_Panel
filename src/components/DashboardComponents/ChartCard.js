import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ChartCard = () => {
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
        setLoading(true);

        const countsRes = await fetch("https://pms-crm-backend.onrender.com/api/counts");
        const countsData = await countsRes.json();

        const staffRes = await fetch("https://pms-crm-backend.onrender.com/api/get_all_staffs");
        const staffData = await staffRes.json();

        if (countsData.success && staffData.success) {
          setCounts({
            totalProjects: countsData.totalProjects || 0,
            apps: countsData.categoryCounts?.["mobile app"] || 0,
            websites: countsData.categoryCounts?.["website"] || 0,
            marketing: countsData.categoryCounts?.["digital market"] || 0,
            staff: staffData.count || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const data = {
    labels: ["Projects", "Apps", "Websites", "Marketing", "Staff"],
    datasets: [
      {
        label: "Count",
        data: [
          counts.totalProjects,
          counts.apps,
          counts.websites,
          counts.marketing,
          counts.staff,
        ],
        backgroundColor: [
          "rgba(0, 123, 255, 0.8)",
          "rgba(40, 167, 69, 0.8)",
          "rgba(255, 193, 7, 0.8)",
          "rgba(220, 53, 69, 0.8)",
          "rgba(111, 66, 193, 0.8)",
        ],
        borderRadius: 8,
        hoverBackgroundColor: [
          "rgba(0, 123, 255, 1)",
          "rgba(40, 167, 69, 1)",
          "rgba(255, 193, 7, 1)",
          "rgba(220, 53, 69, 1)",
          "rgba(111, 66, 193, 1)",
        ],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Ensures flexible resizing
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Dashboard Overview",
        font: { size: 18, weight: "bold" },
        color: "#333",
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#fff",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#555",
          font: { size: 12 },
        },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#555",
          stepSize: 1,
        },
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
      },
    },
  };

  return (
    <div
      className="card border-0 shadow-sm h-100"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(245,247,250,1) 100%)",
        borderRadius: "16px",
      }}
    >
      <div className="card-body p-4">
        <h5 className="fw-semibold mb-4 text-center text-md-start">
          📊 Graphical Representation
        </h5>

        {loading ? (
          <div
            className="text-center text-muted d-flex align-items-center justify-content-center"
            style={{ height: "250px" }}
          >
            Loading chart...
          </div>
        ) : (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "300px",
            }}
            className="chart-container"
          >
            <Bar data={data} options={options} />
          </div>
        )}
      </div>

      {/* Responsive Styling */}
      <style jsx>{`
        @media (max-width: 768px) {
          .chart-container {
            height: 250px !important;
          }
          h5 {
            font-size: 16px;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .chart-container {
            height: 220px !important;
          }
          h5 {
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default ChartCard;
