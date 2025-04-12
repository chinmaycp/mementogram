import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import FeedPage from "./pages/FeedPage";
import CreatePostPage from "./pages/CreatePostPage";
import PostDetailPage from "./pages/PostDetailPage";
import PublicProfilePage from "./pages/PublicProfilePage";

function App() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (isLoading) {
    return <div>Loading application...</div>;
  }

  return (
    <div>
      {/* Conditional Navigation */}
      <nav className="p-4 bg-gray-100 shadow flex justify-between items-center">
        <div>
          <Link
            to="/"
            className="mr-4 text-blue-600 hover:text-blue-800 font-bold"
          >
            Mementogram
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/feed"
                className="mr-4 text-blue-600 hover:text-blue-800"
              >
                Feed
              </Link>
              <Link
                to="/create-post"
                className="mr-4 text-blue-600 hover:text-blue-800"
              >
                New Post
              </Link>
            </>
          )}
        </div>
        <div>
          {isAuthenticated ? (
            <>
              <span className="mr-4 text-gray-700">
                Welcome, {user?.username}!
              </span>
              <Link
                to="/feed"
                className="mr-4 text-blue-600 hover:text-blue-800"
              >
                Feed
              </Link>
              <Link
                to="/create-post"
                className="mr-4 text-blue-600 hover:text-blue-800"
              >
                New Post
              </Link>
              <Link
                to="/profile"
                className="mr-4 text-blue-600 hover:text-blue-800"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="mr-4 text-blue-600 hover:text-blue-800"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-800"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Define Routes */}
      <main className="p-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/posts/:postId" element={<PostDetailPage />} />
          <Route path="/users/:username" element={<PublicProfilePage />} />
          <Route
            path="/feed"
            element={
              <ProtectedRoute>
                <FeedPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-post"
            element={
              <ProtectedRoute>
                <CreatePostPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />{" "}
          {/* Could map to /users/me endpoint */}
          <Route
            path="*"
            element={
              <div>
                <h2>404 Not Found</h2>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
