import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  Users2,
  UserPlus,
  CalendarClock,
  CalendarCheck2,
  Building2,
  Home,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Header from '../components/layout/Header';
import Loading from '../components/common/Loading';
import ErrorState from '../components/common/ErrorState';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import { dashboardService } from '../services/dashboardService';
import { getErrorMessage } from '../services/api';
import { formatCurrency, formatDate, isToday } from '../utils/format';

const emptyStats = {
  totalLeads: 0,
  newLeads: 0,
  totalBookings: 0,
  availableUnits: 0,
  bookedUnits: 0,
  leadsByStage: [],
  todaysFollowUps: [],
  upcomingFollowUps: [],
  recentBookings: [],
};

const KpiCard = ({ label, value, icon: Icon, tint }) => (
  <div className="kpi-card">
    <div className="d-flex align-items-center justify-content-between">
      <div className="kpi-card__label">{label}</div>
      <div className="kpi-card__icon" style={{ background: tint + '22', color: tint }}>
        <Icon size={18} />
      </div>
    </div>
    <div className="kpi-card__value">{value}</div>
  </div>
);

const Dashboard = () => {
  const { toggleSidebar } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    dashboardService
      .stats()
      .then((res) => setStats({ ...emptyStats, ...(res.data?.data || {}) }))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <>
      <Header title="Dashboard" breadcrumb="Overview" onToggleSidebar={toggleSidebar} />
      <div className="app-content">
        {loading && <Loading label="Loading dashboard..." />}
        {!loading && error && <ErrorState message={error} onRetry={load} />}

        {!loading && !error && stats && (
          <>
            <div className="row g-3 mb-4">
              <div className="col-6 col-lg-3">
                <KpiCard label="Total Leads" value={stats.totalLeads} icon={Users2} tint="#2f6fa8" />
              </div>
              <div className="col-6 col-lg-3">
                <KpiCard label="New Leads" value={stats.newLeads} icon={UserPlus} tint="#b8863b" />
              </div>
              <div className="col-6 col-lg-3">
                <KpiCard label="Total Bookings" value={stats.totalBookings} icon={CalendarCheck2} tint="#1a8754" />
              </div>
              <div className="col-6 col-lg-3">
                <KpiCard label="Available Units" value={stats.availableUnits} icon={Building2} tint="#c0392b" />
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-lg-7">
                <div className="card-surface p-3 h-100">
                  <div className="section-title">Leads by Stage</div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={stats.leadsByStage} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f5" />
                      <XAxis dataKey="stage" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#b8863b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-lg-5">
                <div className="card-surface p-3 h-100">
                  <div className="section-title">Property Inventory</div>
                  <div className="d-flex flex-column gap-3 justify-content-center h-100">
                    <div className="d-flex justify-content-between align-items-center p-3 rounded-3" style={{ background: 'var(--success-100)' }}>
                      <div>
                        <div className="fw-semibold">Available Units</div>
                        <div className="text-muted-sm">Ready to be booked</div>
                      </div>
                      <div className="fs-3 fw-bold" style={{ color: 'var(--success)' }}>{stats.availableUnits}</div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center p-3 rounded-3" style={{ background: 'var(--danger-100)' }}>
                      <div>
                        <div className="fw-semibold">Booked Units</div>
                        <div className="text-muted-sm">Currently sold / reserved</div>
                      </div>
                      <div className="fs-3 fw-bold" style={{ color: 'var(--danger)' }}>{stats.bookedUnits}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-lg-4">
                <div className="card-surface p-3 h-100">
                  <div className="section-title d-flex align-items-center gap-2">
                    <CalendarClock size={16} /> Today's Follow-ups
                  </div>
                  {stats.todaysFollowUps.length === 0 ? (
                    <EmptyState title="No follow-ups today" description="You're all caught up." />
                  ) : (
                    <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                      {stats.todaysFollowUps.map((lead) => (
                        <li key={lead._id}>
                          <Link to={`/leads/${lead._id}`} className="d-flex justify-content-between text-body">
                            <span>{lead.name}</span>
                            <span className="text-muted-sm">{lead.assignedTo?.name || 'Unassigned'}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="col-lg-4">
                <div className="card-surface p-3 h-100">
                  <div className="section-title">Upcoming Follow-ups</div>
                  {stats.upcomingFollowUps.length === 0 ? (
                    <EmptyState title="Nothing scheduled" description="No upcoming follow-ups." />
                  ) : (
                    <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                      {stats.upcomingFollowUps.map((lead) => (
                        <li key={lead._id}>
                          <Link to={`/leads/${lead._id}`} className="d-flex justify-content-between text-body">
                            <span>{lead.name}</span>
                            <span className="text-muted-sm">{formatDate(lead.followUpDate)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="col-lg-4">
                <div className="card-surface p-3 h-100">
                  <div className="section-title">Recent Bookings</div>
                  {stats.recentBookings.length === 0 ? (
                    <EmptyState icon={Home} title="No bookings yet" description="Bookings will appear here." />
                  ) : (
                    <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
                      {stats.recentBookings.map((b) => (
                        <li key={b._id}>
                          <div className="d-flex justify-content-between">
                            <span className="fw-semibold">{b.lead?.name}</span>
                            <span className="text-muted-sm">{formatCurrency(b.price)}</span>
                          </div>
                          <div className="text-muted-sm">
                            {b.project?.name} · Unit {b.unit?.unitNumber}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Dashboard;
