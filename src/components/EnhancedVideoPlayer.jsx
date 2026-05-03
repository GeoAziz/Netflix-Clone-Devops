import { useState, useRef, useEffect } from 'react';
import { FaTimes, FaPlay, FaPause, FaVolumeMute, FaVolumeUp, FaCog, FaClosedCaptioning, FaExpand } from 'react-icons/fa';
import ReactPlayer from 'react-player';

/**
 * Enhanced Video Player Component
 * 
 * CineForge Spec Features:
 * - Skip intro button (appears at defined chapters)
 * - Next episode countdown (20s before end)
 * - Progress bar with preview thumbnail on hover
 * - Custom control visibility (hide after 3s inactivity, show on mouse move)
 * - Keyboard shortcuts (space, arrows, M, C, F, Esc)
 * - Playback speed control
 * - Subtitle support
 * - Full screen support
 */

const EnhancedVideoPlayer = ({ isOpen, onClose, title = 'Video Player', onNext }) => {
  // Player state
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('1080p');
  const [showSettings, setShowSettings] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState('English');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Enhanced features
  const [showControls, setShowControls] = useState(true);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(null);

  // Refs
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Control visibility management
  const handleMouseMove = () => {
    setShowControls(true);

    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  // Skip intro button logic (appears at 5s into video)
  useEffect(() => {
    const currentTime = (progress || 0) * (duration || 0);
    const skipIntroStart = 5;
    const skipIntroEnd = 90;

    if (currentTime >= skipIntroStart && currentTime < skipIntroEnd) {
      setShowSkipIntro(true);
    } else {
      setShowSkipIntro(false);
    }
  }, [progress, duration]);

  // Next episode countdown (20s before end)
  useEffect(() => {
    const currentTime = (progress || 0) * (duration || 0);
    const timeUntilEnd = (duration || 0) - currentTime;

    if (timeUntilEnd < 20 && timeUntilEnd > 0) {
      setShowNextEpisode(true);
    } else {
      setShowNextEpisode(false);
    }
  }, [progress, duration]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setIsPlaying((p) => !p);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek((progress || 0) * (duration || 0) - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek((progress || 0) * (duration || 0) + 10);
          break;
        case 'KeyM':
          setIsMuted((m) => !m);
          break;
        case 'KeyC':
          setSubtitlesEnabled((s) => !s);
          break;
        case 'KeyF':
          e.preventDefault();
          setIsFullscreen((f) => !f);
          break;
        case 'Escape':
          onClose();
          break;
        default:
          break;
      }

      // Volume controls
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        setVolume((v) => Math.min(1, v + 0.05));
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        setVolume((v) => Math.max(0, v - 0.05));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, progress, duration, onClose]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Helper functions
  const seek = (seconds) => {
    const percent = seconds / (duration || 1);
    playerRef.current?.seekTo(percent);
  };

  const formatTime = (seconds) => {
    if (!seconds || !Number.isFinite(seconds)) return '0:00';
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = ('0' + date.getUTCSeconds()).slice(-2);
    return hh ? `${hh}:${('0' + mm).slice(-2)}:${ss}` : `${mm}:${ss}`;
  };

  const handleProgressBarHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    setPreviewProgress(percent);
  };

  const handleProgressBarClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    playerRef.current?.seekTo(percent);
    setPreviewProgress(null);
  };

  const currentTime = (progress || 0) * (duration || 0);
  const nextEpisodeCountdown = Math.ceil((duration || 0) - currentTime);

  if (!isOpen) return null;

  const videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4';

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
          if (isPlaying) setShowControls(false);
        }, 1000);
      }}
    >
      {/* Player Container */}
      <div
        ref={playerContainerRef}
        className={`relative w-full ${isFullscreen ? 'h-screen' : 'max-w-5xl aspect-video'}`}
      >
        {/* Video Player */}
        <div className="relative w-full h-full bg-black group">
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            playing={isPlaying}
            muted={isMuted}
            volume={volume}
            playbackRate={playbackRate}
            width="100%"
            height="100%"
            onProgress={(state) => setProgress(state.played)}
            onDuration={setDuration}
            controls={false}
            progressInterval={100}
            playsinline
          />

          {/* Controls Overlay */}
          <div
            className={`absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/90 via-transparent to-black/40 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Top Controls */}
            <div className="flex items-center justify-between p-4">
              <h2 className="text-white text-lg font-bold">{title}</h2>
              <button
                ref={closeBtnRef}
                onClick={onClose}
                className="bg-black/50 hover:bg-black/80 p-3 rounded transition-colors"
              >
                <FaTimes className="text-white text-xl" />
              </button>
            </div>

            {/* Center Play Button */}
            <div className="flex items-center justify-center">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-red-600/80 hover:bg-red-600 p-6 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <FaPause className="text-white text-4xl" />
                ) : (
                  <FaPlay className="text-white text-4xl ml-1" />
                )}
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="space-y-3 p-4">
              {/* Progress Bar */}
              <div
                className="relative h-1 hover:h-2 bg-gray-600/50 rounded cursor-pointer transition-all group/progress"
                onMouseMove={handleProgressBarHover}
                onMouseLeave={() => setPreviewProgress(null)}
                onClick={handleProgressBarClick}
              >
                <div
                  className="h-full bg-red-600 rounded transition-all"
                  style={{ width: `${(progress || 0) * 100}%` }}
                />

                {/* Preview on hover */}
                {previewProgress && (
                  <div
                    className="absolute bottom-full mb-2 w-20 h-12 bg-black border-2 border-red-600 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{
                      left: `${(previewProgress || 0) * 100}%`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {formatTime((previewProgress || 0) * (duration || 0))}
                  </div>
                )}
              </div>

              {/* Controls Bar */}
              <div className="flex items-center justify-between gap-3">
                {/* Left Controls */}
                <div className="flex items-center gap-3">
                  {/* Play/Pause */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="text-white hover:text-red-600 transition-colors"
                    title="Play/Pause (Space)"
                  >
                    {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} />}
                  </button>

                  {/* Volume Control */}
                  <div className="group/volume flex items-center">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-white hover:text-red-600 transition-colors"
                      title="Mute (M)"
                    >
                      {isMuted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        setIsMuted(false);
                      }}
                      className="w-0 group-hover/volume:w-20 transition-all opacity-0 group-hover/volume:opacity-100 ml-2"
                    />
                  </div>

                  {/* Time Display */}
                  <span className="text-white text-sm font-semibold ml-2">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2">
                  {/* Subtitles */}
                  <button
                    onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                    className={`transition-colors ${
                      subtitlesEnabled ? 'text-red-600' : 'text-white hover:text-red-600'
                    }`}
                    title="Subtitles (C)"
                  >
                    <FaClosedCaptioning size={18} />
                  </button>

                  {/* Settings */}
                  <div className="relative group">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="text-white hover:text-red-600 transition-colors"
                      title="Settings"
                    >
                      <FaCog size={18} />
                    </button>

                    {showSettings && (
                      <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-3 min-w-max space-y-2">
                        <div>
                          <p className="text-white text-xs font-semibold mb-1">Speed</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                              <button
                                key={speed}
                                onClick={() => {
                                  setPlaybackRate(speed);
                                  setShowSettings(false);
                                }}
                                className={`block w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                                  playbackRate === speed
                                    ? 'bg-red-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-700'
                                }`}
                              >
                                {speed}x
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-gray-700 pt-2">
                          <p className="text-white text-xs font-semibold mb-1">Quality</p>
                          <div className="space-y-1">
                            {['480p', '720p', '1080p', '4K'].map((q) => (
                              <button
                                key={q}
                                onClick={() => {
                                  setQuality(q);
                                  setShowSettings(false);
                                }}
                                className={`block w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                                  quality === q
                                    ? 'bg-red-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-700'
                                }`}
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fullscreen */}
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="text-white hover:text-red-600 transition-colors"
                    title="Fullscreen (F)"
                  >
                    <FaExpand size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Skip Intro Button */}
          {showSkipIntro && (
            <button
              onClick={() => seek((progress || 0) * (duration || 0) + 85)}
              className="absolute bottom-32 right-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded transition-all duration-300 backdrop-blur-sm"
              style={{
                animation: 'fadeIn 300ms ease-in-out',
              }}
            >
              Skip Intro
            </button>
          )}

          {/* Next Episode Countdown */}
          {showNextEpisode && (
            <div
              className="absolute bottom-32 right-4 bg-black/80 text-white px-6 py-4 rounded-lg text-center space-y-2"
              style={{
                animation: 'fadeIn 300ms ease-in-out',
              }}
            >
              <div className="text-sm font-semibold">Next Episode</div>
              <div className="text-3xl font-bold text-red-600">{nextEpisodeCountdown}s</div>
              {onNext && (
                <button
                  onClick={onNext}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold transition-colors w-full mt-2"
                >
                  Play Now
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CSS */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedVideoPlayer;
