import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../utils/AuthContext';
import { db } from '../firebase';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import './HoverCardExpanded.css';

const HoverCardExpanded = ({ 
  movie, 
  onClose, 
  trailer 
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [rating, setRating] = useState(null);
  const navigate = useNavigate();
  const { user } = UserAuth();

  const handlePlay = () => {
    navigate(`/?jbv=${movie?.id}`);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user?.email) {
      alert('Please login to save');
      return;
    }

    try {
      const movieID = doc(db, 'users', user.email);
      await updateDoc(movieID, {
        savedShows: arrayUnion({
          id: movie.id,
          title: movie.title || movie.name,
          img: movie.backdrop_path,
        }),
      });
      setIsSaved(true);
    } catch (error) {
      console.error('Error saving movie:', error);
    }
  };

  const handleRate = (ratingType) => {
    setRating(ratingType);
    // Store rating in Firestore
  };

  return (
    <div className="hover-card-expanded">
      {/* Video/Trailer */}
      <div className="hover-card-video">
        {trailer ? (
          <iframe
            width="100%"
            height="100%"
            src={`${trailer}?autoplay=1&mute=${isMuted ? 1 : 0}`}
            title="Trailer"
            allow="autoplay"
            frameBorder="0"
          />
        ) : (
          <img 
            src={`https://image.tmdb.org/t/p/w342${movie?.poster_path}`}
            alt={movie?.title || movie?.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        
        {/* Top Right Controls */}
        <div className="hover-card-controls-top">
          <button 
            className="control-btn mute-btn"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button 
            className="control-btn expand-btn"
            onClick={() => navigate(`/?jbv=${movie?.id}`)}
            title="View Full Details"
          >
            ⛶
          </button>
        </div>
      </div>

      {/* Bottom Info Panel */}
      <div className="hover-card-info">
        {/* Action Buttons Row */}
        <div className="hover-card-actions">
          <button 
            className="action-btn play-btn"
            onClick={handlePlay}
            title="Play"
          >
            ▶
          </button>
          <button 
            className="action-btn add-list-btn"
            onClick={handleSave}
            title={isSaved ? 'Saved' : 'Add to List'}
          >
            {isSaved ? '✓' : '+'}
          </button>
          <button 
            className={`action-btn like-btn ${rating === 'like' ? 'active' : ''}`}
            onClick={() => handleRate('like')}
            title="I like this"
          >
            👍
          </button>
          <button 
            className={`action-btn dislike-btn ${rating === 'dislike' ? 'active' : ''}`}
            onClick={() => handleRate('dislike')}
            title="Not for me"
          >
            👎
          </button>
          <button 
            className="action-btn more-btn"
            onClick={() => navigate(`/?jbv=${movie?.id}`)}
            title="More info"
          >
            ⋮
          </button>
        </div>

        {/* Title */}
        <h3 className="hover-card-title">
          {movie?.title || movie?.name}
        </h3>

        {/* Metadata Row */}
        <div className="hover-card-metadata">
          <span className="match-percent">{Math.round((movie?.vote_average || 0) * 10)}% Match</span>
          <span className="year">{new Date(movie?.release_date || movie?.first_air_date).getFullYear()}</span>
          <span className="rating">HD</span>
        </div>

        {/* Genres */}
        <div className="hover-card-genres">
          Action • Drama • Thriller
        </div>
      </div>
    </div>
  );
};

export default HoverCardExpanded;
