import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, MessageSquare, HelpCircle, Code2 } from 'lucide-react';

const API_BASE_URL = 'https://fypbackend-b5gchph9byc4b8gt.canadacentral-01.azurewebsites.net'; // Change if backend is hosted elsewhere

const App: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [code, setCode] = useState<string>(
    `// Write your code here\nfunction example() {\n  // Start coding\n}`
  );
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [conversation, setConversation] = useState<{ role: string; message: string }[]>([
    { role: 'ai', message: 'Hello! How can I help you with your coding challenge today?' }
  ]);

  const [question, setQuestion] = useState<string>("Loading question...");
  
  const [inputMessage, setInputMessage] = useState<string>('');

  // Start interview session when the component mounts
  useEffect(() => {
    const startInterview = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
  
        if (!response.ok) throw new Error("Failed to start interview");
  
        const data = await response.json();
        console.log("Received data from backend:", data);
  
        setSessionId(data.session_id);
        setQuestion(data.question || "No question received");
      } catch (error) {
        console.error("Error starting interview:", error);
        setQuestion("Failed to load question.");
      }
    };
  
    startInterview();
  }, []);
  

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || inputMessage.trim() === '') return;

    // Add user's message to chat instantly
    setConversation(prev => [...prev, { role: 'student', message: inputMessage }]);

    // Clear input field
    setInputMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_input: inputMessage,
          new_code_written: code
        })
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      setConversation(prev => [...prev, { role: 'ai', message: data.bot_response || 'No response from AI' }]);
    } catch (error) {
      console.error('Error:', error);
      setConversation(prev => [...prev, { role: 'ai', message: 'Error connecting to server.' }]);
    }
  };

  const runCode = () => {
    setIsRunning(true);
    setOutput('');

    const consoleLog: string[] = [];
    const safeConsole = {
      log: (...args: any[]) => consoleLog.push(args.map(arg => String(arg)).join(' ')),
      error: (...args: any[]) => consoleLog.push('Error: ' + args.map(arg => String(arg)).join(' ')),
      warn: (...args: any[]) => consoleLog.push('Warning: ' + args.map(arg => String(arg)).join(' '))
    };

    try {
      const safeFunction = new Function('console', code);
      safeFunction(safeConsole);
      setOutput(consoleLog.join('\n'));
    } catch (error) {
      setOutput('Error: ' + (error as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">AI Interview Helper</h1>
        </div>
      </nav>

      <div className="mt-12 p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-[1800px] mx-auto">
        {/* Left Column - Question & Chatbot */}
        <div className="flex flex-col gap-4">
          {/* Question Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4 text-gray-700">
              <HelpCircle size={20} />
              <h2 className="font-semibold">Initial Question</h2>
            </div>
            <p className="text-gray-700">
              {question}
            </p>
          </div>

          {/* Chatbot Panel */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col h-[550px]">
            <div className="flex items-center gap-2 mb-4 text-gray-700">
              <MessageSquare size={20} />
              <h2 className="font-semibold">AI Chatbot</h2>
            </div>
            <div className="flex-grow overflow-y-auto p-4 border rounded-lg h-full bg-gray-100">
              {conversation.map((msg, index) => (
                <div key={index} className={`mb-3 ${msg.role === 'ai' ? 'text-left' : 'text-right'}`}>
                  <p className={`inline-block px-4 py-2 rounded-lg ${msg.role === 'ai' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-grow px-3 py-2 border rounded-lg focus:outline-none"
                placeholder="Type your message..."
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Code Editor */}
        <div className="bg-white rounded-lg shadow-md flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2 text-gray-700">
              <Code2 size={20} />
              <h2 className="font-semibold">Code Editor</h2>
            </div>
            <button onClick={runCode} disabled={isRunning} className={`flex items-center gap-2 px-3 py-1 rounded-md ${isRunning ? 'bg-gray-100 text-gray-400' : 'bg-green-600 text-white hover:bg-green-700'}`}>
              <Play size={16} />
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>
          </div>
          <Editor 
            height="60vh" 
            defaultLanguage="python" 
            theme="vs-dark" 
            value={code} 
            onChange={(value) => setCode(value || '')} 
            options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true }} 
          />
          <div className="border-t bg-gray-900 text-white p-4 h-[150px] overflow-auto font-mono">
            <span className="text-gray-400">Console Output</span>
            <pre>{output || 'Run your code to see the output here...'}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
