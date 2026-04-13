import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to={user ? '/dashboard' : '/'} className="navbar-brand">
        Sub<span>App</span>
      </Link>

      <div className="navbar-actions">
        {user ? (
          <>
            <span className="text-muted">{user.email}</span>
            {user.subscribed ? (
              <span className="badge badge-active">Active</span>
            ) : user.trialActive ? (
              <span className="badge badge-trial">Trial · {user.trialDaysLeft}d left</span>
            ) : (
              <span className="badge badge-expired">Expired</span>
            )}
            <button className="btn btn-outline" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              <button className="btn btn-outline">Log in</button>
            </Link>
            <Link to="/signup">
              <button className="btn btn-primary" style={{ width: 'auto' }}>
                Sign up free
              </button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
