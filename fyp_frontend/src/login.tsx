import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "https://fypbackend-b5gchph9byc4b8gt.canadacentral-01.azurewebsites.net"; // Adjust if needed

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false); // ✅ Track login state
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
  
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Login failed");
      }
  
      window.sessionStorage.setItem("justLoggedIn", "true"); // ✅ Set flag for redirect
      window.dispatchEvent(new Event("authChange"));
    } catch (err) {
      setError(err.message);
    }
  };
  
  
  

  // ✅ Redirect the user to /questions after login
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/questions");
    }
  }, [isLoggedIn, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-96">
        <h2 className="text-xl font-bold mb-4">Login</h2>
        {error && <p className="text-red-400">{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 mb-2 rounded bg-gray-700 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 mb-2 rounded bg-gray-700 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="w-full bg-blue-500 p-2 rounded">
            Login
          </button>
        </form>

        <p className="text-sm mt-3 text-center">
          Don't have an account?{" "}
          <span 
            className="text-blue-400 cursor-pointer hover:underline"
            onClick={() => navigate("/register")}
          >
            Sign up here
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
