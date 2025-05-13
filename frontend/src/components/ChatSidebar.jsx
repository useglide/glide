'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { sendChatMessage } from '../services/chatService';

const ChatSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when chat history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMessage]);

    // Clear input and show loading state
    setMessage('');
    setIsLoading(true);
    setError('');

    try {
      // Send message to API
      const response = await sendChatMessage(message);

      if (response.success) {
        // Add AI response to chat
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: response.response
        }]);
      } else {
        // Add error message as assistant response
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${response.error || 'Failed to get a response. Please try again later.'}`
        }]);
        setError(response.error || 'Failed to get a response');
      }
    } catch (err) {
      console.error('Chat error:', err);
      // Add error message as assistant response
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err.message || 'Failed to send message. Please check your connection and try again.'}`
      }]);
      setError(err.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Toggle chat"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {/* Chat sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-80 transform bg-white shadow-xl transition-transform duration-300 ease-in-out dark:bg-gray-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Canvas Assistant</h2>
          <button
            onClick={toggleSidebar}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat messages */}
        <div
          ref={chatContainerRef}
          className="flex h-[calc(100%-8rem)] flex-col overflow-y-auto p-4"
        >
          {chatHistory.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
              <MessageSquare className="mb-2 h-8 w-8" />
              <p>Ask me anything about your Canvas courses!</p>
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 max-w-[90%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'ml-auto bg-blue-600 text-white'
                    : 'mr-auto bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                }`}
              >
                {msg.content}
              </div>
            ))
          )}

          {isLoading && (
            <div className="mr-auto mb-4 flex max-w-[90%] items-center rounded-lg bg-gray-100 p-3 text-gray-900 dark:bg-gray-700 dark:text-white">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Thinking...
            </div>
          )}

          {error && (
            <div className="mr-auto mb-4 max-w-[90%] rounded-lg bg-red-100 p-3 text-red-800 dark:bg-red-900 dark:text-red-200">
              Error: {error}
            </div>
          )}
        </div>

        {/* Input form */}
        <form
          onSubmit={handleSubmit}
          className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="ml-2 rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Overlay when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default ChatSidebar;
