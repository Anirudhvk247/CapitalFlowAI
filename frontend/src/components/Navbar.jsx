import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ onSync, isSyncing }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/daily', label: 'Daily Analysis' },
    { path: '/monthly', label: 'Monthly Analysis' },
    { path: '/archive/daily', label: 'Daily Historical Report' },
    { path: '/archive/monthly', label: 'Monthly Historical Report' },
    { path: '/education', label: 'Education' }
  ];

  return (
    <header>
      <nav className="navbar" id="mainNavbar">
        <Link to="/" className="brand">
          <span className="brand-icon">⇄</span>
          <span className="brand-name">Capital<span>Flow.Ai</span></span>
        </Link>
        <ul className="nav-links">
          {navItems.map(item => {
            // Check if active: Exact match for home, startsWith for others
            const isActive = item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <li key={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
                <Link to={item.path}>{item.label}</Link>
              </li>
            );
          })}
        </ul>
        <button 
          className="sync-btn" 
          onClick={onSync} 
          disabled={isSyncing}
          title="Sync latest market data"
        >
          <svg className={isSyncing ? 'spinning' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          {isSyncing ? "Syncing..." : "Sync Today's Data"}
        </button>
      </nav>
    </header>
  );
};

export default Navbar;
