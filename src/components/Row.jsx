import axios from 'axios';
import { useEffect, useState, useRef } from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Movie from './Movie';

/**
 * Enhanced Row Component with Hover Card Support
 * 
 * Features:
 * - Grid-based card layout with proper spacing
 * - Hover card expansion with neighbor management
 * - Smooth scroll arrows with proper animation
 * - Responsive card sizing
 * - Z-index management for expanded cards
 */

const Row = ({ title, fetchURL, rowID }) => {
  const [movies, setMovies] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [shiftedIndices, setShiftedIndices] = useState(new Set());
  const rowContainerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(fetchURL).then((response) => {
      setMovies(response.data.results);
    });
  }, [fetchURL]);

  // Smooth scroll with snap
  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const cardWidth = 200; // Standard card width
    const gap = 6;
    const scrollAmount = (cardWidth + gap) * 3; // Scroll 3 cards at a time
    
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Handle hover expansion
  const handleCardExpand = (isExpanding, index) => {
    if (isExpanding) {
      setExpandedIndex(index);
      
      // Calculate which neighbors to shift
      const neighbors = new Set();
      if (index > 0) neighbors.add(index - 1);
      if (index < movies.length - 1) neighbors.add(index + 1);
      setShiftedIndices(neighbors);
    } else {
      setExpandedIndex(null);
      setShiftedIndices(new Set());
    }
  };

  const handleCardClick = (movie) => {
    navigate(`/?jbv=${movie.id}`);
  };

  return (
    <div className="py-6 px-4 md:px-8">
      {/* Row Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg md:text-xl">{title}</h2>
        <button className="text-red-600 hover:text-red-500 text-sm font-semibold transition-colors">
          Explore All →
        </button>
      </div>

      {/* Row Container with Scroll Arrows */}
      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-20 hidden group-hover:flex items-center justify-center bg-gradient-to-r from-black/50 to-transparent pl-4 pr-8 hover:from-black/70 transition-all duration-300 rounded-l-sm"
        >
          <MdChevronLeft size={40} className="text-white opacity-70 hover:opacity-100" />
        </button>

        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          id={`slider-${rowID}`}
          className="w-full overflow-x-hidden scrollbar-hide"
        >
          <div
            ref={rowContainerRef}
            className="flex gap-1.5 pb-2"
            style={{
              perspective: '1000px',
            }}
          >
            {movies.map((item, idx) => (
              <div
                key={item.id}
                className={`flex-shrink-0 transition-all duration-300 ${
                  shiftedIndices.has(idx)
                    ? expandedIndex > idx
                      ? 'translate-x-[-60px]'
                      : 'translate-x-[60px]'
                    : ''
                }`}
                style={{
                  width: '200px',
                  position: expandedIndex === idx ? 'relative' : 'static',
                }}
              >
                {expandedIndex === idx ? (
                  // Expanded Hover Card (using Movie component for now)
                  <div className="absolute -left-24 top-0 z-40 w-96">
                    <Movie
                      item={item}
                      isExpanded={true}
                      onClose={() => handleCardExpand(false, idx)}
                      onCardClick={() => handleCardClick(item)}
                    />
                  </div>
                ) : (
                  // Standard Card
                  <Movie
                    key={item.id}
                    item={item}
                    isExpanded={false}
                    onHoverExpand={() => handleCardExpand(true, idx)}
                    onHoverCollapse={() => handleCardExpand(false, idx)}
                    onCardClick={() => handleCardClick(item)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-20 hidden group-hover:flex items-center justify-center bg-gradient-to-l from-black/50 to-transparent pr-4 pl-8 hover:from-black/70 transition-all duration-300 rounded-r-sm"
        >
          <MdChevronRight size={40} className="text-white opacity-70 hover:opacity-100" />
        </button>
      </div>
    </div>
  );
};

export default Row;
