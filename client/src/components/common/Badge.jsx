import React from 'react';
import { stageClass } from '../../utils/format';

const Badge = ({ children, variant }) => {
  if (variant) {
    return <span className={`stage-badge status-${variant}`}>{children}</span>;
  }
  return <span className={stageClass(children)}>{children}</span>;
};

export default Badge;
