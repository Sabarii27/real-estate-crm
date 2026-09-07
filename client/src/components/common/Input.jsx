import React from 'react';

const Input = ({ label, error, className = '', required, ...props }) => (
  <div className="mb-3">
    {label && (
      <label className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
    )}
    <input className={`form-control ${error ? 'is-invalid' : ''} ${className}`} {...props} />
    {error && <div className="field-error">{error}</div>}
  </div>
);

export default Input;
