import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

const NotFound = () => (
  <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
    <div className="text-center">
      <div className="state-block__icon mx-auto mb-3">
        <Compass size={24} />
      </div>
      <h4>Page not found</h4>
      <p className="text-muted-sm">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="btn btn-brass">
        Go to Dashboard
      </Link>
    </div>
  </div>
);

export default NotFound;
