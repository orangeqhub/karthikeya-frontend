import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProjectSlider from '../components/ProjectSlider';

/* ---------------- Hero (static image + scrollable text) ---------------- */
const SLIDES = [
  {
    line1: 'Your dream',
    line2: 'plot awaits',
    link: '#map-layout',
    cta: 'VIEW MAP LAYOUT',
  },
  {
    line1: 'Build',
    line2: 'your future',
    link: '#who-we',
    cta: 'DISCOVER KARTHIKEYA INFRA',
  },
  {
    line1: 'Expert',
    line2: 'planning',
    link: '#projects',
    cta: 'DISCOVER OUR PROJECTS',
  },
  {
    line1: 'A gated',
    line2: 'community',
    link: '#expertise',
    cta: 'KNOW OUR PROMISES',
  },
];

function TextSlider() {
  const [slide, setSlide] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    timer.current = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer.current);
  }, []);

  const reset = (fn) => {
    clearInterval(timer.current);
    fn();
    timer.current = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5000);
  };

  return (
    <div className="swiper-container slider-content">
      <div className="swiper-wrapper">
        {SLIDES.map((s, i) => (
          <div className={`swiper-slide text-slide ${i === slide ? 'active' : ''}`} key={i}>
            <div className="inner">
              <h2>{s.line1}<br /><b>{s.line2}</b></h2>
              <a href={s.link}>{s.cta} <span className="arr">→</span></a>
            </div>
          </div>
        ))}
      </div>
      <div className="controls">
        <div className="swiper-pagination">
          {SLIDES.map((s, i) => (
            <span
              key={i}
              className={`dot ${i === slide ? 'active' : ''}`}
              onClick={() => reset(() => setSlide(i))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Odometer counter ---------------- */
function useOdometer(target, duration = 1800) {
  const ref = useRef(null);
  const started = useRef(false);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const t0 = performance.now();
            const tick = (t) => {
              const p = Math.min(1, (t - t0) / duration);
              const eased = 1 - Math.pow(1 - p, 3);
              setDisplay(Math.round(target * eased).toLocaleString('en-IN'));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [target, duration]);

  return { ref, display };
}

/* ---------------- Reveal-on-scroll (section entrance) ---------------- */
function useRevealOnView() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = false;
    let timer;
    const clearTimer = () => { if (timer) { clearTimeout(timer); timer = undefined; } };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !done) {
            done = true;
            el.classList.add('in');
            timer = setTimeout(() => el.classList.remove('reveal', 'in'), 1500);
            io.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => { clearTimer(); io.disconnect(); };
  }, []);
  return ref;
}

function CounterBox({ value, suffix, title, sub }) {
  const { ref, display } = useOdometer(value);
  return (
    <div className="counter-box" ref={ref}>
      <div className="counter-num">
        <span className="odometer">{display}</span>
        <span className="value">{suffix}</span>
      </div>
      <div className="counter-label">
        <h6>{title}</h6>
        <p>{sub}</p>
      </div>
    </div>
  );
}

/* ---------------- Data ---------------- */
const EXPERTISE = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#101010" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="1.5" />
        <path d="M9 3v18M15 3v18M3 9h18M3 15h18" strokeDasharray="2 2.2" />
        <circle cx="5" cy="5" r="1.2" fill="var(--maroon)" stroke="none" />
      </svg>
    ),
    title: 'Quality Plots',
    text: 'High-quality residential plots developed with proper planning, clear layouts, internal roads, and essential infrastructure for comfortable living and long-term value.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#101010" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 9.5c0 6-8 11-8 11S4 15.5 4 9.5a8 8 0 0 1 16 0z" />
        <path d="M8.8 13v-3.6l1.5-2H13.7l1.5 2V13" />
        <path d="M9.6 11.5h4.8" />
        <path d="M10.6 13v3M13.4 13v3" />
        <circle cx="12" cy="4.6" r="1.1" fill="var(--maroon)" stroke="none" />
      </svg>
    ),
    title: 'Prime Locations',
    text: 'Strategically selected locations with excellent connectivity to major roads, developing areas, schools, workplaces, and essential amenities.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#101010" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 3h9l4 4v14H6z" />
        <path d="M15 3v4h4" />
        <path d="M9.2 12.8l2 2 3.6-3.4" stroke="var(--maroon)" strokeWidth="2" />
      </svg>
    ),
    title: 'Trust & Transparency',
    text: 'Clear documentation, transparent dealings, and customer-focused service to make your plot investment simple, secure, and reliable.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#101010" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4.5 17.5v-2.5M9.5 17.5v-6M14.5 17.5v-9" stroke="var(--maroon)" strokeWidth="2" />
        <path d="M3.5 17.5h17" />
        <path d="M14.5 8.5l6.5-6" />
        <path d="M17.5 2.5h3.5V6" />
      </svg>
    ),
    title: 'Smart Investment',
    text: 'Well-planned plots with strong future potential, making them suitable for building your dream home and creating long-term value.',
  },
];

