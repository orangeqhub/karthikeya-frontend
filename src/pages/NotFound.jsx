import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section container page center">
      <div className="empty-state">
        <h1>404</h1>
        <p>Page not found.</p>
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    </section>
  );
}