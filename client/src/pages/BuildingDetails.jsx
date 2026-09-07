import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil } from 'lucide-react';
import Header from '../components/layout/Header';
import Loading from '../components/common/Loading';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import UnitFormModal from '../components/properties/UnitFormModal';
import { propertyService } from '../services/propertyService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { formatCurrency } from '../utils/format';
import { UNIT_TYPES, UNIT_STATUSES } from '../utils/constants';

const BuildingDetails = () => {
  const { id } = useParams();
  const { toggleSidebar } = useOutletContext();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [building, setBuilding] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    propertyService
      .getBuilding(id)
      .then((res) => {
        setBuilding(res.data.data.building);
        setUnits(res.data.data.units);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  const openCreate = () => {
    setEditingUnit(null);
    setShowForm(true);
  };
  const openEdit = (unit) => {
    setEditingUnit(unit);
    setShowForm(true);
  };

  const handleSubmit = async (payload) => {
    try {
      if (editingUnit) {
        await propertyService.updateUnit(editingUnit._id, payload);
        toast.success('Unit updated successfully');
      } else {
        await propertyService.createUnit({ ...payload, project: building.project._id, building: building._id });
        toast.success('Unit created successfully');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const filteredUnits = units.filter((u) => (!typeFilter || u.type === typeFilter) && (!statusFilter || u.status === statusFilter));

  if (loading) {
    return (
      <>
        <Header title="Building" onToggleSidebar={toggleSidebar} />
        <div className="app-content">
          <Loading label="Loading building..." />
        </div>
      </>
    );
  }

  if (error || !building) {
    return (
      <>
        <Header title="Building" onToggleSidebar={toggleSidebar} />
        <div className="app-content">
          <ErrorState message={error || 'Building not found'} onRetry={load} />
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title={building.name}
        breadcrumb={`CRM / Properties / ${building.project?.name}`}
        onToggleSidebar={toggleSidebar}
        actions={
          <>
            <Button variant="outline-secondary" icon={ArrowLeft} onClick={() => navigate('/properties')}>
              Back
            </Button>
            {isAdmin && (
              <Button variant="brass" icon={Plus} onClick={openCreate}>
                Add Unit
              </Button>
            )}
          </>
        }
      />
      <div className="app-content">
        <div className="card-surface p-3 mb-3">
          <div className="row g-2">
            <div className="col-md-4">
              <Select placeholder="All types" options={UNIT_TYPES} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} />
            </div>
            <div className="col-md-4">
              <Select placeholder="All statuses" options={UNIT_STATUSES} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
            </div>
          </div>
        </div>

        {filteredUnits.length === 0 ? (
          <div className="card-surface">
            <EmptyState title="No units found" description="Try adjusting your filters or add a new unit." />
          </div>
        ) : (
          <div className="row g-3">
            {filteredUnits.map((unit) => (
              <div className="col-md-4 col-lg-3" key={unit._id}>
                <div className={`unit-tile h-100 ${unit.status === 'Booked' ? 'disabled' : ''}`}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="fw-semibold fs-6">{unit.unitNumber}</div>
                    <Badge variant={unit.status}>{unit.status}</Badge>
                  </div>
                  <div className="text-muted-sm mb-1">{unit.type} · Floor {unit.floor}</div>
                  <div className="fw-semibold mb-2">{formatCurrency(unit.price)}</div>
                  {isAdmin && (
                    <button className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-1" onClick={() => openEdit(unit)}>
                      <Pencil size={13} /> Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UnitFormModal show={showForm} onClose={() => setShowForm(false)} onSubmit={handleSubmit} initial={editingUnit} buildingName={building.name} />
    </>
  );
};

export default BuildingDetails;
