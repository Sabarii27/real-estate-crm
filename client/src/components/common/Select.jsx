import React from 'react';

const Select = ({ label, error, options = [], placeholder, className = '', required, ...props }) => (
  <div className="mb-3">
    {label && (
      <label className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
    )}
    <select className={`form-select ${error ? 'is-invalid' : ''} ${className}`} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) =>
        typeof opt === 'string' ? (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ) : (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        )
      )}
    </select>
    {error && <div className="field-error">{error}</div>}
  </div>
);

export default Select;
