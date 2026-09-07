import React from 'react';

const Button = ({ children, variant = 'ink', loading = false, icon: Icon, className = '', disabled, ...props }) => (
  <button className={`btn btn-${variant} d-inline-flex align-items-center gap-2 ${className}`} disabled={disabled || loading} {...props}>
    {loading ? (
      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
    ) : (
      Icon && <Icon size={16} />
    )}
    {children}
  </button>
);

export default Button;
