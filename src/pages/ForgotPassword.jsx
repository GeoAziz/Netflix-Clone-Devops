import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserAuth } from '../utils/AuthContext';
import { FaArrowLeft } from 'react-icons/fa';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('request'); // request | success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { requestPasswordReset } = UserAuth();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const result = await requestPasswordReset(email);
      
      if (result?.success) {
        setMessage(result.data?.message);
        setStep('success');
      } else {
        setError(result?.error?.message || 'Failed to send reset email');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Failed to request password reset. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full min-h-screen bg-netflix-black">
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
              {/* Back Button */}
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-netflix-text-secondary hover:text-white transition-colors mb-8 text-sm"
              >
                <FaArrowLeft className="text-xs" />
                Back to sign in
              </Link>

              {/* STEP 1: REQUEST RESET */}
              {step === 'request' && (
                <form onSubmit={handleRequestReset}>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Find Your Account
                  </h1>
                  <p className="text-netflix-text-secondary mb-8">
                    Enter the email address or phone number associated with your Netflix account.
                  </p>

                  {error && (
                    <div className="bg-red-600/20 border border-red-600 text-red-600 px-4 py-3 rounded-netflix-sm mb-6 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="mb-6">
                    <input
                      type="email"
                      placeholder="Email address or phone number"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      className="w-full px-4 py-3 bg-netflix-darker rounded-netflix-sm text-white placeholder-netflix-text-secondary focus:outline-none focus:ring-2 focus:ring-netflix-red transition-all"
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-netflix-sm font-bold text-white text-lg transition-colors duration-300 ${
                      loading
                        ? 'bg-gray-700 cursor-not-allowed'
                        : 'bg-netflix-red hover:bg-netflix-red-hover'
                    }`}
                  >
                    {loading ? 'Sending...' : 'Email Me'}
                  </button>
                </form>
              )}

              {/* STEP 2: CONFIRMATION */}
              {step === 'success' && (
                <div className="text-center">
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
                    Check Your Email
                  </h1>

                  <div className="bg-netflix-darker rounded-netflix-lg p-8 mb-8 text-center">
                    <div className="text-5xl text-netflix-red mb-4">✓</div>
                    <p className="text-netflix-text-secondary text-base mb-4">
                      We sent a password reset link to:
                    </p>
                    <p className="text-white font-semibold text-lg break-all mb-8">
                      {email}
                    </p>
                    <p className="text-netflix-text-secondary text-sm leading-relaxed">
                      Click the link in the email to create a new password. The link will expire in 1 hour.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="text-netflix-text-secondary mb-4 text-sm">
                        Didn't receive an email?
                      </p>
                      <button
                        onClick={() => setStep('request')}
                        className="text-netflix-red hover:text-netflix-red-hover font-semibold transition-colors"
                      >
                        Try another email address
                      </button>
                    </div>

                    <div className="pt-6 border-t border-netflix-darker">
                      <p className="text-netflix-text-secondary mb-3 text-sm">
                        Remembered your password?
                      </p>
                      <Link
                        to="/login"
                        className="text-netflix-red hover:text-netflix-red-hover font-semibold transition-colors"
                      >
                        Sign in instead
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Links */}
              {step === 'request' && (
                <div className="mt-8 pt-6 border-t border-netflix-darker flex gap-4 justify-center text-xs text-netflix-text-tertiary">
                  <Link to="/login" className="hover:text-white transition-colors">
                    Sign In
                  </Link>
                  <Link to="/signup" className="hover:text-netflix-red transition-colors">
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
