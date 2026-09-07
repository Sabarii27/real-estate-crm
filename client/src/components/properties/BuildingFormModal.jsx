import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

const BuildingFormModal = ({ show, onClose, onSubmit, projectName }) => {
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setForm({ name: '', description: '' });
      setErrors({});
    }
  }, [show]);

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Building name is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} title={`New Building${projectName ? ` — ${projectName}` : ''}`}>
      <form onSubmit={handleSubmit} noValidate>
        <Input label="Building name" required value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea className="form-control" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="d-flex justify-content-end gap-2">
          <Button type="button" variant="outline-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="brass" loading={submitting}>
            Create building
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default BuildingFormModal;
