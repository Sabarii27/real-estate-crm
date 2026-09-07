import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Plus, XCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { bookingService } from '../services/bookingService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';

const Bookings = () => {
  const { toggleSidebar } = useOutletContext();
  const toast = useToast();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    bookingService
      .list()
      .then((res) => setBookings(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await bookingService.update(cancelTarget._id, { status: 'Cancelled' });
      toast.success('Booking cancelled and unit released');
      setCancelTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const columns = [
    { key: 'lead', header: 'Lead / Customer', render: (b) => <div><div className="fw-semibold">{b.lead?.name}</div><div className="text-muted-sm">{b.lead?.phone}</div></div> },
    { key: 'unit', header: 'Unit', render: (b) => b.unit?.unitNumber || '—' },
    { key: 'project', header: 'Project', render: (b) => b.project?.name || '—' },
    { key: 'building', header: 'Building', render: (b) => b.building?.name || '—' },
    { key: 'price', header: 'Price', render: (b) => formatCurrency(b.price) },
    { key: 'bookedBy', header: 'Booked By', render: (b) => b.bookedBy?.name || '—' },
    { key: 'bookingDate', header: 'Booking Date', render: (b) => formatDate(b.bookingDate) },
    { key: 'status', header: 'Status', render: (b) => <Badge variant={b.status}>{b.status}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      render: (b) =>
        b.status === 'Confirmed' && (
          <button className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1" onClick={() => setCancelTarget(b)}>
            <XCircle size={13} /> Cancel
          </button>
        ),
    },
  ];

  return (
    <>
      <Header
        title="Bookings"
        breadcrumb="CRM / Bookings"
        onToggleSidebar={toggleSidebar}
        actions={
          <Button variant="brass" icon={Plus} onClick={() => navigate('/bookings/new')}>
            New Booking
          </Button>
        }
      />
      <div className="app-content">
        <div className="card-surface">
          <Table
            columns={columns}
            rows={bookings}
            loading={loading}
            error={error}
            onRetry={load}
            emptyTitle="No bookings yet"
            emptyDescription="Start a new booking to connect a lead with an available unit."
          />
        </div>
      </div>

      <ConfirmDialog
        show={!!cancelTarget}
        title="Cancel booking"
        message={`Cancel the booking for ${cancelTarget?.lead?.name}? Unit ${cancelTarget?.unit?.unitNumber} will become available again.`}
        confirmLabel="Cancel booking"
        confirmVariant="danger"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </>
  );
};

export default Bookings;
