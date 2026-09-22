import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api';
import '../map.css';
import GeoMap from '../map/components/GeoMap';
import { getPlotNumberMapping } from '../map/layouts';
import BookingModal from '../components/BookingModal';

const LAYOUT_NAME = 'Karthikeya Infra CES';
const LAYOUT_TAGLINE = 'Plotted layout with live plot status · Medikondur, Guntur District, AP';
const LAYOUT_PHASES = 'Single phase';

export default function MapLayout() {
  const layoutPlots = useMemo(() => getPlotNumberMapping(), []);
  const geoRef = useRef(null);
  const [dbStatuses, setDbStatuses] = useState({});
  const [backendPlots, setBackendPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlot, setSelectedPlot] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api('/plots')
      .then((data) => {
        if (cancelled) return;
        const map = {};
        for (const p of data.plots || []) {
          const status = p.status === 'blocked' ? 'booked' : p.status;
          if (['available', 'booked', 'registered', 'sold'].includes(status)) {
            map[String(p.plotNo)] = status;
          }
        }
        setDbStatuses(map);
        setBackendPlots(data.plots || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const availableCount = useMemo(() => {
    const byNumber = new Map();
    for (const p of layoutPlots) if (!byNumber.has(p.plotNumber)) byNumber.set(p.plotNumber, p);
    let count = 0;
    for (const p of byNumber.values()) {
      const status =
        dbStatuses[p.plotNumber] ??
        (p.status === 'booked' || p.status === 'registered' || p.status === 'sold' ? p.status : 'available');
      if (status === 'available') count += 1;
    }
    return count;
  }, [layoutPlots, dbStatuses]);

  const handleBook = (plotNumber) => {
    const found = backendPlots.find((p) => String(p.plotNo) === plotNumber);
    if (found) {
      setSelectedPlot(found);
    }
  };

  return (
    <div className="app-page">
      <header className="kb-banner">
        <div className="kb-banner-hero">
          <span className="kb-banner-chip">
            <span className="kb-banner-dot" aria-hidden="true" />
            Interactive plot layout
          </span>
          <h1 className="kb-banner-title">{LAYOUT_NAME}</h1>
          <p className="kb-banner-sub">{LAYOUT_TAGLINE}</p>
          <button
            type="button"
            className="kb-banner-cta"
            onClick={() =>
              document.getElementById('kb-map-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          >
            <span className="kb-cta-label">
              {availableCount > 0 ? 'Now booking · Plots available' : 'Interactive layout'}
            </span>
            <span className="kb-cta-head">Book your plot now</span>
            <span className="kb-cta-arrow" aria-hidden="true">→</span>
          </button>
        </div>
        <div className="kb-tiles">
          <div className="kb-tile">
            <span className="kb-tile-label">Project type</span>
            <span className="kb-tile-value">Plotted layout</span>
          </div>
          <div className="kb-tile">
            <span className="kb-tile-label">Phases</span>
            <span className="kb-tile-value">{LAYOUT_PHASES}</span>
          </div>
          <div className="kb-tile">
            <span className="kb-tile-label">Plot type</span>
            <span className="kb-tile-value">Residential</span>
          </div>
          <div className="kb-tile">
            <span className="kb-tile-label">Available now</span>
            <span className="kb-tile-value">{availableCount} plots</span>
          </div>
        </div>
      </header>

      <main className="kb-map-wrap">
        {loading && <p className="kb-board-hint" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f5f9' }}>Loading layout…</p>}
        {error && <p className="kb-board-hint" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f5f9' }}>{error}</p>}
        {!loading && !error && (
          <GeoMap ref={geoRef} dbStatusByNumber={dbStatuses} onBook={handleBook} />
        )}
      </main>

      {selectedPlot && (
        <BookingModal plot={selectedPlot} onClose={() => setSelectedPlot(null)} />
      )}
    </div>
  );
}