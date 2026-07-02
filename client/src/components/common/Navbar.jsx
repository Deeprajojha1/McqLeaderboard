import React, { useState } from 'react';
import clsx from 'clsx';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';

export default function Navbar() {
  const { user, streak, logout, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    showToast('Logged out successfully.', 'success');
    navigate('/login');
  };

  const navLinks = [
    { name: '🗺️ Map & Quiz', path: '/' },
    { name: '🏆 Leaderboard', path: '/leaderboard' },
  ];

  return (
    <header className={clsx(
      'sticky top-0 z-40 w-full',
      'border-b border-slate-200/80 dark:border-slate-800',
      'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl',
      'animate-fade-in-down'
    )}>
      <div className={clsx('max-w-7xl mx-auto flex h-16 items-center justify-between px-4')}>
        {/* Brand logo */}
        <Link to="/" className={clsx('flex items-center gap-2 group cursor-pointer')}>
          <div className={clsx(
            'p-2 bg-gradient-to-tr from-brand-600 to-indigo-600 rounded-xl text-white',
            'shadow-md shadow-brand-600/20 transition-all duration-300',
            'group-hover:shadow-lg group-hover:shadow-brand-600/30 group-hover:scale-105'
          )}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className={clsx(
            'text-base font-extrabold tracking-tight',
            'bg-gradient-to-r from-brand-700 to-indigo-700 dark:from-brand-400 dark:to-indigo-400',
            'bg-clip-text text-transparent'
          )}>
            IndiQuiz Live
          </span>
        </Link>

        {/* Navigation tabs */}
        <nav className={clsx('hidden md:flex gap-1.5')}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={clsx(
                'px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer',
                isActive(link.path)
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Auth details / Actions */}
        <div className={clsx('flex items-center gap-4')}>
          {isAuthenticated && user ? (
            <div className={clsx('flex items-center gap-3')}>
              {/* Daily Streak Badge */}
              {streak > 0 && (
                <div className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5',
                  'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20',
                  'border border-amber-200 dark:border-amber-900/40',
                  'rounded-full text-xs font-bold text-amber-700 dark:text-amber-400',
                  'shadow-sm animate-float'
                )}>
                  <span className="text-sm">🔥</span>
                  <span>{streak} {streak === 1 ? 'day' : 'days'}</span>
                </div>
              )}

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={clsx(
                    'flex items-center gap-2 focus:outline-none p-1 rounded-lg',
                    'hover:bg-slate-100 dark:hover:bg-slate-800/60',
                    'transition-all duration-200 cursor-pointer'
                  )}
                >
                  <div className={clsx(
                    'h-8 w-8 bg-gradient-to-br from-brand-500 to-indigo-500',
                    'rounded-full flex items-center justify-center',
                    'text-white text-xs font-bold shadow-md'
                  )}>
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <span className={clsx('hidden sm:inline text-sm font-semibold text-slate-700 dark:text-slate-300')}>
                    @{user.username}
                  </span>
                  <svg className={clsx('w-4 h-4 text-slate-500 hidden sm:inline transition-transform duration-200', dropdownOpen ? 'rotate-180' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className={clsx(
                    'absolute right-0 mt-2 w-48',
                    'rounded-xl bg-white dark:bg-slate-900',
                    'border border-slate-200 dark:border-slate-800',
                    'shadow-xl shadow-slate-900/10 dark:shadow-black/30',
                    'py-1.5 z-50 animate-fade-in-scale origin-top-right'
                  )}>
                    <div className={clsx('px-4 py-2.5 border-b border-slate-100 dark:border-slate-800')}>
                      <p className={clsx('text-[11px] text-slate-400 font-medium')}>Signed in as</p>
                      <p className={clsx('text-sm font-semibold text-slate-700 dark:text-slate-200 truncate')}>@{user.username}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className={clsx(
                        'block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300',
                        'hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors'
                      )}
                    >
                      <span className="flex items-center gap-2">👤 Dashboard</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className={clsx(
                        'block w-full text-left px-4 py-2.5 text-sm text-red-600',
                        'hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer'
                      )}
                    >
                      <span className="flex items-center gap-2">🚪 Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={clsx('flex items-center gap-2')}>
              <Link to="/login">
                <Button variant="outline" size="sm" className="font-semibold">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" className={clsx('hidden sm:inline')}>
                <Button size="sm" className="font-semibold shadow-md">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}