import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserAuth } from '../utils/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import VideoPlayer from '../components/VideoPlayer';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = UserAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/${id}?api_key=8f8525bdf41161d1f4b7d06d204662a9&language=en-US`
        );
        setMovie(response.data);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    if (id) fetchMovie();
  }, [id]);

  const saveShow = async () => {
    if (user?.email && movie) {
      try {
        const movieID = doc(db, 'users', user.email);
        await updateDoc(movieID, {
          savedShows: arrayUnion({
            id: movie.id,
            title: movie.title,
            img: movie.backdrop_path,
          }),
        });
        setIsSaved(true);
      } catch (error) {
        console.log(error);
      }
    } else {
      alert('Please login to save a movie');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white">
        <p className="text-xl mb-4">Movie not found</p>
        <button
          onClick={() => navigate('/')}
          className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="w-full text-white bg-black min-h-screen">
      {/* Hero Section */}
      <div className="relative w-full h-[500px] md:h-[600px]">
        <img
          className="w-full h-full object-cover"
          src={`https://image.tmdb.org/t/p/original/${movie.backdrop_path}`}
          alt={movie.title}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent"></div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center p-4 md:p-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{movie.title}</h1>

          <div className="flex items-center gap-4 mb-6">
            {movie.vote_average > 0 && (
              <span className="bg-red-600 px-3 py-1 rounded text-sm font-bold">
                {Math.round(movie.vote_average * 10)}% Match
              </span>
            )}
            <span className="text-gray-300">{movie.release_date}</span>
          </div>

          <p className="max-w-3xl text-lg text-gray-200 mb-6">
            {movie.overview}
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => setVideoOpen(true)}
              className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded font-bold flex items-center gap-2 transition-colors"
            >
              ▶ Play
            </button>
            <button
              onClick={saveShow}
              className="border-2 border-gray-400 hover:border-red-600 px-8 py-3 rounded font-bold flex items-center gap-2 transition-colors"
            >
              {isSaved ? (
                <>
                  <FaHeart /> Saved
                </>
              ) : (
                <>
                  <FaRegHeart /> Save
                </>
              )}
            </button>

            <VideoPlayer
              isOpen={videoOpen}
              onClose={() => setVideoOpen(false)}
              title={movie?.title || 'Now Playing'}
            />
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="px-4 md:px-8 py-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-2">Director</h3>
            <p className="text-gray-300">Information not available</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Runtime</h3>
            <p className="text-gray-300">{movie.runtime || 'N/A'} minutes</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Genres</h3>
            <p className="text-gray-300">
              {movie.genres?.map((g) => g.name).join(', ') || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
