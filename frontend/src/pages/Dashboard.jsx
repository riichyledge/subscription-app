import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import Navbar from '../components/Navbar.jsx';

export default function Dashboard() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justSubscribed = searchParams.get('subscribed') === 'true';

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [canceling, setCanceling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState('');

  useEffect(() => {
    if (justSubscribed) {
      // Give webhook a moment, then refresh user
      const t = setTimeout(() => refreshUser(), 2000);
      return () => clearTimeout(t);
    }
  }, [justSubscribed, refreshUser]);

  useEffect(() => {
    if (!user) return;

    if (!user.hasAccess) {
      navigate('/subscribe');
      return;
    }

    api.getDashboard()
      .then(setData)
      .catch((err) => {
        if (err.message.includes('403') || err.message.includes('Access denied')) {
          navigate('/subscribe');
        } else {
          setError(err.message);
        }
      });
  }, [user, navigate]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel your subscription? You will retain access until the end of the billing period.')) return;
    setCanceling(true);
    try {
      const res = await api.cancelSubscription();
      setCancelMsg(res.message);
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setCanceling(false);
    }
  };

  if (!user || !data) {
    return (
      <>
        <Navbar />
        <div className="page-center">
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      </>
    );
  }

  const memberSince = new Date(data.stats.accountCreated).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <>
      <Navbar />
      <div className="dashboard-layout">
        <div className="dashboard-content">

          {justSubscribed && (
            <div className="alert alert-success mb-16">
              Welcome aboard! Your subscription is now active.
            </div>
          )}

          {cancelMsg && (
            <div className="alert alert-warning mb-16">{cancelMsg}</div>
          )}

          {error && <div className="alert alert-error mb-16">{error}</div>}

          <div className="dashboard-header">
            <div className="flex items-center justify-between">
              <div>
                <h1>Dashboard</h1>
                <p className="mt-4">{data.message}</p>
              </div>
              {user.subscribed ? (
                <span className="badge badge-active">Active subscription</span>
              ) : (
                <span className="badge badge-trial">
                  Trial · {data.stats.trialDaysLeft} day{data.stats.trialDaysLeft !== 1 ? 's' : ''} left
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Status</div>
              <div className="stat-value" style={{ fontSize: '1.1rem', textTransform: 'capitalize' }}>
                {data.stats.subscriptionStatus}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Trial Days Left</div>
              <div className="stat-value">{data.stats.trialDaysLeft}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Member Since</div>
              <div className="stat-value" style={{ fontSize: '0.9rem' }}>{memberSince}</div>
            </div>
          </div>

          {/* Features */}
          <h2 className="mt-24 mb-16">Features</h2>
          <div className="feature-grid">
            {[
              { icon: '⚡', title: 'Fast Performance', desc: 'Built on Vite + Node for lightning-fast responses.' },
              { icon: '🔒', title: 'Secure by Default', desc: 'JWT auth, bcrypt passwords, helmet headers.' },
              { icon: '💳', title: 'Stripe Billing', desc: 'Manage your subscription with one click.' },
              { icon: '📊', title: 'Real-time Stats', desc: 'Your account data, always up to date.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="feature-card">
                <div className="feature-icon">{icon}</div>
                <h3>{title}</h3>
                <p className="mt-4">{desc}</p>
              </div>
            ))}
          </div>

          {/* Subscription management */}
          {user.subscribed && (
            <div className="stat-card mt-24" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>Subscription</h3>
                <p className="mt-4">$15/month · Cancel at any time</p>
              </div>
              <button
                className="btn btn-danger"
                onClick={handleCancel}
                disabled={canceling}
              >
                {canceling ? <><span className="spinner" /> Canceling…</> : 'Cancel subscription'}
              </button>
            </div>
          )}

          {!user.subscribed && !user.trialActive && (
            <div className="stat-card mt-24" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>Your trial has ended</h3>
                <p className="mt-4">Subscribe to keep access</p>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: 'auto' }}
                onClick={() => navigate('/subscribe')}
              >
                Subscribe — $15/mo
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
