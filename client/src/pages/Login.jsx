import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Home, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      navigate('/dashboard');
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
            <div className="fw-bold" style={{ fontSize: '1.1rem' }}>
              Estate CRM
            </div>
            <div className="text-muted-sm">Sign in to your workspace</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Email address"
            type="email"
            required
            value={form.email}
            error={errors.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            showPasswordToggle
            required
            value={form.password}
            error={errors.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <Button type="submit" variant="ink" icon={LogIn} loading={submitting} className="w-100 justify-content-center mt-2">
            Sign in
          </Button>
        </form>

        <div className="auth-switch">
          Need an account? <Link to="/signup">Create one</Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
