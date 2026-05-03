import { useState } from 'react';
import { FaHome, FaSearch, FaDownload, FaUser, FaEllipsisH } from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserAuth } from '../utils/AuthContext';
import ExpandableSearch from './ExpandableSearch';

/**
 * Mobile Bottom Navigation Component
 * 
 * CineForge Spec:
 * - 56px height + safe-area-inset-bottom
 * - Dark background with top border
 * - 4 main navigation items + dropdown
 * - Active state: red icon, visible label
 * - Inactive state: white-50, smaller label
 * - Touch-friendly 44px+ tap targets
 */

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = UserAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Hide on public/auth pages
  const isPublicPage = !user || ['/login', '/signup', '/'].includes(location.pathname);
  if (isPublicPage) return null;

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      path: '/',
      icon: FaHome,
    },
    {
      id: 'search',
      label: 'Search',
      path: '/search',
      icon: FaSearch,
      isSearch: true,
    },
    {
      id: 'downloads',
      label: 'Downloads',
      path: '/downloads',
      icon: FaDownload,
    },
    {
      id: 'account',
      label: 'Account',
      path: '/account',
      icon: FaUser,
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950 border-t border-gray-800 flex items-center justify-around md:hidden"
        style={{
          height: 'calc(56px + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          if (item.isSearch) {
            return (
              <div
                key={item.id}
                className="flex-1 h-14 flex items-center justify-center"
              >
                {/* Search component shrunk for mobile */}
                <div className="scale-75 transform origin-center">
                  <ExpandableSearch />
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              to={item.path}
              className="flex-1 h-14 flex flex-col items-center justify-center gap-0.5 transition-colors duration-200 hover:bg-gray-800/50"
            >
              <Icon
                className={`text-xl transition-colors ${
                  active ? 'text-red-600' : 'text-white/50'
                }`}
              />
              <span
                className={`text-xs font-medium transition-colors ${
                  active ? 'text-white' : 'text-white/50'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More Menu */}
        <div className="relative flex-1 h-14 flex items-center justify-center">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="flex flex-col items-center justify-center gap-0.5 w-full transition-colors duration-200 hover:bg-gray-800/50"
          >
            <FaEllipsisH className="text-xl text-white/50" />
            <span className="text-xs font-medium text-white/50">More</span>
          </button>

          {/* More Menu Dropdown */}
          {showMoreMenu && (
            <div className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-lg shadow-lg overflow-hidden z-50 min-w-48">
              <div className="py-1">
                <Link
                  to="/manage-profiles"
                  onClick={() => setShowMoreMenu(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition-colors text-sm text-white"
                >
                  <span>👥</span>
                  <span>Manage Profiles</span>
                </Link>

                <Link
                  to="/mylist"
                  onClick={() => setShowMoreMenu(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition-colors text-sm text-white"
                >
                  <span>📋</span>
                  <span>My List</span>
                </Link>

                <Link
                  to="/browse-categories"
                  onClick={() => setShowMoreMenu(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition-colors text-sm text-white"
                >
                  <span>🎬</span>
                  <span>Browse</span>
                </Link>

                <Link
                  to="/new-popular"
                  onClick={() => setShowMoreMenu(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition-colors text-sm text-white"
                >
                  <span>✨</span>
                  <span>New & Popular</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Spacer for bottom navigation */}
      <div
        className="h-14 md:hidden"
        style={{
          height: 'calc(56px + env(safe-area-inset-bottom))',
        }}
      />
    </>
  );
};

export default MobileBottomNav;
