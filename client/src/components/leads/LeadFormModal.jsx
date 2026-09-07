import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { LEAD_SOURCES } from '../../utils/constants';

const emptyForm = { name: '', email: '', phone: '', source: 'Website', assignedTo: '', followUpDate: '', note: '' };

const LeadFormModal = ({ show, onClose, onSubmit, initial, employees = [], isAdmin }) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setForm(
        initial
          ? {
              name: initial.name || '',
              email: initial.email || '',
              phone: initial.phone || '',
              source: initial.source || 'Website',
              assignedTo: initial.assignedTo?._id || initial.assignedTo || '',
              followUpDate: initial.followUpDate ? initial.followUpDate.substring(0, 10) : '',
              note: '',
            }
          : emptyForm
      );
      setErrors({});
    }
  }, [show, initial]);

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.phone.trim()) next.phone = 'Phone number is required';
    else if (!/^[0-9+\-\s()]{7,20}$/.test(form.phone)) next.phone = 'Enter a valid phone number';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        assignedTo: form.assignedTo || undefined,
        followUpDate: form.followUpDate || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} title={initial ? 'Edit Lead' : 'Add Lead'}>
      <form onSubmit={handleSubmit} noValidate>
        <Input label="Full name" required value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="row">
          <div className="col-6">
            <Input label="Phone" required value={form.phone} error={errors.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="col-6">
            <Input label="Email" type="email" value={form.email} error={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <div className="col-6">
            <Select label="Source" options={LEAD_SOURCES} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          </div>
          <div className="col-6">
            <Input
              label="Follow-up date"
              type="date"
              value={form.followUpDate}
              onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
            />
          </div>
        </div>
        {isAdmin && (
          <Select
            label="Assign to"
            placeholder="Unassigned"
            options={employees.map((e) => ({ value: e._id, label: e.name }))}
            value={form.assignedTo}
            onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
          />
        )}
        {!initial && (
          <div className="mb-3">
            <label className="form-label">Initial note (optional)</label>
            <textarea className="form-control" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
        )}

        <div className="d-flex justify-content-end gap-2 mt-2">
          <Button type="button" variant="outline-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="brass" loading={submitting}>
            {initial ? 'Save changes' : 'Create lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default LeadFormModal;
