import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Send, Home } from 'lucide-react';
import Header from '../components/layout/Header';
import Loading from '../components/common/Loading';
import ErrorState from '../components/common/ErrorState';
import Badge from '../components/common/Badge';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import LeadFormModal from '../components/leads/LeadFormModal';
import { leadService } from '../services/leadService';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';
import { LEAD_STAGES } from '../utils/constants';

const LeadDetails = () => {
  const { id } = useParams();
  const { toggleSidebar } = useOutletContext();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [stageSaving, setStageSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    leadService
      .get(id)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  useEffect(() => {
    if (isAdmin) userService.list().then((res) => setEmployees(res.data.data.filter((u) => u.role === 'sales')));
  }, [isAdmin]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      await leadService.addNote(id, noteText.trim());
      setNoteText('');
      toast.success('Note added');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAddingNote(false);
    }
  };

  const handleStageChange = async (e) => {
    const stage = e.target.value;
    setStageSaving(true);
    try {
      await leadService.update(id, { stage });
      toast.success('Lead stage updated');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setStageSaving(false);
    }
  };

  const handleEditSubmit = async (payload) => {
    try {
      await leadService.update(id, payload);
      toast.success('Lead updated successfully');
      setShowEdit(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Lead Details" onToggleSidebar={toggleSidebar} />
        <div className="app-content">
          <Loading label="Loading lead..." />
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header title="Lead Details" onToggleSidebar={toggleSidebar} />
        <div className="app-content">
          <ErrorState message={error || 'Lead not found'} onRetry={load} />
        </div>
      </>
    );
  }

  const { lead, booking } = data;
  const stageOptions = LEAD_STAGES.filter((s) => s !== 'Booked');

  return (
    <>
      <Header
        title={lead.name}
        breadcrumb="CRM / Leads / Details"
        onToggleSidebar={toggleSidebar}
        actions={
          <>
            <Button variant="outline-secondary" icon={ArrowLeft} onClick={() => navigate('/leads')}>
              Back
            </Button>
            <Button variant="brass" icon={Pencil} onClick={() => setShowEdit(true)}>
              Edit
            </Button>
          </>
        }
      />
      <div className="app-content">
        <div className="row g-3">
          <div className="col-lg-8">
            <div className="card-surface p-4 mb-3">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="mb-1">{lead.name}</h5>
                  <div className="text-muted-sm">{lead.phone} {lead.email && `· ${lead.email}`}</div>
                </div>
                <Badge>{lead.stage}</Badge>
              </div>
              <div className="row g-3">
                <div className="col-6 col-md-3">
                  <div className="text-muted-sm">Source</div>
                  <div className="fw-semibold">{lead.source}</div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-muted-sm">Assigned To</div>
                  <div className="fw-semibold">{lead.assignedTo?.name || 'Unassigned'}</div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-muted-sm">Follow-up Date</div>
                  <div className="fw-semibold">{formatDate(lead.followUpDate)}</div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-muted-sm">Created</div>
                  <div className="fw-semibold">{formatDate(lead.createdAt)}</div>
                </div>
              </div>

              {lead.stage !== 'Booked' && (
                <div className="mt-3" style={{ maxWidth: 260 }}>
                  <Select label="Update stage" options={stageOptions} value={lead.stage} onChange={handleStageChange} disabled={stageSaving} />
                </div>
              )}

              {booking && (
                <div className="mt-3 p-3 rounded-3" style={{ background: 'var(--success-100)' }}>
                  <div className="d-flex align-items-center gap-2 fw-semibold mb-1" style={{ color: 'var(--success)' }}>
                    <Home size={16} /> Booking Confirmed
                  </div>
                  <div className="text-body">
                    Unit {booking.unit?.unitNumber} ({booking.unit?.type}) in {booking.project?.name}, {booking.building?.name} —{' '}
                    {formatCurrency(booking.price)}
                  </div>
                  <div className="text-muted-sm">Booked by {booking.bookedBy?.name} on {formatDate(booking.bookingDate)}</div>
                </div>
              )}
            </div>

            <div className="card-surface p-4">
              <div className="section-title">Notes</div>
              <form onSubmit={handleAddNote} className="d-flex gap-2 mb-3">
                <input
                  className="form-control"
                  placeholder="Add a note about this lead..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <Button type="submit" variant="ink" icon={Send} loading={addingNote}>
                  Add
                </Button>
              </form>
              {lead.notes.length === 0 ? (
                <div className="text-muted-sm">No notes yet.</div>
              ) : (
                <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
                  {[...lead.notes].reverse().map((note) => (
                    <li key={note._id} className="border-bottom pb-2">
                      <div>{note.text}</div>
                      <div className="text-muted-sm">
                        {note.addedBy?.name || 'Unknown'} · {formatDateTime(note.createdAt)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card-surface p-4">
              <div className="section-title">Activity History</div>
              {lead.activity.length === 0 ? (
                <div className="text-muted-sm">No activity recorded.</div>
              ) : (
                <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
                  {[...lead.activity].reverse().map((act, idx) => (
                    <li key={idx} className="border-bottom pb-2">
                      <div>{act.message}</div>
                      <div className="text-muted-sm">{formatDateTime(act.createdAt)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {!booking && lead.stage !== 'Lost' && (
              <div className="card-surface p-4 mt-3 text-center">
                <div className="fw-semibold mb-2">Ready to book?</div>
                <div className="text-muted-sm mb-3">Start a booking flow for this lead.</div>
                <Link to={`/bookings/new?leadId=${lead._id}`} className="btn btn-brass w-100">
                  Book a Unit
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <LeadFormModal
        show={showEdit}
        onClose={() => setShowEdit(false)}
        onSubmit={handleEditSubmit}
        initial={lead}
        employees={employees}
        isAdmin={isAdmin}
      />
    </>
  );
};

export default LeadDetails;
