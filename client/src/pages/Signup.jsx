import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Home, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const Signup = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Password is required';
    else if (form.password.length < 6) next.password = 'Password must be at least 6 characters';
    if (!form.confirmPassword) next.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      toast.success('Account created. Sign in with your new credentials.');
      navigate('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="d-flex align-items-center gap-2 mb-4">
          <div className="app-sidebar__brand-mark">
            <Home size={18} />
          </div>
          <div>
            <div className="fw-bold" style={{ fontSize: '1.1rem' }}>Estate CRM</div>
            <div className="text-muted-sm">Create your workspace account</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <Input label="Full name" type="text" required value={form.name} error={errors.name} onChange={updateField('name')} />
          <Input label="Email address" type="email" required value={form.email} error={errors.email} onChange={updateField('email')} />
          <Input label="Password" type="password" required value={form.password} error={errors.password} onChange={updateField('password')} />
          <Input
            label="Confirm password"
            type="password"
            required
            value={form.confirmPassword}
            error={errors.confirmPassword}
            onChange={updateField('confirmPassword')}
          />

          <Button type="submit" variant="brass" icon={UserPlus} loading={submitting} className="w-100 justify-content-center mt-2">
            Create account
          </Button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
