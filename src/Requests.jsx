const key = import.meta.env.VITE_TMDB_API_KEY;
const requests = {
  requestPopular: `https://api.themoviedb.org/3/movie/popular?api_key=${key}&language=en-US&page=1`,
  requestTopRated: `https://api.themoviedb.org/3/movie/top_rated?api_key=${key}&language=en-US&page=1`,
  requestTrending: `https://api.themoviedb.org/3/movie/popular?api_key=${key}&language=en-US&page=2`,
  requestHorror: `https://api.themoviedb.org/3/discover/movie?api_key=${key}&with_genres=27`,
  requestUpcoming: `https://api.themoviedb.org/3/movie/upcoming?api_key=${key}&language=en-US&page=1`,
  requestAction: `https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=en-US&with_genres=28&page=1`,
  requestAdventure: `https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=en-US&with_genres=12&page=1`,
  requestRomance: `https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=en-US&with_genres=10749&page=1`,
  requestComedy: `https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=en-US&with_genres=35&page=1`,
  requestDrama: `https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=en-US&with_genres=18&page=1`,
  requestScienceFiction: `https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=en-US&with_genres=878&page=1`,
  requestFantasy: `https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=en-US&with_genres=14&page=1`,
  requestMystery: `https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=en-US&with_genres=9648&page=1`,
  requestThriller: `https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=en-US&with_genres=53&page=1`,
  requestCrime: `https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=en-US&with_genres=80&page=1`,
  requestAnimation: `https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=en-US&with_genres=16&page=1`,
  requestFamily: `https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=en-US&with_genres=10751&page=1`,
  requestDocumentary: `https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=en-US&with_genres=99&page=1`,
};

export const buildSearchRequest = (query) =>
  `https://api.themoviedb.org/3/search/movie?api_key=${key}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`;

export default requests;
