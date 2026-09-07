import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Header from '../components/layout/Header';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import UserFormModal from '../components/users/UserFormModal';
import { userService } from '../services/userService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { formatDate } from '../utils/format';

const Users = () => {
  const { toggleSidebar } = useOutletContext();
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    userService
      .list()
      .then((res) => setUsers(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const openCreate = () => {
    setEditingUser(null);
    setShowForm(true);
  };
  const openEdit = (u) => {
    setEditingUser(u);
    setShowForm(true);
  };

  const handleSubmit = async (payload) => {
    try {
      if (editingUser) {
        await userService.update(editingUser._id, payload);
        toast.success('User updated successfully');
      } else {
        await userService.create(payload);
        toast.success('User created successfully');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await userService.remove(deleteTarget._id);
      toast.success('User deleted successfully');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (u) => <span className="fw-semibold">{u.name}</span> },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (u) => <Badge variant={u.role === 'admin' ? 'Confirmed' : undefined}>{u.role === 'admin' ? 'Admin' : 'Sales'}</Badge> },
    { key: 'isActive', header: 'Status', render: (u) => (u.isActive ? <Badge variant="Confirmed">Active</Badge> : <Badge variant="Cancelled">Inactive</Badge>) },
    { key: 'createdAt', header: 'Joined', render: (u) => formatDate(u.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (u) => (
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => openEdit(u)} title="Edit">
            <Pencil size={14} />
          </button>
          {u._id !== currentUser?._id && (
            <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(u)} title="Delete">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Header
        title="Users"
        breadcrumb="CRM / Users"
        onToggleSidebar={toggleSidebar}
        actions={
          <Button variant="brass" icon={Plus} onClick={openCreate}>
            Add User
          </Button>
        }
      />
      <div className="app-content">
        <div className="card-surface">
          <Table columns={columns} rows={users} loading={loading} error={error} onRetry={load} emptyTitle="No users found" />
        </div>
      </div>

      <UserFormModal show={showForm} onClose={() => setShowForm(false)} onSubmit={handleSubmit} initial={editingUser} />

      <ConfirmDialog
        show={!!deleteTarget}
        title="Delete user"
        message={`Delete ${deleteTarget?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default Users;
