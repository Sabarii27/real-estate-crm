import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users2,
  Building2,
  CalendarCheck2,
  UserCog,
  LogOut,
  Home,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../utils/format';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users2 },
  { to: '/properties', label: 'Properties', icon: Building2 },
  { to: '/bookings', label: 'Bookings', icon: CalendarCheck2 },
  { to: '/users', label: 'Users', icon: UserCog, adminOnly: true },
];

const Sidebar = ({ open, onNavigate }) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <aside className={`app-sidebar ${open ? 'open' : ''}`}>
      <div className="app-sidebar__brand">
        <div className="app-sidebar__brand-mark">
          <Home size={18} />
        </div>
        <div>
          <div className="app-sidebar__brand-text">Estate CRM</div>
          <div className="app-sidebar__brand-sub">Sales Workspace</div>
        </div>
      </div>

      <nav className="app-sidebar__nav">
        {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}
            onClick={onNavigate}
          >
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="app-sidebar__footer">
        <div className="app-sidebar__user">
          <div className="app-sidebar__avatar">{initials(user?.name)}</div>
          <div className="flex-grow-1 min-w-0">
            <div className="text-truncate" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {user?.name}
            </div>
            <div className="text-truncate" style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
              {user?.role === 'admin' ? 'Administrator' : 'Sales Employee'}
            </div>
          </div>
        </div>
        <button
          className="app-sidebar__link w-100 border-0 bg-transparent text-start mt-1"
          onClick={logout}
          type="button"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
