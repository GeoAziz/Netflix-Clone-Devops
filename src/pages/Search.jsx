import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Row from '../components/Row';
import requests, { buildSearchRequest } from '../Requests';

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const normalizedQuery = searchTerm.trim();

    if (!normalizedQuery) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await axios.get(buildSearchRequest(normalizedQuery));
        setResults((response.data?.results || []).filter((item) => item.backdrop_path));
      } catch (error) {
        console.log(error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div className="w-full text-white">
      {/* Search Header */}
      <div className="w-full h-[300px] bg-gradient-to-b from-black via-black/50 to-black/25 pt-20">
        <div className="px-4 md:px-8 max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Search</h1>

          <input
            type="text"
            placeholder="Search movies and shows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>
      </div>

      {/* Content Rows */}
      <div className="px-4 md:px-8 py-8">
        {!searchTerm ? (
          <>
            <p className="text-gray-400 text-center py-12">
              Enter a search term to find movies and shows
            </p>
            <div className="space-y-8">
              <Row
                rowID="search-1"
                title="Popular Searches"
                fetchURL={requests.requestPopular}
              />
              <Row
                rowID="search-2"
                title="Trending Now"
                fetchURL={requests.requestTrending}
              />
            </div>
          </>
        ) : (
          <div>
            <h2 className="text-white font-bold md:text-xl pb-4">
              Results for &quot;{searchTerm}&quot;
            </h2>
            {loading && <p className="text-gray-400">Searching...</p>}
            {!loading && results.length === 0 && (
              <p className="text-gray-400">No results found.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {results.map((item) => (
                <Link
                  key={item.id}
                  to={`/movie/${item.id}`}
                  className="block bg-zinc-900 rounded overflow-hidden hover:bg-zinc-800 transition-colors"
                >
                  <img
                    className="w-full h-[140px] object-cover"
                    src={`https://image.tmdb.org/t/p/w500/${item.backdrop_path}`}
                    alt={item.title}
                  />
                  <div className="p-3">
                    <p className="font-semibold line-clamp-1">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.overview}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
