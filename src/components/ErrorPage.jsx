import { Link } from 'react-router-dom';

const ErrorPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl text-white font-bold mb-4">
        Oops! Something went wrong.
      </h1>
      <p className="text-lg mb-8 text-white">You are on a wrong page</p>
      <Link
        to="/"
        className="bg-red-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-red-700"
      >
        Go back to home
      </Link>
    </div>
  );
};

export default ErrorPage;
