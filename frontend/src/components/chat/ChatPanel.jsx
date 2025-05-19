'use client';

import { useEffect, useRef, useState } from 'react';
import { XIcon, TrashIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { sendChatMessage, clearChatHistory, getChatHistory } from '@/services/chatService';

/**
 * A panel that displays a chat interface
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the panel is open
 * @param {Function} props.onClose - Function to call when the panel is closed
 * @param {string} props.className - Additional CSS classes
 */
export function ChatPanel({ isOpen, onClose, className }) {
  const [messages, setMessages] = useState([
    { content: 'Hi there! I\'m Genoa, your AI Assistant powered by Google\'s Gemini Pro. How can I help you today?', isUser: false }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation ID from localStorage and fetch chat history
  useEffect(() => {
    const savedConversationId = localStorage.getItem('chatConversationId');
    if (savedConversationId) {
      setConversationId(savedConversationId);

      // Fetch chat history for this conversation
      const loadChatHistory = async () => {
        setIsLoading(true);
        try {
          const history = await getChatHistory(savedConversationId);

          if (history && history.messages && history.messages.length > 0) {
            // Convert the messages to the format expected by the component
            const formattedMessages = [
              // Keep the welcome message
              { content: 'Hi there! I\'m Genoa, your AI Assistant powered by Google\'s Gemini Pro. How can I help you today?', isUser: false },
              // Add the history messages
              ...history.messages.map(msg => ({
                content: msg.content,
                isUser: msg.role === 'user'
              }))
            ];

            setMessages(formattedMessages);
          }
        } catch (error) {
          console.error('Failed to load chat history:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadChatHistory();
    }
  }, []);

  const handleSendMessage = async (content) => {
    // Add user message to the chat
    setMessages((prev) => [...prev, { content, isUser: true }]);
    setIsLoading(true);

    try {
      // Send message to API
      const response = await sendChatMessage(content, conversationId);

      // Add bot response to the chat
      setMessages((prev) => [...prev, { content: response.response, isUser: false }]);

      // Save conversation ID if it's new
      if (!conversationId && response.conversation_id && response.conversation_id !== "error") {
        setConversationId(response.conversation_id);
        localStorage.setItem('chatConversationId', response.conversation_id);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [
        ...prev,
        { content: 'Sorry, I encountered an error. Please try again.', isUser: false }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    setIsLoading(true);

    try {
      if (conversationId) {
        const result = await clearChatHistory(conversationId);

        if (result && result.success) {
          console.log('Chat history cleared successfully');
        } else {
          console.warn('Failed to clear chat history on the server');
        }
      }
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    } finally {
      // Reset messages and keep the welcome message regardless of API success/failure
      setMessages([
        { content: 'Hi there! I\'m Genoa, your AI Assistant powered by Google\'s Gemini Pro. How can I help you today?', isUser: false }
      ]);
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'fixed inset-y-0 right-0 z-[90] flex w-full flex-col border-l bg-[var(--background)] shadow-xl transition-transform duration-300 ease-in-out sm:max-w-md',
        isOpen ? 'translate-x-0' : 'translate-x-full',
        className
      )}
      style={{ visibility: isOpen ? 'visible' : 'hidden' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold">Genoa AI Assistant</h2>
          <p className="text-xs text-muted-foreground">Powered by Gemini Pro</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            aria-label="Clear chat"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            aria-label="Close chat"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            content={message.content}
            isUser={message.isUser}
          />
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 py-2">
            <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0.2s' }}></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
