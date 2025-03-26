import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import Home from "./mainpage";
import Landing from "./landing";
import Interview from "./interview";
import Login from "./login";
import Register from "./Register";
import History from "./History"; // ✅ Updated: Import History instead of Profile

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("https://fypbackend-b5gchph9byc4b8gt.canadacentral-01.azurewebsites.net/check-auth", {
          method: "GET",
          credentials: "include",
        });

        setIsAuthenticated(response.ok);
        setHasCheckedAuth(true);

        if (response.ok && window.sessionStorage.getItem("justLoggedIn") === "true") {
          window.sessionStorage.removeItem("justLoggedIn");
          navigate("/questions", { replace: true });
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
        setHasCheckedAuth(true);
      }
    };

    checkAuth();
    window.addEventListener("authChange", checkAuth);
    return () => window.removeEventListener("authChange", checkAuth);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const response = await fetch("https://fypbackend-b5gchph9byc4b8gt.canadacentral-01.azurewebsites.net/logout", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        // Explicitly update the authentication state
        setIsAuthenticated(false);
        // Optionally, dispatch an authChange event if other parts of your app rely on it
        window.dispatchEvent(new Event("authChange"));
        navigate("/login", { replace: true });
      } else {
        console.error("Logout failed:", response.statusText);
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!hasCheckedAuth) {
    return <div className="text-center p-10">Loading...</div>;
  }

  return (
    <>
      {/* Navigation Bar */}
      <nav className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <Link to="/" className="text-2xl font-semibold tracking-wide hover:text-blue-400 transition">
            AI Interview Helper
          </Link>

          <div className="flex-1 flex justify-end space-x-12">
            <Link to="/" className="hover:text-blue-400 transition">Home</Link>
            <Link to="/questions" className="hover:text-blue-400 transition">Questions</Link>
            {isAuthenticated ? (
              <>
                <Link to="/history" className="hover:text-blue-400 transition">History</Link>
                <button onClick={handleLogout} className="hover:text-red-400 transition">Logout</button>
              </>
            ) : (
              <Link to="/login" className="hover:text-blue-400 transition">Login</Link>
            )}
          </div>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/questions" /> : <Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/questions" element={isAuthenticated ? <Landing /> : <Navigate to="/login" />} />
        <Route path="/interview/:questionId" element={isAuthenticated ? <Interview /> : <Navigate to="/login" />} />
        <Route path="/history" element={isAuthenticated ? <History /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

export default App;