const COMMITMENTS = [
  { image: '/img/real/estate.jpg', title: 'Transparent Documentation', role: 'Every Step Explained' },
  { image: '/img/real/slide-5.jpg', title: 'Verified Approvals', role: 'Legal & Fully Approved' },
  { image: '/img/real/slide-2.jpg', title: 'Gated Security', role: '24/7 at the Gate' },
  { image: '/img/real/slide-1.jpg', title: 'After-sales Support', role: 'We Stay With You' },
];

const LOGOS = [
  { image: '/img/real/venture-2.jpg', caption: 'CES Layout – Phase I' },
  { image: '/img/real/venture-3.jpg', caption: 'CES Layout – Phase II' },
  { image: '/img/real/slide-3.jpg', caption: 'The Venture – Guntur' },
  { image: '/img/real/venture-5.jpg', caption: 'Gated Entrance' },
];

const FAQS = [
  { q: 'What makes this venture a good choice for my family?', a: 'It offers a safe, gated community with ready infrastructure, clear titles and a well-planned layout designed for comfortable living.' },
  { q: 'Is the location well-connected to workplaces and daily essentials?', a: 'Yes. The venture is close to schools, hospitals, markets and daily conveniences, making daily life convenient.' },
  { q: 'How secure is the community?', a: 'We provide gated access, proper fencing and 24/7 security at the main gate.' },
  { q: 'Can I visit the site before booking?', a: 'Absolutely. We encourage a site visit so you can see the actual location, infrastructure and progress before making a decision.' },
  { q: 'Will the land value appreciate in the future?', a: 'Given its prime location and clear documentation, the venture has strong potential for value appreciation, making it a good investment.' },
  { q: 'How do I book a plot?', a: 'You can book by paying a token amount along with KYC documents. Our sales team will guide you through the process.' },
  { q: 'Are there schools and colleges nearby?', a: 'Yes. Several reputed schools and colleges are within a short drive, making it convenient for families with children.' },
  { q: 'What about water and power supply?', a: 'The venture has clean water supply, underground drainage and reliable power with street lights laid out.' },
];

/* ---------------- Tiny pieces ---------------- */
function Accordion() {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <div className="accordion">
      {FAQS.map((f, i) => (
        <div className={`accordion-card ${openIdx === i ? 'show' : ''}`} key={f.q}>
          <button type="button" className="accordion-head" onClick={() => setOpenIdx(openIdx === i ? -1 : i)}>
            {f.q}
            <span className="accordion-ic">{openIdx === i ? '−' : '+'}</span>
          </button>
          {openIdx === i && <div className="accordion-body">{f.a}</div>}
        </div>
      ))}
    </div>
  );
}

