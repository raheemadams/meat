import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import EditProfileModal from './EditProfileModal';

interface Props {
  user: User | null;
  isAdmin: boolean;
  orderCount: number;
  onAuthClick: () => void;
}

export default function Navbar({ user, isAdmin, orderCount, onAuthClick }: Props) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? '?';

  const navLink = (to: string, label: string, icon: string, badge?: number) => {
    const active = location.hash === `#${to}` || (to === '/' && location.hash === '');
    return (
      <Link
        to={to}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors relative ${
          active
            ? 'text-green-700 bg-green-50'
            : 'text-slate-600 hover:text-green-700 hover:bg-green-50'
        }`}
      >
        <i className={`fa-solid ${icon} text-xs`}></i>
        {label}
        {badge !== undefined && badge > 0 && (
          <span className="ml-1 bg-green-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-drumstick-bite text-white text-sm"></i>
            </div>
            <span className="font-display font-black text-slate-800 text-lg tracking-tight">
              HALAL<span className="text-green-700">MEAT</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLink('/', 'Browse', 'fa-store')}
            {user && navLink('/track', 'My Orders', 'fa-box-open', orderCount)}
            {navLink('/contact', 'Contact', 'fa-envelope')}
            {isAdmin && navLink('/admin', 'Admin', 'fa-shield-halved')}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-7 h-7 bg-green-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-slate-700 max-w-24 truncate">
                    {user.user_metadata?.full_name ?? user.email?.split('@')[0]}
                  </span>
                  <i className="fa-solid fa-chevron-down text-xs text-slate-400"></i>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1 animate-fadeIn">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {user.user_metadata?.full_name ?? 'User'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { setShowEditProfile(true); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <i className="fa-solid fa-user-pen text-slate-400 w-4"></i>
                      Edit Profile
                    </button>
                    {/* Mobile-only nav links */}
                    <div className="md:hidden border-t border-slate-100 mt-1">
                      <Link to="/track" onClick={() => setMenuOpen(false)}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <i className="fa-solid fa-box-open text-slate-400 w-4"></i>
                        My Orders {orderCount > 0 && <span className="ml-auto bg-green-600 text-white text-xs rounded-full px-1.5">{orderCount}</span>}
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setMenuOpen(false)}
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                          <i className="fa-solid fa-shield-halved text-slate-400 w-4"></i>
                          Admin
                        </Link>
                      )}
                    </div>
                    <button
                      onClick={async () => { await supabase.auth.signOut(); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100 mt-1"
                    >
                      <i className="fa-solid fa-right-from-bracket text-red-400 w-4"></i>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="bg-green-700 hover:bg-green-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {showEditProfile && user && (
        <EditProfileModal user={user} onClose={() => setShowEditProfile(false)} />
      )}
    </>
  );
}
