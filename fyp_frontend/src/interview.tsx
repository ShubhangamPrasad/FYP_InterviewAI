import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom'; 
import Editor from '@monaco-editor/react';
import { Send, MessageSquare, HelpCircle, Code2 } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:5001'; 

// Updated playTTS to handle streaming audio from the backend
const playTTS = async (audioStream: ReadableStream) => {
  const audioContext = new AudioContext();
  const source = audioContext.createBufferSource();
  const reader = audioStream.getReader();
  const chunks: Uint8Array[] = [];

  // Stream and accumulate audio chunks
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const audioData = new Blob(chunks, { type: "audio/mpeg" });
  const arrayBuffer = await audioData.arrayBuffer();

  try {
    // Decode the audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  } catch (error) {
    console.error("Error during audio decoding and playback:", error);
  }
};


const App: React.FC = () => {
  const { questionId } = useParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [code, setCode] = useState<string>(
    `// Write your code here\nfunction example() {\n  // Start coding\n}`
  );
  const [conversation, setConversation] = useState<{ role: string; message: string }[]>([
    { role: 'ai', message: 'How would you begin approaching this problem?' }
  ]);

  const [question, setQuestion] = useState<string>("Loading question...");
  const [example, setExample] = useState<string>("");
  const [constraint, setConstraint] = useState<string>("");
  const [inputMessage, setInputMessage] = useState<string>('');

  // ---- Timer states ----
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ---- Feedback popup ----
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  // For storing the final evaluation result from the server
  const [finalEvaluation, setFinalEvaluation] = useState<any>(null);

  const [isRedirecting, setIsRedirecting] = useState(false);

  // 1. Fetch question and init session
  useEffect(() => {
    if (!questionId) return;

    const startInterview = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question_id: questionId })
        });

        if (!response.ok) throw new Error("Failed to start interview");
        
        const data = await response.json();
        console.log("Interview started with session:", data);
        sessionStorage.setItem("session_id", data.session_id); // ✅ Store session_id
        setSessionId(data.session_id);
        sessionStorage.setItem("session_id", data.session_id);

        setQuestion(data.question);
        setExample(data.example);
        setConstraint(data.constraint);
      } catch (error) {
        console.error("Error starting interview:", error);
        setQuestion("Failed to load question.");
      }
    };

    startInterview();
  }, [questionId]);

  // 2. Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 3. Start the timer
  const handleStartTimer = () => {
    if (timerActive) return; // Don’t start again if it’s already running

    // Set to 600 seconds => 10 minutes (using 10 seconds for quick testing)
    setTimeLeft(100);
    setTimerActive(true);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time is up; stop timer
          if (timerRef.current) clearInterval(timerRef.current);
          setTimerActive(false);

          // Show feedback popup without calling final evaluation automatically
          setShowFeedback(true); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 3a. Utility to format mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 4. Renamed final evaluation function to avoid collision
  const performFinalEvaluation = async () => {
    if (!sessionId || !questionId) return;
  
    try {
      // Get user email (from /me) to pass to backend
      const userRes = await fetch(`${API_BASE_URL}/me`, { credentials: "include" });
      const userData = await userRes.json();
      if (!userData.email) throw new Error("User email not found");
      const email = userData.email;
  
      // Store for profile page
      sessionStorage.setItem("question_id", questionId.toString());
  
      const response = await fetch(`${API_BASE_URL}/final_evaluation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          student_id: email,  // ✅ use actual email
          question_id: questionId
        }),
      });
  
      if (!response.ok) throw new Error(`Failed final eval: ${response.status}`);
  
      const data = await response.json();
      console.log("✅ Final evaluation result:", data.final_evaluation);
  
      // Store final feedback in sessionStorage for Profile.tsx to read
      sessionStorage.setItem("final_feedback", JSON.stringify(data.final_evaluation));
  
      setFinalEvaluation(data.final_evaluation);  // (optional local use)
      return true;
    } catch (err) {
      console.error("❌ Error calling final evaluation:", err);
      return false;
    }
  };
  
  const handleFeedbackClick = async () => {
    const success = await performFinalEvaluation();
    if (success) {
      window.location.assign("/profile");
    }
  };
  


  // 5. Sending messages to your AI
// Updated handleSendMessage function: Maintain existing behavior + add TTS streaming
const handleSendMessage = async (e: React.FormEvent | React.KeyboardEvent) => {
  e.preventDefault();
  if (!sessionId || inputMessage.trim() === '') {
    console.error("Missing session_id or empty inputMessage.");
    return;
  }

  const userMsg = inputMessage;
  setInputMessage('');

  // Show user message immediately in the chat
  setConversation(prev => [...prev, { role: 'user', message: userMsg }]);

  // Add placeholder AI response (text only) to be filled progressively
  setConversation(prev => [...prev, { role: 'ai', message: '' }]);

  try {
    const response = await fetch(`${API_BASE_URL}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        user_input: userMsg,
        new_code_written: code
      })
    });

    if (!response.body) {
      console.error("No response stream");
      throw new Error("Stream failed");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let aiMsg = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      aiMsg += decoder.decode(value, { stream: true });

      // Update AI response text in the chat
      setConversation(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'ai', message: aiMsg };
        return updated;
      });

      // Play TTS audio after each chunk of text is processed using /openai_tts
      try {
        const ttsResponse = await fetch(`${API_BASE_URL}/openai_tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: aiMsg })
        });

        if (!ttsResponse.body) {
          console.error("No audio stream from OpenAI.");
        } else {
          // Stream the audio from OpenAI as it arrives
          const audioStream = ttsResponse.body;
          playTTS(audioStream);  // Play the audio stream in real-time
        }
      } catch (error) {
        console.error("Error during TTS streaming:", error);
      }
    }

  } catch (error) {
    console.error('❌ Streaming error:', error);
    setConversation(prev => [...prev, { role: 'ai', message: 'Error connecting to server.' }]);
  }
};


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mt-2 p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-[1800px] mx-auto">
        {/* Left Column - Question & Chatbot */}
        <div className="flex flex-col gap-4">
          {/* Question Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4 text-gray-700">
              <HelpCircle size={20} />
              <h2 className="font-semibold">Selected Question</h2>
            </div>
            <p className="text-gray-700"><strong>Question:</strong> {question}</p>
            <p className="text-gray-700 mt-2"><strong>Example:</strong> {example}</p>
            <p className="text-gray-700 mt-2"><strong>Constraint:</strong> {constraint}</p>
          </div>

          {/* Chatbot Panel */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col h-[450px]">
            <div className="flex items-center gap-2 mb-4 text-gray-700">
              <MessageSquare size={20} />
              <h2 className="font-semibold">AI Chatbot</h2>
            </div>
            <div className="flex-grow overflow-y-auto p-4 border rounded-lg h-full bg-gray-100">
              {conversation.map((msg, index) => (
                <div key={index} className={`mb-3 ${msg.role === 'ai' ? 'text-left' : 'text-right'}`}>
                  <p
                    className={`inline-block px-4 py-2 rounded-lg ${
                      msg.role === 'ai' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(e)}
                className="flex-grow px-3 py-2 border rounded-lg focus:outline-none resize-none"
                rows={2}
                placeholder="Type your message... (Press Shift+Enter for a new line)"
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Code Editor + Timer */}
        <div className="bg-white rounded-lg shadow-md flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            {/* Title */}
            <div className="flex items-center gap-2 text-gray-700">
              <Code2 size={20} />
              <h2 className="font-semibold">Code Editor</h2>
            </div>

            {/* Timer Button */}
            <button
              onClick={handleStartTimer}
              disabled={timerActive}
              className="flex items-center gap-2 px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700"
            >
              {timerActive ? `Time Left: ${formatTime(timeLeft)}` : 'Start Interview'}
            </button>
          </div>

          {/* Editor */}
          <Editor
            height="80vh"
            defaultLanguage="python"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true }}
          />
        </div>
      </div>

      {/* -- Feedback Popup (Modal) -- */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">End of Interview</h2>
            <p className="text-gray-700 text-center mb-6">
              Thank you for completing the interview! You can now view your feedback.
            </p>
            <button
              onClick={async () => {
                setIsRedirecting(true);
                await handleFeedbackClick();
              }}
              disabled={isRedirecting}
              className={`flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg 
                ${isRedirecting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'} 
                transition duration-150 ease-in-out mx-auto`}
            >
              {isRedirecting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  Redirecting...
                </>
              ) : (
                "Move to Feedback"
              )}
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default App;
