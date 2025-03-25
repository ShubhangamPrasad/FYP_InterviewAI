import React from "react";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-6">Welcome to AI Interview Helper</h1>
      <p className="text-lg max-w-2xl text-center text-gray-300">
        This platform helps you practice coding interviews with AI-generated feedback. 
        Navigate to the "Questions" page to start solving coding problems and get real-time guidance!
      </p>
    </div>
  );
};

export default Home;
