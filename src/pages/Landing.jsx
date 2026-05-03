import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronDown, FaGlobe } from 'react-icons/fa';

const FAQ_ITEMS = [
  {
    id: 1,
    question: 'What is Netflix?',
    answer: 'Netflix is a streaming service that offers a wide variety of award-winning TV shows, movies, anime, documentaries, and more on thousands of internet-connected devices.',
  },
  {
    id: 2,
    question: 'How much does Netflix cost?',
    answer: 'Watch Netflix on your smartphone, tablet, Smart TV, laptop, or streaming device, all for one fixed monthly price. Plans range from $6.99 to $22.99 a month. No extra costs, no contracts.',
  },
  {
    id: 3,
    question: 'Where can I watch?',
    answer: 'Watch anywhere, anytime. Sign in with your Netflix account to watch instantly on the web at netflix.com from your personal computer or on any internet-connected device that offers the Netflix app.',
  },
  {
    id: 4,
    question: 'How do I cancel?',
    answer: 'Netflix is flexible. There are no annoying contracts and no commitments. You can easily cancel your account online in two clicks. There are no cancellation fees – start or stop your account anytime.',
  },
  {
    id: 5,
    question: 'What can I watch on Netflix?',
    answer: 'Netflix has an extensive library of feature films, documentaries, TV shows, anime, award-winning Netflix originals, and more. Watch as much as you want, anytime you want.',
  },
  {
    id: 6,
    question: 'Is Netflix good for kids?',
    answer: 'The Netflix Kids experience is included in your membership to give parents control while kids enjoy family-friendly TV shows and movies in their own space.',
  },
  {
    id: 7,
    question: 'Can I download my shows?',
    answer: 'Yes! Save your favorites easily and always have something to watch. Watch downloads on your phone, tablet, or computer, even when you don\'t have an internet connection.',
  },
  {
    id: 8,
    question: 'What is the Netflix password sharing policy?',
    answer: 'We understand that passwords are meant to be shared. While we encourage sharing within a household, Netflix accounts cannot be shared with people outside of your household.',
  },
];

