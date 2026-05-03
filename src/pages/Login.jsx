import { Link, useNavigate } from 'react-router-dom';
import { UserAuth } from '../utils/AuthContext';
import { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { logIn } = UserAuth();
  const navigate = useNavigate();

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setFormError('');

    // Validation
    if (!email || !password) {
      setFormError('Please fill in all details');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await logIn(email, password);
      
      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      navigate('/profiles');
    } catch (error) {
      console.error('Login error:', error);
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        setFormError('Incorrect email or password. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        setFormError('Too many failed login attempts. Please try again later.');
      } else {
        setFormError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="w-full min-h-screen">
        {/* Background Image */}
        <img
          className="hidden sm:block absolute w-full h-full object-cover"
          src="https://assets.nflxext.com/ffe/siteui/vlv3/f841d4c7-10e1-40af-bcae-07a3f8dc141a/f6d7434e-d6de-4185-a6d4-c77a2d08737b/US-en-20220502-popsignuptwoweeks-perspective_alpha_website_medium.jpg"
          alt="Netflix Background"
        />

        {/* Dark Overlay */}
        <div className="bg-black/50 fixed top-0 left-0 w-full h-full"></div>

        {/* Form Container */}
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8">
          <div className="w-full max-w-netflix-form bg-black/75 rounded-netflix-md overflow-hidden shadow-netflix-xl">
            {/* Form Content */}
            <div className="px-12 py-16 md:px-16 md:py-20">
              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
                Sign In
              </h1>

              {/* Form Error */}
              {formError && (
                <div className="bg-red-600/20 border border-red-600 text-red-600 px-4 py-3 rounded-netflix-sm mb-6 text-sm">
                  {formError}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <div>
                  <input
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    value={email}
                    className={`w-full px-4 py-3 bg-netflix-darker rounded-netflix-sm text-white placeholder-netflix-text-secondary focus:outline-none focus:ring-2 transition-all ${
                      emailError
                        ? 'ring-2 ring-red-600 border border-red-600'
                        : 'focus:ring-netflix-red'
                    }`}
                    type="email"
                    placeholder="Email or phone number"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                  {emailError && (
                    <p className="text-red-600 text-xs mt-2">{emailError}</p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <div className="relative">
                    <input
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                      }}
                      value={password}
                      className={`w-full px-4 py-3 bg-netflix-darker rounded-netflix-sm text-white placeholder-netflix-text-secondary focus:outline-none focus:ring-2 transition-all pr-12 ${
                        passwordError
                          ? 'ring-2 ring-red-600 border border-red-600'
                          : 'focus:ring-netflix-red'
                      }`}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      autoComplete="current-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-netflix-text-secondary hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <FaEyeSlash className="text-lg" />
                      ) : (
                        <FaEye className="text-lg" />
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-red-600 text-xs mt-2">{passwordError}</p>
                  )}
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 rounded-netflix-sm font-bold text-white text-lg mt-6 transition-colors duration-300 ${
                    isLoading
                      ? 'bg-gray-700 cursor-not-allowed'
                      : 'bg-netflix-red hover:bg-netflix-red-hover'
                  }`}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>

                {/* Remember Me & Help */}
                <div className="flex items-center justify-between text-sm mt-6 mb-8">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-netflix-red cursor-pointer"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-netflix-text-secondary group-hover:text-white transition-colors">
                      Remember me
                    </span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-netflix-text-secondary hover:text-white transition-colors"
                  >
                    Need help?
                  </Link>
                </div>

                {/* Sign Up Link */}
                <p className="text-netflix-text-secondary text-center">
                  New to Netflix?{' '}
                  <Link to="/signup" className="text-white font-bold hover:text-netflix-red transition-colors">
                    Sign up now
                  </Link>
                </p>

                {/* reCAPTCHA text */}
                <p className="text-netflix-text-tertiary text-xs mt-6 text-center leading-relaxed">
                  This page is protected by Google reCAPTCHA to ensure you're not a bot.{' '}
                  <a href="#" className="hover:underline">Learn more</a>.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
