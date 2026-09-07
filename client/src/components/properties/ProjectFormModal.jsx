import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

const empty = { name: '', location: '', description: '' };

const ProjectFormModal = ({ show, onClose, onSubmit, initial }) => {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setForm(initial ? { name: initial.name, location: initial.location, description: initial.description || '' } : empty);
      setErrors({});
    }
  }, [show, initial]);

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Project name is required';
    if (!form.location.trim()) next.location = 'Location is required';
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
    <Modal show={show} onClose={onClose} title={initial ? 'Edit Project' : 'New Project'}>
      <form onSubmit={handleSubmit} noValidate>
        <Input label="Project name" required value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Location" required value={form.location} error={errors.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="d-flex justify-content-end gap-2">
          <Button type="button" variant="outline-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="brass" loading={submitting}>
            {initial ? 'Save changes' : 'Create project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectFormModal;
