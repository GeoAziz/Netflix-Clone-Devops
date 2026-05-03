import Row from '../components/Row';
import requests from '../Requests';

const NewPopular = () => {
  return (
    <div className="w-full text-white">
      {/* Hero Section */}
      <div className="w-full h-[300px] bg-gradient-to-b from-black via-black/50 to-black/25">
        <div className="px-4 md:px-8 max-w-6xl mx-auto pt-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">New & Popular</h1>
          <p className="text-gray-400 text-lg">
            Check out what's trending and newly released
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 py-8 space-y-12">
        <Row
          rowID="1"
          title="New Releases"
          fetchURL={requests.requestUpcoming}
        />
        <Row rowID="2" title="Trending Now" fetchURL={requests.requestTrending} />
        <Row rowID="3" title="Popular" fetchURL={requests.requestPopular} />
        <Row rowID="4" title="Top Rated" fetchURL={requests.requestTopRated} />
        <Row
          rowID="5"
          title="Action & Adventure"
          fetchURL={requests.requestAction}
        />
        <Row rowID="6" title="Sci-Fi" fetchURL={requests.requestScienceFiction} />
      </div>
    </div>
  );
};

export default NewPopular;
