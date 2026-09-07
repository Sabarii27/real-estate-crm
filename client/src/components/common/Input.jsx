import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = ({ label, error, className = '', required, showPasswordToggle = false, type = 'text', ...props }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && passwordVisible ? 'text' : type;

  return <div className="mb-3">
    {label && (
      <label className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
    )}
    <div className={isPassword && showPasswordToggle ? 'input-password-wrap' : undefined}>
      <input className={`form-control ${isPassword && showPasswordToggle ? 'input-password' : ''} ${error ? 'is-invalid' : ''} ${className}`} type={inputType} {...props} />
      {isPassword && showPasswordToggle && (
        <button
          type="button"
          className="password-toggle"
          onClick={() => setPasswordVisible((visible) => !visible)}
          aria-label={passwordVisible ? 'Hide password' : 'Show password'}
          title={passwordVisible ? 'Hide password' : 'Show password'}
        >
          {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      )}
    </div>
    {error && <div className="field-error">{error}</div>}
  </div>
};

export default Input;
