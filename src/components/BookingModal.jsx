import { useState } from 'react';
import api from '../api';
import { formatINR, STATUS_LABEL, STATUS_CLASS, cleanPhone, isValidPhone, PHONE_ERROR } from '../utils/format';

function plotStatus(plot) {
  return {
    label: STATUS_LABEL[plot.status] || plot.status,
    className: STATUS_CLASS[plot.status] || 'badge',
  };
}

export default function BookingModal({ plot, onClose }) {
  const [form, setForm] = useState({ name: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [phoneErr, setPhoneErr] = useState('');
  const [done, setDone] = useState(false);

  const bookable = plot.status === 'available';

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: key === 'phone' ? cleanPhone(e.target.value) : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isValidPhone(form.phone)) {
      setPhoneErr(PHONE_ERROR);
      return;
    }
    setPhoneErr('');
    setSubmitting(true);
    try {
      await api('/bookings', {
        method: 'POST',
        body: { plotId: plot.id, name: form.name, phone: form.phone },
      });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const status = plotStatus(plot);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="modal-body center">
            <div className="success-icon">✓</div>
            <h3>Booking confirmed!</h3>
            <p>
              Your booking for plot <b>{plot.plotNo}</b> has been recorded as <b>Booked</b>. Our team
              will contact you on <b>{form.phone}</b> to complete the process.
            </p>
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        ) : bookable ? (
          <>
            <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
            <h3>
              Book Plot {plot.plotNo}{' '}
              <span className={status.className}>{status.label}</span>
            </h3>
            <div className="booking-summary">
              <div><span>Plot</span><b>{plot.plotNo}</b></div>
              <div><span>Size</span><b>{formatINR(plot.sizeSqft)} sq.ft</b></div>
              <div><span>Price</span><b>{formatINR(plot.price)}</b></div>
              <div><span>Facing</span><b>{plot.facing}</b></div>
            </div>

            <form onSubmit={submit} className="form">
              {error && <p className="form-error">{error}</p>}
              <label className="field">
                <span>Plot Number</span>
                <input value={String(plot.plotNo)} readOnly tabIndex={-1} />
              </label>
              <label className="field">
                <span>Name *</span>
                <input
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Your full name"
                  required
                />
              </label>
              <label className="field">
                <span>Phone Number *</span>
                <input
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  title={PHONE_ERROR}
                  required
                />
                {phoneErr && <small className="field-error">{phoneErr}</small>}
              </label>
              <button className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Booking Request'}
              </button>
              <p className="modal-hint">
                No account needed. Your booking is saved as <b>Booked</b> and our team will contact
                you shortly.
              </p>
            </form>
          </>
        ) : (
          <>
            <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
            <h3>
              Plot {plot.plotNo}{' '}
              <span className={status.className}>{status.label}</span>
            </h3>
            <p className="form-error">
              This plot is <b>{status.label.toLowerCase()}</b> and currently not available for
              booking. Contact our team to check similar plots.
            </p>
            <button className="btn btn-outline" onClick={onClose}>Close</button>
          </>
        )}
      </div>
    </div>
  );
}