import { createContext, useContext, useState } from 'react';
import api from '../api';
import { cleanPhone, isValidPhone, PHONE_ERROR } from '../utils/format';

const EnquiryContext = createContext(null);

export function EnquiryProvider({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <EnquiryContext.Provider value={{ openEnquiry: () => setOpen(true) }}>
      {children}
      {open && <EnquiryModal onClose={() => setOpen(false)} />}
    </EnquiryContext.Provider>
  );
}

export function useEnquiry() {
  return useContext(EnquiryContext);
}

function EnquiryModal({ onClose }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [state, setState] = useState({ loading: false, ok: '', err: '' });
  const [phoneErr, setPhoneErr] = useState('');

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: key === 'phone' ? cleanPhone(e.target.value) : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setState((s) => ({ ...s, ok: '', err: '' }));
    if (!isValidPhone(form.phone)) {
      setPhoneErr(PHONE_ERROR);
      return;
    }
    setPhoneErr('');
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await api('/contact', { method: 'POST', body: { ...form, subject: 'Website Enquiry' } });
      setState({ loading: false, ok: res.message, err: '' });
      setForm({ name: '', phone: '', email: '', message: '' });
    } catch (err) {
      setState({ loading: false, ok: '', err: err.message });
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="enq-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        {state.ok ? (
          <div className="modal-body center">
            <div className="success-icon">✓</div>
            <h3>Thank you!</h3>
            <p>{state.ok}</p>
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="form">
            <h3 className="enq-modal-title">Enquiry</h3>
            {state.err && <p className="form-error">{state.err}</p>}
            <div className="form-group">
              <span>Full Name</span>
              <input type="text" value={form.name} onChange={set('name')} required placeholder="Your name" />
            </div>
            <div className="form-group">
              <span>Phone Number</span>
              <input
                type="text"
                value={form.phone}
                onChange={set('phone')}
                required
                placeholder="10-digit mobile number"
                inputMode="numeric"
                pattern="[0-9]{10}"
                title={PHONE_ERROR}
              />
              {phoneErr && <p className="form-error">{phoneErr}</p>}
            </div>
            <div className="form-group">
              <span>E-mail</span>
              <input type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <span>Message</span>
              <textarea rows="3" value={form.message} onChange={set('message')} placeholder="I am interested in a plot…" />
            </div>
            <div className="form-group form-group-submit">
              <button type="submit" className="enq-submit" disabled={state.loading}>
                {state.loading ? 'SENDING…' : 'REQUEST A CALL'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default EnquiryModal;