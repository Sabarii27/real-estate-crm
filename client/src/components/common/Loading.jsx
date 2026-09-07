import React from 'react';

const Loading = ({ label = 'Loading...' }) => (
  <div className="state-block">
    <div className="spinner-border text-secondary mb-3" role="status" style={{ width: 32, height: 32 }}>
      <span className="visually-hidden">Loading</span>
    </div>
    <div>{label}</div>
  </div>
);

export default Loading;
