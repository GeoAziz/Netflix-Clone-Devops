/**
 * Skeleton Loader Component
 * Used for showing placeholder content while data is loading
 * Follows CineForge animation spec with shimmer effect
 */

export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`skeleton-shimmer rounded-sm aspect-video ${className}`} />
  );
};

export const SkeletonRow = ({ count = 6 }) => {
  return (
    <div className="space-y-6">
      {/* Row Title */}
      <div className="skeleton-shimmer h-6 w-32 rounded-sm" />
      
      {/* Cards Grid */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} className="flex-shrink-0 w-[200px]" />
        ))}
      </div>
    </div>
  );
};

export const SkeletonHero = () => {
  return (
    <div className="w-full h-[400px] md:h-[550px] skeleton-shimmer rounded-sm" />
  );
};

export const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton-shimmer h-4 rounded-sm ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
};

export const SkeletonGrid = ({ columns = 5, rows = 4 }) => {
  return (
    <div className={`grid grid-cols-${columns} gap-4`}>
      {Array.from({ length: columns * rows }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export const SkeletonModal = () => {
  return (
    <div className="space-y-4">
      {/* Hero */}
      <SkeletonHero />

      {/* Title and metadata */}
      <div className="px-6 space-y-4">
        <div className="skeleton-shimmer h-8 w-2/3 rounded-sm" />
        <div className="flex gap-3">
          <div className="skeleton-shimmer h-6 w-16 rounded-sm" />
          <div className="skeleton-shimmer h-6 w-12 rounded-sm" />
        </div>

        {/* Description */}
        <SkeletonText lines={3} />

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-800 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-shimmer h-4 w-20 rounded-sm" />
          ))}
        </div>

        {/* Content grid */}
        <SkeletonGrid columns={3} rows={2} />
      </div>
    </div>
  );
};

export default {
  SkeletonCard,
  SkeletonRow,
  SkeletonHero,
  SkeletonText,
  SkeletonGrid,
  SkeletonModal,
};
