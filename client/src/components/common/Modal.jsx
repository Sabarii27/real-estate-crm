import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ show, onClose, title, children, footer, size = '' }) => {
  useEffect(() => {
    if (!show) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <>
      <div className="modal d-block" tabIndex={-1} role="dialog" style={{ background: 'rgba(15,27,45,0.45)' }}>
        <div className={`modal-dialog modal-dialog-centered ${size}`} role="document">
          <div className="modal-content" style={{ borderRadius: 'var(--radius-lg)', border: 'none' }}>
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
