import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { UNIT_TYPES } from '../../utils/constants';

const empty = { unitNumber: '', floor: '', type: '2BHK', price: '' };

const UnitFormModal = ({ show, onClose, onSubmit, initial, buildingName }) => {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setForm(
        initial
          ? { unitNumber: initial.unitNumber, floor: initial.floor, type: initial.type, price: initial.price }
          : empty
      );
      setErrors({});
    }
  }, [show, initial]);

  const validate = () => {
    const next = {};
    if (!form.unitNumber.trim()) next.unitNumber = 'Unit number is required';
    if (form.floor === '' || Number(form.floor) < 0) next.floor = 'Enter a valid floor number';
    if (!form.price || Number(form.price) <= 0) next.price = 'Enter a positive price';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({ ...form, floor: Number(form.floor), price: Number(form.price) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} title={initial ? 'Edit Unit' : `New Unit${buildingName ? ` — ${buildingName}` : ''}`}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="row">
          <div className="col-6">
            <Input label="Unit number" required value={form.unitNumber} error={errors.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} />
          </div>
          <div className="col-6">
            <Input label="Floor" type="number" min="0" required value={form.floor} error={errors.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <div className="col-6">
            <Select label="Type" options={UNIT_TYPES} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          </div>
          <div className="col-6">
            <Input label="Price (₹)" type="number" min="1" required value={form.price} error={errors.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
        </div>
        <div className="d-flex justify-content-end gap-2">
          <Button type="button" variant="outline-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="brass" loading={submitting}>
            {initial ? 'Save changes' : 'Create unit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UnitFormModal;
