import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

const ErrorState = ({ message = 'Unable to load data. Please try again.', onRetry }) => (
  <div className="state-block state-block--error">
    <div className="state-block__icon">
      <AlertTriangle size={24} />
    </div>
    <div className="fw-semibold text-body mb-1">Something went wrong</div>
    <div className="text-muted-sm mb-3">{message}</div>
    {onRetry && (
      <button className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2" onClick={onRetry}>
        <RotateCcw size={14} /> Try again
      </button>
    )}
  </div>
);

export default ErrorState;
