import requests from '../Requests';
import Main from '../components/Main';
import Row from '../components/Row';

const Home = () => {
  return (
    <div>
      <Main />
      <Row rowID="1" title="Up Coming" fetchURL={requests.requestUpcoming} />
      <Row rowID="2" title="Popular" fetchURL={requests.requestPopular} />
      <Row rowID="3" title="Trending" fetchURL={requests.requestTrending} />
      <Row rowID="4" title="Top Rated" fetchURL={requests.requestTopRated} />
      <Row rowID="5" title="Horror" fetchURL={requests.requestHorror} />
      <Row rowID="6" title="Action" fetchURL={requests.requestAction} />
      <Row rowID="7" title="Adventure" fetchURL={requests.requestAdventure} />
      <Row rowID="8" title="Romance" fetchURL={requests.requestRomance} />
      <Row rowID="9" title="Comedy" fetchURL={requests.requestComedy} />
      <Row rowID="10" title="Drama" fetchURL={requests.requestDrama} />
      <Row
        rowID="11"
        title="Science Fiction"
        fetchURL={requests.requestScienceFiction}
      />
      <Row rowID="12" title="Fantasy" fetchURL={requests.requestFantasy} />
      <Row rowID="13" title="Mystery" fetchURL={requests.requestMystery} />
      <Row rowID="14" title="Thriller" fetchURL={requests.requestThriller} />
      <Row rowID="15" title="Crime" fetchURL={requests.requestCrime} />
      <Row rowID="16" title="Animation" fetchURL={requests.requestAnimation} />
      <Row rowID="17" title="Family" fetchURL={requests.requestFamily} />
      <Row
        rowID="18"
        title="Documentary"
        fetchURL={requests.requestDocumentary}
      />
    </div>
  );
};

export default Home;
