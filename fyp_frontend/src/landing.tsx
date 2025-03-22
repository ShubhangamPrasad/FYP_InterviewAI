import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:5001"; // Adjust if hosted elsewhere

const difficultyStyles: Record<string, string> = {
  Easy: "text-green-600",
  Medium: "text-orange-500",
  Hard: "text-red-500",
};

const Landing: React.FC = () => {
  const [questions, setQuestions] = useState<
  { id: number; title: string; summary: string; leetcode_link: string; difficulty: string }[]
  >([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/questions`);
        if (!response.ok) throw new Error("Failed to fetch questions");

        const data = await response.json();
        setQuestions(data);
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };

    fetchQuestions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center p-8">
      {/* Title */}
      <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-800">
        AI Coding Interview Questions
      </h1>

      {/* Table Container */}
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden border border-gray-300">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-200 text-gray-700 uppercase text-xs tracking-wider">
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Summary</th>
              <th className="p-4 font-semibold text-center">LeetCode Question</th>
              <th className="p-4 font-semibold text-center">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {questions.length > 0 ? (
              questions.map((q, index) => (
                <tr
                  key={q.id}
                  className={`border-b border-gray-300 hover:bg-gray-100 transition cursor-pointer ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                  onClick={() => navigate(`/interview/${q.id}`)}
                >
                  {/* Column 1: Title */}
                  <td className="p-4 text-gray-900 font-medium">{q.title || "Untitled"}</td>

                  {/* Column 2: Summary */}
                  <td className="p-4 text-gray-700">{q.summary}</td>

                  {/* Column 3: LeetCode Link */}
                  <td className="p-4 text-blue-600 text-center hover:underline">
                    {q.leetcode_link ? (
                      <a
                        href={q.leetcode_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()} // Prevents row click event
                      >
                        LeetCode Link
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>

                  {/* Column 4: Difficulty (Now Dynamic) */}
                  <td className={`p-4 font-bold text-center ${difficultyStyles[q.difficulty || "Easy"]}`}>
                    {q.difficulty || "Easy"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">
                  Loading questions...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Landing;
