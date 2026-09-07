import React from 'react';
import Modal from './Modal';

const ConfirmDialog = ({
  show,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => (
  <Modal
    show={show}
    onClose={onCancel}
    title={title}
    footer={
      <>
        <button className="btn btn-outline-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button className={`btn btn-${confirmVariant}`} onClick={onConfirm} disabled={loading}>
          {loading ? 'Please wait...' : confirmLabel}
        </button>
      </>
    }
  >
    <p className="mb-0">{message}</p>
  </Modal>
);

export default ConfirmDialog;
