import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { leadService } from '../services/leadService';
import { propertyService } from '../services/propertyService';
import { bookingService } from '../services/bookingService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { formatCurrency } from '../utils/format';

const STEPS = ['Select Lead', 'Select Property', 'Select Unit', 'Review & Confirm'];

const BookingCreate = () => {
  const { toggleSidebar } = useOutletContext();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const preselectedLeadId = searchParams.get('leadId');

  const [step, setStep] = useState(0);

  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);

  const [conflictError, setConflictError] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    leadService
      .list({ limit: 100 })
      .then((res) => {
        const bookable = res.data.data.filter((l) => l.stage !== 'Lost' && l.stage !== 'Booked');
        setLeads(bookable);
        if (preselectedLeadId) {
          const found = bookable.find((l) => l._id === preselectedLeadId);
          if (found) {
            setSelectedLead(found);
            setStep(1);
          }
        }
      })
      .finally(() => setLoadingLeads(false));

    propertyService.listProjects().then((res) => setProjects(res.data.data));
  }, [preselectedLeadId]);

  const handleSelectProject = async (project) => {
    setSelectedProject(project);
    setSelectedBuilding(null);
    const res = await propertyService.listBuildings({ project: project._id });
    setBuildings(res.data.data);
  };

  const handleSelectBuilding = async (building) => {
    setSelectedBuilding(building);
    setStep(2);
    setLoadingUnits(true);
    try {
      const res = await propertyService.listUnits({ building: building._id, status: 'Available' });
      setUnits(res.data.data);
    } finally {
      setLoadingUnits(false);
    }
  };

  const refreshUnits = async () => {
    if (!selectedBuilding) return;
    setLoadingUnits(true);
    try {
      const res = await propertyService.listUnits({ building: selectedBuilding._id, status: 'Available' });
      setUnits(res.data.data);
    } finally {
      setLoadingUnits(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    setConflictError('');
    try {
      await bookingService.create({ leadId: selectedLead._id, unitId: selectedUnit._id });
      toast.success('Booking created successfully');
      navigate('/bookings');
    } catch (err) {
      if (err.response?.status === 409) {
        setConflictError('Unit is no longer available. Someone else may have just booked it. Please choose another unit.');
        setSelectedUnit(null);
        refreshUnits();
      } else {
        toast.error(getErrorMessage(err));
      }
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      <Header
        title="New Booking"
        breadcrumb="CRM / Bookings / New"
        onToggleSidebar={toggleSidebar}
        actions={
          <Button variant="outline-secondary" icon={ArrowLeft} onClick={() => navigate('/bookings')}>
            Back
          </Button>
        }
      />
      <div className="app-content">
        <div className="step-indicator">
          {STEPS.map((s, idx) => (
            <div key={s} className={`step-indicator__item ${idx === step ? 'active' : ''} ${idx < step ? 'done' : ''}`}>
              {idx + 1}. {s}
            </div>
          ))}
        </div>

        <div className="card-surface p-4">
          {step === 0 && (
            <>
              <div className="section-title">Select a lead to book for</div>
              {loadingLeads ? (
                <Loading label="Loading leads..." />
              ) : leads.length === 0 ? (
                <EmptyState title="No bookable leads" description="All leads are either already booked or marked as lost." />
              ) : (
                <div className="row g-2">
                  {leads.map((lead) => (
                    <div className="col-md-6 col-lg-4" key={lead._id}>
                      <div
                        className={`unit-tile ${selectedLead?._id === lead._id ? 'selected' : ''}`}
                        onClick={() => setSelectedLead(lead)}
                      >
                        <div className="fw-semibold">{lead.name}</div>
                        <div className="text-muted-sm">{lead.phone}</div>
                        <Badge>{lead.stage}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="d-flex justify-content-end mt-3">
                <Button variant="brass" icon={ArrowRight} disabled={!selectedLead} onClick={() => setStep(1)}>
                  Next: Select Property
                </Button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="section-title">Select project & building</div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Project</label>
                  <div className="d-flex flex-column gap-2">
                    {projects.map((p) => (
                      <div
                        key={p._id}
                        className={`unit-tile ${selectedProject?._id === p._id ? 'selected' : ''}`}
                        onClick={() => handleSelectProject(p)}
                      >
                        <div className="fw-semibold">{p.name}</div>
                        <div className="text-muted-sm">{p.location}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Building</label>
                  {!selectedProject ? (
                    <div className="text-muted-sm">Select a project first.</div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {buildings.map((b) => (
                        <div
                          key={b._id}
                          className={`unit-tile ${selectedBuilding?._id === b._id ? 'selected' : ''}`}
                          onClick={() => handleSelectBuilding(b)}
                        >
                          <div className="fw-semibold">{b.name}</div>
                          <div className="text-muted-sm">{b.availableUnitCount} available units</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="d-flex justify-content-between mt-3">
                <Button variant="outline-secondary" icon={ArrowLeft} onClick={() => setStep(0)}>
                  Back
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="section-title">Select an available unit</div>
              {loadingUnits ? (
                <Loading label="Loading units..." />
              ) : units.length === 0 ? (
                <EmptyState title="No available units" description="This building has no available units right now." />
              ) : (
                <div className="row g-2">
                  {units.map((unit) => (
                    <div className="col-md-4 col-lg-3" key={unit._id}>
                      <div
                        className={`unit-tile ${selectedUnit?._id === unit._id ? 'selected' : ''}`}
                        onClick={() => setSelectedUnit(unit)}
                      >
                        <div className="fw-semibold">{unit.unitNumber}</div>
                        <div className="text-muted-sm">{unit.type} · Floor {unit.floor}</div>
                        <div className="fw-semibold">{formatCurrency(unit.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="d-flex justify-content-between mt-3">
                <Button variant="outline-secondary" icon={ArrowLeft} onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button variant="brass" icon={ArrowRight} disabled={!selectedUnit} onClick={() => setStep(3)}>
                  Next: Review
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="section-title">Review booking</div>

              {conflictError && (
                <div className="alert alert-danger d-flex align-items-center gap-2">
                  <AlertCircle size={18} /> {conflictError}
                </div>
              )}

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <div className="text-muted-sm">Customer</div>
                  <div className="fw-semibold">{selectedLead?.name}</div>
                  <div className="text-muted-sm">{selectedLead?.phone}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-muted-sm">Property</div>
                  <div className="fw-semibold">{selectedProject?.name}</div>
                  <div className="text-muted-sm">{selectedBuilding?.name}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-muted-sm">Unit</div>
                  <div className="fw-semibold">
                    {selectedUnit?.unitNumber} ({selectedUnit?.type}, Floor {selectedUnit?.floor})
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="text-muted-sm">Price</div>
                  <div className="fw-semibold fs-5">{formatCurrency(selectedUnit?.price)}</div>
                </div>
              </div>

              <div className="d-flex justify-content-between">
                <Button variant="outline-secondary" icon={ArrowLeft} onClick={() => setStep(2)} disabled={confirming}>
                  Back
                </Button>
                <Button variant="brass" icon={CheckCircle2} loading={confirming} onClick={handleConfirm}>
                  Confirm Booking
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default BookingCreate;
