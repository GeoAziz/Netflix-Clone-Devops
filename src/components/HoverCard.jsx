import { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPlus, FaThumbsUp, FaThumbsDown, FaChevronDown, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import ReactPlayer from 'react-player/youtube';
import { Link } from 'react-router-dom';
import { UserAuth } from '../utils/AuthContext';

/**
 * HoverCard Component — Netflix-style hover expansion
 * 
 * Features:
 * - Edge-aware expansion (detects viewport boundaries)
 * - Neighbor card shifting/pushing
 * - Trailer video preview with mute toggle
 * - Action buttons overlay (play, add to list, rate)
 * - Smooth transitions with proper easing
 * - Z-index management
 */

const HoverCard = ({
  item,
  index,
  containerRef,
  onCardClick,
  onExpandChange,
  isExpanded,
  isFavorited,
  onToggleFavorite,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [expandOrigin, setExpandOrigin] = useState('center');
  const cardRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const { user } = UserAuth();

  // Detect card position and determine expansion direction
  const detectEdgeAndSetOrigin = () => {
    if (!cardRef.current || !containerRef?.current) return;

    const card = cardRef.current.getBoundingClientRect();
    const container = containerRef.current.getBoundingClientRect();

    // Space to the right of card
    const spaceRight = window.innerWidth - card.right;
    const expandedWidth = 320;
    const minSpaceForExpand = expandedWidth + 20;

    // Detect which edge to expand from
    if (card.left < 60) {
      setExpandOrigin('left');
    } else if (spaceRight < minSpaceForExpand) {
      setExpandOrigin('right');
    } else {
      setExpandOrigin('center');
    }
  };

  // Fetch trailer on hover
  const fetchTrailer = async () => {
    if (showPreview || previewUrl) return;

    try {
      setTrailerLoading(true);
      const key = import.meta.env.VITE_TMDB_API_KEY;
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${item?.id}/videos?api_key=${key}&language=en-US`
      );
      const json = await res.json();

      const yt = json.results?.find(
        (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
      );

      if (yt) {
        setPreviewUrl(`https://www.youtube.com/watch?v=${yt.key}`);
      }
    } catch (error) {
      console.error('Failed to fetch trailer:', error);
    } finally {
      setTrailerLoading(false);
    }
  };

  // Handle mouse enter with delay
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    hoverTimeoutRef.current = setTimeout(() => {
      if (!isExpanded) {
        detectEdgeAndSetOrigin();
        fetchTrailer();
        setShowPreview(true);
        onExpandChange?.(true, index);
      }
    }, 400); // Netflix uses 400ms delay before expansion
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    // 200ms delay before collapsing (faster than expand)
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPreview(false);
      onExpandChange?.(false, index);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  if (!isExpanded || !showPreview) {
    // Standard card when not expanded
    return (
      <Link
        to={`/movie/${item?.id}`}
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block w-full h-full cursor-pointer relative overflow-hidden rounded-sm bg-gray-800 aspect-video transition-all duration-300"
      >
        {/* Card Image */}
        <img
          src={
            item?.poster_path
              ? `https://image.tmdb.org/t/p/w400${item.poster_path}`
              : `https://image.tmdb.org/t/p/w400${item.backdrop_path}`
          }
          alt={item?.title}
          className="w-full h-full object-cover"
        />

        {/* Simple Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all duration-200 opacity-0 hover:opacity-100" />
      </Link>
    );
  }

  // Expanded hover card
  return (
    <div
      ref={cardRef}
      onMouseLeave={handleMouseLeave}
      className={`absolute z-40 bg-gray-900 rounded-sm overflow-hidden shadow-2xl transition-all duration-300 ${
        expandOrigin === 'left' ? 'origin-left' : expandOrigin === 'right' ? 'origin-right' : 'origin-center'
      }`}
      style={{
        width: '320px',
        animation: 'cardExpand 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
      }}
    >
      {/* Video/Trailer Preview */}
      <div className="relative w-full aspect-video bg-black overflow-hidden">
        {previewUrl && !trailerLoading ? (
          <div className="w-full h-full">
            <ReactPlayer
              url={previewUrl}
              playing={true}
              muted={isMuted}
              loop={true}
              width="100%"
              height="100%"
              playsinline
            />
            {/* Mute Toggle */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="absolute top-2 right-2 bg-gray-900/70 hover:bg-gray-900 p-2 rounded transition-colors z-10"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <FaVolumeMute className="text-white text-sm" />
              ) : (
                <FaVolumeUp className="text-white text-sm" />
              )}
            </button>

            {/* Expand to Full Modal Icon */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCardClick?.(item);
              }}
              className="absolute top-2 right-12 bg-gray-900/70 hover:bg-gray-900 p-2 rounded transition-colors z-10"
              title="More Info"
            >
              <FaChevronDown className="text-white text-sm" />
            </button>
          </div>
        ) : (
          // Fallback image while loading
          <img
            src={
              item?.poster_path
                ? `https://image.tmdb.org/t/p/w400${item.poster_path}`
                : `https://image.tmdb.org/t/p/w400${item.backdrop_path}`
            }
            alt={item?.title}
            className="w-full h-full object-cover"
          />
        )}

        {/* Loading Spinner */}
        {trailerLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="animate-spin">
              <div className="w-8 h-8 border-4 border-red-600 border-t-white rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="bg-gray-800 px-3 py-2 flex items-center gap-2">
        {/* Play Button */}
        <Link
          to={`/watch/${item?.id}`}
          className="flex-1 bg-white text-black rounded-sm py-2 px-3 flex items-center justify-center gap-2 font-bold hover:bg-white/80 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <FaPlay size={12} /> Play
        </Link>

        {/* Add to List Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite?.(item?.id);
          }}
          className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2 transition-colors flex items-center justify-center"
          title="Add to List"
        >
          <FaPlus size={14} />
        </button>

        {/* Like Button */}
        <button
          className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2 transition-colors flex items-center justify-center"
          title="I Like This"
        >
          <FaThumbsUp size={14} />
        </button>

        {/* Dislike Button */}
        <button
          className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2 transition-colors flex items-center justify-center"
          title="Not For Me"
        >
          <FaThumbsDown size={14} />
        </button>
      </div>

      {/* Info Panel */}
      <div className="bg-gray-900 px-3 py-3 space-y-2">
        {/* Match % and Metadata */}
        <div className="flex items-center gap-3 text-xs text-white/70">
          {item?.vote_average && (
            <>
              <span className="font-bold text-green-500">
                {Math.round(item.vote_average * 10)}%
              </span>
            </>
          )}
          {item?.release_date && (
            <span>{item.release_date.split('-')[0]}</span>
          )}
          <span>HD</span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm line-clamp-2">{item?.title}</h3>

        {/* Genre Tags */}
        {item?.genres && item.genres.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {item.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="text-xs bg-gray-700 text-white/80 px-2 py-1 rounded-full"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes cardExpand {
          from {
            transform: scale(1);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default HoverCard;
