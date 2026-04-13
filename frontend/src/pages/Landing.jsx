import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

export default function Landing() {
  return (
    <>
      <Navbar />
      <div className="page-center">
        <div style={{ textAlign: 'center', maxWidth: 560 }}>
          <span className="badge badge-trial" style={{ fontSize: '0.8rem', marginBottom: 20, display: 'inline-block' }}>
            3-day free trial · No credit card required
          </span>
          <h1 style={{ fontSize: '2.8rem', marginBottom: 16 }}>
            The simplest way to build<br />
            <span style={{ color: 'var(--primary)' }}>subscription apps</span>
          </h1>
          <p style={{ fontSize: '1.1rem', marginBottom: 36 }}>
            A production-ready starter with JWT auth, Stripe billing,<br />
            and a 3-day free trial — ready to ship today.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/signup">
              <button className="btn btn-primary" style={{ width: 'auto', padding: '14px 28px', fontSize: '1rem' }}>
                Start free trial
              </button>
            </Link>
            <Link to="/login">
              <button className="btn btn-outline" style={{ padding: '14px 24px', fontSize: '1rem' }}>
                Sign in
              </button>
            </Link>
          </div>

          <div className="stats-grid" style={{ marginTop: 48 }}>
            {[
              { icon: '🔒', label: 'JWT Auth' },
              { icon: '💳', label: 'Stripe Billing' },
              { icon: '⏱', label: '3-Day Trial' },
              { icon: '🗄', label: 'SQLite + Prisma' },
            ].map(({ icon, label }) => (
              <div key={label} className="stat-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
