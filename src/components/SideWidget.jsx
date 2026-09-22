import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function SideWidget({ open, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <div className={`side-widget-shade ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`side-widget ${open ? 'open' : ''}`}>
        {children}
      </aside>
    </>
  );
}

export function SideWidgetBody({ onNavigate, children }) {
  const close = () => onNavigate && onNavigate();
  return (
    <div className="inner">
      <div className="logo">
        <Link to="/" onClick={close}><img src="/logo.png" alt="Karthikeya Infra CES" /></Link>
      </div>
      <div className="hide-mobile">
        <p>Living in open, well-designed spaces conceived for a modern lifestyle is not an aspiration but a reality that we work to create, every day.</p>
        <figure className="gallery">
          <img src="/img/real/slide-1.jpg" alt="Venture" />
          <img src="/img/real/slide-3.jpg" alt="Layout" />
        </figure>
        <h6 className="widget-title">ADDRESS</h6>
        <address className="address">
          <p>D.No.91-611, Plot No: 2B, Opp. SKBM High School,<br />Main Road, A.T. Agraharam, Guntur – 522004.</p>
          <p>+91 83098 12757</p>
        </address>
        <h6 className="widget-title">FOLLOW US</h6>
        <ul className="social-media">
          <li><a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a></li>
          <li><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a></li>
        </ul>
      </div>
      <div className="show-mobile">{children}</div>
      <small>© {new Date().getFullYear()} Karthikeya Infra CES</small>
    </div>
  );
}