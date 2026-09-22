import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export const VENTURES = [
  { image: '/img/real/venture-2.jpg', title: 'CES Layout — Phase I', tag: 'Open for Booking' },
  { image: '/img/real/slide-1.jpg', title: 'The Venture', tag: 'Gated Community' },
  { image: '/img/real/venture-3.jpg', title: 'Premium Plots', tag: 'Clear Titles' },
  { image: '/img/real/slide-3.jpg', title: 'CES Layout — Phase II', tag: 'New Launch' },
  { image: '/img/real/venture-4.jpg', title: 'Ready Infrastructure', tag: 'Full Clearance' },
  { image: '/img/real/slide-2.jpg', title: 'Green Avenues', tag: 'Open Spaces' },
  { image: '/img/real/venture-1.jpg', title: 'Executive Homes', tag: 'Dream Home' },
  { image: '/img/real/venture-5.jpg', title: 'Clear Titles', tag: '100% Verified' },
];

export default function ProjectSlider() {
  const track = useRef(null);
  const section = useRef(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;

    let raf = null;
    let hovering = false;
    let interacting = false;
    let pausedUntil = 0;

    const tick = () => {
      const now = performance.now();
      if (!hovering && !interacting && now >= pausedUntil) {
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
          el.scrollLeft = 0;
        } else {
          el.scrollLeft += 1;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const pause = () => {
      hovering = true;
      el.style.scrollSnapType = 'x mandatory';
    };
    const resume = () => {
      hovering = false;
      el.style.scrollSnapType = 'none';
    };
    const onTouchStart = () => { interacting = true; };
    const onTouchEnd = () => {
      interacting = false;
      pausedUntil = performance.now() + 1500;
    };

    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    el.style.scrollSnapType = 'none';
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.style.scrollSnapType = '';
    };
  }, []);

  return (
    <section className="content-section white-space-bottom" data-bg="#f7f6f1" ref={section} id="projects">
      <div className="container">
        <div className="section-title text-left">
          <h6>Our Ventures</h6>
        </div>
      </div>
      <div className="swiper-container project-slider">
        <div className="swiper-wrapper proj-track" ref={track}>
          {VENTURES.map((v) => (
            <div className="swiper-slide" key={v.title}>
              <figure className="project-box">
                <Link to="/map-layout">
                  <img src={v.image} alt={v.title} loading="lazy" />
                  <span className="project-shade" />
                </Link>
                <figcaption>
                  <h5 className="text-uppercase">{v.title}</h5>
                  <p>{v.tag}</p>
                </figcaption>
              </figure>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}