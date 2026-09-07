import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Plus, MapPin, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '../components/layout/Header';
import Loading from '../components/common/Loading';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import ProjectFormModal from '../components/properties/ProjectFormModal';
import BuildingFormModal from '../components/properties/BuildingFormModal';
import { propertyService } from '../services/propertyService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';

const Properties = () => {
  const { toggleSidebar } = useOutletContext();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [buildingsByProject, setBuildingsByProject] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showBuildingForm, setShowBuildingForm] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);

  const loadProjects = () => {
    setLoading(true);
    setError('');
    propertyService
      .listProjects()
      .then((res) => setProjects(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(loadProjects, []);

  const toggleExpand = async (projectId) => {
    if (expanded === projectId) {
      setExpanded(null);
      return;
    }
    setExpanded(projectId);
    if (!buildingsByProject[projectId]) {
      try {
        const res = await propertyService.listBuildings({ project: projectId });
        setBuildingsByProject((prev) => ({ ...prev, [projectId]: res.data.data }));
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    }
  };

  const handleCreateProject = async (payload) => {
    try {
      await propertyService.createProject(payload);
      toast.success('Project created successfully');
      setShowProjectForm(false);
      loadProjects();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const openBuildingForm = (projectId) => {
    setActiveProjectId(projectId);
    setShowBuildingForm(true);
  };

  const handleCreateBuilding = async (payload) => {
    try {
      await propertyService.createBuilding({ ...payload, project: activeProjectId });
      toast.success('Building created successfully');
      setShowBuildingForm(false);
      const res = await propertyService.listBuildings({ project: activeProjectId });
      setBuildingsByProject((prev) => ({ ...prev, [activeProjectId]: res.data.data }));
      loadProjects();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <>
      <Header
        title="Properties"
        breadcrumb="CRM / Properties"
        onToggleSidebar={toggleSidebar}
        actions={
          isAdmin && (
            <Button variant="brass" icon={Plus} onClick={() => setShowProjectForm(true)}>
              Add Project
            </Button>
          )
        }
      />
      <div className="app-content">
        {loading && <Loading label="Loading properties..." />}
        {!loading && error && <ErrorState message={error} onRetry={loadProjects} />}

        {!loading && !error && projects.length === 0 && (
          <EmptyState
            icon={Building2}
            title="No projects yet"
            description="Create your first project to start adding buildings and units."
          />
        )}

        {!loading &&
          !error &&
          projects.map((project) => (
            <div key={project._id} className="card-surface mb-3">
              <div
                className="d-flex justify-content-between align-items-center p-3 clickable"
                onClick={() => toggleExpand(project._id)}
              >
                <div>
                  <div className="fw-semibold fs-6">{project.name}</div>
                  <div className="text-muted-sm d-flex align-items-center gap-1">
                    <MapPin size={12} /> {project.location}
                  </div>
                </div>
                <div className="d-flex align-items-center gap-4">
                  <div className="text-center">
                    <div className="fw-semibold">{project.buildingCount}</div>
                    <div className="text-muted-sm">Buildings</div>
                  </div>
                  <div className="text-center">
                    <div className="fw-semibold" style={{ color: 'var(--success)' }}>
                      {project.availableUnitCount}
                    </div>
                    <div className="text-muted-sm">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="fw-semibold">{project.unitCount}</div>
                    <div className="text-muted-sm">Total Units</div>
                  </div>
                  {expanded === project._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {expanded === project._id && (
                <div className="border-top p-3">
                  {project.description && <p className="text-muted-sm">{project.description}</p>}
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="section-title mb-0">Buildings</div>
                    {isAdmin && (
                      <Button variant="outline-secondary" icon={Plus} onClick={() => openBuildingForm(project._id)}>
                        Add Building
                      </Button>
                    )}
                  </div>

                  {!buildingsByProject[project._id] ? (
                    <Loading label="Loading buildings..." />
                  ) : buildingsByProject[project._id].length === 0 ? (
                    <EmptyState title="No buildings yet" description="Add a building to start listing units." />
                  ) : (
                    <div className="row g-3">
                      {buildingsByProject[project._id].map((b) => (
                        <div className="col-md-4" key={b._id}>
                          <div
                            className="unit-tile h-100"
                            onClick={() => navigate(`/properties/buildings/${b._id}`)}
                          >
                            <div className="fw-semibold">{b.name}</div>
                            {b.description && <div className="text-muted-sm mb-2">{b.description}</div>}
                            <div className="d-flex justify-content-between text-muted-sm">
                              <span>{b.unitCount} units</span>
                              <span style={{ color: 'var(--success)' }}>{b.availableUnitCount} available</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>

      <ProjectFormModal show={showProjectForm} onClose={() => setShowProjectForm(false)} onSubmit={handleCreateProject} />
      <BuildingFormModal
        show={showBuildingForm}
        onClose={() => setShowBuildingForm(false)}
        onSubmit={handleCreateBuilding}
        projectName={projects.find((p) => p._id === activeProjectId)?.name}
      />
    </>
  );
};

export default Properties;
