import { useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import { FaTimes, FaPlay, FaPause, FaVolumeMute, FaVolumeUp, FaCog, FaClosedCaptioning } from 'react-icons/fa';
import { useEffect } from 'react';

const VideoPlayer = ({ isOpen, onClose, title = 'Video Player' }) => {
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
  const playerRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Keyboard controls (Space: play/pause, ArrowLeft/Right: seek, M: mute, C: captions, Esc: close, +/-: volume, > <: speed)
  useEffect(() => {
    const handleKey = (e) => {
      if (!isOpen) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const current = (progress || 0) * (duration || 0);
        const seekTo = Math.max(0, current - 10);
        playerRef.current?.seekTo(seekTo, 'seconds');
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        const current = (progress || 0) * (duration || 0);
        const seekTo = Math.min(duration || 0, current + 10);
        playerRef.current?.seekTo(seekTo, 'seconds');
      }
      if (e.key === 'm' || e.key === 'M') {
        setIsMuted((m) => !m);
      }
      if (e.key === 'c' || e.key === 'C') {
        setSubtitlesEnabled((s) => !s);
      }
      if (e.key === '>' || e.key === '.') {
        setPlaybackRate((r) => Math.min(2, r + 0.25));
      }
      if (e.key === '<' || e.key === ',') {
        setPlaybackRate((r) => Math.max(0.5, r - 0.25));
      }
      if (e.code === 'Equal' || e.code === 'NumpadAdd') {
        e.preventDefault();
        setVolume((v) => Math.min(1, v + 0.1));
      }
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        setVolume((v) => Math.max(0, v - 0.1));
      }
      if (e.code === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, progress, duration, onClose]);

  useEffect(() => {
    // focus close button for accessibility when player opens
    if (isOpen) {
      setTimeout(() => closeBtnRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Mock video URL (placeholder - in real app would fetch from streaming service)
  const videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4';

  const handleProgress = (state) => {
    setProgress(state.played);
  };

  const handleDuration = (duration) => {
    setDuration(duration);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    playerRef.current?.seekTo(percent);
  };

  const formatTime = (seconds) => {
    if (!seconds || !Number.isFinite(seconds)) return '0:00';
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = ('0' + date.getUTCSeconds()).slice(-2);
    if (hh) {
      return `${hh}:${('0' + mm).slice(-2)}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} player`}
    >
      <KeyboardHandler />
      {/* Close Button */}
      <button
        ref={closeBtnRef}
        onClick={onClose}
        aria-label="Close video player"
        className="absolute top-6 right-6 bg-red-600 hover:bg-red-700 p-3 rounded-full transition-colors z-10"
      >
        <FaTimes className="text-white text-xl" />
      </button>

      {/* Video Container */}
      <div className="w-full max-w-5xl">
        {/* Title */}
        <div className="mb-4 pl-4">
          <h2 className="text-white text-2xl font-bold">{title}</h2>
        </div>

        {/* Player */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video group">
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            playing={isPlaying}
            muted={isMuted}
            width="100%"
            height="100%"
            onProgress={handleProgress}
            onDuration={handleDuration}
            controls={false}
            progressInterval={1000}
          />

          {/* Custom Controls */}
          <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* Play/Pause Overlay */}
            <div className="flex items-center justify-center h-full">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-red-600 hover:bg-red-700 p-6 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <FaPause className="text-white text-3xl" />
                ) : (
                  <FaPlay className="text-white text-3xl ml-1" />
                )}
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="space-y-3 p-4">
              {/* Progress Bar */}
              <div
                onClick={handleSeek}
                className="w-full bg-gray-600 h-1 rounded cursor-pointer group/progress hover:h-2 transition-all"
              >
                <div
                  className="bg-red-600 h-full rounded transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>

              {/* Control Bar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {/* Play/Pause Button */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="text-white hover:text-red-600 transition-colors"
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  >
                    {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
                  </button>

                  {/* Volume Control */}
                  <div className="flex items-center gap-2 group/volume">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-white hover:text-red-600 transition-colors"
                      title="Mute (M)"
                    >
                      {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        if (parseFloat(e.target.value) > 0) setIsMuted(false);
                      }}
                      className="w-0 group-hover/volume:w-20 transition-all opacity-0 group-hover/volume:opacity-100"
                    />
                  </div>

                  {/* Time Display */}
                  <span className="text-white text-sm font-semibold whitespace-nowrap">
                    {formatTime(progress * duration)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2">
                  {/* Subtitles Button */}
                  <button
                    onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                    className={`${
                      subtitlesEnabled ? 'text-red-600' : 'text-white hover:text-red-600'
                    } transition-colors`}
                    title="Subtitles (C)"
                  >
                    <FaClosedCaptioning size={18} />
                  </button>

                  {/* Settings Menu */}
                  <div className="relative group">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="text-white hover:text-red-600 transition-colors"
                      title="Settings"
                    >
                      <FaCog size={18} />
                    </button>
                    
                    {showSettings && (
                      <div className="absolute bottom-full right-0 bg-[#1a1a1a] rounded shadow-lg mb-2 p-2 w-48 z-50">
                        {/* Quality Selection */}
                        <div className="mb-4 pb-4 border-b border-gray-700">
                          <p className="text-white text-xs font-semibold mb-2">Quality</p>
                          <div className="space-y-1">
                            {['480p', '720p', '1080p', '4K'].map((q) => (
                              <button
                                key={q}
                                onClick={() => {
                                  setQuality(q);
                                  setShowSettings(false);
                                }}
                                className={`block w-full text-left px-2 py-1 rounded text-sm ${
                                  quality === q
                                    ? 'bg-red-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800'
                                }`}
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Playback Speed */}
                        <div className="mb-4 pb-4 border-b border-gray-700">
                          <p className="text-white text-xs font-semibold mb-2">Speed</p>
                          <div className="space-y-1">
                            {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                              <button
                                key={speed}
                                onClick={() => {
                                  setPlaybackRate(speed);
                                  setShowSettings(false);
                                }}
                                className={`block w-full text-left px-2 py-1 rounded text-sm ${
                                  playbackRate === speed
                                    ? 'bg-red-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800'
                                }`}
                              >
                                {speed}x
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Audio Track */}
                        <div className="mb-4 pb-4 border-b border-gray-700">
                          <p className="text-white text-xs font-semibold mb-2">Audio</p>
                          <div className="space-y-1">
                            {['English', 'Spanish', 'French', 'German'].map((audio) => (
                              <button
                                key={audio}
                                onClick={() => {
                                  setSelectedAudio(audio);
                                  setShowSettings(false);
                                }}
                                className={`block w-full text-left px-2 py-1 rounded text-sm ${
                                  selectedAudio === audio
                                    ? 'bg-red-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800'
                                }`}
                              >
                                {audio}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Subtitles Toggle */}
                        <div>
                          <button
                            onClick={() => {
                              setSubtitlesEnabled(!subtitlesEnabled);
                              setShowSettings(false);
                            }}
                            className="block w-full text-left px-2 py-1 rounded text-sm text-gray-300 hover:bg-gray-800"
                          >
                            <FaClosedCaptioning size={14} className="inline mr-2" />
                            {subtitlesEnabled ? 'Subtitles On' : 'Subtitles Off'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Current Quality Badge */}
                  <span className="text-white text-sm font-semibold hidden md:block">
                    {quality}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Show controls on mobile */}
          <div className="md:hidden absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="bg-red-600 hover:bg-red-700 p-2 rounded transition-colors"
              >
                <FaTimes className="text-white" />
              </button>
            </div>

            <div className="space-y-3">
              <div
                onClick={handleSeek}
                className="w-full bg-gray-600 h-1 rounded cursor-pointer"
              >
                <div
                  className="bg-red-600 h-full rounded"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-white"
                >
                  {isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
                </button>
                <span className="text-white text-xs font-semibold">
                  {formatTime(progress * duration)} / {formatTime(duration)}
                </span>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white"
                >
                  {isMuted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 text-gray-300 text-xs">
          <p className="text-sm mb-2">
            Now playing: <span className="text-white font-semibold">{title}</span>
          </p>
          <p className="mb-2">Keyboard Shortcuts:</p>
          <p>Space - Play/Pause | ← → - Seek ±10s | M - Mute | C - Subtitles | +/- - Volume</p>
          <p>{'>'}  {'<'} or . , - Speed | Esc - Close</p>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
