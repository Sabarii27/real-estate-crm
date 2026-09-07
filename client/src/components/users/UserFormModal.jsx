import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const empty = { name: '', email: '', password: '', role: 'sales' };

const UserFormModal = ({ show, onClose, onSubmit, initial }) => {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setForm(initial ? { name: initial.name, email: initial.email, password: '', role: initial.role } : empty);
      setErrors({});
    }
  }, [show, initial]);

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!initial) {
      if (!form.email.trim()) next.email = 'Email is required';
      else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
      if (!form.password || form.password.length < 6) next.password = 'Password must be at least 6 characters';
    } else if (form.password && form.password.length < 6) {
      next.password = 'Password must be at least 6 characters';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = { name: form.name, role: form.role };
      if (!initial) {
        payload.email = form.email;
        payload.password = form.password;
      } else if (form.password) {
        payload.password = form.password;
      }
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} title={initial ? 'Edit User' : 'Add User'}>
      <form onSubmit={handleSubmit} noValidate>
        <Input label="Full name" required value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        {!initial && (
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            error={errors.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        )}
        <Input
          label={initial ? 'New password (leave blank to keep current)' : 'Password'}
          type="password"
          required={!initial}
          value={form.password}
          error={errors.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Select
          label="Role"
          options={[
            { value: 'sales', label: 'Sales Employee' },
            { value: 'admin', label: 'Admin' },
          ]}
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        />
        <div className="d-flex justify-content-end gap-2">
          <Button type="button" variant="outline-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="brass" loading={submitting}>
            {initial ? 'Save changes' : 'Create user'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;
