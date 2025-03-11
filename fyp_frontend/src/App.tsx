import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  Volume2,
  Code2,
  MessageSquare,
  HelpCircle,
  User,
  BookOpen,
  HelpCircleIcon,
  LogIn,
  Play
} from 'lucide-react';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [code, setCode] = useState(`// Write your code here
function example() {
  // Start coding
}`);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [conversation, setConversation] = useState([
    { role: 'ai', message: 'Hello! How can I help you with your coding challenge today?' },
    { role: 'student', message: 'I need help understanding arrays in JavaScript.' }
  ]);

  const runCode = () => {
    setIsRunning(true);
    setOutput('');
  
    // Create a safe environment for code execution
    const consoleLog = [];
    const safeConsole = {
      log: (...args) => consoleLog.push(args.map(arg => String(arg)).join(' ')),
      error: (...args) => consoleLog.push('Error: ' + args.map(arg => String(arg)).join(' ')),
      warn: (...args) => consoleLog.push('Warning: ' + args.map(arg => String(arg)).join(' '))
    };
  
    try {
      // Create a safe function from the code
      const safeFunction = new Function('console', code);
  
      // Execute the code with the safe console
      safeFunction(safeConsole);
  
      // Update output
      setOutput(consoleLog.join('\n'));
    } catch (error) {
      setOutput('Error: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">AI Interview Helper</h1>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-6">
                <a href="/profile" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <User size={18} />
                  <span>Profile</span>
                </a>
                <a href="/question-bank" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <BookOpen size={18} />
                  <span>Question Bank</span>
                </a>
                <a href="/faq" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <HelpCircleIcon size={18} />
                  <span>FAQ</span>
                </a>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <LogIn size={18} />
                <span>Login</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Recording Status Bar */}
      <div className="fixed top-16 left-0 right-0 bg-white shadow-sm p-2 flex justify-center items-center gap-4 z-50">
        <button 
          onClick={() => setIsRecording(!isRecording)}
          className={`flex items-center gap-2 px-3 py-1 rounded-full ${
            isRecording ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isRecording ? <Camera size={18} /> : <CameraOff size={18} />}
          <span className="text-sm font-medium">
            {isRecording ? 'Recording' : 'Start Recording'}
          </span>
        </button>
      </div>

      <div className="mt-12 p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-[1800px] mx-auto">
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          {/* Question Window */}
          <div className="bg-white rounded-lg shadow-md p-6 h-[300px]">
            <div className="flex items-center gap-2 mb-4 text-gray-700">
              <HelpCircle size={20} />
              <h2 className="font-semibold">Initial Question</h2>
            </div>
            <div className="prose max-w-none">
              <h3>JavaScript Arrays Challenge</h3>
              <p>Create a function that takes an array of numbers and returns the sum of all positive numbers in the array. For example:</p>
              <pre className="bg-gray-50 p-2 rounded">
                Input: [1, -4, 7, 12, -6]
                Output: 20 (1 + 7 + 12)
              </pre>
            </div>
          </div>

          {/* Conversation Window */}
          <div className="bg-white rounded-lg shadow-md p-6 flex-grow">
            <div className="flex items-center gap-2 mb-4 text-gray-700">
              <MessageSquare size={20} />
              <h2 className="font-semibold">Transcript of Student & AI Conversation</h2>
            </div>
            <div className="h-[calc(100vh-500px)] overflow-y-auto">
              {conversation.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    msg.role === 'ai' ? 'pl-4 border-l-4 border-blue-400' : 'pl-4 border-l-4 border-green-400'
                  }`}
                >
                  <p className="text-sm font-medium mb-1">
                    {msg.role === 'ai' ? 'AI Assistant' : 'Student'}
                  </p>
                  <p className="text-gray-700">{msg.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* IDE Window */}
        <div className="bg-white rounded-lg shadow-md flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2 text-gray-700">
              <Code2 size={20} />
              <h2 className="font-semibold">IDE for Student to Work on</h2>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={runCode}
                disabled={isRunning}
                className={`flex items-center gap-2 px-3 py-1 rounded-md ${
                  isRunning
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <Play size={16} />
                <span>{isRunning ? 'Running...' : 'Run Code'}</span>
              </button>
              <button
                onClick={() => setIsListening(!isListening)}
                className={`p-2 rounded-full ${
                  isListening ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
              >
                {isListening ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button
                className="p-2 rounded-full bg-gray-100 text-gray-600"
                aria-label="Voice output"
              >
                <Volume2 size={20} />
              </button>
            </div>
          </div>
          <div className="flex-grow flex flex-col">
            <div className="flex-grow">
              <Editor
                height="60vh"
                defaultLanguage="python"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true
                }}
              />
            </div>
            {/* Output Console */}
            <div className="border-t bg-gray-900 text-white p-4 h-[200px] overflow-auto font-mono">
              <div className="flex items-center gap-2 mb-2 text-gray-400">
                <span>Console Output</span>
              </div>
              <pre className="whitespace-pre-wrap">{output || 'Run your code to see the output here...'}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;