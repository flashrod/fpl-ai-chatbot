import React from 'react';
import ChatBot from '../components/ChatBot';
import DashboardCountdownWidget from '../components/DashboardCountdownWidget.jsx';
import './Pages.css';

/**
 * Chat Page Component
 * This page contains the ChatBot interface for users to interact with the AI assistant
 */
const ChatPage = () => {
  // Function to handle refreshing data when deadline passes
  const handleDeadlinePassed = () => {
    console.log("Chat deadline passed - refreshing chat data");
  };

  return (
    <div className="page-container">
      <DashboardCountdownWidget onDeadlinePassed={handleDeadlinePassed} />
      <ChatBot />
    </div>
  );
};

export default ChatPage; 