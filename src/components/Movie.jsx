import { useState, useRef } from 'react';
import ReactPlayer from 'react-player/youtube';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { UserAuth } from '../utils/AuthContext';
import { db } from '../firebase';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import HoverCardExpanded from './HoverCardExpanded';

const Movie = ({ 
  item,
  onHoverExpand,
  onHoverCollapse,
  onCardClick,
  isExpanded
}) => {
  const [like, setLike] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showHoverCard, setShowHoverCard] = useState(false);
  const hoverRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const { user } = UserAuth();
  const navigate = useNavigate();
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
      className={`relative inline-block cursor-pointer transition-all duration-300 z-20`}
      onMouseEnter={() => {
        // 400ms delay before expanding (CineForge spec)
        hoverTimeoutRef.current = setTimeout(async () => {
          try {
            const key = import.meta.env.VITE_TMDB_API_KEY;
            const res = await fetch(
              `https://api.themoviedb.org/3/movie/${item?.id}/videos?api_key=${key}&language=en-US`
            );
            const json = await res.json();
            const yt = json.results?.find((v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
            if (yt) {
              setPreviewUrl(`https://www.youtube.com/watch?v=${yt.key}`);
            }
          } catch (e) {
            // Fallback trailer
          }
          setShowHoverCard(true);
          if (onHoverExpand) {
            onHoverExpand(true);
          }
        }, 400); // CineForge: 400ms delay before expansion
      }}
      onMouseLeave={() => {
        clearTimeout(hoverTimeoutRef.current);
        setShowHoverCard(false);
        setShowPreview(false);
        if (onHoverCollapse) {
          onHoverCollapse(false);
        }
      }}
      onClick={() => {
        // Navigate to modal using ?jbv parameter
        navigate(`/?jbv=${item?.id}`);
      }}
    >
      {/* Movie poster card */}
      <div className="w-[160px] sm:w-[200px] md:w-[240px] lg:w-[280px] aspect-video overflow-hidden rounded-lg cursor-pointer">
        <img
          className="w-full h-full object-cover block transform transition-transform duration-300 hover:scale-105"
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
      </div>

      {/* Save button */}
      <button
        onClick={saveShow}
        type="button"
        aria-label={saved ? 'Saved' : 'Save show'}
        className="absolute top-6 left-6 z-50"
      >
        {like ? (
          <FaHeart className="text-2xl text-red-500" />
        ) : (
          <FaRegHeart className="text-2xl text-gray-300" />
        )}
      </button>

      {/* Show HoverCard when expanded */}
      {showHoverCard && (
        <div className="absolute -inset-12 z-50 pointer-events-auto">
          <HoverCardExpanded
            movie={item}
            trailer={previewUrl}
            onClose={() => {
              setShowHoverCard(false);
              if (onHoverCollapse) {
                onHoverCollapse(false);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Movie;
