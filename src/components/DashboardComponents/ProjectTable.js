import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaTrash } from "react-icons/fa";

const ProjectsTable = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 5;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("https://pms-crm-backend.onrender.com/api/projects");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setProjects(data.data);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Pagination logic
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = projects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(projects.length / projectsPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-0">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center p-4 pb-3">
          <h4 className="mb-0 fw-bold">Latest Projects</h4>
          <button
            className="btn text-white px-4"
            style={{ backgroundColor: "#009788" }}
            onClick={() => navigate("/add-project")}
          >
            + New
          </button>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead style={{ backgroundColor: "#f8f9fa" }}>
              <tr>
                <th className="py-3 px-4 border-0">S.No</th>
                <th className="py-3 px-4 border-0">Project ID</th>
                <th className="py-3 px-4 border-0">Project Name</th>
                <th className="py-3 px-4 border-0">Client Name</th>
                <th className="py-3 px-4 border-0">Mobile No</th>
                <th className="py-3 px-4 border-0">Status</th>
                <th className="py-3 px-4 border-0 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    Loading projects...
                  </td>
                </tr>
              ) : currentProjects.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No projects found
                  </td>
                </tr>
              ) : (
                currentProjects.map((project, index) => (
                  <tr
                    key={project._id}
                    style={
                      project.status?.toLowerCase() === "process"
                        ? {
                            background:
                              "linear-gradient(to right, #009688, #26a69a)",
                            color: "white",
                          }
                        : {}
                    }
                  >
                    <td className="py-3 px-4">{indexOfFirstProject + index + 1}</td>
                    <td className="py-3 px-4">
                      {project._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3 px-4">{project.projectname}</td>
                    <td className="py-3 px-4">{project.clientname}</td>
                    <td className="py-3 px-4">{project.mobilenumber}</td>
                    <td className="py-3 px-4">
                      {project.status?.toLowerCase() === "process" ? (
                        <span>{project.status}</span>
                      ) : (
                        <span className="badge bg-success text-capitalize">
                          {project.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="d-flex justify-content-center gap-3">
                        <FaEye
                          className="text-primary"
                          style={{ cursor: "pointer", fontSize: "18px" }}
                          title="View"
                        />
                        <FaTrash
                          className="text-danger"
                          style={{
                            cursor: "pointer",
                            fontSize: "18px",
                            color:
                              project.status?.toLowerCase() === "process"
                                ? "white"
                                : "#dc3545",
                          }}
                          title="Delete"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && projects.length > 0 && (
          <div className="d-flex justify-content-between align-items-center p-3 border-top">
            <small className="text-muted">
              Page {currentPage} of {totalPages}
            </small>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={handlePrev}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={handleNext}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsTable;
