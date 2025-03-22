import React, { useState, useEffect } from "react";

const API_BASE_URL = "http://127.0.0.1:5001"; // Adjust if hosted elsewhere

const Profile: React.FC = () => {
  const [feedback, setFeedback] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [questionTitle, setQuestionTitle] = useState<string>("Interview Feedback");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("final_feedback");
      const qid = sessionStorage.getItem("question_id");
  
      if (!stored || !qid) {
        throw new Error("Missing stored feedback or question");
      }
  
      const parsed = JSON.parse(stored);
      setFeedback(parsed);
      setQuestionTitle(`Feedback for Question ${qid}`);
    } catch (err) {
      console.error("❌ Could not load feedback:", err);
      setError("Please finish an interview to view your feedback.");
    } finally {
      setLoading(false);
    }
  }, []);
  

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="max-w-3xl w-full">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-6">{questionTitle}</h1>

        {loading ? (
          <p className="text-center text-gray-600">Loading feedback...</p>
        ) : error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : !feedback ? (
          <p className="text-center text-gray-600">No feedback available yet.</p>
        ) : (
          <div className="bg-white shadow-xl rounded-lg p-8">
            {/* Final Evaluation Card */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Final Evaluation</h2>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Communication:</strong> <span className="text-gray-900">{feedback.final_evaluation.communication || "N/A"}</span></li>
                <li><strong>Problem Solving:</strong> <span className="text-gray-900">{feedback.final_evaluation.problem_solving || "N/A"}</span></li>
                <li><strong>Technical Competency:</strong> <span className="text-gray-900">{feedback.final_evaluation.technical_competency || "N/A"}</span></li>
                <li><strong>Examples of What Went Well:</strong> <span className="text-gray-900">{feedback.final_evaluation.examples_of_what_went_well || "N/A"}</span></li>
              </ul>
            </div>

            {/* Detailed Feedback Card */}
            {feedback?.detailed_feedback && (
              <div className="mt-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Detailed Feedback</h2>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Communication:</strong> <span className="text-gray-900">{feedback?.detailed_feedback?.communication || "N/A"}</span></li>
                  <li><strong>Problem Solving:</strong> <span className="text-gray-900">{feedback?.detailed_feedback?.problem_solving || "N/A"}</span></li>
                  <li><strong>Technical Competency:</strong> <span className="text-gray-900">{feedback?.detailed_feedback?.technical_competency || "N/A"}</span></li>
                  <li><strong>Examples of What Went Well:</strong> <span className="text-gray-900">{feedback?.detailed_feedback?.examples_of_what_went_well || "N/A"}</span></li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