const Landing = () => {
  const [expandedId, setExpandedId] = useState(null);
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('en');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const toggleFaq = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email) {
      window.location.href = `/signup?email=${encodeURIComponent(email)}`;
    }
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
  ];

  return (
    <div className="w-full min-h-screen bg-netflix-black text-white font-sans">
      {/* NAVBAR (Public) */}
      <div className="fixed w-full z-50 bg-gradient-to-b from-black/80 to-transparent px-4 md:px-8 py-4 md:py-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-netflix-red text-3xl md:text-4xl font-bold cursor-pointer tracking-tight">
              NETFLIX
            </h1>
          </Link>

          {/* Right: Language & Sign In */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-2 text-netflix-text-secondary hover:text-white transition-colors text-sm border border-netflix-text-secondary hover:border-white rounded px-2 py-1"
              >
                <FaGlobe className="text-base" />
                <span className="hidden sm:inline">{languages.find(l => l.code === language)?.label}</span>
                <FaChevronDown className="text-xs" />
              </button>

              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-netflix-darker rounded-netflix-sm shadow-netflix-lg z-50 overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setShowLanguageMenu(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        language === lang.code
                          ? 'bg-netflix-red text-white'
                          : 'text-netflix-text-secondary hover:bg-netflix-dark'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sign In Button */}
            <Link to="/login">
              <button className="bg-netflix-red hover:bg-netflix-red-hover text-white font-semibold px-4 md:px-6 py-2 rounded-netflix-sm transition-colors duration-300">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="relative h-screen overflow-hidden pt-20">
        {/* Background image */}
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src="https://assets.nflxext.com/ffe/siteui/vlv3/f841d4c7-10e1-40af-bcae-07a3f8dc141a/f6d7434e-d6de-4185-a6d4-c77a2d08737b/US-en-20220502-popsignuptwoweeks-perspective_alpha_website_medium.jpg"
          alt="Netflix"
        />

        {/* Gradient overlay - left to right fade */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80 z-5"></div>

        {/* Bottom fade gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-netflix-black to-transparent z-5"></div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-3xl">
            {/* Main Heading */}
            <h1 className="text-netflix-hero-mobile md:text-netflix-hero-desktop font-bold mb-4 md:mb-6">
              Unlimited movies, TV shows, and more
            </h1>

            {/* Subtitle */}
            <p className="text-netflix-subtitle-mobile md:text-netflix-subtitle-desktop font-light text-netflix-text-secondary mb-6 md:mb-8">
              Watch anywhere. Cancel anytime.
            </p>

            {/* Description */}
            <p className="text-base md:text-lg text-netflix-text-secondary mb-8 md:mb-10 leading-relaxed">
              Ready to watch? Enter your email to create or restart your membership.
            </p>

            {/* Email CTA */}
            <form onSubmit={handleEmailSubmit} className="flex flex-col md:flex-row gap-3 md:gap-2 justify-center">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full md:flex-1 md:max-w-sm px-5 py-3 md:py-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-netflix-sm text-white placeholder-white/60 focus:outline-none focus:border-white focus:ring-1 focus:ring-netflix-red transition-colors text-base md:text-lg"
              />
              <button
                type="submit"
                className="bg-netflix-red hover:bg-netflix-red-hover text-white font-bold px-8 py-3 md:py-4 rounded-netflix-sm transition-colors duration-300 flex items-center justify-center gap-2 whitespace-nowrap text-base md:text-lg"
              >
                Get Started <span className="text-xl">→</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="h-2 bg-netflix-darker"></div>

      {/* FEATURE SECTION 1 - Enjoy on Your TV */}
      <div className="bg-netflix-black py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-16">
          {/* Text Content */}
          <div className="flex-1 text-center md:text-left order-2 md:order-1">
            <h2 className="text-netflix-section-head font-bold mb-4 text-white">
              Enjoy on your TV
            </h2>
            <p className="text-base md:text-lg text-netflix-text-secondary leading-relaxed mb-4">
              Watch on smart TVs, PlayStation, Xbox, Chromecast, Apple TV, Blu-ray players and more.
            </p>
          </div>

          {/* Image Placeholder */}
          <div className="flex-1 w-full order-1 md:order-2">
            <div className="relative h-96 md:h-[500px] bg-gradient-to-br from-netflix-red/20 to-netflix-darker rounded-netflix-lg flex items-center justify-center overflow-hidden shadow-2xl">
              <img
                src="https://occ-0-4796-2186.1.nflxso.net/dnm/api/v6/19OhWN2dO57promSwain5KpdKvnU/AAAABXYofKdCJceVlv1JwSJcLvrWWcV5SAEOHUxrH82GajqMFYndkXeGYw_i2IIeD-TNcYLJS_-jJFQright-t6xDUx9o5ReL.png?r=a41"
                alt="TV"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="h-2 bg-netflix-darker"></div>

      {/* FEATURE SECTION 2 - Download */}
      <div className="bg-netflix-black py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center gap-12 md:gap-16">
          {/* Text Content */}
          <div className="flex-1 text-center md:text-left order-2 md:order-1">
            <h2 className="text-netflix-section-head font-bold mb-4 text-white">
              Download your shows to watch offline
            </h2>
            <p className="text-base md:text-lg text-netflix-text-secondary leading-relaxed">
              Save your favorites easily and always have something to watch. Watch downloads on your phone, tablet, or computer, even when you don't have an internet connection.
            </p>
          </div>

          {/* Image Placeholder */}
          <div className="flex-1 w-full order-1 md:order-2">
            <div className="relative h-96 md:h-[500px] bg-gradient-to-br from-netflix-red/20 to-netflix-darker rounded-netflix-lg flex items-center justify-center overflow-hidden shadow-2xl">
              <img
                src="https://occ-0-4796-2186.1.nflxso.net/dnm/api/v6/19OhWN2dO57promSwain5KpdKvnU/AAAABXx8Z5-dhtzHmvDJALmktwpIloMcs2bYvjMYNxjTH9ynMJ0DBPmKZcKQywXright-t6xDUx9o5ReL.png?r=a41"
                alt="Download"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="h-2 bg-netflix-darker"></div>

      {/* FEATURE SECTION 3 - Watch Everywhere */}
      <div className="bg-netflix-black py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-16">
          {/* Text Content */}
          <div className="flex-1 text-center md:text-left order-2 md:order-1">
            <h2 className="text-netflix-section-head font-bold mb-4 text-white">
              Watch everywhere
            </h2>
            <p className="text-base md:text-lg text-netflix-text-secondary leading-relaxed">
              Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV.
            </p>
          </div>

          {/* Image Placeholder */}
          <div className="flex-1 w-full order-1 md:order-2">
            <div className="relative h-96 md:h-[500px] bg-gradient-to-br from-netflix-red/20 to-netflix-darker rounded-netflix-lg flex items-center justify-center overflow-hidden shadow-2xl">
              <img
                src="https://occ-0-4796-2186.1.nflxso.net/dnm/api/v6/19OhWN2dO57promSwain5KpdKvnU/AAAABXylLBjWceHn4v9m0K0ekTxhMEJxIcyVMpGftright-t6xDUx9o5ReL.png?r=a41"
                alt="Watch Everywhere"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="h-2 bg-netflix-darker"></div>

      {/* FEATURE SECTION 4 - Kids Profile */}
      <div className="bg-netflix-black py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center gap-12 md:gap-16">
          {/* Text Content */}
          <div className="flex-1 text-center md:text-left order-2 md:order-1">
            <h2 className="text-netflix-section-head font-bold mb-4 text-white">
              Create profiles for kids
            </h2>
            <p className="text-base md:text-lg text-netflix-text-secondary leading-relaxed">
              Send kids on adventures with their favorite characters in a space made just for them—free with your membership.
            </p>
          </div>

          {/* Image Placeholder */}
          <div className="flex-1 w-full order-1 md:order-2">
            <div className="relative h-96 md:h-[500px] bg-gradient-to-br from-netflix-red/20 to-netflix-darker rounded-netflix-lg flex items-center justify-center overflow-hidden shadow-2xl">
              <img
                src="https://occ-0-4796-2186.1.nflxso.net/dnm/api/v6/19OhWN2dO57promSwain5KpdKvnU/AAAABUb-_JanUL1xobEUJtS8eAtYZrO_7IcKpUright-t6xDUx9o5ReL.png?r=a41"
                alt="Kids"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="h-2 bg-netflix-darker"></div>

      {/* FAQ SECTION */}
      <div className="bg-netflix-black py-16 md:py-24 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Section Title */}
          <h2 className="text-3xl md:text-5xl font-bold mb-8 md:mb-12 text-center text-white">
            Frequently Asked Questions
          </h2>

          {/* FAQ Items */}
          <div className="space-y-2 md:space-y-3">
            {FAQ_ITEMS.map((item) => (
              <div
                key={item.id}
                className="border border-netflix-border-primary bg-netflix-darker hover:bg-netflix-dark transition-colors"
              >
                <button
                  onClick={() => toggleFaq(item.id)}
                  className="w-full px-6 py-5 md:py-6 flex items-center justify-between text-left hover:bg-netflix-dark/80 transition-colors"
                >
                  <span className="text-lg md:text-xl font-semibold text-white pr-4">
                    {item.question}
                  </span>
                  <div
                    className={`text-3xl text-netflix-red flex-shrink-0 transform transition-transform duration-300 ${
                      expandedId === item.id ? 'rotate-45' : ''
                    }`}
                  >
                    +
                  </div>
                </button>

                {/* Expanded Answer */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedId === item.id ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className="bg-netflix-darker px-6 py-6 md:py-8 text-netflix-text-secondary border-t border-netflix-border-primary">
                    {item.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Below FAQ */}
          <div className="mt-12 md:mt-16 text-center">
            <p className="text-lg md:text-xl text-netflix-text-secondary mb-8">
              Ready to watch? Enter your email to create or restart your membership.
            </p>

            <form onSubmit={handleEmailSubmit} className="flex flex-col md:flex-row gap-3 md:gap-2 justify-center">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full md:flex-1 md:max-w-sm px-5 py-3 md:py-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-netflix-sm text-white placeholder-white/60 focus:outline-none focus:border-white focus:ring-1 focus:ring-netflix-red transition-colors text-base md:text-lg"
              />
              <button
                type="submit"
                className="bg-netflix-red hover:bg-netflix-red-hover text-white font-bold px-8 py-3 md:py-4 rounded-netflix-sm transition-colors duration-300 flex items-center justify-center gap-2 whitespace-nowrap text-base md:text-lg"
              >
                Get Started <span className="text-xl">→</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="h-2 bg-netflix-darker"></div>

      {/* FOOTER */}
      <footer className="bg-netflix-black px-4 md:px-8 py-12 md:py-16 border-t border-netflix-darker">
        <div className="max-w-7xl mx-auto">
          {/* Contact */}
          <p className="text-netflix-text-tertiary text-sm md:text-base mb-8">
            Questions? Call <a href="tel:1-844-505-2993" className="hover:text-white underline">1-844-505-2993</a>
          </p>

          {/* Footer Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <a href="#" className="text-netflix-text-tertiary hover:text-white text-xs md:text-sm transition-colors">
              FAQ
            </a>
            <a href="#" className="text-netflix-text-tertiary hover:text-white text-xs md:text-sm transition-colors">
              Help Center
            </a>
            <a href="#" className="text-netflix-text-tertiary hover:text-white text-xs md:text-sm transition-colors">
              Account
            </a>
            <a href="#" className="text-netflix-text-tertiary hover:text-white text-xs md:text-sm transition-colors">
              Media Center
            </a>
            <a href="#" className="text-netflix-text-tertiary hover:text-white text-xs md:text-sm transition-colors">
              Investor Relations
            </a>
            <a href="#" className="text-netflix-text-tertiary hover:text-white text-xs md:text-sm transition-colors">
              Jobs
            </a>
            <a href="#" className="text-netflix-text-tertiary hover:text-white text-xs md:text-sm transition-colors">
              Ways to Watch
            </a>
            <a href="#" className="text-netflix-text-tertiary hover:text-white text-xs md:text-sm transition-colors">
              Terms of Use
            </a>
            <a href="#" className="text-netflix-text-tertiary hover:text-white text-xs md:text-sm transition-colors">
              Privacy
            </a>
            <a href="#" className="text-netflix-text-tertiary hover:text-white text-xs md:text-sm transition-colors">
              Cookie Preferences
            </a>
            <a href="#" className="text-netflix-text-tertiary hover:text-white text-xs md:text-sm transition-colors">
              Corporate Information
            </a>
            <a href="#" className="text-netflix-text-tertiary hover:text-white text-xs md:text-sm transition-colors">
              Contact Us
            </a>
          </div>

          {/* Language Selector */}
          <div className="relative mb-8 max-w-xs">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center gap-2 text-netflix-text-tertiary hover:text-white transition-colors text-sm border border-netflix-text-tertiary hover:border-white rounded px-3 py-2"
            >
              <FaGlobe className="text-base" />
              <span>{languages.find(l => l.code === language)?.label}</span>
            </button>

            {showLanguageMenu && (
              <div className="absolute top-full left-0 mt-2 w-40 bg-netflix-darker rounded-netflix-sm shadow-netflix-lg z-50 overflow-hidden">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLanguageMenu(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      language === lang.code
                        ? 'bg-netflix-red text-white'
                        : 'text-netflix-text-secondary hover:bg-netflix-dark'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Copyright */}
          <p className="text-netflix-text-tertiary text-xs md:text-sm">
            Netflix Kenya
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
