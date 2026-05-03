import { FaRegUserCircle, FaSearch, FaGlobe, FaBars, FaTimes } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserAuth } from '../utils/AuthContext';
import { useState, useEffect } from 'react';
import ExpandableSearch from './ExpandableSearch';

const Navbar = () => {
  const { user, logOut } = UserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [language, setLanguage] = useState('en');

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
  ];

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Browse Categories', path: '/browse-categories' },
    { label: 'New & Popular', path: '/new-popular' },
    { label: 'My List', path: '/mylist' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (err) {
      console.log(err);
    }
  };

  const isPublicPage = !user && ['/login', '/signup', '/'].includes(location.pathname);
  const isAuthPage = user && ['/login', '/signup'].includes(location.pathname);

  // For public pages (landing, login, signup), use a different navbar style
  if (isPublicPage || isAuthPage) {
    return (
      <div
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled || isAuthPage
            ? 'bg-black/90'
            : 'bg-transparent'
        } px-4 md:px-8 py-4 md:py-6`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-red-600 text-3xl md:text-4xl font-bold cursor-pointer tracking-tight">
              NETFLIX
            </h1>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-4 md:gap-8">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-2 text-neutral-300 hover:text-white transition-colors text-sm"
              >
                <FaGlobe className="text-lg" />
                <span className="hidden sm:inline">{languages.find(l => l.code === language)?.label}</span>
              </button>

              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-netflix-darker rounded-md shadow-lg z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setShowLanguageMenu(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        language === lang.code
                          ? 'bg-netflix-red text-white'
                          : 'text-neutral-300 hover:bg-netflix-dark'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            {!user ? (
              <>
                <Link to="/login">
                  <button className="text-neutral-300 hover:text-white font-semibold transition-colors">
                    Sign In
                  </button>
                </Link>
                <Link to="/signup">
                  <button className="bg-netflix-red hover:bg-netflix-red-hover px-5 py-2 rounded-netflix-sm font-semibold text-white transition-colors duration-300">
                    Sign Up
                  </button>
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Authenticated navbar
  return (
    <div
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-netflix-black/95'
          : 'bg-gradient-to-b from-black/70 to-transparent'
      } px-4 md:px-8`}
      style={{ height: 'var(--navbar-height-desktop)' }}
    >
      <div className="h-full max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Logo and Nav Links */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-netflix-red text-3xl md:text-4xl font-bold cursor-pointer tracking-tight">
              NETFLIX
            </h1>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors duration-300 letter-spacing ${
                  location.pathname === link.path
                    ? 'text-white'
                    : 'text-neutral-300 opacity-70 hover:opacity-100 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden text-neutral-300 hover:text-white text-xl"
          >
            {showMobileMenu ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Right: Search, Language, Profile */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Expandable Search */}
          <ExpandableSearch />

          {/* Language Selector */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center gap-2 text-neutral-300 hover:text-white transition-colors text-sm"
            >
              <FaGlobe />
              <span>{languages.find(l => l.code === language)?.label}</span>
            </button>

            {showLanguageMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-netflix-darker rounded-md shadow-netflix-lg z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLanguageMenu(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      language === lang.code
                        ? 'bg-netflix-red text-white'
                        : 'text-neutral-300 hover:bg-netflix-dark'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="text-neutral-300 hover:text-netflix-red transition-colors text-2xl"
              aria-label="Profile menu"
            >
              <FaRegUserCircle />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-netflix-darker rounded-md shadow-netflix-lg z-50">
                <div className="px-4 py-3 text-sm text-neutral-400 border-b border-netflix-dark">
                  Signed in as: <span className="text-white font-semibold">{user?.email}</span>
                </div>

                <div className="py-2">
                  <Link
                    to="/account"
                    onClick={() => setShowProfileMenu(false)}
                    className="block px-4 py-2 text-sm text-neutral-300 hover:bg-netflix-dark hover:text-white transition-colors"
                  >
                    Account Settings
                  </Link>
                  <Link
                    to="/manage-profiles"
                    onClick={() => setShowProfileMenu(false)}
                    className="block px-4 py-2 text-sm text-neutral-300 hover:bg-netflix-dark hover:text-white transition-colors"
                  >
                    Manage Profiles
                  </Link>
                  <Link
                    to="/profiles"
                    onClick={() => setShowProfileMenu(false)}
                    className="block px-4 py-2 text-sm text-neutral-300 hover:bg-netflix-dark hover:text-white transition-colors"
                  >
                    Switch Profile
                  </Link>
                </div>

                <div className="border-t border-netflix-dark py-2">
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowProfileMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-netflix-dark hover:text-white transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-netflix-black/95 border-t border-netflix-darker">
          <nav className="flex flex-col gap-2 p-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setShowMobileMenu(false)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'bg-netflix-red text-white'
                    : 'text-neutral-300 hover:bg-netflix-dark'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
};

export default Navbar;
