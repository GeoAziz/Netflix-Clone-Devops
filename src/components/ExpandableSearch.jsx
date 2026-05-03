import { useState, useRef, useEffect } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * Expandable Search Component
 * 
 * Features from CineForge Spec:
 * - Expandable width animation (0px → 240px)
 * - Auto-focus on expansion
 * - Debounced search (300ms)
 * - Results show while typing
 * - Skeleton loaders during fetch
 * - Category grouping (Top Results, Movies, TV Shows)
 * - Trending suggestions on empty
 * - Close on ESC or blur
 */

const ExpandableSearch = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState({
    trending: [],
    topResults: [],
    movies: [],
    tv: [],
  });
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // Handle expansion
  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Handle collapse
  const handleCollapse = () => {
    setIsExpanded(false);
    setSearchQuery('');
    setShowResults(false);
  };

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCollapse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setShowResults(false);
      setResults({ trending: [], topResults: [], movies: [], tv: [] });
      return;
    }

    setLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const key = import.meta.env.VITE_TMDB_API_KEY;

        // Fetch search results
        const response = await axios.get(
          `https://api.themoviedb.org/3/search/multi?api_key=${key}&query=${encodeURIComponent(searchQuery)}&page=1&language=en-US`
        );

        const items = response.data.results.slice(0, 20);

        // Categorize results
        const categorized = {
          topResults: items.slice(0, 5),
          movies: items.filter((item) => item.media_type === 'movie').slice(0, 5),
          tv: items.filter((item) => item.media_type === 'tv').slice(0, 5),
          trending: [],
        };

        setResults(categorized);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300); // CineForge spec: 300ms debounce

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // Fetch trending if no query
  useEffect(() => {
    if (!searchQuery && isExpanded) {
      const fetchTrending = async () => {
        try {
          const key = import.meta.env.VITE_TMDB_API_KEY;
          const response = await axios.get(
            `https://api.themoviedb.org/3/trending/all/week?api_key=${key}&language=en-US`
          );

          setResults((prev) => ({
            ...prev,
            trending: response.data.results.slice(0, 5),
          }));
          setShowResults(true);
        } catch (error) {
          console.error('Trending fetch error:', error);
        }
      };

      fetchTrending();
    }
  }, [isExpanded, searchQuery]);

  const handleSelectResult = (item) => {
    const id = item.id;
    const type = item.media_type || (item.title ? 'movie' : 'tv');
    navigate(`/?jbv=${id}`);
    handleCollapse();
  };

  return (
    <div className="relative">
      {/* Search Input Container */}
      <div
        className="flex items-center gap-2 bg-white/10 border-b-2 border-white/30 transition-all duration-250 ease-out"
        style={{
          width: isExpanded ? '240px' : '40px',
        }}
      >
        {/* Icon */}
        <button
          onClick={handleExpand}
          className="p-2 text-white hover:text-red-600 transition-colors flex-shrink-0"
        >
          <FaSearch size={16} />
        </button>

        {/* Input */}
        {isExpanded && (
          <input
            ref={inputRef}
            type="text"
            placeholder="Search titles, people, genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onBlur={() => {
              if (!searchQuery) handleCollapse();
            }}
            className="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-sm"
          />
        )}

        {/* Clear Button */}
        {isExpanded && searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="p-2 text-white hover:text-red-600 transition-colors flex-shrink-0"
          >
            <FaTimes size={14} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isExpanded && showResults && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-gray-900 rounded-sm shadow-lg max-h-96 overflow-y-auto z-50"
          style={{
            animation: 'dropdownSlideIn 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          {loading ? (
            // Skeleton loaders
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skeleton-shimmer h-10 rounded-sm"
                />
              ))}
            </div>
          ) : results.trending.length === 0 &&
            results.topResults.length === 0 &&
            results.movies.length === 0 &&
            results.tv.length === 0 ? (
            <div className="p-4 text-gray-400 text-sm">
              {searchQuery ? 'No results found' : 'Try searching for a title'}
            </div>
          ) : (
            <>
              {/* Trending Section (when no query) */}
              {!searchQuery && results.trending.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs text-gray-400 font-semibold uppercase">
                    Trending Now
                  </div>
                  {results.trending.map((item) => (
                    <ResultItem
                      key={item.id}
                      item={item}
                      onClick={() => handleSelectResult(item)}
                    />
                  ))}
                </div>
              )}

              {/* Top Results Section */}
              {results.topResults.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs text-gray-400 font-semibold uppercase border-t border-gray-700">
                    Top Results
                  </div>
                  {results.topResults.map((item) => (
                    <ResultItem
                      key={item.id}
                      item={item}
                      onClick={() => handleSelectResult(item)}
                    />
                  ))}
                </div>
              )}

              {/* Movies Section */}
              {results.movies.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs text-gray-400 font-semibold uppercase border-t border-gray-700">
                    Movies
                  </div>
                  {results.movies.map((item) => (
                    <ResultItem
                      key={item.id}
                      item={item}
                      onClick={() => handleSelectResult(item)}
                    />
                  ))}
                </div>
              )}

              {/* TV Section */}
              {results.tv.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs text-gray-400 font-semibold uppercase border-t border-gray-700">
                    TV Shows
                  </div>
                  {results.tv.map((item) => (
                    <ResultItem
                      key={item.id}
                      item={item}
                      onClick={() => handleSelectResult(item)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Result Item Component
const ResultItem = ({ item, onClick }) => {
  const title = item.title || item.name;
  const image = item.poster_path
    ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
    : null;
  const type = item.media_type === 'movie' ? 'Movie' : 'TV Show';

  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-2 hover:bg-gray-800 transition-colors flex items-center gap-3 text-left border-b border-gray-800 last:border-b-0"
    >
      {/* Image */}
      {image && (
        <img
          src={image}
          alt={title}
          className="w-10 h-auto rounded-sm flex-shrink-0"
        />
      )}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{title}</p>
        <p className="text-gray-400 text-xs">{type}</p>
      </div>
    </button>
  );
};

export default ExpandableSearch;
