import React from 'react';
import ChatBot from '../components/ChatBot';
import './Pages.css';

/**
 * Chat Page Component
 * This page contains the ChatBot interface for users to interact with the AI assistant
 */
const ChatPage = () => {
  return (
    <div className="page-container">
      <ChatBot />
    </div>
  );
};

export default ChatPage; 