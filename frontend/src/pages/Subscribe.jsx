import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import Navbar from '../components/Navbar.jsx';

export default function Subscribe() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canceled = searchParams.get('canceled') === 'true';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    setError('');
    setLoading(true);
    try {
      const { url } = await api.createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-center">
        <div className="card card-wide">
          <div className="text-center mb-24">
            <h1>Upgrade your plan</h1>
            <p className="mt-8">
              {user?.trialActive
                ? `You have ${user.trialDaysLeft} day${user.trialDaysLeft !== 1 ? 's' : ''} left in your trial`
                : 'Your free trial has ended — subscribe to continue'}
            </p>
          </div>

          {canceled && (
            <div className="alert alert-warning">
              Checkout was canceled. You can try again whenever you're ready.
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <div className="pricing-card">
            <p className="text-muted" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Pro Plan
            </p>
            <div className="price-amount">
              <span>$</span>15
            </div>
            <p className="price-period">per month · cancel anytime</p>

            <ul className="feature-list">
              <li>Full dashboard access</li>
              <li>All current &amp; future features</li>
              <li>Priority support</li>
              <li>Secure Stripe billing</li>
            </ul>

            <button
              className="btn btn-primary"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Redirecting to checkout…</> : 'Subscribe — $15/month'}
            </button>

            <p className="text-muted mt-16" style={{ fontSize: '0.8rem' }}>
              Secured by Stripe. Cancel anytime from your dashboard.
            </p>
          </div>

          {user?.hasAccess && (
            <p className="text-center text-muted mt-16">
              You still have access.{' '}
              <button
                className="btn btn-outline"
                style={{ display: 'inline', padding: 0, background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', font: 'inherit' }}
                onClick={() => navigate('/dashboard')}
              >
                Go to dashboard
              </button>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
