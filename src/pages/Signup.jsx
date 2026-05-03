import { Link, useNavigate } from 'react-router-dom';
import { UserAuth } from '../utils/AuthContext';
import { useState, useReducer } from 'react';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$9.99/month',
    description: 'Good for watching on one device at a time',
    features: ['1 screen', 'Standard video quality (SD)'],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '$15.49/month',
    description: 'Great for watching on two devices at the same time',
    features: ['2 screens', 'Full HD (1080p)', 'Ad-free'],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$22.99/month',
    description: 'Perfect for watching on four devices at the same time',
    features: ['4 screens', '4K (Ultra HD) + HDR', 'Ad-free'],
  },
];

const initialState = {
  step: 1,
  email: '',
  password: '',
  confirmPassword: '',
  selectedPlan: 'standard',
  errors: {},
};

function formReducer(state, action) {
  switch (action.type) {
    case 'SET_EMAIL':
      return { ...state, email: action.payload, errors: { ...state.errors, email: '' } };
    case 'SET_PASSWORD':
      return { ...state, password: action.payload, errors: { ...state.errors, password: '' } };
    case 'SET_CONFIRM_PASSWORD':
      return { ...state, confirmPassword: action.payload, errors: { ...state.errors, confirmPassword: '' } };
    case 'SET_PLAN':
      return { ...state, selectedPlan: action.payload };
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    case 'NEXT_STEP':
      return { ...state, step: state.step + 1 };
    case 'PREV_STEP':
      return { ...state, step: Math.max(1, state.step - 1) };
    default:
      return state;
  }
}

const Signup = () => {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp } = UserAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    // RFC-like email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePasswords = (password, confirmPassword) => {
    return password && password.length >= 6 && password === confirmPassword;
  };

  const handleNextStep = () => {
    const errors = {};

    if (state.step === 1) {
      if (!validateEmail(state.email)) {
        errors.email = 'Please enter a valid email address';
      }
    } else if (state.step === 2) {
      if (!state.password || state.password.length < 6) {
        errors.password = 'Password must be at least 6 characters long';
      }
      if (state.password !== state.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'SET_ERRORS', payload: errors });
      return;
    }

    dispatch({ type: 'NEXT_STEP' });
  };

  const handlePreviousStep = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await signUp(state.email, state.password, state.selectedPlan);
      // After successful signup, redirect to profile selection
      navigate('/profiles');
    } catch (error) {
      console.log(error);
      dispatch({
        type: 'SET_ERRORS',
        payload: { submit: error.message || 'Failed to create account' },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="w-full min-h-screen">
        <img
          className="hidden sm:block absolute w-full h-full object-cover"
          src="https://assets.nflxext.com/ffe/siteui/vlv3/f841d4c7-10e1-40af-bcae-07a3f8dc141a/f6d7434e-d6de-4185-a6d4-c77a2d08737b/US-en-20220502-popsignuptwoweeks-perspective_alpha_website_medium.jpg"
          alt=""
        />
        <div className="bg-black/60 fixed top-0 left-0 w-full h-screen"></div>

        <div className="fixed w-full px-4 py-12 z-50 flex items-center justify-center min-h-screen">
          <div className="max-w-[450px] w-full bg-black/75 text-white rounded-lg shadow-2xl">
            <div className="max-w-[380px] mx-auto py-10">
              {/* Progress Indicator */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-400">
                    Step {state.step} of 3
                  </span>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`h-1 w-8 rounded transition-colors ${
                          step <= state.step
                            ? 'bg-red-600'
                            : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 1: Email */}
              {state.step === 1 && (
                <div>
                  <h1 className="text-3xl font-bold mb-6">Create Account</h1>
                  <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
                    <p className="text-gray-400 mb-4">Enter your email address</p>
                    <input
                      type="email"
                      placeholder="Email"
                      value={state.email}
                      onChange={(e) => dispatch({ type: 'SET_EMAIL', payload: e.target.value })}
                      className="w-full p-3 bg-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600"
                      autoComplete="email"
                    />
                    {state.errors.email && (
                      <p className="text-red-600 text-sm mt-2">{state.errors.email}</p>
                    )}
                    <button
                      type="submit"
                      className="w-full bg-red-600 hover:bg-red-700 py-3 rounded font-bold mt-6 transition-colors"
                    >
                      Next
                    </button>
                  </form>
                </div>
              )}

              {/* Step 2: Password */}
              {state.step === 2 && (
                <div>
                  <h1 className="text-3xl font-bold mb-6">Create Password</h1>
                  <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
                    <p className="text-gray-400 mb-4">Choose a strong password</p>
                    <input
                      type="password"
                      placeholder="Password"
                      value={state.password}
                      onChange={(e) => dispatch({ type: 'SET_PASSWORD', payload: e.target.value })}
                      className="w-full p-3 bg-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 mb-3"
                      autoComplete="new-password"
                    />
                    {state.errors.password && (
                      <p className="text-red-600 text-sm mb-2">{state.errors.password}</p>
                    )}

                    <input
                      type="password"
                      placeholder="Confirm Password"
                      value={state.confirmPassword}
                      onChange={(e) => dispatch({ type: 'SET_CONFIRM_PASSWORD', payload: e.target.value })}
                      className="w-full p-3 bg-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600"
                      autoComplete="new-password"
                    />
                    {state.errors.confirmPassword && (
                      <p className="text-red-600 text-sm mt-2">{state.errors.confirmPassword}</p>
                    )}

                    <div className="flex gap-3 mt-6">
                      <button
                        type="button"
                        onClick={handlePreviousStep}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded font-bold transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded font-bold transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Step 3: Plan Selection */}
              {state.step === 3 && (
                <form onSubmit={handleSubmit}>
                  <h1 className="text-3xl font-bold mb-6">Choose Your Plan</h1>
                  <p className="text-gray-400 mb-6">Pick the plan that works for you</p>

                  <div className="space-y-4 mb-8">
                    {PLANS.map((plan) => (
                      <label
                        key={plan.id}
                        className={`block p-4 border-2 rounded cursor-pointer transition-all ${
                          state.selectedPlan === plan.id
                            ? 'border-red-600 bg-gray-800'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="radio"
                            name="plan"
                            value={plan.id}
                            checked={state.selectedPlan === plan.id}
                            onChange={(e) => dispatch({ type: 'SET_PLAN', payload: e.target.value })}
                            className="mt-1 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-bold text-lg">{plan.name}</h3>
                              {plan.popular && (
                                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                                  Most Popular
                                </span>
                              )}
                            </div>
                            <p className="text-red-600 font-semibold my-2">{plan.price}</p>
                            <p className="text-gray-400 text-sm mb-3">{plan.description}</p>
                            <ul className="text-sm text-gray-300">
                              {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <span className="text-green-500">✓</span> {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {state.errors.submit && (
                    <p className="text-red-600 text-sm mb-4 text-center">{state.errors.submit}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handlePreviousStep}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded font-bold transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 rounded font-bold transition-colors"
                    >
                      {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              )}

              {/* Sign In Link */}
              <p className="py-6 text-center text-sm text-gray-400">
                Already subscribed to Netflix?{' '}
                <Link to="/login" className="font-bold text-red-600 hover:text-red-500">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
