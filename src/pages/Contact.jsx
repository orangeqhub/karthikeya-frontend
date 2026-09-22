import { useState } from 'react';
import api from '../api';
import { cleanPhone, isValidPhone, PHONE_ERROR } from '../utils/format';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [phoneErr, setPhoneErr] = useState('');
  const [success, setSuccess] = useState('');

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: key === 'phone' ? cleanPhone(e.target.value) : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!isValidPhone(form.phone)) {
      setPhoneErr(PHONE_ERROR);
      return;
    }
    setPhoneErr('');
    setSubmitting(true);
    try {
      const data = await api('/contact', { method: 'POST', body: form });
      setSuccess(data.message);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section container page">
      <div className="page-head">
        <h1>Contact Us</h1>
        <p>We are happy to answer your queries. Send us a message or visit our office.</p>
      </div>

      <div className="contact-grid">
        <div>
          <div className="card contact-card">
            <h3>Send us a message</h3>
            <form onSubmit={submit} className="form">
              {error && <p className="form-error">{error}</p>}
              {success && <p className="form-success">{success}</p>}
              <div className="form-row">
                <label className="field">
                  <span>Full name *</span>
                  <input value={form.name} onChange={set('name')} placeholder="Your name" required />
                </label>
                <label className="field">
                  <span>Email *</span>
                  <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
                </label>
              </div>
              <div className="form-row">
                <label className="field">
                  <span>Phone</span>
                  <input
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    title={PHONE_ERROR}
                  />
                  {phoneErr && <small className="field-error">{phoneErr}</small>}
                </label>
                <label className="field">
                  <span>Subject</span>
                  <input value={form.subject} onChange={set('subject')} placeholder="Subject" />
                </label>
              </div>
              <label className="field">
                <span>Message *</span>
                <textarea rows="5" value={form.message} onChange={set('message')} placeholder="How can we help you?" required />
              </label>
              <button className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>

        <div>
          <div className="card contact-info">
            <h3>Office</h3>
            <p>
              D.No.91-611, Plot No: 2B,<br />
              Opp. SKBM High School, Main Road,<br />
              A.T. Agraharam, Guntur – 522004
            </p>
          </div>
          <div className="card contact-info">
            <h3>Phone</h3>
            <p>+91 83098 12757</p>
          </div>
          <div className="card contact-info">
            <h3>Email</h3>
            <p>hello@karthikeyainfra.com</p>
          </div>
          <div className="card contact-info">
            <h3>Office Hours</h3>
            <p>Monday – Sunday<br />9:00 AM – 7:00 PM</p>
          </div>
        </div>
      </div>
    </section>
  );
}