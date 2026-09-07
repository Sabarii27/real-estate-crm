import React from 'react';
import { Menu } from 'lucide-react';

const Header = ({ title, breadcrumb, onToggleSidebar, actions }) => (
  <header className="app-header">
    <div className="d-flex align-items-center gap-2">
      <button className="btn btn-sm btn-outline-secondary sidebar-toggle-btn" onClick={onToggleSidebar} type="button">
        <Menu size={18} />
      </button>
      <div>
        {breadcrumb && <div className="app-header__breadcrumb">{breadcrumb}</div>}
        <h1 className="app-header__title">{title}</h1>
      </div>
    </div>
    <div className="d-flex align-items-center gap-2">{actions}</div>
  </header>
);

export default Header;
