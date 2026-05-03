import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaChevronRight, FaSearch } from 'react-icons/fa';
import TitleDetailModal from '../components/TitleDetailModal';

const CATEGORIES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
  { id: 99, name: 'Documentary' },
];

const BrowseCategories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedCategoryId = searchParams.get('genre');
  const [selectedCategory, setSelectedCategory] = useState(
    selectedCategoryId ? parseInt(selectedCategoryId) : null
  );
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (selectedCategory) {
      fetchMoviesByGenre(selectedCategory);
    } else {
      fetchFeaturedMovies();
    }
  }, [selectedCategory]);

  const fetchFeaturedMovies = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(
        'https://api.themoviedb.org/3/trending/movie/week?api_key=8f8525bdf41161d1f4b7d06d204662a9&language=en-US'
      );
      setMovies(response.data.results || []);
    } catch (err) {
      console.error('Error fetching featured movies:', err);
      setError('Failed to load featured movies');
    } finally {
      setLoading(false);
    }
  };

  const fetchMoviesByGenre = async (genreId) => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(
        `https://api.themoviedb.org/3/discover/movie?api_key=8f8525bdf41161d1f4b7d06d204662a9&with_genres=${genreId}&language=en-US&sort_by=popularity.desc&page=1`
      );
      setMovies(response.data.results || []);
    } catch (err) {
      console.error('Error fetching movies by genre:', err);
      setError('Failed to load movies for this category');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchParams(categoryId ? { genre: categoryId } : {});
  };

  const handleClearFilter = () => {
    setSelectedCategory(null);
    setSearchParams({});
  };

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
    setShowModal(true);
  };

  const getSelectedCategoryName = () => {
    if (!selectedCategory) return 'Featured';
    return CATEGORIES.find((c) => c.id === selectedCategory)?.name || 'All';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Browse by Category</h1>
          <p className="text-xl text-red-100 max-w-2xl">
            Explore thousands of titles organized by genre. Find your next favorite show or movie.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filter Section */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold">Categories</h2>
            {selectedCategory && (
              <button
                onClick={handleClearFilter}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Category Filter Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
            {/* Featured Button */}
            <button
              onClick={handleClearFilter}
              className={`p-4 rounded-lg font-semibold transition-all ${
                !selectedCategory
                  ? 'bg-red-600 text-white scale-105'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Featured
            </button>

            {/* Genre Buttons */}
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`p-4 rounded-lg font-semibold transition-all text-sm ${
                  selectedCategory === category.id
                    ? 'bg-red-600 text-white scale-105'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Current Selection Info */}
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-1">
                  {getSelectedCategoryName()}
                </h3>
                <p className="text-gray-400">
                  {movies.length > 0
                    ? `Showing ${Math.min(20, movies.length)} titles`
                    : 'No titles available'}
                </p>
              </div>
              <div className="text-4xl text-red-600">
                {Math.min(20, movies.length)}
              </div>
            </div>
          </div>
        </div>

        {/* Movies Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="inline-block">
                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
              </div>
              <p className="text-gray-400">Loading titles...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-8 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={handleClearFilter}
              className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-semibold transition-colors"
            >
              Try Featured
            </button>
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">No titles found</p>
            <button
              onClick={handleClearFilter}
              className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-semibold transition-colors"
            >
              Browse Featured
            </button>
          </div>
        ) : (
          <div>
            {/* Movies Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-16">
              {movies.slice(0, 20).map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => handleMovieClick(movie)}
                  className="group cursor-pointer relative overflow-hidden rounded-lg bg-gray-800 aspect-[2/3]"
                >
                  {/* Poster Image */}
                  <img
                    src={
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                        : 'https://via.placeholder.com/300x450?text=No+Image'
                    }
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                    <button className="bg-red-600 hover:bg-red-700 p-4 rounded-full transition-colors mb-4 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                      <FaChevronRight className="text-white text-xl" />
                    </button>

                    {/* Info */}
                    <div className="text-center px-2">
                      <p className="text-xs font-semibold text-yellow-400 mb-2">
                        ⭐ {(movie.vote_average || 0).toFixed(1)}/10
                      </p>
                      <h3 className="text-sm font-bold line-clamp-2 mb-2">
                        {movie.title}
                      </h3>
                      {movie.release_date && (
                        <p className="text-xs text-gray-300">
                          {movie.release_date.split('-')[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="absolute top-2 right-2 bg-red-600 px-3 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    View
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Section */}
            {movies.length > 20 && (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-6">
                  Showing 20 of {movies.length} titles
                </p>
                <button className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded font-bold transition-colors">
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Title Detail Modal */}
      <TitleDetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        movieId={selectedMovie?.id}
        title={selectedMovie?.title}
      />

      {/* Footer Info */}
      <div className="bg-gray-950 border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-gray-400 text-sm">
            <div>
              <h4 className="font-bold text-white mb-3">Browse</h4>
              <p className="mb-2">Explore {CATEGORIES.length}+ categories</p>
              <p className="text-gray-500">Discover new favorites every day</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">Categories</h4>
              <p className="mb-2">From Action to Western</p>
              <p className="text-gray-500">All your favorite genres in one place</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">Featured</h4>
              <p className="mb-2">Always updated with trending titles</p>
              <p className="text-gray-500">Don't miss the latest releases</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseCategories;
