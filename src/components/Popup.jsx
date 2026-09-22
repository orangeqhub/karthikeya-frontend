import { useEffect, useState } from 'react';
import { useEnquiry } from './EnquiryModal';

export default function Popup() {
  const { openEnquiry } = useEnquiry();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('kces-popup')) return;
    const t = setTimeout(() => {
      setShow(true);
      sessionStorage.setItem('kces-popup', '1');
    }, 2600);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="popup-overlay" onClick={() => setShow(false)}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={() => setShow(false)} aria-label="Close">×</button>
        <img src="/img/extra/popup.jpg" alt="Karthikeya Infra CES" className="popup-image" />
        <button
          type="button"
          className="popbutton button"
          onClick={() => { setShow(false); openEnquiry(); }}
        >
          ENQUIRE NOW <span className="arr">→</span>
        </button>
      </div>
    </div>
  );
}