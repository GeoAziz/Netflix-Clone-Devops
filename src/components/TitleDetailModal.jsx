import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes, FaPlay, FaPlus, FaShare } from 'react-icons/fa';
import { UserAuth } from '../utils/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';

const TitleDetailModal = ({ isOpen, onClose, movieId, title = '' }) => {
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);
  const { user } = UserAuth();

  useEffect(() => {
    if (!isOpen || !movieId) {
      setLoading(true);
      return;
    }

    const fetchMovieDetails = async () => {
      try {
        setLoading(true);

        // Fetch movie details
        const movieRes = await axios.get(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=8f8525bdf41161d1f4b7d06d204662a9&language=en-US`
        );
        setMovie(movieRes.data);

        // Fetch cast
        const castRes = await axios.get(
          `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=8f8525bdf41161d1f4b7d06d204662a9&language=en-US`
        );
        setCast(castRes.data.cast?.slice(0, 6) || []);

        // Check if already saved
        if (user?.uid) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const saved = userDoc.data().savedShows || [];
            setIsSaved(saved.some((show) => show.id === movieId));
          }
        }
      } catch (error) {
        console.error('Error fetching movie details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [isOpen, movieId, user?.email]);

  const handleSaveShow = async () => {
    if (!user?.email) {
      alert('Please login to save movies');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.email);
      if (!isSaved && movie) {
        await updateDoc(userDocRef, {
          savedShows: arrayUnion({
            id: movie.id,
            title: movie.title,
            img: movie.poster_path,
          }),
        });
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error saving movie:', error);
    }
  };

  const handleShare = () => {
    const shareText = `Check out ${movie?.title} on Netflix Clone! ${window.location.origin}/movie/${movieId}`;
    if (navigator.share) {
      navigator.share({
        title: movie?.title,
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Movie details"
    >
      <div
        className="bg-[#141414] text-white rounded-lg max-w-2xl w-full my-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 p-2 rounded-full transition-colors z-10"
          aria-label="Close modal"
        >
          <FaTimes className="text-white text-xl" />
        </button>

        {loading ? (
          <div className="w-full h-96 flex items-center justify-center">
            <div className="text-gray-400">Loading...</div>
          </div>
        ) : movie ? (
          <>
            {/* Backdrop Image */}
            <div className="relative w-full h-64 bg-gradient-to-b from-gray-800 to-[#141414] overflow-hidden">
              {movie.backdrop_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900 to-black" />
              )}

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-black/50 to-transparent" />

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="bg-red-600 hover:bg-red-700 p-6 rounded-full transition-colors transform hover:scale-105">
                  <FaPlay className="text-white text-2xl ml-1" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
              {/* Title & Rating */}
              <div className="mb-4">
                <h2 className="text-3xl md:text-4xl font-bold mb-2">{movie.title}</h2>
                <div className="flex items-center gap-4 text-sm">
                  {movie.release_date && (
                    <>
                      <span className="text-gray-400">
                        {movie.release_date.split('-')[0]}
                      </span>
                      <span className="text-gray-500">•</span>
                    </>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span>{(movie.vote_average || 0).toFixed(1)}/10</span>
                  </div>
                  {movie.runtime && (
                    <>
                      <span className="text-gray-500">•</span>
                      <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-300 mb-6 leading-relaxed">
                {movie.overview}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded flex items-center justify-center gap-2 transition-colors">
                  <FaPlay className="ml-1" size={16} />
                  Play
                </button>
                <button
                  onClick={handleSaveShow}
                  className={`flex-1 ${
                    isSaved ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                  } text-white font-bold py-3 rounded flex items-center justify-center gap-2 transition-colors`}
                >
                  {isSaved ? (
                    <>
                      <FaTimes size={16} />
                      Saved
                    </>
                  ) : (
                    <>
                      <FaPlus size={16} />
                      My List
                    </>
                  )}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded flex items-center justify-center gap-2 transition-colors"
                  title={shared ? 'Copied!' : 'Share'}
                >
                  <FaShare size={16} />
                  {shared ? 'Copied' : 'Share'}
                </button>
              </div>

              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="mb-6">
                  <p className="text-gray-400 text-sm mb-2">Genres</p>
                  <div className="flex flex-wrap gap-2">
                    {movie.genres.map((genre) => (
                      <span
                        key={genre.id}
                        className="bg-gray-800 text-gray-300 px-3 py-1 rounded text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cast */}
              {cast.length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm mb-3 font-semibold">Cast</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {cast.map((actor) => (
                      <div key={actor.id} className="flex gap-3">
                        {actor.profile_path && (
                          <img
                            src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
                            alt={actor.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            {actor.name}
                          </p>
                          <p className="text-xs text-gray-400">as {actor.character}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-400">
            Unable to load movie details
          </div>
        )}
      </div>
    </div>
  );
};

export default TitleDetailModal;
