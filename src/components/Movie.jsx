import { useState, useRef } from 'react';
import ReactPlayer from 'react-player/youtube';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { UserAuth } from '../utils/AuthContext';
import { db } from '../firebase';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

const Movie = ({ item }) => {
  const [like, setLike] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const hoverRef = useRef(null);
  const { user } = UserAuth();
  const movieID = doc(db, 'users', `${user?.email}`);

  const saveShow = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user?.email) {
      alert('Please login to save a movie');
      return;
    }

    if (saved) {
      return;
    }

    await updateDoc(movieID, {
      savedShows: arrayUnion({
        id: item.id,
        title: item.title,
        img: item.backdrop_path,
      }),
    });

    setLike(true);
    setSaved(true);
  };

  return (
    <div
      ref={hoverRef}
      className={`w-[160px] sm:w-[200px] md:w-[240px] lg:w-[280px] inline-block cursor-pointer relative p-2 transform transition-transform duration-300 ${
        showPreview ? 'scale-110 z-40' : ''
      }`}
      onMouseEnter={async () => {
        // Delay preview to avoid accidental hovers
        const timer = setTimeout(async () => {
          try {
            // Fetch TMDB videos for this movie id and pick a YouTube trailer if available
            const key = import.meta.env.VITE_TMDB_API_KEY;
            const res = await fetch(
              `https://api.themoviedb.org/3/movie/${item?.id}/videos?api_key=${key}&language=en-US`
            );
            const json = await res.json();
            const yt = json.results?.find((v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
            if (yt) {
              setPreviewUrl(`https://www.youtube.com/watch?v=${yt.key}`);
            } else {
              setPreviewUrl('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
            }
          } catch (e) {
            setPreviewUrl('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
          }
          setShowPreview(true);
        }, 700);

        // store timer so it can be cleared on leave
        hoverRef.current = timer;
      }}
      onMouseLeave={() => {
        clearTimeout(hoverRef.current);
        setShowPreview(false);
      }}
    >
      <Link to={`/movie/${item?.id}`} aria-label={`Open details for ${item?.title}`}>
        <img
          className="w-full h-auto block"
          src={`https://image.tmdb.org/t/p/w500/${item?.backdrop_path}`}
          alt={item?.title}
        />

        {/* Preview player */}
        {showPreview && previewUrl ? (
          <div className="absolute inset-0 z-30">
            <ReactPlayer
              url={previewUrl}
              playing
              muted
              loop
              width="100%"
              height="100%"
              playsinline
            />
          </div>
        ) : (
          <div className="absolute top-0 left-0 w-full h-full hover:bg-black/80 opacity-0 hover:opacity-100 text-white">
            <p className="white-space-normal text-xs md:text-sm font-bold flex justify-center items-center h-full text-center px-8">
              {item?.title}
            </p>
          </div>
        )}
      </Link>

      <button
        onClick={saveShow}
        type="button"
        aria-label={saved ? 'Saved' : 'Save show'}
        className="absolute top-6 left-6"
      >
        {like ? (
          <FaHeart className="text-2xl text-red-500" />
        ) : (
          <FaRegHeart className="text-2xl text-gray-300" />
        )}
      </button>
    </div>
  );
};

export default Movie;
