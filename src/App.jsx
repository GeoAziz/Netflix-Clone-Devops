import { lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContextProvider, UserAuth } from './utils/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorPage from './components/ErrorPage';

// Lazy load all page components for code-splitting
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Account = lazy(() => import('./pages/Account'));
const Landing = lazy(() => import('./pages/Landing'));
const Search = lazy(() => import('./pages/Search'));
const MyList = lazy(() => import('./pages/MyList'));
const NewPopular = lazy(() => import('./pages/NewPopular'));
const MovieDetail = lazy(() => import('./pages/MovieDetail'));
const ProfileSelection = lazy(() => import('./pages/ProfileSelection'));
const ManageProfiles = lazy(() => import('./pages/ManageProfiles'));
const BrowseCategories = lazy(() => import('./pages/BrowseCategories'));

const PageLoading = () => (
  <div className="w-full h-screen bg-black flex items-center justify-center text-white">
    <div className="text-center">
      <div className="text-red-600 text-4xl font-bold mb-4">NETFLIX</div>
      <p>Loading...</p>
    </div>
  </div>
);

function AppContent() {
  const { user, loading } = UserAuth();
  const selectedProfile = localStorage.getItem('selectedProfile');

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-red-600 text-4xl font-bold mb-4">NETFLIX</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoading />}>
      {user && selectedProfile && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Profile Selection - Protected */}
        <Route
          path="/profiles"
          element={
            <ProtectedRoute>
              <ProfileSelection />
            </ProtectedRoute>
          }
        />

        {/* Manage Profiles - Protected */}
        <Route
          path="/manage-profiles"
          element={
            <ProtectedRoute>
              <ManageProfiles />
            </ProtectedRoute>
          }
        />

        {/* Browse Categories - Protected */}
        <Route
          path="/browse-categories"
          element={
            <ProtectedRoute>
              <BrowseCategories />
            </ProtectedRoute>
          }
        />

        {/* Landing or Home - depends on auth and profile selection */}
        <Route
          path="/"
          element={
            user ? (
              selectedProfile ? (
                <Home />
              ) : (
                <Navigate to="/profiles" replace />
              )
            ) : (
              <Landing />
            )
          }
        />

        {/* Protected Routes */}
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mylist"
          element={
            <ProtectedRoute>
              <MyList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/new-popular"
          element={
            <ProtectedRoute>
              <NewPopular />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movie/:id"
          element={
            <ProtectedRoute>
              <MovieDetail />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route for handling errors */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AuthContextProvider>
      <AppContent />
    </AuthContextProvider>
  );
}

export default App;
