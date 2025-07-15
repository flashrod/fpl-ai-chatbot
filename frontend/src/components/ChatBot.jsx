import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import { AlertCircle, RefreshCw } from 'lucide-react';
import './ChatBot.css';

// ... (ERROR_TYPES and ERROR_MESSAGES remain the same) ...

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      text: "Hi! I'm your FPL Assistant. Ask me about players, strategies, or use the team search to get personalized advice about your FPL team.",
      sender: 'bot'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryMessage, setRetryMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const lastMessageRef = useRef(null);
  const navigate = useNavigate();
  const { teamId, teamData } = useTeam();

  // ... (useEffect hooks and other functions remain the same) ...
  
  const formatMessage = (message) => {
    let formattedText = message.replace(/•\s(.*?)(?=\n•|\n\n|$)/g, '<li>$1</li>');
    formattedText = formattedText.replace(/<li>(.*?)<\/li>/g, '<ul class="chat-bullet-list">$&</ul>');
    formattedText = formattedText.replace(/<\/ul>\s*<ul class="chat-bullet-list">/g, '');
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedText = formattedText.replace(/\n/g, '<br>');
    return formattedText;
  };
  
  // ... (isTeamIdQuery, extractTeamId, getErrorMessage functions remain the same) ...
  
  const handleRetry = async () => {
    if (!retryMessage) return;
    
    setError(null);
    setLoading(true);
    
    try {
      // ▼▼▼ CHANGE THIS URL ▼▼▼
      const response = await axios.post('http://127.0.0.1:8000/api/chat', { 
        message: retryMessage,
        team_id: teamId
      });
      
      if (response.data && response.data.response) {
        const botMessage = {
          text: response.data.response,
          sender: 'bot'
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      const errorInfo = getErrorMessage(error);
      setError(errorInfo);
    } finally {
      setLoading(false);
      setRetryMessage(null);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    
    const userInput = input.trim();
    setInput('');
    setLoading(true);
    setError(null);
    setRetryMessage(userInput);

    if (isTeamIdQuery(userInput)) {
        // ... (this part is fine)
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      // ▼▼▼ AND CHANGE THIS URL ▼▼▼
      const response = await axios.post('http://127.0.0.1:8000/api/chat', { 
        message: userInput,
        team_id: teamId
      }, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.data && response.data.response) {
        const botMessage = {
          text: response.data.response,
          sender: 'bot'
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      const errorInfo = getErrorMessage(error);
      setError(errorInfo);
      
      const errorMessage = {
        text: errorInfo.message,
        sender: 'bot',
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // ... (handleTeamSelect and the return() JSX remain the same) ...

  return (
    <div className="chatbot-container">
      {/* All your JSX code here is fine */}
    </div>
  );
};

export default ChatBot;