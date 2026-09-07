import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ icon: Icon = Inbox, title = 'Nothing here yet', description, action }) => (
  <div className="state-block">
    <div className="state-block__icon">
      <Icon size={24} />
    </div>
    <div className="fw-semibold text-body mb-1">{title}</div>
    {description && <div className="text-muted-sm mb-3">{description}</div>}
    {action}
  </div>
);

export default EmptyState;
