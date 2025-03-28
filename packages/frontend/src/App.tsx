import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

// Import your actual page components
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function App() {
  return (
    <BrowserRouter>
      {/* Basic Navigation Example using Tailwind */}
      <nav className="p-4 bg-gray-100 shadow">
        <Link to="/" className="mr-4 text-blue-600 hover:text-blue-800">
          Home
        </Link>
        <Link to="/login" className="mr-4 text-blue-600 hover:text-blue-800">
          Login
        </Link>
        <Link to="/register" className="text-blue-600 hover:text-blue-800">
          Register
        </Link>
        {/* Add more links later */}
      </nav>

      {/* Define Routes */}
      <main className="p-4">
        {" "}
        {/* Use main tag for content area */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* Use the imported RegisterPage component */}
          <Route path="/register" element={<RegisterPage />} />
          {/* Add other routes later (e.g., profile, feed, post details) */}
          {/* Example for a non-existent page */}
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
    </BrowserRouter>
  );
}

export default App;