function MapLayoutPreview() {
  const [plots, setPlots] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/plots')
      .then((d) => setPlots(d.plots || []))
      .catch(() => setError('Could not load the layout right now.'));
  }, []);

  const sold = plots.filter((p) => p.status === 'sold').length;
  const booked = plots.filter((p) => p.status === 'booked' || p.status === 'blocked').length;
  const available = plots.filter((p) => p.status === 'available').length;
  const cols = plots.length > 0 ? Math.max(1, Math.min(8, Math.ceil(Math.sqrt(plots.length)))) : 8;

  return (
    <section className="content-section map-layout-section" id="map-layout">
      <div className="container">
        <div className="map-layout-grid">
          <div className="map-layout-text">
            <div className="section-title text-left">
              <h6>Interactive Layout</h6>
            </div>
            <h2 className="map-layout-title">Explore the<br /><b>Map Layout</b></h2>
            <p>
              Pick your plot, choose your size and facing, and book it right from the layout.
              Available plots are shown in blue, booked plots in amber and sold plots in red.
            </p>
            <ul className="map-layout-stats">
              <li><span>{available}</span> Available</li>
              <li><span>{booked}</span> Booked</li>
              <li><span>{sold}</span> Sold</li>
            </ul>
            <Link to="/map-layout" className="map-layout-btn">OPEN FULL MAP LAYOUT <span className="arr">→</span></Link>
          </div>
          <div className="map-layout-preview">
            {error && <p className="form-error">{error}</p>}
            {plots.length > 0 ? (
              <>
                <div className="plot-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                  {plots.map((p) => (
                    <div
                      key={p.id}
                      className={`plot-cell plot-${p.status}`}
                      title={`Plot ${p.plotNo}${p.sizeSqft ? ` – ${p.sizeSqft.toLocaleString('en-IN')} sq.ft` : ''}`}
                    >
                      <span className="plot-no">{p.plotNo}</span>
                      {p.sizeSqft && <span className="plot-size">{p.sizeSqft}</span>}
                    </div>
                  ))}
                </div>
                <div className="legend">
                  <span><i className="dot dot-available" /> Available</span>
                  <span><i className="dot dot-blocked" /> Booked</span>
                  <span><i className="dot dot-sold" /> Sold</span>
                </div>
              </>
            ) : (
              <div className="map-layout-empty">
                <span className="map-pin">📍</span>
                <p>The detailed venture layout will be published here shortly.</p>
                <Link to="/map-layout" className="button">OPEN MAP LAYOUT <span className="arr">→</span></Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Autoplay video box (hero) ---------------- */
function VideoBox({ src, poster }) {
  return (
    <div className="video-box playing">
      <video
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
      />
    </div>
  );
}

/* ---------------- Home ---------------- */
export default function Home() {
  const [heroMedia, setHeroMedia] = useState(null);
  const expertiseRef = useRevealOnView();

  useEffect(() => {
    let mounted = true;
    api('/hero-media')
      .then((d) => { if (mounted && d && d.media) setHeroMedia(d.media); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <>
      <header className="slider white-space-bottom" id="top">
        <div className="hero-bg" />
        <div className="slider-shade" />
        <div className="container hero-inner">
          <TextSlider />
          <div className="hero-media">
            {heroMedia && heroMedia.kind === 'image' ? (
              <div className="video-box hero-media-img">
                <img src={heroMedia.url} alt="Karthikeya Infra CES" />
              </div>
            ) : (
              <VideoBox
                src={heroMedia ? heroMedia.url : null}
                poster="/img/extra/video-poster.jpg"
              />
            )}
          </div>
        </div>
        <div className="hero-callout">
          <div className="header-box"><b>12+</b><small>ACRES OF GATED VENTURE</small></div>
          <a className="hero-contact" href="tel:+918309812757">CALL US&nbsp;&nbsp;+91 83098 12757</a>
        </div>
      </header>

      {/* Tagline */}
      <section className="content-section calculator" data-bg="#f7f6f1">
        <div className="container">
          <h3>
            At Karthikeya Infra CES, we are on a continuous quest to build neighborhoods that
            truly enhance the quality of life. Our unending passion towards innovation, planning
            and lifestyle quotient helps us in creating new benchmarks in design for our clients.
          </h3>
          <h2 className="text-upper">WE BUILD YOUR DREAMS</h2>
        </div>
      </section>

      {/* Chairman / side quote */}
      <section className="content-section no-spacing">
        <div className="container">
          <div className="split-2col">
            <figure className="side-image"><img src="/img/real/estate.jpg" alt="Karthikeya Infra CES" /></figure>
            <div className="side-content">
              <p>“Over the years, Karthikeya Infra has not just built plots, but an abiding respect and recognition from the people who live there.”</p>
              <p className="button text-right"><small>- Our Founder & Lead</small></p>
            </div>
          </div>
        </div>
      </section>

      {/* Counters */}
      <section className="content-section">
        <div className="container">
          <div className="counters-3col">
            <CounterBox value={100} suffix="+" title="Happy Families" sub="Plots delivered with trust" />
            <CounterBox value={12} suffix="+" title="Acres Venture Area" sub="Planned & fully developed" />
            <CounterBox value={100} suffix="%" title="Clear Titles" sub="Verified documentation" />
          </div>
        </div>
      </section>

      {/* Ventures slider */}
      <ProjectSlider />

      {/* Expertise */}
      <section className="content-section" id="expertise" data-bg="#f7f6f1">
        <div className="container">
          <div className="section-title text-left">
            <h6>Why Choose Us</h6>
          </div>
          <div className="steps-2x2 reveal" ref={expertiseRef}>
            {EXPERTISE.map((s, i) => (
              <div className="step-box" key={s.title} style={{ ['--i']: i }}>
                <figure className="icon">{s.icon}</figure>
                <h6>{s.title}</h6>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who we are */}
      <section className="content-section no-bottom-spacing" id="who-we">
        <div className="container">
          <div className="section-title text-left">
            <h6>Who we are</h6>
          </div>
          <div className="split-2col who-we">
            <figure><img src="/img/real/slide-4.jpg" alt="Karthikeya Infra CES team" /></figure>
            <div>
              <p>
                Karthikeya Infra CES is a thoughtfully planned residential plot venture designed
                for families who value space, safety and community. With a deep commitment to
                planning excellence and transparent dealing, we have grown into a name synonymous
                with quality and trust in our region's real estate landscape.
              </p>
              <p>
                Every plot comes with clear documentation, ready infrastructure and a promise of
                transparency from day one. Our developments stand as testimony to thoughtful
                planning, contemporary aesthetics and uncompromising quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Commitment (board-style cards) */}
      <section className="content-section">
        <div className="container">
          <div className="section-title text-left">
            <h6>Our Commitment</h6>
          </div>
          <div className="commit-grid">
            {COMMITMENTS.map((c) => (
              <div className="sales-team" key={c.title}>
                <figure><img src={c.image} alt={c.title} loading="lazy" /></figure>
                <div className="infos">
                  <h6>{c.title}</h6>
                  <small>{c.role}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Venture logos strip */}
      <section className="content-section" data-bg="#f7f6f1">
        <div className="container">
          <div className="logo-items">
            {LOGOS.map((l) => (
              <figure className="logo-item" key={l.caption}>
                <Link to="/map-layout"><img src={l.image} alt={l.caption} loading="lazy" /></Link>
                <figcaption>{l.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Map layout (our addition) */}
      <MapLayoutPreview />

      {/* FAQ */}
      <section className="content-section faq-section" data-bg="#f7f6f1" id="faq">
        <div className="container">
          <div className="section-title text-left">
            <h6>FAQs</h6>
            <h2 className="faq-title">Frequently Asked<br /><b>Questions</b></h2>
          </div>
          <Accordion />
        </div>
      </section>
    </>
  );
}