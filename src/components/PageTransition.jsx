import { useEffect, useState } from 'react';

export default function PageTransition() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setGone(true), 1400);
    return () => clearTimeout(t);
  }, []);

  if (gone) return null;

  return (
    <div className="page-transition">
      <div className="page-transition-inner">
        <img src="/logo.png" alt="Karthikeya Infra CES" />
      </div>
    </div>
  );
}