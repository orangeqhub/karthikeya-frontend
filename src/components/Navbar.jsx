import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/projects', label: 'Projects' },
  { to: '/map-layout', label: 'Map Layout' },
];

function MenuLink({ to, label }) {
  return (
    <li>
      <Link to={to}>{label}</Link>
    </li>
  );
}

export default function Navbar() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(!isHome);

  useEffect(() => {
    setScrolled(!isHome || window.scrollY > 40);
    const onScroll = () => setScrolled(!isHome || window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="logo">
          <Link to="/"><img src="/logo.png" alt="Karthikeya Infra CES" /></Link>
        </div>

        <div className="site-menu desktop-menu">
          <ul>
            {NAV_LINKS.map((it) => <MenuLink key={it.label} {...it} />)}
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        <NavLink to="/map-layout" className={({ isActive }) => `nav-auth-btn${isActive ? ' active' : ''}`}>
          Book a Plot
        </NavLink>
      </div>
    </nav>
  );
}