import { useEffect, useState } from 'react';
import api from '../api';
import { cleanPhone, isValidPhone, PHONE_ERROR } from '../utils/format';

export default function FloatingInquiry() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
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
      const res = await api('/contact', { method: 'POST', body: { ...form, subject: 'Quick Inquiry' } });
      setState({ loading: false, ok: res.message, err: '' });
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      setState({ loading: false, ok: '', err: err.message });
    }
  };

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <button className="inq-box" onClick={() => setOpen(true)} aria-label="Quick inquiry">
        <span>Quick</span><span>Inquiry</span>
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal inq-box-form" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
            <h5 className="inq-title">Quick Inquiry</h5>
            <p className="auth-sub">Tell us what you are looking for — we will get back to you shortly.</p>
            <form className="form" onSubmit={submit}>
              {state.ok && <p className="form-success">{state.ok}</p>}
              {state.err && <p className="form-error">{state.err}</p>}
              <label className="field">
                <span>Name *</span>
                <input required value={form.name} onChange={set('name')} placeholder="Your name" />
              </label>
              <label className="field">
                <span>Email *</span>
                <input required type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
              </label>
              <label className="field">
                <span>Contact No</span>
                <input
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  title={PHONE_ERROR}
                />
                {phoneErr && <small className="field-error">{phoneErr}</small>}
              </label>
              <label className="field">
                <span>Message *</span>
                <textarea required rows="3" value={form.message} onChange={set('message')} placeholder="I am interested in a plot in your venture…" />
              </label>
              <button className="btn btn-primary btn-block" disabled={state.loading}>
                {state.loading ? 'Sending…' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}