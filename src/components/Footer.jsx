import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useEnquiry } from './EnquiryModal';

const DEFAULTS = {
  companyName: 'Karthikeya Infra CES',
  footerDescription: 'We are committed to creating a secure, planned residential plot venture with clear titles, ready infrastructure and honest, transparent guidance at every step.',
  address: 'D.No.91-611, Plot No: 2B, Opp. SKBM High School, Main Road, A.T. Agraharam, Guntur – 522004',
  phone: '+918309812757',
  email: 'hello@karthikeyainfra.com',
  instagramUrl: 'https://instagram.com',
  facebookUrl: 'https://facebook.com',
  footerLinks: [
    { label: 'Home', to: '/' },
    { label: 'Map Layout', to: '/map-layout' },
    { label: 'Contact Us', to: '/contact' },
  ],
  copyright: 'Karthikeya Infra CES | We Build with Trust',
  footerCta: 'PLOT YOUR FUTURE',
};

export function FooterBar({ cta }) {
  const { openEnquiry } = useEnquiry();
  return (
    <section className="footer-bar">
      <div className="container">
        <div className="footer-bar-inner">
          <figure className="logo"><img src="/logo.png" alt="Karthikeya Infra CES" /></figure>
          <h2><b>{cta}</b></h2>
          <button type="button" className="button" onClick={openEnquiry}>
            ENQUIRY <span className="arr">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default function Footer() {
  const [s, setS] = useState(DEFAULTS);

  useEffect(() => {
    let mounted = true;
    api('/settings')
      .then((d) => {
        if (mounted && d && d.settings) {
          setS((prev) => ({ ...prev, ...d.settings }));
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const links = Array.isArray(s.footerLinks)
    ? s.footerLinks.filter((l) => l && String(l.to || '') !== '/login' && String(l.to || '') !== '/register')
    : [];

  return (
    <>
      <FooterBar cta={s.footerCta} />
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <h6 className="widget-title">Contact Us</h6>
              <address>
                <p>{s.address}</p>
                <p>Phone: <a href={`tel:${s.phone}`}>{s.phone}</a></p>
                <p>Mail: <a href={`mailto:${s.email}`}>{s.email}</a></p>
              </address>
            </div>
            <div className="footer-col">
              <h6 className="widget-title">Our Links</h6>
              <address>
                {links.map((l) => (
                  l.to && l.to.startsWith('http')
                    ? <p key={`${l.label}-${l.to}`}><a href={l.to} target="_blank" rel="noreferrer">{l.label}</a></p>
                    : <p key={`${l.label}-${l.to}`}><Link to={l.to || '/'}>{l.label}</Link></p>
                ))}
              </address>
            </div>
            <div className="footer-col">
              <h6 className="widget-title">Location</h6>
              <address>
                <iframe
                  title="Karthikeya Infra CES location"
                  src="https://www.google.com/maps?q=A.T.%20Agraharam,%20Guntur,%20Andhra%20Pradesh&output=embed"
                  width="100%"
                  height="150"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                />
              </address>
            </div>
            <div className="footer-col">
              <h6 className="widget-title">About Company</h6>
              <address>
                <p><strong className="footer-company">{s.companyName}</strong>{s.footerDescription}</p>
              </address>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} {s.copyright}</span>
            <ul>
              <li><a href={s.facebookUrl} target="_blank" rel="noreferrer">Facebook</a></li>
              <li><a href={s.instagramUrl} target="_blank" rel="noreferrer">Instagram</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
}