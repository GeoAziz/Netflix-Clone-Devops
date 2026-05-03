import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import requests from '../Requests';
import VideoPlayer from './VideoPlayer';
import ReactPlayer from 'react-player/youtube';

const Main = () => {
  const [movies, setMovies] = useState([]);
  const [videoOpen, setVideoOpen] = useState(false);
  const movie = movies[Math.floor(Math.random() * movies.length)];

  useEffect(() => {
    axios
      .get(requests.requestPopular)
      .then((response) => setMovies(response.data.results));
  }, []);

  // Hero trailer autoplay (muted) — fetch video for selected movie
  const [heroTrailer, setHeroTrailer] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchTrailer = async () => {
      if (!movie?.id) return;
      try {
        const key = import.meta.env.VITE_TMDB_API_KEY;
        const res = await axios.get(
          `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${key}&language=en-US`
        );
        const vids = res.data.results || [];
        const yt = vids.find((v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
        if (mounted) setHeroTrailer(yt ? `https://www.youtube.com/watch?v=${yt.key}` : '');
      } catch (e) {
        if (mounted) setHeroTrailer('');
      }
    };
    fetchTrailer();
    return () => {
      mounted = false;
    };
  }, [movie]);

  const truncateString = (str, num) => {
    if (str?.length > num) {
      return str.slice(0, num) + ' ...';
    } else {
      return str;
    }
  };
  return (
    <div className=" w-full h-[550px] text-white">
      <div className="w-full h-full">
        <div className="absolute w-full h-[550px] bg-gradient-to-r from-black"></div>
        <img
            className="w-full h-full object-cover"
            src={`https://image.tmdb.org/t/p/original/${movie?.backdrop_path}`}
            alt={movie?.title}
          />
          {heroTrailer ? (
            <div className="absolute inset-0 z-10 opacity-100">
              <ReactPlayer
                url={heroTrailer}
                playing
                muted
                loop
                width="100%"
                height="100%"
                playsinline
              />
            </div>
          ) : null}
        <div className="absolute w-full top-[20%] p-4 md:p-8">
          <h1 className="text-3xl md:text-5xl font-bold">{movie?.title}</h1>

          <div className="my-4">
            <button
              onClick={() => setVideoOpen(true)}
              className="border bg-gray-300 text-black border-gray-300 py-2 px-5 inline-block hover:bg-gray-200 transition-colors"
            >
              ▶ Play
            </button>
            <Link
              to={movie ? `/movie/${movie.id}` : '/'}
              className="border text-white border-gray-300 py-2 px-5 ml-4 inline-block hover:bg-gray-700/50 transition-colors"
            >
              More Info
            </Link>
          </div>
          <p className="text-gray-400 text-sm">
            Released: {movie?.release_date}
          </p>
          <p className="w-full md:max-w-[70%] lg:max-w-[50%] xl:max-w-[35%] text-gray-200 ">
            {truncateString(movie?.overview, 150)}
          </p>
        </div>

        <VideoPlayer
          isOpen={videoOpen}
          onClose={() => setVideoOpen(false)}
          title={movie?.title || 'Now Playing'}
        />
      </div>
    </div>
  );
};

export default Main;
