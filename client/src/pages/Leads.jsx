import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Pencil } from 'lucide-react';
import Header from '../components/layout/Header';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import LeadFormModal from '../components/leads/LeadFormModal';
import { leadService } from '../services/leadService';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { formatDate } from '../utils/format';
import { LEAD_STAGES } from '../utils/constants';

const Leads = () => {
  const { toggleSidebar } = useOutletContext();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    leadService
      .list({ search: search || undefined, stage: stageFilter || undefined, assignedTo: assigneeFilter || undefined })
      .then((res) => setLeads(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [search, stageFilter, assigneeFilter]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (isAdmin) {
      userService.list().then((res) => setEmployees(res.data.data.filter((u) => u.role === 'sales')));
    }
  }, [isAdmin]);

  const openCreate = () => {
    setEditingLead(null);
    setShowForm(true);
  };
  const openEdit = (lead) => {
    setEditingLead(lead);
    setShowForm(true);
  };

  const handleSubmit = async (payload) => {
    try {
      if (editingLead) {
        await leadService.update(editingLead._id, payload);
        toast.success('Lead updated successfully');
      } else {
        await leadService.create(payload);
        toast.success('Lead created successfully');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const columns = [
    { key: 'name', header: 'Lead', render: (l) => <span className="fw-semibold">{l.name}</span> },
    { key: 'contact', header: 'Contact', render: (l) => <div><div>{l.phone}</div><div className="text-muted-sm">{l.email || '—'}</div></div> },
    { key: 'stage', header: 'Stage', render: (l) => <Badge>{l.stage}</Badge> },
    { key: 'assignedTo', header: 'Assigned To', render: (l) => l.assignedTo?.name || <span className="text-muted-sm">Unassigned</span> },
    { key: 'followUpDate', header: 'Follow-up', render: (l) => formatDate(l.followUpDate) },
    { key: 'createdAt', header: 'Created', render: (l) => formatDate(l.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (l) => (
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/leads/${l._id}`)} title="View">
            <Eye size={14} />
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => openEdit(l)} title="Edit">
            <Pencil size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Header
        title="Leads"
        breadcrumb="CRM / Leads"
        onToggleSidebar={toggleSidebar}
        actions={
          <Button variant="brass" icon={Plus} onClick={openCreate}>
            Add Lead
          </Button>
        }
      />
      <div className="app-content">
        <div className="card-surface p-3 mb-3">
          <div className="row g-2">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <Search size={15} />
                </span>
                <input
                  className="form-control border-start-0"
                  placeholder="Search by name, phone or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <Select
                placeholder="All stages"
                options={LEAD_STAGES}
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
              />
            </div>
            {isAdmin && (
              <div className="col-md-4">
                <Select
                  placeholder="All employees"
                  options={employees.map((e) => ({ value: e._id, label: e.name }))}
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="card-surface">
          <Table
            columns={columns}
            rows={leads}
            loading={loading}
            error={error}
            onRetry={load}
            emptyTitle="No leads found"
            emptyDescription="Try adjusting your search or filters, or add a new lead."
          />
        </div>
      </div>

      <LeadFormModal
        show={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        initial={editingLead}
        employees={employees}
        isAdmin={isAdmin}
      />
    </>
  );
};

export default Leads;
