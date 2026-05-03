import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

const AdvancedFilters = ({ isOpen, onClose, onApplyFilters }) => {
  const [filters, setFilters] = useState({
    genres: [],
    yearRange: [1990, 2026],
    rating: [0, 10],
    duration: [0, 200],
    language: 'en',
    sortBy: 'popularity',
    maturityLevel: 'PG-13',
  });

  const genres = [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Sci-Fi' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' },
  ];

  const maturityLevels = ['G', 'PG', 'PG-13', 'R', 'NC-17'];
  const languages = ['en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh'];
  const sortOptions = [
    { value: 'popularity', label: 'Popularity' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'release_date', label: 'Newest' },
    { value: 'title', label: 'A-Z' },
  ];

  const handleGenreToggle = (genreId) => {
    setFilters((prev) => ({
      ...prev,
      genres: prev.genres.includes(genreId)
        ? prev.genres.filter((id) => id !== genreId)
        : [...prev.genres, genreId],
    }));
  };

  const handleRangeChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      genres: [],
      yearRange: [1990, 2026],
      rating: [0, 10],
      duration: [0, 200],
      language: 'en',
      sortBy: 'popularity',
      maturityLevel: 'PG-13',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between p-6 bg-gray-900 border-b border-gray-800 z-10">
            <h2 className="text-2xl font-bold text-white">Advanced Filters</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Close filters"
            >
              <FaTimes size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Genres */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Genres</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => handleGenreToggle(genre.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filters.genres.includes(genre.id)
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                    aria-pressed={filters.genres.includes(genre.id)}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Year Range */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Year Range: {filters.yearRange[0]} - {filters.yearRange[1]}
              </h3>
              <div className="space-y-4">
                <input
                  type="range"
                  min="1900"
                  max="2026"
                  value={filters.yearRange[0]}
                  onChange={(e) =>
                    handleRangeChange('yearRange', [
                      parseInt(e.target.value),
                      filters.yearRange[1],
                    ])
                  }
                  className="w-full"
                  aria-label="Minimum year"
                />
                <input
                  type="range"
                  min="1900"
                  max="2026"
                  value={filters.yearRange[1]}
                  onChange={(e) =>
                    handleRangeChange('yearRange', [
                      filters.yearRange[0],
                      parseInt(e.target.value),
                    ])
                  }
                  className="w-full"
                  aria-label="Maximum year"
                />
              </div>
            </div>

            {/* Rating */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Rating: {filters.rating[0]} - {filters.rating[1]}
              </h3>
              <div className="space-y-4">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={filters.rating[0]}
                  onChange={(e) =>
                    handleRangeChange('rating', [
                      parseFloat(e.target.value),
                      filters.rating[1],
                    ])
                  }
                  className="w-full"
                  aria-label="Minimum rating"
                />
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={filters.rating[1]}
                  onChange={(e) =>
                    handleRangeChange('rating', [
                      filters.rating[0],
                      parseFloat(e.target.value),
                    ])
                  }
                  className="w-full"
                  aria-label="Maximum rating"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Duration: {filters.duration[0]} - {filters.duration[1]} minutes
              </h3>
              <div className="space-y-4">
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="5"
                  value={filters.duration[0]}
                  onChange={(e) =>
                    handleRangeChange('duration', [
                      parseInt(e.target.value),
                      filters.duration[1],
                    ])
                  }
                  className="w-full"
                  aria-label="Minimum duration"
                />
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="5"
                  value={filters.duration[1]}
                  onChange={(e) =>
                    handleRangeChange('duration', [
                      filters.duration[0],
                      parseInt(e.target.value),
                    ])
                  }
                  className="w-full"
                  aria-label="Maximum duration"
                />
              </div>
            </div>

            {/* Maturity Level */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Maturity Level
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {maturityLevels.map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, maturityLevel: level }))
                    }
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filters.maturityLevel === level
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                    aria-pressed={filters.maturityLevel === level}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Sort By</h3>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, sortBy: e.target.value }))
                }
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-red-600 focus:outline-none"
                aria-label="Sort by"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Language
              </h3>
              <select
                value={filters.language}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, language: e.target.value }))
                }
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-red-600 focus:outline-none"
                aria-label="Language"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex gap-4 p-6 bg-gray-900 border-t border-gray-800">
            <button
              onClick={handleReset}
              className="flex-1 px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilters;
